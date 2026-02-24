import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Brain, Trophy } from "lucide-react";

const createPageUrl = (pageName) => `/${pageName}`;

export default function QuickActions({ wordsLearned = 0 }) {
  const [pulse, setPulse] = useState(false);

  // تشغيل النبضة بعد 3 ثوانٍ إذا لم يتفاعل الطفل
  useEffect(() => {
    const timer = setTimeout(() => setPulse(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  const isNewUser = wordsLearned === 0;
  const ctaLabel = isNewUser ? "ابدأ التعلم 🚀" : "تابع من حيث توقفت ←";

  return (
    <div className="mb-6">
      {/* زر CTA الرئيسي */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-4"
      >
        <Link to={createPageUrl("Learn")} onClick={() => setPulse(false)}>
          <motion.div
            animate={pulse ? { scale: [1, 1.03, 1] } : {}}
            transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
            className="w-full h-16 rounded-2xl bg-gradient-to-r from-yellow-400 to-orange-500 shadow-lg shadow-orange-200 dark:shadow-none flex items-center justify-center cursor-pointer"
          >
            <span className="text-white text-2xl font-black tracking-wide">
              {ctaLabel}
            </span>
          </motion.div>
        </Link>
      </motion.div>

      {/* زرّان ثانويان */}
      <div className="grid grid-cols-2 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Link to={createPageUrl("Quiz")}>
            <div className="h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-blue-200 dark:shadow-none">
              <Brain className="w-5 h-5 text-white" />
              <span className="text-white text-base font-bold">اختبر نفسك</span>
            </div>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Link to={createPageUrl("Achievements")}>
            <div className="h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-purple-200 dark:shadow-none">
              <Trophy className="w-5 h-5 text-white" />
              <span className="text-white text-base font-bold">إنجازاتك</span>
            </div>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
