import React, { useState, useEffect } from "react";
import { supabaseClient } from "@/components/api/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  UserPlus, Users, UserCheck, UserX, Mail, Loader2,
  Trophy, Target, Crown, TrendingUp, Activity, BookOpen, Award,
} from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";

const MEDALS = ["🥇", "🥈", "🥉"];
const ROW_BG = [
  "bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800",
  "bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-700",
  "bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800",
];

const AVATAR_COLOR = "from-violet-500 to-purple-500";

const getInitial = (name, email) =>
  name?.charAt(0)?.toUpperCase() || email?.charAt(0)?.toUpperCase() || "؟";

export default function Friends() {
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [friendships, setFriendships] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [searchEmail, setSearchEmail] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [allUsers, setAllUsers] = useState([]);
  const [friendsProgress, setFriendsProgress] = useState(new Map());
  const [friendsActivity, setFriendsActivity] = useState(new Map());
  const [friendsLeaderboard, setFriendsLeaderboard] = useState([]);
  const [removingFriend, setRemovingFriend] = useState(null);

  useEffect(() => {
    loadFriendsData();
  }, []);

  const loadFriendsData = async () => {
    try {
      const currentUser = await supabaseClient.auth.me();
      setUser(currentUser);

      const myFriendships = await supabaseClient.entities.Friendship.filter({
        user_email: currentUser.email,
      });
      const friendRequestsReceived = await supabaseClient.entities.Friendship.filter({
        friend_email: currentUser.email,
        status: "pending",
      });

      setFriendships(myFriendships);
      setFriendRequests(friendRequestsReceived);

      const users = await supabaseClient.entities.User.list();
      setAllUsers(users);

      const acceptedFriends = myFriendships.filter((f) => f.status === "accepted");
      const friendsProgressMap = new Map();
      const friendsActivityMap = new Map();
      const leaderboardData = [];

      for (const friendship of acceptedFriends) {
        try {
          const [progressList, recentActivity, courseProgress] = await Promise.all([
            supabaseClient.entities.UserProgress.filter({ user_email: friendship.friend_email }),
            supabaseClient.entities.ActivityLog.filter(
              { user_email: friendship.friend_email },
              "-created_date",
              5
            ),
            supabaseClient.entities.UserCourseProgress.filter({
              user_email: friendship.friend_email,
            }),
          ]);

          if (progressList?.length > 0) {
            friendsProgressMap.set(friendship.friend_email, progressList[0]);
            leaderboardData.push({
              email: friendship.friend_email,
              name:
                users.find((u) => u.email === friendship.friend_email)?.full_name ||
                friendship.friend_email,
              total_xp: progressList[0].total_xp || 0,
              words_learned: progressList[0].words_learned || 0,
              level: progressList[0].current_level || 1,
              quiz_streak: progressList[0].quiz_streak || 0,
            });
          }

          friendsActivityMap.set(friendship.friend_email, {
            recentActions: recentActivity || [],
            activeCourses: courseProgress?.filter((cp) => !cp.is_completed) || [],
            completedCourses: courseProgress?.filter((cp) => cp.is_completed) || [],
          });
        } catch (error) {
          console.error(`Error loading data for ${friendship.friend_email}:`, error);
        }
      }

      setFriendsProgress(friendsProgressMap);
      setFriendsActivity(friendsActivityMap);
      setFriendsLeaderboard(leaderboardData.sort((a, b) => b.total_xp - a.total_xp));
    } catch (error) {
      console.error("Error loading friends data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendFriendRequest = async () => {
    if (!searchEmail.trim()) {
      toast({ title: "⚠️ أدخل بريد إلكتروني", variant: "destructive" });
      return;
    }
    if (searchEmail === user.email) {
      toast({ title: "⚠️ لا يمكنك إضافة نفسك", variant: "destructive" });
      return;
    }
    try {
      const existing = friendships.find(
        (f) => f.friend_email === searchEmail && f.status === "accepted"
      );
      if (existing) {
        toast({ title: "ℹ️ بالفعل أصدقاء" });
        return;
      }
      await supabaseClient.entities.Friendship.create({
        user_email: user.email,
        friend_email: searchEmail,
        status: "pending",
        requested_date: new Date().toISOString(),
      });
      await supabaseClient.entities.Notification.create({
        user_email: searchEmail,
        notification_type: "friend_request",
        title: "طلب صداقة جديد",
        message: `${user.full_name} يريد إضافتك كصديق`,
        is_read: false,
        icon: "👥",
      });
      toast({ title: "✅ تم إرسال الطلب", className: "bg-green-100 text-green-800" });
      setSearchEmail("");
      loadFriendsData();
    } catch (error) {
      toast({ title: "❌ فشل الإرسال", variant: "destructive" });
    }
  };

  const acceptFriendRequest = async (friendship) => {
    try {
      await supabaseClient.entities.Friendship.update(friendship.id, {
        status: "accepted",
        accepted_date: new Date().toISOString(),
      });
      await supabaseClient.entities.Friendship.create({
        user_email: user.email,
        friend_email: friendship.user_email,
        status: "accepted",
        requested_date: friendship.requested_date,
        accepted_date: new Date().toISOString(),
      });
      await supabaseClient.entities.Notification.create({
        user_email: friendship.user_email,
        notification_type: "friend_request",
        title: "تم قبول طلب الصداقة",
        message: `${user.full_name} قبل طلب صداقتك`,
        is_read: false,
        icon: "✅",
      });
      toast({ title: "✅ تم قبول الطلب", className: "bg-green-100 text-green-800" });
      loadFriendsData();
    } catch (error) {
      toast({ title: "❌ فشل القبول", variant: "destructive" });
    }
  };

  const rejectFriendRequest = async (friendship) => {
    try {
      await supabaseClient.entities.Friendship.delete(friendship.id);
      toast({ title: "تم رفض الطلب" });
      loadFriendsData();
    } catch (error) {
      toast({ title: "❌ فشل الرفض", variant: "destructive" });
    }
  };

  const confirmRemoveFriend = async () => {
    if (!removingFriend) return;
    try {
      await supabaseClient.entities.Friendship.delete(removingFriend.id);
      const reverseFriendship = friendships.find(
        (f) =>
          f.user_email === removingFriend.friend_email &&
          f.friend_email === user.email
      );
      if (reverseFriendship) {
        await supabaseClient.entities.Friendship.delete(reverseFriendship.id);
      }
      toast({ title: "تمت الإزالة" });
      loadFriendsData();
    } catch (error) {
      toast({ title: "❌ فشل الحذف", variant: "destructive" });
    } finally {
      setRemovingFriend(null);
    }
  };

  const getFriendUser = (email) => allUsers.find((u) => u.email === email);

  if (isLoading) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="text-foreground/60">جارٍ تحميل الأصدقاء...</p>
      </div>
    );
  }

  const acceptedFriends = friendships.filter((f) => f.status === "accepted");
  const pendingRequests = friendships.filter((f) => f.status === "pending");

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>

        {/* ── الهيدر ── */}
        <div className="text-center mb-8">
          <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${AVATAR_COLOR} flex items-center justify-center mx-auto mb-4 shadow-lg`}>
            <Users className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold gradient-text mb-2">الأصدقاء</h1>
          <p className="text-foreground/70">تواصل وتنافس مع أصدقائك</p>
          {acceptedFriends.length > 0 && (
            <p className="text-primary font-medium mt-1">
              👥 {acceptedFriends.length} صديق
            </p>
          )}
        </div>

        {/* ── إضافة صديق ── */}
        <Card className="mb-8 overflow-hidden shadow-md">
          <div className={`h-4 bg-gradient-to-r ${AVATAR_COLOR}`} />
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${AVATAR_COLOR} flex items-center justify-center shadow-lg`}>
                <UserPlus className="w-5 h-5 text-white" />
              </div>
              إضافة صديق جديد
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                <Input
                  type="email"
                  placeholder="أدخل البريد الإلكتروني للصديق"
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendFriendRequest()}
                  className="pr-10 rounded-xl"
                />
              </div>
              <Button
                onClick={sendFriendRequest}
                className={`bg-gradient-to-r ${AVATAR_COLOR} hover:opacity-90 text-white border-0 rounded-xl`}
              >
                <UserPlus className="w-4 h-4 ml-2" />
                إرسال طلب
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ── التبويبات ── */}
        <Tabs defaultValue="friends" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="friends">أصدقائي 👥 ({acceptedFriends.length})</TabsTrigger>
            <TabsTrigger value="activity">النشاط 🎯</TabsTrigger>
            <TabsTrigger value="leaderboard">الترتيب 🏆</TabsTrigger>
            <TabsTrigger value="requests">
              الطلبات 📬 ({friendRequests.length + pendingRequests.length})
            </TabsTrigger>
          </TabsList>

          {/* ── تبويب الأصدقاء ── */}
          <TabsContent value="friends">
            {acceptedFriends.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
                <div className="text-6xl">👫</div>
                <p className="text-foreground/70 font-medium text-lg">لا يوجد أصدقاء بعد</p>
                <p className="text-sm text-foreground/50 max-w-xs">
                  أضف أصدقاء لمتابعة تقدمهم والتنافس معهم!
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {acceptedFriends.map((friendship, index) => {
                  const friendUser = getFriendUser(friendship.friend_email);
                  const progress = friendsProgress.get(friendship.friend_email);

                  return (
                    <motion.div
                      key={friendship.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="overflow-hidden shadow-md hover:shadow-xl transition-all hover:-translate-y-1 min-h-[200px]">
                        <div className={`h-4 bg-gradient-to-r ${AVATAR_COLOR}`} />
                        <CardContent className="p-5">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${AVATAR_COLOR} flex items-center justify-center shadow-lg`}>
                                <span className="text-white font-bold text-xl">
                                  {getInitial(friendUser?.full_name, friendship.friend_email)}
                                </span>
                              </div>
                              <div>
                                <h3 className="font-bold text-foreground text-base">
                                  {friendUser?.full_name || "مستخدم"}
                                </h3>
                                <p className="text-xs text-foreground/60">{friendship.friend_email}</p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setRemovingFriend(friendship)}
                              className="text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 h-8 w-8"
                            >
                              <UserX className="w-4 h-4" />
                            </Button>
                          </div>

                          {progress ? (
                            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-border">
                              <div className="bg-violet-50 dark:bg-violet-950/20 rounded-xl p-2 text-center">
                                <Crown className="w-4 h-4 text-violet-500 mx-auto mb-1" />
                                <p className="text-xs text-foreground/60">المستوى</p>
                                <p className="font-bold text-violet-600">{progress.current_level}</p>
                              </div>
                              <div className="bg-amber-50 dark:bg-amber-950/20 rounded-xl p-2 text-center">
                                <span className="text-base">⭐</span>
                                <p className="text-xs text-foreground/60">النقاط</p>
                                <p className="font-bold text-amber-600">{progress.total_xp}</p>
                              </div>
                              <div className="bg-blue-50 dark:bg-blue-950/20 rounded-xl p-2 text-center">
                                <Target className="w-4 h-4 text-blue-500 mx-auto mb-1" />
                                <p className="text-xs text-foreground/60">كلمات</p>
                                <p className="font-bold text-blue-600">{progress.words_learned}</p>
                              </div>
                              <div className="bg-green-50 dark:bg-green-950/20 rounded-xl p-2 text-center">
                                <TrendingUp className="w-4 h-4 text-green-500 mx-auto mb-1" />
                                <p className="text-xs text-foreground/60">السلسلة</p>
                                <p className="font-bold text-green-600">{progress.quiz_streak} 🔥</p>
                              </div>
                            </div>
                          ) : (
                            <div className="pt-3 border-t border-border text-center text-sm text-foreground/50 py-4">
                              لا توجد بيانات بعد
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* ── تبويب النشاط ── */}
          <TabsContent value="activity">
            <Card className="overflow-hidden shadow-md">
              <div className="h-4 bg-gradient-to-r from-green-500 to-emerald-500" />
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg">
                    <Activity className="w-5 h-5 text-white" />
                  </div>
                  نشاط الأصدقاء
                </CardTitle>
              </CardHeader>
              <CardContent>
                {acceptedFriends.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
                    <div className="text-5xl">🌙</div>
                    <p className="text-foreground/70 font-medium">لا يوجد أصدقاء لعرض نشاطهم</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {acceptedFriends.map((friendship) => {
                      const friendUser = getFriendUser(friendship.friend_email);
                      const activity = friendsActivity.get(friendship.friend_email);
                      if (!activity) return null;

                      return (
                        <Card key={friendship.friend_email} className="overflow-hidden">
                          <div className="h-2 bg-gradient-to-r from-green-400 to-emerald-400" />
                          <CardContent className="p-4">
                            <div className="flex items-start gap-4">
                              <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${AVATAR_COLOR} flex items-center justify-center shadow-md flex-shrink-0`}>
                                <span className="text-white font-bold text-lg">
                                  {getInitial(friendUser?.full_name, friendship.friend_email)}
                                </span>
                              </div>
                              <div className="flex-1">
                                <h3 className="font-bold text-base mb-2">
                                  {friendUser?.full_name || friendship.friend_email}
                                </h3>

                                {activity.activeCourses?.length > 0 && (
                                  <div className="mb-2 flex items-center gap-2 flex-wrap">
                                    <BookOpen className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                    <span className="text-sm text-foreground/70">يدرس حالياً:</span>
                                    {activity.activeCourses.slice(0, 3).map((cp, idx) => (
                                      <Badge key={idx} variant="secondary" className="text-xs">
                                        📖 {cp.completed_words_count || 0} كلمة
                                      </Badge>
                                    ))}
                                  </div>
                                )}

                                {activity.completedCourses?.length > 0 && (
                                  <div className="mb-2 flex items-center gap-2">
                                    <Award className="w-4 h-4 text-green-500 flex-shrink-0" />
                                    <span className="text-sm text-foreground/70">
                                      أتم {activity.completedCourses.length} دورة ✅
                                    </span>
                                  </div>
                                )}

                                {activity.recentActions?.length > 0 && (
                                  <div className="space-y-1">
                                    {activity.recentActions.slice(0, 3).map((action, idx) => (
                                      <p key={idx} className="text-xs text-foreground/60">
                                        • {action.description}
                                      </p>
                                    ))}
                                  </div>
                                )}

                                {!activity.activeCourses?.length &&
                                  !activity.completedCourses?.length &&
                                  !activity.recentActions?.length && (
                                    <p className="text-sm text-foreground/50">لا يوجد نشاط حديث 🌙</p>
                                  )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── تبويب الترتيب ── */}
          <TabsContent value="leaderboard">
            <Card className="overflow-hidden shadow-md">
              <div className="h-4 bg-gradient-to-r from-amber-500 to-yellow-500" />
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center shadow-lg">
                    <Trophy className="w-5 h-5 text-white" />
                  </div>
                  ترتيب أصدقائي
                </CardTitle>
              </CardHeader>
              <CardContent>
                {friendsLeaderboard.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
                    <div className="text-5xl">🏅</div>
                    <p className="text-foreground/70 font-medium">لا يوجد أصدقاء بعد</p>
                    <p className="text-sm text-foreground/50">أضف أصدقاء لتبدأ المنافسة!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {friendsLeaderboard.map((friend, idx) => {
                      const isCurrentUser = friend.email === user?.email;
                      const rowBg = idx < 3 ? ROW_BG[idx] : "bg-background-soft";

                      return (
                        <motion.div
                          key={friend.email}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className={`flex items-center gap-4 p-4 rounded-xl ${rowBg} ${
                            isCurrentUser ? "ring-2 ring-primary" : ""
                          }`}
                        >
                          {/* الميدالية / الرقم */}
                          <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
                            {idx < 3 ? (
                              <span className="text-2xl">{MEDALS[idx]}</span>
                            ) : (
                              <span className="font-bold text-foreground/60 text-lg">#{idx + 1}</span>
                            )}
                          </div>

                          {/* الأفاتار */}
                          <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${AVATAR_COLOR} flex items-center justify-center shadow-md flex-shrink-0`}>
                            <span className="text-white font-bold text-sm">
                              {getInitial(friend.name, friend.email)}
                            </span>
                          </div>

                          {/* الاسم والبيانات */}
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-foreground truncate">
                              {friend.name}
                              {isCurrentUser && (
                                <Badge variant="outline" className="mr-2 text-xs">أنت</Badge>
                              )}
                            </p>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <span className="text-xs text-foreground/60">المستوى {friend.level}</span>
                              <span className="text-xs text-foreground/60">📖 {friend.words_learned} كلمة</span>
                              {friend.quiz_streak > 0 && (
                                <span className="text-xs text-foreground/60">🔥 {friend.quiz_streak}</span>
                              )}
                            </div>
                          </div>

                          {/* النقاط */}
                          <div className="text-right flex-shrink-0">
                            <p className="text-xl font-bold text-amber-600">{friend.total_xp}</p>
                            <p className="text-xs text-foreground/60">⭐ نقطة</p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── تبويب الطلبات ── */}
          <TabsContent value="requests">
            <div className="space-y-6">

              {/* طلبات واردة */}
              {friendRequests.length > 0 && (
                <div>
                  <h3 className="font-bold mb-4 flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-green-500" />
                    طلبات واردة ({friendRequests.length})
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {friendRequests.map((request, index) => {
                      const requestUser = allUsers.find((u) => u.email === request.user_email);
                      return (
                        <motion.div
                          key={request.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <Card className="overflow-hidden shadow-md">
                            <div className="h-4 bg-gradient-to-r from-green-500 to-emerald-500" />
                            <CardContent className="p-5">
                              <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg">
                                  <span className="text-white font-bold text-lg">
                                    {getInitial(requestUser?.full_name, request.user_email)}
                                  </span>
                                </div>
                                <div>
                                  <h3 className="font-bold">{requestUser?.full_name || "مستخدم"}</h3>
                                  <p className="text-xs text-foreground/60">{request.user_email}</p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  onClick={() => acceptFriendRequest(request)}
                                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:opacity-90 text-white border-0 rounded-xl"
                                >
                                  <UserCheck className="w-4 h-4 ml-2" />
                                  قبول ✅
                                </Button>
                                <Button
                                  onClick={() => rejectFriendRequest(request)}
                                  variant="outline"
                                  className="flex-1 rounded-xl hover:bg-red-50 hover:text-red-600 hover:border-red-300"
                                >
                                  <UserX className="w-4 h-4 ml-2" />
                                  رفض
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

              {/* طلبات صادرة */}
              {pendingRequests.length > 0 && (
                <div>
                  <h3 className="font-bold mb-4 flex items-center gap-2">
                    <Mail className="w-5 h-5 text-amber-500" />
                    طلبات صادرة ({pendingRequests.length})
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {pendingRequests.map((request, index) => {
                      const requestUser = getFriendUser(request.friend_email);
                      return (
                        <motion.div
                          key={request.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <Card className="overflow-hidden shadow-md">
                            <div className="h-4 bg-gradient-to-r from-amber-500 to-orange-400" />
                            <CardContent className="p-5">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-400 flex items-center justify-center shadow-lg">
                                  <span className="text-white font-bold text-lg">
                                    {getInitial(requestUser?.full_name, request.friend_email)}
                                  </span>
                                </div>
                                <div>
                                  <h3 className="font-bold">{requestUser?.full_name || "مستخدم"}</h3>
                                  <p className="text-xs text-foreground/60">{request.friend_email}</p>
                                  <Badge className="mt-2 bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
                                    ⏳ قيد الانتظار
                                  </Badge>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* empty state */}
              {friendRequests.length === 0 && pendingRequests.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
                  <div className="text-6xl">📬</div>
                  <p className="text-foreground/70 font-medium text-lg">صندوقك فارغ!</p>
                  <p className="text-sm text-foreground/50">لا توجد طلبات صداقة حالياً</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* ── AlertDialog إزالة صديق ── */}
      <AlertDialog open={!!removingFriend} onOpenChange={(o) => !o && setRemovingFriend(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>إزالة الصديق</AlertDialogTitle>
            <AlertDialogDescription>
              هل تريد إزالة{" "}
              <strong>
                {getFriendUser(removingFriend?.friend_email)?.full_name ||
                  removingFriend?.friend_email}
              </strong>{" "}
              من قائمة أصدقائك؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemoveFriend}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              إزالة
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
