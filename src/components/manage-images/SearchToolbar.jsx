import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Search, CheckSquare, Square, Wrench } from "lucide-react";

export default function SearchToolbar({
  searchTerm, setSearchTerm,
  filteredImages, selectedIds, selectAll,
  sortOrder, setSortOrder,
  dateFilter, setDateFilter,
  brokenImageIds, handleBulkRepair,
}) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <Search className="w-5 h-5 text-foreground/50" />
        <Input
          placeholder="ابحث في الصور..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        <Badge variant="outline">{filteredImages.length} صورة</Badge>
        {filteredImages.length > 0 && (
          <Button variant="ghost" size="sm" onClick={selectAll} className="mr-auto">
            {selectedIds.size === filteredImages.length
              ? <><CheckSquare className="w-4 h-4 ml-2" /> إلغاء التحديد</>
              : <><Square className="w-4 h-4 ml-2" /> تحديد الكل</>}
          </Button>
        )}
      </CardContent>

      <div className="px-4 pb-4 flex gap-4 flex-wrap justify-between items-center">
        <div className="flex gap-4 flex-wrap">
          <Select value={sortOrder} onValueChange={setSortOrder}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="ترتيب حسب" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">الأحدث أولاً</SelectItem>
              <SelectItem value="oldest">الأقدم أولاً</SelectItem>
              <SelectItem value="name_asc">الاسم (أ-ي)</SelectItem>
              <SelectItem value="name_desc">الاسم (ي-أ)</SelectItem>
            </SelectContent>
          </Select>

          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="التاريخ" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الأوقات</SelectItem>
              <SelectItem value="today">اليوم</SelectItem>
              <SelectItem value="week">آخر أسبوع</SelectItem>
              <SelectItem value="month">آخر شهر</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          variant="outline"
          onClick={handleBulkRepair}
          className={`text-orange-600 border-orange-200 hover:bg-orange-50 ${brokenImageIds.size === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={brokenImageIds.size === 0}
          title="إصلاح الروابط للصور المكسورة فقط"
        >
          <Wrench className="w-4 h-4 mr-2" />
          إصلاح المكسور ({brokenImageIds.size})
        </Button>
      </div>
    </Card>
  );
}
