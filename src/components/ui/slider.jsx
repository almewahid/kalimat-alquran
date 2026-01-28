import * as React from "react"
import { cn } from "@/lib/utils"

const Slider = React.forwardRef(({ className, value = [50], onValueChange, max = 100, step = 1, ...props }, ref) => {
  const handleChange = (e) => {
    const newValue = [parseInt(e.target.value, 10)];
    onValueChange?.(newValue);
  };

  return (
    <div className={cn("relative flex w-full touch-none select-none items-center", className)} ref={ref}>
      <div className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
        <div 
          className="absolute h-full bg-primary transition-all" 
          style={{ width: `${(value[0] / max) * 100}%` }}
        />
      </div>
      <input
        type="range"
        min="0"
        max={max}
        step={step}
        value={value[0]}
        onChange={handleChange}
        className="absolute w-full h-2 opacity-0 cursor-pointer"
        {...props}
      />
      <div 
        className="absolute h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 pointer-events-none"
        style={{ left: `calc(${(value[0] / max) * 100}% - 10px)` }}
      />
    </div>
  );
});

Slider.displayName = "Slider";

export { Slider };