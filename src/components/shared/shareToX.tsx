import React from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ShareToXProps {
  text: string;
  url?: string;
  hashtags?: string[];
  variant?: "default" | "outline" | "accent" | "brown" | "card" | "submit" | "greenSubmit" | "modal";
  className?: string;
  iconOnly?: boolean;
}

const ShareToX: React.FC<ShareToXProps> = ({
  text,
  url = "https://app.sir.trading",
  variant = "outline",
  className = "",
  iconOnly = false,
}) => {
  const handleShare = () => {
    const encodedText = encodeURIComponent(text);
    const encodedUrl = encodeURIComponent(url);
    
    const twitterUrl = `https://x.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
    
    window.open(twitterUrl, "_blank", "width=550,height=420");
  };

  return (
    <Button
      variant={variant}
      onClick={handleShare}
      className={cn(iconOnly ? "h-8 w-8 p-0" : "h-8 px-3 text-xs", className)}
    >
      <X className={iconOnly ? "h-4 w-4" : "h-4 w-4 mr-1"} />
      {!iconOnly && "Share"}
    </Button>
  );
};

export default ShareToX;