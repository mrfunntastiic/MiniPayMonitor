import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface CopyButtonProps {
  value: string;
  className?: string;
  size?: "icon" | "sm" | "default";
  variant?: "ghost" | "outline" | "default";
}

export function CopyButton({ value, className = "", size = "icon", variant = "ghost" }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(value);
    setCopied(true);
    toast({
      description: "Copied to clipboard",
      duration: 2000,
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button 
      variant={variant} 
      size={size} 
      onClick={handleCopy} 
      className={`h-6 w-6 p-0 ${className}`}
      title="Copy to clipboard"
    >
      {copied ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
      <span className="sr-only">Copy</span>
    </Button>
  );
}
