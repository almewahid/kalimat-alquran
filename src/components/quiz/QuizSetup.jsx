import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Brain, Settings, Play } from "lucide-react";
import { motion } from "framer-motion";

export default function QuizSetup({ onStartQuiz }) {
  const [settings, setSettings] = useState({
    questionCount: 10,
    difficulty: 'all',
    category: 'all'
  });

  const handleStart = () => {
    onStartQuiz(settings);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto"
    >
      <Card className="bg-white/90 backdrop-blur-sm border-emerald-200 shadow-xl">
        <CardHeader className="text-center bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Brain className="w-8 h-8" />
          </div>
          <CardTitle className="text-2xl">اختبار كلمات القرآن</CardTitle>
          <p className="text-emerald-100">اختبر معرفتك بكلمات القرآن الكريم</p>
        </CardHeader>
        
        <CardContent className="p-8">
          <div className="space-y-6">
            <div className="grid gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  عدد الأسئلة
                </label>
                <Select
                  value={settings.questionCount.toString()}
                  onValueChange={(value) => setSettings({...settings, questionCount: parseInt(value)})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 أسئلة (سريع)</SelectItem>
                    <SelectItem value="10">10 أسئلة (متوسط)</SelectItem>
                    <SelectItem value="15">15 سؤال (طويل)</SelectItem>
                    <SelectItem value="20">20 سؤال (شامل)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  مستوى الصعوبة
                </label>
                <Select
                  value={settings.difficulty}
                  onValueChange={(value) => setSettings({...settings, difficulty: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع المستويات</SelectItem>
                    <SelectItem value="مبتدئ">مبتدئ</SelectItem>
                    <SelectItem value="متوسط">متوسط</SelectItem>
                    <SelectItem value="متقدم">متقدم</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  فئة الكلمات
                </label>
                <Select
                  value={settings.category}
                  onValueChange={(value) => setSettings({...settings, category: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الفئات</SelectItem>
                    <SelectItem value="أسماء">أسماء</SelectItem>
                    <SelectItem value="أفعال">أفعال</SelectItem>
                    <SelectItem value="صفات">صفات</SelectItem>
                    <SelectItem value="حروف">حروف</SelectItem>
                    <SelectItem value="أخرى">أخرى</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
              <h4 className="font-semibold text-emerald-700 mb-2">ملخص الاختبار</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">عدد الأسئلة:</span>
                  <Badge>{settings.questionCount} سؤال</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">الوقت المقدر:</span>
                  <Badge>{settings.questionCount * 30} ثانية</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">النقاط المحتملة:</span>
                  <Badge className="bg-amber-100 text-amber-700">
                    {settings.questionCount * 15} XP
                  </Badge>
                </div>
              </div>
            </div>

            <Button
              onClick={handleStart}
              className="w-full py-4 text-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
              size="lg"
            >
              <Play className="w-5 h-5 ml-2" />
              ابدأ الاختبار
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}