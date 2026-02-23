import React, { useState, useEffect } from "react";
import { supabaseClient } from "@/components/api/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2, Trophy } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useToast } from "@/components/ui/use-toast";

export default function CreateChallengeFromPath() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [path, setPath] = useState(null);
  const [userGroups, setUserGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  
  const [challengeData, setChallengeData] = useState({
    group_id: "",
    title: "",
    description: "",
    goal_count: 10,
    duration_days: 7,
    reward_xp: 100
  });

  const urlParams = new URLSearchParams(window.location.search);
  const pathId = urlParams.get('pathId');

  useEffect(() => {
    loadData();
  }, [pathId]);

  const loadData = async () => {
    try {
      const user = await supabaseClient.auth.me();
      
      const pathData = await supabaseClient.entities.CustomLearningPath.filter({ id: pathId });
      if (pathData.length === 0) {
        toast({ title: "❌ المسار غير موجود", variant: "destructive" });
        return;
      }

      const currentPath = pathData[0];
      setPath(currentPath);

      const allGroups = await supabaseClient.entities.Group.list();
      const myGroups = allGroups.filter(g => g.leader_email === user.email);
      setUserGroups(myGroups);

      setChallengeData(prev => ({
        ...prev,
        title: `تحدي ${currentPath.path_name}`,
        description: currentPath.path_description || ""
      }));
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateChallenge = async () => {
    if (!challengeData.group_id) {
      toast({ title: "⚠️ اختر مجموعة", variant: "destructive" });
      return;
    }

    setIsCreating(true);
    try {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + parseInt(challengeData.duration_days));

      await supabaseClient.entities.GroupChallenge.create({
        group_id: challengeData.group_id,
        title: challengeData.title,
        description: challengeData.description,
        challenge_type: "custom_quiz",
        goal_count: parseInt(challengeData.goal_count),
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        reward_xp: parseInt(challengeData.reward_xp),
        difficulty_level: path.difficulty_level,
        source_type: path.source_type === "surahs" ? "surah" : path.source_type === "juz" ? "juz" : "all",
        source_details: path.source_type === "surahs" ? path.selected_surahs : 
                        path.source_type === "juz" ? path.selected_juz.map(String) : [],
        is_active: true
      });

      toast({ title: "✅ تم إنشاء التحدي من المسار" });
      navigate(createPageUrl(`GroupDetail?id=${challengeData.group_id}`));
    } catch (error) {
      console.error(error);
      toast({ title: "❌ فشل الإنشاء", variant: "destructive" });
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link to={createPageUrl("CustomLearningPaths")}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="w-7 h-7 text-primary" />
            إنشاء تحدي من المسار
          </h1>
          <p className="text-sm text-foreground/70">
            المسار: {path?.path_name} ({path?.total_words_count} كلمة)
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>تفاصيل التحدي</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>المجموعة *</Label>
            {userGroups.length === 0 ? (
              <div className="text-sm text-foreground/70 p-3 bg-yellow-50 rounded">
                لا توجد مجموعات تديرها. <Link to={createPageUrl("Groups")} className="text-primary underline">أنشئ مجموعة</Link>
              </div>
            ) : (
              <Select value={challengeData.group_id} onValueChange={(v) => setChallengeData({...challengeData, group_id: v})}>
                <SelectTrigger><SelectValue placeholder="اختر المجموعة" /></SelectTrigger>
                <SelectContent>
                  {userGroups.map(g => (
                    <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div>
            <Label>عنوان التحدي</Label>
            <Input
              value={challengeData.title}
              onChange={(e) => setChallengeData({...challengeData, title: e.target.value})}
            />
          </div>

          <div>
            <Label>الوصف</Label>
            <Textarea
              value={challengeData.description}
              onChange={(e) => setChallengeData({...challengeData, description: e.target.value})}
              rows={3}
            />
          </div>

          <div>
            <Label>عدد الكلمات المستهدفة</Label>
            <Input
              type="number"
              value={challengeData.goal_count}
              onChange={(e) => setChallengeData({...challengeData, goal_count: e.target.value})}
              min="1"
              max={path?.total_words_count || 100}
            />
          </div>

          <div>
            <Label>مدة التحدي (بالأيام)</Label>
            <Input
              type="number"
              value={challengeData.duration_days}
              onChange={(e) => setChallengeData({...challengeData, duration_days: e.target.value})}
              min="1"
            />
          </div>

          <div>
            <Label>مكافأة XP</Label>
            <Input
              type="number"
              value={challengeData.reward_xp}
              onChange={(e) => setChallengeData({...challengeData, reward_xp: e.target.value})}
              min="0"
            />
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <Button onClick={handleCreateChallenge} disabled={isCreating} className="flex-1">
              {isCreating ? (
                <><Loader2 className="w-4 h-4 ml-2 animate-spin" />جارٍ الإنشاء...</>
              ) : (
                <><Trophy className="w-4 h-4 ml-2" />إنشاء التحدي</>
              )}
            </Button>
            <Link to={createPageUrl("CustomLearningPaths")}>
              <Button variant="outline">إلغاء</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}