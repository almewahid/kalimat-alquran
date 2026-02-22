import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircle } from "lucide-react";

export default function CategoryManager({ categories, newCategory, setNewCategory, handleAddCategory, handleDeleteCategory }) {
  return (
    <Card className="mt-10">
      <CardHeader><CardTitle>🧩 إدارة الفئات</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <Input
            placeholder="اسم الفئة الجديدة"
            value={newCategory.name}
            onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
          />
          <Input
            placeholder="وصف الفئة (اختياري)"
            value={newCategory.description}
            onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
          />
          <Button onClick={handleAddCategory}>
            <PlusCircle className="w-4 h-4 mr-1" /> إضافة
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {categories.map((cat) => (
            <Card key={cat.id} className="p-3 flex justify-between items-center">
              <div>
                <p className="font-semibold">{cat.name}</p>
                <p className="text-xs text-gray-500">{cat.description}</p>
              </div>
              <Button variant="destructive" size="sm" onClick={() => handleDeleteCategory(cat.id)}>حذف</Button>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
