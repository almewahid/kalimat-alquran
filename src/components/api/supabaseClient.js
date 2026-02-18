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

// Entity wrapper
const createEntityWrapper = (tableName) => {
  const dateColumn = tableName === 'app_settings' || tableName === 'app_user_version' || tableName === 'app_users_version'
    ? 'updated_at'
    : 'created_date';
  
  const updateColumn = tableName === 'app_settings' || tableName === 'app_user_version' || tableName === 'app_users_version'
    ? 'updated_at'
    : 'updated_date';

  const tablesWithoutUserId = [
    'app_settings', 'quran_ayahs', 'quranic_words', 'quran_tafsirs',
    'landing_pages', 'categories', 'images', 'audios', 'courses', 'learning_paths',
    'flash_challenges', 'seasonal_challenges', 'team_challenges', 'group_challenges',
    'groups', 'audit_log'
  ];

  return {
    list: async (sortField = `-${dateColumn}`, limit = 10000) => {
      const orderField = sortField?.startsWith('-') ? sortField.slice(1) : sortField
      const ascending = !sortField?.startsWith('-')
      
      // ✅ Pagination للـ limit الكبير
      if (limit > 1000) {
        let allData = [];
        let from = 0;
        const pageSize = 1000;
        
        while (from < limit) {
          const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .order(orderField || dateColumn, { ascending })
            .range(from, from + pageSize - 1);
          
          if (error) throw error;
          if (!data || data.length === 0) break;
          
          allData = [...allData, ...data];
          from += pageSize;
          
          if (data.length < pageSize) break;
        }
        
        return allData;
      }
      
      // للـ limit الصغير
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .order(orderField || dateColumn, { ascending })
        .limit(limit)
      
      if (error) throw error
      return data || []
    },
    
    filter: async (conditions = {}, sortField = `-${dateColumn}`, limit = 10000) => {
      let query = supabase.from(tableName).select('*')
      
      const processedConditions = { ...conditions }
      if (processedConditions.user_email) {
        processedConditions.user_email = processedConditions.user_email
        delete processedConditions.user_email
      }
      
      Object.entries(processedConditions).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          query = query.in(key, value)
        } else if (typeof value === 'object' && value !== null) {
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
      
      const orderField = sortField?.startsWith('-') ? sortField.slice(1) : sortField
      const ascending = !sortField?.startsWith('-')
      query = query.order(orderField || dateColumn, { ascending }).limit(limit)
      
      const { data, error } = await query
      if (error) throw error
      return data || []
    },
    
    create: async (data) => {
      const { data: { user } } = await supabase.auth.getUser()
      
      const enrichedData = { ...data }
      
      if (!tablesWithoutUserId.includes(tableName)) {
        enrichedData.user_id = user?.id
        enrichedData.user_email = user?.email
      }
      
      enrichedData[dateColumn] = new Date().toISOString()
      
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
        const enriched = { ...item }
        
        if (!tablesWithoutUserId.includes(tableName)) {
          enriched.user_id = user?.id
          enriched.user_email = user?.email
        }
        
        enriched[dateColumn] = new Date().toISOString()
        
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
      const updateData = { 
        ...data, 
        [updateColumn]: new Date().toISOString() 
      }
      
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
  }
}

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
  GroupChallenge: createEntityWrapper('group_challenges'),
  PersonalChallenge: createEntityWrapper('personal_challenges'),
  ChallengeProgress: createEntityWrapper('challenge_progress'),
  FlashChallenge: createEntityWrapper('flash_challenges'),
  SeasonalChallenge: createEntityWrapper('seasonal_challenges'),
  TeamChallenge: createEntityWrapper('team_challenges'),
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
  AppSettings: {
    ...createEntityWrapper('app_settings'),
    createOrUpdate: async (key, value, description = '') => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) throw new Error('غير مسجل دخول')

        const response = await fetch(
          'https://idivxuxznyrslzjxhtzb.supabase.co/functions/v1/admin-settings',
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ key, value, description })
          }
        )

        const result = await response.json()
        if (!result.success) throw new Error(result.error || 'فشل في حفظ الإعدادات')
        
        return result.data
      } catch (error) {
        console.error('خطأ في حفظ الإعدادات:', error)
        throw error
      }
    }
  },
  Category: createEntityWrapper('categories'),
  Image: createEntityWrapper('images'),
  Audio: createEntityWrapper('audios'),
  AppUsersVersion: createEntityWrapper('app_users_version'),
  LearningPath: createEntityWrapper('learning_paths'),
  UserLearningPath: createEntityWrapper('user_learning_paths'),
  CustomLearningPath: createEntityWrapper('custom_learning_paths'),
  ActivityLog: createEntityWrapper('activity_logs'),
  UserBadge: createEntityWrapper('user_badges'),
  WeeklyReport: createEntityWrapper('weekly_reports'),
  GroupMessage: createEntityWrapper('group_messages'),
  UserCourseProgress: createEntityWrapper('user_course_progress'),
  QuranTafsir: createEntityWrapper('quran_tafsirs'),
}

export default supabaseClient