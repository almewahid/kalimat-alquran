import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Baby, Star, Trophy, Heart, Sparkles, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function KidsMode() {
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [kidsModeEnabled, setKidsModeEnabled] = useState(false);
  const [childName, setChildName] = useState("");
  const [progress, setProgress] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      setKidsModeEnabled(currentUser.preferences?.kids_mode_enabled || false);
      setChildName(currentUser.preferences?.child_name || "");

      const [userProgress] = await base44.entities.UserProgress.filter({ 
        created_by: currentUser.email 
      });
      setProgress(userProgress);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleKidsMode = async (enabled) => {
    try {
      await base44.auth.updateMe({
        preferences: {
          ...user.preferences,
          kids_mode_enabled: enabled,
          learning_level: enabled ? "مبتدئ" : (user.preferences?.learning_level || "all")
        }
      });
      setKidsModeEnabled(enabled);
      toast({
        title: enabled ? "🎉 تم تفعيل وضع الأطفال!" : "تم إيقاف وضع الأطفال",
        description: enabled 
          ? "الآن التطبيق مناسب للأطفال مع واجهة ملونة وممتعة!"
          : "تم العودة للوضع العادي",
        className: "bg-green-100 text-green-800"
      });
    } catch (error) {
      console.error("Error toggling kids mode:", error);
      toast({
        title: "خطأ",
        description: "فشل في تحديث الإعدادات",
        variant: "destructive"
      });
    }
  };

  const saveChildName = async () => {
    try {
      await base44.auth.updateMe({
        preferences: {
          ...user.preferences,
          child_name: childName
        }
      });
      toast({
        title: "✅ تم الحفظ!",
        description: "تم حفظ اسم الطفل",
        className: "bg-green-100 text-green-800"
      });
    } catch (error) {
      console.error("Error saving child name:", error);
    }
  };

  if (isLoading) {
    return <div className="p-6 text-center">جارٍ التحميل...</div>;
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="text-center mb-8">
          <Baby className="w-20 h-20 mx-auto mb-4 text-pink-500" />
          <h1 className="text-4xl font-bold gradient-text mb-2">👶 وضع الأطفال</h1>
          <p className="text-foreground/70 text-lg">واجهة آمنة وممتعة لتعليم الأطفال</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Settings Card */}
          <Card className="bg-gradient-to-br from-yellow-50 to-pink-50 border-yellow-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-500" />
                إعدادات وضع الأطفال
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white rounded-lg">
                <Label htmlFor="kids-mode" className="text-lg">تفعيل وضع الأطفال</Label>
                <Switch
                  id="kids-mode"
                  checked={kidsModeEnabled}
                  onCheckedChange={toggleKidsMode}
                />
              </div>

              {kidsModeEnabled && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3"
                >
                  <div>
                    <Label htmlFor="child-name">اسم الطفل</Label>
                    <div className="flex gap-2">
                      <input
                        id="child-name"
                        type="text"
                        value={childName}
                        onChange={(e) => setChildName(e.target.value)}
                        placeholder="أدخل اسم الطفل"
                        className="flex-1 px-4 py-2 border-2 border-yellow-200 rounded-lg"
                      />
                      <Button onClick={saveChildName} className="bg-yellow-500 hover:bg-yellow-600">
                        حفظ
                      </Button>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-5 h-5 text-blue-600" />
                      <h3 className="font-bold text-blue-800">المميزات الآمنة:</h3>
                    </div>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>✅ واجهة ملونة ومبسطة</li>
                      <li>✅ كلمات من المستوى المبتدئ فقط</li>
                      <li>✅ مكافآت بصرية (ستيكرات)</li>
                      <li>✅ أصوات مشجعة</li>
                      <li>✅ بدون إعلانات</li>
                    </ul>
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>

          {/* Progress Card for Parents */}
          <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-blue-500" />
                تقرير الوالدين
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold text-green-600">{progress?.words_learned || 0}</div>
                  <div className="text-sm text-foreground/70">كلمة محفوظة</div>
                </div>
                <div className="bg-white p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold text-blue-600">{progress?.current_level || 1}</div>
                  <div className="text-sm text-foreground/70">المستوى</div>
                </div>
                <div className="bg-white p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold text-orange-600">{progress?.quiz_streak || 0}</div>
                  <div className="text-sm text-foreground/70">سلسلة نجاح</div>
                </div>
                <div className="bg-white p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold text-purple-600">{progress?.total_xp || 0}</div>
                  <div className="text-sm text-foreground/70">نقطة خبرة</div>
                </div>
              </div>

              <div className="p-4 bg-green-50 rounded-lg border-2 border-green-200">
                <p className="text-sm text-green-700">
                  💡 <strong>نصيحة:</strong> شجع طفلك على التعلم 10-15 دقيقة يومياً للحصول على أفضل النتائج.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Activities */}
        {kidsModeEnabled && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-2xl font-bold mb-4 text-center">🎮 أنشطة ممتعة</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <Link to={createPageUrl("Learn")}>
                <Card className="hover:shadow-lg transition-all cursor-pointer bg-gradient-to-br from-green-100 to-emerald-100 border-green-300">
                  <CardContent className="p-6 text-center">
                    <div className="text-6xl mb-3">📚</div>
                    <h3 className="text-xl font-bold text-green-700">تعلم كلمات جديدة</h3>
                    <p className="text-sm text-green-600 mt-2">كلمات سهلة وممتعة</p>
                  </CardContent>
                </Card>
              </Link>

              <Link to={createPageUrl("Quiz")}>
                <Card className="hover:shadow-lg transition-all cursor-pointer bg-gradient-to-br from-blue-100 to-cyan-100 border-blue-300">
                  <CardContent className="p-6 text-center">
                    <div className="text-6xl mb-3">🎯</div>
                    <h3 className="text-xl font-bold text-blue-700">اختبر نفسك</h3>
                    <p className="text-sm text-blue-600 mt-2">ألعاب مسلية</p>
                  </CardContent>
                </Card>
              </Link>

              <Link to={createPageUrl("Achievements")}>
                <Card className="hover:shadow-lg transition-all cursor-pointer bg-gradient-to-br from-yellow-100 to-orange-100 border-yellow-300">
                  <CardContent className="p-6 text-center">
                    <div className="text-6xl mb-3">🏆</div>
                    <h3 className="text-xl font-bold text-orange-700">شاراتي</h3>
                    <p className="text-sm text-orange-600 mt-2">جمع الجوائز</p>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}