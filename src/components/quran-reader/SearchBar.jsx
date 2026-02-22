import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";

export default function SearchBar({
  searchQuery, setSearchQuery,
  searchScope, setSearchScope,
  filteredAyahs,
  currentSurahName,
}) {
  return (
    <div>
      <label className="text-sm font-medium mb-2 block">بحث</label>
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/50" />
        <Input
          placeholder="ابحث في الآيات..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pr-10"
        />
      </div>

      {searchQuery.trim() && (
        <div className="mt-3 flex items-center gap-2 p-3 bg-primary/5 rounded-lg flex-wrap">
          <span className="text-sm font-medium text-foreground/80">نطاق البحث:</span>
          <div className="flex gap-2">
            <Button
              variant={searchScope === "current" ? "default" : "outline"}
              size="sm"
              onClick={() => setSearchScope("current")}
            >
              السورة الحالية ({currentSurahName})
            </Button>
            <Button
              variant={searchScope === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSearchScope("all")}
            >
              القرآن كاملاً
            </Button>
          </div>
          {searchScope === "all" && (
            <Badge variant="secondary" className="mr-auto">
              {filteredAyahs.length} نتيجة
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
