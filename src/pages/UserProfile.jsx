import React, { useState, useEffect } from "react";
import { supabaseClient } from "@/components/api/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, MapPin, Phone, Building2, Save, Award, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import ShareButton from "@/components/common/ShareButton";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";

const createPageUrl = (pageName) => `/${pageName}`;

const AVATAR_COLORS = [
  "bg-blue-100 text-blue-600",
  "bg-purple-100 text-purple-600",
  "bg-green-100 text-green-600",
  "bg-amber-100 text-amber-600",
  "bg-pink-100 text-pink-600",
];

function getAvatarColor(name = "") {
  const code = name.charCodeAt(0) || 0;
  return AVATAR_COLORS[code % AVATAR_COLORS.length];
}

const STATS = [
  { key: "words_learned",          emoji: "📚", label: "كلمة تعلّمتها",  color: "bg-blue-50 border-blue-200"   },
  { key: "quiz_streak",            emoji: "🔥", label: "اختبار متتالي", color: "bg-orange-50 border-orange-200" },
  { key: "consecutive_login_days", emoji: "📅", label: "يوم متتالي",    color: "bg-green-50 border-green-200"  },
];

export default function UserProfile() {
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [userProgress, setUserProgress] = useState(null);
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [profileForm, setProfileForm] = useState({
    phone: "",
    country: "",
    affiliation: "",
    affiliation_type: "individual",
  });

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const currentUser = await supabaseClient.auth.me();
      setUser(currentUser);
      setProfileForm({
        phone: currentUser.phone || "",
        country: currentUser.country || "",
        affiliation: currentUser.affiliation || "",
        affiliation_type: currentUser.affiliation_type || "individual",
      });

      const [progressData] = await supabaseClient.entities.UserProgress.filter({
        user_email: currentUser.email,
      });
      setUserProgress(progressData);

      const certs = await supabaseClient.entities.Certificate.filter({
        user_email: currentUser.email,
      });
      setCertificates(certs);
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      await supabaseClient.auth.updateMe(profileForm);
      toast({ title: "✅ تم حفظ البيانات!" });
      setIsEditing(false);
      setUser((prev) => ({ ...prev, ...profileForm }));
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({ title: "❌ حدث خطأ أثناء الحفظ", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 1.6 }}
          className="text-6xl"
        >
          👤
        </motion.div>
        <p className="text-lg font-semibold text-muted-foreground">جاري تحميل ملفك الشخصي...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6 text-center">
        <p className="text-lg">يرجى تسجيل الدخول أولاً</p>
      </div>
    );
  }

  const avatarColor = getAvatarColor(user.full_name);
  const avatarLetter = user.full_name?.charAt(0) || "؟";
  const level = userProgress?.current_level || 1;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">

        {/* Profile Card */}
        <Card className="rounded-2xl border-2 overflow-hidden">
          <div className="bg-gradient-to-l from-primary/10 to-primary/5 p-6">
            <div className="flex flex-col sm:flex-row items-center gap-5">

              {/* Avatar */}
              <div className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl font-bold flex-shrink-0 ${avatarColor} ring-4 ring-white shadow-md`}>
                {avatarLetter}
              </div>

              {/* Info */}
              <div className="flex-1 text-center sm:text-right">
                <h1 className="text-2xl font-bold text-foreground mb-1">
                  {user.full_name}
                </h1>
                {/* Level badge */}
                <div className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-sm font-bold mb-2">
                  ⭐ المستوى {level}
                </div>

                {/* Location / Affiliation chips */}
                <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                  {user.country && (
                    <span className="text-xs bg-white/80 border rounded-full px-3 py-1 text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {user.country}
                    </span>
                  )}
                  {user.affiliation && (
                    <span className="text-xs bg-white/80 border rounded-full px-3 py-1 text-muted-foreground flex items-center gap-1">
                      <Building2 className="w-3 h-3" /> {user.affiliation}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2 flex-shrink-0">
                <Button
                  variant="outline"
                  className="rounded-2xl font-bold gap-2"
                  onClick={() => setIsEditing((v) => !v)}
                >
                  {isEditing ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  {isEditing ? "إخفاء" : "تعديل بياناتي"}
                </Button>
                <ShareButton
                  title="إحصائياتي في كلمات القرآن"
                  text={`تعلّمت ${userProgress?.words_learned || 0} كلمة ووصلت للمستوى ${level}!`}
                />
              </div>
            </div>
          </div>

          {/* Edit Form */}
          <AnimatePresence>
            {isEditing && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="p-5 border-t space-y-4">
                  <p className="text-sm font-semibold text-muted-foreground">✏️ عدّل بياناتك</p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-sm font-semibold">رقم الهاتف</Label>
                      <div className="relative">
                        <Phone className="absolute right-3 top-3 w-4 h-4 text-muted-foreground" />
                        <Input
                          className="pr-9 rounded-xl"
                          value={profileForm.phone}
                          onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                          placeholder="رقم الهاتف"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-semibold">البلد</Label>
                      <div className="relative">
                        <MapPin className="absolute right-3 top-3 w-4 h-4 text-muted-foreground" />
                        <Input
                          className="pr-9 rounded-xl"
                          value={profileForm.country}
                          onChange={(e) => setProfileForm({ ...profileForm, country: e.target.value })}
                          placeholder="البلد"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-semibold">نوع الانتساب</Label>
                      <Select
                        value={profileForm.affiliation_type}
                        onValueChange={(v) => setProfileForm({ ...profileForm, affiliation_type: v })}
                      >
                        <SelectTrigger className="rounded-xl">
                          <SelectValue placeholder="اختر النوع" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="individual">فردي</SelectItem>
                          <SelectItem value="nursery">حضانة</SelectItem>
                          <SelectItem value="school">مدرسة</SelectItem>
                          <SelectItem value="association">جمعية تحفيظ</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-semibold">اسم الجهة</Label>
                      <div className="relative">
                        <Building2 className="absolute right-3 top-3 w-4 h-4 text-muted-foreground" />
                        <Input
                          className="pr-9 rounded-xl"
                          value={profileForm.affiliation}
                          onChange={(e) => setProfileForm({ ...profileForm, affiliation: e.target.value })}
                          placeholder="اسم الجهة (إن وجدت)"
                          disabled={profileForm.affiliation_type === "individual"}
                        />
                      </div>
                    </div>
                  </div>
                  <Button className="rounded-2xl font-bold gap-2" onClick={handleUpdateProfile}>
                    <Save className="w-4 h-4" /> احفظ التغييرات
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {STATS.map((stat) => (
            <Card key={stat.key} className={`rounded-2xl border-2 text-center ${stat.color}`}>
              <CardContent className="p-4">
                <div className="text-3xl mb-1">{stat.emoji}</div>
                <div className="text-2xl font-bold text-foreground">
                  {userProgress?.[stat.key] || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Certificates */}
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
            <Award className="w-6 h-6 text-amber-500" />
            شهاداتي وإنجازاتي
          </h2>

          {certificates.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12 flex flex-col items-center gap-3"
            >
              <span className="text-7xl">🎓</span>
              <p className="text-lg font-bold text-foreground/70">ما حصلت على شهادة بعد</p>
              <p className="text-sm text-muted-foreground">أكمل دورة لتحصل على شهادتك الأولى! 🌟</p>
              <Link to={createPageUrl("Courses")}>
                <Button className="rounded-2xl font-bold px-6 mt-1 gap-2">
                  تصفّح الدورات 📖
                </Button>
              </Link>
            </motion.div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {certificates.map((cert) => (
                <Card key={cert.id} className="rounded-2xl border-2 border-amber-200 bg-amber-50 hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      🏅 {cert.course_title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground mb-3">
                      📅 {new Date(cert.issue_date).toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" })}
                    </p>
                    <Button variant="outline" className="w-full rounded-xl font-bold" asChild>
                      <Link to={`/CertificateView?id=${cert.id}`} target="_blank">
                        عرض الشهادة 👀
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

    </div>
  );
}
