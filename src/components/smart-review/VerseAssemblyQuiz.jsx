import React, { useState, useEffect } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, TouchSensor } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const SortableWord = ({ id, text }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners} 
      className={`inline-block m-1 touch-none ${isDragging ? 'opacity-50 z-50' : ''}`}
    >
      <Badge 
        variant="secondary" 
        className="text-lg py-3 px-5 cursor-grab active:cursor-grabbing hover:bg-secondary/80 select-none"
      >
        {text}
      </Badge>
    </div>
  );
};

export default function VerseAssemblyQuiz({ word, onAnswer }) {
  const [items, setItems] = useState([]);
  const [correctOrder, setCorrectOrder] = useState([]);
  const [isCorrect, setIsCorrect] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    const text = word.aya_text || word.example_usage || "";
    const cleanText = text.trim();
    if (!cleanText) return;

    const words = cleanText.split(/\s+/).filter(w => w);
    const initialItems = words.map((w, i) => ({ id: `word-${i}`, text: w }));
    
    setCorrectOrder(initialItems.map(i => i.text));
    
    const shuffled = [...initialItems].sort(() => 0.5 - Math.random());
    setItems(shuffled);
    setIsCorrect(null);

  }, [word]);

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex(i => i.id === active.id);
        const newIndex = items.findIndex(i => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const checkOrder = () => {
    const currentOrderText = items.map(i => i.text);
    const isOrderCorrect = JSON.stringify(currentOrderText) === JSON.stringify(correctOrder);
    setIsCorrect(isOrderCorrect);
    
    if (isOrderCorrect) {
       onAnswer({ isCorrect: true });
    }
  };

  return (
    <div className="space-y-8 py-4">
       <div className="text-center mb-4">
         <p className="text-muted-foreground mb-2">رتب الكلمات لتكوين الآية الصحيحة</p>
         <p className="text-sm font-bold text-primary">{word.surah_name} - آية {word.ayah_number}</p>
       </div>

       <DndContext 
          sensors={sensors} 
          collisionDetection={closestCenter} 
          onDragEnd={handleDragEnd}
        >
          <SortableContext 
            items={items} 
            strategy={rectSortingStrategy}
          >
            <div className="flex flex-wrap justify-center gap-2 p-6 bg-muted/20 rounded-xl min-h-[150px] items-center">
              {items.map((item) => (
                <SortableWord key={item.id} id={item.id} text={item.text} />
              ))}
            </div>
          </SortableContext>
       </DndContext>

       <div className="flex justify-center">
         <Button 
            onClick={checkOrder} 
            size="lg" 
            className={`w-full max-w-xs ${isCorrect === true ? 'bg-green-600 hover:bg-green-700' : isCorrect === false ? 'bg-red-600 hover:bg-red-700' : ''}`}
          >
            {isCorrect === true ? "أحسنت! إجابة صحيحة" : isCorrect === false ? "حاول مرة أخرى" : "تحقق من الترتيب"}
         </Button>
       </div>
    </div>
  );
}