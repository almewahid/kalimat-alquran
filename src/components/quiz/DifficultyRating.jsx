import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function DifficultyRating({ onRating, isCorrectAnswer, isProcessing }) {
  if (!isCorrectAnswer) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
    >
      <motion.div
         initial={{ scale: 0.8, y: 20 }}
         animate={{ scale: 1, y: 0 }}
         transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        <Card className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-md mx-auto">
          <CardContent className="p-8 text-center">
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">
              رائع! كيف كانت صعوبة الكلمة؟
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              سيساعدنا تقييمك في تحديد موعد المراجعة القادمة.
            </p>
            
            <div className="space-y-3">
              <Button
                onClick={() => !isProcessing && onRating(3)}
                disabled={isProcessing}
                variant="outline"
                className="w-full py-6 text-lg rounded-xl border-orange-300 hover:bg-orange-50 dark:border-orange-700 dark:hover:bg-orange-900/20 disabled:opacity-50"
              >
                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : "😅 صعبة - للمراجعة قريبًا"}
              </Button>
              
              <Button
                onClick={() => !isProcessing && onRating(5)}
                disabled={isProcessing}
                className="w-full py-6 text-lg rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
              >
                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : "✅ سهلة - للمراجعة لاحقًا"}
              </Button>
            </div>
            
            <p className="text-xs text-slate-500 dark:text-slate-500 mt-4">
              نظام التكرار المتباعد يعزز الحفظ طويل الأمد.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}