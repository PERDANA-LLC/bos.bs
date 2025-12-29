import express from 'express'
import { VertexAI } from '@google-cloud/vertexai'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { AIQueryRequestSchema, AIQueryResponseSchema } from '@bible-study/types'
import { AuthenticatedRequest } from '../middleware/auth'

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

// Initialize Gemini model
const geminiModel = vertexAI.getGenerativeModel({
  model: 'gemini-1.5-pro',
  generationConfig: {
    maxOutputTokens: 2048,
    temperature: 0.3,
    topP: 0.8,
    topK: 40,
  },
})

// Process AI query
router.post('/query', async (req: AuthenticatedRequest, res) => {
  try {
    const startTime = Date.now()
    const aiRequest = AIQueryRequestSchema.parse(req.body)
    const { query, context_verses, response_type } = aiRequest

    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    // Fetch relevant verses for context
    let contextVerses: any[] = []
    if (context_verses && context_verses.length > 0) {
      const { data, error } = await supabase
        .from('bible_verses')
        .select('*')
        .in('id', context_verses)

      if (error) {
        console.error('Error fetching context verses:', error)
      } else {
        contextVerses = data || []
      }
    } else {
      // Use semantic search to find relevant verses
      const { data, error } = await supabase
        .from('bible_verses')
        .select('*')
        .textSearch('text', query)
        .limit(5)

      if (!error) {
        contextVerses = data || []
      }
    }

    // Build the prompt for Gemini
    const contextText = contextVerses
      .map(verse => `${verse.reference}: ${verse.text}`)
      .join('\n')

    const prompt = buildPrompt(query, contextText, response_type)

    // Generate response from Gemini
    const result = await geminiModel.generateContent(prompt)
    const response = result.response
    const responseText = response.text()

    const processingTime = Date.now() - startTime

    // Create AI response object
    const aiResponse: z.infer<typeof AIQueryResponseSchema> = {
      response: responseText,
      context_verses: contextVerses.map(verse => ({
        id: verse.id,
        reference: verse.reference,
        text: verse.text,
      })),
      suggested_questions: generateRelatedQuestions(query, responseText),
      confidence_score: 0.85, // Default confidence - could be made more sophisticated
      processing_time_ms: processingTime,
    }

    // Save query to database
    await supabase
      .from('ai_queries')
      .insert({
        user_id: req.user.id,
        query,
        response: responseText,
        context_verses: contextVerses.map(v => v.id),
        response_time_ms: processingTime,
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
function buildPrompt(query: string, contextText: string, responseType: string): string {
  const basePrompt = `You are a knowledgeable Bible study assistant using the King James Version (KJV) Bible. 
Please provide thoughtful, theologically sound insights based on the Scripture context provided.

Context from Scripture:
${contextText}

User Query: ${query}

Instructions:
1. Base your answer primarily on the provided Scripture context
2. Cite specific verses (Book Chapter:Verse) when referencing passages
3. Provide historical and cultural context when relevant
4. Be theologically careful and humble
5. Suggest related passages for deeper study
6. Focus on clear, practical application when appropriate`

  const responseTypeInstructions = {
    insight: "Provide deep insights and theological understanding of the passage.",
    explanation: "Explain the meaning and context of the scripture clearly.",
    application: "Focus on practical life applications and personal reflection.",
    cross_reference: "Identify and explain related passages and biblical connections."
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