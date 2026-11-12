import Anthropic from '@anthropic-ai/sdk';
import { getAnthropicClient } from './anthropic';
import { TestSettings, Question, LLMGenerateResult, Difficulty, NormalizedDocument } from './types';
import { ApiError } from './errors';

export interface LLMProvider {
  readonly name: string;
  generateQuestions(document: NormalizedDocument, settings: TestSettings): Promise<LLMGenerateResult>;
}

/**
 * Skema Tool Use resmi untuk pembuatan soal terstruktur pada Claude API
 */
export const SUBMIT_QUESTIONS_TOOL: Anthropic.Tool = {
  name: 'submit_generated_questions',
  description:
    'Mengirimkan daftar soal evaluasi mandiri yang disusun secara ketat berdasarkan materi pembelajaran yang diberikan.',
  input_schema: {
    type: 'object',
    required: ['material_title', 'questions'],
    properties: {
      material_title: {
        type: 'string',
        description: 'Judul topik singkat materi pembelajaran ini (maksimal 6 kata).',
      },
      questions: {
        type: 'array',
        description: 'Daftar butir soal evaluasi yang telah disusun.',
        items: {
          type: 'object',
          required: ['question', 'type', 'correct_answer', 'explanation', 'difficulty'],
          properties: {
            question: {
              type: 'string',
              description: 'Kalimat pertanyaan yang jelas dan spesifik.',
            },
            type: {
              type: 'string',
              enum: ['multiple_choice', 'essay'],
              description: 'Format soal: multiple_choice atau essay.',
            },
            options: {
              type: 'array',
              items: { type: 'string' },
              description:
                'Tepat 4 opsi jawaban (A, B, C, D) jika type adalah multiple_choice.',
            },
            correct_answer: {
              type: 'string',
              description:
                'Kunci jawaban yang benar. Jika multiple_choice, harus cocok dengan salah satu dari options.',
            },
            explanation: {
              type: 'string',
              description:
                'Pembahasan komprehensif mengutip fakta atau bagian materi terkait yang membuktikan jawaban.',
            },
            difficulty: {
              type: 'string',
              enum: ['easy', 'medium', 'hard'],
              description: 'Tingkat kesulitan butir soal ini.',
            },
          },
        },
      },
    },
  },
};

/**
 * Panduan pedagogis per tingkat kesulitan agar LLM meningkatkan kedalaman penalaran,
 * bukan sekadar memperumit tata bahasa.
 */
export const DIFFICULTY_INSTRUCTIONS: Record<Difficulty, string> = {
  easy: `[Tingkat Kesulitan: MUDAH (Easy)]
Target Kognitif: Menguji daya ingat langsung (direct recall) dan pemahaman konsep dasar dari materi.
Panduan Penyusunan Soal:
1. Soal berfokus pada fakta eksplisit, definisi istilah kunci, peran spesifik, rumus, atau fungsi utama yang tertulis jelas pada materi.
2. Siswa harus dapat menemukan jawabannya secara langsung tanpa perlu inferensi multi-langkah atau interpretasi tersirat.
3. Kalimat pertanyaan harus ringkas, jelas, dan lugas (misal: "Apa definisi dari...", "Komponen apa yang berfungsi untuk...").
4. Untuk Pilihan Ganda: Distraktor (pilihan salah) harus berupa istilah yang relevan dalam domain yang sama namun jelas salah jika dibandingkan dengan isi teks.`,

  medium: `[Tingkat Kesulitan: SEDANG (Medium)]
Target Kognitif: Menguji pemahaman relasional, hubungan sebab-akibat, perbandingan dua konsep, atau alur proses.
Panduan Penyusunan Soal:
1. Jawaban TIDAK boleh bisa disalin langsung dari satu kalimat tunggal dalam materi. Siswa harus menghubungkan minimal 2 bagian informasi atau memahami alur logis dari materi.
2. Fokuskan soal pada pertanyaan "mengapa" atau "bagaimana" suatu kondisi memengaruhi kondisi lainnya (misal: "Mengapa proses A bergantung pada hasil proses B?", "Apa perbedaan mendasar antara mekanisme X dan Y?").
3. Untuk Pilihan Ganda: Distraktor harus mencerminkan kesalahan logika yang masuk akal atau kesalahpahaman umum (misal: membalikkan sebab-akibat, atau mengaitkan akibat dengan penyebab yang keliru).`,

  hard: `[Tingkat Kesulitan: SULIT (Hard)]
Target Kognitif: Menguji kemampuan menerapkan konsep pada skenario baru, menganalisis dampak anomali/perubahan kondisi, dan sintesis prinsip menyeluruh.
Panduan Penyusunan Soal:
1. JANGAN membuat soal sulit dengan menggunakan struktur kalimat yang berbelit-belit, menjebak (trick questions), atau bahasa yang sengaja diperumit. Kalimat soal HARUS tetap jelas dan lugas.
2. Tingkat kesulitan HARUS berasal dari kedalaman analisis: berikan skenario kasus pendek, tanyakan implikasi jika suatu faktor diubah/dihilangkan, atau minta evaluasi solusi terbaik berdasarkan aturan yang ada di materi (misal: "Jika enzim X mengalami denaturasi akibat kenaikan suhu, dampak berantai apa yang pertama kali terjadi pada jalur metabolisme tersebut?").
3. Untuk Pilihan Ganda: Semua opsi harus terdengar logis bagi siswa yang hanya membaca sekilas; hanya siswa yang benar-benar memahami prinsip inti yang dapat mengidentifikasi jawaban yang tepat.`,
};

interface RawToolQuestion {
  question?: string;
  type?: string;
  options?: string[];
  correct_answer?: string;
  explanation?: string;
  difficulty?: string;
}

interface RawToolPayload {
  material_title?: string;
  questions?: RawToolQuestion[];
}

/**
 * Validasi ketat terhadap output tool dari Claude API
 */
function validateAndNormalizeQuestions(
  raw: unknown,
  settings: TestSettings
): { valid: true; result: LLMGenerateResult } | { valid: false; errors: string[] } {
  const errors: string[] = [];

  if (!raw || typeof raw !== 'object') {
    return { valid: false, errors: ['Output tool bukan merupakan objek data yang valid.'] };
  }

  const payload = raw as RawToolPayload;
  if (!Array.isArray(payload.questions)) {
    return { valid: false, errors: ['Properti questions harus berupa array daftar butir soal.'] };
  }

  if (payload.questions.length !== settings.questionCount) {
    errors.push(
      `Jumlah butir soal tidak sesuai: menghasilkan ${payload.questions.length} soal, diminta ${settings.questionCount} soal.`
    );
  }

  const normalizedQuestions: Question[] = [];

  payload.questions.forEach((q, idx) => {
    const itemNum = idx + 1;
    if (!q.question || typeof q.question !== 'string' || q.question.trim().length === 0) {
      errors.push(`Soal #${itemNum}: Teks pertanyaan tidak boleh kosong.`);
    }

    if (!q.correct_answer || typeof q.correct_answer !== 'string' || q.correct_answer.trim().length === 0) {
      errors.push(`Soal #${itemNum}: Kunci jawaban tidak boleh kosong.`);
    }

    if (!q.explanation || typeof q.explanation !== 'string' || q.explanation.trim().length === 0) {
      errors.push(`Soal #${itemNum}: Pembahasan tidak boleh kosong.`);
    }

    let options: string[] | undefined = undefined;

    if (settings.questionType === 'multiple_choice') {
      if (!Array.isArray(q.options) || q.options.length !== 4) {
        errors.push(
          `Soal #${itemNum}: Pilihan ganda wajib memiliki tepat 4 opsi jawaban (A, B, C, D). Ditemukan: ${
            Array.isArray(q.options) ? q.options.length : 0
          } opsi.`
        );
      } else {
        const hasEmptyOption = q.options.some(
          (opt) => typeof opt !== 'string' || opt.trim().length === 0
        );
        if (hasEmptyOption) {
          errors.push(`Soal #${itemNum}: Terdapat opsi pilihan ganda yang kosong.`);
        } else {
          options = q.options.map((opt) => opt.trim());
          const cleanCorrect = (q.correct_answer || '').trim().toLowerCase();
          const matchesOption = options.some((opt) => {
            const cleanOpt = opt.toLowerCase();
            return (
              cleanOpt === cleanCorrect ||
              cleanCorrect.startsWith(cleanOpt.slice(0, 2)) ||
              cleanOpt.startsWith(cleanCorrect.slice(0, 2))
            );
          });

          if (!matchesOption) {
            errors.push(
              `Soal #${itemNum}: Kunci jawaban '${q.correct_answer}' tidak cocok dengan salah satu dari 4 opsi jawaban yang diberikan.`
            );
          }
        }
      }
    }

    normalizedQuestions.push({
      id: itemNum,
      type: settings.questionType,
      question: (q.question || '').trim(),
      options,
      correctAnswer: (q.correct_answer || '').trim(),
      explanation: (q.explanation || '').trim(),
      difficulty: settings.difficulty,
    });
  });

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    result: {
      materialTitle: payload.material_title?.trim() || 'Dokumen Materi Pembelajaran',
      questions: normalizedQuestions,
    },
  };
}

/**
 * Utilitas logging dev-only di balik flag DEBUG_LLM
 */
function logDebug(section: string, data: unknown) {
  const isDebug = process.env.DEBUG_LLM === 'true' || process.env.DEBUG_LLM === '1';
  if (!isDebug) return;

  console.log(`\n======================================================`);
  console.log(`[BELAKHAR LLM DEBUG: ${section}]`);
  if (typeof data === 'string') {
    console.log(data);
  } else {
    console.log(JSON.stringify(data, null, 2));
  }
  console.log(`======================================================\n`);
}

/**
 * Pemetaan exception Anthropic SDK ke error spesifik terstandarisasi
 */
function mapAnthropicError(err: unknown): ApiError {
  if (err instanceof ApiError) return err;

  const errorObj = err as { status?: number; name?: string; message?: string };
  const message = errorObj?.message || String(err);
  const status = errorObj?.status;
  const name = errorObj?.name;

  if (status === 401 || name === 'AuthenticationError') {
    return new ApiError(
      'Kunci API Anthropic (ANTHROPIC_API_KEY) tidak valid atau telah kedaluwarsa. Periksa kembali kunci API di .env.local.',
      401,
      'INVALID_API_KEY'
    );
  }

  if (status === 429 || name === 'RateLimitError') {
    return new ApiError(
      'Layanan AI sedang mencapai batas frekuensi permintaan (rate limit 429). Silakan tunggu beberapa saat sebelum mencoba kembali.',
      429,
      'RATE_LIMIT_EXCEEDED'
    );
  }

  if (
    name === 'APIConnectionTimeoutError' ||
    message.toLowerCase().includes('timeout') ||
    message.toLowerCase().includes('etimedout')
  ) {
    return new ApiError(
      'Waktu permintaan ke layanan Claude melebihi batas (timeout). Silakan periksa koneksi atau coba kurangi jumlah soal/ukuran dokumen.',
      504,
      'GATEWAY_TIMEOUT'
    );
  }

  return new ApiError(
    `Gagal menghubungi layanan Anthropic Claude: ${message}`,
    502,
    'LLM_PROVIDER_ERROR'
  );
}

export class ClaudeProvider implements LLMProvider {
  public readonly name = 'claude';

  async generateQuestions(
    document: NormalizedDocument,
    settings: TestSettings
  ): Promise<LLMGenerateResult> {
    let anthropic: Anthropic;
    try {
      anthropic = getAnthropicClient();
    } catch {
      throw new ApiError(
        'ANTHROPIC_API_KEY belum dikonfigurasi. Silakan buat berkas .env.local dan isi ANTHROPIC_API_KEY Anda.',
        500,
        'MISSING_API_KEY'
      );
    }

    const { questionCount, questionType, difficulty } = settings;
    const difficultyGuide = DIFFICULTY_INSTRUCTIONS[difficulty];

    const systemPrompt = `Kamu adalah pakar evaluasi akademik dan penyusun soal ujian universitas untuk aplikasi BELAKHAR.
Tugasmu adalah menyusun soal ujian mandiri yang berkualitas tinggi, presisi, dan bersumber 100% HANYA dari materi pembelajaran yang disediakan oleh pengguna.

Aturan Utama:
1. Soal harus disusun berdasarkan fakta dan konsep yang ada di materi. Jangan membuat asumsi atau fakta baru di luar dokumen materi.
2. Gunakan bahasa Indonesia yang baik, akademis, dan mudah dipahami.
3. Selalu panggil tool "submit_generated_questions" untuk mengembalikan hasil akhir.`;

    const userPromptText = `Tolong susun tepat ${questionCount} butir soal ${
      questionType === 'multiple_choice'
        ? 'pilihan ganda (multiple choice dengan tepat 4 opsi A, B, C, D)'
        : 'esai (uraian/analisis mandiri)'
    } dari materi pembelajaran yang dilampirkan.

PANDUAN KESULITAN:
${difficultyGuide}`;

    // Bangun konten user: dukung native base64 document block untuk PDF atau text block untuk TXT/DOCX
    const userContent: Array<Anthropic.TextBlockParam | Anthropic.DocumentBlockParam> = [];

    if (document.type === 'pdf') {
      userContent.push({
        type: 'document',
        source: {
          type: 'base64',
          media_type: 'application/pdf',
          data: document.content,
        },
      });
      userContent.push({
        type: 'text',
        text: userPromptText,
      });
    } else {
      userContent.push({
        type: 'text',
        text: `${userPromptText}\n\n--- DOKUMEN MATERI PEMBELAJARAN ---\n${document.content}`,
      });
    }

    logDebug('REQUEST', {
      model: 'claude-3-5-sonnet-20241022',
      documentType: document.type,
      metadata: document.metadata,
      settings,
      systemPrompt,
      userPromptPreview: userPromptText,
    });

    try {
      // 1. Percobaan Pertama Pemanggilan Claude API dengan Forced Tool Use
      const messages: Anthropic.MessageParam[] = [
        {
          role: 'user',
          content: userContent,
        },
      ];

      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        system: systemPrompt,
        tools: [SUBMIT_QUESTIONS_TOOL],
        tool_choice: { type: 'tool', name: 'submit_generated_questions' },
        messages,
      });

      logDebug('RESPONSE', response);

      const toolUseBlock = response.content.find(
        (b): b is Anthropic.ToolUseBlock =>
          b.type === 'tool_use' && b.name === 'submit_generated_questions'
      );

      if (!toolUseBlock) {
        throw new ApiError(
          'Model AI tidak memanggil tool pengiriman soal yang diharapkan.',
          502,
          'MALFORMED_OUTPUT'
        );
      }

      // 2. Validasi Output Tool Pertama
      const validation = validateAndNormalizeQuestions(toolUseBlock.input, settings);

      if (validation.valid) {
        return validation.result;
      }

      // 3. Alur Auto-Retry (1x Retry dengan Corrective Feedback)
      logDebug('RETRY_TRIGGERED', {
        errors: validation.errors,
        rawInput: toolUseBlock.input,
      });

      const correctiveMessage = `Hasil generasi soal sebelumnya belum memenuhi kriteria validasi berikut:\n${validation.errors
        .map((e) => `- ${e}`)
        .join(
          '\n'
        )}\n\nMohon perbaiki semua poin ketidaksesuaian di atas dan panggil kembali tool submit_generated_questions dengan data yang lengkap dan valid.`;

      const retryMessages: Anthropic.MessageParam[] = [
        { role: 'user', content: userContent },
        { role: 'assistant', content: response.content },
        {
          role: 'user',
          content: [
            {
              type: 'tool_result',
              tool_use_id: toolUseBlock.id,
              content: `Validasi gagal dengan alasan:\n${validation.errors.join('\n')}`,
            },
            {
              type: 'text',
              text: correctiveMessage,
            },
          ],
        },
      ];

      const retryResponse = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        system: systemPrompt,
        tools: [SUBMIT_QUESTIONS_TOOL],
        tool_choice: { type: 'tool', name: 'submit_generated_questions' },
        messages: retryMessages,
      });

      logDebug('RETRY_RESPONSE', retryResponse);

      const retryToolBlock = retryResponse.content.find(
        (b): b is Anthropic.ToolUseBlock =>
          b.type === 'tool_use' && b.name === 'submit_generated_questions'
      );

      if (!retryToolBlock) {
        throw new ApiError(
          'Model AI gagal memanggil tool pada percobaan ulang.',
          502,
          'MALFORMED_OUTPUT'
        );
      }

      const secondValidation = validateAndNormalizeQuestions(retryToolBlock.input, settings);

      if (secondValidation.valid) {
        return secondValidation.result;
      }

      // Jika setelah 1x retry masih gagal, lempar MALFORMED_OUTPUT
      throw new ApiError(
        `Format soal yang dihasilkan AI tidak memenuhi standar validasi setelah 1x percobaan ulang: ${secondValidation.errors.join('; ')}`,
        502,
        'MALFORMED_OUTPUT'
      );
    } catch (err: unknown) {
      throw mapAnthropicError(err);
    }
  }
}

export function getActiveLLMProvider(): LLMProvider {
  const providerName = (process.env.LLM_PROVIDER || 'claude').toLowerCase();

  switch (providerName) {
    case 'claude':
    case 'anthropic':
      return new ClaudeProvider();
    default:
      throw new ApiError(
        `LLM Provider '${providerName}' belum didukung. Nilai valid saat ini: 'claude'.`,
        500,
        'INTERNAL_SERVER_ERROR'
      );
  }
}

/**
 * Entry point tunggal abstraksi LLM untuk menyusun soal ujian.
 * Menerima NormalizedDocument (text / pdf) dan TestSettings.
 */
export async function generateQuestions(
  document: NormalizedDocument,
  settings: TestSettings
): Promise<LLMGenerateResult> {
  const provider = getActiveLLMProvider();
  return provider.generateQuestions(document, settings);
}
