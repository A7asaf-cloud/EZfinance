import { createWorker } from 'tesseract.js';
import { Transaction } from '../types';

export async function extractTextFromImage(imageFile: File): Promise<string> {
  const worker = await createWorker('eng+heb');
  const ret = await worker.recognize(imageFile);
  await worker.terminate();
  return ret.data.text;
}

export function parseTransactionFromOCR(text: string): { amount?: number; date?: string; description?: string } {
  // Simple heuristic parsing for bank/receipt text
  // Looking for numbers like XX.XX
  const amountMatch = text.match(/(\d+\.\d{2})/);
  const dateMatch = text.match(/(\d{1,2}\/\d{1,2}\/\d{2,4})/);
  
  return {
    amount: amountMatch ? parseFloat(amountMatch[1]) : undefined,
    date: dateMatch ? new Date(dateMatch[1]).toISOString() : undefined,
    description: text.slice(0, 50).replace(/\n/g, ' ')
  };
}

export function parseCSV(csvText: string): Partial<Transaction>[] {
  const lines = csvText.split('\n');
  const result: Partial<Transaction>[] = [];
  
  // Basic CSV assumption: Date, Description, Amount, Type
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');
    if (cols.length >= 3) {
      result.push({
        date: new Date(cols[0]).toISOString(),
        description: cols[1],
        amount: Math.abs(parseFloat(cols[2])),
        type: parseFloat(cols[2]) >= 0 ? 'income' : 'expense'
      });
    }
  }
  return result;
}
