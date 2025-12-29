import { z } from 'zod'

// Bible Book Schema
export const BibleBookSchema = z.object({
  id: z.number(),
  name: z.string(),
  testament: z.enum(['Old', 'New']),
  book_order: z.number(),
  chapters: z.number(),
  abbreviation: z.string(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
})

export type BibleBook = z.infer<typeof BibleBookSchema>

// Bible Verse Schema
export const BibleVerseSchema = z.object({
  id: z.number(),
  book_id: z.number(),
  chapter: z.number(),
  verse: z.number(),
  text: z.string(),
  book_name: z.string(),
  reference: z.string(),
  testament: z.enum(['Old', 'New']),
  created_at: z.string().optional(),
})

export type BibleVerse = z.infer<typeof BibleVerseSchema>

// Strong's Concordance Schema
export const StrongsSchema = z.object({
  id: z.number(),
  strong_number: z.string(),
  original_word: z.string(),
  transliteration: z.string().optional(),
  pronunciation: z.string().optional(),
  definition: z.string(),
  language: z.enum(['Hebrew', 'Greek']),
  kjv_occurrences: z.number().default(0),
  created_at: z.string().optional(),
})

export type Strongs = z.infer<typeof StrongsSchema>

// Cross Reference Schema
export const CrossReferenceSchema = z.object({
  id: z.number(),
  from_verse_id: z.number(),
  to_verse_id: z.number(),
  reference_type: z.enum(['direct_quote', 'allusion', 'thematic', 'parallel', 'prophetic']),
  confidence_score: z.number().min(0).max(1).default(1.0),
  created_at: z.string().optional(),
})

export type CrossReference = z.infer<typeof CrossReferenceSchema>

// User Schema
export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().optional(),
  avatar_url: z.string().url().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  last_sign_in_at: z.string().optional(),
})

export type User = z.infer<typeof UserSchema>

// Study Session Schema
export const StudySessionSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  started_at: z.string(),
  ended_at: z.string().optional(),
  duration_minutes: z.number().optional(),
  verses_read: z.number().default(0),
  ai_queries: z.number().default(0),
})

export type StudySession = z.infer<typeof StudySessionSchema>

// User Annotation Schema
export const UserAnnotationSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  verse_id: z.number(),
  annotation_type: z.enum(['note', 'highlight', 'bookmark']),
  content: z.string().optional(),
  color: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
})

export type UserAnnotation = z.infer<typeof UserAnnotationSchema>

// AI Query Schema
export const AIQuerySchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  query: z.string(),
  response: z.string().optional(),
  context_verses: z.array(z.number()).default([]),
  response_time_ms: z.number().optional(),
  rating: z.number().min(1).max(5).optional(),
  feedback: z.string().optional(),
  created_at: z.string().optional(),
})

export type AIQuery = z.infer<typeof AIQuerySchema>

// Study Plan Schema
export const StudyPlanSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  name: z.string(),
  description: z.string().optional(),
  plan_type: z.enum(['book_study', 'topical', 'chronological', 'character_study']),
  duration_days: z.number().optional(),
  is_active: z.boolean().default(true),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
})

export type StudyPlan = z.infer<typeof StudyPlanSchema>

// Study Plan Item Schema
export const StudyPlanItemSchema = z.object({
  id: z.string().uuid(),
  study_plan_id: z.string().uuid(),
  verse_id: z.number(),
  day_number: z.number(),
  is_completed: z.boolean().default(false),
  completed_at: z.string().optional(),
  created_at: z.string().optional(),
})

export type StudyPlanItem = z.infer<typeof StudyPlanItemSchema>

// Verse Embedding Schema
export const VerseEmbeddingSchema = z.object({
  id: z.number(),
  verse_id: z.number(),
  embedding_vector: z.array(z.number()),
  embedding_model: z.string(),
  created_at: z.string().optional(),
})

export type VerseEmbedding = z.infer<typeof VerseEmbeddingSchema>

// API Request/Response Schemas
export const SearchRequestSchema = z.object({
  query: z.string().min(1),
  type: z.enum(['verse', 'topic', 'keyword', 'semantic']).default('verse'),
  limit: z.number().min(1).max(100).default(20),
  testament: z.enum(['Old', 'New', 'both']).default('both'),
})

export type SearchRequest = z.infer<typeof SearchRequestSchema>

export const AIQueryRequestSchema = z.object({
  query: z.string().min(1),
  context_verses: z.array(z.number()).optional(),
  response_type: z.enum(['insight', 'explanation', 'application', 'cross_reference']).default('insight'),
})

export type AIQueryRequest = z.infer<typeof AIQueryRequestSchema>

export const AIQueryResponseSchema = z.object({
  response: z.string(),
  context_verses: z.array(z.object({
    id: z.number(),
    reference: z.string(),
    text: z.string(),
  })),
  related_topics: z.array(z.string()).optional(),
  suggested_questions: z.array(z.string()).optional(),
  confidence_score: z.number().min(0).max(1),
  processing_time_ms: z.number(),
})

export type AIQueryResponse = z.infer<typeof AIQueryResponseSchema>

// UI State Schemas
export const BibleReaderStateSchema = z.object({
  currentBook: z.number().optional(),
  currentChapter: z.number().optional(),
  currentVerse: z.number().optional(),
  showStrongNumbers: z.boolean().default(false),
  fontSize: z.enum(['small', 'medium', 'large']).default('medium'),
  theme: z.enum(['light', 'dark', 'sepia']).default('light'),
})

export type BibleReaderState = z.infer<typeof BibleReaderStateSchema>

export const StudySessionStateSchema = z.object({
  sessionId: z.string().uuid().optional(),
  startTime: z.string().optional(),
  versesViewed: z.array(z.number()).default([]),
  aiQueriesCount: z.number().default(0),
  notesCreated: z.number().default(0),
  bookmarksCreated: z.number().default(0),
})

export type StudySessionState = z.infer<typeof StudySessionStateSchema>

// Export all schemas
export const schemas = {
  BibleBook: BibleBookSchema,
  BibleVerse: BibleVerseSchema,
  Strongs: StrongsSchema,
  CrossReference: CrossReferenceSchema,
  User: UserSchema,
  StudySession: StudySessionSchema,
  UserAnnotation: UserAnnotationSchema,
  AIQuery: AIQuerySchema,
  StudyPlan: StudyPlanSchema,
  StudyPlanItem: StudyPlanItemSchema,
  VerseEmbedding: VerseEmbeddingSchema,
  SearchRequest: SearchRequestSchema,
  AIQueryRequest: AIQueryRequestSchema,
  AIQueryResponse: AIQueryResponseSchema,
  BibleReaderState: BibleReaderStateSchema,
  StudySessionState: StudySessionStateSchema,
}