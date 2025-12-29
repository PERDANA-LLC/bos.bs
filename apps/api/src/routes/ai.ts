import express from 'express'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { AIQueryRequestSchema, AIQueryResponseSchema } from '@bible-study/types'
import { AuthenticatedRequest } from '../middleware/auth'
import { ragSystem } from '../index'

const router = express.Router()

// Initialize Vertex AI
const vertexAI = new VertexAI({
  project: process.env.GOOGLE_PROJECT_ID!,
  location: process.env.VERTEX_AI_LOCATION || 'us-central1',
})

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Use the shared RAG system instance from the main app
// File Search is handled by the ragSystem

// Process AI query using Google File Search
router.post('/query', async (req: AuthenticatedRequest, res) => {
  try {
    const startTime = Date.now()
    const aiRequest = AIQueryRequestSchema.parse(req.body)
    const { query, context_verses, response_type } = aiRequest

    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    console.log(`🤖 Processing AI query: "${query}" for user ${req.user.id}`)

    // Use the shared RAG system with Google File Search
    const ragResult = await ragSystem.generateResponse({
      query,
      maxContextVerses: aiRequest.maxContextVerses || 8,
      testamentFilter: aiRequest.testamentFilter,
      contextVerses
    })

    const processingTime = Date.now() - startTime

    // Create AI response object
    const aiResponse: z.infer<typeof AIQueryResponseSchema> = {
      response: ragResult.response,
      context_verses: ragResult.contextVerses.map(verse => ({
        id: verse.id,
        reference: verse.reference,
        text: verse.text,
      })),
      related_topics: extractTopicsFromResponse(ragResult.response),
      suggested_questions: ragResult.suggestedQuestions,
      confidence_score: ragResult.confidence,
      processing_time_ms: ragResult.processingTimeMs,
    }

    // Save query to database
    await supabase
      .from('ai_queries')
      .insert({
        user_id: req.user.id,
        query,
        response: ragResult.response,
        context_verses: ragResult.contextVerses.map(v => v.id),
        response_time_ms: ragResult.processingTimeMs,
      })

    const validatedResponse = AIQueryResponseSchema.parse(aiResponse)
    res.json(validatedResponse)

  } catch (error) {
    console.error('Error processing AI query:', error)
    res.status(500).json({ error: 'Failed to process AI query' })
  }
})

// Search verses using File Search
router.post('/search', async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    const { query, testament, maxResults, bookFilter } = req.body

    console.log(`🔍 File Search request: "${query}"`)

    // Use File Search for advanced search
    const searchResults = await ragSystem.advancedSearch(query, {
      testament: testament || 'both',
      maxResults: maxResults || 20,
      bookFilter: bookFilter
    })

    res.json({
      success: true,
      results: searchResults,
      query,
      total: searchResults.length,
      powered_by: 'google-file-search'
    })

  } catch (error) {
    console.error('Error in File Search:', error)
    res.status(500).json({ error: 'Failed to perform File Search' })
  }
})

    const validatedResponse = AIQueryResponseSchema.parse(aiResponse)
    res.json(validatedResponse)

  } catch (error) {
    console.error('Error processing AI query:', error)
    res.status(500).json({ error: 'Failed to process AI query' })
  }
})

// Get AI query history for user
router.get('/history', async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    const limit = parseInt(req.query.limit as string) || 20
    const offset = parseInt(req.query.offset as string) || 0

    const { data, error } = await supabase
      .from('ai_queries')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    res.json(data || [])
  } catch (error) {
    console.error('Error fetching AI query history:', error)
    res.status(500).json({ error: 'Failed to fetch query history' })
  }
})

// Rate AI response
router.post('/rate/:queryId', async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    const queryId = req.params.queryId
    const { rating, feedback } = req.body

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Invalid rating (must be 1-5)' })
    }

    const { data, error } = await supabase
      .from('ai_queries')
      .update({ rating, feedback })
      .eq('id', queryId)
      .eq('user_id', req.user.id)
      .select()
      .single()

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    if (!data) {
      return res.status(404).json({ error: 'Query not found' })
    }

    res.json(data)
  } catch (error) {
    console.error('Error rating AI response:', error)
    res.status(500).json({ error: 'Failed to rate response' })
  }
})

// Helper functions
function extractTopicsFromResponse(response: string): string[] {
  // Extract potential topics from AI response
  const topicPatterns = [
    /faith|grace|love|hope|salvation|redemption|prayer|worship/gi,
    /creation|covenant|law|prophesy|wisdom|judgment/gi,
    /christ|jesus|holy spirit|trinity|kingdom/gi,
    /church|baptism|communion|discipleship|mission/gi
  ]

  const topics = new Set<string>()
  
  topicPatterns.forEach(pattern => {
    const matches = response.match(pattern)
    if (matches) {
      matches.forEach(match => {
        const topic = match.toLowerCase()
        if (topic.length > 3) { // Filter out very short matches
          topics.add(topic)
        }
      })
    }
  })

  return Array.from(topics).slice(0, 5)
}

function generateRelatedQuestions(query: string, response: string): string[] {
  // This is a simplified version - in production, you might use another AI call
  const baseQuestions = [
    "What is the historical context of this passage?",
    "How does this relate to other parts of Scripture?",
    "What practical application can I draw from this?",
    "What does this teach about God's character?",
    "How does this apply to modern life?",
    "What are the key theological themes here?"
  ]

  // Filter and return relevant questions based on query type
  if (query.toLowerCase().includes('meaning') || query.toLowerCase().includes('explain')) {
    return baseQuestions.filter((_, index) => index < 4)
  }

  return baseQuestions.slice(0, 3)
}

  const specificInstruction = responseTypeInstructions[responseType as keyof typeof responseTypeInstructions] || 
    responseTypeInstructions.insight

  return `${basePrompt}

Specific focus: ${specificInstruction}

Please provide a comprehensive response:`
}

function generateRelatedQuestions(query: string, response: string): string[] {
  // This is a simplified version - in production, you might use another AI call
  const baseQuestions = [
    "What is the historical context of this passage?",
    "How does this relate to other parts of Scripture?",
    "What practical application can I draw from this?",
    "What does this teach about God's character?",
  ]

  return baseQuestions.slice(0, 3)
}

export default router