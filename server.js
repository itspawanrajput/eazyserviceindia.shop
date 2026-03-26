import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import mysql from "mysql2/promise";
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
import { execSync } from "child_process";
import sharp from "sharp";
import crypto from "crypto";
import axios from "axios";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOAD_DIR_CONFIG = process.env.UPLOAD_DIR;
// On production (Hostinger), store uploads OUTSIDE the git-deployed folder
// so that Git push deployments never wipe the media.
// Set UPLOAD_DIR=/home/user/persistent_uploads in your .env on Hostinger
let UPLOAD_DIR = UPLOAD_DIR_CONFIG ? path.resolve(process.cwd(), UPLOAD_DIR_CONFIG) : path.join(__dirname, "uploads");
// Basic check for UPLOAD_DIR accessibility
try {
    if (!fs.existsSync(UPLOAD_DIR)) {
        fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }
}
catch (e) {
    console.warn(`[UPLOAD] Configured DIR ${UPLOAD_DIR} not accessible, falling back to local 'uploads'`);
    UPLOAD_DIR = path.join(__dirname, "uploads");
    if (!fs.existsSync(UPLOAD_DIR))
        fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}
// ─── Git Tracker Helper: Syncs DB changes to File System for Git tracking ──
const trackChangeInGit = (filename, data, message) => {
    try {
        const isUpload = filename.startsWith('uploads/');
        const filePath = isUpload ? path.join(__dirname, filename) : path.join(__dirname, "content_tracker", filename);
        // For tracker files, ensure directory exists and write JSON
        if (!isUpload) {
            const contentDir = path.dirname(filePath);
            if (!fs.existsSync(contentDir))
                fs.mkdirSync(contentDir, { recursive: true });
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
        }
        // Only attempt auto-commit if specifically enabled or in dev
        // On Hostinger, this might require git user.name/email and remote token to be set
        try {
            execSync(`git add "${filePath}"`, { cwd: __dirname });
            // We use --allow-empty in case there are no functional changes
            execSync(`git commit -m "Auto-track: ${message}" --allow-empty`, { cwd: __dirname });
            // Auto-push to GitHub so the media is persistent across deployments
            try {
                execSync(`git push origin main`, { cwd: __dirname });
                console.log(`[GIT] Successfully pushed ${filename} to GitHub`);
            }
            catch (pe) {
                console.warn(`[GIT] Push skipped/failed: ${pe.message}`);
            }
            console.log(`[GIT] Tracked change in ${filename}: ${message}`);
        }
        catch (ge) {
            console.warn(`[GIT] Auto-commit skipped (non-critical): ${ge.message}`);
        }
    }
    catch (err) {
        console.error("[GIT] Tracker error:", err);
    }
};
const PORT = parseInt(process.env.PORT || "3000", 10);
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this";
if (!process.env.JWT_SECRET && process.env.NODE_ENV === "production") {
    console.error("❌ FATAL: JWT_SECRET environment variable is not set. Refusing to start in production with a default secret.");
    process.exit(1);
}
async function startServer() {
    const app = express();
    // Database setup
    // Note: On Hostinger, 127.0.0.1 is drastically more reliable than "localhost" due to TCP vs Socket differences
    let dbHost = process.env.DB_HOST || '127.0.0.1';
    if (dbHost === 'localhost')
        dbHost = '127.0.0.1';
    const pool = mysql.createPool({
        host: dbHost,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'ecommerce',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        multipleStatements: true
    });
    const db = {
        async exec(sql) {
            try {
                await pool.query(sql);
            }
            catch (e) {
                console.error(`[DB ERROR] Failed to execute: ${sql.substring(0, 100)}...`, e);
                throw e;
            }
        },
        async get(sql, params = []) {
            const [rows] = await pool.query(sql, params);
            return rows[0] || undefined;
        },
        async all(sql, params = []) {
            const [rows] = await pool.query(sql, params);
            return rows;
        },
        async run(sql, params = []) {
            const [result] = await pool.execute(sql, params);
            return { lastID: result.insertId, changes: result.affectedRows };
        }
    };
    await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(255) UNIQUE,
      password TEXT
    );

    CREATE TABLE IF NOT EXISTS settings (
      \`key\` VARCHAR(255) PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS sections (
      id VARCHAR(255) PRIMARY KEY,
      title VARCHAR(255),
      content TEXT,
      order_index INT,
      is_visible INT DEFAULT 1,
      config TEXT
    );

    CREATE TABLE IF NOT EXISTS leads (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255),
      phone VARCHAR(255),
      email VARCHAR(255),
      location VARCHAR(255),
      service_type VARCHAR(255),
      message TEXT,
      preferred_date VARCHAR(255),
      preferred_time VARCHAR(255),
      source VARCHAR(255),
      custom_data TEXT,
      status VARCHAR(255) DEFAULT 'new',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS page_state (
      id VARCHAR(255) PRIMARY KEY,
      draft_json MEDIUMTEXT,
      published_json MEDIUMTEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS visitors (
      id INT AUTO_INCREMENT PRIMARY KEY,
      ip_address VARCHAR(255),
      user_agent TEXT,
      device_type VARCHAR(100),
      browser VARCHAR(255),
      os VARCHAR(255),
      path VARCHAR(500),
      page_title VARCHAR(255),
      referrer VARCHAR(500),
      screen VARCHAR(50),
      language VARCHAR(20),
      utm_source VARCHAR(255),
      utm_medium VARCHAR(255),
      utm_campaign VARCHAR(255),
      visit_time DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS forms (
      id VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255),
      fields_json TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS error_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      level VARCHAR(20) DEFAULT 'error',
      message TEXT,
      stack TEXT,
      source VARCHAR(50) DEFAULT 'api',
      endpoint VARCHAR(500),
      ip_address VARCHAR(255),
      user_agent TEXT,
      meta TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS chatbot_messages (
      id INT AUTO_INCREMENT PRIMARY KEY,
      session_id VARCHAR(255),
      role VARCHAR(20),
      content TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
    // Initialize page state if empty
    const pageState = await db.get("SELECT * FROM page_state WHERE id = 'home'");
    if (!pageState) {
        await db.run("INSERT INTO page_state (id, draft_json, published_json) VALUES (?, ?, ?)", ["home", "{}", "{}"]);
    }
    // Migration: Add preferred_date and preferred_time if they don't exist
    let tableInfo = [];
    try {
        tableInfo = await db.all("SHOW COLUMNS FROM leads");
    }
    catch (e) {
        console.error("Migration error:", e);
    }
    const hasPreferredDate = tableInfo.some(col => col.Field === 'preferred_date');
    if (!hasPreferredDate) {
        await db.exec("ALTER TABLE leads ADD COLUMN preferred_date VARCHAR(255)");
        await db.exec("ALTER TABLE leads ADD COLUMN preferred_time VARCHAR(255)");
        console.log("[MIGRATE] Added preferred_date and preferred_time to leads table");
    }
    // Migration: Add source and custom_data if they don't exist
    const hasSource = tableInfo.some(col => col.Field === 'source');
    if (!hasSource) {
        await db.exec("ALTER TABLE leads ADD COLUMN source VARCHAR(255) DEFAULT 'unknown'");
    }
    // Migration: Add custom_data column to leads for dynamic form builder
    const hasCustomData = tableInfo.some(col => col.Field === 'custom_data');
    if (!hasCustomData) {
        await db.exec("ALTER TABLE leads ADD COLUMN custom_data TEXT");
    }
    // Migration: Add CRM columns for Lead Management
    const hasAssignedTo = tableInfo.some(col => col.Field === 'assigned_to');
    if (!hasAssignedTo) {
        await db.exec("ALTER TABLE leads ADD COLUMN assigned_to VARCHAR(255) DEFAULT 'Unassigned'");
        await db.exec("ALTER TABLE leads ADD COLUMN quality_score VARCHAR(255)");
        await db.exec("ALTER TABLE leads ADD COLUMN notes TEXT");
        await db.exec("ALTER TABLE leads ADD COLUMN activities TEXT");
        console.log("[MIGRATE] Added CRM columns (assigned_to, quality_score, notes, activities) to leads table");
    }
    // Migration: Add extended tracking columns to visitors table
    let visitorsInfo = [];
    try {
        visitorsInfo = await db.all("SHOW COLUMNS FROM visitors");
    }
    catch (e) { }
    const visitorMigrations = [
        ['page_title', 'ALTER TABLE visitors ADD COLUMN page_title VARCHAR(255)'],
        ['referrer', 'ALTER TABLE visitors ADD COLUMN referrer VARCHAR(500)'],
        ['screen', 'ALTER TABLE visitors ADD COLUMN screen VARCHAR(50)'],
        ['language', 'ALTER TABLE visitors ADD COLUMN language VARCHAR(20)'],
        ['utm_source', 'ALTER TABLE visitors ADD COLUMN utm_source VARCHAR(255)'],
        ['utm_medium', 'ALTER TABLE visitors ADD COLUMN utm_medium VARCHAR(255)'],
        ['utm_campaign', 'ALTER TABLE visitors ADD COLUMN utm_campaign VARCHAR(255)'],
    ];
    for (const [col, sql] of visitorMigrations) {
        if (!visitorsInfo.some((c) => c.Field === col)) {
            try {
                await db.exec(sql);
            }
            catch (e) { }
        }
    }
    console.log('[MIGRATE] visitors table extended tracking columns ensured.');
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
    const chatLimiter = rateLimit({
        windowMs: 60 * 1000, // 1 minute
        max: 10, // 10 messages per minute per IP
        message: { error: "Too many messages, please slow down" }
    });
    // ─── Error Logging Helper ──────────────────────────────────────────────
    const logError = async (level, message, details) => {
        try {
            await db.run("INSERT INTO error_logs (level, message, stack, source, endpoint, ip_address, user_agent, meta) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [
                level,
                message,
                details?.stack || null,
                details?.source || 'api',
                details?.endpoint || null,
                details?.ip || null,
                details?.userAgent || null,
                details?.meta ? JSON.stringify(details.meta) : null
            ]);
        }
        catch (e) {
            // Fallback to console if DB logging fails
            console.error('[LOG ERROR] Failed to write error log to DB:', e);
        }
        // Always also console log
        if (level === 'error')
            console.error(`[${details?.source?.toUpperCase() || 'API'}] ${message}`);
        else if (level === 'warn')
            console.warn(`[${details?.source?.toUpperCase() || 'API'}] ${message}`);
        else
            console.log(`[${details?.source?.toUpperCase() || 'API'}] ${message}`);
    };
    // ─── Meta Conversions API Helper ─────────────────────────────────────────
    const sendMetaCAPIEvent = async (eventName, userData, customData, req) => {
        try {
            const rows = await db.all("SELECT * FROM settings");
            const settings = rows.reduce((acc, row) => ({ ...acc, [row.key]: row.value }), {});
            const pixelId = settings.metaPixelId;
            const accessToken = settings.metaAccessToken;
            const testCode = settings.metaTestCode;
            if (!pixelId || !accessToken)
                return;
            const hash = (str) => str ? crypto.createHash('sha256').update(str.trim().toLowerCase()).digest('hex') : null;
            const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;
            const userAgent = req.headers['user-agent'];
            const fbp = req.cookies['_fbp'];
            const fbc = req.cookies['_fbc'];
            const eventData = {
                data: [{
                        event_name: eventName,
                        event_time: Math.floor(Date.now() / 1000),
                        action_source: "website",
                        event_source_url: req.headers.referer || settings.siteUrl || "",
                        user_data: {
                            em: userData.email ? [hash(userData.email)] : [],
                            ph: userData.phone ? [hash(userData.phone)] : [],
                            client_ip_address: ip,
                            client_user_agent: userAgent,
                            fbp: fbp || null,
                            fbc: fbc || null
                        },
                        custom_data: customData,
                        event_id: customData.event_id // Used for deduplication with browser pixel
                    }]
            };
            if (testCode) {
                eventData.test_event_code = testCode;
            }
            await axios.post(`https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${accessToken}`, eventData);
            console.log(`[META CAPI] Sent ${eventName} event for ${userData.email || userData.phone}`);
        }
        catch (err) {
            console.error("[META CAPI ERROR]", err.response?.data || err.message);
        }
    };
    app.use(cors());
    app.use(express.json());
    app.use(cookieParser());
    app.use("/uploads", express.static(UPLOAD_DIR));
    // Multer for file uploads
    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            if (!fs.existsSync(UPLOAD_DIR))
                fs.mkdirSync(UPLOAD_DIR, { recursive: true });
            cb(null, UPLOAD_DIR);
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
        try {
            const { settings } = req.body;
            if (!settings || typeof settings !== 'object') {
                return res.status(400).json({ error: "Invalid settings data" });
            }
            await db.run("DELETE FROM settings");
            for (const [key, value] of Object.entries(settings)) {
                await db.run("INSERT INTO settings (`key`, value) VALUES (?, ?)", [key, value]);
            }
            // Track in Git
            trackChangeInGit("settings.json", settings, "Branding settings updated");
            res.json({ message: "Settings updated" });
        }
        catch (err) {
            console.error("[API ERROR] Failed to update settings:", err);
            res.status(500).json({ error: "Failed to update settings", details: err.message });
        }
    });
    app.post("/api/settings/test-email", authenticate, async (req, res) => {
        try {
            const rows = await db.all("SELECT * FROM settings");
            const settings = rows.reduce((acc, row) => ({ ...acc, [row.key]: row.value }), {});
            if (!settings.smtpHost || !settings.smtpUser || !settings.smtpPassword || !settings.notificationEmail) {
                return res.status(400).json({ success: false, error: "Incomplete SMTP settings. Please fill out Host, User, Password, and Notification Email." });
            }
            const transporter = nodemailer.createTransport({
                host: settings.smtpHost,
                port: parseInt(settings.smtpPort || '465', 10),
                secure: String(settings.smtpPort) === '465', // true for 465, false for other ports
                auth: {
                    user: settings.smtpUser,
                    pass: settings.smtpPassword,
                },
            });
            // Verify connection configuration
            await transporter.verify();
            // Send a test email
            const mailOptions = {
                from: `"${settings.siteName || 'System Test'}" <${settings.smtpUser}>`,
                to: settings.notificationEmail,
                subject: "✅ System Test: Email Configuration Successful",
                html: `
          <div style="font-family: sans-serif; padding: 20px; text-align: center;">
            <h2 style="color: #16a34a;">Test Email Successful</h2>
            <p>Your SMTP credentials are correct. You are ready to receive leads!</p>
          </div>
        `
            };
            await transporter.sendMail(mailOptions);
            res.json({ success: true, message: "Test email sent successfully to " + settings.notificationEmail });
        }
        catch (error) {
            console.error("[TEST EMAIL] SMTP Error:", error);
            res.status(500).json({
                success: false,
                error: error.message || "Failed to connect to SMTP server",
                fullError: String(error)
            });
        }
    });
    // Sections
    app.get("/api/sections", async (req, res) => {
        const sections = await db.all("SELECT * FROM sections ORDER BY order_index ASC");
        res.json(sections.map(s => ({ ...s, config: JSON.parse(s.config || "{}"), content: JSON.parse(s.content || "[]") })));
    });
    app.post("/api/sections", authenticate, async (req, res) => {
        const { id, title, content, order_index, is_visible, config } = req.body;
        await db.run("REPLACE INTO sections (id, title, content, order_index, is_visible, config) VALUES (?, ?, ?, ?, ?, ?)", [id, title || null, JSON.stringify(content || []), order_index || 0, is_visible ? 1 : 0, JSON.stringify(config || {})]);
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
            await db.run("REPLACE INTO forms (id, name, fields_json, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)", [id, name || id, JSON.stringify(fields_json || [])]);
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
        // Capture IP Address for CRM Location
        const ip_address = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
        // Store all unpredictable ad-hoc dynamic fields as a JSON string
        // Inject IP Address into custom_data
        const customDataObj = { ...rest, ip_address };
        const custom_data = JSON.stringify(customDataObj);
        // Initial activity log
        const initialActivity = JSON.stringify([
            { event: 'Lead Created', details: `Received from ${source || 'unknown'} via ${ip_address}`, date: new Date().toISOString() }
        ]);
        try {
            await db.run("INSERT INTO leads (name, phone, email, location, service_type, message, preferred_date, preferred_time, source, custom_data, activities) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [
                name || null,
                phone || null,
                email || null,
                location || null,
                service_type || null,
                message || null,
                preferred_date || null,
                preferred_time || null,
                source || 'unknown',
                custom_data || null,
                initialActivity
            ]);
            res.json({ message: "Lead saved" });
            // Fire Meta CAPI Lead Event
            const event_id = req.body.event_id || `lead_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            sendMetaCAPIEvent('Lead', { email, phone, name }, {
                service: service_type,
                location: location,
                event_id: event_id
            }, req);
        }
        catch (dbError) {
            console.error("[LEAD SUBMISSION ERROR]", dbError);
            return res.status(500).json({ error: "Failed to save lead. Please try again." });
        }
        // Fire & Forget Email Notification (runs asynchronously so the user doesn't wait)
        (async () => {
            try {
                const rows = await db.all("SELECT * FROM settings");
                const settings = rows.reduce((acc, row) => ({ ...acc, [row.key]: row.value }), {});
                if (settings.notificationEmail && settings.smtpHost && settings.smtpUser && settings.smtpPassword) {
                    const transporter = nodemailer.createTransport({
                        host: settings.smtpHost,
                        port: parseInt(settings.smtpPort || '465', 10),
                        secure: String(settings.smtpPort) === '465', // true for 465, false for other ports
                        auth: {
                            user: settings.smtpUser,
                            pass: settings.smtpPassword,
                        },
                    });
                    // Unpack custom data for nice formatting in the email
                    let trackingHtml = '';
                    const parsedCustom = JSON.parse(custom_data);
                    // Separate standard extra fields from true marketing attribution
                    const trackingKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'gclid', 'fbclid', 'referrer', 'landing_page', 'ip_address'];
                    const attributionData = Object.entries(parsedCustom).filter(([k]) => trackingKeys.includes(k) && parsedCustom[k]);
                    const otherCustomData = Object.entries(parsedCustom).filter(([k]) => !trackingKeys.includes(k) && parsedCustom[k]);
                    if (attributionData.length > 0) {
                        trackingHtml = `
              <h3 style="color: #475569; border-bottom: 2px solid #e2e8f0; padding-bottom: 5px; margin-top: 20px;">Attribution & Tracking</h3>
              <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                ${attributionData.map(([k, v]) => `
                  <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 8px 0; font-weight: bold; width: 30%; color: #64748b; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px;">${k.replace(/_/g, ' ')}</td>
                    <td style="padding: 8px 0; color: #0f172a; word-break: break-all;">${v}</td>
                  </tr>
                `).join('')}
              </table>
            `;
                    }
                    let customFieldsHtml = '';
                    if (otherCustomData.length > 0) {
                        customFieldsHtml = `
              <h3 style="color: #475569; border-bottom: 2px solid #e2e8f0; padding-bottom: 5px; margin-top: 20px;">Additional Fields</h3>
              <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                ${otherCustomData.map(([k, v]) => `
                  <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 8px 0; font-weight: bold; width: 30%; color: #64748b; text-transform: capitalize;">${k.replace(/_/g, ' ')}</td>
                    <td style="padding: 8px 0; color: #0f172a;">${v}</td>
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
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc; border-radius: 12px;">
                <div style="background-color: #2563eb; padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
                  <h2 style="color: #ffffff; margin: 0; font-size: 24px;">New Website Lead Received</h2>
                </div>
                
                <div style="background-color: #ffffff; padding: 24px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none; shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                  <h3 style="color: #475569; border-bottom: 2px solid #e2e8f0; padding-bottom: 5px; margin-top: 0;">Contact Information</h3>
                  <table style="width: 100%; border-collapse: collapse; font-size: 15px;">
                    <tr><td style="padding: 8px 0; font-weight: bold; width: 30%; color: #64748b;">Name:</td><td style="padding: 8px 0; color: #0f172a; font-weight: 600;">${name}</td></tr>
                    <tr><td style="padding: 8px 0; font-weight: bold; width: 30%; color: #64748b;">Phone:</td><td style="padding: 8px 0; color: #0f172a;"><a href="tel:${phone}" style="color: #2563eb; text-decoration: none; font-weight: 600;">${phone}</a></td></tr>
                    <tr><td style="padding: 8px 0; font-weight: bold; width: 30%; color: #64748b;">Email:</td><td style="padding: 8px 0; color: #0f172a;">${email || '-'}</td></tr>
                    <tr>
                      <td style="padding: 8px 0; font-weight: bold; width: 30%; color: #64748b;">Location:</td>
                      <td style="padding: 8px 0; color: #0f172a;">
                        ${location}
                        ${parsedCustom.lat && parsedCustom.lng ? `
                          <br/>
                          <a href="https://www.google.com/maps/dir/?api=1&destination=${parsedCustom.lat},${parsedCustom.lng}" style="color: #2563eb; font-size: 12px; font-weight: bold; text-decoration: none; margin-top: 4px; display: inline-block;">📍 Get Directions</a>
                        ` : ''}
                      </td>
                    </tr>
                    ${parsedCustom.lat && parsedCustom.lng ? `
                    <tr>
                      <td style="padding: 8px 0; font-weight: bold; width: 30%; color: #64748b;">Coordinates:</td>
                      <td style="padding: 8px 0; color: #64748b; font-size: 12px; font-family: monospace;">${parsedCustom.lat}, ${parsedCustom.lng}</td>
                    </tr>
                    ` : ''}
                  </table>

                  <h3 style="color: #475569; border-bottom: 2px solid #e2e8f0; padding-bottom: 5px; margin-top: 20px;">Inquiry Details</h3>
                  <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                    <tr><td style="padding: 8px 0; font-weight: bold; width: 30%; color: #64748b;">Service:</td><td style="padding: 8px 0; color: #2563eb; font-weight: bold;">${service_type || 'General'}</td></tr>
                    <tr><td style="padding: 8px 0; font-weight: bold; width: 30%; color: #64748b;">Form Name:</td><td style="padding: 8px 0; color: #0f172a;">${source || 'Unknown'}</td></tr>
                    <tr><td style="padding: 8px 0; font-weight: bold; width: 30%; color: #64748b;">Preference:</td><td style="padding: 8px 0; color: #0f172a;">${preferred_date || 'Any Date'} at ${preferred_time || 'Any Time'}</td></tr>
                  </table>

                  ${message ? `
                  <h3 style="color: #475569; border-bottom: 2px solid #e2e8f0; padding-bottom: 5px; margin-top: 20px;">Customer Message</h3>
                  <div style="background-color: #f8fafc; border-left: 4px solid #2563eb; padding: 16px; border-radius: 0 8px 8px 0; color: #334155; font-style: italic; font-size: 15px;">
                    "${message}"
                  </div>
                  ` : ''}

                  ${trackingHtml}
                  ${customFieldsHtml}
                </div>
                
                <div style="text-align: center; margin-top: 24px;">
                  <a href="${settings.siteUrl || 'https://acgoa.com'}/admin" style="display: inline-block; background-color: #0f172a; color: #ffffff; padding: 14px 28px; text-decoration: none; font-weight: bold; border-radius: 8px; font-size: 16px;">View in CRM</a>
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
        const { status, assigned_to, quality_score, notes, new_activity } = req.body;
        try {
            // First get current lead to append to activities array
            const lead = await db.get("SELECT activities FROM leads WHERE id = ?", [req.params.id]);
            let activities = [];
            try {
                activities = JSON.parse(lead.activities || '[]');
            }
            catch (e) {
                activities = [];
            }
            if (new_activity) {
                activities.push({
                    event: new_activity.event,
                    details: new_activity.details,
                    date: new Date().toISOString()
                });
            }
            // Build dynamic update query based on provided fields
            const updates = [];
            const values = [];
            if (status !== undefined) {
                updates.push("status = ?");
                values.push(status ?? null);
            }
            if (assigned_to !== undefined) {
                updates.push("assigned_to = ?");
                values.push(assigned_to ?? null);
            }
            if (quality_score !== undefined) {
                updates.push("quality_score = ?");
                values.push(quality_score ?? null);
            }
            if (notes !== undefined) {
                updates.push("notes = ?");
                values.push(notes ?? null);
            }
            // Always update activities if we have new ones
            if (new_activity) {
                updates.push("activities = ?");
                values.push(JSON.stringify(activities));
            }
            if (updates.length > 0) {
                const query = `UPDATE leads SET ${updates.join(', ')} WHERE id = ?`;
                values.push(req.params.id);
                await db.run(query, values);
            }
            res.json({ message: "Lead updated" });
        }
        catch (error) {
            console.error("Error updating lead:", error);
            res.status(500).json({ error: "Failed to update lead" });
        }
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
            // 1. Try Nominatim (OpenStreetMap) first for a real address
            const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
            const geoRes = await fetch(nominatimUrl, {
                headers: {
                    'User-Agent': 'CoolGoaACServices/1.0'
                }
            });
            if (geoRes.ok) {
                const geoData = await geoRes.json();
                if (geoData.display_name) {
                    // Extract a cleaner address (Neighborhood, Road, or City)
                    const addr = geoData.address;
                    const cleanArea = addr.suburb || addr.neighbourhood || addr.residential || addr.road || addr.city_district || addr.city || "Delhi-NCR";
                    const fullDisplay = `${cleanArea}${addr.city ? ', ' + addr.city : ''}`;
                    return res.json({ location: geoData.display_name.split(',').slice(0, 3).join(',').trim() });
                }
            }
            // 2. Fallback to Gemini if Nominatim fails or returns nothing
            const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
            const response = await ai.models.generateContent({
                model: "gemini-1.5-flash",
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
        const { user_agent, device_type, browser, os, path: visitPath, page_title, referrer, screen, language, utm_source, utm_medium, utm_campaign } = req.body;
        // Extract the true client IP — take only the first entry from the proxy chain
        const rawIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
        const ip_address = rawIp.split(',')[0].trim();
        try {
            // Prevent duplicate logging from the same IP on the same path within 5 minutes (MySQL syntax)
            const recentVisit = await db.get("SELECT id FROM visitors WHERE ip_address = ? AND path = ? AND visit_time > DATE_SUB(NOW(), INTERVAL 5 MINUTE)", [ip_address, visitPath]);
            if (!recentVisit) {
                await db.run(`INSERT INTO visitors (ip_address, user_agent, device_type, browser, os, path, page_title, referrer, screen, language, utm_source, utm_medium, utm_campaign)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
                    ip_address,
                    user_agent || 'unknown',
                    device_type || 'desktop',
                    browser || 'unknown',
                    os || 'unknown',
                    visitPath || '/',
                    page_title || null,
                    (referrer && referrer !== 'direct') ? referrer : null,
                    screen || null,
                    language || null,
                    utm_source || null,
                    utm_medium || null,
                    utm_campaign || null,
                ]);
            }
            res.status(200).json({ success: true });
        }
        catch (error) {
            console.error("Tracking Error:", error);
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
          SUM(CASE WHEN visit_time > NOW() - INTERVAL 24 HOUR THEN 1 ELSE 0 END) as visits_today
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
        // For GitHub storage: Track new file in Git immediately
        const fullPath = path.join(UPLOAD_DIR, req.file.filename);
        trackChangeInGit(`uploads/${req.file.filename}`, {}, `Media upload: ${req.file.filename}`);
        // Use an API route to bypass Hostinger Nginx intercepting static file extensions
        res.json({ url: `/api/media?f=${req.file.filename}`, filename: req.file.filename });
    });
    // Dynamic Media Server to bypass Hostinger Nginx static file intercepts
    // Supports on-the-fly optimization: /api/media?f=img.jpg&w=500&q=80
    app.get("/api/media", async (req, res) => {
        const filename = req.query.f;
        const width = parseInt(req.query.w);
        const quality = parseInt(req.query.q) || 80;
        const format = req.query.fmt; // webp is recommended
        if (!filename)
            return res.status(400).send("No file specified");
        const filepath = path.join(UPLOAD_DIR, filename);
        if (!fs.existsSync(filepath))
            return res.status(404).send("File not found");
        // If no processing requested, send file normally
        if (!width && !quality && !format) {
            return res.sendFile(filepath);
        }
        try {
            let pipeline = sharp(filepath);
            if (width) {
                pipeline = pipeline.resize(width, null, { withoutEnlargement: true });
            }
            if (format === 'webp') {
                pipeline = pipeline.webp({ quality });
            }
            else if (filename.match(/\.(jpg|jpeg)$/i)) {
                pipeline = pipeline.jpeg({ quality, mozjpeg: true });
            }
            else if (filename.match(/\.png$/i)) {
                pipeline = pipeline.png({ quality: Math.floor(quality / 10), compressionLevel: 9 });
            }
            const buffer = await pipeline.toBuffer();
            // Set appropriate content type
            const ext = format === 'webp' ? 'webp' : path.extname(filename).slice(1);
            res.set('Content-Type', `image/${ext}`);
            res.set('Cache-Control', 'public, max-age=31536000, immutable');
            res.send(buffer);
        }
        catch (err) {
            console.error("[SHARP] Optimization error:", err);
            // Fallback to original
            res.sendFile(filepath);
        }
    });
    // Media Library — List all uploaded files
    app.get("/api/media/list", authenticate, (req, res) => {
        if (!fs.existsSync(UPLOAD_DIR))
            return res.json([]);
        try {
            const files = fs.readdirSync(UPLOAD_DIR).map((name) => {
                const stat = fs.statSync(path.join(UPLOAD_DIR, name));
                return {
                    name,
                    url: `/api/media?f=${encodeURIComponent(name)}`,
                    size: stat.size,
                    modified: stat.mtime,
                    isVideo: /\.(mp4|webm|mov)$/i.test(name)
                };
            }).sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime());
            res.json(files);
        }
        catch (err) {
            console.error("Error listing media:", err);
            res.status(500).json({ error: "Failed to list media files" });
        }
    });
    // Media Library — Delete a file
    app.delete("/api/media/:filename", authenticate, (req, res) => {
        const filename = req.params.filename;
        const filepath = path.join(UPLOAD_DIR, filename);
        if (!fs.existsSync(filepath))
            return res.status(404).json({ error: "File not found" });
        try {
            fs.unlinkSync(filepath);
            res.json({ message: "File deleted" });
        }
        catch (err) {
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
        // Track in Git
        trackChangeInGit(`${req.params.id}_draft.json`, draft_json, `Draft saved for ${req.params.id}`);
        res.json({ message: "Draft saved" });
    });
    app.post("/api/builder/publish/:id", authenticate, async (req, res) => {
        const { draft_json } = req.body;
        // 1. If draft data is sent, save it first to ensure we publish latest
        if (draft_json) {
            await db.run("UPDATE page_state SET draft_json = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [JSON.stringify(draft_json), req.params.id]);
            trackChangeInGit(`${req.params.id}_draft.json`, draft_json, `Draft auto-saved (Publish flow) for ${req.params.id}`);
        }
        const page = await db.get("SELECT * FROM page_state WHERE id = ?", [req.params.id]);
        if (!page)
            return res.status(404).json({ error: "Page not found" });
        // 2. Published = Draft
        await db.run("UPDATE page_state SET published_json = draft_json, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [req.params.id]);
        // Track in Git
        const publishedData = JSON.parse(page.draft_json || "{}");
        trackChangeInGit(`${req.params.id}_published.json`, publishedData, `Page published: ${req.params.id}`);
        res.json({ message: "Page published" });
    });
    // ─── Error Logs API ──────────────────────────────────────────────────
    app.get("/api/error-logs/stats", authenticate, async (req, res) => {
        try {
            const stats = await db.get(`
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN level = 'error' THEN 1 ELSE 0 END) as errors,
          SUM(CASE WHEN level = 'warn' THEN 1 ELSE 0 END) as warnings,
          SUM(CASE WHEN level = 'info' THEN 1 ELSE 0 END) as infos,
          SUM(CASE WHEN created_at > NOW() - INTERVAL 24 HOUR THEN 1 ELSE 0 END) as last_24h,
          SUM(CASE WHEN level = 'error' AND created_at > NOW() - INTERVAL 24 HOUR THEN 1 ELSE 0 END) as errors_24h
        FROM error_logs
      `);
            res.json(stats);
        }
        catch (err) {
            res.status(500).json({ error: "Failed to fetch error log stats" });
        }
    });
    app.get("/api/error-logs", authenticate, async (req, res) => {
        try {
            const { level, source, limit = '100', offset = '0', search } = req.query;
            let sql = "SELECT id, level, message, source, endpoint, ip_address, created_at FROM error_logs";
            const conditions = [];
            const params = [];
            if (level) {
                conditions.push("level = ?");
                params.push(level);
            }
            if (source) {
                conditions.push("source = ?");
                params.push(source);
            }
            if (search) {
                conditions.push("(message LIKE ? OR endpoint LIKE ?)");
                params.push(`%${search}%`, `%${search}%`);
            }
            if (conditions.length > 0)
                sql += " WHERE " + conditions.join(" AND ");
            sql += " ORDER BY created_at DESC";
            sql += ` LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;
            const logs = await db.all(sql, params);
            const countSql = conditions.length > 0
                ? `SELECT COUNT(*) as total FROM error_logs WHERE ${conditions.join(" AND ")}`
                : "SELECT COUNT(*) as total FROM error_logs";
            const countResult = await db.get(countSql, params);
            res.json({ logs, total: countResult?.total || 0 });
        }
        catch (err) {
            res.status(500).json({ error: "Failed to fetch error logs" });
        }
    });
    app.get("/api/error-logs/:id", authenticate, async (req, res) => {
        try {
            const log = await db.get("SELECT * FROM error_logs WHERE id = ?", [req.params.id]);
            if (!log)
                return res.status(404).json({ error: "Log not found" });
            res.json(log);
        }
        catch (err) {
            res.status(500).json({ error: "Failed to fetch error log" });
        }
    });
    app.delete("/api/error-logs/:id", authenticate, async (req, res) => {
        try {
            await db.run("DELETE FROM error_logs WHERE id = ?", [req.params.id]);
            res.json({ message: "Log deleted" });
        }
        catch (err) {
            res.status(500).json({ error: "Failed to delete error log" });
        }
    });
    app.delete("/api/error-logs", authenticate, async (req, res) => {
        try {
            await db.run("DELETE FROM error_logs");
            res.json({ message: "All logs cleared" });
        }
        catch (err) {
            res.status(500).json({ error: "Failed to clear error logs" });
        }
    });
    // Client-side error capture (public endpoint)
    app.post("/api/error-logs/client", async (req, res) => {
        const { message, stack, url, line, col } = req.body;
        const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown').split(',')[0].trim();
        await logError('error', message || 'Client-side error', {
            stack: stack || `at ${url}:${line}:${col}`,
            source: 'frontend',
            endpoint: url,
            ip,
            userAgent: req.headers['user-agent'] || 'unknown'
        });
        res.json({ success: true });
    });
    // ─── AI Chatbot API ──────────────────────────────────────────────────
    app.get("/api/chat/config", async (req, res) => {
        try {
            const rows = await db.all("SELECT * FROM settings");
            const settings = rows.reduce((acc, row) => ({ ...acc, [row.key]: row.value }), {});
            res.json({
                enabled: settings.chatbot_enabled === 'true',
                greeting: settings.chatbot_greeting || "Hi! 👋 I'm EazyService AI assistant. How can I help you with your AC service needs today?"
            });
        }
        catch (err) {
            res.status(500).json({ error: "Failed to fetch chat config" });
        }
    });
    app.post("/api/chat", chatLimiter, async (req, res) => {
        const { message, sessionId } = req.body;
        if (!message || !sessionId)
            return res.status(400).json({ error: "Message and sessionId required" });
        try {
            const apiKey = process.env.GEMINI_API_KEY;
            if (!apiKey) {
                return res.status(503).json({ error: "AI chatbot is not configured. Please add GEMINI_API_KEY." });
            }
            // Store user message
            await db.run("INSERT INTO chatbot_messages (session_id, role, content) VALUES (?, ?, ?)", [sessionId, 'user', message]);
            // Load conversation history (last 20 messages for context)
            const history = await db.all("SELECT role, content FROM chatbot_messages WHERE session_id = ? ORDER BY created_at ASC", [sessionId]);
            const recentHistory = history.slice(-20);
            // Get custom system prompt from settings
            const systemPromptRow = await db.get("SELECT value FROM settings WHERE `key` = 'chatbot_system_prompt'");
            const customPrompt = systemPromptRow?.value || '';
            const systemPrompt = `You are a helpful AI customer support assistant for EazyService — Delhi-NCR's trusted AC service company.

Key facts about EazyService:
- Services: AC Cleaning (Dry & Wet), AC Repair, AC Installation/Uninstallation, AC Gas Refilling (R22, R32, R410A)
- Service areas: Delhi, Gurgaon, Noida, Faridabad, Ghaziabad — across Delhi-NCR
- Response time: Technician at your doorstep within 20 minutes
- Guarantee: 1-month free repeat visit guarantee on all services
- Rating: 4.8 stars on Google with thousands of happy customers
- Available: 7 days a week, 8 AM to 10 PM
- Contact: Call +91 9911481331 or book online

${customPrompt}

Instructions:
- Be friendly, concise, and helpful.
- Answer questions about AC services, pricing, and availability.
- If the user wants to book, ask for their name, phone number, and service type, then tell them to book via the form on the website or call +91 9911481331.
- If you don't know something specific about pricing, say the team will provide exact pricing after inspection.
- Keep responses short (2-3 sentences max) unless the user asks for details.
- Respond in the same language the user writes in (Hindi, English, or Hinglish).`;
            // Build Gemini conversation
            const ai = new GoogleGenAI({ apiKey });
            const chatContents = recentHistory.map(m => ({
                role: m.role === 'user' ? 'user' : 'model',
                parts: [{ text: m.content }]
            }));
            const response = await ai.models.generateContent({
                model: 'gemini-1.5-flash',
                contents: chatContents,
                config: {
                    systemInstruction: systemPrompt,
                },
            });
            const reply = response.text?.trim() || "I'm sorry, I couldn't process that. Please try again or call us at +91 9911481331.";
            // Store AI response
            await db.run("INSERT INTO chatbot_messages (session_id, role, content) VALUES (?, ?, ?)", [sessionId, 'assistant', reply]);
            res.json({ reply, sessionId });
        }
        catch (err) {
            await logError('error', `Chat API error: ${err.message}`, {
                stack: err.stack,
                source: 'chatbot',
                endpoint: '/api/chat'
            });
            res.status(500).json({ error: "Failed to get AI response. Please try again." });
        }
    });
    // Admin: Get chat sessions
    app.get("/api/chatbot/sessions", authenticate, async (req, res) => {
        try {
            const sessions = await db.all(`
        SELECT
          session_id,
          COUNT(*) as message_count,
          MIN(created_at) as started_at,
          MAX(created_at) as last_active,
          (SELECT content FROM chatbot_messages m2 WHERE m2.session_id = chatbot_messages.session_id AND m2.role = 'user' ORDER BY m2.created_at ASC LIMIT 1) as first_message
        FROM chatbot_messages
        GROUP BY session_id
        ORDER BY MAX(created_at) DESC
        LIMIT 50
      `);
            res.json(sessions);
        }
        catch (err) {
            res.status(500).json({ error: "Failed to fetch chat sessions" });
        }
    });
    // Admin: Get full chat transcript
    app.get("/api/chatbot/sessions/:sessionId", authenticate, async (req, res) => {
        try {
            const messages = await db.all("SELECT * FROM chatbot_messages WHERE session_id = ? ORDER BY created_at ASC", [req.params.sessionId]);
            res.json(messages);
        }
        catch (err) {
            res.status(500).json({ error: "Failed to fetch chat transcript" });
        }
    });
    // Admin: Update chatbot config
    app.post("/api/chatbot/config", authenticate, async (req, res) => {
        try {
            const { enabled, greeting, systemPrompt } = req.body;
            const updates = [];
            if (enabled !== undefined)
                updates.push(['chatbot_enabled', String(enabled)]);
            if (greeting !== undefined)
                updates.push(['chatbot_greeting', greeting]);
            if (systemPrompt !== undefined)
                updates.push(['chatbot_system_prompt', systemPrompt]);
            for (const [key, value] of updates) {
                const existing = await db.get("SELECT `key` FROM settings WHERE `key` = ?", [key]);
                if (existing) {
                    await db.run("UPDATE settings SET value = ? WHERE `key` = ?", [value, key]);
                }
                else {
                    await db.run("INSERT INTO settings (`key`, value) VALUES (?, ?)", [key, value]);
                }
            }
            res.json({ message: "Chatbot config updated" });
        }
        catch (err) {
            res.status(500).json({ error: "Failed to update chatbot config" });
        }
    });
    // ─── Global Error Handler ──────────────────────────────────────────────
    app.use(async (err, req, res, next) => {
        const ip = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').toString().split(',')[0].trim();
        await logError('error', err.message || 'Unhandled server error', {
            stack: err.stack,
            source: 'api',
            endpoint: `${req.method} ${req.originalUrl}`,
            ip,
            userAgent: req.headers['user-agent']
        });
        if (!res.headersSent) {
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
    }
    else {
        app.use(express.static(path.join(__dirname, "dist")));
        app.get("*path", async (req, res) => {
            try {
                let html = fs.readFileSync(path.join(__dirname, "dist", "index.html"), "utf-8");
                // Fetch published state to avoid hydration flicker
                const page = await db.get("SELECT published_json FROM page_state WHERE id = 'home'");
                const settingsRows = await db.all("SELECT * FROM settings");
                const settings = settingsRows.reduce((acc, row) => ({ ...acc, [row.key]: row.value }), {});
                const data = {
                    pageData: JSON.parse(page?.published_json || "{}"),
                    settings: settings || {}
                };
                // Inject initial state to bypass API wait on first load
                const stateScript = `<script>window.__INITIAL_STATE__ = ${JSON.stringify(data)};</script>`;
                html = html.replace('<div id="root">', `${stateScript}<div id="root">`);
                // Inject Meta Pixel if ID is configured
                if (settings.metaPixelId) {
                    const pixelScript = `
<!-- Meta Pixel Code -->
<script>
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${settings.metaPixelId}');
fbq('track', 'PageView');
</script>
<noscript><img height="1" width="1" style="display:none"
src="https://www.facebook.com/tr?id=${settings.metaPixelId}&ev=PageView&noscript=1"
/></noscript>
<!-- End Meta Pixel Code -->
          `;
                    html = html.replace('</head>', `${pixelScript}</head>`);
                }
                res.send(html);
            }
            catch (err) {
                console.error("Error serving index.html:", err);
                res.sendFile(path.join(__dirname, "dist", "index.html"));
            }
        });
    }
    app.listen(PORT, "0.0.0.0", () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}
startServer().catch(err => {
    console.error("❌ FATAL ERROR DURING SERVER STARTUP:");
    console.error(err);
    process.exit(1);
});
