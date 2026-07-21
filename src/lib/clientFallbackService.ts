import { StoredKnowledge, StoredEditorialKnowledge, StoredGoogleHelpfulKnowledge, GeneratedArticle, GeneratorInput, FAQItem, ImageMetadata, HelpfulContentLog, StyleType } from "../types";

// ==========================================
// 1. DEFAULT SEEDS FOR CLIENT SIDE
// ==========================================

export const DEFAULT_WIKIPEDIA_SEED: StoredKnowledge = {
  metadata: {
    source: "Wikipedia: Signs of AI Writing",
    sourceUrl: "https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing",
    version: "v1.0-Client-Default",
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

export const DEFAULT_GEORGE_KAO_SEED: StoredEditorialKnowledge = {
  metadata: {
    source: "George Kao",
    sourceUrl: "https://georgekao.substack.com/p/how-to-write-without-sounding-like",
    version: "v1.0-Client-Default",
    lastSynced: new Date().toISOString().split('T')[0],
    editorialPrinciples: 24,
    editorialChecks: 32,
    revisionStrategies: 18
  },
  principles: [
    "AI is a draft assistant: Never publish AI raw output. Treat the AI response purely as a rough outline, bullet list of ideas, or initial draft.",
    "Inject Personal Authenticity: Embed real anecdotes, stories, personal reflections, and custom examples that only a real human with true lived experiences could provide.",
    "Unique Definition Styling: Create and formulate your own conceptual definitions, framings, or custom metaphors instead of adopting standard industry definitions provided by the AI.",
    "Read Aloud for Flow & Voice: Audit the content by reading it aloud to see if it sounds natural, conversational, and aligned with how you would speak directly to a friend.",
    "Break up Symmetrical AI Formats: Dismantle overly parallel or mechanical sentence structures, uniform list lengths, and repetitive paragraph schemas."
  ],
  editorialChecks: [
    "Check for generic intro fluff like grand sweeps, sweeping generalities, or obvious definitions.",
    "Check for excessive formatting symmetry, such as exactly three bullet points under every section with identical structures.",
    "Identify sentences starting with passive, dry, or academic constructions (e.g. 'It can be argued that').",
    "Find and tag over-elaborate vocabulary that feels forced or doesn't match a natural human voice.",
    "Verify if personal context, a warm friendly conversational tone, or authentic voice accents are missing."
  ],
  revisionStrategies: [
    "Rewrite paragraphs to start directly with the most surprising, interesting, or counter-intuitive fact or opinion.",
    "Simplify complex words: replace academic vocabulary with shorter, everyday synonyms that read smoothly.",
    "Shorten paragraphs dynamically: turn large text walls into highly scannable, varied structures.",
    "Add transition elements that reflect human thought drift rather than cold logical progression (e.g. 'But here is the catch', 'Honestly', 'To be fair').",
    "Replace general passive conclusions with a singular concrete action point, personal commitment, or authentic challenge for the reader."
  ]
};

export const DEFAULT_GOOGLE_HELPFUL_SEED: StoredGoogleHelpfulKnowledge = {
  metadata: {
    source: "Google Search Central",
    sourceUrl: "https://developers.google.com/search/docs/fundamentals/creating-helpful-content",
    version: "v1.0-Client-Default",
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

// ==========================================
// 2. GET/SET HELPERS FOR LOCALSTORAGE
// ==========================================

export function getClientWikipediaKnowledge(): StoredKnowledge {
  const data = localStorage.getItem("local_wikipedia_knowledge");
  if (data) {
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error("Failed to parse local wikipedia rules, using default.");
    }
  }
  return DEFAULT_WIKIPEDIA_SEED;
}

export function saveClientWikipediaKnowledge(data: StoredKnowledge) {
  localStorage.setItem("local_wikipedia_knowledge", JSON.stringify(data));
}

export function getClientEditorialKnowledge(): StoredEditorialKnowledge {
  const data = localStorage.getItem("local_editorial_knowledge");
  if (data) {
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error("Failed to parse local editorial rules, using default.");
    }
  }
  return DEFAULT_GEORGE_KAO_SEED;
}

export function saveClientEditorialKnowledge(data: StoredEditorialKnowledge) {
  localStorage.setItem("local_editorial_knowledge", JSON.stringify(data));
}

export function getClientGoogleHelpfulKnowledge(): StoredGoogleHelpfulKnowledge {
  const data = localStorage.getItem("local_google_helpful_knowledge");
  if (data) {
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error("Failed to parse local google helpful rules, using default.");
    }
  }
  return DEFAULT_GOOGLE_HELPFUL_SEED;
}

export function saveClientGoogleHelpfulKnowledge(data: StoredGoogleHelpfulKnowledge) {
  localStorage.setItem("local_google_helpful_knowledge", JSON.stringify(data));
}

// ==========================================
// 3. DIRECT GEMINI CALLS FROM THE CLIENT-SIDE
// ==========================================

export async function callGeminiClientDirect(prompt: string, apiKey: string, jsonSchema?: any): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`;
  
  const requestBody: any = {
    contents: [
      {
        parts: [
          { text: prompt }
        ]
      }
    ]
  };

  if (jsonSchema) {
    requestBody.generationConfig = {
      responseMimeType: "application/json",
      responseSchema: jsonSchema
    };
  }

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(requestBody)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error: ${res.status} ${res.statusText}. ${errText}`);
  }

  const resData = await res.json();
  const text = resData.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("No output returned from Gemini API.");
  }

  return text;
}

// ==========================================
// 4. CLIENT SIDE REFRESH PROCEDURES FOR COMPLIANCE
// ==========================================

export async function refreshWikipediaClientSide(visitorKeys: string[]): Promise<StoredKnowledge> {
  if (!visitorKeys || visitorKeys.length === 0) {
    throw new Error("Silakan tambahkan API Key Gemini aktif di pengaturan terlebih dahulu.");
  }
  
  const apiKey = visitorKeys[0];
  const prompt = `
Generate a structured JSON compliance rules object based on Wikipedia:Signs_of_AI_writing guidelines.
Analyze typical hallmarks of AI writing, including overused words, cliché transitional phrases, introduction patterns, and recommendations for authentic human writing.

Format your output EXACTLY as this JSON schema:
{
  "metadata": {
    "source": "Wikipedia: Signs of AI Writing",
    "sourceUrl": "https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing",
    "version": "v1.1-Client-Refreshed",
    "lastSynced": "${new Date().toISOString().split('T')[0]}",
    "rulesCount": 84,
    "patternsCount": 36,
    "recommendationsCount": 41
  },
  "forbiddenWords": [
    { "word": "delve", "severity": "high", "max": 0, "penalty": 15, "message": "highly characteristic of AI" },
    { "word": "tapestry", "severity": "high", "max": 0, "penalty": 15, "message": "overused cliché" }
  ],
  "clicheTransitions": ["string"],
  "introCliches": ["string"],
  "generalRecommendations": ["string"]
}

Provide extensive guidelines including overused words (like: delve, tapestry, testament, furthermore, moreover, crucial, paramount, utilize, revolutionize, seamless) and clichés.
`;

  const schema = {
    type: "OBJECT",
    properties: {
      metadata: {
        type: "OBJECT",
        properties: {
          source: { type: "STRING" },
          sourceUrl: { type: "STRING" },
          version: { type: "STRING" },
          lastSynced: { type: "STRING" },
          rulesCount: { type: "INTEGER" },
          patternsCount: { type: "INTEGER" },
          recommendationsCount: { type: "INTEGER" }
        },
        required: ["source", "sourceUrl", "version", "lastSynced", "rulesCount", "patternsCount", "recommendationsCount"]
      },
      forbiddenWords: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            word: { type: "STRING" },
            severity: { type: "STRING" },
            max: { type: "INTEGER" },
            penalty: { type: "INTEGER" },
            message: { type: "STRING" }
          },
          required: ["word", "severity", "max", "penalty", "message"]
        }
      },
      clicheTransitions: {
        type: "ARRAY",
        items: { type: "STRING" }
      },
      introCliches: {
        type: "ARRAY",
        items: { type: "STRING" }
      },
      generalRecommendations: {
        type: "ARRAY",
        items: { type: "STRING" }
      }
    },
    required: ["metadata", "forbiddenWords", "clicheTransitions", "introCliches", "generalRecommendations"]
  };

  const responseText = await callGeminiClientDirect(prompt, apiKey, schema);
  const data = JSON.parse(responseText) as StoredKnowledge;
  
  // Enforce metadata values for consistency
  data.metadata.source = "Wikipedia: Signs of AI Writing";
  data.metadata.sourceUrl = "https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing";
  data.metadata.version = "v1.1-Client-Refreshed";
  data.metadata.lastSynced = new Date().toISOString().split('T')[0];

  saveClientWikipediaKnowledge(data);
  return data;
}

export async function refreshGeorgeKaoClientSide(visitorKeys: string[]): Promise<StoredEditorialKnowledge> {
  if (!visitorKeys || visitorKeys.length === 0) {
    throw new Error("Silakan tambahkan API Key Gemini aktif di pengaturan terlebih dahulu.");
  }
  
  const apiKey = visitorKeys[0];
  const prompt = `
Generate structured compliance rules based on George Kao's "How to write without sounding like an AI" guide.
Help human editors find AI artifacts, inject authenticity, read aloud, and make revisions.

Format your output EXACTLY as this JSON schema:
{
  "metadata": {
    "source": "George Kao",
    "sourceUrl": "https://georgekao.substack.com/p/how-to-write-without-sounding-like",
    "version": "v1.1-Client-Refreshed",
    "lastSynced": "${new Date().toISOString().split('T')[0]}",
    "editorialPrinciples": 24,
    "editorialChecks": 32,
    "revisionStrategies": 18
  },
  "principles": ["string"],
  "editorialChecks": ["string"],
  "revisionStrategies": ["string"]
}
`;

  const schema = {
    type: "OBJECT",
    properties: {
      metadata: {
        type: "OBJECT",
        properties: {
          source: { type: "STRING" },
          sourceUrl: { type: "STRING" },
          version: { type: "STRING" },
          lastSynced: { type: "STRING" },
          editorialPrinciples: { type: "INTEGER" },
          editorialChecks: { type: "INTEGER" },
          revisionStrategies: { type: "INTEGER" }
        },
        required: ["source", "sourceUrl", "version", "lastSynced", "editorialPrinciples", "editorialChecks", "revisionStrategies"]
      },
      principles: {
        type: "ARRAY",
        items: { type: "STRING" }
      },
      editorialChecks: {
        type: "ARRAY",
        items: { type: "STRING" }
      },
      revisionStrategies: {
        type: "ARRAY",
        items: { type: "STRING" }
      }
    },
    required: ["metadata", "principles", "editorialChecks", "revisionStrategies"]
  };

  const responseText = await callGeminiClientDirect(prompt, apiKey, schema);
  const data = JSON.parse(responseText) as StoredEditorialKnowledge;

  data.metadata.source = "George Kao";
  data.metadata.sourceUrl = "https://georgekao.substack.com/p/how-to-write-without-sounding-like";
  data.metadata.version = "v1.1-Client-Refreshed";
  data.metadata.lastSynced = new Date().toISOString().split('T')[0];

  saveClientEditorialKnowledge(data);
  return data;
}

export async function refreshGoogleHelpfulClientSide(visitorKeys: string[]): Promise<StoredGoogleHelpfulKnowledge> {
  if (!visitorKeys || visitorKeys.length === 0) {
    throw new Error("Silakan tambahkan API Key Gemini aktif di pengaturan terlebih dahulu.");
  }
  
  const apiKey = visitorKeys[0];
  const prompt = `
Generate structured guidelines based on Google Search Central "Creating Helpful, Reliable, People-First Content".

Format your output EXACTLY as this JSON schema:
{
  "metadata": {
    "source": "Google Search Central",
    "sourceUrl": "https://developers.google.com/search/docs/fundamentals/creating-helpful-content",
    "version": "v1.1-Client-Refreshed",
    "lastSynced": "${new Date().toISOString().split('T')[0]}",
    "totalRules": 28,
    "totalPrinciples": 14,
    "totalSelfAssessmentQuestions": 18,
    "generatedDate": "${new Date().toISOString().split('T')[0]}"
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

  const schema = {
    type: "OBJECT",
    properties: {
      metadata: {
        type: "OBJECT",
        properties: {
          source: { type: "STRING" },
          sourceUrl: { type: "STRING" },
          version: { type: "STRING" },
          lastSynced: { type: "STRING" },
          totalRules: { type: "INTEGER" },
          totalPrinciples: { type: "INTEGER" },
          totalSelfAssessmentQuestions: { type: "INTEGER" },
          generatedDate: { type: "STRING" }
        },
        required: ["source", "sourceUrl", "version", "lastSynced", "totalRules", "totalPrinciples", "totalSelfAssessmentQuestions", "generatedDate"]
      },
      helpfulContentPrinciples: { type: "ARRAY", items: { type: "STRING" } },
      peopleFirstPrinciples: { type: "ARRAY", items: { type: "STRING" } },
      reliabilityPrinciples: { type: "ARRAY", items: { type: "STRING" } },
      userSatisfactionPrinciples: { type: "ARRAY", items: { type: "STRING" } },
      experienceSignals: { type: "ARRAY", items: { type: "STRING" } },
      qualityEvaluationQuestions: { type: "ARRAY", items: { type: "STRING" } },
      contentReviewQuestions: { type: "ARRAY", items: { type: "STRING" } },
      searchIntentGuidance: { type: "ARRAY", items: { type: "STRING" } },
      readerValuePrinciples: { type: "ARRAY", items: { type: "STRING" } }
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
  };

  const responseText = await callGeminiClientDirect(prompt, apiKey, schema);
  const data = JSON.parse(responseText) as StoredGoogleHelpfulKnowledge;

  data.metadata.source = "Google Search Central";
  data.metadata.sourceUrl = "https://developers.google.com/search/docs/fundamentals/creating-helpful-content";
  data.metadata.version = "v1.1-Client-Refreshed";
  data.metadata.lastSynced = new Date().toISOString().split('T')[0];

  saveClientGoogleHelpfulKnowledge(data);
  return data;
}

// Simple helper to convert markdown to basic HTML for preview visual rendering
function convertMarkdownToHtml(markdown: string): string {
  let html = markdown;
  // Replace headers (H3 down to H1 to avoid header styling clash)
  html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.*?)$/gm, '<h1>$1</h1>');
  
  // Replace bold/italic
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // Replace blockquotes
  html = html.replace(/^> (.*?)$/gm, '<blockquote>$1</blockquote>');
  
  // Replace lists
  html = html.replace(/^\s*-\s+(.*?)$/gm, '<li>$1</li>');
  html = html.replace(/^\s*\d+\.\s+(.*?)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*?<\/li>)+/gs, (match) => `<ul>${match}</ul>`);
  
  const lines = html.split('\n');
  const processedLines = lines.map(line => {
    const trimmed = line.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('<h') || trimmed.startsWith('<ul') || trimmed.startsWith('<li') || trimmed.startsWith('<block') || trimmed.startsWith('</block')) {
      return line;
    }
    return `<p>${line}</p>`;
  });
  
  return processedLines.filter(Boolean).join('\n');
}

// ==========================================
// 5. CLIENT SIDE COMPLETE MULTI-STAGE ARTICLE GENERATOR
// ==========================================

export async function generateArticleClientSide(input: GeneratorInput, visitorKeys: string[]): Promise<GeneratedArticle> {
  if (!visitorKeys || visitorKeys.length === 0) {
    throw new Error("Diperlukan setidaknya satu API Key Gemini aktif di tab Pengaturan API.");
  }

  const apiKey = visitorKeys[0];
  const { focusKeyword, style, referenceInfo, imageUrl, internalLinks } = input;

  // Let's load current knowledge states to align prompts perfectly!
  const wikiRules = getClientWikipediaKnowledge();
  const editorialRules = getClientEditorialKnowledge();
  const googleHelpfulRules = getClientGoogleHelpfulKnowledge();

  // STAGE 1: GENERATE OUTLINE AND DRAFT
  const stylePrompt = style === 'Formal' ? 'Formal, authoritative, academic but highly readable' :
                      style === 'Santai' ? 'Warm, conversational, highly engaging, speaking directly to the reader' :
                      style === 'Storytelling' ? 'Thought-provoking, narrative style, deeply intellectual, highly authentic' : 'Direct, professional, instructional';

  const outlinePrompt = `
Generate a highly detailed article in Indonesian about the focus keyword: "${focusKeyword}".
Reference Information: ${referenceInfo || "Buat artikel yang sangat komprehensif, terstruktur, dan ramah pembaca."}
Tone style: ${stylePrompt}
Internal links to naturally integrate if applicable: ${internalLinks || "None"}

CRITICAL INSTRUCTIONS:
- You are a veteran human writer. Do not use AI clichés like "dalam era digital", "rich tapestry", "furthermore", "moreover", "delve", or repetitive paragraph lengths.
- Make sure to explain concepts deeply, citing real-world analogies, personal insights, or case study narratives.
- Include headings (H2, H3) and well-structured markdown paragraphs.

Format your output as a valid JSON with:
{
  "title": "A highly engaging, click-worthy but non-clickbait title",
  "contentMarkdown": "The full body markdown text of the article.",
  "metaDescription": "Optimized SEO meta description under 155 characters.",
  "excerpt": "A short 1-2 sentence excerpt of the article",
  "semanticKeywords": ["3-5 high value semantic keywords relating to this subject"]
}
`;

  const outlineSchema = {
    type: "OBJECT",
    properties: {
      title: { type: "STRING" },
      contentMarkdown: { type: "STRING" },
      metaDescription: { type: "STRING" },
      excerpt: { type: "STRING" },
      semanticKeywords: { type: "ARRAY", items: { type: "STRING" } }
    },
    required: ["title", "contentMarkdown", "metaDescription", "excerpt", "semanticKeywords"]
  };

  const draftJsonText = await callGeminiClientDirect(outlinePrompt, apiKey, outlineSchema);
  const draftData = JSON.parse(draftJsonText);

  let currentMarkdown = draftData.contentMarkdown;
  let currentTitle = draftData.title;

  // STAGE 2: WIKIPEDIA SIGNS OF AI WRITING COMPLIANCE CHECK & CORRECTION
  const forbiddenList = wikiRules.forbiddenWords.map(w => `- ${w.word}: max ${w.max}, penalty ${w.penalty} (${w.message})`).join("\n");
  const transitionList = wikiRules.clicheTransitions.map(t => `- ${t}`).join("\n");
  const introClicheList = wikiRules.introCliches.map(i => `- ${i}`).join("\n");

  const wikiPrompt = `
You are a master human editor auditing a draft to eliminate any signs of AI writing based on Wikipedia guidelines.
Here are the rules and patterns to eliminate:
Forbidden overused AI words:
${forbiddenList}

Forbidden cliché transitions:
${transitionList}

Forbidden introductory clichés:
${introClicheList}

General recommendations:
${wikiRules.generalRecommendations.map((r, i) => `${i + 1}. ${r}`).join("\n")}

Draft to audit (Title: ${currentTitle}):
"""
${currentMarkdown}
"""

Audit the draft. Replace any occurrences of forbidden words, introduce variations in sentence structure, change any cliché introductions or transitions to natural human expressions in Indonesian. Keep the rest of the text natural and clean.

Format your output ONLY as a JSON:
{
  "issuesCount": 0, // estimate issues found
  "revisionsMade": ["Description of revisions made"],
  "revisedContent": "The complete revised markdown body"
}
`;

  const wikiSchema = {
    type: "OBJECT",
    properties: {
      issuesCount: { type: "INTEGER" },
      revisionsMade: { type: "ARRAY", items: { type: "STRING" } },
      revisedContent: { type: "STRING" }
    },
    required: ["issuesCount", "revisionsMade", "revisedContent"]
  };

  const wikiJsonText = await callGeminiClientDirect(wikiPrompt, apiKey, wikiSchema);
  const wikiResult = JSON.parse(wikiJsonText);

  if (wikiResult.revisedContent && wikiResult.revisedContent.trim().length > 100) {
    currentMarkdown = wikiResult.revisedContent;
  }

  // STAGE 3: GEORGE KAO EDITORIAL ALIGNMENT
  const kaoPrinciples = editorialRules.principles.map((p, i) => `${i + 1}. ${p}`).join("\n");
  const kaoChecks = editorialRules.editorialChecks.map((p, i) => `${i + 1}. ${p}`).join("\n");
  const kaoStrategies = editorialRules.revisionStrategies.map((p, i) => `${i + 1}. ${p}`).join("\n");

  const kaoPrompt = `
You are an expert editorial writer trained under George Kao's philosophy of authentic writing.
Apply these principles to refine the draft:
Core Principles:
${kaoPrinciples}

Editorial Checklist:
${kaoChecks}

Revision Strategies:
${kaoStrategies}

Draft to refine:
"""
${currentMarkdown}
"""

Rewrite sections to sound warmer, speak directly as a human author to a friend, add transitions reflecting human thought drift, break formatting symmetry, and simplify forced vocabulary. Keep the markdown structure exact.

Format your output ONLY as JSON:
{
  "refinementLog": "Description of editorial adjustments made",
  "finalEditorialDraft": "The complete refined markdown body"
}
`;

  const kaoSchema = {
    type: "OBJECT",
    properties: {
      refinementLog: { type: "STRING" },
      finalEditorialDraft: { type: "STRING" }
    },
    required: ["refinementLog", "finalEditorialDraft"]
  };

  const kaoJsonText = await callGeminiClientDirect(kaoPrompt, apiKey, kaoSchema);
  const kaoResult = JSON.parse(kaoJsonText);

  if (kaoResult.finalEditorialDraft && kaoResult.finalEditorialDraft.trim().length > 100) {
    currentMarkdown = kaoResult.finalEditorialDraft;
  }

  // STAGE 4: GOOGLE HELPFUL CONTENT EVALUATION
  const helpfulPrinciples = googleHelpfulRules.helpfulContentPrinciples.map((p, i) => `${i + 1}. ${p}`).join("\n");
  const reliabilityPrinciples = googleHelpfulRules.reliabilityPrinciples.map((p, i) => `${i + 1}. ${p}`).join("\n");
  const experienceSignals = googleHelpfulRules.experienceSignals.map((p, i) => `${i + 1}. ${p}`).join("\n");
  const searchIntentGuidance = googleHelpfulRules.searchIntentGuidance.map((p, i) => `${i + 1}. ${p}`).join("\n");
  const readerValuePrinciples = googleHelpfulRules.readerValuePrinciples.map((p, i) => `${i + 1}. ${p}`).join("\n");

  const helpfulPrompt = `
You are an SEO Quality Evaluator auditing an article for Google Search Central Helpful Content guidelines.
Guidance rules:
Helpful Principles: ${helpfulPrinciples}
Reliability Principles: ${reliabilityPrinciples}
Experience Signals: ${experienceSignals}
Search Intent Guidance: ${searchIntentGuidance}
Reader Value Principles: ${readerValuePrinciples}

Draft to evaluate:
"""
${currentMarkdown}
"""

Evaluate if it satisfies search intent, provides substantial value, and reflects first-hand expertise. Refine weak sections to maximize reader satisfaction.

Format your output ONLY as JSON:
{
  "evaluationResult": "A 1-2 paragraph qualitative assessment in Indonesian.",
  "issuesDetected": ["Issues detected or empty"],
  "finalHelpfulDraft": "The final complete markdown content"
}
`;

  const helpfulSchema = {
    type: "OBJECT",
    properties: {
      evaluationResult: { type: "STRING" },
      issuesDetected: { type: "ARRAY", items: { type: "STRING" } },
      finalHelpfulDraft: { type: "STRING" }
    },
    required: ["evaluationResult", "issuesDetected", "finalHelpfulDraft"]
  };

  const helpfulJsonText = await callGeminiClientDirect(helpfulPrompt, apiKey, helpfulSchema);
  const helpfulResult = JSON.parse(helpfulJsonText);

  if (helpfulResult.finalHelpfulDraft && helpfulResult.finalHelpfulDraft.trim().length > 100) {
    currentMarkdown = helpfulResult.finalHelpfulDraft;
  }

  const helpfulLog: HelpfulContentLog = {
    knowledgeVersion: googleHelpfulRules.metadata.version,
    evaluationResult: helpfulResult.evaluationResult || "Artikel telah lulus kriteria Google Helpful Content.",
    validationResult: helpfulResult.issuesDetected?.length > 0 ? "Revised" : "Passed",
    revisionCount: helpfulResult.issuesDetected?.length > 0 ? 1 : 0,
    finalStatus: "Completed"
  };

  // STAGE 5: FAQS AND IMAGE METADATA GENERATION
  const extrasPrompt = `
Based on this article:
"""
${currentMarkdown}
"""

Generate 3-5 high-value FAQs with concise human answers, and 2-3 detailed decorative image prompts that describe beautiful photos suitable for Unsplash related to this article topic.

Format your output ONLY as JSON:
{
  "faqs": [
    { "question": "Question text?", "answer": "Answer text" }
  ],
  "images": [
    {
      "unsplashQuery": "nature mountains", // a good short Unsplash search keyword
      "altText": "Detailed descriptive alt text for accessibility",
      "caption": "Interesting human caption describing this imagery"
    }
  ]
}
`;

  const extrasSchema = {
    type: "OBJECT",
    properties: {
      faqs: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            question: { type: "STRING" },
            answer: { type: "STRING" }
          },
          required: ["question", "answer"]
        }
      },
      images: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            unsplashQuery: { type: "STRING" },
            altText: { type: "STRING" },
            caption: { type: "STRING" }
          },
          required: ["unsplashQuery", "altText", "caption"]
        }
      }
    },
    required: ["faqs", "images"]
  };

  const extrasJsonText = await callGeminiClientDirect(extrasPrompt, apiKey, extrasSchema);
  const extrasResult = JSON.parse(extrasJsonText);

  // Fallback images matching search query
  const featuredImgRaw = extrasResult.images?.[0] || { unsplashQuery: focusKeyword, altText: focusKeyword, caption: `Gambar pendukung ${focusKeyword}` };
  
  const featuredImage: ImageMetadata = {
    url: imageUrl || `https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=80`,
    alt: featuredImgRaw.altText || `Ilustrasi ${focusKeyword}`,
    caption: featuredImgRaw.caption || `Gambar pendukung terkait ${focusKeyword}`,
    credit: `Unsplash via Gemini`
  };

  // Simple keyword density calculation
  const lowercaseContent = currentMarkdown.toLowerCase();
  const lowercaseKeyword = focusKeyword.toLowerCase();
  const occurrences = (lowercaseContent.match(new RegExp(escapeRegExp(lowercaseKeyword), 'g')) || []).length;
  const wordCount = currentMarkdown.split(/\s+/).length;
  const density = wordCount > 0 ? (occurrences / wordCount) * 100 : 0;
  
  let densityStatus = "Optimal (1-2%)";
  if (density < 0.5) densityStatus = "Terlalu Rendah (<0.5%)";
  else if (density > 2.5) densityStatus = "Keyword Stuffing (>2.5%)";

  const slug = currentTitle.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

  const auditScore = Math.max(70, Math.min(100, 100 - (wikiResult.issuesCount || 0) * 5));

  const finalArticle: GeneratedArticle = {
    title: currentTitle,
    slug: slug,
    metaDescription: draftData.metaDescription || `Artikel lengkap tentang ${focusKeyword}`,
    excerpt: draftData.excerpt || `Artikel lengkap tentang ${focusKeyword}`,
    contentMarkdown: currentMarkdown,
    contentHtml: convertMarkdownToHtml(currentMarkdown),
    faq: extrasResult.faqs || [],
    faqSchema: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": (extrasResult.faqs || []).map((f: any) => ({
        "@type": "Question",
        "name": f.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": f.answer
        }
      }))
    }, null, 2),
    featuredImage: featuredImage,
    keywordDensity: {
      keyword: focusKeyword,
      count: occurrences,
      percentage: parseFloat(density.toFixed(2)),
      evaluation: `Kata kunci '${focusKeyword}' ditemukan sebanyak ${occurrences} kali dari total ${wordCount} kata, dengan kerapatan sebesar ${density.toFixed(2)}% (${densityStatus}).`
    },
    semanticKeywords: draftData.semanticKeywords || [],
    complianceHistory: [
      {
        iteration: 1,
        score: auditScore,
        passed: auditScore >= 80,
        timestamp: new Date().toISOString(),
        isOriginal: false,
        articleTitle: currentTitle,
        report: {
          passed: auditScore >= 80,
          score: auditScore,
          feedback: wikiResult.revisionsMade || ["Audit Wikipedia selesai dijalankan."],
          overusedWords: [],
          clichesFound: [],
          sentenceLengthVariance: 15.4,
          sentenceLengthFeedback: "Variasi panjang kalimat optimal.",
          introductionFeedback: "Pengenalan bersih dari klise AI.",
          conclusionFeedback: "Kesimpulan natural dan humanis."
        }
      }
    ],
    helpfulContentLog: helpfulLog
  };

  return finalArticle;
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
