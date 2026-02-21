import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database("tallykhata.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    balance REAL DEFAULT 0,
    type TEXT DEFAULT 'CUSTOMER',
    lastTransactionDate TEXT
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    amount REAL NOT NULL,
    date TEXT NOT NULL,
    note TEXT,
    customerId TEXT,
    FOREIGN KEY(customerId) REFERENCES customers(id)
  );

  CREATE TABLE IF NOT EXISTS reminders (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    date TEXT NOT NULL,
    amount REAL,
    type TEXT NOT NULL,
    status TEXT DEFAULT 'UPCOMING',
    customerId TEXT,
    FOREIGN KEY(customerId) REFERENCES customers(id)
  );
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Request logger
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", env: process.env.NODE_ENV });
  });

  // API Routes
  
  // Customers
  app.get("/api/customers", (req, res) => {
    const customers = db.prepare("SELECT * FROM customers ORDER BY name ASC").all();
    res.json(customers);
  });

  app.post("/api/customers", (req, res) => {
    const { id, name, phone, type } = req.body;
    db.prepare("INSERT INTO customers (id, name, phone, type, balance) VALUES (?, ?, ?, ?, 0)")
      .run(id, name, phone, type);
    res.status(201).json({ id, name, phone, type, balance: 0 });
  });

  // Transactions
  app.get("/api/transactions", (req, res) => {
    const transactions = db.prepare("SELECT * FROM transactions ORDER BY date DESC LIMIT 50").all();
    res.json(transactions);
  });

  app.post("/api/transactions", (req, res) => {
    const { id, type, amount, date, note, customerId } = req.body;
    
    const insertTransaction = db.transaction(() => {
      db.prepare("INSERT INTO transactions (id, type, amount, date, note, customerId) VALUES (?, ?, ?, ?, ?, ?)")
        .run(id, type, amount, date, note, customerId);
      
      if (customerId) {
        // Update customer balance
        // Positive balance: they owe me
        // Negative balance: I owe them
        let balanceChange = 0;
        if (type === 'GIVE_CREDIT') balanceChange = amount;
        if (type === 'TAKE_CREDIT') balanceChange = -amount;
        if (type === 'PAYMENT_RECEIVED') balanceChange = -amount;
        if (type === 'PAYMENT_MADE') balanceChange = amount;
        
        db.prepare("UPDATE customers SET balance = balance + ?, lastTransactionDate = ? WHERE id = ?")
          .run(balanceChange, date, customerId);
      }
    });

    insertTransaction();
    res.status(201).json({ success: true });
  });

  // Reminders
  app.get("/api/reminders", (req, res) => {
    const reminders = db.prepare("SELECT * FROM reminders ORDER BY date ASC").all();
    res.json(reminders);
  });

  app.post("/api/reminders", (req, res) => {
    const { id, title, date, amount, type, customerId } = req.body;
    db.prepare("INSERT INTO reminders (id, title, date, amount, type, customerId) VALUES (?, ?, ?, ?, ?, ?)")
      .run(id, title, date, amount, type, customerId);
    res.status(201).json({ success: true });
  });

  // Summary
  app.get("/api/summary", (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    const expenses = db.prepare("SELECT SUM(amount) as total FROM transactions WHERE type = 'EXPENSE' AND date = ?").get(today) as any;
    const iGet = db.prepare("SELECT SUM(balance) as total FROM customers WHERE balance > 0").get() as any;
    const theyGet = db.prepare("SELECT SUM(ABS(balance)) as total FROM customers WHERE balance < 0").get() as any;

    res.json({
      todayExpense: expenses?.total || 0,
      iGet: iGet?.total || 0,
      theyGet: theyGet?.total || 0
    });
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
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
