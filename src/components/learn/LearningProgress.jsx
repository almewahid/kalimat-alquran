import React, { useEffect, useRef } from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Check, Flame, Star, MapPin, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export default function LearningProgress({ words = [], currentIndex = 0, learnedToday = 0, onReviewWord, isMarkingLearned = false }) {
  const scrollRef = useRef(null);

  // Auto-scroll to current index
  useEffect(() => {
    // Wait for render
    setTimeout(() => {
      if (scrollRef.current) {
        const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
        const activeNode = scrollRef.current.querySelector(`[data-index="${currentIndex}"]`);
        
        if (activeNode && viewport) {
           const scrollLeft = activeNode.offsetLeft - viewport.clientWidth / 2 + activeNode.clientWidth / 2;
           viewport.scrollTo({ left: scrollLeft, behavior: 'smooth' });
        }
      }
    }, 500);
  }, [currentIndex, words.length]);

  const progressPercentage = words.length > 0 ? ((currentIndex) / words.length) * 100 : 0;

  return (
    <div className="w-full space-y-4 mb-8">
      {/* Stats Header */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-card/60 backdrop-blur-md p-4 rounded-2xl border border-border/50 shadow-sm gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto">
           <div className="p-3 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl border border-primary/10">
             <MapPin className="w-6 h-6 text-primary" />
           </div>
           <div>
             <h3 className="font-bold text-lg text-foreground">خريطة التعلم</h3>
             <p className="text-xs text-muted-foreground flex items-center gap-1">
               <span className="font-medium text-primary">{Math.min(currentIndex + 1, words.length)}</span> 
               من 
               <span className="font-medium">{words.length}</span> 
               كلمة في الجلسة
             </p>
           </div>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
           <div className="hidden md:block flex-1 min-w-[150px]">
              <div className="flex justify-between text-xs mb-1.5 text-muted-foreground">
                <span>المسار</span>
                <span>{Math.round(progressPercentage)}%</span>
              </div>
              <Progress value={progressPercentage} className="h-2.5" />
           </div>
           
           {/* تم تغيير اللون الأصفر/البرتقالي إلى لون أزرق/نيلي أوضح */}
           <Badge variant="outline" className="px-3 py-1.5 h-auto gap-2 bg-indigo-50 dark:bg-indigo-900/10 text-indigo-700 border-indigo-200 dark:border-indigo-800">
             <Flame className="w-4 h-4 text-indigo-500 fill-indigo-500" />
             <div className="flex flex-col items-start leading-none">
               <span className="text-[10px] text-indigo-600/70 font-normal">إنجاز اليوم</span>
               <span className="font-bold text-sm">+{learnedToday}</span>
             </div>
           </Badge>

           <Badge variant="outline" className="px-3 py-1.5 h-auto gap-2 bg-emerald-50 dark:bg-emerald-900/10 text-emerald-700 border-emerald-200 dark:border-emerald-800">
             <Trophy className="w-4 h-4 text-emerald-500" />
             <div className="flex flex-col items-start leading-none">
               <span className="text-[10px] text-emerald-600/70 font-normal">النجوم</span>
               <span className="font-bold text-sm">⭐ {learnedToday * 10}</span>
             </div>
           </Badge>
        </div>
      </div>

      {/* Scrollable Map Path */}
      <div className="relative bg-card border border-border rounded-2xl p-6 shadow-inner overflow-hidden">
        {/* Fades - Reduced width to show more content */}
        <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-card to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-card to-transparent z-10 pointer-events-none" />
        
        <ScrollArea className="w-full whitespace-nowrap pb-4" ref={scrollRef} dir="rtl">
          <div className="flex items-center gap-6 px-4 min-w-full py-4">
            {words.map((word, idx) => {
              const isCompleted = idx < currentIndex;
              const isCurrent = idx === currentIndex;
              // If we are currently marking this word as learned, show it as checked/completed even if index hasn't moved yet
              const showAsChecked = isCompleted || (isCurrent && isMarkingLearned);
              const isLocked = idx > currentIndex;

              return (
                <div key={word.id || idx} className="relative flex flex-col items-center group" data-index={idx}>
                  {/* Connector Line (Backward) */}
                  {idx > 0 && (
                    <div className={cn(
                      "absolute top-1/2 right-full w-6 h-1 -translate-y-1/2 z-0",
                      showAsChecked || isCurrent ? "bg-primary/50" : "bg-border/50"
                    )} />
                  )}
                  
                  <motion.button
                    whileHover={!isLocked ? { scale: 1.1 } : {}}
                    whileTap={!isLocked ? { scale: 0.95 } : {}}
                    onClick={() => showAsChecked && onReviewWord && onReviewWord(word)}
                    disabled={isLocked && !showAsChecked}
                    className={cn(
                      "relative flex items-center justify-center w-14 h-14 rounded-full border-4 transition-all duration-300 z-10 shadow-sm",
                      showAsChecked
                        ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90 hover:shadow-md cursor-pointer" 
                        : isCurrent 
                          ? "bg-background text-primary border-primary ring-4 ring-primary/20 scale-110 shadow-lg" 
                          : "bg-muted text-muted-foreground border-border cursor-not-allowed"
                    )}
                  >
                    {showAsChecked ? (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}>
                        <Check className="w-7 h-7" />
                      </motion.div>
                    ) : isCurrent ? (
                      <Star className="w-7 h-7 fill-current animate-pulse text-indigo-500 dark:text-indigo-400" /> 
                    ) : (
                      <span className="text-lg">🔒</span>
                    )}
                  </motion.button>
                  
                  {/* Label */}
                  <div className={cn(
                    "absolute -bottom-8 text-xs font-medium transition-all duration-300 max-w-[80px] truncate text-center",
                    isCurrent ? "text-primary font-bold scale-110" : 
                    showAsChecked ? "text-foreground/80" : "text-muted-foreground/50"
                  )}>
                    {word.word}
                  </div>

                  {isCurrent && !isMarkingLearned && (
                    <motion.div 
                      layoutId="activePointer"
                      className="absolute -top-2 right-0 w-3 h-3 bg-indigo-500 rounded-full border-2 border-background shadow-[0_0_10px_rgba(99,102,241,0.6)]"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                    />
                  )}
                </div>
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" className="mt-2" />
        </ScrollArea>
      </div>
    </div>
  );
}