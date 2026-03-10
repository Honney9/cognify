import { 
  Code, FileText, Image, Lock, Search, ArrowLeft, 
  ChevronRight, Trash2 
} from "lucide-react";
import { useState, useEffect } from "react";
import DocumentViewer from "../features/documents/DocumentViewer";
import { getFilesByCategory, deleteFileById } from "@/services/db";
import SecureVaultAccess from "@/components/SecureVaultAccess";
import { toast } from "sonner";

const iconMap: Record<string, React.ElementType> = {
  Code,
  Documents: FileText,
  Gallery: Image,
  "Secure Vault": Lock,
};

interface ContentHistoryViewProps {
  folder: string;
  onNavigate: (folder: string) => void;
  onPreviewFile: (item: any) => void;
}

export default function ContentHistoryView({ folder, onNavigate, onPreviewFile }: ContentHistoryViewProps) {
  const [search, setSearch] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  
  const [dbData, setDbData] = useState<Record<string, any[]>>({
    Code: [], Documents: [], Gallery: [], "Secure Vault": []
  });

  const loadAllData = async () => {
    try {
      // Fetch separate categories from DB
      const [code, docs, screenshots, photos, vault] = await Promise.all([
        getFilesByCategory("Code"),
        getFilesByCategory("Documents"),
        getFilesByCategory("Screenshots"),
        getFilesByCategory("Photos"),
        getFilesByCategory("Secure Vault")
      ]);

      // Merge Screenshots & Photos into Gallery
      const galleryItems = [...screenshots, ...photos].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      setDbData({
        Code: code.reverse(),
        Documents: docs.reverse(),
        Gallery: galleryItems,
        "Secure Vault": vault.reverse()
      });
    } catch (error) {
      console.error("Failed to load DB data:", error);
    }
  };

  useEffect(() => {
    loadAllData();
    if (folder !== "Secure Vault") setIsUnlocked(false);
    setSelectedItem(null); 
  }, [folder]);

  const handleDelete = async (e: React.MouseEvent, id: any, name: string) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        await deleteFileById(id);
        toast.success("File deleted");
        loadAllData(); // Refresh UI
      } catch (err) {
        toast.error("Failed to delete file");
      }
    }
  };

  const getItemWithUrl = (item: any) => {
    if (!item) return null;
    if (item.blob && (item.type?.startsWith?.('image/') || item.category === "Gallery") && !item.url) {
      return { ...item, url: URL.createObjectURL(item.blob) };
    }
    return item;
  };

  const ListItem = ({ item, folderName }: { item: any, folderName: string }) => {
    const Icon = iconMap[folderName] || FileText;
    return (
      <div 
        onClick={() => onPreviewFile(item)} 
        className="group flex items-start gap-4 p-4 rounded-[20px] bg-card-bg border border-transparent hover:border-card-border hover:bg-card-hover transition-all cursor-pointer relative"
      >
        <div className="h-10 w-10 shrink-0 rounded-xl bg-icon-bg flex items-center justify-center">
          <Icon size={18} className="text-foreground/70" />
        </div>
        <div className="flex-1 min-w-0 pr-4">
          <h3 className="text-sm font-medium text-foreground truncate mb-0.5">{item.name}</h3>
          <p className="text-xs text-muted-foreground line-clamp-2 opacity-70 italic">{item.snippet}</p>
          {item.size && <span className="inline-block mt-2 px-2 py-0.5 bg-foreground/5 text-[9px] font-bold rounded text-muted-foreground uppercase">{item.size}</span>}
        </div>
        
        <div className="flex flex-col items-end gap-2">
            <div className="text-[11px] text-muted-foreground whitespace-nowrap">{item.date}</div>
            <button 
                onClick={(e) => handleDelete(e, item.id, item.name)}
                className="p-2 rounded-lg text-muted-foreground/20 hover:text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
            >
                <Trash2 size={16} />
            </button>
        </div>
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
        {/* <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <button 
                onClick={(e) => handleDelete(e, item.id, item.name)}
                className="p-3 rounded-full bg-red-500 text-white shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-all"
            >
                <Trash2 size={20} />
            </button>
        </div> */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <p className="text-[10px] text-white truncate font-medium">{item.name}</p>
        </div>
      </div>
    );
  };

  const getFilteredItems = (items: any[]) => {
    if (!items) return [];
    if (!search.trim()) return items;
    const term = search.toLowerCase();
    return items.filter(item => item.name.toLowerCase().includes(term));
  };

  
  if (selectedItem) {
    return (
      <DocumentViewer 
        item={selectedItem} 
        onBack={() => setSelectedItem(null)} 
        onDelete={async (item) => {
          await deleteFileById(item.id)
          await loadAllData()
          setSelectedItem(null)
        }}
      />
    );
  }

  const isDashboard = folder === "All" || !folder;
  const isVault = folder === "Secure Vault";

  if (isVault && !isUnlocked) {
    return <SecureVaultAccess onUnlock={() => setIsUnlocked(true)} />;
  }

  return (
    <div className="flex flex-col h-full bg-main-bg text-foreground transition-colors duration-200">
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
                const isMedia = cat === "Gallery";
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
              {folder === "Gallery" ? (
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