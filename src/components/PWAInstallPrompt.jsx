import { useState, useEffect } from 'react';
import { Download, Share, X, Smartphone } from 'lucide-react';
import './PWAInstallPrompt.css';

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode (already installed)
    const inStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;

    setIsStandalone(inStandalone);
    if (inStandalone) return;

    // Check if dismissed recently (within 7 days)
    const dismissedAt = localStorage.getItem('billstash-pwa-dismissed');
    if (dismissedAt && Date.now() - parseInt(dismissedAt, 10) < 7 * 24 * 60 * 60 * 1000) {
      return;
    }

    // Detect iOS
    const ua = window.navigator.userAgent;
    const iosDevice = /iPhone|iPad|iPod/.test(ua) && !window.MSStream;
    setIsIOS(iosDevice);

    if (iosDevice) {
      setShowPrompt(true);
    }

    // Listen for browser install prompt (Android / Chrome / Edge / Desktop)
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
    <div className="pwa-prompt card animate-slide-up">
      <div className="pwa-prompt-icon">
        <Smartphone size={22} />
      </div>

      <div className="pwa-prompt-content">
        <h4 className="pwa-prompt-title">Install BillStash App</h4>
        <p className="pwa-prompt-desc">
          {isIOS
            ? 'Tap the Share icon below, then select "Add to Home Screen"'
            : 'Install BillStash on your home screen for quick access & offline use.'}
        </p>
      </div>

      <div className="pwa-prompt-actions">
        {deferredPrompt ? (
          <button className="btn btn-primary btn-sm" onClick={handleInstallClick}>
            <Download size={14} /> Install
          </button>
        ) : isIOS ? (
          <span className="pwa-ios-badge">
            <Share size={14} /> Share
          </span>
        ) : null}

        <button
          className="btn btn-ghost btn-icon pwa-dismiss-btn"
          onClick={handleDismiss}
          aria-label="Dismiss prompt"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
