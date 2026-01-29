import React, { useState, useEffect } from 'react';
import { DndContext, useSensor, useSensors, PointerSensor, TouchSensor, useDraggable, useDroppable } from '@dnd-kit/core';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Volume2 } from "lucide-react";
import { useAudio } from "@/components/common/AudioContext";

const DraggableWord = ({ id, text, isDropped }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: id,
    disabled: isDropped
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 999,
  } : undefined;

  if (isDropped) return null;

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className={`touch-none inline-block m-2 ${isDragging ? 'opacity-50' : ''}`}>
      <Badge variant="outline" className="text-lg py-2 px-4 cursor-grab active:cursor-grabbing bg-background hover:bg-accent border-2 border-primary/20">
        {text}
      </Badge>
    </div>
  );
};

const DroppableBlank = ({ id, filledWith, isCorrect }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: id,
  });

  let borderColor = "border-primary/30";
  let bgColor = "bg-muted/30";
  
  if (isOver) {
    borderColor = "border-primary";
    bgColor = "bg-primary/10";
  }
  
  if (filledWith) {
    borderColor = isCorrect ? "border-green-500" : "border-red-500";
    bgColor = isCorrect ? "bg-green-100" : "bg-red-100";
  }

  return (
    <div 
      ref={setNodeRef} 
      className={`inline-flex items-center justify-center min-w-[80px] h-10 mx-1 border-b-2 ${borderColor} ${bgColor} rounded px-2 transition-colors`}
    >
      {filledWith ? (
        <span className={`text-lg font-bold ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
          {filledWith}
        </span>
      ) : (
        <span className="text-muted-foreground text-xs">اسحب هنا</span>
      )}
    </div>
  );
};

export default function FillInTheBlankQuiz({ word, options, onAnswer }) {
  const { playAyah, playWord } = useAudio();
  const [verseParts, setVerseParts] = useState([]);
  const [choices, setChoices] = useState([]);
  const [droppedItem, setDroppedItem] = useState(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor)
  );

  useEffect(() => {
    const text = word.aya_text || word.example_usage || "مثال غير متوفر";
    
    const wordsArray = text.split(/\s+/);
    const targetWordClean = word.word.replace(/[^\u0621-\u064A]/g, ''); 
    
    let targetIndex = wordsArray.findIndex(w => w.includes(word.word) || w.replace(/[^\u0621-\u064A]/g, '').includes(targetWordClean));
    
    if (targetIndex === -1) targetIndex = Math.floor(wordsArray.length / 2);

    const parts = wordsArray.map((w, i) => ({
      text: w,
      isTarget: i === targetIndex,
      id: `part-${i}`
    }));

    setVerseParts(parts);

    const distractors = options.filter(o => o.id !== word.id).slice(0, 3).map(o => o.word);
    const allChoices = [word.word, ...distractors]
      .sort(() => 0.5 - Math.random())
      .map((txt, i) => ({ id: `choice-${i}`, text: txt }));

    setChoices(allChoices);
    setDroppedItem(null);

  }, [word]);

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (over && over.id === 'blank-target') {
      const choice = choices.find(c => c.id === active.id);
      if (choice) {
        setDroppedItem(choice);
        const selectedOption = options.find(o => o.word === choice.text) || { word: choice.text, id: 'unknown' };
        onAnswer(selectedOption); 
      }
    }
  };

  const handlePlayAyah = () => playAyah(word.surah_number, word.ayah_number, word);
  const handlePlayWord = () => playWord(word.surah_number, word.ayah_number, word.word, word);

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="space-y-6 py-4">
        <div className="flex justify-center gap-3">
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

        <div className="text-center text-xl leading-loose font-serif p-6 bg-card rounded-xl border-2 border-primary/10 shadow-sm">
          {verseParts.map((part, i) => (
            part.isTarget ? (
              <DroppableBlank 
                key={i} 
                id="blank-target" 
                filledWith={droppedItem?.text} 
                isCorrect={droppedItem?.text === word.word}
              />
            ) : (
              <span key={i} className="mx-1">{part.text}</span>
            )
          ))}
        </div>

        <div className="flex flex-wrap justify-center gap-4 min-h-[80px] p-4 bg-muted/20 rounded-xl">
          {choices.map((choice) => (
            <DraggableWord 
              key={choice.id} 
              id={choice.id} 
              text={choice.text} 
              isDropped={droppedItem?.id === choice.id}
            />
          ))}
        </div>
        
        <p className="text-center text-sm text-muted-foreground">استمع للآية ثم اسحب الكلمة الصحيحة</p>
      </div>
    </DndContext>
  );
}