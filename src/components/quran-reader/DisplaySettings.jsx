import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Type, BookMarked } from "lucide-react";
import { TAFSIR_OPTIONS } from "./constants";

export default function DisplaySettings({
  fontSize, setFontSize,
  fontFamily, setFontFamily,
  repeatAyah, setRepeatAyah,
  showTafsir, setShowTafsir,
  selectedTafsirs, setSelectedTafsirs,
}) {
  return (
    <div className="mt-4 space-y-4">
      <div className="flex flex-wrap items-center gap-4 p-3 bg-background-soft rounded-lg">
        <div className="flex items-center gap-3">
          <Type className="w-4 h-4 text-foreground/70" />
          <span className="text-sm">حجم الخط:</span>
          <Button variant="outline" size="sm" onClick={() => setFontSize(Math.max(16, fontSize - 2))}>-</Button>
          <span className="text-sm font-bold">{fontSize}</span>
          <Button variant="outline" size="sm" onClick={() => setFontSize(Math.min(40, fontSize + 2))}>+</Button>
        </div>

        <div className="flex items-center gap-3 border-r pr-4 mr-4">
          <span className="text-sm">نوع الخط:</span>
          <Select value={fontFamily} onValueChange={setFontFamily}>
            <SelectTrigger className="w-32 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Amiri">Amiri (نسخ)</SelectItem>
              <SelectItem value="Scheherazade New">Scheherazade (واضح)</SelectItem>
              <SelectItem value="Cairo">Cairo (عصري)</SelectItem>
              <SelectItem value="Uthmanic">عثماني</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 border-r pr-4 mr-4">
          <span className="text-sm">تكرار التلاوة:</span>
          <Switch checked={repeatAyah} onCheckedChange={setRepeatAyah} />
        </div>
      </div>

      <div className="p-3 bg-background-soft rounded-lg space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookMarked className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">عرض التفسير</span>
          </div>
          <Switch checked={showTafsir} onCheckedChange={setShowTafsir} />
        </div>

        {showTafsir && (
          <div className="space-y-3">
            {[0, 1, 2].map(index => (
              <div key={index}>
                <label className="text-xs text-foreground/70 mb-1 block">
                  التفسير {index + 1}
                </label>
                <Select
                  value={selectedTafsirs[index]}
                  onValueChange={(value) => {
                    setSelectedTafsirs(prev => {
                      const newTafsirs = [...prev];
                      newTafsirs[index] = value;
                      return newTafsirs;
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر التفسير" />
                  </SelectTrigger>
                  <SelectContent>
                    {TAFSIR_OPTIONS.map(tafsir => (
                      <SelectItem key={tafsir.id} value={tafsir.id}>
                        {tafsir.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
