require("dotenv").config();
const express = require("express");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "TROQUE-ESTA-CHAVE";
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "admin@barbeariant.com").trim().toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "troque-esta-senha";

if (!process.env.DATABASE_URL) console.warn("DATABASE_URL não configurada.");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000
});

const services = [
  { id: "corte", name: "Corte", duration: 30, price: 40 },
  { id: "barba", name: "Barba", duration: 30, price: 30 },
  { id: "corte-barba", name: "Corte + Barba", duration: 60, price: 60 },
  { id: "nevou", name: "Nevou", duration: 90, price: 120 },
  { id: "luzes", name: "Luzes", duration: 120, price: 150 }
];

function tokenFor(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: "30d" }
  );
}

function auth(req, res, next) {
  const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!token) return res.status(401).json({ error: "Faça login para continuar." });
  try {
    req.auth = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Sessão expirada. Faça login novamente." });
  }
}
function customerAuth(req, res, next) {
  auth(req, res, () => req.auth.role === "customer"
    ? next()
    : res.status(403).json({ error: "Acesso de cliente necessário." }));
}
function adminAuth(req, res, next) {
  auth(req, res, () => req.auth.role === "admin"
    ? next()
    : res.status(403).json({ error: "Acesso administrativo necessário." }));
}

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      phone TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'customer',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id BIGSERIAL PRIMARY KEY,
      user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
      service_id TEXT NOT NULL,
      service TEXT NOT NULL,
      duration INTEGER NOT NULL,
      price NUMERIC(10,2) NOT NULL,
      date DATE NOT NULL,
      time TIME NOT NULL,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      status TEXT NOT NULL DEFAULT 'confirmado',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE UNIQUE INDEX IF NOT EXISTS appointments_active_slot
      ON appointments(date, time) WHERE status <> 'cancelado';
  `);

  const admin = await pool.query("SELECT id FROM users WHERE email=$1 LIMIT 1", [ADMIN_EMAIL]);
  if (!admin.rowCount) {
    const hash = await bcrypt.hash(ADMIN_PASSWORD, 12);
    await pool.query(
      `INSERT INTO users(name,email,phone,password_hash,role)
       VALUES($1,$2,$3,$4,'admin')`,
      ["Administrador", ADMIN_EMAIL, "", hash]
    );
    console.log("Administrador criado no banco:", ADMIN_EMAIL);
  }
}

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/health", async (_, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ ok: true, database: "connected" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, database: "error" });
  }
});

app.get("/api/services", (_, res) => res.json(services));

app.post("/api/auth/signup", async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const phone = String(req.body.phone || "").trim();
    const password = String(req.body.password || "");
    if (!name || !email || !phone || !password)
      return res.status(400).json({ error: "Preencha nome, e-mail, WhatsApp e senha." });
    if (password.length < 6)
      return res.status(400).json({ error: "A senha precisa ter pelo menos 6 caracteres." });

    const exists = await pool.query("SELECT id FROM users WHERE email=$1", [email]);
    if (exists.rowCount) return res.status(409).json({ error: "Este e-mail já possui uma conta." });

    const hash = await bcrypt.hash(password, 12);
    const r = await pool.query(
      `INSERT INTO users(name,email,phone,password_hash)
       VALUES($1,$2,$3,$4)
       RETURNING id,name,email,phone,role`,
      [name, email, phone, hash]
    );
    res.status(201).json({ token: tokenFor(r.rows[0]), user: r.rows[0] });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Não foi possível criar a conta." });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    const r = await pool.query("SELECT * FROM users WHERE email=$1 LIMIT 1", [email]);
    if (!r.rowCount) return res.status(401).json({ error: "E-mail ou senha incorretos." });
    const user = r.rows[0];
    if (!(await bcrypt.compare(password, user.password_hash)))
      return res.status(401).json({ error: "E-mail ou senha incorretos." });
    res.json({
      token: tokenFor(user),
      user: { id:user.id, name:user.name, email:user.email, phone:user.phone, role:user.role }
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Erro ao fazer login." });
  }
});

app.get("/api/auth/me", customerAuth, async (req, res) => {
  const r = await pool.query(
    "SELECT id,name,email,phone,role FROM users WHERE id=$1",
    [req.auth.id]
  );
  if (!r.rowCount) return res.status(404).json({ error: "Conta não encontrada." });
  res.json({ user: r.rows[0] });
});

app.get("/api/my/appointments", customerAuth, async (req, res) => {
  const r = await pool.query(`
    SELECT id,service,duration,price,
           TO_CHAR(date,'YYYY-MM-DD') AS date,
           TO_CHAR(time,'HH24:MI') AS time,status
    FROM appointments
    WHERE user_id=$1
    ORDER BY date,time
  `, [req.auth.id]);
  res.json(r.rows);
});

app.post("/api/appointments/authenticated", customerAuth, async (req, res) => {
  try {
    const { serviceId, date, time } = req.body;
    const service = services.find(s => s.id === serviceId);
    if (!service || !date || !time)
      return res.status(400).json({ error: "Escolha serviço, data e horário." });

    const u = await pool.query(
      "SELECT id,name,email,phone FROM users WHERE id=$1",
      [req.auth.id]
    );
    if (!u.rowCount) return res.status(404).json({ error: "Conta não encontrada." });
    const user = u.rows[0];

    const r = await pool.query(
      `INSERT INTO appointments
       (user_id,service_id,service,duration,price,date,time,name,phone,email)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING id,service,duration,price,TO_CHAR(date,'YYYY-MM-DD') AS date,
                 TO_CHAR(time,'HH24:MI') AS time,status`,
      [user.id, service.id, service.name, service.duration, service.price,
       date, time, user.name, user.phone, user.email]
    );
    res.status(201).json(r.rows[0]);
  } catch (e) {
    if (e.code === "23505")
      return res.status(409).json({ error: "Esse horário já foi reservado." });
    console.error(e);
    res.status(500).json({ error: "Não foi possível salvar o agendamento." });
  }
});

app.delete("/api/my/appointments/:id", customerAuth, async (req, res) => {
  const r = await pool.query(
    `UPDATE appointments SET status='cancelado'
     WHERE id=$1 AND user_id=$2 RETURNING id`,
    [req.params.id, req.auth.id]
  );
  if (!r.rowCount) return res.status(404).json({ error: "Agendamento não encontrado." });
  res.status(204).end();
});

app.post("/api/admin/login", async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  const r = await pool.query("SELECT * FROM users WHERE email=$1 AND role='admin' LIMIT 1", [email]);
  if (!r.rowCount || !(await bcrypt.compare(password, r.rows[0].password_hash)))
    return res.status(401).json({ error: "E-mail ou senha incorretos." });
  res.json({ token: tokenFor(r.rows[0]) });
});

app.get("/api/admin/appointments", adminAuth, async (_, res) => {
  const r = await pool.query(`
    SELECT a.id,a.service,a.duration,a.price,
           TO_CHAR(a.date,'YYYY-MM-DD') AS date,
           TO_CHAR(a.time,'HH24:MI') AS time,
           a.status,a.name,a.phone,a.email
    FROM appointments a
    ORDER BY a.date,a.time
  `);
  res.json(r.rows);
});

app.get("/api/admin/clients", adminAuth, async (_, res) => {
  const r = await pool.query(`
    SELECT u.id,u.name,u.email,u.phone,u.created_at,
           COUNT(a.id)::int AS appointments
    FROM users u
    LEFT JOIN appointments a ON a.user_id=u.id
    WHERE u.role='customer'
    GROUP BY u.id
    ORDER BY u.created_at DESC
  `);
  res.json(r.rows);
});

app.patch("/api/admin/appointments/:id", adminAuth, async (req, res) => {
  const allowed = ["confirmado","cancelado","concluido"];
  if (!allowed.includes(req.body.status))
    return res.status(400).json({ error: "Status inválido." });
  const r = await pool.query(
    "UPDATE appointments SET status=$1 WHERE id=$2 RETURNING id,status",
    [req.body.status, req.params.id]
  );
  if (!r.rowCount) return res.status(404).json({ error: "Agendamento não encontrado." });
  res.json(r.rows[0]);
});

app.delete("/api/admin/appointments/:id", adminAuth, async (req, res) => {
  await pool.query("DELETE FROM appointments WHERE id=$1", [req.params.id]);
  res.status(204).end();
});

app.get("*", (_, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

initDb()
  .then(() => app.listen(PORT, () => console.log(`Barbearia NT na porta ${PORT}`)))
  .catch(err => { console.error("Erro ao inicializar PostgreSQL:", err); process.exit(1); });
