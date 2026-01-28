import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Heart, RotateCcw } from "lucide-react";
import { motion } from "framer-motion";

export default function TasbihModal({ isOpen, onClose, onHeartRestored }) {
  const [tasbihCount, setTasbihCount] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  
  const requiredTasbih = 10;
  const tasbihText = "سبحان الله";

  useEffect(() => {
    if (tasbihCount >= requiredTasbih && !isCompleted) {
      setIsCompleted(true);
    }
  }, [tasbihCount, isCompleted]);

  // Reset when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTasbihCount(0);
      setIsCompleted(false);
    }
  }, [isOpen]);

  const handleTasbihClick = () => {
    if (!isCompleted) {
      setTasbihCount(prev => prev + 1);
    }
  };

  const handleRestore = () => {
    if (onHeartRestored) {
      onHeartRestored();
    }
    setTasbihCount(0);
    setIsCompleted(false);
  };

  const handleReset = () => {
    setTasbihCount(0);
    setIsCompleted(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md text-center" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-emerald-700 mb-4">
            استعد قلبك ❤️
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="text-gray-600">
            <p className="mb-2">لقد انتهت قلوبك! 💔</p>
            <p className="text-sm">سبح الله {requiredTasbih} مرات لتستعيد قلباً واحداً</p>
          </div>

          <div className="bg-emerald-50 rounded-lg p-6 border border-emerald-200">
            <motion.div
              animate={tasbihCount > 0 ? { scale: [1, 1.1, 1] } : {}}
              className="mb-4"
            >
              <div className="text-3xl font-bold text-emerald-800 mb-2">
                {tasbihCount} / {requiredTasbih}
              </div>
              <div className="w-full bg-emerald-200 rounded-full h-2">
                <div 
                  className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(tasbihCount / requiredTasbih) * 100}%` }}
                />
              </div>
            </motion.div>

            <Button
              onClick={handleTasbihClick}
              disabled={isCompleted}
              className="w-full mb-3 py-6 text-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300"
              size="lg"
            >
              {tasbihText}
            </Button>

            <Button
              onClick={handleReset}
              variant="outline"
              size="sm"
              className="gap-2"
              disabled={isCompleted}
            >
              <RotateCcw className="w-4 h-4" />
              إعادة بدء العد
            </Button>
          </div>

          {isCompleted && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="text-green-600 font-medium">
                ✨ بارك الله فيك! تم إكمال التسبيح
              </div>
              
              <Button
                onClick={handleRestore}
                className="w-full bg-green-600 hover:bg-green-700 gap-2"
              >
                <Heart className="w-4 h-4" />
                استعادة قلب واحد والمتابعة
              </Button>
            </motion.div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}