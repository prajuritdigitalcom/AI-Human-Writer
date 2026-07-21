import React, { useState } from 'react';
import { 
  Clock, 
  Trash2, 
  Copy, 
  Download, 
  Edit3, 
  Check, 
  FileText, 
  ExternalLink,
  Search,
  CheckCircle,
  X
} from 'lucide-react';
import { GeneratedArticle } from '../types';

export interface HistoryItem {
  id: string;
  article: GeneratedArticle;
  createdAt: string;
}

interface HistoryViewProps {
  historyItems: HistoryItem[];
  onSelectArticle: (article: GeneratedArticle) => void;
  onDeleteArticle: (id: string) => void;
  onRenameArticle: (id: string, newTitle: string) => void;
  onClearAll: () => void;
}

export default function HistoryView({
  historyItems,
  onSelectArticle,
  onDeleteArticle,
  onRenameArticle,
  onClearAll
}: HistoryViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filter history items by search term
  const filteredItems = historyItems.filter(item => 
    item.article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.article.keywordDensity.keyword.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const startRename = (item: HistoryItem) => {
    setEditingId(item.id);
    setEditTitle(item.article.title);
  };

  const saveRename = (id: string) => {
    if (!editTitle.trim()) return;
    onRenameArticle(id, editTitle.trim());
    setEditingId(null);
    setSuccessMessage("Judul artikel berhasil diubah!");
    setTimeout(() => setSuccessMessage(null), 2500);
  };

  const handleDownload = (article: GeneratedArticle) => {
    const content = `JUDUL: ${article.title}\nSLUG: ${article.slug}\nMETA DESKRIPSI: ${article.metaDescription}\n\n========================================\n\n${article.contentMarkdown}`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${article.slug}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fade-in" id="history-view">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-gray-900">History Artikel</h2>
          <p className="text-gray-500 text-sm">Akses kembali seluruh artikel SEO yang pernah Anda generate sebelumnya.</p>
        </div>
        {historyItems.length > 0 && (
          <button
            onClick={() => {
              if (confirm('Apakah Anda yakin ingin menghapus seluruh riwayat generate? Tindakan ini tidak dapat dibatalkan.')) {
                onClearAll();
                setSuccessMessage("Seluruh riwayat berhasil dikosongkan.");
                setTimeout(() => setSuccessMessage(null), 2500);
              }
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 hover:bg-red-50 text-red-600 font-bold text-xs py-2.5 px-4 transition-all cursor-pointer select-none"
          >
            <Trash2 className="h-4 w-4" />
            Reset Semua History
          </button>
        )}
      </div>

      {successMessage && (
        <div className="bg-green-50 text-green-800 text-xs rounded-xl p-3 flex items-center justify-between animate-fade-in select-none">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-green-600 hover:text-green-800">
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Search Bar */}
      {historyItems.length > 0 && (
        <div className="relative rounded-xl shadow-sm max-w-md">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari judul artikel atau kata kunci..."
            className="block w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
          />
        </div>
      )}

      {/* History Items List */}
      {historyItems.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center shadow-sm select-none">
          <Clock className="mx-auto h-12 w-12 text-gray-300 mb-3" />
          <h3 className="font-display text-lg font-bold text-gray-900 mb-1">Riwayat Kosong</h3>
          <p className="text-gray-500 text-sm max-w-sm mx-auto">
            Anda belum pernah membuat artikel apa pun. Silakan gunakan tab "Tulis Artikel" untuk mulai menulis.
          </p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
          <p className="text-sm text-gray-500">Tidak ada artikel yang cocok dengan pencarian Anda.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredItems.map((item) => {
            const isEditing = editingId === item.id;
            const dateStr = new Date(item.createdAt).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });

            return (
              <div 
                key={item.id} 
                className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2 flex-grow min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-[10px] text-gray-400 font-mono">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {dateStr}
                    </span>
                    <span className="text-gray-300">•</span>
                    <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-sans font-bold">
                      {item.article.keywordDensity.keyword}
                    </span>
                    <span className="text-gray-300">•</span>
                    <span className="bg-primary-light text-primary px-2 py-0.5 rounded font-sans font-bold">
                      Gaya: {item.article.complianceHistory[0]?.articleTitle ? 'SEO' : 'Standar'}
                    </span>
                    <span className="text-gray-300">•</span>
                    <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded font-sans font-bold">
                      Lolos Audit
                    </span>
                  </div>

                  {isEditing ? (
                    <div className="flex gap-2 w-full max-w-xl">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="flex-grow rounded-lg border border-gray-200 px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                      <button
                        onClick={() => saveRename(item.id)}
                        className="rounded-lg bg-green-500 hover:bg-green-600 text-white p-1.5 cursor-pointer"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 p-1.5 cursor-pointer"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <h3 className="font-sans text-base font-bold text-gray-900 truncate">
                      {item.article.title}
                    </h3>
                  )}
                  
                  <p className="text-xs text-gray-400 line-clamp-1">
                    {item.article.metaDescription}
                  </p>
                </div>

                {/* Operations Toolbar */}
                <div className="flex flex-wrap items-center gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-gray-50">
                  <button
                    onClick={() => onSelectArticle(item.article)}
                    className="inline-flex items-center gap-1 rounded-lg bg-primary-light hover:bg-primary-light/80 text-primary font-bold text-xs py-2 px-3 cursor-pointer"
                    title="Buka kembali di workspace"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Buka Kembali
                  </button>

                  <button
                    onClick={() => handleCopyText(item.article.contentMarkdown, item.id)}
                    className="inline-flex items-center gap-1 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold text-xs py-2 px-2.5 cursor-pointer border border-gray-100"
                    title="Salin Markdown"
                  >
                    {copiedId === item.id ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5 text-gray-500" />}
                    Salin
                  </button>

                  <button
                    onClick={() => handleDownload(item.article)}
                    className="inline-flex items-center justify-center rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold text-xs py-2 px-2 cursor-pointer border border-gray-100"
                    title="Unduh TXT"
                  >
                    <Download className="h-3.5 w-3.5 text-gray-500" />
                  </button>

                  <button
                    onClick={() => startRename(item)}
                    className="inline-flex items-center justify-center rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold text-xs py-2 px-2 cursor-pointer border border-gray-100"
                    title="Ubah Judul"
                  >
                    <Edit3 className="h-3.5 w-3.5 text-gray-500" />
                  </button>

                  <button
                    onClick={() => {
                      if (confirm('Hapus artikel ini dari riwayat?')) {
                        onDeleteArticle(item.id);
                        setSuccessMessage("Artikel dihapus dari riwayat.");
                        setTimeout(() => setSuccessMessage(null), 2500);
                      }
                    }}
                    className="inline-flex items-center justify-center rounded-lg bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs py-2 px-2 cursor-pointer border border-red-100/50"
                    title="Hapus"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
