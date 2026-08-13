import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getBills, getBillsPage } from '../services/billService';
import { CATEGORIES } from '../services/receiptParser';
import { Search, Filter, Receipt } from 'lucide-react';
import BillCard from '../components/BillCard';
import LoadingSpinner from '../components/LoadingSpinner';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function BillsPage() {
  const { user } = useAuth();
  const now = new Date();

  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [showFilters, setShowFilters] = useState(false);
  const [error, setError] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const [cursor, setCursor] = useState(null);

  useEffect(() => {
    if (!user) return;
    loadBills();
  }, [user, month, year, categoryFilter]);

  async function loadBills() {
    setLoading(true);
    try {
      setError('');
      const page = await getBillsPage(user.uid, {
        month,
        year,
        category: categoryFilter,
        search,
      });
      setBills(page.bills);
      setHasMore(page.hasMore);
      setCursor(page.cursor);
    } catch (err) {
      console.error('Failed to load bills:', err);
      setError('Bills could not be loaded.');
    } finally {
      setLoading(false);
    }
  }

  async function loadMore() {
    if (!cursor || !hasMore) return;
    try {
      const page = await getBillsPage(user.uid, { month, year, category: categoryFilter, search, cursor });
      setBills((current) => [...current, ...page.bills]);
      setHasMore(page.hasMore);
      setCursor(page.cursor);
    } catch (err) {
      setError('More bills could not be loaded.');
    }
  }

  useEffect(() => {
    if (!user) return;
    const timeout = setTimeout(loadBills, 300);
    return () => clearTimeout(timeout);
  }, [search]);

  const totalAmount = bills.reduce((sum, b) => sum + (b.amount || 0), 0);

  return (
    <div className="page">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[var(--text-primary)]">Bills</h1>
        <p className="text-xs text-[var(--text-secondary)] mt-1">
          {MONTH_NAMES[month]} {year} · {bills.length} bill{bills.length !== 1 ? 's' : ''} · Rs. {totalAmount.toLocaleString('en-IN')}
        </p>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1 flex items-center">
          <Search size={18} className="absolute left-3.5 text-[var(--text-tertiary)] pointer-events-none" />
          <input
            type="text"
            placeholder="Search merchants..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[var(--bg-input)] border border-[var(--border)] rounded-lg text-sm outline-none focus:border-[var(--accent)] text-[var(--text-primary)]"
          />
        </div>
        <button
          className={`w-10 h-10 flex items-center justify-center rounded-lg border border-[var(--border)] transition-colors ${
            showFilters ? 'bg-[var(--accent-subtle)] text-[var(--accent)]' : 'bg-[var(--bg-card)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
          }`}
          onClick={() => setShowFilters(!showFilters)}
          aria-label="Toggle filters"
        >
          <Filter size={18} />
        </button>
      </div>

      {showFilters && (
        <div className="grid grid-cols-2 gap-3 p-4 mb-4 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[var(--text-secondary)] font-medium">Month</label>
            <select
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value))}
              className="p-2 text-xs bg-[var(--bg-input)] border border-[var(--border)] rounded-lg outline-none text-[var(--text-primary)]"
            >
              {MONTH_NAMES.map((name, i) => (
                <option key={i} value={i}>{name}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[var(--text-secondary)] font-medium">Year</label>
            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="p-2 text-xs bg-[var(--bg-input)] border border-[var(--border)] rounded-lg outline-none text-[var(--text-primary)]"
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div className="col-span-full flex flex-col gap-1">
            <label className="text-xs text-[var(--text-secondary)] font-medium">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="p-2 text-xs bg-[var(--bg-input)] border border-[var(--border)] rounded-lg outline-none text-[var(--text-primary)]"
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Bills List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size={28} />
        </div>
      ) : error ? (
        <div className="p-6 text-center bg-[var(--bg-card)] border border-[var(--border-light)] rounded-2xl">
          <p className="text-sm text-[var(--destructive)]">{error}</p>
          <button className="mt-3 px-4 py-2 text-xs font-semibold rounded-lg bg-[var(--accent)] text-white" onClick={loadBills}>Retry</button>
        </div>
      ) : bills.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center text-[var(--text-tertiary)] bg-[var(--bg-card)] border border-[var(--border-light)] rounded-2xl">
          <Receipt size={48} strokeWidth={1} className="mb-4 opacity-40" />
          <p className="text-sm max-w-[260px]">No bills found. Try adjusting your filters.</p>
        </div>
      ) : (
        <div>
          <div className="px-4 bg-[var(--bg-card)] border border-[var(--border-light)] rounded-2xl shadow-sm">
            {bills.map((bill) => <BillCard key={bill.id} bill={bill} />)}
          </div>
          {hasMore && <button className="w-full mt-4 py-3 text-sm font-semibold text-[var(--accent-text)] bg-[var(--bg-card)] border border-[var(--border)] rounded-lg" onClick={loadMore}>Load more bills</button>}
        </div>
      )}
    </div>
  );
}
