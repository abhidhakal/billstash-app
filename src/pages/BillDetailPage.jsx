import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getBillById, updateBill, deleteBill } from '../services/billService';
import { CATEGORIES } from '../services/receiptParser';
import { ArrowLeft, Trash2, Edit3, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import './BillDetailPage.css';

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
      <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LoadingSpinner size={28} />
      </div>
    );
  }

  if (!bill) {
    return (
      <div className="page">
        <p className="text-secondary">Bill not found.</p>
        <button className="btn btn-ghost" onClick={() => navigate(-1)}>Go Back</button>
      </div>
    );
  }

  return (
    <div className="page">
      {/* Header */}
      <div className="detail-header">
        <button className="btn btn-ghost btn-icon" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </button>
        <div className="detail-header-actions">
          <button
            className="btn btn-ghost btn-icon"
            onClick={() => setEditing(!editing)}
          >
            <Edit3 size={18} />
          </button>
          <button
            className="btn btn-ghost btn-icon text-destructive"
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
            className="detail-image"
            onClick={() => setShowFullImage(!showFullImage)}
          >
            <img src={bill.imageUrl} alt="Receipt" />
            <span className="detail-image-hint">
              <ExternalLink size={14} /> Tap to {showFullImage ? 'collapse' : 'expand'}
            </span>
          </div>

          {showFullImage && (
            <div className="detail-image-full" onClick={() => setShowFullImage(false)}>
              <img src={bill.imageUrl} alt="Receipt full" />
            </div>
          )}
        </>
      )}

      {/* Bill Info */}
      <div className="detail-info card animate-slide-up">
        {editing ? (
          <div className="detail-edit-form">
            <div className="bill-form-field">
              <label>Merchant</label>
              <input
                type="text"
                value={editData.merchant}
                onChange={(e) => setEditData({ ...editData, merchant: e.target.value })}
              />
            </div>
            <div className="bill-form-field">
              <label>Amount (Rs.)</label>
              <input
                type="number"
                step="0.01"
                value={editData.amount}
                onChange={(e) => setEditData({ ...editData, amount: e.target.value })}
              />
            </div>
            <div className="bill-form-field">
              <label>Date</label>
              <input
                type="date"
                value={editData.date}
                onChange={(e) => setEditData({ ...editData, date: e.target.value })}
              />
            </div>
            <div className="bill-form-field">
              <label>Category</label>
              <select
                value={editData.category}
                onChange={(e) => setEditData({ ...editData, category: e.target.value })}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
            <div className="bill-form-field">
              <label>Notes</label>
              <textarea
                value={editData.notes}
                onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                rows={2}
              />
            </div>
            <div className="detail-edit-actions">
              <button className="btn btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSaveEdit}>Save Changes</button>
            </div>
          </div>
        ) : (
          <>
            <div className="detail-row detail-row-main">
              <span className="detail-merchant">{bill.merchant}</span>
              <span className="detail-amount">{formatAmount(bill.amount)}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Date</span>
              <span className="detail-value">{formatDate(bill.date)}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Category</span>
              <span className="badge badge-accent">{categoryLabel}</span>
            </div>
            {bill.notes && (
              <div className="detail-row">
                <span className="detail-label">Notes</span>
                <span className="detail-value">{bill.notes}</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Raw OCR Text */}
      {bill.rawText && (
        <div className="detail-raw animate-slide-up">
          <button
            className="btn btn-ghost btn-sm btn-full"
            onClick={() => setShowRawText(!showRawText)}
          >
            {showRawText ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            OCR Text
          </button>
          {showRawText && (
            <pre className="detail-raw-text">{bill.rawText}</pre>
          )}
        </div>
      )}
    </div>
  );
}
