import React, { useState } from "react";
import { supabaseClient } from "@/components/api/supabaseClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const CHALLENGE_TYPES = [
  { value: "learn_new_words", label: "تعلم كلمات جديدة", icon: "📚", description: "يُحتسب عند تعلم كلمات لأول مرة من خلال بطاقات التعلم" },
  { value: "learn_and_review", label: "تعلم الجديد ومراجعة القديم", icon: "🔄", description: "يُحتسب عند تعلم كلمات جديدة ومراجعة كلمات سبق تعلمها معاً" },
  { value: "complete_quizzes", label: "إكمال اختبارات", icon: "🧠", description: "يُحتسب عند إنهاء اختبارات المجموعة بنجاح" },
  { value: "maintain_streak", label: "الحفاظ على السلسلة", icon: "🔥", description: "يُحتسب عند تسجيل الدخول والتعلم يومياً دون انقطاع" }
];

const DIFFICULTY_LEVELS = [
  { value: "الكل", label: "جميع المستويات" },
  { value: "مبتدئ", label: "طفل" },
  { value: "متوسط", label: "متوسط" },
  { value: "متقدم", label: "متقدم" }
];

const SURAHS = [
  { value: "1", label: "الفاتحة" }, { value: "2", label: "البقرة" },
  { value: "3", label: "آل عمران" }, { value: "4", label: "النساء" },
  { value: "5", label: "المائدة" }, { value: "6", label: "الأنعام" },
  { value: "7", label: "الأعراف" }, { value: "8", label: "الأنفال" },
  { value: "9", label: "التوبة" }, { value: "10", label: "يونس" },
  { value: "11", label: "هود" }, { value: "12", label: "يوسف" },
  { value: "13", label: "الرعد" }, { value: "14", label: "إبراهيم" },
  { value: "15", label: "الحجر" }, { value: "16", label: "النحل" },
  { value: "17", label: "الإسراء" }, { value: "18", label: "الكهف" },
  { value: "19", label: "مريم" }, { value: "20", label: "طه" },
  { value: "21", label: "الأنبياء" }, { value: "22", label: "الحج" },
  { value: "23", label: "المؤمنون" }, { value: "24", label: "النور" },
  { value: "25", label: "الفرقان" }, { value: "26", label: "الشعراء" },
  { value: "27", label: "النمل" }, { value: "28", label: "القصص" },
  { value: "29", label: "العنكبوت" }, { value: "30", label: "الروم" },
  { value: "31", label: "لقمان" }, { value: "32", label: "السجدة" },
  { value: "33", label: "الأحزاب" }, { value: "34", label: "سبأ" },
  { value: "35", label: "فاطر" }, { value: "36", label: "يس" },
  { value: "37", label: "الصافات" }, { value: "38", label: "ص" },
  { value: "39", label: "الزمر" }, { value: "40", label: "غافر" },
  { value: "41", label: "فصلت" }, { value: "42", label: "الشورى" },
  { value: "43", label: "الزخرف" }, { value: "44", label: "الدخان" },
  { value: "45", label: "الجاثية" }, { value: "46", label: "الأحقاف" },
  { value: "47", label: "محمد" }, { value: "48", label: "الفتح" },
  { value: "49", label: "الحجرات" }, { value: "50", label: "ق" },
  { value: "51", label: "الذاريات" }, { value: "52", label: "الطور" },
  { value: "53", label: "النجم" }, { value: "54", label: "القمر" },
  { value: "55", label: "الرحمن" }, { value: "56", label: "الواقعة" },
  { value: "57", label: "الحديد" }, { value: "58", label: "المجادلة" },
  { value: "59", label: "الحشر" }, { value: "60", label: "الممتحنة" },
  { value: "61", label: "الصف" }, { value: "62", label: "الجمعة" },
  { value: "63", label: "المنافقون" }, { value: "64", label: "التغابن" },
  { value: "65", label: "الطلاق" }, { value: "66", label: "التحريم" },
  { value: "67", label: "الملك" }, { value: "68", label: "القلم" },
  { value: "69", label: "الحاقة" }, { value: "70", label: "المعارج" },
  { value: "71", label: "نوح" }, { value: "72", label: "الجن" },
  { value: "73", label: "المزمل" }, { value: "74", label: "المدثر" },
  { value: "75", label: "القيامة" }, { value: "76", label: "الإنسان" },
  { value: "77", label: "المرسلات" }, { value: "78", label: "النبأ" },
  { value: "79", label: "النازعات" }, { value: "80", label: "عبس" },
  { value: "81", label: "التكوير" }, { value: "82", label: "الانفطار" },
  { value: "83", label: "المطففين" }, { value: "84", label: "الانشقاق" },
  { value: "85", label: "البروج" }, { value: "86", label: "الطارق" },
  { value: "87", label: "الأعلى" }, { value: "88", label: "الغاشية" },
  { value: "89", label: "الفجر" }, { value: "90", label: "البلد" },
  { value: "91", label: "الشمس" }, { value: "92", label: "الليل" },
  { value: "93", label: "الضحى" }, { value: "94", label: "الشرح" },
  { value: "95", label: "التين" }, { value: "96", label: "العلق" },
  { value: "97", label: "القدر" }, { value: "98", label: "البينة" },
  { value: "99", label: "الزلزلة" }, { value: "100", label: "العاديات" },
  { value: "101", label: "القارعة" }, { value: "102", label: "التكاثر" },
  { value: "103", label: "العصر" }, { value: "104", label: "الهمزة" },
  { value: "105", label: "الفيل" }, { value: "106", label: "قريش" },
  { value: "107", label: "الماعون" }, { value: "108", label: "الكوثر" },
  { value: "109", label: "الكافرون" }, { value: "110", label: "النصر" },
  { value: "111", label: "المسد" }, { value: "112", label: "الإخلاص" },
  { value: "113", label: "الفلق" }, { value: "114", label: "الناس" }
];

const JUZS = Array.from({ length: 30 }, (_, i) => ({
  value: String(i + 1),
  label: `الجزء ${i + 1}`
}));

export default function CreateChallengeModal({ isOpen, onClose, groupId, onSuccess }) {
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [challenge, setChallenge] = useState({
    title: "",
    description: "",
    challenge_type: "",
    goal_count: 10,
    duration_days: 7,
    reward_badge: "",
    reward_xp: 100,
    difficulty_level: "الكل",
    source_type: "all",
    source_details: []
  });

  const toggleSourceDetail = (value) => {
    setChallenge(prev => {
      const current = prev.source_details;
      if (current.includes(value)) {
        return { ...prev, source_details: current.filter(v => v !== value) };
      }
      return { ...prev, source_details: [...current, value] };
    });
  };

  const handleCreate = async () => {
    if (!challenge.title || !challenge.challenge_type) {
      toast({ title: "⚠️ الرجاء ملء جميع الحقول المطلوبة", variant: "destructive" });
      return;
    }
    if (challenge.source_type !== "all" && challenge.source_details.length === 0) {
      toast({ title: "⚠️ الرجاء اختيار مصدر المادة", variant: "destructive" });
      return;
    }

    setIsCreating(true);
    try {
      const now = new Date();
      const endDate = new Date(now);
      endDate.setDate(endDate.getDate() + parseInt(challenge.duration_days));

      const challengeData = {
        group_id: groupId,
        title: challenge.title,
        description: challenge.description,
        challenge_type: challenge.challenge_type,
        goal_count: parseInt(challenge.goal_count),
        start_date: now.toISOString(),
        end_date: endDate.toISOString(),
        reward_badge: challenge.reward_badge || `🏆 ${challenge.title}`,
        reward_xp: parseInt(challenge.reward_xp),
        is_active: true,
        difficulty_level: challenge.difficulty_level === "الكل" ? null : challenge.difficulty_level,
        source_type: challenge.source_type,
        source_details: challenge.source_details
      };

      const created = await supabaseClient.entities.GroupChallenge.create(challengeData);

      const group = await supabaseClient.entities.Group.filter({ id: groupId });
      if (group[0] && group[0].members) {
        const leaderEmail = group[0].leader_email;
        for (const memberEmail of group[0].members) {
          // استثناء الرئيس من التحدي
          if (memberEmail === leaderEmail) continue;
          try {
            await supabaseClient.entities.ChallengeProgress.create({
              challenge_id: created.id,
              user_email: memberEmail,
              progress_value: 0,
              completed: false,
              last_update: now.toISOString()
            });
          } catch (e) {
            console.log("Progress already exists for", memberEmail);
          }
        }
      }

      toast({
        title: "✅ تم إنشاء التحدي بنجاح",
        className: "bg-green-100 text-green-800"
      });

      onClose();
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error creating challenge:", error);
      toast({ title: "❌ خطأ في إنشاء التحدي", variant: "destructive" });
    } finally {
      setIsCreating(false);
    }
  };

  const sourceList = challenge.source_type === "surah" ? SURAHS : JUZS;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>إنشاء تحدي جديد</DialogTitle>
          <DialogDescription>أنشئ تحدياً لأعضاء مجموعتك</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* العنوان */}
          <div>
            <Label htmlFor="title">عنوان التحدي *</Label>
            <Input
              id="title"
              placeholder="مثال: تعلم 50 كلمة من جزء عم"
              value={challenge.title}
              onChange={(e) => setChallenge({...challenge, title: e.target.value})}
            />
          </div>

          {/* الوصف */}
          <div>
            <Label htmlFor="description">الوصف</Label>
            <Textarea
              id="description"
              placeholder="اكتب وصفاً للتحدي..."
              value={challenge.description}
              onChange={(e) => setChallenge({...challenge, description: e.target.value})}
              rows={3}
            />
          </div>

          {/* نوع التحدي */}
          <div>
            <Label htmlFor="type">نوع التحدي *</Label>
            <Select
              value={challenge.challenge_type}
              onValueChange={(value) => setChallenge({...challenge, challenge_type: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر نوع التحدي" />
              </SelectTrigger>
              <SelectContent>
                {CHALLENGE_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex flex-col">
                      <span>{type.icon} {type.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {challenge.challenge_type && (() => {
              const selected = CHALLENGE_TYPES.find(t => t.value === challenge.challenge_type);
              return selected ? (
                <p className="text-xs text-muted-foreground mt-1 pr-1">
                  ℹ️ {selected.description}
                </p>
              ) : null;
            })()}
          </div>

          {/* مصدر المادة */}
          <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
            <Label className="text-base font-semibold">📖 مصدر المادة</Label>
            <Select
              value={challenge.source_type}
              onValueChange={(value) => setChallenge({...challenge, source_type: value, source_details: []})}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">📚 جميع الكلمات</SelectItem>
                <SelectItem value="juz">🗂️ جزء محدد</SelectItem>
                <SelectItem value="surah">📜 سورة محددة</SelectItem>
              </SelectContent>
            </Select>

            {challenge.source_type !== "all" && (
              <div>
                <Label className="text-sm text-muted-foreground mb-2 block">
                  اختر {challenge.source_type === "juz" ? "الأجزاء" : "السور"} (يمكن اختيار أكثر من واحد)
                </Label>

                {/* الاختيارات المحددة */}
                {challenge.source_details.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {challenge.source_details.map(v => {
                      const item = sourceList.find(s => s.value === v);
                      return (
                        <span key={v} className="flex items-center gap-1 bg-primary/10 text-primary text-sm px-2 py-1 rounded-full">
                          {item?.label}
                          <X className="w-3 h-3 cursor-pointer" onClick={() => toggleSourceDetail(v)} />
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* قائمة الاختيار */}
                <div className="border rounded-md max-h-40 overflow-y-auto bg-background">
                  {sourceList.map(item => (
                    <div
                      key={item.value}
                      className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-muted transition-colors text-sm ${
                        challenge.source_details.includes(item.value) ? "bg-primary/10 font-medium" : ""
                      }`}
                      onClick={() => toggleSourceDetail(item.value)}
                    >
                      <span className={`w-4 h-4 rounded border flex items-center justify-center text-xs ${
                        challenge.source_details.includes(item.value) ? "bg-primary border-primary text-white" : "border-gray-300"
                      }`}>
                        {challenge.source_details.includes(item.value) ? "✓" : ""}
                      </span>
                      {item.label}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* الهدف والمدة */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="goal">الهدف العددي *</Label>
              <Input
                id="goal"
                type="number"
                min="1"
                value={challenge.goal_count}
                onChange={(e) => setChallenge({...challenge, goal_count: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="duration">المدة (بالأيام) *</Label>
              <Input
                id="duration"
                type="number"
                min="1"
                value={challenge.duration_days}
                onChange={(e) => setChallenge({...challenge, duration_days: e.target.value})}
              />
            </div>
          </div>

          {/* مستوى الصعوبة */}
          <div>
            <Label htmlFor="difficulty">مستوى الصعوبة</Label>
            <Select
              value={challenge.difficulty_level}
              onValueChange={(value) => setChallenge({...challenge, difficulty_level: value})}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DIFFICULTY_LEVELS.map(level => (
                  <SelectItem key={level.value} value={level.value}>
                    {level.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* الشارة والنقاط */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="badge">اسم الشارة</Label>
              <Input
                id="badge"
                placeholder="مثال: بطل التعلم 🏆"
                value={challenge.reward_badge}
                onChange={(e) => setChallenge({...challenge, reward_badge: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="xp">نقاط الخبرة المكافأة</Label>
              <Input
                id="xp"
                type="number"
                min="0"
                value={challenge.reward_xp}
                onChange={(e) => setChallenge({...challenge, reward_xp: e.target.value})}
              />
            </div>
          </div>

          {/* أزرار */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleCreate}
              disabled={isCreating}
              className="flex-1 bg-primary text-primary-foreground"
            >
              {isCreating ? (
                <><Loader2 className="w-4 h-4 ml-2 animate-spin" />جارٍ الإنشاء...</>
              ) : (
                <><Plus className="w-4 h-4 ml-2" />إنشاء التحدي</>
              )}
            </Button>
            <Button onClick={onClose} variant="outline" disabled={isCreating}>
              إلغاء
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}