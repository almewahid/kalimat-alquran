import React from 'react';
import { Button } from "@/components/ui/button";
import { Volume2 } from "lucide-react";
import { useAudio } from "@/components/common/AudioContext";

export default function VisualMatchQuiz({ word, options, onAnswer }) {
  const { playAyah, playWord, playMeaning } = useAudio();
  const hasImage = !!word.image_url;

  const handlePlayAyah = () => playAyah(word.surah_number, word.ayah_number, word);
  const handlePlayWord = () => playWord(word.surah_number, word.ayah_number, word.word, word);
  const handlePlayMeaning = (e, text) => { e.stopPropagation(); playMeaning(text); };

  return (
    <div className="space-y-6 text-center">
      <div className="py-2 flex flex-col items-center gap-4">
        {hasImage ? (
          <img 
            src={word.image_url} 
            alt="Quiz Question" 
            className="w-64 h-64 object-cover rounded-2xl shadow-lg border-4 border-primary/20"
          />
        ) : (
          <div className="w-64 h-64 bg-primary/5 rounded-2xl flex items-center justify-center border-4 border-dashed border-primary/20">
            <div className="text-center p-6">
              <h3 className="text-4xl font-bold text-primary mb-2">{word.word}</h3>
              <p className="text-muted-foreground text-sm">اختر الصورة أو المعنى المناسب</p>
            </div>
          </div>
        )}

        <div className="flex gap-3">
             <Button 
               onClick={handlePlayAyah} 
               variant="outline" 
               size="sm"
               className="gap-2 border-green-200 text-green-700 hover:bg-green-50"
             >
               <Volume2 className="w-4 h-4" /> تلاوة الآية
             </Button>
             <Button 
               onClick={handlePlayWord} 
               variant="outline" 
               size="sm"
               className="gap-2 border-blue-200 text-blue-700 hover:bg-blue-50"
             >
               <Volume2 className="w-4 h-4" /> نطق الكلمة
             </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {options.map((option, idx) => (
          <div key={idx} className="relative group h-full">
            <Button
                variant="outline"
                className="w-full h-auto py-4 flex-col gap-3 min-h-[120px] relative"
                onClick={() => onAnswer(option)}
            >
                {option.image_url ? (
                <img src={option.image_url} alt="Option" className="w-16 h-16 object-cover rounded-lg" />
                ) : (
                <div className="w-12 h-12 bg-secondary/20 rounded-full flex items-center justify-center">
                    <span className="text-xl font-bold text-secondary-foreground">{idx + 1}</span>
                </div>
                )}
                <span className="text-lg font-medium px-6">{option.meaning}</span>
            </Button>
             <Button
                size="icon"
                variant="ghost"
                className="absolute right-2 top-2 h-8 w-8 text-purple-600 bg-white/80 hover:bg-purple-100 rounded-full shadow-sm"
                onClick={(e) => handlePlayMeaning(e, option.meaning)}
                title="استمع للمعنى"
            >
                <Volume2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}