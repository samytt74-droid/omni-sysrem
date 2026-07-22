var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// artifacts/pos-system/src/backend/server/routes/health.ts
var import_express, import_api_zod, router, health_default;
var init_health = __esm({
  "artifacts/pos-system/src/backend/server/routes/health.ts"() {
    import_express = require("express");
    import_api_zod = require("@workspace/api-zod");
    router = (0, import_express.Router)();
    router.get("/healthz", (_req, res) => {
      const data = import_api_zod.HealthCheckResponse.parse({ status: "ok" });
      res.json(data);
    });
    health_default = router;
  }
});

// artifacts/pos-system/src/backend/server/lib/sqlite.ts
function hashPassword(password) {
  const salt = (0, import_node_crypto.randomBytes)(16).toString("hex");
  const hash = (0, import_node_crypto.scryptSync)(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}
function verifyPassword(password, stored) {
  const [salt, storedHash] = stored.split(":");
  const hash = (0, import_node_crypto.scryptSync)(password, salt, 64);
  const storedBuf = Buffer.from(storedHash, "hex");
  return (0, import_node_crypto.timingSafeEqual)(hash, storedBuf);
}
function createSession(userId) {
  const token = (0, import_node_crypto.randomBytes)(32).toString("hex");
  sessions.set(token, userId);
  return token;
}
function getSessionUser(token) {
  return sessions.get(token);
}
function deleteSession(token) {
  sessions.delete(token);
}
function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'cashier',
      active INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      color TEXT
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      number INTEGER UNIQUE NOT NULL,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      cost REAL,
      barcode TEXT,
      category_id INTEGER REFERENCES categories(id),
      active INTEGER NOT NULL DEFAULT 1,
      stock INTEGER
    );

    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      address TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_number TEXT UNIQUE NOT NULL,
      subtotal REAL NOT NULL DEFAULT 0,
      discount REAL NOT NULL DEFAULT 0,
      tax REAL NOT NULL DEFAULT 0,
      total REAL NOT NULL,
      payment_method TEXT NOT NULL DEFAULT 'cash',
      cash_amount REAL,
      card_amount REAL,
      customer_id INTEGER REFERENCES customers(id),
      user_id INTEGER NOT NULL REFERENCES users(id),
      note TEXT,
      order_type TEXT NOT NULL DEFAULT 'dine-in',
      table_number TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL,
      product_name TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      total REAL NOT NULL,
      category_id INTEGER REFERENCES categories(id),
      category_name TEXT
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS receipt_copy_configs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      copy_number INTEGER NOT NULL,
      label TEXT NOT NULL,
      enabled INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS department_print_configs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
      printer_name TEXT,
      copies INTEGER NOT NULL DEFAULT 1,
      enabled INTEGER NOT NULL DEFAULT 1,
      print_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS print_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      invoice_number TEXT NOT NULL,
      receipt_type TEXT NOT NULL,
      department_name TEXT,
      printer_name TEXT,
      printed_at TEXT NOT NULL DEFAULT (datetime('now')),
      user_id INTEGER NOT NULL,
      user_name TEXT,
      copies INTEGER NOT NULL DEFAULT 1,
      status TEXT NOT NULL DEFAULT 'success',
      reprint_reason TEXT,
      reprint_count INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS printer_settings (
      id INTEGER PRIMARY KEY DEFAULT 1,
      paper_width INTEGER NOT NULL DEFAULT 80,
      left_margin REAL NOT NULL DEFAULT 4,
      right_margin REAL NOT NULL DEFAULT 4,
      top_margin REAL NOT NULL DEFAULT 2,
      bottom_margin REAL NOT NULL DEFAULT 2,
      font_size INTEGER NOT NULL DEFAULT 10,
      line_spacing REAL NOT NULL DEFAULT 2,
      characters_per_line INTEGER NOT NULL DEFAULT 48
    );

    CREATE TABLE IF NOT EXISTS hr_departments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      budget REAL NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS hr_employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_number TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      position TEXT,
      department_id INTEGER REFERENCES hr_departments(id),
      basic_salary REAL NOT NULL DEFAULT 0,
      hire_date TEXT,
      active INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS hr_salaries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
      month TEXT NOT NULL,
      basic_salary REAL NOT NULL DEFAULT 0,
      bonuses REAL NOT NULL DEFAULT 0,
      deductions REAL NOT NULL DEFAULT 0,
      net_salary REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'pending',
      payment_date TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS hr_attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      check_in TEXT,
      check_out TEXT,
      status TEXT NOT NULL DEFAULT 'present',
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS returns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      return_number TEXT UNIQUE NOT NULL,
      invoice_number TEXT NOT NULL,
      order_id INTEGER,
      reason TEXT,
      total_refund REAL NOT NULL DEFAULT 0,
      payment_method TEXT NOT NULL DEFAULT 'cash',
      customer_id INTEGER REFERENCES customers(id),
      user_id INTEGER NOT NULL REFERENCES users(id),
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS return_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      return_id INTEGER NOT NULL REFERENCES returns(id) ON DELETE CASCADE,
      product_id INTEGER,
      product_name TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      total REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS meal_deductions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL REFERENCES hr_employees(id),
      employee_name TEXT NOT NULL,
      employee_number TEXT NOT NULL,
      order_id INTEGER REFERENCES orders(id),
      invoice_number TEXT,
      amount REAL NOT NULL DEFAULT 0,
      cashier_id INTEGER NOT NULL REFERENCES users(id),
      cashier_name TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}
function runMigrations() {
  try {
    db.exec("ALTER TABLE order_items ADD COLUMN category_id INTEGER REFERENCES categories(id)");
  } catch {
  }
  try {
    db.exec("ALTER TABLE order_items ADD COLUMN category_name TEXT");
  } catch {
  }
  try {
    db.exec("ALTER TABLE orders ADD COLUMN order_type TEXT NOT NULL DEFAULT 'dine-in'");
  } catch {
  }
  try {
    db.exec("ALTER TABLE orders ADD COLUMN table_number TEXT");
  } catch {
  }
  try {
    db.exec("ALTER TABLE printer_settings ADD COLUMN main_printer_name TEXT");
  } catch {
  }
  try {
    db.exec("ALTER TABLE users ADD COLUMN allow_meal_deduction INTEGER NOT NULL DEFAULT 0");
  } catch {
  }
  try {
    db.exec("ALTER TABLE orders ADD COLUMN is_employee_meal INTEGER NOT NULL DEFAULT 0");
  } catch {
  }
  try {
    db.exec("ALTER TABLE orders ADD COLUMN employee_id INTEGER");
  } catch {
  }
  try {
    db.exec(`INSERT OR IGNORE INTO printer_settings (id, paper_width, left_margin, right_margin, top_margin, bottom_margin, font_size, line_spacing, characters_per_line)
             VALUES (1, 80, 4, 4, 2, 2, 10, 2, 48)`);
  } catch {
  }
}
function seedData() {
  const userCount = db.prepare("SELECT COUNT(*) as c FROM users").get().c;
  if (userCount > 0) return;
  const adminHash = hashPassword("admin123");
  const cashierHash = hashPassword("cashier123");
  db.prepare(`INSERT INTO users (username, password_hash, name, role, active) VALUES (?,?,?,?,1)`).run("admin", adminHash, "\u0645\u062F\u064A\u0631 \u0627\u0644\u0646\u0638\u0627\u0645", "admin");
  db.prepare(`INSERT INTO users (username, password_hash, name, role, active) VALUES (?,?,?,?,1)`).run("cashier", cashierHash, "\u0627\u0644\u0643\u0627\u0634\u064A\u0631 \u0627\u0644\u0623\u0648\u0644", "cashier");
  const categories = [
    { name: "\u0627\u0644\u0645\u0637\u0628\u062E", color: "#f59e0b" },
    { name: "\u0627\u0644\u0639\u0635\u0627\u0626\u0631", color: "#3b82f6" },
    { name: "\u0627\u0644\u062D\u0644\u0648\u064A\u0627\u062A", color: "#ec4899" },
    { name: "\u0627\u0644\u0634\u0627\u0648\u0631\u0645\u0627", color: "#10b981" }
  ];
  const insertCat = db.prepare("INSERT INTO categories (name, color) VALUES (?,?)");
  const catIds = [];
  for (const cat of categories) {
    const r = insertCat.run(cat.name, cat.color);
    catIds.push(r.lastInsertRowid);
  }
  const products = [
    { number: 1, name: "\u0628\u0631\u064A\u0627\u0646\u064A \u062F\u062C\u0627\u062C", price: 14e3, cost: 8e3, category_id: catIds[0] },
    { number: 2, name: "\u0631\u0632 \u0623\u0628\u064A\u0636", price: 6500, cost: 3e3, category_id: catIds[0] },
    { number: 3, name: "\u062F\u062C\u0627\u062C \u0645\u0634\u0648\u064A", price: 18e3, cost: 1e4, category_id: catIds[0] },
    { number: 4, name: "\u0644\u062D\u0645 \u0645\u0634\u0648\u064A", price: 25e3, cost: 15e3, category_id: catIds[0] },
    { number: 5, name: "\u0633\u0645\u0643 \u0645\u0642\u0644\u064A", price: 2e4, cost: 12e3, category_id: catIds[0] },
    { number: 6, name: "\u0639\u0635\u064A\u0631 \u0628\u0631\u062A\u0642\u0627\u0644", price: 3e3, cost: 1e3, category_id: catIds[1] },
    { number: 7, name: "\u0634\u0627\u064A", price: 1500, cost: 500, category_id: catIds[1] },
    { number: 8, name: "\u0645\u0627\u0621 \u0645\u0639\u062F\u0646\u064A", price: 1e3, cost: 300, category_id: catIds[1] },
    { number: 9, name: "\u0643\u0648\u0644\u0627", price: 2e3, cost: 800, category_id: catIds[1] },
    { number: 10, name: "\u0643\u064A\u0643 \u0634\u0648\u0643\u0648\u0644\u0627\u062A\u0629", price: 5e3, cost: 2500, category_id: catIds[2] },
    { number: 11, name: "\u0622\u064A\u0633 \u0643\u0631\u064A\u0645", price: 4e3, cost: 1500, category_id: catIds[2] },
    { number: 12, name: "\u0634\u0627\u0648\u0631\u0645\u0627 \u062F\u062C\u0627\u062C", price: 8e3, cost: 4e3, category_id: catIds[3] },
    { number: 13, name: "\u0634\u0627\u0648\u0631\u0645\u0627 \u0644\u062D\u0645", price: 1e4, cost: 5e3, category_id: catIds[3] },
    { number: 14, name: "\u0641\u062A\u0629", price: 8e3, cost: 4e3, category_id: catIds[0] },
    { number: 15, name: "\u0645\u0631\u0642 \u0644\u062D\u0645", price: 5e3, cost: 2e3, category_id: catIds[0] }
  ];
  const insertProd = db.prepare(
    "INSERT INTO products (number, name, price, cost, category_id, active) VALUES (?,?,?,?,?,1)"
  );
  for (const p of products) {
    insertProd.run(p.number, p.name, p.price, p.cost, p.category_id);
  }
  const defaultSettings2 = [
    ["businessName", "\u0645\u0637\u0639\u0645 \u0625\u062A\u0642\u0627\u0646"],
    ["address", "\u0627\u0644\u0631\u064A\u0627\u0636\u060C \u0627\u0644\u0645\u0645\u0644\u0643\u0629 \u0627\u0644\u0639\u0631\u0628\u064A\u0629 \u0627\u0644\u0633\u0639\u0648\u062F\u064A\u0629"],
    ["phone", "0501234567"],
    ["taxNumber", "300000000000003"],
    ["taxRate", "15"],
    ["currency", "\u0631\u064A\u0627\u0644"],
    ["receiptMessage", "\u0634\u0643\u0631\u0627\u064B \u0644\u0632\u064A\u0627\u0631\u062A\u0643\u0645 - \u064A\u0633\u0639\u062F\u0646\u0627 \u062E\u062F\u0645\u062A\u0643\u0645"],
    ["printLogo", "true"],
    ["printQr", "false"],
    ["showCashier", "true"],
    ["showCustomer", "true"],
    ["receiptPaperSize", "80mm"],
    ["showOrderNumber", "true"],
    ["showTableNumber", "true"],
    ["showDateTime", "true"],
    ["showBarcode", "false"],
    ["showOrderType", "true"],
    ["showTax", "true"],
    ["showDiscount", "true"],
    ["showNotes", "true"],
    ["autoPrintTrigger", "after_payment"],
    ["maxReprintCount", "3"],
    ["masterCopiesCount", "1"],
    ["logoUrl", ""]
  ];
  const insertSetting = db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES (?,?)");
  for (const [key, value] of defaultSettings2) {
    insertSetting.run(key, value);
  }
  const copyConfigs = [
    { copy_number: 1, label: "\u0646\u0633\u062E\u0629 \u0627\u0644\u0639\u0645\u064A\u0644" },
    { copy_number: 2, label: "\u0646\u0633\u062E\u0629 \u0627\u0644\u0643\u0627\u0634\u064A\u0631" },
    { copy_number: 3, label: "\u0646\u0633\u062E\u0629 \u0627\u0644\u0645\u062D\u0627\u0633\u0628\u0629" },
    { copy_number: 4, label: "\u0646\u0633\u062E\u0629 \u0627\u0644\u0623\u0631\u0634\u064A\u0641" }
  ];
  const insertCopy = db.prepare("INSERT OR IGNORE INTO receipt_copy_configs (copy_number, label, enabled) VALUES (?,?,?)");
  for (const c of copyConfigs) {
    insertCopy.run(c.copy_number, c.label, c.copy_number <= 2 ? 1 : 0);
  }
  const insertDept = db.prepare(
    "INSERT OR IGNORE INTO department_print_configs (category_id, printer_name, copies, enabled, print_order) VALUES (?,?,?,?,?)"
  );
  catIds.forEach((cid, idx) => {
    insertDept.run(cid, null, 1, 1, idx + 1);
  });
  const now = /* @__PURE__ */ new Date();
  const adminUser = db.prepare("SELECT id FROM users WHERE username='admin'").get();
  const insertOrder = db.prepare(`
    INSERT INTO orders (invoice_number, subtotal, discount, tax, total, payment_method, cash_amount, user_id, created_at)
    VALUES (?,?,?,?,?,?,?,?,?)
  `);
  const insertItem = db.prepare(`
    INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, total, category_id, category_name)
    VALUES (?,?,?,?,?,?,?,?)
  `);
  for (let i = 0; i < 20; i++) {
    const d = new Date(now);
    d.setHours(d.getHours() - i * 2);
    const subtotal = 20500 + i * 3e3;
    const tax = Math.round(subtotal * 0.15);
    const total = subtotal + tax;
    const invNum = `INV-${String(i + 1).padStart(4, "0")}`;
    const result = insertOrder.run(invNum, subtotal, 0, tax, total, "cash", total, adminUser.id, d.toISOString());
    const orderId = result.lastInsertRowid;
    insertItem.run(orderId, 1, "\u0628\u0631\u064A\u0627\u0646\u064A \u062F\u062C\u0627\u062C", 4, 14e3, 56e3, catIds[0], "\u0627\u0644\u0645\u0637\u0628\u062E");
    insertItem.run(orderId, 2, "\u0631\u0632 \u0623\u0628\u064A\u0636", 5, 6500, 32500, catIds[0], "\u0627\u0644\u0645\u0637\u0628\u062E");
  }
}
var import_better_sqlite3, import_node_path, import_node_crypto, import_node_fs, workspaceRoot, dbPath, db, sessions;
var init_sqlite = __esm({
  "artifacts/pos-system/src/backend/server/lib/sqlite.ts"() {
    import_better_sqlite3 = __toESM(require("better-sqlite3"), 1);
    import_node_path = __toESM(require("node:path"), 1);
    import_node_crypto = require("node:crypto");
    import_node_fs = require("node:fs");
    workspaceRoot = process.cwd().endsWith(import_node_path.default.join("artifacts", "api-server")) ? import_node_path.default.resolve(process.cwd(), "../..") : process.cwd();
    dbPath = process.env.OMNISYSTEM_DB_PATH ? import_node_path.default.resolve(process.env.OMNISYSTEM_DB_PATH) : import_node_path.default.resolve(workspaceRoot, "artifacts/api-server/data/pos.db");
    (0, import_node_fs.mkdirSync)(import_node_path.default.dirname(dbPath), { recursive: true });
    db = new import_better_sqlite3.default(dbPath);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    sessions = /* @__PURE__ */ new Map();
    initSchema();
    runMigrations();
    seedData();
  }
});

// artifacts/pos-system/src/backend/server/routes/auth.ts
function getAuthUser(req) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return null;
  const token = auth.slice(7);
  const userId = getSessionUser(token);
  if (!userId) return null;
  const user = db.prepare("SELECT id, username, name, role, active FROM users WHERE id=?").get(userId);
  return user;
}
function checkLicenseStatus() {
  try {
    const lic = db.prepare("SELECT * FROM licenses WHERE active=1 ORDER BY id DESC LIMIT 1").get();
    if (!lic) {
      return { blocked: true, reason: "\u0644\u0627 \u064A\u0648\u062C\u062F \u062A\u0631\u062E\u064A\u0635 \u0641\u0639\u0627\u0644 \u0644\u0644\u0646\u0638\u0627\u0645." };
    }
    const expireDate = new Date(lic.expires_at);
    const currentDate = /* @__PURE__ */ new Date();
    expireDate.setHours(0, 0, 0, 0);
    currentDate.setHours(0, 0, 0, 0);
    const diffTime = expireDate.getTime() - currentDate.getTime();
    const diffDays = Math.ceil(diffTime / (1e3 * 60 * 60 * 24));
    if (diffDays <= 0) {
      return { blocked: true, reason: `\u0644\u0642\u062F \u0627\u0646\u062A\u0647\u062A \u0641\u062A\u0631\u0629 \u0627\u0644\u062A\u0631\u062E\u064A\u0635 \u0627\u0644\u062E\u0627\u0635\u0629 \u0628\u0643 \u0641\u064A \u062A\u0627\u0631\u064A\u062E (${lic.expires_at}).` };
    } else if (diffDays <= 3) {
      return { blocked: true, reason: `\u0641\u062A\u0631\u0629 \u0627\u0644\u062A\u0631\u062E\u064A\u0635 \u0627\u0644\u062E\u0627\u0635\u0629 \u0628\u0643 \u0639\u0644\u0649 \u0648\u0634\u0643 \u0627\u0644\u0627\u0646\u062A\u0647\u0627\u0621 \u0641\u064A \u062A\u0627\u0631\u064A\u062E (${lic.expires_at}) \u0645\u062A\u0628\u0642\u064A ${diffDays} \u0623\u064A\u0627\u0645 \u0641\u0642\u0637.` };
    }
    return { blocked: false };
  } catch (e) {
    return { blocked: false };
  }
}
var import_express2, router2, auth_default;
var init_auth = __esm({
  "artifacts/pos-system/src/backend/server/routes/auth.ts"() {
    import_express2 = require("express");
    init_sqlite();
    router2 = (0, import_express2.Router)();
    router2.post("/auth/login", (req, res) => {
      const { username, password } = req.body;
      if (!username || !password) {
        res.status(400).json({ error: "\u0628\u064A\u0627\u0646\u0627\u062A \u0646\u0627\u0642\u0635\u0629" });
        return;
      }
      if (username !== "developer") {
        const licenseStatus = checkLicenseStatus();
        if (licenseStatus.blocked) {
          res.status(403).json({
            error: "license_blocked",
            message: `${licenseStatus.reason} \u064A\u062C\u0628 \u0627\u0644\u062A\u0648\u0627\u0635\u0644 \u0645\u0639 \u0645\u0633\u0624\u0648\u0644 \u0627\u0644\u0646\u0638\u0627\u0645 \u0645\u0646 \u0634\u0631\u0643\u0629 \u0625\u062A\u0642\u0627\u0646 \u0633\u0648\u0641\u062A \u0639\u0644\u0649 \u0627\u0644\u0631\u0642\u0645: 777146387`
          });
          return;
        }
      }
      const user = db.prepare("SELECT * FROM users WHERE username=?").get(username);
      if (!user || !user.active) {
        res.status(401).json({ error: "\u0627\u0633\u0645 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0623\u0648 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u063A\u064A\u0631 \u0635\u062D\u064A\u062D\u0629" });
        return;
      }
      const ok = verifyPassword(password, user.password_hash);
      if (!ok) {
        res.status(401).json({ error: "\u0627\u0633\u0645 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0623\u0648 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u063A\u064A\u0631 \u0635\u062D\u064A\u062D\u0629" });
        return;
      }
      const token = createSession(user.id);
      const deviceName = req.body.device_name || (req.headers["user-agent"] ? req.headers["user-agent"].split(" ")[0] : "\u0645\u062A\u0635\u0641\u062D \u0627\u0644\u0648\u064A\u0628");
      try {
        db.prepare(`
      INSERT INTO erp_sessions (username, device_name, login_time, status, branch_id, language)
      VALUES (?, ?, datetime('now', 'localtime'), '\u0646\u0634\u0637', 1, '\u0639\u0631\u0628\u064A')
    `).run(user.name, deviceName);
      } catch (err) {
        console.error("Failed to log erp session:", err);
      }
      res.json({
        token,
        user: { id: user.id, username: user.username, name: user.name, role: user.role, active: Boolean(user.active) }
      });
    });
    router2.get("/auth/me", (req, res) => {
      const user = getAuthUser(req);
      if (!user) {
        res.status(401).json({ error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D" });
        return;
      }
      if (user.username !== "developer") {
        const licenseStatus = checkLicenseStatus();
        if (licenseStatus.blocked) {
          res.status(403).json({
            error: "license_blocked",
            message: `${licenseStatus.reason} \u064A\u062C\u0628 \u0627\u0644\u062A\u0648\u0627\u0635\u0644 \u0645\u0639 \u0645\u0633\u0624\u0648\u0644 \u0627\u0644\u0646\u0638\u0627\u0645 \u0645\u0646 \u0634\u0631\u0643\u0629 \u0625\u062A\u0642\u0627\u0646 \u0633\u0648\u0641\u062A \u0639\u0644\u0649 \u0627\u0644\u0631\u0642\u0645: 777146387`
          });
          return;
        }
      }
      res.json({ id: user.id, username: user.username, name: user.name, role: user.role, active: Boolean(user.active) });
    });
    router2.post("/auth/logout", (req, res) => {
      const auth = req.headers.authorization;
      if (auth?.startsWith("Bearer ")) {
        const token = auth.slice(7);
        const userId = getSessionUser(token);
        if (userId) {
          const user = db.prepare("SELECT name FROM users WHERE id=?").get(userId);
          if (user) {
            try {
              db.prepare(`
            UPDATE erp_sessions 
            SET status = '\u062E\u0631\u0648\u062C', logout_time = datetime('now', 'localtime') 
            WHERE username = ? AND status = '\u0646\u0634\u0637'
          `).run(user.name);
            } catch (err) {
              console.error("Failed to log erp session logout:", err);
            }
          }
        }
        deleteSession(token);
      }
      res.json({ ok: true });
    });
    auth_default = router2;
  }
});

// artifacts/pos-system/src/backend/server/routes/categories.ts
var import_express3, router3, categories_default;
var init_categories = __esm({
  "artifacts/pos-system/src/backend/server/routes/categories.ts"() {
    import_express3 = require("express");
    init_sqlite();
    init_auth();
    router3 = (0, import_express3.Router)();
    router3.get("/categories", (_req, res) => {
      const rows = db.prepare("SELECT id, name, color FROM categories ORDER BY name").all();
      res.json(rows);
    });
    router3.post("/categories", (req, res) => {
      const user = getAuthUser(req);
      if (!user) {
        res.status(401).json({ error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D" });
        return;
      }
      const { name, color } = req.body;
      if (!name) {
        res.status(400).json({ error: "\u0627\u0644\u0627\u0633\u0645 \u0645\u0637\u0644\u0648\u0628" });
        return;
      }
      const r = db.prepare("INSERT INTO categories (name, color) VALUES (?,?)").run(name, color ?? null);
      const cat = db.prepare("SELECT * FROM categories WHERE id=?").get(r.lastInsertRowid);
      res.status(201).json(cat);
    });
    router3.put("/categories/:id", (req, res) => {
      const user = getAuthUser(req);
      if (!user) {
        res.status(401).json({ error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D" });
        return;
      }
      const { name, color } = req.body;
      db.prepare("UPDATE categories SET name=?, color=? WHERE id=?").run(name, color ?? null, req.params.id);
      const cat = db.prepare("SELECT * FROM categories WHERE id=?").get(req.params.id);
      res.json(cat);
    });
    router3.delete("/categories/:id", (req, res) => {
      const user = getAuthUser(req);
      if (!user) {
        res.status(401).json({ error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D" });
        return;
      }
      db.prepare("DELETE FROM categories WHERE id=?").run(req.params.id);
      res.status(204).send();
    });
    categories_default = router3;
  }
});

// artifacts/pos-system/src/backend/server/routes/products.ts
var import_express4, router4, products_default;
var init_products = __esm({
  "artifacts/pos-system/src/backend/server/routes/products.ts"() {
    import_express4 = require("express");
    init_sqlite();
    init_auth();
    router4 = (0, import_express4.Router)();
    router4.get("/products", (req, res) => {
      const { categoryId, search } = req.query;
      let sql = `
    SELECT p.id, p.number, p.name, p.price, p.cost, p.barcode,
           p.category_id as categoryId, c.name as categoryName, p.active, p.stock
    FROM products p LEFT JOIN categories c ON c.id = p.category_id
    WHERE 1=1
  `;
      const params = [];
      if (categoryId) {
        sql += " AND p.category_id=?";
        params.push(categoryId);
      }
      if (search) {
        sql += " AND (p.name LIKE ? OR p.barcode LIKE ? OR CAST(p.number AS TEXT) = ?)";
        params.push(`%${search}%`, `%${search}%`, search);
      }
      sql += " ORDER BY p.number";
      const rows = db.prepare(sql).all(...params).map((r) => ({ ...r, active: Boolean(r.active) }));
      res.json(rows);
    });
    router4.get("/products/:id", (req, res) => {
      const row = db.prepare(`
    SELECT p.id, p.number, p.name, p.price, p.cost, p.barcode,
           p.category_id as categoryId, c.name as categoryName, p.active, p.stock
    FROM products p LEFT JOIN categories c ON c.id = p.category_id
    WHERE p.id=?
  `).get(req.params.id);
      if (!row) {
        res.status(404).json({ error: "\u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
        return;
      }
      res.json({ ...row, active: Boolean(row.active) });
    });
    router4.post("/products", (req, res) => {
      const user = getAuthUser(req);
      if (!user) {
        res.status(401).json({ error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D" });
        return;
      }
      const { name, number, price, cost, barcode, categoryId, active, stock } = req.body;
      if (!name || !number || !price) {
        res.status(400).json({ error: "\u0628\u064A\u0627\u0646\u0627\u062A \u0646\u0627\u0642\u0635\u0629" });
        return;
      }
      const r = db.prepare(`
    INSERT INTO products (name, number, price, cost, barcode, category_id, active, stock)
    VALUES (?,?,?,?,?,?,?,?)
  `).run(name, number, price, cost ?? null, barcode ?? null, categoryId ?? null, active !== false ? 1 : 0, stock ?? null);
      const prod = db.prepare(`
    SELECT p.id, p.number, p.name, p.price, p.cost, p.barcode,
           p.category_id as categoryId, c.name as categoryName, p.active, p.stock
    FROM products p LEFT JOIN categories c ON c.id = p.category_id WHERE p.id=?
  `).get(r.lastInsertRowid);
      res.status(201).json({ ...prod, active: Boolean(prod.active) });
    });
    router4.put("/products/:id", (req, res) => {
      const user = getAuthUser(req);
      if (!user) {
        res.status(401).json({ error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D" });
        return;
      }
      const { name, number, price, cost, barcode, categoryId, active, stock } = req.body;
      db.prepare(`
    UPDATE products SET name=?, number=?, price=?, cost=?, barcode=?, category_id=?, active=?, stock=?
    WHERE id=?
  `).run(name, number, price, cost ?? null, barcode ?? null, categoryId ?? null, active !== false ? 1 : 0, stock ?? null, req.params.id);
      const prod = db.prepare(`
    SELECT p.id, p.number, p.name, p.price, p.cost, p.barcode,
           p.category_id as categoryId, c.name as categoryName, p.active, p.stock
    FROM products p LEFT JOIN categories c ON c.id = p.category_id WHERE p.id=?
  `).get(req.params.id);
      res.json({ ...prod, active: Boolean(prod.active) });
    });
    router4.delete("/products/:id", (req, res) => {
      const user = getAuthUser(req);
      if (!user) {
        res.status(401).json({ error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D" });
        return;
      }
      db.prepare("DELETE FROM products WHERE id=?").run(req.params.id);
      res.status(204).send();
    });
    products_default = router4;
  }
});

// artifacts/pos-system/src/backend/server/routes/orders.ts
function formatOrder(o, items) {
  return {
    id: o.id,
    invoiceNumber: o.invoice_number,
    subtotal: o.subtotal,
    discount: o.discount,
    tax: o.tax,
    total: o.total,
    paymentMethod: o.payment_method,
    cashAmount: o.cash_amount,
    cardAmount: o.card_amount,
    customerId: o.customer_id,
    customerName: o.customer_name,
    userId: o.user_id,
    userName: o.user_name,
    note: o.note,
    orderType: o.order_type ?? "dine-in",
    tableNumber: o.table_number ?? null,
    createdAt: o.created_at,
    items: items.map((i) => ({
      productId: i.product_id,
      productName: i.product_name,
      quantity: i.quantity,
      unitPrice: i.unit_price,
      total: i.total,
      categoryId: i.category_id ?? null,
      categoryName: i.category_name ?? null
    }))
  };
}
var import_express5, router5, orders_default;
var init_orders = __esm({
  "artifacts/pos-system/src/backend/server/routes/orders.ts"() {
    import_express5 = require("express");
    init_sqlite();
    init_auth();
    router5 = (0, import_express5.Router)();
    router5.get("/orders", (req, res) => {
      const { startDate, endDate, userId, orderType } = req.query;
      let sql = `
    SELECT o.*, u.name as user_name, c.name as customer_name
    FROM orders o
    LEFT JOIN users u ON u.id = o.user_id
    LEFT JOIN customers c ON c.id = o.customer_id
    WHERE 1=1
  `;
      const params = [];
      if (startDate) {
        sql += " AND DATE(o.created_at) >= ?";
        params.push(startDate);
      }
      if (endDate) {
        sql += " AND DATE(o.created_at) <= ?";
        params.push(endDate);
      }
      if (userId) {
        sql += " AND o.user_id=?";
        params.push(userId);
      }
      if (orderType) {
        sql += " AND o.order_type=?";
        params.push(orderType);
      }
      sql += " ORDER BY o.created_at DESC LIMIT 200";
      const orders = db.prepare(sql).all(...params);
      const result = orders.map((o) => {
        const items = db.prepare("SELECT * FROM order_items WHERE order_id=?").all(o.id);
        return formatOrder(o, items);
      });
      res.json(result);
    });
    router5.post("/orders", (req, res) => {
      const authUser = getAuthUser(req);
      if (!authUser) {
        res.status(401).json({ error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D" });
        return;
      }
      const { items, paymentMethod, subtotal, discount, tax, total, cashAmount, cardAmount, customerId, userId, note, orderType, tableNumber } = req.body;
      if (!items?.length) {
        res.status(400).json({ error: "\u0644\u0627 \u062A\u0648\u062C\u062F \u0645\u0646\u062A\u062C\u0627\u062A" });
        return;
      }
      const count = db.prepare("SELECT COUNT(*) as c FROM orders").get();
      const invoiceNumber = `INV-${String(count.c + 1).padStart(4, "0")}`;
      const effectiveUserId = userId ?? authUser.id;
      const r = db.prepare(`
    INSERT INTO orders (invoice_number, subtotal, discount, tax, total, payment_method, cash_amount, card_amount, customer_id, user_id, note, order_type, table_number)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(
        invoiceNumber,
        subtotal ?? 0,
        discount ?? 0,
        tax ?? 0,
        total,
        paymentMethod ?? "cash",
        cashAmount ?? null,
        cardAmount ?? null,
        customerId ?? null,
        effectiveUserId,
        note ?? null,
        orderType ?? "dine-in",
        tableNumber ?? null
      );
      const orderId = r.lastInsertRowid;
      const insertItem = db.prepare(`
    INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, total, category_id, category_name)
    VALUES (?,?,?,?,?,?,?,?)
  `);
      for (const item of items) {
        const prod = db.prepare("SELECT p.*, c.name as cat_name FROM products p LEFT JOIN categories c ON c.id=p.category_id WHERE p.id=?").get(item.productId);
        const name = prod?.name ?? "\u0645\u0646\u062A\u062C \u0645\u062D\u0630\u0648\u0641";
        insertItem.run(orderId, item.productId, name, item.quantity, item.unitPrice, item.quantity * item.unitPrice, prod?.category_id ?? null, prod?.cat_name ?? null);
      }
      const order = db.prepare(`
    SELECT o.*, u.name as user_name, c.name as customer_name
    FROM orders o LEFT JOIN users u ON u.id=o.user_id LEFT JOIN customers c ON c.id=o.customer_id
    WHERE o.id=?
  `).get(orderId);
      const orderItems = db.prepare("SELECT * FROM order_items WHERE order_id=?").all(orderId);
      res.status(201).json(formatOrder(order, orderItems));
    });
    router5.get("/orders/:id", (req, res) => {
      const order = db.prepare(`
    SELECT o.*, u.name as user_name, c.name as customer_name
    FROM orders o LEFT JOIN users u ON u.id=o.user_id LEFT JOIN customers c ON c.id=o.customer_id
    WHERE o.id=?
  `).get(req.params.id);
      if (!order) {
        res.status(404).json({ error: "\u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
        return;
      }
      const items = db.prepare("SELECT * FROM order_items WHERE order_id=?").all(order.id);
      res.json(formatOrder(order, items));
    });
    router5.delete("/orders/:id", (req, res) => {
      const user = getAuthUser(req);
      if (!user || user.role !== "admin") {
        res.status(403).json({ error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D" });
        return;
      }
      db.prepare("DELETE FROM orders WHERE id=?").run(req.params.id);
      res.status(204).send();
    });
    orders_default = router5;
  }
});

// artifacts/pos-system/src/backend/server/routes/customers.ts
var import_express6, router6, customers_default;
var init_customers = __esm({
  "artifacts/pos-system/src/backend/server/routes/customers.ts"() {
    import_express6 = require("express");
    init_sqlite();
    init_auth();
    router6 = (0, import_express6.Router)();
    router6.get("/customers", (_req, res) => {
      const rows = db.prepare(`
    SELECT c.id, c.name, c.phone, c.email, c.address, c.created_at as createdAt,
           COALESCE(SUM(o.total), 0) as totalPurchases
    FROM customers c
    LEFT JOIN orders o ON o.customer_id = c.id
    GROUP BY c.id ORDER BY c.name
  `).all();
      res.json(rows);
    });
    router6.post("/customers", (req, res) => {
      const user = getAuthUser(req);
      if (!user) {
        res.status(401).json({ error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D" });
        return;
      }
      const { name, phone, email, address } = req.body;
      if (!name) {
        res.status(400).json({ error: "\u0627\u0644\u0627\u0633\u0645 \u0645\u0637\u0644\u0648\u0628" });
        return;
      }
      const r = db.prepare("INSERT INTO customers (name, phone, email, address) VALUES (?,?,?,?)").run(name, phone ?? null, email ?? null, address ?? null);
      const cust = db.prepare("SELECT *, 0 as totalPurchases, created_at as createdAt FROM customers WHERE id=?").get(r.lastInsertRowid);
      res.status(201).json(cust);
    });
    router6.put("/customers/:id", (req, res) => {
      const user = getAuthUser(req);
      if (!user) {
        res.status(401).json({ error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D" });
        return;
      }
      const { name, phone, email, address } = req.body;
      db.prepare("UPDATE customers SET name=?, phone=?, email=?, address=? WHERE id=?").run(name, phone ?? null, email ?? null, address ?? null, req.params.id);
      const cust = db.prepare(`
    SELECT c.id, c.name, c.phone, c.email, c.address, c.created_at as createdAt,
           COALESCE(SUM(o.total), 0) as totalPurchases
    FROM customers c LEFT JOIN orders o ON o.customer_id = c.id WHERE c.id=?
  `).get(req.params.id);
      res.json(cust);
    });
    router6.delete("/customers/:id", (req, res) => {
      const user = getAuthUser(req);
      if (!user) {
        res.status(401).json({ error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D" });
        return;
      }
      db.prepare("DELETE FROM customers WHERE id=?").run(req.params.id);
      res.status(204).send();
    });
    customers_default = router6;
  }
});

// artifacts/pos-system/src/backend/server/routes/users.ts
var import_express7, router7, toUser, users_default;
var init_users = __esm({
  "artifacts/pos-system/src/backend/server/routes/users.ts"() {
    import_express7 = require("express");
    init_sqlite();
    init_auth();
    router7 = (0, import_express7.Router)();
    toUser = (u) => ({ id: u.id, username: u.username, name: u.name, role: u.role, active: Boolean(u.active) });
    router7.get("/users", (req, res) => {
      const user = getAuthUser(req);
      if (!user || user.role !== "admin" && user.role !== "developer") {
        res.status(403).json({ error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D" });
        return;
      }
      let rows = db.prepare("SELECT id, username, name, role, active FROM users ORDER BY name").all();
      if (user.role !== "developer") {
        rows = rows.filter((r) => r.role !== "developer" && r.username !== "developer");
      }
      res.json(rows.map(toUser));
    });
    router7.post("/users", (req, res) => {
      const user = getAuthUser(req);
      if (!user || user.role !== "admin" && user.role !== "developer") {
        res.status(403).json({ error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D" });
        return;
      }
      const { username, name, role, password, active } = req.body;
      if (!username || !name || !role || !password) {
        res.status(400).json({ error: "\u0628\u064A\u0627\u0646\u0627\u062A \u0646\u0627\u0642\u0635\u0629" });
        return;
      }
      if (role === "developer" && user.role !== "developer") {
        res.status(403).json({ error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D \u0644\u063A\u064A\u0631 \u0627\u0644\u0645\u0637\u0648\u0631 \u0628\u062A\u0639\u064A\u064A\u0646 \u062F\u0648\u0631 \u0627\u0644\u0645\u0637\u0648\u0631" });
        return;
      }
      const hash = hashPassword(password);
      const r = db.prepare("INSERT INTO users (username, password_hash, name, role, active) VALUES (?,?,?,?,?)").run(username, hash, name, role, active !== false ? 1 : 0);
      const u = db.prepare("SELECT id, username, name, role, active FROM users WHERE id=?").get(r.lastInsertRowid);
      res.status(201).json(toUser(u));
    });
    router7.put("/users/:id", (req, res) => {
      const user = getAuthUser(req);
      if (!user || user.role !== "admin" && user.role !== "developer") {
        res.status(403).json({ error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D" });
        return;
      }
      const targetUser = db.prepare("SELECT id, username, name, role, active FROM users WHERE id=?").get(req.params.id);
      if (!targetUser) {
        res.status(404).json({ error: "\u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
        return;
      }
      if (targetUser.role === "developer" && user.role !== "developer") {
        res.status(403).json({ error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D \u0628\u0627\u0644\u062A\u0639\u062F\u064A\u0644 \u0639\u0644\u0649 \u062D\u0633\u0627\u0628 \u0627\u0644\u0645\u0637\u0648\u0631" });
        return;
      }
      const { username, name, role, password, active } = req.body;
      if (role === "developer" && user.role !== "developer") {
        res.status(403).json({ error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D \u0644\u063A\u064A\u0631 \u0627\u0644\u0645\u0637\u0648\u0631 \u0628\u062A\u0639\u064A\u064A\u0646 \u062F\u0648\u0631 \u0627\u0644\u0645\u0637\u0648\u0631" });
        return;
      }
      const targetRole = role ?? targetUser.role;
      if (password) {
        const hash = hashPassword(password);
        db.prepare("UPDATE users SET username=?, name=?, role=?, password_hash=?, active=? WHERE id=?").run(username, name, targetRole, hash, active !== false ? 1 : 0, req.params.id);
      } else {
        db.prepare("UPDATE users SET username=?, name=?, role=?, active=? WHERE id=?").run(username, name, targetRole, active !== false ? 1 : 0, req.params.id);
      }
      const u = db.prepare("SELECT id, username, name, role, active FROM users WHERE id=?").get(req.params.id);
      res.json(toUser(u));
    });
    router7.delete("/users/:id", (req, res) => {
      const user = getAuthUser(req);
      if (!user || user.role !== "admin" && user.role !== "developer") {
        res.status(403).json({ error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D" });
        return;
      }
      const targetUser = db.prepare("SELECT id, username, name, role, active FROM users WHERE id=?").get(req.params.id);
      if (targetUser && targetUser.role === "developer" && user.role !== "developer") {
        res.status(403).json({ error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D \u0628\u062D\u0630\u0641 \u062D\u0633\u0627\u0628 \u0627\u0644\u0645\u0637\u0648\u0631" });
        return;
      }
      db.prepare("DELETE FROM users WHERE id=?").run(req.params.id);
      res.status(204).send();
    });
    users_default = router7;
  }
});

// artifacts/pos-system/src/backend/server/routes/dashboard.ts
var import_express8, router8, dashboard_default;
var init_dashboard = __esm({
  "artifacts/pos-system/src/backend/server/routes/dashboard.ts"() {
    import_express8 = require("express");
    init_sqlite();
    router8 = (0, import_express8.Router)();
    router8.get("/dashboard/summary", (_req, res) => {
      const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
      const monthStart = today.slice(0, 7) + "-01";
      const todayStats = db.prepare(`
    SELECT COALESCE(SUM(total),0) as sales, COUNT(*) as orders
    FROM orders WHERE DATE(created_at)=?
  `).get(today);
      const todayProfit = db.prepare(`
    SELECT COALESCE(SUM((oi.unit_price - COALESCE(p.cost,0)) * oi.quantity), 0) as profit
    FROM order_items oi
    JOIN orders o ON o.id=oi.order_id
    LEFT JOIN products p ON p.id=oi.product_id
    WHERE DATE(o.created_at)=?
  `).get(today);
      const monthStats = db.prepare(`
    SELECT COALESCE(SUM(total),0) as sales, COUNT(*) as orders
    FROM orders WHERE DATE(created_at)>=?
  `).get(monthStart);
      const totalProducts = db.prepare("SELECT COUNT(*) as c FROM products WHERE active=1").get().c;
      const totalCustomers = db.prepare("SELECT COUNT(*) as c FROM customers").get().c;
      res.json({
        todaySales: todayStats.sales,
        todayOrders: todayStats.orders,
        todayProfit: todayProfit.profit,
        monthSales: monthStats.sales,
        monthOrders: monthStats.orders,
        totalProducts,
        totalCustomers
      });
    });
    router8.get("/dashboard/top-products", (_req, res) => {
      const monthStart = (/* @__PURE__ */ new Date()).toISOString().slice(0, 7) + "-01";
      const rows = db.prepare(`
    SELECT oi.product_id as productId, oi.product_name as productName,
           SUM(oi.quantity) as totalQty, SUM(oi.total) as totalRevenue
    FROM order_items oi
    JOIN orders o ON o.id=oi.order_id
    WHERE DATE(o.created_at)>=?
    GROUP BY oi.product_id, oi.product_name
    ORDER BY totalQty DESC LIMIT 10
  `).all(monthStart);
      res.json(rows);
    });
    router8.get("/dashboard/sales-by-hour", (_req, res) => {
      const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
      const rows = db.prepare(`
    SELECT CAST(strftime('%H', created_at) AS INTEGER) as hour,
           COALESCE(SUM(total),0) as total, COUNT(*) as orders
    FROM orders
    WHERE DATE(created_at)=?
    GROUP BY hour ORDER BY hour
  `).all(today);
      const result = Array.from({ length: 24 }, (_, h) => {
        const found = rows.find((r) => r.hour === h);
        return { hour: h, total: found?.total ?? 0, orders: found?.orders ?? 0 };
      });
      res.json(result);
    });
    dashboard_default = router8;
  }
});

// artifacts/pos-system/src/backend/server/routes/settings.ts
function getSettingsObj() {
  const rows = db.prepare("SELECT key, value FROM settings").all();
  const map = {};
  for (const r of rows) {
    if (r.value === "true") map[r.key] = true;
    else if (r.value === "false") map[r.key] = false;
    else if (!isNaN(Number(r.value)) && r.value !== "") map[r.key] = Number(r.value);
    else map[r.key] = r.value;
  }
  return {
    businessName: map["businessName"] ?? "\u0645\u0637\u0639\u0645\u064A",
    address: map["address"] ?? null,
    phone: map["phone"] ?? null,
    taxNumber: map["taxNumber"] ?? null,
    taxRate: map["taxRate"] ?? 15,
    currency: map["currency"] ?? "\u0631\u064A\u0627\u0644",
    receiptMessage: map["receiptMessage"] ?? null,
    printLogo: map["printLogo"] ?? true,
    printQr: map["printQr"] ?? false,
    showCashier: map["showCashier"] ?? true,
    showCustomer: map["showCustomer"] ?? true,
    // Receipt format
    receiptPaperSize: map["receiptPaperSize"] ?? "80mm",
    showOrderNumber: map["showOrderNumber"] ?? true,
    showTableNumber: map["showTableNumber"] ?? true,
    showDateTime: map["showDateTime"] ?? true,
    showBarcode: map["showBarcode"] ?? false,
    showOrderType: map["showOrderType"] ?? true,
    showTax: map["showTax"] ?? true,
    showDiscount: map["showDiscount"] ?? true,
    showNotes: map["showNotes"] ?? true,
    // Print behavior
    autoPrintTrigger: map["autoPrintTrigger"] ?? "print_button",
    maxReprintCount: map["maxReprintCount"] ?? 3,
    masterCopiesCount: map["masterCopiesCount"] ?? 2,
    logoUrl: map["logoUrl"] ?? null
  };
}
var import_express9, router9, settings_default;
var init_settings = __esm({
  "artifacts/pos-system/src/backend/server/routes/settings.ts"() {
    import_express9 = require("express");
    init_sqlite();
    init_auth();
    router9 = (0, import_express9.Router)();
    router9.get("/settings", (_req, res) => {
      res.json(getSettingsObj());
    });
    router9.put("/settings", (req, res) => {
      const user = getAuthUser(req);
      if (!user || user.role !== "admin") {
        res.status(403).json({ error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D" });
        return;
      }
      const upsert = db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?,?)");
      const updates = req.body;
      for (const [k, v] of Object.entries(updates)) {
        upsert.run(k, String(v));
      }
      res.json(getSettingsObj());
    });
    settings_default = router9;
  }
});

// artifacts/pos-system/src/backend/server/routes/reports.ts
var import_express10, router10, reports_default;
var init_reports = __esm({
  "artifacts/pos-system/src/backend/server/routes/reports.ts"() {
    import_express10 = require("express");
    init_sqlite();
    router10 = (0, import_express10.Router)();
    router10.get("/reports/sales", (req, res) => {
      const { startDate, endDate, groupBy = "day" } = req.query;
      let format = "%Y-%m-%d";
      if (groupBy === "month") format = "%Y-%m";
      if (groupBy === "year") format = "%Y";
      let sql = `
    SELECT strftime(?, created_at) as period,
           COALESCE(SUM(total), 0) as total,
           COALESCE(SUM(subtotal), 0) as subtotal,
           COALESCE(SUM(discount), 0) as discount,
           COALESCE(SUM(tax), 0) as tax,
           COUNT(*) as orders
    FROM orders WHERE 1=1
  `;
      const params = [format];
      if (startDate) {
        sql += " AND DATE(created_at)>=?";
        params.push(startDate);
      }
      if (endDate) {
        sql += " AND DATE(created_at)<=?";
        params.push(endDate);
      }
      sql += " GROUP BY period ORDER BY period";
      const rows = db.prepare(sql).all(...params);
      res.json(rows);
    });
    router10.get("/reports/by-cashier", (req, res) => {
      const { startDate, endDate } = req.query;
      let sql = `
    SELECT u.id as userId, u.name as userName,
           COUNT(o.id) as orders,
           COALESCE(SUM(o.total), 0) as total,
           COALESCE(SUM(o.subtotal), 0) as subtotal,
           COALESCE(SUM(o.discount), 0) as discount,
           COALESCE(SUM(o.tax), 0) as tax
    FROM orders o
    JOIN users u ON u.id = o.user_id
    WHERE 1=1
  `;
      const params = [];
      if (startDate) {
        sql += " AND DATE(o.created_at)>=?";
        params.push(startDate);
      }
      if (endDate) {
        sql += " AND DATE(o.created_at)<=?";
        params.push(endDate);
      }
      sql += " GROUP BY u.id, u.name ORDER BY total DESC";
      const rows = db.prepare(sql).all(...params);
      res.json(rows);
    });
    router10.get("/reports/by-product", (req, res) => {
      const { startDate, endDate, limit = "20" } = req.query;
      let sql = `
    SELECT oi.product_id as productId, oi.product_name as productName,
           oi.category_name as categoryName,
           SUM(oi.quantity) as totalQty,
           COALESCE(SUM(oi.total), 0) as totalRevenue,
           COALESCE(SUM((oi.unit_price - COALESCE(p.cost, 0)) * oi.quantity), 0) as totalProfit,
           COUNT(DISTINCT oi.order_id) as orderCount
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    LEFT JOIN products p ON p.id = oi.product_id
    WHERE 1=1
  `;
      const params = [];
      if (startDate) {
        sql += " AND DATE(o.created_at)>=?";
        params.push(startDate);
      }
      if (endDate) {
        sql += " AND DATE(o.created_at)<=?";
        params.push(endDate);
      }
      sql += " GROUP BY oi.product_id, oi.product_name, oi.category_name ORDER BY totalQty DESC LIMIT ?";
      params.push(Number(limit) || 20);
      const rows = db.prepare(sql).all(...params);
      res.json(rows);
    });
    router10.get("/reports/by-category", (req, res) => {
      const { startDate, endDate } = req.query;
      let sql = `
    SELECT oi.category_id as categoryId,
           COALESCE(oi.category_name, '\u063A\u064A\u0631 \u0645\u0635\u0646\u0651\u0641') as categoryName,
           SUM(oi.quantity) as totalQty,
           COALESCE(SUM(oi.total), 0) as totalRevenue,
           COUNT(DISTINCT oi.order_id) as orderCount
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE 1=1
  `;
      const params = [];
      if (startDate) {
        sql += " AND DATE(o.created_at)>=?";
        params.push(startDate);
      }
      if (endDate) {
        sql += " AND DATE(o.created_at)<=?";
        params.push(endDate);
      }
      sql += " GROUP BY oi.category_id, oi.category_name ORDER BY totalRevenue DESC";
      const rows = db.prepare(sql).all(...params);
      res.json(rows);
    });
    router10.get("/reports/by-payment", (req, res) => {
      const { startDate, endDate } = req.query;
      let sql = `
    SELECT payment_method as paymentMethod,
           COUNT(*) as orders,
           COALESCE(SUM(total), 0) as total
    FROM orders WHERE 1=1
  `;
      const params = [];
      if (startDate) {
        sql += " AND DATE(created_at)>=?";
        params.push(startDate);
      }
      if (endDate) {
        sql += " AND DATE(created_at)<=?";
        params.push(endDate);
      }
      sql += " GROUP BY payment_method ORDER BY total DESC";
      const rows = db.prepare(sql).all(...params);
      res.json(rows);
    });
    reports_default = router10;
  }
});

// artifacts/pos-system/src/backend/server/routes/print-config.ts
function formatDeptConfig(r) {
  return {
    id: r.id,
    categoryId: r.category_id,
    categoryName: r.category_name ?? null,
    printerName: r.printer_name ?? null,
    copies: r.copies,
    enabled: Boolean(r.enabled),
    printOrder: r.print_order
  };
}
var import_express11, router11, print_config_default;
var init_print_config = __esm({
  "artifacts/pos-system/src/backend/server/routes/print-config.ts"() {
    import_express11 = require("express");
    init_sqlite();
    init_auth();
    router11 = (0, import_express11.Router)();
    router11.get("/print-config/receipt-copies", (_req, res) => {
      const rows = db.prepare("SELECT * FROM receipt_copy_configs ORDER BY copy_number").all();
      res.json(rows.map((r) => ({
        id: r.id,
        copyNumber: r.copy_number,
        label: r.label,
        enabled: Boolean(r.enabled)
      })));
    });
    router11.post("/print-config/receipt-copies", (req, res) => {
      const user = getAuthUser(req);
      if (!user || user.role !== "admin") {
        res.status(403).json({ error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D" });
        return;
      }
      const { copyNumber, label, enabled } = req.body;
      if (!copyNumber || !label) {
        res.status(400).json({ error: "\u0628\u064A\u0627\u0646\u0627\u062A \u0646\u0627\u0642\u0635\u0629" });
        return;
      }
      const r = db.prepare(
        "INSERT INTO receipt_copy_configs (copy_number, label, enabled) VALUES (?,?,?)"
      ).run(copyNumber, label, enabled !== false ? 1 : 0);
      const row = db.prepare("SELECT * FROM receipt_copy_configs WHERE id=?").get(r.lastInsertRowid);
      res.status(201).json({ id: row.id, copyNumber: row.copy_number, label: row.label, enabled: Boolean(row.enabled) });
    });
    router11.put("/print-config/receipt-copies/:id", (req, res) => {
      const user = getAuthUser(req);
      if (!user || user.role !== "admin") {
        res.status(403).json({ error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D" });
        return;
      }
      const { copyNumber, label, enabled } = req.body;
      db.prepare(
        "UPDATE receipt_copy_configs SET copy_number=?, label=?, enabled=? WHERE id=?"
      ).run(copyNumber, label, enabled !== false ? 1 : 0, req.params.id);
      const row = db.prepare("SELECT * FROM receipt_copy_configs WHERE id=?").get(req.params.id);
      if (!row) {
        res.status(404).json({ error: "\u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
        return;
      }
      res.json({ id: row.id, copyNumber: row.copy_number, label: row.label, enabled: Boolean(row.enabled) });
    });
    router11.delete("/print-config/receipt-copies/:id", (req, res) => {
      const user = getAuthUser(req);
      if (!user || user.role !== "admin") {
        res.status(403).json({ error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D" });
        return;
      }
      db.prepare("DELETE FROM receipt_copy_configs WHERE id=?").run(req.params.id);
      res.status(204).send();
    });
    router11.get("/print-config/departments", (_req, res) => {
      const rows = db.prepare(`
    SELECT d.*, c.name as category_name
    FROM department_print_configs d
    LEFT JOIN categories c ON c.id = d.category_id
    ORDER BY d.print_order
  `).all();
      res.json(rows.map(formatDeptConfig));
    });
    router11.post("/print-config/departments", (req, res) => {
      const user = getAuthUser(req);
      if (!user || user.role !== "admin") {
        res.status(403).json({ error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D" });
        return;
      }
      const { categoryId, printerName, copies, enabled, printOrder } = req.body;
      const r = db.prepare(
        "INSERT INTO department_print_configs (category_id, printer_name, copies, enabled, print_order) VALUES (?,?,?,?,?)"
      ).run(categoryId ?? null, printerName ?? null, copies ?? 1, enabled !== false ? 1 : 0, printOrder ?? 0);
      const row = db.prepare(`
    SELECT d.*, c.name as category_name FROM department_print_configs d
    LEFT JOIN categories c ON c.id = d.category_id WHERE d.id=?
  `).get(r.lastInsertRowid);
      res.status(201).json(formatDeptConfig(row));
    });
    router11.put("/print-config/departments/:id", (req, res) => {
      const user = getAuthUser(req);
      if (!user || user.role !== "admin") {
        res.status(403).json({ error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D" });
        return;
      }
      const { categoryId, printerName, copies, enabled, printOrder } = req.body;
      db.prepare(
        "UPDATE department_print_configs SET category_id=?, printer_name=?, copies=?, enabled=?, print_order=? WHERE id=?"
      ).run(categoryId ?? null, printerName ?? null, copies ?? 1, enabled !== false ? 1 : 0, printOrder ?? 0, req.params.id);
      const row = db.prepare(`
    SELECT d.*, c.name as category_name FROM department_print_configs d
    LEFT JOIN categories c ON c.id = d.category_id WHERE d.id=?
  `).get(req.params.id);
      if (!row) {
        res.status(404).json({ error: "\u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
        return;
      }
      res.json(formatDeptConfig(row));
    });
    router11.delete("/print-config/departments/:id", (req, res) => {
      const user = getAuthUser(req);
      if (!user || user.role !== "admin") {
        res.status(403).json({ error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D" });
        return;
      }
      db.prepare("DELETE FROM department_print_configs WHERE id=?").run(req.params.id);
      res.status(204).send();
    });
    print_config_default = router11;
  }
});

// artifacts/pos-system/src/backend/server/routes/print-log.ts
function formatLog(r) {
  return {
    id: r.id,
    orderId: r.order_id,
    invoiceNumber: r.invoice_number,
    receiptType: r.receipt_type,
    departmentName: r.department_name ?? null,
    printerName: r.printer_name ?? null,
    printedAt: r.printed_at,
    userId: r.user_id,
    userName: r.user_name ?? null,
    copies: r.copies,
    status: r.status,
    reprintReason: r.reprint_reason ?? null,
    reprintCount: r.reprint_count
  };
}
var import_express12, router12, print_log_default;
var init_print_log = __esm({
  "artifacts/pos-system/src/backend/server/routes/print-log.ts"() {
    import_express12 = require("express");
    init_sqlite();
    init_auth();
    router12 = (0, import_express12.Router)();
    router12.get("/print-log", (req, res) => {
      const { orderId, startDate, endDate } = req.query;
      let sql = `
    SELECT p.*, u.name as user_name
    FROM print_log p
    LEFT JOIN users u ON u.id = p.user_id
    WHERE 1=1
  `;
      const params = [];
      if (orderId) {
        sql += " AND p.order_id=?";
        params.push(orderId);
      }
      if (startDate) {
        sql += " AND DATE(p.printed_at) >= ?";
        params.push(startDate);
      }
      if (endDate) {
        sql += " AND DATE(p.printed_at) <= ?";
        params.push(endDate);
      }
      sql += " ORDER BY p.printed_at DESC LIMIT 500";
      const rows = db.prepare(sql).all(...params);
      res.json(rows.map(formatLog));
    });
    router12.post("/print-log", (req, res) => {
      const authUser = getAuthUser(req);
      if (!authUser) {
        res.status(401).json({ error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D" });
        return;
      }
      const { orderId, invoiceNumber, receiptType, departmentName, printerName, copies, status, reprintReason, reprintCount } = req.body;
      if (!orderId || !invoiceNumber || !receiptType) {
        res.status(400).json({ error: "\u0628\u064A\u0627\u0646\u0627\u062A \u0646\u0627\u0642\u0635\u0629" });
        return;
      }
      const r = db.prepare(`
    INSERT INTO print_log (order_id, invoice_number, receipt_type, department_name, printer_name, user_id, copies, status, reprint_reason, reprint_count)
    VALUES (?,?,?,?,?,?,?,?,?,?)
  `).run(
        orderId,
        invoiceNumber,
        receiptType,
        departmentName ?? null,
        printerName ?? null,
        authUser.id,
        copies ?? 1,
        status ?? "success",
        reprintReason ?? null,
        reprintCount ?? 0
      );
      const row = db.prepare(`
    SELECT p.*, u.name as user_name FROM print_log p
    LEFT JOIN users u ON u.id = p.user_id WHERE p.id=?
  `).get(r.lastInsertRowid);
      res.status(201).json(formatLog(row));
    });
    router12.get("/print-log/reprint-count/:orderId", (req, res) => {
      const row = db.prepare(
        "SELECT COALESCE(MAX(reprint_count), 0) as count FROM print_log WHERE order_id=? AND receipt_type='master'"
      ).get(req.params.orderId);
      res.json({ reprintCount: row?.count ?? 0 });
    });
    print_log_default = router12;
  }
});

// artifacts/pos-system/src/backend/server/routes/printers.ts
function listPrinters() {
  const os = (0, import_node_os.platform)();
  try {
    if (os === "win32") {
      const out = (0, import_node_child_process.execSync)(
        `powershell -Command "Get-Printer | Select-Object -ExpandProperty Name"`,
        { timeout: 5e3, encoding: "utf8" }
      );
      return out.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
    } else {
      const out = (0, import_node_child_process.execSync)("lpstat -a 2>/dev/null || lpstat -p 2>/dev/null || echo ''", {
        timeout: 5e3,
        encoding: "utf8",
        shell: "/bin/bash"
      });
      return out.split(/\r?\n/).map((line) => {
        const match = line.match(/^(\S+)/);
        return match ? match[1] : "";
      }).filter(Boolean);
    }
  } catch {
    return [];
  }
}
function printViaSystem(printerName, content, copies) {
  const os = (0, import_node_os.platform)();
  const tmpFile = (0, import_node_path2.join)((0, import_node_os2.tmpdir)(), `pos-receipt-${(0, import_node_crypto2.randomBytes)(6).toString("hex")}.txt`);
  try {
    const ws = (0, import_node_fs2.createWriteStream)(tmpFile, { encoding: "utf8" });
    ws.write(content);
    ws.end();
    for (let i = 0; i < copies; i++) {
      if (os === "win32") {
        (0, import_node_child_process.execSync)(`print /D:"${printerName}" "${tmpFile}"`, { timeout: 1e4 });
      } else {
        (0, import_node_child_process.execSync)(`lp -d "${printerName}" "${tmpFile}"`, { timeout: 1e4, shell: "/bin/bash" });
      }
    }
  } finally {
    try {
      if ((0, import_node_fs2.existsSync)(tmpFile)) (0, import_node_fs2.unlinkSync)(tmpFile);
    } catch {
    }
  }
}
function printViaTcp(host, port, content, copies) {
  return new Promise((resolve, reject) => {
    let sent = 0;
    function sendCopy() {
      if (sent >= copies) {
        resolve();
        return;
      }
      const client = new import_node_net.default.Socket();
      client.connect(port, host, () => {
        client.write(Buffer.from(content, "utf8"), () => {
          client.end();
        });
      });
      client.on("close", () => {
        sent++;
        sendCopy();
      });
      client.on("error", reject);
      client.setTimeout(8e3, () => {
        client.destroy();
        reject(new Error("TCP print timeout"));
      });
    }
    sendCopy();
  });
}
var import_express13, import_node_child_process, import_node_os, import_node_fs2, import_node_os2, import_node_path2, import_node_crypto2, import_node_net, router13, printers_default;
var init_printers = __esm({
  "artifacts/pos-system/src/backend/server/routes/printers.ts"() {
    import_express13 = require("express");
    import_node_child_process = require("node:child_process");
    import_node_os = require("node:os");
    import_node_fs2 = require("node:fs");
    import_node_os2 = require("node:os");
    import_node_path2 = require("node:path");
    import_node_crypto2 = require("node:crypto");
    import_node_net = __toESM(require("node:net"), 1);
    router13 = (0, import_express13.Router)();
    router13.get("/printers/list", (_req, res) => {
      const printers = listPrinters();
      res.json(printers);
    });
    router13.post("/printers/print", async (req, res) => {
      const { printerName, content, copies = 1 } = req.body;
      if (!content) {
        res.status(400).json({ ok: false, message: "content is required" });
        return;
      }
      try {
        if (!printerName) {
          res.json({ ok: false, message: "\u0644\u0627 \u062A\u0648\u062C\u062F \u0637\u0627\u0628\u0639\u0629 \u0645\u062D\u062F\u062F\u0629" });
          return;
        }
        const ipPortMatch = printerName.match(/^(\d{1,3}(?:\.\d{1,3}){3})(?::(\d+))?$/);
        if (ipPortMatch) {
          const host = ipPortMatch[1];
          const port = ipPortMatch[2] ? parseInt(ipPortMatch[2]) : 9100;
          await printViaTcp(host, port, content, copies);
        } else {
          printViaSystem(printerName, content, copies);
        }
        res.json({ ok: true, message: "\u062A\u0645\u062A \u0627\u0644\u0637\u0628\u0627\u0639\u0629 \u0628\u0646\u062C\u0627\u062D" });
      } catch (err) {
        res.json({ ok: false, message: err?.message ?? "\u0641\u0634\u0644\u062A \u0627\u0644\u0637\u0628\u0627\u0639\u0629" });
      }
    });
    printers_default = router13;
  }
});

// artifacts/pos-system/src/backend/server/routes/printer-settings.ts
function getRow() {
  return db.prepare("SELECT * FROM printer_settings WHERE id = 1").get();
}
function toApi(row) {
  if (!row) return defaultSettings();
  return {
    paperWidth: row.paper_width,
    leftMargin: row.left_margin,
    rightMargin: row.right_margin,
    topMargin: row.top_margin,
    bottomMargin: row.bottom_margin,
    fontSize: row.font_size,
    lineSpacing: row.line_spacing,
    charactersPerLine: row.characters_per_line,
    mainPrinterName: row.main_printer_name ?? null
  };
}
function defaultSettings() {
  return { paperWidth: 80, leftMargin: 4, rightMargin: 4, topMargin: 2, bottomMargin: 2, fontSize: 10, lineSpacing: 2, charactersPerLine: 48, mainPrinterName: null };
}
var import_express14, router14, printer_settings_default;
var init_printer_settings = __esm({
  "artifacts/pos-system/src/backend/server/routes/printer-settings.ts"() {
    import_express14 = require("express");
    init_sqlite();
    init_auth();
    router14 = (0, import_express14.Router)();
    router14.get("/printer-settings", (_req, res) => {
      const row = getRow();
      res.json(toApi(row));
    });
    router14.put("/printer-settings", (req, res) => {
      const user = getAuthUser(req);
      if (!user || user.role !== "admin") {
        res.status(403).json({ error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D" });
        return;
      }
      const b = req.body;
      db.prepare(`
    INSERT INTO printer_settings (id, paper_width, left_margin, right_margin, top_margin, bottom_margin, font_size, line_spacing, characters_per_line, main_printer_name)
    VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      paper_width = excluded.paper_width,
      left_margin = excluded.left_margin,
      right_margin = excluded.right_margin,
      top_margin = excluded.top_margin,
      bottom_margin = excluded.bottom_margin,
      font_size = excluded.font_size,
      line_spacing = excluded.line_spacing,
      characters_per_line = excluded.characters_per_line,
      main_printer_name = excluded.main_printer_name
  `).run(
        b.paperWidth ?? 80,
        b.leftMargin ?? 4,
        b.rightMargin ?? 4,
        b.topMargin ?? 2,
        b.bottomMargin ?? 2,
        b.fontSize ?? 10,
        b.lineSpacing ?? 2,
        b.charactersPerLine ?? 48,
        b.mainPrinterName ?? null
      );
      res.json(toApi(getRow()));
    });
    printer_settings_default = router14;
  }
});

// artifacts/pos-system/src/backend/server/routes/hr.ts
function requireAdmin(req, res) {
  const user = getAuthUser(req);
  if (!user || user.role !== "admin") {
    res.status(403).json({ error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D" });
    return false;
  }
  return true;
}
var import_express15, router15, hr_default;
var init_hr = __esm({
  "artifacts/pos-system/src/backend/server/routes/hr.ts"() {
    import_express15 = require("express");
    init_sqlite();
    init_auth();
    router15 = (0, import_express15.Router)();
    router15.get("/hr/departments", (req, res) => {
      if (!requireAdmin(req, res)) return;
      const rows = db.prepare("SELECT * FROM hr_departments ORDER BY name").all();
      res.json(rows);
    });
    router15.post("/hr/departments", (req, res) => {
      if (!requireAdmin(req, res)) return;
      const { name, budget } = req.body;
      if (!name) {
        res.status(400).json({ error: "\u0627\u0633\u0645 \u0627\u0644\u0642\u0633\u0645 \u0645\u0637\u0644\u0648\u0628" });
        return;
      }
      const r = db.prepare("INSERT INTO hr_departments (name, budget) VALUES (?,?)").run(name, budget ?? 0);
      res.status(201).json(db.prepare("SELECT * FROM hr_departments WHERE id=?").get(r.lastInsertRowid));
    });
    router15.put("/hr/departments/:id", (req, res) => {
      if (!requireAdmin(req, res)) return;
      const { name, budget } = req.body;
      db.prepare("UPDATE hr_departments SET name=?, budget=? WHERE id=?").run(name, budget ?? 0, req.params.id);
      res.json(db.prepare("SELECT * FROM hr_departments WHERE id=?").get(req.params.id));
    });
    router15.delete("/hr/departments/:id", (req, res) => {
      if (!requireAdmin(req, res)) return;
      db.prepare("DELETE FROM hr_departments WHERE id=?").run(req.params.id);
      res.status(204).send();
    });
    router15.get("/hr/employees", (req, res) => {
      if (!requireAdmin(req, res)) return;
      const rows = db.prepare(`
    SELECT e.*, d.name as department_name
    FROM hr_employees e
    LEFT JOIN hr_departments d ON d.id = e.department_id
    ORDER BY e.name
  `).all();
      res.json(rows.map((r) => ({ ...r, active: Boolean(r.active) })));
    });
    router15.get("/hr/employees/:id", (req, res) => {
      if (!requireAdmin(req, res)) return;
      const row = db.prepare(`
    SELECT e.*, d.name as department_name
    FROM hr_employees e LEFT JOIN hr_departments d ON d.id=e.department_id
    WHERE e.id=?
  `).get(req.params.id);
      if (!row) {
        res.status(404).json({ error: "\u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
        return;
      }
      res.json({ ...row, active: Boolean(row.active) });
    });
    router15.post("/hr/employees", (req, res) => {
      if (!requireAdmin(req, res)) return;
      const { employee_number, name, phone, position, department_id, basic_salary, hire_date, active } = req.body;
      if (!name || !employee_number) {
        res.status(400).json({ error: "\u0627\u0644\u0627\u0633\u0645 \u0648\u0631\u0642\u0645 \u0627\u0644\u0645\u0648\u0638\u0641 \u0645\u0637\u0644\u0648\u0628\u0627\u0646" });
        return;
      }
      const r = db.prepare(`
    INSERT INTO hr_employees (employee_number, name, phone, position, department_id, basic_salary, hire_date, active)
    VALUES (?,?,?,?,?,?,?,?)
  `).run(employee_number, name, phone ?? null, position ?? null, department_id ?? null, basic_salary ?? 0, hire_date ?? null, active !== false ? 1 : 0);
      const emp = db.prepare(`
    SELECT e.*, d.name as department_name FROM hr_employees e
    LEFT JOIN hr_departments d ON d.id=e.department_id WHERE e.id=?
  `).get(r.lastInsertRowid);
      res.status(201).json({ ...emp, active: Boolean(emp.active) });
    });
    router15.put("/hr/employees/:id", (req, res) => {
      if (!requireAdmin(req, res)) return;
      const { employee_number, name, phone, position, department_id, basic_salary, hire_date, active } = req.body;
      db.prepare(`
    UPDATE hr_employees SET employee_number=?, name=?, phone=?, position=?, department_id=?, basic_salary=?, hire_date=?, active=?
    WHERE id=?
  `).run(employee_number, name, phone ?? null, position ?? null, department_id ?? null, basic_salary ?? 0, hire_date ?? null, active !== false ? 1 : 0, req.params.id);
      const emp = db.prepare(`
    SELECT e.*, d.name as department_name FROM hr_employees e
    LEFT JOIN hr_departments d ON d.id=e.department_id WHERE e.id=?
  `).get(req.params.id);
      res.json({ ...emp, active: Boolean(emp.active) });
    });
    router15.delete("/hr/employees/:id", (req, res) => {
      if (!requireAdmin(req, res)) return;
      db.prepare("DELETE FROM hr_employees WHERE id=?").run(req.params.id);
      res.status(204).send();
    });
    router15.get("/hr/salaries", (req, res) => {
      if (!requireAdmin(req, res)) return;
      const { employee_id, month } = req.query;
      let sql = `
    SELECT s.*, e.name as employee_name, e.employee_number
    FROM hr_salaries s JOIN hr_employees e ON e.id=s.employee_id
    WHERE 1=1
  `;
      const params = [];
      if (employee_id) {
        sql += " AND s.employee_id=?";
        params.push(employee_id);
      }
      if (month) {
        sql += " AND s.month=?";
        params.push(month);
      }
      sql += " ORDER BY s.month DESC, e.name";
      res.json(db.prepare(sql).all(...params));
    });
    router15.post("/hr/salaries", (req, res) => {
      if (!requireAdmin(req, res)) return;
      const { employee_id, month, basic_salary, bonuses, deductions, notes } = req.body;
      if (!employee_id || !month) {
        res.status(400).json({ error: "\u0627\u0644\u0645\u0648\u0638\u0641 \u0648\u0627\u0644\u0634\u0647\u0631 \u0645\u0637\u0644\u0648\u0628\u0627\u0646" });
        return;
      }
      const existing = db.prepare("SELECT id FROM hr_salaries WHERE employee_id=? AND month=?").get(employee_id, month);
      if (existing) {
        res.status(400).json({ error: "\u062A\u0645 \u0625\u0636\u0627\u0641\u0629 \u0631\u0627\u062A\u0628 \u0647\u0630\u0627 \u0627\u0644\u0634\u0647\u0631 \u0645\u0633\u0628\u0642\u0627\u064B" });
        return;
      }
      const net2 = (basic_salary ?? 0) + (bonuses ?? 0) - (deductions ?? 0);
      const r = db.prepare(`
    INSERT INTO hr_salaries (employee_id, month, basic_salary, bonuses, deductions, net_salary, status, notes)
    VALUES (?,?,?,?,?,?,'pending',?)
  `).run(employee_id, month, basic_salary ?? 0, bonuses ?? 0, deductions ?? 0, net2, notes ?? null);
      res.status(201).json(db.prepare(`
    SELECT s.*, e.name as employee_name, e.employee_number FROM hr_salaries s
    JOIN hr_employees e ON e.id=s.employee_id WHERE s.id=?
  `).get(r.lastInsertRowid));
    });
    router15.put("/hr/salaries/:id", (req, res) => {
      if (!requireAdmin(req, res)) return;
      const { basic_salary, bonuses, deductions, status, payment_date, notes } = req.body;
      const net2 = (basic_salary ?? 0) + (bonuses ?? 0) - (deductions ?? 0);
      db.prepare(`
    UPDATE hr_salaries SET basic_salary=?, bonuses=?, deductions=?, net_salary=?, status=?, payment_date=?, notes=?
    WHERE id=?
  `).run(basic_salary ?? 0, bonuses ?? 0, deductions ?? 0, net2, status ?? "pending", payment_date ?? null, notes ?? null, req.params.id);
      res.json(db.prepare(`
    SELECT s.*, e.name as employee_name, e.employee_number FROM hr_salaries s
    JOIN hr_employees e ON e.id=s.employee_id WHERE s.id=?
  `).get(req.params.id));
    });
    router15.delete("/hr/salaries/:id", (req, res) => {
      if (!requireAdmin(req, res)) return;
      db.prepare("DELETE FROM hr_salaries WHERE id=?").run(req.params.id);
      res.status(204).send();
    });
    router15.get("/hr/attendance", (req, res) => {
      if (!requireAdmin(req, res)) return;
      const { employee_id, date, month } = req.query;
      let sql = `
    SELECT a.*, e.name as employee_name, e.employee_number
    FROM hr_attendance a JOIN hr_employees e ON e.id=a.employee_id
    WHERE 1=1
  `;
      const params = [];
      if (employee_id) {
        sql += " AND a.employee_id=?";
        params.push(employee_id);
      }
      if (date) {
        sql += " AND a.date=?";
        params.push(date);
      }
      if (month) {
        sql += " AND strftime('%Y-%m', a.date)=?";
        params.push(month);
      }
      sql += " ORDER BY a.date DESC, e.name";
      res.json(db.prepare(sql).all(...params));
    });
    router15.post("/hr/attendance", (req, res) => {
      if (!requireAdmin(req, res)) return;
      const { employee_id, date, check_in, check_out, status, notes } = req.body;
      if (!employee_id || !date) {
        res.status(400).json({ error: "\u0627\u0644\u0645\u0648\u0638\u0641 \u0648\u0627\u0644\u062A\u0627\u0631\u064A\u062E \u0645\u0637\u0644\u0648\u0628\u0627\u0646" });
        return;
      }
      const existing = db.prepare("SELECT id FROM hr_attendance WHERE employee_id=? AND date=?").get(employee_id, date);
      if (existing) {
        db.prepare("UPDATE hr_attendance SET check_in=?, check_out=?, status=?, notes=? WHERE employee_id=? AND date=?").run(check_in ?? null, check_out ?? null, status ?? "present", notes ?? null, employee_id, date);
        res.json(db.prepare("SELECT a.*, e.name as employee_name FROM hr_attendance a JOIN hr_employees e ON e.id=a.employee_id WHERE a.employee_id=? AND a.date=?").get(employee_id, date));
        return;
      }
      const r = db.prepare(`
    INSERT INTO hr_attendance (employee_id, date, check_in, check_out, status, notes)
    VALUES (?,?,?,?,?,?)
  `).run(employee_id, date, check_in ?? null, check_out ?? null, status ?? "present", notes ?? null);
      res.status(201).json(db.prepare(`
    SELECT a.*, e.name as employee_name FROM hr_attendance a
    JOIN hr_employees e ON e.id=a.employee_id WHERE a.id=?
  `).get(r.lastInsertRowid));
    });
    router15.put("/hr/attendance/:id", (req, res) => {
      if (!requireAdmin(req, res)) return;
      const { check_in, check_out, status, notes } = req.body;
      db.prepare("UPDATE hr_attendance SET check_in=?, check_out=?, status=?, notes=? WHERE id=?").run(check_in ?? null, check_out ?? null, status ?? "present", notes ?? null, req.params.id);
      res.json(db.prepare("SELECT a.*, e.name as employee_name FROM hr_attendance a JOIN hr_employees e ON e.id=a.employee_id WHERE a.id=?").get(req.params.id));
    });
    router15.delete("/hr/attendance/:id", (req, res) => {
      if (!requireAdmin(req, res)) return;
      db.prepare("DELETE FROM hr_attendance WHERE id=?").run(req.params.id);
      res.status(204).send();
    });
    router15.get("/hr/meal-deductions", (req, res) => {
      if (!requireAdmin(req, res)) return;
      const { employee_id, month } = req.query;
      let sql = `SELECT md.*, e.name as employee_name, e.employee_number FROM meal_deductions md
    JOIN hr_employees e ON e.id=md.employee_id WHERE 1=1`;
      const params = [];
      if (employee_id) {
        sql += " AND md.employee_id=?";
        params.push(employee_id);
      }
      if (month) {
        sql += " AND strftime('%Y-%m', md.created_at)=?";
        params.push(month);
      }
      sql += " ORDER BY md.created_at DESC";
      res.json(db.prepare(sql).all(...params));
    });
    router15.post("/hr/meal-deductions", (req, res) => {
      const user = getAuthUser(req);
      if (!user) {
        res.status(401).json({ error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D" });
        return;
      }
      const { employee_id, employee_name, employee_number, order_id, invoice_number, amount, notes } = req.body;
      if (!employee_id || !amount) {
        res.status(400).json({ error: "\u0627\u0644\u0645\u0648\u0638\u0641 \u0648\u0627\u0644\u0645\u0628\u0644\u063A \u0645\u0637\u0644\u0648\u0628\u0627\u0646" });
        return;
      }
      const r = db.prepare(`
    INSERT INTO meal_deductions (employee_id, employee_name, employee_number, order_id, invoice_number, amount, cashier_id, cashier_name, notes)
    VALUES (?,?,?,?,?,?,?,?,?)
  `).run(employee_id, employee_name ?? "", employee_number ?? "", order_id ?? null, invoice_number ?? null, amount, user.id, user.name, notes ?? null);
      res.status(201).json(db.prepare("SELECT * FROM meal_deductions WHERE id=?").get(r.lastInsertRowid));
    });
    router15.get("/hr/employees/by-number/:num", (req, res) => {
      const user = getAuthUser(req);
      if (!user) {
        res.status(401).json({ error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D" });
        return;
      }
      const emp = db.prepare(`
    SELECT e.*, d.name as department_name,
      (SELECT COALESCE(SUM(md.amount),0) FROM meal_deductions md WHERE md.employee_id=e.id AND strftime('%Y-%m', md.created_at)=strftime('%Y-%m','now')) as meal_deductions_this_month
    FROM hr_employees e LEFT JOIN hr_departments d ON d.id=e.department_id
    WHERE e.employee_number=? AND e.active=1
  `).get(req.params.num);
      if (!emp) {
        res.status(404).json({ error: "\u0627\u0644\u0645\u0648\u0638\u0641 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F \u0623\u0648 \u063A\u064A\u0631 \u0646\u0634\u0637" });
        return;
      }
      res.json({ ...emp, active: Boolean(emp.active) });
    });
    router15.get("/hr/salary-statement/:employee_id/:month", (req, res) => {
      if (!requireAdmin(req, res)) return;
      const { employee_id, month } = req.params;
      const emp = db.prepare(`
    SELECT e.*, d.name as department_name FROM hr_employees e
    LEFT JOIN hr_departments d ON d.id=e.department_id WHERE e.id=?
  `).get(employee_id);
      if (!emp) {
        res.status(404).json({ error: "\u0627\u0644\u0645\u0648\u0638\u0641 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
        return;
      }
      const salary = db.prepare("SELECT * FROM hr_salaries WHERE employee_id=? AND month=?").get(employee_id, month);
      const mealDeductions = db.prepare(`
    SELECT * FROM meal_deductions WHERE employee_id=? AND strftime('%Y-%m', created_at)=?
    ORDER BY created_at ASC
  `).all(employee_id, month);
      const mealTotal = mealDeductions.reduce((s, m) => s + m.amount, 0);
      const attendance = db.prepare(`
    SELECT status, COUNT(*) as count FROM hr_attendance
    WHERE employee_id=? AND strftime('%Y-%m', date)=?
    GROUP BY status
  `).all(employee_id, month);
      const businessSettings = db.prepare("SELECT key, value FROM settings").all();
      const settings = {};
      businessSettings.forEach((s) => {
        settings[s.key] = s.value;
      });
      res.json({
        employee: { ...emp, active: Boolean(emp.active) },
        salary: salary ?? null,
        mealDeductions,
        mealTotal,
        attendance,
        settings
      });
    });
    router15.get("/hr/summary", (req, res) => {
      if (!requireAdmin(req, res)) return;
      const totalEmployees = db.prepare("SELECT COUNT(*) as c FROM hr_employees WHERE active=1").get().c;
      const totalDepts = db.prepare("SELECT COUNT(*) as c FROM hr_departments").get().c;
      const currentMonth = (/* @__PURE__ */ new Date()).toISOString().slice(0, 7);
      const salariesThisMonth = db.prepare(`
    SELECT COALESCE(SUM(net_salary),0) as total, COUNT(*) as count,
           SUM(CASE WHEN status='paid' THEN 1 ELSE 0 END) as paid_count
    FROM hr_salaries WHERE month=?
  `).get(currentMonth);
      const todayAttendance = db.prepare(`
    SELECT COUNT(*) as present FROM hr_attendance
    WHERE date=? AND status='present'
  `).get((/* @__PURE__ */ new Date()).toISOString().slice(0, 10));
      res.json({
        totalEmployees,
        totalDepts,
        currentMonthSalaries: salariesThisMonth.total,
        currentMonthSalaryCount: salariesThisMonth.count,
        paidSalaries: salariesThisMonth.paid_count,
        todayPresent: todayAttendance.present
      });
    });
    hr_default = router15;
  }
});

// artifacts/pos-system/src/backend/server/routes/returns.ts
function requireAuth(req, res) {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D" });
    return null;
  }
  return user;
}
function requireAdmin2(req, res) {
  const user = getAuthUser(req);
  if (!user || user.role !== "admin") {
    res.status(403).json({ error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D" });
    return false;
  }
  return true;
}
var import_express16, router16, returns_default;
var init_returns = __esm({
  "artifacts/pos-system/src/backend/server/routes/returns.ts"() {
    import_express16 = require("express");
    init_sqlite();
    init_auth();
    router16 = (0, import_express16.Router)();
    router16.get("/returns", (req, res) => {
      if (!requireAdmin2(req, res)) return;
      const { startDate, endDate, search } = req.query;
      let sql = `
    SELECT r.*, u.name as cashier_name, c.name as customer_name
    FROM returns r
    LEFT JOIN users u ON u.id=r.user_id
    LEFT JOIN customers c ON c.id=r.customer_id
    WHERE 1=1
  `;
      const params = [];
      if (startDate) {
        sql += " AND DATE(r.created_at)>=?";
        params.push(startDate);
      }
      if (endDate) {
        sql += " AND DATE(r.created_at)<=?";
        params.push(endDate);
      }
      if (search) {
        sql += " AND (r.return_number LIKE ? OR r.invoice_number LIKE ?)";
        params.push(`%${search}%`, `%${search}%`);
      }
      sql += " ORDER BY r.created_at DESC";
      const rows = db.prepare(sql).all(...params);
      const result = rows.map((r) => {
        const items = db.prepare("SELECT * FROM return_items WHERE return_id=?").all(r.id);
        return { ...r, items };
      });
      res.json(result);
    });
    router16.get("/returns/:id", (req, res) => {
      if (!requireAdmin2(req, res)) return;
      const row = db.prepare(`
    SELECT r.*, u.name as cashier_name, c.name as customer_name
    FROM returns r
    LEFT JOIN users u ON u.id=r.user_id
    LEFT JOIN customers c ON c.id=r.customer_id
    WHERE r.id=?
  `).get(req.params.id);
      if (!row) {
        res.status(404).json({ error: "\u0627\u0644\u0645\u0631\u062A\u062C\u0639 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
        return;
      }
      row.items = db.prepare("SELECT * FROM return_items WHERE return_id=?").all(row.id);
      res.json(row);
    });
    router16.post("/returns", (req, res) => {
      const user = requireAuth(req, res);
      if (!user) return;
      const { invoice_number, order_id, reason, payment_method, customer_id, notes, items } = req.body;
      if (!invoice_number || !items || !Array.isArray(items) || items.length === 0) {
        res.status(400).json({ error: "\u0631\u0642\u0645 \u0627\u0644\u0641\u0627\u062A\u0648\u0631\u0629 \u0648\u0627\u0644\u0645\u0646\u062A\u062C\u0627\u062A \u0627\u0644\u0645\u0631\u062A\u062C\u0639\u0629 \u0645\u0637\u0644\u0648\u0628\u0629" });
        return;
      }
      const total_refund = items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
      const countRow = db.prepare("SELECT COUNT(*) as c FROM returns").get();
      const returnNum = `RET-${String(countRow.c + 1).padStart(4, "0")}-${Date.now().toString().slice(-6)}`;
      const r = db.prepare(`
    INSERT INTO returns (return_number, invoice_number, order_id, reason, total_refund, payment_method, customer_id, user_id, notes)
    VALUES (?,?,?,?,?,?,?,?,?)
  `).run(returnNum, invoice_number, order_id ?? null, reason ?? null, total_refund, payment_method ?? "cash", customer_id ?? null, user.id, notes ?? null);
      const returnId = r.lastInsertRowid;
      const insertItem = db.prepare(`
    INSERT INTO return_items (return_id, product_id, product_name, quantity, unit_price, total)
    VALUES (?,?,?,?,?,?)
  `);
      for (const item of items) {
        insertItem.run(returnId, item.product_id ?? null, item.product_name, item.quantity, item.unit_price, item.unit_price * item.quantity);
        if (item.product_id) {
          db.prepare("UPDATE products SET stock = COALESCE(stock, 0) + ? WHERE id=?").run(item.quantity, item.product_id);
        }
      }
      const created = db.prepare(`
    SELECT r.*, u.name as cashier_name FROM returns r
    LEFT JOIN users u ON u.id=r.user_id WHERE r.id=?
  `).get(returnId);
      created.items = db.prepare("SELECT * FROM return_items WHERE return_id=?").all(returnId);
      res.status(201).json(created);
    });
    router16.delete("/returns/:id", (req, res) => {
      if (!requireAdmin2(req, res)) return;
      const row = db.prepare("SELECT * FROM returns WHERE id=?").get(req.params.id);
      if (!row) {
        res.status(404).json({ error: "\u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
        return;
      }
      const returnItems = db.prepare("SELECT * FROM return_items WHERE return_id=?").all(row.id);
      for (const item of returnItems) {
        if (item.product_id) {
          db.prepare("UPDATE products SET stock = MAX(0, COALESCE(stock, 0) - ?) WHERE id=?").run(item.quantity, item.product_id);
        }
      }
      db.prepare("DELETE FROM returns WHERE id=?").run(req.params.id);
      res.status(204).send();
    });
    router16.get("/returns-summary", (req, res) => {
      if (!requireAdmin2(req, res)) return;
      const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
      const monthStart = today.slice(0, 7) + "-01";
      const todayStats = db.prepare("SELECT COUNT(*) as count, COALESCE(SUM(total_refund),0) as total FROM returns WHERE DATE(created_at)=?").get(today);
      const monthStats = db.prepare("SELECT COUNT(*) as count, COALESCE(SUM(total_refund),0) as total FROM returns WHERE DATE(created_at)>=?").get(monthStart);
      const totalCount = db.prepare("SELECT COUNT(*) as c FROM returns").get().c;
      res.json({
        todayCount: todayStats.count,
        todayTotal: todayStats.total,
        monthCount: monthStats.count,
        monthTotal: monthStats.total,
        totalCount
      });
    });
    router16.get("/orders/lookup", (req, res) => {
      const user = requireAuth(req, res);
      if (!user) return;
      const { q } = req.query;
      if (!q) {
        res.status(400).json({ error: "\u0645\u0637\u0644\u0648\u0628 \u0645\u0639\u064A\u0627\u0631 \u0627\u0644\u0628\u062D\u062B" });
        return;
      }
      const searchNum = String(q).trim();
      let orderRow = db.prepare(`
    SELECT o.*, u.name as user_name, c.name as customer_name
    FROM orders o
    LEFT JOIN users u ON u.id=o.user_id
    LEFT JOIN customers c ON c.id=o.customer_id
    WHERE o.invoice_number=? OR o.invoice_number=? OR CAST(o.id AS TEXT)=?
  `).get(searchNum, `INV-${searchNum.padStart(4, "0")}`, searchNum);
      if (!orderRow) {
        res.status(404).json({ error: "\u0644\u0645 \u064A\u062A\u0645 \u0627\u0644\u0639\u062B\u0648\u0631 \u0639\u0644\u0649 \u0627\u0644\u0641\u0627\u062A\u0648\u0631\u0629" });
        return;
      }
      const items = db.prepare("SELECT * FROM order_items WHERE order_id=?").all(orderRow.id);
      const existingReturn = db.prepare("SELECT id, return_number, total_refund FROM returns WHERE order_id=? OR invoice_number=?").get(orderRow.id, orderRow.invoice_number);
      res.json({
        id: orderRow.id,
        invoiceNumber: orderRow.invoice_number,
        total: orderRow.total,
        subtotal: orderRow.subtotal,
        discount: orderRow.discount,
        tax: orderRow.tax,
        paymentMethod: orderRow.payment_method,
        orderType: orderRow.order_type,
        tableNumber: orderRow.table_number,
        note: orderRow.note,
        createdAt: orderRow.created_at,
        cashierName: orderRow.user_name,
        userId: orderRow.user_id,
        customerName: orderRow.customer_name,
        alreadyReturned: !!existingReturn,
        existingReturn: existingReturn ?? null,
        items: items.map((i) => ({
          id: i.id,
          productId: i.product_id,
          productName: i.product_name,
          quantity: i.quantity,
          unitPrice: i.unit_price,
          total: i.total,
          categoryId: i.category_id,
          categoryName: i.category_name
        }))
      });
    });
    router16.get("/cashier-boxes", (req, res) => {
      if (!requireAdmin2(req, res)) return;
      const { date } = req.query;
      const filterDate = date ?? (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
      const cashiers = db.prepare(`
    SELECT u.id, u.name,
      COALESCE(SUM(o.total),0) as orders_total,
      COUNT(o.id) as orders_count
    FROM users u
    LEFT JOIN orders o ON o.user_id=u.id AND DATE(o.created_at)=?
    WHERE u.active=1
    GROUP BY u.id, u.name
    ORDER BY u.name
  `).all(filterDate);
      const returns_ = db.prepare(`
    SELECT o.user_id,
      COALESCE(SUM(r.total_refund),0) as returns_total,
      COUNT(r.id) as returns_count
    FROM returns r
    LEFT JOIN orders o ON o.id=r.order_id
    WHERE DATE(r.created_at)=?
    GROUP BY o.user_id
  `).all(filterDate);
      const returnsMap = new Map(returns_.map((r) => [r.user_id, r]));
      const mainTotal = cashiers.reduce((s, c) => s + c.orders_total, 0);
      const mainReturns = returns_.reduce((s, r) => s + r.returns_total, 0);
      res.json({
        date: filterDate,
        mainBox: { total: mainTotal, returnsTotal: mainReturns, net: mainTotal - mainReturns },
        cashiers: cashiers.map((c) => {
          const ret = returnsMap.get(c.id);
          return {
            userId: c.id,
            name: c.name,
            ordersTotal: c.orders_total,
            ordersCount: c.orders_count,
            returnsTotal: ret?.returns_total ?? 0,
            returnsCount: ret?.returns_count ?? 0,
            net: c.orders_total - (ret?.returns_total ?? 0)
          };
        })
      });
    });
    returns_default = router16;
  }
});

// artifacts/pos-system/src/backend/server/routes/index.ts
var import_express17, router17, routes_default;
var init_routes = __esm({
  "artifacts/pos-system/src/backend/server/routes/index.ts"() {
    import_express17 = require("express");
    init_health();
    init_auth();
    init_categories();
    init_products();
    init_orders();
    init_customers();
    init_users();
    init_dashboard();
    init_settings();
    init_reports();
    init_print_config();
    init_print_log();
    init_printers();
    init_printer_settings();
    init_hr();
    init_returns();
    router17 = (0, import_express17.Router)();
    router17.use(health_default);
    router17.use(auth_default);
    router17.use(categories_default);
    router17.use(products_default);
    router17.use(orders_default);
    router17.use(customers_default);
    router17.use(users_default);
    router17.use(dashboard_default);
    router17.use(settings_default);
    router17.use(reports_default);
    router17.use(print_config_default);
    router17.use(print_log_default);
    router17.use(printers_default);
    router17.use(printer_settings_default);
    router17.use(hr_default);
    router17.use(returns_default);
    routes_default = router17;
  }
});

// artifacts/pos-system/src/backend/server/lib/logger.ts
var import_pino, isProduction, logger;
var init_logger = __esm({
  "artifacts/pos-system/src/backend/server/lib/logger.ts"() {
    import_pino = __toESM(require("pino"), 1);
    isProduction = process.env.NODE_ENV === "production";
    logger = (0, import_pino.default)({
      level: process.env.LOG_LEVEL ?? "info",
      redact: [
        "req.headers.authorization",
        "req.headers.cookie",
        "res.headers['set-cookie']"
      ],
      ...isProduction ? {} : {
        transport: {
          target: "pino-pretty",
          options: { colorize: true }
        }
      }
    });
  }
});

// artifacts/pos-system/src/backend/server/app.ts
var import_express18, import_cors, import_pino_http, import_node_path3, import_node_url, import_meta, __dirname2, app, frontendDist, app_default;
var init_app = __esm({
  "artifacts/pos-system/src/backend/server/app.ts"() {
    import_express18 = __toESM(require("express"), 1);
    import_cors = __toESM(require("cors"), 1);
    import_pino_http = __toESM(require("pino-http"), 1);
    import_node_path3 = __toESM(require("node:path"), 1);
    import_node_url = require("node:url");
    init_routes();
    init_logger();
    import_meta = {};
    __dirname2 = typeof __dirname2 !== "undefined" ? __dirname2 : typeof import_meta !== "undefined" && import_meta.url ? import_node_path3.default.dirname((0, import_node_url.fileURLToPath)(import_meta.url)) : ".";
    app = (0, import_express18.default)();
    app.use(
      (0, import_pino_http.default)({
        logger,
        serializers: {
          req(req) {
            return {
              id: req.id,
              method: req.method,
              url: req.url?.split("?")[0]
            };
          },
          res(res) {
            return {
              statusCode: res.statusCode
            };
          }
        }
      })
    );
    app.use((0, import_cors.default)());
    app.use(import_express18.default.json({ limit: "6mb" }));
    app.use(import_express18.default.urlencoded({ extended: true, limit: "6mb" }));
    app.use("/api", routes_default);
    frontendDist = process.env["FRONTEND_DIST"];
    if (frontendDist) {
      const distPath = import_node_path3.default.resolve(frontendDist);
      app.use(import_express18.default.static(distPath));
      app.get("*", (req, res) => {
        if (req.path.startsWith("/api")) {
          res.sendStatus(404);
          return;
        }
        res.sendFile(import_node_path3.default.join(distPath, "index.html"));
      });
    }
    app_default = app;
  }
});

// artifacts/pos-system/src/backend/server.ts
var server_exports = {};
__export(server_exports, {
  startServer: () => startServer
});
async function startServer() {
  const isProd = process.env.NODE_ENV === "production" || !process.env.NODE_ENV;
  if (isProd) {
    const distPath = import_node_path4.default.resolve(__dirname, "../frontend/dist");
    if (import_node_fs3.default.existsSync(distPath)) {
      app_default.use(import_express19.default.static(distPath));
      app_default.get("*", (req, res) => {
        if (req.path.startsWith("/api")) {
          res.sendStatus(404);
          return;
        }
        res.sendFile(import_node_path4.default.join(distPath, "index.html"));
      });
    } else {
      console.warn(`Production frontend dist directory not found at: ${distPath}`);
    }
  }
  return new Promise((resolve, reject) => {
    const server = app_default.listen(PORT, "127.0.0.1", () => {
      console.log(`Server running on http://127.0.0.1:${PORT}`);
      resolve(server);
    });
    server.on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        console.warn(`Port ${PORT} is already in use, assuming another instance of OmniSystem is running.`);
        resolve(null);
      } else {
        reject(err);
      }
    });
  });
}
var import_express19, import_node_path4, import_node_fs3, PORT;
var init_server = __esm({
  "artifacts/pos-system/src/backend/server.ts"() {
    import_express19 = __toESM(require("express"), 1);
    import_node_path4 = __toESM(require("node:path"), 1);
    import_node_fs3 = __toESM(require("node:fs"), 1);
    init_app();
    PORT = 3e3;
  }
});

// artifacts/pos-system/src/main/main.js
var { app: app2, BrowserWindow, screen } = require("electron");
var path4 = require("path");
var fs2 = require("fs");
var userDataPath = app2.getPath("userData");
var dbDir = path4.join(userDataPath, "data");
var dbPath2 = path4.join(dbDir, "pos.db");
if (!fs2.existsSync(dbDir)) {
  fs2.mkdirSync(dbDir, { recursive: true });
}
if (!fs2.existsSync(dbPath2)) {
  const seedDbPath = path4.join(__dirname, "../backend/server/data/pos.db");
  if (fs2.existsSync(seedDbPath)) {
    try {
      fs2.copyFileSync(seedDbPath, dbPath2);
      console.log("Database successfully seeded on first launch!");
      const seedWal = seedDbPath + "-wal";
      const destWal = dbPath2 + "-wal";
      if (fs2.existsSync(seedWal)) {
        fs2.copyFileSync(seedWal, destWal);
      }
      const seedShm = seedDbPath + "-shm";
      const destShm = dbPath2 + "-shm";
      if (fs2.existsSync(seedShm)) {
        fs2.copyFileSync(seedShm, destShm);
      }
    } catch (err) {
      console.error("Error seeding database:", err);
    }
  }
}
process.env.OMNISYSTEM_DB_PATH = dbPath2;
process.env.NODE_ENV = "production";
var { startServer: startServer2 } = (init_server(), __toCommonJS(server_exports));
var mainWindow;
async function createWindow() {
  try {
    await startServer2();
  } catch (error) {
    console.error("Failed to start local Express server:", error);
  }
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  mainWindow = new BrowserWindow({
    width: Math.min(1366, width),
    height: Math.min(850, height),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path4.join(__dirname, "preload.js")
    },
    title: "\u0646\u0638\u0627\u0645 \u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u0628\u064A\u0639\u0627\u062A \u0648\u0627\u0644\u0645\u062E\u0632\u0648\u0646 \u0627\u0644\u0645\u062A\u0643\u0627\u0645\u0644 - OmniSystem Pro",
    autoHideMenuBar: true
  });
  mainWindow.loadURL("http://127.0.0.1:3000");
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}
var isSingleInstance = app2.requestSingleInstanceLock();
if (!isSingleInstance) {
  app2.quit();
} else {
  app2.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
  app2.on("ready", () => {
    createWindow();
  });
}
app2.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app2.quit();
  }
});
