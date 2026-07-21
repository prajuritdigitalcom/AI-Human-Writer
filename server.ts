import express from "express";
import path from "path";
import dotenv from "dotenv";
import { generateSEOArticle } from "./server/gemini";
import { StyleType } from "./src/types";
import { initKnowledgeOnStartup, getStoredKnowledge, refreshWikipediaKnowledge } from "./server/wikipediaKnowledge";
import { initEditorialKnowledgeOnStartup, getStoredEditorialKnowledge, refreshEditorialKnowledge } from "./server/georgeKaoKnowledge";
import { initGoogleHelpfulKnowledgeOnStartup, getStoredGoogleHelpfulKnowledge, refreshGoogleHelpfulKnowledge } from "./server/googleHelpfulKnowledge";


// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Middleware for body parsing
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ limit: "15mb", extended: true }));

// Helper to resolve admin and visitor keys on demand
function resolveAllKeys(visitorKeys: string[] = []): string[] {
  // Prioritize visitor keys if entered by the user
  if (visitorKeys && visitorKeys.length > 0) {
    return visitorKeys;
  }

  // Fallback to Admin keys stored in Vercel Env Variables
  const adminKeys: string[] = [];
  
  if (process.env.GEMINI_API_KEY) {
    adminKeys.push(process.env.GEMINI_API_KEY);
  }

  // Scan for multiple keys GEMINI_KEY_1 up to GEMINI_KEY_50
  for (let i = 1; i <= 50; i++) {
    const key = process.env[`GEMINI_KEY_${i}`];
    if (key) {
      adminKeys.push(key);
    }
  }

  return adminKeys;
}

// API Route for article generation
app.post("/api/generate-article", async (req, res) => {
  const { focusKeyword, style, referenceInfo, imageUrl, internalLinks, visitorKeys } = req.body;

  if (!focusKeyword || !focusKeyword.trim()) {
    return res.status(400).json({ error: "Focus Keyword wajib diisi." });
  }

  try {
    const activeKeys = resolveAllKeys(visitorKeys);
    
    if (activeKeys.length === 0) {
      return res.status(400).json({
        error: "Tidak ada API Key yang terdeteksi. Silakan isi API Key Anda di tab 'Pengaturan API' atau hubungi administrator untuk menyetel GEMINI_API_KEY."
      });
    }

    console.log(`Starting article generation for keyword: "${focusKeyword}" using style: "${style}"...`);
    console.log(`Resolved ${activeKeys.length} potential keys to use (Visitor prioritized).`);

    const articleResult = await generateSEOArticle(
      activeKeys,
      focusKeyword.trim(),
      (style as StyleType) || "SEO Friendly",
      referenceInfo || "",
      imageUrl || "",
      internalLinks || ""
    );

    return res.json(articleResult);
  } catch (error: any) {
    console.error("Endpoint generation error:", error.message || error);
    return res.status(500).json({
      error: error.message || "Terjadi kesalahan internal saat menghasilkan artikel."
    });
  }
});

// Admin status API route to check how many admin keys are loaded (without exposing them)
app.get("/api/admin-status", (req, res) => {
  const adminKeys = resolveAllKeys([]);
  res.json({
    hasAdminKeys: adminKeys.length > 0,
    adminKeysCount: adminKeys.length,
    loadedFrom: {
      GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
      rollingKeysCount: Array.from({ length: 50 }).filter((_, i) => !!process.env[`GEMINI_KEY_${i + 1}`]).length
    }
  });
});

// API Routes for Wikipedia Signs of AI Writing Compliance Knowledge
app.get("/api/knowledge-status", (req, res) => {
  try {
    const knowledge = getStoredKnowledge();
    res.json({ success: true, knowledge });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || "Gagal memuat aturan kepatuhan." });
  }
});

app.post("/api/refresh-knowledge", async (req, res) => {
  const { visitorKeys } = req.body;
  try {
    const activeKeys = resolveAllKeys(visitorKeys);
    if (activeKeys.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Tidak ada API Key aktif untuk memproses pembaruan aturan Wikipedia. Tambahkan API Key di tab Pengaturan API terlebih dahulu."
      });
    }

    console.log("[Wikipedia API] Refreshing Wikipedia Signs of AI Writing compliance rules...");
    const refreshed = await refreshWikipediaKnowledge(activeKeys);
    res.json({ success: true, knowledge: refreshed });
  } catch (err: any) {
    console.error("[Wikipedia API Error] Failed to refresh compliance rules:", err.message || err);
    res.status(500).json({ success: false, error: err.message || "Gagal menyelaraskan aturan dengan Wikipedia." });
  }
});

// API Routes for George Kao Editorial Knowledge Builder
app.get("/api/editorial-status", (req, res) => {
  try {
    const knowledge = getStoredEditorialKnowledge();
    res.json({ success: true, knowledge });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || "Gagal memuat aturan editorial." });
  }
});

app.post("/api/refresh-editorial", async (req, res) => {
  const { visitorKeys } = req.body;
  try {
    const activeKeys = resolveAllKeys(visitorKeys);
    if (activeKeys.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Tidak ada API Key aktif untuk memproses pembaruan aturan George Kao. Tambahkan API Key di tab Pengaturan API terlebih dahulu."
      });
    }

    console.log("[George Kao API] Refreshing George Kao Editorial rules...");
    const refreshed = await refreshEditorialKnowledge(activeKeys);
    res.json({ success: true, knowledge: refreshed });
  } catch (err: any) {
    console.error("[George Kao API Error] Failed to refresh editorial rules:", err.message || err);
    res.status(500).json({ success: false, error: err.message || "Gagal menyelaraskan aturan dengan George Kao Substack." });
  }
});

// API Routes for Google Helpful Content Knowledge Builder
app.get("/api/google-helpful-status", (req, res) => {
  try {
    const knowledge = getStoredGoogleHelpfulKnowledge();
    res.json({ success: true, knowledge });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || "Gagal memuat aturan Google Helpful Content." });
  }
});

app.post("/api/refresh-google-helpful", async (req, res) => {
  const { visitorKeys } = req.body;
  try {
    const activeKeys = resolveAllKeys(visitorKeys);
    if (activeKeys.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Tidak ada API Key aktif untuk memproses pembaruan aturan Google Helpful Content. Tambahkan API Key di tab Pengaturan API terlebih dahulu."
      });
    }

    console.log("[Google Helpful API] Refreshing Google Helpful Content rules...");
    const refreshed = await refreshGoogleHelpfulKnowledge(activeKeys);
    res.json({ success: true, knowledge: refreshed });
  } catch (err: any) {
    console.error("[Google Helpful API Error] Failed to refresh Google Helpful Content rules:", err.message || err);
    res.status(500).json({ success: false, error: err.message || "Gagal menyelaraskan aturan dengan Google Search Central." });
  }
});

async function startServer() {
  // Initialize Wikipedia compliance rules
  console.log("[Wikipedia Knowledge] Initializing Wikipedia Signs of AI Writing Compliance Rules...");
  initKnowledgeOnStartup();

  // Initialize George Kao editorial rules
  console.log("[George Kao Knowledge] Initializing George Kao Editorial Knowledge...");
  initEditorialKnowledgeOnStartup();

  // Initialize Google Helpful Content rules
  console.log("[Google Helpful Knowledge] Initializing Google Helpful Content Knowledge...");
  initGoogleHelpfulKnowledgeOnStartup();


  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in DEVELOPMENT mode with Vite middleware...");
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in PRODUCTION mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  if (process.env.VERCEL !== "1") {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`[AI Human Writer Server] Running on http://localhost:${PORT}`);
    });
  }
}

startServer();

export default app;
