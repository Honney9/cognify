import { useState, useRef, useEffect } from "react";
import { Plus, ArrowRight, Code, FileText, Camera, Image, Paperclip, X } from "lucide-react";

const attachOptions = [
  { name: "Code", icon: Code, accept: ".ts,.js,.py,.java,.cpp,.html,.css,.txt,.rs,.go", features: [
    "Code summarization and explanation",
    "Bug and vulnerability detection",
    "Improvement and optimization suggestions",
    "Cross-language conversion",
  ]},
  { name: "Document", icon: FileText, accept: ".pdf,.doc,.docx,.txt,.rtf", features: [
    "Structural and content validation",
    "Anomaly and fraud detection",
    "Consistency and compliance checks",
  ]},
  { name: "Screenshot", icon: Camera, accept: "image/*", features: [
    "Detect sensitive information (OTPs, bank details)",
    "Analyze UI or workflow context",
    "Flag privacy or security risks",
  ]},
  { name: "Photo", icon: Image, accept: "image/*", features: [
    "AI-generated (deepfake) image detection",
    "Automatic content tagging",
    "Scene understanding",
  ]},
];

interface PromptUIProps {
  onSend?: (content: string, files: File[]) => void;
  showWelcome?: boolean;
  onPreviewFile?: (file: File) => void; 
}

export default function PromptUI({ onSend, showWelcome = true, onPreviewFile }: PromptUIProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSend = () => {
    if (!inputValue.trim() && attachedFiles.length === 0) return;
    onSend?.(inputValue, attachedFiles);
    // Clear everything for a fresh start
    setInputValue("");
    setAttachedFiles([]);
    setSelectedType(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newFiles = Array.from(files);
      setAttachedFiles(prev => [...prev, ...newFiles]);
    }
    // Important: reset value so same file can be selected again if removed
    e.target.value = "";
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const currentAccept = selectedType 
    ? attachOptions.find(o => o.name === selectedType)?.accept 
    : undefined;

  return (
    <div className="w-full max-w-2xl mx-auto px-4">
      {showWelcome && (
        <div className="mb-8 animate-in fade-in duration-500">
          {!selectedType ? (
            <div className="text-center">
              <h1 className="text-3xl font-bold text-foreground">Welcome to Cognify</h1>
              <p className="mt-2 text-muted-foreground text-sm">Your intelligent content management companion</p>
            </div>
          ) : (
            <div>
              {(() => {
                const opt = attachOptions.find(o => o.name === selectedType)!;
                return (
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <opt.icon size={24} className="text-primary" />
                      <h2 className="text-2xl font-bold text-foreground">{opt.name}</h2>
                    </div>
                    <ul className="space-y-2 max-w-md mx-auto">
                      {opt.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground text-left">
                          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      <div className="relative flex items-center bg-[hsl(var(--prompt-bg))] border border-[hsl(var(--prompt-border))] rounded-2xl shadow-lg px-2 py-1.5">
        {/* PLUS DROPDOWN */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className={`p-2.5 rounded-xl hover:bg-accent transition-colors ${selectedType ? "text-primary" : "text-muted-foreground"}`}
          >
            {selectedType ? (() => { const Icon = attachOptions.find(o => o.name === selectedType)!.icon; return <Icon size={20} />; })() : <Plus size={20} />}
          </button>

          {dropdownOpen && (
            <div className="absolute bottom-full left-0 mb-2 w-48 bg-popover border border-border rounded-xl shadow-xl py-1.5 z-50">
              {attachOptions.map((opt) => (
                <button
                  key={opt.name}
                  type="button"
                  onClick={() => { 
                    setSelectedType(opt.name); 
                    setDropdownOpen(false);
                    // Automatically trigger file browser after selecting type
                    setTimeout(() => fileInputRef.current?.click(), 100);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-accent transition-colors text-left"
                >
                  <opt.icon size={16} className="text-muted-foreground" />
                  <span>{opt.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* PAPERCLIP BUTTON */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={`p-2.5 rounded-xl hover:bg-accent transition-colors ${attachedFiles.length > 0 ? "text-primary" : "text-muted-foreground"}`}
        >
          <Paperclip size={20} />
        </button>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={currentAccept}
          className="hidden"
          onChange={handleFileChange}
        />

        {/* INPUT AND ATTACHED CHIPS */}
        <div className="flex-1 flex items-center gap-2 min-w-0 px-2 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {attachedFiles.map((file, idx) => (
            <div 
              key={`${file.name}-${idx}`} 
              className="flex items-center gap-1.5 bg-accent text-accent-foreground px-2 py-1 rounded-lg text-[11px] font-medium shrink-0 animate-in zoom-in duration-200"
            >
              <span 
                className="truncate max-w-[100px] cursor-pointer hover:text-primary"
                onClick={() => onPreviewFile?.(file)}
              >
                {file.name}
              </span>
              <button type="button" onClick={() => removeFile(idx)} className="hover:text-destructive">
                <X size={14} />
              </button>
            </div>
          ))}
          
          <input
            type="text"
            value={inputValue}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={attachedFiles.length > 0 ? "" : "Type your prompt..."}
            className="flex-1 bg-transparent outline-none text-sm text-foreground py-2 min-w-[120px]"
          />
        </div>

        {/* SEND BUTTON */}
        <button
          type="button"
          onClick={handleSend}
          className="p-2.5 rounded-xl bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-all active:scale-95"
          disabled={!inputValue.trim() && attachedFiles.length === 0}
        >
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
}