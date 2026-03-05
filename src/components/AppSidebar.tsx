import { useState } from "react";
import {
  Plus,
  Code,
  FileText,
  Camera,
  Image,
  Lock,
  LogOut,
  PanelLeftClose,
  PanelLeft,
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
  { name: "Screenshots", icon: Camera },
  { name: "Photos", icon: Image },
  { name: "Secure Vault", icon: Lock },
];

export default function AppSidebar({ isOpen, onToggle, isDark, onToggleDark, onNewSession, onFolderClick, activeFolder }: AppSidebarProps) {
  const [contentsOpen, setContentsOpen] = useState(true);

  return (
    <aside
      className={`
        fixed top-0 left-0 h-full z-40 flex flex-col
        bg-[hsl(var(--sidebar-bg))] border-r border-[hsl(var(--sidebar-border))]
        transition-all duration-300 ease-in-out
        ${isOpen ? "w-64" : "w-0 overflow-hidden border-r-0"}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-14 shrink-0">
        <div className="flex items-center gap-2.5">
          <button
            onClick={onToggle}
            className="p-1.5 rounded-md hover:bg-[hsl(var(--sidebar-hover))] text-[hsl(var(--sidebar-fg))] transition-colors"
          >
            <PanelLeftClose size={20} />
          </button>
          <span
            className="text-lg font-bold tracking-tight text-[hsl(var(--sidebar-fg))]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Cognify
          </span>
        </div>

        {/* Dark mode toggle */}
        <button
          onClick={onToggleDark}
          className="p-1.5 rounded-md hover:bg-[hsl(var(--sidebar-hover))] text-[hsl(var(--sidebar-fg))] transition-colors"
          aria-label="Toggle dark mode"
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      {/* New Session */}
      <div className="px-3 mt-2">
        <button
          onClick={onNewSession}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 hover:scale-[1.02] transition-all cursor-pointer"
        >
          <Plus size={18} />
          <span>New Session</span>
        </button>
      </div>

      {/* My Contents */}
      <nav className="flex-1 px-3 mt-5 overflow-y-auto">
        <button
          onClick={() => setContentsOpen(!contentsOpen)}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-semibold text-muted-foreground hover:bg-[hsl(var(--sidebar-hover))] transition-all cursor-pointer"
        >
          {contentsOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          <FolderOpen size={16} />
          <span>My Contents</span>
        </button>

        {contentsOpen && (
          <ul className="mt-1 ml-3 space-y-0.5">
            {contentFolders.map((folder) => (
              <li key={folder.name}>
                <button
                  onClick={() => onFolderClick(folder.name)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
                    activeFolder === folder.name
                      ? "bg-[hsl(var(--sidebar-active))] text-[hsl(var(--sidebar-active-fg))]"
                      : "text-[hsl(var(--sidebar-fg))] hover:bg-[hsl(var(--sidebar-hover))]"
                  }`}
                >
                  <folder.icon size={16} className={activeFolder === folder.name ? "" : "text-muted-foreground"} />
                  <span>{folder.name}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-4 shrink-0">
        <button className="w-full flex items-center gap-2 px-3 py-2.5 rounded-md text-sm text-destructive hover:bg-destructive/10 transition-all cursor-pointer hover:scale-[1.02] font-medium">
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
