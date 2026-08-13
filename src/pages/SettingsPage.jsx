import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getBills, exportToCSV, deleteAllBills } from '../services/billService';
import { User, Moon, Sun, Monitor, Download, LogOut, Receipt, ShieldCheck, Trash2 } from 'lucide-react';

function getTheme() {
  return localStorage.getItem('billstash-theme') || 'system';
}

function setTheme(theme) {
  localStorage.setItem('billstash-theme', theme);
  document.documentElement.setAttribute('data-theme', theme);
}

export default function SettingsPage() {
  const { user, signOut, deleteAccount } = useAuth();
  const [currentTheme, setCurrentTheme] = useState(getTheme());
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  function handleThemeChange(theme) {
    setCurrentTheme(theme);
    setTheme(theme);
  }

  async function handleExport() {
    setExporting(true);
    try {
      const bills = await getBills(user.uid);
      const csv = exportToCSV(bills);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `billstash-export-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExporting(false);
    }
  }

  async function handleSignOut() {
    try {
      await signOut();
    } catch (err) {
      console.error('Sign out failed:', err);
    }
  }

  async function handleDeleteAccount() {
    if (!window.confirm('Delete your account and all bills and receipt images? This cannot be undone.')) return;
    setDeleting(true);
    setError('');
    try {
      await deleteAllBills(user.uid);
      await deleteAccount();
    } catch (err) {
      setError(err.code === 'auth/requires-recent-login'
        ? 'For security, sign in again before deleting your account.'
        : 'Account deletion failed. Your data was not fully removed.');
      setDeleting(false);
    }
  }

  return (
    <div className="page">
      {error && <div className="p-3 mb-4 text-xs text-center text-[var(--destructive)] bg-[var(--destructive-subtle)] rounded-lg">{error}</div>}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[var(--text-primary)]">Settings</h1>
      </div>

      {/* Profile */}
      <div className="mb-6">
        <div className="flex items-center gap-3 p-4 bg-[var(--bg-card)] border border-[var(--border-light)] rounded-2xl shadow-sm">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-[var(--accent-subtle)] text-[var(--accent)] flex items-center justify-center shrink-0">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
            ) : (
              <User size={24} />
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold text-[var(--text-primary)] truncate">
              {user?.displayName || 'User'}
            </span>
            <span className="text-xs text-[var(--text-secondary)] truncate">
              {user?.email}
            </span>
          </div>
        </div>
      </div>

      {/* Appearance */}
      <div className="mb-6">
        <h2 className="text-sm font-bold text-[var(--text-primary)] mb-3">Appearance</h2>
        <div className="p-3 bg-[var(--bg-card)] border border-[var(--border-light)] rounded-2xl shadow-sm">
          <div className="grid grid-cols-3 gap-2">
            <button
              className={`flex items-center justify-center gap-2 p-2.5 rounded-lg text-xs font-semibold transition-colors ${
                currentTheme === 'light'
                  ? 'bg-[var(--accent-subtle)] text-[var(--accent)] border border-[var(--accent)]'
                  : 'bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
              onClick={() => handleThemeChange('light')}
            >
              <Sun size={18} />
              Light
            </button>
            <button
              className={`flex items-center justify-center gap-2 p-2.5 rounded-lg text-xs font-semibold transition-colors ${
                currentTheme === 'dark'
                  ? 'bg-[var(--accent-subtle)] text-[var(--accent)] border border-[var(--accent)]'
                  : 'bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
              onClick={() => handleThemeChange('dark')}
            >
              <Moon size={18} />
              Dark
            </button>
            <button
              className={`flex items-center justify-center gap-2 p-2.5 rounded-lg text-xs font-semibold transition-colors ${
                currentTheme === 'system'
                  ? 'bg-[var(--accent-subtle)] text-[var(--accent)] border border-[var(--accent)]'
                  : 'bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
              onClick={() => handleThemeChange('system')}
            >
              <Monitor size={18} />
              System
            </button>
          </div>
        </div>
      </div>

      {/* Data */}
      <div className="mb-6">
        <h2 className="text-sm font-bold text-[var(--text-primary)] mb-3">Data</h2>
        <div className="bg-[var(--bg-card)] border border-[var(--border-light)] rounded-2xl shadow-sm overflow-hidden">
          <button
            className="w-full flex items-center gap-3 p-4 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors text-left"
            onClick={handleExport}
            disabled={exporting}
          >
            <Download size={18} className="text-[var(--text-secondary)]" />
            <span>{exporting ? 'Exporting...' : 'Export Bills as CSV'}</span>
          </button>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-sm font-bold text-[var(--text-primary)] mb-3">Privacy</h2>
        <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-light)] rounded-2xl shadow-sm">
          <div className="flex items-start gap-3">
            <ShieldCheck size={18} className="text-[var(--accent)] mt-0.5 shrink-0" />
            <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
              Your bills and receipt images are stored in your private Firebase account. BillStash does not share your spending data with other users. Use the CSV export above to keep a portable copy of your records.
            </p>
          </div>
        </div>
      </div>

      {/* Account */}
      <div className="mb-8">
        <h2 className="text-sm font-bold text-[var(--text-primary)] mb-3">Account</h2>
        <div className="bg-[var(--bg-card)] border border-[var(--border-light)] rounded-2xl shadow-sm overflow-hidden">
          <button
            className="w-full flex items-center gap-3 p-4 text-xs font-semibold text-[var(--destructive)] hover:bg-[var(--destructive-subtle)] transition-colors text-left"
            onClick={handleSignOut}
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
          <button disabled={deleting} onClick={handleDeleteAccount} className="w-full flex items-center gap-3 p-4 text-xs font-semibold text-[var(--destructive)] hover:bg-[var(--destructive-subtle)] transition-colors text-left border-t border-[var(--border-light)] disabled:opacity-50">
            <Trash2 size={18} />
            <span>{deleting ? 'Deleting account...' : 'Delete account and all data'}</span>
          </button>
        </div>
      </div>

      {/* App Info */}
      <div className="flex items-center justify-center gap-2 text-xs text-[var(--text-tertiary)] py-4">
        <Receipt size={16} />
        <span>BillStash v1.0.0</span>
      </div>
    </div>
  );
}
