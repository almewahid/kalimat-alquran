import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, RotateCcw, Trophy, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export default function QuizResults({ questions, answers, onRestart, heartBonus }) {
  const correctAnswersCount = answers.filter((a) => a.is_correct).length;
  const score = Math.round((correctAnswersCount / questions.length) * 100);
  const xpEarned = correctAnswersCount * 15 + heartBonus;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-6"
    >
      <Card className="text-center bg-card border-border">
        <CardHeader>
          <Trophy className="w-16 h-16 mx-auto text-primary" />
          <CardTitle className="text-2xl font-bold mt-4">نتائج الاختبار</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-4xl font-bold text-primary">{score}%</div>
          <p className="text-foreground/80">
            أجبت على {correctAnswersCount} من {questions.length} بشكل صحيح.
          </p>
          <div className="flex justify-center gap-4">
            <Badge className="bg-green-100 text-green-700 text-base p-2">
              <Sparkles className="w-4 h-4 ml-1" />
              +{xpEarned} نقطة خبرة
            </Badge>
             <Badge className="bg-background-soft text-foreground border border-border text-base p-2">
               <Sparkles className="w-4 h-4 ml-1 text-gray-600" />
               +{heartBonus} نقاط إضافية
             </Badge>
          </div>
          <Button onClick={onRestart} className="mt-6">
            <RotateCcw className="w-4 h-4 ml-2" />
            إعادة الاختبار
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-center text-foreground">مراجعة الإجابات</h3>
        {questions.map((q, index) => {
          const answer = answers.find(a => a.word_id === q.word.id);
          const isCorrect = answer?.is_correct;

          return (
            <motion.div
              key={q.word.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="bg-card border-border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-foreground">{q.word.word}</p>
                    <p className="text-sm text-foreground/70">المعنى الصحيح: {q.correctAnswer}</p>
                    {!isCorrect && answer?.selected_answer && (
                      <p className="text-sm text-red-500">إجابتك: {answer.selected_answer}</p>
                    )}
                  </div>
                  {isCorrect ? (
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-500" />
                  )}
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}