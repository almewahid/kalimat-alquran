import React from "react";
import { motion } from "framer-motion";
import { Star, Award, Trophy, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function RewardsDisplay({ rewards, className = "" }) {
  const { stars = 0, medals = 0, trophies = 0, level = 1 } = rewards || {};

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <motion.div
        whileHover={{ scale: 1.1, rotate: 5 }}
        className="flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 rounded-full shadow-lg"
      >
        <Star className="w-5 h-5 fill-white" />
        <span className="font-bold text-lg">{stars}</span>
      </motion.div>

      <motion.div
        whileHover={{ scale: 1.1, rotate: -5 }}
        className="flex items-center gap-2 bg-gradient-to-r from-blue-400 to-indigo-500 text-white px-4 py-2 rounded-full shadow-lg"
      >
        <Award className="w-5 h-5" />
        <span className="font-bold text-lg">{medals}</span>
      </motion.div>

      <motion.div
        whileHover={{ scale: 1.1, rotate: 5 }}
        className="flex items-center gap-2 bg-gradient-to-r from-purple-400 to-pink-500 text-white px-4 py-2 rounded-full shadow-lg"
      >
        <Trophy className="w-5 h-5" />
        <span className="font-bold text-lg">{trophies}</span>
      </motion.div>

      <motion.div
        whileHover={{ scale: 1.1 }}
        className="flex items-center gap-2 bg-gradient-to-r from-green-400 to-emerald-500 text-white px-4 py-2 rounded-full shadow-lg"
      >
        <Sparkles className="w-5 h-5" />
        <span className="font-bold">المستوى {level}</span>
      </motion.div>
    </div>
  );
}

export function RewardAnimation({ type = "star", onComplete }) {
  const icons = {
    star: { icon: Star, color: "text-yellow-400", size: "w-32 h-32" },
    medal: { icon: Award, color: "text-blue-400", size: "w-32 h-32" },
    trophy: { icon: Trophy, color: "text-purple-400", size: "w-40 h-40" }
  };

  const { icon: Icon, color, size } = icons[type] || icons.star;

  return (
    <motion.div
      initial={{ scale: 0, rotate: -180, opacity: 0 }}
      animate={{ scale: 1, rotate: 0, opacity: 1 }}
      exit={{ scale: 0, rotate: 180, opacity: 0 }}
      transition={{ type: "spring", duration: 0.8 }}
      className="fixed inset-0 flex items-center justify-center bg-black/50 z-50"
      onClick={onComplete}
    >
      <motion.div
        animate={{ 
          scale: [1, 1.2, 1],
          rotate: [0, 10, -10, 0]
        }}
        transition={{ 
          repeat: Infinity, 
          duration: 2,
          ease: "easeInOut"
        }}
        className="relative"
      >
        <Icon className={`${size} ${color} fill-current drop-shadow-2xl`} />
        <motion.div
          animate={{ 
            scale: [1, 1.5, 1],
            opacity: [0.5, 0, 0.5]
          }}
          transition={{ 
            repeat: Infinity, 
            duration: 1.5 
          }}
          className="absolute inset-0 bg-yellow-300 rounded-full blur-2xl"
        />
      </motion.div>
      
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="absolute bottom-20 text-center"
      >
        <h2 className="text-4xl font-bold text-white mb-2">أحسنت! 🎉</h2>
        <p className="text-xl text-white/90">حصلت على مكافأة جديدة!</p>
      </motion.div>
    </motion.div>
  );
}