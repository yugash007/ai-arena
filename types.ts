
export interface CheatSheetItem {
  title: string;
  content: string;
}

export interface CheatSheetSection {
  sectionTitle: string;
  color: string; // Tailwind CSS color class, e.g., 'blue', 'green'
  items: CheatSheetItem[];
}

export type OutputStyle = 'Concise' | 'Standard' | 'Detailed' | 'Formula-heavy' | 'Definition-heavy';

export interface SavedCheatSheet {
  id: string;
  filename: string;
  timestamp: number;
  content: CheatSheetSection[];
  visibility?: 'public' | 'private';
  authorName?: string;
  authorId?: string;
  views?: number;
}

export interface FlashCard {
  id: string;
  front: string;
  back: string;
  // SRS Fields
  interval: number; // Days until next review
  repetition: number; // Number of consecutive correct answers
  efactor: number; // Easiness factor (starts at 2.5)
  nextReview: number; // Timestamp
}

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error';
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export interface Quiz {
  title: string;
  questions: QuizQuestion[];
}

export interface HeatmapTopic {
  topic: string;
  frequency: number; // A score from 1-10 representing frequency
  importance: string; // e.g., "High", "Medium", "Low"
  summary: string; // A brief summary of why it's important
  sub_topics: string[];
  actionable_recommendation: string;
  common_pitfalls: string;
}

export interface HeatmapResult {
  title: string;
  topics: HeatmapTopic[];
}

export interface RevisionPlanItem {
  topic: string;
  time_allocated_minutes: number;
  priority: string;
  justification: string;
}

export interface CodeFixResult {
    corrected_code: string;
    explanation: string;
    language: string;
}

export interface ExamStrategy {
  examProfile: {
    difficulty: string;
    likelyFocusAreas: string[];
    questionTypes: string[];
  };
  strategy: {
    timeAllocation: string;
    orderOfAttack: string;
    pitfallAvoidance: string;
  };
  predictedQuestions: {
    question: string;
    probability: string; // e.g., "High", "Medium"
    topic: string;
  }[];
}

export interface StudyPathNode {
  id: string;
  title: string;
  type: 'concept' | 'document' | 'milestone';
  status: 'pending' | 'in-progress' | 'mastered';
  description: string;
  estimatedTime: string;
}

export interface NexusData {
  graph: string; // Mermaid code
  studyPath: StudyPathNode[];
  globalInsights: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface FeynmanResponse {
  feedback_summary: string;
  corrected_explanation: string;
  follow_up_questions: string[];
  confidence_score: number;
}

export interface ParallelTimeline {
  name: string;
  archetype: string;
  probability: string;
  shortTermOutcome: string;
  longTermOutcome: string;
  careerTrajectory: string;
  mentalState: string;
}

export interface ParallelUniverseResult {
  analysis: string;
  scenarios: ParallelTimeline[];
}