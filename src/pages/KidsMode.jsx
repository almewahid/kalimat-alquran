import React, { useState, useEffect } from "react";
import { supabaseClient } from "@/components/api/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { Trophy, Shield, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const ACTIVITIES = [
  { emoji: "📚", label: "تعلم كلمات",     sub: "كلمات سهلة وممتعة",   route: "Learn",       from: "from-green-400",  to: "to-emerald-500",  border: "border-green-300",  text: "text-green-700",  subText: "text-green-600"  },
  { emoji: "🎮", label: "ألعاب تعليمية", sub: "العب وتعلم",          route: "KidsGames",   from: "from-pink-400",   to: "to-rose-500",     border: "border-pink-300",   text: "text-pink-700",   subText: "text-pink-600"   },
  { emoji: "🎯", label: "اختبر نفسك",   sub: "أسئلة سريعة",         route: "Quiz",        from: "from-blue-400",   to: "to-cyan-500",     border: "border-blue-300",   text: "text-blue-700",   subText: "text-blue-600"   },
  { emoji: "🏆", label: "مكافآتي",       sub: "نجومي وميدالياتي",   route: "KidsRewards", from: "from-amber-400",  to: "to-yellow-500",   border: "border-yellow-300", text: "text-orange-700", subText: "text-orange-600" },
];

export default function KidsMode() {
  const { toast } = useToast();
  const [user, setUser]                   = useState(null);
  const [kidsModeEnabled, setKidsModeEnabled] = useState(false);
  const [childName, setChildName]         = useState("");
  const [progress, setProgress]           = useState(null);
  const [isLoading, setIsLoading]         = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const currentUser = await supabaseClient.auth.me();

      if (currentUser) {
        const { data: profile } = await supabaseClient.supabase
          .from("user_profiles")
          .select("preferences, email")
          .eq("user_id", currentUser.id)
          .single();

        setUser({ ...currentUser, preferences: profile?.preferences });
        setKidsModeEnabled(profile?.preferences?.kids_mode_enabled || false);
        setChildName(profile?.preferences?.child_name || "");

        const [userProgress] = await supabaseClient.entities.UserProgress.filter({
          user_email: profile?.email
        });
        setProgress(userProgress);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleKidsMode = async (enabled) => {
    try {
      const authUser = await supabaseClient.auth.me();

      const newPreferences = {
        ...user.preferences,
        kids_mode_enabled: enabled,
        learning_level: enabled ? "مبتدئ" : (user.preferences?.learning_level || "متوسط")
      };

      if (authUser) {
        await supabaseClient.supabase
          .from("user_profiles")
          .update({ preferences: newPreferences })
          .eq("user_id", authUser.id);
      }

      await supabaseClient.auth.updateMe({ preferences: newPreferences });

      setKidsModeEnabled(enabled);
      setUser({ ...user, preferences: newPreferences });

      toast({
        title:       enabled ? "🎉 تم تفعيل وضع الأطفال!" : "تم إيقاف وضع الأطفال",
        description: enabled ? "الآن التطبيق مناسب للأطفال مع واجهة ملونة وممتعة!" : "تم العودة للوضع العادي",
        className:   "bg-green-100 text-green-800"
      });
    } catch (error) {
      console.error("Error toggling kids mode:", error);
      toast({ title: "خطأ", description: "فشل في تحديث الإعدادات", variant: "destructive" });
    }
  };

  const saveChildName = async () => {
    try {
      const authUser = await supabaseClient.auth.me();

      const newPreferences = { ...user.preferences, child_name: childName };

      if (authUser) {
        await supabaseClient.supabase
          .from("user_profiles")
          .update({ preferences: newPreferences })
          .eq("user_id", authUser.id);
      }

      await supabaseClient.auth.updateMe({ preferences: newPreferences });
      setUser({ ...user, preferences: newPreferences });

      toast({ title: "✅ تم الحفظ!", description: "تم حفظ اسم الطفل", className: "bg-green-100 text-green-800" });
    } catch (error) {
      console.error("Error saving child name:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-pink-500" />
        <p className="text-foreground/60 text-lg">جارٍ التحميل...</p>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

        {/* ── الهيدر ── */}
        <div className="text-center mb-8">
          <motion.div
            animate={{ rotate: [0, -8, 8, -8, 0] }}
            transition={{ duration: 1.5, delay: 0.5, repeat: Infinity, repeatDelay: 4 }}
            className="text-6xl mb-3"
          >
            👶
          </motion.div>
          <h1 className="text-3xl font-bold gradient-text mb-1">وضع الأطفال</h1>
          <p className="text-foreground/60 text-sm">واجهة آمنة وممتعة لتعليم الأطفال</p>
        </div>

        {/* ── بطاقة تفعيل الوضع (الأكثر أهمية) ── */}
        <Card className={`overflow-hidden shadow-md mb-5 border-2 transition-all ${kidsModeEnabled ? "border-green-400" : "border-border"}`}>
          <div className={`h-3 bg-gradient-to-r transition-all ${kidsModeEnabled ? "from-green-400 to-emerald-500" : "from-pink-400 to-rose-500"}`} />
          <CardContent className="p-5">

            {/* مفتاح التفعيل */}
            <div className={`flex items-center justify-between p-4 rounded-2xl mb-4 ${kidsModeEnabled ? "bg-green-50 dark:bg-green-950/20" : "bg-muted/40"}`}>
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${kidsModeEnabled ? "bg-green-100" : "bg-muted"}`}>
                  <span className="text-2xl">🛡️</span>
                </div>
                <div>
                  <Label htmlFor="kids-mode" className="text-base font-bold cursor-pointer">
                    تفعيل وضع الأطفال
                  </Label>
                  <p className="text-xs text-foreground/50 mt-0.5">
                    {kidsModeEnabled ? "الوضع مفعّل ✅" : "الوضع معطّل"}
                  </p>
                </div>
              </div>
              <Switch
                id="kids-mode"
                checked={kidsModeEnabled}
                onCheckedChange={toggleKidsMode}
                className="scale-125"
              />
            </div>

            {/* محتوى إضافي عند التفعيل */}
            <AnimatePresence>
              {kidsModeEnabled && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4 overflow-hidden"
                >
                  {/* حقل اسم الطفل */}
                  <div>
                    <Label className="text-sm font-semibold mb-1.5 block">اسم الطفل</Label>
                    <div className="flex gap-2">
                      <Input
                        value={childName}
                        onChange={(e) => setChildName(e.target.value)}
                        placeholder="أدخل اسم الطفل..."
                        className="rounded-2xl border-2 border-yellow-200 focus:border-yellow-400"
                      />
                      <Button
                        onClick={saveChildName}
                        className="rounded-2xl bg-gradient-to-r from-yellow-400 to-orange-400 border-0 text-white font-bold px-5 shadow"
                      >
                        حفظ
                      </Button>
                    </div>
                  </div>

                  {/* المميزات */}
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-2xl border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2 mb-3">
                      <Shield className="w-5 h-5 text-blue-600" />
                      <h3 className="font-bold text-blue-800 dark:text-blue-300">المميزات الآمنة</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        "واجهة ملونة ومبسطة",
                        "كلمات من المستوى المبتدئ",
                        "مكافآت بصرية (ستيكرات)",
                        "أصوات مشجعة",
                        "بدون إعلانات",
                        "محتوى آمن للأطفال",
                      ].map((item) => (
                        <div key={item} className="flex items-center gap-1.5 text-sm text-blue-700 dark:text-blue-300">
                          <span>✅</span>
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* ── تقرير الوالدين ── */}
        <Card className="overflow-hidden shadow-md mb-5 border border-border">
          <div className="h-3 bg-gradient-to-r from-blue-400 to-purple-500" />
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-5 h-5 text-blue-500" />
              <h2 className="font-bold text-lg">تقرير الوالدين</h2>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { value: progress?.words_learned || 0,  label: "📖 كلمة محفوظة",   color: "text-green-600"  },
                { value: progress?.current_level  || 1, label: "🎓 المستوى",         color: "text-blue-600"   },
                { value: progress?.quiz_streak    || 0, label: "🔥 سلسلة النجاح",   color: "text-orange-600" },
                { value: progress?.total_xp       || 0, label: "⭐ النجوم",          color: "text-purple-600" },
              ].map(({ value, label, color }) => (
                <div key={label} className="bg-muted/40 p-4 rounded-2xl text-center">
                  <div className={`text-3xl font-bold ${color}`}>{value}</div>
                  <div className="text-xs text-foreground/60 mt-1">{label}</div>
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 bg-green-50 dark:bg-green-950/20 rounded-2xl border border-green-200 dark:border-green-800">
              <p className="text-sm text-green-700 dark:text-green-300">
                💡 <strong>نصيحة:</strong> شجع طفلك على التعلم 10-15 دقيقة يومياً للحصول على أفضل النتائج.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* ── الأنشطة الممتعة (تظهر دائماً) ── */}
        <div>
          <h2 className="text-xl font-bold mb-4 text-center">
            {kidsModeEnabled ? "🎮 أنشطة ممتعة" : "🎮 استكشف الأنشطة"}
          </h2>

          {!kidsModeEnabled && (
            <p className="text-center text-sm text-foreground/50 mb-4">
              فعّل وضع الأطفال أعلاه للحصول على تجربة مخصصة
            </p>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {ACTIVITIES.map((act, i) => (
              <motion.div
                key={act.route}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
              >
                <Link to={createPageUrl(act.route)}>
                  <Card className={`cursor-pointer overflow-hidden border-2 ${act.border} h-full`}>
                    <div className={`h-2 bg-gradient-to-r ${act.from} ${act.to}`} />
                    <CardContent className="p-4 text-center">
                      <div className="text-5xl mb-2">{act.emoji}</div>
                      <h3 className={`font-bold text-base ${act.text}`}>{act.label}</h3>
                      <p className={`text-xs mt-1 ${act.subText}`}>{act.sub}</p>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

      </motion.div>
    </div>
  );
}
