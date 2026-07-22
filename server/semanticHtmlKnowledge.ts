import fs from "fs";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import { StoredSemanticHtmlKnowledge, ElementSemanticRule } from "../src/types.js";

const KNOWLEDGE_DIR = path.join(process.cwd(), "knowledge");
const JSON_FILE_PATH = path.join(KNOWLEDGE_DIR, "semantic-html.json");
const MD_FILE_PATH = path.join(KNOWLEDGE_DIR, "semantic-html.md");

const DEFAULT_SUPPORTED_ELEMENTS = [
  "h1", "h2", "h3", "h4", "h5", "h6",
  "p", "strong", "em", "ol", "ul", "li",
  "a", "img", "blockquote", "table", "thead", "tbody", "tr", "td", "th", "hr"
];

const DEFAULT_ELEMENT_RULES: ElementSemanticRule[] = [
  {
    tag: "h1",
    definition: "Top-level heading of the document.",
    purpose: "Represents the main topic or title of the entire article.",
    semanticMeaning: "Highest semantic importance for document hierarchy.",
    usageCondition: "Used exactly once per article for the primary title.",
    relationships: "Parent of major section headings (h2).",
    commonPitfalls: "Using multiple h1 tags or skipping directly to h3 without an h2."
  },
  {
    tag: "h2",
    definition: "Major section heading.",
    purpose: "Divides the document into logical top-level subtopics.",
    semanticMeaning: "High semantic importance for structuring core sections.",
    usageCondition: "Used for every main section of the article body.",
    relationships: "Child of h1, parent of h3.",
    commonPitfalls: "Using h2 purely for larger font size rather than semantic sectioning."
  },
  {
    tag: "h3",
    definition: "Subsection heading under an h2.",
    purpose: "Breaks down a major section into detailed sub-points.",
    semanticMeaning: "Medium semantic importance for nested sectioning.",
    usageCondition: "Used inside an h2 section when further hierarchy is required.",
    relationships: "Child of h2, parent of h4.",
    commonPitfalls: "Placing h3 without a preceding h2 parent."
  },
  {
    tag: "h4",
    definition: "Sub-subsection heading.",
    purpose: "Further subdivides complex h3 topics.",
    semanticMeaning: "Granular structural heading.",
    usageCondition: "Used sparingly for deep structural breakdowns.",
    relationships: "Child of h3, parent of h5.",
    commonPitfalls: "Over-nesting headings unnecessarily."
  },
  {
    tag: "h5",
    definition: "Fifth-level heading.",
    purpose: "Deep technical or granular subsection tag.",
    semanticMeaning: "Low-level structural marker.",
    usageCondition: "Used only in exceptionally deep technical documents.",
    relationships: "Child of h4, parent of h6.",
    commonPitfalls: "Using h5 for visual styling."
  },
  {
    tag: "h6",
    definition: "Sixth-level heading.",
    purpose: "Lowest heading level in HTML.",
    semanticMeaning: "Lowest-level structural marker.",
    usageCondition: "Rarely needed in web articles.",
    relationships: "Child of h5.",
    commonPitfalls: "Misusing as small muted text."
  },
  {
    tag: "p",
    definition: "Paragraph element.",
    purpose: "Represents a paragraph of text content.",
    semanticMeaning: "Encapsulates a cohesive, independent thought or narrative unit.",
    usageCondition: "Default wrapper for all body narrative text.",
    relationships: "Sibling to headings, lists, blockquotes, and tables.",
    commonPitfalls: "Wrapping an entire paragraph in <strong> or <em> tags."
  },
  {
    tag: "strong",
    definition: "Strong importance element.",
    purpose: "Indicates that its contents have strong importance, seriousness, or urgency.",
    semanticMeaning: "High semantic weight for critical terms or warnings.",
    usageCondition: "Used inline on specific key phrases or lead-ins within a paragraph.",
    relationships: "Inline child of p, li, or td.",
    commonPitfalls: "Bold face styling applied to whole paragraphs or layout blocks."
  },
  {
    tag: "em",
    definition: "Emphasis element.",
    purpose: "Marks text that has stress emphasis.",
    semanticMeaning: "Changes the meaning/stress of the spoken text.",
    usageCondition: "Used inline for foreign words, key terms, or stressed words.",
    relationships: "Inline child of p, li, or td.",
    commonPitfalls: "Italicizing full blocks for aesthetic design."
  },
  {
    tag: "ol",
    definition: "Ordered list element.",
    purpose: "Represents an ordered list of items.",
    semanticMeaning: "Order of items is meaningful (sequential steps, rankings, timeline).",
    usageCondition: "Used when item sequence or step numbers matter.",
    relationships: "Parent of li elements.",
    commonPitfalls: "Writing steps as plain text paragraphs with manual '1.' prefixes."
  },
  {
    tag: "ul",
    definition: "Unordered list element.",
    purpose: "Represents an unordered list of items.",
    semanticMeaning: "Collection of related items where order does not matter.",
    usageCondition: "Used for feature lists, key takeaways, bulleted points.",
    relationships: "Parent of li elements.",
    commonPitfalls: "Writing lists as plain text paragraphs with leading dash/bullet characters."
  },
  {
    tag: "li",
    definition: "List item element.",
    purpose: "Represents an item in an ordered or unordered list.",
    semanticMeaning: "Single cohesive item in a collection.",
    usageCondition: "Must be contained within an ol or ul parent.",
    relationships: "Child of ol or ul.",
    commonPitfalls: "Placing li outside of ol or ul list containers."
  },
  {
    tag: "a",
    definition: "Anchor element.",
    purpose: "Creates a hyperlink to web pages, files, or locations.",
    semanticMeaning: "Navigational or contextual reference link.",
    usageCondition: "Used for internal links, source citations, and external references.",
    relationships: "Inline child of p, li, or td.",
    commonPitfalls: "Generic anchor text like 'click here' or invalid href attributes."
  },
  {
    tag: "img",
    definition: "Image element.",
    purpose: "Embeds an image into the document.",
    semanticMeaning: "Visual media supporting textual content.",
    usageCondition: "Used for featured image or explanatory inline visuals with alt text.",
    relationships: "Standalone block or figure child.",
    commonPitfalls: "Missing or non-descriptive alt attributes."
  },
  {
    tag: "blockquote",
    definition: "Block quotation element.",
    purpose: "Indicates that the enclosed text is an extended quotation from an external source.",
    semanticMeaning: "Cited quote or authoritative statement.",
    usageCondition: "Used strictly for external quotes or highlighted citations.",
    relationships: "Encloses p or cite elements.",
    commonPitfalls: "Using blockquote for visual callouts or indenting standard prose."
  },
  {
    tag: "table",
    definition: "Table element.",
    purpose: "Represents tabular data.",
    semanticMeaning: "Data presented in a two-dimensional grid of rows and columns.",
    usageCondition: "Used for comparisons, matrices, specifications, and tabular facts.",
    relationships: "Parent of thead, tbody, tr.",
    commonPitfalls: "Using tables for page layout or multi-column text."
  },
  {
    tag: "thead",
    definition: "Table head element.",
    purpose: "Defines a set of rows defining the head of the columns of the table.",
    semanticMeaning: "Header context for tabular data.",
    usageCondition: "Encapsulates header tr and th tags.",
    relationships: "Child of table, parent of tr.",
    commonPitfalls: "Omitting thead in data tables."
  },
  {
    tag: "tbody",
    definition: "Table body element.",
    purpose: "Encapsulates a set of table rows (tr) representing the main body data.",
    semanticMeaning: "Data payload container of a table.",
    usageCondition: "Encapsulates body data rows.",
    relationships: "Child of table, parent of tr.",
    commonPitfalls: "Mixing header rows inside tbody."
  },
  {
    tag: "tr",
    definition: "Table row element.",
    purpose: "Defines a row of cells in a table.",
    semanticMeaning: "Horizontal record line in tabular dataset.",
    usageCondition: "Parent of th or td elements.",
    relationships: "Child of thead or tbody.",
    commonPitfalls: "Placing plain text directly inside tr without td/th."
  },
  {
    tag: "th",
    definition: "Table header cell element.",
    purpose: "Defines a cell as header of a group of table cells.",
    semanticMeaning: "Column or row header label.",
    usageCondition: "Used inside thead or as row headers.",
    relationships: "Child of tr.",
    commonPitfalls: "Using standard td instead of th for header cells."
  },
  {
    tag: "td",
    definition: "Table data cell element.",
    purpose: "Defines a cell of a table that contains data.",
    semanticMeaning: "Data point cell in a table.",
    usageCondition: "Used inside tbody tr elements.",
    relationships: "Child of tr.",
    commonPitfalls: "Putting raw structural layout or complex widgets in td."
  },
  {
    tag: "hr",
    definition: "Horizontal rule element.",
    purpose: "Represents a thematic break between paragraph-level elements.",
    semanticMeaning: "Thematic shift or scene transition.",
    usageCondition: "Used between distinct major topics or ending sections.",
    relationships: "Block separator between p, section, or div.",
    commonPitfalls: "Overusing hr as decorative dividers between every paragraph."
  }
];

// Default high-quality seed knowledge based on MDN Web Docs HTML Elements Reference
const DEFAULT_SEED_SEMANTIC_HTML: StoredSemanticHtmlKnowledge = {
  metadata: {
    source: "MDN Web Docs",
    sourceUrl: "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements",
    version: "v1.0-Default",
    lastSynced: new Date().toISOString().split('T')[0],
    totalElements: 22,
    generatedDate: new Date().toISOString().split('T')[0]
  },
  supportedElements: DEFAULT_SUPPORTED_ELEMENTS,
  elementRules: DEFAULT_ELEMENT_RULES,
  semanticRules: [
    "Headings (h1-h6) define document hierarchy. H1 is reserved for the main article title. Headings must step down sequentially (h1 -> h2 -> h3) without skipping levels (e.g., h2 to h4) purely for visual styling.",
    "Paragraphs (<p>) encapsulate cohesive blocks of narrative text. Never wrap an entire paragraph inside <strong> or <em> tags.",
    "Ordered Lists (<ol>) must be used when item order conveys sequence, priority, or chronological steps.",
    "Unordered Lists (<ul>) are for collections of items where order does not matter. Do not write list items as plain text paragraphs with leading bullet/dash symbols.",
    "List Items (<li>) must always be wrapped directly inside an <ol> or <ul> parent element.",
    "Strong (<strong>) denotes strong importance, seriousness, or urgency for text content. It is not merely a bold visual style.",
    "Emphasis (<em>) represents stress emphasis or specialized technical terms, altering the spoken stress of the phrase.",
    "Blockquote (<blockquote>) is strictly used for extended quotations or cited excerpts from external authorities.",
    "Table elements (<table>, <thead>, <tbody>, <tr>, <th>, <td>) are strictly for tabular data representation (matrices, comparisons, specifications). Tables must never be used for page layout.",
    "Anchor links (<a>) provide navigational references or citations with descriptive anchor text.",
    "Images (<img>) must include accurate, contextual alt text for accessibility and semantic visual support.",
    "Horizontal Rules (<hr>) represent a thematic break between paragraphs or sections."
  ],
  formattingValidationRules: [
    "Detect paragraphs wrapped entirely in <strong> or <em> tags.",
    "Detect pseudo-lists formatted as plain text paragraphs with leading bullets, dashes, or numbers instead of <ul>/<ol> and <li>.",
    "Detect headings used out of hierarchical order or used purely to adjust font size.",
    "Detect tables used for page layout or multi-column text formatting.",
    "Detect non-semantic HTML structures, empty tags, or invalid element nesting."
  ]
};

function ensureKnowledgeDirectory() {
  try {
    if (!fs.existsSync(KNOWLEDGE_DIR)) {
      fs.mkdirSync(KNOWLEDGE_DIR, { recursive: true });
    }
  } catch (err: any) {
    console.warn("[Semantic HTML Knowledge] Could not create knowledge directory (read-only filesystem expected):", err.message);
  }
}

export function getStoredSemanticHtmlKnowledge(): StoredSemanticHtmlKnowledge {
  ensureKnowledgeDirectory();
  try {
    if (fs.existsSync(JSON_FILE_PATH)) {
      const content = fs.readFileSync(JSON_FILE_PATH, "utf-8");
      const parsed = JSON.parse(content);
      if (parsed && parsed.metadata && parsed.elementRules) {
        return parsed;
      }
    }
  } catch (err: any) {
    console.warn("[Semantic HTML Knowledge] Failed to read local JSON knowledge, falling back to seed:", err.message);
  }
  return DEFAULT_SEED_SEMANTIC_HTML;
}

export function saveSemanticHtmlKnowledge(data: StoredSemanticHtmlKnowledge): void {
  ensureKnowledgeDirectory();
  try {
    fs.writeFileSync(JSON_FILE_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (err: any) {
    console.warn("[Semantic HTML Knowledge] Could not write JSON rules to disk (read-only filesystem expected):", err.message);
  }

  // Generate Markdown documentation for human reading
  try {
    let mdContent = `# Semantic HTML Knowledge Base\n\n`;
    mdContent += `**Source:** [${data.metadata.source}](${data.metadata.sourceUrl})\n`;
    mdContent += `**Version:** ${data.metadata.version}\n`;
    mdContent += `**Last Synced:** ${data.metadata.lastSynced}\n`;
    mdContent += `**Total Elements:** ${data.metadata.totalElements}\n\n`;

    mdContent += `## Semantic Rules\n\n`;
    data.semanticRules.forEach((rule, i) => {
      mdContent += `${i + 1}. ${rule}\n`;
    });

    mdContent += `\n## Formatting Validation Rules\n\n`;
    data.formattingValidationRules.forEach((rule, i) => {
      mdContent += `${i + 1}. ${rule}\n`;
    });

    mdContent += `\n## Supported Element Definitions\n\n`;
    data.elementRules.forEach(el => {
      mdContent += `### \`<${el.tag}>\`\n`;
      mdContent += `- **Definition:** ${el.definition}\n`;
      mdContent += `- **Purpose:** ${el.purpose}\n`;
      mdContent += `- **Semantic Meaning:** ${el.semanticMeaning}\n`;
      mdContent += `- **Usage Condition:** ${el.usageCondition}\n`;
      mdContent += `- **Relationships:** ${el.relationships}\n`;
      mdContent += `- **Common Pitfalls:** ${el.commonPitfalls}\n\n`;
    });

    fs.writeFileSync(MD_FILE_PATH, mdContent, "utf-8");
  } catch (err: any) {
    console.warn("[Semantic HTML Knowledge] Could not write Markdown rules to disk (read-only filesystem expected):", err.message);
  }
}

export function initSemanticHtmlKnowledgeOnStartup(): void {
  ensureKnowledgeDirectory();
  try {
    if (!fs.existsSync(JSON_FILE_PATH)) {
      saveSemanticHtmlKnowledge(DEFAULT_SEED_SEMANTIC_HTML);
    }
  } catch (err: any) {
    console.warn("[Semantic HTML Knowledge] Startup init skipped file save:", err.message);
  }
}

async function fetchMdnElementsText(): Promise<string> {
  const url = "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements";
  console.log(`[Semantic HTML Scraper] Fetching documentation from ${url}...`);

  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch MDN Web Docs: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();

  // Extract text from <p>, <li>, <h2>, <h3> elements to keep it clean
  const textContent: string[] = [];
  const regex = /<(p|li|h2|h3)[^>]*>([\s\S]*?)<\/\1>/gi;
  let match;

  while ((match = regex.exec(html)) !== null) {
    const rawText = match[2]
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/\s+/g, " ")
      .trim();

    if (rawText.length > 15) {
      textContent.push(rawText);
    }
  }

  return textContent.slice(0, 150).join("\n");
}

export async function refreshSemanticHtmlKnowledge(keys: string[]): Promise<StoredSemanticHtmlKnowledge> {
  if (!keys || keys.length === 0) {
    throw new Error("No active API Key found for refreshing Semantic HTML knowledge.");
  }

  let scrapedText = "";
  try {
    scrapedText = await fetchMdnElementsText();
  } catch (err: any) {
    console.warn("[Semantic HTML Scraper] Web scraping failed, using built-in MDN reference context:", err.message);
    scrapedText = "MDN HTML Reference elements: h1, h2, h3, h4, h5, h6, p, strong, em, ol, ul, li, a, img, blockquote, table, thead, tbody, tr, td, th, hr.";
  }

  const ai = new GoogleGenAI({ apiKey: keys[0] });

  const prompt = `
You are an expert Frontend Architect & HTML Standards Specialist trained on MDN Web Docs HTML Elements Reference.
Your task is to analyze the following MDN documentation context and extract/build a comprehensive Semantic HTML Knowledge schema.

MDN Documentation Context:
"""
${scrapedText}
"""

Target Supported Elements:
${DEFAULT_SUPPORTED_ELEMENTS.join(", ")}

Instructions:
1. Synthesize explicit semantic rules for headings (h1-h6 hierarchy), paragraphs, strong, em, ol, ul, li, a, img, blockquote, table elements, and hr.
2. Build specific element rules detailing definition, purpose, semanticMeaning, usageCondition, relationships, and commonPitfalls for each supported element.
3. Formulate formatting validation rules to detect pseudo-lists, over-bolded paragraphs, table layouts, and heading level skipping.
4. Return JSON only matching the schema.
`;

  const response = await ai.models.generateContent({
    model: "gemini-3.6-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          supportedElements: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          elementRules: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                tag: { type: Type.STRING },
                definition: { type: Type.STRING },
                purpose: { type: Type.STRING },
                semanticMeaning: { type: Type.STRING },
                usageCondition: { type: Type.STRING },
                relationships: { type: Type.STRING },
                commonPitfalls: { type: Type.STRING }
              },
              required: ["tag", "definition", "purpose", "semanticMeaning", "usageCondition", "relationships", "commonPitfalls"]
            }
          },
          semanticRules: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          formattingValidationRules: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: ["supportedElements", "elementRules", "semanticRules", "formattingValidationRules"]
      }
    }
  });

  const text = response.text;
  if (!text) {
    throw new Error("Gemini returned an empty response during Semantic HTML knowledge extraction.");
  }

  const parsed = JSON.parse(text);
  const now = new Date().toISOString().split("T")[0];

  const updatedKnowledge: StoredSemanticHtmlKnowledge = {
    metadata: {
      source: "MDN Web Docs",
      sourceUrl: "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements",
      version: `v1.1-MDN-Synced-${now.replace(/-/g, '')}`,
      lastSynced: now,
      totalElements: parsed.supportedElements?.length || DEFAULT_SUPPORTED_ELEMENTS.length,
      generatedDate: now
    },
    supportedElements: parsed.supportedElements || DEFAULT_SUPPORTED_ELEMENTS,
    elementRules: parsed.elementRules || DEFAULT_ELEMENT_RULES,
    semanticRules: parsed.semanticRules || DEFAULT_SEED_SEMANTIC_HTML.semanticRules,
    formattingValidationRules: parsed.formattingValidationRules || DEFAULT_SEED_SEMANTIC_HTML.formattingValidationRules
  };

  saveSemanticHtmlKnowledge(updatedKnowledge);
  return updatedKnowledge;
}
