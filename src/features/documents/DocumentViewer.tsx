import { ArrowLeft, Calendar, Share2, Download, Copy, FileText, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner"; // Using the toaster already defined in your App.tsx

interface DocumentViewerProps {
  item: any;
  onBack: () => void;
}

export default function DocumentViewer({ item, onBack }: DocumentViewerProps) {
  const [copied, setCopied] = useState(false);
  const isImage = !!item.url;

  // 1. COPY FUNCTIONALITY
  const handleCopy = async () => {
    try {
      const textToCopy = isImage ? item.url : item.snippet;
      await navigator.clipboard.writeText(textToCopy || "");
      setCopied(true);
      toast.success("Content copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy content");
    }
  };

  // 2. SHARE FUNCTIONALITY
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: item.name,
          text: item.snippet?.substring(0, 100),
          url: window.location.href,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          toast.error("Could not share content");
        }
      }
    } else {
      // Fallback: Copy Link
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard (Share not supported)");
    }
  };

  // 3. DOWNLOAD FUNCTIONALITY
  const handleDownload = async () => {
    try {
      if (isImage) {
        // Download Image via Blob to avoid just opening in a new tab
        const response = await fetch(item.url);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = item.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        // Download Text/Code as file
        const blob = new Blob([item.snippet || ""], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        // Ensure file has extension
        const fileName = item.name.includes('.') ? item.name : `${item.name}.txt`;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
      toast.success(`Downloading ${item.name}...`);
    } catch (err) {
      toast.error("Download failed");
    }
  };

  return (
    <div className="flex flex-col h-full bg-main-bg animate-in fade-in slide-in-from-right-4 duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-6 border-b border-card-border bg-card-bg/50 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2.5 hover:bg-card-hover rounded-full transition-all text-muted-foreground hover:text-foreground active:scale-90"
          >
            <ArrowLeft size={22} />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-foreground leading-tight">{item.name}</h1>
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-1 font-medium tracking-wide">
              <Calendar size={12} />
              <span>{item.date}</span>
              {item.size && (
                <>
                  <span className="opacity-30">•</span>
                  <span className="font-bold uppercase">{item.size}</span>
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={handleCopy}
            className="p-2.5 hover:bg-card-hover rounded-xl transition-all text-muted-foreground hover:text-foreground border border-transparent hover:border-card-border"
            title="Copy content"
          >
            {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
          </button>
          
          <button 
            onClick={handleShare}
            className="p-2.5 hover:bg-card-hover rounded-xl transition-all text-muted-foreground hover:text-foreground border border-transparent hover:border-card-border"
            title="Share"
          >
            <Share2 size={18} />
          </button>

          <button 
            onClick={handleDownload}
            className="bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-primary/20"
          >
            <Download size={16} />
            Download
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6 md:p-12 flex justify-center [scrollbar-width:none]">
        <div className="max-w-4xl w-full">
          {isImage ? (
            <div className="rounded-[40px] overflow-hidden border border-card-border shadow-2xl bg-black/40 p-2 group">
              <img 
                src={item.url} 
                alt={item.name} 
                className="w-full h-auto object-contain rounded-[34px] shadow-inner"
              />
            </div>
          ) : (
            <div className="bg-card-bg border border-card-border rounded-[40px] p-8 md:p-14 shadow-sm min-h-[70vh] flex flex-col">
              <div className="prose prose-invert max-w-none flex-1">
                <div className="h-1.5 w-16 bg-primary rounded-full mb-10 opacity-50"></div>
                
                {item.snippet?.startsWith('#') ? (
                  <div className="space-y-6">
                     <p className="text-lg md:text-xl leading-relaxed text-foreground/90 whitespace-pre-wrap font-serif">
                        {item.snippet}
                     </p>
                  </div>
                ) : (
                  <div className="relative">
                    <pre className="bg-black/30 p-8 rounded-[32px] font-mono text-[13px] leading-[1.8] overflow-x-auto text-foreground/80 border border-white/5 shadow-inner">
                      <code>{item.snippet || "No content available for this preview."}</code>
                    </pre>
                  </div>
                )}
              </div>
              
              <div className="mt-12 pt-8 border-t border-card-border/50 flex items-center gap-3 text-muted-foreground/40 text-[10px] font-bold uppercase tracking-widest">
                 <FileText size={12} />
                 Preview generated by Cognify AI
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}