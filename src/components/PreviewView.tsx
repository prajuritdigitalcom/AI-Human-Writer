import React, { useState } from 'react';
import { GeneratedArticle } from '../types';
import { 
  Eye, 
  ShieldCheck, 
  BarChart2, 
  Copy, 
  Check, 
  FileText, 
  AlertTriangle, 
  ChevronRight, 
  ChevronDown, 
  Download, 
  FileCode, 
  Sparkles,
  HelpCircle
} from 'lucide-react';

interface PreviewViewProps {
  article: GeneratedArticle | null;
}

export default function PreviewView({ article }: PreviewViewProps) {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [copiedRich, setCopiedRich] = useState(false);
  const [richCopyMessage, setRichCopyMessage] = useState<string | null>(null);
  const [includeMeta, setIncludeMeta] = useState(false);
  const [includeSchema, setIncludeSchema] = useState(false);
  
  // Collapsible accordion states (Progressive Disclosure)
  const [showSeo, setShowSeo] = useState(false);
  const [showAudit, setShowAudit] = useState(false);
  const [showMetadata, setShowMetadata] = useState(false);

  if (!article) {
    return (
      <div className="rounded-2xl bg-gray-50/50 p-12 text-center animate-fade-in" id="preview-empty">
        <FileText className="mx-auto h-12 w-12 text-gray-300 mb-3" />
        <h3 className="font-display text-lg font-bold text-gray-900 mb-1">Belum Ada Artikel</h3>
        <p className="text-gray-500 text-sm max-w-sm mx-auto">
          Silakan isi form pencarian kata kunci dan tekan tombol "Hasilkan Artikel SEO" di atas terlebih dahulu.
        </p>
      </div>
    );
  }

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(label);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const handleCopyRichText = async () => {
    try {
      const richHtml = `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #333333; line-height: 1.6;">
        <h1>${article.title}</h1>
        ${article.contentHtml}
      </div>`;
      
      const blobHtml = new Blob([richHtml], { type: 'text/html' });
      const fallbackText = `${article.title}\n\n${article.contentMarkdown}`;
      const blobText = new Blob([fallbackText], { type: 'text/plain' });
      
      const data = [new ClipboardItem({
        'text/html': blobHtml,
        'text/plain': blobText
      })];
      
      await navigator.clipboard.write(data);
      setCopiedRich(true);
      setRichCopyMessage("Format rich-text tersalin! Siap dipaste (Ctrl+V) langsung ke editor WordPress atau Blogger.");
      setTimeout(() => {
        setCopiedRich(false);
        setRichCopyMessage(null);
      }, 4000);
    } catch (err) {
      console.error('Failed to copy rich text:', err);
      await navigator.clipboard.writeText(article.contentHtml);
      setCopiedRich(true);
      setRichCopyMessage("HTML tersalin ke clipboard! (Format visual tidak didukung di browser ini, silakan paste sebagai kode)");
      setTimeout(() => {
        setCopiedRich(false);
        setRichCopyMessage(null);
      }, 4000);
    }
  };

  const handleDownload = (format: 'html' | 'md' | 'txt') => {
    let content = '';
    let filename = '';
    let mimeType = 'text/plain';

    if (format === 'html') {
      content = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <title>${article.title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.7; color: #2d3748; max-width: 800px; margin: 40px auto; padding: 0 20px; }
    h1 { font-size: 2.5em; color: #1a202c; margin-bottom: 0.8em; font-weight: 800; line-height: 1.2; }
    h2 { font-size: 1.8em; color: #2d3748; margin-top: 1.6em; margin-bottom: 0.8em; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; font-weight: 700; }
    h3 { font-size: 1.4em; color: #4a5568; margin-top: 1.4em; margin-bottom: 0.6em; font-weight: 600; }
    p { margin-bottom: 1.2em; text-align: justify; }
    ul, ol { margin-bottom: 1.2em; padding-left: 24px; }
    li { margin-bottom: 0.5em; }
    a { color: #3182ce; text-decoration: none; }
    a:hover { text-decoration: underline; }
    blockquote { border-left: 4px solid #cbd5e0; padding-left: 16px; font-style: italic; color: #4a5568; background-color: #f7fafc; padding-top: 8px; padding-bottom: 8px; margin: 1.5em 0; }
  </style>
</head>
<body>
  <h1>${article.title}</h1>
  ${article.contentHtml}
</body>
</html>`;
      filename = `${article.slug}.html`;
      mimeType = 'text/html';
    } else if (format === 'md') {
      content = `# ${article.title}\n\n${article.contentMarkdown}`;
      filename = `${article.slug}.md`;
      mimeType = 'text/markdown';
    } else {
      content = `JUDUL: ${article.title}\nSLUG: ${article.slug}\nMETA DESKRIPSI: ${article.metaDescription}\n\n========================================\n\n${article.contentMarkdown}`;
      filename = `${article.slug}.txt`;
    }

    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getSeverityBadge = (severity: 'high' | 'medium' | 'low') => {
    switch (severity) {
      case 'high':
        return <span className="rounded bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">Tinggi</span>;
      case 'medium':
        return <span className="rounded bg-orange-100 px-2 py-0.5 text-[10px] font-semibold text-orange-700">Sedang</span>;
      default:
        return <span className="rounded bg-yellow-100 px-2 py-0.5 text-[10px] font-medium text-yellow-700">Rendah</span>;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" id="preview-view-container">
      
      {/* 1. COMPACT AND CLEAN SUCCESS BANNER */}
      <div className="rounded-2xl bg-green-50 p-5 text-green-900 border border-green-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm select-none" id="preview-success-header">
        <div className="space-y-1">
          <h3 className="font-display text-lg font-bold flex items-center gap-2 text-green-800">
            <span className="h-2.5 w-2.5 rounded-full bg-green-500"></span>
            Artikel Anda Sudah Siap!
          </h3>
          <p className="text-xs text-green-700">
            Artikel telah dioptimasi secara SEO dan siap disalin untuk dipublish.
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleCopyRichText}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#FE4C6F] hover:bg-[#e03b5c] text-white font-bold text-sm py-3 px-5 shadow-sm active:scale-97 transition-all cursor-pointer"
            title="Salin gaya artikel untuk langsung di-paste ke WordPress/Blogger"
          >
            <Copy className="h-4 w-4" />
            Salin Rich-Text (WordPress/Blogger)
          </button>
        </div>
      </div>

      {richCopyMessage && (
        <div className="bg-green-50 text-green-800 text-xs rounded-xl p-3 flex items-start gap-2 animate-fade-in select-none">
          <Check className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
          <span>{richCopyMessage}</span>
        </div>
      )}

      {/* 2. MAIN WORKSPACE CONTROLS & RENDER */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        
        {/* Workspace Toolbar */}
        <div className="rounded-xl bg-gray-50 p-4 flex flex-col md:flex-row items-center justify-between gap-4 select-none mb-6" id="workspace-toolbar">
          <div className="flex flex-wrap items-center gap-4">
            <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs font-bold text-gray-700">
              <input
                type="checkbox"
                checked={includeMeta}
                onChange={(e) => setIncludeMeta(e.target.checked)}
                className="rounded border-gray-300 text-primary focus:ring-primary h-3.5 w-3.5 cursor-pointer accent-[#FE4C6F]"
              />
              <span>Sertakan Meta Deskripsi di Atas</span>
            </label>

            <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs font-bold text-gray-700">
              <input
                type="checkbox"
                checked={includeSchema}
                onChange={(e) => setIncludeSchema(e.target.checked)}
                className="rounded border-gray-300 text-primary focus:ring-primary h-3.5 w-3.5 cursor-pointer accent-[#FE4C6F]"
              />
              <span>Sertakan FAQ Schema di Bawah</span>
            </label>
          </div>

          {/* Download & Raw Copy */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <button
              onClick={() => handleCopy(article.contentMarkdown, 'markdown')}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold text-xs py-2 px-3 cursor-pointer"
              title="Salin Raw Markdown"
            >
              {copiedSection === 'markdown' ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5 text-gray-400" />}
              Salin MD
            </button>

            <button
              onClick={() => handleCopy(article.contentHtml, 'html')}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold text-xs py-2 px-3 cursor-pointer"
              title="Salin Kode HTML"
            >
              {copiedSection === 'html' ? <Check className="h-3.5 w-3.5 text-green-600" /> : <FileCode className="h-3.5 w-3.5 text-blue-500" />}
              Salin HTML
            </button>

            <button
              onClick={() => handleDownload('html')}
              className="p-2 text-gray-500 hover:text-gray-900 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
              title="Unduh HTML"
            >
              <Download className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* PRISTINE SHEET WRAPPER */}
        <div className="bg-white max-w-4xl mx-auto py-2" id="document-sheet-container">
          <div className="bg-white select-text relative" id="workspace-document-sheet">
            
            {/* Optional Meta Description */}
            {includeMeta && (
              <div className="mb-8 pb-6 border-b border-gray-100 select-text" id="document-included-meta">
                <div className="text-[10px] font-mono text-gray-400 uppercase tracking-widest font-bold mb-1.5 select-none">META DESCRIPTION (SEO OUTPUT)</div>
                <p className="text-gray-500 italic text-sm leading-relaxed">{article.metaDescription}</p>
              </div>
            )}

            {/* Featured image */}
            {article.featuredImage && (
              <div className="mb-8 select-text" id="article-sheet-featured-image">
                <img
                  src={article.featuredImage.url}
                  alt={article.featuredImage.alt}
                  referrerPolicy="no-referrer"
                  className="w-full h-auto max-h-[460px] object-cover rounded-xl shadow-sm"
                />
                <div className="text-xs text-gray-500 mt-2 select-none">
                  {article.featuredImage.caption} {article.featuredImage.credit ? `| ${article.featuredImage.credit}` : ''}
                </div>
              </div>
            )}

            {/* Title */}
            <h1 className="font-sans text-2xl md:text-3xl font-extrabold text-[#111827] leading-tight mb-6 select-text">
              {article.title}
            </h1>
            
            <style dangerouslySetInnerHTML={{ __html: `
              #document-body h1 {
                font-family: "Inter", sans-serif;
                font-size: 1.5rem;
                font-weight: 700;
                color: #111827;
                margin-top: 1.75rem;
                margin-bottom: 0.875rem;
                line-height: 1.25;
              }
              #document-body h2 {
                font-family: "Inter", sans-serif;
                font-size: 1.25rem;
                font-weight: 700;
                color: #111827;
                margin-top: 1.5rem;
                margin-bottom: 0.75rem;
                line-height: 1.25;
              }
              #document-body h3 {
                font-family: "Inter", sans-serif;
                font-size: 1.125rem;
                font-weight: 700;
                color: #111827;
                margin-top: 1.25rem;
                margin-bottom: 0.5rem;
                line-height: 1.25;
              }
              #document-body p {
                font-family: "Inter", sans-serif;
                font-size: 0.9375rem;
                color: #2d3748;
                line-height: 1.625;
                margin-bottom: 1rem;
                text-align: justify;
              }
              #document-body ul {
                list-style-type: disc;
                margin-bottom: 1rem;
                padding-left: 1.5rem;
                font-size: 0.9375rem;
                color: #2d3748;
              }
              #document-body ol {
                list-style-type: decimal;
                margin-bottom: 1rem;
                padding-left: 1.5rem;
                font-size: 0.9375rem;
                color: #2d3748;
              }
              #document-body li {
                margin-bottom: 0.375rem;
                line-height: 1.625;
              }
              #document-body blockquote {
                border-left: 4px solid #FE4C6F;
                padding-left: 1rem;
                font-style: italic;
                color: #4a5568;
                background-color: #f7fafc;
                padding-top: 8px;
                padding-bottom: 8px;
                margin: 1.25rem 0;
              }
            `}} />

            {/* Main Article Render Area */}
            <div 
              id="document-body"
              className="select-text"
              dangerouslySetInnerHTML={{ __html: article.contentHtml }}
            />

            {/* FAQ section */}
            {article.faq && article.faq.length > 0 && (
              <div className="mt-12 border-t border-gray-100 pt-8 select-text" id="document-faq-section">
                <h2 className="font-sans text-xl font-bold text-[#111827] mb-6 select-none">
                  Pertanyaan Sering Diajukan
                </h2>
                <div className="space-y-6">
                  {article.faq.map((item, idx) => (
                    <div key={idx} className="space-y-2 select-text">
                      <h3 className="font-bold text-[#111827] text-base">
                        {item.question}
                      </h3>
                      <p className="text-gray-600 text-sm leading-relaxed text-justify">
                        {item.answer}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Structured Schema output */}
            {includeSchema && (
              <div className="mt-12 select-text font-mono text-xs text-[#6B7280]" id="document-included-schema">
                <div className="font-sans font-bold text-sm text-[#111827] mb-2 select-none">FAQ Schema JSON-LD Markup</div>
                <pre className="p-4 bg-gray-50 text-[10px] font-mono overflow-x-auto whitespace-pre-wrap text-[#111827] border border-[#E5E7EB] rounded-lg">
                  {article.faqSchema}
                </pre>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* 3. PROGRESSIVE DISCLOSURE COLLAPSIBLES */}
      <div className="space-y-3 pt-4">
        
        {/* ACCORDION 1: DETAIL SEO */}
        <div className="border border-gray-100 rounded-xl bg-white overflow-hidden shadow-sm">
          <button
            onClick={() => setShowSeo(!showSeo)}
            className="w-full flex items-center justify-between p-4 font-semibold text-sm text-gray-700 hover:bg-gray-50 transition-colors select-none"
          >
            <span className="flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-blue-500" />
              [Lihat Detail SEO]
            </span>
            <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${showSeo ? 'rotate-180' : ''}`} />
          </button>
          
          {showSeo && (
            <div className="p-5 border-t border-gray-100 bg-gray-50/50 space-y-4 animate-fade-in text-xs text-gray-600">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="bg-white p-4 rounded-xl border border-gray-100 space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Kata Kunci Fokus</span>
                  <div className="font-semibold text-gray-800 text-sm">{article.keywordDensity.keyword}</div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100 space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Keyword Density</span>
                  <div className="font-semibold text-gray-800 text-sm">
                    {article.keywordDensity.percentage}% ({article.keywordDensity.count}x)
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100 space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Evaluasi Density</span>
                  <div className="font-semibold text-gray-800 text-[11px]">{article.keywordDensity.evaluation}</div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-gray-100 space-y-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase block">Semantic & LSI Keywords</span>
                <div className="flex flex-wrap gap-1.5">
                  {article.semanticKeywords.map((tag, idx) => (
                    <span key={idx} className="rounded-full bg-gray-50 border border-gray-100 px-2.5 py-1 font-medium select-all">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-gray-100 space-y-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase block">Featured Image SEO Alt & Caption</span>
                <div className="grid gap-3 sm:grid-cols-2 text-xs">
                  <div>
                    <span className="font-semibold text-gray-700">Alt Text:</span>
                    <p className="bg-gray-50 p-2 rounded mt-1 italic select-all border border-gray-100">{article.featuredImage.alt}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Caption Gambar:</span>
                    <p className="bg-gray-50 p-2 rounded mt-1 select-all border border-gray-100">{article.featuredImage.caption}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-gray-100 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Structured FAQ JSON-LD Schema</span>
                  <button 
                    onClick={() => handleCopy(article.faqSchema, 'faq-schema')} 
                    className="text-primary hover:underline text-[10px] font-bold"
                  >
                    {copiedSection === 'faq-schema' ? 'Tersalin!' : 'Salin Schema'}
                  </button>
                </div>
                <pre className="p-3 bg-gray-950 text-[10px] font-mono text-gray-300 rounded-lg overflow-x-auto max-h-[150px]">
                  {article.faqSchema}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* ACCORDION 2: COMPLIANCE AUDIT */}
        <div className="border border-gray-100 rounded-xl bg-white overflow-hidden shadow-sm">
          <button
            onClick={() => setShowAudit(!showAudit)}
            className="w-full flex items-center justify-between p-4 font-semibold text-sm text-gray-700 hover:bg-gray-50 transition-colors select-none"
          >
            <span className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-green-600" />
              [Lihat Audit Kepatuhan]
            </span>
            <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${showAudit ? 'rotate-180' : ''}`} />
          </button>
          
          {showAudit && (
            <div className="p-5 border-t border-gray-100 bg-gray-50/50 space-y-4 animate-fade-in text-xs text-gray-600">
              <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-100">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Total Iterasi Rewrite</span>
                  <span className="font-semibold text-gray-800 text-sm">{article.complianceHistory.length} Kali</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Skor Kepatuhan Akhir</span>
                  <span className="font-bold text-green-600 text-sm">
                    {article.complianceHistory[article.complianceHistory.length - 1]?.score || 100}/100
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                {article.complianceHistory.map((hist, idx) => {
                  const isPassed = hist.passed;
                  return (
                    <div key={idx} className="bg-white p-4 rounded-xl border border-gray-100 space-y-3">
                      <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                        <span className="font-bold text-gray-800 text-sm">
                          Iterasi {hist.iteration}: {hist.isOriginal ? 'Draf Pertama' : 'Rewrite Otomatis'}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isPassed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {isPassed ? 'LULOS' : 'TIDAK LOLOS'} (Skor: {hist.score})
                        </span>
                      </div>

                      {hist.report.overusedWords.length > 0 && (
                        <div className="space-y-1">
                          <div className="font-semibold text-gray-700 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3 text-red-500" />
                            Kata Klise AI Terdeteksi:
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {hist.report.overusedWords.map((wordObj, wIdx) => (
                              <span key={wIdx} className="bg-gray-50 px-2 py-0.5 rounded border border-gray-100 font-mono text-[10px] text-gray-700">
                                {wordObj.word} ({wordObj.count}x) - {getSeverityBadge(wordObj.severity)}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="space-y-1 bg-gray-50/50 p-2.5 rounded border border-gray-100/30">
                        <div className="font-semibold text-gray-700">Evaluasi Rhythmic & Panjang Kalimat:</div>
                        <p className="text-gray-600 italic leading-relaxed">{hist.report.sentenceLengthFeedback}</p>
                      </div>

                      {hist.report.feedback.length > 0 && (
                        <div className="space-y-1">
                          <div className="font-semibold text-gray-700">Rekomendasi Editor:</div>
                          <ul className="list-disc pl-4 space-y-0.5">
                            {hist.report.feedback.map((f, fIdx) => (
                              <li key={fIdx}>{f}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ACCORDION 3: METADATA & SOURCE */}
        <div className="border border-gray-100 rounded-xl bg-white overflow-hidden shadow-sm">
          <button
            onClick={() => setShowMetadata(!showMetadata)}
            className="w-full flex items-center justify-between p-4 font-semibold text-sm text-gray-700 hover:bg-gray-50 transition-colors select-none"
          >
            <span className="flex items-center gap-2">
              <FileCode className="h-4 w-4 text-purple-500" />
              [Lihat Metadata & Source]
            </span>
            <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${showMetadata ? 'rotate-180' : ''}`} />
          </button>
          
          {showMetadata && (
            <div className="p-5 border-t border-gray-100 bg-gray-50/50 space-y-4 animate-fade-in text-xs text-gray-600">
              <div className="bg-white p-4 rounded-xl border border-gray-100 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-700">Judul Artikel</span>
                  <button onClick={() => handleCopy(article.title, 'title')} className="text-primary hover:underline font-bold text-[10px]">Salin</button>
                </div>
                <p className="bg-gray-50 p-2.5 rounded font-medium select-all text-gray-800">{article.title}</p>

                <div className="flex justify-between items-center pt-2">
                  <span className="font-semibold text-gray-700">Slug URL</span>
                  <button onClick={() => handleCopy(article.slug, 'slug')} className="text-primary hover:underline font-bold text-[10px]">Salin</button>
                </div>
                <p className="bg-gray-50 p-2.5 rounded font-mono select-all text-gray-800">{article.slug}</p>

                <div className="flex justify-between items-center pt-2">
                  <span className="font-semibold text-gray-700">Meta Deskripsi SEO</span>
                  <button onClick={() => handleCopy(article.metaDescription, 'meta')} className="text-primary hover:underline font-bold text-[10px]">Salin</button>
                </div>
                <p className="bg-gray-50 p-2.5 rounded italic leading-relaxed select-all text-gray-800">{article.metaDescription}</p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-gray-100 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-700">Raw HTML (Hasil Kompilasi)</span>
                  <button onClick={() => handleCopy(article.contentHtml, 'html')} className="text-primary hover:underline font-bold text-[10px]">Salin HTML</button>
                </div>
                <pre className="p-3 bg-gray-950 text-[10px] font-mono text-gray-300 rounded-lg overflow-x-auto max-h-[150px] select-all">
                  {article.contentHtml}
                </pre>
              </div>

              <div className="bg-white p-4 rounded-xl border border-gray-100 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-700">Raw Markdown</span>
                  <button onClick={() => handleCopy(article.contentMarkdown, 'markdown')} className="text-primary hover:underline font-bold text-[10px]">Salin Markdown</button>
                </div>
                <pre className="p-3 bg-gray-950 text-[10px] font-mono text-gray-300 rounded-lg overflow-x-auto max-h-[150px] select-all">
                  {article.contentMarkdown}
                </pre>
              </div>
            </div>
          )}
        </div>

      </div>
      
    </div>
  );
}
