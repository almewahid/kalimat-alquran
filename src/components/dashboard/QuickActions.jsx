import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { PlayCircle, BookOpenCheck } from "lucide-react";

const createPageUrl = (pageName) => `/${pageName}`;

export default function QuickActions({ wordsLearned = 0 }) {
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setPulse(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  const isNewUser = wordsLearned === 0;
  const ctaLabel = isNewUser ? "ابدأ التعلم" : "تابع من حيث توقفت";
  const CtaIcon = isNewUser ? BookOpenCheck : PlayCircle;

  return (
    <div className="mb-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Link to={createPageUrl("Learn")} onClick={() => setPulse(false)}>
          <motion.div
            animate={pulse ? { scale: [1, 1.03, 1] } : {}}
            transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
            className="w-full h-16 rounded-2xl bg-gradient-to-r from-emerald-400 to-green-600 shadow-lg shadow-green-200 dark:shadow-none flex items-center justify-center gap-3 cursor-pointer"
          >
            <CtaIcon className="w-7 h-7 text-white" />
            <span className="text-white text-2xl font-black tracking-wide">
              {ctaLabel}
            </span>
          </motion.div>
        </Link>
      </motion.div>
    </div>
  );
}
