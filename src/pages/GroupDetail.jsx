import React, { useState, useEffect } from "react";
import { supabaseClient } from "@/components/api/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Crown, Users, Trophy, Plus, Loader2, Copy, Check, ArrowLeft, Brain, BarChart3, Medal, Trash2, LogOut, UserX } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useToast } from "@/components/ui/use-toast";

import CreateChallengeModal from "../components/challenges/CreateChallengeModal";
import ChallengeCard from "../components/challenges/ChallengeCard";
import UpdateGroupAvatar from "../components/groups/UpdateGroupAvatar";

export default function GroupDetail() {
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [group, setGroup] = useState(null);
  const [challenges, setChallenges] = useState([]);
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateChallenge, setShowCreateChallenge] = useState(false);
  const [showCreateQuiz, setShowCreateQuiz] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [quizForm, setQuizForm] = useState({
    title: "",
    description: "",
    source_type: "surah", // surah, juz, level
    source_value: "",
    goal_count: 10
  });
  const [leaderboard, setLeaderboard] = useState([]);
  const [suggestedWords, setSuggestedWords] = useState([]);
  const [isSendingNotification, setIsSendingNotification] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  const urlParams = new URLSearchParams(window.location.search);
  const groupId = urlParams.get('id');

  useEffect(() => {
    loadGroupData();
    loadSuggestions();
  }, [groupId]);

  const loadGroupData = async () => {
    try {
      const currentUser = await supabaseClient.auth.me();
      setUser(currentUser);
      
      const groupData = await supabaseClient.entities.Group.filter({ id: groupId });
      if (groupData.length === 0) {
        toast({ title: "❌ المجموعة غير موجودة", variant: "destructive" });
        return;
      }

      const currentGroup = groupData[0];
      setGroup(currentGroup);

      const groupChallenges = await supabaseClient.entities.GroupChallenge.filter({ group_id: groupId });
      setChallenges(groupChallenges);

      // Load member details
      const allUsers = await supabaseClient.entities.User.list();
      const groupMembers = allUsers.filter(u => currentGroup.members?.includes(u.email));
      
      const membersWithProgress = await Promise.all(
        groupMembers.map(async (member) => {
          const [progress] = await supabaseClient.entities.UserProgress.filter({ 
            created_by: member.email 
          });
          return {
            ...member,
            progress: progress || { total_xp: 0, words_learned: 0 }
          };
        })
      );
      
      setMembers(membersWithProgress);

      // Load Leaderboard Data
      const challengeIds = groupChallenges.map(c => c.id);
      if (challengeIds.length > 0) {
          const progress = await supabaseClient.entities.ChallengeProgress.filter({ challenge_id: { $in: challengeIds } });
          
          // Aggregate scores per user
          const scores = {};
          progress.forEach(p => {
              if (p.completed) {
                  scores[p.user_email] = (scores[p.user_email] || 0) + (p.progress_value * 10); // Dummy calc
              }
          });
          
          const lb = Object.keys(scores).map(email => ({
              email,
              score: scores[email],
              user: allUsers.find(u => u.email === email)
          })).sort((a, b) => b.score - a.score);
          
          setLeaderboard(lb);
      }

    } catch (error) {
      console.error("Error loading group data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyJoinCode = () => {
    navigator.clipboard.writeText(group.join_code);
    setCopiedCode(true);
    toast({ title: "✅ تم نسخ كود الانضمام" });
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const isLeader = user && group && group.leader_email === user.email;

  const loadSuggestions = async () => {
    try {
        // Simple suggestion: Random words for now
        // In a real app, this would query aggregated difficulty stats
        const words = await supabaseClient.entities.QuranicWord.list(); // Fetch some words
        const randomWords = words.sort(() => 0.5 - Math.random()).slice(0, 5);
        setSuggestedWords(randomWords);
    } catch (e) {
        console.error("Failed to load suggestions", e);
    }
  };

  const handleSendNotification = async () => {
    const message = prompt("أدخل نص الرسالة لإرسالها لجميع أعضاء المجموعة:");
    if (!message) return;

    setIsSendingNotification(true);
    try {
        const recipients = group.members.filter(email => email !== user.email);
        await Promise.all(recipients.map(email => 
            supabaseClient.entities.Notification.create({
                user_email: email,
                notification_type: "challenge_invite",
                title: `📢 تنبيه من قائد المجموعة: ${group.name}`,
                message: message,
                icon: "🔔",
                is_read: false,
                action_url: `/GroupDetail?id=${groupId}`
            })
        ));
        toast({ title: "✅ تم إرسال الإشعار بنجاح" });
    } catch (error) {
        console.error(error);
        toast({ title: "❌ فشل الإرسال", variant: "destructive" });
    } finally {
        setIsSendingNotification(false);
    }
  };

  const handleRemoveMember = async (memberEmail) => {
    if (!group || group.leader_email !== user?.email) return;
    if (memberEmail === user.email) {
      toast({ title: "⚠️ لا يمكنك حذف نفسك", variant: "destructive" });
      return;
    }
    
    if (!confirm(`هل تريد إزالة ${memberEmail} من المجموعة؟`)) return;
    
    try {
      const updatedMembers = group.members.filter(m => m !== memberEmail);
      await supabaseClient.entities.Group.update(group.id, { members: updatedMembers });
      toast({ title: "✅ تم إزالة العضو" });
      loadGroupData();
    } catch (error) {
      toast({ title: "❌ فشل الإزالة", variant: "destructive" });
    }
  };

  const handleBanMember = async (memberEmail) => {
    if (!group || group.leader_email !== user?.email) return;
    
    if (!confirm(`هل تريد حظر ${memberEmail} ومنعه من الانضمام مستقبلاً؟`)) return;
    
    try {
      const updatedMembers = group.members.filter(m => m !== memberEmail);
      const bannedList = [...(group.banned_members || []), memberEmail];
      await supabaseClient.entities.Group.update(group.id, { 
        members: updatedMembers,
        banned_members: bannedList
      });
      toast({ title: "✅ تم حظر العضو" });
      loadGroupData();
    } catch (error) {
      toast({ title: "❌ فشل الحظر", variant: "destructive" });
    }
  };

  const handleLeaveGroup = async () => {
    if (!group || !user) return;
    
    if (group.leader_email === user.email) {
      toast({ title: "⚠️ لا يمكن للقائد مغادرة المجموعة", description: "قم بنقل القيادة أو حذف المجموعة", variant: "destructive" });
      return;
    }
    
    if (!confirm("هل تريد مغادرة المجموعة؟")) return;
    
    try {
      const updatedMembers = group.members.filter(m => m !== user.email);
      await supabaseClient.entities.Group.update(group.id, { members: updatedMembers });
      toast({ title: "✅ تم مغادرة المجموعة" });
      window.location.href = createPageUrl("Groups");
    } catch (error) {
      toast({ title: "❌ فشل المغادرة", variant: "destructive" });
    }
  };

  const handleCreateQuiz = async () => {
    try {
        await supabaseClient.entities.GroupChallenge.create({
            group_id: groupId,
            title: quizForm.title || "اختبار جديد",
            description: `اختبار في ${quizForm.source_type}: ${quizForm.source_value}`,
            challenge_type: "custom_quiz",
            goal_count: parseInt(quizForm.goal_count),
            start_date: new Date().toISOString(),
            end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week
            source_type: quizForm.source_type === 'level' ? 'all' : quizForm.source_type, // Map 'level' to 'all' + filter if needed, or stick to schema
            source_details: [quizForm.source_value],
            difficulty_level: quizForm.source_type === 'level' ? quizForm.source_value : 'الكل',
            is_active: true
        });
        toast({ title: "✅ تم إنشاء الاختبار" });
        setShowCreateQuiz(false);
        loadGroupData();
    } catch (error) {
        console.error(error);
        toast({ title: "❌ حدث خطأ", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <Alert variant="destructive">
          <AlertDescription>المجموعة غير موجودة</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to={createPageUrl("Groups")}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          {group.avatar_url && (
            <div className="w-20 h-20 rounded-lg overflow-hidden border-2 border-primary/20">
              <img src={group.avatar_url} alt={group.name} className="w-full h-full object-cover" />
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold gradient-text">{group.name}</h1>
              {isLeader && (
                <>
                  <Badge className="bg-amber-100 text-amber-700">
                    <Crown className="w-3 h-3 ml-1" />
                    رئيس
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAvatarModal(true)}
                    className="text-xs"
                  >
                    تغيير الصورة
                  </Button>
                </>
              )}
            </div>
            <p className="text-foreground/70">{group.description}</p>
          </div>
          <div className="flex gap-2">
            {isLeader && (
                <Button 
                    onClick={handleSendNotification} 
                    variant="outline" 
                    disabled={isSendingNotification}
                    className="gap-2"
                >
                    {isSendingNotification ? <Loader2 className="w-4 h-4 animate-spin"/> : "🔔 إرسال تنبيه"}
                </Button>
            )}
            {!isLeader && (
              <Button onClick={handleLeaveGroup} variant="outline" className="gap-2 text-red-600">
                <LogOut className="w-4 h-4" />
                مغادرة المجموعة
              </Button>
            )}
            <Button
                onClick={copyJoinCode}
                variant="outline"
                className="gap-2"
            >
                {copiedCode ? (
                <><Check className="w-4 h-4 text-green-600" />تم النسخ</>
                ) : (
                <><Copy className="w-4 h-4" />{group.join_code}</>
                )}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="challenges" className="mb-8">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="challenges">التحديات والاختبارات</TabsTrigger>
                <TabsTrigger value="leaderboard">لوحة الترتيب</TabsTrigger>
                <TabsTrigger value="members">الأعضاء</TabsTrigger>
            </TabsList>

            <TabsContent value="challenges" className="space-y-6">
                <Card className="bg-card shadow-md">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-primary flex items-center gap-2">
                        <Trophy className="w-6 h-6" />
                        التحديات والاختبارات
                      </CardTitle>
                      {isLeader && (
                        <div className="flex gap-2">
                            <Button
                              onClick={() => setShowCreateQuiz(true)}
                              variant="outline"
                              className="gap-2"
                            >
                              <Brain className="w-4 h-4" />
                              اختبار جديد
                            </Button>
                            <Button
                              onClick={() => setShowCreateChallenge(true)}
                              className="bg-primary text-primary-foreground gap-2"
                            >
                              <Plus className="w-4 h-4" />
                              تحدي جديد
                            </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {challenges.length === 0 ? (
                      <div className="text-center py-8">
                        <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-foreground/70 mb-4">لا توجد تحديات أو اختبارات بعد</p>
                        {isLeader && (
                          <Button onClick={() => setShowCreateChallenge(true)} variant="outline">
                            <Plus className="w-4 h-4 ml-2" />
                            إنشاء أول تحدي
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="grid md:grid-cols-2 gap-6">
                        {challenges.map((challenge, index) => (
                          <ChallengeCard
                            key={challenge.id}
                            challenge={challenge}
                            index={index}
                            userEmail={user.email}
                          />
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="leaderboard">
                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="w-5 h-5"/> لوحة ترتيب المجموعة</CardTitle></CardHeader>
                    <CardContent>
                        {leaderboard.length === 0 ? <p className="text-center py-4">لا توجد بيانات كافية</p> : (
                            <div className="space-y-2">
                                {leaderboard.map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-background-soft rounded-lg border">
                                        <div className="flex items-center gap-3">
                                            {idx < 3 ? <Medal className={`w-6 h-6 ${idx===0?'text-yellow-500':idx===1?'text-gray-400':'text-amber-700'}`} /> : <span className="w-6 text-center font-bold text-gray-500">{idx+1}</span>}
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center font-bold text-primary text-xs">
                                                    {item.user?.full_name?.charAt(0) || item.email.charAt(0)}
                                                </div>
                                                <span className="font-medium">{item.user?.full_name || item.email}</span>
                                            </div>
                                        </div>
                                        <Badge variant="secondary">{item.score} XP</Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="members">
                <div className="grid gap-6">
                {isLeader && group.banned_members && group.banned_members.length > 0 && (
                  <Card className="bg-red-50 dark:bg-red-900/20 border-red-200">
                    <CardHeader>
                      <CardTitle className="text-red-700 flex items-center gap-2">
                        <UserX className="w-5 h-5" />
                        المستخدمون المحظورون ({group.banned_members.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {group.banned_members.map((email) => (
                          <div key={email} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border">
                            <span className="text-sm">{email}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                if (!confirm(`هل تريد إلغاء حظر ${email}؟`)) return;
                                try {
                                  const updatedBanned = group.banned_members.filter(e => e !== email);
                                  await supabaseClient.entities.Group.update(group.id, { banned_members: updatedBanned });
                                  toast({ title: "✅ تم إلغاء الحظر" });
                                  loadGroupData();
                                } catch (error) {
                                  toast({ title: "❌ فشل الإلغاء", variant: "destructive" });
                                }
                              }}
                            >
                              إلغاء الحظر
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                <Card className="bg-card shadow-md">
                  <CardHeader>
                    <CardTitle className="text-primary flex items-center gap-2">
                      <Users className="w-6 h-6" />
                      الأعضاء ({members.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {members.map((member, index) => (
                        <motion.div
                          key={member.email}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="p-4 bg-background-soft rounded-lg border"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                <span className="text-primary font-bold">
                                  {member.full_name?.charAt(0) || member.email.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-foreground">{member.full_name || member.email}</p>
                                {member.email === group.leader_email && (
                                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
                                    <Crown className="w-3 h-3 ml-1" />
                                    رئيس
                                  </Badge>
                                )}
                              </div>
                            </div>
                            {isLeader && member.email !== user.email && (
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-red-500 hover:bg-red-50"
                                  onClick={() => handleRemoveMember(member.email)}
                                  title="إزالة"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-orange-600 hover:bg-orange-50"
                                  onClick={() => handleBanMember(member.email)}
                                  title="حظر"
                                >
                                  <UserX className="w-4 h-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                          {member.progress && (
                            <div className="flex gap-2 text-xs">
                              <Badge variant="secondary">{member.progress.words_learned || 0} كلمة</Badge>
                              <Badge variant="outline">{member.progress.total_xp || 0} XP</Badge>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Suggested Words Section */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-primary flex items-center gap-2">
                            <Brain className="w-6 h-6" />
                            كلمات مقترحة للمجموعة
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {suggestedWords.map(word => (
                                <Badge key={word.id} variant="secondary" className="px-3 py-1 text-base">
                                    {word.word}
                                </Badge>
                            ))}
                        </div>
                        {isLeader && (
                            <Button 
                                variant="link" 
                                className="mt-2 p-0 h-auto text-primary"
                                onClick={() => setShowCreateQuiz(true)}
                            >
                                إنشاء اختبار من هذه الكلمات
                            </Button>
                        )}
                    </CardContent>
                </Card>
                </div>
            </TabsContent>
        </Tabs>

        {/* Create Quiz Modal */}
        <Dialog open={showCreateQuiz} onOpenChange={setShowCreateQuiz}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>إنشاء اختبار جديد</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div>
                        <Label>عنوان الاختبار</Label>
                        <Input value={quizForm.title} onChange={e => setQuizForm({...quizForm, title: e.target.value})} placeholder="مثال: اختبار سورة الناس" />
                    </div>
                    <div>
                        <Label>نوع المصدر</Label>
                        <Select value={quizForm.source_type} onValueChange={v => setQuizForm({...quizForm, source_type: v})}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="surah">سورة</SelectItem>
                                <SelectItem value="juz">جزء</SelectItem>
                                <SelectItem value="level">مستوى (مبتدئ/متوسط/متقدم)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label>القيمة (اسم السورة / رقم الجزء / المستوى)</Label>
                        <Input value={quizForm.source_value} onChange={e => setQuizForm({...quizForm, source_value: e.target.value})} placeholder="مثال: الناس / 30 / مبتدئ" />
                    </div>
                    <div>
                        <Label>عدد الأسئلة</Label>
                        <Input type="number" value={quizForm.goal_count} onChange={e => setQuizForm({...quizForm, goal_count: e.target.value})} />
                    </div>
                    <DialogFooter>
                        <Button onClick={handleCreateQuiz}>إنشاء</Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>

        {/* Create Challenge Modal */}
        {isLeader && (
          <>
            <CreateChallengeModal
              isOpen={showCreateChallenge}
              onClose={() => setShowCreateChallenge(false)}
              groupId={groupId}
              onSuccess={loadGroupData}
            />
            <UpdateGroupAvatar
              group={group}
              isOpen={showAvatarModal}
              onClose={() => setShowAvatarModal(false)}
              onSuccess={loadGroupData}
            />
          </>
        )}
      </motion.div>
    </div>
  );
}