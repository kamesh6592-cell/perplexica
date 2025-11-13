import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { Model, ModelList, ProviderMetadata } from '../types';
import BaseModelProvider from './baseProvider';
import { ChatGroq } from '@langchain/groq';
import { Embeddings } from '@langchain/core/embeddings';
import { UIConfigField } from '@/lib/config/types';
import { getConfiguredModelProviderById } from '@/lib/config/serverRegistry';

interface GroqConfig {
  apiKey: string;
}

const providerConfigFields: UIConfigField[] = [
  {
    type: 'password',
    name: 'API Key',
    key: 'apiKey',
    description: 'Your Groq API key',
    required: true,
    placeholder: 'Groq API Key',
    env: 'GROQ_API_KEY',
    scope: 'server',
  },
];

class GroqProvider extends BaseModelProvider<GroqConfig> {
  constructor(id: string, name: string, config: GroqConfig) {
    super(id, name, config);
  }

  async getDefaultModels(): Promise<ModelList> {
    // Fallback models in case API is not accessible
    const fallbackModels: Model[] = [
      { name: 'Mixtral 8x7B', key: 'mixtral-8x7b-32768' },
      { name: 'LLaMA3 70B', key: 'llama3-70b-8192' },
      { name: 'LLaMA3 8B', key: 'llama3-8b-8192' },
      { name: 'Gemma 7B', key: 'gemma-7b-it' },
      { name: 'LLaMA3 Groq 70B Tool Use', key: 'llama3-groq-70b-8192-tool-use-preview' },
      { name: 'LLaMA3 Groq 8B Tool Use', key: 'llama3-groq-8b-8192-tool-use-preview' },
    ];

    try {
      if (!this.config.apiKey) {
        throw new Error('Groq API key is required');
      }

      const res = await fetch('https://api.groq.com/openai/v1/models', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`,
        },
      });

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('Invalid Groq API key. Please check your API key in settings.');
        }
        throw new Error(`Groq API error: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();

      if (data.data && Array.isArray(data.data)) {
        const models: Model[] = data.data.map((m: any) => ({
          name: m.id,
          key: m.id,
        }));

        return {
          embedding: [],
          chat: models,
        };
      }

      // Fallback to default models if API response is unexpected
      return {
        embedding: [],
        chat: fallbackModels,
      };
    } catch (err) {
      console.warn('Failed to fetch Groq models from API, using fallback models:', err);
      
      // Return fallback models for better user experience
      return {
        embedding: [],
        chat: fallbackModels,
      };
    }
  }

  async getModelList(): Promise<ModelList> {
    const defaultModels = await this.getDefaultModels();
    const configProvider = getConfiguredModelProviderById(this.id)!;

    return {
      embedding: [],
      chat: [...defaultModels.chat, ...configProvider.chatModels],
    };
  }

  async loadChatModel(key: string): Promise<BaseChatModel> {
    const modelList = await this.getModelList();

    const exists = modelList.chat.find((m) => m.key === key);

    if (!exists) {
      throw new Error('Error Loading Groq Chat Model. Invalid Model Selected');
    }

    return new ChatGroq({
      apiKey: this.config.apiKey,
      temperature: 0.7,
      model: key,
    });
  }

  async loadEmbeddingModel(key: string): Promise<Embeddings> {
    throw new Error('Groq provider does not support embedding models.');
  }

  static parseAndValidate(raw: any): GroqConfig {
    if (!raw || typeof raw !== 'object')
      throw new Error('Invalid config provided. Expected object');
    if (!raw.apiKey)
      throw new Error('Invalid config provided. API key must be provided');

    return {
      apiKey: String(raw.apiKey),
    };
  }

  static getProviderConfigFields(): UIConfigField[] {
    return providerConfigFields;
  }

  static getProviderMetadata(): ProviderMetadata {
    return {
      key: 'groq',
      name: 'Groq',
    };
  }
}

export default GroqProvider;
