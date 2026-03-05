import { useState, useEffect } from "react";
import { PanelLeft } from "lucide-react";
import AppSidebar from "@/components/AppSidebar";
import PromptUI from "@/components/PromptUI";
import ChatView from "@/components/ChatView";
import ContentHistoryView from "@/components/ContentHistoryView";

type View = "prompt" | "chat" | { folder: string };

const Index = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isDark, setIsDark] = useState(false);
  const [view, setView] = useState<View>("prompt");
  const [sessionKey, setSessionKey] = useState(0);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  const activeFolder = typeof view === "object" ? view.folder : null;

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(false)}
        isDark={isDark}
        onToggleDark={() => setIsDark(!isDark)}
        onNewSession={() => {
            setSessionKey(prev => prev + 1);
            setView("prompt");
        }}
        onFolderClick={(folder) => setView({ folder })}
        activeFolder={activeFolder}
      />

      <div
        className={`min-h-screen flex flex-col transition-all duration-300 ${
          sidebarOpen ? "ml-64" : "ml-0"
        }`}
      >
        {!sidebarOpen && (
          <div className="h-14 flex items-center px-4 shrink-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 rounded-md hover:bg-muted text-foreground transition-colors"
            >
              <PanelLeft size={20} />
            </button>
          </div>
        )}

        <div className="flex-1 flex items-center justify-center">
          {view === "prompt" && <PromptUI key={sessionKey} />}
          {view === "chat" && <ChatView />}
          {typeof view === "object" && <ContentHistoryView folder={view.folder} />}
        </div>
      </div>
    </div>
  );
};

export default Index;
