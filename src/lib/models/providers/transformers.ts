import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { Model, ModelList, ProviderMetadata } from '../types';
import BaseModelProvider from './baseProvider';
import { Embeddings } from '@langchain/core/embeddings';
import { UIConfigField } from '@/lib/config/types';

// Mock embeddings class for Vercel deployment
class MockEmbeddings extends Embeddings {
  constructor() {
    super({});
  }
  
  async embedDocuments(texts: string[]): Promise<number[][]> {
    throw new Error('Local transformers are not available in cloud deployment. Please use OpenAI or other cloud-based embedding providers.');
  }
  
  async embedQuery(text: string): Promise<number[]> {
    throw new Error('Local transformers are not available in cloud deployment. Please use OpenAI or other cloud-based embedding providers.');
  }
}

// Completely disable transformers on Vercel
let HuggingFaceTransformersEmbeddings: any = null;
if (!process.env.VERCEL && !process.env.NEXT_PHASE) {
  try {
    // Only import on local development
    const transformersModule = await import('@langchain/community/embeddings/huggingface_transformers');
    HuggingFaceTransformersEmbeddings = transformersModule.HuggingFaceTransformersEmbeddings;
  } catch (error) {
    console.warn('HuggingFace Transformers not available in this environment');
  }
}
interface TransformersConfig {}

const defaultEmbeddingModels: Model[] = [
  {
    name: 'all-MiniLM-L6-v2',
    key: 'Xenova/all-MiniLM-L6-v2',
  },
  {
    name: 'mxbai-embed-large-v1',
    key: 'mixedbread-ai/mxbai-embed-large-v1',
  },
  {
    name: 'nomic-embed-text-v1',
    key: 'Xenova/nomic-embed-text-v1',
  },
];

const providerConfigFields: UIConfigField[] = [];

class TransformersProvider extends BaseModelProvider<TransformersConfig> {
  constructor(id: string, name: string, config: TransformersConfig) {
    super(id, name, config);
  }

  async getDefaultModels(): Promise<ModelList> {
    return {
      embedding: [...defaultEmbeddingModels],
      chat: [],
    };
  }

  async getModelList(): Promise<ModelList> {
    const defaultModels = await this.getDefaultModels();
    const configProvider = getConfiguredModelProviderById(this.id)!;

    return {
      embedding: [
        ...defaultModels.embedding,
        ...configProvider.embeddingModels,
      ],
      chat: [],
    };
  }

  async loadChatModel(key: string): Promise<BaseChatModel> {
    throw new Error('Transformers Provider does not support chat models.');
  }

  async loadEmbeddingModel(key: string): Promise<Embeddings> {
    // Always return mock embeddings on Vercel
    if (process.env.VERCEL || process.env.NEXT_PHASE) {
      return new MockEmbeddings();
    }

    const modelList = await this.getModelList();
    const exists = modelList.embedding.find((m) => m.key === key);

    if (!exists) {
      throw new Error(
        'Error Loading Transformers Embedding Model. Invalid Model Selected.',
      );
    }

    // Check if transformers are available in this environment
    if (!HuggingFaceTransformersEmbeddings) {
      return new MockEmbeddings();
    }

    try {
      return new HuggingFaceTransformersEmbeddings({
        model: key,
      });
    } catch (error) {
      console.warn('Failed to load transformers model, using mock:', error);
      return new MockEmbeddings();
    }
  }

  static parseAndValidate(raw: any): TransformersConfig {
    return {};
  }

  static getProviderConfigFields(): UIConfigField[] {
    return providerConfigFields;
  }

  static getProviderMetadata(): ProviderMetadata {
    return {
      key: 'transformers',
      name: 'Transformers',
    };
  }
}

export default TransformersProvider;
