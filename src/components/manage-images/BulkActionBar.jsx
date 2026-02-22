import { Button } from "@/components/ui/button";
import { Edit, Sparkles, Wrench, Trash2 } from "lucide-react";

export default function BulkActionBar({ selectedIds, setSelectedIds, setShowBulkEdit, handleAutoTag, setShowAdvancedFix, handleDelete, isProcessing }) {
  if (selectedIds.size === 0) return null;

  const handleBulkDelete = () => {
    if (confirm("حذف الصور المحددة؟")) {
      selectedIds.forEach(id => handleDelete(id));
      setSelectedIds(new Set());
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-800 shadow-2xl rounded-full px-6 py-3 flex items-center gap-4 z-50 border border-border animate-in slide-in-from-bottom-5">
      <span className="font-bold text-sm bg-primary/10 text-primary px-3 py-1 rounded-full">
        {selectedIds.size} محدد
      </span>

      <div className="h-6 w-px bg-gray-200" />

      <Button size="sm" variant="ghost" onClick={() => setShowBulkEdit(true)} title="تعديل جماعي">
        <Edit className="w-4 h-4 mr-2" /> تعديل
      </Button>

      <Button size="sm" variant="ghost" onClick={handleAutoTag} disabled={isProcessing} title="توليد وسوم بالذكاء الاصطناعي">
        <Sparkles className="w-4 h-4 mr-2 text-purple-500" /> AI Tags
      </Button>

      <Button size="sm" variant="ghost" onClick={() => setShowAdvancedFix(true)} className="text-orange-600 hover:text-orange-700 hover:bg-orange-50" title="إصلاح روابط الصور المحددة يدوياً">
        <Wrench className="w-4 h-4 mr-2" /> مسار مخصص
      </Button>

      <div className="h-6 w-px bg-gray-200" />

      <Button size="sm" variant="ghost" onClick={handleBulkDelete} className="text-red-600 hover:bg-red-50">
        <Trash2 className="w-4 h-4" />
      </Button>

      <Button size="icon" variant="ghost" className="rounded-full h-8 w-8 ml-2" onClick={() => setSelectedIds(new Set())}>
        &times;
      </Button>
    </div>
  );
}
