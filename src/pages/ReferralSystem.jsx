import React, { useState, useEffect } from "react";
import { supabaseClient } from "@/components/api/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Share2, Copy, Users, Gift, Sparkles, Trophy,
  Mail, MessageCircle, CheckCircle, Loader2,
} from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";

const getInitial = (email) => email?.charAt(0)?.toUpperCase() || "؟";

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
      const currentUser = await supabaseClient.auth.me();
      setUser(currentUser);

      let [referral] = await supabaseClient.entities.ReferralCode.filter({
        user_email: currentUser.email,
      });

      if (!referral) {
        const code = `QURAN-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        referral = await supabaseClient.entities.ReferralCode.create({
          user_email: currentUser.email,
          referral_code: code,
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

  const getReferralLink = () => `${window.location.origin}?ref=${referralCode}`;

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    toast({
      title: "✅ تم النسخ",
      description: "تم نسخ رابط الدعوة",
      className: "bg-green-100 text-green-800",
    });
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const shareViaWhatsApp = () => {
    const message = `🌟 انضم إليّ في تطبيق كلمات القرآن لتعلم معاني القرآن الكريم!\n\n✨ استخدم كودي واحصل على 25 جوهرة مجاناً: ${referralCode}\n\n${getReferralLink()}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
  };

  const shareViaEmail = () => {
    const subject = "انضم إليّ في تطبيق كلمات القرآن";
    const body = `السلام عليكم،\n\nأدعوك للانضمام إلى تطبيق كلمات القرآن لتعلم معاني القرآن الكريم بطريقة تفاعلية وممتعة!\n\nاستخدم كود الدعوة الخاص بي: ${referralCode}\nواحصل على 25 جوهرة مجاناً عند التسجيل.\n\nرابط التطبيق: ${getReferralLink()}\n\nبالتوفيق!`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  if (isLoading) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-green-500" />
        <p className="text-foreground/60">جارٍ تحميل بيانات الدعوة...</p>
      </div>
    );
  }

  const totalReferrals = referralData?.total_referrals || 0;
  const gemsEarned = referralData?.gems_earned || 0;
  const referredUsers = referralData?.referred_users || [];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>

        {/* ── الهيدر ── */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Gift className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold gradient-text mb-2">ادعُ أصدقائك</h1>
          <p className="text-foreground/70">اكسب مكافآت عند دعوة أصدقائك للتطبيق 🎁</p>
        </div>

        {/* ── بطاقة المكافآت ── */}
        <Card className="overflow-hidden shadow-md mb-6">
          <div className="h-4 bg-gradient-to-r from-green-500 to-emerald-500" />
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="bg-amber-50 dark:bg-amber-950/20 rounded-2xl p-5 text-center border border-amber-200 dark:border-amber-800">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center mx-auto mb-3 shadow-lg">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-3xl font-bold text-amber-600">50 💎</h3>
                <p className="text-sm text-foreground/70 mt-1">لك عن كل صديق</p>
              </div>
              <div className="bg-green-50 dark:bg-green-950/20 rounded-2xl p-5 text-center border border-green-200 dark:border-green-800">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mx-auto mb-3 shadow-lg">
                  <Gift className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-3xl font-bold text-green-600">25 💎</h3>
                <p className="text-sm text-foreground/70 mt-1">لصديقك عند التسجيل</p>
              </div>
            </div>

            {/* كيف يعمل */}
            <div className="bg-blue-50 dark:bg-blue-950/20 rounded-2xl p-5 border border-blue-200 dark:border-blue-800">
              <p className="font-bold text-blue-700 dark:text-blue-300 mb-3">📝 كيف يعمل؟</p>
              <div className="space-y-2">
                {[
                  { num: "١", text: "شارك كودك أو رابطك مع أصدقائك" },
                  { num: "٢", text: "يحصل صديقك على 25 جوهرة عند التسجيل باستخدام كودك" },
                  { num: "٣", text: "تحصل أنت على 50 جوهرة لكل صديق ينضم! 🎉" },
                ].map(({ num, text }) => (
                  <div key={num} className="flex items-start gap-3">
                    <span className="w-7 h-7 rounded-full bg-blue-500 text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
                      {num}
                    </span>
                    <p className="text-sm text-foreground/80 pt-0.5">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── كود الدعوة ── */}
        <Card className="overflow-hidden shadow-md mb-6">
          <div className="h-4 bg-gradient-to-r from-violet-500 to-purple-500" />
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center shadow-lg">
                <Share2 className="w-5 h-5 text-white" />
              </div>
              كود الدعوة الخاص بك
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* الكود البارز */}
            <div
              className="flex items-center justify-between gap-3 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 border-2 border-violet-200 dark:border-violet-700 rounded-2xl px-5 py-4 cursor-pointer"
              onClick={() => copyToClipboard(referralCode)}
            >
              <span className="text-2xl font-bold tracking-widest text-violet-700 dark:text-violet-300">
                {referralCode}
              </span>
              <Button
                size="sm"
                className="bg-gradient-to-r from-violet-500 to-purple-500 hover:opacity-90 text-white border-0 rounded-xl"
                onClick={(e) => { e.stopPropagation(); copyToClipboard(referralCode); }}
              >
                {copiedLink ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>

            {/* رابط الدعوة */}
            <div>
              <p className="text-sm font-medium text-foreground/70 mb-2">رابط الدعوة</p>
              <div
                className="flex items-center gap-2 bg-background border border-border rounded-xl px-4 py-3 cursor-pointer hover:border-primary transition-colors"
                onClick={() => copyToClipboard(getReferralLink())}
              >
                <span className="flex-1 font-mono text-xs text-foreground/70 truncate">
                  {getReferralLink()}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="flex-shrink-0 h-7 text-xs gap-1"
                  onClick={(e) => { e.stopPropagation(); copyToClipboard(getReferralLink()); }}
                >
                  <Copy className="w-3 h-3" /> نسخ
                </Button>
              </div>
            </div>

            {/* أزرار المشاركة */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={shareViaWhatsApp}
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:opacity-90 text-white border-0 rounded-xl"
              >
                <MessageCircle className="w-5 h-5 ml-2" />
                واتساب
              </Button>
              <Button
                onClick={shareViaEmail}
                variant="outline"
                className="rounded-xl hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700"
              >
                <Mail className="w-5 h-5 ml-2" />
                البريد الإلكتروني
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ── الإحصاءات ── */}
        <Card className="overflow-hidden shadow-md">
          <div className="h-4 bg-gradient-to-r from-amber-500 to-yellow-500" />
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center shadow-lg">
                <Trophy className="w-5 h-5 text-white" />
              </div>
              إحصائياتك
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-blue-50 dark:bg-blue-950/20 rounded-2xl p-4 text-center border border-blue-200 dark:border-blue-800">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center mx-auto mb-2 shadow-md">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <p className="text-3xl font-bold text-blue-600">{totalReferrals}</p>
                <p className="text-sm text-foreground/60 mt-1">صديق مدعو</p>
              </div>
              <div className="bg-amber-50 dark:bg-amber-950/20 rounded-2xl p-4 text-center border border-amber-200 dark:border-amber-800">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center mx-auto mb-2 shadow-md">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <p className="text-3xl font-bold text-amber-600">{gemsEarned}</p>
                <p className="text-sm text-foreground/60 mt-1">💎 جوهرة مكتسبة</p>
              </div>
            </div>

            {/* قائمة المُدعوِّين */}
            {referredUsers.length > 0 ? (
              <div>
                <p className="font-semibold mb-3 text-foreground/80">الأصدقاء المنضمون:</p>
                <div className="space-y-2">
                  {referredUsers.map((email, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-xl border border-green-200 dark:border-green-800"
                    >
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white text-sm font-bold shadow-md flex-shrink-0">
                        {getInitial(email)}
                      </div>
                      <span className="flex-1 text-sm text-foreground/80 truncate">{email}</span>
                      <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border-0">
                        +50 💎
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
                <div className="text-4xl">👋</div>
                <p className="text-foreground/60 text-sm">لم ينضم أحد بعد — شارك كودك الآن!</p>
              </div>
            )}
          </CardContent>
        </Card>

      </motion.div>
    </div>
  );
}
