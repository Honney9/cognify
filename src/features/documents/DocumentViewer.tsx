import { ArrowLeft, Calendar, Share2, Download, Copy, FileText, Check } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

interface DocumentViewerProps {
  item: any;
  onBack: () => void;
}

export default function DocumentViewer({ item, onBack }: DocumentViewerProps) {
  const [copied, setCopied] = useState(false);
  
  // Identify the type of file
  const isImage = item.type?.startsWith('image/') || !!item.url;
  const isPDF = item.type === 'application/pdf' || item.name?.endsWith('.pdf');

  // Create a URL for the blob if it exists, otherwise use the provided URL
  const fileUrl = useMemo(() => {
    if (item.blob) {
      return URL.createObjectURL(item.blob);
    }
    return item.url;
  }, [item]);

  const handleCopy = async () => {
    try {
      const textToCopy = isImage ? fileUrl : item.snippet;
      await navigator.clipboard.writeText(textToCopy || "");
      setCopied(true);
      toast.success("Content copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy content");
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = item.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Downloading ${item.name}...`);
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
          {!isPDF && !isImage && (
            <button 
              onClick={handleCopy}
              className="p-2.5 hover:bg-card-hover rounded-xl transition-all text-muted-foreground hover:text-foreground border border-transparent hover:border-card-border"
            >
              {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
            </button>
          )}
          <button className="p-2.5 hover:bg-card-hover rounded-xl transition-all text-muted-foreground hover:text-foreground border border-transparent hover:border-card-border">
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
        <div className="max-w-5xl w-full h-full">
          {isImage ? (
            <div className="rounded-[40px] overflow-hidden border border-card-border shadow-2xl bg-black/40 p-2">
              <img 
                src={fileUrl} 
                alt={item.name} 
                className="w-full h-auto object-contain rounded-[34px]"
              />
            </div>
          ) : isPDF ? (
            /* PDF PREVIEW FIX */
            <div className="w-full h-full min-h-[80vh] rounded-[40px] overflow-hidden border border-card-border shadow-2xl bg-white">
              <iframe 
                src={fileUrl} 
                className="w-full h-full border-none"
                title="PDF Preview"
              />
            </div>
          ) : (
            /* CODE / TEXT PREVIEW */
            <div className="bg-card-bg border border-card-border rounded-[40px] p-8 md:p-14 shadow-sm min-h-[70vh] flex flex-col">
              <div className="prose prose-invert max-w-none flex-1">
                <div className="h-1.5 w-16 bg-primary rounded-full mb-10 opacity-50"></div>
                <pre className="bg-black/30 p-8 rounded-[32px] font-mono text-[13px] leading-[1.8] overflow-x-auto text-foreground/80 border border-white/5 shadow-inner">
                  <code>{item.snippet || "No text content available."}</code>
                </pre>
              </div>
            </div>
          )}
          
          <div className="mt-8 mb-12 flex items-center gap-3 text-muted-foreground/40 text-[10px] font-bold uppercase tracking-widest justify-center">
             <FileText size={12} />
             PREVIEW GENERATED BY COGNIFY AI
          </div>
        </div>
      </div>
    </div>
  );
}