import { GoogleGenAI, Type } from "@google/genai";
import { getStoredSemanticHtmlKnowledge } from "./semanticHtmlKnowledge.js";
import { SemanticHtmlLog } from "../src/types.js";

export interface SemanticHtmlEngineResult {
  evaluationResult: string;
  issuesDetected: string[];
  revisionRecommendations: string[];
  finalSemanticDraft: string;
}

export async function runSemanticHtmlEngine(
  keys: string[],
  currentDraft: string,
  title: string,
  internalLinks: { title: string; url: string }[] | string = ""
): Promise<SemanticHtmlEngineResult> {
  const semanticKnowledge = getStoredSemanticHtmlKnowledge();
  const linksStr = Array.isArray(internalLinks) 
    ? internalLinks.map(l => `${l.title} -> ${l.url}`).join(", ")
    : internalLinks;

  if (!keys || keys.length === 0) {
    console.warn("[Semantic HTML Engine] No API keys available. Skipping semantic HTML validation.");
    return {
      evaluationResult: "Evaluasi Semantic HTML dilewati karena tidak ada API Key yang tersedia.",
      issuesDetected: [],
      revisionRecommendations: [],
      finalSemanticDraft: currentDraft
    };
  }

  const ai = new GoogleGenAI({ apiKey: keys[0] });

  const prompt = `
You are the **Semantic HTML Engine** for the AI Human Writer pipeline.
Your sole responsibility is to evaluate and enforce **Semantic HTML & Markdown Document Structure** based on MDN Web Docs standards.

Article Title: "${title}"

Knowledge Metadata:
- Source: ${semanticKnowledge.metadata.source} (${semanticKnowledge.metadata.sourceUrl})
- Version: ${semanticKnowledge.metadata.version}

MDN Semantic Rules to Enforce:
${semanticKnowledge.semanticRules.map((r, i) => `${i + 1}. ${r}`).join("\n")}

Formatting Defect Checks:
${semanticKnowledge.formattingValidationRules.map((r, i) => `${i + 1}. ${r}`).join("\n")}

Current Article Draft (Markdown/HTML):
"""
${currentDraft}
"""

Internal Links / Citations to preserve intact:
"${linksStr}"

CRITICAL INSTRUCTIONS & BOUNDARIES:
1. **STRUCTURAL CORRECTION ONLY**: You must check and fix HTML/markdown structural defects (e.g. heading hierarchy, lists, paragraph bolding, tables, blockquotes).
2. **DO NOT ALTER CONTENT**: Do NOT rewrite, change, expand, or delete the actual words, sentences, facts, or internal links. Keep the text, facts, and links 100% identical.
3. Check and fix:
   - Heading Hierarchy: Ensure headings follow sequential levels (e.g., H1 -> H2 -> H3). No skipping levels (e.g. H2 to H4).
   - Paragraphs: Ensure text blocks are standard paragraphs. Fix paragraphs that are entirely wrapped in **bold** or *italics*.
   - Lists: Convert pseudo-lists (plain text paragraphs starting with '•', '-', or '1.') into clean Markdown list syntax (unordered '-' or ordered '1.').
   - Strong/Emphasis: Ensure **strong** and *em* are used inline for emphasis on key phrases, not as paragraph decorations.
   - Tables: Ensure tables have proper headers and tabular data.
   - Blockquotes: Ensure blockquotes are used for quotes/citations.
4. Return a JSON object with:
   - \`evaluationResult\`: A detailed 1-2 paragraph diagnostic report (in Indonesian) evaluating the document's semantic HTML structure.
   - \`issuesDetected\`: An array of string descriptions of structural defects found (empty if pristine).
   - \`revisionRecommendations\`: An array of string descriptions of structural fixes applied (empty if pristine).
   - \`finalSemanticDraft\`: The revised article markdown content with corrected semantic HTML/Markdown structure.
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
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
            finalSemanticDraft: { type: Type.STRING }
          },
          required: ["evaluationResult", "issuesDetected", "revisionRecommendations", "finalSemanticDraft"]
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("Gemini returned empty text response for Semantic HTML evaluation.");
    }

    const parsed = JSON.parse(text);
    return {
      evaluationResult: parsed.evaluationResult || "Evaluasi struktur Semantic HTML selesai.",
      issuesDetected: parsed.issuesDetected || [],
      revisionRecommendations: parsed.revisionRecommendations || [],
      finalSemanticDraft: parsed.finalSemanticDraft && parsed.finalSemanticDraft.trim().length > 100
        ? parsed.finalSemanticDraft
        : currentDraft
    };
  } catch (err: any) {
    console.error("[Semantic HTML Engine Error]:", err.message || err);
    return {
      evaluationResult: `Evaluasi Semantic HTML gagal: ${err.message || err}. Draf awal dipertahankan.`,
      issuesDetected: [],
      revisionRecommendations: [],
      finalSemanticDraft: currentDraft
    };
  }
}
