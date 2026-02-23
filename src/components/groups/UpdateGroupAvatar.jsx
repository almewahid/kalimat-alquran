import React, { useState } from "react";
import { supabaseClient, supabase } from "@/components/api/supabaseClient";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Upload, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function UpdateGroupAvatar({ group, isOpen, onClose, onSuccess }) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(group?.avatar_url || null);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({ title: "⚠️ اختر صورة أولاً", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      // Upload file
      const fileExt = selectedFile.name.split('.').pop();
      const filePath = `groups/${group.id}-${Date.now()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(filePath, selectedFile, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl: file_url } } = supabase.storage
        .from('uploads')
        .getPublicUrl(uploadData.path);

      // Update group
      await supabaseClient.entities.Group.update(group.id, { avatar_url: file_url });

      toast({ title: "✅ تم تحديث صورة المجموعة" });
      onSuccess?.();
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>تحديث صورة المجموعة</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex flex-col items-center gap-4">
            <div className="w-32 h-32 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50">
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <ImageIcon className="w-12 h-12 text-gray-400" />
              )}
            </div>

            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button variant="outline" asChild>
                <span className="gap-2">
                  <Upload className="w-4 h-4" />
                  اختر صورة
                </span>
              </Button>
            </label>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleUpload}
              disabled={uploading || !selectedFile}
              className="flex-1"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  جارٍ الرفع...
                </>
              ) : (
                "حفظ الصورة"
              )}
            </Button>
            <Button onClick={onClose} variant="outline">
              إلغاء
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}