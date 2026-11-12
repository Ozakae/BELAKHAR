export type QuestionType = 'multiple_choice' | 'essay';

export type Difficulty = 'easy' | 'medium' | 'hard';

export type TestMode = 'practice' | 'daily_quiz' | 'assessment';

export const MODE_DIFFICULTY_MAP: Record<TestMode, Difficulty> = {
  practice: 'easy',       // Mode Latihan = Easy
  daily_quiz: 'medium',   // Ujian Harian = Normal / Medium
  assessment: 'hard',     // Assesmen = Hard (Setara ujian resmi)
};

export const DIFFICULTY_MODE_MAP: Record<Difficulty, TestMode> = {
  easy: 'practice',
  medium: 'daily_quiz',
  hard: 'assessment',
};

export interface ModeInfo {
  id: TestMode;
  name: string;
  difficultyLabel: string;
  desc: string;
}

export const AVAILABLE_MODES: ModeInfo[] = [
  {
    id: 'practice',
    name: 'Mode Latihan',
    difficultyLabel: 'Mudah',
    desc: 'Pemahaman konsep dasar & definisi materi.',
  },
  {
    id: 'daily_quiz',
    name: 'Ujian Harian',
    difficultyLabel: 'Normal',
    desc: 'Penerapan konsep & evaluasi mingguan perkuliahan.',
  },
  {
    id: 'assessment',
    name: 'Assesmen',
    difficultyLabel: 'Ujian Resmi',
    desc: 'Analisis kritis mendalam setara UTS/UAS kampus.',
  },
];

export type DocumentFormatType = 'text' | 'pdf';

export interface DocumentMetadata {
  pageCount?: number;
  charCount?: number;
}

export interface NormalizedDocument {
  type: DocumentFormatType;
  content: string; // Plain text if 'text', base64 data if 'pdf'
  metadata: DocumentMetadata;
}

export interface TestSettings {
  questionCount: number; // 1 - 20
  questionType: QuestionType;
  difficulty: Difficulty;
}

export interface Question {
  id: number;
  type: QuestionType;
  question: string;
  options?: string[]; // 4 options for multiple choice
  correctAnswer: string;
  explanation: string;
  difficulty?: Difficulty;
}

// Result of LLM question generation
export interface LLMGenerateResult {
  materialTitle: string;
  questions: Question[];
  sessionId?: string;
}

export interface LLMGenerateOptions {
  document: NormalizedDocument;
  settings: TestSettings;
}

// Database Entities
export interface TestSessionRecord {
  id: string;
  user_id: string;
  source_filename: string;
  settings: TestSettings;
  questions: Question[];
  created_at: string;
}

export interface TestAttemptRecord {
  id: string;
  session_id: string;
  user_answers: Record<string, string>;
  score: number;
  completed_at: string;
}

// Attempt submission and evaluation types
export interface SubmitAttemptRequest {
  sessionId: string;
  answers: Record<string, string>; // e.g. { "1": "A. Fotosintesis", "2": "B. Mitokondria" }
}

export interface QuestionResultDetail {
  questionId: number;
  type: QuestionType;
  question: string;
  isCorrect: boolean | null; // null jika essay (self-review)
  userAnswer: string;
  correctAnswer: string;
  explanation: string;
}

export interface SubmitAttemptResponseData {
  attemptId: string;
  sessionId: string;
  score: number;
  totalQuestions: number;
  correctCount: number;
  results: QuestionResultDetail[];
  completedAt: string;
}

// Standardized API response contracts
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  // Dual-compatibility fields for existing frontend prototype
  materialTitle?: string;
  questions?: Question[];
  sessionId?: string;
}

export interface ApiErrorDetail {
  message: string;
  code: string;
}

export interface ApiErrorResponse {
  success: false;
  error: ApiErrorDetail | string;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// Legacy interface retained for backward compatibility
export interface GenerateTestResponse {
  success: boolean;
  data?: LLMGenerateResult;
  materialTitle?: string;
  questions?: Question[];
  sessionId?: string;
  error?: string | ApiErrorDetail;
}
