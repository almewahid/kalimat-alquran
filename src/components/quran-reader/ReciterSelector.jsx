import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Settings2, PlusCircle, Gauge } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { RECITERS } from "./constants";

export default function ReciterSelector({
  selectedReciter, setSelectedReciter,
  customReciters,
  playbackSpeed, setPlaybackSpeed,
}) {
  const { toast } = useToast();

  return (
    <div>
      <label className="text-sm font-medium mb-2 block">القارئ والصوت</label>
      <div className="flex gap-2">
        <Select value={selectedReciter} onValueChange={setSelectedReciter}>
          <SelectTrigger className="flex-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RECITERS.map(reciter => (
              <SelectItem key={reciter.id} value={reciter.id}>
                {reciter.name}
              </SelectItem>
            ))}
            {customReciters.map(reciter => (
              <SelectItem key={reciter.id} value={reciter.id}>
                {reciter.name} (مخصص)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon" title="إعدادات التلاوة">
              <Settings2 className="w-4 h-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إدارة التلاوات والصوت</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div>
                <label className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Gauge className="w-4 h-4" /> سرعة التلاوة ({playbackSpeed}x)
                </label>
                <Slider
                  value={[playbackSpeed]}
                  min={0.5}
                  max={2.0}
                  step={0.1}
                  onValueChange={([v]) => setPlaybackSpeed(v)}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>0.5x (بطيء)</span>
                  <span>1.0x (عادي)</span>
                  <span>2.0x (سريع)</span>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">إضافة قراء جدد</h4>
                <p className="text-sm text-muted-foreground mb-3">يمكنك إضافة روابط تلاوات مخصصة هنا (ميزة تجريبية)</p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => toast({ title: "قريباً", description: "سيتم تفعيل إضافة القراء قريباً" })}
                >
                  <PlusCircle className="w-4 h-4 ml-2" />
                  إضافة قارئ جديد
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
