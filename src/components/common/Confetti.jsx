import React from "react";
import confetti from "canvas-confetti";

/**
 * 🎉 Confetti Celebration Component
 * احتفال عند إكمال مستوى أو إنجاز
 */

export const triggerConfetti = (type = "default") => {
  const duration = 3 * 1000;
  const animationEnd = Date.now() + duration;
  
  const randomInRange = (min, max) => {
    return Math.random() * (max - min) + min;
  };

  switch (type) {
    case "levelUp":
      // احتفال كبير عند رفع المستوى
      const colors = ['#1e7855', '#50b482', '#d2f0dc', '#FFD700', '#FFA500'];
      (function frame() {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: colors
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: colors
        });

        if (Date.now() < animationEnd) {
          requestAnimationFrame(frame);
        }
      }());
      break;

    case "achievement":
      // احتفال متوسط عند إنجاز
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#1e7855', '#50b482', '#d2f0dc']
      });
      break;

    case "correctAnswer":
      // احتفال بسيط عند إجابة صحيحة
      confetti({
        particleCount: 30,
        spread: 50,
        origin: { y: 0.7 },
        colors: ['#10b981', '#34d399', '#6ee7b7']
      });
      break;

    case "perfectScore":
      // احتفال ضخم عند درجة كاملة
      const end = Date.now() + (5 * 1000);
      (function frame() {
        confetti({
          particleCount: 7,
          angle: randomInRange(55, 125),
          spread: randomInRange(50, 70),
          origin: { x: randomInRange(0.1, 0.9), y: Math.random() - 0.2 },
          colors: ['#FFD700', '#FFA500', '#FF6347', '#1e7855', '#50b482']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      }());
      break;

    default:
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
  }
};

export default function Confetti({ trigger, type = "default", children }) {
  React.useEffect(() => {
    if (trigger) {
      triggerConfetti(type);
    }
  }, [trigger, type]);

  return <>{children}</>;
}