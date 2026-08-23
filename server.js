const express = require("express");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@barbeariant.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "123456";

const DATA_FILE = path.join(__dirname, "data", "appointments.json");
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, "[]");

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const services = [
  { id: "corte", name: "Corte", duration: 30, price: 40 },
  { id: "barba", name: "Barba", duration: 30, price: 30 },
  { id: "corte-barba", name: "Corte + Barba", duration: 60, price: 60 },
  { id: "nevou", name: "Nevou", duration: 90, price: 120 },
  { id: "luzes", name: "Luzes", duration: 120, price: 150 }
];

function readAppointments() {
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
}
function writeAppointments(items) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(items, null, 2));
}
function auth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Não autorizado." });
  try {
    req.admin = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Sessão expirada." });
  }
}

app.get("/api/services", (_, res) => res.json(services));

app.post("/api/appointments", (req, res) => {
  const { serviceId, date, time, name, phone, email } = req.body;
  const service = services.find(s => s.id === serviceId);
  if (!service || !date || !time || !name || !phone) {
    return res.status(400).json({ error: "Preencha todos os dados obrigatórios." });
  }

  const appointments = readAppointments();
  const occupied = appointments.some(a => a.date === date && a.time === time && a.status !== "cancelado");
  if (occupied) return res.status(409).json({ error: "Esse horário já foi reservado." });

  const appointment = {
    id: Date.now().toString(),
    serviceId,
    service: service.name,
    duration: service.duration,
    price: service.price,
    date,
    time,
    name,
    phone,
    email: email || "",
    status: "confirmado",
    createdAt: new Date().toISOString()
  };

  appointments.push(appointment);
  writeAppointments(appointments);
  res.status(201).json(appointment);
});

app.post("/api/admin/login", (req, res) => {
  const { email, password } = req.body;
  if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: "E-mail ou senha incorretos." });
  }
  const token = jwt.sign({ email, role: "admin" }, JWT_SECRET, { expiresIn: "8h" });
  res.json({ token });
});

app.get("/api/admin/appointments", auth, (req, res) => {
  const appointments = readAppointments().sort((a,b) =>
    `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`)
  );
  res.json(appointments);
});

app.patch("/api/admin/appointments/:id", auth, (req, res) => {
  const appointments = readAppointments();
  const item = appointments.find(a => a.id === req.params.id);
  if (!item) return res.status(404).json({ error: "Agendamento não encontrado." });
  if (req.body.status) item.status = req.body.status;
  writeAppointments(appointments);
  res.json(item);
});

app.delete("/api/admin/appointments/:id", auth, (req, res) => {
  const appointments = readAppointments().filter(a => a.id !== req.params.id);
  writeAppointments(appointments);
  res.status(204).end();
});

app.get("*", (_, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => console.log(`Barbearia NT: http://localhost:${PORT}`));