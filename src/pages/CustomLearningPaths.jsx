import React, { useState, useEffect } from "react";
import { supabaseClient } from "@/components/api/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Map, Plus, Loader2, BookOpen, Trophy, Trash2, Play, TrendingUp, Image as ImageIcon } from "lucide-react";
import { motion } from "framer-motion";
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

export default function CustomLearningPaths() {
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [paths, setPaths] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [allWords, setAllWords] = useState([]);
  const [showIconPicker, setShowIconPicker] = useState(false);
  
  const [newPath, setNewPath] = useState({
    path_name: "",
    path_description: "",
    difficulty_level: "الكل",
    source_type: "surahs",
    selected_words: [],
    selected_surahs: [],
    selected_juz: [],
    selected_categories: [],
    icon: "📚"
  });

  useEffect(() => {
    loadData();
  }, []);

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

  const handleCreatePath = async () => {
    if (!newPath.path_name.trim()) {
      toast({ title: "⚠️ أدخل اسم المسار", variant: "destructive" });
      return;
    }

    // حساب عدد الكلمات
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
        selected_words: newPath.source_type === "words" ? newPath.selected_words : filteredWords.map(w => w.id),
        total_words_count: filteredWords.length,
        created_date: new Date().toISOString(),
        last_accessed: new Date().toISOString()
      });

      toast({ title: "✅ تم إنشاء المسار المخصص" });
      setShowCreateModal(false);
      setNewPath({
        path_name: "",
        path_description: "",
        difficulty_level: "الكل",
        source_type: "surahs",
        selected_words: [],
        selected_surahs: [],
        selected_juz: [],
        selected_categories: [],
        icon: "📚"
      });
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
      const key = type === "surah" ? "selected_surahs" : 
                  type === "juz" ? "selected_juz" : 
                  "selected_categories";
      
      const current = prev[key];
      const updated = current.includes(value) 
        ? current.filter(v => v !== value) 
        : [...current, value];
      
      return { ...prev, [key]: updated };
    });
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2 flex items-center gap-3">
              <Map className="w-8 h-8 text-primary" />
              مساراتي التعليمية المخصصة
            </h1>
            <p className="text-foreground/70">أنشئ مسارات تعليمية مخصصة حسب احتياجاتك</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)} className="gap-2">
            <Plus className="w-5 h-5" />
            مسار جديد
          </Button>
        </div>

        {paths.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Map className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-foreground/70 mb-4">لم تُنشئ أي مسار مخصص بعد</p>
              <Button onClick={() => setShowCreateModal(true)} variant="outline">
                <Plus className="w-4 h-4 ml-2" />
                إنشاء مسار جديد
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paths.map((path, index) => (
              <motion.div
                key={path.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="hover:shadow-lg transition-all h-full">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <div className="w-16 h-16 flex items-center justify-center">
                        {path.icon?.startsWith('http') ? (
                          <img src={path.icon} alt={path.path_name} className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          <span className="text-4xl">{path.icon}</span>
                        )}
                      </div>
                      <Badge variant={path.is_active ? "default" : "secondary"}>
                        {path.is_active ? "نشط" : "متوقف"}
                      </Badge>
                    </div>
                    <CardTitle className="text-xl">{path.path_name}</CardTitle>
                    <p className="text-sm text-foreground/70 line-clamp-2">
                      {path.path_description || "لا يوجد وصف"}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>التقدم</span>
                        <span className="font-bold">{path.progress_percentage?.toFixed(0) || 0}%</span>
                      </div>
                      <Progress value={path.progress_percentage || 0} className="h-2" />
                      <p className="text-xs text-foreground/60 mt-1">
                        {path.learned_words_count || 0} / {path.total_words_count} كلمة
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs">
                      <Badge variant="outline">{path.difficulty_level}</Badge>
                      <Badge variant="secondary">
                        {path.source_type === "surahs" ? "سور" : 
                         path.source_type === "juz" ? "أجزاء" : 
                         path.source_type === "category" ? "تصنيفات" : 
                         path.source_type === "words" ? "كلمات محددة" : "مختلط"}
                      </Badge>
                    </div>

                    <div className="flex gap-2 pt-4 border-t">
                      <Link to={createPageUrl(`CustomPathLearn?pathId=${path.id}`)} className="flex-1">
                        <Button size="sm" className="w-full gap-1">
                          <Play className="w-4 h-4" />
                          ابدأ
                        </Button>
                      </Link>
                      <Link to={createPageUrl(`CreateChallengeFromPath?pathId=${path.id}`)} className="flex-1">
                        <Button size="sm" variant="outline" className="w-full gap-1">
                          <Trophy className="w-4 h-4" />
                          تحدي
                        </Button>
                      </Link>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => handleDeletePath(path.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Create Modal */}
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>إنشاء مسار تعليمي مخصص</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>اسم المسار *</Label>
                <Input
                  value={newPath.path_name}
                  onChange={(e) => setNewPath({...newPath, path_name: e.target.value})}
                  placeholder="مثال: مسار جزء عم"
                />
              </div>

              <div>
                <Label>الوصف</Label>
                <Textarea
                  value={newPath.path_description}
                  onChange={(e) => setNewPath({...newPath, path_description: e.target.value})}
                  placeholder="وصف مختصر للمسار..."
                  rows={2}
                />
              </div>

              <div>
                <Label>الأيقونة</Label>
                <div className="flex gap-2">
                  <div className="flex-1 flex items-center gap-2 border rounded-md px-3 bg-gray-50">
                    {newPath.icon?.startsWith('http') ? (
                      <img src={newPath.icon} alt="icon" className="w-8 h-8 object-cover rounded" />
                    ) : (
                      <span className="text-3xl">{newPath.icon}</span>
                    )}
                    <span className="text-sm text-gray-600">الأيقونة الحالية</span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowIconPicker(true)}
                    className="gap-2"
                  >
                    <ImageIcon className="w-4 h-4" />
                    تغيير
                  </Button>
                </div>
              </div>

              <div>
                <Label>مستوى الصعوبة</Label>
                <Select value={newPath.difficulty_level} onValueChange={(v) => setNewPath({...newPath, difficulty_level: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="الكل">الكل</SelectItem>
                    <SelectItem value="مبتدئ">مبتدئ</SelectItem>
                    <SelectItem value="متوسط">متوسط</SelectItem>
                    <SelectItem value="متقدم">متقدم</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>نوع المصدر</Label>
                <Select value={newPath.source_type} onValueChange={(v) => setNewPath({...newPath, source_type: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="surahs">سور محددة</SelectItem>
                    <SelectItem value="juz">أجزاء محددة</SelectItem>
                    <SelectItem value="category">تصنيفات</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {newPath.source_type === "surahs" && (
                <div>
                  <Label>اختر السور</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2 max-h-48 overflow-y-auto border p-2 rounded">
                    {SURAHS.map((surah, idx) => (
                      <Button
                        key={surah}
                        size="sm"
                        variant={newPath.selected_surahs.includes(surah) ? "default" : "outline"}
                        onClick={() => toggleSelection("surah", surah)}
                        className="text-xs"
                      >
                        {idx + 1}. {surah}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {newPath.source_type === "juz" && (
                <div>
                  <Label>اختر الأجزاء</Label>
                  <div className="grid grid-cols-6 gap-2 mt-2">
                    {Array.from({length: 30}, (_, i) => i + 1).map(juz => (
                      <Button
                        key={juz}
                        size="sm"
                        variant={newPath.selected_juz.includes(juz) ? "default" : "outline"}
                        onClick={() => toggleSelection("juz", juz)}
                      >
                        {juz}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {newPath.source_type === "category" && (
                <div>
                  <Label>اختر التصنيفات</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {CATEGORIES.map(cat => (
                      <Button
                        key={cat}
                        size="sm"
                        variant={newPath.selected_categories.includes(cat) ? "default" : "outline"}
                        onClick={() => toggleSelection("category", cat)}
                      >
                        {cat}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t">
                <Button onClick={handleCreatePath} disabled={isCreating} className="flex-1">
                  {isCreating ? (
                    <><Loader2 className="w-4 h-4 ml-2 animate-spin" />جارٍ الإنشاء...</>
                  ) : (
                    <><Plus className="w-4 h-4 ml-2" />إنشاء المسار</>
                  )}
                </Button>
                <Button onClick={() => setShowCreateModal(false)} variant="outline">
                  إلغاء
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <IconPicker
          currentIcon={newPath.icon}
          onSelect={(icon) => setNewPath({...newPath, icon})}
          isOpen={showIconPicker}
          onClose={() => setShowIconPicker(false)}
        />
      </motion.div>
    </div>
  );
}