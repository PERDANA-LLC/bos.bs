import express from 'express'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { UserAnnotationSchema, StudySessionSchema, StudyPlanSchema } from '@bible-study/types'
import { AuthenticatedRequest } from '../middleware/auth'

const router = express.Router()

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Get user profile
router.get('/profile', async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user.id)
      .single()

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    res.json(data)
  } catch (error) {
    console.error('Error fetching user profile:', error)
    res.status(500).json({ error: 'Failed to fetch user profile' })
  }
})

// Update user profile
router.put('/profile', async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    const { name, avatar_url } = req.body

    const { data, error } = await supabase
      .from('users')
      .update({ name, avatar_url })
      .eq('id', req.user.id)
      .select()
      .single()

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    res.json(data)
  } catch (error) {
    console.error('Error updating user profile:', error)
    res.status(500).json({ error: 'Failed to update user profile' })
  }
})

// Get user annotations (notes, highlights, bookmarks)
router.get('/annotations', async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    const { data, error } = await supabase
      .from('user_annotations')
      .select(`
        *,
        verse:bible_verses (
          id, reference, text, book_name
        )
      `)
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    res.json(data || [])
  } catch (error) {
    console.error('Error fetching user annotations:', error)
    res.status(500).json({ error: 'Failed to fetch annotations' })
  }
})

// Create annotation
router.post('/annotations', async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    const annotationRequest = {
      ...req.body,
      user_id: req.user.id,
    }

    const validatedAnnotation = UserAnnotationSchema.parse(annotationRequest)

    const { data, error } = await supabase
      .from('user_annotations')
      .insert(validatedAnnotation)
      .select(`
        *,
        verse:bible_verses (
          id, reference, text, book_name
        )
      `)
      .single()

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    res.json(data)
  } catch (error) {
    console.error('Error creating annotation:', error)
    res.status(500).json({ error: 'Failed to create annotation' })
  }
})

// Update annotation
router.put('/annotations/:id', async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    const annotationId = req.params.id
    const updates = req.body

    const { data, error } = await supabase
      .from('user_annotations')
      .update(updates)
      .eq('id', annotationId)
      .eq('user_id', req.user.id)
      .select(`
        *,
        verse:bible_verses (
          id, reference, text, book_name
        )
      `)
      .single()

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    if (!data) {
      return res.status(404).json({ error: 'Annotation not found' })
    }

    res.json(data)
  } catch (error) {
    console.error('Error updating annotation:', error)
    res.status(500).json({ error: 'Failed to update annotation' })
  }
})

// Delete annotation
router.delete('/annotations/:id', async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    const annotationId = req.params.id

    const { error } = await supabase
      .from('user_annotations')
      .delete()
      .eq('id', annotationId)
      .eq('user_id', req.user.id)

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting annotation:', error)
    res.status(500).json({ error: 'Failed to delete annotation' })
  }
})

// Start study session
router.post('/study-sessions', async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    const sessionData = {
      user_id: req.user.id,
      started_at: new Date().toISOString(),
      verses_read: 0,
      ai_queries: 0,
    }

    const validatedSession = StudySessionSchema.parse(sessionData)

    const { data, error } = await supabase
      .from('study_sessions')
      .insert(validatedSession)
      .select()
      .single()

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    res.json(data)
  } catch (error) {
    console.error('Error creating study session:', error)
    res.status(500).json({ error: 'Failed to create study session' })
  }
})

// Update study session
router.put('/study-sessions/:id', async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    const sessionId = req.params.id
    const updates = req.body

    // Auto-calculate duration if ending session
    if (updates.ended_at) {
      const { data: session } = await supabase
        .from('study_sessions')
        .select('started_at')
        .eq('id', sessionId)
        .eq('user_id', req.user.id)
        .single()

      if (session) {
        const started = new Date(session.started_at)
        const ended = new Date(updates.ended_at)
        updates.duration_minutes = Math.round((ended.getTime() - started.getTime()) / 60000)
      }
    }

    const { data, error } = await supabase
      .from('study_sessions')
      .update(updates)
      .eq('id', sessionId)
      .eq('user_id', req.user.id)
      .select()
      .single()

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    if (!data) {
      return res.status(404).json({ error: 'Study session not found' })
    }

    res.json(data)
  } catch (error) {
    console.error('Error updating study session:', error)
    res.status(500).json({ error: 'Failed to update study session' })
  }
})

// Get study session history
router.get('/study-sessions', async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    const limit = parseInt(req.query.limit as string) || 20
    const offset = parseInt(req.query.offset as string) || 0

    const { data, error } = await supabase
      .from('study_sessions')
      .select('*')
      .eq('user_id', req.user.id)
      .order('started_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    res.json(data || [])
  } catch (error) {
    console.error('Error fetching study sessions:', error)
    res.status(500).json({ error: 'Failed to fetch study sessions' })
  }
})

export default router