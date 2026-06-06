import { ExternalLink } from "lucide-react";
import { truncateAddress, truncateHash } from "@/lib/format";
import { CopyButton } from "./copy-button";

interface AddressLinkProps {
  address: string;
  type?: "address" | "tx";
  showCopy?: boolean;
  className?: string;
}

export function AddressLink({ address, type = "address", showCopy = true, className = "" }: AddressLinkProps) {
  if (!address) return null;
  
  const url = type === "tx" 
    ? `https://celoscan.io/tx/${address}`
    : `https://celoscan.io/address/${address}`;
    
  const displayText = type === "tx" ? truncateHash(address) : truncateAddress(address);

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      <a 
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="font-mono text-xs text-primary hover:underline flex items-center group"
      >
        {displayText}
        <ExternalLink className="h-3 w-3 ml-1 opacity-50 group-hover:opacity-100" />
      </a>
      {showCopy && <CopyButton value={address} />}
    </div>
  );
}
