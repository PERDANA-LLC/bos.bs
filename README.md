# AI-Powered Bible Study App

A comprehensive Bible study application leveraging Google's RAG (Retrieval-Augmented Generation) architecture with the King James Version (KJV) Bible as the authoritative text source.

## Technology Stack

- **Frontend**: Next.js 14 with React 18, TypeScript, Tailwind CSS
- **Backend**: Node.js with Express, TypeScript
- **Database**: Supabase (PostgreSQL + Auth + Storage)
- **AI/ML**: Google Vertex AI, Gemini 1.5 Pro, Text Embedding Models
- **Deployment**: Vercel (Frontend), Railway/Render (Backend)
- **UI Components**: Headless UI, Radix UI, Lucide Icons

## Features

### Core Features
- KJV Bible text with verse-level navigation
- AI-powered insights and contextual analysis
- Cross-reference discovery and Strong's concordance
- Personalized study pathways and recommendations
- Voice search and audio narration

### Advanced Features
- RAG-powered theological queries
- Historical and cultural context integration
- Comparative passage analysis
- Word study with Hebrew/Greek origins
- Multi-modal study aids (timelines, maps, concept maps)

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

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm/yarn/pnpm
- Google Cloud Project with Vertex AI enabled
- Supabase project

### Installation

1. Clone the repository
2. Install dependencies
3. Set up environment variables
4. Run database migrations
5. Start development servers

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