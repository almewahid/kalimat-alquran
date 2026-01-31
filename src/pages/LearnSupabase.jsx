import React, { useState, useEffect } from "react";
import { supabaseClient } from "@/components/api/supabaseClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, ArrowLeft, Shuffle, RotateCcw, Loader2, Heart, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import WordCard from "../components/learn/WordCard";
import KidsWordCard from "../components/kids/KidsWordCard";
import LearningProgress from "../components/learn/LearningProgress";
import Confetti from "../components/common/Confetti";
import { playSound, setSoundEnabled, isSoundEnabled } from '@/components/common/SoundEffects';

export default function LearnSupabase() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [learningLevel, setLearningLevel] = useState("مبتدئ");
  const [words, setWords] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayWord, setDisplayWord] = useState(null);
  const [reviewWords, setReviewWords] = useState([]);
  const [newWords, setNewWords] = useState([]);
  const [isShuffled, setIsShuffled] = useState(false);
  const [originalOrder, setOriginalOrder] = useState([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [dailyGoal, setDailyGoal] = useState(10);
  const [learnedToday, setLearnedToday] = useState(0);
  const [soundEnabled, setSoundEnabledState] = useState(true);
  const [confettiEnabled, setConfettiEnabled] = useState(true);

  // ✅ Load user and preferences
  const { data: userData } = useQuery({
    queryKey: ['user-learn'],
    queryFn: async () => {
      const currentUser = await supabaseClient.auth.me();
      setUser(currentUser);
      
      const level = currentUser?.preferences?.learning_level || "مبتدئ";
      setLearningLevel(level);
      setSoundEnabledState(currentUser?.preferences?.sound_effects !== false);
      setConfettiEnabled(currentUser?.preferences?.confetti_enabled !== false);
      setDailyGoal(currentUser?.preferences?.daily_goal || 10);
      
      return currentUser;
    },
  });

  // ✅ Load user progress
  const { data: progress } = useQuery({
    queryKey: ['progress-learn', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const data = await supabaseClient.entities.UserProgress.filter({
        user_email: user.email
      });
      return data[0];
    },
    enabled: !!user?.email,
  });

  // ✅ Load flashcards for review
  const { data: flashcards } = useQuery({
    queryKey: ['flashcards', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const today = new Date().toISOString();
      return await supabaseClient.entities.FlashCard.filter({
        user_email: user.email,
      });
    },
    enabled: !!user?.email,
  });

  // ✅ Load words based on learning level
  const { data: allWords, isLoading } = useQuery({
    queryKey: ['words', learningLevel],
    queryFn: async () => {
      const difficulty = learningLevel === "الكل" ? undefined : learningLevel;
      const conditions = difficulty ? { difficulty_level: difficulty } : {};
      return await supabaseClient.entities.QuranicWord.filter(conditions, '', 1000);
    },
    enabled: !!learningLevel,
  });

  // Setup words for learning
  useEffect(() => {
    if (!allWords || !progress || !flashcards) return;

    const learnedIds = progress.learned_words || [];
    const dueForReview = flashcards.filter(f => 
      new Date(f.next_review) <= new Date()
    ).map(f => f.word_id);

    const reviewWordsData = allWords.filter(w => dueForReview.includes(w.id));
    const newWordsData = allWords.filter(w => !learnedIds.includes(w.id)).slice(0, 20);

    setReviewWords(reviewWordsData);
    setNewWords(newWordsData);

    const combinedWords = [...reviewWordsData, ...newWordsData];
    setWords(combinedWords);
    setOriginalOrder([...combinedWords]);
    setDisplayWord(combinedWords[0]);
  }, [allWords, progress, flashcards]);

  // ✅ Mark word as learned
  const markLearnedMutation = useMutation({
    mutationFn: async (word) => {
      if (!user?.email || !progress) return;

      const learnedIds = progress.learned_words || [];
      if (learnedIds.includes(word.id)) return;

      // Update progress
      await supabaseClient.entities.UserProgress.update(progress.id, {
        learned_words: [...learnedIds, word.id],
        words_learned: (progress.words_learned || 0) + 1,
        total_xp: (progress.total_xp || 0) + 10
      });

      // Create or update flashcard
      const existingCards = await supabaseClient.entities.FlashCard.filter({
        word_id: word.id,
        user_email: user.email
      });

      if (existingCards.length > 0) {
        const card = existingCards[0];
        const nextReview = new Date();
        nextReview.setDate(nextReview.getDate() + 1);
        
        await supabaseClient.entities.FlashCard.update(card.id, {
          repetitions: (card.repetitions || 0) + 1,
          interval: 1,
          next_review: nextReview.toISOString(),
          last_review: new Date().toISOString(),
          is_new: false,
          total_reviews: (card.total_reviews || 0) + 1
        });
      } else {
        const nextReview = new Date();
        nextReview.setDate(nextReview.getDate() + 1);
        
        await supabaseClient.entities.FlashCard.create({
          word_id: word.id,
          repetitions: 1,
          interval: 1,
          efactor: 2.5,
          next_review: nextReview.toISOString(),
          last_review: new Date().toISOString(),
          is_new: false,
          total_reviews: 1
        });
      }

      setLearnedToday(prev => prev + 1);
      
      if (confettiEnabled) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      }

      queryClient.invalidateQueries(['progress-learn']);
      queryClient.invalidateQueries(['flashcards']);
    },
  });

  const handleMarkLearned = () => {
    if (displayWord) {
      markLearnedMutation.mutate(displayWord);
      handleNextWord();
    }
  };

  const handleNextWord = () => {
    if (currentIndex < words.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setDisplayWord(words[currentIndex + 1]);
    } else {
      queryClient.invalidateQueries(['words']);
    }
  };

  const handlePreviousWord = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setDisplayWord(words[currentIndex - 1]);
    }
  };

  const handleShuffle = () => {
    const shuffled = [...words].sort(() => Math.random() - 0.5);
    setWords(shuffled);
    setIsShuffled(true);
    setCurrentIndex(0);
    setDisplayWord(shuffled[0]);
  };

  const handleRestore = () => {
    setWords(originalOrder);
    setIsShuffled(false);
    setCurrentIndex(0);
    setDisplayWord(originalOrder[0]);
  };

  const handleReset = () => {
    queryClient.invalidateQueries(['words']);
    queryClient.invalidateQueries(['flashcards']);
    setCurrentIndex(0);
  };

  const markAsDifficultMutation = useMutation({
    mutationFn: async (word) => {
      if (!user?.email) return;
      
      const existing = await supabaseClient.entities.FavoriteWord.filter({
        word_id: word.id,
        user_email: user.email
      });

      if (existing.length === 0) {
        await supabaseClient.entities.FavoriteWord.create({ word_id: word.id });
      }
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!displayWord) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Card className="bg-card shadow-lg">
          <CardContent className="p-12 text-center">
            <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">أحسنت! أكملت جميع الكلمات المتاحة</h2>
            <p className="text-foreground/70 mb-6">
              تعلمت {learnedToday} كلمة جديدة اليوم!
            </p>
            <Button onClick={handleReset} size="lg" className="gap-2">
              <RotateCcw className="w-5 h-5" />
              ابدأ جولة جديدة
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isReviewWord = reviewWords.some(w => w.id === displayWord.id);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 p-4 md:p-6">
      {showConfetti && <Confetti />}

      <div className="max-w-5xl mx-auto">
        {/* Header with Supabase Badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold gradient-text mb-2">تعلم الكلمات</h1>
              <Badge className="bg-green-100 text-green-700 border-green-300">
                🟢 Supabase Backend
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleShuffle}
                variant="outline"
                size="sm"
                disabled={isShuffled}
                className="gap-2"
              >
                <Shuffle className="w-4 h-4" />
                خلط
              </Button>
              {isShuffled && (
                <Button
                  onClick={handleRestore}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  استرجاع
                </Button>
              )}
            </div>
          </div>

          <LearningProgress
            learnedToday={learnedToday}
            dailyGoal={dailyGoal}
            currentIndex={currentIndex}
            totalWords={words.length}
          />
        </motion.div>

        {/* Word Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={displayWord?.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            {learningLevel === "مبتدئ" ? (
              <KidsWordCard
                word={displayWord}
                onMarkLearned={handleMarkLearned}
                isReviewWord={isReviewWord}
              />
            ) : (
              <WordCard
                word={displayWord}
                onMarkLearned={handleMarkLearned}
                isReviewWord={isReviewWord}
                userLevel={learningLevel}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 flex items-center justify-between gap-4"
        >
          <Button
            onClick={handlePreviousWord}
            disabled={currentIndex === 0}
            variant="outline"
            size="lg"
            className="gap-2"
          >
            <ArrowRight className="w-5 h-5" />
            السابقة
          </Button>

          <Button
            onClick={() => markAsDifficultMutation.mutate(displayWord)}
            variant="outline"
            size="lg"
            className="gap-2"
          >
            <Heart className="w-5 h-5" />
            صعبة
          </Button>

          <Button
            onClick={handleNextWord}
            disabled={currentIndex === words.length - 1}
            size="lg"
            className="gap-2"
          >
            التالية
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </motion.div>
      </div>
    </div>
  );
}