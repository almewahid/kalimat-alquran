import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

export default function BulkEditDialog({ showBulkEdit, setShowBulkEdit, selectedIds, categories, handleBulkEdit, isProcessing }) {
  const [bulkEditData, setBulkEditData] = useState({ category: "", description: "" });

  return (
    <Dialog open={showBulkEdit} onOpenChange={setShowBulkEdit}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>تعديل جماعي ({selectedIds.size} عنصر)</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-medium mb-1 block">تغيير الفئة للكل</label>
            <Select onValueChange={(v) => setBulkEditData({ ...bulkEditData, category: v })}>
              <SelectTrigger><SelectValue placeholder="اختر الفئة الجديدة (اختياري)" /></SelectTrigger>
              <SelectContent>
                {categories.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">تحديث الوصف</label>
            <Input
              placeholder="وصف موحد للكل (اختياري)"
              onChange={(e) => setBulkEditData({ ...bulkEditData, description: e.target.value })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowBulkEdit(false)}>إلغاء</Button>
          <Button onClick={() => handleBulkEdit(bulkEditData)} disabled={isProcessing}>
            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : "تطبيق التعديلات"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
