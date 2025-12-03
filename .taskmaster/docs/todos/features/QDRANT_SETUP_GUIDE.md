# Qdrant Cloud Setup Guide

## Step 1: Create Qdrant Cloud Account

1. Go to https://cloud.qdrant.io/
2. Sign up for a free account (1GB free tier)
3. Verify your email

## Step 2: Create a Cluster

1. Click "Create Cluster"
2. Choose **Free Tier** (1GB storage)
3. Select region: **Asia Pacific (Singapore)** or closest to you
4. Cluster name: `haisanngaymoi-content-memory`
5. Click "Create"
6. Wait 2-3 minutes for cluster to be ready

## Step 3: Get API Credentials

1. Go to your cluster dashboard
2. Click on "API Keys" tab
3. Click "Generate API Key"
4. Copy the API Key (you won't see it again!)
5. Copy the Cluster URL (looks like: `https://xxx-xxx.aws.cloud.qdrant.io:6333`)

## Step 4: Add to Environment Variables

Add these to your `.env.local` file:

```env
# Qdrant Vector Database
QDRANT_URL=https://your-cluster-url.aws.cloud.qdrant.io:6333
QDRANT_API_KEY=your-api-key-here

# OpenAI for Embeddings (if not already set)
OPENAI_API_KEY=your-openai-api-key
```

## Step 5: Test Connection

After adding environment variables, the application will automatically:
1. Connect to Qdrant on first content generation
2. Create `content_embeddings` collection
3. Start storing embeddings

## Collection Schema

The system will create a collection with:
- **Name**: `content_embeddings`
- **Vector size**: 1536 (OpenAI text-embedding-3-small)
- **Distance**: Cosine similarity
- **Payload schema**:
  - `postId`: string
  - `content`: string (full content)
  - `title`: string
  - `platform`: string
  - `topic`: string
  - `createdAt`: timestamp

## Monitoring

View your data in Qdrant Cloud dashboard:
1. Go to cluster dashboard
2. Click "Collections"
3. Select `content_embeddings`
4. View points and search

## Free Tier Limits

- **Storage**: 1GB
- **Vectors**: ~650,000 vectors (1536 dimensions)
- **Requests**: Unlimited
- **Retention**: Unlimited

Estimated capacity: **~10,000 posts** (based on average content length)
