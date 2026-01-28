import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Share2, Copy, Users, Gift, Sparkles, Trophy,
  Mail, MessageCircle, CheckCircle
} from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";

/**
 * 🎁 نظام دعوة الأصدقاء (Referral System)
 * 
 * 📍 أين تظهر: قسم خاص في القائمة
 * 💡 الفكرة: ادعُ أصدقائك واحصل على مكافآت
 * 🎁 المكافأة: 50 جوهرة لك و 25 جوهرة لصديقك
 */

export default function ReferralSystem() {
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [referralCode, setReferralCode] = useState("");
  const [referralData, setReferralData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    loadReferralData();
  }, []);

  const loadReferralData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      // Check if user has referral code
      let [referral] = await base44.entities.ReferralCode.filter({ user_email: currentUser.email });

      if (!referral) {
        // Create referral code
        const code = generateReferralCode();
        referral = await base44.entities.ReferralCode.create({
          user_email: currentUser.email,
          referral_code: code
        });
      }

      setReferralCode(referral.referral_code);
      setReferralData(referral);

    } catch (error) {
      console.error("Error loading referral data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateReferralCode = () => {
    return `QURAN-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  };

  const getReferralLink = () => {
    return `${window.location.origin}?ref=${referralCode}`;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(getReferralLink());
    setCopiedLink(true);
    toast({
      title: "✅ تم النسخ",
      description: "تم نسخ رابط الدعوة",
      className: "bg-green-100 text-green-800"
    });
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const shareViaWhatsApp = () => {
    const message = `🌟 انضم إليّ في تطبيق كلمات القرآن لتعلم معاني القرآن الكريم!\n\n✨ استخدم كودي واحصل على 25 جوهرة مجاناً: ${referralCode}\n\n${getReferralLink()}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const shareViaEmail = () => {
    const subject = "انضم إليّ في تطبيق كلمات القرآن";
    const body = `السلام عليكم،\n\nأدعوك للانضمام إلى تطبيق كلمات القرآن لتعلم معاني القرآن الكريم بطريقة تفاعلية وممتعة!\n\nاستخدم كود الدعوة الخاص بي: ${referralCode}\nواحصل على 25 جوهرة مجاناً عند التسجيل.\n\nرابط التطبيق: ${getReferralLink()}\n\nبالتوفيق!`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  if (isLoading) {
    return <div className="p-6 text-center">جارٍ التحميل...</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-center mb-8">
          <Gift className="w-16 h-16 text-primary mx-auto mb-4" />
          <h1 className="text-4xl font-bold gradient-text mb-2">🎁 ادعُ أصدقائك</h1>
          <p className="text-foreground/70">اكسب مكافآت عند دعوة أصدقائك للتطبيق</p>
        </div>

        <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/30 mb-6">
          <CardContent className="p-8">
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="text-center">
                <Sparkles className="w-12 h-12 text-amber-500 mx-auto mb-2" />
                <h3 className="text-2xl font-bold text-foreground">50 جوهرة</h3>
                <p className="text-foreground/70">لك عن كل صديق</p>
              </div>
              <div className="text-center">
                <Gift className="w-12 h-12 text-green-500 mx-auto mb-2" />
                <h3 className="text-2xl font-bold text-foreground">25 جوهرة</h3>
                <p className="text-foreground/70">لصديقك عند التسجيل</p>
              </div>
            </div>

            <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200">
              <AlertDescription>
                <strong>📝 كيف يعمل:</strong><br/>
                1. شارك كودك أو رابطك مع أصدقائك<br/>
                2. عند تسجيلهم باستخدام كودك، يحصلون على 25 جوهرة<br/>
                3. تحصل أنت على 50 جوهرة لكل صديق ينضم! 🎉
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>كود الدعوة الخاص بك</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={referralCode}
                readOnly
                className="text-2xl font-bold text-center"
              />
              <Button onClick={copyToClipboard} size="lg">
                {copiedLink ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </Button>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">رابط الدعوة</label>
              <div className="flex gap-2">
                <Input
                  value={getReferralLink()}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button onClick={copyToClipboard} variant="outline">
                  <Copy className="w-4 h-4 ml-2" />
                  نسخ
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button onClick={shareViaWhatsApp} className="bg-green-600 hover:bg-green-700">
                <MessageCircle className="w-5 h-5 ml-2" />
                مشاركة عبر واتساب
              </Button>
              <Button onClick={shareViaEmail} variant="outline">
                <Mail className="w-5 h-5 ml-2" />
                مشاركة عبر الإيميل
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              إحصائياتك
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-foreground/70">الأصدقاء المدعوون</p>
                <p className="text-3xl font-bold text-primary">{referralData?.total_referrals || 0}</p>
              </div>
              <div>
                <p className="text-sm text-foreground/70">الجواهر المكتسبة</p>
                <p className="text-3xl font-bold text-amber-500">{referralData?.gems_earned || 0}</p>
              </div>
            </div>

            {referralData?.referred_users && referralData.referred_users.length > 0 && (
              <div className="mt-6">
                <h4 className="font-semibold mb-3">الأصدقاء المنضمون:</h4>
                <div className="space-y-2">
                  {referralData.referred_users.map((email, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-background-soft rounded">
                      <Users className="w-4 h-4 text-primary" />
                      <span>{email}</span>
                      <Badge className="mr-auto">+50 💎</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}