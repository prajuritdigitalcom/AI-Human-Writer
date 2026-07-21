import { GoogleGenAI, Type } from "@google/genai";
import { StyleType, AuditReport, GeneratedArticle, OverusedWordCheck, FAQItem, ImageMetadata } from "../src/types";
import { getStoredKnowledge } from "./wikipediaKnowledge.ts";
import { getStoredEditorialKnowledge } from "./georgeKaoKnowledge.ts";


// Helper to split text into sentences
function getSentences(text: string): string[] {
  // Regex to match sentence endings
  const cleanText = text.replace(/<(?:.|\n)*?>/gm, ''); // remove any html tags
  const matches = cleanText.match(/[^.!?]+[.!?]+(\s|$)/g) || [];
  return matches.map(s => s.trim()).filter(s => s.length > 5);
}

// Programmatic Compliance Audit based on Wikipedia:Signs of AI writing
export function performComplianceAudit(markdown: string): AuditReport {
  const knowledge = getStoredKnowledge();
  const lowercase = markdown.toLowerCase();
  const feedback: string[] = [];
  const overusedWords: OverusedWordCheck[] = [];
  const clichesFound: string[] = [];
  let score = 100;

  // 1. Check for Forbidden Words
  knowledge.forbiddenWords.forEach(({ word, severity, max, penalty, message }) => {
    // Regex for whole word or partial depending on word
    const regex = new RegExp(`\\b${word}(s|ed|ing)?\\b`, 'gi');
    const matches = lowercase.match(regex);
    const count = matches ? matches.length : 0;
    
    if (count > max) {
      score -= (count - max) * penalty;
      overusedWords.push({ word, count, severity: severity as 'high' | 'medium' | 'low' });
      feedback.push(`Ditemukan kata "${word}" sebanyak ${count} kali (${message}). Batas maksimal: ${max}.`);
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

  // 3. Check for Intro Clichés in the first paragraph
  let introClicheCount = 0;
  if (paragraphs.length > 0) {
    const firstParagraph = paragraphs[0].toLowerCase();
    knowledge.introCliches.forEach(cliche => {
      if (firstParagraph.includes(cliche)) {
        score -= 10;
        introClicheCount++;
        clichesFound.push(`Intro cliché: "${cliche}"`);
        feedback.push(`Paragraf pembuka mengandung kalimat klise AI "${cliche}". Mulailah langsung dengan fakta atau hook yang menarik.`);
      }
    });
  }

  // 4. Check Sentence Length Variance
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

    if (stdDev < 4) {
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
  
  // Set passed criteria: score must be >= 80, no delve, no tapestry
  const hasCriticalWords = overusedWords.some(w => (w.word === 'delve' || w.word === 'tapestry') && w.count > 0);
  const passed = score >= 80 && !hasCriticalWords;

  return {
    passed,
    score,
    feedback,
    overusedWords,
    clichesFound,
    sentenceLengthVariance,
    sentenceLengthFeedback,
    introductionFeedback: introClicheCount > 0 
      ? 'Ditemukan frase klise pembuka.' 
      : 'Bagus, pembuka langsung fokus dan natural.',
    conclusionFeedback: transitionClicheCount > 0 
      ? 'Ditemukan frase transisi klise seperti "In conclusion".' 
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
You are an expert SEO Human Copywriter. Your mission is to generate a premium-quality article in Indonesian (Bahasa Indonesia) that reads completely naturally, matches the selected tone, achieves outstanding keyword ranking, and strictly complies with the Wikipedia Sign of AI Writing standards.

WIKIPEDIA COMPLIANCE GUIDELINES (MANDATORY) - DYNAMICALLY SYNCHRONIZED COMPLIANCE MODEL:
1. WORD CHOICE & BUZZWORDS TO AVOID:
${forbiddenWordsList}

2. PARAGRAPH TRANSITIONS TO AVOID (DO NOT USE TO START PARAGRAPHS, ESPECIALLY IN THE CONCLUDING PARAGRAPH):
${transitionsList}

3. INTRODUCTION BOILERPLATE FILLER TO AVOID:
${introClichesList}

4. ADDITIONAL GENERAL RECOMMENDATIONS & STYLING COMPLIANCE RULES:
${generalRecsList}

5. SENTENCE & PARAGRAPH RHYTHM:
   - Vary your sentence length! Write some short punchy sentences (3-7 words), some medium sentences (10-15 words), and only occasionally long sentences.
   - Varied paragraph sizes (some paragraphs should be 1-2 sentences, some 3 sentences. Never make them all identical blocks).
   - Do NOT start consecutive paragraphs or sentences with the same structural syntax (e.g., "Sauna kayu adalah...", "Sauna kayu dapat...").
6. INTRODUCTION HOOKS:
   - Do NOT start with high-level cliché fluff. Start immediately with a concrete, compelling human hook, fact, anecdote, or specific problem statement.
7. FACTS & CITATIONS:
   - Do not make up fake experts or statistics. Relate strictly to the provided reference info.
`;

  const userPrompt = `
Generate a comprehensive, premium-quality SEO article in Indonesian (Bahasa Indonesia) about: "${keyword}"
Gaya Penulisan: ${style}

INFORMASI REFERENSI (Use this for factual grounding and depth):
${referenceInfo || 'Tulis artikel mendalam berdasarkan pengetahuan profesional.'}

${linksDescription}

OUTPUT REQUIREMENT:
You must return your output strictly in JSON format. The article text inside "contentMarkdown" must be written in rich Markdown with elegant section headings (H2, H3), lists, bolding, and correct internal links integrated.

Strict JSON format to generate:
{
  "title": "A highly catchy, SEO-optimized title (no boring templates, no 'Panduan Lengkap Untuk')",
  "slug": "seo-friendly-url-slug",
  "metaDescription": "SEO meta description, 150-160 characters, persuasive",
  "excerpt": "Compelling excerpt/summary of the article, 200-250 characters",
  "featuredImageTitle": "Title for the image",
  "featuredImageAltText": "Keyword-optimized Alt Text for the image",
  "featuredImageCaption": "Natural descriptive caption for the image including the keyword",
  "contentMarkdown": "The complete natural Indonesian article in Markdown (approx. 800 - 1500 words). Ensure there are no introductory/concluding cliché words, and sentences have varied lengths.",
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
        model: "gemini-3.5-flash",
        contents: currentPrompt,
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
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
              "title", "slug", "metaDescription", "excerpt",
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
        model: "gemini-3.5-flash",
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
  } catch (err: any) {
    console.error("[Editorial Processing Engine Error] Editorial workflow failed, falling back to original draft:", err.message || err);
  }

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
    complianceHistory: complianceHistory
  };
}

// Simple fast markdown parser to generate beautiful semantic HTML on server
function convertMarkdownToHtml(markdown: string): string {
  if (!markdown) return '';
  
  // 1. Strip carriage returns and trim whitespace
  let clean = markdown.replace(/\r/g, '').trim();
  
  // 2. Strip surrounding markdown code fence blocks if any
  clean = clean.replace(/^```[a-zA-Z]*\n/gi, '');
  clean = clean.replace(/\n```$/g, '');
  clean = clean.trim();

  // 3. Convert inline styles first (bold, italic, links, code)
  // Bold: **text** or __text__
  clean = clean.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-gray-900">$1</strong>');
  clean = clean.replace(/__([^_]+)__/g, '<strong class="font-bold text-gray-900">$1</strong>');
  
  // Italic: *text* or _text_
  clean = clean.replace(/\*([^*]+)\*/g, '<em class="italic text-gray-800">$1</em>');
  clean = clean.replace(/_([^_]+)_/g, '<em class="italic text-gray-800">$1</em>');

  // Inline code: `code`
  clean = clean.replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-gray-100 font-mono text-xs text-red-600">$1</code>');

  // Links: [text](url)
  // Use a professional, high-contrast text color for links
  clean = clean.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" class="text-blue-600 hover:underline font-medium transition-colors duration-150">$1</a>');

  // 4. Split into paragraph blocks by double-newlines
  const blocks = clean.split(/\n\s*\n+/);
  
  const htmlBlocks = blocks.map(block => {
    const trimmed = block.trim();
    if (!trimmed) return '';

    // Check if it's a heading
    if (trimmed.startsWith('#')) {
      const match = trimmed.match(/^(#{1,6})\s+(.*)$/s);
      if (match) {
        const level = match[1].length;
        const text = match[2].trim();
        // Return standard responsive HTML headings with beautiful spacing
        if (level === 1) {
          return `<h1 class="text-2xl font-extrabold text-gray-900 mt-6 mb-3 font-display">${text}</h1>`;
        } else if (level === 2) {
          return `<h2 class="text-xl font-bold text-gray-800 mt-5 mb-2.5 font-display border-b border-gray-100 pb-1">${text}</h2>`;
        } else {
          return `<h3 class="text-lg font-semibold text-gray-800 mt-4 mb-2 font-display">${text}</h3>`;
        }
      }
    }

    // Check if it's a bulleted list block
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ')) {
      const items = trimmed.split(/\n\s*[-*•]\s+/);
      // Clean up the first item which still has its bullet prefix
      if (items[0]) {
        items[0] = items[0].replace(/^[-*•]\s+/, '');
      }
      const liElements = items
        .map(item => item.trim())
        .filter(item => item.length > 0)
        .map(item => `<li class="list-disc ml-5 mb-1.5 text-gray-700">${item}</li>`)
        .join('\n');
      return `<ul class="my-4 space-y-1.5">${liElements}</ul>`;
    }

    // Check if it's a numbered list block
    if (/^\d+\.\s+/.test(trimmed)) {
      const items = trimmed.split(/\n\s*\d+\.\s+/);
      if (items[0]) {
        items[0] = items[0].replace(/^\d+\.\s+/, '');
      }
      const liElements = items
        .map(item => item.trim())
        .filter(item => item.length > 0)
        .map(item => `<li class="list-decimal ml-5 mb-1.5 text-gray-700">${item}</li>`)
        .join('\n');
      return `<ol class="my-4 space-y-1.5">${liElements}</ol>`;
    }

    // Check if it's a blockquote
    if (trimmed.startsWith('>')) {
      const quoteText = trimmed.replace(/^>\s*/gm, '').trim();
      return `<blockquote class="border-l-4 border-gray-300 pl-4 py-1 my-4 italic text-gray-600 bg-gray-50 rounded-r">${quoteText}</blockquote>`;
    }

    // Default: wrap as paragraph
    // Replace single newlines inside paragraph with a space to make it continuous human paragraph, 
    // unless they are explicit line breaks
    const cleanedParagraph = trimmed.replace(/\n+/g, ' ');
    return `<p class="text-gray-700 leading-relaxed mb-4 text-justify">${cleanedParagraph}</p>`;
  });

  return htmlBlocks.filter(b => b.length > 0).join('\n\n');
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
