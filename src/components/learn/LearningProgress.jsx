import React, { useEffect, useRef } from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Check, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export default function LearningProgress({ words = [], currentIndex = 0, learnedToday = 0, onReviewWord, isMarkingLearned = false }) {
  const scrollRef = useRef(null);

  useEffect(() => {
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

  return (
    <div className="w-full mb-6">
      {/* Scrollable Map Path */}
      <div className="relative bg-card border border-border rounded-2xl p-6 shadow-inner overflow-hidden">
        <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-card to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-card to-transparent z-10 pointer-events-none" />

        <ScrollArea className="w-full whitespace-nowrap pb-4" ref={scrollRef} dir="rtl">
          <div className="flex items-center gap-6 px-4 min-w-full py-4">
            {words.map((word, idx) => {
              const isCompleted = idx < currentIndex;
              const isCurrent = idx === currentIndex;
              const showAsChecked = isCompleted || (isCurrent && isMarkingLearned);
              const isLocked = idx > currentIndex;

              return (
                <div key={word.id || idx} className="relative flex flex-col items-center group" data-index={idx}>
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
