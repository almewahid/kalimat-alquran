import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";

export default function RangeControls({
  fromAyah, setFromAyah,
  toAyah, setToAyah,
  ayahCount,
  playSelectedRange,
}) {
  return (
    <div className="mt-4 p-3 bg-background-soft rounded-lg">
      <div className="flex items-center gap-4 flex-wrap">
        <span className="text-sm font-medium">اختر نطاق الآيات:</span>
        <div className="flex items-center gap-2">
          <label className="text-sm">من آية:</label>
          <Input
            type="number"
            min="1"
            max={ayahCount}
            value={fromAyah}
            onChange={(e) => setFromAyah(Number(e.target.value))}
            className="w-20"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm">إلى آية:</label>
          <Input
            type="number"
            min={fromAyah}
            max={ayahCount}
            value={toAyah}
            onChange={(e) => setToAyah(Number(e.target.value))}
            className="w-20"
          />
        </div>
        <Button
          size="sm"
          onClick={playSelectedRange}
          className="bg-blue-600 hover:bg-blue-700 gap-2"
        >
          <Play className="w-4 h-4" />
          تشغيل النطاق
        </Button>
      </div>
    </div>
  );
}
