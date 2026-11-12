import { TestSettings, QuestionType, Difficulty } from './types';
import { ApiError } from './errors';

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
export const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.txt', '.md'] as const;

export interface ValidatedGenerateRequest {
  file: File;
  settings: TestSettings;
}

export function validateFile(file: unknown): File {
  if (!file || !(file instanceof File) || file.size === 0) {
    throw new ApiError(
      'Berkas materi pembelajaran wajib diunggah.',
      400,
      'FILE_MISSING'
    );
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeInMb = (file.size / (1024 * 1024)).toFixed(1);
    throw new ApiError(
      `Ukuran berkas (${sizeInMb}MB) melebihi batas maksimal 10MB. Harap perkecil ukuran berkas Anda.`,
      400,
      'FILE_TOO_LARGE'
    );
  }

  const fileName = file.name.toLowerCase();
  const hasValidExtension = ALLOWED_EXTENSIONS.some((ext) => fileName.endsWith(ext));

  if (!hasValidExtension) {
    throw new ApiError(
      'Format berkas tidak didukung. Mohon unggah dokumen berformat .pdf, .docx, .txt, atau .md.',
      400,
      'UNSUPPORTED_FILE_TYPE'
    );
  }

  return file;
}

export function validateSettings(
  questionCountRaw: unknown,
  questionTypeRaw: unknown,
  difficultyRaw: unknown
): TestSettings {
  // 1. Validasi Jumlah Soal
  if (questionCountRaw === undefined || questionCountRaw === null || questionCountRaw === '') {
    throw new ApiError(
      'Parameter jumlah soal (questionCount) wajib diisi.',
      400,
      'INVALID_QUESTION_COUNT'
    );
  }

  const countParsed = Number(questionCountRaw);
  if (!Number.isInteger(countParsed) || countParsed < 1 || countParsed > 20) {
    throw new ApiError(
      'Jumlah soal harus berupa bilangan bulat antara 1 hingga 20 butir.',
      400,
      'INVALID_QUESTION_COUNT'
    );
  }

  // 2. Validasi Tipe Soal
  const validQuestionTypes: QuestionType[] = ['multiple_choice', 'essay'];
  if (!questionTypeRaw || typeof questionTypeRaw !== 'string' || !validQuestionTypes.includes(questionTypeRaw as QuestionType)) {
    throw new ApiError(
      `Tipe soal tidak valid. Pilihan yang tersedia: ${validQuestionTypes.join(', ')}.`,
      400,
      'INVALID_QUESTION_TYPE'
    );
  }

  // 3. Validasi Tingkat Kesulitan
  const validDifficulties: Difficulty[] = ['easy', 'medium', 'hard'];
  if (!difficultyRaw || typeof difficultyRaw !== 'string' || !validDifficulties.includes(difficultyRaw as Difficulty)) {
    throw new ApiError(
      `Tingkat kesulitan tidak valid. Pilihan yang tersedia: ${validDifficulties.join(', ')}.`,
      400,
      'INVALID_DIFFICULTY'
    );
  }

  return {
    questionCount: countParsed,
    questionType: questionTypeRaw as QuestionType,
    difficulty: difficultyRaw as Difficulty,
  };
}

export function validateGenerateRequest(formData: FormData): ValidatedGenerateRequest {
  const fileRaw = formData.get('file');
  const questionCountRaw = formData.get('questionCount');
  const questionTypeRaw = formData.get('questionType');
  const difficultyRaw = formData.get('difficulty');

  const file = validateFile(fileRaw);
  const settings = validateSettings(questionCountRaw, questionTypeRaw, difficultyRaw);

  return {
    file,
    settings,
  };
}
