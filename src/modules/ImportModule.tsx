import React, { useState, useRef } from 'react';
import { Card, Button } from '../components/UI';
import { extractTextFromImage, parseTransactionFromOCR, parseCSV } from '../lib/dataUtils';
import { useFinanceData } from '../hooks/useFinanceData';
import { FileUp, Image as ImageIcon, Camera, Check, AlertCircle, Loader2 } from 'lucide-react';
import { cn, formatCurrency, formatDate } from '../lib/utils';
import { motion } from 'motion/react';

export default function ImportModule() {
  const { addTransaction } = useFinanceData();
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<any[]>([]);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setPreview([]);
    setSuccess(false);

    try {
      if (file.type.includes('image')) {
        const text = await extractTextFromImage(file);
        const parsed = parseTransactionFromOCR(text);
        setPreview([{
          ...parsed,
          id: 'ocr-temp',
          type: 'expense'
        }]);
      } else if (file.name.endsWith('.csv')) {
        const text = await file.text();
        const parsed = parseCSV(text);
        setPreview(parsed);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const saveImported = () => {
    preview.forEach(p => {
      addTransaction({
        amount: p.amount || 0,
        type: p.type || 'expense',
        category: 'Imported',
        description: p.description || 'Imported Transaction',
        date: p.date || new Date().toISOString(),
        account: 'Import'
      });
    });
    setSuccess(true);
    setPreview([]);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-black">Import Your Data</h2>
        <p className="text-stone-500 max-w-lg mx-auto">
          Upload bank statements (CSV) or capture a photo of your receipt. 
          Our client-side OCR will extract information securely.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="p-0 border-dashed border-2 border-stone-200 dark:border-stone-800 hover:border-stone-900 dark:hover:border-stone-400 transition-all">
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden" 
            accept="image/*,.csv"
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="w-full p-12 flex flex-col items-center justify-center gap-4 group"
          >
            <div className="w-16 h-16 bg-stone-100 dark:bg-stone-900 rounded-full flex items-center justify-center text-stone-400 group-hover:scale-110 transition-transform">
              <FileUp className="w-8 h-8" />
            </div>
            <div>
              <p className="font-bold text-lg">Click to Upload</p>
              <p className="text-xs text-stone-500">CSV Bank Statements, JPEGs or PNG Receipts</p>
            </div>
          </button>
        </Card>

        <Card className="bg-stone-900 border-none text-white overflow-hidden relative">
           <div className="relative z-10 p-2">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Camera className="w-5 h-5 text-blue-400" />
                OCR Extraction
              </h3>
              <div className="aspect-video bg-black/40 rounded-xl border border-stone-800 flex items-center justify-center p-8">
                {loading ? (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
                    <p className="text-xs font-bold uppercase tracking-widest text-blue-400">Processing Image...</p>
                  </div>
                ) : preview.length > 0 ? (
                  <div className="w-full space-y-2">
                    <Check className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    <p className="text-center font-bold text-sm">Data Extracted Successfully</p>
                  </div>
                ) : (
                  <div className="text-center opacity-30">
                    <ImageIcon className="w-12 h-12 mx-auto mb-2" />
                    <p className="text-xs uppercase font-bold tracking-tighter">No Image Loaded</p>
                  </div>
                )}
              </div>
              <ul className="mt-6 space-y-2 text-[10px] text-stone-500 italic uppercase font-bold">
                 <li className="flex items-center gap-2"><Check className="w-3 h-3 text-emerald-500" /> Tesseract.js local processing</li>
                 <li className="flex items-center gap-2"><Check className="w-3 h-3 text-emerald-500" /> No data leaves your browser</li>
                 <li className="flex items-center gap-2"><Check className="w-3 h-3 text-emerald-500" /> Highly Secure</li>
              </ul>
           </div>
           <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full" />
        </Card>
      </div>

      {preview.length > 0 && (
        <Card title="Extraction Preview" className="border-stone-900 border-2">
          <div className="space-y-4">
            <div className="max-h-[300px] overflow-y-auto rounded-xl">
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-white dark:bg-stone-900 border-b border-stone-100 dark:border-stone-800">
                   <tr>
                    <th className="py-3 px-4 text-[10px] font-bold uppercase text-stone-400">Date</th>
                    <th className="py-3 px-4 text-[10px] font-bold uppercase text-stone-400">Description</th>
                    <th className="py-3 px-4 text-[10px] font-bold uppercase text-stone-400 text-right">Amount</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-stone-50 dark:divide-stone-900">
                  {preview.map((p, i) => (
                    <tr key={i}>
                      <td className="py-3 px-4 text-xs">{p.date ? formatDate(p.date) : 'Unknown'}</td>
                      <td className="py-3 px-4 text-xs font-bold truncate max-w-[200px]">{p.description}</td>
                      <td className={cn(
                        "py-3 px-4 text-xs font-black text-right tabular-nums",
                        p.type === 'income' ? 'text-emerald-500' : 'text-stone-900 dark:text-stone-100'
                      )}>
                        {formatCurrency(p.amount || 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-end gap-4 pt-4 border-t border-stone-100 dark:border-stone-800">
               <Button variant="secondary" onClick={() => setPreview([])}>Cancel</Button>
               <Button onClick={saveImported}>Confirm & Save {preview.length} Entries</Button>
            </div>
          </div>
        </Card>
      )}

      {success && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-3xl flex items-center gap-4 text-emerald-700 dark:text-emerald-400"
        >
          <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center">
            <Check className="w-6 h-6" />
          </div>
          <div>
            <p className="font-bold">Import Success!</p>
            <p className="text-sm opacity-80">All records have been added to your cash account.</p>
          </div>
        </motion.div>
      )}

      <div className="p-8 bg-stone-100 dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800">
         <h4 className="font-bold text-sm mb-4 flex items-center gap-2">
           <AlertCircle className="w-4 h-4 text-stone-400" />
           Format Guidelines
         </h4>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-stone-500">
            <div className="space-y-2">
              <p className="font-bold text-stone-700 dark:text-stone-300">Bank CSV</p>
              <p>Header row required. Columns: [Date, Description, Amount]. Use comma delimiter.</p>
            </div>
            <div className="space-y-2">
              <p className="font-bold text-stone-700 dark:text-stone-300">Scanning Receipts</p>
              <p>Place receipt on flat surface with high contrast. Ensure text is readable and well-lit.</p>
            </div>
            <div className="space-y-2">
              <p className="font-bold text-stone-700 dark:text-stone-300">Privacy First</p>
              <p>All processing happens in your browser. We never upload your sensitive financial files to any server.</p>
            </div>
         </div>
      </div>
    </div>
  );
}
