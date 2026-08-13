import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getMonthlyStats } from '../services/billService';
import { CATEGORIES } from '../services/receiptParser';
import { ChevronLeft, ChevronRight, TrendingUp } from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import LoadingSpinner from '../components/LoadingSpinner';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const CHART_COLORS = [
  '#22C55E',
  '#6B7280',
  '#9CA3AF',
  '#4B5563',
  '#D1D5DB',
  '#374151',
  '#16A34A',
  '#A3A3A3',
  '#E5E7EB',
  '#52525B',
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
      labels.push(d);
      data.push(stats.byDay[String(d).padStart(2, '0')] || 0);
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
      <div className="flex items-center justify-between mb-6">
        <button className="w-9 h-9 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-lg transition-colors" onClick={prevMonth}>
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-lg font-bold text-[var(--text-primary)]">
          {MONTH_NAMES[month]} {year}
        </h1>
        <button className="w-9 h-9 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-lg transition-colors" onClick={nextMonth}>
          <ChevronRight size={20} />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size={28} />
        </div>
      ) : !stats || stats.billCount === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center text-[var(--text-tertiary)] bg-[var(--bg-card)] border border-[var(--border-light)] rounded-2xl">
          <TrendingUp size={48} strokeWidth={1} className="mb-4 opacity-40" />
          <p className="text-sm">No spending data for this month.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6 animate-fade-in">
          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col items-center gap-1 p-4 bg-[var(--bg-card)] border border-[var(--border-light)] rounded-2xl text-center shadow-sm">
              <span className="text-sm font-bold text-[var(--text-primary)]">Rs. {stats.totalSpent.toLocaleString('en-IN')}</span>
              <span className="text-xs text-[var(--text-tertiary)]">Total Spent</span>
            </div>
            <div className="flex flex-col items-center gap-1 p-4 bg-[var(--bg-card)] border border-[var(--border-light)] rounded-2xl text-center shadow-sm">
              <span className="text-sm font-bold text-[var(--text-primary)]">{stats.billCount}</span>
              <span className="text-xs text-[var(--text-tertiary)]">Bills</span>
            </div>
            <div className="flex flex-col items-center gap-1 p-4 bg-[var(--bg-card)] border border-[var(--border-light)] rounded-2xl text-center shadow-sm">
              <span className="text-sm font-bold text-[var(--text-primary)]">Rs. {Math.round(stats.avgPerBill).toLocaleString('en-IN')}</span>
              <span className="text-xs text-[var(--text-tertiary)]">Avg / Bill</span>
            </div>
          </div>

          {/* Category Breakdown */}
          {categoryData && categoryData.labels.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-[var(--text-primary)] mb-3">By Category</h2>
              <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-light)] rounded-2xl shadow-sm">
                <div className="max-w-[200px] mx-auto mb-4">
                  <Doughnut data={categoryData} options={doughnutOptions} />
                </div>
                <div className="flex flex-col gap-2">
                  {categoryData.labels.map((label, i) => (
                    <div key={label} className="flex items-center gap-2 text-xs">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                      />
                      <span className="flex-1 text-[var(--text-primary)]">{label}</span>
                      <span className="text-[var(--text-secondary)] font-semibold">
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
            <div>
              <h2 className="text-sm font-bold text-[var(--text-primary)] mb-3">Daily Spending</h2>
              <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-light)] rounded-2xl shadow-sm">
                <div className="h-48">
                  <Bar data={dailyData} options={barOptions} />
                </div>
              </div>
            </div>
          )}

          {/* Top Merchants */}
          {stats.topMerchants.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-[var(--text-primary)] mb-3">Top Merchants</h2>
              <div className="bg-[var(--bg-card)] border border-[var(--border-light)] rounded-2xl shadow-sm px-4 divide-y divide-[var(--border-light)]">
                {stats.topMerchants.map((m, i) => (
                  <div key={m.name} className="flex items-center gap-3 py-3">
                    <span className="w-6 h-6 flex items-center justify-center text-xs font-semibold text-[var(--text-tertiary)] bg-[var(--bg-hover)] rounded-full shrink-0">
                      {i + 1}
                    </span>
                    <div className="flex-1 flex flex-col min-w-0">
                      <span className="text-xs font-semibold text-[var(--text-primary)] truncate">{m.name}</span>
                      <span className="text-[10px] text-[var(--text-tertiary)]">{m.count} bill{m.count !== 1 ? 's' : ''}</span>
                    </div>
                    <span className="text-xs font-bold text-[var(--text-primary)]">
                      Rs. {m.total.toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
