import React, { useState, useEffect } from 'react';
import { PenTool, Settings, AlertCircle, Sparkles, RefreshCw, FileText, Clock, Key } from 'lucide-react';
import GeneratorView from './components/GeneratorView';
import ApiSettingsView from './components/ApiSettingsView';
import PreviewView from './components/PreviewView';
import HistoryView, { HistoryItem } from './components/HistoryView';
import { GeneratorInput, GeneratedArticle } from './types';
import { generateArticleClientSide } from './lib/clientFallbackService';

type TabId = 'generator' | 'preview' | 'history' | 'settings';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('generator');
  const [visitorKeys, setVisitorKeys] = useState<string[]>([]);
  const [article, setArticle] = useState<GeneratedArticle | null>(null);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adminKeysCount, setAdminKeysCount] = useState<number>(0);
  
  // Custom progressive loading steps for engaging visual feedback
  const [loadingStep, setLoadingStep] = useState(0);
  const loadingMessages = [
    "Menghubungi server AI Human Writer...",
    "Membaca & memuat pedoman kualitas...",
    "Memilih API Key aktif (Mempersiapkan Rolling Engine)...",
    "Gemini sedang memformulasikan draf awal artikel SEO...",
    "Draf pertama selesai! Menjalankan Compliance Audit...",
    "Hasil Audit: Menghilangkan pola klise AI & menyelaraskan gaya bahasa...",
    "Menyempurnakan ritme & panjang kalimat...",
    "Mengekstrak metadata SEO, Alt text gambar, dan FAQ...",
    "Mencari gambar fitur gratis penunjang di Unsplash...",
    "Memvalidasi densitas kata kunci & menyusun skema JSON-LD..."
  ];

  // Load state from LocalStorage on mount
  useEffect(() => {
    try {
      const storedKeys = localStorage.getItem('ai_human_writer_visitor_keys');
      if (storedKeys) {
        setVisitorKeys(JSON.parse(storedKeys));
      }

      const storedHistory = localStorage.getItem('ai_human_writer_history');
      if (storedHistory) {
        setHistoryItems(JSON.parse(storedHistory));
      }
    } catch (err) {
      console.error("Gagal membaca LocalStorage:", err);
    }

    // Fetch admin status
    fetch('/api/admin-status')
      .then(res => res.json())
      .then(data => {
        if (data && typeof data.adminKeysCount === 'number') {
          setAdminKeysCount(data.adminKeysCount);
        }
      })
      .catch(err => {
        console.error("Gagal memuat status admin keys:", err);
        setAdminKeysCount(0);
      });
  }, []);

  // Update visitor keys
  const handleUpdateVisitorKeys = (keys: string[]) => {
    setVisitorKeys(keys);
    try {
      localStorage.setItem('ai_human_writer_visitor_keys', JSON.stringify(keys));
    } catch (err) {
      console.error("Gagal menyimpan visitor keys ke LocalStorage:", err);
    }
  };

  // Helper to save history items
  const saveHistoryToStorage = (updatedHistory: HistoryItem[]) => {
    setHistoryItems(updatedHistory);
    try {
      localStorage.setItem('ai_human_writer_history', JSON.stringify(updatedHistory));
    } catch (err) {
      console.error("Gagal menyimpan history ke LocalStorage:", err);
    }
  };

  // History operations
  const handleSelectHistoryArticle = (selectedArticle: GeneratedArticle) => {
    setArticle(selectedArticle);
    setActiveTab('preview');
  };

  const handleDeleteHistoryArticle = (id: string) => {
    const updated = historyItems.filter(item => item.id !== id);
    saveHistoryToStorage(updated);
  };

  const handleRenameHistoryArticle = (id: string, newTitle: string) => {
    const updated = historyItems.map(item => {
      if (item.id === id) {
        const updatedArticle = { ...item.article, title: newTitle };
        // If it's the currently active article, also update active state
        if (article && article.title === item.article.title) {
          setArticle(updatedArticle);
        }
        return {
          ...item,
          article: updatedArticle
        };
      }
      return item;
    });
    saveHistoryToStorage(updated);
  };

  const handleClearAllHistory = () => {
    saveHistoryToStorage([]);
  };

  // Progressive loading steps simulator
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading) {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep((prev) => {
          if (prev < loadingMessages.length - 1) {
            return prev + 1;
          }
          return prev;
        });
      }, 4000); // Progressively change messages every 4s
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLoading]);

  // Main generator trigger
  const handleGenerateArticle = async (input: GeneratorInput) => {
    setIsLoading(true);
    setError(null);
    setArticle(null);
    setActiveTab('generator'); // stay on generator tab to show the loading screen

    try {
      let generated: GeneratedArticle;
      
      try {
        const response = await fetch('/api/generate-article', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ...input,
            visitorKeys
          })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Gagal menghasilkan artikel.');
        }
        
        generated = data;
      } catch (serverErr: any) {
        console.warn("Backend generation failed, trying client-side fallback with user's key:", serverErr);
        if (!visitorKeys || visitorKeys.length === 0) {
          throw new Error("Gagal menghubungi server dan tidak ada API Key lokal yang disetel di tab Pengaturan API sebagai cadangan.");
        }
        generated = await generateArticleClientSide(input, visitorKeys);
      }

      setArticle(generated);
      setError(null);

      // Auto-save to history
      const newHistoryItem: HistoryItem = {
        id: `art-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        article: generated,
        createdAt: new Date().toISOString()
      };
      
      const updatedHistory = [newHistoryItem, ...historyItems];
      saveHistoryToStorage(updatedHistory);

      // Redirect directly to Preview screen upon successful generation
      setActiveTab('preview');
    } catch (err: any) {
      console.error("Generation failed:", err);
      setError(err.message || "Koneksi terputus atau server mengalami gangguan.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans text-gray-800">
      
      {/* LEFT SIDEBAR - DESKTOP ONLY */}
      <aside className="hidden md:flex md:flex-col md:w-64 md:fixed md:inset-y-0 md:left-0 bg-white shadow-sm z-30 select-none border-r border-gray-100">
        {/* Sidebar Branding Logo & Title */}
        <div className="p-6 flex items-center gap-3">
          <img
            src="https://i.ibb.co.com/wr0x733r/prajurit-digital.jpg"
            alt="Logo Prajurit Digital"
            className="h-9.5 w-9.5 rounded-lg object-cover shadow-sm ring-2 ring-primary/10 select-none"
          />
          <div>
            <span className="font-display text-base font-extrabold text-gray-900 flex items-center gap-1 leading-none">
              AI Human Writer
              <span className="h-1.5 w-1.5 rounded-full bg-[#FE4C6F] animate-pulse"></span>
            </span>
            <span className="text-[10px] text-gray-400 font-mono block tracking-wider uppercase mt-1">SEO Generator</span>
          </div>
        </div>

        {/* Vertical Navigation Tabs */}
        <nav className="flex-grow p-4 space-y-1.5" aria-label="Tabs Utama Sidebar">
          <button
            id="sidebar-tab-generator"
            onClick={() => { if (!isLoading) setActiveTab('generator'); }}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all cursor-pointer ${activeTab === 'generator' ? 'bg-primary-light text-primary font-bold' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/60'}`}
          >
            <PenTool className="h-4.5 w-4.5 shrink-0" />
            <span>Tulis Artikel</span>
          </button>
          
          <button
            id="sidebar-tab-preview"
            onClick={() => { if (!isLoading) setActiveTab('preview'); }}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all cursor-pointer ${activeTab === 'preview' ? 'bg-primary-light text-primary font-bold' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/60'}`}
          >
            <FileText className="h-4.5 w-4.5 shrink-0" />
            <span>Preview Artikel</span>
          </button>

          <button
            id="sidebar-tab-history"
            onClick={() => { if (!isLoading) setActiveTab('history'); }}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all cursor-pointer ${activeTab === 'history' ? 'bg-primary-light text-primary font-bold' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/60'}`}
          >
            <Clock className="h-4.5 w-4.5 shrink-0" />
            <span>History Artikel</span>
          </button>

          <button
            id="sidebar-tab-settings"
            onClick={() => { if (!isLoading) setActiveTab('settings'); }}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all cursor-pointer ${activeTab === 'settings' ? 'bg-primary-light text-primary font-bold' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/60'}`}
          >
            <Settings className="h-4.5 w-4.5 shrink-0" />
            <span>Pengaturan API</span>
          </button>
        </nav>

        {/* Sidebar Gemini API Key Status */}
        <div className="p-4 text-xs text-gray-500 border-t border-gray-100 bg-gray-50/50">
          <div className="font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
            <Key className="h-3.5 w-3.5 text-[#FE4C6F]" />
            <span>Status API Key Gemini</span>
          </div>
          <div className="space-y-1 font-medium">
            <div className="flex justify-between">
              <span className="text-gray-400">Server Aktif</span>
              <span className="text-green-600 font-bold">({adminKeysCount})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Lokal</span>
              {visitorKeys.length > 0 ? (
                <span className="text-blue-600 font-bold">Aktif ({visitorKeys.length})</span>
              ) : (
                <span className="text-gray-400 font-bold">Kosong</span>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTAINER WORKSPACE */}
      <div className="flex-1 flex flex-col min-w-0 md:pl-64">
        
        {/* Mobile Top Branding Header (hidden on desktop) */}
        <header className="md:hidden sticky top-0 z-40 bg-white shadow-sm px-4 py-3 flex items-center justify-between select-none border-b border-gray-100">
          <div className="flex items-center gap-2">
            <img
              src="https://i.ibb.co.com/wr0x733r/prajurit-digital.jpg"
              alt="Logo Prajurit Digital"
              className="h-8 w-8 rounded-md object-cover"
            />
            <div>
              <span className="font-display text-sm font-bold text-gray-900 block leading-none">
                AI Human Writer
              </span>
              <span className="text-[9px] text-gray-400 font-mono block mt-0.5">SEO Article Generator</span>
            </div>
          </div>
          <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
        </header>

        {/* Main Content Workspace Panel */}
        <main className="flex-grow max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 mb-20 md:mb-10">
          
          {/* Error Notification Alert */}
          {error && (
            <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 p-4 flex gap-3 text-sm text-red-700 animate-fade-in" id="global-error-alert">
              <AlertCircle className="h-5 w-5 shrink-0 text-red-500 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-bold text-gray-900">Gagal Menghasilkan Artikel</h4>
                <p className="text-gray-600 text-xs leading-relaxed">{error}</p>
                <div className="pt-2">
                  <button
                    onClick={() => setError(null)}
                    className="rounded-lg bg-white border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100/50 cursor-pointer"
                  >
                    Tutup Notifikasi
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* LOADING CONSOLE OVERLAY */}
          {isLoading && (
            <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm flex flex-col items-center justify-center min-h-[400px] space-y-6 text-center animate-pulse" id="loading-overlay">
              <div className="relative">
                <div className="h-16 w-16 rounded-full border-4 border-gray-100 border-t-primary animate-spin"></div>
                <Sparkles className="absolute inset-0 m-auto h-6 w-6 text-primary animate-bounce" />
              </div>
              
              <div className="space-y-2 max-w-md">
                <h3 className="font-display text-lg font-bold text-gray-900">Sedang Memproses Artikel</h3>
                <p className="text-gray-500 text-sm">
                  Proses penulisan natural sedang berlangsung secara otomatis di background. Mohon tunggu beberapa saat...
                </p>
              </div>

              {/* Current step dynamic console */}
              <div className="rounded-xl bg-gray-900 p-4 font-mono text-left text-xs text-gray-300 w-full max-w-md space-y-1 shadow-inner border border-gray-800">
                <div className="flex items-center justify-between text-[10px] text-gray-500 border-b border-gray-800 pb-1.5 mb-2">
                  <span className="flex items-center gap-1.5">
                    <RefreshCw className="h-3 w-3 animate-spin text-[#FE4C6F]" />
                    Engine Active
                  </span>
                  <span>Proses...</span>
                </div>
                <div className="text-[#FE4C6F] font-bold">&gt; {loadingMessages[loadingStep]}</div>
                {loadingStep > 0 && <div className="text-gray-500">&gt; {loadingMessages[loadingStep - 1]}</div>}
                {loadingStep > 1 && <div className="text-gray-500/70">&gt; {loadingMessages[loadingStep - 2]}</div>}
              </div>
            </div>
          )}

          {/* View Switcher based on tab state (hide workspace if loading) */}
          {!isLoading && (
            <>
              {activeTab === 'generator' && (
                <GeneratorView
                  onGenerate={handleGenerateArticle}
                  isLoading={isLoading}
                  visitorKeysCount={visitorKeys.length}
                />
              )}
              
              {activeTab === 'preview' && (
                <div className="space-y-4">
                  <div className="pb-2 select-none">
                    <h2 className="font-display text-2xl font-bold text-gray-900">Preview Artikel</h2>
                    <p className="text-gray-500 text-sm">Baca, salin, atau ekspor artikel teroptimasi SEO yang baru selesai dibuat.</p>
                  </div>
                  <PreviewView article={article} />
                </div>
              )}

              {activeTab === 'history' && (
                <HistoryView
                  historyItems={historyItems}
                  onSelectArticle={handleSelectHistoryArticle}
                  onDeleteArticle={handleDeleteHistoryArticle}
                  onRenameArticle={handleRenameHistoryArticle}
                  onClearAll={handleClearAllHistory}
                />
              )}
              
              {activeTab === 'settings' && (
                <ApiSettingsView
                  visitorKeys={visitorKeys}
                  onUpdateVisitorKeys={handleUpdateVisitorKeys}
                />
              )}
            </>
          )}
        </main>

        {/* Simple centered footer inside content pane */}
        <footer className="bg-white py-6 text-center text-xs text-gray-400 select-none border-t border-gray-100">
          <div className="max-w-5xl mx-auto px-4 text-center">
            &copy; 2026 Karya Prajurit Digital. Hak Cipta Dilindungi.
          </div>
        </footer>

        {/* Mobile Navigation Bottom Bar */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white shadow-lg flex justify-around py-2.5 select-none border-t border-gray-100">
          <button
            onClick={() => { if (!isLoading) setActiveTab('generator'); }}
            className={`flex flex-col items-center gap-0.5 text-[10px] font-bold ${activeTab === 'generator' ? 'text-[#FE4C6F]' : 'text-gray-400'}`}
          >
            <PenTool className="h-5 w-5" />
            Tulis
          </button>
          
          <button
            onClick={() => { if (!isLoading) setActiveTab('preview'); }}
            className={`flex flex-col items-center gap-0.5 text-[10px] font-bold ${activeTab === 'preview' ? 'text-[#FE4C6F]' : 'text-gray-400'}`}
          >
            <FileText className="h-5 w-5" />
            Preview
          </button>

          <button
            onClick={() => { if (!isLoading) setActiveTab('history'); }}
            className={`flex flex-col items-center gap-0.5 text-[10px] font-bold ${activeTab === 'history' ? 'text-[#FE4C6F]' : 'text-gray-400'}`}
          >
            <Clock className="h-5 w-5" />
            History
          </button>

          <button
            onClick={() => { if (!isLoading) setActiveTab('settings'); }}
            className={`flex flex-col items-center gap-0.5 text-[10px] font-bold ${activeTab === 'settings' ? 'text-[#FE4C6F]' : 'text-gray-400'}`}
          >
            <Settings className="h-5 w-5" />
            API Keys
          </button>
        </div>

      </div>
    </div>
  );
}
