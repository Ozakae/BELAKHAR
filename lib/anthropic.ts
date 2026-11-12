import Anthropic from '@anthropic-ai/sdk';

export function getAnthropicClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY belum dikonfigurasi. Tambahkan ANTHROPIC_API_KEY di file .env.local.');
  }
  return new Anthropic({ apiKey });
}
