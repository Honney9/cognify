import { useEffect, useRef } from "react";
import { FileText, User, Code, AlertTriangle, Search, Image as ImageIcon, CheckCircle, XCircle, FileCheck } from "lucide-react";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: any; // Changed to any to handle raw result objects safely
  attachments?: File[];
}

interface ChatViewProps {
  messages: Message[];
  isTyping?: boolean;
  onAttachmentClick?: (file: File) => void;
}

export default function ChatView({ messages, isTyping, onAttachmentClick }: ChatViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const renderAIContent = (content: any) => {
    try {
      let data: any;

      // 1. Extract and Parse Content
      if (typeof content === "object" && content !== null) {
        data = content;
      } else if (typeof content === "string") {
        const cleaned = content.replace(/```json|```/g, "").trim();
        const start = cleaned.indexOf('{');
        const end = cleaned.lastIndexOf('}');
        
        if (start === -1 || end === -1) return content;
        
        const jsonToParse = cleaned.substring(start, end + 1);
        data = JSON.parse(jsonToParse);
      } else {
        return String(content);
      }

      // 2. Handle generic result formats: {confidence, tags, type, text/summary}
      if (data.confidence !== undefined && (data.text || data.summary || data.tags)) {
        const displayText = data.text || data.summary || data.description;
        return (
          <div className="space-y-3 min-w-[240px]">
            {displayText && <p className="text-sm leading-relaxed">{String(displayText)}</p>}
            
            {data.tags && Array.isArray(data.tags) && data.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {data.tags.map((tag: any, i: number) => (
                  <span key={i} className="px-2 py-0.5 bg-foreground/5 rounded-md text-[10px] font-medium border border-foreground/5">
                    #{typeof tag === 'object' ? (tag.text || JSON.stringify(tag)) : String(tag)}
                  </span>
                ))}
              </div>
            )}

            <div className="pt-2 border-t border-foreground/5 text-[10px] opacity-40 uppercase font-bold tracking-wider">
              Confidence: {(data.confidence * 100).toFixed(1)}% | {data.type || 'Analysis'}
            </div>
          </div>
        );
      }

      // 3. Handle Deepfake detection format
      if (data.type === "deepfake_detection") {
        return (
          <div className="space-y-4 min-w-[280px]">
            <div className="flex items-center gap-2 font-bold text-base">
              {data.isDeepfake ? (
                <><AlertTriangle size={18} className="text-destructive" /> ⚠️ Deepfake Warning</>
              ) : (
                <><Search size={18} className="text-primary" /> 🔍 Deepfake Detection</>
              )}
            </div>
            <div className="text-sm space-y-1 opacity-90">
              <p>Result: <span className="font-semibold">{data.isDeepfake ? "Possible Deepfake" : "Authentic Image"}</span></p>
              <p>Confidence: <span className="font-semibold">{(data.confidence * 100).toFixed(0)}%</span></p>
            </div>
            {data.analysis && (
              <p className="text-xs opacity-70 italic border-t border-foreground/10 pt-3 leading-relaxed">
                {String(data.analysis)}
              </p>
            )}
          </div>
        );
      }

      // 4. Handle standard Photo analysis format
      if (data.type === "photo") {
        const summaryText = data.summary || data.text || data.description;
        const hasObjects = data.detectedObjects && Array.isArray(data.detectedObjects) && data.detectedObjects.length > 0;
        const hasInsights = data.insights && Array.isArray(data.insights) && data.insights.length > 0;

        return (
          <div className="space-y-4 max-w-full">
            <div className="flex items-center gap-2 font-bold text-base text-primary">
              <ImageIcon size={18} /> 🖼️ {String(data.scene || 'Photo Analysis')}
            </div>
            
            {summaryText && <p className="text-sm leading-relaxed opacity-90">{String(summaryText)}</p>}
            
            {data.tags && Array.isArray(data.tags) && data.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {data.tags.map((tag: any, i: number) => (
                  <span key={i} className="px-2 py-0.5 bg-foreground/5 rounded-md text-[10px] font-medium border border-foreground/5">
                    #{typeof tag === 'object' ? JSON.stringify(tag) : String(tag)}
                  </span>
                ))}
              </div>
            )}

            {(hasObjects || hasInsights) && (
              <div className="grid grid-cols-2 gap-4 text-[11px] border-t border-foreground/10 pt-4">
                {hasObjects && (
                  <div>
                    <p className="font-bold mb-1.5 uppercase opacity-50 text-[9px] tracking-wider">Objects</p>
                    <ul className="space-y-1">
                      {data.detectedObjects.map((obj: any, i: number) => (
                        <li key={i} className="flex items-center gap-1.5">
                          <span className="h-1 w-1 rounded-full bg-primary shrink-0" />
                          {typeof obj === 'object' ? JSON.stringify(obj) : String(obj)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {hasInsights && (
                  <div>
                    <p className="font-bold mb-1.5 uppercase opacity-50 text-[9px] tracking-wider">Insights</p>
                    <ul className="space-y-1">
                      {data.insights.map((ins: any, i: number) => (
                        <li key={i} className="flex items-center gap-1.5">
                          <span className="h-1 w-1 rounded-full bg-primary shrink-0" />
                          {typeof ins === 'object' ? JSON.stringify(ins) : String(ins)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      }
      
      // 5. Handle Document Detection format
      if (data.type === "document_detection") {
        return (
          <div className="space-y-4 min-w-[280px]">
            <div className="flex items-center gap-2 font-bold text-base">
              <FileText size={18} className="text-primary" /> 📄 Document Detected
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs opacity-60 uppercase tracking-wider">Type:</span>
                <span className="font-semibold">{data.documentType}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs opacity-60 uppercase tracking-wider">Confidence:</span>
                <span className="font-semibold">{(data.confidence * 100).toFixed(0)}%</span>
              </div>
            </div>
            {data.summary && (
              <p className="text-sm opacity-80 border-t border-foreground/10 pt-3 leading-relaxed">
                {String(data.summary)}
              </p>
            )}
          </div>
        );
      }

      // 6. Handle Document Validation format
      if (data.type === "document_validation") {
        return (
          <div className="space-y-4 min-w-[280px]">
            <div className="flex items-center gap-2 font-bold text-base">
              {data.valid ? (
                <>
                  <CheckCircle size={18} className="text-green-500" /> ✅ Document Validation
                </>
              ) : (
                <>
                  <XCircle size={18} className="text-destructive" /> ⚠️ Document Validation
                </>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs opacity-60 uppercase tracking-wider">Status:</span>
                <span className={`font-semibold ${data.valid ? 'text-green-500' : 'text-destructive'}`}>
                  {data.valid ? "Valid Document" : "Invalid or Suspicious"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs opacity-60 uppercase tracking-wider">Confidence:</span>
                <span className="font-semibold">{(data.confidence * 100).toFixed(0)}%</span>
              </div>
            </div>
            {data.issues && data.issues.length > 0 ? (
              <div className="border-t border-foreground/10 pt-3">
                <p className="text-xs font-semibold mb-2 opacity-80">Issues Found:</p>
                <ul className="space-y-1.5 text-sm">
                  {data.issues.map((issue: string, i: number) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-destructive mt-0.5">•</span>
                      <span className="opacity-80">{issue}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-sm opacity-70 border-t border-foreground/10 pt-3">
                No structural issues were detected in the document.
              </p>
            )}
          </div>
        );
      }

      // 7. Handle Document Analysis format
      if (data.type === "document_analysis") {
        return (
          <div className="space-y-4 max-w-full">
            <div className="flex items-center gap-2 font-bold text-base text-primary">
              <FileCheck size={18} /> 📊 Document Analysis
            </div>
            {data.summary && (
              <div>
                <p className="text-xs font-semibold mb-2 opacity-60 uppercase tracking-wider">Summary:</p>
                <p className="text-sm leading-relaxed opacity-90">{String(data.summary)}</p>
              </div>
            )}
            {data.keyPoints && Array.isArray(data.keyPoints) && data.keyPoints.length > 0 && (
              <div className="border-t border-foreground/10 pt-3">
                <p className="text-xs font-semibold mb-2 opacity-60 uppercase tracking-wider">Key Points:</p>
                <ul className="space-y-2 text-sm">
                  {data.keyPoints.map((point: string, i: number) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      <span className="opacity-80">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      }

      // 8. Handle Combined Document Processing Result (all three)
      if (data.detection || data.validation || data.analysis) {
        return (
          <div className="space-y-6 max-w-full">
            {data.detection && (
              <div className="space-y-3 pb-4 border-b border-foreground/10">
                <div className="flex items-center gap-2 font-bold text-base">
                  <FileText size={18} className="text-primary" /> 📄 Document Detected
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs opacity-60 uppercase tracking-wider">Type:</span>
                    <span className="font-semibold">{data.detection.documentType}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs opacity-60 uppercase tracking-wider">Confidence:</span>
                    <span className="font-semibold">{(data.detection.confidence * 100).toFixed(0)}%</span>
                  </div>
                </div>
                {data.detection.summary && (
                  <p className="text-sm opacity-80 leading-relaxed">{String(data.detection.summary)}</p>
                )}
              </div>
            )}

            {data.validation && (
              <div className="space-y-3 pb-4 border-b border-foreground/10">
                <div className="flex items-center gap-2 font-bold text-base">
                  {data.validation.valid ? (
                    <>
                      <CheckCircle size={18} className="text-green-500" /> ✅ Document Validation
                    </>
                  ) : (
                    <>
                      <XCircle size={18} className="text-destructive" /> ⚠️ Document Validation
                    </>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs opacity-60 uppercase tracking-wider">Status:</span>
                    <span className={`font-semibold ${data.validation.valid ? 'text-green-500' : 'text-destructive'}`}>
                      {data.validation.valid ? "Valid Document" : "Invalid or Suspicious"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs opacity-60 uppercase tracking-wider">Confidence:</span>
                    <span className="font-semibold">{(data.validation.confidence * 100).toFixed(0)}%</span>
                  </div>
                </div>
                {data.validation.issues && data.validation.issues.length > 0 ? (
                  <div>
                    <p className="text-xs font-semibold mb-2 opacity-80">Issues Found:</p>
                    <ul className="space-y-1.5 text-sm">
                      {data.validation.issues.map((issue: string, i: number) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-destructive mt-0.5">•</span>
                          <span className="opacity-80">{issue}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-sm opacity-70">No structural issues were detected in the document.</p>
                )}
              </div>
            )}

            {data.analysis && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 font-bold text-base text-primary">
                  <FileCheck size={18} /> 📊 Document Analysis
                </div>
                {data.analysis.summary && (
                  <div>
                    <p className="text-xs font-semibold mb-2 opacity-60 uppercase tracking-wider">Summary:</p>
                    <p className="text-sm leading-relaxed opacity-90">{String(data.analysis.summary)}</p>
                  </div>
                )}
                {data.analysis.keyPoints && Array.isArray(data.analysis.keyPoints) && data.analysis.keyPoints.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold mb-2 opacity-60 uppercase tracking-wider">Key Points:</p>
                    <ul className="space-y-2 text-sm">
                      {data.analysis.keyPoints.map((point: string, i: number) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-primary mt-0.5">•</span>
                          <span className="opacity-80">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      }
      
      // Fallback: If it's still an object, stringify it to prevent React crash
      return typeof data === 'object' ? JSON.stringify(data) : String(content);
    } catch (e) {
      return typeof content === 'object' ? JSON.stringify(content) : String(content);
    }
  };

  return (
    <div 
      ref={scrollRef}
      className="flex-1 overflow-y-auto px-4 py-8 space-y-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
    >
      <div className="max-w-3xl mx-auto space-y-8">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}
          >
            <div className={`flex gap-3 max-w-[85%] ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
              <div className={`h-8 w-8 rounded-full shrink-0 flex items-center justify-center border ${
                msg.role === "user" ? "bg-primary/10 border-primary/20 text-primary" : "bg-card-bg border-card-border text-foreground"
              }`}>
                {msg.role === "user" ? <User size={16} /> : <span className="text-[10px] font-bold">C</span>}
              </div>

              <div className={`flex flex-col gap-1 ${msg.role === "user" ? "items-end" : "items-start"}`}>
                <div className={`rounded-[20px] shadow-sm overflow-hidden border ${
                  msg.role === "user" 
                    ? "bg-primary text-primary-foreground border-transparent rounded-tr-none" 
                    : "bg-card-bg border-card-border text-foreground rounded-tl-none"
                }`}>
                  
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="p-1 space-y-1 bg-black/5">
                      {msg.attachments.map((file, i) => {
                        const isImage = file.type.startsWith('image/');
                        const isCode = file.name.match(/\.(ts|js|py|java|cpp|rs|go|html|css)$/);
                        return (
                          <div 
                            key={i} 
                            onClick={() => onAttachmentClick?.(file)}
                            className="group cursor-pointer overflow-hidden rounded-xl border border-white/10 hover:border-white/30 transition-all bg-black/20"
                          >
                            {isImage ? (
                              <img src={URL.createObjectURL(file)} alt="preview" className="max-h-64 w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            ) : (
                              <div className="flex items-center gap-3 p-4 min-w-[200px]">
                                <div className="h-10 w-10 rounded-lg bg-white/10 flex items-center justify-center">
                                  {isCode ? <Code size={20} /> : <FileText size={20} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-[11px] font-bold truncate">{file.name}</div>
                                  <div className="text-[9px] opacity-60 uppercase">{(file.size / 1024).toFixed(1)} KB</div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {msg.content && (
                    <div className="px-4 py-3 text-sm leading-relaxed">
                      {msg.role === "assistant" 
                        ? renderAIContent(msg.content) 
                        : (typeof msg.content === 'object' ? JSON.stringify(msg.content) : String(msg.content))
                      }
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start animate-in fade-in duration-300">
            <div className="flex gap-3 flex-row">
              <div className="h-8 w-8 rounded-full bg-card-bg border border-card-border flex items-center justify-center text-foreground">
                <span className="text-[10px] font-bold">C</span>
              </div>
              <div className="bg-card-bg border border-card-border px-4 py-3 rounded-[20px] rounded-tl-none flex gap-1 items-center h-10">
                <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}