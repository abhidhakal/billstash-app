import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { getMonthlyStats } from '../services/billService';
import { CATEGORIES } from '../services/receiptParser';
import { ChevronLeft, ChevronRight, TrendingUp, Receipt, Store } from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import LoadingSpinner from '../components/LoadingSpinner';
import './AnalyticsPage.css';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// Monochrome + green palette for charts
const CHART_COLORS = [
  '#22C55E', // accent green
  '#6B7280', // gray
  '#9CA3AF', // lighter gray
  '#4B5563', // darker gray
  '#D1D5DB', // very light gray
  '#374151', // charcoal
  '#16A34A', // darker green
  '#A3A3A3', // neutral gray
  '#E5E7EB', // border gray
  '#52525B', // zinc
];

export default function AnalyticsPage() {
  const { user } = useAuth();
  const now = new Date();

  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadStats();
  }, [user, month, year]);

  async function loadStats() {
    setLoading(true);
    try {
      const data = await getMonthlyStats(user.uid, month, year);
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setLoading(false);
    }
  }

  function prevMonth() {
    if (month === 0) {
      setMonth(11);
      setYear(y => y - 1);
    } else {
      setMonth(m => m - 1);
    }
  }

  function nextMonth() {
    if (month === 11) {
      setMonth(0);
      setYear(y => y + 1);
    } else {
      setMonth(m => m + 1);
    }
  }

  // Chart data
  const categoryData = stats ? (() => {
    const entries = Object.entries(stats.byCategory).sort(([, a], [, b]) => b.total - a.total);
    return {
      labels: entries.map(([key]) => CATEGORIES.find(c => c.value === key)?.label || key),
      datasets: [{
        data: entries.map(([, val]) => val.total),
        backgroundColor: entries.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]),
        borderWidth: 0,
        hoverOffset: 4,
      }],
    };
  })() : null;

  const dailyData = stats ? (() => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const labels = [];
    const data = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dayStr = String(d).padStart(2, '0');
      labels.push(d);
      data.push(stats.byDay[dayStr] || 0);
    }
    const today = now.getDate();
    return {
      labels,
      datasets: [{
        data,
        backgroundColor: data.map((_, i) =>
          (i + 1 === today && month === now.getMonth() && year === now.getFullYear())
            ? '#22C55E' : 'var(--border)'
        ),
        borderRadius: 3,
        borderSkipped: false,
      }],
    };
  })() : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1C1C1E',
        titleColor: '#F5F5F5',
        bodyColor: '#9CA3AF',
        borderColor: '#2C2C2E',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 10,
        callbacks: {
          label: (ctx) => `Rs. ${ctx.parsed.toLocaleString('en-IN')}`,
        },
      },
    },
  };

  const barOptions = {
    ...chartOptions,
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: 'var(--text-tertiary)',
          font: { size: 10 },
          maxRotation: 0,
          callback: (val, i) => (i % 5 === 0 ? i + 1 : ''),
        },
        border: { display: false },
      },
      y: {
        grid: { color: 'var(--border-light)' },
        ticks: {
          color: 'var(--text-tertiary)',
          font: { size: 10 },
          callback: (val) => val >= 1000 ? `${val / 1000}k` : val,
        },
        border: { display: false },
      },
    },
  };

  const doughnutOptions = {
    ...chartOptions,
    cutout: '65%',
    plugins: {
      ...chartOptions.plugins,
      tooltip: {
        ...chartOptions.plugins.tooltip,
        callbacks: {
          label: (ctx) => {
            const total = ctx.dataset.data.reduce((s, v) => s + v, 0);
            const pct = total ? Math.round((ctx.parsed / total) * 100) : 0;
            return `${ctx.label}: Rs. ${ctx.parsed.toLocaleString('en-IN')} (${pct}%)`;
          },
        },
      },
    },
  };

  return (
    <div className="page">
      {/* Month Selector */}
      <div className="analytics-month-nav">
        <button className="btn btn-ghost btn-icon" onClick={prevMonth}>
          <ChevronLeft size={20} />
        </button>
        <h1 className="analytics-month-title">
          {MONTH_NAMES[month]} {year}
        </h1>
        <button className="btn btn-ghost btn-icon" onClick={nextMonth}>
          <ChevronRight size={20} />
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
          <LoadingSpinner size={28} />
        </div>
      ) : !stats || stats.billCount === 0 ? (
        <div className="empty-state">
          <TrendingUp size={48} strokeWidth={1} />
          <p>No spending data for this month.</p>
        </div>
      ) : (
        <div className="analytics-content animate-fade-in">
          {/* Stats Cards */}
          <div className="analytics-stats">
            <div className="analytics-stat card">
              <span className="analytics-stat-value">Rs. {stats.totalSpent.toLocaleString('en-IN')}</span>
              <span className="analytics-stat-label">Total Spent</span>
            </div>
            <div className="analytics-stat card">
              <span className="analytics-stat-value">{stats.billCount}</span>
              <span className="analytics-stat-label">Bills</span>
            </div>
            <div className="analytics-stat card">
              <span className="analytics-stat-value">Rs. {Math.round(stats.avgPerBill).toLocaleString('en-IN')}</span>
              <span className="analytics-stat-label">Avg / Bill</span>
            </div>
          </div>

          {/* Category Breakdown */}
          {categoryData && categoryData.labels.length > 0 && (
            <div className="analytics-section">
              <h2 className="section-title">By Category</h2>
              <div className="analytics-chart-card card">
                <div className="analytics-doughnut-container">
                  <Doughnut data={categoryData} options={doughnutOptions} />
                </div>
                <div className="analytics-legend">
                  {categoryData.labels.map((label, i) => (
                    <div key={label} className="analytics-legend-item">
                      <span
                        className="analytics-legend-dot"
                        style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                      />
                      <span className="analytics-legend-label">{label}</span>
                      <span className="analytics-legend-value">
                        Rs. {categoryData.datasets[0].data[i].toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Daily Spending */}
          {dailyData && (
            <div className="analytics-section">
              <h2 className="section-title">Daily Spending</h2>
              <div className="analytics-chart-card card">
                <div className="analytics-bar-container">
                  <Bar data={dailyData} options={barOptions} />
                </div>
              </div>
            </div>
          )}

          {/* Top Merchants */}
          {stats.topMerchants.length > 0 && (
            <div className="analytics-section">
              <h2 className="section-title">Top Merchants</h2>
              <div className="card">
                <div className="analytics-merchants">
                  {stats.topMerchants.map((m, i) => (
                    <div key={m.name} className="analytics-merchant-row">
                      <span className="analytics-merchant-rank">{i + 1}</span>
                      <div className="analytics-merchant-info">
                        <span className="analytics-merchant-name">{m.name}</span>
                        <span className="analytics-merchant-count">{m.count} bill{m.count !== 1 ? 's' : ''}</span>
                      </div>
                      <span className="analytics-merchant-total">
                        Rs. {m.total.toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
