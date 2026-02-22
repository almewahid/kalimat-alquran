import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertTriangle, Loader2 } from "lucide-react";

export default function AdvancedFixDialog({ showAdvancedFix, setShowAdvancedFix, manualPath, setManualPath, handleManualPathFix, isProcessing }) {
  return (
    <Dialog open={showAdvancedFix} onOpenChange={setShowAdvancedFix}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            إصلاح الروابط (مسار مخصص)
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            إذا كانت الصور تظهر "مكسورة"، فقد تكون في مجلد مختلف عن المتوقع.
            أدخل اسم المجلد الصحيح في Cloudinary وسنحاول العثور عليها هناك.
          </p>
          <div className="bg-slate-100 p-3 rounded text-xs font-mono mb-2">
            Cloudinary Structure: kalimat / <span className="text-blue-600 font-bold">{manualPath}</span> / filename.jpg
          </div>
          <Input
            value={manualPath}
            onChange={(e) => setManualPath(e.target.value)}
            placeholder="مثال: old_folder_name أو kalimat_backup"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowAdvancedFix(false)}>إلغاء</Button>
          <Button onClick={handleManualPathFix} disabled={isProcessing}>
            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : "بدء البحث والإصلاح"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
