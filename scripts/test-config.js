#!/usr/bin/env node
/**
 * Test script to validate API configurations for Perplexica
 * Run with: node scripts/test-config.js
 */

const https = require('https');

// Test Groq API
async function testGroqAPI(apiKey) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'api.groq.com',
      path: '/openai/v1/models',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve({ success: true, message: 'Groq API key is valid' });
        } else {
          resolve({ success: false, message: `Groq API error: ${res.statusCode}` });
        }
      });
    });

    req.on('error', (err) => {
      resolve({ success: false, message: `Connection error: ${err.message}` });
    });

    req.end();
  });
}

// Test OpenAI API
async function testOpenAI(apiKey) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'api.openai.com',
      path: '/v1/models',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve({ success: true, message: 'OpenAI API key is valid' });
        } else {
          resolve({ success: false, message: `OpenAI API error: ${res.statusCode}` });
        }
      });
    });

    req.on('error', (err) => {
      resolve({ success: false, message: `Connection error: ${err.message}` });
    });

    req.end();
  });
}

async function main() {
  console.log('🔍 Testing Perplexica API Configuration...\n');

  // Load environment variables
  try {
    require('dotenv').config();
  } catch (err) {
    console.log('Note: dotenv not available, using process.env directly');
  }

  const groqKey = process.env.GROQ_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (!groqKey && !openaiKey) {
    console.log('❌ No API keys found in environment variables');
    console.log('Please set GROQ_API_KEY or OPENAI_API_KEY');
    process.exit(1);
  }

  // Test Groq API
  if (groqKey) {
    console.log('Testing Groq API...');
    const groqResult = await testGroqAPI(groqKey);
    console.log(groqResult.success ? '✅' : '❌', groqResult.message);
  }

  // Test OpenAI API
  if (openaiKey) {
    console.log('Testing OpenAI API...');
    const openaiResult = await testOpenAI(openaiKey);
    console.log(openaiResult.success ? '✅' : '❌', openaiResult.message);
  }

  console.log('\n🎉 Configuration test completed!');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testGroqAPI, testOpenAI };