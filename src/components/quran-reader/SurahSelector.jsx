import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SURAHS } from "./constants";

export default function SurahSelector({ selectedSurah, setSelectedSurah }) {
  return (
    <div>
      <label className="text-sm font-medium mb-2 block">اختر السورة</label>
      <Select value={String(selectedSurah)} onValueChange={(v) => setSelectedSurah(Number(v))}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="max-h-[300px]">
          {SURAHS.map(surah => (
            <SelectItem key={surah.number} value={String(surah.number)}>
              {surah.number}. {surah.name} ({surah.ayahCount} آية)
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
