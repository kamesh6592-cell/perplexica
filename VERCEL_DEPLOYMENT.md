# Vercel Deployment Guide for Perplexica

## Overview
This repository has been optimized for Vercel deployment with special handling for large dependencies.

## Deployment Steps

### 1. Environment Variables
Set these environment variables in your Vercel dashboard:

```bash
SKIP_ENV_VALIDATION=1
NODE_ENV=production

# Optional: Pre-configure API keys
GROQ_API_KEY=your_groq_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
```

### 2. Build Configuration
The project includes optimized build configurations:
- `vercel.json` - Vercel-specific configuration
- Modified `next.config.mjs` - Handles large dependencies
- `.vercelignore` - Excludes unnecessary files from deployment

### 3. Important Notes

#### Transformers Provider Limitation
Due to Vercel's 262MB serverless function limit, the local Transformers provider (using Hugging Face models) is **not available** in Vercel deployments. 

**Recommended alternatives:**
- **Use Groq API** (fast, free tier available) - for chat models
- **Use OpenAI** - for both chat and embedding models
- Use other cloud-based embedding providers
- Deploy on platforms with larger limits (like Railway, Render, or self-hosted)

#### Groq Setup (Recommended)
Groq offers fast inference and a generous free tier:
1. Get your free API key from [console.groq.com](https://console.groq.com)
2. In Perplexica settings, add Groq provider
3. Configure with your API key
4. Use models like `mixtral-8x7b-32768` or `llama3-70b-8192`

#### Database Configuration
Make sure to configure your database connection string for production use.

### 4. Deployment Commands
The build process uses optimized commands:
```bash
yarn build:vercel  # Optimized for Vercel
```

### 5. Testing API Configuration (Optional)
Before deployment, you can test your API keys locally:
```bash
# Set your API keys
export GROQ_API_KEY="your_groq_key"
export OPENAI_API_KEY="your_openai_key"

# Test configuration
yarn test:config
```

### 6. Post-Deployment Setup
After deployment:
1. Navigate to your deployed URL
2. Complete the setup wizard
3. Configure your preferred AI providers:
   - **For Chat**: Add Groq provider (fast, free tier)
   - **For Embeddings**: Add OpenAI provider
   - **Avoid**: Transformers provider (not available on Vercel)
4. Test the search functionality with your configured providers

## Troubleshooting

### Bundle Size Issues
If you encounter bundle size issues:
1. Check that `.vercelignore` is properly configured
2. Ensure `SKIP_ENV_VALIDATION=1` is set
3. Verify no large dependencies are being included

### Runtime Errors
- Check Vercel function logs for detailed error messages
- Ensure all required environment variables are set
- Verify API routes are working correctly

## Local Development vs Production
- Local: Can use all providers including Transformers
- Vercel: Transformers provider disabled, use cloud providers instead

For full feature compatibility, consider deploying on platforms with higher limits or self-hosting.