import { TestSettings, LLMGenerateResult } from './types';
import { extractDocumentContent } from './documents';
import { generateQuestions } from './llm';

/**
 * Service orkestrasi pembuatan soal dari dokumen pembelajaran.
 * Dapat diuji secara unit test independen tanpa membutuhkan HTTP context.
 */
export async function generateQuestionsFromDocument(
  file: File,
  settings: TestSettings
): Promise<LLMGenerateResult> {
  // 1. Normalisasi dan ekstraksi dokumen (.txt, .docx, .pdf)
  const normalizedDoc = await extractDocumentContent(file);

  // 2. Panggil abstraksi LLM untuk merumuskan butir evaluasi terstruktur
  const result = await generateQuestions(normalizedDoc, settings);

  return {
    materialTitle: result.materialTitle || file.name,
    questions: result.questions,
  };
}
