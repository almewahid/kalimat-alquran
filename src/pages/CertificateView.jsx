import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, Download, Share2, ArrowRight, Printer, Award } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import ShareButton from "@/components/common/ShareButton";

export default function CertificateView() {
  const { toast } = useToast();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const id = searchParams.get("id");
  const isPreview = searchParams.get("preview") === "true";
  
  const navigate = useNavigate();
  const [certificate, setCertificate] = useState(null);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (id || isPreview) fetchCertificate();
  }, [id, isPreview]);

  const fetchCertificate = async () => {
    try {
      // ✅ دعم وضع المعاينة (Preview Mode)
      if (isPreview) {
        setCertificate({
          user_name: "الاسم الافتراضي للطالب",
          course_title: "عنوان الدورة التجريبي",
          issue_date: new Date().toISOString(),
          code: "TEST-CERT-12345"
        });
        
        // محاولة جلب إعدادات الدورة الحقيقية إذا توفر المعرف
        const courseId = searchParams.get("courseId");
        if (courseId) {
            try {
                // استخدام list مع فلتر بدل filter لتجنب الأخطاء إذا كان المعرف غير صالح
                const courseData = await base44.entities.Course.filter({ id: courseId });
                if (courseData && courseData.length > 0) {
                    setCourse(courseData[0]);
                } else {
                    console.warn("Course not found for preview, using default");
                    setCourse({ certificate_config: { template_style: "classic" } });
                }
            } catch (e) {
                console.error("Failed to load course for preview:", e);
                setCourse({ certificate_config: { template_style: "classic" } });
            }
        } else {
            // إعدادات افتراضية للمعاينة
            setCourse({
                certificate_config: {
                    title: "شهادة تقدير",
                    body: "تشهد الإدارة بأن الطالب قد أتم الدورة بنجاح وتفوق",
                    signature: "المدير العام",
                    template_style: "classic"
                }
            });
        }
        setLoading(false);
        return;
      }

      // الوضع العادي (جلب من قاعدة البيانات)
      const certData = await base44.entities.Certificate.filter({ id });
      if (!certData.length) throw new Error("Certificate not found");
      setCertificate(certData[0]);

      const courseData = await base44.entities.Course.filter({ id: certData[0].course_id });
      if (courseData.length) {
        setCourse(courseData[0]);
      } else {
        // Fallback if course deleted
        setCourse({
            title: certData[0].course_title,
            certificate_config: { template_style: "classic" }
        });
      }
      
    } catch (error) {
      console.error("Error:", error);
      toast({ title: "❌ خطأ", description: "لم يتم العثور على الشهادة", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;
  if (!certificate || !course) return <div className="flex h-screen items-center justify-center">الشهادة غير موجودة</div>;

  const config = course.certificate_config || {};
  
  // Style based on template selection
  const getTemplateStyle = () => {
    const baseStyle = "bg-center bg-cover bg-no-repeat";
    const customBorder = config.borderColor ? { borderColor: config.borderColor } : {};
    
    switch (config.template_style) {
      case "modern":
        return { className: `${baseStyle} bg-white border-[10px] border-l-[40px] border-blue-600`, style: { ...customBorder, ...(config.backgroundImage ? { backgroundImage: `url('${config.backgroundImage}')` } : {}) } };
      case "islamic":
        return { className: `${baseStyle} bg-[#fdfbf7] border-[8px] border-double border-[#D4AF37]`, style: { ...customBorder, backgroundImage: config.backgroundImage ? `url('${config.backgroundImage}')` : "url('https://www.transparenttextures.com/patterns/arabesque.png')" } };
      default: // classic
        return { className: `${baseStyle} bg-white border-[20px] border-double border-gray-800`, style: { ...customBorder, ...(config.backgroundImage ? { backgroundImage: `url('${config.backgroundImage}')` } : {}) } };
    }
  };

  const templateStyle = getTemplateStyle();
  const textStyle = config.textColor ? { color: config.textColor } : {};

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-10 print:bg-white print:p-0 overflow-auto">
      <div className="w-full max-w-4xl px-4 mb-6 flex justify-between items-center print:hidden">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowRight className="w-5 h-5 ml-2" /> عودة
        </Button>
        <div className="flex gap-2">
          <Button onClick={handlePrint} variant="outline">
            <Printer className="w-4 h-4 ml-2" /> طباعة / PDF
          </Button>
          {!isPreview && certificate && (
            <ShareButton 
              title="شهادة إتمام" 
              text={`لقد حصلت على شهادة في ${certificate.course_title} من تطبيق كلمات القرآن!`} 
            />
          )}
        </div>
      </div>

      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`w-[297mm] h-[210mm] relative shadow-2xl print:shadow-none print:w-full print:h-screen flex flex-col items-center justify-center text-center p-20 ${templateStyle.className}`}
        style={templateStyle.style}
      >
        {/* Islamic Decoration Corners */}
        {config.template_style === "islamic" && (
          <>
            <div className="absolute top-4 left-4 w-32 h-32 border-t-4 border-l-4 border-[#D4AF37]" />
            <div className="absolute top-4 right-4 w-32 h-32 border-t-4 border-r-4 border-[#D4AF37]" />
            <div className="absolute bottom-4 left-4 w-32 h-32 border-b-4 border-l-4 border-[#D4AF37]" />
            <div className="absolute bottom-4 right-4 w-32 h-32 border-b-4 border-r-4 border-[#D4AF37]" />
          </>
        )}

        <div className="relative z-10 w-full">
          {/* Header */}
          <div className="mb-10">
            {config.logoUrl && (
              <img 
                src={config.logoUrl} 
                alt="Logo" 
                className="h-24 mx-auto mb-6 object-contain drop-shadow-sm" 
              />
            )}
            <h1 className={`text-6xl font-serif font-bold mb-4 ${!config.textColor && (config.template_style === 'modern' ? 'text-blue-700' : config.template_style === 'islamic' ? 'text-[#D4AF37]' : 'text-gray-900')}`} style={textStyle}>
              {config.title || "شهادة إتمام"}
            </h1>
            <div className="w-32 h-1 bg-current mx-auto opacity-30" style={{ backgroundColor: config.borderColor }} />
          </div>

          {/* Body */}
          <div className="space-y-8 mb-16" style={textStyle}>
            <p className={`text-2xl font-medium ${!config.textColor && 'text-gray-600'}`}>
              {config.body || "تشهد إدارة التطبيق بأن الطالب/ة"}
            </p>
            
            <h2 className="text-5xl font-bold py-4" style={textStyle}>
              {certificate.user_name}
            </h2>
            
            <p className={`text-2xl font-medium ${!config.textColor && 'text-gray-600'}`}>
              قد أتم/ت بنجاح دورة:
            </p>
            
            <h3 className={`text-4xl font-bold ${!config.textColor && 'text-gray-800'}`}>
              {certificate.course_title}
            </h3>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-end mt-auto px-10">
            <div className="text-right">
              <p className="text-gray-500 mb-1">التاريخ</p>
              <p className="font-semibold text-lg">{new Date(certificate.issue_date).toLocaleDateString('ar-SA')}</p>
            </div>

            <div className="text-center opacity-50">
              {/* Badge/Seal Place */}
              <div className="w-24 h-24 rounded-full border-4 border-dashed border-gray-400 flex items-center justify-center">
                <Award className="w-12 h-12 text-gray-400" />
              </div>
            </div>

            <div className="text-left">
              <p className="text-gray-500 mb-1">التوقيع</p>
              <p className={`font-serif text-2xl font-bold ${config.template_style === 'modern' ? 'text-blue-700' : 'text-[#D4AF37]'}`}>
                {config.signature || "إدارة كلمات القرآن"}
              </p>
            </div>
          </div>

          {/* Code */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-gray-400 font-mono">
            ID: {certificate.code}
          </div>
        </div>
      </motion.div>
    </div>
  );
}