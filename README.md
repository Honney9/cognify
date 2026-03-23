# 🧠 Cognify  
### Privacy-Preserving Offline AI Productivity Suite  

Transform raw digital files into **contextual intelligence — fully offline, directly in your browser.**

---

# 🚀 Overview
Modern systems store huge amounts of data — photos, screenshots, code, documents — but treat them as **isolated files instead of connected knowledge**.

**Cognify solves this** by introducing a **context-aware Edge AI system** that:
- Understands content type automatically
- Runs AI models locally (no cloud)
- Generates meaningful insights instantly

✅ No Internet Required  
🔒 No Data Leakage  
⚡ Real-Time Processing  
🧠 Context-Aware Intelligence  

---

# 🎯 Problem Statement
Users generate massive unstructured content daily:
- 📸 Photos & Screenshots  
- 📄 Documents  
- 💻 Code Files  

But current systems:
- Don’t understand content  
- Don’t connect information  
- Require cloud AI (privacy risk)  

### Result:
- Cognitive overload  
- Poor searchability  
- Repeated effort  
- Security risks  

---

# 💡 Solution: Cognify
Cognify introduces a **modular AI pipeline** that:
1. Detects content type  
2. Routes to the correct AI module  
3. Runs inference locally using:
   - ONNX Runtime  
   - WebAssembly (WASM)  
   - WebLLM  

---

# ✨ Core Features

## 💻 AI Developer Assistant
- Code summarization  
- Bug detection  
- Vulnerability analysis  
- Optimization suggestions  
- Multi-language support  

---

## 📄 Document Intelligence
- Document summarization  
- Key point extraction  
- Validation & anomaly detection  
- Fraud detection  

---

## 📸 Screenshot Intelligence
Detects sensitive data like:
- OTPs  
- Bank details  
- IDs  
- Credentials  

---

## 🖼️ Photo Intelligence
- Scene understanding  
- Object detection  
- Tag generation  
- Deepfake detection  

**Example Outputs:**
- “Office Meeting”  
- “Study Session”  
- “Road Trip”  

---

## 🔐 Privacy Protection Layer
Automatically detects:
- Passports  
- ID cards  
- Certificates  
- Financial documents  

### Smart Actions:
- Move to Secure Vault  
- Blur previews  
- Hide sensitive content  

---

## 🔑 Secure Vault
- Biometric / Device authentication  
- Fully local storage  
- Prevents unauthorized access  

---

# 🧠 AI Pipeline Architecture
```
User Input
│
▼
Content Detection
│
▼
Feature Router
│
├── Code → WebLLM
├── Document → Document Model
├── Screenshot → Vision + Sensitive Detection
└── Photo → Vision + CLIP + Scene Understanding
│
▼
Privacy Layer
│
▼
Final AI Response
```

---

# Model Pipeline 
```
Image Input
│
▼
MobileNet / EfficientNet
│
▼
Feature Extraction
│
▼
CLIP (Semantic Understanding)
│
▼
Scene Classification
│
▼
Privacy Detection
│
▼
Secure Actions
```

---

# Project Structure

```
src/
│
├── components/ui/             # UI components for user interaction
│   ├── AppSidebar.tsx         # Sidebar navigation
│   ├── ChatView.tsx           # Chat interface for AI
│   ├── ContentHistoryView.tsx # Displays analyzed content history
│   ├── ModelManager.tsx       # Handles model selection/loading
│   ├── PromptUI.tsx           # Prompt input interface
│   └── DocumentViewer.tsx     # Document preview and rendering
│
├── hooks/                     # Custom React hooks
│   ├── useCognify.ts          # Core app logic hook
│   ├── useLLM.ts              # LLM interaction logic
│   ├── useModelLoader.ts      # Loads local AI models
│   ├── usePhotoAnalysis.ts    # Image analysis logic
│   └── useToast.ts            # Notification system
│
├── services/ai/               # AI models & services
│   ├── llmModel.ts            # Local language model integration
│   ├── documentModel.ts       # Document processing model
│   ├── mobilenetModel.ts      # Image classification model
│   ├── visionModel.ts         # Vision analysis model
│   ├── photoAnalysisService.ts # Image processing service
│   ├── deepfakeModel.ts       # Deepfake detection model
│   └── privacyRules.ts        # Privacy & security logic
│
├── workers/                   # Web Workers for background processing
│   ├── ai.worker.ts           # AI computation worker
│   └── visionWorker.ts        # Vision processing worker
│
├── utilsModels/               # Helper functions for models
├── utilsLLMs/                 # Utilities for LLM handling
├── utilsPhotoAnalysis/        # Image analysis utilities
│
├── validators/                # Data validation & analysis logic
│   ├── detectors.ts           # Detection logic
│   ├── analyzers.ts           # Content analysis
│   ├── processors.ts          # Data processing
│   ├── sensitiveDetectors.ts  # Sensitive data detection
│   └── validators.ts          # General validation utilities
│
├── pages/                     # Application pages/routes
├── styles/                    # Styling files
├── App.tsx                     # Root React component
└── main.tsx                    # Application entry point
```
---

# 🛠 Tech Stack

### Frontend
- React + Vite  
- TypeScript  
- TailwindCSS  
- ShadCN UI  

### AI & ML
- CLIP  
- MobileNet  
- EfficientNet  
- WebLLM  

### Runtime
- ONNX Runtime Web  
- WebAssembly (WASM)  
- Web Workers  

### Storage
- IndexedDB  

---

# ⚙️ Installation

## 1. Clone Repository
```bash
git clone https://github.com/honney9/cognify.git
cd cognify
```


## 2. Install Dependencies
```bash
npm install
```

## 3. Add Models
Create a models/ folder:

models/
├── clip.onnx
├── mobilenet.onnx
└── efficientnet.onnx

Download Links:

CLIP
https://huggingface.co/Xenova/clip-vit-base-patch32/resolve/main/onnx/model.onnx

MobileNet
https://github.com/onnx/models/raw/main/validated/vision/classification/mobilenet/model/mobilenetv2-7.onnx

EfficientNet
https://github.com/onnx/models/raw/main/validated/vision/classification/efficientnet-lite4/model/efficientnet-lite4-11.onnx


## 4. Run Project
```bash
npm run dev
```
Open:
http://localhost:5173

## 🔐 First Run Behavior

Loads AI models locally

Caches models using IndexedDB

Enables offline inference

## 🚀 Future Roadmap

Personal knowledge graph

Semantic file search

Voice AI interface

Smart memory system

Workflow automation

## 🎯 Vision

The future is private, on-device AI — not cloud-dependent systems.

Cognify is built for:

Privacy

Speed

Intelligence

## 👩‍💻 Developers

Honney Walia
Backend • AI Integration • System Architecture

Vidhi Chauhan
Frontend • AI UX • Edge AI Integration