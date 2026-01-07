
# AI Arena

**AI Arena** is an intelligent study companion powered by Google Gemini AI that transforms documents, lectures, and study materials into structured, actionable learning tools. Built for students and professionals in engineering, computer science, medicine, and beyond.

[![Live Demo](https://img.shields.io/badge/demo-live-success)](https://ai-study-arena.vercel.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## Features

### 📚 Document Analysis & Cheat Sheets
- Upload PDFs, DOCX, TXT, images, audio, or video files
- Generate structured cheat sheets with color-coded sections
- LaTeX support for mathematical equations
- Auto-generated Mermaid.js diagrams for complex processes
- Multiple output styles: Concise, Standard, Detailed, Formula-heavy, Definition-heavy

### 🃏 Smart Flashcards with Spaced Repetition
- Auto-generate flashcards from documents or cheat sheets
- Built-in Spaced Repetition System (SRS) algorithm
- Rating system: Again, Hard, Good, Easy
- Offline mode with automatic sync when online
- Progress tracking and performance analytics

### 🎯 AI-Powered Quiz Generation
- Generate customized quizzes from your materials
- Adaptive difficulty with plausible distractors
- Detailed explanations for correct answers
- Weakness analysis to identify knowledge gaps

### 🤖 Study Buddy Chat
- Context-aware AI assistant that understands your documents
- Persistent conversation history
- Socratic mode for guided learning
- Google Search integration for external knowledge

### 📊 Advanced Study Tools
- **Exam Heatmap**: Analyze past exams to identify recurring topics
- **Concept Maps**: Visualize relationships between ideas
- **Revision Planner**: Auto-generate study schedules based on available time
- **Exam Strategy**: Get tactical plans for approaching specific exams
- **Code Debugger**: Fix and explain code errors across multiple languages

### 🧠 The Nexus (Knowledge Graph)
- Visualize connections across all your saved documents
- Smart study path recommendations
- Gap analysis and learning insights
- Track progress through concepts (Pending → In Progress → Mastered)

### 🎙️ Multimodal Learning
- Process audio/video lecture recordings (MP3, WAV, MP4, MPEG)
- Extract timelines, key concepts, and action items
- Text-to-speech for auditory review

### ⚡ Free-Tier Optimizations
- **Smart Caching**: 30-40% reduction in API calls through intelligent document hashing
- **Batch Processing**: Queue unlimited documents while respecting rate limits
- **Multi-Key Rotation**: Fast failover across 4 API keys to bypass 15 RPM limits
- **Offline Mode**: Full flashcard functionality without internet

---

## Tech Stack

**Frontend**
- React 19 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Framer Motion for animations

**AI & Processing**
- Google Gemini API (gemini-3-flash-preview)
- PDF.js for PDF parsing
- Mammoth for DOCX extraction

**Backend & Storage**
- Firebase Authentication
- Firebase Realtime Database
- LocalStorage for offline data

**Visualization**
- Mermaid.js for diagrams
- KaTeX for mathematical notation
- Custom Markdown parser with syntax highlighting

---

## Getting Started

### Prerequisites
- Node.js 18 or higher
- Google Gemini API key ([Get one here](https://aistudio.google.com/app/apikey))
- Firebase project credentials (optional, for cloud sync)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yugash007/ai-arena.git
   cd ai-arena
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   VITE_API_KEY=your_gemini_api_key_1,your_gemini_api_key_2,your_gemini_api_key_3,your_gemini_api_key_4
   ```
   
   > **Note**: For optimal performance, use 4 comma-separated API keys to enable rotation and bypass rate limits.

4. **Update Firebase configuration** (optional)
   
   Edit `src/firebase.ts` with your Firebase project credentials if you want cloud sync functionality.

5. **Start development server**
   ```bash
   npm run dev
   ```
   
   The app will be available at `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The build output will be in the `dist/` directory.

---

## Deployment

### Deploy to Vercel

This project is optimized for Vercel deployment:

1. **Install Vercel CLI** (if not already installed)
   ```bash
   npm install -g vercel
   ```

2. **Deploy**
   ```bash
   vercel
   ```

3. **Set environment variables**
   
   Add `VITE_API_KEY` to your Vercel project settings:
   - Go to Project Settings → Environment Variables
   - Add `VITE_API_KEY` with your comma-separated Gemini API keys
   - Set for Production, Preview, and Development environments

4. **Deploy to production**
   ```bash
   vercel --prod
   ```

The included `vercel.json` configuration handles SPA routing automatically.

---

## Usage

### Quick Start Guide

1. **Upload a document**: Drag and drop a PDF, DOCX, or other supported file
2. **Choose output style**: Select how you want the information structured
3. **Generate**: Click "Generate Cheat Sheet" and wait for AI processing
4. **Save**: Save to your Knowledge Vault for future reference
5. **Study**: Use flashcards, quizzes, or chat with the AI about your content

### Using Smart Caching

When you upload the same document twice:
- A dialog appears showing the cached version
- Choose to use the cached result (instant) or regenerate (uses API quota)
- Cached results are stored for 7 days

### Batch Processing

Upload multiple files:
- They're automatically queued
- Processed sequentially with 4-second intervals
- Respects the 15 requests/minute free-tier limit
- Track progress in the Batch Processing modal

### Offline Mode

Study flashcards without internet:
- Changes are saved locally
- Blue badge shows pending sync count
- Click sync button when online to push changes to cloud

---

## Architecture

### Key Components

- **`services/geminiService.ts`**: Core AI integration with retry logic and multi-key rotation
- **`utils/cacheManager.ts`**: Document hashing and cache management
- **`utils/batchQueueManager.ts`**: Rate-limited queue processing
- **`utils/offlineFlashcardManager.ts`**: Offline change tracking and sync
- **`contexts/AuthContext.tsx`**: Firebase authentication state
- **`contexts/ToastContext.tsx`**: Global notification system

### Data Flow

1. Document upload → Hash generation → Cache check
2. If not cached: Send to Gemini API with retry logic
3. Parse and validate JSON response
4. Save to local storage + Firebase (if authenticated)
5. Render with syntax highlighting and diagram rendering

---

## Performance Optimizations

### API Efficiency
- Multi-key rotation distributes requests across 4 API keys
- Fast failover switches keys in 500ms on rate limit errors
- Exponential backoff retry with smart error handling
- Document hashing prevents duplicate processing

### Caching Strategy
- SHA-256 hashing based on filename + size + first 1KB
- 7-day cache expiration with automatic cleanup
- Size monitoring prevents localStorage overflow

### Rate Limiting
- 4-second intervals between batched requests
- Respects 15 RPM free-tier quota
- Queue persistence across page refreshes

---

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- Built with [Google Gemini API](https://ai.google.dev/)
- Powered by [React](https://react.dev/) and [Vite](https://vitejs.dev/)
- Deployed on [Vercel](https://vercel.com/)
- Icons from [Lucide](https://lucide.dev/)

---

## Support

For issues, questions, or feature requests, please [open an issue](https://github.com/yugash007/ai-arena/issues) on GitHub.

**Live Demo**: [https://ai-study-arena.vercel.app](https://ai-study-arena.vercel.app)
