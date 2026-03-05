import { Code, FileText, Camera, Image, Lock, Clock, Search, ArrowLeft, ChevronRight, ShieldCheck } from "lucide-react";
import { useState, useEffect } from "react";

const iconMap: Record<string, React.ElementType> = {
  Code,
  Documents: FileText,
  Screenshots: Camera,
  Photos: Image,
  "Secure Vault": Lock,
};

// ... mockHistory stays the same as before ...
const mockHistory: Record<string, any[]> = {
  Code: [
    { name: "auth-service.ts", date: "Mar 4", size: "12 KB", snippet: "export const auth = async (req, res) => { const token = req.headers..." },
  ],
  Documents: [
    { name: "Sampling and Quantization Study Guide", date: "Jan 1", snippet: "# Sampling and Quantization: The Foundations of Digitization..." },
  ],
  "Secure Vault": [
    { name: "credentials.enc", date: "Mar 5", size: "1 KB", snippet: "ENCRYPTED_DATA_BLOB_PRIVATE_KEY_0x92..." },
    { name: "tax-returns-2025.pdf", date: "Feb 12", size: "2.4 MB", snippet: "Confidential financial document for 2025 tax season..." },
  ],
};

interface ContentHistoryViewProps {
  folder: string;
  onNavigate: (folder: string) => void;
}

export default function ContentHistoryView({ folder, onNavigate }: ContentHistoryViewProps) {
  const [search, setSearch] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");

  // Re-lock the vault whenever the user leaves the folder for security
  useEffect(() => {
    if (folder !== "Secure Vault") {
      setIsUnlocked(false);
      setPhone("");
      setPin("");
    }
  }, [folder]);

  const isDashboard = folder === "All" || !folder;
  const isVault = folder === "Secure Vault";

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock validation logic
    if (phone.length >= 10 && pin.length === 4) {
      setIsUnlocked(true);
    } else {
      alert("Please enter a valid phone number and 4-digit PIN");
    }
  };

  const ListItem = ({ item, folderName }: { item: any, folderName: string }) => {
    const Icon = iconMap[folderName] || FileText;
    return (
      <div className="group flex items-start gap-4 p-4 rounded-[20px] bg-card-bg border border-transparent hover:border-card-border hover:bg-card-hover transition-all cursor-pointer">
        <div className="h-10 w-10 shrink-0 rounded-xl bg-icon-bg flex items-center justify-center">
          <Icon size={18} className="text-foreground/70" />
        </div>
        <div className="flex-1 min-w-0 pr-4">
          <h3 className="text-sm font-medium text-foreground truncate mb-0.5">{item.name}</h3>
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed opacity-70 italic">
            {item.snippet || "Encrypted Content"}
          </p>
          {item.size && (
            <span className="inline-block mt-2 px-2 py-0.5 bg-foreground/5 text-[9px] font-bold rounded text-muted-foreground uppercase">
                {item.size}
            </span>
          )}
        </div>
        <div className="text-[11px] text-muted-foreground pt-1 whitespace-nowrap">
          {item.date}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-main-bg text-foreground transition-colors duration-200">
      
      {/* 1. LOCK SCREEN FOR SECURE VAULT */}
      {isVault && !isUnlocked ? (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-card-bg border border-card-border p-10 rounded-[32px] shadow-2xl shadow-black/20 text-center animate-in fade-in zoom-in duration-300">
            <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Lock className="text-primary" size={32} />
            </div>
            <h2 className="text-2xl font-semibold mb-2">Secure Vault Access</h2>
            <p className="text-sm text-muted-foreground mb-8">
              Verify your identity to access sensitive files and encrypted credentials.
            </p>

            <form onSubmit={handleUnlock} className="space-y-4 text-left">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1 mb-1.5 block">Phone Number</label>
                <input 
                  type="tel" 
                  placeholder="+1 (555) 000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-main-bg border border-card-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1 mb-1.5 block">4-Digit PIN</label>
                <input 
                  type="password" 
                  maxLength={4}
                  placeholder="••••"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                  className="w-full bg-main-bg border border-card-border rounded-xl px-4 py-3 text-sm tracking-[1em] text-center focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  required
                />
              </div>
              <button 
                type="submit"
                className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-medium text-sm mt-4 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <ShieldCheck size={18} />
                Unlock Vault
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* 2. MAIN CONTENT VIEW (Dashboard or Detail) */
        <>
          <div className="max-w-5xl w-full mx-auto px-6 pt-12 pb-6">
            <div className="flex items-center gap-4">
              {!isDashboard && (
                <button onClick={() => onNavigate("All")} className="p-2 hover:bg-card-hover rounded-full transition-colors">
                  <ArrowLeft size={20} />
                </button>
              )}
              <h1 className="text-3xl font-medium">{isDashboard ? "My stuff" : folder}</h1>
            </div>

            <div className="relative mt-8 max-w-2xl">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Search ${folder === "All" ? "contents" : folder.toLowerCase()}...`}
                className="w-full bg-card-bg border border-card-border rounded-full pl-12 pr-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="max-w-5xl w-full mx-auto px-6 pb-20">
              {isDashboard ? (
                <div className="space-y-10 mt-4">
                  {Object.keys(mockHistory).map((cat) => (
                    <section key={cat}>
                      <div className="flex items-center justify-between mb-4 px-2">
                        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{cat}</h2>
                        <button onClick={() => onNavigate(cat)} className="p-1 hover:bg-card-hover rounded-full text-muted-foreground"><ChevronRight size={20} /></button>
                      </div>
                      <div className="space-y-2">
                        {mockHistory[cat].slice(0, 2).map((item, i) => <ListItem key={i} item={item} folderName={cat} />)}
                      </div>
                    </section>
                  ))}
                </div>
              ) : (
                <div className="space-y-2 mt-4">
                  {mockHistory[folder]?.map((item: any, i: number) => <ListItem key={i} item={item} folderName={folder} />)}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}