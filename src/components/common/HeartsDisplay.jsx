import React from "react";
import { Heart } from "lucide-react";
import { motion } from "framer-motion";

export default function HeartsDisplay({ hearts, maxHearts = 5 }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: maxHearts }, (_, index) => (
        <motion.div
          key={index}
          animate={hearts > index ? { scale: [1, 1.2, 1] } : {}}
          transition={{ duration: 0.3 }}
        >
          <Heart
            className={`w-6 h-6 ${
              hearts > index
                ? "fill-red-500 text-red-500"
                : "text-gray-300"
            }`}
          />
        </motion.div>
      ))}
      <span className="text-sm font-medium text-gray-600 mr-2">
        {hearts}/{maxHearts}
      </span>
    </div>
  );
}