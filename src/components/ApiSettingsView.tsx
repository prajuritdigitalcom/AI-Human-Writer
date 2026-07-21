import React, { useState, useEffect } from 'react';
import { Key, Plus, Trash2, Eye, EyeOff, CheckCircle, HelpCircle, AlertCircle, Database, RefreshCw, Loader2 } from 'lucide-react';
import { StoredKnowledge, StoredEditorialKnowledge, StoredGoogleHelpfulKnowledge } from '../types';
import { 
  getClientWikipediaKnowledge, 
  getClientEditorialKnowledge, 
  getClientGoogleHelpfulKnowledge,
  refreshWikipediaClientSide,
  refreshGeorgeKaoClientSide,
  refreshGoogleHelpfulClientSide
} from '../lib/clientFallbackService';

interface ApiSettingsViewProps {
  visitorKeys: string[];
  onUpdateVisitorKeys: (keys: string[]) => void;
}

export default function ApiSettingsView({ visitorKeys, onUpdateVisitorKeys }: ApiSettingsViewProps) {
  const [newKey, setNewKey] = useState('');
  const [showKeyIndex, setShowKeyIndex] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Wikipedia knowledge states
  const [knowledge, setKnowledge] = useState<StoredKnowledge | null>(null);
  const [loadingKnowledge, setLoadingKnowledge] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [syncError, setSyncError] = useState('');

  // George Kao editorial knowledge states
  const [editorialKnowledge, setEditorialKnowledge] = useState<StoredEditorialKnowledge | null>(null);
  const [loadingEditorial, setLoadingEditorial] = useState(false);
  const [editorialSyncStatus, setEditorialSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [editorialSyncError, setEditorialSyncError] = useState('');

  // Google Helpful Content states
  const [googleHelpfulKnowledge, setGoogleHelpfulKnowledge] = useState<StoredGoogleHelpfulKnowledge | null>(null);
  const [loadingGoogleHelpful, setLoadingGoogleHelpful] = useState(false);
  const [googleHelpfulSyncStatus, setGoogleHelpfulSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [googleHelpfulSyncError, setGoogleHelpfulSyncError] = useState('');

  // Server diagnostics states
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [loadingDiagnostics, setLoadingDiagnostics] = useState(false);

  useEffect(() => {
    fetchKnowledgeStatus();
    fetchEditorialStatus();
    fetchGoogleHelpfulStatus();
    fetchDiagnostics();
  }, []);

  const fetchDiagnostics = async () => {
    setLoadingDiagnostics(true);
    try {
      const res = await fetch('/api/admin-status');
      const data = await res.json();
      setDiagnostics(data);
    } catch (err) {
      console.warn('Gagal memuat status diagnostik admin keys:', err);
    } finally {
      setLoadingDiagnostics(false);
    }
  };

  const fetchKnowledgeStatus = async () => {
    setLoadingKnowledge(true);
    try {
      const res = await fetch('/api/knowledge-status');
      const data = await res.json();
      if (data.success && data.knowledge) {
        setKnowledge(data.knowledge);
      } else {
        setKnowledge(getClientWikipediaKnowledge());
      }
    } catch (err) {
      console.warn('Error fetching knowledge status, loading from local storage:', err);
      setKnowledge(getClientWikipediaKnowledge());
    } finally {
      setLoadingKnowledge(false);
    }
  };

  const fetchEditorialStatus = async () => {
    setLoadingEditorial(true);
    try {
      const res = await fetch('/api/editorial-status');
      const data = await res.json();
      if (data.success && data.knowledge) {
        setEditorialKnowledge(data.knowledge);
      } else {
        setEditorialKnowledge(getClientEditorialKnowledge());
      }
    } catch (err) {
      console.warn('Error fetching editorial status, loading from local storage:', err);
      setEditorialKnowledge(getClientEditorialKnowledge());
    } finally {
      setLoadingEditorial(false);
    }
  };

  const fetchGoogleHelpfulStatus = async () => {
    setLoadingGoogleHelpful(true);
    try {
      const res = await fetch('/api/google-helpful-status');
      const data = await res.json();
      if (data.success && data.knowledge) {
        setGoogleHelpfulKnowledge(data.knowledge);
      } else {
        setGoogleHelpfulKnowledge(getClientGoogleHelpfulKnowledge());
      }
    } catch (err) {
      console.warn('Error fetching Google Helpful status, loading from local storage:', err);
      setGoogleHelpfulKnowledge(getClientGoogleHelpfulKnowledge());
    } finally {
      setLoadingGoogleHelpful(false);
    }
  };

  const handleRefreshKnowledge = async () => {
    setSyncStatus('syncing');
    setSyncError('');
    try {
      const res = await fetch('/api/refresh-knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitorKeys })
      });
      const data = await res.json();
      if (data.success && data.knowledge) {
        setKnowledge(data.knowledge);
        setSyncStatus('success');
        setTimeout(() => setSyncStatus('idle'), 3000);
      } else {
        throw new Error(data.error || 'Server returned failure');
      }
    } catch (err: any) {
      console.warn('Backend refresh failed. Running client-side fallback extraction...', err);
      try {
        const localData = await refreshWikipediaClientSide(visitorKeys);
        setKnowledge(localData);
        setSyncStatus('success');
        setTimeout(() => setSyncStatus('idle'), 3000);
      } catch (localErr: any) {
        setSyncStatus('error');
        setSyncError(localErr.message || 'Gagal menyelaraskan aturan kepatuhan Wikipedia secara lokal.');
      }
    }
  };

  const handleRefreshEditorial = async () => {
    setEditorialSyncStatus('syncing');
    setEditorialSyncError('');
    try {
      const res = await fetch('/api/refresh-editorial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitorKeys })
      });
      const data = await res.json();
      if (data.success && data.knowledge) {
        setEditorialKnowledge(data.knowledge);
        setEditorialSyncStatus('success');
        setTimeout(() => setEditorialSyncStatus('idle'), 3000);
      } else {
        throw new Error(data.error || 'Server returned failure');
      }
    } catch (err: any) {
      console.warn('Backend editorial refresh failed. Running client-side fallback...', err);
      try {
        const localData = await refreshGeorgeKaoClientSide(visitorKeys);
        setEditorialKnowledge(localData);
        setEditorialSyncStatus('success');
        setTimeout(() => setEditorialSyncStatus('idle'), 3000);
      } catch (localErr: any) {
        setEditorialSyncStatus('error');
        setEditorialSyncError(localErr.message || 'Gagal menyelaraskan aturan editorial George Kao secara lokal.');
      }
    }
  };

  const handleRefreshGoogleHelpful = async () => {
    setGoogleHelpfulSyncStatus('syncing');
    setGoogleHelpfulSyncError('');
    try {
      const res = await fetch('/api/refresh-google-helpful', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitorKeys })
      });
      const data = await res.json();
      if (data.success && data.knowledge) {
        setGoogleHelpfulKnowledge(data.knowledge);
        setGoogleHelpfulSyncStatus('success');
        setTimeout(() => setGoogleHelpfulSyncStatus('idle'), 3000);
      } else {
        throw new Error(data.error || 'Server returned failure');
      }
    } catch (err: any) {
      console.warn('Backend Google Helpful refresh failed. Running client-side fallback...', err);
      try {
        const localData = await refreshGoogleHelpfulClientSide(visitorKeys);
        setGoogleHelpfulKnowledge(localData);
        setGoogleHelpfulSyncStatus('success');
        setTimeout(() => setGoogleHelpfulSyncStatus('idle'), 3000);
      } catch (localErr: any) {
        setGoogleHelpfulSyncStatus('error');
        setGoogleHelpfulSyncError(localErr.message || 'Gagal menyelaraskan aturan Google Helpful secara lokal.');
      }
    }
  };


  const handleAddKey = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const key = newKey.trim();
    if (!key) return;

    // Validate standard Gemini API key format (usually starts with AIzaSy)
    if (!key.startsWith('AIzaSy')) {
      if (!confirm('API Key ini tampaknya tidak diawali dengan "AIzaSy" (format khas Google Gemini). Apakah Anda yakin ingin menyimpannya?')) {
        return;
      }
    }

    if (visitorKeys.includes(key)) {
      setErrorMessage('API Key ini sudah dimasukkan sebelumnya.');
      return;
    }

    const updated = [...visitorKeys, key];
    onUpdateVisitorKeys(updated);
    setNewKey('');
    setSuccessMessage('Berhasil menambahkan API Key baru ke Local Storage.');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleRemoveKey = (index: number) => {
    const updated = visitorKeys.filter((_, i) => i !== index);
    onUpdateVisitorKeys(updated);
    setSuccessMessage('Berhasil menghapus API Key.');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const toggleShowKey = (index: number) => {
    if (showKeyIndex === index) {
      setShowKeyIndex(null);
    } else {
      setShowKeyIndex(index);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in" id="api-settings-view">
      <div className="pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-gray-900">Pengaturan API Keys</h2>
          <p className="text-gray-500 text-sm">Kelola API Keys Anda untuk proses penulisan tanpa batas kuota.</p>
        </div>
        <button
          onClick={fetchDiagnostics}
          disabled={loadingDiagnostics}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loadingDiagnostics ? 'animate-spin text-primary' : 'text-gray-500'}`} />
          <span>Cek Ulang Server</span>
        </button>
      </div>

      {/* Cloud Server Diagnostics Section */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-50 pb-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary-light flex items-center justify-center text-primary">
              <Database className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="font-display text-sm font-bold text-gray-900">Diagnostik Cloud Server (Vercel)</h3>
              <p className="text-[11px] text-gray-400">Status pendeteksian API Keys di sisi server Vercel.</p>
            </div>
          </div>
          <div>
            {loadingDiagnostics ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-500 border border-gray-100">
                <Loader2 className="h-3 w-3 animate-spin text-gray-400" />
                <span>Memindai...</span>
              </span>
            ) : diagnostics ? (
              diagnostics.hasAdminKeys ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700 border border-green-100 animate-pulse">
                  <span className="h-2 w-2 rounded-full bg-green-500"></span>
                  <span>{diagnostics.adminKeysCount} Server Key Aktif</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700 border border-red-100">
                  <span className="h-2 w-2 rounded-full bg-red-500"></span>
                  <span>0 Server Key Terdeteksi</span>
                </span>
              )
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-50 px-3 py-1 text-xs font-bold text-yellow-700 border border-yellow-100">
                <span className="h-2 w-2 rounded-full bg-yellow-500"></span>
                <span>Gagal Terhubung</span>
              </span>
            )}
          </div>
        </div>

        {diagnostics && diagnostics.diagnostics ? (
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {Object.entries(diagnostics.diagnostics.envVarsFound).map(([key, val]: any) => {
                const exists = val !== "Not found" && !val.includes("Not found");
                return (
                  <div key={key} className={`p-3 rounded-xl border text-xs flex flex-col justify-between space-y-1.5 ${exists ? 'bg-green-50/30 border-green-100/70' : 'bg-gray-50/30 border-gray-100'}`}>
                    <div className="font-mono font-bold text-gray-700">{key}</div>
                    <div className={`font-medium ${exists ? 'text-green-700' : 'text-gray-400'}`}>
                      {exists ? (
                        <span className="block truncate" title={val}>{val.replace("Exists ", "")}</span>
                      ) : (
                        <span>Tidak diatur (Kosong)</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-amber-50/40 border border-amber-100/50 rounded-xl p-4 text-xs text-amber-900 space-y-2">
              <p className="font-bold text-amber-950 flex items-center gap-1.5">
                <span>💡</span> Tips Deteksi API Keys di Vercel:
              </p>
              <ul className="list-disc pl-4 space-y-1 text-[11px] text-amber-800 leading-relaxed">
                <li>
                  <strong>Wajib Deploy Ulang (REDEPLOY):</strong> Setelah Anda menyimpan Environment Variables di Vercel Dashboard, Anda <strong>wajib melakukan Redeploy proyek Anda</strong> di Vercel. Server Vercel lama tidak akan membaca kunci baru sebelum di-deploy ulang.
                </li>
                <li>
                  <strong>Ejaan Harus Tepat:</strong> Pastikan ejaan variabel lingkungan sama persis menggunakan huruf kapital, contoh: <code>GEMINI_KEY_1</code>, <code>GEMINI_KEY_2</code>, atau <code>GEMINI_KEY_3</code>.
                </li>
                <li>
                  <strong>Pilih Lingkungan yang Tepat:</strong> Saat menambahkan variabel di Vercel, pastikan Anda mencentang pilihan <strong>Production</strong>, <strong>Preview</strong>, dan <strong>Development</strong> agar kunci terbaca di semua alamat web.
                </li>
              </ul>
            </div>
          </div>
        ) : (
          <p className="text-xs text-gray-500">
            Sedang mencoba mengambil informasi diagnostik server. Pastikan server aktif dan dapat merespons.
          </p>
        )}
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {/* Left column: input key form */}
        <div className="md:col-span-1 space-y-4">
          <h3 className="font-display text-lg font-bold text-gray-900">Tambah API Key</h3>

          <form onSubmit={handleAddKey} className="space-y-3">
            <div>
              <div className="relative rounded-lg shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <Key className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  id="input-visitor-key"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="block w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
                />
              </div>
            </div>

            {errorMessage && (
              <div className="flex items-center gap-1.5 rounded-lg bg-red-50 p-2.5 text-xs text-red-600 border border-red-100">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="flex items-center gap-1.5 rounded-lg bg-green-50 p-2.5 text-xs text-green-600 border border-green-100">
                <CheckCircle className="h-4 w-4 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            <button
              type="submit"
              id="btn-add-visitor-key"
              className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-primary py-2.5 px-4 text-sm font-semibold text-white shadow-md shadow-primary/10 hover:bg-primary-hover hover:scale-101 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Simpan API Key
            </button>
          </form>

          <div className="rounded-xl p-4 bg-gray-50 text-xs text-gray-600 space-y-2">
            <p className="font-semibold flex items-center gap-1 text-gray-800">
              <HelpCircle className="h-4 w-4 text-gray-500" />
              Cara Mendapatkan API Key?
            </p>
            <ol className="list-decimal pl-4 space-y-1">
              <li>Buka <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google AI Studio</a>.</li>
              <li>Masuk menggunakan akun Google Anda.</li>
              <li>Klik tombol <strong>"Get API key"</strong> di pojok kiri atas.</li>
              <li>Buat API Key baru dan tempelkan di form.</li>
            </ol>
          </div>
        </div>

        {/* Right column: keys list */}
        <div className="md:col-span-2 space-y-4">
          <h3 className="font-display text-lg font-bold text-gray-900">
            Daftar Visitor API Keys ({visitorKeys.length})
          </h3>
          
          {visitorKeys.length === 0 ? (
            <div className="rounded-xl bg-gray-50/50 p-8 text-center">
              <Key className="mx-auto h-8 w-8 text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">Belum ada API Key pengunjung yang dimasukkan.</p>
              <p className="text-xs text-gray-400 mt-1">Sistem saat ini sepenuhnya bersandar pada API Key default Admin jika tersedia.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {visitorKeys.map((key, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary-light text-xs font-bold text-primary">
                      {idx + 1}
                    </span>
                    <div className="font-mono text-sm text-gray-800 truncate select-all">
                      {showKeyIndex === idx 
                        ? key 
                        : `${key.substring(0, 10)}****************************`}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => toggleShowKey(idx)}
                      title={showKeyIndex === idx ? "Sembunyikan" : "Tampilkan"}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    >
                      {showKeyIndex === idx ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveKey(idx)}
                      title="Hapus Kunci"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Wikipedia Knowledge Builder Section */}
      <div className="border-t border-gray-100 pt-8 mt-4" id="wikipedia-rules-section">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="font-display text-lg font-bold text-gray-900 flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              Wikipedia Signs of AI Writing Compliance Rules
            </h3>
            <p className="text-gray-500 text-sm mt-0.5">
              Aturan kepatuhan dinamis yang dibangun berdasarkan panduan resmi Wikipedia: Signs of AI Writing.
            </p>
          </div>
          <div>
            <button
              type="button"
              id="btn-refresh-knowledge"
              disabled={syncStatus === 'syncing'}
              onClick={handleRefreshKnowledge}
              className={`flex items-center gap-2 rounded-xl bg-gray-900 hover:bg-black text-white px-4 py-2.5 text-sm font-semibold shadow-md transition-all cursor-pointer disabled:opacity-50`}
            >
              {syncStatus === 'syncing' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {syncStatus === 'syncing' ? 'Mempelajari Wikipedia...' : 'Refresh Wikipedia Rules'}
            </button>
          </div>
        </div>

        {syncError && (
          <div className="flex items-center gap-1.5 rounded-lg bg-red-50 p-3 text-xs text-red-600 border border-red-100 mb-4 animate-fade-in">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{syncError}</span>
          </div>
        )}

        {syncStatus === 'success' && (
          <div className="flex items-center gap-1.5 rounded-lg bg-green-50 p-3 text-xs text-green-600 border border-green-100 mb-4 animate-fade-in">
            <CheckCircle className="h-4 w-4 shrink-0" />
            <span>Berhasil mengambil dan mempelajari aturan penulisan AI terbaru dari Wikipedia!</span>
          </div>
        )}

        {loadingKnowledge ? (
          <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 text-primary animate-spin mb-2" />
            <p className="text-sm text-gray-500">Memuat status aturan kepatuhan...</p>
          </div>
        ) : knowledge ? (
          <div className="space-y-4 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm bg-gray-50 rounded-2xl p-5 border border-gray-100">
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Source</p>
                <p className="text-gray-800 font-medium mt-1">{knowledge.metadata.source}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Source URL</p>
                <a href={knowledge.metadata.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium block truncate mt-1">
                  {knowledge.metadata.sourceUrl}
                </a>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Knowledge Version</p>
                <p className="text-gray-800 font-mono font-bold mt-1">{knowledge.metadata.version}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Last Synced</p>
                <p className="text-gray-800 font-medium mt-1">{knowledge.metadata.lastSynced}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Rules</p>
                  <p className="text-3xl font-black text-gray-900 mt-1">{knowledge.metadata.rulesCount}</p>
                </div>
                <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-black text-lg">R</div>
              </div>
              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Patterns</p>
                  <p className="text-3xl font-black text-gray-900 mt-1">{knowledge.metadata.patternsCount}</p>
                </div>
                <div className="h-12 w-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 font-black text-lg">P</div>
              </div>
              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Recommendations</p>
                  <p className="text-3xl font-black text-gray-900 mt-1">{knowledge.metadata.recommendationsCount}</p>
                </div>
                <div className="h-12 w-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 font-black text-lg">A</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-100 rounded-2xl p-6 text-center text-yellow-800 text-sm">
            <AlertCircle className="mx-auto h-8 w-8 text-yellow-500 mb-2" />
            <p className="font-semibold">Atuan Kepatuhan Wikipedia belum terinisialisasi.</p>
            <p className="text-xs mt-1">Silakan klik tombol "Refresh Wikipedia Rules" di atas untuk menganalisis dan membangun basis aturan.</p>
          </div>
        )}
      </div>

      {/* George Kao Editorial Knowledge Builder Section */}
      <div className="border-t border-gray-100 pt-8 mt-8" id="george-kao-rules-section">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="font-display text-lg font-bold text-gray-900 flex items-center gap-2">
              <Database className="h-5 w-5 text-indigo-600" />
              George Kao Editorial Knowledge Builder
            </h3>
            <p className="text-gray-500 text-sm mt-0.5">
              Aturan editorial dinamis yang dipelajari langsung dari panduan menulis George Kao.
            </p>
          </div>
          <div>
            <button
              type="button"
              id="btn-refresh-editorial"
              disabled={editorialSyncStatus === 'syncing'}
              onClick={handleRefreshEditorial}
              className={`flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 text-sm font-semibold shadow-md transition-all cursor-pointer disabled:opacity-50`}
            >
              {editorialSyncStatus === 'syncing' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {editorialSyncStatus === 'syncing' ? 'Mempelajari George Kao...' : 'Refresh Editorial Rules'}
            </button>
          </div>
        </div>

        {editorialSyncError && (
          <div className="flex items-center gap-1.5 rounded-lg bg-red-50 p-3 text-xs text-red-600 border border-red-100 mb-4 animate-fade-in">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{editorialSyncError}</span>
          </div>
        )}

        {editorialSyncStatus === 'success' && (
          <div className="flex items-center gap-1.5 rounded-lg bg-green-50 p-3 text-xs text-green-600 border border-green-100 mb-4 animate-fade-in">
            <CheckCircle className="h-4 w-4 shrink-0" />
            <span>Berhasil mengambil dan membangun aturan editorial baru berdasarkan tulisan George Kao!</span>
          </div>
        )}

        {loadingEditorial ? (
          <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 text-indigo-600 animate-spin mb-2" />
            <p className="text-sm text-gray-500">Memuat status aturan editorial...</p>
          </div>
        ) : editorialKnowledge ? (
          <div className="space-y-4 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm bg-gray-50 rounded-2xl p-5 border border-gray-100">
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Source</p>
                <p className="text-gray-800 font-medium mt-1">{editorialKnowledge.metadata.source}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Source URL</p>
                <a href={editorialKnowledge.metadata.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline font-medium block truncate mt-1">
                  {editorialKnowledge.metadata.sourceUrl}
                </a>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Knowledge Version</p>
                <p className="text-gray-800 font-mono font-bold mt-1">{editorialKnowledge.metadata.version}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Last Synced</p>
                <p className="text-gray-800 font-medium mt-1">{editorialKnowledge.metadata.lastSynced}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Editorial Principles</p>
                  <p className="text-3xl font-black text-gray-900 mt-1">{editorialKnowledge.metadata.editorialPrinciples}</p>
                </div>
                <div className="h-12 w-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 font-black text-lg">EP</div>
              </div>
              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Editorial Checks</p>
                  <p className="text-3xl font-black text-gray-900 mt-1">{editorialKnowledge.metadata.editorialChecks}</p>
                </div>
                <div className="h-12 w-12 bg-pink-50 rounded-xl flex items-center justify-center text-pink-600 font-black text-lg">EC</div>
              </div>
              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Revision Strategies</p>
                  <p className="text-3xl font-black text-gray-900 mt-1">{editorialKnowledge.metadata.revisionStrategies}</p>
                </div>
                <div className="h-12 w-12 bg-violet-50 rounded-xl flex items-center justify-center text-violet-600 font-black text-lg">RS</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-100 rounded-2xl p-6 text-center text-yellow-800 text-sm">
            <AlertCircle className="mx-auto h-8 w-8 text-yellow-500 mb-2" />
            <p className="font-semibold">Aturan Editorial George Kao belum terinisialisasi.</p>
            <p className="text-xs mt-1">Silakan klik tombol "Refresh Editorial Rules" di atas untuk menganalisis dan membangun basis aturan editorial.</p>
          </div>
        )}
      </div>

      {/* Google Helpful Content Knowledge Builder Section */}
      <div className="border-t border-gray-100 pt-8 mt-8" id="google-helpful-rules-section">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="font-display text-lg font-bold text-gray-900 flex items-center gap-2">
              <Database className="h-5 w-5 text-emerald-600" />
              Google Helpful Content Knowledge Builder
            </h3>
            <p className="text-gray-500 text-sm mt-0.5">
              Basis pengetahuan editorial penunjang konten berkualitas tinggi berdasarkan standar resmi Google Search Central.
            </p>
          </div>
          <div>
            <button
              type="button"
              id="btn-refresh-google-helpful"
              disabled={googleHelpfulSyncStatus === 'syncing'}
              onClick={handleRefreshGoogleHelpful}
              className={`flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 text-sm font-semibold shadow-md transition-all cursor-pointer disabled:opacity-50`}
            >
              {googleHelpfulSyncStatus === 'syncing' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {googleHelpfulSyncStatus === 'syncing' ? 'Mempelajari Google Search...' : 'Refresh Google Knowledge'}
            </button>
          </div>
        </div>

        {googleHelpfulSyncError && (
          <div className="flex items-center gap-1.5 rounded-lg bg-red-50 p-3 text-xs text-red-600 border border-red-100 mb-4 animate-fade-in">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{googleHelpfulSyncError}</span>
          </div>
        )}

        {googleHelpfulSyncStatus === 'success' && (
          <div className="flex items-center gap-1.5 rounded-lg bg-green-50 p-3 text-xs text-green-600 border border-green-100 mb-4 animate-fade-in">
            <CheckCircle className="h-4 w-4 shrink-0" />
            <span>Berhasil menyelaraskan aturan kepatuhan terbaru dari Google Search Central!</span>
          </div>
        )}

        {loadingGoogleHelpful ? (
          <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 text-emerald-600 animate-spin mb-2" />
            <p className="text-sm text-gray-500">Memuat status aturan Google Helpful Content...</p>
          </div>
        ) : googleHelpfulKnowledge ? (
          <div className="space-y-4 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm bg-gray-50 rounded-2xl p-5 border border-gray-100">
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Source</p>
                <p className="text-gray-800 font-medium mt-1">{googleHelpfulKnowledge.metadata.source}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Source URL</p>
                <a href={googleHelpfulKnowledge.metadata.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline font-medium block truncate mt-1">
                  {googleHelpfulKnowledge.metadata.sourceUrl}
                </a>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Knowledge Version</p>
                <p className="text-gray-800 font-mono font-bold mt-1">{googleHelpfulKnowledge.metadata.version}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Last Synced</p>
                <p className="text-gray-800 font-medium mt-1">{googleHelpfulKnowledge.metadata.lastSynced}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Total Rules</p>
                  <p className="text-3xl font-black text-gray-900 mt-1">{googleHelpfulKnowledge.metadata.totalRules}</p>
                </div>
                <div className="h-12 w-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 font-black text-lg">TR</div>
              </div>
              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Total Principles</p>
                  <p className="text-3xl font-black text-gray-900 mt-1">{googleHelpfulKnowledge.metadata.totalPrinciples}</p>
                </div>
                <div className="h-12 w-12 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600 font-black text-lg">TP</div>
              </div>
              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Self Assessment Questions</p>
                  <p className="text-3xl font-black text-gray-900 mt-1">{googleHelpfulKnowledge.metadata.totalSelfAssessmentQuestions}</p>
                </div>
                <div className="h-12 w-12 bg-sky-50 rounded-xl flex items-center justify-center text-sky-600 font-black text-lg">AQ</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-100 rounded-2xl p-6 text-center text-yellow-800 text-sm">
            <AlertCircle className="mx-auto h-8 w-8 text-yellow-500 mb-2" />
            <p className="font-semibold">Aturan Google Helpful Content belum terinisialisasi.</p>
            <p className="text-xs mt-1">Silakan klik tombol "Refresh Google Knowledge" di atas untuk menganalisis dan membangun basis aturan Google Search Central.</p>
          </div>
        )}
      </div>
    </div>
  );
}
