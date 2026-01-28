import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Crown, Star, Zap, Flame, Loader2, Award } from "lucide-react";
import { motion } from "framer-motion";

export default function Leaderboard() {
  const [globalLeaderboard, setGlobalLeaderboard] = useState([]);
  const [weeklyLeaderboard, setWeeklyLeaderboard] = useState([]);
  const [groupLeaderboards, setGroupLeaderboards] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    loadLeaderboards();
  }, []);

  const loadLeaderboards = async () => {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);

      // Global leaderboard (all time)
      const allProgress = await base44.entities.UserProgress.list();
      const sortedGlobal = allProgress
        .sort((a, b) => (b.total_xp || 0) - (a.total_xp || 0))
        .slice(0, 50);

      const allUsers = await base44.entities.User.list();
      const globalData = sortedGlobal.map((prog, index) => {
        const userInfo = allUsers.find(u => u.email === prog.created_by);
        return {
          rank: index + 1,
          email: prog.created_by,
          name: userInfo?.full_name || prog.created_by,
          total_xp: prog.total_xp || 0,
          level: prog.current_level || 1,
          words_learned: prog.words_learned || 0,
          quiz_streak: prog.quiz_streak || 0
        };
      });

      setGlobalLeaderboard(globalData);

      // Weekly leaderboard
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekAgoStr = weekAgo.toISOString();

      const recentSessions = await base44.entities.QuizSession.list('-created_date', 1000);
      const weekSessions = recentSessions.filter(s => s.created_date >= weekAgoStr);

      const weeklyXP = {};
      weekSessions.forEach(session => {
        const email = session.created_by;
        weeklyXP[email] = (weeklyXP[email] || 0) + (session.xp_earned || 0);
      });

      const weeklyData = Object.entries(weeklyXP)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 50)
        .map(([email, xp], index) => {
          const userInfo = allUsers.find(u => u.email === email);
          return {
            rank: index + 1,
            email,
            name: userInfo?.full_name || email,
            weekly_xp: xp
          };
        });

      setWeeklyLeaderboard(weeklyData);

      // Group leaderboards
      const allGroups = await base44.entities.Group.list();
      const groupsData = [];

      for (const group of allGroups.slice(0, 5)) {
        const groupProgress = allProgress.filter(p => group.members?.includes(p.created_by));
        const sortedGroup = groupProgress
          .sort((a, b) => (b.total_xp || 0) - (a.total_xp || 0))
          .slice(0, 10)
          .map((prog, index) => {
            const userInfo = allUsers.find(u => u.email === prog.created_by);
            return {
              rank: index + 1,
              email: prog.created_by,
              name: userInfo?.full_name || prog.created_by,
              total_xp: prog.total_xp || 0,
              level: prog.current_level || 1
            };
          });

        groupsData.push({
          group,
          members: sortedGroup
        });
      }

      setGroupLeaderboards(groupsData);

    } catch (error) {
      console.error("Error loading leaderboards:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const LeaderboardTable = ({ data, type = "global", showWeeklyXP = false }) => {
    const getMedalEmoji = (rank) => {
      if (rank === 1) return "🥇";
      if (rank === 2) return "🥈";
      if (rank === 3) return "🥉";
      return null;
    };

    return (
      <div className="space-y-3">
        {data.map((item, index) => {
          const isCurrentUser = item.email === currentUser?.email;
          const medalEmoji = getMedalEmoji(item.rank);

          return (
            <motion.div
              key={item.email}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03 }}
              className={`flex items-center gap-4 p-4 rounded-lg ${
                isCurrentUser ? "bg-primary/10 border-2 border-primary" : "bg-background-soft"
              }`}
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                {medalEmoji ? (
                  <span className="text-3xl">{medalEmoji}</span>
                ) : (
                  <span className="font-bold text-primary text-lg">#{item.rank}</span>
                )}
              </div>

              <div className="flex-1">
                <p className="font-medium text-foreground">
                  {item.name}
                  {isCurrentUser && (
                    <Badge variant="outline" className="mr-2 text-xs">أنت</Badge>
                  )}
                </p>
                <div className="flex items-center gap-3 mt-1">
                  {!showWeeklyXP && (
                    <>
                      <Badge variant="outline" className="text-xs">
                        <Crown className="w-3 h-3 ml-1" />
                        المستوى {item.level}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        <Star className="w-3 h-3 ml-1" />
                        {item.words_learned} كلمة
                      </Badge>
                      {item.quiz_streak > 0 && (
                        <Badge variant="outline" className="text-xs">
                          <Flame className="w-3 h-3 ml-1 text-orange-500" />
                          {item.quiz_streak}
                        </Badge>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="text-left">
                <p className="text-2xl font-bold text-primary">
                  {showWeeklyXP ? item.weekly_xp : item.total_xp}
                </p>
                <p className="text-xs text-foreground/70">
                  {showWeeklyXP ? "نقطة هذا الأسبوع" : "نقطة خبرة"}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    );
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
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold gradient-text mb-2">🏆 لوحة الترتيب</h1>
          <p className="text-foreground/70">تنافس مع المتعلمين الآخرين</p>
        </div>

        <Tabs defaultValue="global" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="global" className="gap-2">
              <Trophy className="w-4 h-4" />
              الترتيب العام
            </TabsTrigger>
            <TabsTrigger value="weekly" className="gap-2">
              <Zap className="w-4 h-4" />
              هذا الأسبوع
            </TabsTrigger>
            <TabsTrigger value="groups" className="gap-2">
              <Award className="w-4 h-4" />
              المجموعات
            </TabsTrigger>
          </TabsList>

          <TabsContent value="global">
            <Card className="bg-card shadow-md">
              <CardHeader>
                <CardTitle className="text-primary">أفضل المتعلمين (إجمالي النقاط)</CardTitle>
              </CardHeader>
              <CardContent>
                {globalLeaderboard.length === 0 ? (
                  <div className="text-center py-8 text-foreground/70">
                    لا توجد بيانات بعد
                  </div>
                ) : (
                  <LeaderboardTable data={globalLeaderboard} type="global" />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="weekly">
            <Card className="bg-card shadow-md">
              <CardHeader>
                <CardTitle className="text-primary">نجوم الأسبوع ⭐</CardTitle>
              </CardHeader>
              <CardContent>
                {weeklyLeaderboard.length === 0 ? (
                  <div className="text-center py-8 text-foreground/70">
                    لا توجد بيانات لهذا الأسبوع
                  </div>
                ) : (
                  <LeaderboardTable data={weeklyLeaderboard} type="weekly" showWeeklyXP={true} />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="groups">
            <div className="space-y-6">
              {groupLeaderboards.length === 0 ? (
                <Card className="bg-card shadow-md">
                  <CardContent className="py-8 text-center text-foreground/70">
                    لا توجد مجموعات بعد
                  </CardContent>
                </Card>
              ) : (
                groupLeaderboards.map((groupData, index) => (
                  <motion.div
                    key={groupData.group.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="bg-card shadow-md">
                      <CardHeader>
                        <CardTitle className="text-primary flex items-center gap-2">
                          <Trophy className="w-5 h-5" />
                          {groupData.group.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <LeaderboardTable data={groupData.members} type="group" />
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}