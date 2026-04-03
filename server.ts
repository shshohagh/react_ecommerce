import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import knex from "knex";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = knex({
  client: "sqlite3",
  connection: {
    filename: "./data.sqlite",
  },
  useNullAsDefault: true,
});

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key";

async function initDb() {
  const hasUsers = await db.schema.hasTable("users");
  if (!hasUsers) {
    await db.schema.createTable("users", (table) => {
      table.increments("id").primary();
      table.string("name").notNullable();
      table.string("email").unique().notNullable();
      table.string("password").notNullable();
    });
    // Create default admin: admin@example.com / admin123
    const hashedPassword = await bcrypt.hash("admin123", 10);
    await db("users").insert({
      name: "Admin User",
      email: "admin@example.com",
      password: hashedPassword,
    });
  }

  const hasProducts = await db.schema.hasTable("products");
  if (!hasProducts) {
    await db.schema.createTable("products", (table) => {
      table.increments("id").primary();
      table.string("name").notNullable();
      table.text("description");
      table.decimal("price", 10, 2).notNullable();
      table.text("image"); // base64 or URL
      table.string("category").defaultTo("Uncategorized");
      table.boolean("is_featured").defaultTo(false);
    });

    // Sample data
    await db("products").insert([
      {
        name: "Premium Wireless Headphones",
        description: "High-quality sound with noise cancellation technology.",
        price: 199.99,
        image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80",
        category: "Electronics",
        is_featured: true,
      },
      {
        name: "Smart Watch Series X",
        description: "Track your health and stay connected on the go.",
        price: 299.00,
        image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80",
        category: "Electronics",
        is_featured: true,
      },
      {
        name: "Minimalist Leather Backpack",
        description: "Durable and stylish for your daily commute.",
        price: 85.50,
        image: "https://images.unsplash.com/photo-1547949003-9792a18a2601?w=800&q=80",
        category: "Accessories",
        is_featured: false,
      }
    ]);
  }

  const hasOrders = await db.schema.hasTable("orders");
  if (!hasOrders) {
    await db.schema.createTable("orders", (table) => {
      table.increments("id").primary();
      table.string("customer_name").notNullable();
      table.string("phone").notNullable();
      table.text("address").notNullable();
      table.integer("product_id").unsigned().references("id").inTable("products");
      table.string("status").defaultTo("pending"); // pending, confirmed, delivered
      table.timestamp("created_at").defaultTo(db.fn.now());
    });
  }
}

async function startServer() {
  await initDb();
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // Auth Middleware
  const authenticate = (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.split(" ")[1];
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
  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    const user = await db("users").where({ email }).first();
    if (user && await bcrypt.compare(password, user.password)) {
      const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);
      res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  // Products (Public)
  app.get("/api/products", async (req, res) => {
    const products = await db("products").select("*");
    res.json(products);
  });

  app.get("/api/products/featured", async (req, res) => {
    const products = await db("products").where({ is_featured: true });
    res.json(products);
  });

  app.get("/api/products/:id", async (req, res) => {
    const product = await db("products").where({ id: req.params.id }).first();
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json(product);
  });

  // Products (Admin)
  app.post("/api/admin/products", authenticate, async (req, res) => {
    const [id] = await db("products").insert(req.body);
    res.status(201).json({ id, ...req.body });
  });

  app.put("/api/admin/products/:id", authenticate, async (req, res) => {
    await db("products").where({ id: req.params.id }).update(req.body);
    res.json({ message: "Product updated" });
  });

  app.delete("/api/admin/products/:id", authenticate, async (req, res) => {
    await db("products").where({ id: req.params.id }).del();
    res.json({ message: "Product deleted" });
  });

  // Orders (Public)
  app.post("/api/orders", async (req, res) => {
    const { customer_name, phone, address, product_id } = req.body;
    if (!customer_name || !phone || !address || !product_id) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const [id] = await db("orders").insert({
      customer_name,
      phone,
      address,
      product_id,
      status: "pending"
    });
    res.status(201).json({ id });
  });

  // Orders (Admin)
  app.get("/api/admin/orders", authenticate, async (req, res) => {
    const orders = await db("orders")
      .join("products", "orders.product_id", "=", "products.id")
      .select("orders.*", "products.name as product_name", "products.price as product_price");
    res.json(orders);
  });

  app.put("/api/admin/orders/:id/status", authenticate, async (req, res) => {
    const { status } = req.body;
    await db("orders").where({ id: req.params.id }).update({ status });
    res.json({ message: "Order status updated" });
  });

  // --- Vite Middleware ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
