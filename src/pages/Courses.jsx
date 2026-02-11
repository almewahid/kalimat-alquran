import React, { useState, useEffect } from "react";
import { supabaseClient } from "@/components/api/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Award, ArrowLeft, CheckCircle, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [userProgress, setUserProgress] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const user = await supabaseClient.supabase.auth.getUser();
      const [allCourses, progressList] = await Promise.all([
        supabaseClient.entities.Course.filter({ is_active: true }, "-created_date"),
        supabaseClient.entities.UserCourseProgress.filter({ user_email: user.email })
      ]);

      setCourses(allCourses);
      
      const progressMap = {};
      progressList.forEach(p => {
        progressMap[p.course_id] = p;
      });
      setUserProgress(progressMap);
      
    } catch (error) {
      console.error("Error fetching courses:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-primary mb-2">الدورات التعليمية</h1>
          <p className="text-gray-600">مسارات منظمة لتعلم كلمات القرآن الكريم مع شهادات إتمام</p>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-3 gap-6">
            {[1,2,3].map(i => <div key={i} className="h-64 bg-gray-200 rounded-xl animate-pulse" />)}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map((course, index) => {
              const progress = userProgress[course.id];
              const totalWords = course.words_ids?.length || 0;
              const completedWords = progress?.completed_words_count || 0;
              const percent = totalWords > 0 ? Math.round((completedWords / totalWords) * 100) : 0;
              const isCompleted = progress?.is_completed;

              return (
                <motion.div 
                  key={course.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full flex flex-col hover:shadow-xl transition-all duration-300 border-t-4 border-t-primary overflow-hidden">
                    <div className="relative h-40 bg-gray-100">
                      {course.image_url ? (
                        <img src={course.image_url} alt={course.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/20">
                          <BookOpen className="w-16 h-16 text-primary/30" />
                        </div>
                      )}
                      <div className="absolute top-3 left-3">
                        <Badge className="bg-white/90 text-primary hover:bg-white">{course.level}</Badge>
                      </div>
                    </div>
                    
                    <CardHeader>
                      <CardTitle className="text-xl">{course.title}</CardTitle>
                      <CardDescription className="line-clamp-2">{course.description}</CardDescription>
                    </CardHeader>
                    
                    <CardContent className="flex-1">
                      <div className="space-y-4">
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>التقدم</span>
                          <span>{percent}%</span>
                        </div>
                        <Progress value={percent} className="h-2" />
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {completedWords}/{totalWords} كلمة</span>
                          {course.enable_certificate && <span className="flex items-center gap-1 text-amber-600"><Award className="w-3 h-3" /> شهادة متاحة</span>}
                        </div>
                      </div>
                    </CardContent>
                    
                    <CardFooter className="pt-0">
                      {isCompleted ? (
                        <div className="w-full flex gap-2">
                          <Button asChild className="flex-1 bg-green-600 hover:bg-green-700">
                            <Link to={`/CourseDetail?id=${course.id}`}>
                              <CheckCircle className="w-4 h-4 ml-2" /> مراجعة الدورة
                            </Link>
                          </Button>
                          {course.enable_certificate && (
                            <Button asChild variant="outline" className="flex-1 border-amber-500 text-amber-700 hover:bg-amber-50">
                              <Link to={`/CertificateView?id=${progress.certificate_id || 'preview'}`}>
                                <Award className="w-4 h-4 ml-2" /> الشهادة
                              </Link>
                            </Button>
                          )}
                        </div>
                      ) : (
                        <Button asChild className="w-full">
                          <Link to={`/CourseDetail?id=${course.id}`}>
                            ابدأ التعلم <ArrowLeft className="w-4 h-4 mr-2" />
                          </Link>
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}