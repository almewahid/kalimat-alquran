import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Volume2, Play } from "lucide-react";
import { useAudio } from "@/components/common/AudioContext";

export default function AudioRecognitionQuiz({ word, options, onAnswer }) {
  const { playWord, playAyah, playMeaning, isPlaying } = useAudio();
  
  // Auto-play word on mount
  useEffect(() => {
    if (word) {
      handlePlayWord();
    }
  }, [word]);

  const handlePlayWord = () => {
    playWord(word.surah_number, word.ayah_number, word.word, word);
  };

  const handlePlayAyah = () => {
    playAyah(word.surah_number, word.ayah_number, word);
  };

  const handlePlayMeaning = (e, text) => {
    e.stopPropagation();
    playMeaning(text);
  };

  return (
    <div className="space-y-8 text-center">
      <div className="py-6 flex flex-col items-center justify-center gap-4">
        
        <div className="flex justify-center gap-4">
            <Button 
              onClick={handlePlayAyah} 
              size="lg" 
              className={`w-24 h-24 rounded-2xl border-4 border-green-200 hover:bg-green-50 ${isPlaying ? 'animate-pulse ring-4 ring-green-200' : ''}`}
              variant="outline"
              title="تلاوة الآية"
            >
              <div className="flex flex-col items-center gap-2">
                 <Volume2 className="w-8 h-8 text-green-600" />
                 <span className="text-xs text-green-700 font-bold">تلاوة الآية</span>
              </div>
            </Button>

            <Button 
              onClick={handlePlayWord} 
              size="lg" 
              className={`w-24 h-24 rounded-2xl border-4 border-blue-200 hover:bg-blue-50 ${isPlaying ? 'animate-pulse ring-4 ring-blue-200' : ''}`}
              variant="outline"
              title="نطق الكلمة"
            >
              <div className="flex flex-col items-center gap-2">
                 <Volume2 className="w-8 h-8 text-blue-600" />
                 <span className="text-xs text-blue-700 font-bold">نطق الكلمة</span>
              </div>
            </Button>
        </div>

        <p className="mt-2 text-muted-foreground font-medium">استمع ثم اختر المعنى الصحيح</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {options.map((option, idx) => (
           <div key={idx} className="relative group">
              <Button
                variant="outline"
                className="w-full h-auto py-6 text-xl justify-start px-6 pr-14"
                onClick={() => onAnswer(option)}
              >
                <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center ml-2 text-sm font-bold shrink-0">
                  {idx + 1}
                </span>
                <span className="text-right flex-1">{option.meaning}</span>
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 text-purple-600 hover:bg-purple-100 rounded-full"
                onClick={(e) => handlePlayMeaning(e, option.meaning)}
                title="استمع للمعنى"
              >
                <Volume2 className="w-5 h-5" />
              </Button>
           </div>
        ))}
      </div>
    </div>
  );
}