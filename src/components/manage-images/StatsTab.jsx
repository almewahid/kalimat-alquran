import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

export default function StatsTab({ images, categories, category, setCategory }) {
  const filtered = category === "all" ? images : images.filter(img => img.category === category);

  return (
    <Card>
      <CardHeader>
        <CardTitle>📊 إحصائيات استخدام Cloudinary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="mb-4">
          <Label>فلتر الفئة</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full md:w-1/3">
              <SelectValue placeholder="اختر الفئة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الفئات</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card className="bg-blue-50 dark:bg-blue-900/20">
            <CardContent className="p-6 text-center">
              <div className="text-4xl font-bold text-blue-600">{filtered.length}</div>
              <p className="text-sm text-blue-800 dark:text-blue-200 mt-2">إجمالي الصور</p>
            </CardContent>
          </Card>

          <Card className="bg-purple-50 dark:bg-purple-900/20">
            <CardContent className="p-6 text-center">
              <div className="text-4xl font-bold text-purple-600">
                {(filtered.reduce((sum, img) => sum + (img.file_size || 0), 0) / 1024 / 1024).toFixed(2)} MB
              </div>
              <p className="text-sm text-purple-800 dark:text-purple-200 mt-2">حجم التخزين</p>
            </CardContent>
          </Card>

          <Card className="bg-green-50 dark:bg-green-900/20">
            <CardContent className="p-6 text-center">
              <div className="text-4xl font-bold text-green-600">{categories.length}</div>
              <p className="text-sm text-green-800 dark:text-green-200 mt-2">عدد الفئات</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-lg">التوزيع حسب الفئات</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {categories.map(cat => {
                const count = images.filter(img => img.category === cat.name).length;
                const percentage = images.length > 0 ? ((count / images.length) * 100).toFixed(1) : 0;
                return (
                  <div key={cat.id} className="flex items-center justify-between">
                    <span className="font-medium">{cat.name}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${percentage}%` }} />
                      </div>
                      <span className="text-sm text-foreground/70">{count} ({percentage}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}
