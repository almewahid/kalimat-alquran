import React from "react";
import { motion } from "framer-motion";

/**
 * 🌊 Wave Effect Component
 * تأثير "الموجة" عند الإجابة الصحيحة
 */

export default function WaveEffect({ trigger, color = "#10b981" }) {
  const [show, setShow] = React.useState(false);

  React.useEffect(() => {
    if (trigger) {
      setShow(true);
      setTimeout(() => setShow(false), 1000);
    }
  }, [trigger]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute inset-0 rounded-full"
          style={{
            border: `4px solid ${color}`,
            opacity: 0
          }}
          initial={{ scale: 0, opacity: 0.8 }}
          animate={{ scale: 3, opacity: 0 }}
          transition={{
            duration: 1,
            delay: i * 0.2,
            ease: "easeOut"
          }}
        />
      ))}
    </div>
  );
}