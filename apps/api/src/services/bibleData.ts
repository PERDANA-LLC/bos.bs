// Import Supabase client utility
import { createClient } from '@supabase/supabase-js'
import { BibleBook, BibleVerse, Strongs, CrossReference } from '@bible-study/types'

export class BibleDataService {
  private supabase: ReturnType<typeof createClient>

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }

  // KJV Bible Book Data
  private readonly kjvBooks: BibleBook[] = [
    { id: 1, name: 'Genesis', testament: 'Old', book_order: 1, chapters: 50, abbreviation: 'Gen' },
    { id: 2, name: 'Exodus', testament: 'Old', book_order: 2, chapters: 40, abbreviation: 'Exod' },
    { id: 3, name: 'Leviticus', testament: 'Old', book_order: 3, chapters: 27, abbreviation: 'Lev' },
    { id: 4, name: 'Numbers', testament: 'Old', book_order: 4, chapters: 36, abbreviation: 'Num' },
    { id: 5, name: 'Deuteronomy', testament: 'Old', book_order: 5, chapters: 34, abbreviation: 'Deut' },
    { id: 6, name: 'Joshua', testament: 'Old', book_order: 6, chapters: 24, abbreviation: 'Josh' },
    { id: 7, name: 'Judges', testament: 'Old', book_order: 7, chapters: 21, abbreviation: 'Judg' },
    { id: 8, name: 'Ruth', testament: 'Old', book_order: 8, chapters: 4, abbreviation: 'Ruth' },
    { id: 9, name: '1 Samuel', testament: 'Old', book_order: 9, chapters: 31, abbreviation: '1 Sam' },
    { id: 10, name: '2 Samuel', testament: 'Old', book_order: 10, chapters: 24, abbreviation: '2 Sam' },
    { id: 11, name: '1 Kings', testament: 'Old', book_order: 11, chapters: 22, abbreviation: '1 Kgs' },
    { id: 12, name: '2 Kings', testament: 'Old', book_order: 12, chapters: 25, abbreviation: '2 Kgs' },
    { id: 13, name: '1 Chronicles', testament: 'Old', book_order: 13, chapters: 29, abbreviation: '1 Chr' },
    { id: 14, name: '2 Chronicles', testament: 'Old', book_order: 14, chapters: 36, abbreviation: '2 Chr' },
    { id: 15, name: 'Ezra', testament: 'Old', book_order: 15, chapters: 10, abbreviation: 'Ezra' },
    { id: 16, name: 'Nehemiah', testament: 'Old', book_order: 16, chapters: 13, abbreviation: 'Neh' },
    { id: 17, name: 'Esther', testament: 'Old', book_order: 17, chapters: 10, abbreviation: 'Esth' },
    { id: 18, name: 'Job', testament: 'Old', book_order: 18, chapters: 42, abbreviation: 'Job' },
    { id: 19, name: 'Psalms', testament: 'Old', book_order: 19, chapters: 150, abbreviation: 'Ps' },
    { id: 20, name: 'Proverbs', testament: 'Old', book_order: 20, chapters: 31, abbreviation: 'Prov' },
    { id: 21, name: 'Ecclesiastes', testament: 'Old', book_order: 21, chapters: 12, abbreviation: 'Eccl' },
    { id: 22, name: 'Song of Solomon', testament: 'Old', book_order: 22, chapters: 8, abbreviation: 'Song' },
    { id: 23, name: 'Isaiah', testament: 'Old', book_order: 23, chapters: 66, abbreviation: 'Isa' },
    { id: 24, name: 'Jeremiah', testament: 'Old', book_order: 24, chapters: 52, abbreviation: 'Jer' },
    { id: 25, name: 'Lamentations', testament: 'Old', book_order: 25, chapters: 5, abbreviation: 'Lam' },
    { id: 26, name: 'Ezekiel', testament: 'Old', book_order: 26, chapters: 48, abbreviation: 'Ezek' },
    { id: 27, name: 'Daniel', testament: 'Old', book_order: 27, chapters: 12, abbreviation: 'Dan' },
    { id: 28, name: 'Hosea', testament: 'Old', book_order: 28, chapters: 14, abbreviation: 'Hos' },
    { id: 29, name: 'Joel', testament: 'Old', book_order: 29, chapters: 3, abbreviation: 'Joel' },
    { id: 30, name: 'Amos', testament: 'Old', book_order: 30, chapters: 9, abbreviation: 'Amos' },
    { id: 31, name: 'Obadiah', testament: 'Old', book_order: 31, chapters: 1, abbreviation: 'Obad' },
    { id: 32, name: 'Jonah', testament: 'Old', book_order: 32, chapters: 4, abbreviation: 'Jonah' },
    { id: 33, name: 'Micah', testament: 'Old', book_order: 33, chapters: 7, abbreviation: 'Mic' },
    { id: 34, name: 'Nahum', testament: 'Old', book_order: 34, chapters: 3, abbreviation: 'Nah' },
    { id: 35, name: 'Habakkuk', testament: 'Old', book_order: 35, chapters: 3, abbreviation: 'Hab' },
    { id: 36, name: 'Zephaniah', testament: 'Old', book_order: 36, chapters: 3, abbreviation: 'Zeph' },
    { id: 37, name: 'Haggai', testament: 'Old', book_order: 37, chapters: 2, abbreviation: 'Hag' },
    { id: 38, name: 'Zechariah', testament: 'Old', book_order: 38, chapters: 14, abbreviation: 'Zech' },
    { id: 39, name: 'Malachi', testament: 'Old', book_order: 39, chapters: 4, abbreviation: 'Mal' },
    { id: 40, name: 'Matthew', testament: 'New', book_order: 40, chapters: 28, abbreviation: 'Matt' },
    { id: 41, name: 'Mark', testament: 'New', book_order: 41, chapters: 16, abbreviation: 'Mark' },
    { id: 42, name: 'Luke', testament: 'New', book_order: 42, chapters: 24, abbreviation: 'Luke' },
    { id: 43, name: 'John', testament: 'New', book_order: 43, chapters: 21, abbreviation: 'John' },
    { id: 44, name: 'Acts', testament: 'New', book_order: 44, chapters: 28, abbreviation: 'Acts' },
    { id: 45, name: 'Romans', testament: 'New', book_order: 45, chapters: 16, abbreviation: 'Rom' },
    { id: 46, name: '1 Corinthians', testament: 'New', book_order: 46, chapters: 16, abbreviation: '1 Cor' },
    { id: 47, name: '2 Corinthians', testament: 'New', book_order: 47, chapters: 13, abbreviation: '2 Cor' },
    { id: 48, name: 'Galatians', testament: 'New', book_order: 48, chapters: 6, abbreviation: 'Gal' },
    { id: 49, name: 'Ephesians', testament: 'New', book_order: 49, chapters: 6, abbreviation: 'Eph' },
    { id: 50, name: 'Philippians', testament: 'New', book_order: 50, chapters: 4, abbreviation: 'Phil' },
    { id: 51, name: 'Colossians', testament: 'New', book_order: 51, chapters: 4, abbreviation: 'Col' },
    { id: 52, name: '1 Thessalonians', testament: 'New', book_order: 52, chapters: 5, abbreviation: '1 Thess' },
    { id: 53, name: '2 Thessalonians', testament: 'New', book_order: 53, chapters: 3, abbreviation: '2 Thess' },
    { id: 54, name: '1 Timothy', testament: 'New', book_order: 54, chapters: 6, abbreviation: '1 Tim' },
    { id: 55, name: '2 Timothy', testament: 'New', book_order: 55, chapters: 4, abbreviation: '2 Tim' },
    { id: 56, name: 'Titus', testament: 'New', book_order: 56, chapters: 3, abbreviation: 'Titus' },
    { id: 57, name: 'Philemon', testament: 'New', book_order: 57, chapters: 1, abbreviation: 'Phlm' },
    { id: 58, name: 'Hebrews', testament: 'New', book_order: 58, chapters: 13, abbreviation: 'Heb' },
    { id: 59, name: 'James', testament: 'New', book_order: 59, chapters: 5, abbreviation: 'Jas' },
    { id: 60, name: '1 Peter', testament: 'New', book_order: 60, chapters: 5, abbreviation: '1 Pet' },
    { id: 61, name: '2 Peter', testament: 'New', book_order: 61, chapters: 3, abbreviation: '2 Pet' },
    { id: 62, name: '1 John', testament: 'New', book_order: 62, chapters: 5, abbreviation: '1 John' },
    { id: 63, name: '2 John', testament: 'New', book_order: 63, chapters: 1, abbreviation: '2 John' },
    { id: 64, name: '3 John', testament: 'New', book_order: 64, chapters: 1, abbreviation: '3 John' },
    { id: 65, name: 'Jude', testament: 'New', book_order: 65, chapters: 1, abbreviation: 'Jude' },
    { id: 66, name: 'Revelation', testament: 'New', book_order: 66, chapters: 22, abbreviation: 'Rev' },
  ]

  // Sample KJV verses (this would normally be loaded from a complete KJV text file)
  private readonly kjvVerses: Partial<BibleVerse>[] = [
    // Genesis 1:1-3
    { book_id: 1, chapter: 1, verse: 1, text: "In the beginning God created the heaven and the earth." },
    { book_id: 1, chapter: 1, verse: 2, text: "And the earth was without form, and void; and darkness was upon the face of the deep. And the Spirit of God moved upon the face of the waters." },
    { book_id: 1, chapter: 1, verse: 3, text: "And God said, Let there be light: and there was light." },
    
    // John 3:16-18
    { book_id: 43, chapter: 3, verse: 16, text: "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life." },
    { book_id: 43, chapter: 3, verse: 17, text: "For God sent not his Son into the world to condemn the world; but that the world through him might be saved." },
    { book_id: 43, chapter: 3, verse: 18, text: "He that believeth on him is not condemned: but he that believeth not is condemned already, because he hath not believed in the name of the only begotten Son of God." },
  ]

  // Sample Strong's Concordance data
  private readonly strongsData: Partial<Strongs>[] = [
    {
      strong_number: 'H7225',
      original_word: 'רֵאשִׁית',
      transliteration: 'rêshîyth',
      pronunciation: 'ray-sheeth\'',
      definition: 'the first, in place, time, order or rank (specifically, a firstfruit):—beginning, chief(-est), first(-fruits, part), principal thing.',
      language: 'Hebrew',
      kjv_occurrences: 506
    },
    {
      strong_number: 'H430',
      original_word: 'אֱלֹהִים',
      transliteration: 'elohiym',
      pronunciation: 'el-o-heem\'',
      definition: 'gods in the ordinary sense; but specifically used (in the plural thus, especially with the article) of the supreme God; occasionally applied by way of deference to magistrates; and sometimes as a superlative:—angels, X exceeding, God (gods)(-dess, -ly), X (very) great, judges, X mighty.',
      language: 'Hebrew',
      kjv_occurrences: 2600
    },
    {
      strong_number: 'G26',
      original_word: 'ἀγάπη',
      transliteration: 'agapē',
      pronunciation: 'ag-ah\'-pay',
      definition: 'love, i.e. affection or benevolence; specially (plural) a love-feast:—(feast of) charity (love), (dearly) love(-ed).',
      language: 'Greek',
      kjv_occurrences: 116
    }
  ]

  // Sample Cross References
  private readonly crossReferences: Partial<CrossReference>[] = [
    {
      from_verse_id: 1, // Genesis 1:1
      to_verse_id: 1000, // John 1:1 (hypothetical ID)
      reference_type: 'thematic',
      confidence_score: 0.95
    },
    {
      from_verse_id: 4, // John 3:16
      to_verse_id: 2, // Genesis 3:15 (hypothetical ID)
      reference_type: 'prophetic',
      confidence_score: 0.90
    }
  ]

  // Initialize database with basic data
  async initializeDatabase() {
    console.log('📖 Initializing Bible database...')

    try {
      // Insert Bible books
      console.log('📚 Inserting Bible books...')
      for (const book of this.kjvBooks) {
        const { error } = await this.supabase
          .from('bible_books')
          .upsert(book, { onConflict: 'id' })

        if (error) {
          console.error(`Error inserting book ${book.name}:`, error)
        }
      }

      // Insert sample verses
      console.log('📝 Inserting sample verses...')
      for (const verseData of this.kjvVerses) {
        const book = this.kjvBooks.find(b => b.id === verseData.book_id)
        const verse: Partial<BibleVerse> = {
          ...verseData,
          book_name: book?.name || '',
          reference: `${book?.name} ${verseData.chapter}:${verseData.verse}`,
          testament: book?.testament || 'Old'
        }

        const { error } = await this.supabase
          .from('bible_verses')
          .upsert(verse, { onConflict: 'book_id,chapter,verse' })

        if (error) {
          console.error(`Error inserting verse ${verse.reference}:`, error)
        }
      }

      // Insert Strong's data
      console.log('🔍 Inserting Strong\'s concordance...')
      for (const strongData of this.strongsData) {
        const { error } = await this.supabase
          .from('strongs_concordance')
          .upsert(strongData, { onConflict: 'strong_number' })

        if (error) {
          console.error(`Error inserting Strong's number ${strongData.strong_number}:`, error)
        }
      }

      console.log('✅ Bible database initialization complete!')

    } catch (error) {
      console.error('❌ Error initializing Bible database:', error)
      throw error
    }
  }

  // Get complete book structure
  getBibleBooks(): BibleBook[] {
    return this.kjvBooks
  }

  // Get verses for a specific book and chapter
  async getVerses(bookId: number, chapter: number): Promise<BibleVerse[]> {
    const { data, error } = await this.supabase
      .from('bible_verses')
      .select('*')
      .eq('book_id', bookId)
      .eq('chapter', chapter)
      .order('verse')

    if (error) {
      throw new Error(`Error fetching verses: ${error.message}`)
    }

    return data || []
  }

  // Search verses by text
  async searchVerses(query: string, limit: number = 20): Promise<BibleVerse[]> {
    const { data, error } = await this.supabase
      .from('bible_verses')
      .select('*')
      .textSearch('text', query)
      .limit(limit)

    if (error) {
      throw new Error(`Error searching verses: ${error.message}`)
    }

    return data || []
  }

  // Get Strong's info for a verse
  async getStrongNumbersForVerse(verseId: number): Promise<any[]> {
    const { data, error } = await this.supabase
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
      throw new Error(`Error fetching Strong's numbers: ${error.message}`)
    }

    return data || []
  }

  // Generate verse embeddings for RAG
  async generateVerseEmbeddings(verses: BibleVerse[]): Promise<number[]> {
    // This would integrate with Google Vertex AI embeddings
    // For now, return placeholder array
    console.log(`🔢 Generating embeddings for ${verses.length} verses...`)
    
    const embeddingIds: number[] = []
    for (const verse of verses) {
      // In production, this would call Vertex AI text-embedding-004
      // For now, we'll create a placeholder
      const { data, error } = await this.supabase
        .from('verse_embeddings')
        .upsert({
          verse_id: verse.id,
          embedding_vector: Array(768).fill(0).map(() => Math.random()), // Mock embedding
          embedding_model: 'text-embedding-004'
        }, { onConflict: 'verse_id,embedding_model' })

      if (!error && data) {
        embeddingIds.push(data.id)
      }
    }

    return embeddingIds
  }

  // Get cross references for a verse
  async getCrossReferences(verseId: number): Promise<CrossReference[]> {
    const { data, error } = await this.supabase
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
      throw new Error(`Error fetching cross references: ${error.message}`)
    }

    return data || []
  }
}

export default BibleDataService