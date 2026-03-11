import { useState, useEffect } from "react";
import { PanelLeft, FileIcon, X, Download, FileText } from "lucide-react";
import AppSidebar from "@/components/AppSidebar";
import PromptUI from "@/components/PromptUI";
import ChatView, { Message } from "@/components/ChatView";
import ContentHistoryView from "@/components/ContentHistoryView";
import ModelManager from "@/components/ModelManager";
import { saveFileOffline } from "@/services/db"; 
import { useCognify } from "@/hooks/useCognify";
import * as mammoth from "mammoth";

type View = "prompt" | "chat" | { folder: string };

type AIResponse = {
  success: boolean;
  result?: string;
  error?: string;
  modelOutput?: any;
  sensitive?: boolean; // Added for clarity
};

const Index = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isDark, setIsDark] = useState(false);
  const [view, setView] = useState<View>("prompt");
  const [sessionKey, setSessionKey] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [viewingFile, setViewingFile] = useState<File | Blob | null>(null);
  const [viewingFileName, setViewingFileName] = useState<string>("");
  const [docxHtml, setDocxHtml] = useState<string>("");

  const { analyze } = useCognify();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  const handleSendMessage = async ({ type, prompt, files }: { type: string | null; prompt: string; files: File[]; }) => {
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: prompt || (files.length > 0 ? `Sent ${files.length} file(s)` : ""),
      attachments: files
    };

    setMessages(prev => [...prev, userMsg]);
    setView("chat");
    setIsTyping(true);

    try {
      const response = await analyze({
        type: type || "chat",
        prompt,
        files
      }) as AIResponse;

      for (const file of files) {
        let category = "Documents";

        // PRIORITIZE SECURE VAULT: If AI detects sensitivity, it ONLY goes to Secure Vault
        if (response?.sensitive === true || response?.modelOutput?.sensitive === true) {
          category = "Secure Vault";
        } 
        else if (file.type.startsWith("image/")) {
          category = file.type === "image/png" ? "Screenshots" : "Photos";
        }
        else if (file.name.match(/\.(ts|js|py|java|cpp|rs|go|html|css|json)$/)) {
          category = "Code";
        }

        await saveFileOffline(file, category);
        console.log("Saved:", file.name, "→", category);
      }

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.success
          ? (response.result ?? "Analysis complete.")
          : (response.error ?? "The AI encountered an error.")
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      console.error("AI Pipeline Error:", err);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Critical error: The AI worker failed to respond."
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const activeFolder = typeof view === "object" ? view.folder : null;

  const openPreview = async (file: File | Blob, name: string) => {
    setViewingFile(file);
    setViewingFileName(name);
    setDocxHtml("");

    if (name.toLowerCase().endsWith(".docx")) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });
        setDocxHtml(result.value);
      } catch (error) {
        setDocxHtml("<p class='text-destructive'>Error loading preview.</p>");
      }
    }
  };

  return (
    <div className="h-screen w-full bg-background flex overflow-hidden text-foreground">
      <ModelManager />
      {viewingFile && (
        <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-md flex items-center justify-center p-4 md:p-10">
          <div className="bg-card border border-border w-full max-w-5xl h-full rounded-[32px] shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
              <div className="flex items-center gap-3">
                <FileIcon size={20} className="text-primary" />
                <span className="font-semibold truncate max-w-xs">{viewingFileName}</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => {
                  const url = URL.createObjectURL(viewingFile);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = viewingFileName;
                  a.click();
                }} className="p-2 hover:bg-accent rounded-lg"><Download size={18} /></button>
                <button onClick={() => setViewingFile(null)} className="p-2 hover:bg-accent rounded-lg"><X size={20} /></button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-6 flex justify-center bg-background/50">
              {viewingFile.type.startsWith('image/') ? (
                <img src={URL.createObjectURL(viewingFile)} alt="preview" className="max-w-full h-auto object-contain" />
              ) : viewingFile.type === 'application/pdf' ? (
                <iframe src={URL.createObjectURL(viewingFile)} className="w-full h-full" title="PDF Preview" />
              ) : docxHtml ? (
                <div className="w-full h-full bg-white text-black p-10 overflow-auto prose prose-sm max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: docxHtml }} />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center">
                  <FileText size={64} className="mb-4 opacity-20" />
                  <p>Preview available in chat.</p>
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
        onNewSession={() => { setSessionKey(prev => prev + 1); setMessages([]); setView("prompt"); }}
        onFolderClick={(f) => setView({ folder: f })}
        activeFolder={activeFolder}
      />

      <main className={`flex-1 flex flex-col min-w-0 transition-all ${sidebarOpen ? "ml-64" : "ml-0"}`}>
        {!sidebarOpen && (
          <div className="absolute top-5 left-6 z-50">
            <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-xl bg-card border border-border"><PanelLeft size={20} /></button>
          </div>
        )}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {view === "prompt" && (
            <div className="flex-1 flex items-center justify-center p-4">
               <PromptUI key={sessionKey} onSend={handleSendMessage} showWelcome={true} onPreviewFile={(file) => openPreview(file, file.name)} />
            </div>
          )}
          {view === "chat" && (
            <div className="flex-1 flex flex-col h-full">
              <ChatView messages={messages} isTyping={isTyping} onAttachmentClick={(file) => openPreview(file, file.name)} />
              <div className="pb-8 pt-2">
                <PromptUI onSend={handleSendMessage} showWelcome={false} onPreviewFile={(file) => openPreview(file, file.name)} />
              </div>
            </div>
          )}
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