import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'
import { errorHandler } from './middleware/errorHandler'
import { authMiddleware } from './middleware/auth'
import bibleRoutes from './routes/bible'
import aiRoutes from './routes/ai'
import userRoutes from './routes/user'
import BibleRAGSystem from './services/ragSystem'
import BibleDataService from './services/bibleData'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(helmet())
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
}))
app.use(morgan('combined'))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Initialize RAG system
const ragSystem = new BibleRAGSystem({
  apiKey: process.env.GOOGLE_AI_API_KEY!,
  generativeModel: 'gemini-2.5-flash',
  fileSearchStoreName: 'bible-study-store'
})

// Initialize Bible data service
const bibleDataService = new BibleDataService()

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '2.0.0-gemini-file-search',
    features: {
      'google-file-search': true,
      'supabase-db': true,
      'ai-chat': true,
      'bible-data': true
    }
  })
})

// Initialize Bible data and File Search store
app.post('/initialize-data', async (req, res) => {
  try {
    console.log('🔧 Initializing Bible data and File Search Store...')
    
    // Step 1: Initialize database with sample data
    await bibleDataService.initializeDatabase()
    
    // Step 2: Initialize File Search Store and upload Bible data
    await ragSystem.initializeBibleDataStore()
    
    // Step 3: Get File Search Store statistics
    const stats = await ragSystem.getFileSearchStoreStats()
    
    res.json({
      success: true,
      message: 'Bible data and File Search Store initialized successfully',
      stats
    })
  } catch (error) {
    console.error('Error initializing data:', error)
    res.status(500).json({ 
      error: 'Failed to initialize Bible data',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// File Search Store status endpoint
app.get('/file-search-status', async (req, res) => {
  try {
    const stats = await ragSystem.getFileSearchStoreStats()
    res.json({
      success: true,
      fileSearch: stats,
      features: {
        'google-file-search': true,
        'automatic-chunking': true,
        'semantic-search': true,
        'built-in-citations': true
      }
    })
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to get File Search status',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Routes
app.use('/api/bible', bibleRoutes)
app.use('/api/ai', authMiddleware, aiRoutes)
app.use('/api/user', authMiddleware, userRoutes)

// Error handling
app.use(errorHandler)

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

app.listen(PORT, () => {
  console.log(`🚀 AI Bible Study API server running on port ${PORT}`)
  console.log(`📖 Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`🔗 Health check: http://localhost:${PORT}/health`)
  console.log(`🔧 Initialize data: POST http://localhost:${PORT}/initialize-data`)
  console.log(`📊 File Search status: http://localhost:${PORT}/file-search-status`)
  console.log(`⚡ Powered by Google Gemini File Search RAG`)
})

export { ragSystem, bibleDataService }