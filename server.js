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
import nodemailer from "nodemailer";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = parseInt(process.env.PORT || "3000", 10);
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this";
if (!process.env.JWT_SECRET && process.env.NODE_ENV === "production") {
    console.error("❌ FATAL: JWT_SECRET environment variable is not set. Refusing to start in production with a default secret.");
    process.exit(1);
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
      source TEXT,
      custom_data TEXT,
      status TEXT DEFAULT 'new',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS page_state (
      id TEXT PRIMARY KEY,
      draft_json TEXT,
      published_json TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS visitors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ip_address TEXT,
      user_agent TEXT,
      device_type TEXT,
      browser TEXT,
      os TEXT,
      path TEXT,
      visit_time DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS forms (
      id TEXT PRIMARY KEY,
      name TEXT,
      fields_json TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
    // Initialize page state if empty
    const pageState = await db.get("SELECT * FROM page_state WHERE id = 'home'");
    if (!pageState) {
        await db.run("INSERT INTO page_state (id, draft_json, published_json) VALUES (?, ?, ?)", ["home", "{}", "{}"]);
    }
    // Migration: Add preferred_date and preferred_time if they don't exist
    const tableInfo = await db.all("PRAGMA table_info(leads)");
    const hasPreferredDate = tableInfo.some(col => col.name === 'preferred_date');
    if (!hasPreferredDate) {
        await db.exec("ALTER TABLE leads ADD COLUMN preferred_date TEXT");
        await db.exec("ALTER TABLE leads ADD COLUMN preferred_time TEXT");
        console.log("[MIGRATE] Added preferred_date and preferred_time to leads table");
    }
    // Migration: Add source and custom_data if they don't exist
    const hasSource = tableInfo.some(col => col.name === 'source');
    if (!hasSource) {
        await db.exec("ALTER TABLE leads ADD COLUMN source TEXT DEFAULT 'unknown'");
    }
    // Migration: Add custom_data column to leads for dynamic form builder
    const hasCustomData = tableInfo.some(col => col.name === 'custom_data');
    if (!hasCustomData) {
        await db.exec("ALTER TABLE leads ADD COLUMN custom_data TEXT DEFAULT '{}'");
    }
    // Admin User Seeding Configuration
    const adminUsername = process.env.ADMIN_USER || "admin";
    const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
    const admin = await db.get("SELECT * FROM users WHERE username = ?", [adminUsername]);
    if (!admin) {
        console.log(`[SEED] Creating default admin user: ${adminUsername}`);
        const defaultHashedPassword = await bcrypt.hash(adminPassword, 10);
        await db.run("INSERT INTO users (username, password) VALUES (?, ?)", [adminUsername, defaultHashedPassword]);
    }
    else {
        // Only update the password if ADMIN_PASSWORD is explicitly set in the environment
        // This prevents dev server restarts from overwriting manually changed passwords
        if (process.env.ADMIN_PASSWORD) {
            console.log(`[SEED] Admin user exists, updating password from ADMIN_PASSWORD env variable`);
            const defaultHashedPassword = await bcrypt.hash(adminPassword, 10);
            await db.run("UPDATE users SET password = ? WHERE username = ?", [defaultHashedPassword, adminUsername]);
        }
        else {
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
            if (!fs.existsSync(dir))
                fs.mkdirSync(dir);
            cb(null, dir);
        },
        filename: (req, file, cb) => {
            cb(null, Date.now() + "-" + file.originalname);
        }
    });
    const allowedMimeTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
        'video/mp4', 'video/webm', 'video/quicktime'
    ];
    const upload = multer({
        storage,
        limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
        fileFilter: (req, file, cb) => {
            if (allowedMimeTypes.includes(file.mimetype)) {
                cb(null, true);
            }
            else {
                cb(new Error(`File type ${file.mimetype} is not allowed. Only images and videos are accepted.`));
            }
        }
    });
    // Auth Middleware
    const authenticate = (req, res, next) => {
        let token = req.cookies.token;
        // Fallback to Authorization header
        if (!token && req.headers.authorization) {
            const parts = req.headers.authorization.split(' ');
            if (parts.length === 2 && parts[0] === 'Bearer') {
                token = parts[1];
            }
        }
        if (!token)
            return res.status(401).json({ error: "Unauthorized" });
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            req.user = decoded;
            next();
        }
        catch (err) {
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
            }
            else {
                console.log(`[AUTH] Password mismatch for: "${username}"`);
                res.status(401).json({ error: "Invalid credentials" });
            }
        }
        catch (error) {
            console.error(`[AUTH] Error during login:`, error);
            res.status(500).json({ error: "Internal server error" });
        }
    });
    app.post("/api/auth/logout", (req, res) => {
        console.log("Logout requested");
        res.clearCookie("token", { httpOnly: true, secure: true, sameSite: "none" });
        res.json({ message: "Logged out" });
    });
    app.get("/api/auth/me", authenticate, (req, res) => {
        console.log(`Auth check for: ${req.user.username}`);
        res.json(req.user);
    });
    app.post("/api/auth/change-password", authenticate, async (req, res) => {
        const { currentPassword, newPassword } = req.body;
        const user = await db.get("SELECT * FROM users WHERE id = ?", [req.user.id]);
        if (user && await bcrypt.compare(currentPassword, user.password)) {
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            await db.run("UPDATE users SET password = ? WHERE id = ?", [hashedPassword, req.user.id]);
            res.json({ message: "Password updated successfully" });
        }
        else {
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
        await db.run("INSERT OR REPLACE INTO sections (id, title, content, order_index, is_visible, config) VALUES (?, ?, ?, ?, ?, ?)", [id, title, JSON.stringify(content), order_index, is_visible ? 1 : 0, JSON.stringify(config)]);
        res.json({ message: "Section updated" });
    });
    app.delete("/api/sections/:id", authenticate, async (req, res) => {
        await db.run("DELETE FROM sections WHERE id = ?", [req.params.id]);
        res.json({ message: "Section deleted" });
    });
    // Forms Builder
    app.get("/api/forms", async (req, res) => {
        try {
            const forms = await db.all("SELECT * FROM forms");
            res.json(forms.map(f => ({ ...f, fields_json: JSON.parse(f.fields_json || "[]") })));
        }
        catch (err) {
            console.error("Error fetching forms:", err);
            res.status(500).json({ error: "Failed to fetch forms" });
        }
    });
    app.put("/api/forms/:id", authenticate, async (req, res) => {
        try {
            const { name, fields_json } = req.body;
            const { id } = req.params;
            await db.run("INSERT OR REPLACE INTO forms (id, name, fields_json, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)", [id, name || id, JSON.stringify(fields_json || [])]);
            res.json({ message: "Form updated successfully" });
        }
        catch (err) {
            console.error("Error updating form:", err);
            res.status(500).json({ error: "Failed to save form" });
        }
    });
    // Leads
    app.get("/api/leads", authenticate, async (req, res) => {
        const leads = await db.all("SELECT * FROM leads ORDER BY created_at DESC");
        res.json(leads);
    });
    app.post("/api/leads", leadsLimiter, async (req, res) => {
        const { name, phone, email, location, service_type, message, preferred_date, preferred_time, source, ...rest } = req.body;
        // Store all unpredictable ad-hoc dynamic fields as a JSON string
        const custom_data = Object.keys(rest).length > 0 ? JSON.stringify(rest) : "{}";
        await db.run("INSERT INTO leads (name, phone, email, location, service_type, message, preferred_date, preferred_time, source, custom_data) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [name, phone, email, location, service_type, message, preferred_date, preferred_time, source || 'unknown', custom_data]);
        res.json({ message: "Lead saved" });
        // Fire & Forget Email Notification (runs asynchronously so the user doesn't wait)
        (async () => {
            try {
                const rows = await db.all("SELECT * FROM settings");
                const settings = rows.reduce((acc, row) => ({ ...acc, [row.key]: row.value }), {});
                if (settings.notificationEmail && settings.smtpHost && settings.smtpUser && settings.smtpPassword) {
                    const transporter = nodemailer.createTransport({
                        host: settings.smtpHost,
                        port: parseInt(settings.smtpPort || '465', 10),
                        secure: settings.smtpPort === '465', // true for 465, false for other ports
                        auth: {
                            user: settings.smtpUser,
                            pass: settings.smtpPassword,
                        },
                    });
                    // Unpack custom data for nice formatting in the email
                    let customFieldsHtml = '';
                    const parsedCustom = JSON.parse(custom_data);
                    if (Object.keys(parsedCustom).length > 0) {
                        customFieldsHtml = `
              <h3 style="color: #475569; border-bottom: 2px solid #e2e8f0; padding-bottom: 5px; margin-top: 20px;">Additional Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                ${Object.entries(parsedCustom).map(([k, v]) => `
                  <tr>
                    <td style="padding: 8px 0; font-weight: bold; width: 40%; color: #64748b; text-transform: capitalize;">${k.replace(/_/g, ' ')}</td>
                    <td style="padding: 8px 0; color: #0f172a;">${v || '-'}</td>
                  </tr>
                `).join('')}
              </table>
            `;
                    }
                    const mailOptions = {
                        from: `"${settings.siteName || 'Website Forms'}" <${settings.smtpUser}>`,
                        to: settings.notificationEmail,
                        subject: `🌟 New Lead: ${name} - ${service_type || 'General Inquiry'}`,
                        html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc; border-radius: 12px;">
                <h2 style="color: #2563eb; margin-top: 0;">New Website Lead Received</h2>
                
                <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 20px;">
                  <h3 style="color: #475569; border-bottom: 2px solid #e2e8f0; padding-bottom: 5px; margin-top: 0;">Contact Information</h3>
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr><td style="padding: 8px 0; font-weight: bold; width: 40%; color: #64748b;">Name:</td><td style="padding: 8px 0; color: #0f172a;">${name}</td></tr>
                    <tr><td style="padding: 8px 0; font-weight: bold; width: 40%; color: #64748b;">Phone:</td><td style="padding: 8px 0; color: #0f172a;"><a href="tel:${phone}">${phone}</a></td></tr>
                    <tr><td style="padding: 8px 0; font-weight: bold; width: 40%; color: #64748b;">Email:</td><td style="padding: 8px 0; color: #0f172a;">${email || '-'}</td></tr>
                    <tr><td style="padding: 8px 0; font-weight: bold; width: 40%; color: #64748b;">Location:</td><td style="padding: 8px 0; color: #0f172a;">${location}</td></tr>
                  </table>

                  <h3 style="color: #475569; border-bottom: 2px solid #e2e8f0; padding-bottom: 5px; margin-top: 20px;">Inquiry Details</h3>
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr><td style="padding: 8px 0; font-weight: bold; width: 40%; color: #64748b;">Service Type:</td><td style="padding: 8px 0; color: #2563eb; font-weight: bold;">${service_type || 'General'}</td></tr>
                    <tr><td style="padding: 8px 0; font-weight: bold; width: 40%; color: #64748b;">Source Form:</td><td style="padding: 8px 0; color: #0f172a;">${source || 'Unknown'}</td></tr>
                    <tr><td style="padding: 8px 0; font-weight: bold; width: 40%; color: #64748b;">Preference:</td><td style="padding: 8px 0; color: #0f172a;">${preferred_date || 'Any Date'} at ${preferred_time || 'Any Time'}</td></tr>
                  </table>

                  ${customFieldsHtml}

                  ${message ? `
                  <h3 style="color: #475569; border-bottom: 2px solid #e2e8f0; padding-bottom: 5px; margin-top: 20px;">Customer Message</h3>
                  <div style="background-color: #f1f5f9; padding: 15px; border-radius: 8px; color: #334155; font-style: italic;">
                    "${message}"
                  </div>
                  ` : ''}
                </div>
                
                <div style="text-align: center;">
                  <a href="${settings.siteUrl || 'https://acgoa.com'}/admin" style="display: inline-block; background-color: #0f172a; color: #ffffff; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 8px;">View in CRM</a>
                </div>
              </div>
            `
                    };
                    await transporter.sendMail(mailOptions);
                    console.log(`[EMAIL] Successfully sent lead notification to ${settings.notificationEmail}`);
                }
            }
            catch (err) {
                console.error("[EMAIL] Failed to send lead notification email:", err);
            }
        })();
        // Fire & Forget: Google Sheets Integration
        (async () => {
            try {
                const rows = await db.all("SELECT * FROM settings");
                const settings = rows.reduce((acc, row) => ({ ...acc, [row.key]: row.value }), {});
                if (settings.googleSheetWebhookUrl) {
                    const sheetData = {
                        name: name || '',
                        phone: phone || '',
                        email: email || '',
                        location: location || '',
                        service_type: service_type || '',
                        source: source || 'unknown',
                        message: message || '',
                        preferred_date: preferred_date || '',
                        preferred_time: preferred_time || '',
                        date: new Date().toISOString(),
                        ...JSON.parse(custom_data)
                    };
                    const response = await fetch(settings.googleSheetWebhookUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(sheetData),
                    });
                    console.log(`[SHEETS] Lead sent to Google Sheet, status: ${response.status}`);
                }
            }
            catch (err) {
                console.error("[SHEETS] Failed to send lead to Google Sheets:", err);
            }
        })();
        // Fire & Forget: WhatsApp Notification
        (async () => {
            try {
                const rows = await db.all("SELECT * FROM settings");
                const settings = rows.reduce((acc, row) => ({ ...acc, [row.key]: row.value }), {});
                if (settings.whatsappApiUrl && settings.whatsappNotifyNumber) {
                    // Use WhatsApp Business API / Green API for automated sending
                    const waMessage = `🌟 *New Lead Received*\n\n👤 *Name:* ${name}\n📞 *Phone:* ${phone}\n📧 *Email:* ${email || 'N/A'}\n📍 *Location:* ${location || 'N/A'}\n🔧 *Service:* ${service_type || 'General'}\n📋 *Source:* ${source || 'Unknown'}\n💬 *Message:* ${message || 'None'}\n📅 *Date:* ${preferred_date || 'Any'} at ${preferred_time || 'Any'}`;
                    const response = await fetch(settings.whatsappApiUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            chatId: `${settings.whatsappNotifyNumber}@c.us`,
                            message: waMessage,
                        }),
                    });
                    console.log(`[WHATSAPP] Lead notification sent, status: ${response.status}`);
                }
                else if (settings.whatsappNotifyNumber) {
                    // Just log the WhatsApp link — will be shown in lead management UI
                    console.log(`[WHATSAPP] Lead WhatsApp link available for ${settings.whatsappNotifyNumber}`);
                }
            }
            catch (err) {
                console.error("[WHATSAPP] Failed to send WhatsApp notification:", err);
            }
        })();
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
        }
        catch (error) {
            console.error("Error reverse geocoding on server:", error);
            res.status(500).json({ location: `${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)}` });
        }
    });
    // Visitor Tracking
    app.post("/api/track", async (req, res) => {
        const { user_agent, device_type, browser, os, path: visitPath } = req.body;
        // Basic IP extraction 
        const ip_address = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
        try {
            // Prevent rapid duplicate logging from the same IP within a 5-minute window
            const recentVisit = await db.get("SELECT id FROM visitors WHERE ip_address = ? AND path = ? AND visit_time > datetime('now', '-5 minutes')", [ip_address, visitPath]);
            if (!recentVisit) {
                await db.run("INSERT INTO visitors (ip_address, user_agent, device_type, browser, os, path) VALUES (?, ?, ?, ?, ?, ?)", [ip_address, user_agent || 'unknown', device_type || 'unknown', browser || 'unknown', os || 'unknown', visitPath || '/']);
            }
            res.status(200).json({ success: true });
        }
        catch (error) {
            console.error("Tracking Error:", error);
            // Fail silently to not disrupt the user
            res.status(500).json({ success: false });
        }
    });
    app.get("/api/visitors", authenticate, async (req, res) => {
        try {
            const visitors = await db.all("SELECT * FROM visitors ORDER BY visit_time DESC LIMIT 100");
            const stats = await db.get(`
        SELECT 
          COUNT(*) as total_visits,
          COUNT(DISTINCT ip_address) as unique_visitors,
          SUM(CASE WHEN visit_time > datetime('now', '-24 hours') THEN 1 ELSE 0 END) as visits_today
        FROM visitors
      `);
            res.json({ visitors, stats });
        }
        catch (error) {
            console.error("Error fetching visitors:", error);
            res.status(500).json({ error: "Failed to fetch visitor data" });
        }
    });
    // Media Upload
    app.post("/api/upload", authenticate, upload.single("file"), (req, res) => {
        if (!req.file)
            return res.status(400).json({ error: "No file uploaded" });
        // Use an API route to bypass Hostinger Nginx intercepting static file extensions
        res.json({ url: `/api/media?f=${req.file.filename}` });
    });
    // Dynamic Media Server to bypass Hostinger Nginx static file intercepts
    app.get("/api/media", (req, res) => {
        const filename = req.query.f;
        if (!filename)
            return res.status(400).send("No file specified");
        const filepath = path.join(__dirname, "uploads", filename);
        if (!fs.existsSync(filepath))
            return res.status(404).send("File not found");
        res.sendFile(filepath);
    });
    // Media Library — List all uploaded files
    app.get("/api/media/list", authenticate, (req, res) => {
        const uploadsDir = path.join(__dirname, "uploads");
        if (!fs.existsSync(uploadsDir)) return res.json([]);
        try {
            const files = fs.readdirSync(uploadsDir).map(name => {
                const stat = fs.statSync(path.join(uploadsDir, name));
                return {
                    name,
                    url: `/api/media?f=${name}`,
                    size: stat.size,
                    modified: stat.mtime,
                    isVideo: /\.(mp4|webm|mov)$/i.test(name)
                };
            }).sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime());
            res.json(files);
        } catch (err) {
            console.error("Error listing media:", err);
            res.status(500).json({ error: "Failed to list media files" });
        }
    });
    // Media Library — Delete a file
    app.delete("/api/media/:filename", authenticate, (req, res) => {
        const filename = req.params.filename;
        const filepath = path.join(__dirname, "uploads", filename);
        if (!fs.existsSync(filepath)) return res.status(404).json({ error: "File not found" });
        try {
            fs.unlinkSync(filepath);
            res.json({ message: "File deleted" });
        } catch (err) {
            console.error("Error deleting media:", err);
            res.status(500).json({ error: "Failed to delete file" });
        }
    });
    // Builder Endpoints
    app.get("/api/builder/page/:id", async (req, res) => {
        const page = await db.get("SELECT * FROM page_state WHERE id = ?", [req.params.id]);
        if (!page)
            return res.status(404).json({ error: "Page not found" });
        res.json({
            draft: JSON.parse(page.draft_json || "{}"),
            published: JSON.parse(page.published_json || "{}")
        });
    });
    app.post("/api/builder/save/:id", authenticate, async (req, res) => {
        const { draft_json } = req.body;
        await db.run("UPDATE page_state SET draft_json = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [JSON.stringify(draft_json), req.params.id]);
        res.json({ message: "Draft saved" });
    });
    app.post("/api/builder/publish/:id", authenticate, async (req, res) => {
        const page = await db.get("SELECT * FROM page_state WHERE id = ?", [req.params.id]);
        if (!page)
            return res.status(404).json({ error: "Page not found" });
        await db.run("UPDATE page_state SET published_json = draft_json, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [req.params.id]);
        res.json({ message: "Page published" });
    });
    // Vite middleware for development
    if (process.env.NODE_ENV !== "production") {
        const vite = await createViteServer({
            server: { middlewareMode: true },
            appType: "spa",
        });
        app.use(vite.middlewares);
    }
    else {
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
