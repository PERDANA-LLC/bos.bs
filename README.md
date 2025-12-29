# 🚀 AI Bible Study App - Google Gemini File Search RAG

A comprehensive Bible study application leveraging **Google's revolutionary Gemini File Search RAG system** with the King James Version (KJV) Bible as the authoritative text source.

## ⚡ Revolutionary Technology Stack

- **Frontend**: Next.js 14 with React 18, TypeScript, Tailwind CSS
- **Backend**: Node.js with Express, TypeScript  
- **Database**: Supabase (PostgreSQL + Auth + Storage)
- **🎯 AI/RAG**: **Google Gemini File Search** (Managed RAG-as-a-Service)
- **Deployment**: Vercel (Frontend), Railway/Render (Backend)
- **UI Components**: Headless UI, Radix UI, Lucide Icons

## 🎯 Revolutionary Features

### ⚡ Google File Search RAG Integration
- **Fully Managed RAG System** - No infrastructure complexity
- **Automatic Chunking** - Semantic Bible verse breakdown
- **Free Storage & Embeddings** - Revolutionary cost model
- **Built-in Citations** - Automatic source attribution
- **150+ File Format Support** - Structured Bible data ingestion

### 📖 Core Bible Features  
- **KJV Bible text** with verse-level navigation
- **AI-powered insights** with contextual analysis
- **Cross-reference discovery** and Strong's concordance
- **Personalized study pathways** and recommendations
- **Voice search** and audio narration

### 🤖 Advanced AI Capabilities
- **Semantic Bible search** beyond keyword matching
- **Historical and cultural context** integration
- **Comparative passage analysis** across testaments
- **Word study** with Hebrew/Greek origins
- **Multi-modal study aids** (timelines, maps, concept maps)

## Project Structure

```
ai-bible-study/
├── apps/
│   ├── web/                 # Next.js frontend
│   └── api/                 # Node.js backend
├── packages/
│   ├── ui/                  # Shared UI components
│   ├── types/               # TypeScript type definitions
│   └── utils/               # Shared utilities
├── data/
│   ├── bible-kjv.json       # KJV Bible data
│   ├── strongs-concordance.json
│   └── cross-references.json
└── docs/
    ├── api/                 # API documentation
    └── deployment/          # Deployment guides
```

## 🚀 Quick Start with File Search

### Prerequisites
- Node.js 18+ 
- npm/yarn/pnpm
- **Google AI API Key** (for Gemini File Search)
- Supabase project

### ⚡ Installation

1. **Clone the repository**
```bash
git clone https://github.com/PERDANA-LLC/bos.bs.git
cd bos.bs
```

2. **Install dependencies**
```bash
pnpm install
```

3. **Set up environment variables**
```bash
cp .env.example .env.local
# Configure GOOGLE_AI_API_KEY and Supabase credentials
```

4. **Initialize Database & File Search**
```bash
# Start API server
cd apps/api && npm run dev

# Initialize Bible data and File Search store (one command!)
curl -X POST http://localhost:3001/initialize-data
```

5. **Start development servers**
```bash
pnpm dev
```

### 🎯 Instant Access to Advanced Features
- **AI Bible Chat**: http://localhost:3000/ai-chat
- **Semantic Search**: http://localhost:3000/search  
- **Bible Reader**: http://localhost:3000/bible
- **File Search Status**: http://localhost:3001/file-search-status

## Environment Variables

```env
# Google Cloud / Vertex AI
GOOGLE_PROJECT_ID=your-project-id
GOOGLE_PRIVATE_KEY_ID=your-key-id
GOOGLE_PRIVATE_KEY=your-private-key
GOOGLE_CLIENT_EMAIL=your-client-email
VERTEX_AI_LOCATION=us-central1

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Application
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000
```

## Development

```bash
# Install dependencies
pnpm install

# Start development servers
pnpm dev

# Run tests
pnpm test

# Build for production
pnpm build
```

## Deployment

- **Frontend**: Vercel (automatic deployment on push to main)
- **Backend**: Railway/Render with Docker configuration
- **Database**: Supabase managed PostgreSQL

## Theological Considerations

This application honors the sacred nature of Scripture while leveraging AI technology to enhance understanding. All AI-generated insights are based on the provided biblical text and public domain theological resources, with clear disclosure of AI limitations.

## License

MIT License - see LICENSE file for details