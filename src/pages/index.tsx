import { useState, useEffect } from "react";
import { PanelLeft, FileIcon, X, Download, FileText } from "lucide-react";
import AppSidebar from "@/components/AppSidebar";
import PromptUI from "@/components/PromptUI";
import ChatView, { Message } from "@/components/ChatView";
import ContentHistoryView from "@/components/ContentHistoryView";
import ModelManager from "@/components/ModelManager";
import { saveFileOffline } from "@/services/db"; 
import { useCognify } from "@/hooks/useCognify";

type View = "prompt" | "chat" | { folder: string };

// This matches the data structure returned by the Worker
type AIResponse = {
  success: boolean;
  result?: string;
  error?: string;
  modelOutput?: any;
};

const Index = () => {
  // UI State
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isDark, setIsDark] = useState(false);
  const [view, setView] = useState<View>("prompt");
  const [sessionKey, setSessionKey] = useState(0);

  // Chat State
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  
  // File Preview State
  const [viewingFile, setViewingFile] = useState<File | Blob | null>(null);
  const [viewingFileName, setViewingFileName] = useState<string>("");

  // AI Pipeline Hook
  const { analyze } = useCognify();

  // Handle Theme
  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  /**
   * Main AI Pipeline Trigger
   */
  const handleSendMessage = async ({
    type,
    prompt,
    files
  }: {
    type: string | null;
    prompt: string;
    files: File[];
  }) => {
    // 1️⃣ Store files offline in IndexedDB
    for (const file of files) {
      let category = "Documents";
      if (file.type.startsWith("image/")) {
        category = file.type === "image/png" ? "Screenshots" : "Photos";
      } else if (file.name.match(/\.(ts|js|py|java|cpp|rs|go|html|css|json)$/)) {
        category = "Code";
      }
      await saveFileOffline(file, category);
    }

    // 2️⃣ Update UI with the User's Message
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: prompt || (files.length > 0 ? `Sent ${files.length} file(s)` : ""),
      attachments: files
    };

    setMessages(prev => [...prev, userMsg]);
    setView("chat"); // Switch from prompt screen to chat screen

    // 3️⃣ Call AI Worker Pipeline
    setIsTyping(true);

    try {
      // We pass the payload to the worker via useCognify
      const response = await analyze({
        type: type || "chat", // Default to chat if no specific type
        prompt,
        files
      }) as AIResponse;

      // 4️⃣ Update UI with the AI's Response
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.success 
          ? (response.result ?? "Analysis complete.") 
          : (response.error ?? "The AI encountered an error during processing.")
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      console.error("AI Pipeline Error:", err);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Critical error: The AI worker failed to respond. Please ensure models are loaded."
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const activeFolder = typeof view === "object" ? view.folder : null;

  const openPreview = (file: File | Blob, name: string) => {
    setViewingFile(file);
    setViewingFileName(name);
  };

  return (
    <div className="h-screen w-full bg-background flex overflow-hidden text-foreground">
      
      {/* Background Model Loader Status */}
      <ModelManager />
      
      {/* GLOBAL FILE VIEWER OVERLAY */}
      {viewingFile && (
        <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-md flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300">
          <div className="bg-card border border-border w-full max-w-5xl h-full rounded-[32px] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
              <div className="flex items-center gap-3">
                <FileIcon size={20} className="text-primary" />
                <span className="font-semibold truncate max-w-xs md:max-w-md">{viewingFileName}</span>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => {
                    const url = URL.createObjectURL(viewingFile);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = viewingFileName;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="p-2 hover:bg-accent rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                  title="Download"
                >
                  <Download size={18} />
                </button>
                <button onClick={() => setViewingFile(null)} className="p-2 hover:bg-accent rounded-lg transition-colors">
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-6 flex justify-center bg-background/50">
              {viewingFile.type.startsWith('image/') ? (
                <img src={URL.createObjectURL(viewingFile)} alt="preview" className="max-w-full h-auto object-contain rounded-lg shadow-sm" />
              ) : viewingFile.type === 'application/pdf' ? (
                <iframe src={URL.createObjectURL(viewingFile)} className="w-full h-full rounded-lg border-none bg-white shadow-sm" title="PDF Preview" />
              ) : (
                <div className="w-full h-full bg-muted/20 rounded-xl p-8 border border-border flex flex-col items-center justify-center text-center">
                  <FileText size={64} className="mb-4 opacity-20" />
                  <p className="text-sm font-medium">Previewing: {viewingFileName}</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-xs">AI analysis for this file type is displayed in the chat window.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SIDEBAR */}
      <AppSidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(false)}
        isDark={isDark}
        onToggleDark={() => setIsDark(!isDark)}
        onNewSession={() => {
            setSessionKey(prev => prev + 1);
            setMessages([]);
            setView("prompt");
        }}
        onFolderClick={(f) => setView({ folder: f })}
        activeFolder={activeFolder}
      />

      {/* MAIN CONTENT AREA */}
      <main
          className={`flex-1 flex flex-col min-w-0 transition-all duration-300 relative ${
            sidebarOpen ? "ml-64" : "ml-0"
          }`}
        >
        {!sidebarOpen && (
          <div className="absolute top-5 left-6 z-50">
            <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-xl bg-card border border-border text-foreground hover:bg-accent transition-all">
              <PanelLeft size={20} />
            </button>
          </div>
        )}

        <div className="flex-1 flex flex-col h-full overflow-hidden">
          
          {/* 1. INITIAL PROMPT SCREEN */}
          {view === "prompt" && (
            <div className="flex-1 flex items-center justify-center p-4">
               <PromptUI 
                  key={sessionKey} 
                  onSend={handleSendMessage} 
                  showWelcome={true} 
                  onPreviewFile={(file) => openPreview(file, file.name)} 
               />
            </div>
          )}

          {/* 2. ACTIVE CHAT VIEW */}
          {view === "chat" && (
            <div className="flex-1 flex flex-col h-full">
              <ChatView 
                messages={messages} 
                isTyping={isTyping} 
                onAttachmentClick={(file) => openPreview(file, file.name)} 
              />
              <div className="pb-8 pt-2">
                <PromptUI 
                  onSend={handleSendMessage} 
                  showWelcome={false} 
                  onPreviewFile={(file) => openPreview(file, file.name)} 
                />
              </div>
            </div>
          )}

          {/* 3. FOLDER / HISTORY VIEW */}
          {typeof view === "object" && (
            <div className="flex-1 h-full">
              <ContentHistoryView 
                folder={view.folder} 
                onNavigate={(f) => setView({ folder: f })} 
                onPreviewFile={(item) => openPreview(item.blob, item.name)}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;