import React, { useState, useEffect } from "react";
import { supabaseClient } from "@/components/api/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  Plus,
  LogIn,
  Crown,
  Loader2,
  Trophy,
  Trash2,
  Bell,
  Check,
  X,
  UserPlus,
  Copy,
} from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useToast } from "@/components/ui/use-toast";

function generateJoinCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

const TYPE_CONFIG = {
  general:   { label: "عامة",   emoji: "🌐", gradient: "from-blue-400 to-cyan-400",    bg: "bg-blue-50 dark:bg-blue-950/20"   },
  study:     { label: "دراسة",  emoji: "📚", gradient: "from-green-400 to-emerald-400", bg: "bg-green-50 dark:bg-green-950/20" },
  challenge: { label: "تحدي",   emoji: "⚔️", gradient: "from-red-400 to-pink-400",     bg: "bg-red-50 dark:bg-red-950/20"    },
};
const getType = (type) => TYPE_CONFIG[type] || TYPE_CONFIG.general;

export default function Groups() {
  const { toast } = useToast();

  const [user,         setUser]         = useState(null);
  const [groups,       setGroups]       = useState([]);
  const [myGroups,     setMyGroups]     = useState([]);
  const [joinRequests, setJoinRequests] = useState([]);
  const [isLoading,    setIsLoading]    = useState(true);

  // modals
  const [showCreateModal,  setShowCreateModal]  = useState(false);
  const [showJoinModal,    setShowJoinModal]    = useState(false);
  const [showNotifyModal,  setShowNotifyModal]  = useState(false);
  const [showDeleteConfirm,setShowDeleteConfirm]= useState(false);

  // form state
  const [newGroup,      setNewGroup]      = useState({ name: "", description: "", type: "general" });
  const [joinCode,      setJoinCode]      = useState("");
  const [notifyMessage, setNotifyMessage] = useState("");
  const [notifyingGroup,setNotifyingGroup]= useState(null);
  const [deletingGroup, setDeletingGroup] = useState(null);

  // loading flags
  const [isCreating,           setIsCreating]           = useState(false);
  const [isJoining,            setIsJoining]            = useState(false);
  const [isSendingNotification,setIsSendingNotification]= useState(false);

  // track sent requests to disable duplicate buttons
  const [sentRequests, setSentRequests] = useState(new Set());

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const currentUser = await supabaseClient.auth.me();
      setUser(currentUser);

      const allGroups = await supabaseClient.entities.Group.list();
      const userGroups = allGroups.filter(g =>
        g.leader_email === currentUser.email ||
        (g.members && g.members.includes(currentUser.email))
      );
      setGroups(allGroups);
      setMyGroups(userGroups);

      // طلبات الانضمام الواردة للمستخدم بصفته رئيساً
      const allNotifs = await supabaseClient.entities.Notification.filter({ user_email: currentUser.email });
      const pending = allNotifs.filter(n => n.notification_type === "join_request" && !n.is_read);
      setJoinRequests(pending);
    } catch (error) {
      console.error("Error loading groups:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // ── إنشاء مجموعة ────────────────────────────────────────────────────────────
  const handleCreateGroup = async () => {
    if (!newGroup.name.trim()) {
      toast({ title: "⚠️ الرجاء إدخال اسم المجموعة", variant: "destructive" });
      return;
    }
    setIsCreating(true);
    try {
      await supabaseClient.entities.Group.create({
        name:         newGroup.name,
        description:  newGroup.description,
        join_code:    generateJoinCode(),
        leader_email: user.email,
        members:      [user.email],
        is_active:    true,
        type:         newGroup.type || "general",
      });
      toast({ title: "✅ تم إنشاء المجموعة بنجاح", className: "bg-green-100 text-green-800" });
      setShowCreateModal(false);
      setNewGroup({ name: "", description: "", type: "general" });
      loadData();
    } catch (error) {
      console.error("Error creating group:", error);
      toast({ title: "❌ خطأ في إنشاء المجموعة", variant: "destructive" });
    } finally {
      setIsCreating(false);
    }
  };

  // ── إرسال طلب انضمام (مشترك) ────────────────────────────────────────────────
  const sendJoinRequest = async (group) => {
    if (!group) return false;
    if (group.leader_email === user.email || group.members?.includes(user.email)) {
      toast({ title: "ℹ️ أنت عضو بالفعل في هذه المجموعة" });
      return false;
    }
    const { error } = await supabaseClient.supabase.from("user_notifications").insert({
      user_email:        group.leader_email,
      notification_type: "join_request",
      title:             `طلب انضمام لمجموعة "${group.name}"`,
      message:           JSON.stringify({
        requester_email: user.email,
        group_id:        group.id,
        group_name:      group.name,
      }),
      icon:        "🤝",
      is_read:     false,
      created_date: new Date().toISOString(),
    });
    if (error) throw error;
    setSentRequests(prev => new Set([...prev, group.id]));
    return true;
  };

  // ── انضمام بالكود ────────────────────────────────────────────────────────────
  const handleJoinByCode = async () => {
    if (!joinCode.trim()) {
      toast({ title: "⚠️ الرجاء إدخال كود الانضمام", variant: "destructive" });
      return;
    }
    const targetGroup = groups.find(g => g.join_code === joinCode.trim().toUpperCase());
    if (!targetGroup) {
      toast({ title: "❌ كود الانضمام غير صحيح", variant: "destructive" });
      return;
    }
    setIsJoining(true);
    try {
      const ok = await sendJoinRequest(targetGroup);
      if (ok) {
        toast({ title: "✅ تم إرسال طلب الانضمام", description: "انتظر موافقة رئيس المجموعة" });
        setShowJoinModal(false);
        setJoinCode("");
      }
    } catch {
      toast({ title: "❌ خطأ في إرسال الطلب", variant: "destructive" });
    } finally {
      setIsJoining(false);
    }
  };

  // ── انضمام من قسم الاكتشاف ──────────────────────────────────────────────────
  const handleRequestJoinDiscover = async (group) => {
    try {
      const ok = await sendJoinRequest(group);
      if (ok) toast({ title: "✅ تم إرسال طلب الانضمام", description: "انتظر موافقة رئيس المجموعة" });
    } catch {
      toast({ title: "❌ خطأ في إرسال الطلب", variant: "destructive" });
    }
  };

  // ── قبول طلب الانضمام ───────────────────────────────────────────────────────
  const handleApproveRequest = async (request) => {
    try {
      const data = JSON.parse(request.message);
      const group = groups.find(g => g.id === data.group_id);
      if (!group) { toast({ title: "❌ المجموعة غير موجودة", variant: "destructive" }); return; }

      const updatedMembers = [...(group.members || []), data.requester_email];
      await supabaseClient.supabase.from("groups").update({ members: updatedMembers }).eq("id", group.id);
      await supabaseClient.supabase.from("notifications").update({ is_read: true }).eq("id", request.id);

      // إشعار الموافقة للطالب
      await supabaseClient.supabase.from("user_notifications").insert({
        user_email:        data.requester_email,
        notification_type: "join_approved",
        title:             `✅ تمت الموافقة على انضمامك`,
        message:           `تمت الموافقة على انضمامك إلى مجموعة "${data.group_name}"`,
        icon:         "✅",
        is_read:      false,
        created_date: new Date().toISOString(),
      });

      toast({ title: "✅ تمت الموافقة", description: `تم إضافة ${data.requester_email} للمجموعة`, className: "bg-green-100 text-green-800" });
      loadData();
    } catch (error) {
      console.error("Error approving request:", error);
      toast({ title: "❌ خطأ في قبول الطلب", variant: "destructive" });
    }
  };

  // ── رفض طلب الانضمام ────────────────────────────────────────────────────────
  const handleRejectRequest = async (request) => {
    try {
      const data = JSON.parse(request.message);
      await supabaseClient.supabase.from("notifications").update({ is_read: true }).eq("id", request.id);

      // إشعار الرفض للطالب
      await supabaseClient.supabase.from("user_notifications").insert({
        user_email:        data.requester_email,
        notification_type: "join_rejected",
        title:             `تعذّر الانضمام`,
        message:           `لم تتم الموافقة على انضمامك إلى مجموعة "${data.group_name}"`,
        icon:         "❌",
        is_read:      false,
        created_date: new Date().toISOString(),
      });

      toast({ title: "تم رفض الطلب" });
      loadData();
    } catch (error) {
      console.error("Error rejecting request:", error);
      toast({ title: "❌ خطأ في رفض الطلب", variant: "destructive" });
    }
  };

  // ── حذف المجموعة ────────────────────────────────────────────────────────────
  const handleDeleteGroup = async () => {
    if (!deletingGroup) return;
    try {
      await supabaseClient.supabase.from("groups").delete().eq("id", deletingGroup.id);
      toast({ title: "✅ تم حذف المجموعة", className: "bg-green-100 text-green-800" });
      setShowDeleteConfirm(false);
      setDeletingGroup(null);
      loadData();
    } catch (error) {
      console.error("Error deleting group:", error);
      toast({ title: "❌ خطأ في حذف المجموعة", variant: "destructive" });
    }
  };

  // ── إرسال إشعار للمجموعة ────────────────────────────────────────────────────
  const handleSendGroupNotification = async () => {
    if (!notifyMessage.trim() || !notifyingGroup) return;
    setIsSendingNotification(true);
    try {
      const recipients = notifyingGroup.members.filter(m => m !== user.email);
      await Promise.all(recipients.map(email =>
        supabaseClient.supabase.from("user_notifications").insert({
          user_email:        email,
          notification_type: "group_message",
          title:             `📢 رسالة من مجموعة ${notifyingGroup.name}`,
          message:           notifyMessage,
          icon:         "📢",
          is_read:      false,
          created_date: new Date().toISOString(),
        })
      ));
      toast({ title: "✅ تم إرسال الإشعار للأعضاء" });
      setShowNotifyModal(false);
      setNotifyMessage("");
      setNotifyingGroup(null);
    } catch (error) {
      console.error(error);
      toast({ title: "❌ فشل الإرسال", variant: "destructive" });
    } finally {
      setIsSendingNotification(false);
    }
  };

  // المجموعات التي يمكن اكتشافها (المستخدم ليس فيها)
  const discoverGroups = groups.filter(g =>
    g.is_active !== false &&
    g.leader_email !== user?.email &&
    (!g.members || !g.members.includes(user?.email))
  );

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

        {/* ── Header ──────────────────────────────────────────────────────────── */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold gradient-text mb-2">👥 المجموعات</h1>
          <p className="text-foreground/70 text-lg">تعلّم مع أصدقائك وتنافسوا معاً!</p>
          <div className="flex justify-center gap-3 mt-5">
            <Button onClick={() => setShowCreateModal(true)} className="bg-primary text-primary-foreground gap-2" size="lg">
              <Plus className="w-5 h-5" />
              أنشئ مجموعة
            </Button>
            <Button onClick={() => setShowJoinModal(true)} variant="outline" className="gap-2" size="lg">
              <LogIn className="w-5 h-5" />
              انضم بكود
            </Button>
          </div>
        </div>

        {/* ── طلبات الانضمام (للرؤساء) ─────────────────────────────────────── */}
        {joinRequests.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-amber-700 dark:text-amber-400 flex items-center gap-2">
                  <UserPlus className="w-5 h-5" />
                  طلبات الانضمام
                  <Badge className="bg-amber-500 text-white">{joinRequests.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {joinRequests.map(request => {
                  let data = {};
                  try { data = JSON.parse(request.message); } catch { /* ignore parse error */ }
                  return (
                    <div key={request.id} className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center flex-shrink-0">
                          <span className="text-amber-700 dark:text-amber-300 font-bold text-lg">
                            {data.requester_email?.charAt(0)?.toUpperCase() || "؟"}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{data.requester_email}</p>
                          <p className="text-xs text-foreground/60 truncate">يريد الانضمام إلى "{data.group_name}"</p>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <Button size="sm" className="bg-green-500 hover:bg-green-600 text-white gap-1" onClick={() => handleApproveRequest(request)}>
                          <Check className="w-4 h-4" /> قبول
                        </Button>
                        <Button size="sm" variant="outline" className="border-red-300 text-red-600 hover:bg-red-50 gap-1" onClick={() => handleRejectRequest(request)}>
                          <X className="w-4 h-4" /> رفض
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ── مجموعاتي ─────────────────────────────────────────────────────── */}
        <div className="mb-10">
          <h2 className="text-xl font-bold text-foreground mb-5 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            مجموعاتي
            {myGroups.length > 0 && <Badge variant="secondary">{myGroups.length}</Badge>}
          </h2>

          {myGroups.length === 0 ? (
            <Card className="bg-card">
              <CardContent className="py-16 text-center flex flex-col items-center gap-4">
                <div className="text-7xl">👫</div>
                <h3 className="text-xl font-bold">لم تنضم لأي مجموعة بعد!</h3>
                <p className="text-foreground/60 max-w-sm">
                  أنشئ مجموعتك أو انضم لأصدقائك وتعلّموا معاً
                </p>
                <div className="flex gap-3 mt-2">
                  <Button onClick={() => setShowCreateModal(true)} className="bg-primary">
                    <Plus className="w-4 h-4 ml-1" /> أنشئ مجموعة
                  </Button>
                  <Button onClick={() => setShowJoinModal(true)} variant="outline">
                    <LogIn className="w-4 h-4 ml-1" /> انضم بكود
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myGroups.map((group, index) => {
                const cfg = getType(group.type);
                const isLeader = group.leader_email === user?.email;
                return (
                  <motion.div key={group.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
                    <Card className={`overflow-hidden min-h-[220px] ${cfg.bg} hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}>
                      <div className={`h-4 bg-gradient-to-r ${cfg.gradient}`}></div>
                      <CardContent className="p-5">
                        {/* Row: avatar + badges */}
                        <div className="flex items-start justify-between mb-3">
                          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${cfg.gradient} flex items-center justify-center shadow-lg flex-shrink-0`}>
                            <span className="text-white text-2xl font-bold">
                              {group.name?.charAt(0) || "م"}
                            </span>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            {isLeader && (
                              <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 text-xs">
                                <Crown className="w-3 h-3 ml-1" /> رئيس
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-xs">
                              {cfg.emoji} {cfg.label}
                            </Badge>
                          </div>
                        </div>

                        <h3 className="font-bold text-lg mb-1">{group.name}</h3>
                        {group.description && (
                          <p className="text-sm text-foreground/60 mb-3 line-clamp-2">{group.description}</p>
                        )}
                        <div className="flex items-center gap-1 text-sm text-foreground/60 mb-4">
                          <Users className="w-4 h-4" />
                          <span>{group.members?.length || 0} عضو</span>
                        </div>

                        {/* كود الانضمام (للرئيس فقط) */}
                        {isLeader && group.join_code && (
                          <div
                            className="flex items-center justify-between bg-muted/60 rounded-xl px-3 py-2 mb-3 cursor-pointer hover:bg-muted transition-colors"
                            title="اضغط لنسخ الكود"
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

                        {/* Buttons */}
                        <div className="flex gap-2">
                          <Link to={createPageUrl(`GroupDetail?id=${group.id}`)} className="flex-1">
                            <Button className={`w-full bg-gradient-to-r ${cfg.gradient} text-white border-0 hover:opacity-90`}>
                              ادخل المجموعة ←
                            </Button>
                          </Link>
                          {isLeader && (
                            <>
                              <Button
                                size="icon"
                                variant="outline"
                                title="إرسال إشعار للأعضاء"
                                onClick={() => { setNotifyingGroup(group); setShowNotifyModal(true); }}
                              >
                                <Bell className="w-4 h-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="outline"
                                title="حذف المجموعة"
                                onClick={() => { setDeletingGroup(group); setShowDeleteConfirm(true); }}
                                className="border-red-200 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── اكتشف مجموعات أخرى ───────────────────────────────────────────── */}
        {discoverGroups.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-foreground mb-5 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              اكتشف مجموعات أخرى
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {discoverGroups.map((group, index) => {
                const cfg = getType(group.type);
                const alreadySent = sentRequests.has(group.id);
                return (
                  <motion.div key={group.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                    <Card className="overflow-hidden min-h-[180px] hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                      <div className={`h-4 bg-gradient-to-r ${cfg.gradient} opacity-60`}></div>
                      <CardContent className="p-5">
                        <div className="flex items-start gap-3 mb-3">
                          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${cfg.gradient} flex items-center justify-center shadow-md flex-shrink-0 opacity-80`}>
                            <span className="text-white text-xl font-bold">
                              {group.name?.charAt(0) || "م"}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-base mb-1 truncate">{group.name}</h3>
                            <Badge variant="outline" className="text-xs">{cfg.emoji} {cfg.label}</Badge>
                          </div>
                        </div>

                        {group.description && (
                          <p className="text-sm text-foreground/60 mb-3 line-clamp-2">{group.description}</p>
                        )}

                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm text-foreground/60 flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {group.members?.length || 0} عضو
                          </span>
                          <Button
                            size="sm"
                            disabled={alreadySent}
                            onClick={() => handleRequestJoinDiscover(group)}
                            className={
                              alreadySent
                                ? "bg-gray-100 text-gray-400 dark:bg-gray-800 cursor-not-allowed"
                                : `bg-gradient-to-r ${cfg.gradient} text-white border-0 hover:opacity-90`
                            }
                          >
                            {alreadySent
                              ? <><Check className="w-3 h-3 ml-1" />تم الإرسال</>
                              : <><UserPlus className="w-3 h-3 ml-1" />طلب انضمام</>
                            }
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* ════════════════════════ Dialogs ════════════════════════ */}

        {/* إنشاء مجموعة */}
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>✨ إنشاء مجموعة جديدة</DialogTitle>
              <DialogDescription>أنشئ مجموعة وادعُ أصدقاءك للانضمام</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="group-name">اسم المجموعة *</Label>
                <Input
                  id="group-name"
                  placeholder="مثال: مجموعة حفظ جزء عم"
                  value={newGroup.name}
                  onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="group-desc">الوصف (اختياري)</Label>
                <Textarea
                  id="group-desc"
                  placeholder="وصف مختصر للمجموعة..."
                  value={newGroup.description}
                  onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                  rows={2}
                />
              </div>
              <div>
                <Label>نوع المجموعة</Label>
                <Select value={newGroup.type} onValueChange={(val) => setNewGroup({ ...newGroup, type: val })}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر نوع المجموعة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">🌐 عامة</SelectItem>
                    <SelectItem value="study">📚 مجموعة دراسة</SelectItem>
                    <SelectItem value="challenge">⚔️ تحدي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-3">
                <Button onClick={handleCreateGroup} disabled={isCreating} className="flex-1 bg-primary">
                  {isCreating
                    ? <><Loader2 className="w-4 h-4 ml-2 animate-spin" />جارٍ الإنشاء...</>
                    : <><Plus className="w-4 h-4 ml-2" />إنشاء المجموعة</>
                  }
                </Button>
                <Button onClick={() => setShowCreateModal(false)} variant="outline">إلغاء</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* انضم بكود — يرسل طلب انضمام */}
        <Dialog open={showJoinModal} onOpenChange={setShowJoinModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>🔑 انضم بكود الدعوة</DialogTitle>
              <DialogDescription>
                أدخل الكود الذي حصلت عليه — سيُرسل طلبك لرئيس المجموعة للموافقة
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="join-code">كود الانضمام</Label>
                <Input
                  id="join-code"
                  placeholder="مثال: ABC123"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  className="text-center text-2xl tracking-widest font-mono"
                />
              </div>
              <div className="flex gap-3">
                <Button onClick={handleJoinByCode} disabled={isJoining} className="flex-1 bg-primary">
                  {isJoining
                    ? <><Loader2 className="w-4 h-4 ml-2 animate-spin" />جارٍ الإرسال...</>
                    : <><UserPlus className="w-4 h-4 ml-2" />أرسل طلب الانضمام</>
                  }
                </Button>
                <Button onClick={() => setShowJoinModal(false)} variant="outline">إلغاء</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* إرسال إشعار للمجموعة */}
        <Dialog open={showNotifyModal} onOpenChange={(open) => { setShowNotifyModal(open); if (!open) { setNotifyMessage(""); setNotifyingGroup(null); } }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>📢 رسالة لأعضاء {notifyingGroup?.name}</DialogTitle>
              <DialogDescription>
                سيصل هذا الإشعار لجميع أعضاء المجموعة ({Math.max((notifyingGroup?.members?.length || 1) - 1, 0)} عضو)
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
                <Button onClick={handleSendGroupNotification} disabled={isSendingNotification || !notifyMessage.trim()} className="flex-1 bg-primary">
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

        {/* تأكيد حذف المجموعة */}
        <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>🗑️ حذف المجموعة</AlertDialogTitle>
              <AlertDialogDescription>
                هل أنت متأكد من حذف مجموعة <strong>"{deletingGroup?.name}"</strong>؟
                <br className="my-1" />
                سيتم حذف جميع بيانات المجموعة نهائياً ولا يمكن التراجع عن هذا الإجراء.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteGroup}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Trash2 className="w-4 h-4 ml-2" />
                نعم، احذف المجموعة
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </motion.div>
    </div>
  );
}
