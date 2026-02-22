import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Download, Copy } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function ExportTab({ images, categories, category, setCategory }) {
  const { toast } = useToast();
  const dataToExport = category === "all" ? images : images.filter(img => img.category === category);

  const exportCSV = () => {
    const csv = [
      ["العنوان", "الفئة", "الرابط", "الحجم (KB)", "العرض", "الارتفاع"],
      ...dataToExport.map(img => [
        img.title || "بدون عنوان",
        img.category || "",
        img.url || "",
        Math.round((img.file_size || 0) / 1024),
        img.width || "",
        img.height || ""
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob(["\ufeff" + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `images_export_${category}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast({ title: "✅ تم التصدير إلى CSV" });
  };

  const copyAllUrls = () => {
    navigator.clipboard.writeText(dataToExport.map(img => img.url).join("\n"));
    toast({ title: `✅ تم نسخ ${dataToExport.length} رابط` });
  };

  return (
    <Card>
      <CardHeader><CardTitle>📥 تصدير الروابط والبيانات</CardTitle></CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label>اختر الفئة للتصدير</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue placeholder="اختر الفئة" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الفئات</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Button onClick={exportCSV} className="gap-2">
              <Download className="w-4 h-4" /> تصدير CSV
            </Button>
            <Button variant="outline" onClick={copyAllUrls} className="gap-2">
              <Copy className="w-4 h-4" /> نسخ جميع الروابط
            </Button>
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              💡 سيتم تصدير البيانات التالية: العنوان، الفئة، الرابط، الحجم، الأبعاد
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
