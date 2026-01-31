import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Volume2 } from "lucide-react";
import { useAudio } from "@/components/common/AudioContext";

const DraggableWord = ({ id, text, isDropped, index }) => {
  if (isDropped) return null;

  return (
    <Draggable draggableId={id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`inline-block m-2 ${snapshot.isDragging ? 'opacity-50' : ''}`}
        >
          <Badge variant="outline" className="text-lg py-2 px-4 cursor-grab active:cursor-grabbing bg-background hover:bg-accent border-2 border-primary/20">
            {text}
          </Badge>
        </div>
      )}
    </Draggable>
  );
};

const DroppableBlank = ({ id, filledWith, isCorrect }) => {
  let borderColor = "border-primary/30";
  let bgColor = "bg-muted/30";
  
  if (filledWith) {
    borderColor = isCorrect ? "border-green-500" : "border-red-500";
    bgColor = isCorrect ? "bg-green-100" : "bg-red-100";
  }

  return (
    <Droppable droppableId={id}>
      {(provided, snapshot) => {
        let dropBorderColor = borderColor;
        let dropBgColor = bgColor;
        
        if (snapshot.isDraggingOver) {
          dropBorderColor = "border-primary";
          dropBgColor = "bg-primary/10";
        }
        
        return (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`inline-flex items-center justify-center min-w-[80px] h-10 mx-1 border-b-2 ${dropBorderColor} ${dropBgColor} rounded px-2 transition-colors`}
          >
            {filledWith ? (
              <span className={`text-lg font-bold ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                {filledWith}
              </span>
            ) : (
              <span className="text-muted-foreground text-xs">اسحب هنا</span>
            )}
            {provided.placeholder}
          </div>
        );
      }}
    </Droppable>
  );
};

export default function FillInTheBlankQuiz({ word, options, onAnswer }) {
  const { playAyah, playWord } = useAudio();
  const [verseParts, setVerseParts] = useState([]);
  const [choices, setChoices] = useState([]);
  const [droppedItem, setDroppedItem] = useState(null);

  useEffect(() => {
    // Prepare verse and choices
    const text = word.aya_text || word.example_usage || "مثال غير متوفر";
    
    const wordsArray = text.split(/\s+/);
    const targetWordClean = word.word.replace(/[^\u0621-\u064A]/g, ''); 
    
    // Find index of word that matches target
    let targetIndex = wordsArray.findIndex(w => w.includes(word.word) || w.replace(/[^\u0621-\u064A]/g, '').includes(targetWordClean));
    
    if (targetIndex === -1) targetIndex = Math.floor(wordsArray.length / 2); // Fallback to middle

    const parts = wordsArray.map((w, i) => ({
      text: w,
      isTarget: i === targetIndex,
      id: `part-${i}`
    }));

    setVerseParts(parts);

    // Prepare draggable choices
    const distractors = options.filter(o => o.id !== word.id).slice(0, 3).map(o => o.word);
    const allChoices = [word.word, ...distractors]
      .sort(() => 0.5 - Math.random())
      .map((txt, i) => ({ id: `choice-${i}`, text: txt }));

    setChoices(allChoices);
    setDroppedItem(null);

  }, [word]);

  const handleDragEnd = (result) => {
    const { source, destination, draggableId } = result;

    if (!destination || destination.droppableId !== 'blank-target') {
      return;
    }

    const choice = choices.find(c => c.id === draggableId);
    if (choice) {
      setDroppedItem(choice);
      // Check answer immediately
      const selectedOption = options.find(o => o.word === choice.text) || { word: choice.text, id: 'unknown' };
      onAnswer(selectedOption);
    }
  };

  const handlePlayAyah = () => playAyah(word.surah_number, word.ayah_number, word);
  const handlePlayWord = () => playWord(word.surah_number, word.ayah_number, word.word, word);

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
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

        <Droppable droppableId="choices-list" direction="horizontal">
          {(provided) => (
            <div 
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="flex flex-wrap justify-center gap-4 min-h-[80px] p-4 bg-muted/20 rounded-xl"
            >
              {choices.map((choice, index) => (
                <DraggableWord 
                  key={choice.id} 
                  id={choice.id} 
                  text={choice.text} 
                  isDropped={droppedItem?.id === choice.id}
                  index={index}
                />
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
        
        <p className="text-center text-sm text-muted-foreground">استمع للآية ثم اسحب الكلمة الصحيحة</p>
      </div>
    </DragDropContext>
  );
}