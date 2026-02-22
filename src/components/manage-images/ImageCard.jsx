import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, FolderTree, Tags, Wrench } from "lucide-react";

export default function ImageCard({ image, selectedIds, toggleSelection, handleEdit, handleDelete, copyToClipboard, handleImageError }) {
  return (
    <motion.div key={image.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Card className={`overflow-hidden hover:shadow-lg transition-all ${selectedIds.has(image.id) ? 'ring-2 ring-primary' : ''}`}>
        <div className="relative h-48 bg-gray-100 flex items-center justify-center overflow-hidden group">
          <div className="absolute top-2 right-2 z-10">
            <input
              type="checkbox"
              className="w-5 h-5 accent-primary cursor-pointer shadow-sm"
              checked={selectedIds.has(image.id)}
              onChange={() => toggleSelection(image.id)}
            />
          </div>

          {image.tags && image.tags.length > 0 && (
            <div className="absolute top-2 left-2 z-10">
              <Badge variant="secondary" className="bg-white/90 backdrop-blur text-xs flex gap-1">
                <Tags className="w-3 h-3" /> {image.tags.length}
              </Badge>
            </div>
          )}

          <img
            src={image.url}
            alt={image.title || "صورة"}
            className="w-full h-full object-cover transition-opacity duration-300"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "https://placehold.co/400x300?text=Broken+Link";
              e.target.classList.add("opacity-50");
              handleImageError(image.id);
            }}
          />

          <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 bg-black/40 transition-opacity">
            <Button size="sm" variant="secondary" onClick={() => handleEdit(image)}>
              <Wrench className="w-4 h-4 mr-2" /> إصلاح الرابط
            </Button>
          </div>
        </div>

        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-lg truncate">{image.title || "بدون عنوان"}</h3>
            {image.category && (
              <Badge variant="secondary" className="text-xs">
                <FolderTree className="w-3 h-3 mr-1 inline" /> {image.category}
              </Badge>
            )}
          </div>
          {image.description && (
            <p className="text-sm text-foreground/70 mb-3 line-clamp-2">{image.description}</p>
          )}
          <div className="flex gap-2">
            <Button onClick={() => copyToClipboard(image.url)} size="sm" variant="outline" className="flex-1">نسخ الرابط</Button>
            <Button onClick={() => handleEdit(image)} size="sm" variant="outline"><Edit className="w-4 h-4" /></Button>
            <Button onClick={() => handleDelete(image.id)} size="sm" variant="outline" className="text-red-600 hover:bg-red-50"><Trash2 className="w-4 h-4" /></Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
