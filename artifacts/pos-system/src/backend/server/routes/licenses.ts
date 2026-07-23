import { Router } from "express";
import { db } from "../lib/sqlite";

const router = Router();

const DEV_KEY = process.env.DEV_ADMIN_KEY ?? "DEV-ADMIN-2024";

function isAdmin(req: { headers: Record<string, string | string[] | undefined> }): boolean {
  return req.headers["x-dev-key"] === DEV_KEY;
}

function generateLicenseKey(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const seg = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `${seg()}-${seg()}-${seg()}-${seg()}`;
}

function addLog(licenseId: number, action: string, user: string, details?: string) {
  try {
    db.prepare("INSERT INTO license_logs (license_id, action, user, details) VALUES (?, ?, ?, ?)").run(
      licenseId,
      action,
      user,
      details ?? ""
    );
  } catch (e) {
    console.error("Error logging license action:", e);
  }
}

function calcExpire(type: string, start: Date): Date | null {
  const d = new Date(start);
  if (type === "trial") { d.setDate(d.getDate() + 30); return d; }
  if (type === "monthly") { d.setMonth(d.getMonth() + 1); return d; }
  if (type === "semi_annual") { d.setMonth(d.getMonth() + 6); return d; }
  if (type === "annual") { d.setFullYear(d.getFullYear() + 1); return d; }
  if (type === "lifetime" || type === "cloud") return null;
  if (type === "multi_branch") { d.setFullYear(d.getFullYear() + 1); return d; }
  if (type === "local") { d.setFullYear(d.getFullYear() + 1); return d; }
  return null;
}

/* ── ADMIN: list all licenses ── */
router.get("/licenses", async (req, res) => {
  if (!isAdmin(req)) return void res.status(403).json({ error: "Unauthorized" });
  try {
    const rows = db.prepare("SELECT * FROM licenses ORDER BY created_date DESC").all() as any[];
    const result = rows.map((lic) => {
      const activations = db.prepare("SELECT * FROM license_activations WHERE license_id = ?").all(lic.id);
      return { ...lic, activationCount: activations.length, activations };
    });
    res.json(result);
  } catch (err: any) {
    req.log?.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/* ── ADMIN: get single license ── */
router.get("/licenses/:id", async (req, res) => {
  if (!isAdmin(req)) return void res.status(403).json({ error: "Unauthorized" });
  try {
    const id = Number(req.params.id);
    const lic = db.prepare("SELECT * FROM licenses WHERE id = ?").get(id) as any;
    if (!lic) return void res.status(404).json({ error: "Not found" });
    const activations = db.prepare("SELECT * FROM license_activations WHERE license_id = ?").all(id);
    const logs = db.prepare("SELECT * FROM license_logs WHERE license_id = ? ORDER BY created_at DESC").all(id);
    res.json({ ...lic, activations, logs });
  } catch (err: any) {
    req.log?.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/* ── ADMIN: create license ── */
router.post("/licenses", async (req, res) => {
  if (!isAdmin(req)) return void res.status(403).json({ error: "Unauthorized" });
  try {
    const { companyName, licenseType, customerId, branchLimit, userLimit, posLimit, notes } = req.body;
    if (!companyName || !licenseType) return void res.status(400).json({ error: "companyName and licenseType required" });
    const licenseKey = generateLicenseKey();
    const startDate = new Date();
    const expireDate = calcExpire(licenseType, startDate);
    const expireStr = expireDate ? expireDate.toISOString() : null;

    const stmt = db.prepare(`
      INSERT INTO licenses (license_key, client_name, type, status, max_devices, expire_date)
      VALUES (?, ?, ?, 'pending', ?, ?)
    `);
    const info = stmt.run(licenseKey, companyName, licenseType, posLimit ?? 1, expireStr);
    const licId = Number(info.lastInsertRowid);
    const lic = db.prepare("SELECT * FROM licenses WHERE id = ?").get(licId);

    addLog(licId, "created", "developer", `نوع الترخيص: ${licenseType}`);
    res.status(201).json(lic);
  } catch (err: any) {
    req.log?.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/* ── ADMIN: update license ── */
router.patch("/licenses/:id", async (req, res) => {
  if (!isAdmin(req)) return void res.status(403).json({ error: "Unauthorized" });
  try {
    const id = Number(req.params.id);
    const { status, companyName, machineId } = req.body;
    const existing = db.prepare("SELECT * FROM licenses WHERE id = ?").get(id) as any;
    if (!existing) return void res.status(404).json({ error: "Not found" });

    if (status) {
      db.prepare("UPDATE licenses SET status = ? WHERE id = ?").run(status, id);
    }
    if (companyName) {
      db.prepare("UPDATE licenses SET client_name = ? WHERE id = ?").run(companyName, id);
    }
    if (machineId !== undefined) {
      db.prepare("UPDATE licenses SET machine_id = ? WHERE id = ?").run(machineId, id);
      if (machineId === null) {
        db.prepare("DELETE FROM license_activations WHERE license_id = ?").run(id);
      }
    }

    const updated = db.prepare("SELECT * FROM licenses WHERE id = ?").get(id);
    addLog(id, status === "active" ? "activated" : "updated", "developer", JSON.stringify(req.body));
    res.json(updated);
  } catch (err: any) {
    req.log?.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/* ── ADMIN: delete license ── */
router.delete("/licenses/:id", async (req, res) => {
  if (!isAdmin(req)) return void res.status(403).json({ error: "Unauthorized" });
  try {
    const id = Number(req.params.id);
    db.prepare("DELETE FROM license_activations WHERE license_id = ?").run(id);
    db.prepare("DELETE FROM license_logs WHERE license_id = ?").run(id);
    db.prepare("DELETE FROM licenses WHERE id = ?").run(id);
    res.json({ ok: true });
  } catch (err: any) {
    req.log?.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/* ── CLIENT: activate license ── */
router.post("/license/activate", async (req, res) => {
  try {
    const { licenseKey, machineId } = req.body;
    if (!licenseKey || !machineId) return void res.status(400).json({ error: "licenseKey and machineId required" });

    const lic = db.prepare("SELECT * FROM licenses WHERE license_key = ?").get(licenseKey) as any;
    if (!lic) return void res.status(404).json({ error: "license_not_found", message: "مفتاح الترخيص غير صحيح" });
    if (lic.status === "suspended") return void res.status(403).json({ error: "license_suspended", message: "الترخيص موقوف" });
    if (lic.expire_date && new Date(lic.expire_date) < new Date()) return void res.status(403).json({ error: "license_expired", message: "انتهت صلاحية الترخيص" });
    if (lic.machine_id && lic.machine_id !== machineId) return void res.status(403).json({ error: "machine_mismatch", message: "الترخيص مرتبط بجهاز آخر" });

    if (!lic.machine_id) {
      db.prepare("UPDATE licenses SET machine_id = ?, status = 'active' WHERE id = ?").run(machineId, lic.id);
      db.prepare("INSERT INTO license_activations (license_id, machine_id) VALUES (?, ?)").run(lic.id, machineId);
      addLog(lic.id, "activated", machineId, "Activation completed");
    }

    const refreshed = db.prepare("SELECT * FROM licenses WHERE id = ?").get(lic.id) as any;
    res.json({
      ok: true,
      license: {
        licenseKey: refreshed.license_key,
        companyName: refreshed.client_name,
        licenseType: refreshed.type,
        status: refreshed.status,
        expireDate: refreshed.expire_date,
        machineId: refreshed.machine_id,
      },
    });
  } catch (err: any) {
    req.log?.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/* ── CLIENT: verify license ── */
router.post("/license/verify", async (req, res) => {
  try {
    const { licenseKey, machineId } = req.body;
    if (!licenseKey || !machineId) return void res.status(400).json({ valid: false, error: "missing_params" });

    const lic = db.prepare("SELECT * FROM licenses WHERE license_key = ?").get(licenseKey) as any;
    if (!lic) return void res.json({ valid: false, error: "license_not_found" });
    if (lic.status === "suspended") return void res.json({ valid: false, error: "license_suspended" });
    if (lic.status === "pending") return void res.json({ valid: false, error: "license_pending" });
    if (lic.machine_id && lic.machine_id !== machineId) return void res.json({ valid: false, error: "machine_mismatch" });

    res.json({
      valid: true,
      license: {
        licenseKey: lic.license_key,
        companyName: lic.client_name,
        licenseType: lic.type,
        status: lic.status,
        expireDate: lic.expire_date,
      },
    });
  } catch (err: any) {
    req.log?.error(err);
    res.status(500).json({ valid: false, error: "server_error" });
  }
});

export default router;
