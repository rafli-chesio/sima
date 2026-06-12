"use client";

import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { ImageIcon } from "lucide-react";
import Image from "next/image";

export function AssetImageThumbnail({ imageUrl, altText, className = "w-10 h-10" }: { imageUrl: string | null; altText: string; className?: string }) {
  if (!imageUrl) {
    return (
      <div className={`bg-white/5 border border-white/10 rounded-md flex items-center justify-center ${className}`}>
        <ImageIcon className="w-5 h-5 text-muted-foreground" />
      </div>
    );
  }

  return (
    <Dialog>
      <DialogTrigger render={<button className={`bg-white/5 border border-white/10 rounded-md overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary transition-all duration-300 relative flex items-center justify-center ${className}`} />}>
        <img 
          src={imageUrl} 
          alt={altText} 
          className="w-full h-full object-cover"
        />
      </DialogTrigger>
      <DialogContent className="max-w-3xl bg-transparent border-none shadow-none flex items-center justify-center p-0">
        <div className="relative w-full max-h-[85vh] flex items-center justify-center overflow-hidden rounded-xl bg-black/80 backdrop-blur-sm p-2">
          <img 
            src={imageUrl} 
            alt={altText} 
            className="max-w-full max-h-[80vh] object-contain rounded-lg"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
