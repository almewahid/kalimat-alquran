import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Star, Award, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";

export default function KidsGame({ words = [], onComplete }) {
  const [gameMode, setGameMode] = useState("menu"); // menu, matching, memory, quiz
  const [score, setScore] = useState(0);
  const [stars, setStars] = useState(0);

  const games = [
    {
      id: "matching",
      title: "لعبة المطابقة",
      icon: "🎯",
      color: "from-pink-400 to-rose-500",
      description: "طابق الكلمة مع معناها"
    },
    {
      id: "memory",
      title: "لعبة الذاكرة",
      icon: "🧠",
      color: "from-purple-400 to-indigo-500",
      description: "اعثر على الأزواج المتطابقة"
    },
    {
      id: "quiz",
      title: "اختبار سريع",
      icon: "⚡",
      color: "from-yellow-400 to-orange-500",
      description: "أجب على الأسئلة بسرعة"
    }
  ];

  if (gameMode === "menu") {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center mb-8"
        >
          <div className="text-6xl mb-4">🎮</div>
          <h1 className="text-4xl font-bold text-primary mb-2">ألعاب التعلم</h1>
          <p className="text-lg text-muted-foreground">اختر لعبتك المفضلة!</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {games.map((game, idx) => (
            <motion.div
              key={game.id}
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card 
                className={`bg-gradient-to-br ${game.color} text-white border-0 cursor-pointer hover:scale-105 transition-transform`}
                onClick={() => setGameMode(game.id)}
              >
                <CardContent className="p-8 text-center">
                  <div className="text-6xl mb-4">{game.icon}</div>
                  <h3 className="text-2xl font-bold mb-2">{game.title}</h3>
                  <p className="text-white/90">{game.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  if (gameMode === "matching") {
    return <MatchingGame words={words} onBack={() => setGameMode("menu")} onComplete={onComplete} />;
  }

  if (gameMode === "memory") {
    return <MemoryGame words={words} onBack={() => setGameMode("menu")} onComplete={onComplete} />;
  }

  if (gameMode === "quiz") {
    return <QuickQuizGame words={words} onBack={() => setGameMode("menu")} onComplete={onComplete} />;
  }

  return null;
}

function MatchingGame({ words, onBack, onComplete }) {
  const [shuffledWords, setShuffledWords] = useState([]);
  const [shuffledMeanings, setShuffledMeanings] = useState([]);
  const [selectedWord, setSelectedWord] = useState(null);
  const [selectedMeaning, setSelectedMeaning] = useState(null);
  const [matched, setMatched] = useState([]);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const gameWords = words.slice(0, 6);
    setShuffledWords([...gameWords].sort(() => Math.random() - 0.5));
    setShuffledMeanings([...gameWords].sort(() => Math.random() - 0.5));
  }, [words]);

  const handleWordClick = (word) => {
    if (matched.includes(word.id)) return;
    setSelectedWord(word);
    if (selectedMeaning && selectedMeaning.id === word.id) {
      // Match!
      setMatched([...matched, word.id]);
      setScore(score + 10);
      confetti({ spread: 100, startVelocity: 30 });
      setSelectedWord(null);
      setSelectedMeaning(null);
      
      if (matched.length + 1 === shuffledWords.length) {
        setTimeout(() => onComplete({ score: score + 10, stars: 3 }), 1000);
      }
    }
  };

  const handleMeaningClick = (word) => {
    if (matched.includes(word.id)) return;
    setSelectedMeaning(word);
    if (selectedWord && selectedWord.id === word.id) {
      // Match!
      setMatched([...matched, word.id]);
      setScore(score + 10);
      confetti({ spread: 100, startVelocity: 30 });
      setSelectedWord(null);
      setSelectedMeaning(null);
      
      if (matched.length + 1 === shuffledWords.length) {
        setTimeout(() => onComplete({ score: score + 10, stars: 3 }), 1000);
      }
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <Button onClick={onBack} variant="outline">🔙 رجوع</Button>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-yellow-100 px-4 py-2 rounded-full">
            <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
            <span className="font-bold">{score}</span>
          </div>
        </div>
      </div>

      <h2 className="text-3xl font-bold text-center mb-8 text-primary">
        طابق الكلمة مع معناها! 🎯
      </h2>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-3">
          <h3 className="text-xl font-bold text-center mb-4">الكلمات</h3>
          {shuffledWords.map((word) => (
            <motion.div
              key={word.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                onClick={() => handleWordClick(word)}
                disabled={matched.includes(word.id)}
                className={`w-full h-20 text-2xl font-bold ${
                  matched.includes(word.id)
                    ? "bg-green-500 text-white"
                    : selectedWord?.id === word.id
                    ? "bg-blue-500 text-white"
                    : "bg-gradient-to-r from-pink-400 to-rose-500 text-white"
                }`}
              >
                {matched.includes(word.id) ? "✅" : word.word}
              </Button>
            </motion.div>
          ))}
        </div>

        <div className="space-y-3">
          <h3 className="text-xl font-bold text-center mb-4">المعاني</h3>
          {shuffledMeanings.map((word) => (
            <motion.div
              key={word.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                onClick={() => handleMeaningClick(word)}
                disabled={matched.includes(word.id)}
                className={`w-full h-20 text-xl ${
                  matched.includes(word.id)
                    ? "bg-green-500 text-white"
                    : selectedMeaning?.id === word.id
                    ? "bg-blue-500 text-white"
                    : "bg-gradient-to-r from-purple-400 to-indigo-500 text-white"
                }`}
              >
                {matched.includes(word.id) ? "✅" : word.meaning}
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MemoryGame({ words, onBack, onComplete }) {
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [moves, setMoves] = useState(0);

  useEffect(() => {
    const gameWords = words.slice(0, 6);
    const cardPairs = [];
    gameWords.forEach((word) => {
      cardPairs.push({ id: word.id + "-word", type: "word", content: word.word, matchId: word.id });
      cardPairs.push({ id: word.id + "-meaning", type: "meaning", content: word.meaning, matchId: word.id });
    });
    setCards(cardPairs.sort(() => Math.random() - 0.5));
  }, [words]);

  const handleCardClick = (card) => {
    if (flipped.length === 2 || flipped.includes(card.id) || matched.includes(card.matchId)) return;
    
    const newFlipped = [...flipped, card.id];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(moves + 1);
      const [first, second] = newFlipped.map(id => cards.find(c => c.id === id));
      
      if (first.matchId === second.matchId) {
        // Match!
        setMatched([...matched, first.matchId]);
        confetti({ spread: 100, startVelocity: 30 });
        setTimeout(() => setFlipped([]), 500);
        
        if (matched.length + 1 === 6) {
          setTimeout(() => onComplete({ moves, stars: moves < 15 ? 3 : moves < 20 ? 2 : 1 }), 1000);
        }
      } else {
        setTimeout(() => setFlipped([]), 1000);
      }
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <Button onClick={onBack} variant="outline">🔙 رجوع</Button>
        <div className="flex items-center gap-4">
          <div className="bg-blue-100 px-4 py-2 rounded-full font-bold">
            الحركات: {moves}
          </div>
        </div>
      </div>

      <h2 className="text-3xl font-bold text-center mb-8 text-primary">
        اعثر على الأزواج! 🧠
      </h2>

      <div className="grid grid-cols-4 gap-4">
        {cards.map((card) => {
          const isFlipped = flipped.includes(card.id);
          const isMatched = matched.includes(card.matchId);
          
          return (
            <motion.div
              key={card.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleCardClick(card)}
              className="aspect-square cursor-pointer"
            >
              <div className={`w-full h-full rounded-xl flex items-center justify-center text-lg font-bold transition-all ${
                isFlipped || isMatched
                  ? card.type === "word"
                    ? "bg-gradient-to-br from-pink-400 to-rose-500 text-white"
                    : "bg-gradient-to-br from-purple-400 to-indigo-500 text-white"
                  : "bg-gradient-to-br from-yellow-300 to-orange-400"
              }`}>
                {isFlipped || isMatched ? (
                  <span className={card.type === "word" ? "text-2xl" : "text-base text-center px-2"}>
                    {card.content}
                  </span>
                ) : (
                  <span className="text-4xl">❓</span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function QuickQuizGame({ words, onBack, onComplete }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);

  const currentWord = words[currentIndex];
  const options = [
    currentWord,
    ...words.filter(w => w.id !== currentWord.id).sort(() => Math.random() - 0.5).slice(0, 3)
  ].sort(() => Math.random() - 0.5);

  const handleAnswer = (option) => {
    setSelectedAnswer(option);
    const isCorrect = option.id === currentWord.id;
    
    if (isCorrect) {
      setScore(score + 10);
      confetti({ spread: 100, startVelocity: 30 });
    }

    setTimeout(() => {
      if (currentIndex < words.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setSelectedAnswer(null);
      } else {
        onComplete({ score: score + (isCorrect ? 10 : 0), stars: score >= 80 ? 3 : score >= 50 ? 2 : 1 });
      }
    }, 1500);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <Button onClick={onBack} variant="outline">🔙 رجوع</Button>
        <div className="flex items-center gap-4">
          <div className="bg-green-100 px-4 py-2 rounded-full font-bold">
            {currentIndex + 1} / {words.length}
          </div>
          <div className="flex items-center gap-2 bg-yellow-100 px-4 py-2 rounded-full">
            <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
            <span className="font-bold">{score}</span>
          </div>
        </div>
      </div>

      <Card className="mb-8 bg-gradient-to-br from-blue-400 to-purple-500 text-white border-0">
        <CardContent className="p-12 text-center">
          <h3 className="text-6xl font-bold mb-4">{currentWord.word}</h3>
          <p className="text-xl">ما معنى هذه الكلمة؟</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        {options.map((option, idx) => {
          let className = "h-24 text-xl font-bold transition-all";
          if (selectedAnswer) {
            if (option.id === currentWord.id) {
              className += " bg-green-500 text-white";
            } else if (option.id === selectedAnswer.id) {
              className += " bg-red-500 text-white";
            } else {
              className += " opacity-50";
            }
          } else {
            className += " bg-gradient-to-br from-pink-300 to-rose-400 text-white hover:scale-105";
          }

          return (
            <motion.div key={idx} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={() => !selectedAnswer && handleAnswer(option)}
                disabled={!!selectedAnswer}
                className={className}
              >
                {option.meaning}
              </Button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}