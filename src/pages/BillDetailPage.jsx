import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getBillById, updateBill, deleteBill } from '../services/billService';
import { CATEGORIES } from '../services/receiptParser';
import { ArrowLeft, Trash2, Edit3, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

function formatAmount(amount) {
  if (amount == null) return 'Rs. 0';
  return `Rs. ${amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export default function BillDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showRawText, setShowRawText] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);
  const [editData, setEditData] = useState({});

  useEffect(() => {
    loadBill();
  }, [id]);

  async function loadBill() {
    try {
      const data = await getBillById(user.uid, id);
      setBill(data);
      setEditData({
        merchant: data.merchant,
        amount: data.amount,
        date: data.date,
        category: data.category,
        notes: data.notes,
      });
    } catch (err) {
      console.error('Failed to load bill:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this bill? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await deleteBill(user.uid, id);
      navigate('/bills', { replace: true });
    } catch (err) {
      console.error('Failed to delete bill:', err);
      setDeleting(false);
    }
  }

  async function handleSaveEdit() {
    try {
      await updateBill(user.uid, id, {
        ...editData,
        amount: parseFloat(editData.amount) || 0,
      });
      setBill({ ...bill, ...editData, amount: parseFloat(editData.amount) || 0 });
      setEditing(false);
    } catch (err) {
      console.error('Failed to update bill:', err);
    }
  }

  const categoryLabel = CATEGORIES.find(c => c.value === bill?.category)?.label || 'Other';

  if (loading) {
    return (
      <div className="page flex items-center justify-center min-h-[300px]">
        <LoadingSpinner size={28} />
      </div>
    );
  }

  if (!bill) {
    return (
      <div className="page text-center py-12">
        <p className="text-sm text-[var(--text-secondary)] mb-4">Bill not found.</p>
        <button className="px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-lg transition-colors" onClick={() => navigate(-1)}>Go Back</button>
      </div>
    );
  }

  return (
    <div className="page">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button className="w-9 h-9 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-lg transition-colors" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-1">
          <button
            className="w-9 h-9 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-lg transition-colors"
            onClick={() => setEditing(!editing)}
          >
            <Edit3 size={18} />
          </button>
          <button
            className="w-9 h-9 flex items-center justify-center text-[var(--destructive)] hover:bg-[var(--destructive-subtle)] rounded-lg transition-colors"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? <LoadingSpinner size={18} /> : <Trash2 size={18} />}
          </button>
        </div>
      </div>

      {/* Receipt Image */}
      {bill.imageUrl && (
        <>
          <div
            className="relative rounded-xl overflow-hidden border border-[var(--border)] mb-4 cursor-pointer"
            onClick={() => setShowFullImage(!showFullImage)}
          >
            <img src={bill.imageUrl} alt="Receipt" className="w-full max-h-52 object-cover block" />
            <span className="absolute bottom-0 inset-x-0 flex items-center justify-center gap-1 p-2 bg-gradient-to-t from-black/70 to-transparent text-white text-xs">
              <ExternalLink size={14} /> Tap to {showFullImage ? 'collapse' : 'expand'}
            </span>
          </div>

          {showFullImage && (
            <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-pointer" onClick={() => setShowFullImage(false)}>
              <img src={bill.imageUrl} alt="Receipt full" className="max-w-[95%] max-h-[90vh] object-contain" />
            </div>
          )}
        </>
      )}

      {/* Bill Info */}
      <div className="p-5 mb-4 bg-[var(--bg-card)] border border-[var(--border-light)] rounded-2xl shadow-sm">
        {editing ? (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-[var(--text-secondary)]">Merchant</label>
              <input
                type="text"
                value={editData.merchant}
                onChange={(e) => setEditData({ ...editData, merchant: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-[var(--bg-input)] border border-[var(--border)] rounded-lg text-[var(--text-primary)]"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-[var(--text-secondary)]">Amount (Rs.)</label>
              <input
                type="number"
                step="0.01"
                value={editData.amount}
                onChange={(e) => setEditData({ ...editData, amount: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-[var(--bg-input)] border border-[var(--border)] rounded-lg text-[var(--text-primary)]"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-[var(--text-secondary)]">Date</label>
              <input
                type="date"
                value={editData.date}
                onChange={(e) => setEditData({ ...editData, date: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-[var(--bg-input)] border border-[var(--border)] rounded-lg text-[var(--text-primary)]"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-[var(--text-secondary)]">Category</label>
              <select
                value={editData.category}
                onChange={(e) => setEditData({ ...editData, category: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-[var(--bg-input)] border border-[var(--border)] rounded-lg text-[var(--text-primary)]"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-[var(--text-secondary)]">Notes</label>
              <textarea
                value={editData.notes}
                onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 text-sm bg-[var(--bg-input)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] resize-none"
              />
            </div>
            <div className="flex gap-3 mt-2">
              <button className="flex-1 py-2.5 text-sm font-semibold bg-[var(--bg-hover)] text-[var(--text-primary)] rounded-lg hover:bg-[var(--border)] transition-colors" onClick={() => setEditing(false)}>Cancel</button>
              <button className="flex-1 py-2.5 text-sm font-semibold bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent-hover)] transition-colors" onClick={handleSaveEdit}>Save Changes</button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-light)]">
            <div className="flex items-center justify-between pb-4 mb-1">
              <span className="text-lg font-bold text-[var(--text-primary)]">{bill.merchant}</span>
              <span className="text-xl font-extrabold text-[var(--accent)]">{formatAmount(bill.amount)}</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-xs text-[var(--text-secondary)]">Date</span>
              <span className="text-xs font-medium text-[var(--text-primary)] text-right">{formatDate(bill.date)}</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-xs text-[var(--text-secondary)]">Category</span>
              <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-[var(--accent-subtle)] text-[var(--accent-text)]">{categoryLabel}</span>
            </div>
            {bill.notes && (
              <div className="flex items-center justify-between py-3">
                <span className="text-xs text-[var(--text-secondary)]">Notes</span>
                <span className="text-xs text-[var(--text-primary)] text-right max-w-[200px]">{bill.notes}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Raw OCR Text */}
      {bill.rawText && (
        <div className="mb-4">
          <button
            className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-lg transition-colors"
            onClick={() => setShowRawText(!showRawText)}
          >
            {showRawText ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            OCR Text
          </button>
          {showRawText && (
            <pre className="mt-2 p-3 text-xs bg-[var(--bg-card)] border border-[var(--border)] rounded-md font-mono text-[var(--text-secondary)] whitespace-pre-wrap max-h-60 overflow-y-auto">
              {bill.rawText}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
