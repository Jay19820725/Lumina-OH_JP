import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import pg from "pg";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { WORDS, IMAGES } from "./src/core/cards.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool } = pg;

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Database setup with robust fallback for empty env vars
  const rawDbUrl = process.env.DATABASE_URL;
  const isValidDbUrl = (url: string | undefined): boolean => {
    if (!url || typeof url !== 'string' || url.trim() === "" || url === "undefined" || url === "null") return false;
    try {
      // Basic check for protocol
      if (!url.startsWith("postgresql://") && !url.startsWith("postgres://")) return false;
      // Try parsing it
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  };

  const connectionString = isValidDbUrl(rawDbUrl) 
    ? rawDbUrl! 
    : "postgresql://root:jQil9CxX8056ezb3INBHn4oLa7Mu2Ym1@tpe1.clusters.zeabur.com:27703/zeabur";

  console.log("Using database connection string (masked):", connectionString.replace(/:[^:@]+@/, ":****@"));

  const pool = new Pool({
    connectionString,
    ssl: false  // Zeabur PostgreSQL doesn't support SSL
  });

  // Initialize database tables
  try {
    const client = await pool.connect();
    console.log("Connected to PostgreSQL");
    
    await client.query(`
      CREATE EXTENSION IF NOT EXISTS pgcrypto;

      -- Users table
      CREATE TABLE IF NOT EXISTS users (
        uid TEXT PRIMARY KEY,
        email TEXT,
        display_name TEXT,
        photo_url TEXT,
        role TEXT DEFAULT 'free_member',
        register_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        subscription_status TEXT DEFAULT 'none',
        last_login TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- Ensure columns exist if table was created earlier
      DO $$ 
      BEGIN 
        BEGIN
          ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'free_member';
        EXCEPTION
          WHEN duplicate_column THEN NULL;
        END;
        BEGIN
          ALTER TABLE users ADD COLUMN subscription_status TEXT DEFAULT 'none';
        EXCEPTION
          WHEN duplicate_column THEN NULL;
        END;
        BEGIN
          ALTER TABLE users ADD COLUMN settings JSONB DEFAULT '{"daily_reminder": false, "dark_mode": false, "newsletter": false}';
        EXCEPTION
          WHEN duplicate_column THEN NULL;
        END;
      END $$;

      -- Energy Journal table
      CREATE TABLE IF NOT EXISTS energy_journal (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
        emotion_tag TEXT NOT NULL,
        insight TEXT NOT NULL,
        intention TEXT NOT NULL,
        date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- Sessions table
      CREATE TABLE IF NOT EXISTS sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
        session_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        image_cards JSONB DEFAULT '[]',
        word_cards JSONB DEFAULT '[]',
        pairs JSONB DEFAULT '[]',
        association_text JSONB DEFAULT '[]'
      );

      -- Image Cards table
      CREATE TABLE IF NOT EXISTS cards_image (
        id TEXT PRIMARY KEY,
        image_url TEXT NOT NULL,
        description TEXT,
        elements JSONB DEFAULT '{"wood": 0, "fire": 0, "earth": 0, "metal": 0, "water": 0}'
      );

      -- Word Cards table
      CREATE TABLE IF NOT EXISTS cards_word (
        id TEXT PRIMARY KEY,
        text TEXT NOT NULL,
        image_url TEXT,
        description TEXT,
        elements JSONB DEFAULT '{"wood": 0, "fire": 0, "earth": 0, "metal": 0, "water": 0}'
      );

      -- AI Prompts table (Modular & Bilingual)
      DROP TABLE IF EXISTS ai_prompts;
      CREATE TABLE IF NOT EXISTS ai_prompts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        module_name TEXT NOT NULL,
        content_zh TEXT,
        content_ja TEXT,
        category TEXT DEFAULT 'core', -- 'core', 'scenario', 'format'
        status TEXT DEFAULT 'draft',
        version TEXT DEFAULT '1.0.0',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- Manifestations table
      CREATE TABLE IF NOT EXISTS manifestations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
        wish_title TEXT NOT NULL,
        deadline TIMESTAMP WITH TIME ZONE NOT NULL,
        deadline_option TEXT NOT NULL,
        status TEXT DEFAULT 'active',
        reminder_sent BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- Energy Reports table (Added lang for isolation)
      CREATE TABLE IF NOT EXISTS energy_reports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT, -- Indexed but not strictly constrained to allow guest/sync-delay saves
        lang TEXT DEFAULT 'zh', -- Added for language isolation
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        is_ai_complete BOOLEAN DEFAULT FALSE,
        dominant_element TEXT,
        weak_element TEXT,
        balance_score FLOAT,
        today_theme TEXT,
        share_thumbnail TEXT,
        report_data JSONB DEFAULT '{}' -- Stores all other complex data (pairs, scores, interpretations)
      );

      -- Ensure lang column exists if table was already created
      ALTER TABLE energy_reports ADD COLUMN IF NOT EXISTS lang TEXT DEFAULT 'zh';

      CREATE INDEX IF NOT EXISTS idx_reports_user_id ON energy_reports(user_id);
      CREATE INDEX IF NOT EXISTS idx_reports_timestamp ON energy_reports(timestamp DESC);

      -- Site Settings table
      CREATE TABLE IF NOT EXISTS site_settings (
        key TEXT PRIMARY KEY,
        value JSONB NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- Initialize default SEO settings if not exists
      INSERT INTO site_settings (key, value)
      VALUES ('seo', '{
        "title": "EUNIE 嶼妳 | 懂妳的能量，平衡妳的生活",
        "description": "透過五行能量卡片，探索內在自我，獲得每日心靈指引與能量平衡。",
        "keywords": "能量卡片, 五行, 心靈導引, 冥想, 自我探索",
        "og_image": "https://picsum.photos/seed/lumina-og/1200/630",
        "google_analytics_id": "",
        "search_console_id": "",
        "index_enabled": true
      }')
      ON CONFLICT (key) DO NOTHING;

      INSERT INTO site_settings (key, value)
      VALUES ('fonts', '{
        "zh": {
          "display": {
            "url": "https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@500;700&display=swap",
            "family": "Noto Serif TC, serif"
          },
          "body": {
            "url": "https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500&display=swap",
            "family": "Noto Sans TC, sans-serif"
          }
        },
        "ja": {
          "display": {
            "url": "https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@500;700&display=swap",
            "family": "Shippori Mincho, serif"
          },
          "body": {
            "url": "https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500&display=swap",
            "family": "Noto Sans JP, sans-serif"
          }
        }
      }')
      ON CONFLICT (key) DO NOTHING;
    `);
    client.release();
    console.log("Database tables initialized");

    // Auto-seed cards if empty
    const imageCount = await pool.query("SELECT COUNT(*) FROM cards_image");
    if (parseInt(imageCount.rows[0].count) === 0) {
      console.log("Seeding image cards...");
      for (const img of IMAGES) {
        const idStr = img.id.toString().padStart(2, '0');
        await pool.query(
          `INSERT INTO cards_image (id, image_url, description, elements) 
           VALUES ($1, $2, $3, $4)`,
          [`img_${idStr}`, `https://firebasestorage.googleapis.com/v0/b/lumina-oh-jp.firebasestorage.app/o/oh-cards%2Fimg_${idStr}.jpeg?alt=media`, img.description || '', JSON.stringify({ wood: 20, fire: 20, earth: 20, metal: 20, water: 20 })]
        );
      }
      console.log("Image cards seeded");
    }

    const wordCount = await pool.query("SELECT COUNT(*) FROM cards_word");
    if (parseInt(wordCount.rows[0].count) === 0) {
      console.log("Seeding word cards...");
      for (const word of WORDS) {
        const idStr = word.id.toString().padStart(2, '0');
        await pool.query(
          `INSERT INTO cards_word (id, text, image_url, description, elements) 
           VALUES ($1, $2, $3, $4, $5)`,
          [`word_${idStr}`, word.text || '', `https://firebasestorage.googleapis.com/v0/b/lumina-oh-jp.firebasestorage.app/o/oh-cards%2Fword_${idStr}.jpeg?alt=media`, '', JSON.stringify({ wood: word.wood || 0, fire: word.fire || 0, earth: word.earth || 0, metal: word.metal || 0, water: word.water || 0 })]
        );
      }
      console.log("Word cards seeded");
    }

    // Auto-seed default prompts if empty
    const promptCount = await pool.query("SELECT COUNT(*) FROM ai_prompts");
    if (parseInt(promptCount.rows[0].count) === 0) {
      console.log("Seeding default prompts...");
      
      const defaultPrompts = [
        {
          module_name: 'persona',
          category: 'core',
          status: 'active',
          content_zh: '妳是一位溫柔且具備空靈氣質的現代女性心理引導師，名字叫 EUNIE。妳擅長透過五行能量與 OH 卡來引導用戶探索內在。妳的語氣充滿詩意，稱呼用戶為「妳」。',
          content_ja: 'あなたは優雅で神秘的な雰囲気を持つ現代女性の心理カウンセラー、EUNIE（エウニ）です。五行エネルギーとOHカードを通じて、相談者の内面を優しく導きます。詩的な表現を使い、相談者を「あなた」と呼びます。'
        },
        {
          module_name: 'knowledge',
          category: 'core',
          status: 'active',
          content_zh: '妳精通五行（木、火、土、金、水）的平衡理論。木代表生長與創意，火代表熱情與行動，土代表穩定與包容，金代表秩序與收斂，水代表智慧與流動。妳會根據用戶的抽牌結果分析這些能量的消長。',
          content_ja: 'あなたは五行（木、火、土、金、水）のバランス理論に精通しています。木は成長と創造、火は情熱と行動、土は安定と包容、金は秩序と収束、水は知恵と流動を表します。カードの結果に基づき、これらのエネルギーのバランスを分析します。'
        },
        {
          module_name: 'analysis_task',
          category: 'scenario',
          status: 'active',
          content_zh: '請根據用戶選擇的卡片與聯想文字，進行深度的心理引導。妳需要分析卡片中的象徵意義，並給出一段溫暖的建議。最後，妳必須輸出一個 JSON 格式，包含引導文字與能量數值更新。\n\n【用戶抽卡與連想】\n{{USER_DATA}}\n\n【當前五行能量權重】\n{{ENERGY_DATA}}',
          content_ja: '相談者が選んだカードと連想した言葉に基づき、深い心理的ガイダンスを行ってください。カードの象徴的な意味を分析し、温かいアドバイスを伝えます。最後に、ガイダンス文とエネルギー数値の更新を含むJSON形式で出力してください。\n\n【ユーザーデータ】\n{{USER_DATA}}\n\n【現在のエネルギー】\n{{ENERGY_DATA}}'
        },
        {
          module_name: 'format_instruction',
          category: 'format',
          status: 'active',
          content_zh: '妳必須嚴格遵守以下 JSON 輸出格式：{"content": "妳的引導文字", "energyUpdate": {"wood": 數值, "fire": 數值, "earth": 數值, "metal": 數值, "water": 數值}, "todayTheme": "一句話主題"}。數值範圍為 0 到 1。',
          content_ja: '必ず以下のJSON形式で出力してください：{"content": "ガイダンス文", "energyUpdate": {"wood": 数値, "fire": 数値, "earth": 数値, "metal": 数値, "water": 数値}, "todayTheme": "一言テーマ"}。数値の範囲は0から1です。'
        }
      ];

      for (const p of defaultPrompts) {
        await pool.query(
          "INSERT INTO ai_prompts (module_name, category, status, content_zh, content_ja) VALUES ($1, $2, $3, $4, $5)",
          [p.module_name, p.category, p.status, p.content_zh, p.content_ja]
        );
      }
      console.log("Default prompts seeded");
    }
  } catch (err) {
    console.error("Database initialization error:", err);
  }

  app.use((req, res, next) => {
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    next();
  });

  app.use(cors());
  app.use(express.json());

  // Dynamic Meta Injection Middleware for SEO
  app.get(["/", "/report/:id"], async (req, res, next) => {
    const userAgent = req.headers["user-agent"] || "";
    const isCrawler = /facebookexternalhit|line-poker|Twitterbot|googlebot|bingbot|linkedinbot/i.test(userAgent);

    if (!isCrawler) {
      return next();
    }

    try {
      let title = "EUNIE 嶼妳 | 懂妳的能量，平衡妳的生活";
      let description = "透過五行能量卡片，探索內在自我，獲得每日心靈指引與能量平衡。";
      let ogImage = "https://picsum.photos/seed/lumina-og/1200/630";
      const url = `${process.env.APP_URL || 'https://' + req.get('host')}${req.originalUrl}`;

      // Fetch global SEO settings
      const seoResult = await pool.query("SELECT value FROM site_settings WHERE key = 'seo'");
      if (seoResult.rows.length > 0) {
        const seo = seoResult.rows[0].value;
        title = seo.title || title;
        description = seo.description || description;
        ogImage = seo.og_image || ogImage;
      }

      // If it's a report page, fetch report-specific data
      if (req.params.id) {
        const reportResult = await pool.query("SELECT * FROM energy_reports WHERE id = $1", [req.params.id]);
        if (reportResult.rows.length > 0) {
          const report = reportResult.rows[0];
          title = report.today_theme || title;
          // Use selected thumbnail if available, otherwise use dominant element image or default
          ogImage = report.share_thumbnail || ogImage;
          
          // Optional: Add more descriptive text for reports
          description = `這是我在 EUNIE 的能量剖析結果。主導元素：${report.dominant_element}。`;
        }
      }

      const html = `
        <!DOCTYPE html>
        <html lang="zh-TW">
        <head>
          <meta charset="UTF-8">
          <title>${title}</title>
          <meta name="description" content="${description}">
          
          <!-- Open Graph / Facebook / LINE -->
          <meta property="og:type" content="website">
          <meta property="og:url" content="${url}">
          <meta property="og:title" content="${title}">
          <meta property="og:description" content="${description}">
          <meta property="og:image" content="${ogImage}">
          <meta property="og:image:width" content="1200">
          <meta property="og:image:height" content="630">

          <!-- Twitter -->
          <meta property="twitter:card" content="summary_large_image">
          <meta property="twitter:url" content="${url}">
          <meta property="twitter:title" content="${title}">
          <meta property="twitter:description" content="${description}">
          <meta property="twitter:image" content="${ogImage}">

          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <script type="text/javascript">
            window.location.href = "${req.originalUrl}";
          </script>
        </head>
        <body>
          <h1>${title}</h1>
          <p>${description}</p>
          <img src="${ogImage}" alt="Preview Image">
        </body>
        </html>
      `;
      res.send(html);
    } catch (err) {
      console.error("SEO Injection Error:", err);
      next();
    }
  });

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // User API
  app.get(["/api/users/:uid", "/api/users/:uid/"], async (req, res) => {
    const { uid } = req.params;
    try {
      const result = await pool.query("SELECT * FROM users WHERE uid = $1", [uid]);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(result.rows[0]);
    } catch (err) {
      console.error("Error fetching user:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post(["/api/users", "/api/users/"], async (req, res) => {
    const { uid, email, displayName, photoURL, role, subscription_status } = req.body;
    console.log("POST /api/users - Body:", req.body);
    try {
      const result = await pool.query(
        `INSERT INTO users (uid, email, display_name, photo_url, role, subscription_status) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         ON CONFLICT (uid) DO UPDATE SET 
           email = EXCLUDED.email, 
           last_login = CURRENT_TIMESTAMP 
         RETURNING *`,
        [uid, email, displayName, photoURL, role || 'free_member', subscription_status || 'none']
      );
      res.json(result.rows[0]);
    } catch (err) {
      console.error("Error creating/updating user:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post(["/api/users/:uid", "/api/users/:uid/"], async (req, res) => {
    const { uid } = req.params;
    const updates = req.body;
    const fields = Object.keys(updates);
    
    console.log(`POST /api/users/${uid} - Updates:`, updates);
    
    if (fields.length === 0) return res.status(400).json({ error: "No fields to update" });

    const setClause = fields.map((f, i) => {
      const colName = f === 'displayName' ? 'display_name' : f === 'photoURL' ? 'photo_url' : f;
      return `${colName} = $${i + 2}`;
    }).join(", ");
    
    const values = [uid, ...Object.values(updates)];

    try {
      const result = await pool.query(
        `UPDATE users SET ${setClause} WHERE uid = $1 RETURNING *`, 
        values
      );
      
      if (result.rowCount === 0) {
        console.warn(`User with uid ${uid} not found for update`);
        return res.status(404).json({ error: "User not found" });
      }
      
      console.log(`User ${uid} updated successfully:`, result.rows[0]);
      res.json(result.rows[0]);
    } catch (err) {
      console.error("Error updating user:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Journal API
  app.post("/api/journal", async (req, res) => {
    const { user_id, emotion_tag, insight, intention } = req.body;
    try {
      const result = await pool.query(
        "INSERT INTO energy_journal (user_id, emotion_tag, insight, intention) VALUES ($1, $2, $3, $4) RETURNING id",
        [user_id, emotion_tag, insight, intention]
      );
      res.status(201).json({ id: result.rows[0].id });
    } catch (err) {
      console.error("Error adding journal entry:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/journal/:userId", async (req, res) => {
    const { userId } = req.params;
    const limit = req.query.limit || 50;
    try {
      const result = await pool.query(
        "SELECT * FROM energy_journal WHERE user_id = $1 ORDER BY date DESC LIMIT $2",
        [userId, limit]
      );
      res.json(result.rows);
    } catch (err) {
      console.error("Error fetching journal entries:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/journal/:id", async (req, res) => {
    const { id } = req.params;
    try {
      await pool.query("DELETE FROM energy_journal WHERE id = $1", [id]);
      res.status(204).send();
    } catch (err) {
      console.error("Error deleting journal entry:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Sessions API
  app.post("/api/sessions", async (req, res) => {
    const { user_id, image_cards, word_cards } = req.body;
    try {
      const result = await pool.query(
        "INSERT INTO sessions (user_id, image_cards, word_cards) VALUES ($1, $2, $3) RETURNING id",
        [user_id, JSON.stringify(image_cards), JSON.stringify(word_cards)]
      );
      res.status(201).json({ id: result.rows[0].id });
    } catch (err) {
      console.error("Error creating session:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/sessions/:id", async (req, res) => {
    const { id } = req.params;
    const { pairs, association_text } = req.body;
    try {
      await pool.query(
        "UPDATE sessions SET pairs = $1, association_text = $2 WHERE id = $3",
        [JSON.stringify(pairs), JSON.stringify(association_text), id]
      );
      res.json({ success: true });
    } catch (err) {
      console.error("Error updating session:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Cards API
  app.get("/api/cards/image", async (req, res) => {
    try {
      const result = await pool.query("SELECT * FROM cards_image");
      res.json(result.rows);
    } catch (err) {
      console.error("Error fetching image cards:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/cards/word", async (req, res) => {
    try {
      const result = await pool.query("SELECT * FROM cards_word");
      res.json(result.rows);
    } catch (err) {
      console.error("Error fetching word cards:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Manifestations API
  app.get("/api/manifestations/:userId", async (req, res) => {
    const { userId } = req.params;
    try {
      const result = await pool.query(
        "SELECT * FROM manifestations WHERE user_id = $1 ORDER BY created_at DESC",
        [userId]
      );
      res.json(result.rows);
    } catch (err) {
      console.error("Error fetching manifestations:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/manifestations", async (req, res) => {
    const { user_id, wish_title, deadline, deadline_option } = req.body;
    try {
      // Check limit
      const countResult = await pool.query(
        "SELECT count(*) FROM manifestations WHERE user_id = $1 AND status = 'active'",
        [user_id]
      );
      if (parseInt(countResult.rows[0].count) >= 3) {
        return res.status(400).json({ error: "Maximum 3 active wishes allowed" });
      }

      const result = await pool.query(
        "INSERT INTO manifestations (user_id, wish_title, deadline, deadline_option) VALUES ($1, $2, $3, $4) RETURNING id",
        [user_id, wish_title, deadline, deadline_option]
      );
      res.status(201).json({ id: result.rows[0].id });
    } catch (err) {
      console.error("Error creating manifestation:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/manifestations/:id", async (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    const fields = Object.keys(updates);
    const setClause = fields.map((f, i) => `${f} = $${i + 2}`).join(", ");
    const values = [id, ...Object.values(updates)];

    try {
      await pool.query(`UPDATE manifestations SET ${setClause} WHERE id = $1`, values);
      res.json({ success: true });
    } catch (err) {
      console.error("Error updating manifestation:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/report/:id", async (req, res) => {
    const { id } = req.params;
    console.log(`[API] GET /api/report/${id}`);
    try {
      const result = await pool.query("SELECT * FROM energy_reports WHERE id = $1", [id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Report not found" });
      }
      
      const row = result.rows[0];
      const data = row.report_data || {};
      
      // Flatten the structure for the frontend
      const mappedReport = {
        id: row.id,
        userId: row.user_id,
        timestamp: new Date(row.timestamp).getTime(),
        isAiComplete: row.is_ai_complete,
        dominantElement: row.dominant_element,
        weakElement: row.weak_element,
        balanceScore: row.balance_score,
        todayTheme: row.today_theme,
        shareThumbnail: row.share_thumbnail,
        multilingualContent: data.multilingualContent || {},
        ...data
      };
      
      res.json(mappedReport);
    } catch (err) {
      console.error("Error fetching single report:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/reports/:userId", async (req, res) => {
    const { userId } = req.params;
    const { lang } = req.query;
    console.log(`[API] GET /api/reports/${userId} (lang: ${lang})`);
    try {
      // 1. Fetch reports for the requested language
      let query = "SELECT * FROM energy_reports WHERE user_id = $1";
      const params = [userId];
      
      if (typeof lang === 'string') {
        params.push(lang);
        query += ` AND lang = $${params.length}`;
      }
      
      query += " ORDER BY timestamp DESC";
      
      const result = await pool.query(query, params);
      
      const mappedReports = result.rows.map(row => {
        const data = row.report_data || {};
        return {
          id: row.id,
          userId: row.user_id,
          timestamp: new Date(row.timestamp).getTime(),
          isAiComplete: row.is_ai_complete,
          dominantElement: row.dominant_element,
          weakElement: row.weak_element,
          balanceScore: row.balance_score,
          todayTheme: row.today_theme,
          shareThumbnail: row.share_thumbnail,
          ...data
        };
      });

      // 2. Check if reports in other languages exist
      let otherLangCount = 0;
      if (lang) {
        const otherLangResult = await pool.query(
          "SELECT count(*) FROM energy_reports WHERE user_id = $1 AND lang != $2",
          [userId, lang]
        );
        otherLangCount = parseInt(otherLangResult.rows[0].count);
      }
      
      res.json({
        reports: mappedReports,
        hasOtherLang: otherLangCount > 0,
        otherLangCount
      });
    } catch (err) {
      console.error("Error fetching energy reports:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/reports", async (req, res) => {
    const { 
      id, 
      userId, 
      lang,
      dominantElement, 
      weakElement, 
      balanceScore, 
      todayTheme,
      shareThumbnail,
      isAiComplete,
      ...otherData 
    } = req.body;

    console.log(`[API] POST /api/reports - Saving report: ${id || 'NEW'} for: ${userId || 'GUEST'} (lang: ${lang})`);

    try {
      // 1. Ensure user exists if userId is provided (Auto-Sync)
      if (userId) {
        await pool.query(
          "INSERT INTO users (uid, last_login) VALUES ($1, CURRENT_TIMESTAMP) ON CONFLICT (uid) DO UPDATE SET last_login = CURRENT_TIMESTAMP",
          [userId]
        );
      }

      // 2. UPSERT logic: Insert or Update if ID exists
      // If no ID provided, we let the database generate one
      let result;
      if (id) {
        result = await pool.query(
          `INSERT INTO energy_reports (
            id, user_id, lang, dominant_element, weak_element, balance_score, 
            today_theme, share_thumbnail, is_ai_complete, report_data
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          ON CONFLICT (id) DO UPDATE SET
            user_id = COALESCE(EXCLUDED.user_id, energy_reports.user_id),
            lang = COALESCE(EXCLUDED.lang, energy_reports.lang),
            dominant_element = COALESCE(EXCLUDED.dominant_element, energy_reports.dominant_element),
            weak_element = COALESCE(EXCLUDED.weak_element, energy_reports.weak_element),
            balance_score = COALESCE(EXCLUDED.balance_score, energy_reports.balance_score),
            today_theme = COALESCE(EXCLUDED.today_theme, energy_reports.today_theme),
            share_thumbnail = COALESCE(EXCLUDED.share_thumbnail, energy_reports.share_thumbnail),
            is_ai_complete = COALESCE(EXCLUDED.is_ai_complete, energy_reports.is_ai_complete),
            report_data = energy_reports.report_data || EXCLUDED.report_data
          RETURNING *`,
          [id, userId, lang || 'zh', dominantElement, weakElement, balanceScore, todayTheme, shareThumbnail, isAiComplete || false, JSON.stringify(otherData)]
        );
      } else {
        result = await pool.query(
          `INSERT INTO energy_reports (
            user_id, lang, dominant_element, weak_element, balance_score, 
            today_theme, share_thumbnail, is_ai_complete, report_data
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
          [userId, lang || 'zh', dominantElement, weakElement, balanceScore, todayTheme, shareThumbnail, isAiComplete || false, JSON.stringify(otherData)]
        );
      }
      
      if (result.rows.length === 0) {
        throw new Error("Failed to save or update report - no rows returned");
      }

      const row = result.rows[0];
      const data = row.report_data || {};
      res.json({
        id: row.id,
        userId: row.user_id,
        timestamp: new Date(row.timestamp).getTime(),
        isAiComplete: row.is_ai_complete,
        dominantElement: row.dominant_element,
        weakElement: row.weak_element,
        balanceScore: row.balance_score,
        todayTheme: row.today_theme,
        shareThumbnail: row.share_thumbnail,
        ...data
      });
    } catch (err) {
      console.error("[API] Error saving energy report:", err);
      res.status(500).json({ 
        error: "Internal server error", 
        details: String(err),
        message: "Failed to save energy report. Please check server logs."
      });
    }
  });

  app.post("/api/reports/:id/share", async (req, res) => {
    const { id } = req.params;
    const { shareThumbnail } = req.body;
    try {
      await pool.query(
        "UPDATE energy_reports SET share_thumbnail = $1 WHERE id = $2",
        [shareThumbnail, id]
      );
      res.json({ success: true });
    } catch (err) {
      console.error("Error updating share thumbnail:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app.get("/api/admin/stats", async (req, res) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const dauResult = await pool.query("SELECT count(*) FROM users WHERE last_login >= $1", [today]);
      const sessionsResult = await pool.query("SELECT count(*) FROM sessions WHERE session_time >= $1", [today]);
      const newUsersResult = await pool.query("SELECT count(*) FROM users WHERE register_date >= $1", [today]);
      const premiumResult = await pool.query("SELECT count(*) FROM users WHERE subscription_status = 'active'");

      res.json({
        dau: parseInt(dauResult.rows[0].count),
        dailySessions: parseInt(sessionsResult.rows[0].count),
        newUsers: parseInt(newUsersResult.rows[0].count),
        premiumSubscriptions: parseInt(premiumResult.rows[0].count)
      });
    } catch (err) {
      console.error("Error fetching admin stats:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/admin/users", async (req, res) => {
    const limit = req.query.limit || 50;
    try {
      const result = await pool.query("SELECT * FROM users ORDER BY register_date DESC LIMIT $1", [limit]);
      res.json(result.rows);
    } catch (err) {
      console.error("Error fetching all users:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/admin/sessions", async (req, res) => {
    const limit = req.query.limit || 50;
    try {
      const result = await pool.query("SELECT * FROM sessions ORDER BY session_time DESC LIMIT $1", [limit]);
      res.json(result.rows);
    } catch (err) {
      console.error("Error fetching all sessions:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/admin/sessions/drafts", async (req, res) => {
    try {
      const result = await pool.query(
        "DELETE FROM sessions WHERE pairs = '[]' OR pairs IS NULL"
      );
      res.json({ success: true, count: result.rowCount });
    } catch (err) {
      console.error("Error deleting session drafts:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/admin/cards/image", async (req, res) => {
    const { id, image_url, description, elements } = req.body;
    try {
      await pool.query(
        `INSERT INTO cards_image (id, image_url, description, elements) 
         VALUES ($1, $2, $3, $4) 
         ON CONFLICT (id) DO UPDATE SET 
           image_url = EXCLUDED.image_url, 
           description = EXCLUDED.description, 
           elements = EXCLUDED.elements`,
        [id, image_url, description, JSON.stringify(elements)]
      );
      res.json({ success: true });
    } catch (err) {
      console.error("Error saving image card:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/admin/cards/image/:id", async (req, res) => {
    const { id } = req.params;
    try {
      await pool.query("DELETE FROM cards_image WHERE id = $1", [id]);
      res.status(204).send();
    } catch (err) {
      console.error("Error deleting image card:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/admin/cards/word", async (req, res) => {
    const { id, text, image_url, description, elements } = req.body;
    try {
      await pool.query(
        `INSERT INTO cards_word (id, text, image_url, description, elements) 
         VALUES ($1, $2, $3, $4, $5) 
         ON CONFLICT (id) DO UPDATE SET 
           text = EXCLUDED.text, 
           image_url = EXCLUDED.image_url, 
           description = EXCLUDED.description, 
           elements = EXCLUDED.elements`,
        [id, text, image_url, description, JSON.stringify(elements)]
      );
      res.json({ success: true });
    } catch (err) {
      console.error("Error saving word card:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/admin/cards/word/:id", async (req, res) => {
    const { id } = req.params;
    try {
      await pool.query("DELETE FROM cards_word WHERE id = $1", [id]);
      res.status(204).send();
    } catch (err) {
      console.error("Error deleting word card:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/admin/subscriptions", async (req, res) => {
    try {
      const result = await pool.query(
        "SELECT * FROM users WHERE subscription_status != 'none' ORDER BY subscription_status, register_date DESC"
      );
      res.json(result.rows);
    } catch (err) {
      console.error("Error fetching subscriptions:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/admin/prompts", async (req, res) => {
    const { category, status } = req.query;
    try {
      let query = "SELECT * FROM ai_prompts";
      const params = [];
      if (category || status) {
        query += " WHERE";
        if (category) {
          params.push(category);
          query += ` category = $${params.length}`;
        }
        if (status) {
          if (params.length > 0) query += " AND";
          params.push(status);
          query += ` status = $${params.length}`;
        }
      }
      query += " ORDER BY module_name ASC, created_at DESC";
      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (err) {
      console.error("Error fetching prompts:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/admin/prompts", async (req, res) => {
    const { id, module_name, content_zh, content_ja, status, version, category } = req.body;
    try {
      if (id) {
        await pool.query(
          "UPDATE ai_prompts SET module_name = $1, content_zh = $2, content_ja = $3, status = $4, version = $5, category = $6, updated_at = CURRENT_TIMESTAMP WHERE id = $7",
          [module_name, content_zh, content_ja, status, version, category, id]
        );
      } else {
        await pool.query(
          "INSERT INTO ai_prompts (module_name, content_zh, content_ja, status, version, category) VALUES ($1, $2, $3, $4, $5, $6)",
          [module_name, content_zh, content_ja, status, version, category]
        );
      }
      res.json({ success: true });
    } catch (err) {
      console.error("Error saving prompt:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/admin/prompts/:id", async (req, res) => {
    const { id } = req.params;
    try {
      await pool.query("DELETE FROM ai_prompts WHERE id = $1", [id]);
      res.status(204).send();
    } catch (err) {
      console.error("Error deleting prompt:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/admin/prompts/:id/activate", async (req, res) => {
    const { id } = req.params;
    try {
      await pool.query("UPDATE ai_prompts SET status = 'active', updated_at = CURRENT_TIMESTAMP WHERE id = $1", [id]);
      res.json({ success: true });
    } catch (err) {
      console.error("Error activating prompt:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/prompts/active", async (req, res) => {
    const { lang } = req.query;
    const language = lang === 'ja' ? 'ja' : 'zh';
    try {
      // Fetch all active modules
      const result = await pool.query(
        "SELECT module_name, content_zh, content_ja FROM ai_prompts WHERE status = 'active' ORDER BY category ASC, module_name ASC"
      );
      
      if (result.rows.length > 0) {
        // Stitch them together
        const fullPrompt = result.rows.map(row => {
          return language === 'ja' ? row.content_ja : row.content_zh;
        }).join("\n\n");
        
        res.json({ content: fullPrompt });
      } else {
        res.json({ content: "" });
      }
    } catch (err) {
      console.error("Error fetching active prompt:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/admin/analytics", async (req, res) => {
    try {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const usersResult = await pool.query("SELECT * FROM users");
      const sessionsResult = await pool.query("SELECT * FROM sessions WHERE session_time >= $1", [thirtyDaysAgo]);
      const journalsResult = await pool.query("SELECT * FROM energy_journal");

      const allUsers = usersResult.rows;
      const allSessions = sessionsResult.rows;
      const allJournals = journalsResult.rows;

      // Group by date helper
      const groupByDate = (data: any[], dateField: string, days: number) => {
        const result: Record<string, number> = {};
        for (let i = 0; i < days; i++) {
          const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
          const dateStr = d.toISOString().split('T')[0];
          result[dateStr] = 0;
        }
        data.forEach(item => {
          const date = new Date(item[dateField]);
          const dateStr = date.toISOString().split('T')[0];
          if (result[dateStr] !== undefined) result[dateStr]++;
        });
        return Object.entries(result)
          .map(([date, value]) => ({ date, value }))
          .sort((a, b) => a.date.localeCompare(b.date));
      };

      const dauTrend30 = groupByDate(allUsers.filter(u => u.last_login), 'last_login', 30);
      const sessionsTrend30 = groupByDate(allSessions, 'session_time', 30);

      const emotionCounts: Record<string, number> = {};
      allJournals.forEach(j => {
        const emotion = j.emotion_tag || 'unknown';
        emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
      });

      const totalUsers = allUsers.length;
      const premiumUsers = allUsers.filter(u => u.subscription_status === 'active').length;
      const conversionRate = totalUsers > 0 ? (premiumUsers / totalUsers) * 100 : 0;

      const sessionStarted = new Set(allSessions.map(s => s.user_id)).size;
      const sessionCompleted = new Set(allSessions.filter(s => s.pairs && s.pairs.length > 0).map(s => s.user_id)).size;

      res.json({
        metrics: {
          dau: allUsers.filter(u => new Date(u.last_login).toDateString() === now.toDateString()).length,
          totalSessions: allSessions.length,
          premiumConversion: conversionRate.toFixed(1) + '%',
          totalUsers
        },
        trends: {
          sevenDays: dauTrend30.slice(-7).map((d, i) => ({
            date: d.date,
            dau: d.value,
            sessions: sessionsTrend30.slice(-7)[i].value
          })),
          thirtyDays: dauTrend30.map((d, i) => ({
            date: d.date,
            dau: d.value,
            sessions: sessionsTrend30[i].value
          }))
        },
        emotionDistribution: Object.entries(emotionCounts).map(([name, value]) => ({ name, value })),
        funnelData: [
          { name: '註冊用戶', value: totalUsers, fill: '#8BA889' },
          { name: '開始抽卡', value: sessionStarted, fill: '#C4B08B' },
          { name: '完成抽卡', value: sessionCompleted, fill: '#D98B73' },
          { name: '付費會員', value: premiumUsers, fill: '#6B7B8C' },
        ]
      });
    } catch (err) {
      console.error("Error fetching analytics data:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Settings API
  app.get("/api/settings/:key", async (req, res) => {
    const { key } = req.params;
    try {
      const result = await pool.query("SELECT value FROM site_settings WHERE key = $1", [key]);
      if (result.rowCount === 0) {
        // Provide defaults for known keys
        if (key === 'seo') {
          return res.json({
            title: "EUNIE 嶼妳 | 懂妳的能量，平衡妳的生活",
            description: "透過五行能量卡片，探索內在自我，獲得每日心靈指引與能量平衡。",
            keywords: "能量卡片, 五行, 心靈導引, 冥想, 自我探索",
            og_image: "https://picsum.photos/seed/lumina-og/1200/630",
            google_analytics_id: "",
            search_console_id: "",
            index_enabled: true
          });
        }
        if (key === 'fonts') {
          return res.json({
            zh: {
              display: { url: "https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@500;700&display=swap", family: "\"Noto Serif TC\", serif" },
              body: { url: "https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500&display=swap", family: "\"Noto Sans TC\", sans-serif" }
            },
            ja: {
              display: { url: "https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@500;700&display=swap", family: "\"Shippori Mincho\", serif" },
              body: { url: "https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500&display=swap", family: "\"Noto Sans JP\", sans-serif" }
            }
          });
        }
        return res.status(404).json({ error: "Settings not found" });
      }
      res.json(result.rows[0].value);
    } catch (err) {
      console.error(`Error fetching settings ${key}:`, err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/admin/settings/:key", async (req, res) => {
    const { key } = req.params;
    const value = req.body;
    try {
      await pool.query(
        "INSERT INTO site_settings (key, value, updated_at) VALUES ($1, $2, CURRENT_TIMESTAMP) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP",
        [key, JSON.stringify(value)]
      );
      res.json({ success: true });
    } catch (err) {
      console.error(`Error saving settings ${key}:`, err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.join(__dirname, "dist")));
    app.get(/.*/, (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
