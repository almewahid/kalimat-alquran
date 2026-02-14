import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  try {
    // 1. التحقق من المستخدم
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'غير مصرح' }), 
        { status: 401 }
      )
    }

    // 2. إنشاء Supabase Client بصلاحيات Service Role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 3. التحقق من أن المستخدم أدمن
    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabaseAdmin.auth.getUser(token)
    
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'مستخدم غير صالح' }), 
        { status: 401 }
      )
    }

    // التحقق من دور الأدمن
    const { data: userRole } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (!userRole || userRole.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'غير مصرح - أدمن فقط' }), 
        { status: 403 }
      )
    }

    // 4. قراءة البيانات من الطلب
    const body = await req.json()
    const { key, value, description } = body

    // 5. إضافة/تحديث الإعداد (يتجاوز RLS)
    const { data, error } = await supabaseAdmin
      .from('app_settings')
      .upsert({ 
        key, 
        value, 
        description,
        updated_at: new Date().toISOString()
      })
      .select()

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }), 
        { status: 400 }
      )
    }

    // 6. إرجاع النتيجة
    return new Response(
      JSON.stringify({ success: true, data }), 
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }), 
      { status: 500 }
    )
  }
})