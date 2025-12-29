import express from 'express'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { BibleBookSchema, BibleVerseSchema, SearchRequestSchema } from '@bible-study/types'

const router = express.Router()

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Get all Bible books
router.get('/books', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('bible_books')
      .select('*')
      .order('book_order')

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    const validatedData = z.array(BibleBookSchema).parse(data)
    res.json(validatedData)
  } catch (error) {
    console.error('Error fetching Bible books:', error)
    res.status(500).json({ error: 'Failed to fetch Bible books' })
  }
})

// Get verses for a specific book and chapter
router.get('/verses/:bookId/:chapter', async (req, res) => {
  try {
    const bookId = parseInt(req.params.bookId)
    const chapter = parseInt(req.params.chapter)

    if (isNaN(bookId) || isNaN(chapter)) {
      return res.status(400).json({ error: 'Invalid book ID or chapter' })
    }

    const { data, error } = await supabase
      .from('bible_verses')
      .select('*')
      .eq('book_id', bookId)
      .eq('chapter', chapter)
      .order('verse')

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    const validatedData = z.array(BibleVerseSchema).parse(data)
    res.json(validatedData)
  } catch (error) {
    console.error('Error fetching verses:', error)
    res.status(500).json({ error: 'Failed to fetch verses' })
  }
})

// Get a specific verse
router.get('/verse/:id', async (req, res) => {
  try {
    const verseId = parseInt(req.params.id)

    if (isNaN(verseId)) {
      return res.status(400).json({ error: 'Invalid verse ID' })
    }

    const { data, error } = await supabase
      .from('bible_verses')
      .select('*')
      .eq('id', verseId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Verse not found' })
      }
      return res.status(500).json({ error: error.message })
    }

    const validatedData = BibleVerseSchema.parse(data)
    res.json(validatedData)
  } catch (error) {
    console.error('Error fetching verse:', error)
    res.status(500).json({ error: 'Failed to fetch verse' })
  }
})

// Search verses
router.post('/search', async (req, res) => {
  try {
    const searchRequest = SearchRequestSchema.parse(req.body)
    const { query, type, limit, testament } = searchRequest

    let queryBuilder = supabase
      .from('bible_verses')
      .select('*')
      .limit(limit)

    // Apply testament filter if specified
    if (testament !== 'both') {
      queryBuilder = queryBuilder.eq('testament', testament)
    }

    // Apply search based on type
    switch (type) {
      case 'verse':
      case 'keyword':
        queryBuilder = queryBuilder.textSearch('text', query)
        break
      case 'semantic':
        // This would integrate with vector search
        // For now, fall back to text search
        queryBuilder = queryBuilder.textSearch('text', query)
        break
      case 'topic':
        // This would integrate with topics table
        // For now, fall back to text search
        queryBuilder = queryBuilder.textSearch('text', query)
        break
    }

    const { data, error } = await queryBuilder

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    const validatedData = z.array(BibleVerseSchema).parse(data)
    res.json(validatedData)
  } catch (error) {
    console.error('Error searching verses:', error)
    res.status(500).json({ error: 'Failed to search verses' })
  }
})

// Get cross-references for a verse
router.get('/cross-references/:verseId', async (req, res) => {
  try {
    const verseId = parseInt(req.params.verseId)

    if (isNaN(verseId)) {
      return res.status(400).json({ error: 'Invalid verse ID' })
    }

    const { data, error } = await supabase
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

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    res.json(data || [])
  } catch (error) {
    console.error('Error fetching cross-references:', error)
    res.status(500).json({ error: 'Failed to fetch cross-references' })
  }
})

// Get Strong's concordance data for a verse
router.get('/strongs/:verseId', async (req, res) => {
  try {
    const verseId = parseInt(req.params.verseId)

    if (isNaN(verseId)) {
      return res.status(400).json({ error: 'Invalid verse ID' })
    }

    const { data, error } = await supabase
      .from('verse_strong_relationships')
      .select(`
        position_in_verse,
        strongs_concordance (
          id, strong_number, original_word, transliteration, definition, language
        )
      `)
      .eq('verse_id', verseId)
      .order('position_in_verse')

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    res.json(data || [])
  } catch (error) {
    console.error('Error fetching Strong\'s data:', error)
    res.status(500).json({ error: 'Failed to fetch Strong\'s concordance data' })
  }
})

export default router