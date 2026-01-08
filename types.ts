export enum AppState {
  HOME = 'HOME',
  LEARNING_ENGINE = 'LEARNING_ENGINE'
}

export enum LearningMode {
  DIAGNOSTIC = 'DIAGNOSTIC',             // 1. Assess prior knowledge
  EXPLANATION = 'EXPLANATION',           // 2. Build mental models
  PRACTICE = 'PRACTICE',                 // 3. Infinite adaptive exercises
  VERIFICATION = 'VERIFICATION',         // 4. Prove application
  REFLECTION = 'REFLECTION',             // 5. Lock in memory
  COMPLETE = 'COMPLETE'
}

export enum MasteryLevel {
  NOVICE = 'NOVICE',
  FOUNDATION = 'FOUNDATION',
  PROFICIENT = 'PROFICIENT',
  MASTER = 'MASTER'
}

export interface LearningTopic {
  query: string;
  timestamp: number;
}

// -- Content Structures --

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface DiagnosticResult {
  questions: Question[];
}

export interface ExplanationSection {
  title: string;
  content: string; // Markdown
}

export interface ExplanationContent {
  title: string;
  sections: ExplanationSection[];
}

export interface PracticeItem {
  question: Question;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface VerificationScenario {
  scenario: string;
  questions: Question[]; // Changed to Array for multi-step verification
}

export interface EngineState {
  mode: LearningMode;
  mastery: MasteryLevel;
  practiceAccuracy: number; // 0-100
  questionsAnswered: number;
  diagnosticScore?: number;
}