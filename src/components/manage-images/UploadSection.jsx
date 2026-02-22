import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Upload, Loader2 } from "lucide-react";

export default function UploadSection({ categories, category, setCategory, previewFiles, handleFileChange, handleUpload, uploading }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>📁 رفع صور حسب الفئة</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full md:w-1/3">
              <SelectValue placeholder="اختر الفئة" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input type="file" multiple accept="image/*" onChange={handleFileChange} />
        </div>

        {previewFiles.length > 0 && (
          <div className="grid md:grid-cols-3 gap-4">
            {previewFiles.map((file, i) => (
              <div key={i} className="border rounded-lg p-2">
                <img src={URL.createObjectURL(file)} alt={file.name} className="w-full h-32 object-cover rounded" />
                <p className="text-sm mt-2 truncate">{file.name}</p>
              </div>
            ))}
          </div>
        )}

        <Button onClick={handleUpload} disabled={uploading} className="w-full">
          {uploading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> جاري الرفع...</> : <><Upload className="w-4 h-4 mr-2" /> رفع الصور</>}
        </Button>
      </CardContent>
    </Card>
  );
}
