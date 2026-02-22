import { Card, CardContent } from "@/components/ui/card";
import { Image as ImageIcon } from "lucide-react";
import ImageCard from "./ImageCard";

export default function ImageGrid({ filteredImages, selectedIds, toggleSelection, handleEdit, handleDelete, copyToClipboard, handleImageError }) {
  if (filteredImages.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-foreground/70">لا توجد صور في هذه الفئة</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
      {filteredImages.map((image) => (
        <ImageCard
          key={image.id}
          image={image}
          selectedIds={selectedIds}
          toggleSelection={toggleSelection}
          handleEdit={handleEdit}
          handleDelete={handleDelete}
          copyToClipboard={copyToClipboard}
          handleImageError={handleImageError}
        />
      ))}
    </div>
  );
}
