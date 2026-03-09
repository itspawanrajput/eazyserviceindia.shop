import express from "express";
import { createServer as createViteServer } from "vite";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import cors from "cors";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import rateLimit from "express-rate-limit";
import { GoogleGenAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.PORT || "3000", 10);
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this";

if (JWT_SECRET === "your-secret-key-change-this" && process.env.NODE_ENV === "production") {
  console.warn("⚠️ WARNING: Using default JWT_SECRET in production. This is highly insecure. Please set the JWT_SECRET environment variable.");
}

async function startServer() {
  const app = express();

  // Database setup
  const db = await open({
    filename: "./database.sqlite",
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS sections (
      id TEXT PRIMARY KEY,
      title TEXT,
      content TEXT,
      order_index INTEGER,
      is_visible INTEGER DEFAULT 1,
      config TEXT
    );

    CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      phone TEXT,
      email TEXT,
      location TEXT,
      service_type TEXT,
      message TEXT,
      preferred_date TEXT,
      preferred_time TEXT,
      status TEXT DEFAULT 'new',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS page_state (
      id TEXT PRIMARY KEY,
      draft_json TEXT,
      published_json TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Initialize page state if empty
  const pageState = await db.get("SELECT * FROM page_state WHERE id = 'home'");
  if (!pageState) {
    await db.run(
      "INSERT INTO page_state (id, draft_json, published_json) VALUES (?, ?, ?)",
      ["home", "{}", "{}"]
    );
  }

  // Migration: Add preferred_date and preferred_time if they don't exist
  const tableInfo = await db.all("PRAGMA table_info(leads)");
  const hasPreferredDate = tableInfo.some(col => col.name === 'preferred_date');
  const hasPreferredTime = tableInfo.some(col => col.name === 'preferred_time');

  if (!hasPreferredDate) {
    await db.exec("ALTER TABLE leads ADD COLUMN preferred_date TEXT");
  }
  if (!hasPreferredTime) {
    await db.exec("ALTER TABLE leads ADD COLUMN preferred_time TEXT");
  }

  // Migration: Add source column if it doesn't exist
  const hasSource = tableInfo.some(col => col.name === 'source');
  if (!hasSource) {
    await db.exec("ALTER TABLE leads ADD COLUMN source TEXT DEFAULT 'unknown'");
  }

  // Admin User Seeding Configuration
  const adminUsername = process.env.ADMIN_USER || "admin";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
  const admin = await db.get("SELECT * FROM users WHERE username = ?", [adminUsername]);

  if (!admin) {
    console.log(`[SEED] Creating default admin user: ${adminUsername}`);
    const defaultHashedPassword = await bcrypt.hash(adminPassword, 10);
    await db.run("INSERT INTO users (username, password) VALUES (?, ?)", [adminUsername, defaultHashedPassword]);
  } else {
    // Only update the password if ADMIN_PASSWORD is explicitly set in the environment
    // This prevents dev server restarts from overwriting manually changed passwords
    if (process.env.ADMIN_PASSWORD) {
      console.log(`[SEED] Admin user exists, updating password from ADMIN_PASSWORD env variable`);
      const defaultHashedPassword = await bcrypt.hash(adminPassword, 10);
      await db.run("UPDATE users SET password = ? WHERE username = ?", [defaultHashedPassword, adminUsername]);
    } else {
      console.log(`[SEED] Admin user exists, keeping existing password`);
    }
  }

  // Rate limiting setup
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // limit each IP to 10 requests per windowMs for auth
    message: { error: "Too many login attempts, please try again after 15 minutes" }
  });

  const leadsLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20, // limit each IP to 20 leads per hour
    message: { error: "Too many lead submissions, please try again later" }
  });

  app.use(cors());
  app.use(express.json());
  app.use(cookieParser());
  app.use("/uploads", express.static(path.join(__dirname, "uploads")));

  // Multer for file uploads
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = "./uploads";
      if (!fs.existsSync(dir)) fs.mkdirSync(dir);
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + "-" + file.originalname);
    }
  });
  const upload = multer({ storage, limits: { fileSize: 100 * 1024 * 1024 } }); // 100MB

  // Auth Middleware
  const authenticate = (req: any, res: any, next: any) => {
    let token = req.cookies.token;

    // Fallback to Authorization header
    if (!token && req.headers.authorization) {
      const parts = req.headers.authorization.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        token = parts[1];
      }
    }

    if (!token) return res.status(401).json({ error: "Unauthorized" });
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch (err) {
      res.status(401).json({ error: "Invalid token" });
    }
  };

  // --- API Routes ---

  // Auth
  app.post("/api/auth/login", authLimiter, async (req, res) => {
    const { username, password } = req.body;
    console.log(`[AUTH] Login attempt for username: "${username}"`);

    try {
      const user = await db.get("SELECT * FROM users WHERE username = ?", [username]);

      if (!user) {
        console.log(`[AUTH] User not found: "${username}"`);
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (isMatch) {
        console.log(`[AUTH] Login successful for: "${username}"`);
        const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: "24h" });

        res.cookie("token", token, {
          httpOnly: true,
          secure: true,
          sameSite: "none",
          maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });

        res.json({
          message: "Logged in",
          token,
          user: { id: user.id, username: user.username }
        });
      } else {
        console.log(`[AUTH] Password mismatch for: "${username}"`);
        res.status(401).json({ error: "Invalid credentials" });
      }
    } catch (error) {
      console.error(`[AUTH] Error during login:`, error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    console.log("Logout requested");
    res.clearCookie("token", { httpOnly: true, secure: true, sameSite: "none" });
    res.json({ message: "Logged out" });
  });

  app.get("/api/auth/me", authenticate, (req: any, res) => {
    console.log(`Auth check for: ${req.user.username}`);
    res.json(req.user);
  });

  app.post("/api/auth/change-password", authenticate, async (req: any, res) => {
    const { currentPassword, newPassword } = req.body;
    const user = await db.get("SELECT * FROM users WHERE id = ?", [req.user.id]);

    if (user && await bcrypt.compare(currentPassword, user.password)) {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await db.run("UPDATE users SET password = ? WHERE id = ?", [hashedPassword, req.user.id]);
      res.json({ message: "Password updated successfully" });
    } else {
      res.status(400).json({ error: "Invalid current password" });
    }
  });

  // Settings
  app.get("/api/settings", async (req, res) => {
    const rows = await db.all("SELECT * FROM settings");
    const settings = rows.reduce((acc, row) => ({ ...acc, [row.key]: row.value }), {});
    res.json(settings);
  });

  app.post("/api/settings", authenticate, async (req, res) => {
    const { settings } = req.body;
    for (const [key, value] of Object.entries(settings)) {
      await db.run("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", [key, value]);
    }
    res.json({ message: "Settings updated" });
  });

  // Sections
  app.get("/api/sections", async (req, res) => {
    const sections = await db.all("SELECT * FROM sections ORDER BY order_index ASC");
    res.json(sections.map(s => ({ ...s, config: JSON.parse(s.config || "{}"), content: JSON.parse(s.content || "[]") })));
  });

  app.post("/api/sections", authenticate, async (req, res) => {
    const { id, title, content, order_index, is_visible, config } = req.body;
    await db.run(
      "INSERT OR REPLACE INTO sections (id, title, content, order_index, is_visible, config) VALUES (?, ?, ?, ?, ?, ?)",
      [id, title, JSON.stringify(content), order_index, is_visible ? 1 : 0, JSON.stringify(config)]
    );
    res.json({ message: "Section updated" });
  });

  app.delete("/api/sections/:id", authenticate, async (req, res) => {
    await db.run("DELETE FROM sections WHERE id = ?", [req.params.id]);
    res.json({ message: "Section deleted" });
  });

  // Leads
  app.get("/api/leads", authenticate, async (req, res) => {
    const leads = await db.all("SELECT * FROM leads ORDER BY created_at DESC");
    res.json(leads);
  });

  app.post("/api/leads", leadsLimiter, async (req, res) => {
    const { name, phone, email, location, service_type, message, preferred_date, preferred_time, source } = req.body;
    await db.run(
      "INSERT INTO leads (name, phone, email, location, service_type, message, preferred_date, preferred_time, source) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [name, phone, email, location, service_type, message, preferred_date, preferred_time, source || 'unknown']
    );
    res.json({ message: "Lead saved" });
  });

  app.patch("/api/leads/:id", authenticate, async (req, res) => {
    const { status } = req.body;
    await db.run("UPDATE leads SET status = ? WHERE id = ?", [status, req.params.id]);
    res.json({ message: "Lead updated" });
  });

  app.delete("/api/leads/:id", authenticate, async (req, res) => {
    await db.run("DELETE FROM leads WHERE id = ?", [req.params.id]);
    res.json({ message: "Lead deleted" });
  });

  // Secure Location Detection
  app.post("/api/location/detect", async (req, res) => {
    const { lat, lng } = req.body;

    if (!lat || !lng) {
      return res.status(400).json({ error: "Latitude and longitude required" });
    }

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `The user is at coordinates ${lat}, ${lng}. 
                  Identify the specific neighborhood or area name in Delhi-NCR (e.g., 'DLF Phase 3, Gurgaon' or 'Sector 18, Noida'). 
                  Return ONLY the name of the area. If it's not close to any, return 'Delhi-NCR'.`,
      });

      const area = response.text?.trim() || "Delhi-NCR";
      res.json({ location: area });
    } catch (error) {
      console.error("Error reverse geocoding on server:", error);
      res.status(500).json({ location: `${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)}` });
    }
  });

  // Media Upload
  app.post("/api/upload", authenticate, upload.single("file"), (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    res.json({ url: `/uploads/${req.file.filename}` });
  });

  // Builder Endpoints
  app.get("/api/builder/page/:id", async (req, res) => {
    const page = await db.get("SELECT * FROM page_state WHERE id = ?", [req.params.id]);
    if (!page) return res.status(404).json({ error: "Page not found" });
    res.json({
      draft: JSON.parse(page.draft_json || "{}"),
      published: JSON.parse(page.published_json || "{}")
    });
  });

  app.post("/api/builder/save/:id", authenticate, async (req, res) => {
    const { draft_json } = req.body;
    await db.run(
      "UPDATE page_state SET draft_json = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [JSON.stringify(draft_json), req.params.id]
    );
    res.json({ message: "Draft saved" });
  });

  app.post("/api/builder/publish/:id", authenticate, async (req, res) => {
    const page = await db.get("SELECT * FROM page_state WHERE id = ?", [req.params.id]);
    if (!page) return res.status(404).json({ error: "Page not found" });

    await db.run(
      "UPDATE page_state SET published_json = draft_json, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [req.params.id]
    );
    res.json({ message: "Page published" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*path", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
