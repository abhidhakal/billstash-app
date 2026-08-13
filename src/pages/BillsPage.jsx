import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getBills } from '../services/billService';
import { CATEGORIES } from '../services/receiptParser';
import { Search, Filter, Receipt } from 'lucide-react';
import BillCard from '../components/BillCard';
import LoadingSpinner from '../components/LoadingSpinner';
import './BillsPage.css';

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

  useEffect(() => {
    if (!user) return;
    loadBills();
  }, [user, month, year, categoryFilter]);

  async function loadBills() {
    setLoading(true);
    try {
      const data = await getBills(user.uid, {
        month,
        year,
        category: categoryFilter,
        search,
      });
      setBills(data);
    } catch (err) {
      console.error('Failed to load bills:', err);
    } finally {
      setLoading(false);
    }
  }

  // Debounced search
  useEffect(() => {
    if (!user) return;
    const timeout = setTimeout(loadBills, 300);
    return () => clearTimeout(timeout);
  }, [search]);

  const totalAmount = bills.reduce((sum, b) => sum + (b.amount || 0), 0);

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Bills</h1>
        <p className="page-subtitle">
          {MONTH_NAMES[month]} {year} · {bills.length} bill{bills.length !== 1 ? 's' : ''} · Rs. {totalAmount.toLocaleString('en-IN')}
        </p>
      </div>

      {/* Search & Filter */}
      <div className="bills-search-row">
        <div className="bills-search">
          <Search size={18} className="bills-search-icon" />
          <input
            type="text"
            placeholder="Search merchants..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          className={`btn btn-icon ${showFilters ? 'btn-secondary' : 'btn-ghost'}`}
          onClick={() => setShowFilters(!showFilters)}
          aria-label="Toggle filters"
        >
          <Filter size={18} />
        </button>
      </div>

      {showFilters && (
        <div className="bills-filters animate-slide-up">
          <div className="bills-filter-group">
            <label>Month</label>
            <select
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value))}
            >
              {MONTH_NAMES.map((name, i) => (
                <option key={i} value={i}>{name}</option>
              ))}
            </select>
          </div>
          <div className="bills-filter-group">
            <label>Year</label>
            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div className="bills-filter-group bills-filter-full">
            <label>Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
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
        <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
          <LoadingSpinner size={28} />
        </div>
      ) : bills.length === 0 ? (
        <div className="empty-state">
          <Receipt size={48} strokeWidth={1} />
          <p>No bills found. Try adjusting your filters.</p>
        </div>
      ) : (
        <div className="bills-list card">
          <div className="bills-list-inner">
            {bills.map((bill) => (
              <BillCard key={bill.id} bill={bill} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
