import { extractTextFromPdf } from './pdf';
import { ApiError } from './errors';
import { NormalizedDocument } from './types';

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
export const MAX_PDF_PAGE_LIMIT = 20; // Maksimal 20 halaman
export const MIN_DOCUMENT_CHAR_LENGTH = 30; // Batas minimal teks

/**
 * Normalisasi berkas berbagai format (.txt, .md, .docx, .pdf)
 * menjadi struktur seragam NormalizedDocument untuk dikonsumsi LLM.
 */
export async function extractDocumentContent(file: File): Promise<NormalizedDocument> {
  const fileName = file.name.toLowerCase();

  // 1. Validasi Batas Ukuran Berkas
  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeInMb = (file.size / (1024 * 1024)).toFixed(1);
    throw new ApiError(
      `Ukuran berkas (${sizeInMb}MB) melebihi batas maksimal 10MB. Harap perkecil ukuran berkas Anda.`,
      400,
      'FILE_TOO_LARGE'
    );
  }

  // 2. Pemrosesan Dokumen PDF
  if (fileName.endsWith('.pdf')) {
    let buffer: Buffer;
    try {
      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new ApiError(
        `Gagal membaca berkas PDF: ${msg}`,
        400,
        'UNPARSEABLE_CONTENT'
      );
    }

    // Inspeksi PDF server-side: cek page count & keberadaan lapisan teks
    let pageCount = 0;
    let extractedText = '';

    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { PDFParse } = require('pdf-parse');
      const parser = new PDFParse({ data: buffer });
      const textResult = await parser.getText();
      pageCount = textResult.total || 0;
      extractedText = (textResult.text || '').trim();

      if (typeof parser.destroy === 'function') {
        await parser.destroy();
      }
    } catch {
      throw new ApiError(
        'Berkas PDF rusak atau tidak dapat diuraikan. Pastikan dokumen merupakan berkas PDF yang valid.',
        400,
        'UNPARSEABLE_CONTENT'
      );
    }

    // Validasi jumlah halaman (Maksimal 20 halaman)
    if (pageCount > MAX_PDF_PAGE_LIMIT) {
      throw new ApiError(
        `Dokumen PDF memiliki ${pageCount} halaman, melebihi batas maksimal ${MAX_PDF_PAGE_LIMIT} halaman.`,
        400,
        'PDF_PAGE_LIMIT_EXCEEDED'
      );
    }

    if (pageCount === 0) {
      throw new ApiError(
        'Dokumen PDF tidak memiliki halaman yang valid.',
        400,
        'UNPARSEABLE_CONTENT'
      );
    }

    // Deteksi scanned PDF (tidak ada lapisan teks yang dapat dibaca)
    if (extractedText.length < MIN_DOCUMENT_CHAR_LENGTH) {
      throw new ApiError(
        'Dokumen PDF tidak memiliki lapisan teks yang dapat dibaca (kemungkinan merupakan hasil pemindaian/scan murni atau dokumen kosong). Silakan unggah dokumen PDF dengan teks yang dapat diseleksi.',
        400,
        'UNPARSEABLE_CONTENT'
      );
    }

    // Konversi buffer ke base64 untuk native document block Claude API
    const base64Data = buffer.toString('base64');

    return {
      type: 'pdf',
      content: base64Data,
      metadata: {
        pageCount,
        charCount: extractedText.length,
      },
    };
  }

  // 3. Pemrosesan Dokumen DOCX (.docx) via mammoth
  if (fileName.endsWith('.docx')) {
    let buffer: Buffer;
    try {
      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new ApiError(
        `Gagal membaca berkas .docx: ${msg}`,
        400,
        'UNPARSEABLE_CONTENT'
      );
    }

    let extractedText = '';
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mammoth = require('mammoth');
      const result = await mammoth.extractRawText({ buffer });
      extractedText = (result.value || '').trim();
    } catch {
      throw new ApiError(
        'Berkas .docx rusak atau tidak dapat diekstraksi. Pastikan dokumen merupakan berkas Microsoft Word yang valid.',
        400,
        'UNPARSEABLE_CONTENT'
      );
    }

    if (extractedText.length < MIN_DOCUMENT_CHAR_LENGTH) {
      throw new ApiError(
        'Dokumen .docx kosong atau teks di dalamnya terlalu pendek (minimal 30 karakter).',
        400,
        'UNPARSEABLE_CONTENT'
      );
    }

    return {
      type: 'text',
      content: extractedText,
      metadata: {
        charCount: extractedText.length,
      },
    };
  }

  // 4. Pemrosesan Teks Polos (.txt / .md)
  if (fileName.endsWith('.txt') || fileName.endsWith('.md')) {
    let rawText = '';
    try {
      rawText = await file.text();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new ApiError(
        `Gagal membaca teks berkas: ${msg}`,
        400,
        'UNPARSEABLE_CONTENT'
      );
    }

    const cleanedText = rawText.trim();
    if (cleanedText.length < MIN_DOCUMENT_CHAR_LENGTH) {
      throw new ApiError(
        'Dokumen teks kosong atau terlalu pendek (minimal 30 karakter).',
        400,
        'UNPARSEABLE_CONTENT'
      );
    }

    return {
      type: 'text',
      content: cleanedText,
      metadata: {
        charCount: cleanedText.length,
      },
    };
  }

  // 5. Format Tidak Didukung
  throw new ApiError(
    'Format berkas tidak didukung. Mohon unggah dokumen berformat .pdf, .docx, .txt, atau .md.',
    400,
    'UNSUPPORTED_FILE_TYPE'
  );
}

/**
 * Backward compatibility alias jika masih ada yang memanggil extractDocumentText
 */
export async function extractDocumentText(file: File): Promise<string> {
  const doc = await extractDocumentContent(file);
  if (doc.type === 'text') {
    return doc.content;
  }
  const buffer = Buffer.from(doc.content, 'base64');
  return extractTextFromPdf(buffer);
}
