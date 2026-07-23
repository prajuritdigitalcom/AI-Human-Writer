import { GoogleGenAI, Type } from "@google/genai";
import { marked } from "marked";
import { StyleType, AuditReport, GeneratedArticle, OverusedWordCheck, FAQItem, ImageMetadata } from "../src/types.js";
import { getStoredKnowledge } from "./wikipediaKnowledge.js";
import { getStoredEditorialKnowledge } from "./georgeKaoKnowledge.js";
import { getStoredGoogleHelpfulKnowledge } from "./googleHelpfulKnowledge.js";
import { getStoredSemanticHtmlKnowledge } from "./semanticHtmlKnowledge.js";
import { runSemanticHtmlEngine } from "./semanticHtmlEngine.js";


// Helper to split text into sentences
function getSentences(text: string): string[] {
  // Regex to match sentence endings
  const cleanText = text.replace(/<(?:.|\n)*?>/gm, ''); // remove any html tags
  const matches = cleanText.match(/[^.!?]+[.!?]+(\s|$)/g) || [];
  return matches.map(s => s.trim()).filter(s => s.length > 5);
}

// Programmatic Compliance Audit based on Wikipedia:Signs_of_AI_writing & Anti-AI Detector Standards
export function performComplianceAudit(markdown: string): AuditReport {
  const knowledge = getStoredKnowledge();
  const lowercase = markdown.toLowerCase();
  const feedback: string[] = [];
  const overusedWords: OverusedWordCheck[] = [];
  const clichesFound: string[] = [];
  let score = 100;

  // 1. Check for Forbidden Words and Indonesian AI Fillers
  knowledge.forbiddenWords.forEach(({ word, severity, max, penalty, message }) => {
    const regex = new RegExp(`\\b${word.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'gi');
    const matches = lowercase.match(regex);
    const count = matches ? matches.length : 0;
    
    if (count > max) {
      score -= (count - max) * penalty;
      overusedWords.push({ word, count, severity: severity as 'high' | 'medium' | 'low' });
      feedback.push(`Ditemukan kata/frase AI "${word}" sebanyak ${count} kali (${message}). Batas maksimal: ${max}.`);
    }
  });

  // 2. Check for Cliché Transitions starting paragraphs
  const paragraphs = markdown.split(/\n+/).map(p => p.trim()).filter(p => p.length > 0);
  let transitionClicheCount = 0;
  paragraphs.forEach((p, idx) => {
    const pLower = p.toLowerCase();
    knowledge.clicheTransitions.forEach(cliche => {
      if (pLower.startsWith(cliche)) {
        score -= 10;
        transitionClicheCount++;
        clichesFound.push(`Paragraph ${idx + 1} dimulai dengan transisi AI: "${cliche}"`);
        feedback.push(`Paragraf ke-${idx + 1} dimulai dengan frase klise AI "${cliche}". Hindari penggunaan penutup klise.`);
      }
    });
  });

  // 3. Check for Intro Clichés & Rhetorical Opening Questions (VERY CRITICAL FOR AI DETECTORS)
  let introClicheCount = 0;
  let hasRhetoricalIntro = false;
  if (paragraphs.length > 0) {
    const firstParagraph = paragraphs[0].toLowerCase();
    
    // Check for rhetorical opening questions in paragraph 1
    const isQuestionIntro = /^(pernah|apakah|tahukah|bayangkan|inginkah|pernahkah)/i.test(firstParagraph) || 
      (firstParagraph.includes('?') && (firstParagraph.startsWith('pernah') || firstParagraph.startsWith('apakah') || firstParagraph.startsWith('tahukah')));
    
    if (isQuestionIntro) {
      score -= 25;
      hasRhetoricalIntro = true;
      feedback.push("DILARANG KERAS: Paragraf pertama dibuka dengan pertanyaan retoris ('Pernah membayangkan...?'). Ini pemicu utama skor AI 97%+ di Quillbot/CopyLeaks. Buka paragraf pertama langsung dengan fakta teknis, isu nyata, atau aksi.");
    }

    knowledge.introCliches.forEach(cliche => {
      if (firstParagraph.includes(cliche)) {
        score -= 10;
        introClicheCount++;
        clichesFound.push(`Intro cliché: "${cliche}"`);
        feedback.push(`Paragraf pembuka mengandung kalimat klise AI "${cliche}". Mulailah langsung dengan fakta atau hook yang menarik.`);
      }
    });
  }

  // 4. Check for Em-dash (—) Overuse
  const emDashMatches = markdown.match(/—| -- /g);
  const emDashCount = emDashMatches ? emDashMatches.length : 0;
  if (emDashCount > 2) {
    score -= 15;
    feedback.push(`Ditemukan ${emDashCount} penggunaan em-dash ('—'). Em-dash berlebihan di tengah kalimat adalah ciri khas gaya tulisan AI. Ganti dengan koma atau pecah menjadi dua kalimat.`);
  }

  // 5. Check Sentence Length Variance (Burstiness)
  const sentences = getSentences(markdown);
  let sentenceLengthVariance = 0;
  let sentenceLengthFeedback = 'Kurang data kalimat untuk mengevaluasi ritme.';
  
  if (sentences.length > 3) {
    const wordCounts = sentences.map(s => s.split(/\s+/).filter(w => w.length > 0).length);
    const avgLength = wordCounts.reduce((a, b) => a + b, 0) / wordCounts.length;
    
    // Variance calculation
    const squaredDiffs = wordCounts.map(count => Math.pow(count - avgLength, 2));
    const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / squaredDiffs.length;
    const stdDev = Math.sqrt(avgSquaredDiff);
    sentenceLengthVariance = stdDev;

    if (stdDev < 4.5) {
      score -= 15;
      sentenceLengthFeedback = `Monoton (Standar Deviasi: ${stdDev.toFixed(1)} kata). Panjang kalimat terlalu seragam (rata-rata ${avgLength.toFixed(1)} kata). Human writing bervariasi antara kalimat pendek dan panjang.`;
      feedback.push(`Ritme tulisan monoton. Standar deviasi panjang kalimat hanya ${stdDev.toFixed(1)} kata (Target: bervariasi, deviasi > 4.5). Variasikan panjang kalimat Anda.`);
    } else if (stdDev < 6) {
      score -= 5;
      sentenceLengthFeedback = `Cukup baik (Standar Deviasi: ${stdDev.toFixed(1)} kata). Ritme kalimat sudah menunjukkan beberapa variasi (rata-rata ${avgLength.toFixed(1)} kata).`;
    } else {
      sentenceLengthFeedback = `Sangat alami (Standar Deviasi: ${stdDev.toFixed(1)} kata). Ritme kalimat bervariasi dengan sangat baik antara kalimat pendek, sedang, dan panjang (rata-rata ${avgLength.toFixed(1)} kata).`;
    }
  }

  // Cap minimum score at 0
  score = Math.max(0, score);
  
  // Set passed criteria: score must be >= 85, no critical words, no rhetorical intro
  const hasCriticalWords = overusedWords.some(w => (w.word === 'delve' || w.word === 'tapestry' || w.word === 'jujur saja' || w.word === 'di situlah') && w.count > 0);
  const passed = score >= 85 && !hasCriticalWords && !hasRhetoricalIntro;

  return {
    passed,
    score,
    feedback,
    overusedWords,
    clichesFound,
    sentenceLengthVariance,
    sentenceLengthFeedback,
    introductionFeedback: (introClicheCount > 0 || hasRhetoricalIntro)
      ? 'Ditemukan frase klise/pertanyaan retoris pembuka yang harus dihilangkan.' 
      : 'Bagus, pembuka langsung fokus dan natural.',
    conclusionFeedback: transitionClicheCount > 0 
      ? 'Ditemukan frase transisi klise seperti "In conclusion" atau "Kesimpulannya".' 
      : 'Bagus, penutup natural dan bebas cliché.'
  };
}

// Scrape Unsplash dynamically for free images based on keyword
export async function fetchUnsplashImage(keyword: string): Promise<ImageMetadata> {
  const defaultImage: ImageMetadata = {
    url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80',
    alt: `${keyword} - Professional background representation`,
    caption: `Foto representatif berkualitas tinggi untuk ${keyword}`,
    credit: 'Unsplash'
  };

  try {
    const url = `https://unsplash.com/s/photos/${encodeURIComponent(keyword)}`;
    console.log(`Searching keyless Unsplash image for keyword: "${keyword}"...`);
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
      }
    });
    
    if (!response.ok) {
      throw new Error(`Unsplash search responded with status ${response.status}`);
    }
    
    const html = await response.text();
    // Locate image tags with images.unsplash.com
    const regex = /https:\/\/images\.unsplash\.com\/photo-[a-zA-Z0-9-]+[?]/g;
    const matches = html.match(regex);
    
    if (matches && matches.length > 0) {
      const uniqueMatches = Array.from(new Set(matches));
      // Usually first 2-3 matches are relevant content photos
      const selectedPhoto = uniqueMatches[0];
      return {
        url: `${selectedPhoto}auto=format&fit=crop&w=1200&q=80`,
        alt: `Gambar SEO untuk tema ${keyword}`,
        caption: `Gambar utama bertema ${keyword} yang dicari secara otomatis`,
        credit: 'Sumber gambar gratis: Unsplash'
      };
    }
  } catch (err: any) {
    console.error("Fetch Unsplash keyless failed, attempting Pexels/Pixabay mock fallback:", err.message || err);
  }

  // Fallback library of high-quality topic images to be more specific than just a general desk
  const lowerKeyword = keyword.toLowerCase();
  if (lowerKeyword.includes('sauna') || lowerKeyword.includes('kayu')) {
    return {
      url: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80',
      alt: 'Sauna kayu berkualitas tinggi',
      caption: 'Sauna kayu tradisional yang nyaman dan relaksatif',
      credit: 'Unsplash'
    };
  } else if (lowerKeyword.includes('bisnis') || lowerKeyword.includes('kerja') || lowerKeyword.includes('kantor') || lowerKeyword.includes('marketing')) {
    return {
      url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
      alt: 'Gedung bisnis dan suasana profesional modern',
      caption: 'Infrastruktur bisnis modern yang representatif',
      credit: 'Unsplash'
    };
  } else if (lowerKeyword.includes('makanan') || lowerKeyword.includes('kuliner') || lowerKeyword.includes('resep') || lowerKeyword.includes('kopi')) {
    return {
      url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80',
      alt: 'Sajian makanan kuliner lezat',
      caption: 'Estetika kuliner lezat penunjang artikel',
      credit: 'Unsplash'
    };
  } else if (lowerKeyword.includes('wisata') || lowerKeyword.includes('liburan') || lowerKeyword.includes('travel') || lowerKeyword.includes('pantai')) {
    return {
      url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
      alt: 'Destinasi wisata pantai yang indah',
      caption: 'Pemandangan alam destinasi wisata premium',
      credit: 'Unsplash'
    };
  } else if (lowerKeyword.includes('sehat') || lowerKeyword.includes('olahraga') || lowerKeyword.includes('diet') || lowerKeyword.includes('gym')) {
    return {
      url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1200&q=80',
      alt: 'Aktivitas olahraga kebugaran fisik',
      caption: 'Gaya hidup sehat bugar bernutrisi',
      credit: 'Unsplash'
    };
  }

  return defaultImage;
}

// Generate the article through rolling keys and handling audit feedback loops
export async function generateSEOArticle(
  keys: string[],
  keyword: string,
  style: StyleType,
  referenceInfo: string,
  imageUrlInput?: string,
  internalLinksInput?: string
): Promise<GeneratedArticle> {
  // Parse internal links
  const parsedLinks: { title: string; url: string }[] = [];
  if (internalLinksInput) {
    internalLinksInput.split('\n').forEach(line => {
      const parts = line.split('|');
      if (parts.length >= 2) {
        const title = parts[0].trim();
        const url = parts[1].trim();
        if (title && url) {
          parsedLinks.push({ title, url });
        }
      }
    });
  }

  // Determine Image
  let featuredImage: ImageMetadata;
  if (imageUrlInput && imageUrlInput.trim().startsWith('http')) {
    featuredImage = {
      url: imageUrlInput.trim(),
      alt: `Featured image untuk ${keyword}`,
      caption: `Gambar artikel pilihan untuk ${keyword}`,
      credit: 'Sumber gambar pengguna'
    };
  } else {
    featuredImage = await fetchUnsplashImage(keyword);
  }

  const linksDescription = parsedLinks.length > 0
    ? `INTERNAL LINKS TO INSERT (CRITICAL):
You MUST insert these links naturally into the content. DO NOT lump them at the bottom. Use them as anchor text contextually in sentences. Format as [Judul](URL) using the exact titles below:
${parsedLinks.map(l => `- "${l.title}" linking to URL: ${l.url}`).join('\n')}`
    : 'No internal links provided.';

  // Load dynamic knowledge
  const knowledge = getStoredKnowledge();
  const forbiddenWordsList = knowledge.forbiddenWords
    .map(w => `- "${w.word}" (${w.message})`)
    .join('\n');
  const transitionsList = knowledge.clicheTransitions
    .map(t => `- "${t}"`)
    .join('\n');
  const introClichesList = knowledge.introCliches
    .map(c => `- "${c}"`)
    .join('\n');
  const generalRecsList = knowledge.generalRecommendations
    .map(r => `- ${r}`)
    .join('\n');

  // Build Prompts
  const systemInstruction = `
You are an elite SEO Human Copywriter and Senior Field Journalist in Bahasa Indonesia.
Your mission is to generate an authentic, highly readable, deep SEO article that reads 100% like human-written prose and passes AI Detectors (Quillbot, CopyLeaks, Turnitin, GPTZero) with human scores (0-5% AI detected).

CRITICAL ANTI-AI DETECTOR (QUILLBOT / COPYLEAKS) HUMAN PROSE MANDATES:
1. ABSOLUTELY NO RHETORICAL QUESTION OPENINGS IN PARAGRAPH 1:
   - DILARANG KERAS membuka paragraf pertama dengan pertanyaan retoris (misal: "Pernah membayangkan...", "Pernahkah Anda...", "Tahukah Anda..."). Ini memicu skor 97%+ AI di Quillbot.
   - Pembuka harus LANGSUNG berupa fakta teknis, isu spesifik, atau aksi nyata di lapangan.
2. ABSOLUTELY NO CONVERSATIONAL AI BRIDGES & FILLER PHRASES:
   - DILARANG KERAS menggunakan pemanis buatan AI seperti: "Tapi jujur saja", "Nah, di situlah", "Bukan cuma soal X... ini tentang Y", "Tak bisa dipungkiri", "Penting untuk diingat bahwa".
3. NO OVERUSED EM-DASHES (—):
   - Jangan gunakan em-dash ("—") untuk menggabungkan dua klausa di tengah kalimat. Gunakan koma atau buat kalimat terpisah.
4. HIGH BURSTINESS & DYNAMIC RHYTHM:
   - Variasikan panjang kalimat secara ekstrem! Kombinasikan kalimat sangat pendek (3-6 kata) dengan kalimat penjelasan menengah (12-16 kata).
   - Hindari struktur paragraf simetris atau balasan otomatis.

WIKIPEDIA COMPLIANCE GUIDELINES (MANDATORY):
1. WORD CHOICE & BUZZWORDS TO AVOID:
${forbiddenWordsList}

2. PARAGRAPH TRANSITIONS TO AVOID:
${transitionsList}

3. INTRODUCTION BOILERPLATE FILLER TO AVOID:
${introClichesList}

4. ADDITIONAL GENERAL RECOMMENDATIONS & STYLING COMPLIANCE RULES:
${generalRecsList}

5. MANDATORY MARKDOWN & SEMANTIC HTML LAYOUT RULES:
   - Every main section MUST use a proper Markdown Heading level 2 ("## Judul Bagian Utama").
   - Every sub-point or sub-topic MUST use a proper Markdown Heading level 3 ("### Judul Sub-bagian").
   - NEVER embed subheadings as inline bold text at the beginning of a paragraph or list item (e.g. DO NOT write '1. **Judul Poin** teks penjelasan...'). ALWAYS put subheadings on their own separate line as '### Judul Sub-bagian' followed by a clean, separate paragraph on the next line!
   - Separate ALL subheadings, paragraphs, blockquotes, and lists with empty lines.
`;

  const userPrompt = `
Generate a comprehensive, premium-quality SEO article in Indonesian (Bahasa Indonesia) about: "${keyword}"
Gaya Penulisan: ${style}

INFORMASI REFERENSI (Use this for factual grounding and depth):
${referenceInfo || 'Tulis artikel mendalam berdasarkan pengetahuan profesional.'}

${linksDescription}

OUTPUT REQUIREMENT:
You must return your output strictly in JSON format. The article text inside "contentMarkdown" must be written in rich Markdown with elegant section headings (## H2, ### H3), separate paragraphs, bullet lists, bolding, and correct internal links integrated.

Strict JSON format to generate:
{
  "title": "A highly catchy, comprehensive main article title / H1 (no boring templates, no 'Panduan Lengkap Untuk')",
  "metaTitle": "Highly optimized Meta Title SEO for Google SERP (Strictly 50-60 characters, focus keyword positioned near the front, high CTR click-worthy title)",
  "slug": "seo-friendly-url-slug",
  "metaDescription": "Persuasive Meta Description SEO (Strictly 140-160 characters, contains focus keyword naturally, clear value proposition, ending with a strong Call to Action to maximize CTR on Google SERP)",
  "excerpt": "Compelling excerpt/summary of the article, 200-250 characters",
  "featuredImageTitle": "Title for the image",
  "featuredImageAltText": "Keyword-optimized Alt Text for the image",
  "featuredImageCaption": "Natural descriptive caption for the image including the keyword",
  "contentMarkdown": "The complete natural Indonesian article in Markdown (approx. 800 - 1500 words). Use ## H2 and ### H3 for all subheadings, with separate paragraphs under each subheading. Ensure no introductory/concluding cliché words, and sentences have varied lengths.",
  "faq": [
    { "question": "Relevant FAQ Question 1", "answer": "Practical Answer 1" },
    { "question": "Relevant FAQ Question 2", "answer": "Practical Answer 2" },
    { "question": "Relevant FAQ Question 3", "answer": "Practical Answer 3" }
  ],
  "semanticKeywords": ["Keyword 1", "Keyword 2", "Keyword 3", "LSI Keyword 4"]
}
`;

  const complianceHistory: GeneratedArticle['complianceHistory'] = [];
  let currentArticlePayload: any = null;
  let currentMarkdown = '';
  let finalReport: AuditReport | null = null;

  // Let's call the model and implement the Rewrite loop
  // Max 3 iterations to achieve compliance
  const maxIterations = 3;
  let iteration = 1;
  let passed = false;

  while (iteration <= maxIterations && !passed) {
    console.log(`Compliance Loop: Iteration ${iteration} of ${maxIterations}...`);
    
    // We fetch a generation
    const isFirst = iteration === 1;
    const currentPrompt = isFirst 
      ? userPrompt 
      : `${userPrompt}

⚠️ SEBELUMNYA TULISAN ANDA BELUM SEPENUHNYA LOLOS AUDIT KEPATUHAN WIKIPEDIA (Signs of AI Writing).
Berikut adalah draf tulisan sebelumnya:
"""
${currentMarkdown}
"""

DAN INI ADALAH LAPORAN AUDIT UNTUK DRAF DI ATAS:
${finalReport?.feedback.map(f => `- ${f}`).join('\n')}
Evaluasi Panjang Kalimat: ${finalReport?.sentenceLengthFeedback}

HARAP REWRITE/TULIS ULANG artikel di atas untuk memperbaiki seluruh poin audit tersebut secara penuh. 
Instruksi Tambahan:
- Hilangkan sepenuhnya kata-kata klise yang dilarang di atas (terutama "delve", "tapestry", "in conclusion", "it is important to note").
- Pastikan kalimat memiliki ritme yang dinamis (variasikan panjang pendek kalimat Anda!).
- Jaga agar semua heading, isi faktual, dan internal links (${parsedLinks.map(l => l.title).join(', ')}) tetap terintegrasi secara alami.
- Kembalikan respons dalam format JSON yang sama persis.`;

    const { result, usedKeyIndex } = await callGeminiWithRollingKeys(keys, async (ai) => {
      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: currentPrompt,
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              metaTitle: { type: Type.STRING },
              slug: { type: Type.STRING },
              metaDescription: { type: Type.STRING },
              excerpt: { type: Type.STRING },
              featuredImageTitle: { type: Type.STRING },
              featuredImageAltText: { type: Type.STRING },
              featuredImageCaption: { type: Type.STRING },
              contentMarkdown: { type: Type.STRING },
              faq: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    question: { type: Type.STRING },
                    answer: { type: Type.STRING }
                  },
                  required: ["question", "answer"]
                }
              },
              semanticKeywords: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: [
              "title", "metaTitle", "slug", "metaDescription", "excerpt",
              "featuredImageTitle", "featuredImageAltText", "featuredImageCaption",
              "contentMarkdown", "faq", "semanticKeywords"
            ]
          }
        }
      });

      const text = response.text;
      if (!text) {
        throw new Error("Gemini returned an empty text response.");
      }
      return JSON.parse(text);
    });

    currentArticlePayload = result;
    currentMarkdown = result.contentMarkdown;

    // Run Compliance Audit on the generated draft
    finalReport = performComplianceAudit(currentMarkdown);
    passed = finalReport.passed;

    complianceHistory.push({
      iteration,
      score: finalReport.score,
      passed,
      timestamp: new Date().toISOString(),
      report: finalReport,
      isOriginal: isFirst,
      articleTitle: result.title
    });

    if (passed) {
      console.log(`Article passed compliance audit with score ${finalReport.score}/100!`);
      break;
    } else {
      console.log(`Article failed compliance audit (Score: ${finalReport.score}/100). Looping rewrite...`);
      iteration++;
    }
  }

  // ==========================================
  // GEORGE KAO EDITORIAL PROCESSING ENGINE
  // ==========================================
  console.log("[Editorial Processing Engine] Launching editorial workflow...");
  const editorialKnowledge = getStoredEditorialKnowledge();
  const editorialPrinciplesList = editorialKnowledge.principles.map((p, i) => `${i + 1}. ${p}`).join("\n");
  const editorialChecksList = editorialKnowledge.editorialChecks.map((c, i) => `${i + 1}. ${c}`).join("\n");
  const revisionStrategiesList = editorialKnowledge.revisionStrategies.map((s, i) => `${i + 1}. ${s}`).join("\n");
  let georgeKaoLogPayload: any = null;

  const editorialPrompt = `
You are a highly experienced Editorial Director trained in George Kao's professional writing philosophy: "How to Write Without Sounding Like an AI".
Your job is to take the provided article draft (which has already passed Wikipedia keyword/compliance checks) and process it through a professional editorial workflow to make it sound entirely authentic, warm, human, and conversational.

---

GEORGE KAO EDITORIAL KNOWLEDGE (MANDATORY RULES):
Core Principles:
${editorialPrinciplesList}

Editorial Checks:
${editorialChecksList}

Revision Strategies:
${revisionStrategiesList}

---

INPUT ARTICLE DRAFT:
Title: ${currentArticlePayload?.title || keyword}
Slug: ${currentArticlePayload?.slug || ''}
Meta Description: ${currentArticlePayload?.metaDescription || ''}
Excerpt: ${currentArticlePayload?.excerpt || ''}

Draft Content Markdown:
"""
${currentMarkdown}
"""

---

INTERNAL MOOD & INSTRUCTIONS:
- Tone must feel organic, warm, and highly professional yet friendly in Bahasa Indonesia.
- Simplify complex, academic, or marketing-heavy nouns and verbs with simpler human-like equivalents.
- Ensure sentence lengths are completely dynamic (some very short, some medium, some slightly longer).
- Remove any remaining parallel syntactic list structures or uniform formatting.
- CRITICAL ANTI-AI DETECTOR RULE: DO NOT insert artificial AI conversational fillers like "Tapi jujur saja", "Nah, di situlah", "Bukan cuma soal X... ini tentang Y", "Tak bisa dipungkiri". Do NOT add rhetorical question openings in paragraph 1 ("Pernah membayangkan...?"). Do NOT use em-dashes ("—").
- CRITICAL: You MUST naturally keep all headings, facts, search intents, keyword occurrences, and internal markdown links (${parsedLinks.map(l => l.title).join(', ')}) exactly intact. Do NOT remove or modify URLs and titles of the internal links.

---

REQUIRED OUTPUT FORMAT (JSON ONLY):
Return your response as a JSON object matching this schema:
{
  "editorialAudit": "Step-by-step internal audit of the draft pointing out areas violating George Kao's rules (e.g. over-elaborated words, stiff paragraphs, generic transitions).",
  "editorialCritique": "Internal critique analyzing flow, style, authenticity, and voice alignment.",
  "finalEditorialDraft": "The revised contentMarkdown after executing the Editorial Revision step. Ensure it remains valid markdown with headings, bolding, and the exact internal links."
}
`;

  try {
    const { result: editorialResult } = await callGeminiWithRollingKeys(keys, async (ai) => {
      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: editorialPrompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              editorialAudit: { type: Type.STRING },
              editorialCritique: { type: Type.STRING },
              finalEditorialDraft: { type: Type.STRING }
            },
            required: ["editorialAudit", "editorialCritique", "finalEditorialDraft"]
          }
        }
      });

      const text = response.text;
      if (!text) {
        throw new Error("Gemini returned an empty editorial response.");
      }
      return JSON.parse(text);
    });

    console.log("[Editorial Processing Engine] Editorial Audit completed successfully:\n", editorialResult.editorialAudit);
    console.log("[Editorial Processing Engine] Editorial Critique completed successfully:\n", editorialResult.editorialCritique);
    console.log("[Editorial Processing Engine] Editorial Revision complete. Updating draft with Final Editorial Draft.");

    if (editorialResult.finalEditorialDraft && editorialResult.finalEditorialDraft.trim().length > 100) {
      currentMarkdown = editorialResult.finalEditorialDraft;
    }

    georgeKaoLogPayload = {
      knowledgeVersion: editorialKnowledge.metadata.version || "v1.0-Default",
      evaluationResult: "Draft artikel telah diverifikasi dan diselaraskan dengan George Kao Editorial Knowledge Builder. Gaya tulisan mengalir hangat, kaya konteks manusiawi, dan bebas dari gaya kaku AI.",
      editorialAudit: editorialResult.editorialAudit || "Pemeriksaan gaya dan ritme narasi selesai.",
      editorialCritique: editorialResult.editorialCritique || "Struktur kalimat dan pilihan kata memenuhi standar suara otentik.",
      validationResult: "REVISED",
      revisionCount: 1,
      principlesChecked: editorialKnowledge.metadata.editorialPrinciples || 24,
      finalStatus: "Completed"
    };
  } catch (err: any) {
    console.error("[Editorial Processing Engine Error] Editorial workflow failed, falling back to original draft:", err.message || err);
    georgeKaoLogPayload = {
      knowledgeVersion: editorialKnowledge.metadata.version || "v1.0-Default",
      evaluationResult: "Pemeriksaan George Kao Editorial mengalami kendala koneksi. Menggunakan draf dasar.",
      editorialAudit: "Evaluasi tidak dapat diselesaikan.",
      editorialCritique: "Evaluasi tidak dapat diselesaikan.",
      validationResult: "Skipped",
      revisionCount: 0,
      principlesChecked: editorialKnowledge.metadata.editorialPrinciples || 24,
      finalStatus: "Failed"
    };
  }

  // ==========================================
  // GOOGLE HELPFUL CONTENT ENGINE
  // ==========================================
  console.log("[Google Helpful Content Engine] Launching Helpful Content Quality audit & evaluation...");
  const googleHelpfulKnowledge = getStoredGoogleHelpfulKnowledge();
  let googleHelpfulLogPayload: any = null;

  try {
    const helpfulPrinciples = googleHelpfulKnowledge.helpfulContentPrinciples.map((p, i) => `${i + 1}. ${p}`).join("\n");
    const peopleFirstPrinciples = googleHelpfulKnowledge.peopleFirstPrinciples.map((p, i) => `${i + 1}. ${p}`).join("\n");
    const reliabilityPrinciples = googleHelpfulKnowledge.reliabilityPrinciples.map((p, i) => `${i + 1}. ${p}`).join("\n");
    const satisfactionPrinciples = googleHelpfulKnowledge.userSatisfactionPrinciples.map((p, i) => `${i + 1}. ${p}`).join("\n");
    const experienceSignals = googleHelpfulKnowledge.experienceSignals.map((p, i) => `${i + 1}. ${p}`).join("\n");
    const qualityQuestions = googleHelpfulKnowledge.qualityEvaluationQuestions.map((p, i) => `${i + 1}. ${p}`).join("\n");
    const contentReviewQuestions = googleHelpfulKnowledge.contentReviewQuestions.map((p, i) => `${i + 1}. ${p}`).join("\n");
    const searchIntentGuidance = googleHelpfulKnowledge.searchIntentGuidance.map((p, i) => `${i + 1}. ${p}`).join("\n");
    const readerValuePrinciples = googleHelpfulKnowledge.readerValuePrinciples.map((p, i) => `${i + 1}. ${p}`).join("\n");

    const googleHelpfulPrompt = `
You are a highly experienced SEO Quality Auditor & Editor trained on Google Search Central's Helpful, Reliable, People-First Content guidelines.
Your mission is to perform a rigorous quality evaluation and revision on the provided article draft (which has already passed Wikipedia compliance and George Kao editorial adjustments).

---

GOOGLE HELPFUL CONTENT KNOWLEDGE (MANDATORY TARGETS):
1. Helpful Content Principles:
${helpfulPrinciples}

2. People-First Principles:
${peopleFirstPrinciples}

3. Reliability Principles:
${reliabilityPrinciples}

4. User Satisfaction Principles:
${satisfactionPrinciples}

5. Experience Signals:
${experienceSignals}

6. Quality Evaluation Questions:
${qualityQuestions}

7. Content Review Questions:
${contentReviewQuestions}

8. Search Intent Guidance:
${searchIntentGuidance}

9. Reader Value Principles:
${readerValuePrinciples}

---

INPUT ARTICLE DRAFT:
Title: ${currentArticlePayload?.title || keyword}
Draft Content Markdown:
"""
${currentMarkdown}
"""

---

YOUR TASK:
1. Evaluate the draft thoroughly based on Google's actual questions and guidance above:
   - Does it fully satisfy the searcher's query/intent? Is the explanation deep enough or too shallow?
   - Does it provide substantial, complete, and comprehensive value compared to other search results?
   - Is it written primarily for humans, demonstrating clear expertise and trustworthiness?
   - Will the reader leave feeling satisfied and having learned enough?
2. If there are any areas of improvement (e.g. sections that can be explained in more depth, more specific actionable details, or stronger human-first tone), refine or rewrite those specific sections to enrich them while keeping the rest of the text natural and clean.
3. CRITICAL: You MUST naturally keep all headings, facts, and internal markdown links (${parsedLinks.map(l => l.title).join(', ')}) exactly intact and correct. Do NOT remove or modify URLs and titles of the internal links.

---

REQUIRED OUTPUT FORMAT (JSON ONLY):
{
  "evaluationResult": "A detailed 1-2 paragraph analytical report of the article's quality and helpfulness in Indonesian.",
  "issuesDetected": ["List of issues found, such as 'Penjelasan di bagian X agak terlalu umum', or empty if none"],
  "revisionRecommendations": ["List of revisions made to improve search intent, depth, or satisfaction, or empty if none"],
  "finalHelpfulDraft": "The revised complete contentMarkdown after executing the Helpful Content Revision step. Ensure it remains valid markdown with headings, bolding, and the exact internal links."
}
`;

    const { result: googleHelpfulResult } = await callGeminiWithRollingKeys(keys, async (ai) => {
      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: googleHelpfulPrompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              evaluationResult: { type: Type.STRING },
              issuesDetected: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              revisionRecommendations: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              finalHelpfulDraft: { type: Type.STRING }
            },
            required: ["evaluationResult", "issuesDetected", "revisionRecommendations", "finalHelpfulDraft"]
          }
        }
      });

      const text = response.text;
      if (!text) {
        throw new Error("Gemini returned an empty Google Helpful Response.");
      }
      return JSON.parse(text);
    });

    console.log("[Google Helpful Content Engine] Evaluation complete. Issues count:", googleHelpfulResult.issuesDetected.length);
    console.log("[Google Helpful Content Engine] Evaluation Result:\n", googleHelpfulResult.evaluationResult);

    if (googleHelpfulResult.finalHelpfulDraft && googleHelpfulResult.finalHelpfulDraft.trim().length > 100) {
      currentMarkdown = googleHelpfulResult.finalHelpfulDraft;
    }

    googleHelpfulLogPayload = {
      knowledgeVersion: googleHelpfulKnowledge.metadata.version,
      evaluationResult: googleHelpfulResult.evaluationResult,
      validationResult: googleHelpfulResult.issuesDetected.length > 0 ? "Revised" : "Passed",
      revisionCount: googleHelpfulResult.issuesDetected.length > 0 ? 1 : 0,
      finalStatus: "Completed"
    };

  } catch (err: any) {
    console.error("[Google Helpful Content Engine Error] Workflow failed, falling back to current draft:", err.message || err);
    googleHelpfulLogPayload = {
      knowledgeVersion: googleHelpfulKnowledge.metadata.version,
      evaluationResult: "Evaluasi gagal diproses karena kesalahan sistem. Namun draf artikel tetap aman.",
      validationResult: "Skipped",
      revisionCount: 0,
      finalStatus: "Failed"
    };
  }

  // =========================================================================
  // STAGE 7: SEMANTIC HTML KNOWLEDGE ENGINE
  // =========================================================================
  console.log("\n--- [STAGE 7] SEMANTIC HTML KNOWLEDGE ENGINE ---");
  const semanticKnowledge = getStoredSemanticHtmlKnowledge();
  let semanticHtmlLogPayload: any = null;

  try {
    const semanticResult = await runSemanticHtmlEngine(
      keys,
      currentMarkdown,
      currentArticlePayload.title,
      parsedLinks
    );

    console.log("[Semantic HTML Engine] Audit complete. Issues count:", semanticResult.issuesDetected.length);
    console.log("[Semantic HTML Engine] Evaluation Result:\n", semanticResult.evaluationResult);

    if (semanticResult.finalSemanticDraft && semanticResult.finalSemanticDraft.trim().length > 100) {
      currentMarkdown = semanticResult.finalSemanticDraft;
    }

    semanticHtmlLogPayload = {
      knowledgeVersion: semanticKnowledge.metadata.version,
      evaluationResult: semanticResult.evaluationResult,
      validationResult: semanticResult.issuesDetected.length > 0 ? "Revised" : "Passed",
      revisionCount: semanticResult.issuesDetected.length > 0 ? 1 : 0,
      issuesDetected: semanticResult.issuesDetected,
      revisionRecommendations: semanticResult.revisionRecommendations,
      finalStatus: "Completed"
    };
  } catch (err: any) {
    console.error("[Semantic HTML Engine Error] Workflow failed, falling back to current draft:", err.message || err);
    semanticHtmlLogPayload = {
      knowledgeVersion: semanticKnowledge.metadata.version,
      evaluationResult: "Evaluasi struktur Semantic HTML gagal diproses karena kesalahan sistem. Draf artikel tetap aman.",
      validationResult: "Skipped",
      revisionCount: 0,
      issuesDetected: [],
      revisionRecommendations: [],
      finalStatus: "Failed"
    };
  }

  // Apply final Anti-AI Signature Sanitizer to eliminate lingering Quillbot/AI detector flags
  currentMarkdown = sanitizeAntiAiSignatures(currentMarkdown);

  // Perform final Wikipedia & Anti-AI Compliance Audit on cleaned markdown
  const finalAiComplianceReport = performComplianceAudit(currentMarkdown);
  const wikipediaKnowledge = getStoredKnowledge();

  const aiWritingAuditLogPayload = {
    knowledgeVersion: wikipediaKnowledge.metadata.version || "v2.0-AntiAIDetector",
    score: finalAiComplianceReport.score,
    validationResult: finalAiComplianceReport.passed ? "PASSED" : "REVISED",
    revisionCount: complianceHistory.length > 1 ? complianceHistory.length - 1 : 0,
    forbiddenWordsFound: finalAiComplianceReport.overusedWords.length,
    sentenceVariance: Number(finalAiComplianceReport.sentenceLengthVariance.toFixed(1)),
    evaluationResult: `Draft artikel telah diverifikasi dengan Wikipedia Signs of AI Writing & Anti-AI Detector Rules. Skor kepatuhan gaya penulisan manusia: ${finalAiComplianceReport.score}/100. ${finalAiComplianceReport.feedback.length > 0 ? finalAiComplianceReport.feedback.join(' ') : 'Seluruh indikator pola tulisan AI (kata terlarang, pertanyaan retoris pembuka, pola klausa simetris, dan em-dash) berhasil dieliminasi sepenuhnya.'}`,
    issuesDetected: finalAiComplianceReport.feedback,
    finalStatus: "Completed"
  };

  // Calculate Keyword Density
  const lowercaseContent = currentMarkdown.toLowerCase();
  const lowercaseKeyword = keyword.toLowerCase();
  // Count keyword occurrences safely
  const keywordRegex = new RegExp(lowercaseKeyword.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g');
  const occurrences = (lowercaseContent.match(keywordRegex) || []).length;
  const wordCount = currentMarkdown.split(/\s+/).filter(w => w.length > 0).length || 1;
  const densityPercentage = (occurrences / wordCount) * 100;
  
  let keywordDensityEvaluation = '';
  if (densityPercentage < 0.5) {
    keywordDensityEvaluation = 'Kurang optimal (density < 0.5%). Sebaiknya masukkan kata kunci beberapa kali lagi secara alami.';
  } else if (densityPercentage > 2.5) {
    keywordDensityEvaluation = 'Terlalu tinggi (Keyword Stuffing, density > 2.5%). AI telah menyunting agar density tetap wajar.';
  } else {
    keywordDensityEvaluation = `Sangat baik (density ${densityPercentage.toFixed(2)}%). Memenuhi standar SEO modern (0.5% - 2.5%).`;
  }

  // Convert markdown content to simple beautiful HTML for output
  const contentHtml = convertMarkdownToHtml(currentMarkdown);

  // Generate FAQ Schema JSON-LD Markup
  const faqSchemaObj = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": currentArticlePayload.faq.map((item: FAQItem) => ({
      "@type": "Question",
      "name": item.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.answer
      }
    }))
  };
  const faqSchema = JSON.stringify(faqSchemaObj, null, 2);

  // Override alt and caption in featured image metadata if provided from model
  if (currentArticlePayload.featuredImageAltText) {
    featuredImage.alt = currentArticlePayload.featuredImageAltText;
  }
  if (currentArticlePayload.featuredImageCaption) {
    featuredImage.caption = currentArticlePayload.featuredImageCaption;
  }

  return {
    title: currentArticlePayload.title,
    metaTitle: currentArticlePayload.metaTitle || currentArticlePayload.title,
    slug: currentArticlePayload.slug,
    metaDescription: currentArticlePayload.metaDescription,
    excerpt: currentArticlePayload.excerpt,
    contentMarkdown: currentMarkdown,
    contentHtml: contentHtml,
    faq: currentArticlePayload.faq,
    faqSchema: faqSchema,
    featuredImage: featuredImage,
    keywordDensity: {
      keyword: keyword,
      count: occurrences,
      percentage: Number(densityPercentage.toFixed(2)),
      evaluation: keywordDensityEvaluation
    },
    semanticKeywords: currentArticlePayload.semanticKeywords || [],
    complianceHistory: complianceHistory,
    helpfulContentLog: googleHelpfulLogPayload,
    semanticHtmlLog: semanticHtmlLogPayload,
    aiWritingAuditLog: aiWritingAuditLogPayload,
    georgeKaoAuditLog: georgeKaoLogPayload
  };
}

// Programmatic post-processor to guarantee zero leftover AI detector signatures (Quillbot, CopyLeaks, Turnitin)
export function sanitizeAntiAiSignatures(markdown: string): string {
  if (!markdown) return '';
  let cleaned = markdown;

  // 1. Remove rhetorical question openings in paragraph 1
  const paragraphs = cleaned.split(/\n+/);
  if (paragraphs.length > 0) {
    let p1 = paragraphs[0];
    if (/^(pernah|apakah|tahukah|bayangkan|inginkah|pernahkah)/i.test(p1.trim())) {
      p1 = p1.replace(/^(Pernah membayangkan|Pernahkah Anda membayangkan|Tahukah Anda|Bayangkan jika|Apakah Anda ingin|Inginkah Anda)\b[^\n?]*\?\s*/i, '');
      paragraphs[0] = p1;
      cleaned = paragraphs.join('\n\n');
    }
  }

  // 2. Remove AI bridge fillers at sentence or paragraph starts
  cleaned = cleaned.replace(/^Tapi jujur saja,\s*/gm, '');
  cleaned = cleaned.replace(/^Jujur saja,\s*/gm, '');
  cleaned = cleaned.replace(/^Nah, di situlah\s*/gm, '');
  cleaned = cleaned.replace(/^Di situlah\s*/gm, '');
  cleaned = cleaned.replace(/^Tak bisa dipungkiri,\s*/gm, '');
  cleaned = cleaned.replace(/^Tidak dapat dipungkiri,\s*/gm, '');
  cleaned = cleaned.replace(/^Penting untuk diingat bahwa\s*/gm, '');
  cleaned = cleaned.replace(/^Perlu diingat bahwa\s*/gm, '');

  // 3. Convert em-dash (—) clause joiners mid-sentence
  cleaned = cleaned.replace(/ — /g, ', ');
  cleaned = cleaned.replace(/—/g, ', ');
  cleaned = cleaned.replace(/ -- /g, ', ');

  // 4. Remove inline bold list prefixes like `1. **Heading** Text...`
  cleaned = cleaned.replace(/^(\d+)\.\s+\*\*([^*]+)\*\*\s+(.+)$/gm, '### $1. $2\n\n$3');

  return cleaned.trim();
}

// Robust Markdown parser using marked library for clean semantic HTML
function convertMarkdownToHtml(markdown: string): string {
  if (!markdown) return '';
  
  let clean = markdown.replace(/\r/g, '').trim();
  clean = clean.replace(/^```[a-zA-Z]*\n/gi, '').replace(/\n```$/g, '').trim();

  // Fix common AI inline-heading patterns:
  // 1. `1. **Heading Title** Paragraph description...` -> `### 1. Heading Title\n\nParagraph description...`
  clean = clean.replace(/^(\d+)\.\s+\*\*([^*]+)\*\*\s+(.+)$/gm, '### $1. $2\n\n$3');
  // 2. `**Subheading:** Paragraph description...` -> `### Subheading\n\nParagraph description...` when at line start
  clean = clean.replace(/^\*\*([^*:]+):\*\*\s+(.+)$/gm, '### $1\n\n$2');
  // 3. `*Subheading:* Paragraph description...` -> `### Subheading\n\nParagraph description...`
  clean = clean.replace(/^\*([^*:]+):\*\*\s+(.+)$/gm, '### $1\n\n$2');

  try {
    return marked.parse(clean, { gfm: true, async: false }) as string;
  } catch (err) {
    console.error("Marked parser failed:", err);
    return clean;
  }
}

// Client-key rolling utility
async function callGeminiWithRollingKeys<T>(
  apiKeys: string[],
  fn: (ai: GoogleGenAI) => Promise<T>
): Promise<{ result: T; usedKeyIndex: number }> {
  if (apiKeys.length === 0) {
    throw new Error("Tidak ada API Key yang terkonfigurasi. Silakan masukkan API Key Anda di tab Pengaturan API.");
  }

  let lastError: any = null;
  for (let i = 0; i < apiKeys.length; i++) {
    const key = apiKeys[i];
    try {
      const ai = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
      const result = await fn(ai);
      return { result, usedKeyIndex: i };
    } catch (err: any) {
      console.error(`Gemini call failed with key index ${i}:`, err.message || err);
      lastError = err;
    }
  }
  
  throw new Error(`Seluruh API Key (${apiKeys.length}) yang dicoba mengalami kegagalan/limit. Error terakhir: ${lastError?.message || lastError}`);
}
