import { VertexAI } from '@google-cloud/vertexai'
import { createClient } from '@supabase/supabase-js'
import { BibleVerse, VerseEmbedding, AIQueryResponse } from '@bible-study/types'

export interface RAGConfig {
  projectId: string
  location: string
  embeddingModel: string
  generativeModel: string
}

export interface RAGQuery {
  query: string
  maxContextVerses?: number
  minRelevanceScore?: number
  testamentFilter?: 'Old' | 'New' | 'both'
  contextVerses?: number[]
}

export interface RAGResult {
  response: string
  contextVerses: BibleVerse[]
  relevanceScores: number[]
  processingTimeMs: number
  suggestedQuestions: string[]
  confidence: number
}

export class BibleRAGSystem {
  private vertexAI: VertexAI
  private supabase: ReturnType<typeof createClient>
  private config: RAGConfig

  constructor(config: RAGConfig) {
    this.config = config
    this.vertexAI = new VertexAI({
      project: config.projectId,
      location: config.location,
    })
    
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }

  /**
   * Generate embeddings for Bible verses
   */
  async generateVerseEmbeddings(verses: BibleVerse[]): Promise<VerseEmbedding[]> {
    console.log(`🔢 Generating embeddings for ${verses.length} verses...`)
    
    const embeddingModel = this.vertexAI.getGenerativeModel({
      model: this.config.embeddingModel,
    })

    const embeddings: VerseEmbedding[] = []

    for (const verse of verses) {
      try {
        // Create text for embedding (verse + context)
        const textToEmbed = `${verse.reference}: ${verse.text}`
        
        // In a real implementation, you'd use the embedding model
        // For now, we'll simulate this process
        const mockEmbedding = Array(768).fill(0).map(() => Math.random() - 0.5)
        
        // Store embedding in database
        const { data, error } = await this.supabase
          .from('verse_embeddings')
          .upsert({
            verse_id: verse.id,
            embedding_vector: mockEmbedding,
            embedding_model: this.config.embeddingModel,
          }, { onConflict: 'verse_id,embedding_model' })
          .select()
          .single()

        if (!error && data) {
          embeddings.push(data)
        }

        // Rate limiting - wait a bit between calls
        await new Promise(resolve => setTimeout(resolve, 100))
        
      } catch (error) {
        console.error(`Error generating embedding for ${verse.reference}:`, error)
      }
    }

    return embeddings
  }

  /**
   * Search for relevant verses using semantic similarity
   */
  async searchSimilarVerses(
    query: string, 
    limit: number = 10,
    testament?: 'Old' | 'New'
  ): Promise<{ verse: BibleVerse; similarity: number }[]> {
    try {
      // Generate embedding for query
      const queryEmbedding = await this.generateQueryEmbedding(query)
      
      if (!queryEmbedding) {
        throw new Error('Failed to generate query embedding')
      }

      // Search using vector similarity
      let supabaseQuery = this.supabase
        .from('verse_embeddings')
        .select(`
          similarity:embedding_vector <=> embedding_vector,
          verse:bible_verses (
            id, book_id, chapter, verse, text, book_name, reference, testament
          )
        `)
        .gte('similarity', 0.7) // Minimum similarity threshold
        .order('similarity', { ascending: false })
        .limit(limit)

      // Apply testament filter if specified
      if (testament && testament !== 'both') {
        supabaseQuery = supabaseQuery.eq('verse.testament', testament)
      }

      const { data, error } = await supabaseQuery

      if (error) {
        throw new Error(`Vector search error: ${error.message}`)
      }

      return (data || []).map(item => ({
        verse: item.verse,
        similarity: 1 - item.similarity // Convert distance to similarity
      }))

    } catch (error) {
      console.error('Error in semantic search:', error)
      
      // Fallback to text search
      return this.fallbackTextSearch(query, limit, testament)
    }
  }

  /**
   * Generate AI response using RAG
   */
  async generateResponse(ragQuery: RAGQuery): Promise<RAGResult> {
    const startTime = Date.now()
    
    try {
      // Step 1: Retrieve relevant context
      let contextVerses: BibleVerse[] = []
      let relevanceScores: number[] = []

      if (ragQuery.contextVerses && ragQuery.contextVerses.length > 0) {
        // Use provided context verses
        const { data, error } = await this.supabase
          .from('bible_verses')
          .select('*')
          .in('id', ragQuery.contextVerses)

        if (!error && data) {
          contextVerses = data
          relevanceScores = new Array(data.length).fill(1.0)
        }
      } else {
        // Search for relevant verses
        const searchResults = await this.searchSimilarVerses(
          ragQuery.query,
          ragQuery.maxContextVerses || 8,
          ragQuery.testamentFilter
        )
        
        contextVerses = searchResults.map(r => r.verse)
        relevanceScores = searchResults.map(r => r.similarity)
      }

      // Step 2: Build prompt with context
      const contextText = contextVerses
        .map((verse, index) => 
          `${verse.reference}: ${verse.text} [Relevance: ${(relevanceScores[index] * 100).toFixed(1)}%]`
        )
        .join('\n')

      const prompt = this.buildRAGPrompt(ragQuery.query, contextText)

      // Step 3: Generate response
      const generativeModel = this.vertexAI.getGenerativeModel({
        model: this.config.generativeModel,
        generationConfig: {
          maxOutputTokens: 2048,
          temperature: 0.3,
          topP: 0.8,
          topK: 40,
        },
      })

      const result = await generativeModel.generateContent(prompt)
      const response = result.response.text()

      // Step 4: Post-process response
      const processingTime = Date.now() - startTime
      const suggestedQuestions = this.extractSuggestedQuestions(response)
      const confidence = this.calculateConfidence(relevanceScores)

      return {
        response,
        contextVerses,
        relevanceScores,
        processingTimeMs: processingTime,
        suggestedQuestions,
        confidence,
      }

    } catch (error) {
      console.error('Error generating RAG response:', error)
      
      // Fallback response
      return {
        response: `I apologize, but I encountered an error while processing your query about "${ragQuery.query}". Please try rephrasing your question or contact support if the issue persists.`,
        contextVerses: [],
        relevanceScores: [],
        processingTimeMs: Date.now() - startTime,
        suggestedQuestions: [],
        confidence: 0.1,
      }
    }
  }

  /**
   * Generate embedding for search query
   */
  private async generateQueryEmbedding(query: string): Promise<number[] | null> {
    try {
      // In a real implementation, this would call the embedding model
      // For now, we'll simulate this with a deterministic hash
      const hash = this.simpleStringHash(query)
      const embedding = Array(768).fill(0).map((_, i) => 
        Math.sin(hash + i) * 0.5
      )
      
      return embedding
    } catch (error) {
      console.error('Error generating query embedding:', error)
      return null
    }
  }

  /**
   * Simple hash function for demonstration
   */
  private simpleStringHash(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash)
  }

  /**
   * Fallback to text search when vector search fails
   */
  private async fallbackTextSearch(
    query: string, 
    limit: number,
    testament?: 'Old' | 'New'
  ): Promise<{ verse: BibleVerse; similarity: number }[]> {
    let queryBuilder = this.supabase
      .from('bible_verses')
      .select('*')
      .textSearch('text', query)
      .limit(limit)

    if (testament && testament !== 'both') {
      queryBuilder = queryBuilder.eq('testament', testament)
    }

    const { data, error } = await queryBuilder

    if (error || !data) {
      return []
    }

    return data.map(verse => ({
      verse,
      similarity: 0.8 // Default similarity for text search
    }))
  }

  /**
   * Build RAG prompt with context
   */
  private buildRAGPrompt(query: string, contextText: string): string {
    return `You are a knowledgeable Bible study assistant using the King James Version (KJV) Bible. 
Provide thoughtful, theologically sound insights based on the Scripture context provided.

CONTEXT FROM SCRIPTURE:
${contextText}

USER QUESTION: ${query}

INSTRUCTIONS:
1. Base your answer primarily on the provided Scripture context
2. Cite specific verses using Book Chapter:Verse format
3. Provide historical and cultural context when relevant
4. Be theologically careful and humble
5. Suggest related passages for deeper study
6. Focus on clear, practical application when appropriate
7. If the context doesn't fully answer the question, acknowledge the limitations

Please provide a comprehensive and helpful response:`
  }

  /**
   * Extract suggested questions from response
   */
  private extractSuggestedQuestions(response: string): string[] {
    // Look for question patterns in the response
    const questionPatterns = [
      /What does[^?]*\?/g,
      /How can[^?]*\?/g,
      /Why[^?]*\?/g,
    ]

    const questions: string[] = []
    
    questionPatterns.forEach(pattern => {
      const matches = response.match(pattern)
      if (matches) {
        questions.push(...matches.slice(0, 2)) // Limit to 2 per pattern
      }
    })

    // If no questions found, provide some default ones
    if (questions.length === 0) {
      questions.push(
        'What is the historical context of this passage?',
        'How does this apply to daily life?',
        'What are related biblical themes?'
      )
    }

    return questions.slice(0, 5) // Return max 5 questions
  }

  /**
   * Calculate confidence score based on relevance scores
   */
  private calculateConfidence(relevanceScores: number[]): number {
    if (relevanceScores.length === 0) return 0.1
    
    const avgRelevance = relevanceScores.reduce((a, b) => a + b, 0) / relevanceScores.length
    const maxRelevance = Math.max(...relevanceScores)
    
    // Weight towards maximum relevance but consider average
    return Math.min(0.95, (maxRelevance * 0.7 + avgRelevance * 0.3))
  }

  /**
   * Batch process all verses for embeddings
   */
  async processAllVerses(): Promise<void> {
    console.log('🔄 Starting batch embedding generation for all verses...')
    
    const batchSize = 50
    let offset = 0
    
    while (true) {
      const { data: verses, error } = await this.supabase
        .from('bible_verses')
        .select('*')
        .range(offset, offset + batchSize - 1)

      if (error) {
        console.error('Error fetching verses batch:', error)
        break
      }

      if (!verses || verses.length === 0) {
        break
      }

      console.log(`📖 Processing verses ${offset + 1}-${offset + verses.length}...`)
      
      await this.generateVerseEmbeddings(verses)
      
      offset += batchSize
      
      // Rate limiting - wait between batches
      await new Promise(resolve => setTimeout(resolve, 2000))
    }

    console.log('✅ Batch embedding generation complete!')
  }

  /**
   * Get verse statistics and insights
   */
  async getVerseInsights(verseId: number): Promise<any> {
    try {
      const { data: verse, error: verseError } = await this.supabase
        .from('bible_verses')
        .select('*')
        .eq('id', verseId)
        .single()

      if (verseError || !verse) {
        throw new Error('Verse not found')
      }

      // Get cross references
      const { data: crossRefs } = await this.supabase
        .from('cross_references')
        .select(`
          *,
          to_verse:bible_verses!cross_references_to_verse_id_fkey (
            id, reference, text, book_name
          ),
          from_verse:bible_verses!cross_references_from_verse_id_fkey (
            id, reference, text, book_name
          )
        `)
        .or(`from_verse_id.eq.${verseId},to_verse_id.eq.${verseId}`)

      // Get Strong's numbers
      const { data: strongs } = await this.supabase
        .from('verse_strong_relationships')
        .select(`
          position_in_verse,
          strongs_concordance (
            id, strong_number, original_word, transliteration, definition, language
          )
        `)
        .eq('verse_id', verseId)
        .order('position_in_verse')

      return {
        verse,
        crossReferences: crossRefs || [],
        strongsNumbers: strongs || [],
        insights: await this.generateVerseSpecificInsights(verse),
      }

    } catch (error) {
      console.error('Error getting verse insights:', error)
      throw error
    }
  }

  /**
   * Generate AI-powered insights for a specific verse
   */
  private async generateVerseSpecificInsights(verse: BibleVerse): Promise<string> {
    const prompt = `Provide a brief, insightful analysis of this Bible verse:
${verse.reference}: ${verse.text}

Include:
1. Key theological themes
2. Historical context
3. Practical application
4. Connection to broader biblical narrative

Keep it concise (2-3 paragraphs) and theologically sound.`

    try {
      const generativeModel = this.vertexAI.getGenerativeModel({
        model: this.config.generativeModel,
        generationConfig: {
          maxOutputTokens: 500,
          temperature: 0.3,
        },
      })

      const result = await generativeModel.generateContent(prompt)
      return result.response.text()
    } catch (error) {
      console.error('Error generating verse insights:', error)
      return 'Insights temporarily unavailable.'
    }
  }
}

export default BibleRAGSystem