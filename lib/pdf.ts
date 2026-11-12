export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  try {
    // Dynamic import to keep server-only boundary clean
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PDFParse } = require('pdf-parse');
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    if (typeof parser.destroy === 'function') {
      await parser.destroy();
    }
    return result.text || '';
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Gagal membaca berkas PDF: ${message}`);
  }
}
