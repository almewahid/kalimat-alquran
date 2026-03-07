import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

Deno.serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const { data: existingProfiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('email', user.email)

    if (profileError) {
      throw new Error(`Error checking profile: ${profileError.message}`)
    }

    if (existingProfiles && existingProfiles.length > 0) {
      return new Response(
        JSON.stringify({
          message: 'Profile already exists',
          profile: existingProfiles[0]
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const { data: newProfile, error: createError } = await supabase
      .from('user_profiles')
      .insert({
        email: user.email,
        full_name: user.user_metadata?.full_name || user.email.split('@')[0],
        role: 'user',
        preferences: {
          theme: 'light',
          learning_level: 'مبتدئ',
          kids_mode_enabled: true,
          source_type: 'juz',
          selected_juz: [30],
          selected_surahs: [
            114, 113, 112, 111, 110, 109, 108, 107, 106, 105,
            104, 103, 102, 101, 100,  99,  98,  97,  96,  95,
             94,  93,  92,  91,  90,  89,  88,  87,  86,  85,
             84,  83,  82,  81,  80,  79,  78
          ],
          sound_effects_enabled: true,
          confetti_enabled: true,
          animations_enabled: true,
          quiz_time_limit: 60
        }
      })
      .select()
      .single()

    if (createError) {
      throw new Error(`Error creating profile: ${createError.message}`)
    }

    const { data: existingProgress, error: progressCheckError } = await supabase
      .from('user_progress')
      .select('*')
      .eq('created_by', user.email)

    if (progressCheckError) {
      console.error('Error checking progress:', progressCheckError)
    }

    if (!existingProgress || existingProgress.length === 0) {
      const { error: progressCreateError } = await supabase
        .from('user_progress')
        .insert({
          created_by: user.email,
          total_xp: 0,
          current_level: 1,
          words_learned: 0,
          learned_words: [],
          consecutive_login_days: 1,
          last_login_date: new Date().toISOString().split('T')[0]
        })

      if (progressCreateError) {
        console.error('Error creating progress:', progressCreateError)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        profile: newProfile,
        message: 'User profile and progress created successfully'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error creating user profile:', error)
    return new Response(
      JSON.stringify({
        error: error.message,
        details: 'Failed to create user profile'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})