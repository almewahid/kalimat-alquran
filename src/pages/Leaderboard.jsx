import React, { useState, useEffect } from "react";
import { supabaseClient } from "@/components/api/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Crown, Zap, Flame, Loader2, Award, Target } from "lucide-react";
import { motion } from "framer-motion";

const MEDALS = ["🥇", "🥈", "🥉"];
const ROW_BG = [
  "bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800",
  "bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-700",
  "bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800",
];

const TYPE_CONFIG = {
  general:   { gradient: "from-blue-400 to-cyan-400",    bg: "bg-blue-50 dark:bg-blue-950/20",   label: "عامة",  emoji: "🌐" },
  study:     { gradient: "from-green-500 to-emerald-500", bg: "bg-green-50 dark:bg-green-950/20", label: "دراسة", emoji: "📚" },
  challenge: { gradient: "from-amber-500 to-orange-500",  bg: "bg-amber-50 dark:bg-amber-950/20", label: "تحدي",  emoji: "⚔️" },
};
const getType = (type) => TYPE_CONFIG[type] || TYPE_CONFIG.general;

const getInitial = (name, email) =>
  name?.charAt(0)?.toUpperCase() || email?.charAt(0)?.toUpperCase() || "؟";

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
      const user = await supabaseClient.auth.me();
      setCurrentUser(user);

      const [allProgress, allUsers] = await Promise.all([
        supabaseClient.entities.UserProgress.list(),
        supabaseClient.entities.User.list(),
      ]);

      // ── الترتيب العام ──
      const sortedGlobal = [...allProgress]
        .sort((a, b) => (b.total_xp || 0) - (a.total_xp || 0))
        .slice(0, 50);

      const globalData = sortedGlobal.map((prog, index) => {
        const userInfo = allUsers.find((u) => u.email === prog.user_email);
        return {
          rank: index + 1,
          email: prog.user_email,
          name: userInfo?.full_name || prog.user_email,
          total_xp: prog.total_xp || 0,
          level: prog.current_level || 1,
          words_learned: prog.words_learned || 0,
          quiz_streak: prog.quiz_streak || 0,
        };
      });
      setGlobalLeaderboard(globalData);

      // ── ترتيب الأسبوع ──
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekAgoStr = weekAgo.toISOString();

      const recentSessions = await supabaseClient.entities.QuizSession.list("-created_date", 1000);
      const weekSessions = recentSessions.filter((s) => s.created_date >= weekAgoStr);

      const weeklyXP = {};
      const weeklyCount = {};
      weekSessions.forEach((session) => {
        const email = session.user_email;
        weeklyXP[email] = (weeklyXP[email] || 0) + (session.xp_earned || 0);
        weeklyCount[email] = (weeklyCount[email] || 0) + 1;
      });

      const weeklyData = Object.entries(weeklyXP)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 50)
        .map(([email, xp], index) => {
          const userInfo = allUsers.find((u) => u.email === email);
          return {
            rank: index + 1,
            email,
            name: userInfo?.full_name || email,
            weekly_xp: xp,
            sessions_count: weeklyCount[email] || 0,
          };
        });
      setWeeklyLeaderboard(weeklyData);

      // ── ترتيب المجموعات ──
      const allGroups = await supabaseClient.entities.Group.list();
      const groupsData = [];

      for (const group of allGroups.slice(0, 5)) {
        // إصلاح: members مصفوفة objects [{email}] وليس strings
        const groupProgress = allProgress.filter((p) =>
          group.members?.some((m) => m.email === p.user_email)
        );
        const sortedGroup = [...groupProgress]
          .sort((a, b) => (b.total_xp || 0) - (a.total_xp || 0))
          .slice(0, 10)
          .map((prog, index) => {
            const userInfo = allUsers.find((u) => u.email === prog.user_email);
            return {
              rank: index + 1,
              email: prog.user_email,
              name: userInfo?.full_name || prog.user_email,
              total_xp: prog.total_xp || 0,
              level: prog.current_level || 1,
              words_learned: prog.words_learned || 0,
            };
          });

        if (sortedGroup.length > 0) {
          groupsData.push({ group, members: sortedGroup });
        }
      }
      setGroupLeaderboards(groupsData);

    } catch (error) {
      console.error("Error loading leaderboards:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // ── مكون صف الترتيب ──
  const LeaderboardRow = ({ item, index, showWeeklyXP = false }) => {
    const isCurrentUser = item.email === currentUser?.email;
    const rowBg = index < 3 ? ROW_BG[index] : "bg-card";

    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: Math.min(index * 0.03, 0.5) }}
        className={`flex items-center gap-3 p-4 rounded-xl ${rowBg} ${
          isCurrentUser ? "ring-2 ring-primary" : ""
        }`}
      >
        {/* الميدالية / الرقم */}
        <div className="w-10 flex items-center justify-center flex-shrink-0">
          {index < 3 ? (
            <span className="text-2xl">{MEDALS[index]}</span>
          ) : (
            <span className="font-bold text-foreground/50 text-base">#{item.rank}</span>
          )}
        </div>

        {/* الأفاتار */}
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md flex-shrink-0 text-white font-bold text-sm ${
            index === 0
              ? "bg-gradient-to-br from-amber-400 to-yellow-500"
              : index === 1
              ? "bg-gradient-to-br from-gray-400 to-slate-500"
              : index === 2
              ? "bg-gradient-to-br from-orange-400 to-amber-600"
              : "bg-gradient-to-br from-violet-500 to-purple-500"
          }`}
        >
          {getInitial(item.name, item.email)}
        </div>

        {/* الاسم والإحصاءات */}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-foreground truncate text-sm">
            {item.name}
            {isCurrentUser && (
              <Badge variant="outline" className="mr-2 text-xs">أنت</Badge>
            )}
          </p>
          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
            {!showWeeklyXP && (
              <>
                <span className="text-xs text-foreground/60 flex items-center gap-0.5">
                  <Crown className="w-3 h-3" /> {item.level}
                </span>
                <span className="text-xs text-foreground/60 flex items-center gap-0.5">
                  <Target className="w-3 h-3" /> {item.words_learned} كلمة
                </span>
                {item.quiz_streak > 0 && (
                  <span className="text-xs text-foreground/60">🔥 {item.quiz_streak}</span>
                )}
              </>
            )}
            {showWeeklyXP && item.sessions_count > 0 && (
              <span className="text-xs text-foreground/60">✅ {item.sessions_count} اختبار</span>
            )}
          </div>
        </div>

        {/* النقاط */}
        <div className="text-right flex-shrink-0">
          <p className={`text-xl font-bold ${index === 0 ? "text-amber-600" : index === 1 ? "text-gray-500" : index === 2 ? "text-orange-600" : "text-primary"}`}>
            {showWeeklyXP ? item.weekly_xp : item.total_xp}
          </p>
          <p className="text-xs text-foreground/60">⭐ نقطة</p>
        </div>
      </motion.div>
    );
  };

  if (isLoading) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-amber-500" />
        <p className="text-foreground/60">جارٍ تحميل المتسابقين...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>

        {/* ── الهيدر ── */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Trophy className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold gradient-text mb-2">لوحة الترتيب</h1>
          <p className="text-foreground/70">تنافس واحصل على المراكز الأولى 🚀</p>
        </div>

        {/* ── التبويبات ── */}
        <Tabs defaultValue="global" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="global">الترتيب العام 🌍</TabsTrigger>
            <TabsTrigger value="weekly">هذا الأسبوع ⚡</TabsTrigger>
            <TabsTrigger value="groups">المجموعات 👥</TabsTrigger>
          </TabsList>

          {/* ── الترتيب العام ── */}
          <TabsContent value="global">
            <Card className="overflow-hidden shadow-md">
              <div className="h-4 bg-gradient-to-r from-amber-500 to-yellow-500" />
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center shadow-lg">
                    <Trophy className="w-5 h-5 text-white" />
                  </div>
                  أفضل المتعلمين — إجمالي النقاط
                </CardTitle>
              </CardHeader>
              <CardContent>
                {globalLeaderboard.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
                    <div className="text-6xl">🏆</div>
                    <p className="text-foreground/70 font-medium">لا توجد بيانات بعد</p>
                    <p className="text-sm text-foreground/50">كن أول المتسابقين!</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {globalLeaderboard.map((item, index) => (
                      <LeaderboardRow key={item.email} item={item} index={index} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── ترتيب الأسبوع ── */}
          <TabsContent value="weekly">
            <Card className="overflow-hidden shadow-md">
              <div className="h-4 bg-gradient-to-r from-indigo-500 to-violet-500" />
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  نجوم هذا الأسبوع ⭐
                </CardTitle>
              </CardHeader>
              <CardContent>
                {weeklyLeaderboard.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
                    <div className="text-6xl">⚡</div>
                    <p className="text-foreground/70 font-medium">لا أحد اختبر هذا الأسبوع بعد!</p>
                    <p className="text-sm text-foreground/50">كن الأول وتصدّر القائمة</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {weeklyLeaderboard.map((item, index) => (
                      <LeaderboardRow key={item.email} item={item} index={index} showWeeklyXP />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── ترتيب المجموعات ── */}
          <TabsContent value="groups">
            {groupLeaderboards.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
                <div className="text-6xl">👥</div>
                <p className="text-foreground/70 font-medium">لا توجد مجموعات بعد</p>
                <p className="text-sm text-foreground/50">انضم لمجموعة وابدأ التنافس!</p>
              </div>
            ) : (
              <div className="space-y-6">
                {groupLeaderboards.map((groupData, index) => {
                  const cfg = getType(groupData.group.type);
                  return (
                    <motion.div
                      key={groupData.group.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="overflow-hidden shadow-md">
                        <div className={`h-4 bg-gradient-to-r ${cfg.gradient}`} />
                        <CardHeader>
                          <CardTitle className="flex items-center gap-3 flex-wrap">
                            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${cfg.gradient} flex items-center justify-center shadow-lg flex-shrink-0`}>
                              <Award className="w-5 h-5 text-white" />
                            </div>
                            <span>{groupData.group.name}</span>
                            <Badge className={`${cfg.bg} text-foreground/80 border-0`}>
                              {cfg.emoji} {cfg.label}
                            </Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {groupData.members.map((item, idx) => (
                              <LeaderboardRow key={item.email} item={item} index={idx} />
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
