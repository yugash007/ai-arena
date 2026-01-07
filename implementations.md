
# AI Arena | Technical Implementation Documentation

This document outlines the architectural decisions, feature logic, and technology stack for every component of the AI Arena platform.

---

## 1. Core Architecture

**Technology Stack:**
*   **Frontend Framework:** React 19 (Functional Components, Hooks).
*   **Build Tool:** Vite (ESM-based HMR).
*   **Language:** TypeScript (Strict typing for AI response schemas).
*   **Styling:** Tailwind CSS (Utility-first), Custom CSS Variables for theming.
*   **AI Engine:** Google GenAI SDK (`@google/genai`) targeting Gemini 1.5 Flash/Pro and 2.5 models.
*   **Backend/Auth:** Firebase v12 (Auth, Realtime Database).

---

## 2. Input Module & Data Ingestion

### File Processing (`FileUpload.tsx`, `geminiService.ts`)
**How it works:**
The app accepts various file types. Before sending data to the AI, it must be normalized.
1.  **PDFs:** Uses `pdfjs-dist` to render the PDF in a worker thread. We extract text strings layer by layer and inject `--- Page X ---` delimiters to give the AI spatial awareness of the document structure.
2.  **DOCX:** Uses `mammoth.js` to convert the XML-based Word format into raw text strings.
3.  **Images/Audio/Video:** Uses the browser's `FileReader` API to convert files into **Base64** strings. These strings are passed to Gemini's `inlineData` parameter, leveraging its native multimodal capabilities (no external transcription API is used).

**Tech Used:**
*   `pdfjs-dist`: Client-side PDF text extraction.
*   `mammoth`: Client-side DOCX parsing.
*   `FileReader API`: Binary to Base64 conversion.

---

## 3. Analytical Workbench (Cheat Sheet Engine)

### Logic Matrix Generation (`geminiService.ts`)
**How it works:**
The core feature turns chaos into order.
1.  **Prompt Engineering:** We inject a "Persona" (Senior Staff Engineer) and a specific `OutputStyle` (Concise, Detailed, etc.) into the prompt.
2.  **Schema Enforcement:** We use Gemini's `responseSchema` configuration to strictly enforce a valid JSON output structure (Sections -> Items -> Title/Content). This prevents parsing errors common with LLMs.
3.  **Retry Logic:** An exponential backoff wrapper (`retryOperation`) handles 429 (Rate Limit) and 503 (Service Unavailable) errors automatically.

### Markdown & Math Rendering (`markdownParser.ts`, `CheatSheetDisplay.tsx`)
**How it works:**
The JSON content returned by AI contains Markdown and LaTeX.
1.  **Custom Parser:** A regex-based parser (`parseMarkdown`) converts Markdown syntax (bold, italic, code blocks) into HTML.
2.  **Sanitization:** It aggressively escapes HTML tags to prevent XSS while preserving formatting.
3.  **LaTeX:** Math equations (`$$...$$`) are preserved and rendered using `KaTeX`.
4.  **Syntax Highlighting:** Code blocks are wrapped in specific classes for styling.

**Tech Used:**
*   `KaTeX`: Fast math rendering.
*   `Regex`: Custom markdown lexer.

### Visual Intelligence (Mermaid Diagrams)
**How it works:**
The prompt explicitly instructs Gemini to "Think Visually". If a concept involves a process or hierarchy, the AI outputs a **Mermaid.js** graph definition inside a code block.
1.  **Extraction:** The frontend regex identifies ` ```mermaid ... ``` ` blocks.
2.  **Rendering:** The `MermaidDiagram` component cleans the string (fixing common AI formatting errors like missing newlines) and renders it into an SVG.

**Tech Used:**
*   `mermaid`: Diagram generation from text.

---

## 4. The Nexus (Knowledge Topology)

### Global Graph Generation (`NexusModal.tsx`)
**How it works:**
This visualizes the user's entire library.
1.  **Aggregation:** The app aggregates summaries of *all* saved cheat sheets into a single large context window.
2.  **Topological Analysis:** Gemini is asked to generate a `graph TD` (Top-Down) structure linking documents based on shared semantic concepts.
3.  **Interactive Canvas:** The resulting SVG is placed in a pannable/zoomable container (`ConceptMapModal` logic) using mouse event listeners for drag-and-drop navigation.

**Tech Used:**
*   `mermaid`: Graph rendering.
*   `React Refs`: For direct DOM manipulation of the canvas.

### Smart Study Path
**How it works:**
Alongside the graph, Gemini generates a linear "Session Plan". It sorts documents by dependency (Prerequisites first) and assigns a status (Pending/Mastered), effectively gamifying the curriculum.

---

## 5. Neural Flash (Active Recall System)

### Card Generation & SRS Algorithm (`FlashcardModal.tsx`)
**How it works:**
1.  **Generation:** Gemini analyzes the active document and extracts Q&A pairs into a JSON array.
2.  **SRS Logic:** A custom implementation of a **Spaced Repetition System** (inspired by SuperMemo-2).
    *   When a user rates a card (Again, Hard, Good, Easy), the algorithm calculates the `nextReview` timestamp and an `e-factor` (easiness factor).
    *   Cards are sorted so "due" cards appear first.

**Tech Used:**
*   CSS `transform-style: preserve-3d`: For the performant card flip animation.
*   `uuid`: Unique ID generation for tracking card stats.

---

## 6. Diagnostic Engine (Quiz & Weakness Detector)

### Adaptive Quizzing (`QuizModal.tsx`)
**How it works:**
1.  **Distractor Generation:** The AI is prompted to generate "plausible distractors" (wrong answers) to make the quiz challenging.
2.  **State Management:** A `useReducer` manages complex quiz states (Selection, Answer Reveal, Score Tracking, Slide Animations).

### Weakness Analysis
**How it works:**
Upon quiz completion, if the user answers incorrectly:
1.  The app collects the specific questions answered wrong.
2.  It sends *only* those questions back to Gemini asking for a "Root Cause Analysis".
3.  Gemini returns a personalized study tip explaining *why* the user likely failed those specific concepts.

---

## 7. Code Debugger (`CodeFixerModal.tsx`)

### Automated Refactoring & Diffing
**How it works:**
1.  **Analysis:** The user pastes broken code. Gemini returns:
    *   `corrected_code`: The fixed version.
    *   `explanation`: What was wrong.
2.  **Visual Diffing:** We implemented a custom **Diff Algorithm** in TypeScript (`generateLineDiff` & `generateCharacterDiff`).
    *   It calculates the Longest Common Subsequence (LCS).
    *   It reconstructs the text with `+` (Green) for additions and `-` (Red) for deletions.
    *   This runs entirely client-side to visualize changes line-by-line or character-by-character.

---

## 8. Persistent Study Buddy (`StudyBuddySidebar.tsx`)

### Context Injection & Chat Memory
**How it works:**
1.  **Sidecar Architecture:** The chat lives in a dedicated sidebar that resizes the main viewport, allowing side-by-side work.
2.  **Context Injection:** When a user opens a document, the app silently pushes a system message to the chat history: *"Context loaded: [Document Name]"*.
3.  **Persistence:** Chat history is saved to `localStorage` (`ai_study_buddy_history`), so the conversation continues even after a page refresh.

**Tech Used:**
*   `ai.chats.create`: Uses Gemini's multi-turn chat capability.

---

## 9. Prediction Engine (Exam Strategy)

### Heatmap & Strategy (`geminiService.ts`, `HeatmapModal.tsx`)
**How it works:**
1.  **Multi-Doc Processing:** Accepts multiple past exam files simultaneously.
2.  **Frequency Analysis:** Gemini scans across all files to identify recurring keywords and concepts.
3.  **Visualization:** The frontend renders this data as a "Heatmap" (Frequency bars) and allows users to manually tag their confidence level against these topics.

---

## 10. Small Features & Utilities

*   **Smart Highlight:** Sends the cheat sheet content back to Gemini asking to wrap the top 20% most important sentences in `==` markers. The markdown parser renders these as glowing yellow highlights.
*   **Voice Mode:** Uses the browser's native **Web Speech API** (`SpeechSynthesis`) to read the cheat sheet aloud for auditory learners.
*   **Theme Engine:** Uses Tailwind's `dark` mode strategy. State is persisted in `localStorage`.
*   **Toast System:** A custom Context Provider (`ToastContext`) that manages a queue of notifications, rendering them via a React Portal to ensure they appear above all other z-indices.
*   **Meteor Background:** A canvas-based particle system (`MeteorBackground.tsx`) that renders moving nodes and connections, simulating a neural network.

---

## 11. Security & Resilience

*   **API Key Protection:** The API key is accessed via `process.env`. In a production build, this would be proxied, but for this client-side demo, strictly structured calls prevent prompt injection.
*   **JSON Resilience:** A robust `validateJson` utility handles common LLM errors (trailing commas, unescaped newlines) by attempting multiple regex-based fixes before failing.
*   **Cloud Sync:** Firebase Authentication and Realtime Database provide optional cloud storage. The app works fully offline (local storage) if the user chooses not to log in.
