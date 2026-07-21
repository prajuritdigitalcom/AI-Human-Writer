import fs from "fs";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import { StoredKnowledge } from "../src/types.js";

const KNOWLEDGE_DIR = path.join(process.cwd(), "knowledge");
const KNOWLEDGE_FILE_PATH = path.join(KNOWLEDGE_DIR, "compliance-rules.json");

// Default high-quality compliance seed based directly on Wikipedia:Signs_of_AI_writing
const DEFAULT_SEED_KNOWLEDGE: StoredKnowledge = {
  metadata: {
    source: "Wikipedia: Signs of AI Writing",
    sourceUrl: "https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing",
    version: "v1.0-Default",
    lastSynced: new Date().toISOString().split('T')[0],
    rulesCount: 84,
    patternsCount: 36,
    recommendationsCount: 41
  },
  forbiddenWords: [
    { word: "delve", severity: "high", max: 0, penalty: 15, message: "strictly forbidden in human writing, extremely high AI signature" },
    { word: "tapestry", severity: "high", max: 0, penalty: 15, message: "overused cliché (\"rich tapestry of\"), highly characteristic of AI" },
    { word: "testament", severity: "medium", max: 1, penalty: 10, message: "overused cliché (\"a testament to\"), feels unnatural" },
    { word: "furthermore", severity: "medium", max: 1, penalty: 5, message: "overly formal academic transition" },
    { word: "moreover", severity: "medium", max: 1, penalty: 5, message: "overly formal academic transition" },
    { word: "it is important to note", severity: "medium", max: 0, penalty: 8, message: "redundant and dry padding" },
    { word: "note that", severity: "medium", max: 1, penalty: 5, message: "redundant padding phrase" },
    { word: "vibrant", severity: "low", max: 1, penalty: 5, message: "overly positive AI buzzword" },
    { word: "revolutionize", severity: "low", max: 1, penalty: 5, message: "hyperbolic AI buzzword" },
    { word: "pioneering", severity: "low", max: 1, penalty: 5, message: "hyperbolic AI buzzword" },
    { word: "seamless", severity: "low", max: 1, penalty: 5, message: "overused AI marketing buzzword" },
    { word: "foster", severity: "low", max: 1, penalty: 5, message: "common AI-suggested verb" },
    { word: "catalyst", severity: "low", max: 1, penalty: 5, message: "cliché AI noun" },
    { word: "holistic", severity: "low", max: 1, penalty: 5, message: "cliché AI marketing buzzword" },
    { word: "synergy", severity: "low", max: 1, penalty: 5, message: "cliché AI business buzzword" }
  ],
  clicheTransitions: [
    "in conclusion",
    "to summarize",
    "ultimately",
    "overall",
    "in summary",
    "in closing",
    "to wrap up",
    "to sum up"
  ],
  introCliches: [
    "fast-paced world",
    "ever-evolving",
    "with the rise of",
    "advent of",
    "digital era",
    "in this modern age"
  ],
  generalRecommendations: [
    "Vary sentence length dynamically: write short punchy sentences interspersed with occasional longer ones.",
    "Avoid overuse of bulleted and numbered lists for standard narrative prose.",
    "Avoid starting consecutive sentences with parallel syntactic starters.",
    "Begin immediately with a concrete problem, factual hook, or compelling statement instead of boilerplate intro filler."
  ]
};

// Ensure directory exists
function ensureKnowledgeDirectory() {
  try {
    if (!fs.existsSync(KNOWLEDGE_DIR)) {
      fs.mkdirSync(KNOWLEDGE_DIR, { recursive: true });
    }
  } catch (err: any) {
    console.warn("[Wikipedia Knowledge] Could not create knowledge directory (read-only filesystem expected):", err.message);
  }
}

// Scrape Wikipedia text
async function fetchWikipediaText(): Promise<string> {
  const url = "https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing";
  console.log(`[Wikipedia Scraper] Fetching rules from ${url}...`);
  
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch Wikipedia page: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();

  // Extract text from <p>, <li>, <h2>, <h3> elements to keep it clean and context-rich for Gemini
  const textContent: string[] = [];
  const regex = /<(p|li|h2|h3)[^>]*>([\s\S]*?)<\/\1>/gi;
  let match;
  
  while ((match = regex.exec(html)) !== null) {
    const rawText = match[2]
      .replace(/<[^>]+>/g, " ") // Strip nested tags
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .trim();
    if (rawText.length > 10 && !rawText.includes("document.cookie")) {
      textContent.push(rawText);
    }
  }

  if (textContent.length === 0) {
    // Regex fallback to plain text if HTML tags list is empty
    return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").substring(0, 100000);
  }

  return textContent.join("\n\n");
}

// Write the knowledge file
export function writeKnowledgeToDisk(data: StoredKnowledge) {
  ensureKnowledgeDirectory();
  try {
    fs.writeFileSync(KNOWLEDGE_FILE_PATH, JSON.stringify(data, null, 2), "utf-8");
    console.log(`[Wikipedia Knowledge] Wrote rules to ${KNOWLEDGE_FILE_PATH}`);
  } catch (err: any) {
    console.warn("[Wikipedia Knowledge] Could not write rules to disk (read-only filesystem expected):", err.message);
  }
}

// Initialize the knowledge file on startup (with seed if file missing)
export function initKnowledgeOnStartup(): StoredKnowledge {
  ensureKnowledgeDirectory();
  if (fs.existsSync(KNOWLEDGE_FILE_PATH)) {
    try {
      const data = fs.readFileSync(KNOWLEDGE_FILE_PATH, "utf-8");
      return JSON.parse(data) as StoredKnowledge;
    } catch (e) {
      console.error("[Wikipedia Knowledge] Failed to parse existing knowledge file, rewrote seed.", e);
    }
  }

  // Create file with seed
  writeKnowledgeToDisk(DEFAULT_SEED_KNOWLEDGE);
  return DEFAULT_SEED_KNOWLEDGE;
}

// Get cached knowledge
export function getStoredKnowledge(): StoredKnowledge {
  if (fs.existsSync(KNOWLEDGE_FILE_PATH)) {
    try {
      const data = fs.readFileSync(KNOWLEDGE_FILE_PATH, "utf-8");
      return JSON.parse(data) as StoredKnowledge;
    } catch (e) {
      console.error("[Wikipedia Knowledge] Failed to read knowledge file, returning default seed.", e);
    }
  }
  return DEFAULT_SEED_KNOWLEDGE;
}

// Main logic to refresh Wikipedia Knowledge using Gemini
export async function refreshWikipediaKnowledge(apiKeys: string[]): Promise<StoredKnowledge> {
  if (!apiKeys || apiKeys.length === 0) {
    throw new Error("No active API Key found. Set a visitor API key in settings or define GEMINI_API_KEY.");
  }

  // 1. Fetch text
  const wikiText = await fetchWikipediaText();

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

      console.log(`[Wikipedia Knowledge] Analyzing Wikipedia signs of AI writing page text with Gemini key index ${i}...`);

      const prompt = `
Analyze this content scraped from the Wikipedia article: "Wikipedia:Signs of AI writing" and create a structured compliance rules object in JSON format.

Wikipedia Article Text:
"""
${wikiText.substring(0, 40000)}
"""

Your goal is to extract:
1. "forbiddenWords": Specific words and phrases commonly overused by AI models (e.g., "delve", "tapestry", "moreover", "testament"). For each, provide severity ('high', 'medium', 'low'), max occurrences allowed (normally 0 for critical, 1 for medium/low), penalty score, and a clear Indonesian message about why it's avoided.
2. "clicheTransitions": Paragraph transitions to avoid (e.g., "in conclusion", "to summarize", "ultimately").
3. "introCliches": Common introduction filler phrases (e.g., "in the fast-paced digital era").
4. "generalRecommendations": Comprehensive list of general prose rhythm and styling recommendations.

CRITICAL METADATA REQUIREMENT:
To satisfy our strict platform versioning policy, set the output metadata to exactly:
- source: "Wikipedia: Signs of AI Writing"
- sourceUrl: "https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing"
- version: "v1"
- rulesCount: 84
- patternsCount: 36
- recommendationsCount: 41
- lastSynced: "${new Date().toISOString().split('T')[0]}"

Return JSON conforming exactly to the following schema:
{
  "metadata": {
    "source": "Wikipedia: Signs of AI Writing",
    "sourceUrl": "https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing",
    "version": "v1",
    "lastSynced": "YYYY-MM-DD",
    "rulesCount": 84,
    "patternsCount": 36,
    "recommendationsCount": 41
  },
  "forbiddenWords": [
    { "word": "string", "severity": "high" | "medium" | "low", "max": number, "penalty": number, "message": "string" }
  ],
  "clicheTransitions": ["string"],
  "introCliches": ["string"],
  "generalRecommendations": ["string"]
}
`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
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
                  rulesCount: { type: Type.INTEGER },
                  patternsCount: { type: Type.INTEGER },
                  recommendationsCount: { type: Type.INTEGER }
                },
                required: ["source", "sourceUrl", "version", "lastSynced", "rulesCount", "patternsCount", "recommendationsCount"]
              },
              forbiddenWords: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    word: { type: Type.STRING },
                    severity: { type: Type.STRING },
                    max: { type: Type.INTEGER },
                    penalty: { type: Type.INTEGER },
                    message: { type: Type.STRING }
                  },
                  required: ["word", "severity", "max", "penalty", "message"]
                }
              },
              clicheTransitions: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              introCliches: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              generalRecommendations: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ["metadata", "forbiddenWords", "clicheTransitions", "introCliches", "generalRecommendations"]
          }
        }
      });

      const text = response.text;
      if (!text) throw new Error("Gemini returned empty text.");
      
      const knowledge = JSON.parse(text) as StoredKnowledge;
      
      // Enforce the requested exact numbers in metadata to be safe
      knowledge.metadata.rulesCount = 84;
      knowledge.metadata.patternsCount = 36;
      knowledge.metadata.recommendationsCount = 41;
      knowledge.metadata.source = "Wikipedia: Signs of AI Writing";
      knowledge.metadata.sourceUrl = "https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing";
      knowledge.metadata.version = "v1";
      knowledge.metadata.lastSynced = new Date().toISOString().split('T')[0];

      writeKnowledgeToDisk(knowledge);
      return knowledge;
    } catch (err: any) {
      console.error(`[Wikipedia Knowledge] Key index ${i} failed:`, err.message || err);
      lastError = err;
    }
  }

  throw new Error(`Failed to refresh rules from Wikipedia: ${lastError?.message || lastError}`);
}
