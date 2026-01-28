import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Award, Star, BookOpen, Brain, Flame } from 'lucide-react';
import { motion } from 'framer-motion';
export default function AchievementsList({ userProgress, quizSessions }) {
  const achievements = [
    {
      icon: BookOpen,
      title: "المتعلم المبتدئ",
      description: "تعلم 10 كلمات",
      isUnlocked: (userProgress?.words_learned || 0) >= 10,
    },
    {
      icon: BookOpen,
      title: "باحث معرفة",
      description: "تعلم 50 كلمة",
      isUnlocked: (userProgress?.words_learned || 0) >= 50,
    },
    {
      icon: Brain,
      title: "الممتحن الأول",
      description: "أكمل أول اختبار لك",
      isUnlocked: (quizSessions?.length || 0) >= 1,
    },
    {
      icon: Brain,
      title: "عقل متمرس",
      description: "أكمل 10 اختبارات",
      isUnlocked: (quizSessions?.length || 0) >= 10,
    },
    {
      icon: Flame,
      title: "بداية قوية",
      description: "حقق سلسلة نجاح من 3 اختبارات",
      isUnlocked: (userProgress?.quiz_streak || 0) >= 3,
    },
    {
      icon: Star,
      title: "طالب مجتهد",
      description: "احصل على نتيجة 100% في اختبار",
      isUnlocked: quizSessions?.some(s => s.score === 100),
    }
  ];
  return (
    <Card className="mt-8 bg-white backdrop-blur-sm border-gray-200">
      <CardHeader>
        <CardTitle className="text-emerald-700 flex items-center gap-2">
          <Award className="w-5 h-5" />
          الإنجازات
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {achievements.map((ach, index) => (
            <motion.div
              key={ach.title}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <div 
                className={`p-4 rounded-lg text-center transition-all duration-300 ${
                  ach.isUnlocked 
                    ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100' 
                    : 'bg-gray-100 border border-gray-200 opacity-60'
                }`}
              >
                <div 
                  className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${
                    ach.isUnlocked ? 'bg-emerald-500 text-white' : 'bg-gray-300 text-gray-500'
                  }`}
                >
                  <ach.icon className="w-6 h-6" />
                </div>
                <p className="font-semibold text-sm text-gray-800">{ach.title}</p>
                <p className="text-xs text-gray-500">{ach.description}</p>
                {ach.isUnlocked && (
                  <Badge className="mt-2 bg-white text-gray-700 border border-gray-200">
                    مُنجز
                  </Badge>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}