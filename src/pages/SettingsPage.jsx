import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getBills, exportToCSV } from '../services/billService';
import { User, Moon, Sun, Monitor, Download, LogOut, Receipt } from 'lucide-react';
import './SettingsPage.css';

function getTheme() {
  return localStorage.getItem('billstash-theme') || 'system';
}

function setTheme(theme) {
  localStorage.setItem('billstash-theme', theme);
  document.documentElement.setAttribute('data-theme', theme);
}

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const [currentTheme, setCurrentTheme] = useState(getTheme());
  const [exporting, setExporting] = useState(false);

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

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
      </div>

      {/* Profile */}
      <div className="settings-section">
        <div className="settings-profile card">
          <div className="settings-avatar">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="" />
            ) : (
              <User size={24} />
            )}
          </div>
          <div className="settings-profile-info">
            <span className="settings-profile-name">
              {user?.displayName || 'User'}
            </span>
            <span className="settings-profile-email">
              {user?.email}
            </span>
          </div>
        </div>
      </div>

      {/* Appearance */}
      <div className="settings-section">
        <h2 className="section-title">Appearance</h2>
        <div className="settings-group card">
          <div className="settings-theme-options">
            <button
              className={`settings-theme-btn ${currentTheme === 'light' ? 'active' : ''}`}
              onClick={() => handleThemeChange('light')}
            >
              <Sun size={18} />
              Light
            </button>
            <button
              className={`settings-theme-btn ${currentTheme === 'dark' ? 'active' : ''}`}
              onClick={() => handleThemeChange('dark')}
            >
              <Moon size={18} />
              Dark
            </button>
            <button
              className={`settings-theme-btn ${currentTheme === 'system' ? 'active' : ''}`}
              onClick={() => handleThemeChange('system')}
            >
              <Monitor size={18} />
              System
            </button>
          </div>
        </div>
      </div>

      {/* Data */}
      <div className="settings-section">
        <h2 className="section-title">Data</h2>
        <div className="settings-group card">
          <button
            className="settings-row"
            onClick={handleExport}
            disabled={exporting}
          >
            <Download size={18} className="settings-row-icon" />
            <span>{exporting ? 'Exporting...' : 'Export Bills as CSV'}</span>
          </button>
        </div>
      </div>

      {/* Account */}
      <div className="settings-section">
        <h2 className="section-title">Account</h2>
        <div className="settings-group card">
          <button
            className="settings-row settings-row-destructive"
            onClick={handleSignOut}
          >
            <LogOut size={18} className="settings-row-icon" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* App Info */}
      <div className="settings-footer">
        <Receipt size={16} />
        <span>BillStash v1.0.0</span>
      </div>
    </div>
  );
}
