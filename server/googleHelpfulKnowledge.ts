import fs from "fs";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import { StoredGoogleHelpfulKnowledge } from "../src/types";

const KNOWLEDGE_DIR = path.join(process.cwd(), "knowledge");
const JSON_FILE_PATH = path.join(KNOWLEDGE_DIR, "google-helpful-content.json");
const MD_FILE_PATH = path.join(KNOWLEDGE_DIR, "google-helpful-content.md");

// Default high-quality compliance seed based directly on Google Search Central Helpful Content guide
const DEFAULT_SEED_GOOGLE_HELPFUL: StoredGoogleHelpfulKnowledge = {
  metadata: {
    source: "Google Search Central",
    sourceUrl: "https://developers.google.com/search/docs/fundamentals/creating-helpful-content",
    version: "v1.0-Default",
    lastSynced: new Date().toISOString().split('T')[0],
    totalRules: 28,
    totalPrinciples: 14,
    totalSelfAssessmentQuestions: 18,
    generatedDate: new Date().toISOString().split('T')[0]
  },
  helpfulContentPrinciples: [
    "Ensure content is created primarily to benefit and help people, not to manipulate search engine rankings (People-first content).",
    "Content must demonstrate real-world first-hand experience and a deep, genuine knowledge of the subject matter.",
    "Do not build a site with high-volume search topics if you do not possess genuine expertise or original value to add.",
    "The content should leave readers feeling they have learned enough about a topic to achieve their goal.",
    "Avoid summarizing or rehashing what others say without adding significant value, original perspective, or unique insight."
  ],
  peopleFirstPrinciples: [
    "Do you have an existing or intended audience for your business or site that would find the content useful if they came directly to you?",
    "Does your content clearly demonstrate first-hand expertise and a depth of knowledge (such as having actually used a product or service)?",
    "Does your site have a primary purpose or focus?",
    "After reading your content, will someone leave feeling they've learned enough about a topic to help achieve their goal?",
    "Will someone reading your content leave feeling like they've had a satisfying experience?"
  ],
  reliabilityPrinciples: [
    "Provide original information, reporting, research, or analysis.",
    "Provide a substantial, complete, or comprehensive description of the topic.",
    "Provide insightful analysis or interesting information that's beyond obvious.",
    "If the content draws on other sources, avoid simply copying or rewriting those sources, and instead provide significant additional value.",
    "Ensure the headline or page title provides a descriptive, helpful summary of the content, avoiding exaggeration or shock value."
  ],
  userSatisfactionPrinciples: [
    "Would you want to bookmark this, share it with a friend, or recommend it?",
    "Would you expect to see this content in or referenced by a printed magazine, encyclopedia, or book?",
    "Does the content provide substantial value when compared to other pages in search results?",
    "Ensure the content is free from spelling, grammatical, or stylistic issues.",
    "Ensure the content was produced well, rather than appearing sloppy or hastily produced."
  ],
  experienceSignals: [
    "Use original images, videos, or audio that demonstrate you have actually experienced the topic first-hand.",
    "Provide clear, specific, and actionable advice based on personal or team trial and error.",
    "Detail the process, timeline, or direct observations of the event, product, or guide being described.",
    "Use language that highlights personal involvement: 'Kami menguji...', 'Dalam pengalaman kami...', 'Ketika kami mencoba...'.",
    "Highlight specific case studies or real-world examples to substantiate theoretical advice."
  ],
  qualityEvaluationQuestions: [
    "Apakah konten ini memberikan analisis mendalam yang melampaui informasi yang sudah umum diketahui?",
    "Apakah konten ini menyajikan informasi secara objektif, jujur, dan dapat dipercaya?",
    "Apakah Anda bersedia mempercayai informasi ini untuk masalah yang berkaitan dengan kesehatan, keuangan, atau keselamatan Anda?",
    "Apakah artikel ini bebas dari kesalahan ketik, kesalahan tata bahasa, atau kesalahan faktual dasar?",
    "Apakah gaya penulisan artikel ini rapi, terstruktur, dan tidak terlihat seperti diproduksi secara massal?"
  ],
  contentReviewQuestions: [
    "Apakah artikel ini ditulis untuk menarik mesin pencari dengan harapan mendapatkan ranking tinggi, ataukah ditulis untuk membantu manusia?",
    "Apakah Anda menulis banyak artikel tentang topik yang berbeda dengan harapan beberapa di antaranya berkinerja baik di mesin pencari?",
    "Apakah artikel ini hanya merangkum apa yang dikatakan orang lain tanpa memberikan nilai tambah atau sudut pandang baru yang unik?",
    "Apakah pembaca merasa harus mencari lagi di Google untuk mendapatkan informasi yang lebih lengkap setelah membaca artikel ini?",
    "Apakah Anda menulis dengan target jumlah kata tertentu karena mendengar bahwa Google menyukai artikel panjang?"
  ],
  searchIntentGuidance: [
    "Identify the primary search intent behind the keyword: Informational, Navigational, Commercial, or Transactional.",
    "Directly address the user's primary query in the opening sections to resolve the search intent quickly.",
    "Structure subsequent headings to cover secondary questions or topics that a user researching this topic would naturally ask.",
    "Provide clear, actionable takeaways (such as summaries, key tables, bulleted lists of next steps) matching what the searcher wants to achieve."
  ],
  readerValuePrinciples: [
    "Provide unique, non-obvious value that cannot be easily found on the first page of search results.",
    "Synthesize complex information into clear, easy-to-understand formats like comparative tables, step-by-step frameworks, or conceptual diagrams.",
    "Ground all professional claims in reliable references, historical contexts, or industry-standard data.",
    "Do not overpromise in the title; ensure the content fully delivers on the expectations set by the heading."
  ]
};

function ensureKnowledgeDirectory() {
  if (!fs.existsSync(KNOWLEDGE_DIR)) {
    fs.mkdirSync(KNOWLEDGE_DIR, { recursive: true });
  }
}

async function fetchGoogleHelpfulText(): Promise<string> {
  const url = "https://developers.google.com/search/docs/fundamentals/creating-helpful-content";
  console.log(`[Google Helpful Scraper] Fetching documentation from ${url}...`);
  
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch Google Search Central: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();

  // Extract content elements to get a clean text representation
  const textContent: string[] = [];
  const regex = /<(p|li|h2|h3)[^>]*>([\s\S]*?)<\/\1>/gi;
  let match;
  
  while ((match = regex.exec(html)) !== null) {
    const rawText = match[2]
      .replace(/<[^>]+>/g, " ") // Strip nested tags
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .trim();
    if (rawText.length > 10 && !rawText.includes("document.cookie") && !rawText.includes("function(")) {
      textContent.push(rawText);
    }
  }

  if (textContent.length === 0) {
    return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").substring(0, 100000);
  }

  return textContent.join("\n\n");
}

export function writeGoogleHelpfulKnowledgeToDisk(data: StoredGoogleHelpfulKnowledge) {
  ensureKnowledgeDirectory();
  
  // 1. Write JSON
  fs.writeFileSync(JSON_FILE_PATH, JSON.stringify(data, null, 2), "utf-8");
  console.log(`[Google Helpful Knowledge] Saved JSON rules to ${JSON_FILE_PATH}`);

  // 2. Generate and Write beautiful Markdown
  const mdContent = `# Google Search Central: Creating Helpful, Reliable, People-First Content

*Dokumen panduan editorial dan kepatuhan ini dihasilkan secara dinamis berdasarkan pedoman resmi Google Search Central.*

---

## Informasi Metadata
- **Sumber:** ${data.metadata.source}
- **URL Panduan:** [${data.metadata.sourceUrl}](${data.metadata.sourceUrl})
- **Versi:** ${data.metadata.version}
- **Tanggal Sinkronisasi:** ${data.metadata.lastSynced}
- **Total Aturan yang Diekstrak:** ${data.metadata.totalRules}
- **Total Prinsip Utama:** ${data.metadata.totalPrinciples}
- **Total Pertanyaan Penilaian Mandiri:** ${data.metadata.totalSelfAssessmentQuestions}

---

## 1. Prinsip Utama Konten Bermanfaat (Helpful Content Principles)
${data.helpfulContentPrinciples.map(p => `- ${p}`).join("\n")}

---

## 2. Konten Mengutamakan Manusia (People-First Content Principles)
${data.peopleFirstPrinciples.map(p => `- ${p}`).join("\n")}

---

## 3. Kredibilitas & Keandalan (Reliability Principles)
${data.reliabilityPrinciples.map(p => `- ${p}`).join("\n")}

---

## 4. Kepuasan Pembaca (User Satisfaction Principles)
${data.userSatisfactionPrinciples.map(p => `- ${p}`).join("\n")}

---

## 5. Sinyal Pengalaman Pengguna (Experience Signals)
${data.experienceSignals.map(p => `- ${p}`).join("\n")}

---

## 6. Pertanyaan Evaluasi Kualitas (Quality Evaluation Questions)
${data.qualityEvaluationQuestions.map(q => `- ${q}`).join("\n")}

---

## 7. Pertanyaan Penilaian Konten (Content Review Questions)
${data.contentReviewQuestions.map(q => `- ${q}`).join("\n")}

---

## 8. Panduan Search Intent (Search Intent Guidance)
${data.searchIntentGuidance.map(g => `- ${g}`).join("\n")}

---

## 9. Prinsip Nilai Pembaca (Reader Value Principles)
${data.readerValuePrinciples.map(p => `- ${p}`).join("\n")}

---

*Disimpan secara lokal oleh AI Human Writer Knowledge Builder.*
`;

  fs.writeFileSync(MD_FILE_PATH, mdContent, "utf-8");
  console.log(`[Google Helpful Knowledge] Saved human-readable Markdown documentation to ${MD_FILE_PATH}`);
}

export function initGoogleHelpfulKnowledgeOnStartup(): StoredGoogleHelpfulKnowledge {
  ensureKnowledgeDirectory();
  if (fs.existsSync(JSON_FILE_PATH)) {
    try {
      const data = fs.readFileSync(JSON_FILE_PATH, "utf-8");
      return JSON.parse(data) as StoredGoogleHelpfulKnowledge;
    } catch (e) {
      console.error("[Google Helpful Knowledge] Failed to parse existing knowledge file, rewrote seed.", e);
    }
  }

  writeGoogleHelpfulKnowledgeToDisk(DEFAULT_SEED_GOOGLE_HELPFUL);
  return DEFAULT_SEED_GOOGLE_HELPFUL;
}

export function getStoredGoogleHelpfulKnowledge(): StoredGoogleHelpfulKnowledge {
  if (fs.existsSync(JSON_FILE_PATH)) {
    try {
      const data = fs.readFileSync(JSON_FILE_PATH, "utf-8");
      return JSON.parse(data) as StoredGoogleHelpfulKnowledge;
    } catch (e) {
      console.error("[Google Helpful Knowledge] Failed to read knowledge file, returning default seed.", e);
    }
  }
  return DEFAULT_SEED_GOOGLE_HELPFUL;
}

export async function refreshGoogleHelpfulKnowledge(apiKeys: string[]): Promise<StoredGoogleHelpfulKnowledge> {
  if (!apiKeys || apiKeys.length === 0) {
    throw new Error("No active API Key found. Set a visitor API key in settings or define GEMINI_API_KEY.");
  }

  // 1. Fetch text
  const docText = await fetchGoogleHelpfulText();

  // 2. Call Gemini
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

      console.log(`[Google Helpful Knowledge] Analyzing Google Search Central text with Gemini key index ${i}...`);

      const prompt = `
Analyze this content scraped from Google Search Central "Creating Helpful, Reliable, People-First Content" and build a structured knowledge rules object in JSON format.

Google Search Central Document Text:
"""
${docText.substring(0, 40000)}
"""

Your goal is to extract:
1. "helpfulContentPrinciples": Major guidelines for helpful content.
2. "peopleFirstPrinciples": Questions or principles for making sure content is human-first.
3. "reliabilityPrinciples": Guidelines on content trust, sourcing, and authority.
4. "userSatisfactionPrinciples": Questions or indicators showing high searcher satisfaction.
5. "experienceSignals": Indicators proving first-hand experience (e.g. personal observations, trial and error, case studies).
6. "qualityEvaluationQuestions": Self-assessment quality questions Google outlines.
7. "contentReviewQuestions": Questions to review if you are creating search-engine-first content.
8. "searchIntentGuidance": Guidance on answering search queries and matching searcher intent.
9. "readerValuePrinciples": Creating unique value compared to existing web results.

CRITICAL METADATA REQUIREMENT:
Set the output metadata exactly to:
- source: "Google Search Central"
- sourceUrl: "https://developers.google.com/search/docs/fundamentals/creating-helpful-content"
- version: "v1.1-Analyzed"
- lastSynced: "${new Date().toISOString().split('T')[0]}"
- totalRules: 28
- totalPrinciples: 14
- totalSelfAssessmentQuestions: 18
- generatedDate: "${new Date().toISOString().split('T')[0]}"

Return JSON conforming exactly to this schema:
{
  "metadata": {
    "source": "Google Search Central",
    "sourceUrl": "https://developers.google.com/search/docs/fundamentals/creating-helpful-content",
    "version": "v1.1-Analyzed",
    "lastSynced": "YYYY-MM-DD",
    "totalRules": 28,
    "totalPrinciples": 14,
    "totalSelfAssessmentQuestions": 18,
    "generatedDate": "YYYY-MM-DD"
  },
  "helpfulContentPrinciples": ["string"],
  "peopleFirstPrinciples": ["string"],
  "reliabilityPrinciples": ["string"],
  "userSatisfactionPrinciples": ["string"],
  "experienceSignals": ["string"],
  "qualityEvaluationQuestions": ["string"],
  "contentReviewQuestions": ["string"],
  "searchIntentGuidance": ["string"],
  "readerValuePrinciples": ["string"]
}
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              metadata: {
                type: Type.OBJECT,
                properties: {
                  source: { type: Type.STRING },
                  sourceUrl: { type: Type.STRING },
                  version: { type: Type.STRING },
                  lastSynced: { type: Type.STRING },
                  totalRules: { type: Type.INTEGER },
                  totalPrinciples: { type: Type.INTEGER },
                  totalSelfAssessmentQuestions: { type: Type.INTEGER },
                  generatedDate: { type: Type.STRING }
                },
                required: ["source", "sourceUrl", "version", "lastSynced", "totalRules", "totalPrinciples", "totalSelfAssessmentQuestions", "generatedDate"]
              },
              helpfulContentPrinciples: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              peopleFirstPrinciples: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              reliabilityPrinciples: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              userSatisfactionPrinciples: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              experienceSignals: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              qualityEvaluationQuestions: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              contentReviewQuestions: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              searchIntentGuidance: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              readerValuePrinciples: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: [
              "metadata",
              "helpfulContentPrinciples",
              "peopleFirstPrinciples",
              "reliabilityPrinciples",
              "userSatisfactionPrinciples",
              "experienceSignals",
              "qualityEvaluationQuestions",
              "contentReviewQuestions",
              "searchIntentGuidance",
              "readerValuePrinciples"
            ]
          }
        }
      });

      const text = response.text;
      if (!text) throw new Error("Gemini returned empty text.");
      
      const knowledge = JSON.parse(text) as StoredGoogleHelpfulKnowledge;
      
      // Enforce the exact metadata properties
      knowledge.metadata.source = "Google Search Central";
      knowledge.metadata.sourceUrl = "https://developers.google.com/search/docs/fundamentals/creating-helpful-content";
      knowledge.metadata.version = "v1.1-Analyzed";
      knowledge.metadata.lastSynced = new Date().toISOString().split('T')[0];
      knowledge.metadata.generatedDate = new Date().toISOString().split('T')[0];

      // Calculate rule count dynamically based on results
      knowledge.metadata.totalRules = (knowledge.helpfulContentPrinciples?.length || 0) +
                                    (knowledge.reliabilityPrinciples?.length || 0) +
                                    (knowledge.experienceSignals?.length || 0) +
                                    (knowledge.readerValuePrinciples?.length || 0) +
                                    (knowledge.searchIntentGuidance?.length || 0);
      knowledge.metadata.totalPrinciples = (knowledge.helpfulContentPrinciples?.length || 0) +
                                          (knowledge.peopleFirstPrinciples?.length || 0);
      knowledge.metadata.totalSelfAssessmentQuestions = (knowledge.qualityEvaluationQuestions?.length || 0) +
                                                      (knowledge.contentReviewQuestions?.length || 0);

      writeGoogleHelpfulKnowledgeToDisk(knowledge);
      return knowledge;
    } catch (err: any) {
      console.error(`[Google Helpful Knowledge] Key index ${i} failed:`, err.message || err);
      lastError = err;
    }
  }

  throw new Error(`Failed to refresh rules from Google Search Central: ${lastError?.message || lastError}`);
}
