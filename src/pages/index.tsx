import { useState, useEffect } from "react";
import { PanelLeft, FileIcon, X, Download, FileText } from "lucide-react";
import AppSidebar from "@/components/AppSidebar";
import PromptUI from "@/components/PromptUI";
import ChatView, { Message } from "@/components/ChatView";
import ContentHistoryView from "@/components/ContentHistoryView";
import ModelManager from "@/components/ModelManager";
import { saveFileOffline } from "@/services/db"; // Import the offline storage service
import { useCognify } from "@/hooks/useCognify"


type View = "prompt" | "chat" | { folder: string };

type AIResponse = {
  success: boolean
  result?: string
  error?: string
}

const Index = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isDark, setIsDark] = useState(false);
  const [view, setView] = useState<View>("prompt");
  const [sessionKey, setSessionKey] = useState(0);

  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  
  // SHARED STATE FOR VIEWING DOCUMENTS (Works for local files and DB blobs)
  const [viewingFile, setViewingFile] = useState<File | Blob | null>(null);
  const [viewingFileName, setViewingFileName] = useState<string>("");

  const { analyze } = useCognify();


  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  const handleSendMessage = async ({
      type,
      prompt,
      files
    }: {
      type: string | null
      prompt: string
      files: File[]
    }) => {

      // 1️⃣ Store files offline
      for (const file of files) {

        let category = "Documents"

        if (file.type.startsWith("image/")) {

          category = file.type === "image/png"
            ? "Screenshots"
            : "Photos"

        } 
        else if (file.name.match(/\.(ts|js|py|java|cpp|rs|go|html|css|json)$/)) {

          category = "Code"

        }

        await saveFileOffline(file, category)

      }

      // 2️⃣ Update chat UI

      const userMsg: Message = {
        id: Date.now().toString(),
        role: "user",
        content: prompt || (files.length > 0 ? `Sent ${files.length} file(s)` : ""),
        attachments: files
      }

      setMessages(prev => [...prev, userMsg])
      setView("chat")

      // 3️⃣ Simulate AI response

      setIsTyping(true)

      try {
        const result = await analyze({
          type,
          prompt,
          files
        }) as AIResponse

        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: result.success
            ? result.result ?? "No response generated."
            : result.error ?? "AI failed."
        }
        setMessages(prev => [...prev, aiMsg])

      } catch (err) {

        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "AI analysis failed."
        }

        setMessages(prev => [...prev, aiMsg])

      }
      setIsTyping(false)
    }

  const activeFolder = typeof view === "object" ? view.folder : null;

  // Helper to open the previewer from both chat and history folders
  const openPreview = (file: File | Blob, name: string) => {
    setViewingFile(file);
    setViewingFileName(name);
  };

  return (
    <div className="h-screen w-full bg-background flex overflow-hidden text-foreground">

      <ModelManager />
      
      {/* GLOBAL VIEWER OVERLAY - Supports Images, PDFs, and Code previews */}
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
                  <p className="text-sm font-medium">Text/Code Preview</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-xs">Full analysis of "{viewingFileName}" is available within the AI chat session.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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

          {typeof view === "object" && (
            <div className="flex-1 h-full">
              <ContentHistoryView 
                folder={view.folder} 
                onNavigate={(f) => setView({ folder: f })} 
                onPreviewFile={(item) => openPreview(item.blob, item.name)} // Link list items to the global previewer
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;