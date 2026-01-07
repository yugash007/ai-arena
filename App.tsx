
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Header from './components/Header';
import Loader from './components/Loader';
import CheatSheetDisplay from './components/CheatSheetDisplay';
import { 
  generateCheatSheet, 
  getExplanation, 
  generateFlashcardsFromSheet, 
  generateFlashcardsFromFile, 
  generateQuizFromFile, 
  generateQuizFromSheet, 
  fixCodeSnippet, 
  askAnything,
  extractTextFromFile,
  generateRevisionPlan,
  generateExamStrategy,
  generateConceptMap,
  generateNexusData,
  highlightConcepts,
  generateLectureNotes
} from './services/geminiService';
import type { CheatSheetSection, CheatSheetItem, OutputStyle, SavedCheatSheet, FlashCard, Quiz, CodeFixResult, ExamStrategy, NexusData } from './types';
import ExplanationModal from './components/ExplanationModal';
import SavedSheetsModal from './components/SavedSheetsModal';
import FlashcardModal from './components/FlashcardModal';
import QuizModal from './components/QuizModal';
import OutputStyleModal from './components/OutputStyleModal';
import QuizOptionsModal from './components/QuizOptionsModal';
import CodeFixerModal from './components/CodeFixerModal';
import RevisionPlannerModal from './components/RevisionPlannerModal';
import HeatmapModal from './components/HeatmapModal';
import HomeScreen from './components/HomeScreen';
import { getSavedCheatSheets, saveCheatSheets, getSavedActiveSheet, saveActiveSheet } from './utils/storage';
import { getErrorMessage } from './utils/errorUtils';
import { useToast } from './contexts/ToastContext';
import CodeInputModal from './components/CodeInputModal';
import AskAnythingModal from './components/AskAnythingModal';
import ExamStrategyModal from './components/ExamStrategyModal';
import ConceptMapModal from './components/ConceptMapModal';
import NexusModal from './components/NexusModal';
import StudyBuddySidebar from './components/StudyBuddySidebar';
import FeynmanModal from './components/FeynmanModal';
import { SparklesCore } from './components/ui/sparkles';
import ProfileView from './components/ProfileView';
import CacheDialog from './components/CacheDialog';
import BatchProcessingModal from './components/BatchProcessingModal';
import OfflineIndicator from './components/OfflineIndicator';
import { CacheProvider, useCache } from './contexts/CacheContext';

// Firebase Integrations
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { saveSheetToCloud, getSheetsFromCloud, deleteSheetFromCloud, getPublicSheet } from './services/firestoreService';
import { generateFileHash, getCachedCheatSheet } from './utils/cacheManager';

declare const window: any;

const AppContent: React.FC = () => {
  const { currentUser } = useAuth();
  
  const [file, setFile] = useState<File | null>(null);
  const [cachedFileText, setCachedFileText] = useState<string | null>(null);
  
  const [loadingStep, setLoadingStep] = useState<number>(0);
  const isLoading = loadingStep > 0;
  
  const { addToast } = useToast();
  
  const [activeSheet, setActiveSheet] = useState<Omit<SavedCheatSheet, 'id'> & { id?: string } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [savedSheets, setSavedSheets] = useState<SavedCheatSheet[]>([]);
  const [isDark, setIsDark] = useState<boolean>(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme ? savedTheme === 'dark' : true;
  });

  // Navigation State
  const [currentView, setCurrentView] = useState<'home' | 'profile' | 'sheet'>('home');

  // Modal States
  const [isSavedSheetsModalOpen, setIsSavedSheetsModalOpen] = useState(false);
  const [isExplanationModalOpen, setIsExplanationModalOpen] = useState(false);
  const [isFlashcardModalOpen, setIsFlashcardModalOpen] = useState(false);
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [isStyleModalOpen, setIsStyleModalOpen] = useState(false);
  const [isQuizOptionsModalOpen, setIsQuizOptionsModalOpen] = useState(false);
  const [isCodeFixerModalOpen, setIsCodeFixerModalOpen] = useState(false);
  const [isRevisionPlannerModalOpen, setIsRevisionPlannerModalOpen] = useState(false);
  const [isHeatmapModalOpen, setIsHeatmapModalOpen] = useState(false);
  const [isCodeInputModalOpen, setIsCodeInputModalOpen] = useState(false);
  const [isAskAnythingModalOpen, setIsAskAnythingModalOpen] = useState(false);
  const [isExamStrategyModalOpen, setIsExamStrategyModalOpen] = useState(false);
  const [isConceptMapModalOpen, setIsConceptMapModalOpen] = useState(false);
  const [isNexusModalOpen, setIsNexusModalOpen] = useState(false);
  const [isStudyBuddyOpen, setIsStudyBuddyOpen] = useState(false);
  const [isFeynmanModalOpen, setIsFeynmanModalOpen] = useState(false);

  // Content States
  const [explanationModalContent, setExplanationModalContent] = useState<{ title: string; explanation: string } | null>(null);
  const [isExplanationModalLoading, setIsExplanationModalLoading] = useState(false);
  const [flashcards, setFlashcards] = useState<FlashCard[]>([]);
  const [isGeneratingFlashcards, setIsGeneratingFlashcards] = useState(false);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [quizGenerationSource, setQuizGenerationSource] = useState<'file' | 'sheet' | null>(null);
  const [codeFixerContent, setCodeFixerContent] = useState<{ originalCode: string; result: CodeFixResult | null }>({ originalCode: '', result: null });
  const [isCodeFixerLoading, setIsCodeFixerLoading] = useState(false);
  const [askAnythingContent, setAskAnythingContent] = useState<{ question: string | null; answer: string | null; sources: any[] }>({ question: null, answer: null, sources: [] });
  const [isAskAnythingLoading, setIsAskAnythingLoading] = useState(false);
  const [examStrategy, setExamStrategy] = useState<ExamStrategy | null>(null);
  const [conceptMapData, setConceptMapData] = useState<string | null>(null);
  
  const [nexusData, setNexusData] = useState<NexusData | null>(null);
  const [isNexusLoading, setIsNexusLoading] = useState(false);
  const [isHighlighting, setIsHighlighting] = useState(false);

  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Caching & Batch Processing States
  const [currentFileHash, setCurrentFileHash] = useState<string | null>(null);
  const [isCacheDialogOpen, setIsCacheDialogOpen] = useState(false);
  const [isBatchProcessingModalOpen, setIsBatchProcessingModalOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Theme Sync
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  // Online/Offline Detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      addToast('Connection restored', 'success');
    };
    const handleOffline = () => {
      setIsOnline(false);
      addToast('You are offline - changes will be saved locally', 'error');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [addToast]);

  // Handle URL Params (Sharing)
  useEffect(() => {
      const handleUrlParams = async () => {
          const params = new URLSearchParams(window.location.search);
          const shareId = params.get('share');
          
          if (shareId) {
              setLoadingStep(1); // Fake loading state
              try {
                  const publicSheet = await getPublicSheet(shareId);
                  if (publicSheet) {
                      setActiveSheet(publicSheet);
                      setCurrentView('sheet');
                      addToast("Loaded shared sheet", "success");
                  } else {
                      addToast("Shared sheet not found or private.", "error");
                  }
              } catch (e) {
                  addToast("Failed to load shared sheet.", "error");
              } finally {
                  setLoadingStep(0);
                  // Clean URL
                  window.history.replaceState({}, document.title, window.location.pathname);
              }
          }
      };
      
      handleUrlParams();
  }, [addToast]);

  // Load Logic (Hybrid: Cloud > Local)
  useEffect(() => {
    const loadData = async () => {
        if (currentUser) {
            try {
                const cloudSheets = await getSheetsFromCloud(currentUser.uid);
                setSavedSheets(cloudSheets);
            } catch (error) {
                console.error("Failed to load cloud sheets", error);
                addToast("Could not sync with cloud library.", "error");
                setSavedSheets(getSavedCheatSheets()); // Fallback
            }
        } else {
            setSavedSheets(getSavedCheatSheets());
        }
    };
    loadData();

    const savedActive = getSavedActiveSheet();
    if (savedActive && !activeSheet) { // Only load local if not already loaded from share param
        setActiveSheet(savedActive);
        setCurrentView('sheet');
    }
    setIsInitialLoad(false);
  }, [currentUser, addToast]);

  useEffect(() => {
    if (!isInitialLoad) {
      saveActiveSheet(activeSheet);
    }
  }, [activeSheet, isInitialLoad]);

  // Determine current view logic
  useEffect(() => {
    if (activeSheet && currentView === 'home') {
        setCurrentView('sheet');
    } else if (!activeSheet && currentView === 'sheet') {
        setCurrentView('home');
    }
  }, [activeSheet]);

  // File Handling with Cache Check
  const handleFileSelect = async (selectedFile: File) => {
    setFile(selectedFile);
    setCachedFileText(null);
    
    // Check for cached version
    try {
      const hash = await generateFileHash(selectedFile);
      setCurrentFileHash(hash);
      
      const cached = getCachedCheatSheet(hash);
      if (cached) {
        setIsCacheDialogOpen(true);
      }
    } catch (error) {
      console.warn('Failed to check cache:', error);
    }

    try {
        const text = await extractTextFromFile(selectedFile);
        if (text) setCachedFileText(text);
    } catch (e) {
        console.warn("Background text extraction failed:", e);
    }
  };

  const wrapApiCall = async (fn: () => Promise<any>) => {
    try {
      return await fn();
    } catch (err: any) {
      if (err?.message?.includes("Requested entity was not found.")) {
        addToast("Project configuration missing. Please select an API key.", "error");
        if (window.aistudio?.openSelectKey) {
           await window.aistudio.openSelectKey();
        }
      } else {
        throw err;
      }
    }
  };

  // --- Features ---

  const handleGenerateCheatSheet = async (style: OutputStyle) => {
    if (!file) {
      addToast("Please select a file first.", "error");
      return;
    }
    setIsStyleModalOpen(false);
    setLoadingStep(1);
    setActiveSheet(null);
    setIsEditing(false);

    try {
      const content = await wrapApiCall(() => generateCheatSheet(file, style, setLoadingStep));
      if (content) {
          // Cache the result
          if (currentFileHash) {
            const cacheManager = await import('./utils/cacheManager');
            cacheManager.cacheCheatSheet(currentFileHash, file.name, content, file.size);
          }
          setActiveSheet({ filename: file.name, content, timestamp: Date.now() });
          setCurrentView('sheet');
      }
    } catch (err) {
      console.error(err);
      addToast(getErrorMessage(err), "error");
    } finally {
      setLoadingStep(0);
    }
  };

  const handleGenerateLectureNotes = async () => {
    if (!file) {
        addToast("Please upload an audio or video file first.", "error");
        return;
    }
    setLoadingStep(1);
    setActiveSheet(null);
    try {
        const content = await wrapApiCall(() => generateLectureNotes(file, setLoadingStep));
        if (content) {
            setActiveSheet({ filename: file.name + ' (Lecture)', content, timestamp: Date.now() });
            setCurrentView('sheet');
        }
    } catch (err) {
        addToast(getErrorMessage(err), "error");
    } finally {
        setLoadingStep(0);
    }
  }

  const handleGenerateFlashcardsDirectly = async () => {
    if (!file) {
        addToast("Please select a file first.", "error");
        return;
    }
    setLoadingStep(1);
    setActiveSheet(null);
    setIsEditing(false);

    try {
        const generatedCards = await wrapApiCall(() => generateFlashcardsFromFile(file, setLoadingStep));
        if (generatedCards) {
          setFlashcards(generatedCards);
          setIsFlashcardModalOpen(true);
        }
    } catch (err) {
        console.error(err);
        addToast(getErrorMessage(err), "error");
    } finally {
        setLoadingStep(0);
    }
  };

  const handleGenerateQuizFromFile = () => {
    if (!file) {
        addToast("Please select a file first.", "error");
        return;
    }
    setQuizGenerationSource('file');
    setIsQuizOptionsModalOpen(true);
  };
  
  const handleStartQuizGeneration = async (numQuestions: number) => {
    setIsQuizOptionsModalOpen(false);
    const source = quizGenerationSource;
    setQuizGenerationSource(null);

    const generateFn = source === 'file' 
      ? () => {
          if (!file) throw new Error("Source file is missing.");
          setLoadingStep(1);
          setActiveSheet(null);
          setIsEditing(false);
          return generateQuizFromFile(file, numQuestions, setLoadingStep);
      }
      : () => {
          if (!activeSheet) throw new Error("Source cheat sheet is missing.");
          setIsGeneratingQuiz(true);
          return generateQuizFromSheet(activeSheet.content, numQuestions);
      };

    try {
        const generatedQuiz = await wrapApiCall(generateFn);
        if (generatedQuiz) {
          setQuiz(generatedQuiz);
          setIsQuizModalOpen(true);
        }
    } catch (err) {
        console.error(err);
        addToast(getErrorMessage(err), "error");
    } finally {
        setLoadingStep(0);
        setIsGeneratingQuiz(false);
    }
  };
  
  const handleSaveSheet = async () => {
    if (!activeSheet) return;
    
    let savedSheet: SavedCheatSheet;
    let isUpdate = false;

    if (activeSheet.id) {
      isUpdate = true;
      // Preserve existing visibility/author if updating
      const existing = savedSheets.find(s => s.id === activeSheet.id);
      savedSheet = { 
          ...activeSheet, 
          id: activeSheet.id, 
          timestamp: Date.now(),
          visibility: existing?.visibility || 'private',
          authorId: existing?.authorId || currentUser?.uid
      } as SavedCheatSheet;
    } else {
      savedSheet = { 
          ...activeSheet, 
          id: uuidv4(), 
          timestamp: Date.now(), 
          visibility: 'private',
          authorId: currentUser?.uid,
          authorName: currentUser?.displayName || 'Anonymous'
      } as SavedCheatSheet;
    }
    
    // Persistence Logic
    try {
        if (currentUser) {
            await saveSheetToCloud(currentUser.uid, savedSheet);
            
            const updatedSheets = isUpdate 
                ? savedSheets.map(sheet => sheet.id === savedSheet.id ? savedSheet : sheet)
                : [...savedSheets, savedSheet];
            
            setSavedSheets(updatedSheets);
            setActiveSheet(savedSheet);
            addToast(isUpdate ? "Synced to Cloud!" : "Saved to Cloud!", "success");
        } else {
            const updatedSheets = isUpdate 
                ? savedSheets.map(sheet => sheet.id === savedSheet.id ? savedSheet : sheet)
                : [...savedSheets, savedSheet];
                
            setSavedSheets(updatedSheets);
            setActiveSheet(savedSheet);
            saveCheatSheets(updatedSheets);
            addToast(isUpdate ? "Updated locally." : "Saved locally.", "success");
        }
        setIsEditing(false);
    } catch (error) {
        console.error("Save failed:", error);
        addToast("Failed to save. Check internet connection.", "error");
    }
  };

  const handleUpdateSheet = (updatedSheet: SavedCheatSheet) => {
      // Update local state when sheet is updated via ShareModal etc
      const updatedSheets = savedSheets.map(s => s.id === updatedSheet.id ? updatedSheet : s);
      setSavedSheets(updatedSheets);
      setActiveSheet(updatedSheet);
  };

  const handleLoadSheet = (sheetId: string) => {
    const sheetToLoad = savedSheets.find(sheet => sheet.id === sheetId);
    if (sheetToLoad) {
      setActiveSheet(sheetToLoad);
      setCurrentView('sheet');
      setIsSavedSheetsModalOpen(false);
      setIsEditing(false);
      setFile(null);
      setCachedFileText(null);
      addToast(`Loaded "${sheetToLoad.filename}"`, "success");
    }
  };

  const handleDeleteSheet = async (sheetId: string) => {
    const updatedSheets = savedSheets.filter(sheet => sheet.id !== sheetId);
    
    try {
        if (currentUser) {
            await deleteSheetFromCloud(currentUser.uid, sheetId);
            setSavedSheets(updatedSheets); // Only update UI on success
            addToast("Deleted from Cloud.", "success");
        } else {
            setSavedSheets(updatedSheets);
            saveCheatSheets(updatedSheets);
            addToast("Deleted locally.", "success");
        }
        
        if (activeSheet?.id === sheetId) {
            setActiveSheet(null);
            setCurrentView('home');
        }
    } catch (error) {
        addToast("Failed to delete from cloud.", "error");
    }
  };

  const handleSheetChange = (updatedContent: CheatSheetSection[]) => {
    if (activeSheet) {
      setActiveSheet(prev => prev ? { ...prev, content: updatedContent } : null);
    }
  };

  const handleExplainClick = async (item: CheatSheetItem) => {
    setExplanationModalContent(null);
    setIsExplanationModalLoading(true);
    setIsExplanationModalOpen(true);
    try {
      const explanation = await wrapApiCall(() => getExplanation(item));
      if (explanation) setExplanationModalContent({ title: item.title, explanation });
    } catch (err) {
       setExplanationModalContent({ title: item.title, explanation: "Sorry, I couldn't generate an explanation." });
    } finally {
        setIsExplanationModalLoading(false);
    }
  };
  
  const handleFixCodeClick = async (code: string, language: string = 'javascript') => {
      setCodeFixerContent({ originalCode: code, result: null });
      setIsCodeFixerLoading(true);
      setIsCodeFixerModalOpen(true);
      try {
          const result = await wrapApiCall(() => fixCodeSnippet(code, language));
          if (result) setCodeFixerContent({ originalCode: code, result });
      } catch (err) {
          addToast(getErrorMessage(err), "error");
          setIsCodeFixerModalOpen(false);
      } finally {
          setIsCodeFixerLoading(false);
      }
  };

  const handleGenerateFlashcardsFromSheet = async () => {
    if (!activeSheet || activeSheet.content.length === 0) {
        addToast("Cannot generate flash cards from an empty sheet.", "error");
        return;
    }
    setIsGeneratingFlashcards(true);
    try {
        const generatedCards = await wrapApiCall(() => generateFlashcardsFromSheet(activeSheet.content));
        if (generatedCards) {
          setFlashcards(generatedCards);
          setIsFlashcardModalOpen(true);
        }
    } catch (err) {
        console.error(err);
        addToast(getErrorMessage(err), "error");
    } finally {
        setIsGeneratingFlashcards(false);
    }
  };
  
  const handleGenerateQuizFromSheet = () => {
    if (!activeSheet || activeSheet.content.length === 0) {
        addToast("Cannot generate a quiz from an empty sheet.", "error");
        return;
    }
    setQuizGenerationSource('sheet');
    setIsQuizOptionsModalOpen(true);
  };

  const handleStartNew = () => {
    setActiveSheet(null);
    setCurrentView('home');
    setFile(null);
    setCachedFileText(null);
    setIsEditing(false);
  }
  
  const handleAskAnything = async (question: string, mode: 'standard' | 'socratic' = 'standard', useLibrary: boolean = false) => {
    setIsAskAnythingLoading(true);
    setAskAnythingContent({ question: null, answer: null, sources: [] });
    try {
        let context: string | undefined = undefined;
        
        if (useLibrary) {
            context = savedSheets.map(sheet => 
              `--- Source: ${sheet.filename} (Saved Cheat Sheet) ---\n` + 
              sheet.content.map(s => `## ${s.sectionTitle}\n${s.items.map(i => `### ${i.title}\n${i.content}`).join('\n')}`).join('\n')
            ).join('\n\n');
            
            if (!context && file) {
                 context = cachedFileText || await extractTextFromFile(file);
            }
        } else if (file) {
            context = cachedFileText || await extractTextFromFile(file);
        } else if (activeSheet) {
            context = JSON.stringify(activeSheet.content);
        }

        const result = await wrapApiCall(() => askAnything(question, context, mode));
        if (result) {
            setAskAnythingContent({ 
                question, 
                answer: result.text, 
                sources: result.sources 
            });
        }
    } catch (err) {
        addToast(getErrorMessage(err), "error");
        setAskAnythingContent({ question: null, answer: null, sources: [] });
        setIsAskAnythingModalOpen(false);
    } finally {
        setIsAskAnythingLoading(false);
    }
  };

  const handleGenerateStrategy = async () => {
    if (!file) {
        addToast("Please upload a file to generate an exam strategy.", "error");
        return;
    }
    setLoadingStep(1);
    setExamStrategy(null);
    try {
        const strategy = await wrapApiCall(() => generateExamStrategy(file));
        if (strategy) {
            setExamStrategy(strategy);
            setIsExamStrategyModalOpen(true);
        }
    } catch (err) {
        addToast(getErrorMessage(err), "error");
    } finally {
        setLoadingStep(0);
    }
  };

  const handleGenerateConceptMap = async () => {
    if (!file) {
        addToast("Please upload a file to generate a concept map.", "error");
        return;
    }
    setConceptMapData(null);
    setIsConceptMapModalOpen(true);
    setLoadingStep(2); 
    try {
        const mapData = await wrapApiCall(() => generateConceptMap(file));
        setConceptMapData(mapData);
    } catch (err) {
        addToast(getErrorMessage(err), "error");
        setIsConceptMapModalOpen(false);
    } finally {
        setLoadingStep(0);
    }
  };

  const handleGenerateNexus = async () => {
    setIsNexusLoading(true);
    try {
        const data = await wrapApiCall(() => generateNexusData(savedSheets));
        setNexusData(data);
    } catch (err) {
        addToast(getErrorMessage(err), "error");
    } finally {
        setIsNexusLoading(false);
    }
  };

  const handleSmartHighlight = async () => {
    if (!activeSheet || activeSheet.content.length === 0) return;
    setIsHighlighting(true);
    try {
        const highlightedContent = await wrapApiCall(() => highlightConcepts(activeSheet.content));
        if (highlightedContent) {
            handleSheetChange(highlightedContent);
            addToast("Key concepts highlighted!", "success");
        }
    } catch (err) {
        addToast(getErrorMessage(err), "error");
    } finally {
        setIsHighlighting(false);
    }
  };

  return (
    <div className="min-h-screen text-foreground font-sans bg-background relative overflow-hidden selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black">
      
      {/* Global Sparkles Background - Only on Home Screen */}
      {currentView === 'home' && !isLoading && (
        <div className="fixed inset-0 w-full h-full pointer-events-none z-0">
            <SparklesCore
                id="tsparticlesfullpage"
                background="transparent"
                minSize={0.6}
                maxSize={1.4}
                particleDensity={100}
                className="w-full h-full"
                particleColor={isDark ? "#ffffff" : "#000000"}
                speed={0.5}
            />
        </div>
      )}

      <Header 
        onOpenSavedSheets={() => setIsSavedSheetsModalOpen(true)} 
        onOpenNexus={() => setIsNexusModalOpen(true)}
        onToggleStudyBuddy={() => setIsStudyBuddyOpen(!isStudyBuddyOpen)}
        isDark={isDark}
        toggleTheme={() => setIsDark(!isDark)}
        hasSavedSheets={savedSheets.length > 0}
        onOpenProfile={() => setCurrentView('profile')}
      />
      
      <div className="flex relative z-10">
          <main className={`container mx-auto px-4 py-8 transition-all duration-300 ${isStudyBuddyOpen ? 'mr-[400px]' : ''}`}>
            
            {/* View Routing */}
            {currentView === 'home' && !isLoading && (
                <HomeScreen
                  file={file}
                  onFileSelect={handleFileSelect}
                  onGenerateCheatSheet={() => setIsStyleModalOpen(true)}
                  onGenerateFormulaSheet={() => handleGenerateCheatSheet('Formula-heavy')}
                  onGenerateFlashcards={handleGenerateFlashcardsDirectly}
                  onGenerateQuiz={handleGenerateQuizFromFile}
                  onOpenHeatmap={() => setIsHeatmapModalOpen(true)}
                  onOpenCodeDebugger={() => setIsCodeInputModalOpen(true)}
                  onOpenAskAnything={() => setIsAskAnythingModalOpen(true)}
                  onGenerateStrategy={handleGenerateStrategy}
                  onGenerateConceptMap={handleGenerateConceptMap}
                  onGenerateLectureNotes={handleGenerateLectureNotes}
                  onOpenFeynman={() => setIsFeynmanModalOpen(true)}
                />
            )}

            {currentView === 'profile' && !isLoading && (
                <ProfileView onBack={() => setCurrentView(activeSheet ? 'sheet' : 'home')} />
            )}
            
            <div className="mt-4">
              {isLoading && <Loader step={loadingStep} />}
              {currentView === 'sheet' && activeSheet && !isLoading && (
                <div className="animate-fade-in">
                  <CheatSheetDisplay 
                    key={activeSheet.id}
                    sheet={activeSheet}
                    isEditing={isEditing}
                    onToggleEdit={() => setIsEditing(!isEditing)}
                    onContentChange={handleSheetChange}
                    onExplain={handleExplainClick} 
                    onFixCode={handleFixCodeClick}
                    onGenerateFlashcards={handleGenerateFlashcardsFromSheet}
                    isGeneratingFlashcards={isGeneratingFlashcards}
                    onGenerateQuiz={handleGenerateQuizFromSheet}
                    isGeneratingQuiz={isGeneratingQuiz}
                    onGeneratePlan={() => setIsRevisionPlannerModalOpen(true)}
                    onSave={handleSaveSheet}
                    onStartNew={handleStartNew}
                    onOpenAskAnything={() => setIsAskAnythingModalOpen(true)}
                    onSmartHighlight={handleSmartHighlight}
                    isHighlighting={isHighlighting}
                    onUpdateSheet={handleUpdateSheet}
                  />
                </div>
              )}
            </div>
          </main>

          <StudyBuddySidebar 
              isOpen={isStudyBuddyOpen} 
              onClose={() => setIsStudyBuddyOpen(false)} 
              activeSheet={activeSheet}
          />
      </div>
      
      {/* Modals */}
      <OutputStyleModal isOpen={isStyleModalOpen} onClose={() => setIsStyleModalOpen(false)} onGenerate={handleGenerateCheatSheet} isLoading={isLoading} />
      <QuizOptionsModal isOpen={isQuizOptionsModalOpen} onClose={() => setIsQuizOptionsModalOpen(false)} onGenerate={handleStartQuizGeneration} />
      <ExplanationModal isOpen={isExplanationModalOpen} onClose={() => setIsExplanationModalOpen(false)} title={explanationModalContent?.title} explanation={explanationModalContent?.explanation} isLoading={isExplanationModalLoading} />
      <CodeFixerModal isOpen={isCodeFixerModalOpen} onClose={() => setIsCodeFixerModalOpen(false)} content={codeFixerContent} isLoading={isCodeFixerLoading} />
      <RevisionPlannerModal isOpen={isRevisionPlannerModalOpen} onClose={() => setIsRevisionPlannerModalOpen(false)} sheetContent={activeSheet?.content || []} />
      <HeatmapModal isOpen={isHeatmapModalOpen} onClose={() => setIsHeatmapModalOpen(false)} />
      <SavedSheetsModal isOpen={isSavedSheetsModalOpen} onClose={() => setIsSavedSheetsModalOpen(false)} sheets={savedSheets} onLoad={handleLoadSheet} onDelete={handleDeleteSheet} />
      <FlashcardModal isOpen={isFlashcardModalOpen} onClose={() => setIsFlashcardModalOpen(false)} cards={flashcards} />
      <QuizModal isOpen={isQuizModalOpen} onClose={() => setIsQuizModalOpen(false)} quiz={quiz} />
      <CodeInputModal isOpen={isCodeInputModalOpen} onClose={() => setIsCodeInputModalOpen(false)} onDebug={(code, language) => { setIsCodeInputModalOpen(false); handleFixCodeClick(code, language); }} />
      <AskAnythingModal isOpen={isAskAnythingModalOpen} onClose={() => { setIsAskAnythingModalOpen(false); setAskAnythingContent({ question: null, answer: null, sources: [] }); }} onAsk={handleAskAnything} isLoading={isAskAnythingLoading} answer={askAnythingContent.answer} sources={askAnythingContent.sources} question={askAnythingContent.question} onAskAnother={() => setAskAnythingContent({ question: null, answer: null, sources: [] })} contextName={file?.name || activeSheet?.filename} hasLibrary={savedSheets.length > 0} />
      <ExamStrategyModal isOpen={isExamStrategyModalOpen} onClose={() => setIsExamStrategyModalOpen(false)} strategy={examStrategy} />
      <ConceptMapModal isOpen={isConceptMapModalOpen} onClose={() => setIsConceptMapModalOpen(false)} mapData={conceptMapData} isLoading={isLoading} />
      <NexusModal isOpen={isNexusModalOpen} onClose={() => setIsNexusModalOpen(false)} data={nexusData} isLoading={isNexusLoading} onGenerate={handleGenerateNexus} />
      <FeynmanModal isOpen={isFeynmanModalOpen} onClose={() => setIsFeynmanModalOpen(false)} />

      {/* New Features: Cache Dialog, Batch Processing, Offline Indicator */}
      <CacheDialog
        isOpen={isCacheDialogOpen}
        filename={file?.name || 'document'}
        cachedAt={Date.now()}
        onUseCached={() => {
          if (currentFileHash) {
            const cached = getCachedCheatSheet(currentFileHash);
            if (cached) {
              setActiveSheet({ filename: file?.name || 'document', content: cached, timestamp: Date.now() });
              setCurrentView('sheet');
              addToast('Loaded from cache - saved an API call!', 'success');
            }
          }
          setIsCacheDialogOpen(false);
        }}
        onGenerateNew={() => {
          setIsCacheDialogOpen(false);
          handleGenerateCheatSheet('Standard');
        }}
        isLoading={isLoading}
      />

      <BatchProcessingModal
        isOpen={isBatchProcessingModalOpen}
        onClose={() => setIsBatchProcessingModalOpen(false)}
        queue={[]}
        isProcessing={false}
        onStartProcessing={() => {
          // Batch processing will be triggered from a different component
        }}
      />

      <OfflineIndicator
        isOnline={isOnline}
        onSyncClick={() => {
          // Sync offline changes when user clicks button
          addToast('Syncing offline changes...', 'success');
        }}
      />

      <footer className="text-center py-8 text-xs font-semibold text-muted-foreground uppercase tracking-widest no-print relative z-10">
          <p>AI Arena | Intelligence Amplified</p>
      </footer>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
