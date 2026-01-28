import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserPlus, Users, UserCheck, UserX, Mail, Loader2, Trophy, Target, Search, Crown, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";

export default function Friends() {
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [friendships, setFriendships] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [searchEmail, setSearchEmail] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [allUsers, setAllUsers] = useState([]);
  const [friendsProgress, setFriendsProgress] = useState(new Map());

  useEffect(() => {
    loadFriendsData();
  }, []);

  const loadFriendsData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const myFriendships = await base44.entities.Friendship.filter({
        user_email: currentUser.email
      });

      const friendRequestsReceived = await base44.entities.Friendship.filter({
        friend_email: currentUser.email,
        status: "pending"
      });

      setFriendships(myFriendships);
      setFriendRequests(friendRequestsReceived);

      const users = await base44.entities.User.list();
      setAllUsers(users);

      // Load friends' progress
      const acceptedFriends = myFriendships.filter(f => f.status === "accepted");
      const friendsProgressMap = new Map();
      
      for (const friendship of acceptedFriends) {
        try {
          const [progressList] = await base44.entities.UserProgress.filter({
            created_by: friendship.friend_email
          });
          if (progressList) {
            friendsProgressMap.set(friendship.friend_email, progressList);
          }
        } catch (error) {
          console.error(`Error loading progress for ${friendship.friend_email}:`, error);
        }
      }
      
      setFriendsProgress(friendsProgressMap);

    } catch (error) {
      console.error("Error loading friends data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendFriendRequest = async () => {
    if (!searchEmail.trim()) {
      toast({
        title: "⚠️ أدخل بريد إلكتروني",
        description: "يجب إدخال البريد الإلكتروني للصديق",
        variant: "destructive"
      });
      return;
    }

    if (searchEmail === user.email) {
      toast({
        title: "⚠️ خطأ",
        description: "لا يمكنك إضافة نفسك كصديق!",
        variant: "destructive"
      });
      return;
    }

    try {
      const existing = friendships.find(
        f => f.friend_email === searchEmail && f.status === "accepted"
      );
      if (existing) {
        toast({
          title: "ℹ️ بالفعل أصدقاء",
          description: "أنت وهذا المستخدم أصدقاء بالفعل",
        });
        return;
      }

      const pendingRequest = friendships.find(
        f => f.friend_email === searchEmail && f.status === "pending"
      );
      if (pendingRequest) {
        toast({
          title: "ℹ️ طلب معلق",
          description: "لديك طلب صداقة معلق بالفعل لهذا المستخدم",
        });
        return;
      }

      await base44.entities.Friendship.create({
        user_email: user.email,
        friend_email: searchEmail,
        status: "pending",
        requested_date: new Date().toISOString()
      });

      await base44.entities.Notification.create({
        user_email: searchEmail,
        notification_type: "friend_request",
        title: "طلب صداقة جديد",
        message: `${user.full_name} يريد إضافتك كصديق`,
        is_read: false,
        icon: "👥"
      });

      toast({
        title: "✅ تم إرسال الطلب",
        description: "تم إرسال طلب الصداقة بنجاح",
        className: "bg-green-100 text-green-800"
      });

      setSearchEmail("");
      loadFriendsData();

    } catch (error) {
      console.error("Error sending friend request:", error);
      toast({
        title: "❌ فشل الإرسال",
        description: "حدث خطأ، حاول مرة أخرى",
        variant: "destructive"
      });
    }
  };

  const acceptFriendRequest = async (friendship) => {
    try {
      await base44.entities.Friendship.update(friendship.id, {
        status: "accepted",
        accepted_date: new Date().toISOString()
      });

      await base44.entities.Friendship.create({
        user_email: user.email,
        friend_email: friendship.user_email,
        status: "accepted",
        requested_date: friendship.requested_date,
        accepted_date: new Date().toISOString()
      });

      await base44.entities.Notification.create({
        user_email: friendship.user_email,
        notification_type: "friend_request",
        title: "تم قبول طلب الصداقة",
        message: `${user.full_name} قبل طلب صداقتك`,
        is_read: false,
        icon: "✅"
      });

      toast({
        title: "✅ تم قبول الطلب",
        description: "أصبحتما أصدقاء الآن!",
        className: "bg-green-100 text-green-800"
      });

      loadFriendsData();

    } catch (error) {
      console.error("Error accepting friend request:", error);
      toast({
        title: "❌ فشل القبول",
        description: "حدث خطأ، حاول مرة أخرى",
        variant: "destructive"
      });
    }
  };

  const rejectFriendRequest = async (friendship) => {
    try {
      await base44.entities.Friendship.delete(friendship.id);

      toast({
        title: "تم رفض الطلب",
        description: "تم رفض طلب الصداقة"
      });

      loadFriendsData();

    } catch (error) {
      console.error("Error rejecting friend request:", error);
      toast({
        title: "❌ فشل الرفض",
        description: "حدث خطأ، حاول مرة أخرى",
        variant: "destructive"
      });
    }
  };

  const removeFriend = async (friendship) => {
    try {
      await base44.entities.Friendship.delete(friendship.id);

      const reverseFriendship = friendships.find(
        f => f.user_email === friendship.friend_email && f.friend_email === user.email
      );
      if (reverseFriendship) {
        await base44.entities.Friendship.delete(reverseFriendship.id);
      }

      toast({
        title: "تمت الإزالة",
        description: "تم حذف الصديق من قائمتك"
      });

      loadFriendsData();

    } catch (error) {
      console.error("Error removing friend:", error);
      toast({
        title: "❌ فشل الحذف",
        description: "حدث خطأ، حاول مرة أخرى",
        variant: "destructive"
      });
    }
  };

  const getFriendUser = (email) => {
    return allUsers.find(u => u.email === email);
  };

  const getRequestUser = (email) => {
    return allUsers.find(u => u.email === email);
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  const acceptedFriends = friendships.filter(f => f.status === "accepted");
  const pendingRequests = friendships.filter(f => f.status === "pending");

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-center mb-8">
          <Users className="w-16 h-16 text-primary mx-auto mb-4" />
          <h1 className="text-4xl font-bold gradient-text mb-2">الأصدقاء</h1>
          <p className="text-foreground/70">تواصل وتنافس مع أصدقائك</p>
        </div>

        <Card className="mb-8 bg-card shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary" />
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
                  onKeyPress={(e) => e.key === 'Enter' && sendFriendRequest()}
                  className="pr-10"
                />
              </div>
              <Button onClick={sendFriendRequest} className="bg-primary">
                <UserPlus className="w-4 h-4 ml-2" />
                إرسال طلب
              </Button>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="friends" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="friends" className="gap-2">
              <Users className="w-4 h-4" />
              أصدقائي ({acceptedFriends.length})
            </TabsTrigger>
            <TabsTrigger value="requests" className="gap-2">
              <UserCheck className="w-4 h-4" />
              الطلبات ({friendRequests.length + pendingRequests.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="friends">
            {acceptedFriends.length === 0 ? (
              <Alert>
                <AlertDescription className="text-center py-8">
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p>لا يوجد أصدقاء بعد</p>
                  <p className="text-sm text-foreground/70">ابدأ بإضافة أصدقاء لمتابعة تقدمهم</p>
                </AlertDescription>
              </Alert>
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
                      <Card className="bg-card shadow-md hover:shadow-lg transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                <Users className="w-6 h-6 text-primary" />
                              </div>
                              <div>
                                <h3 className="font-bold text-foreground">{friendUser?.full_name || "مستخدم"}</h3>
                                <p className="text-xs text-foreground/70">{friendship.friend_email}</p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeFriend(friendship)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <UserX className="w-4 h-4" />
                            </Button>
                          </div>

                          {progress && (
                            <div className="space-y-3 pt-3 border-t border-border">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-foreground/70">المستوى</span>
                                <Badge className="bg-primary/10 text-primary">
                                  <Crown className="w-3 h-3 ml-1" />
                                  {progress.current_level}
                                </Badge>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-foreground/70">النقاط</span>
                                <Badge variant="outline">
                                  <Trophy className="w-3 h-3 ml-1 text-amber-500" />
                                  {progress.total_xp} XP
                                </Badge>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-foreground/70">الكلمات</span>
                                <Badge variant="outline">
                                  <Target className="w-3 h-3 ml-1 text-blue-500" />
                                  {progress.words_learned}
                                </Badge>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-foreground/70">السلسلة</span>
                                <Badge variant="outline">
                                  <TrendingUp className="w-3 h-3 ml-1 text-green-500" />
                                  {progress.quiz_streak}
                                </Badge>
                              </div>
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

          <TabsContent value="requests">
            <div className="space-y-6">
              {friendRequests.length > 0 && (
                <div>
                  <h3 className="font-bold mb-4 flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-primary" />
                    طلبات واردة ({friendRequests.length})
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {friendRequests.map((request, index) => {
                      const requestUser = getRequestUser(request.user_email);

                      return (
                        <motion.div
                          key={request.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <Card className="bg-card shadow-md">
                            <CardContent className="p-6">
                              <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                  <UserPlus className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                  <h3 className="font-bold text-foreground">{requestUser?.full_name || "مستخدم"}</h3>
                                  <p className="text-xs text-foreground/70">{request.user_email}</p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  onClick={() => acceptFriendRequest(request)}
                                  className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                                >
                                  <UserCheck className="w-4 h-4 ml-2" />
                                  قبول
                                </Button>
                                <Button
                                  onClick={() => rejectFriendRequest(request)}
                                  variant="outline"
                                  className="flex-1 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
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

              {pendingRequests.length > 0 && (
                <div>
                  <h3 className="font-bold mb-4 flex items-center gap-2">
                    <Mail className="w-5 h-5 text-primary" />
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
                          <Card className="bg-card shadow-md">
                            <CardContent className="p-6">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                                  <Mail className="w-6 h-6 text-amber-600" />
                                </div>
                                <div>
                                  <h3 className="font-bold text-foreground">{requestUser?.full_name || "مستخدم"}</h3>
                                  <p className="text-xs text-foreground/70">{request.friend_email}</p>
                                  <Badge className="mt-2 bg-amber-100 text-amber-700">
                                    قيد الانتظار
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

              {friendRequests.length === 0 && pendingRequests.length === 0 && (
                <Alert>
                  <AlertDescription className="text-center py-8">
                    <Mail className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p>لا توجد طلبات صداقة</p>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}