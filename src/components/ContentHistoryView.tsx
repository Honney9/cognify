import { Code, FileText, Camera, Image, Lock, Clock, Search, ArrowLeft, ChevronRight, ShieldCheck, Eye, EyeOff, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";

const iconMap: Record<string, React.ElementType> = {
  Code,
  Documents: FileText,
  Screenshots: Camera,
  Photos: Image,
  "Secure Vault": Lock,
};

const mockHistory: Record<string, any[]> = {
  Code: [
    { name: "auth-service.ts", date: "Mar 4", size: "12 KB", snippet: "export const auth = async (req, res) => { const token = req.headers..." },
    { name: "database-config.js", date: "Feb 28", size: "4 KB", snippet: "const pool = new Pool({ user: 'admin', host: 'localhost'..." },
    { name: "api-endpoints.py", date: "Jan 15", size: "8 KB", snippet: "@app.route('/api/v1/users') def get_users()..." },
    { name: "utils.ts", date: "Mar 1", size: "6 KB", snippet: "export const formatDate = (date: Date) => { return new Intl..." },
    { name: "logger.go", date: "Feb 12", size: "3 KB", snippet: "package main; import ('fmt'; 'log'); func InitLogger()..." },
    { name: "index.html", date: "Jan 20", size: "15 KB", snippet: "<!DOCTYPE html><html><head><title>Cognify App</title>..." },
    { name: "styles.css", date: "Jan 21", size: "22 KB", snippet: ":root { --primary: #7c3aed; --background: #000000; }..." },
    { name: "main.rs", date: "Dec 15", size: "11 KB", snippet: "fn main() { println!('Hello, Rust World!'); let x = 5; }..." },
    { name: "component.jsx", date: "Dec 10", size: "9 KB", snippet: "const Button = ({ children, onClick }) => <button onClick={onClick}..." },
    { name: "hook.tsx", date: "Nov 28", size: "5 KB", snippet: "export const useLocalStorage = (key: string, initial: any) => {..." },
    { name: "server.js", date: "Nov 15", size: "14 KB", snippet: "const express = require('express'); const app = express();..." },
    { name: "middleware.ts", date: "Oct 30", size: "7 KB", snippet: "export function middleware(req: NextRequest) { const auth = ..." },
    { name: "dockerfile", date: "Oct 12", size: "2 KB", snippet: "FROM node:18-alpine; WORKDIR /app; COPY package*.json ./..." },
    { name: "readme.md", date: "Sep 28", size: "4 KB", snippet: "# Cognify - AI Content Manager; To get started, run npm install..." },
    { name: "types.d.ts", date: "Sep 15", size: "8 KB", snippet: "declare interface User { id: string; email: string; role: 'admin'..." },
    { name: "constants.js", date: "Aug 20", size: "3 KB", snippet: "export const API_BASE_URL = 'https://api.cognify.ai/v1';..." },
    { name: "test-suite.spec.ts", date: "Jul 12", size: "18 KB", snippet: "describe('Auth Logic', () => { it('should sign in users', async () =>..." },
    { name: "deploy.sh", date: "Jun 28", size: "2 KB", snippet: "#!/bin/bash; echo 'Starting deployment...'; git pull origin main..." },
    { name: "config.yml", date: "May 15", size: "5 KB", snippet: "version: 2.1; jobs: build: docker: - image: cimg/node:18.1..." },
    { name: "schema.sql", date: "Apr 20", size: "10 KB", snippet: "CREATE TABLE users (id SERIAL PRIMARY KEY, username TEXT UNIQUE)..." }
  ],
  Documents: [
    { name: "Sampling and Quantization Study Guide", date: "Jan 1", snippet: "# Sampling and Quantization: The Foundations of Digitization..." },
    { name: "Similarity and Dissimilarity Measures", date: "Jan 1", snippet: "# Comprehensive Guide to Similarity and Dissimilarity..." },
    { name: "Project Roadmap 2024", date: "Dec 20", snippet: "# Q1-Q4 Strategic Goals and Milestones for the next year..." },
    { name: "Annual Budget Report", date: "Jan 5", snippet: "Total Projected Revenue: $2.4M; Expenses: $1.8M; Profit Margin..." },
    { name: "Meeting Minutes - March", date: "Mar 3", snippet: "Attendees: John, Sarah, Mike. Discussion: AI Integration Roadmap..." },
    { name: "Research Paper Draft", date: "Feb 15", snippet: "Abstract: This paper explores the impact of LLMs on knowledge retrieval..." },
    { name: "User Persona Profiles", date: "Feb 10", snippet: "Persona A: Tech-savvy developer looking for automation tools..." },
    { name: "Market Analysis v2", date: "Jan 28", snippet: "Competitor Landscape: Deepmind, OpenAI, Anthropic lead the market..." },
    { name: "System Architecture Doc", date: "Jan 15", snippet: "Microservices architecture utilizing Docker, K8s, and Redis..." },
    { name: "Employee Handbook", date: "Dec 12", snippet: "Company Culture: Remote-first, results-oriented, focus on growth..." },
    { name: "Terms of Service", date: "Nov 30", snippet: "By using Cognify, you agree to the following data processing terms..." },
    { name: "Privacy Policy", date: "Nov 30", snippet: "We value your privacy. Your data is encrypted at rest and in transit..." },
    { name: "Marketing Strategy", date: "Oct 25", snippet: "Target Audience: Content Creators and Enterprise Knowledge Workers..." },
    { name: "Invoice - Feb 2025", date: "Feb 1", snippet: "Client: Global Tech Corp. Services: Custom AI Development. Total: $15,000..." },
    { name: "Resume - Updated", date: "Sep 15", snippet: "Experience: Senior AI Engineer with 8+ years in NLP and Data Science..." },
    { name: "Technical Specification", date: "Aug 20", snippet: "Module 4: Real-time photo analysis using vision-transformers..." },
    { name: "Grant Proposal", date: "Jul 12", snippet: "Requesting $500k for research into decentralized AI storage..." },
    { name: "Presentation Slides", date: "Jun 28", snippet: "Slide 1: Welcome to Cognify. Slide 2: The Problem. Slide 3: Our Solution..." },
    { name: "Case Study - Client X", date: "May 15", snippet: "Outcome: 40% increase in productivity using automated document sorting..." },
    { name: "Workshop Notes", date: "Apr 20", snippet: "Key Takeaway: Simplicity is the ultimate sophistication in UI design..." }
  ],
  Screenshots: [
    { name: "Dashboard_Draft_Final.png", date: "Mar 2", url: "https://picsum.photos/seed/s1/400" },
    { name: "Console_Error_Log.jpg", date: "Feb 20", url: "https://picsum.photos/seed/s2/400" },
    { name: "Mobile_Nav_Bug.png", date: "Feb 18", url: "https://picsum.photos/seed/s3/400" },
    { name: "Color_Palette_Ref.png", date: "Feb 10", url: "https://picsum.photos/seed/s4/400" },
    { name: "Layout_Wireframe.jpg", date: "Jan 25", url: "https://picsum.photos/seed/s5/400" },
    { name: "Typography_Test.png", date: "Jan 15", url: "https://picsum.photos/seed/s6/400" },
    { name: "Dark_Mode_Comparison.png", date: "Dec 30", url: "https://picsum.photos/seed/s7/400" },
    { name: "User_Flow_Chart.png", date: "Dec 12", url: "https://picsum.photos/seed/s8/400" },
    { name: "Loading_State_UI.jpg", date: "Nov 25", url: "https://picsum.photos/seed/s9/400" },
    { name: "Success_Modal_Design.png", date: "Nov 10", url: "https://picsum.photos/seed/s10/400" },
    { name: "Profile_Page_Mockup.png", date: "Oct 28", url: "https://picsum.photos/seed/s11/400" },
    { name: "Setting_Menu_Draft.png", date: "Oct 15", url: "https://picsum.photos/seed/s12/400" },
    { name: "API_Response_JSON.png", date: "Sep 20", url: "https://picsum.photos/seed/s13/400" },
    { name: "Network_Tab_Profiling.jpg", date: "Aug 12", url: "https://picsum.photos/seed/s14/400" },
    { name: "Git_Merge_Conflict.png", date: "Jul 25", url: "https://picsum.photos/seed/s15/400" },
    { name: "New_Logo_Variant.png", date: "Jun 30", url: "https://picsum.photos/seed/s16/400" },
    { name: "Button_Hover_Effects.png", date: "May 18", url: "https://picsum.photos/seed/s17/400" },
    { name: "Sidebar_Collapsed.png", date: "Apr 12", url: "https://picsum.photos/seed/s18/400" },
    { name: "Chat_Interface_Alpha.png", date: "Mar 15", url: "https://picsum.photos/seed/s19/400" },
    { name: "Footer_Design_V3.png", date: "Feb 28", url: "https://picsum.photos/seed/s20/400" }
  ],
  Photos: [
    { name: "Office_Desk_Setup.jpg", date: "Feb 10", url: "https://pngtree.com/freepng/best-fast-food-samosa_15743218.html" },
    { name: "Team_Lunch_Offsite.png", date: "Jan 25", url: "https://picsum.photos/seed/p2/400" },
    { name: "Product_Launch_Event.jpg", date: "Jan 10", url: "https://picsum.photos/seed/p3/400" },
    { name: "New_HQ_Exterior.jpg", date: "Dec 15", url: "https://picsum.photos/seed/p4/400" },
    { name: "Whiteboard_Brainstorm.png", date: "Nov 20", url: "https://picsum.photos/seed/p5/400" },
    { name: "Coffee_Machine_Art.jpg", date: "Nov 05", url: "https://picsum.photos/seed/p6/400" },
    { name: "Sunset_From_Balcony.jpg", date: "Oct 18", url: "https://picsum.photos/seed/p7/400" },
    { name: "Lobby_Reception_Area.png", date: "Oct 02", url: "https://picsum.photos/seed/p8/400" },
    { name: "Conference_Room_B.jpg", date: "Sep 15", url: "https://picsum.photos/seed/p9/400" },
    { name: "Team_Retreat_Group.png", date: "Aug 28", url: "https://picsum.photos/seed/p10/400" },
    { name: "Server_Rack_Install.jpg", date: "Aug 10", url: "https://picsum.photos/seed/p11/400" },
    { name: "Morning_Workspace.png", date: "Jul 22", url: "https://picsum.photos/seed/p12/400" },
    { name: "Holiday_Party_2024.jpg", date: "Dec 20", url: "https://picsum.photos/seed/p13/400" },
    { name: "Client_Visit_Snapshot.png", date: "Jun 15", url: "https://picsum.photos/seed/p14/400" },
    { name: "Award_Ceremony.jpg", date: "May 30", url: "https://picsum.photos/seed/p15/400" },
    { name: "Studio_Backdrop.png", date: "Apr 25", url: "https://picsum.photos/seed/p16/400" },
    { name: "Macro_Keyboard_Shot.jpg", date: "Mar 12", url: "https://picsum.photos/seed/p17/400" },
    { name: "Event_Badges.png", date: "Feb 20", url: "https://picsum.photos/seed/p18/400" },
    { name: "Speaker_Session_1.jpg", date: "Jan 18", url: "https://picsum.photos/seed/p19/400" },
    { name: "Post-it_Idea_Wall.png", date: "Dec 05", url: "https://picsum.photos/seed/p20/400" }
  ],
  "Secure Vault": [
    { name: "credentials.enc", date: "Mar 5", size: "1 KB", snippet: "ENCRYPTED_DATA_BLOB_PRIVATE_KEY_0x92..." },
    { name: "tax-returns-2025.pdf", date: "Feb 12", size: "2.4 MB", snippet: "Confidential financial document for 2025 tax season..." },
    { name: "private_key.pem", date: "Feb 10", size: "2 KB", snippet: "-----BEGIN RSA PRIVATE KEY----- MIIEpAIBAAKCAQEA..." },
    { name: "passport_scan.enc", date: "Jan 28", size: "1.8 MB", snippet: "ENCRYPTED_IMAGE_FILE_AES256_GCM_AUTH..." },
    { name: "recovery_codes.txt", date: "Jan 15", size: "1 KB", snippet: "CODE-1: 9X2J-8W1L | CODE-2: 4P7Q-2M0K..." },
    { name: "bank_statement_jan.pdf", date: "Feb 01", size: "850 KB", snippet: "Confidential Bank Report for January 2025..." },
    { name: "investment_portfolio.enc", date: "Jan 10", size: "500 KB", snippet: "ENCRYPTED_XLSX_DATA_REDACTED_FINANCE..." },
    { name: "medical_records.zip", date: "Dec 20", size: "12 MB", snippet: "Password protected archive: health_vitals_2024.zip..." },
    { name: "legal_contract_draft.pdf", date: "Dec 05", size: "3.1 MB", snippet: "Non-Disclosure Agreement between Party A and B..." },
    { name: "api_secrets.env", date: "Nov 25", size: "1 KB", snippet: "STRIPE_SECRET=sk_live_... AWS_ACCESS_KEY=..." },
    { name: "crypto_wallet_seed.txt", date: "Nov 12", size: "1 KB", snippet: "BIP39-24-WORDS-MNEMONIC-ENCRYPTED-ONLY..." },
    { name: "birth_certificate.jpg", date: "Oct 28", size: "4.2 MB", snippet: "ENCRYPTED_DOC_IMAGE_SENSITIVE_PII..." },
    { name: "house_deeds.pdf", date: "Oct 15", size: "6.5 MB", snippet: "Property Ownership Records for Unit 402..." },
    { name: "insurance_policy.enc", date: "Sep 20", size: "2.1 MB", snippet: "Health and Life Insurance coverage details 2025..." },
    { name: "wifi_passwords.txt", date: "Aug 12", size: "1 KB", snippet: "Home_5G: c0mpl3x_p@ss | Guest: welcome2024..." },
    { name: "sensitive_meeting_notes.enc", date: "Jul 25", size: "12 KB", snippet: "Project X: Internal acquisition strategy and budget..." },
    { name: "legacy_backup.iso", date: "Jun 30", size: "2 GB", snippet: "System image backup encrypted with BitLocker..." },
    { name: "client_nda_signed.pdf", date: "May 18", size: "1.4 MB", snippet: "Digitally signed NDA for Tech Synergy Partners..." },
    { name: "patent_filing_final.enc", date: "Apr 12", size: "4.8 MB", snippet: "Provisional patent application for Neural-Storage-V1..." },
    { name: "encrypted_archive.rar", date: "Mar 01", size: "85 MB", snippet: "AES-256 Multi-part encrypted backup archive..." }
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
  const [showPin, setShowPin] = useState(false);
  const [countryCode, setCountryCode] = useState("+1");
  
  const [timer, setTimer] = useState(0);
  const [otpSent, setOtpSent] = useState(false);
  const [showToastBox, setShowToastBox] = useState(false);

  useEffect(() => {
    if (folder !== "Secure Vault") {
      setIsUnlocked(false);
      setPhone("");
      setPin("");
      setShowPin(false);
      setTimer(0);
      setOtpSent(false);
      setShowToastBox(false);
      setCountryCode("+1");
    }
  }, [folder]);

  useEffect(() => {
    let interval: any;
    if (timer > 0) {
      interval = window.setInterval(() => {
        setTimer((t) => (t > 0 ? t - 1 : 0));
      }, 1000);
    }
    return () => {
      if (interval) window.clearInterval(interval);
    };
  }, [timer]);

  const handleGetOTP = () => {
    if (phone.length === 10) {
      setTimer(60);
      setOtpSent(true);
      setShowToastBox(true); 
      console.log("OTP code sent to:", countryCode + phone);
    } else {
      alert("Please enter a valid 10-digit phone number first.");
    }
  };

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length === 10 && pin.length === 4) {
      setIsUnlocked(true);
    } else {
      alert("Verification failed: Requires a 10-digit phone number and 4-digit PIN.");
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

  const MediaPreviewItem = ({ item }: { item: any }) => (
    <div className="relative group aspect-square rounded-[24px] overflow-hidden bg-card-bg border border-card-border hover:border-primary/50 transition-all cursor-pointer">
      <img src={item.url} alt={item.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
        <p className="text-[10px] text-white truncate font-medium">{item.name}</p>
      </div>
    </div>
  );

  const getFilteredItems = (items: any[]) => {
    if (!search.trim()) return items;
    const term = search.toLowerCase();
    return items.filter(item => 
      item.name.toLowerCase().includes(term) || 
      (item.snippet && item.snippet.toLowerCase().includes(term))
    );
  };

  const isDashboard = folder === "All" || !folder;
  const isVault = folder === "Secure Vault";

  return (
    <div className="flex flex-col h-full bg-main-bg text-foreground transition-colors duration-200">
      
      {isVault && !isUnlocked ? (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="relative max-w-md w-full bg-card-bg border border-card-border p-10 rounded-[32px] shadow-2xl shadow-black/20 text-center animate-in fade-in zoom-in duration-300">
            
            {showToastBox && (
              <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-background/40 backdrop-blur-[2px] rounded-[32px]">
                <div className="bg-card-bg border border-card-border p-8 rounded-2xl shadow-xl max-w-[280px] w-full animate-in zoom-in duration-200">
                  <p className="text-sm font-medium mb-6 text-foreground">The otp has been sent</p>
                  <button 
                    onClick={() => setShowToastBox(false)}
                    className="w-full bg-primary text-primary-foreground py-2.5 rounded-xl font-bold text-xs hover:brightness-110 transition-all"
                  >
                    OK
                  </button>
                </div>
              </div>
            )}

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
                <div className="flex items-center gap-2">
                  <div className="relative shrink-0">
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="appearance-none bg-main-bg border border-card-border rounded-xl pl-3 pr-8 py-3 text-xs font-medium focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer transition-all h-[46px]"
                    >
                      <option value="+1">🇺🇸 +1</option>
                      <option value="+44">🇬🇧 +44</option>
                      <option value="+91">🇮🇳 +91</option>
                      <option value="+61">🇦🇺 +61</option>
                      <option value="+81">🇯🇵 +81</option>
                    </select>
                    <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                      <ChevronDown size={14} />
                    </div>
                  </div>
                  <div className="relative flex-1 flex items-center">
                    <input 
                      type="text" 
                      inputMode="numeric"
                      placeholder="10-digit number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      className="w-full bg-main-bg border border-card-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all pr-20"
                      required
                    />
                    <button
                      type="button"
                      onClick={handleGetOTP}
                      disabled={timer > 0}
                      className="absolute right-3 text-[11px] font-bold text-primary hover:underline disabled:no-underline disabled:text-muted-foreground transition-all"
                    >
                      Get OTP?
                    </button>
                  </div>
                </div>
                {otpSent && (
                   <div className="mt-2 flex justify-between items-center px-1">
                     <span className="text-[11px] text-muted-foreground">
                        {timer > 0 ? `Resend in ${timer}s` : "Didn't receive code?"}
                     </span>
                     {timer === 0 && (
                       <button
                         type="button"
                         onClick={handleGetOTP}
                         className="text-[11px] font-bold text-primary hover:underline"
                       >
                         Resend OTP?
                       </button>
                     )}
                   </div>
                )}
              </div>
              <div className="relative">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1 mb-1.5 block">4-Digit PIN</label>
                <div className="relative">
                  <input 
                    type={showPin ? "text" : "password"} 
                    maxLength={4}
                    placeholder="••••"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                    className="w-full bg-main-bg border border-card-border rounded-xl px-4 py-3 text-sm tracking-[1em] text-center focus:ring-2 focus:ring-primary/20 outline-none transition-all pr-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
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
                placeholder={`Search ${isDashboard ? "contents" : folder.toLowerCase()}...`}
                className="w-full bg-card-bg border border-card-border rounded-full pl-12 pr-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <div className="max-w-5xl w-full mx-auto px-6 pb-20">
              {isDashboard ? (
                <div className="space-y-10 mt-4">
                  {Object.keys(mockHistory).map((cat) => {
                    const filtered = getFilteredItems(mockHistory[cat] || []);
                    if (search && filtered.length === 0) return null;
                    const isMedia = cat === "Photos" || cat === "Screenshots";

                    return (
                      <section key={cat}>
                        <div className="flex items-center justify-between mb-4 px-2">
                          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{cat}</h2>
                          <button 
                            onClick={() => onNavigate(cat)} 
                            className="h-8 w-8 flex items-center justify-center bg-card-bg border border-card-border hover:bg-card-hover rounded-full text-foreground transition-all shadow-sm"
                          >
                            <ChevronRight size={18} />
                          </button>
                        </div>
                        {isMedia ? (
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                            {filtered.slice(0, 5).map((item, i) => <MediaPreviewItem key={i} item={item} />)}
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {filtered.slice(0, 2).map((item, i) => <ListItem key={i} item={item} folderName={cat} />)}
                          </div>
                        )}
                      </section>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-4">
                  {(folder === "Photos" || folder === "Screenshots") ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                      {getFilteredItems(mockHistory[folder] || []).map((item: any, i: number) => (
                        <MediaPreviewItem key={i} item={item} />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {getFilteredItems(mockHistory[folder] || []).map((item: any, i: number) => (
                        <ListItem key={i} item={item} folderName={folder} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}