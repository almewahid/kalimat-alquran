import React, { useState, useEffect } from "react";
import { supabaseClient } from "@/components/api/supabaseClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Loader2, Trophy, Trash2, Play, ArrowLeft, ArrowRight, Image as ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import IconPicker from "../components/custompath/IconPicker";

const SURAHS = [
  "الفاتحة", "البقرة", "آل عمران", "النساء", "المائدة", "الأنعام", "الأعراف", "الأنفال", "التوبة", "يونس",
  "هود", "يوسف", "الرعد", "إبراهيم", "الحجر", "النحل", "الإسراء", "الكهف", "مريم", "طه",
  "الأنبياء", "الحج", "المؤمنون", "النور", "الفرقان", "الشعراء", "النمل", "القصص", "العنكبوت", "الروم",
  "لقمان", "السجدة", "الأحزاب", "سبأ", "فاطر", "يس", "الصافات", "ص", "الزمر", "غافر",
  "فصلت", "الشورى", "الزخرف", "الدخان", "الجاثية", "الأحقاف", "محمد", "الفتح", "الحجرات", "ق",
  "الذاريات", "الطور", "النجم", "القمر", "الرحمن", "الواقعة", "الحديد", "المجادلة", "الحشر", "الممتحنة",
  "الصف", "الجمعة", "المنافقون", "التغابن", "الطلاق", "التحريم", "الملك", "القلم", "الحاقة", "المعارج",
  "نوح", "الجن", "المزمل", "المدثر", "القيامة", "الإنسان", "المرسلات", "النبأ", "النازعات", "عبس",
  "التكوير", "الانفطار", "المطففين", "الانشقاق", "البروج", "الطارق", "الأعلى", "الغاشية", "الفجر", "البلد",
  "الشمس", "الليل", "الضحى", "الشرح", "التين", "العلق", "القدر", "البينة", "الزلزلة", "العاديات",
  "القارعة", "التكاثر", "العصر", "الهمزة", "الفيل", "قريش", "الماعون", "الكوثر", "الكافرون", "النصر",
  "المسد", "الإخلاص", "الفلق", "الناس"
];

const CATEGORIES = ["أسماء", "أفعال", "صفات", "حروف", "أخرى"];

const DIFFICULTY_CONFIG = {
  "مبتدئ": { bar: "from-green-400 to-emerald-500",  badge: "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400",  stars: "⭐"     },
  "متوسط": { bar: "from-amber-400 to-yellow-500",   badge: "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",   stars: "⭐⭐"   },
  "متقدم": { bar: "from-red-400 to-orange-500",     badge: "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400",           stars: "⭐⭐⭐" },
  "الكل":  { bar: "from-blue-400 to-indigo-500",    badge: "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400",       stars: "✨"     },
};

const SOURCE_LABEL = {
  surahs:   "📖 سور",
  juz:      "📋 أجزاء",
  category: "🏷 تصنيفات",
  words:    "📝 كلمات محددة",
};

const EMPTY_PATH = {
  path_name: "",
  path_description: "",
  difficulty_level: "الكل",
  source_type: "surahs",
  selected_words: [],
  selected_surahs: [],
  selected_juz: [],
  selected_categories: [],
  icon: "📚"
};

export default function CustomLearningPaths() {
  const { toast } = useToast();
  const [user, setUser]                 = useState(null);
  const [paths, setPaths]               = useState([]);
  const [isLoading, setIsLoading]       = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating]     = useState(false);
  const [allWords, setAllWords]         = useState([]);
  const [showIconPicker, setShowIconPicker]   = useState(false);
  const [formStep, setFormStep]         = useState(1);   // ← خطوتا الفورم
  const [surahSearch, setSurahSearch]   = useState("");  // ← بحث السور
  const [newPath, setNewPath]           = useState(EMPTY_PATH);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const currentUser = await supabaseClient.auth.me();
      setUser(currentUser);
      const userPaths = await supabaseClient.entities.CustomLearningPath.filter({
        user_email: currentUser.email
      });
      setPaths(userPaths);
      const words = await supabaseClient.entities.QuranicWord.list();
      setAllWords(words);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateModal = () => {
    setNewPath(EMPTY_PATH);
    setFormStep(1);
    setSurahSearch("");
    setShowCreateModal(true);
  };

  const handleCreatePath = async () => {
    if (!newPath.path_name.trim()) {
      toast({ title: "⚠️ أدخل اسم المسار", variant: "destructive" });
      return;
    }

    let filteredWords = allWords;

    if (newPath.difficulty_level !== "الكل") {
      filteredWords = filteredWords.filter(w => w.difficulty_level === newPath.difficulty_level);
    }

    if (newPath.source_type === "surahs" && newPath.selected_surahs.length > 0) {
      filteredWords = filteredWords.filter(w => newPath.selected_surahs.includes(w.surah_name));
    } else if (newPath.source_type === "juz" && newPath.selected_juz.length > 0) {
      filteredWords = filteredWords.filter(w => newPath.selected_juz.includes(w.juz_number));
    } else if (newPath.source_type === "category" && newPath.selected_categories.length > 0) {
      filteredWords = filteredWords.filter(w => newPath.selected_categories.includes(w.category));
    } else if (newPath.source_type === "words") {
      filteredWords = filteredWords.filter(w => newPath.selected_words.includes(w.id));
    }

    if (filteredWords.length === 0) {
      toast({ title: "⚠️ لا توجد كلمات مطابقة للمعايير", variant: "destructive" });
      return;
    }

    setIsCreating(true);
    try {
      await supabaseClient.entities.CustomLearningPath.create({
        user_email: user.email,
        ...newPath,
        selected_words:    newPath.source_type === "words" ? newPath.selected_words : filteredWords.map(w => w.id),
        total_words_count: filteredWords.length,
        created_date:      new Date().toISOString(),
        last_accessed:     new Date().toISOString()
      });

      toast({ title: "✅ تم إنشاء المسار المخصص!" });
      setShowCreateModal(false);
      loadData();
    } catch (error) {
      console.error(error);
      toast({ title: "❌ فشل الإنشاء", variant: "destructive" });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeletePath = async (pathId) => {
    if (!confirm("هل تريد حذف هذا المسار؟")) return;
    try {
      await supabaseClient.entities.CustomLearningPath.delete(pathId);
      toast({ title: "✅ تم حذف المسار" });
      loadData();
    } catch (error) {
      toast({ title: "❌ فشل الحذف", variant: "destructive" });
    }
  };

  const toggleSelection = (type, value) => {
    setNewPath(prev => {
      const key     = type === "surah" ? "selected_surahs" : type === "juz" ? "selected_juz" : "selected_categories";
      const current = prev[key];
      const updated = current.includes(value) ? current.filter(v => v !== value) : [...current, value];
      return { ...prev, [key]: updated };
    });
  };

  const filteredSurahs = SURAHS.filter(s => s.includes(surahSearch.trim()));

  if (isLoading) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="text-foreground/60 text-lg">جارٍ تحميل مساراتك...</p>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>

        {/* ── الهيدر ── */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">🗺️</div>
          <h1 className="text-3xl font-bold gradient-text mb-1">مساراتي المخصصة</h1>
          <p className="text-foreground/60 text-sm">ابنِ مسارك الخاص واحفظ القرآن بطريقتك</p>
        </div>

        {/* ── الحالة الفارغة ── */}
        {paths.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-16 text-center gap-5"
          >
            <div className="text-7xl">🌟</div>
            <div>
              <p className="text-xl font-bold text-foreground mb-1">لا توجد مسارات بعد!</p>
              <p className="text-foreground/50 text-sm">أنشئ مسارك الأول الآن وابدأ رحلتك</p>
            </div>
            <Button
              onClick={openCreateModal}
              className="gap-2 text-base font-bold px-8 py-5 rounded-2xl shadow-lg bg-gradient-to-r from-primary to-primary/80"
            >
              <Plus className="w-5 h-5" />
              إنشاء مساري الأول
            </Button>
          </motion.div>
        ) : (
          <>
            {/* ── زر إضافة مسار (عند وجود مسارات) ── */}
            <div className="flex justify-end mb-5">
              <Button onClick={openCreateModal} className="gap-2 font-bold rounded-2xl px-5 py-4 shadow">
                <Plus className="w-5 h-5" />
                مسار جديد
              </Button>
            </div>

            {/* ── شبكة البطاقات ── */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {paths.map((path, index) => {
                const diff = DIFFICULTY_CONFIG[path.difficulty_level] || DIFFICULTY_CONFIG["الكل"];
                const progress = path.progress_percentage || 0;

                return (
                  <motion.div
                    key={path.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.08 }}
                  >
                    <Card className="overflow-hidden shadow-md hover:shadow-lg transition-all h-full flex flex-col border border-border">

                      {/* شريط اللون العلوي */}
                      <div className={`h-3 bg-gradient-to-r ${diff.bar} flex-shrink-0`} />

                      <CardContent className="p-4 flex flex-col flex-1 gap-3">

                        {/* الرأس: الأيقونة + الاسم + زر الحذف */}
                        <div className="flex items-start gap-3">
                          <div className="w-14 h-14 rounded-2xl overflow-hidden flex items-center justify-center flex-shrink-0 bg-muted">
                            {path.icon?.startsWith("http") ? (
                              <img src={path.icon} alt={path.path_name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-4xl">{path.icon}</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h2 className="font-bold text-base text-foreground leading-tight line-clamp-2">
                              {path.path_name}
                            </h2>
                            {path.path_description && (
                              <p className="text-xs text-foreground/55 mt-0.5 line-clamp-2">
                                {path.path_description}
                              </p>
                            )}
                          </div>
                          {/* زر الحذف: صغير ومعزول في الركن */}
                          <button
                            onClick={() => handleDeletePath(path.id)}
                            className="text-muted-foreground/40 hover:text-red-500 transition-colors p-1 flex-shrink-0"
                            title="حذف المسار"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* شريط التقدم */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-foreground/60 font-medium">
                            <span>{path.learned_words_count || 0} / {path.total_words_count} كلمة</span>
                            <span className="font-bold text-foreground">{progress.toFixed(0)}%</span>
                          </div>
                          <Progress value={progress} className="h-4 rounded-full" />
                        </div>

                        {/* الـ badges */}
                        <div className="flex flex-wrap gap-1.5">
                          <Badge className={`${diff.badge} border-0 text-xs`}>
                            {diff.stars} {path.difficulty_level}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {SOURCE_LABEL[path.source_type] || path.source_type}
                          </Badge>
                        </div>

                        {/* الأزرار الرئيسية */}
                        <div className="mt-auto flex flex-col gap-2">
                          <Link to={createPageUrl(`CustomPathLearn?pathId=${path.id}`)}>
                            <Button className={`w-full gap-2 bg-gradient-to-r ${diff.bar} border-0 text-white font-bold text-sm py-4 rounded-2xl shadow`}>
                              <Play className="w-4 h-4" />
                              ابدأ التعلم
                            </Button>
                          </Link>
                          <Link to={createPageUrl(`CreateChallengeFromPath?pathId=${path.id}`)}>
                            <Button variant="outline" className="w-full gap-2 text-sm py-3 rounded-2xl">
                              <Trophy className="w-4 h-4" />
                              أنشئ تحدياً من هذا المسار
                            </Button>
                          </Link>
                        </div>

                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}

        {/* ══════════════════════════════════════
            نافذة الإنشاء — معالج خطوتين
        ══════════════════════════════════════ */}
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">إنشاء مسار مخصص</DialogTitle>
            </DialogHeader>

            {/* ── مؤشر الخطوات ── */}
            <div className="flex items-center gap-2 py-2">
              <div className={`flex-1 h-2 rounded-full transition-all ${formStep >= 1 ? "bg-primary" : "bg-muted"}`} />
              <div className={`flex-1 h-2 rounded-full transition-all ${formStep >= 2 ? "bg-primary" : "bg-muted"}`} />
            </div>
            <p className="text-xs text-center text-foreground/50 -mt-1 mb-2">
              {formStep === 1 ? "الخطوة 1 من 2 — اسم المسار وأيقونته" : "الخطوة 2 من 2 — محتوى المسار"}
            </p>

            <AnimatePresence mode="wait">

              {/* ── الخطوة 1: الاسم + الوصف + الأيقونة ── */}
              {formStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div>
                    <Label className="text-sm font-semibold">اسم المسار *</Label>
                    <Input
                      className="mt-1.5 rounded-xl"
                      value={newPath.path_name}
                      onChange={(e) => setNewPath({ ...newPath, path_name: e.target.value })}
                      placeholder="مثال: مسار جزء عم"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-semibold">وصف مختصر (اختياري)</Label>
                    <Textarea
                      className="mt-1.5 rounded-xl resize-none"
                      value={newPath.path_description}
                      onChange={(e) => setNewPath({ ...newPath, path_description: e.target.value })}
                      placeholder="اكتب وصفاً قصيراً..."
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-semibold">أيقونة المسار</Label>
                    <div className="flex items-center gap-3 mt-1.5">
                      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
                        {newPath.icon?.startsWith("http") ? (
                          <img src={newPath.icon} alt="icon" className="w-full h-full object-cover rounded-2xl" />
                        ) : (
                          <span className="text-4xl">{newPath.icon}</span>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowIconPicker(true)}
                        className="gap-2 rounded-xl"
                      >
                        <ImageIcon className="w-4 h-4" />
                        تغيير الأيقونة
                      </Button>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={() => {
                        if (!newPath.path_name.trim()) {
                          toast({ title: "⚠️ أدخل اسم المسار أولاً", variant: "destructive" });
                          return;
                        }
                        setFormStep(2);
                      }}
                      className="flex-1 gap-2 rounded-2xl py-4 font-bold"
                    >
                      التالي
                      <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <Button onClick={() => setShowCreateModal(false)} variant="outline" className="rounded-2xl px-5">
                      إلغاء
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* ── الخطوة 2: الصعوبة + المصدر ── */}
              {formStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div>
                    <Label className="text-sm font-semibold">مستوى الصعوبة</Label>
                    <Select
                      value={newPath.difficulty_level}
                      onValueChange={(v) => setNewPath({ ...newPath, difficulty_level: v })}
                    >
                      <SelectTrigger className="mt-1.5 rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="الكل">✨ الكل</SelectItem>
                        <SelectItem value="مبتدئ">⭐ مبتدئ</SelectItem>
                        <SelectItem value="متوسط">⭐⭐ متوسط</SelectItem>
                        <SelectItem value="متقدم">⭐⭐⭐ متقدم</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm font-semibold">اختر المحتوى من</Label>
                    <div className="flex gap-2 mt-1.5 flex-wrap">
                      {[
                        { value: "surahs",   label: "📖 سور"       },
                        { value: "juz",      label: "📋 أجزاء"     },
                        { value: "category", label: "🏷 تصنيفات"   },
                      ].map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => setNewPath({ ...newPath, source_type: opt.value })}
                          className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                            newPath.source_type === opt.value
                              ? "bg-primary text-primary-foreground border-primary shadow"
                              : "border-border text-foreground/70 hover:border-primary/50"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* ── اختيار السور مع بحث ── */}
                  {newPath.source_type === "surahs" && (
                    <div>
                      <Label className="text-sm font-semibold">
                        اختر السور
                        {newPath.selected_surahs.length > 0 && (
                          <span className="mr-2 text-xs text-primary font-normal">({newPath.selected_surahs.length} مختارة)</span>
                        )}
                      </Label>
                      <Input
                        className="mt-1.5 mb-2 rounded-xl text-sm"
                        placeholder="ابحث عن سورة..."
                        value={surahSearch}
                        onChange={(e) => setSurahSearch(e.target.value)}
                      />
                      <div className="grid grid-cols-3 gap-1.5 max-h-44 overflow-y-auto border rounded-xl p-2 bg-muted/30">
                        {filteredSurahs.map((surah, idx) => {
                          const selected = newPath.selected_surahs.includes(surah);
                          return (
                            <button
                              key={surah}
                              onClick={() => toggleSelection("surah", surah)}
                              className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-all truncate ${
                                selected
                                  ? "bg-primary text-primary-foreground shadow-sm"
                                  : "bg-background border border-border text-foreground/70 hover:border-primary/50"
                              }`}
                            >
                              {SURAHS.indexOf(surah) + 1}. {surah}
                            </button>
                          );
                        })}
                        {filteredSurahs.length === 0 && (
                          <p className="col-span-3 text-center text-xs text-foreground/40 py-4">لا توجد نتائج</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ── اختيار الأجزاء ── */}
                  {newPath.source_type === "juz" && (
                    <div>
                      <Label className="text-sm font-semibold">
                        اختر الأجزاء
                        {newPath.selected_juz.length > 0 && (
                          <span className="mr-2 text-xs text-primary font-normal">({newPath.selected_juz.length} مختارة)</span>
                        )}
                      </Label>
                      <div className="grid grid-cols-6 gap-1.5 mt-1.5">
                        {Array.from({ length: 30 }, (_, i) => i + 1).map(juz => {
                          const selected = newPath.selected_juz.includes(juz);
                          return (
                            <button
                              key={juz}
                              onClick={() => toggleSelection("juz", juz)}
                              className={`h-9 rounded-xl text-sm font-bold transition-all ${
                                selected
                                  ? "bg-primary text-primary-foreground shadow-sm"
                                  : "bg-muted text-foreground/70 hover:bg-muted/70"
                              }`}
                            >
                              {juz}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* ── اختيار التصنيفات ── */}
                  {newPath.source_type === "category" && (
                    <div>
                      <Label className="text-sm font-semibold">اختر التصنيفات</Label>
                      <div className="flex flex-wrap gap-2 mt-1.5">
                        {CATEGORIES.map(cat => {
                          const selected = newPath.selected_categories.includes(cat);
                          return (
                            <button
                              key={cat}
                              onClick={() => toggleSelection("category", cat)}
                              className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                                selected
                                  ? "bg-primary text-primary-foreground border-primary shadow"
                                  : "border-border text-foreground/70 hover:border-primary/50"
                              }`}
                            >
                              {cat}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={handleCreatePath}
                      disabled={isCreating}
                      className="flex-1 gap-2 rounded-2xl py-4 font-bold bg-gradient-to-r from-primary to-primary/80"
                    >
                      {isCreating ? (
                        <><Loader2 className="w-4 h-4 animate-spin" />جارٍ الإنشاء...</>
                      ) : (
                        <><Plus className="w-4 h-4" />إنشاء المسار</>
                      )}
                    </Button>
                    <Button
                      onClick={() => setFormStep(1)}
                      variant="outline"
                      className="gap-1 rounded-2xl px-4"
                    >
                      <ArrowRight className="w-4 h-4" />
                      السابق
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </DialogContent>
        </Dialog>

        <IconPicker
          currentIcon={newPath.icon}
          onSelect={(icon) => setNewPath({ ...newPath, icon })}
          isOpen={showIconPicker}
          onClose={() => setShowIconPicker(false)}
        />
      </motion.div>
    </div>
  );
}
