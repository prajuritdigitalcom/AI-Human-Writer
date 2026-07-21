import React, { useState } from 'react';
import { GeneratedArticle } from '../types';
import { 
  Eye, 
  Code, 
  Copy, 
  Check, 
  Download, 
  FileCode, 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Quote, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  Link2, 
  Globe, 
  Image as ImageIcon,
  CheckCircle,
  HelpCircle
} from 'lucide-react';

interface PreviewViewProps {
  article: GeneratedArticle | null;
}

export default function PreviewView({ article }: PreviewViewProps) {
  const [activeEditorTab, setActiveEditorTab] = useState<'visual' | 'text'>('visual');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [copiedRich, setCopiedRich] = useState(false);
  const [richCopyMessage, setRichCopyMessage] = useState<string | null>(null);
  const [includeMeta, setIncludeMeta] = useState(false);
  const [includeSchema, setIncludeSchema] = useState(false);

  if (!article) {
    return (
      <div className="rounded-none bg-white p-12 text-center border border-gray-200 select-none animate-fade-in" id="preview-empty">
        <Eye className="mx-auto h-12 w-12 text-gray-300 mb-3" />
        <h3 className="font-sans text-lg font-bold text-gray-900 mb-1">Belum Ada Artikel</h3>
        <p className="text-gray-500 text-sm max-w-sm mx-auto">
          Silakan isi form pencarian kata kunci dan tekan tombol "Hasilkan Artikel SEO" di atas terlebih dahulu.
        </p>
      </div>
    );
  }

  // Calculate dynamic HTML body contents depending on active options
  const getCombinedHtml = () => {
    let html = '';
    
    if (includeMeta) {
      html += `<p style="font-style: italic; color: #666; margin-bottom: 24px;"><strong>Meta Description:</strong> ${article.metaDescription}</p>\n\n`;
    }

    if (article.featuredImage) {
      html += `<figure style="margin-bottom: 24px;"><img src="${article.featuredImage.url}" alt="${article.featuredImage.alt}" style="max-width: 100%; height: auto; display: block;" /><figcaption style="font-size: 13px; color: #666; margin-top: 8px;">${article.featuredImage.caption}</figcaption></figure>\n\n`;
    }

    html += article.contentHtml;

    if (includeSchema) {
      html += `\n\n<script type="application/ld+json">\n${article.faqSchema}\n</script>`;
    }

    return html;
  };

  const getCombinedMarkdown = () => {
    let md = '';
    if (includeMeta) {
      md += `*Meta Description:* ${article.metaDescription}\n\n`;
    }
    if (article.featuredImage) {
      md += `![${article.featuredImage.alt}](${article.featuredImage.url})\n*${article.featuredImage.caption}*\n\n`;
    }
    md += article.contentMarkdown;
    if (includeSchema) {
      md += `\n\n\`\`\`html\n<script type="application/ld+json">\n${article.faqSchema}\n</script>\n\`\`\``;
    }
    return md;
  };

  // Estimate total word count
  const textOnly = getCombinedHtml().replace(/<[^>]+>/g, ' ');
  const wordCount = textOnly.trim().split(/\s+/).filter(Boolean).length;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(label);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const handleCopyRichText = async () => {
    try {
      const richHtml = `<div style="font-family: Georgia, 'Times New Roman', serif; color: #333333; line-height: 1.7; max-width: 800px; margin: 0 auto;">
        <h1>${article.title}</h1>
        ${getCombinedHtml()}
      </div>`;
      
      const blobHtml = new Blob([richHtml], { type: 'text/html' });
      const fallbackText = `${article.title}\n\n${getCombinedMarkdown()}`;
      const blobText = new Blob([fallbackText], { type: 'text/plain' });
      
      const data = [new ClipboardItem({
        'text/html': blobHtml,
        'text/plain': blobText
      })];
      
      await navigator.clipboard.write(data);
      setCopiedRich(true);
      setRichCopyMessage("Format WordPress Rich-Text berhasil disalin! Buka editor WordPress Anda lalu tekan Ctrl+V.");
      setTimeout(() => {
        setCopiedRich(false);
        setRichCopyMessage(null);
      }, 4000);
    } catch (err) {
      console.error('Failed to copy rich text:', err);
      await navigator.clipboard.writeText(getCombinedHtml());
      setCopiedRich(true);
      setRichCopyMessage("HTML tersalin ke clipboard!");
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
    body { font-family: Georgia, "Times New Roman", serif; line-height: 1.7; color: #333; max-width: 860px; margin: 40px auto; padding: 0 20px; }
    h1 { font-size: 2.2em; color: #111; margin-bottom: 0.8em; font-weight: bold; line-height: 1.2; }
    h2 { font-size: 1.6em; color: #222; margin-top: 1.6em; margin-bottom: 0.8em; font-weight: bold; }
    h3 { font-size: 1.3em; color: #222; margin-top: 1.4em; margin-bottom: 0.6em; font-weight: bold; }
    p { margin-bottom: 1.4em; text-align: justify; }
    ul, ol { margin-bottom: 1.4em; padding-left: 24px; }
    li { margin-bottom: 0.4em; }
    a { color: #0073aa; text-decoration: underline; }
    blockquote { border-left: 4px solid #ddd; padding-left: 16px; font-style: italic; color: #666; margin: 1.5em 0; }
  </style>
</head>
<body>
  <h1>${article.title}</h1>
  ${getCombinedHtml()}
</body>
</html>`;
      filename = `${article.slug}.html`;
      mimeType = 'text/html';
    } else if (format === 'md') {
      content = `# ${article.title}\n\n${getCombinedMarkdown()}`;
      filename = `${article.slug}.md`;
      mimeType = 'text/markdown';
    } else {
      content = `JUDUL: ${article.title}\nSLUG: ${article.slug}\n\n========================================\n\n${getCombinedMarkdown()}`;
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

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full animate-fade-in" id="preview-wordpress-layout">
      
      {/* LEFT COLUMN: ACTIONS & OPTIONS SIDEBAR */}
      <aside className="lg:w-72 shrink-0 space-y-6 select-none" id="wordpress-sidebar-actions">
        
        {/* Document Action Panel */}
        <div className="bg-white border border-gray-200 p-5 space-y-4">
          <h3 className="font-sans text-xs font-bold uppercase tracking-wider text-gray-500 border-b border-gray-100 pb-2">
            Publishing Actions
          </h3>

          <button
            onClick={handleCopyRichText}
            className="w-full flex items-center justify-center gap-2 rounded bg-[#0073aa] hover:bg-[#005177] text-white font-bold text-sm py-3 px-4 shadow-sm active:scale-97 transition-all cursor-pointer"
            title="Salin gaya artikel untuk langsung di-paste ke WordPress/Blogger"
          >
            <Copy className="h-4 w-4" />
            Salin Rich-Text
          </button>

          {richCopyMessage && (
            <div className="bg-green-50 text-green-800 text-[11px] rounded p-2.5 flex items-start gap-1.5 border border-green-100">
              <CheckCircle className="h-3.5 w-3.5 text-green-600 shrink-0 mt-0.5" />
              <span>{richCopyMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => handleCopy(getCombinedHtml(), 'raw-html')}
              className="flex items-center justify-center gap-1.5 rounded border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-semibold text-xs py-2 px-1 cursor-pointer"
              title="Salin Raw HTML"
            >
              {copiedSection === 'raw-html' ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Code className="h-3.5 w-3.5 text-gray-400" />}
              Salin HTML
            </button>

            <button
              onClick={() => handleCopy(getCombinedMarkdown(), 'raw-md')}
              className="flex items-center justify-center gap-1.5 rounded border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-semibold text-xs py-2 px-1 cursor-pointer"
              title="Salin Raw Markdown"
            >
              {copiedSection === 'raw-md' ? <Check className="h-3.5 w-3.5 text-green-600" /> : <FileCode className="h-3.5 w-3.5 text-gray-400" />}
              Salin MD
            </button>
          </div>
        </div>

        {/* Formatting Configuration */}
        <div className="bg-white border border-gray-200 p-5 space-y-4">
          <h3 className="font-sans text-xs font-bold uppercase tracking-wider text-gray-500 border-b border-gray-100 pb-2">
            Editor Options
          </h3>
          
          <div className="space-y-3">
            <label className="flex items-start gap-2.5 cursor-pointer text-xs font-semibold text-gray-700">
              <input
                type="checkbox"
                checked={includeMeta}
                onChange={(e) => setIncludeMeta(e.target.checked)}
                className="mt-0.5 rounded border-gray-300 text-[#0073aa] focus:ring-[#0073aa] h-3.5 w-3.5 cursor-pointer"
              />
              <span>Sertakan Meta Deskripsi di bagian atas Editor</span>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer text-xs font-semibold text-gray-700">
              <input
                type="checkbox"
                checked={includeSchema}
                onChange={(e) => setIncludeSchema(e.target.checked)}
                className="mt-0.5 rounded border-gray-300 text-[#0073aa] focus:ring-[#0073aa] h-3.5 w-3.5 cursor-pointer"
              />
              <span>Sertakan FAQ JSON-LD Schema di bagian bawah</span>
            </label>
          </div>
        </div>

        {/* Downloads */}
        <div className="bg-white border border-gray-200 p-5 space-y-3">
          <h3 className="font-sans text-xs font-bold uppercase tracking-wider text-gray-500 border-b border-gray-100 pb-2">
            Ekspor Dokumen
          </h3>
          
          <div className="space-y-2">
            <button
              onClick={() => handleDownload('html')}
              className="w-full flex items-center justify-between text-xs text-gray-700 bg-gray-50 hover:bg-gray-100 rounded px-3 py-2 border border-gray-200 cursor-pointer"
            >
              <span className="font-medium">Unduh Berkas HTML (.html)</span>
              <Download className="h-3.5 w-3.5 text-gray-400" />
            </button>

            <button
              onClick={() => handleDownload('md')}
              className="w-full flex items-center justify-between text-xs text-gray-700 bg-gray-50 hover:bg-gray-100 rounded px-3 py-2 border border-gray-200 cursor-pointer"
            >
              <span className="font-medium">Unduh Berkas Markdown (.md)</span>
              <Download className="h-3.5 w-3.5 text-gray-400" />
            </button>

            <button
              onClick={() => handleDownload('txt')}
              className="w-full flex items-center justify-between text-xs text-gray-700 bg-gray-50 hover:bg-gray-100 rounded px-3 py-2 border border-gray-200 cursor-pointer"
            >
              <span className="font-medium">Unduh Berkas Teks (.txt)</span>
              <Download className="h-3.5 w-3.5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Google Helpful Content Audit Log */}
        {article.helpfulContentLog && (
          <div className="bg-emerald-50 border border-emerald-100 p-5 rounded space-y-3" id="google-helpful-audit-sidebar">
            <h4 className="text-xs font-bold text-emerald-900 flex items-center gap-1.5 uppercase tracking-wider">
              <CheckCircle className="h-4 w-4 text-emerald-700 shrink-0" />
              Google Helpful Audit
            </h4>
            
            <div className="space-y-1.5 text-xs text-emerald-800">
              <div className="flex justify-between">
                <span className="font-medium">Status:</span>
                <span className="font-bold uppercase tracking-wide bg-emerald-100 text-emerald-900 px-1.5 py-0.5 rounded text-[10px]">
                  {article.helpfulContentLog.validationResult}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Versi Aturan:</span>
                <span className="font-mono font-bold text-emerald-900">{article.helpfulContentLog.knowledgeVersion}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Total Revisi:</span>
                <span className="font-bold text-emerald-900">{article.helpfulContentLog.revisionCount}</span>
              </div>
            </div>

            <div className="border-t border-emerald-200/50 pt-2 text-[11px] text-emerald-900/85 italic leading-relaxed text-justify">
              <p className="font-semibold not-italic mb-1 text-emerald-950">Analisis Kualitas:</p>
              {article.helpfulContentLog.evaluationResult}
            </div>
          </div>
        )}

        {/* TinyMCE instructions */}
        <div className="bg-blue-50 border border-blue-100 p-5 rounded space-y-2">
          <h4 className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
            <HelpCircle className="h-4 w-4 text-blue-700" />
            Panduan Salin WordPress
          </h4>
          <p className="text-[11px] text-blue-800 leading-relaxed">
            Klik tombol <strong>"Salin Rich-Text"</strong> di atas, atau klik di dalam area editor di sebelah kanan lalu tekan <strong>Ctrl + A</strong> dilanjutkan <strong>Ctrl + C</strong>. Format penulisan HTML, heading, daftar, dan tabel akan dipertahankan sepenuhnya saat Anda menempelkannya (Paste) ke editor WordPress Anda.
          </p>
        </div>

      </aside>

      {/* RIGHT COLUMN: WORDPRESS CLASSIC EDITOR CANVAS */}
      <div className="flex-grow space-y-4" id="wordpress-editor-preview">
        
        {/* Editor Admin Title Panel */}
        <div className="flex items-center justify-between border-b border-gray-200 pb-3 select-none">
          <div className="flex items-center gap-2">
            <h2 className="text-[#23282d] text-2xl font-light">Edit Post</h2>
            <span className="border border-gray-300 rounded px-2 py-0.5 text-xs font-medium text-gray-600 bg-white">Add New</span>
          </div>
        </div>

        {/* 1. WordPres Post Title Field */}
        <div className="space-y-1 select-text">
          <input
            type="text"
            readOnly
            value={article.title}
            className="w-full border border-gray-300 px-3 py-2 text-xl font-normal text-gray-900 focus:outline-none bg-white placeholder-gray-400 cursor-default"
            placeholder="Enter title here"
            id="wp-post-title"
          />
          
          {/* WordPress Permalink Simulation */}
          <div className="text-xs text-gray-500 flex items-center gap-1.5 pl-1 py-0.5 select-none" id="wp-permalink-line">
            <span className="font-semibold">Permalink:</span>
            <span className="text-gray-400">https://yourdomain.com/</span>
            <span className="font-mono text-[#0073aa] bg-yellow-50 px-1 py-0.2 rounded border border-yellow-100 select-all">{article.slug}</span>
            <button className="text-xs text-gray-600 bg-white border border-gray-300 hover:bg-gray-50 rounded px-1.5 py-0.5 ml-1 cursor-default">Edit</button>
            <button className="text-xs text-gray-600 bg-white border border-gray-300 hover:bg-gray-50 rounded px-1.5 py-0.5 cursor-default">View Post</button>
          </div>
        </div>

        {/* Add Media placeholder button */}
        <div className="select-none py-1">
          <button className="inline-flex items-center gap-1.5 text-xs text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 px-2.5 py-1.5 shadow-xs cursor-default">
            <ImageIcon className="h-3.5 w-3.5 text-gray-500" />
            Add Media
          </button>
        </div>

        {/* 2. TinyMCE Editor Container */}
        <div className="border border-gray-300 bg-white shadow-xs flex flex-col min-h-[500px]" id="wp-tinymce-container">
          
          {/* Tab Switcher (Visual / Text) */}
          <div className="bg-[#f1f1f1] border-b border-gray-300 px-2 pt-2 flex items-end justify-between select-none">
            {/* Left Toolbar Accents (Format buttons etc can go here, but tabs belong on right or left) */}
            <div></div>

            {/* Right Tabs */}
            <div className="flex gap-1">
              <button
                onClick={() => setActiveEditorTab('visual')}
                className={`px-3 py-1 text-xs border-t border-x rounded-t transition-all cursor-pointer ${activeEditorTab === 'visual' ? 'bg-white border-gray-300 font-semibold text-gray-800 translate-y-[1px] z-10' : 'bg-[#e5e5e5] border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-200'}`}
              >
                Visual
              </button>
              <button
                onClick={() => setActiveEditorTab('text')}
                className={`px-3 py-1 text-xs border-t border-x rounded-t transition-all cursor-pointer ${activeEditorTab === 'text' ? 'bg-white border-gray-300 font-semibold text-gray-800 translate-y-[1px] z-10' : 'bg-[#e5e5e5] border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-200'}`}
              >
                Text
              </button>
            </div>
          </div>

          {/* TinyMCE Toolbar Simulation */}
          <div className="bg-[#fcfcfc] border-b border-gray-300 p-2 flex flex-wrap items-center gap-1 select-none" id="wp-editor-toolbar">
            <button className="p-1 text-gray-400 hover:text-gray-700 rounded hover:bg-gray-100/50 cursor-default" title="Bold"><Bold className="h-3.5 w-3.5" /></button>
            <button className="p-1 text-gray-400 hover:text-gray-700 rounded hover:bg-gray-100/50 cursor-default" title="Italic"><Italic className="h-3.5 w-3.5" /></button>
            <span className="h-4 w-[1px] bg-gray-300 mx-1"></span>
            <button className="p-1 text-gray-400 hover:text-gray-700 rounded hover:bg-gray-100/50 cursor-default" title="Bulleted list"><List className="h-3.5 w-3.5" /></button>
            <button className="p-1 text-gray-400 hover:text-gray-700 rounded hover:bg-gray-100/50 cursor-default" title="Numbered list"><ListOrdered className="h-3.5 w-3.5" /></button>
            <span className="h-4 w-[1px] bg-gray-300 mx-1"></span>
            <button className="p-1 text-gray-400 hover:text-gray-700 rounded hover:bg-gray-100/50 cursor-default" title="Blockquote"><Quote className="h-3.5 w-3.5" /></button>
            <span className="h-4 w-[1px] bg-gray-300 mx-1"></span>
            <button className="p-1 text-gray-400 hover:text-gray-700 rounded hover:bg-gray-100/50 cursor-default" title="Align Left"><AlignLeft className="h-3.5 w-3.5" /></button>
            <button className="p-1 text-gray-400 hover:text-gray-700 rounded hover:bg-gray-100/50 cursor-default" title="Align Center"><AlignCenter className="h-3.5 w-3.5" /></button>
            <button className="p-1 text-gray-400 hover:text-gray-700 rounded hover:bg-gray-100/50 cursor-default" title="Align Right"><AlignRight className="h-3.5 w-3.5" /></button>
            <span className="h-4 w-[1px] bg-gray-300 mx-1"></span>
            <button className="p-1 text-gray-400 hover:text-gray-700 rounded hover:bg-gray-100/50 cursor-default" title="Insert/edit link"><Link2 className="h-3.5 w-3.5" /></button>
            <span className="h-4 w-[1px] bg-gray-300 mx-1"></span>
            <button className="text-[11px] text-gray-500 bg-white border border-gray-300 px-1 rounded hover:bg-gray-50 cursor-default">Toolbar Toggle</button>
          </div>

          {/* WordPress Document Body Sheet */}
          <div className="flex-grow p-6 md:p-8 select-text overflow-y-auto" id="wp-editor-sheet-area">
            {activeEditorTab === 'visual' ? (
              <article className="max-w-[860px] mx-auto" id="wp-editor-content">
                {/* Optional Meta Description */}
                {includeMeta && (
                  <p style={{ fontStyle: 'italic', color: '#666', marginBottom: '24px' }}>
                    <strong>Meta Description:</strong> {article.metaDescription}
                  </p>
                )}

                {/* Featured image inside editor */}
                {article.featuredImage && (
                  <figure className="mb-6 select-text">
                    <img
                      src={article.featuredImage.url}
                      alt={article.featuredImage.alt}
                      referrerPolicy="no-referrer"
                      className="w-full h-auto max-h-[440px] object-cover"
                    />
                    <figcaption className="text-xs text-gray-500 mt-2 italic select-none">
                      {article.featuredImage.caption} {article.featuredImage.credit ? `| ${article.featuredImage.credit}` : ''}
                    </figcaption>
                  </figure>
                )}

                {/* Styled HTML render */}
                <div 
                  dangerouslySetInnerHTML={{ __html: article.contentHtml }} 
                  className="prose-wp select-text"
                />

                {/* Optional FAQ Schema JSON */}
                {includeSchema && (
                  <div className="mt-8 select-text border border-dashed border-gray-300 p-4 bg-gray-50 font-mono text-[11px] text-gray-600 rounded">
                    <div className="font-sans font-semibold text-xs text-gray-800 mb-1 select-none">FAQ JSON-LD Schema (Sertakan dalam Kode Header):</div>
                    <pre className="whitespace-pre-wrap">{article.faqSchema}</pre>
                  </div>
                )}
              </article>
            ) : (
              /* TEXT TAB - Raw HTML Editor Simulation */
              <div className="h-full w-full max-w-[860px] mx-auto">
                <textarea
                  readOnly
                  value={getCombinedHtml()}
                  className="w-full h-[500px] border-none font-mono text-[13px] text-gray-800 bg-white focus:outline-none resize-none"
                  id="wp-html-editor-textarea"
                />
              </div>
            )}
          </div>

          {/* TinyMCE Status Bar Simulation */}
          <div className="bg-[#fcfcfc] border-t border-gray-300 px-3 py-1.5 text-[11px] text-gray-500 flex justify-between select-none" id="wp-editor-statusbar">
            <div>
              {activeEditorTab === 'visual' ? (
                <span className="font-mono">body &raquo; p</span>
              ) : (
                <span className="font-mono">text-mode</span>
              )}
            </div>
            <div>
              <span>Word count: <strong>{wordCount}</strong></span>
            </div>
          </div>

        </div>

      </div>

      {/* Embedded WordPress classic editor TinyMCE style sheet values */}
      <style dangerouslySetInnerHTML={{ __html: `
        .prose-wp h1, .prose-wp h2, .prose-wp h3, .prose-wp h4, .prose-wp h5, .prose-wp h6 {
          font-family: Georgia, "Times New Roman", serif;
          font-weight: bold;
          color: #23282d;
          line-height: 1.3;
          margin-top: 1.6em;
          margin-bottom: 0.8em;
          letter-spacing: -0.01em;
        }
        .prose-wp h1 { font-size: 1.8rem; }
        .prose-wp h2 { font-size: 1.5rem; border-bottom: none; }
        .prose-wp h3 { font-size: 1.25rem; }
        .prose-wp h4 { font-size: 1.15rem; }
        
        .prose-wp p {
          font-family: Georgia, "Times New Roman", serif;
          font-size: 15px;
          color: #333333;
          line-height: 1.7;
          margin-bottom: 1.5em;
          text-align: left;
        }
        
        .prose-wp ul {
          list-style-type: disc !important;
          margin-bottom: 1.5em;
          padding-left: 24px;
          color: #333333;
        }
        
        .prose-wp ol {
          list-style-type: decimal !important;
          margin-bottom: 1.5em;
          padding-left: 24px;
          color: #333333;
        }
        
        .prose-wp li {
          font-family: Georgia, "Times New Roman", serif;
          font-size: 15px;
          margin-bottom: 0.5em;
          line-height: 1.7;
        }
        
        .prose-wp blockquote {
          border-left: 4px solid #ccd0d4;
          padding: 0.2em 0 0.2em 15px;
          margin: 1.5em 10px;
          font-style: italic;
          color: #555d66;
        }

        .prose-wp a {
          color: #0073aa;
          text-decoration: underline;
        }
        
        .prose-wp a:hover {
          color: #00a0d2;
        }

        .prose-wp table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 1.5em;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 14px;
        }

        .prose-wp th, .prose-wp td {
          border: 1px solid #ccd0d4;
          padding: 8px 10px;
          text-align: left;
        }

        .prose-wp th {
          background-color: #f1f1f1;
          font-weight: bold;
        }

        .prose-wp hr {
          border: 0;
          border-top: 1px solid #ccd0d4;
          margin: 2em 0;
        }
      `}} />

    </div>
  );
}
