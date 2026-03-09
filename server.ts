import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import pg from "pg";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool } = pg;

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Database setup with robust fallback for empty env vars
  const rawDbUrl = process.env.DATABASE_URL;
  const connectionString = (rawDbUrl && rawDbUrl.trim() !== "") 
    ? rawDbUrl 
    : "postgresql://root:jQil9CxX8056ezb3INBHn4oLa7Mu2Ym1@tpe1.clusters.zeabur.com:27703/zeabur";

  const pool = new Pool({
    connectionString,
    ssl: false  // Zeabur PostgreSQL doesn't support SSL
  });

  // Initialize database tables
  try {
    const client = await pool.connect();
    console.log("Connected to PostgreSQL");
    
    await client.query(`
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

      -- AI Prompts table
      CREATE TABLE IF NOT EXISTS ai_prompts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        content TEXT NOT NULL,
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

      -- Energy Reports table
      CREATE TABLE IF NOT EXISTS energy_reports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        selected_image_ids JSONB DEFAULT '[]',
        selected_word_ids JSONB DEFAULT '[]',
        total_scores JSONB DEFAULT '{}',
        dominant_element TEXT,
        weak_element TEXT,
        balance_score FLOAT,
        interpretation TEXT,
        pair_interpretations JSONB DEFAULT '[]',
        pairs JSONB DEFAULT '[]',
        today_theme TEXT,
        card_interpretation TEXT,
        psychological_insight TEXT,
        five_element_analysis TEXT,
        reflection TEXT,
        action_suggestion TEXT
      );

      -- Site Settings table
      CREATE TABLE IF NOT EXISTS site_settings (
        key TEXT PRIMARY KEY,
        value JSONB NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- Initialize default SEO settings if not exists
      INSERT INTO site_settings (key, value)
      VALUES ('seo', '{
        "title": "Lumina | 能量卡片與心靈導引",
        "description": "透過五行能量卡片，探索內在自我，獲得每日心靈指引與能量平衡。",
        "keywords": "能量卡片, 五行, 心靈導引, 冥想, 自我探索",
        "og_image": "https://picsum.photos/seed/lumina-og/1200/630",
        "google_analytics_id": "",
        "search_console_id": "",
        "index_enabled": true
      }')
      ON CONFLICT (key) DO NOTHING;
    `);
    client.release();
    console.log("Database tables initialized");
  } catch (err) {
    console.error("Database initialization error:", err);
  }

  app.use((req, res, next) => {
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    next();
  });

  app.use(cors());
  app.use(express.json());

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
           display_name = EXCLUDED.display_name, 
           photo_url = EXCLUDED.photo_url, 
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

  app.get("/api/reports/:userId", async (req, res) => {
    const { userId } = req.params;
    try {
      const result = await pool.query(
        "SELECT * FROM energy_reports WHERE user_id = $1 ORDER BY timestamp DESC",
        [userId]
      );
      res.json(result.rows);
    } catch (err) {
      console.error("Error fetching energy reports:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/reports", async (req, res) => {
    const { 
      userId, 
      selectedImageIds, 
      selectedWordIds, 
      totalScores, 
      dominant_element, 
      weak_element, 
      balance_score, 
      interpretation, 
      pairInterpretations, 
      pairs,
      todayTheme,
      cardInterpretation,
      psychologicalInsight,
      fiveElementAnalysis,
      reflection,
      actionSuggestion
    } = req.body;
    try {
      const result = await pool.query(
        `INSERT INTO energy_reports (
          user_id, selected_image_ids, selected_word_ids, total_scores, 
          dominant_element, weak_element, balance_score, interpretation, 
          pair_interpretations, pairs, today_theme, card_interpretation, 
          psychological_insight, five_element_analysis, reflection, action_suggestion
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING *`,
        [
          userId, 
          JSON.stringify(selectedImageIds), 
          JSON.stringify(selectedWordIds), 
          JSON.stringify(totalScores), 
          dominant_element, 
          weak_element, 
          balance_score, 
          interpretation, 
          JSON.stringify(pairInterpretations), 
          JSON.stringify(pairs),
          todayTheme,
          cardInterpretation,
          psychologicalInsight,
          fiveElementAnalysis,
          reflection,
          actionSuggestion
        ]
      );
      res.json(result.rows[0]);
    } catch (err) {
      console.error("Error creating energy report:", err);
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
    try {
      const result = await pool.query("SELECT * FROM ai_prompts ORDER BY created_at DESC");
      res.json(result.rows);
    } catch (err) {
      console.error("Error fetching prompts:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/admin/prompts", async (req, res) => {
    const { id, name, content, status, version } = req.body;
    try {
      if (id) {
        await pool.query(
          "UPDATE ai_prompts SET name = $1, content = $2, status = $3, version = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5",
          [name, content, status, version, id]
        );
      } else {
        await pool.query(
          "INSERT INTO ai_prompts (name, content, status, version) VALUES ($1, $2, $3, $4)",
          [name, content, status, version]
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

  app.post("/api/admin/seed", async (req, res) => {
    try {
      const { images, words } = req.body;
      
      // Seed Images
      for (const img of images) {
        const idStr = img.id.toString().padStart(2, '0');
        await pool.query(
          `INSERT INTO cards_image (id, image_url, description, elements) 
           VALUES ($1, $2, $3, $4) 
           ON CONFLICT (id) DO UPDATE SET 
             image_url = EXCLUDED.image_url, 
             description = EXCLUDED.description, 
             elements = EXCLUDED.elements`,
          [`img_${idStr}`, img.imageUrl, img.description || '', JSON.stringify({ wood: 20, fire: 20, earth: 20, metal: 20, water: 20 })]
        );
      }

      // Seed Words
      for (const word of words) {
        const idStr = word.id.toString().padStart(2, '0');
        await pool.query(
          `INSERT INTO cards_word (id, text, image_url, description, elements) 
           VALUES ($1, $2, $3, $4, $5) 
           ON CONFLICT (id) DO UPDATE SET 
             text = EXCLUDED.text, 
             image_url = EXCLUDED.image_url, 
             description = EXCLUDED.description, 
             elements = EXCLUDED.elements`,
          [`word_${idStr}`, word.text || '', word.imageUrl, word.description || '', JSON.stringify({ wood: word.wood || 0, fire: word.fire || 0, earth: word.earth || 0, metal: word.metal || 0, water: word.water || 0 })]
        );
      }

      res.json({ success: true });
    } catch (err) {
      console.error("Error seeding database:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Settings API
  app.get("/api/settings/:key", async (req, res) => {
    const { key } = req.params;
    try {
      const result = await pool.query("SELECT value FROM site_settings WHERE key = $1", [key]);
      if (result.rowCount === 0) return res.status(404).json({ error: "Settings not found" });
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
