import { useState, useRef, useEffect } from "react";
import { Plus, ArrowRight, Code, FileText, Image, Paperclip, X } from "lucide-react";

const MAX_FILES = 5;
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

const attachOptions = [
  { 
    name: "Code", 
    type: "code", 
    icon: Code, 
    accept: ".ts,.js,.py,.java,.cpp,.html,.css,.txt,.rs,.go", 
    features: [
      "Code summarization and explanation",
      "Bug and vulnerability detection",
      "Improvement and optimization suggestions",
      "Cross-language conversion",
    ]
  },
  { 
    name: "Document", 
    type: "document", 
    icon: FileText, 
    accept: ".pdf,.doc,.docx,.txt,.rtf", 
    features: [
      "Structural and content validation",
      "Anomaly and fraud detection",
      "Consistency and compliance checks",
    ]
  },
  { 
    name: "Gallery", 
    type: "gallery", 
    icon: Image, 
    accept: "image/*,.png,.jpg,.jpeg,.webp,.heic", 
    features: [
      "Detect sensitive info (OTPs, bank details)",
      "Analyze UI/workflow or scene understanding",
      "AI-generated (deepfake) detection",
      "Flag privacy or security risks",
      "Automatic content tagging",
    ]
  },
];

interface PromptPayload {
  type: string | null
  prompt: string
  files: File[]
}

interface PromptUIProps {
  onSend?: (payload: PromptPayload) => void;
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
  const textareaRef = useRef<HTMLTextAreaElement>(null); // Ref for auto-resizing

  // --- Auto-resize logic for textarea ---
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "inherit";
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 200)}px`; // Max height of 200px
    }
  }, [inputValue]);

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

    onSend?.({
      type: selectedType ?? "chat",
      prompt: inputValue,
      files: attachedFiles
    });

    setInputValue("");
    setAttachedFiles([]);
    setSelectedType(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles = Array.from(files)
      .filter(file => file.size <= MAX_SIZE);

    setAttachedFiles(prev => {
      const existing = new Set(prev.map(f => f.name));
      const filtered = newFiles.filter(f => !existing.has(f.name));
      return [...prev, ...filtered].slice(0, MAX_FILES);
    });

    e.target.value = "";
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const currentAccept =
    selectedType
      ? attachOptions.find(o => o.type === selectedType)?.accept
      : undefined;

  return (
    <div className="w-full max-w-2xl mx-auto px-4">
      {showWelcome && (
        <div className="mb-8 animate-in fade-in duration-500">
          {!selectedType ? (
            <div className="text-center">
              <h1 className="text-3xl font-bold text-foreground">
                Welcome to Cognify
              </h1>
              <p className="mt-2 text-muted-foreground text-sm">
                Your intelligent content management companion
              </p>
            </div>
          ) : (
            <div>
              {(() => {
                const opt = attachOptions.find(o => o.type === selectedType)!;
                return (
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <opt.icon size={24} className="text-primary" />
                      <h2 className="text-2xl font-bold text-foreground">
                        {opt.name}
                      </h2>
                    </div>
                    <ul className="space-y-2 max-w-md mx-auto">
                      {opt.features.map((f, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2.5 text-sm text-muted-foreground text-left"
                        >
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

      {/* Main Input Container - Adjusted items-end for multiline layout */}
      <div className="relative flex items-end bg-[hsl(var(--prompt-bg))] border border-[hsl(var(--prompt-border))] rounded-2xl shadow-lg px-2 py-2">
        {/* PLUS MENU */}
        <div className="relative mb-0.5" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className={`p-2.5 rounded-xl hover:bg-accent transition-colors ${
              selectedType ? "text-primary" : "text-muted-foreground"
            }`}
          >
            {selectedType
              ? (() => {
                  const Icon = attachOptions.find(o => o.type === selectedType)!.icon;
                  return <Icon size={20} />;
                })()
              : <Plus size={20} />}
          </button>

          {dropdownOpen && (
            <div className="absolute bottom-full left-0 mb-2 w-48 bg-popover border border-border rounded-xl shadow-xl py-1.5 z-50">
              {attachOptions.map(opt => (
                <button
                  key={opt.name}
                  type="button"
                  onClick={() => {
                    setSelectedType(opt.type);
                    setDropdownOpen(false);
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

        {/* ATTACH BUTTON */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={`p-2.5 rounded-xl hover:bg-accent transition-colors mb-0.5 ${
            attachedFiles.length > 0 ? "text-primary" : "text-muted-foreground"
          }`}
        >
          <Paperclip size={20} />
        </button>

        <input
          key={selectedType || "all"}
          ref={fileInputRef}
          type="file"
          multiple
          accept={currentAccept}
          className="hidden"
          onChange={handleFileChange}
        />

        {/* UPDATED MULTI-LINE INPUT AREA */}
        <div className="flex-1 flex flex-col gap-2 min-w-0 px-2 py-1 max-h-[300px]">
          {/* File Chips */}
          {attachedFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              {attachedFiles.map((file, idx) => (
                <div
                  key={`${file.name}-${idx}`}
                  className="flex items-center gap-1.5 bg-accent text-accent-foreground px-2 py-1 rounded-lg text-[11px] font-medium shrink-0"
                >
                  <span
                    className="truncate max-w-[100px] cursor-pointer hover:text-primary"
                    onClick={() => onPreviewFile?.(file)}
                  >
                    {file.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
                    className="hover:text-destructive"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Expanded Textarea */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={
              attachedFiles.length > 0
                ? "Add instructions for the attached file..."
                : "Type your prompt..."
            }
            className="w-full bg-transparent outline-none text-sm text-foreground py-1.5 min-w-[120px] resize-none overflow-y-auto custom-scrollbar"
            style={{ minHeight: '36px' }}
          />
        </div>

        {/* SEND BUTTON */}
        <button
          type="button"
          onClick={handleSend}
          className="p-2.5 rounded-xl bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-all active:scale-95 mb-0.5"
          disabled={!inputValue.trim() && attachedFiles.length === 0}
        >
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
}