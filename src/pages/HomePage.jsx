import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getBills, getMonthlyStats } from '../services/billService';
import { ChevronDown, Plus, Receipt } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BillCard from '../components/BillCard';
import SpendingRing from '../components/SpendingRing';
import LoadingSpinner from '../components/LoadingSpinner';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const now = new Date();

  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [bills, setBills] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user, month, year]);

  async function loadData() {
    setLoading(true);
    try {
      setError('');
      const [billsData, statsData] = await Promise.all([
        getBills(user.uid, { month, year }),
        getMonthlyStats(user.uid, month, year),
      ]);
      setBills(billsData.slice(0, 10));
      setStats(statsData);
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Your spending data could not be loaded.');
    } finally {
      setLoading(false);
    }
  }

  const firstName = user?.displayName?.split(' ')[0] || 'there';

  return (
    <div className="page">
      {/* Header */}
      <div className="relative mb-5">
        <p className="text-xs text-[var(--text-secondary)] mb-1">{getGreeting()}, {firstName}</p>

        <button
          className="inline-flex items-center gap-2 text-lg font-bold text-[var(--text-primary)] px-2 py-1 -ml-2 rounded hover:bg-[var(--bg-hover)] transition-colors"
          onClick={() => setShowMonthPicker(!showMonthPicker)}
        >
          {MONTH_NAMES[month]} {year}
          <ChevronDown size={16} />
        </button>

        {showMonthPicker && (
          <div className="absolute top-full left-0 right-0 mt-2 p-3 grid grid-cols-3 gap-1 z-50 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl shadow-xl">
            {MONTH_NAMES.map((name, i) => (
              <button
                key={i}
                className={`p-2 rounded text-xs transition-colors ${
                  i === month
                    ? 'bg-[var(--accent-subtle)] text-[var(--accent)] font-semibold'
                    : 'text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                }`}
                onClick={() => {
                  setMonth(i);
                  setShowMonthPicker(false);
                }}
              >
                {name}
              </button>
            ))}
            <div className="col-span-full flex items-center justify-between pt-2 mt-2 border-t border-[var(--border)] text-xs text-[var(--text-secondary)]">
              <button onClick={() => setYear(y => y - 1)} className="hover:text-[var(--accent)]">&larr; {year - 1}</button>
              <span className="font-semibold">{year}</span>
              <button onClick={() => setYear(y => y + 1)} className="hover:text-[var(--accent)]">{year + 1} &rarr;</button>
            </div>
          </div>
        )}
      </div>

      {/* Spending Summary */}
      {error && <div className="p-3 mb-4 text-xs text-[var(--destructive)] bg-[var(--destructive-subtle)] rounded-lg text-center">{error} <button className="font-bold underline ml-1" onClick={loadData}>Retry</button></div>}
      <div className="p-5 mb-5 bg-[var(--bg-card)] border border-[var(--border-light)] rounded-2xl shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Total Spent</span>
            <span className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
              Rs. {(stats?.totalSpent || 0).toLocaleString('en-IN')}
            </span>
            <span className="text-xs text-[var(--text-secondary)]">
              {stats?.billCount || 0} bill{(stats?.billCount || 0) !== 1 ? 's' : ''}
            </span>
          </div>
          <SpendingRing amount={stats?.totalSpent || 0} size={100} />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3 mb-6">
        <button
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-semibold text-sm rounded-lg transition-colors"
          onClick={() => navigate('/scan')}
        >
          <Plus size={18} />
          Scan Bill
        </button>
        <button
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-[var(--bg-hover)] hover:bg-[var(--border)] text-[var(--text-primary)] font-semibold text-sm rounded-lg transition-colors"
          onClick={() => navigate('/scan?manual=true')}
        >
          <Plus size={18} />
          Add Manually
        </button>
      </div>

      {/* Recent Bills */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-[var(--text-primary)]">Recent Bills</h2>
          {bills.length > 0 && (
            <button
              className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-medium"
              onClick={() => navigate('/bills')}
            >
              View All
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner size={28} />
          </div>
        ) : bills.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center text-[var(--text-tertiary)] bg-[var(--bg-card)] border border-[var(--border-light)] rounded-2xl">
            <Receipt size={48} strokeWidth={1} className="mb-4 opacity-40" />
            <p className="text-sm max-w-[260px]">No bills yet this month. Tap "Scan Bill" to get started.</p>
          </div>
        ) : (
          <div className="px-4 bg-[var(--bg-card)] border border-[var(--border-light)] rounded-2xl shadow-sm">
            {bills.map((bill) => (
              <BillCard key={bill.id} bill={bill} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
