import { useState } from "react";
import {
  Plus,
  Code,
  FileText,
  Image,
  Lock,
  PanelLeftClose,
  Moon,
  Sun,
  ChevronDown,
  ChevronRight,
  FolderOpen,
} from "lucide-react";

interface AppSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  isDark: boolean;
  onToggleDark: () => void;
  onNewSession: () => void;
  onFolderClick: (folder: string) => void;
  activeFolder: string | null;
}

const contentFolders = [
  { name: "Code", icon: Code },
  { name: "Documents", icon: FileText },
  { name: "Gallery", icon: Image }, 
  { name: "Secure Vault", icon: Lock },
];

export default function AppSidebar({ 
  isOpen, 
  onToggle, 
  isDark, 
  onToggleDark, 
  onNewSession, 
  onFolderClick, 
  activeFolder 
}: AppSidebarProps) {
  const [contentsOpen, setContentsOpen] = useState(true);

  const isAllActive = activeFolder === "All" || activeFolder === null;

  return (
    <aside
      className={`
        fixed top-0 left-0 h-full z-40 flex flex-col
        bg-[#0f0f0f] border-r border-white/5
        transition-all duration-300 ease-in-out
        ${isOpen ? "w-64" : "w-0 overflow-hidden border-r-0"}
      `}
    >
      <div className="flex items-center justify-between px-4 h-16 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggle}
            className="p-2 rounded-xl hover:bg-white/5 text-muted-foreground transition-colors"
          >
            <PanelLeftClose size={20} />
          </button>
          <span className="text-lg font-semibold tracking-tight text-foreground">
            Cognify
          </span>
        </div>

        <button
          onClick={onToggleDark}
          className="p-2 rounded-xl hover:bg-white/5 text-muted-foreground transition-colors"
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      <div className="px-4 mt-2 mb-6">
        <button
          onClick={onNewSession}
          className="w-full flex items-center gap-2 px-4 py-3 rounded-2xl bg-[#7c3aed] text-white font-medium text-sm hover:brightness-110 shadow-lg shadow-purple-500/10 transition-all active:scale-95"
        >
          <Plus size={18} />
          <span>New Session</span>
        </button>
      </div>

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        <div className="relative group">
          <button
            onClick={() => onFolderClick("All")}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all font-medium ${
              isAllActive 
              ? "bg-white/10 text-foreground" 
              : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
            }`}
          >
            <FolderOpen size={18} />
            <span className="flex-1 text-left">My Contents</span>
            
            <div 
              onClick={(e) => {
                e.stopPropagation();
                setContentsOpen(!contentsOpen);
              }}
              className="p-1 hover:bg-white/10 rounded-md transition-colors"
            >
              {contentsOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </div>
          </button>
        </div>

        {contentsOpen && (
          <div className="mt-1 ml-4 space-y-1 border-l border-white/5 pl-2">
            {contentFolders.map((folder) => {
              const isActive = activeFolder === folder.name;
              return (
                <button
                  key={folder.name}
                  onClick={() => onFolderClick(folder.name)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all ${
                    isActive
                      ? "bg-white/5 text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  }`}
                >
                  <folder.icon size={16} className={isActive ? "text-purple-400" : "opacity-70"} />
                  <span>{folder.name}</span>
                </button>
              );
            })}
          </div>
        )}
      </nav>
    </aside>
  );
}