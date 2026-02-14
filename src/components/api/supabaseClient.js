import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://idivxuxznyrslzjxhtzb.supabase.co'
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

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
          .maybeSingle()
        
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
      window.location.href = '/Login'
    },
    
    updateMe: async (data) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('user_profiles')
        .update(data)
        .eq('user_id', user.id)

      if (error) throw error
      return { success: true }
    },
    
    isAuthenticated: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      return !!user
    }
  },
  
  entities: {}
}

// Entity wrapper - يدعم user_email و user_email معاً
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
    
    // دعم user_email (Base44) و user_email (Supabase) معاً
    const processedConditions = { ...conditions }
    
    // إذا كان user_email موجود، استخدم user_email بدلاً منه
    if (processedConditions.user_email) {
      processedConditions.user_email = processedConditions.user_email
      delete processedConditions.user_email
    }
    
    // Apply filters
    Object.entries(processedConditions).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        query = query.in(key, value)
      } else if (typeof value === 'object' && value !== null) {
        // دعم MongoDB-style operators
        if (value.$in && Array.isArray(value.$in)) {
          query = query.in(key, value.$in)
        } else if (value.$gte !== undefined) {
          query = query.gte(key, value.$gte)
        } else if (value.$lte !== undefined) {
          query = query.lte(key, value.$lte)
        } else if (value.$gt !== undefined) {
          query = query.gt(key, value.$gt)
        } else if (value.$lt !== undefined) {
          query = query.lt(key, value.$lt)
        } else if (value.$ne !== undefined) {
          query = query.neq(key, value.$ne)
        }
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
    
    // إضافة user_email (Supabase) بدلاً من user_email (Base44)
    const enrichedData = {
      ...data,
      user_id: user?.id,
      user_email: user?.email,
      created_date: new Date().toISOString(),
    }
    
    // إزالة user_email إذا كان موجوداً في البيانات
    delete enrichedData.user_email
    
    const { data: result, error } = await supabase
      .from(tableName)
      .insert(enrichedData)
      .select()
      .single()
    
    if (error) throw error
    return result
  },
  
  bulkCreate: async (items) => {
    const { data: { user } } = await supabase.auth.getUser()
    
    const enrichedItems = items.map(item => {
      const enriched = {
        ...item,
        user_id: user?.id,
        user_email: user?.email,
        created_date: new Date().toISOString(),
      }
      
      // إزالة user_email
      delete enriched.user_email
      
      return enriched
    })
    
    const { data: result, error } = await supabase
      .from(tableName)
      .insert(enrichedItems)
      .select()
    
    if (error) throw error
    return result
  },
  
  update: async (id, data) => {
    const updateData = { ...data, updated_date: new Date().toISOString() }
    
    // إزالة user_email إذا كان موجوداً
    delete updateData.user_email
    
    const { data: result, error } = await supabase
      .from(tableName)
      .update(updateData)
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
  FlashCard: createEntityWrapper('flash_cards'),
  UserPurchase: createEntityWrapper('user_purchases'),
  Course: createEntityWrapper('courses'),
  Certificate: createEntityWrapper('certificates'),
  DailyChallenge: createEntityWrapper('daily_challenges'),
  DailyChallengeProgress: createEntityWrapper('daily_challenge_progress'),
  ReferralCode: createEntityWrapper('referral_codes'),
  ErrorLog: createEntityWrapper('error_logs'),
  AppSettings: createEntityWrapper('app_settings'),
  AppUserVersion: createEntityWrapper('app_user_version'),
}

export default supabaseClient