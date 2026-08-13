import { useState } from 'react';
import { CATEGORIES } from '../services/receiptParser';
import './BillForm.css';

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
    <form className="bill-form" onSubmit={handleSubmit}>
      {imagePreview && (
        <div className="bill-form-image">
          <img src={imagePreview} alt="Receipt" />
        </div>
      )}

      <div className="bill-form-field">
        <label htmlFor="merchant">Merchant</label>
        <input
          id="merchant"
          type="text"
          value={merchant}
          onChange={(e) => setMerchant(e.target.value)}
          placeholder="e.g. BigMart"
          required
        />
      </div>

      <div className="bill-form-field">
        <label htmlFor="amount">Amount (Rs.)</label>
        <input
          id="amount"
          type="number"
          step="0.01"
          min="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          required
        />
      </div>

      <div className="bill-form-row">
        <div className="bill-form-field">
          <label htmlFor="date">Date</label>
          <input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>

        <div className="bill-form-field">
          <label htmlFor="category">Category</label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bill-form-field">
        <label htmlFor="notes">Notes (optional)</label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any notes..."
          rows={2}
        />
      </div>

      {initialData.rawText && (
        <div className="bill-form-raw">
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setShowRawText(!showRawText)}
          >
            {showRawText ? 'Hide' : 'Show'} OCR Text
          </button>
          {showRawText && (
            <pre className="bill-form-raw-text">{initialData.rawText}</pre>
          )}
        </div>
      )}

      <button
        type="submit"
        className="btn btn-primary btn-lg btn-full"
        disabled={loading || !merchant || !amount}
      >
        {loading ? 'Saving...' : submitLabel}
      </button>
    </form>
  );
}
