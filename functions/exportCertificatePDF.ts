import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { jsPDF } from 'npm:jspdf@2.5.2'

/**
 * تصدير الشهادة كملف PDF
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

    // الحصول على certificateId من body
    const { certificateId } = await req.json()
    
    // جلب بيانات الشهادة
    const { data: certificates, error: certError } = await supabase
      .from('certificates')
      .select('*')
      .eq('id', certificateId)
      .limit(1)
    
    if (certError || !certificates || certificates.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Certificate not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const certificate = certificates[0]

    // التحقق من الملكية
    // جلب بيانات المستخدم من user_profiles للتحقق من الدور
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('email', user.email)
      .single()

    if (certificate.user_email !== user.email && userProfile?.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // جلب بيانات الدورة
    const { data: courses } = await supabase
      .from('courses')
      .select('*')
      .eq('id', certificate.course_id)
      .limit(1)
    
    const course = courses?.[0]
    
    // إنشاء PDF
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    })

    // خلفية ملونة
    doc.setFillColor(245, 250, 255)
    doc.rect(0, 0, 297, 210, 'F')

    // إطار
    doc.setDrawColor(59, 130, 246)
    doc.setLineWidth(2)
    doc.rect(10, 10, 277, 190)

    // العنوان
    doc.setFontSize(32)
    doc.setTextColor(30, 64, 175)
    doc.text('شهادة إتمام', 148.5, 40, { align: 'center' })

    // نص الشهادة
    doc.setFontSize(14)
    doc.setTextColor(0, 0, 0)
    const body = course?.certificate_config?.body || 
      `هذه الشهادة تُمنح لـ ${certificate.user_name}\nتقديراً لإتمامه دورة ${certificate.course_title} بنجاح`
    
    const lines = doc.splitTextToSize(body, 240)
    doc.text(lines, 148.5, 80, { align: 'center' })

    // التاريخ
    doc.setFontSize(12)
    doc.text(
      `تاريخ الإصدار: ${new Date(certificate.issue_date).toLocaleDateString('ar-SA')}`, 
      148.5, 140, 
      { align: 'center' }
    )

    // رقم الشهادة
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text(`رقم الشهادة: ${certificate.code}`, 148.5, 180, { align: 'center' })

    // تحويل إلى arraybuffer
    const pdfBytes = doc.output('arraybuffer')

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=certificate_${certificate.code}.pdf`
      }
    })

  } catch (error) {
    console.error('Error generating PDF:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})