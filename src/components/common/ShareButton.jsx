import React from 'react';
import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function ShareButton({ title, text, url, className = "" }) {
  const { toast } = useToast();

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: text,
          url: url || window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      navigator.clipboard.writeText(`${title}\n${text}\n${url || window.location.href}`);
      toast({ title: "تم نسخ الرابط", description: "يمكنك لصقه الآن لمشاركته." });
    }
  };

  return (
    <Button onClick={handleShare} variant="outline" className={`gap-2 ${className}`}>
      <Share2 className="w-4 h-4" />
      مشاركة
    </Button>
  );
}