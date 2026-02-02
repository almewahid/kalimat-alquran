// ⚠️ Using fetch API instead of Supabase SDK (not available in Base44)
const SUPABASE_URL = 'https://idivxuxznyrslzjxhtzb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlkaXZ4dXh6bnlyc2x6anhodHpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3ODM3MDIsImV4cCI6MjA4NTM1OTcwMn0.E3ITYSlcs7MXy8ImEzRfOe4acDyVvYvm-Oh01loBm7w';

// Helper to get auth token from localStorage
const getAuthToken = () => {
  try {
    const session = localStorage.getItem('supabase.auth.token');
    if (session) {
      const parsed = JSON.parse(session);
      return parsed.access_token;
    }
  } catch (e) {
    console.error('Error getting auth token:', e);
  }
  return null;
};

// Helper to make Supabase REST API calls
const supabaseFetch = async (endpoint, options = {}) => {
  const url = `${SUPABASE_URL}${endpoint}`;
  const token = getAuthToken();
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${token || SUPABASE_ANON_KEY}`
  };
  
  const headers = {
    ...defaultHeaders,
    ...options.headers
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
};

// ================================================
// 🔐 Authentication Wrapper (متوافق مع Base44)
// ================================================

// ✅ Base44 Context Helper - Sets user context for RLS policies
const setBase44Context = async (userId, email) => {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/set_user_context`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        p_user_id: userId || '',
        p_user_email: email || ''
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`RPC failed: ${errorText}`);
    }
    
    console.log('✅ Context set:', { userId, email });
  } catch (error) {
    console.error('⚠️ Context error:', error.message);
  }
};

// ✅ ربط حساب Supabase مع Base44
export const linkSupabaseUser = async () => {
  try {
    // 1. الحصول على مستخدم Supabase
    const supabaseUser = await supabaseFetch('/auth/v1/user');
    if (!supabaseUser || !supabaseUser.id) {
      console.log('No Supabase user found');
      return null;
    }

    // 2. الحصول على مستخدم Base44
    const base44 = await import('@/api/base44Client');
    const base44User = await base44.supabaseClient.auth.me();
    if (!base44User) {
      console.log('No Base44 user found');
      return null;
    }

    // 3. ربط الحسابين (مرة واحدة فقط)
    const result = await supabaseFetch(
      `/rest/v1/user_profiles?user_id=eq.${base44User.id}&is.supabase_user_id=null`,
      {
        method: 'PATCH',
        body: JSON.stringify({ supabase_user_id: supabaseUser.id }),
        headers: { 'Prefer': 'return=representation' }
      }
    );

    console.log('✅ Accounts linked:', { base44: base44User.id, supabase: supabaseUser.id });
    return supabaseUser.id;

  } catch (error) {
    console.error('Error linking accounts:', error);
    throw error;
  }
};

export const supabaseAuth = {
  // الحصول على المستخدم الحالي
  me: async () => {
    try {
      // محاولة Supabase أولاً
      try {
        const userData = await supabaseFetch('/auth/v1/user');
        if (!userData || !userData.id) throw new Error('No Supabase user');

        const profiles = await supabaseFetch(
          `/rest/v1/user_profiles?user_id=eq.${userData.id}&select=*`
        );
        const profile = profiles?.[0];

        const user = {
          id: userData.id,
          email: userData.email,
          full_name: profile?.full_name || userData.user_metadata?.full_name || userData.email,
          role: profile?.role || 'user',
          preferences: profile?.preferences || {},
          phone_number: profile?.phone_number,
          country: profile?.country,
          affiliation: profile?.affiliation,
          affiliation_type: profile?.affiliation_type,
          created_date: profile?.created_date,
        };

        await setBase44Context(user.id, user.email);
        return user;

      } catch (supabaseError) {
        // Fallback إلى Base44
        const base44 = await import('@/api/base44Client');
        const base44User = await base44.supabaseClient.auth.me();
        if (!base44User) return null;
        
        console.warn('⚠️ Using Base44 auth as fallback');
        
        await setBase44Context(base44User.id, base44User.email);
        
        return {
          ...base44User,
          _usingBase44Fallback: true,
        };
      }
    } catch (error) {
      console.error('Auth error:', error);
      return null;
    }
  },

  // تحديث بيانات المستخدم
  updateMe: async (data) => {
    const user = await supabaseAuth.me();
    if (!user) throw new Error('Not authenticated');

    await supabaseFetch(`/rest/v1/user_profiles?user_id=eq.${user.id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });

    return { success: true };
  },

  // تسجيل الخروج
  logout: async (redirectUrl) => {
    try {
      await supabaseFetch('/auth/v1/logout', { method: 'POST' });
    } catch (e) {
      console.error('Logout error:', e);
    }
    localStorage.removeItem('supabase.auth.token');
    if (redirectUrl) {
      window.location.href = redirectUrl;
    } else {
      window.location.reload();
    }
  },

  // التحقق من المصادقة
  isAuthenticated: async () => {
    const user = await supabaseAuth.me();
    return !!user;
  },

  // تسجيل الدخول (إعادة توجيه)
  redirectToLogin: (nextUrl) => {
    const loginUrl = nextUrl 
      ? `/login?next=${encodeURIComponent(nextUrl)}`
      : '/login';
    window.location.href = loginUrl;
  },
};

// ================================================
// 📊 Entities Wrapper (متوافق مع Base44)
// ================================================

const createEntityWrapper = (tableName) => ({
  // List all
  list: async (sortField = '-created_date', limit = 50) => {
    if (!sortField || sortField.trim() === '') {
      sortField = '-created_date';
    }
    
    const orderField = sortField.startsWith('-') ? sortField.slice(1) : sortField;
    const ascending = !sortField.startsWith('-');
    
    if (!orderField || orderField.trim() === '') {
      const data = await supabaseFetch(
        `/rest/v1/${tableName}?select=*&limit=${limit}`
      );
      return data || [];
    }
    
    const data = await supabaseFetch(
      `/rest/v1/${tableName}?select=*&order=${orderField}.${ascending ? 'asc' : 'desc'}&limit=${limit}`
    );

    return data || [];
  },

  // Filter with conditions
  filter: async (conditions = {}, sortField = '-created_date', limit = 50) => {
    const user = await supabaseAuth.me();
    if (user) {
      await setBase44Context(user.id, user.email);
    }
    
    let filters = [];
    
    Object.entries(conditions).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        filters.push(`${key}=in.(${value.map(v => `"${v}"`).join(',')})`);
      } else if (typeof value === 'object' && value !== null) {
        Object.entries(value).forEach(([operator, val]) => {
          if (operator === '$gte') filters.push(`${key}=gte.${val}`);
          else if (operator === '$lte') filters.push(`${key}=lte.${val}`);
          else if (operator === '$gt') filters.push(`${key}=gt.${val}`);
          else if (operator === '$lt') filters.push(`${key}=lt.${val}`);
          else if (operator === '$ne') filters.push(`${key}=neq.${val}`);
        });
      } else {
        filters.push(`${key}=eq.${value}`);
      }
    });

    if (!sortField || sortField.trim() === '') {
      sortField = '-created_date';
    }

    const orderField = sortField.startsWith('-') ? sortField.slice(1) : sortField;
    const ascending = !sortField.startsWith('-');
    
    const filterQuery = filters.length > 0 ? `&${filters.join('&')}` : '';
    
    if (!orderField || orderField.trim() === '') {
      const data = await supabaseFetch(
        `/rest/v1/${tableName}?select=*${filterQuery}&limit=${limit}`
      );
      return data || [];
    }
    
    const data = await supabaseFetch(
      `/rest/v1/${tableName}?select=*${filterQuery}&order=${orderField}.${ascending ? 'asc' : 'desc'}&limit=${limit}`
    );

    return data || [];
  },

  // Create
  create: async (data) => {
    const user = await supabaseAuth.me();
    
    if (user) {
      await setBase44Context(user.id, user.email);
    }
    
    const enrichedData = {
      ...data,
      user_id: !user?._usingBase44Fallback && user?.id ? user.id : undefined,
      base44_user_id: user?._usingBase44Fallback ? user.id : undefined,
      user_email: user?.email,
      created_date: new Date().toISOString(),
    };

    Object.keys(enrichedData).forEach(key => 
      enrichedData[key] === undefined && delete enrichedData[key]
    );

    const result = await supabaseFetch(`/rest/v1/${tableName}`, {
      method: 'POST',
      body: JSON.stringify(enrichedData),
      headers: { 'Prefer': 'return=representation' },
    });

    return result?.[0] || result;
  },

  // Bulk create
  bulkCreate: async (items) => {
    const user = await supabaseAuth.me();
    
    if (user) {
      await setBase44Context(user.id, user.email);
    }
    
    const enrichedItems = items.map(item => {
      const enriched = {
        ...item,
        user_id: !user?._usingBase44Fallback && user?.id ? user.id : undefined,
        base44_user_id: user?._usingBase44Fallback ? user.id : undefined,
        user_email: user?.email,
        created_date: new Date().toISOString(),
      };
      
      Object.keys(enriched).forEach(key => 
        enriched[key] === undefined && delete enriched[key]
      );
      
      return enriched;
    });

    const result = await supabaseFetch(`/rest/v1/${tableName}`, {
      method: 'POST',
      body: JSON.stringify(enrichedItems),
      headers: { 'Prefer': 'return=representation' },
    });

    return result;
  },

  // Update
  update: async (id, data) => {
    const user = await supabaseAuth.me();
    if (user) {
      await setBase44Context(user.id, user.email);
    }
    
    const result = await supabaseFetch(`/rest/v1/${tableName}?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ ...data, updated_date: new Date().toISOString() }),
      headers: { 'Prefer': 'return=representation' },
    });

    return result?.[0] || result;
  },

  // Delete
  delete: async (id) => {
    const user = await supabaseAuth.me();
    if (user) {
      await setBase44Context(user.id, user.email);
    }
    
    await supabaseFetch(`/rest/v1/${tableName}?id=eq.${id}`, {
      method: 'DELETE',
    });

    return { success: true };
  },

  // Get schema
  schema: async () => {
    return {};
  },

  // Subscribe to changes
  subscribe: (callback) => {
    console.warn('Realtime subscriptions not implemented with fetch API');
    return () => {};
  },
});

// ================================================
// 🗂️ All Entities
// ================================================

export const supabaseEntities = {
  // Users & Auth
  User: createEntityWrapper('user_profiles'),
  Friendship: createEntityWrapper('friendships'),
  ReferralCode: createEntityWrapper('referral_codes'),
  ActivityLog: createEntityWrapper('activity_logs'),

  // Quran Content
  QuranAyah: createEntityWrapper('quran_ayahs'),
  QuranTafsir: createEntityWrapper('quran_tafsirs'),
  QuranicWord: createEntityWrapper('quranic_words'),

  // Learning & Progress
  UserProgress: createEntityWrapper('user_progress'),
  FlashCard: createEntityWrapper('flash_cards'),
  FavoriteWord: createEntityWrapper('favorite_words'),
  UserNote: createEntityWrapper('user_notes'),
  UserCourseProgress: createEntityWrapper('user_course_progress'),

  // Quizzes
  QuizSession: createEntityWrapper('quiz_sessions'),

  // Groups & Challenges
  Group: createEntityWrapper('groups'),
  GroupChallenge: createEntityWrapper('group_challenges'),
  ChallengeProgress: createEntityWrapper('challenge_progress'),
  GroupMessage: createEntityWrapper('group_messages'),
  DailyChallenge: createEntityWrapper('daily_challenges'),
  DailyChallengeProgress: createEntityWrapper('daily_challenge_progress'),
  SeasonalChallenge: createEntityWrapper('seasonal_challenges'),
  FlashChallenge: createEntityWrapper('flash_challenges'),
  TeamChallenge: createEntityWrapper('team_challenges'),
  PersonalChallenge: createEntityWrapper('personal_challenges'),

  // Gamification
  Achievement: createEntityWrapper('achievements'),
  UserBadge: createEntityWrapper('user_badges'),
  UserGems: createEntityWrapper('user_gems'),
  UserPurchase: createEntityWrapper('user_purchases'),
  LearningPath: createEntityWrapper('learning_paths'),
  UserLearningPath: createEntityWrapper('user_learning_paths'),

  // System
  Notification: createEntityWrapper('notifications'),
  WeeklyReport: createEntityWrapper('weekly_reports'),
  ErrorLog: createEntityWrapper('error_logs'),

  // Media
  Category: createEntityWrapper('categories'),
  Image: createEntityWrapper('images'),
  Audio: createEntityWrapper('audios'),
  LandingPage: createEntityWrapper('landing_pages'),

  // Courses
  Course: createEntityWrapper('courses'),
  Certificate: createEntityWrapper('certificates'),
};

// ================================================
// 🎯 Main Client
// ================================================

export const supabaseClient = {
  auth: supabaseAuth,
  entities: supabaseEntities,

  // Analytics placeholder
  analytics: {
    track: async ({ eventName, properties }) => {
      console.log('Analytics tracked:', eventName, properties);
    },
  },

  // Users management
  users: {
    inviteUser: async (email, role = 'user') => {
      console.warn('inviteUser requires admin setup - implement via Edge Function');
      throw new Error('Not implemented yet - use Supabase Dashboard to invite users');
    },
  },
};

// Default export
export default supabaseClient;