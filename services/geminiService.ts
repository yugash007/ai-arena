
import { GoogleGenAI, Type, HarmCategory, HarmBlockThreshold } from "@google/genai";
import type { CheatSheetSection, CheatSheetItem, OutputStyle, FlashCard, Quiz, HeatmapResult, RevisionPlanItem, CodeFixResult, QuizQuestion, ExamStrategy, SavedCheatSheet, NexusData, ChatMessage, FeynmanResponse, ParallelUniverseResult } from '../types';
import { validateJson } from "../utils/validation";
import { v4 as uuidv4 } from 'uuid';

// The mammoth library is loaded via a script tag in index.html and is available on the window object
declare const mammoth: any;

/**
 * HACKATHON STRATEGY: Key Rotation
 * Parses the API_KEY env var. If it contains commas, it treats it as a pool of keys
 * and picks one at random. This helps bypass the 15 RPM limit on the free tier.
 */
const getAIClient = () => {
  const envKey = process.env.API_KEY;
  if (!envKey) {
    throw new Error("API_KEY environment variable not set.");
  }

  // Split by comma to support multiple keys (e.g. "key1,key2,key3")
  // Remove quotes if the user accidentally added them inside the string
  const keys = envKey.split(',').map(k => k.trim().replace(/['"]/g, ''));
  
  if (keys.length > 1) {
      // Pick a random key from the pool
      const randomIndex = Math.floor(Math.random() * keys.length);
      const randomKey = keys[randomIndex];
      console.debug(`[Swarm] Using Neural Node #${randomIndex + 1}`); 
      return new GoogleGenAI({ apiKey: randomKey });
  }

  return new GoogleGenAI({ apiKey: keys[0] });
};

// HACKATHON STRATEGY: Use Flash models exclusively for higher rate limits (RPM)
// gemini-2.5-flash or gemini-3-flash-preview have significantly higher quotas than Pro.
const MODELS = {
  COMPLEX: "gemini-3-flash-preview", 
  BASIC: "gemini-3-flash-preview",
  REASONING: "gemini-3-flash-preview"
};

const SAFETY_SETTINGS = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
];

/**
 * Retry utility with Aggressive Backoff & Fast Failover for 429 Errors
 */
async function retryOperation<T>(operation: () => Promise<T>, retries = 3, delay = 2000): Promise<T> {
  try {
    return await operation();
  } catch (error: any) {
    if (retries <= 0) throw error;
    
    const errorMsg = error?.message || '';
    const status = error?.status;

    // Check for Rate Limits (429) specifically
    const isRateLimit = status === 429 || errorMsg.includes('429') || errorMsg.includes('quota') || errorMsg.includes('RESOURCE_EXHAUSTED');
    
    // Check for temporary server errors
    const isServerError = status === 503 || errorMsg.includes('503') || errorMsg.includes('fetch failed');

    // HACKATHON STRATEGY: Fast Failover
    // If we have multiple keys and hit a rate limit, don't wait 4 seconds.
    // Retry almost immediately (500ms) to jump to the next key in the pool.
    const keys = (process.env.API_KEY || '').split(',');
    const hasMultipleKeys = keys.length > 1;

    if (isRateLimit) {
        if (hasMultipleKeys) {
            console.warn(`⚠️ Node Exhausted (429). Switching to fresh node immediately...`);
            await new Promise(resolve => setTimeout(resolve, 500)); // Fast retry
            return retryOperation(operation, retries - 1, 500);
        } else {
            // Single key mode: Must wait for the quota window to reset
            console.warn(`⚠️ Hit Rate Limit (429). Cooling down for ${delay * 2}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay * 2)); 
            return retryOperation(operation, retries - 1, delay * 2);
        }
    }
    
    if (isServerError) {
        console.warn(`API call failed (Server Error). Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return retryOperation(operation, retries - 1, delay * 1.5);
    }
    
    // If JSON parsing failed, sometimes retrying helps as the model might output correctly next time
    if (errorMsg.includes('JSON') || errorMsg.includes('empty or invalid')) {
         console.warn(`JSON/Content error. Retrying... (${retries} attempts left)`);
         return retryOperation(operation, retries - 1, delay);
    }

    throw error;
  }
}

/**
 * Helper to load PDFJS dynamically
 */
const getPdfJs = async () => {
    // @ts-ignore
    const pdfjsLib = await import('https://esm.sh/pdfjs-dist@4.4.168');
    if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@4.4.168/build/pdf.worker.mjs`;
    }
    return pdfjsLib;
}

/**
 * Extracts raw text from a file.
 * Handles PDF (with page numbers), DOCX, and TXT.
 */
export const extractTextFromFile = async (file: File): Promise<string> => {
    try {
        if (file.type === 'text/plain') {
            return await file.text();
        }

        if (file.type === 'application/pdf') {
            const pdfjsLib = await getPdfJs();
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            let fullText = '';
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map((item: any) => item.str).join(' ');
                // Inject Page Markers for Context Awareness
                fullText += `\n--- Page ${i} ---\n${pageText}\n`;
            }
            return fullText;
        }

        if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            if (typeof mammoth === 'undefined') {
                throw new Error("DOCX parser not loaded.");
            }
            const arrayBuffer = await file.arrayBuffer();
            const result = await mammoth.extractRawText({ arrayBuffer });
            return result.value;
        }
        
        // Return empty string for non-text types (audio/video/image) handled by convertFileToContentParts
        return ''; 
    } catch (error) {
        console.error("Text extraction failed:", error);
        throw new Error(`Failed to extract text from ${file.name}. Ensure the file is not corrupted.`);
    }
};

/**
 * Converts various file types into a format suitable for the Gemini API.
 */
const convertFileToContentParts = async (file: File): Promise<any[]> => {
    const isImage = file.type.startsWith('image/');
    const isAudio = file.type.startsWith('audio/');
    const isVideo = file.type.startsWith('video/');

    if (isImage || isAudio || isVideo) {
        const base64EncodedData = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
            reader.onerror = (err) => reject(err);
            reader.readAsDataURL(file);
        });

        return [{
            inlineData: {
                data: base64EncodedData,
                mimeType: file.type,
            },
        }];
    }

    // For text-based files, extract text first
    const text = await extractTextFromFile(file);
    if (!text || text.trim().length === 0) {
        // Fallback for empty text extraction
        return [{ text: " " }];
    }
    return [{ text }];
};

// --- API Functions with Retry Wrappers ---

export const generateCheatSheet = async (file: File, outputStyle: OutputStyle, onProgress?: (step: number) => void): Promise<CheatSheetSection[]> => {
    return retryOperation(async () => {
        if (onProgress) onProgress(1); // Step 1: Extraction
        const ai = getAIClient();
        const parts = await convertFileToContentParts(file);

        const styleInstruction = {
            'Concise': 'Focus strictly on high-yield formulas and key facts. Omit fluff. Maximum density.',
            'Standard': 'Balanced coverage of theory and application. Include visual diagrams where helpful.',
            'Detailed': 'Deep dive into concepts. INCLUDE Mermaid.js diagrams for processes, hierarchies, and flows.',
            'Formula-heavy': 'Prioritize mathematical derivations, constants, and algorithmic complexity (Big O).',
            'Definition-heavy': 'Focus on vocabulary, taxonomy, and core distinctions between concepts.'
        };

        const prompt = `You are a Senior Staff Engineer and Distinguished Professor.
        Analyze the attached document and generate a structured "Cheat Sheet" for a final exam.
        
        STYLE: ${styleInstruction[outputStyle]}
        
        REQUIREMENTS:
        1. Output strictly valid JSON. NO preamble. NO markdown code blocks (unless inside a string).
        2. Group concepts logically into sections.
        3. Use LaTeX for math equations. IMPORTANT: Escape backslashes in JSON strings (e.g., "\\\\frac{a}{b}").
        4. VISUAL INTELLIGENCE: For complex processes, flows, or hierarchies, include a Mermaid.js diagram definition in the content. Wrap it in \`\`\`mermaid ... \`\`\` code blocks.
           - MERMAID RULES: Use simple alphanumeric IDs (A, B, C) for nodes. Put labels in double quotes. Example: A["My Label"]. Avoid special characters in IDs.
           - STYLING: Define a class 'neural' and apply it to nodes (:::neural) to match a dark theme. ALWAYS put the 'classDef' on a separate line immediately after 'graph TD'.
        5. Do NOT hallucinate info not in the source text.
        6. For "color", use one of: blue, green, purple, orange, red, pink.
        7. IMPORTANT: Ensure all newlines inside JSON strings are escaped as \\n.
        `;
        
        if (onProgress) onProgress(2); // Step 2: Analysis
        const response = await ai.models.generateContent({
            model: MODELS.COMPLEX,
            contents: { parts: [...parts, { text: prompt }] },
            config: { 
                safetySettings: SAFETY_SETTINGS,
                responseMimeType: "application/json", 
                responseSchema: {
                    type: Type.ARRAY,
                    description: "An array of sections for the cheat sheet.",
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            sectionTitle: { type: Type.STRING },
                            color: { type: Type.STRING },
                            items: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        title: { type: Type.STRING },
                                        content: { type: Type.STRING }
                                    },
                                    required: ["title", "content"]
                                }
                            }
                        },
                        required: ["sectionTitle", "color", "items"]
                    }
                }
            }
        });
        
        if (onProgress) onProgress(3); // Step 3: Generation/Validation
        return validateJson<CheatSheetSection[]>(response.text);
    });
};

export const generateLectureNotes = async (file: File, onProgress?: (step: number) => void): Promise<CheatSheetSection[]> => {
    return retryOperation(async () => {
        if (onProgress) onProgress(1);
        const ai = getAIClient();
        const parts = await convertFileToContentParts(file);

        const prompt = `You are an expert academic transcriptionist and summarizer.
        Analyze this recording (audio or video).
        
        Tasks:
        1. Create a "Timeline of Key Events" section with timestamps (e.g., "05:30 - Introduction to Matrix Multiplication").
        2. Create a "Core Concepts" section defining the most important terms.
        3. Create a "Summary" section.
        4. Extract any specific "Action Items" or "Homework" mentioned.
        
        Output as the standard Cheat Sheet JSON format.
        `;
        
        if (onProgress) onProgress(2);
        const response = await ai.models.generateContent({
            model: MODELS.COMPLEX,
            contents: { parts: [...parts, { text: prompt }] },
            config: {
                safetySettings: SAFETY_SETTINGS,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            sectionTitle: { type: Type.STRING },
                            color: { type: Type.STRING },
                            items: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        title: { type: Type.STRING },
                                        content: { type: Type.STRING }
                                    },
                                    required: ["title", "content"]
                                }
                            }
                        },
                        required: ["sectionTitle", "color", "items"]
                    }
                }
            }
        });
        
        if (onProgress) onProgress(3);
        return validateJson<CheatSheetSection[]>(response.text);
    });
};

export const chatWithStudyBuddy = async (history: ChatMessage[], newMessage: string, context?: string): Promise<string> => {
    return retryOperation(async () => {
        const ai = getAIClient();
        
        // Construct the chat history for Gemini
        // We take the last 15 messages to keep context window manageable
        const relevantHistory = history.slice(-15);
        
        const chatContent = relevantHistory.map(msg => ({
            role: msg.role === 'model' ? 'model' : 'user',
            parts: [{ text: msg.text }]
        }));

        const safeContext = context ? context.slice(0, 100000) : '';

        const systemInstruction = `You are "Study Buddy AI", a helpful, encouraging, and highly intelligent study companion.
        
        CONTEXT:
        The user is currently studying the following material:
        "${safeContext}"
        
        ROLE:
        - Answer questions based on the context.
        - If the user is stuck, give hints (Socratic method).
        - Be concise but friendly.
        - Use Markdown for formatting.
        - If you don't know something and it's not in the context, say so, or use general knowledge but clarify it's external info.
        `;

        const chat = ai.chats.create({
            model: MODELS.COMPLEX,
            history: chatContent,
            config: {
                safetySettings: SAFETY_SETTINGS,
                systemInstruction: systemInstruction,
            }
        });

        const response = await chat.sendMessage({ message: newMessage });
        return response.text || "I'm having trouble connecting to the neural network.";
    });
};

export const getExplanation = async (item: CheatSheetItem): Promise<string> => {
    return retryOperation(async () => {
        const ai = getAIClient();
        const response = await ai.models.generateContent({
            model: MODELS.BASIC,
            contents: `You are an expert tutor. Explain the concept "${item.title}" clearly and concisely.
            
            Context Data: "${item.content}"
            
            1. Start with a simple definition.
            2. Provide a concrete, real-world engineering or scientific analogy.
            3. Explain why this concept matters in the bigger picture.
            
            Output strictly Markdown.`,
            config: {
                safetySettings: SAFETY_SETTINGS
            }
        });
        return response.text || "Could not generate explanation.";
    });
};

export const generateFlashcardsFromSheet = async (content: CheatSheetSection[]): Promise<FlashCard[]> => {
    return retryOperation(async () => {
        const ai = getAIClient();
        const response = await ai.models.generateContent({
            model: MODELS.COMPLEX,
            contents: `Generate 15 high-quality flashcards based on this cheat sheet data.
            Focus on testing understanding, not just memorization.
            Front: A specific question, term, or scenario.
            Back: The detailed answer, definition, or solution.
            Output strictly valid JSON.
            Data: ${JSON.stringify(content).slice(0, 50000)}`, // Truncate to avoid huge prompts
            config: {
                safetySettings: SAFETY_SETTINGS,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: { front: { type: Type.STRING }, back: { type: Type.STRING } },
                        required: ["front", "back"]
                    }
                }
            }
        });
        const rawCards = validateJson<Omit<FlashCard, 'id' | 'interval' | 'repetition' | 'efactor' | 'nextReview'>[]>(response.text);
        
        // Add SRS fields
        return rawCards.map(card => ({
            ...card,
            id: uuidv4(),
            interval: 0,
            repetition: 0,
            efactor: 2.5,
            nextReview: Date.now()
        }));
    });
};

export const askAnything = async (question: string, context?: string, mode: 'standard' | 'socratic' = 'standard'): Promise<{ text: string, sources: any[] }> => {
    return retryOperation(async () => {
        const ai = getAIClient();
        
        // Truncate context if it's absurdly large to prevent token errors.
        // Increased limit for "Knowledge Vault" cross-document context
        const safeContext = context ? context.slice(0, 500000) : '';

        let systemInstruction = `You are an advanced AI study companion. Answer based primarily on the provided context.
            If the context contains page markers like "--- Page X ---", cite the page number in your answer (e.g., "[Page 5]").
            Use Google Search grounding for recent data only if the context is insufficient.`;

        if (mode === 'socratic') {
            systemInstruction = `You are a Socratic Tutor. 
            DO NOT give the user the direct answer. 
            Instead, guide them to the answer by asking probing questions based on the provided context.
            Break down complex problems into smaller steps.
            Encourage critical thinking.
            If the user is stuck, provide a small hint, but never the full solution immediately.`;
        }

        const response = await ai.models.generateContent({
            model: MODELS.COMPLEX,
            contents: `Context from User Document(s):
            ${safeContext}
            
            User Question: "${question}"
            
            Instructions:
            ${systemInstruction}
            `,
            config: {
                safetySettings: SAFETY_SETTINGS,
                tools: [{ googleSearch: {} }]
            }
        });

        const text = response.text || "No response generated.";
        const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        
        return { text, sources };
    });
};

export const fixCodeSnippet = async (code: string, language: string): Promise<CodeFixResult> => {
    return retryOperation(async () => {
        const ai = getAIClient();
        const response = await ai.models.generateContent({
            model: MODELS.COMPLEX,
            contents: `Act as a Senior Principal Engineer. Debug this ${language} code.
            
            CODE:
            ${code}
            
            Output JSON with:
            1. 'corrected_code': The fully fixed code block.
            2. 'explanation': Markdown formatted explanation of the bugs found and why the fix works.
            `,
            config: {
                safetySettings: SAFETY_SETTINGS,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        corrected_code: { type: Type.STRING },
                        explanation: { type: Type.STRING }
                    },
                    required: ["corrected_code", "explanation"]
                }
            }
        });
        const result = validateJson<any>(response.text);
        return { ...result, language };
    });
};

export const generateFlashcardsFromFile = async (file: File, onProgress?: (step: number) => void): Promise<FlashCard[]> => {
    return retryOperation(async () => {
        if (onProgress) onProgress(1);
        const ai = getAIClient();
        const parts = await convertFileToContentParts(file);
        
        if (onProgress) onProgress(2);
        const response = await ai.models.generateContent({
            model: MODELS.COMPLEX,
            contents: { parts: [...parts, { text: "Generate 15 high-quality flashcards from this document. Focus on key concepts, definitions, and formulas. Output strictly JSON." }] },
            config: {
                safetySettings: SAFETY_SETTINGS,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: { front: { type: Type.STRING }, back: { type: Type.STRING } },
                        required: ["front", "back"]
                    }
                }
            }
        });
        
        if (onProgress) onProgress(3);
        const rawCards = validateJson<Omit<FlashCard, 'id' | 'interval' | 'repetition' | 'efactor' | 'nextReview'>[]>(response.text);
        return rawCards.map(card => ({
            ...card,
            id: uuidv4(),
            interval: 0,
            repetition: 0,
            efactor: 2.5,
            nextReview: Date.now()
        }));
    });
};

export const generateQuizFromFile = async (file: File, numQuestions: number, onProgress?: (step: number) => void): Promise<Quiz> => {
    return retryOperation(async () => {
        if (onProgress) onProgress(1);
        const ai = getAIClient();
        const parts = await convertFileToContentParts(file);
        
        if (onProgress) onProgress(2);
        const response = await ai.models.generateContent({
            model: MODELS.COMPLEX,
            contents: { parts: [...parts, { text: `Generate a difficult ${numQuestions}-question quiz from this document. 
            Ensure distractors (wrong options) are plausible. 
            Include a detailed explanation for the correct answer.
            Output strictly JSON.` }] },
            config: {
                safetySettings: SAFETY_SETTINGS,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        questions: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    question: { type: Type.STRING },
                                    options: { type: Type.ARRAY, items: { type: Type.STRING } },
                                    correctAnswer: { type: Type.STRING },
                                    explanation: { type: Type.STRING }
                                },
                                required: ["question", "options", "correctAnswer", "explanation"]
                            }
                        }
                    },
                    required: ["title", "questions"]
                }
            }
        });
        
        if (onProgress) onProgress(3);
        return validateJson<Quiz>(response.text);
    });
};

export const generateQuizFromSheet = async (content: CheatSheetSection[], numQuestions: number): Promise<Quiz> => {
    return retryOperation(async () => {
        const ai = getAIClient();
        const response = await ai.models.generateContent({
            model: MODELS.COMPLEX,
            contents: `Generate a ${numQuestions}-question quiz from this cheat sheet data: ${JSON.stringify(content)}. Output strictly JSON.`,
            config: {
                safetySettings: SAFETY_SETTINGS,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        questions: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    question: { type: Type.STRING },
                                    options: { type: Type.ARRAY, items: { type: Type.STRING } },
                                    correctAnswer: { type: Type.STRING },
                                    explanation: { type: Type.STRING }
                                },
                                required: ["question", "options", "correctAnswer", "explanation"]
                            }
                        }
                    },
                    required: ["title", "questions"]
                }
            }
        });
        return validateJson<Quiz>(response.text);
    });
};

export const generateExamHeatmap = async (files: File[]): Promise<HeatmapResult> => {
    return retryOperation(async () => {
        const ai = getAIClient();
        // Extract text from all files first to handle formatting
        const texts = await Promise.all(files.map(async f => {
            const txt = await extractTextFromFile(f);
            return { text: `--- Document: ${f.name} ---\n${txt}` };
        }));
        
        const response = await ai.models.generateContent({
            model: MODELS.COMPLEX,
            contents: { parts: [...texts, { text: "Analyze these past exams. Identify recurring topics, calculate their frequency (1-10), and provide actionable study advice. Output strictly JSON." }] },
            config: {
                safetySettings: SAFETY_SETTINGS,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        topics: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    topic: { type: Type.STRING },
                                    frequency: { type: Type.NUMBER },
                                    importance: { type: Type.STRING },
                                    summary: { type: Type.STRING },
                                    sub_topics: { type: Type.ARRAY, items: { type: Type.STRING } },
                                    actionable_recommendation: { type: Type.STRING },
                                    common_pitfalls: { type: Type.STRING }
                                },
                                required: ["topic", "frequency", "importance", "summary", "sub_topics", "actionable_recommendation", "common_pitfalls"]
                            }
                        }
                    },
                    required: ["title", "topics"]
                }
            }
        });
        return validateJson<HeatmapResult>(response.text);
    });
};

export const generateRevisionPlan = async (content: CheatSheetSection[], studyDurationHours: number): Promise<RevisionPlanItem[]> => {
    return retryOperation(async () => {
        const ai = getAIClient();
        const response = await ai.models.generateContent({
            model: MODELS.COMPLEX,
            contents: `Create a ${studyDurationHours} hour revision schedule for these topics: ${JSON.stringify(content)}.
            Include short breaks (e.g., 'Break'). Prioritize 'Red' or 'Heavy' topics.
            Output strictly JSON.`,
            config: {
                safetySettings: SAFETY_SETTINGS,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            topic: { type: Type.STRING },
                            time_allocated_minutes: { type: Type.NUMBER },
                            priority: { type: Type.STRING },
                            justification: { type: Type.STRING }
                        },
                        required: ["topic", "time_allocated_minutes", "priority", "justification"]
                    }
                }
            }
        });
        return validateJson<RevisionPlanItem[]>(response.text);
    });
};

export const analyzeWeaknesses = async (incorrectQuestions: QuizQuestion[]): Promise<string> => {
    return retryOperation(async () => {
        const ai = getAIClient();
        const response = await ai.models.generateContent({
            model: MODELS.BASIC,
            contents: `I got these questions wrong on a quiz: ${JSON.stringify(incorrectQuestions)}.
            
            1. Identify the underlying knowledge gap.
            2. Explain the correct concepts briefly.
            3. Suggest a specific study strategy to fix this.
            
            Format as Markdown.`,
            config: {
                safetySettings: SAFETY_SETTINGS
            }
        });
        return response.text || "Could not analyze weakness.";
    });
};

export const generateExamStrategy = async (file: File): Promise<ExamStrategy> => {
    return retryOperation(async () => {
        const ai = getAIClient();
        const parts = await convertFileToContentParts(file);
        
        const prompt = `Analyze this document and create a strategic plan for a hypothetical exam based on it.
        Predict the types of questions, the likely focus areas, and provide a strategy to ace it.
        Output strictly valid JSON.`;

        const response = await ai.models.generateContent({
            model: MODELS.COMPLEX,
            contents: { parts: [...parts, { text: prompt }] },
            config: {
                safetySettings: SAFETY_SETTINGS,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        examProfile: {
                            type: Type.OBJECT,
                            properties: {
                                difficulty: { type: Type.STRING },
                                likelyFocusAreas: { type: Type.ARRAY, items: { type: Type.STRING } },
                                questionTypes: { type: Type.ARRAY, items: { type: Type.STRING } }
                            },
                            required: ["difficulty", "likelyFocusAreas", "questionTypes"]
                        },
                        strategy: {
                            type: Type.OBJECT,
                            properties: {
                                timeAllocation: { type: Type.STRING },
                                orderOfAttack: { type: Type.STRING },
                                pitfallAvoidance: { type: Type.STRING }
                            },
                            required: ["timeAllocation", "orderOfAttack", "pitfallAvoidance"]
                        },
                        predictedQuestions: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    question: { type: Type.STRING },
                                    probability: { type: Type.STRING },
                                    topic: { type: Type.STRING }
                                },
                                required: ["question", "probability", "topic"]
                            }
                        }
                    },
                    required: ["examProfile", "strategy", "predictedQuestions"]
                }
            }
        });
        return validateJson<ExamStrategy>(response.text);
    });
};

export const generateConceptMap = async (file: File): Promise<string> => {
    return retryOperation(async () => {
        const ai = getAIClient();
        const parts = await convertFileToContentParts(file);
        const prompt = `Analyze this document and generate a conceptual mind map using Mermaid.js syntax.
        
        Requirements:
        1. Use 'mindmap' diagram type.
        2. Root node should be the main topic of the document.
        3. Branch out to key concepts, then sub-concepts.
        4. Keep labels concise (max 3-4 words).
        5. Ensure the structure is balanced.
        6. OUTPUT RULE: Do NOT use parentheses ( ) in node content, use square brackets [ ] or no brackets. Avoid special characters.
        7. Output ONLY the Mermaid code, no markdown fences or "mermaid" tags.
        `;
        
        const response = await ai.models.generateContent({
            model: MODELS.COMPLEX,
            contents: { parts: [...parts, { text: prompt }] },
            config: {
                safetySettings: SAFETY_SETTINGS
            }
        });
        
        let text = response.text || '';
        // Clean up markdown if present
        text = text.replace(/```mermaid/g, '').replace(/```/g, '').trim();
        return text;
    });
};

export const generateNexusData = async (sheets: SavedCheatSheet[]): Promise<NexusData> => {
    return retryOperation(async () => {
        if (sheets.length === 0) {
            throw new Error("No sheets to analyze. Save some content first.");
        }

        const ai = getAIClient();
        
        // Prepare a summarized context of all sheets to fit within token limits
        const context = sheets.map(s => ({
            id: s.id,
            title: s.filename,
            // Extract top-level sections and first few items to represent content
            summary: s.content.map(c => `${c.sectionTitle}: ${c.items.slice(0, 3).map(i => i.title).join(', ')}...`).join('; ')
        }));

        const prompt = `Act as a "Learning Navigator" AI. Analyze these ${sheets.length} documents in the user's Knowledge Vault.
        
        DATA:
        ${JSON.stringify(context)}

        TASKS:
        1. Create a "Global Knowledge Graph" using Mermaid.js (graph TD).
           - USE SAFE IDs: Use simple alphanumeric IDs for nodes (e.g., DOC1, TOPIC1) and put the title in brackets/labels (e.g., DOC1["My Title"]). 
           - Link documents (nodes) based on shared concepts/topics.
           - Create "Topic Nodes" for major overlapping themes (e.g. "Linear Algebra" linking "Matrix Docs" and "Vector Docs").
           - STYLING: Define a class named 'neural' with fill:#1e293b,stroke:#38bdf8,color:#fff,stroke-width:2px. Apply this class to all nodes using the syntax \`:::neural\`.
           - IMPORTANT: When returning the 'graph' string, ensure that 'classDef' is on its OWN line, separated by a newline character (\\n) from 'graph TD'.
           - Example Format:
             "graph TD\\nclassDef neural fill:#1e293b,stroke:#38bdf8,color:#fff,stroke-width:2px\\nDOC1[Linear Algebra]:::neural --> TOPIC1[Math]:::neural"
        
        2. Create a "Smart Study Path" (Session Planner).
           - Suggest a logical order to study these documents based on complexity or prerequisite relationships.
           - Mark them as 'pending', 'in-progress' (if they seem foundational), or 'mastered' (mock status).

        3. Generate 3 "Global Insights" about the user's library (e.g. "You focus heavily on X", "Gap detected in Y").

        OUTPUT JSON ONLY.
        `;

        const response = await ai.models.generateContent({
            model: MODELS.COMPLEX,
            contents: prompt,
            config: {
                safetySettings: SAFETY_SETTINGS,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        graph: { type: Type.STRING, description: "Mermaid graph code (no markdown blocks)" },
                        studyPath: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    id: { type: Type.STRING },
                                    title: { type: Type.STRING },
                                    type: { type: Type.STRING, enum: ['concept', 'document', 'milestone'] },
                                    status: { type: Type.STRING, enum: ['pending', 'in-progress', 'mastered'] },
                                    description: { type: Type.STRING },
                                    estimatedTime: { type: Type.STRING }
                                },
                                required: ["id", "title", "type", "status", "description", "estimatedTime"]
                            }
                        },
                        globalInsights: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    required: ["graph", "studyPath", "globalInsights"]
                }
            }
        });

        return validateJson<NexusData>(response.text);
    });
};

export const highlightConcepts = async (content: CheatSheetSection[]): Promise<CheatSheetSection[]> => {
    return retryOperation(async () => {
        const ai = getAIClient();
        
        const response = await ai.models.generateContent({
            model: MODELS.BASIC,
            contents: `Analyze this cheat sheet content. 
            Identify the MOST critical sentences, formulas, or definitions (approx 10-20% of text).
            Return a new JSON object where the 'content' strings are modified to wrap these critical parts in ==highlight markers==.
            
            Do NOT change any other text. Only add == marks.
            
            DATA: ${JSON.stringify(content)}
            `,
            config: {
                safetySettings: SAFETY_SETTINGS,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            sectionTitle: { type: Type.STRING },
                            color: { type: Type.STRING },
                            items: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        title: { type: Type.STRING },
                                        content: { type: Type.STRING }
                                    },
                                    required: ["title", "content"]
                                }
                            }
                        },
                        required: ["sectionTitle", "color", "items"]
                    }
                }
            }
        });

        return validateJson<CheatSheetSection[]>(response.text);
    });
};

export const validateConcept = async (
    topic: string, 
    explanation: string, 
    difficulty: string, 
    style: string
): Promise<FeynmanResponse> => {
    return retryOperation(async () => {
        const ai = getAIClient();
        
        const prompt = `Act as an AI Meta-Learning Tutor.
        Analyze the student explanation for correctness, completeness, and logical flow.
        Identify gaps in understanding, misconceptions, or missing steps.
        
        Generate a clear, structured feedback report.
        Use the student's difficulty level and preferred feedback style to tailor responses.
        If appropriate, provide simple analogies or examples to clarify misunderstood concepts.
        Maintain a supportive and encouraging tone to motivate the student.
        
        Student Explanation: "${explanation}"
        Concept Topic: "${topic}"
        Difficulty Level: "${difficulty}"
        Preferred Feedback Style: "${style}"
        `;

        const config = {
            safetySettings: SAFETY_SETTINGS,
            temperature: 0.2,
            maxOutputTokens: 4000,
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    feedback_summary: { type: Type.STRING, description: "concise paragraph highlighting correctness and gaps" },
                    corrected_explanation: { type: Type.STRING, description: "rewritten explanation including missing or corrected info" },
                    follow_up_questions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3-5 targeted questions to strengthen understanding" },
                    confidence_score: { type: Type.NUMBER, description: "0-100% estimate of student's understanding" }
                },
                required: ["feedback_summary", "corrected_explanation", "follow_up_questions", "confidence_score"]
            }
        };

        try {
            const response = await ai.models.generateContent({
                model: "gemini-3-pro-preview", // Primary Model
                contents: prompt,
                config
            });
            return validateJson<FeynmanResponse>(response.text);
        } catch (error) {
            console.warn("Primary model (gemini-3-pro-preview) failed or blocked. Attempting fallback...", error);
            // Fallback to flash model which is often more stable/lenient
            const fallbackResponse = await ai.models.generateContent({
                model: "gemini-3-flash-preview", 
                contents: prompt,
                config
            });
            return validateJson<FeynmanResponse>(fallbackResponse.text);
        }
    });
};

export const generateParallelUniverse = async (context: string): Promise<ParallelUniverseResult> => {
    return retryOperation(async () => {
        const ai = getAIClient();
        const prompt = `Analyze the provided context and simulate three parallel timelines (futures) for the student/user based on three distinct archetypes:
        1. 'The Sprinter' (Speed, efficiency, shortcuts, short-term gain).
        2. 'The Deep Diver' (Mastery, theory, slow but thorough, long-term expert).
        3. 'The Hacker' (Unconventional, practical application, finding loopholes, high risk/reward).

        CONTEXT: ${context.slice(0, 50000)}

        Output strictly JSON.`;

        const response = await ai.models.generateContent({
            model: MODELS.COMPLEX,
            contents: prompt,
            config: {
                safetySettings: SAFETY_SETTINGS,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        analysis: { type: Type.STRING },
                        scenarios: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    name: { type: Type.STRING },
                                    archetype: { type: Type.STRING }, // Enum?
                                    probability: { type: Type.STRING },
                                    shortTermOutcome: { type: Type.STRING },
                                    longTermOutcome: { type: Type.STRING },
                                    careerTrajectory: { type: Type.STRING },
                                    mentalState: { type: Type.STRING }
                                },
                                required: ["name", "archetype", "probability", "shortTermOutcome", "longTermOutcome", "careerTrajectory", "mentalState"]
                            }
                        }
                    },
                    required: ["analysis", "scenarios"]
                }
            }
        });
        return validateJson<ParallelUniverseResult>(response.text);
    });
};
