import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@supabase/supabase-js'
import { BibleVerse, AIQueryResponse } from '@bible-study/types'

export interface RAGConfig {
  apiKey: string
  generativeModel: string
  fileSearchStoreName?: string
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
  private genAI: GoogleGenerativeAI
  private supabase: ReturnType<typeof createClient>
  private config: RAGConfig
  private fileSearchStore: any = null

  constructor(config: RAGConfig) {
    this.config = config
    this.genAI = new GoogleGenerativeAI(config.apiKey)
    
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Initialize file search store if name provided
    if (config.fileSearchStoreName) {
      this.initializeFileSearchStore()
    }
  }

  /**
   * Initialize Google File Search Store for Bible data
   */
  private async initializeFileSearchStore() {
    try {
      console.log(`🔧 Initializing File Search Store: ${this.config.fileSearchStoreName}`)
      
      // Create file search store using Google's managed RAG system
      this.fileSearchStore = await this.genAI.getFileSearchStore(this.config.fileSearchStoreName!)
      
      if (!this.fileSearchStore) {
        // Create store if it doesn't exist
        this.fileSearchStore = await this.genAI.createFileSearchStore({
          name: this.config.fileSearchStoreName,
          displayName: 'Bible Study Database'
        })
        console.log('✅ Created new File Search Store')
      } else {
        console.log('✅ Found existing File Search Store')
      }
    } catch (error) {
      console.error('❌ Error initializing File Search Store:', error)
    }
  }

  /**
   * Upload Bible data to File Search Store
   */
  async uploadBibleDataToStore(verses: BibleVerse[]) {
    if (!this.fileSearchStore) {
      throw new Error('File Search Store not initialized')
    }

    console.log(`📚 Uploading ${verses.length} verses to File Search Store...`)

    try {
      // Create JSON file with Bible verses for upload
      const bibleData = {
        type: 'bible_verses',
        version: 'KJV',
        total_verses: verses.length,
        verses: verses.map(verse => ({
          id: verse.id,
          reference: verse.reference,
          text: verse.text,
          book_name: verse.book_name,
          chapter: verse.chapter,
          verse_number: verse.verse,
          testament: verse.testament
        }))
      }

      // Create temporary file
      const fileName = `kjv-bible-verses-${Date.now()}.json`
      const fileContent = JSON.stringify(bibleData, null, 2)
      
      // Upload to File Search Store (this handles chunking, embedding, and indexing automatically)
      const uploadResult = await this.fileSearchStore.uploadFile({
        fileName,
        content: fileContent,
        mimeType: 'application/json',
        displayName: 'King James Version Bible Verses'
      })

      console.log('✅ Bible data uploaded to File Search Store')
      console.log(`📊 Processing status: ${uploadResult.state}`)
      
      // Wait for indexing to complete
      if (uploadResult.state === 'PROCESSING') {
        console.log('⏳ Waiting for File Search indexing to complete...')
        // In production, you'd poll the status here
      }
      
      return uploadResult
      
    } catch (error) {
      console.error('❌ Error uploading Bible data to File Search:', error)
      throw error
    }
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
   * Search for relevant verses using Google File Search
   */
  async searchSimilarVerses(
    query: string, 
    limit: number = 10,
    testament?: 'Old' | 'New'
  ): Promise<{ verse: BibleVerse; similarity: number }[]> {
    try {
      if (!this.fileSearchStore) {
        throw new Error('File Search Store not initialized. Call initializeFileSearchStore() first.')
      }

      console.log(`🔍 Searching File Search for: "${query}"`)

      // Use Google's managed RAG system for search
      const response = await this.genAI.getGenerativeModel({
        model: this.config.generativeModel,
        tools: [{
          fileSearch: {
            fileSearchStoreName: this.config.fileSearchStoreName,
            maxResults: limit,
            metadataFilter: testament && testament !== 'both' ? `testament=${testament}` : undefined
          }
        }]
      }).generateContent(query)

      // Extract grounding metadata (retrieved sources)
      const groundingMetadata = response.response.candidates?.[0]?.groundingMetadata
      
      if (!groundingMetadata?.groundingChunks) {
        console.log('⚠️ No grounding chunks found in response')
        return []
      }

      // Convert grounding chunks to verse format with similarity scores
      const results = await Promise.all(
        groundingMetadata.groundingChunks.map(async (chunk: any) => {
          // Extract verse reference from chunk metadata or text
          const verseData = await this.parseChunkToVerse(chunk)
          
          return {
            verse: verseData,
            similarity: 0.85 // Default similarity for File Search matches
          }
        })
      )

      return results.slice(0, limit)

    } catch (error) {
      console.error('Error in File Search:', error)
      
      // Fallback to Supabase text search
      return this.fallbackTextSearch(query, limit, testament)
    }
  }

  /**
   * Generate AI response using Google File Search RAG
   */
  async generateResponse(ragQuery: RAGQuery): Promise<RAGResult> {
    const startTime = Date.now()
    
    try {
      if (!this.fileSearchStore) {
        throw new Error('File Search Store not initialized. Call initializeFileSearchStore() first.')
      }

      console.log(`🤖 Generating response using File Search RAG: "${ragQuery.query}"`)

      // Step 1: Generate response using Google's managed File Search RAG system
      const response = await this.genAI.getGenerativeModel({
        model: this.config.generativeModel,
        tools: [{
          fileSearch: {
            fileSearchStoreName: this.config.fileSearchStoreName,
            maxResults: ragQuery.maxContextVerses || 8,
            metadataFilter: ragQuery.testamentFilter && ragQuery.testamentFilter !== 'both' 
              ? `testament=${ragQuery.testamentFilter}` 
              : undefined
          }
        }]
      }).generateContent(this.buildRAGPrompt(ragQuery.query))

      // Step 2: Extract grounding metadata (retrieved sources and context)
      const groundingMetadata = response.response.candidates?.[0]?.groundingMetadata
      
      let contextVerses: BibleVerse[] = []
      let relevanceScores: number[] = []

      if (groundingMetadata?.groundingChunks) {
        // Convert grounding chunks to verse format
        contextVerses = await Promise.all(
          groundingMetadata.groundingChunks.map((chunk: any) => 
            this.parseChunkToVerse(chunk)
          )
        )
        
        // Assign relevance scores based on chunk order
        relevanceScores = groundingMetadata.groundingChunks.map((_, index: number) => 
          Math.max(0.7, 1.0 - (index * 0.05)) // Decreasing relevance
        )
      }

      // Step 3: Post-process response
      const processingTime = Date.now() - startTime
      const suggestedQuestions = this.extractSuggestedQuestions(response.response.text())
      const confidence = this.calculateConfidence(relevanceScores)

      return {
        response: response.response.text(),
        contextVerses,
        relevanceScores,
        processingTimeMs: processingTime,
        suggestedQuestions,
        confidence,
      }

    } catch (error) {
      console.error('Error generating File Search RAG response:', error)
      
      // Fallback response
      return {
        response: `I apologize, but I encountered an error while processing your query about "${ragQuery.query}". Please try rephrasing your question or contact support if issue persists.`,
        contextVerses: [],
        relevanceScores: [],
        processingTimeMs: Date.now() - startTime,
        suggestedQuestions: [],
        confidence: 0.1,
      }
    }
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
   * Get File Search Store status and statistics
   */
  async getFileSearchStoreStats(): Promise<any> {
    try {
      if (!this.fileSearchStore) {
        throw new Error('File Search Store not initialized')
      }

      const stats = await this.fileSearchStore.getStats()
      return {
        totalDocuments: stats.documentCount || 0,
        totalSize: stats.totalSize || 0,
        lastIndexed: stats.lastIndexedTime || null,
        storeName: this.config.fileSearchStoreName
      }
    } catch (error) {
      console.error('Error getting File Search Store stats:', error)
      return null
    }
  }

  /**
   * Search verses with advanced filtering
   */
  async advancedSearch(
    query: string,
    options: {
      testament?: 'Old' | 'New' | 'both'
      maxResults?: number
      bookFilter?: string[]
      chapterRange?: { min: number; max: number }
    } = {}
  ): Promise<{ verse: BibleVerse; similarity: number }[]> {
    try {
      if (!this.fileSearchStore) {
        throw new Error('File Search Store not initialized')
      }

      // Build metadata filter
      const metadataFilters: string[] = []
      
      if (options.testament && options.testament !== 'both') {
        metadataFilters.push(`testament=${options.testament}`)
      }
      
      if (options.bookFilter && options.bookFilter.length > 0) {
        metadataFilters.push(`book_name IN (${options.bookFilter.join(',')})`)
      }
      
      if (options.chapterRange) {
        metadataFilters.push(`chapter >= ${options.chapterRange.min} AND chapter <= ${options.chapterRange.max}`)
      }

      const metadataFilter = metadataFilters.length > 0 ? metadataFilters.join(' AND ') : undefined

      // Perform search with File Search
      const response = await this.genAI.getGenerativeModel({
        model: this.config.generativeModel,
        tools: [{
          fileSearch: {
            fileSearchStoreName: this.config.fileSearchStoreName,
            maxResults: options.maxResults || 20,
            metadataFilter
          }
        }]
      }).generateContent(query)

      // Process results
      const groundingMetadata = response.response.candidates?.[0]?.groundingMetadata
      
      if (!groundingMetadata?.groundingChunks) {
        return []
      }

      const results = await Promise.all(
        groundingMetadata.groundingChunks.map(async (chunk: any) => {
          const verseData = await this.parseChunkToVerse(chunk)
          return {
            verse: verseData,
            similarity: 0.85
          }
        })
      )

      return results

    } catch (error) {
      console.error('Error in advanced search:', error)
      return []
    }
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
   * Parse File Search chunk to Bible verse format
   */
  private async parseChunkToVerse(chunk: any): Promise<BibleVerse> {
    try {
      // Try to extract verse information from chunk metadata or text
      const chunkText = chunk.retrievedContext?.text || chunk.text || ''
      
      // Look for verse reference pattern (e.g., "Genesis 1:1")
      const verseMatch = chunkText.match(/^(\d?\s?\w+)\s+(\d+):(\d+)/i)
      
      if (verseMatch) {
        const bookName = verseMatch[1].replace(/\s+/g, ' ')
        const chapter = parseInt(verseMatch[2])
        const verse = parseInt(verseMatch[3])
        const reference = `${bookName} ${chapter}:${verse}`
        
        return {
          id: 0, // Will be set from database if needed
          book_id: 0, // Will be set from database if needed
          chapter,
          verse,
          text: chunkText.replace(/^.*?:\d+\s*/, '').trim(), // Remove reference prefix
          book_name: bookName,
          reference,
          testament: this.getTestamentForBook(bookName)
        }
      }
      
      // If no verse pattern found, create a verse-like structure
      return {
        id: 0,
        book_id: 0,
        chapter: 1,
        verse: 1,
        text: chunkText,
        book_name: 'Bible Context',
        reference: 'Context',
        testament: 'Old' // Default
      }
    } catch (error) {
      console.error('Error parsing chunk to verse:', error)
      
      return {
        id: 0,
        book_id: 0,
        chapter: 1,
        verse: 1,
        text: chunk.retrievedContext?.text || 'Unknown context',
        book_name: 'Bible Context',
        reference: 'Context',
        testament: 'Old'
      }
    }
  }

  /**
   * Determine testament from book name
   */
  private getTestamentForBook(bookName: string): 'Old' | 'New' {
    const newTestamentBooks = [
      'Matthew', 'Mark', 'Luke', 'John', 'Acts',
      'Romans', '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians',
      'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians',
      '1 Timothy', '2 Timothy', 'Titus', 'Philemon', 'Hebrews',
      'James', '1 Peter', '2 Peter', '1 John', '2 John', '3 John',
      'Jude', 'Revelation'
    ]
    
    return newTestamentBooks.includes(bookName) ? 'New' : 'Old'
  }

  /**
   * Initialize and upload Bible data to File Search
   */
  async initializeBibleDataStore(): Promise<void> {
    try {
      console.log('🔧 Initializing Bible File Search Store...')
      
      // Step 1: Initialize File Search Store
      await this.initializeFileSearchStore()
      
      // Step 2: Get all Bible verses from database
      const { data: verses, error } = await this.supabase
        .from('bible_verses')
        .select('*')
      
      if (error) {
        throw new Error(`Error fetching Bible verses: ${error.message}`)
      }
      
      if (!verses || verses.length === 0) {
        console.log('⚠️ No Bible verses found in database. Please load Bible data first.')
        return
      }
      
      // Step 3: Upload to File Search Store
      console.log(`📚 Uploading ${verses.length} verses to File Search Store...`)
      await this.uploadBibleDataToStore(verses)
      
      console.log('✅ Bible File Search Store initialization complete!')
      
    } catch (error) {
      console.error('❌ Error initializing Bible File Search Store:', error)
      throw error
    }
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