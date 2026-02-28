import React, { useState, useEffect } from "react";
import { supabaseClient } from "@/components/api/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Users, UserPlus, BookOpen, HelpCircle, Crown, Copy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";


const TYPE_CONFIG = {
  general:   { label: "عامة",  emoji: "🌐", gradient: "from-blue-400 to-cyan-400",    bg: "bg-blue-50 dark:bg-blue-950/20"   },
  study:     { label: "دراسة", emoji: "📚", gradient: "from-green-400 to-emerald-400", bg: "bg-green-50 dark:bg-green-950/20" },
  challenge: { label: "تحدي",  emoji: "⚔️", gradient: "from-red-400 to-pink-400",     bg: "bg-red-50 dark:bg-red-950/20"    },
};
const getType = (type) => TYPE_CONFIG[type] || TYPE_CONFIG.general;

export default function KidsMode() {
  const { toast } = useToast();
  const navigate  = useNavigate();
  const { user: authUser, setPreferences } = useAuth();
  const [user, setUser]                       = useState(null);
  const [kidsModeEnabled, setKidsModeEnabled] = useState(false);
  const [childName, setChildName]             = useState("");
  const [userGroups, setUserGroups]           = useState([]);
  const [isLoading, setIsLoading]             = useState(true);
  // ── حوار الانضمام لمجموعة ──
  const [showJoinDialog, setShowJoinDialog]   = useState(false);
  const [groupCode, setGroupCode]             = useState("");
  const [isJoining, setIsJoining]             = useState(false);

  useEffect(() => {
    if (authUser) {
      loadData();
    } else {
      setIsLoading(false);
    }
  }, [authUser]);

  const loadData = async () => {
    try {
      const currentUser = authUser;

      if (currentUser) {
        const { data: profile } = await supabaseClient.supabase
          .from("user_profiles")
          .select("preferences, email")
          .eq("user_id", currentUser.id)
          .single();

        setUser({ ...currentUser, preferences: profile?.preferences });
        setKidsModeEnabled(profile?.preferences?.kids_mode_enabled || false);
        setChildName(profile?.preferences?.child_name || "");

        // تحميل المجموعات المنضم إليها
        const userEmail = currentUser.email || profile?.email;
        if (userEmail) {
          const { data: allGroups } = await supabaseClient.supabase
            .from("groups")
            .select("id, name, description, type, leader_email, join_code, members");
          const joined = (allGroups || []).filter(g =>
            g.leader_email === userEmail ||
            (Array.isArray(g.members) && g.members.includes(userEmail))
          );
          setUserGroups(joined);
        }
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleKidsMode = async (enabled) => {
    try {
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

      setKidsModeEnabled(enabled);
      setUser({ ...user, preferences: newPreferences });
      setPreferences(newPreferences); // ← يُحدّث AuthContext فوراً → Layout يعيد الرسم

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

  // ── الانضمام لمجموعة عبر الكود — يُفعّل المسابقة تلقائياً ──
  const handleJoinGroup = async () => {
    if (!groupCode.trim()) return;
    setIsJoining(true);
    try {
      // تحميل كل المجموعات والبحث في الذاكرة (نفس نهج Groups.jsx)
      const code = groupCode.trim().toUpperCase();

      const { data: allGroupsData, error: groupError } = await supabaseClient.supabase
        .from('groups')
        .select('*');

      if (groupError) throw groupError;

      const group = allGroupsData?.find(
        g => g.join_code?.toUpperCase() === code
      );

      if (!group) {
        toast({ title: "كود غير صحيح", description: "لم يتم العثور على مجموعة بهذا الكود", variant: "destructive" });
        return;
      }

      // التحقق إذا كان منضماً مسبقاً
      const alreadyMember = group.members?.includes(authUser.email);
      if (alreadyMember) {
        toast({ title: "ℹ️ انضممت لهذه المجموعة مسبقاً", description: `أنت عضو في مجموعة "${group.name}"` });
        setShowJoinDialog(false);
        setGroupCode("");
        return;
      }

      // إضافة العضو في مصفوفة members
      const updatedMembers = [...(group.members || []), authUser.email];
      const { data: updatedRows, error: updateError } = await supabaseClient.supabase
        .from("groups")
        .update({ members: updatedMembers })
        .eq("id", group.id)
        .select("id");
      if (updateError) throw updateError;
      if (!updatedRows || updatedRows.length === 0) {
        throw new Error("لم يتم الحفظ في قاعدة البيانات — تحقق من صلاحيات Supabase (RLS UPDATE policy)");
      }

      // تفعيل المسابقة تلقائياً إذا كانت المجموعة مرتبطة بمسابقة
      const activeContest = group.contest_name
        ? { name: group.contest_name, group_id: group.id, route: "KidsContest" }
        : null;

      const newPreferences = { ...user.preferences, active_contest: activeContest };
      await supabaseClient.supabase
        .from("user_profiles")
        .update({ preferences: newPreferences })
        .eq("user_id", authUser.id);
      setUser({ ...user, preferences: newPreferences });
      setPreferences(newPreferences);

      setShowJoinDialog(false);
      setGroupCode("");
      toast({
        title:       "✅ تم الانضمام!",
        description: group.contest_name
          ? `تم تفعيل مسابقة "${group.contest_name}" للطفل تلقائياً`
          : `انضممت لمجموعة "${group.name}" بنجاح`,
        className:   "bg-green-100 text-green-800"
      });

      // إعادة تحميل المجموعات لتظهر فوراً
      await loadData();
    } catch (error) {
      console.error("Error joining group:", error);
      toast({ title: "خطأ", description: "فشل الانضمام. تحقق من الكود وحاول مجدداً", variant: "destructive" });
    } finally {
      setIsJoining(false);
    }
  };

  const saveChildName = async () => {
    try {
      const newPreferences = { ...user.preferences, child_name: childName };

      if (authUser) {
        await supabaseClient.supabase
          .from("user_profiles")
          .update({ preferences: newPreferences })
          .eq("user_id", authUser.id);
      }

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
    <>
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
            <div className={`flex items-center justify-between gap-3 p-4 rounded-2xl mb-4 ${kidsModeEnabled ? "bg-green-50 dark:bg-green-950/20" : "bg-muted/40"}`}>
              <div className="flex items-center gap-3 flex-1 min-w-0">
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

                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* ── روابط سريعة ── */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <Link to={createPageUrl("QuranReader")}>
            <Card className="cursor-pointer overflow-hidden border-2 border-teal-300 hover:shadow-md transition-shadow h-full">
              <div className="h-2 bg-gradient-to-r from-teal-400 to-cyan-500" />
              <CardContent className="p-4 text-center">
                <BookOpen className="w-10 h-10 mx-auto mb-2 text-teal-600" />
                <h3 className="font-bold text-sm text-teal-700">قارئ القرآن</h3>
                <p className="text-xs text-teal-600 mt-1">اقرأ وتعلّم</p>
              </CardContent>
            </Card>
          </Link>
          <Link to={createPageUrl("Help")}>
            <Card className="cursor-pointer overflow-hidden border-2 border-violet-300 hover:shadow-md transition-shadow h-full">
              <div className="h-2 bg-gradient-to-r from-violet-400 to-purple-500" />
              <CardContent className="p-4 text-center">
                <HelpCircle className="w-10 h-10 mx-auto mb-2 text-violet-600" />
                <h3 className="font-bold text-sm text-violet-700">المساعدة</h3>
                <p className="text-xs text-violet-600 mt-1">كيفية الاستخدام</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* ── مجموعاتي ── */}
        {kidsModeEnabled && userGroups.length > 0 && (
          <div className="mb-5">
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-500" />
              مجموعاتي
              <Badge variant="secondary">{userGroups.length}</Badge>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {userGroups.map((group, index) => {
                const cfg = getType(group.type);
                const isLeader = group.leader_email === user?.email;
                return (
                  <motion.div key={group.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
                    <Card className={`overflow-hidden ${cfg.bg} hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}>
                      <div className={`h-4 bg-gradient-to-r ${cfg.gradient}`} />
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${cfg.gradient} flex items-center justify-center shadow-lg flex-shrink-0`}>
                            <span className="text-white text-xl font-bold">{group.name?.charAt(0) || "م"}</span>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            {isLeader && (
                              <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 text-xs">
                                <Crown className="w-3 h-3 ml-1" /> رئيس
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-xs">{cfg.emoji} {cfg.label}</Badge>
                          </div>
                        </div>

                        <h3 className="font-bold text-base mb-1">{group.name}</h3>
                        {group.description && (
                          <p className="text-sm text-foreground/60 mb-2 line-clamp-2">{group.description}</p>
                        )}
                        <div className="flex items-center gap-1 text-sm text-foreground/60 mb-3">
                          <Users className="w-4 h-4" />
                          <span>{group.members?.length || 0} عضو</span>
                        </div>

                        {isLeader && group.join_code && (
                          <div
                            className="flex items-center justify-between bg-muted/60 rounded-xl px-3 py-2 mb-3 cursor-pointer hover:bg-muted transition-colors"
                            onClick={() => {
                              navigator.clipboard.writeText(group.join_code);
                              toast({ title: "✅ تم نسخ الكود", description: group.join_code, className: "bg-green-100 text-green-800" });
                            }}
                          >
                            <span className="text-xs text-foreground/50">كود الانضمام</span>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-sm tracking-widest">{group.join_code}</span>
                              <Copy className="w-3.5 h-3.5 text-foreground/40" />
                            </div>
                          </div>
                        )}

                        <Link to={createPageUrl(`GroupDetail?id=${group.id}`)}>
                          <Button className={`w-full bg-gradient-to-r ${cfg.gradient} text-white border-0 hover:opacity-90`}>
                            ادخل المجموعة ←
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── قسم وليّ الأمر: الأصدقاء والمسابقات ── */}
        {kidsModeEnabled && (
          <Card className="overflow-hidden shadow-md border border-border">
            <div className="h-3 bg-gradient-to-r from-indigo-400 to-purple-500" />
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-indigo-500" />
                <h2 className="font-bold text-lg">👥 الأصدقاء والمسابقات</h2>
              </div>
              {/* المسابقة الحالية */}
              {user?.preferences?.active_contest ? (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-2xl border border-amber-200 dark:border-amber-800 mb-3 flex items-center gap-3">
                  <span className="text-2xl">🏆</span>
                  <div className="flex-1">
                    <p className="font-bold text-sm text-amber-800 dark:text-amber-300">
                      {user.preferences.active_contest.name}
                    </p>
                    <p className="text-xs text-amber-600 dark:text-amber-400">المسابقة الحالية للطفل</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs rounded-xl border-amber-300 text-amber-700"
                    onClick={async () => {
                      const newPrefs = { ...user.preferences, active_contest: null };
                      await supabaseClient.supabase.from("user_profiles").update({ preferences: newPrefs }).eq("user_id", authUser.id);
                      setUser({ ...user, preferences: newPrefs });
                      setPreferences(newPrefs); // ← يُحدّث AuthContext → يختفي زر المسابقة من القائمة
                      toast({ title: "تم إلغاء المسابقة", className: "bg-amber-100 text-amber-800" });
                    }}
                  >
                    إلغاء
                  </Button>
                </div>
              ) : (
                <div className="p-3 bg-muted/40 rounded-2xl border border-dashed border-border mb-3 text-center">
                  <p className="text-sm text-foreground/50">لا توجد مسابقة نشطة</p>
                  <p className="text-xs text-foreground/40 mt-1">انضم لمجموعة مسابقة لتفعيلها تلقائياً</p>
                </div>
              )}

              {/* أزرار الأصدقاء */}
              <div className="flex gap-3">
                <Button
                  className="flex-1 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold"
                  onClick={() => setShowJoinDialog(true)}
                >
                  <UserPlus className="w-4 h-4 ml-2" />
                  ➕ انضم لمجموعة
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 rounded-2xl border-2 font-bold"
                  onClick={() => navigate(createPageUrl("ReferralSystem"))}
                >
                  📩 دعوة أصدقاء
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

      </motion.div>
    </div>

    {/* ── حوار الانضمام لمجموعة (وليّ الأمر) — خارج div لكن داخل Fragment ── */}
    <Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle>➕ انضم لمجموعة</DialogTitle>
          <DialogDescription>
            أدخل كود المجموعة الذي أرسله لك الأصدقاء. إذا كانت المجموعة مرتبطة بمسابقة، ستُفعَّل تلقائياً للطفل.
          </DialogDescription>
        </DialogHeader>
        <div className="py-2">
          <Input
            value={groupCode}
            onChange={(e) => setGroupCode(e.target.value.toUpperCase())}
            placeholder="مثال: ABC123"
            className="rounded-2xl text-center text-xl font-bold tracking-widest border-2 focus:border-indigo-400"
            maxLength={8}
          />
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" className="rounded-2xl" onClick={() => { setShowJoinDialog(false); setGroupCode(""); }}>
            إلغاء
          </Button>
          <Button
            className="rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold"
            onClick={handleJoinGroup}
            disabled={!groupCode.trim() || isJoining}
          >
            {isJoining ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
            انضم
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}