import { useState, useEffect } from 'react';
import { Download, Share, X, Smartphone } from 'lucide-react';

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const inStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;

    setIsStandalone(inStandalone);
    if (inStandalone) return;

    const dismissedAt = localStorage.getItem('billstash-pwa-dismissed');
    if (dismissedAt && Date.now() - parseInt(dismissedAt, 10) < 7 * 24 * 60 * 60 * 1000) {
      return;
    }

    const ua = window.navigator.userAgent;
    const iosDevice = /iPhone|iPad|iPod/.test(ua) && !window.MSStream;
    setIsIOS(iosDevice);

    if (iosDevice) {
      setShowPrompt(true);
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  async function handleInstallClick() {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  }

  function handleDismiss() {
    setShowPrompt(false);
    localStorage.setItem('billstash-pwa-dismissed', Date.now().toString());
  }

  if (!showPrompt || isStandalone) return null;

  return (
    <div className="fixed bottom-[calc(var(--bottom-nav-height)+12px)] left-4 right-4 max-w-[480px] mx-auto p-4 flex items-center gap-3 z-50 shadow-xl border border-[var(--border)] bg-[var(--bg-card)] rounded-xl md:bottom-6 md:left-[calc(var(--sidebar-width)+24px)] md:right-auto md:m-0">
      <div className="w-10 h-10 rounded-lg bg-[var(--accent-subtle)] text-[var(--accent)] flex items-center justify-center shrink-0">
        <Smartphone size={22} />
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-[var(--text-primary)]">Install BillStash App</h4>
        <p className="text-xs text-[var(--text-secondary)] mt-0.5 leading-tight">
          {isIOS
            ? 'Tap the Share icon below, then select "Add to Home Screen"'
            : 'Install BillStash on your home screen for quick access & offline use.'}
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {deferredPrompt ? (
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-semibold rounded-lg transition-colors"
            onClick={handleInstallClick}
          >
            <Download size={14} /> Install
          </button>
        ) : isIOS ? (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent)] bg-[var(--accent-subtle)] px-2 py-1 rounded">
            <Share size={14} /> Share
          </span>
        ) : null}

        <button
          className="w-8 h-8 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-md transition-colors"
          onClick={handleDismiss}
          aria-label="Dismiss prompt"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
