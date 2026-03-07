import { Code, FileText, Camera, Image, Lock, Search, ArrowLeft, ChevronRight, ShieldCheck, Eye, EyeOff, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import DocumentViewer from "../features/documents/DocumentViewer";
import { getFilesByCategory } from "@/services/db"; // Import DB helper

const iconMap: Record<string, React.ElementType> = {
  Code,
  Documents: FileText,
  Screenshots: Camera,
  Photos: Image,
  "Secure Vault": Lock,
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
  const [showPin, setShowPin] = useState(false);
  const [countryCode, setCountryCode] = useState("+1");
  const [timer, setTimer] = useState(0);
  const [otpSent, setOtpSent] = useState(false);
  const [showToastBox, setShowToastBox] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  // --- NEW: DYNAMIC DATA STATE ---
  const [dbData, setDbData] = useState<Record<string, any[]>>({
    Code: [], Documents: [], Screenshots: [], Photos: [], "Secure Vault": []
  });

  useEffect(() => {
    const loadAllData = async () => {
      const categories = ["Code", "Documents", "Screenshots", "Photos", "Secure Vault"];
      const newData: any = {};
      
      for (const cat of categories) {
        const files = await getFilesByCategory(cat);
        newData[cat] = files.reverse(); // Newest first
      }
      setDbData(newData);
    };

    loadAllData();
    setIsUnlocked(false);
    setSelectedItem(null); 
  }, [folder]);

  // Handle URL creation for blobs when viewing images
  const getItemWithUrl = (item: any) => {
    if (item.blob && item.type.startsWith('image/') && !item.url) {
      return { ...item, url: URL.createObjectURL(item.blob) };
    }
    return item;
  };

  const ListItem = ({ item, folderName }: { item: any, folderName: string }) => {
    const Icon = iconMap[folderName] || FileText;
    return (
      <div 
        onClick={() => setSelectedItem(getItemWithUrl(item))} 
        className="group flex items-start gap-4 p-4 rounded-[20px] bg-card-bg border border-transparent hover:border-card-border hover:bg-card-hover transition-all cursor-pointer"
      >
        <div className="h-10 w-10 shrink-0 rounded-xl bg-icon-bg flex items-center justify-center">
          <Icon size={18} className="text-foreground/70" />
        </div>
        <div className="flex-1 min-w-0 pr-4">
          <h3 className="text-sm font-medium text-foreground truncate mb-0.5">{item.name}</h3>
          <p className="text-xs text-muted-foreground line-clamp-2 opacity-70 italic">{item.snippet}</p>
          {item.size && <span className="inline-block mt-2 px-2 py-0.5 bg-foreground/5 text-[9px] font-bold rounded text-muted-foreground uppercase">{item.size}</span>}
        </div>
        <div className="text-[11px] text-muted-foreground pt-1 whitespace-nowrap">{item.date}</div>
      </div>
    );
  };

  const MediaPreviewItem = ({ item }: { item: any }) => {
    const displayItem = getItemWithUrl(item);
    return (
      <div 
        onClick={() => setSelectedItem(displayItem)} 
        className="relative group aspect-square rounded-[24px] overflow-hidden bg-card-bg border border-card-border hover:border-primary/50 transition-all cursor-pointer"
      >
        <img src={displayItem.url} alt={item.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
          <p className="text-[10px] text-white truncate font-medium">{item.name}</p>
        </div>
      </div>
    );
  };

  const getFilteredItems = (items: any[]) => {
    if (!search.trim()) return items;
    const term = search.toLowerCase();
    return items.filter(item => item.name.toLowerCase().includes(term));
  };

  if (selectedItem) {
    return <DocumentViewer item={selectedItem} onBack={() => setSelectedItem(null)} />;
  }

  const isDashboard = folder === "All" || !folder;
  const isVault = folder === "Secure Vault";

  return (
    <div className="flex flex-col h-full bg-main-bg text-foreground transition-colors duration-200">
      {/* ... Existing Search and Header Code ... */}
      <div className="max-w-5xl w-full mx-auto px-6 pt-12 pb-6">
          <div className="flex items-center gap-4">
            {!isDashboard && <button onClick={() => onNavigate("All")} className="p-2 hover:bg-card-hover rounded-full transition-colors"><ArrowLeft size={20} /></button>}
            <h1 className="text-3xl font-medium">{isDashboard ? "My stuff" : folder}</h1>
          </div>
          <div className="relative mt-8 max-w-2xl">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`Search...`} className="w-full bg-card-bg border border-card-border rounded-full pl-12 pr-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none" />
          </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-20">
        <div className="max-w-5xl w-full mx-auto">
          {isDashboard ? (
            <div className="space-y-10 mt-4">
              {Object.keys(dbData).map((cat) => {
                const filtered = getFilteredItems(dbData[cat]);
                if (filtered.length === 0) return null;
                const isMedia = cat === "Photos" || cat === "Screenshots";
                return (
                  <section key={cat}>
                    <div className="flex items-center justify-between mb-4 px-2">
                      <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{cat}</h2>
                      <button onClick={() => onNavigate(cat)} className="h-8 w-8 flex items-center justify-center bg-card-bg border border-card-border hover:bg-card-hover rounded-full transition-all"><ChevronRight size={18} /></button>
                    </div>
                    {isMedia ? (
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">{filtered.slice(0, 5).map((item, i) => <MediaPreviewItem key={i} item={item} />)}</div>
                    ) : (
                      <div className="space-y-2">{filtered.slice(0, 2).map((item, i) => <ListItem key={i} item={item} folderName={cat} />)}</div>
                    )}
                  </section>
                );
              })}
            </div>
          ) : (
            <div className="mt-4">
              {(folder === "Photos" || folder === "Screenshots") ? (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">{getFilteredItems(dbData[folder] || []).map((item, i) => <MediaPreviewItem key={i} item={item} />)}</div>
              ) : (
                <div className="space-y-2">{getFilteredItems(dbData[folder] || []).map((item, i) => <ListItem key={i} item={item} folderName={folder} />)}</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}