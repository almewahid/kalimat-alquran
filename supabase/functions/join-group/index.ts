import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. التحقق من المستخدم
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'غير مصرح' }),
        { status: 401, headers: corsHeaders }
      )
    }

    // 2. إنشاء Admin Client يتجاوز RLS
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 3. التحقق من هوية المستخدم
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'مستخدم غير صالح' }),
        { status: 401, headers: corsHeaders }
      )
    }

    // 4. قراءة كود الانضمام من الطلب
    const { join_code } = await req.json()

    if (!join_code) {
      return new Response(
        JSON.stringify({ error: 'كود الانضمام مطلوب' }),
        { status: 400, headers: corsHeaders }
      )
    }

    // 5. البحث عن المجموعة بالكود (يتجاوز RLS)
    const { data: groups, error: findError } = await supabaseAdmin
      .from('groups')
      .select('*')
      .ilike('join_code', join_code.trim())

    if (findError) {
      return new Response(
        JSON.stringify({ error: findError.message }),
        { status: 400, headers: corsHeaders }
      )
    }

    if (!groups || groups.length === 0) {
      return new Response(
        JSON.stringify({ error: 'كود غير صحيح' }),
        { status: 404, headers: corsHeaders }
      )
    }

    const group = groups[0]

    // 6. التحقق من الحظر
    if (group.banned_members && group.banned_members.includes(user.email)) {
      return new Response(
        JSON.stringify({ error: 'محظور' }),
        { status: 403, headers: corsHeaders }
      )
    }

    // 7. التحقق من العضوية المسبقة
    if (group.members && group.members.includes(user.email)) {
      return new Response(
        JSON.stringify({ error: 'عضو مسبقاً', group }),
        { status: 409, headers: corsHeaders }
      )
    }

    // 8. إضافة المستخدم للمجموعة (يتجاوز RLS)
    const updatedMembers = [...(group.members || []), user.email]
    const { error: updateError } = await supabaseAdmin
      .from('groups')
      .update({ members: updatedMembers })
      .eq('id', group.id)

    if (updateError) {
      return new Response(
        JSON.stringify({ error: updateError.message }),
        { status: 400, headers: corsHeaders }
      )
    }

    return new Response(
      JSON.stringify({ success: true, group }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: corsHeaders }
    )
  }
})
