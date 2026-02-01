import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://idivxuxznyrslzjxhtzb.supabase.co'
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlkaXZ4dXh6bnlyc2x6anhodHpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3ODM3MDIsImV4cCI6MjA4NTM1OTcwMn0.E3ITYSlcs7MXy8ImEzRfOe4acDyVvYvm-Oh01loBm7w';

// Create Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Wrapper for compatibility
export const supabaseClient = {
  supabase: supabase,
  
  auth: {
    me: async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error || !user) return null
        
        // Get user profile
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single()
        
        return {
          id: user.id,
          email: user.email,
          full_name: profile?.full_name || user.email,
          role: profile?.role || 'user',
          preferences: profile?.preferences || {},
          phone_number: profile?.phone_number,
          country: profile?.country,
        }
      } catch (error) {
        console.error('Auth error:', error)
        return null
      }
    },
    
    logout: async () => {
      await supabase.auth.signOut()
      window.location.href = '/LoginSupabase'
    },
    
    isAuthenticated: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      return !!user
    }
  },
  
  entities: {}
}

// Entity wrapper
const createEntityWrapper = (tableName) => ({
  list: async (sortField = '-created_date', limit = 50) => {
    const orderField = sortField?.startsWith('-') ? sortField.slice(1) : sortField
    const ascending = !sortField?.startsWith('-')
    
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .order(orderField || 'created_date', { ascending })
      .limit(limit)
    
    if (error) throw error
    return data || []
  },
  
  filter: async (conditions = {}, sortField = '-created_date', limit = 50) => {
    let query = supabase.from(tableName).select('*')
    
    // Apply filters
    Object.entries(conditions).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        query = query.in(key, value)
      } else {
        query = query.eq(key, value)
      }
    })
    
    // Apply sorting
    const orderField = sortField?.startsWith('-') ? sortField.slice(1) : sortField
    const ascending = !sortField?.startsWith('-')
    query = query.order(orderField || 'created_date', { ascending }).limit(limit)
    
    const { data, error } = await query
    if (error) throw error
    return data || []
  },
  
  create: async (data) => {
    const { data: { user } } = await supabase.auth.getUser()
    
    const enrichedData = {
      ...data,
      user_id: user?.id,
      user_email: user?.email,
      created_date: new Date().toISOString(),
    }
    
    const { data: result, error } = await supabase
      .from(tableName)
      .insert(enrichedData)
      .select()
      .single()
    
    if (error) throw error
    return result
  },
  
  update: async (id, data) => {
    const { data: result, error } = await supabase
      .from(tableName)
      .update({ ...data, updated_date: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return result
  },
  
  delete: async (id) => {
    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq('id', id)
    
    if (error) throw error
    return { success: true }
  }
})

// Add entities
supabaseClient.entities = {
  User: createEntityWrapper('user_profiles'),
  Friendship: createEntityWrapper('friendships'),
  QuranAyah: createEntityWrapper('quran_ayahs'),
  QuranicWord: createEntityWrapper('quranic_words'),
  UserProgress: createEntityWrapper('user_progress'),
  FavoriteWord: createEntityWrapper('favorite_words'),
  UserNote: createEntityWrapper('user_notes'),
  QuizSession: createEntityWrapper('quiz_sessions'),
  Group: createEntityWrapper('groups'),
  Achievement: createEntityWrapper('achievements'),
  UserGems: createEntityWrapper('user_gems'),
  Notification: createEntityWrapper('user_notifications'),
  LandingPage: createEntityWrapper('landing_pages'),
}

export default supabaseClient