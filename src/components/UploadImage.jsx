"use client";
import { useState } from "react";
import { base44 } from "@/api/base44Client"; // استيراد base44 SDK
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, CheckCircle, Upload as UploadIcon, XCircle } from "lucide-react";

export default function UploadImage() {
  const [image, setImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setSaved(false);
    setError(null);

    try {
      // 🟢 رفع الصورة إلى Cloudinary مباشرة (بدون backend)
      // تأكد أن 'kalimat-allah_uploads' هو upload preset غير موقع على Cloudinary
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "kalimat-allah_uploads"); // استبدل بـ upload preset الخاص بك

      const res = await fetch(
        "https://api.cloudinary.com/v1_1/dufjbywcm/image/upload", // استبدل بـ Cloud Name الخاص بك
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await res.json();
      setUploading(false);

      if (!data.secure_url) {
        setError("فشل رفع الصورة إلى Cloudinary. تأكد من إعدادات Cloudinary.");
        console.error("Cloudinary upload failed:", data);
        return;
      }

      const imageUrl = data.secure_url;
      setImage(imageUrl);

      // 🟢 حفظ الرابط في جدول Base44 (جدول اسمه images)
      try {
        await base44.entities.images.create({ url: imageUrl });
        setSaved(true);
      } catch (dbError) {
        setError("تم رفع الصورة، لكن لم تُحفظ في قاعدة البيانات: " + dbError.message);
        console.error("Base44 save failed:", dbError);
      }
      
    } catch (uploadError) {
      console.error("حدث خطأ أثناء عملية الرفع:", uploadError);
      setError("حدث خطأ أثناء عملية الرفع: " + uploadError.message);
      setUploading(false);
    }
  };

  return (
    <Card className="flex flex-col items-center gap-3 p-6 border rounded-2xl shadow-lg bg-card max-w-md mx-auto">
      <h2 className="text-xl font-semibold gradient-text mb-4 text-center">📤 رفع صورة جديدة</h2>

      <Input
        id="image-upload"
        type="file"
        accept="image/*"
        onChange={handleUpload}
        disabled={uploading}
        className="w-full text-foreground/80 cursor-pointer border-border hover:border-primary transition-all duration-200"
      />

      {uploading && (
        <p className="flex items-center gap-2 text-primary mt-3">
          <Loader2 className="w-5 h-5 animate-spin" />
          جاري رفع الصورة...
        </p>
      )}

      {error && (
        <p className="flex items-center gap-2 text-red-500 mt-3">
          <XCircle className="w-5 h-5" />
          {error}
        </p>
      )}

      {image && (
        <div className="mt-5 text-center w-full">
          <img
            src={image}
            alt="Uploaded"
            className="w-full h-auto max-h-64 object-contain rounded-lg border-2 border-border mx-auto mb-3 shadow-sm"
          />
          <p className="text-sm text-foreground/70 break-all bg-background-soft p-2 rounded-md border border-border">
            {image}
          </p>
        </div>
      )}

      {saved && (
        <p className="flex items-center gap-2 text-green-600 mt-2">
          <CheckCircle className="w-5 h-5" />
          تم حفظ الرابط في قاعدة البيانات!
        </p>
      )}

      <Button 
        onClick={() => { setImage(null); setSaved(false); setError(null); document.getElementById('image-upload').value = ''; }}
        variant="outline"
        className="mt-4"
        disabled={uploading}
      >
        مسح الكل
      </Button>
    </Card>
  );
}