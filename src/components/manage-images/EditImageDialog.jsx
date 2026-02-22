import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { RefreshCw, Scissors, Wand2 } from "lucide-react";

export default function EditImageDialog({
  editingImage, setEditingImage,
  showEditDialog, setShowEditDialog,
  categories,
  handleSaveEdit, handleFixCurrentUrl,
  transformData, setTransformData, applyTransformation,
}) {
  return (
    <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
      <DialogContent dir="rtl" className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>تعديل الصورة وتحسينها</DialogTitle>
        </DialogHeader>

        {editingImage && (
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">البيانات الأساسية</TabsTrigger>
              <TabsTrigger value="transform">التحويلات & Cloudinary</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4 py-4">
              <div className="flex gap-4">
                <div className="w-1/2">
                  <img src={editingImage.url} alt="معاينة" className="w-full h-48 object-cover rounded-lg mb-4" />
                  {editingImage.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1 text-xs text-gray-500">
                      {editingImage.tags.map((t, i) => (
                        <Badge key={i} variant="secondary">{t}</Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div className="w-1/2 space-y-3">
                  <Input
                    value={editingImage.title || ""}
                    onChange={(e) => setEditingImage({ ...editingImage, title: e.target.value })}
                    placeholder="عنوان الصورة"
                  />
                  <Select
                    value={editingImage.category || ""}
                    onValueChange={(v) => setEditingImage({ ...editingImage, category: v })}
                  >
                    <SelectTrigger><SelectValue placeholder="اختر الفئة" /></SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Textarea
                    value={editingImage.description || ""}
                    onChange={(e) => setEditingImage({ ...editingImage, description: e.target.value })}
                    placeholder="وصف الصورة"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex gap-2 items-center">
                <Input
                  value={editingImage.url}
                  onChange={(e) => setEditingImage({ ...editingImage, url: e.target.value })}
                  placeholder="رابط الصورة"
                  className="flex-1 dir-ltr text-xs font-mono"
                />
                <Button variant="outline" size="icon" onClick={handleFixCurrentUrl} title="إصلاح ترميز الرابط">
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="transform" className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2"><Scissors className="w-4 h-4" /> إعدادات التحويل</h3>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs">العرض (px)</label>
                      <Input type="number" value={transformData.width} onChange={(e) => setTransformData({ ...transformData, width: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-xs">الارتفاع (px)</label>
                      <Input type="number" value={transformData.height} onChange={(e) => setTransformData({ ...transformData, height: e.target.value })} />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs">وضع القص</label>
                    <Select value={transformData.crop} onValueChange={(v) => setTransformData({ ...transformData, crop: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fill">Fill (تعبئة)</SelectItem>
                        <SelectItem value="scale">Scale (تغيير حجم)</SelectItem>
                        <SelectItem value="crop">Crop (قص)</SelectItem>
                        <SelectItem value="thumb">Thumbnail (مصغرة)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-xs">تأثيرات</label>
                    <Select value={transformData.effect} onValueChange={(v) => setTransformData({ ...transformData, effect: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">بدون</SelectItem>
                        <SelectItem value="grayscale">أبيض وأسود</SelectItem>
                        <SelectItem value="sepia">Sepia</SelectItem>
                        <SelectItem value="pixelate">بكسلة</SelectItem>
                        <SelectItem value="blur">ضبابية</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button onClick={applyTransformation} className="w-full">
                    <Wand2 className="w-4 h-4 mr-2" /> تطبيق على الرابط
                  </Button>
                </div>

                <div className="bg-gray-100 rounded-lg p-2 flex items-center justify-center border-2 border-dashed">
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-2">معاينة النتيجة الحالية للرابط</p>
                    <img src={editingImage.url} className="max-h-48 max-w-full object-contain mx-auto shadow-sm" alt="Preview" />
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setShowEditDialog(false)}>إلغاء</Button>
          <Button onClick={handleSaveEdit}>حفظ التعديلات</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
