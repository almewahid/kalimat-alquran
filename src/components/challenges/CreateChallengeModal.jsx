import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const CHALLENGE_TYPES = [
  { value: "learn_new_words", label: "تعلم كلمات جديدة", icon: "📚" },
  { value: "review_words", label: "مراجعة كلمات", icon: "🔄" },
  { value: "complete_quizzes", label: "إكمال اختبارات", icon: "🧠" },
  { value: "maintain_streak", label: "الحفاظ على السلسلة", icon: "🔥" }
];

const DIFFICULTY_LEVELS = [
  { value: "الكل", label: "جميع المستويات" },
  { value: "مبتدئ", label: "مبتدئ" },
  { value: "متوسط", label: "متوسط" },
  { value: "متقدم", label: "متقدم" }
];

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
    difficulty_level: "الكل"
  });

  const handleCreate = async () => {
    if (!challenge.title || !challenge.challenge_type) {
      toast({ title: "⚠️ الرجاء ملء جميع الحقول المطلوبة", variant: "destructive" });
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
        difficulty_level: challenge.difficulty_level
      };

      const created = await base44.entities.GroupChallenge.create(challengeData);

      // Create progress records for all group members
      const group = await base44.entities.Group.filter({ id: groupId });
      if (group[0] && group[0].members) {
        for (const memberEmail of group[0].members) {
          await base44.entities.ChallengeProgress.create({
            challenge_id: created.id,
            user_email: memberEmail,
            progress_value: 0,
            completed: false,
            last_update: now.toISOString()
          });
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>إنشاء تحدي جديد</DialogTitle>
          <DialogDescription>
            أنشئ تحدياً لأعضاء مجموعتك
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="title">عنوان التحدي *</Label>
            <Input
              id="title"
              placeholder="مثال: تعلم 50 كلمة من جزء عم"
              value={challenge.title}
              onChange={(e) => setChallenge({...challenge, title: e.target.value})}
            />
          </div>

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
                    {type.icon} {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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
            <Button
              onClick={onClose}
              variant="outline"
              disabled={isCreating}
            >
              إلغاء
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}