import { useState, useRef, useEffect } from "react";
import { Plus, ArrowRight, Code, FileText, Camera, Image, Paperclip } from "lucide-react";


const attachOptions = [
  { name: "Code", icon: Code, features: [
    "Code summarization and explanation",
    "Bug and vulnerability detection",
    "Improvement and optimization suggestions",
    "Cross-language conversion (e.g., Java → Python)",
  ]},
  { name: "Document", icon: FileText, features: [
    "Structural and content validation",
    "Anomaly and fraud detection",
    "Consistency and compliance checks",
  ]},
  { name: "Screenshot", icon: Camera, features: [
    "Detect sensitive information such as OTPs, bank details, IDs, or credentials",
    "Analyze UI or workflow context",
    "Flag potential privacy or security risks",
  ]},
  { name: "Photo", icon: Image, features: [
    "AI-generated (deepfake) image detection",
    "Automatic content tagging",
    "Scene understanding, e.g. \"Birthday Celebration\", \"Office Meeting\", \"Study Session\", \"Road Trip\"",
  ]},
];

export default function PromptUI() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [selectedType, setSelectedType] = useState<string | null>(null);
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

  return (
    <div className="w-full max-w-2xl mx-auto px-4">
      {!selectedType ? (
        <div className="text-center mb-8">
          <h1
            className="text-3xl font-bold text-foreground"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Welcome to Cognify
          </h1>

          <p className="mt-2 text-muted-foreground text-sm">
            Your intelligent content management companion
          </p>
        </div>
      ) : (
        <div className="mb-8">
          {(() => {
            const opt = attachOptions.find(o => o.name === selectedType)!;
            const Icon = opt.icon;
            return (
              <>
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Icon size={24} className="text-primary" />
                  <h2 className="text-2xl font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
                    {opt.name}
                  </h2>
                </div>
                <ul className="space-y-2 max-w-md mx-auto">
                  {opt.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </>
            );
          })()}
        </div>
      )}

      <div className="relative flex items-center bg-[hsl(var(--prompt-bg))] border border-[hsl(var(--prompt-border))] rounded-2xl shadow-lg shadow-[hsl(var(--prompt-shadow))/0.15] px-2 py-1.5">
        {/* Plus button + dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className={`p-2.5 rounded-xl hover:bg-accent transition-colors ${selectedType ? "text-accent-foreground" : "text-muted-foreground hover:text-accent-foreground"}`}
            aria-label="Add attachment"
          >
            {selectedType ? (() => { const Icon = attachOptions.find(o => o.name === selectedType)!.icon; return <Icon size={20} />; })() : <Plus size={20} />}
          </button>

          {dropdownOpen && (
            <div className="absolute bottom-full left-0 mb-2 w-48 bg-popover border border-border rounded-xl shadow-xl py-1.5 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
              {attachOptions.map((opt) => (
                <button
                  key={opt.name}
                  onClick={() => { setSelectedType(opt.name); setDropdownOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-popover-foreground hover:bg-accent transition-colors"
                >
                  <opt.icon size={16} className="text-muted-foreground" />
                  <span>{opt.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Attachment */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-2.5 rounded-xl hover:bg-accent text-muted-foreground hover:text-accent-foreground transition-colors"
          aria-label="Attach file"
        >
          <Paperclip size={20} />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            // Handle files - for now just log
            const files = e.target.files;
            if (files && files.length > 0) {
              console.log("Selected files:", Array.from(files).map(f => f.name));
            }
            e.target.value = "";
          }}
        />

        {/* Input */}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Type your prompt..."
          className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground px-2 py-2"
        />

        {/* Send */}
        <button
          className="p-2.5 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
          aria-label="Send"
        >
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
}
