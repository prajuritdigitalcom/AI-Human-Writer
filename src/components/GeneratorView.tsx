import React, { useState } from 'react';
import { PenTool, Link2, Image, FileText, Settings, Sparkles, HelpCircle } from 'lucide-react';
import { GeneratorInput, StyleType } from '../types';

interface GeneratorViewProps {
  onGenerate: (input: GeneratorInput) => void;
  isLoading: boolean;
  visitorKeysCount: number;
}

const STYLES: StyleType[] = [
  'Profesional',
  'Santai',
  'Storytelling',
  'Edukatif',
  'Persuasif',
  'SEO Friendly',
  'Human Like',
  'Expert',
  'Formal',
  'Jurnalistik'
];

export default function GeneratorView({ onGenerate, isLoading, visitorKeysCount }: GeneratorViewProps) {
  const [focusKeyword, setFocusKeyword] = useState('');
  const [style, setStyle] = useState<StyleType>('SEO Friendly');
  const [referenceInfo, setReferenceInfo] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [internalLinks, setInternalLinks] = useState('');

  // Toggles for help systems next to each label
  const [showKeywordHelp, setShowKeywordHelp] = useState(false);
  const [showStyleHelp, setShowStyleHelp] = useState(false);
  const [showReferenceHelp, setShowReferenceHelp] = useState(false);
  const [showImageHelp, setShowImageHelp] = useState(false);
  const [showLinkHelp, setShowLinkHelp] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!focusKeyword.trim()) return;
    onGenerate({
      focusKeyword: focusKeyword.trim(),
      style,
      referenceInfo: referenceInfo.trim(),
      imageUrl: imageUrl.trim() || undefined,
      internalLinks: internalLinks.trim() || undefined
    });
  };

  return (
    <div className="space-y-6 animate-fade-in" id="generator-view">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div>
          <h2 className="font-display text-2xl font-bold text-gray-900">Tulis Artikel Baru</h2>
          <p className="text-gray-500 text-sm">Isi parameter kata kunci dan bahan referensi untuk memulai proses generate.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${visitorKeysCount > 0 ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-primary-light text-primary border border-primary/20'}`}>
            <Settings className="h-3.5 w-3.5" />
            {visitorKeysCount > 0 
              ? `${visitorKeysCount} Visitor API Key Aktif` 
              : 'Menggunakan Admin API Key'}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
        
        {/* Row 1: Focus Keyword & Style */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Focus Keyword */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <label htmlFor="focus-keyword" className="block text-sm font-bold text-gray-800">
                Focus Keyword <span className="text-primary">*</span>
              </label>
              <button
                type="button"
                onClick={() => setShowKeywordHelp(!showKeywordHelp)}
                className="text-gray-400 hover:text-primary transition-colors focus:outline-none"
                title="Bantuan Focus Keyword"
              >
                <HelpCircle className="h-4 w-4" />
              </button>
            </div>

            {showKeywordHelp && (
              <div className="rounded-xl bg-gray-50 p-3.5 text-xs text-gray-600 animate-fade-in border border-gray-100">
                Kata kunci utama yang akan dioptimasi secara SEO, dihitung density-nya, serta digunakan untuk mencari gambar penunjang otomatis dari Unsplash.
              </div>
            )}

            <div className="relative rounded-xl shadow-sm">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Sparkles className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                id="focus-keyword"
                required
                disabled={isLoading}
                value={focusKeyword}
                onChange={(e) => setFocusKeyword(e.target.value)}
                placeholder="Contoh: Sauna Kayu"
                className="block w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none disabled:bg-gray-50"
              />
            </div>
          </div>

          {/* Gaya Penulisan */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <label htmlFor="style-dropdown" className="block text-sm font-bold text-gray-800">
                Gaya Penulisan / Nada Suara
              </label>
              <button
                type="button"
                onClick={() => setShowStyleHelp(!showStyleHelp)}
                className="text-gray-400 hover:text-primary transition-colors focus:outline-none"
                title="Bantuan Gaya Penulisan"
              >
                <HelpCircle className="h-4 w-4" />
              </button>
            </div>

            {showStyleHelp && (
              <div className="rounded-xl bg-gray-50 p-3.5 text-xs text-gray-600 animate-fade-in border border-gray-100">
                Memaksa model Gemini untuk beradaptasi dengan karakter nada tulisan tertentu guna menyelaraskan dengan target demografis pembaca Anda.
              </div>
            )}

            <div className="relative rounded-xl shadow-sm">
              <select
                id="style-dropdown"
                disabled={isLoading}
                value={style}
                onChange={(e) => setStyle(e.target.value as StyleType)}
                className="block w-full rounded-xl border border-gray-200 bg-white py-3 px-4 text-sm text-gray-900 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none disabled:bg-gray-50 cursor-pointer appearance-none"
              >
                {STYLES.map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">
                <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
              </div>
            </div>
          </div>
        </div>

        {/* Informasi Referensi */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <label htmlFor="reference-info" className="block text-sm font-bold text-gray-800">
              Informasi Referensi / Bahan Riset
            </label>
            <button
              type="button"
              onClick={() => setShowReferenceHelp(!showReferenceHelp)}
              className="text-gray-400 hover:text-primary transition-colors focus:outline-none"
              title="Bantuan Bahan Riset"
            >
              <HelpCircle className="h-4 w-4" />
            </button>
          </div>

          {showReferenceHelp && (
            <div className="rounded-xl bg-gray-50 p-4 text-xs text-gray-600 space-y-2 animate-fade-in border border-gray-100">
              <p className="font-semibold text-gray-800">Anda dapat memasukkan berbagai tipe referensi:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li><strong>Outline Artikel:</strong> Kerangka judul bab demi bab.</li>
                <li><strong>Data & Fakta:</strong> Informasi mentah, artikel pesaing, rilis pers, atau rujukan tepercaya.</li>
                <li><strong>Wikipedia Compliance:</strong> Engine melarang draf tanpa rujukan realistik. Memasukkan bahan referensi memotong habis potensi halusinasi draf.</li>
              </ul>
            </div>
          )}

          <div className="relative rounded-xl shadow-sm">
            <div className="absolute top-3 left-3 pointer-events-none">
              <FileText className="h-4 w-4 text-gray-400" />
            </div>
            <textarea
              id="reference-info"
              rows={6}
              disabled={isLoading}
              value={referenceInfo}
              onChange={(e) => setReferenceInfo(e.target.value)}
              placeholder="Tempel artikel referensi, outline, FAQ, data riset, atau catatan Anda di sini..."
              className="block w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none disabled:bg-gray-50"
            />
          </div>
        </div>

        {/* Row 3: Link Gambar & Internal Links */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Link Gambar */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <label htmlFor="image-url" className="block text-sm font-bold text-gray-800">
                Link Gambar Pilihan <span className="text-gray-400 font-normal">(Opsional)</span>
              </label>
              <button
                type="button"
                onClick={() => setShowImageHelp(!showImageHelp)}
                className="text-gray-400 hover:text-primary transition-colors focus:outline-none"
                title="Bantuan Gambar Pilihan"
              >
                <HelpCircle className="h-4 w-4" />
              </button>
            </div>

            {showImageHelp && (
              <div className="rounded-xl bg-gray-50 p-3.5 text-xs text-gray-600 animate-fade-in border border-gray-100">
                Jika diisi, artikel akan memakai link URL gambar eksternal ini secara langsung. Jika dikosongkan, sistem cerdas akan mencari secara otomatis dari repositori Unsplash gratis berbasis kata kunci fokus Anda.
              </div>
            )}

            <div className="relative rounded-xl shadow-sm">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Image className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="url"
                id="image-url"
                disabled={isLoading}
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://gambaranda.com/foto.jpg"
                className="block w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none disabled:bg-gray-50"
              />
            </div>
          </div>

          {/* Internal Links */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <label htmlFor="internal-links" className="block text-sm font-bold text-gray-800">
                Penyisipan Internal Link <span className="text-gray-400 font-normal">(Opsional)</span>
              </label>
              <button
                type="button"
                onClick={() => setShowLinkHelp(!showLinkHelp)}
                className="text-gray-400 hover:text-primary transition-colors focus:outline-none"
                title="Bantuan Internal Link"
              >
                <HelpCircle className="h-4 w-4" />
              </button>
            </div>

            {showLinkHelp && (
              <div className="rounded-xl bg-gray-50 p-3.5 text-xs text-gray-600 animate-fade-in border border-gray-100">
                Letakkan satu baris per link. Format penulisan wajib: <code>Judul Link|URL</code>. Gemini AI otomatis menyulam link ini secara presisi sebagai hyperlink kontekstual alami di dalam artikel yang diproduksi.
              </div>
            )}

            <div className="relative rounded-xl shadow-sm">
              <div className="absolute top-3 left-3 pointer-events-none">
                <Link2 className="h-4 w-4 text-gray-400" />
              </div>
              <textarea
                id="internal-links"
                rows={3}
                disabled={isLoading}
                value={internalLinks}
                onChange={(e) => setInternalLinks(e.target.value)}
                placeholder="Judul Artikel|https://domain.com/artikel"
                className="block w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-xs font-mono text-gray-900 placeholder-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none disabled:bg-gray-50"
              />
            </div>
          </div>
        </div>

        {/* Generate Button with interactive feedback - large, full width, FE4C6F color */}
        <div className="pt-6">
          <button
            type="submit"
            id="btn-generate-article"
            disabled={isLoading || !focusKeyword.trim()}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#FE4C6F] hover:bg-[#e03b5c] py-4 px-6 text-base font-bold text-white shadow-lg shadow-primary/20 transition-all hover:scale-101 focus:outline-none active:scale-99 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Menulis Draf & Menjalankan Loop Audit Wikipedia...
              </>
            ) : (
              <>
                <PenTool className="h-5 w-5" />
                Generate Artikel
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
