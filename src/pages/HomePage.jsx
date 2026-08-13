import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getBills, getMonthlyStats } from '../services/billService';
import { ChevronDown, Plus, Receipt } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BillCard from '../components/BillCard';
import SpendingRing from '../components/SpendingRing';
import LoadingSpinner from '../components/LoadingSpinner';
import './HomePage.css';

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

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user, month, year]);

  async function loadData() {
    setLoading(true);
    try {
      const [billsData, statsData] = await Promise.all([
        getBills(user.uid, { month, year }),
        getMonthlyStats(user.uid, month, year),
      ]);
      setBills(billsData.slice(0, 10));
      setStats(statsData);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  }

  const firstName = user?.displayName?.split(' ')[0] || 'there';

  return (
    <div className="page">
      {/* Header */}
      <div className="home-header animate-slide-up">
        <p className="home-greeting">{getGreeting()}, {firstName}</p>

        <button
          className="home-month-selector"
          onClick={() => setShowMonthPicker(!showMonthPicker)}
        >
          {MONTH_NAMES[month]} {year}
          <ChevronDown size={16} />
        </button>

        {showMonthPicker && (
          <div className="home-month-picker card">
            {MONTH_NAMES.map((name, i) => (
              <button
                key={i}
                className={`home-month-option ${i === month ? 'active' : ''}`}
                onClick={() => {
                  setMonth(i);
                  setShowMonthPicker(false);
                }}
              >
                {name}
              </button>
            ))}
            <div className="home-year-nav">
              <button onClick={() => setYear(y => y - 1)}>&larr; {year - 1}</button>
              <span>{year}</span>
              <button onClick={() => setYear(y => y + 1)}>{year + 1} &rarr;</button>
            </div>
          </div>
        )}
      </div>

      {/* Spending Summary */}
      <div className="home-summary card animate-slide-up">
        <div className="home-summary-content">
          <div className="home-summary-text">
            <span className="home-summary-label">Total Spent</span>
            <span className="home-summary-amount">
              Rs. {(stats?.totalSpent || 0).toLocaleString('en-IN')}
            </span>
            <span className="home-summary-count">
              {stats?.billCount || 0} bill{(stats?.billCount || 0) !== 1 ? 's' : ''}
            </span>
          </div>
          <SpendingRing amount={stats?.totalSpent || 0} size={100} />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="home-actions animate-slide-up">
        <button
          className="btn btn-primary"
          onClick={() => navigate('/scan')}
        >
          <Plus size={18} />
          Scan Bill
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => navigate('/scan?manual=true')}
        >
          <Plus size={18} />
          Add Manually
        </button>
      </div>

      {/* Recent Bills */}
      <div className="section animate-slide-up">
        <div className="section-header">
          <h2 className="section-title">Recent Bills</h2>
          {bills.length > 0 && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => navigate('/bills')}
            >
              View All
            </button>
          )}
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-8)' }}>
            <LoadingSpinner size={28} />
          </div>
        ) : bills.length === 0 ? (
          <div className="empty-state">
            <Receipt size={48} strokeWidth={1} />
            <p>No bills yet this month. Tap "Scan Bill" to get started.</p>
          </div>
        ) : (
          <div className="home-bills-list">
            {bills.map((bill) => (
              <BillCard key={bill.id} bill={bill} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
