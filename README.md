
# AI Arena | Intelligence Engine

> **✨ NEW:** Free-Tier Optimizations Implemented!
> - 📦 **Smart Caching**: Reduce API calls by 30-40% through intelligent document caching
> - 🔄 **Batch Processing**: Queue multiple documents while respecting 15 RPM rate limits
> - 📱 **Offline Mode**: Study flashcards without internet, auto-sync when online
> 
> See [FREE_TIER_OPTIMIZATIONS.md](FREE_TIER_OPTIMIZATIONS.md) for details.

**AI Arena** is the definitive, "GOAT Level" study companion engineered for high-performance students and professionals in **Engineering, Computer Science, and Medicine**.

It leverages the cutting-edge **Google Gemini API (Gemini 3 / 2.5)** to transform raw chaos—text documents, complex PDFs, and even **audio/video lecture recordings**—into structured, actionable intelligence.

![AI Arena Interface](https://via.placeholder.com/1200x600/030712/38bdf8?text=AI+Arena+Pro+Interface)

---

## 🚀 Neural Capabilities

### 1. 🧠 The Nexus (Knowledge Topology)
*   **Global Knowledge Graph:** Visualizes connections between all your saved documents using interactive **Mermaid.js** graphs.
*   **Smart Study Path:** Generates a linear, gamified vertical timeline of concepts to master, marked by status (Pending, In-Progress, Mastered).
*   **AI Insights:** Provides high-level analysis of gaps in your knowledge library.

### 2. 🤖 Persistent Study Buddy
*   **Context-Aware Sidecar:** A chat interface that "lives" alongside your documents. It knows exactly what you are looking at.
*   **Memory Persistence:** Remembers your conversation history across sessions (stored locally).
*   **Socratic Mode:** Can be toggled to guide you to answers rather than solving them for you.

### 3. 🎙️ Multimodal Lecture Intelligence
*   **Audio/Video Processing:** Upload **MP3, WAV, MP4, or MPEG** files.
*   **Structure Extraction:** Automatically generates:
    *   Timeline of Key Events.
    *   Core Concept Definitions.
    *   Actionable Homework/To-Dos.

### 4. ⚡ Analytical Workbench (Cheat Sheets)
*   **Logic Matrix:** Converts unstructured text into structured, color-coded sections.
*   **Visual Intelligence:** Automatically detects processes and generates flowcharts/diagrams (Mermaid.js) on the fly.
*   **Voice Mode:** Neural Text-to-Speech for auditory review.
*   **Smart Highlight:** AI-driven highlighting of the top 20% most critical information.

### 5. 🃏 Neural Flash (Active Recall)
*   **SRS Algorithm:** Built-in Spaced Repetition System (Again, Hard, Good, Easy) to optimize memory retention.
*   **Auto-Generation:** Creates cards from documents or specific cheat sheets.

### 6. 🩺 Diagnostic Engine & Code Debugger
*   **Quiz Mode:** Generates difficult multiple-choice questions with detailed "Why you were wrong" explanations.
*   **Weakness Detector:** Analyzes quiz performance to diagnose specific knowledge gaps.
*   **Code Diff Viewer:** A visual "Original vs. Fixed" diff tool for JavaScript, Python, and HTML/CSS debugging.

### 7. 🎯 Prediction Engine
*   **Exam Heatmaps:** Analyzes multiple past exam papers to generate a frequency heatmap of topics.
*   **Strategy Profiles:** Outputs a tactical plan: *Time Allocation*, *Order of Attack*, and *Pitfall Avoidance*.

---

## 🛠️ Tech Stack

*   **Core:** React 19, TypeScript, Vite
*   **AI Model:** Google GenAI SDK (`@google/genai`) - **Gemini 3 Flash Preview** & **Gemini 2.5**
*   **Backend:** Firebase v12 (Auth, Realtime Database)
*   **Visualization:** 
    *   `mermaid` (Graphs & Charts)
    *   `katex` (Advanced Math/LaTeX)
    *   `framer-motion` (Cinematic Animations)
    *   `tsparticles` (Meteor Backgrounds)
*   **Parsing:** `pdfjs-dist`, `mammoth` (DOCX)

---

## ⚙️ Setup & Installation

### 1. Prerequisites
*   Node.js (v18+)
*   A Google Cloud Project with the **Gemini API** enabled.
*   A Firebase Project (for Cloud Sync).

### 2. Installation

```bash
# Clone the repository
git clone https://github.com/your-username/ai-arena.git

# Install dependencies
npm install
```

### 3. Environment Configuration

Create a `.env` file in the root directory:

```env
# Required for AI generation
API_KEY=your_google_gemini_api_key
```

*Note: Firebase configuration is located in `src/firebase.ts`. Replace the config object with your own Firebase credentials.*

### 4. Running the App

```bash
# Start development server
npm run dev
```

The app will launch at `http://localhost:5173`.

---

## 📖 Usage Protocols

1.  **Inject Data:** Drag & Drop a PDF, DOCX, Image, or **Video/Audio** file into the "Input Module".
2.  **Select Protocol:**
    *   **Analysis:** Generates the main Logic Sheet.
    *   **Lecture:** Extracts notes from media.
    *   **Strategy:** Predicts exam topics.
3.  **Engage:**
    *   Click **Nexus** to see how this doc connects to your library.
    *   Open **Buddy** to chat with the document.
4.  **Sync:** Log in via Google to persist your "Knowledge Vault" to the cloud.

---

## 🔐 Resilience & Security

*   **Error Handling:** Implements exponential backoff retry logic for API calls.
*   **Sanitization:** Robust JSON parsing and Markdown cleaning to prevent rendering crashes.
*   **Persistence:** Hybrid storage (Local + Cloud) ensures data isn't lost on refresh.

---

## 📚 Documentation

### Free-Tier Optimization Features
- **[FREE_TIER_OPTIMIZATIONS.md](FREE_TIER_OPTIMIZATIONS.md)** - Complete feature documentation
- **[TESTING_GUIDE.md](TESTING_GUIDE.md)** - How to test the new features
- **[ARCHITECTURE_GUIDE.md](ARCHITECTURE_GUIDE.md)** - Technical architecture & design patterns
- **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** - Quick facts and code reference

### Implementation Details
- **[DELIVERY_SUMMARY.md](DELIVERY_SUMMARY.md)** - What was delivered and why
- **[IMPLEMENTATION_CHECKLIST.md](IMPLEMENTATION_CHECKLIST.md)** - Deployment readiness status

---

## 📌 Quick Start: New Features

### Smart Caching (30-40% API Savings)
Upload a PDF twice → CacheDialog appears → Choose cached or fresh result

### Batch Processing (Process Unlimited Documents)
Select multiple files → Queue processes sequentially → Respects 15 RPM limit

### Offline Mode (Study Without Internet)
Go offline → Study flashcards → Changes saved locally → Auto-sync when online

**Try them now!** See [TESTING_GUIDE.md](TESTING_GUIDE.md) for instructions.

---

## 📄 License

Distributed under the MIT License.
