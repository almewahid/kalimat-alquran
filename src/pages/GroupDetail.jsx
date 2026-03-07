import React, { useState, useEffect } from "react";
import { supabaseClient } from "@/components/api/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Crown, Users, Trophy, Plus, Loader2, Copy, Check, ArrowLeft,
  Brain, Trash2, LogOut, UserX, Bell,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useToast } from "@/components/ui/use-toast";

import CreateChallengeModal from "../components/challenges/CreateChallengeModal";
import ChallengeCard from "../components/challenges/ChallengeCard";
import UpdateGroupAvatar from "../components/groups/UpdateGroupAvatar";
import GroupChat from "../components/groups/GroupChat";

const TYPE_CONFIG = {
  general:   { label: "عامة",  emoji: "🌐", gradient: "from-blue-400 to-cyan-400",     bg: "bg-blue-50 dark:bg-blue-950/20"   },
  study:     { label: "دراسة", emoji: "📚", gradient: "from-green-400 to-emerald-400", bg: "bg-green-50 dark:bg-green-950/20" },
  challenge: { label: "تحدي",  emoji: "⚔️", gradient: "from-red-400 to-pink-400",      bg: "bg-red-50 dark:bg-red-950/20"    },
};
const getType = (type) => TYPE_CONFIG[type] || TYPE_CONFIG.general;

const MEDALS = ["🥇", "🥈", "🥉"];

export default function GroupDetail() {
  const { toast }   = useToast();
  const navigate    = useNavigate();

  // ── بيانات أساسية ──────────────────────────────────────────────────────────
  const [user,           setUser]           = useState(null);
  const [group,          setGroup]          = useState(null);
  const [challenges,     setChallenges]     = useState([]);
  const [members,        setMembers]        = useState([]);
  const [leaderboard,    setLeaderboard]    = useState([]);

  const [isLoading,      setIsLoading]      = useState(true);

  // ── طلبات الانضمام ─────────────────────────────────────────────────────────
  const [pendingRequests,     setPendingRequests]     = useState([]);
  const [joinRequests,        setJoinRequests]        = useState([]);

  // ── نوافذ الإنشاء ──────────────────────────────────────────────────────────
  const [showCreateChallenge, setShowCreateChallenge] = useState(false);
  const [showCreateQuiz,      setShowCreateQuiz]      = useState(false);
  const [showAvatarModal,     setShowAvatarModal]     = useState(false);
  const [copiedCode,          setCopiedCode]          = useState(false);
  const [quizForm, setQuizForm] = useState({
    title: "", description: "", source_type: "surah", source_value: "", goal_count: 10,
  });

  // ── نافذة الإشعار ──────────────────────────────────────────────────────────
  const [showNotifyModal,      setShowNotifyModal]      = useState(false);
  const [notifyMessage,        setNotifyMessage]        = useState("");
  const [isSendingNotification,setIsSendingNotification]= useState(false);

  // ── تأكيدات الإجراءات (AlertDialogs) ───────────────────────────────────────
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [showBanConfirm,    setShowBanConfirm]    = useState(false);
  const [showLeaveConfirm,  setShowLeaveConfirm]  = useState(false);
  const [showUnbanConfirm,  setShowUnbanConfirm]  = useState(false);
  const [targetMember,      setTargetMember]      = useState(null);
  const [targetUnbanEmail,  setTargetUnbanEmail]  = useState("");

  const urlParams = new URLSearchParams(window.location.search);
  const groupId   = urlParams.get("id");

  useEffect(() => {
    loadGroupData();
  }, [groupId]);

  // ── تحميل البيانات ──────────────────────────────────────────────────────────
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

      const allUsers      = await supabaseClient.entities.User.list();
      const groupMembers  = allUsers.filter(u => currentGroup.members?.includes(u.email));
      const membersWithProgress = await Promise.all(
        groupMembers.map(async (member) => {
          const [progress] = await supabaseClient.entities.UserProgress.filter({ created_by: member.email });
          return { ...member, progress: progress || { total_xp: 0, words_learned: 0 } };
        })
      );
      setMembers(membersWithProgress);

      // طلبات الانضمام المعلقة
      try {
        const allJoinRequests = await supabaseClient.entities.GroupJoinRequest.filter({
          group_id: groupId,
          status: "pending",
        });
        setJoinRequests(allJoinRequests);

        // هل للمستخدم الحالي طلب معلق؟
        const myPending = allJoinRequests.filter(r => r.user_email === currentUser.email);
        setPendingRequests(myPending);
      } catch (e) {
        // الجدول غير موجود أو لا توجد طلبات — تجاهل بصمت
      }

      // لوحة الترتيب
      const challengeIds = groupChallenges.map(c => c.id);
      if (challengeIds.length > 0) {
        const progress = await supabaseClient.entities.ChallengeProgress.filter({
          challenge_id: { $in: challengeIds },
        });
        const scores = {};
        progress.forEach(p => {
          if (p.completed) scores[p.user_email] = (scores[p.user_email] || 0) + (p.progress_value * 10);
        });
        const lb = Object.keys(scores)
          .map(email => ({ email, score: scores[email], user: allUsers.find(u => u.email === email) }))
          .sort((a, b) => b.score - a.score);
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

  // ── الإشعارات ───────────────────────────────────────────────────────────────
  const handleSendNotification = async () => {
    if (!notifyMessage.trim() || !group) return;
    setIsSendingNotification(true);
    try {
      const recipients = group.members.filter(email => email !== user.email);
      await Promise.all(recipients.map(email =>
        supabaseClient.entities.Notification.create({
          user_email:        email,
          notification_type: "group_message",
          title:             `📢 تنبيه من قائد المجموعة: ${group.name}`,
          message:           notifyMessage,
          icon:              "🔔",
          is_read:           false,
          action_url:        `/GroupDetail?id=${groupId}`,
        })
      ));
      toast({ title: "✅ تم إرسال الإشعار بنجاح" });
      setShowNotifyModal(false);
      setNotifyMessage("");
    } catch (error) {
      console.error(error);
      toast({ title: "❌ فشل الإرسال", variant: "destructive" });
    } finally {
      setIsSendingNotification(false);
    }
  };

  // ── إزالة عضو ───────────────────────────────────────────────────────────────
  const openRemoveConfirm = (member) => { setTargetMember(member); setShowRemoveConfirm(true); };
  const confirmRemoveMember = async () => {
    if (!targetMember) return;
    try {
      const updatedMembers = group.members.filter(m => m !== targetMember.email);
      await supabaseClient.supabase.from("groups").update({ members: updatedMembers }).eq("id", group.id);
      toast({ title: "✅ تم إزالة العضو" });
      loadGroupData();
    } catch {
      toast({ title: "❌ فشل الإزالة", variant: "destructive" });
    }
  };

  // ── حظر عضو ─────────────────────────────────────────────────────────────────
  const openBanConfirm = (member) => { setTargetMember(member); setShowBanConfirm(true); };
  const confirmBanMember = async () => {
    if (!targetMember) return;
    try {
      const updatedMembers = group.members.filter(m => m !== targetMember.email);
      const bannedList     = [...(group.banned_members || []), targetMember.email];
      await supabaseClient.supabase.from("groups").update({ members: updatedMembers, banned_members: bannedList }).eq("id", group.id);
      toast({ title: "✅ تم حظر العضو" });
      loadGroupData();
    } catch {
      toast({ title: "❌ فشل الحظر", variant: "destructive" });
    }
  };

  // ── إلغاء حظر ───────────────────────────────────────────────────────────────
  const openUnbanConfirm = (email) => { setTargetUnbanEmail(email); setShowUnbanConfirm(true); };
  const confirmUnban = async () => {
    try {
      const updatedBanned = group.banned_members.filter(e => e !== targetUnbanEmail);
      await supabaseClient.supabase.from("groups").update({ banned_members: updatedBanned }).eq("id", group.id);
      toast({ title: "✅ تم إلغاء الحظر" });
      loadGroupData();
    } catch {
      toast({ title: "❌ فشل الإلغاء", variant: "destructive" });
    }
  };

  // ── مغادرة المجموعة ──────────────────────────────────────────────────────────
  const confirmLeaveGroup = async () => {
    try {
      const updatedMembers = group.members.filter(m => m !== user.email);
      await supabaseClient.supabase.from("groups").update({ members: updatedMembers }).eq("id", group.id);
      toast({ title: "✅ تم مغادرة المجموعة" });
      navigate(createPageUrl("Groups"));
    } catch {
      toast({ title: "❌ فشل المغادرة", variant: "destructive" });
    }
  };

  // ── طلبات الانضمام ───────────────────────────────────────────────────────────
  const handleSendJoinRequest = async () => {
    if (!user || !group) return;

    // هل للمستخدم طلب معلق بالفعل؟
    if (pendingRequests.length > 0) {
      toast({
        title: "⏳ طلبك قيد الانتظار",
        description: "لقد أرسلت طلب انضمام بالفعل وهو بانتظار موافقة المدير.",
        variant: "default",
      });
      return;
    }

    // هل المستخدم عضو بالفعل؟
    if (group.members?.includes(user.email)) {
      toast({ title: "✅ أنت بالفعل عضو في هذه المجموعة" });
      return;
    }

    // هل المستخدم محظور؟
    if (group.banned_members?.includes(user.email)) {
      toast({ title: "⛔ أنت محظور من هذه المجموعة", variant: "destructive" });
      return;
    }

    try {
      await supabaseClient.entities.GroupJoinRequest.create({
        group_id:   groupId,
        user_email: user.email,
        status:     "pending",
      });
      // إشعار للمدير
      await supabaseClient.entities.Notification.create({
        user_email:        group.leader_email,
        notification_type: "join_request",
        title:             `📨 طلب انضمام جديد لمجموعة: ${group.name}`,
        message:           `${user.full_name || user.email} يطلب الانضمام للمجموعة`,
        icon:              "👋",
        is_read:           false,
        action_url:        `/GroupDetail?id=${groupId}`,
      });
      toast({ title: "✅ تم إرسال طلب الانضمام", description: "سيُخطرك المدير عند الموافقة أو الرفض." });
      loadGroupData();
    } catch (error) {
      console.error(error);
      toast({ title: "❌ فشل إرسال الطلب", variant: "destructive" });
    }
  };

  const handleRespondJoinRequest = async (requestId, requesterEmail, accept) => {
    try {
      await supabaseClient.supabase
        .from("group_join_requests")
        .update({ status: accept ? "accepted" : "rejected" })
        .eq("id", requestId);

      if (accept) {
        const updatedMembers = [...(group.members || []), requesterEmail];
        await supabaseClient.supabase.from("groups").update({ members: updatedMembers }).eq("id", group.id);
      }

      // إشعار للطالب بالنتيجة
      await supabaseClient.entities.Notification.create({
        user_email:        requesterEmail,
        notification_type: "join_request_response",
        title:             accept
          ? `✅ تمت الموافقة على طلبك للانضمام لـ ${group.name}`
          : `❌ تم رفض طلبك للانضمام لـ ${group.name}`,
        message:           accept
          ? "أهلاً بك في المجموعة! يمكنك الآن المشاركة في التحديات."
          : "يمكنك التواصل مع مدير المجموعة لمزيد من المعلومات.",
        icon:              accept ? "🎉" : "😔",
        is_read:           false,
        action_url:        accept ? `/GroupDetail?id=${groupId}` : "/Groups",
      });

      toast({ title: accept ? "✅ تم قبول الطلب وإضافة العضو" : "🚫 تم رفض الطلب" });
      loadGroupData();
    } catch (error) {
      console.error(error);
      toast({ title: "❌ حدث خطأ", variant: "destructive" });
    }
  };

  // ── إنشاء اختبار ─────────────────────────────────────────────────────────────
  const handleCreateQuiz = async () => {
    try {
      await supabaseClient.entities.GroupChallenge.create({
        group_id:         groupId,
        title:            quizForm.title || "اختبار جديد",
        description:      `اختبار في ${quizForm.source_type}: ${quizForm.source_value}`,
        challenge_type:   "custom_quiz",
        goal_count:       parseInt(quizForm.goal_count),
        start_date:       new Date().toISOString(),
        end_date:         new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        source_type:      quizForm.source_type === "level" ? "all" : quizForm.source_type,
        source_details:   [quizForm.source_value],
        difficulty_level: quizForm.source_type === "level" ? quizForm.source_value : "الكل",
        is_active:        true,
      });
      toast({ title: "✅ تم إنشاء الاختبار" });
      setShowCreateQuiz(false);
      loadGroupData();
    } catch (error) {
      console.error(error);
      toast({ title: "❌ حدث خطأ", variant: "destructive" });
    }
  };

  // ── حالات التحميل والخطأ ─────────────────────────────────────────────────────
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
        <div className="text-center py-20 flex flex-col items-center gap-4">
          <div className="text-6xl">😔</div>
          <h2 className="text-xl font-bold">المجموعة غير موجودة</h2>
          <Link to={createPageUrl("Groups")}>
            <Button className="bg-primary">العودة للمجموعات</Button>
          </Link>
        </div>
      </div>
    );
  }

  const cfg      = getType(group.type);
  const isLeader = user && group.leader_email === user.email;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>

        {/* ── زر الرجوع ───────────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 mb-4">
          <Link to={createPageUrl("Groups")}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <span className="text-sm text-foreground/60">المجموعات</span>
        </div>

        {/* ── بطاقة الهيدر ────────────────────────────────────────────────── */}
        <Card className={`overflow-hidden mb-8 ${cfg.bg}`}>
          <div className={`h-4 bg-gradient-to-r ${cfg.gradient}`}></div>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              {/* Avatar — صورة أو حرف احتياطي */}
              <div
                className={`w-20 h-20 rounded-2xl overflow-hidden shadow-lg flex-shrink-0 ${isLeader ? "cursor-pointer" : ""}`}
                onClick={isLeader ? () => setShowAvatarModal(true) : undefined}
                title={isLeader ? "انقر لتغيير الصورة" : ""}
              >
                {group.avatar_url ? (
                  <img src={group.avatar_url} alt={group.name} className="w-full h-full object-cover" />
                ) : (
                  <div className={`w-full h-full bg-gradient-to-br ${cfg.gradient} flex items-center justify-center`}>
                    <span className="text-white text-3xl font-bold">{group.name?.charAt(0) || "م"}</span>
                  </div>
                )}
              </div>

              {/* المعلومات */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h1 className="text-2xl font-bold gradient-text">{group.name}</h1>
                  {isLeader && (
                    <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                      <Crown className="w-3 h-3 ml-1" /> رئيس
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs">{cfg.emoji} {cfg.label}</Badge>
                </div>

                {group.description && (
                  <p className="text-foreground/60 text-sm mb-3">{group.description}</p>
                )}

                <div className="flex items-center gap-4 text-sm text-foreground/60">
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />{group.members?.length || 0} عضو
                  </span>
                  <span className="flex items-center gap-1">
                    <Trophy className="w-4 h-4" />{challenges.length} تحدي
                  </span>
                </div>
              </div>

              {/* الأزرار الجانبية */}
              <div className="flex flex-col gap-2 flex-shrink-0">
                {isLeader && (
                  <Button
                    onClick={() => setShowNotifyModal(true)}
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    disabled={isSendingNotification}
                  >
                    <Bell className="w-4 h-4" /> تنبيه الأعضاء
                  </Button>
                )}
                <Button onClick={copyJoinCode} variant="outline" size="sm" className="gap-1">
                  {copiedCode
                    ? <><Check className="w-4 h-4 text-green-600" />تم النسخ</>
                    : <><Copy className="w-4 h-4" />نسخ الكود</>
                  }
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── التبويبات ────────────────────────────────────────────────────── */}
        <Tabs defaultValue="challenges" className="mb-8">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="challenges">التحديات 🏆</TabsTrigger>
            <TabsTrigger value="leaderboard">الترتيب 🏅</TabsTrigger>
            <TabsTrigger value="members">الأعضاء 👥</TabsTrigger>
            <TabsTrigger value="chat">الدردشة 💬</TabsTrigger>
          </TabsList>

          {/* ── تبويب التحديات ─────────────────────────────────────────────── */}
          <TabsContent value="challenges" className="space-y-6">
            <Card className="bg-card shadow-md">
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <CardTitle className="text-primary flex items-center gap-2">
                    <Trophy className="w-6 h-6" />
                    التحديات والاختبارات
                  </CardTitle>
                  {isLeader && (
                    <div className="flex gap-2">
                      <Button onClick={() => setShowCreateQuiz(true)} variant="outline" size="sm" className="gap-1">
                        <Brain className="w-4 h-4" /> اختبار جديد
                      </Button>
                      <Button onClick={() => setShowCreateChallenge(true)} className={`bg-gradient-to-r ${cfg.gradient} text-white border-0 hover:opacity-90`} size="sm">
                        <Plus className="w-4 h-4 ml-1" /> تحدي جديد
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {challenges.length === 0 ? (
                  <div className="text-center py-12 flex flex-col items-center gap-4">
                    <div className="text-7xl">🏆</div>
                    <h3 className="text-xl font-bold">لا توجد تحديات بعد!</h3>
                    <p className="text-foreground/60 max-w-sm">
                      {isLeader ? "ابدأ بإنشاء أول تحدي لأعضاء مجموعتك" : "انتظر حتى يُنشئ الرئيس تحديات جديدة"}
                    </p>
                    {isLeader && (
                      <Button onClick={() => setShowCreateChallenge(true)} className={`bg-gradient-to-r ${cfg.gradient} text-white border-0 mt-2`}>
                        <Plus className="w-4 h-4 ml-2" /> إنشاء أول تحدي 🎯
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

          {/* ── تبويب الترتيب ──────────────────────────────────────────────── */}
          <TabsContent value="leaderboard">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🏅 لوحة ترتيب المجموعة
                </CardTitle>
              </CardHeader>
              <CardContent>
                {leaderboard.length === 0 ? (
                  <div className="text-center py-12 flex flex-col items-center gap-3">
                    <div className="text-6xl">🏅</div>
                    <p className="text-foreground/60">
                      لا توجد نتائج بعد — أكملوا التحديات لتظهروا هنا!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {leaderboard.map((item, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className={`flex items-center justify-between p-4 rounded-xl border ${idx === 0 ? "bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800" : idx === 1 ? "bg-gray-50 dark:bg-gray-800/30 border-gray-200" : idx === 2 ? "bg-amber-50 dark:bg-amber-950/20 border-amber-200" : "bg-card"}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl w-8 text-center">
                            {idx < 3 ? MEDALS[idx] : <span className="text-sm font-bold text-foreground/50">{idx + 1}</span>}
                          </span>
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center font-bold text-primary">
                            {item.user?.full_name?.charAt(0) || item.email.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium">
                            {item.user?.full_name || item.email}
                          </span>
                        </div>
                        <div className="text-amber-500 font-bold text-sm">
                          ⭐ {item.score} نقطة
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── تبويب الأعضاء ──────────────────────────────────────────────── */}
          <TabsContent value="members">
            <div className="grid gap-6">

              {/* طلبات الانضمام المعلقة — للرئيس فقط */}
              {isLeader && joinRequests.length > 0 && (
                <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
                  <CardHeader>
                    <CardTitle className="text-amber-700 dark:text-amber-400 flex items-center gap-2">
                      <Bell className="w-5 h-5" />
                      طلبات الانضمام المعلقة
                      <Badge className="bg-amber-500 text-white">{joinRequests.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {joinRequests.map(req => (
                        <div key={req.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-xl border">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                              <span className="text-amber-600 font-bold text-sm">{req.user_email.charAt(0).toUpperCase()}</span>
                            </div>
                            <div>
                              <p className="text-sm font-medium">{req.user_email}</p>
                              <p className="text-xs text-foreground/50">طلب انضمام معلق</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="bg-green-500 hover:bg-green-600 text-white gap-1"
                              onClick={() => handleRespondJoinRequest(req.id, req.user_email, true)}
                            >
                              <Check className="w-3 h-3" /> قبول
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-300 text-red-600 hover:bg-red-50 gap-1"
                              onClick={() => handleRespondJoinRequest(req.id, req.user_email, false)}
                            >
                              <UserX className="w-3 h-3" /> رفض
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* المحظورون — للرئيس فقط */}
              {isLeader && group.banned_members && group.banned_members.length > 0 && (
                <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                  <CardHeader>
                    <CardTitle className="text-red-700 dark:text-red-400 flex items-center gap-2">
                      <UserX className="w-5 h-5" />
                      المحظورون
                      <Badge variant="destructive">{group.banned_members.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {group.banned_members.map(email => (
                        <div key={email} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-xl border">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
                              <span className="text-red-600 font-bold text-sm">{email.charAt(0).toUpperCase()}</span>
                            </div>
                            <span className="text-sm">{email}</span>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openUnbanConfirm(email)}
                          >
                            إلغاء الحظر
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* قائمة الأعضاء */}
              <Card className="bg-card shadow-md">
                <CardHeader>
                  <CardTitle className="text-primary flex items-center gap-2">
                    <Users className="w-6 h-6" />
                    الأعضاء
                    <Badge variant="secondary">{members.length}</Badge>
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
                        className={`p-4 rounded-xl border ${cfg.bg} hover:shadow-md transition-shadow`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${cfg.gradient} flex items-center justify-center shadow-md flex-shrink-0`}>
                              <span className="text-white font-bold text-lg">
                                {member.full_name?.charAt(0) || member.email.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-foreground truncate">
                                {member.full_name || member.email}
                              </p>
                              {member.email === group.leader_email && (
                                <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 text-xs">
                                  <Crown className="w-3 h-3 ml-1" /> رئيس
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* أزرار إجراءات الرئيس */}
                          {isLeader && member.email !== user.email && (
                            <div className="flex gap-1 flex-shrink-0">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                                onClick={() => openRemoveConfirm(member)}
                                title="إزالة من المجموعة"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/20"
                                onClick={() => openBanConfirm(member)}
                                title="حظر"
                              >
                                <UserX className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </div>

                        {member.progress && (
                          <div className="flex gap-2 text-xs">
                            <Badge variant="secondary">📖 {member.progress.words_learned || 0} كلمة</Badge>
                            <Badge variant="outline">⭐ {member.progress.total_xp || 0} نقطة</Badge>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── تبويب الدردشة ──────────────────────────────────────────────── */}
          <TabsContent value="chat">
            <GroupChat
              groupId={group.id}
              currentUserEmail={user?.email}
              groupType={group.type}
            />
          </TabsContent>
        </Tabs>

        {/* ── منطقة الخطر: مغادرة المجموعة ───────────────────────────────── */}
        {!isLeader && group.members?.includes(user?.email) && (
          <div className="mt-4 pt-6 border-t border-dashed border-red-200 dark:border-red-900">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="font-medium text-red-600 dark:text-red-400">مغادرة المجموعة</p>
                <p className="text-sm text-foreground/60">
                  ستحتاج لطلب انضمام جديد إذا أردت العودة
                </p>
              </div>
              <Button
                onClick={() => setShowLeaveConfirm(true)}
                variant="outline"
                className="gap-2 border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
              >
                <LogOut className="w-4 h-4" />
                مغادرة المجموعة
              </Button>
            </div>
          </div>
        )}

        {/* ── زر الانضمام للزوار غير الأعضاء ─────────────────────────────── */}
        {user && !isLeader && !group.members?.includes(user.email) && (
          <div className="mt-4 pt-6 border-t border-dashed border-primary/20">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="font-medium text-primary">الانضمام للمجموعة</p>
                <p className="text-sm text-foreground/60">
                  {pendingRequests.length > 0
                    ? "⏳ طلبك قيد المراجعة من قِبَل المدير"
                    : "أرسل طلب انضمام وسيُراجعه مدير المجموعة"}
                </p>
              </div>
              <Button
                onClick={handleSendJoinRequest}
                disabled={pendingRequests.length > 0 || group.banned_members?.includes(user.email)}
                className={`gap-2 ${pendingRequests.length > 0 ? "bg-amber-400 hover:bg-amber-400 cursor-not-allowed" : "bg-primary"}`}
              >
                {pendingRequests.length > 0
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> طلب معلق...</>
                  : <><Plus className="w-4 h-4" /> طلب الانضمام</>
                }
              </Button>
            </div>
          </div>
        )}

        {/* ════════════════════════ Dialogs ════════════════════════ */}

        {/* إرسال إشعار للأعضاء */}
        <Dialog
          open={showNotifyModal}
          onOpenChange={(open) => { setShowNotifyModal(open); if (!open) setNotifyMessage(""); }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>📢 رسالة لأعضاء {group.name}</DialogTitle>
              <DialogDescription>
                سيصل هذا الإشعار لجميع أعضاء المجموعة ({Math.max((group.members?.length || 1) - 1, 0)} عضو)
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>الرسالة</Label>
                <Textarea
                  placeholder="اكتب رسالتك هنا..."
                  value={notifyMessage}
                  onChange={(e) => setNotifyMessage(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={handleSendNotification}
                  disabled={isSendingNotification || !notifyMessage.trim()}
                  className="flex-1 bg-primary"
                >
                  {isSendingNotification
                    ? <><Loader2 className="w-4 h-4 ml-2 animate-spin" />جارٍ الإرسال...</>
                    : <><Bell className="w-4 h-4 ml-2" />إرسال</>
                  }
                </Button>
                <Button onClick={() => setShowNotifyModal(false)} variant="outline">إلغاء</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* إنشاء اختبار */}
        <Dialog open={showCreateQuiz} onOpenChange={setShowCreateQuiz}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>🧠 إنشاء اختبار جديد</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>عنوان الاختبار</Label>
                <Input
                  value={quizForm.title}
                  onChange={e => setQuizForm({ ...quizForm, title: e.target.value })}
                  placeholder="مثال: اختبار سورة الناس"
                />
              </div>
              <div>
                <Label>نوع المصدر</Label>
                <Select value={quizForm.source_type} onValueChange={v => setQuizForm({ ...quizForm, source_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="surah">سورة</SelectItem>
                    <SelectItem value="juz">جزء</SelectItem>
                    <SelectItem value="level">مستوى (طفل/متوسط/متقدم)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>القيمة (اسم السورة / رقم الجزء / المستوى)</Label>
                <Input
                  value={quizForm.source_value}
                  onChange={e => setQuizForm({ ...quizForm, source_value: e.target.value })}
                  placeholder="مثال: الناس / 30 / مبتدئ"
                />
              </div>
              <div>
                <Label>عدد الأسئلة</Label>
                <Input
                  type="number"
                  value={quizForm.goal_count}
                  onChange={e => setQuizForm({ ...quizForm, goal_count: e.target.value })}
                />
              </div>
              <div className="flex gap-3">
                <Button onClick={handleCreateQuiz} className="flex-1 bg-primary">إنشاء الاختبار</Button>
                <Button onClick={() => setShowCreateQuiz(false)} variant="outline">إلغاء</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* مكوّنات خارجية */}
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

        {/* ── AlertDialogs ──────────────────────────────────────────────────── */}

        {/* إزالة عضو */}
        <AlertDialog open={showRemoveConfirm} onOpenChange={setShowRemoveConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>إزالة عضو</AlertDialogTitle>
              <AlertDialogDescription>
                هل تريد إزالة <strong>{targetMember?.full_name || targetMember?.email}</strong> من المجموعة؟
                <br />يمكنهم الانضمام مجدداً برمز الدعوة.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction onClick={confirmRemoveMember} className="bg-red-600 hover:bg-red-700 text-white">
                <Trash2 className="w-4 h-4 ml-2" /> نعم، إزالة
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* حظر عضو */}
        <AlertDialog open={showBanConfirm} onOpenChange={setShowBanConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>⛔ حظر عضو</AlertDialogTitle>
              <AlertDialogDescription>
                هل تريد حظر <strong>{targetMember?.full_name || targetMember?.email}</strong> ومنعه من الانضمام مستقبلاً؟
                <br />يمكنك إلغاء الحظر لاحقاً من قائمة الأعضاء.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction onClick={confirmBanMember} className="bg-orange-600 hover:bg-orange-700 text-white">
                <UserX className="w-4 h-4 ml-2" /> نعم، حظر
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* إلغاء حظر */}
        <AlertDialog open={showUnbanConfirm} onOpenChange={setShowUnbanConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>إلغاء حظر</AlertDialogTitle>
              <AlertDialogDescription>
                هل تريد إلغاء حظر <strong>{targetUnbanEmail}</strong>؟
                <br />سيتمكن من الانضمام للمجموعة مجدداً.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction onClick={confirmUnban} className="bg-green-600 hover:bg-green-700 text-white">
                <Check className="w-4 h-4 ml-2" /> نعم، إلغاء الحظر
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* مغادرة المجموعة */}
        <AlertDialog open={showLeaveConfirm} onOpenChange={setShowLeaveConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>مغادرة المجموعة</AlertDialogTitle>
              <AlertDialogDescription>
                هل تريد مغادرة مجموعة <strong>"{group.name}"</strong>؟
                <br />ستحتاج لطلب انضمام جديد إذا أردت العودة.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction onClick={confirmLeaveGroup} className="bg-red-600 hover:bg-red-700 text-white">
                <LogOut className="w-4 h-4 ml-2" /> نعم، مغادرة
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </motion.div>
    </div>
  );
}