import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { BookOpen, Brain, BarChart3, TrendingUp, Star } from "lucide-react";
import { motion } from "framer-motion";

const createPageUrl = (pageName) => `/${pageName}`;

export default function QuickActions() {
  const actions = [
    {
      title: "تعلم كلمات جديدة",
      description: "ابدأ رحلتك اليومية",
      icon: BookOpen,
      url: createPageUrl("Learn"),
      color: "bg-gradient-to-br from-emerald-500 to-teal-600",
      textColor: "text-white",
      iconColor: "text-white/90",
      shadow: "shadow-emerald-200 dark:shadow-none"
    },
    {
      title: "قيّم معرفتك",
      description: "اختبر ما تعلمته",
      icon: Brain,
      url: createPageUrl("Quiz"),
      color: "bg-gradient-to-br from-blue-500 to-indigo-600",
      textColor: "text-white",
      iconColor: "text-white/90",
      shadow: "shadow-blue-200 dark:shadow-none"
    },
    {
      title: "تابع تقدمك",
      description: "شاهد إحصائياتك",
      icon: TrendingUp,
      url: createPageUrl("Progress"),
      color: "bg-gradient-to-br from-amber-500 to-orange-600",
      textColor: "text-white",
      iconColor: "text-white/90",
      shadow: "shadow-orange-200 dark:shadow-none"
    }
  ];

  return (
    <Card className="bg-transparent border-none shadow-none mb-8">
      <CardContent className="p-0">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-2 flex items-center justify-center gap-2">
            <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
            ماذا تريد أن تفعل؟
          </h2>
          <p className="text-muted-foreground">اختر النشاط الذي يناسبك اليوم</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          {actions.map((action, index) => (
            <motion.div
              key={action.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="h-full"
            >
              <Link to={action.url} className="h-full block">
                <div className={`w-full h-full rounded-2xl p-6 ${action.color} ${action.shadow} shadow-xl cursor-pointer relative overflow-hidden group`}>
                  {/* Decorative circles */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12 transition-transform group-hover:scale-110" />
                  
                  <div className="relative z-10 flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4 shadow-inner">
                      <action.icon className={`w-8 h-8 ${action.iconColor}`} />
                    </div>
                    <h3 className={`text-xl font-bold mb-2 ${action.textColor}`}>{action.title}</h3>
                    <p className={`text-sm opacity-90 ${action.textColor}`}>{action.description}</p>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}