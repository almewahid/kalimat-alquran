import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Upload, Smile } from "lucide-react";
import { supabase } from "@/components/api/supabaseClient";
import { useToast } from "@/components/ui/use-toast";

const ICON_EMOJIS = [
  "📚", "📖", "📝", "✨", "🌟", "⭐", "💎", "🏆", 
  "🎯", "🎓", "📿", "🕌", "☪️", "🌙", "💫", "🔥",
  "🌺", "🌸", "🌼", "🌻", "🌷", "🌹", "💐", "🎨"
];

export default function IconPicker({ currentIcon, onSelect, isOpen, onClose }) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `icons/${Date.now()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage
        .from('uploads')
        .getPublicUrl(uploadData.path);
      onSelect(publicUrl);
      toast({ title: "✅ تم رفع الصورة" });
      onClose();
    } catch (error) {
      console.error(error);
      toast({ title: "❌ فشل رفع الصورة", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>اختر أيقونة أو ارفع صورة</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Smile className="w-4 h-4" />
              أيقونات جاهزة
            </h3>
            <div className="grid grid-cols-8 gap-2">
              {ICON_EMOJIS.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => {
                    onSelect(emoji);
                    onClose();
                  }}
                  className={`
                    text-3xl p-2 rounded-lg border-2 transition-all
                    ${currentIcon === emoji ? 'border-primary bg-primary/10' : 'border-gray-200 hover:border-primary/50'}
                  `}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Upload className="w-4 h-4" />
              أو ارفع صورة مخصصة
            </h3>
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                disabled={uploading}
              />
              <Button variant="outline" className="w-full" asChild>
                <span className="gap-2">
                  {uploading ? "جارٍ الرفع..." : "اختر صورة"}
                </span>
              </Button>
            </label>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}