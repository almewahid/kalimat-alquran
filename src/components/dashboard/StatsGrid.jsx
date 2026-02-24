import React from "react";
import { motion } from "framer-motion";

export default function StatsGrid({ wordsLearned = 0, consecutiveLoginDays = 1 }) {
  return (
    <div className="grid grid-cols-2 gap-4 mb-6">
      {/* أيام السلسلة */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="rounded-2xl bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 p-4 flex flex-col items-center justify-center text-center"
      >
        <span className="text-4xl mb-1">🔥</span>
        <span className="text-4xl font-black text-orange-500 leading-none">
          {consecutiveLoginDays}
        </span>
        <span className="text-sm font-semibold text-orange-600 dark:text-orange-400 mt-1">
          {consecutiveLoginDays === 1 ? "يوم متتالي" : "أيام متتالية"}
        </span>
      </motion.div>

      {/* الكلمات المتعلمة */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 flex flex-col items-center justify-center text-center"
      >
        <span className="text-4xl mb-1">⭐</span>
        <span className="text-4xl font-black text-yellow-500 leading-none">
          {wordsLearned}
        </span>
        <span className="text-sm font-semibold text-yellow-600 dark:text-yellow-400 mt-1">
          {wordsLearned === 1 ? "كلمة تعلّمتها" : "كلمة تعلّمتها"}
        </span>
      </motion.div>
    </div>
  );
}
