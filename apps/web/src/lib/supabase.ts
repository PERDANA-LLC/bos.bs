import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Auth helpers
export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}

export const signUp = async (email: string, password: string, metadata?: any) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
    },
  })
  return { data, error }
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  return { user, error }
}

// Database helpers
export const getBibleBooks = async () => {
  const { data, error } = await supabase
    .from('bible_books')
    .select('*')
    .order('book_order')
  return { data, error }
}

export const getBibleVerses = async (bookId: number, chapter: number) => {
  const { data, error } = await supabase
    .from('bible_verses')
    .select('*')
    .eq('book_id', bookId)
    .eq('chapter', chapter)
    .order('verse')
  return { data, error }
}

export const getVerse = async (verseId: number) => {
  const { data, error } = await supabase
    .from('bible_verses')
    .select('*')
    .eq('id', verseId)
    .single()
  return { data, error }
}

export const searchVerses = async (query: string) => {
  const { data, error } = await supabase
    .from('bible_verses')
    .select('*')
    .textSearch('text', query)
    .limit(50)
  return { data, error }
}

export const getCrossReferences = async (verseId: number) => {
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
  return { data, error }
}

export const getUserAnnotations = async (userId: string) => {
  const { data, error } = await supabase
    .from('user_annotations')
    .select(`
      *,
      verse:bible_verses (
        id, reference, text, book_name
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  return { data, error }
}

export const createAnnotation = async (annotation: {
  user_id: string
  verse_id: number
  annotation_type: 'note' | 'highlight' | 'bookmark'
  content?: string
  color?: string
}) => {
  const { data, error } = await supabase
    .from('user_annotations')
    .insert(annotation)
    .select()
    .single()
  return { data, error }
}

export const updateAnnotation = async (id: string, updates: any) => {
  const { data, error } = await supabase
    .from('user_annotations')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  return { data, error }
}

export const deleteAnnotation = async (id: string) => {
  const { error } = await supabase
    .from('user_annotations')
    .delete()
    .eq('id', id)
  return { error }
}

export const createStudySession = async (session: {
  user_id: string
  started_at: string
  verses_read?: number
  ai_queries?: number
}) => {
  const { data, error } = await supabase
    .from('study_sessions')
    .insert(session)
    .select()
    .single()
  return { data, error }
}

export const updateStudySession = async (id: string, updates: any) => {
  const { data, error } = await supabase
    .from('study_sessions')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  return { data, error }
}

export const createAIQuery = async (query: {
  user_id: string
  query: string
  response: string
  context_verses?: number[]
  response_time_ms?: number
}) => {
  const { data, error } = await supabase
    .from('ai_queries')
    .insert(query)
    .select()
    .single()
  return { data, error }
}

export const getAIQueryHistory = async (userId: string, limit: number = 20) => {
  const { data, error } = await supabase
    .from('ai_queries')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
  return { data, error }
}