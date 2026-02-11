import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

/**
 * إصدار شهادة إتمام دورة
 */
Deno.serve(async (req) => {
  try {
    // إنشاء Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // الحصول على JWT token من header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // التحقق من المستخدم الحالي
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // الحصول على courseId من body
    const { courseId } = await req.json()
    
    if (!courseId) {
      return new Response(
        JSON.stringify({ error: 'Course ID required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // التحقق من وجود الدورة
    const { data: courses, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .limit(1)
    
    if (courseError || !courses || courses.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Course not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const course = courses[0]

    // التحقق من إتمام المستخدم للدورة
    const { data: progressList, error: progressError } = await supabase
      .from('user_course_progress')
      .select('*')
      .eq('user_email', user.email)
      .eq('course_id', courseId)
      .limit(1)

    const progress = progressList?.[0]

    if (!progress || !progress.is_completed) {
      return new Response(
        JSON.stringify({ 
          error: 'Course not completed',
          message: 'يجب إكمال الدورة أولاً للحصول على الشهادة'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // التحقق من وجود شهادة سابقة
    const { data: existingCert, error: certCheckError } = await supabase
      .from('certificates')
      .select('*')
      .eq('user_email', user.email)
      .eq('course_id', courseId)

    if (existingCert && existingCert.length > 0) {
      return new Response(
        JSON.stringify({ 
          certificate: existingCert[0],
          message: 'Certificate already issued'
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // توليد كود فريد للشهادة
    const code = `CERT-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`

    // الحصول على اسم المستخدم من user_profiles
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('full_name')
      .eq('email', user.email)
      .single()

    // إصدار الشهادة
    const { data: certificate, error: createError } = await supabase
      .from('certificates')
      .insert({
        user_email: user.email,
        user_name: userProfile?.full_name || user.email.split('@')[0],
        course_id: courseId,
        course_title: course.title,
        code: code,
        issue_date: new Date().toISOString()
      })
      .select()
      .single()

    if (createError) {
      throw new Error(`Error creating certificate: ${createError.message}`)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        certificate,
        message: 'تم إصدار الشهادة بنجاح'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error issuing certificate:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})