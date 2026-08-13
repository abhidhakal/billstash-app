import { useState } from 'react';
import { CATEGORIES } from '../services/receiptParser';

export default function BillForm({
  initialData = {},
  imagePreview = null,
  onSubmit,
  loading = false,
  submitLabel = 'Save Bill',
}) {
  const [merchant, setMerchant] = useState(initialData.merchant || '');
  const [amount, setAmount] = useState(initialData.amount || '');
  const [date, setDate] = useState(initialData.date || new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState(initialData.category || 'other');
  const [notes, setNotes] = useState(initialData.notes || '');
  const [showRawText, setShowRawText] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    if (!merchant.trim() || !amount || Number(amount) < 0 || !date) return;
    onSubmit({
      merchant,
      amount: parseFloat(amount) || 0,
      date,
      category,
      notes,
      rawText: initialData.rawText || '',
    });
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      {imagePreview && (
        <div className="rounded-lg overflow-hidden border border-[var(--border)] max-h-[200px]">
          <img src={imagePreview} alt="Receipt" className="w-full h-full object-cover" />
        </div>
      )}

      <div className="flex flex-col gap-1">
        <label htmlFor="merchant" className="text-xs font-semibold text-[var(--text-secondary)]">Merchant</label>
        <input
          id="merchant"
          type="text"
          value={merchant}
          onChange={(e) => setMerchant(e.target.value)}
          placeholder="e.g. BigMart"
          className="w-full px-3 py-2 text-sm bg-[var(--bg-input)] border border-[var(--border)] rounded-lg outline-none focus:border-[var(--accent)] text-[var(--text-primary)]"
          required
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="amount" className="text-xs font-semibold text-[var(--text-secondary)]">Amount (Rs.)</label>
        <input
          id="amount"
          type="number"
          step="0.01"
          min="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          className="w-full px-3 py-2 text-sm bg-[var(--bg-input)] border border-[var(--border)] rounded-lg outline-none focus:border-[var(--accent)] text-[var(--text-primary)]"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="date" className="text-xs font-semibold text-[var(--text-secondary)]">Date</label>
          <input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-[var(--bg-input)] border border-[var(--border)] rounded-lg outline-none focus:border-[var(--accent)] text-[var(--text-primary)]"
            required
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="category" className="text-xs font-semibold text-[var(--text-secondary)]">Category</label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-[var(--bg-input)] border border-[var(--border)] rounded-lg outline-none focus:border-[var(--accent)] text-[var(--text-primary)]"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="notes" className="text-xs font-semibold text-[var(--text-secondary)]">Items / Notes (optional)</label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Milk, Rice, Coffee..."
          rows={2}
          className="w-full px-3 py-2 text-sm bg-[var(--bg-input)] border border-[var(--border)] rounded-lg outline-none focus:border-[var(--accent)] text-[var(--text-primary)] resize-none"
        />
      </div>

      {initialData.rawText && (
        <div className="mt-1">
          <button
            type="button"
            className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] py-1"
            onClick={() => setShowRawText(!showRawText)}
          >
            {showRawText ? 'Hide' : 'Show'} OCR Text
          </button>
          {showRawText && (
            <pre className="p-3 text-xs bg-[var(--bg-hover)] border border-[var(--border)] rounded-md font-mono whitespace-pre-wrap max-h-40 overflow-y-auto mt-1">
              {initialData.rawText}
            </pre>
          )}
        </div>
      )}

      <button
        type="submit"
        className="w-full py-3 mt-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-semibold text-sm rounded-lg transition-colors disabled:opacity-50"
        disabled={loading || !merchant || !amount}
      >
        {loading ? 'Saving...' : submitLabel}
      </button>
    </form>
  );
}
