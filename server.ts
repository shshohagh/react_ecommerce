import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import knex from "knex";
import { sendEmail, generateOrderConfirmationEmail, generateShippingUpdateEmail } from "./src/services/emailService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = knex({
  client: "sqlite3",
  connection: {
    filename: path.join(__dirname, "data.sqlite"),
  },
  useNullAsDefault: true,
});

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key";

async function initDb() {
  console.log("Initializing database...");
  try {
    const hasUsers = await db.schema.hasTable("users");
    console.log("Users table exists:", hasUsers);
    if (!hasUsers) {
      console.log("Creating users table...");
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
      console.log("Default admin created.");
    }

    const hasProducts = await db.schema.hasTable("products");
    console.log("Products table exists:", hasProducts);
    if (!hasProducts) {
      console.log("Creating products table...");
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
      console.log("Sample products inserted.");
    }

    const hasOrders = await db.schema.hasTable("orders");
    console.log("Orders table exists:", hasOrders);
    if (!hasOrders) {
      console.log("Creating orders table...");
      await db.schema.createTable("orders", (table) => {
        table.increments("id").primary();
        table.string("customer_name").notNullable();
        table.string("email"); // Added for notifications
        table.string("phone").notNullable();
        table.text("address").notNullable();
        table.integer("product_id").unsigned().references("id").inTable("products");
        table.string("status").defaultTo("pending"); // pending, confirmed, delivered
        table.string("estimated_delivery");
        table.timestamp("created_at").defaultTo(db.fn.now());
      });
      console.log("Orders table created.");
    } else {
      // Check if estimated_delivery column exists
      const hasEstimatedDelivery = await db.schema.hasColumn("orders", "estimated_delivery");
      if (!hasEstimatedDelivery) {
        console.log("Adding estimated_delivery column to orders table...");
        await db.schema.table("orders", (table) => {
          table.string("estimated_delivery");
        });
        console.log("estimated_delivery column added.");
      }
      
      // Check if email column exists
      const hasEmail = await db.schema.hasColumn("orders", "email");
      if (!hasEmail) {
        console.log("Adding email column to orders table...");
        await db.schema.table("orders", (table) => {
          table.string("email");
        });
        console.log("email column added.");
      }
    }

    const hasReviews = await db.schema.hasTable("reviews");
    console.log("Reviews table exists:", hasReviews);
    if (!hasReviews) {
      console.log("Creating reviews table...");
      await db.schema.createTable("reviews", (table) => {
        table.increments("id").primary();
        table.integer("product_id").unsigned().references("id").inTable("products").onDelete("CASCADE");
        table.string("customer_name").notNullable();
        table.integer("rating").notNullable();
        table.text("comment").notNullable();
        table.timestamp("created_at").defaultTo(db.fn.now());
      });
      console.log("Reviews table created.");
    }

    const hasHistory = await db.schema.hasTable("order_status_history");
    if (!hasHistory) {
      await db.schema.createTable("order_status_history", (table) => {
        table.increments("id").primary();
        table.integer("order_id").unsigned().references("id").inTable("orders").onDelete("CASCADE");
        table.string("status").notNullable();
        table.text("description");
        table.timestamp("created_at").defaultTo(db.fn.now());
      });
    } else {
      const hasDescription = await db.schema.hasColumn("order_status_history", "description");
      if (!hasDescription) {
        await db.schema.table("order_status_history", (table) => {
          table.text("description");
        });
      }
    }

    const hasWishlist = await db.schema.hasTable("wishlist");
    if (!hasWishlist) {
      await db.schema.createTable("wishlist", (table) => {
        table.increments("id").primary();
        table.integer("user_id").unsigned().references("id").inTable("users").onDelete("CASCADE");
        table.integer("product_id").unsigned().references("id").inTable("products").onDelete("CASCADE");
        table.timestamp("created_at").defaultTo(db.fn.now());
        table.unique(["user_id", "product_id"]);
      });
      console.log("Wishlist table created.");
    }
  } catch (error) {
    console.error("Error in initDb:", error);
    throw error;
  }
}

async function startServer() {
  console.log("Starting server...");
  try {
    await initDb();
    console.log("Database initialized.");
  } catch (err) {
    console.error("Failed to initialize database:", err);
    process.exit(1);
  }
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/test-db", async (req, res) => {
    try {
      const result = await db.raw("SELECT 1+1 as result");
      res.json({ status: "ok", result });
    } catch (err) {
      console.error("Database test failed:", err);
      res.status(500).json({ status: "error", error: String(err) });
    }
  });

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

  // Reviews (Public)
  app.get("/api/products/:id/reviews", async (req, res) => {
    const reviews = await db("reviews")
      .where({ product_id: req.params.id })
      .orderBy("created_at", "desc");
    res.json(reviews);
  });

  app.post("/api/products/:id/reviews", async (req, res) => {
    const { customer_name, rating, comment } = req.body;
    const product_id = req.params.id;

    if (!customer_name || !rating || !comment) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      const [id] = await db("reviews").insert({
        product_id,
        customer_name,
        rating,
        comment
      });
      const newReview = await db("reviews").where({ id }).first();
      res.status(201).json(newReview);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to submit review" });
    }
  });

  // Wishlist (Authenticated)
  app.get("/api/wishlist", authenticate, async (req: any, res) => {
    try {
      const wishlist = await db("wishlist")
        .where({ user_id: req.user.id })
        .join("products", "wishlist.product_id", "=", "products.id")
        .select("products.*");
      res.json(wishlist);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch wishlist" });
    }
  });

  app.post("/api/wishlist", authenticate, async (req: any, res) => {
    const { product_id } = req.body;
    if (!product_id) return res.status(400).json({ error: "Product ID is required" });

    try {
      // Check if already in wishlist
      const existing = await db("wishlist").where({ user_id: req.user.id, product_id }).first();
      if (existing) return res.status(400).json({ error: "Product already in wishlist" });

      await db("wishlist").insert({
        user_id: req.user.id,
        product_id
      });
      res.status(201).json({ message: "Added to wishlist" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to add to wishlist" });
    }
  });

  app.delete("/api/wishlist/:productId", authenticate, async (req: any, res) => {
    try {
      await db("wishlist")
        .where({ user_id: req.user.id, product_id: req.params.productId })
        .delete();
      res.json({ message: "Removed from wishlist" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to remove from wishlist" });
    }
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

  app.delete("/api/admin/products/bulk", authenticate, async (req, res) => {
    const { ids } = req.body;
    if (!Array.isArray(ids)) return res.status(400).json({ error: "Invalid data format" });
    
    try {
      await db("products").whereIn("id", ids).del();
      res.json({ message: "Products deleted successfully" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to delete products" });
    }
  });

  app.post("/api/admin/products/bulk", authenticate, async (req, res) => {
    const products = req.body;
    if (!Array.isArray(products)) return res.status(400).json({ error: "Invalid data format" });
    
    try {
      await db("products").insert(products);
      res.status(201).json({ message: "Products imported successfully" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to import products" });
    }
  });

  // Orders (Public)
  app.post("/api/orders", async (req, res) => {
    const { customer_name, email, phone, address, product_id } = req.body;
    if (!customer_name || !phone || !address || !product_id) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const estimated_delivery = new Date();
    estimated_delivery.setDate(estimated_delivery.getDate() + 5); // 5 days estimate

    const [id] = await db("orders").insert({
      customer_name,
      email,
      phone,
      address,
      product_id,
      status: "pending",
      estimated_delivery: estimated_delivery.toISOString()
    });

    await db("order_status_history").insert({
      order_id: id,
      status: "pending",
      description: "Order has been placed and is awaiting confirmation."
    });

    // Send confirmation email if email is provided
    if (email) {
      try {
        const order = await db("orders").where({ id }).first();
        const product = await db("products").where({ id: product_id }).first();
        const emailContent = generateOrderConfirmationEmail(order, product);
        await sendEmail({
          to: email,
          ...emailContent
        });
      } catch (emailError) {
        console.error("Failed to send order confirmation email:", emailError);
      }
    }

    res.status(201).json({ id });
  });

  app.get("/api/orders/search", async (req, res) => {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: "Search query is required" });

    const orders = await db("orders")
      .where("orders.id", "like", `%${q}%`)
      .orWhere("orders.customer_name", "like", `%${q}%`)
      .orWhere("orders.phone", "like", `%${q}%`)
      .join("products", "orders.product_id", "=", "products.id")
      .select("orders.*", "products.name as product_name", "products.price as product_price", "products.image as product_image")
      .limit(20);

    res.json(orders);
  });

  app.get("/api/orders/:id", async (req, res) => {
    const order = await db("orders")
      .where("orders.id", req.params.id)
      .join("products", "orders.product_id", "=", "products.id")
      .select("orders.*", "products.name as product_name", "products.price as product_price", "products.image as product_image")
      .first();
    
    if (!order) return res.status(404).json({ error: "Order not found" });

    const history = await db("order_status_history")
      .where({ order_id: req.params.id })
      .orderBy("created_at", "desc");

    res.json({ ...order, history });
  });

  // Orders (Admin)
  app.get("/api/admin/orders", authenticate, async (req, res) => {
    const orders = await db("orders")
      .join("products", "orders.product_id", "=", "products.id")
      .select("orders.*", "products.name as product_name", "products.price as product_price");
    res.json(orders);
  });

  app.put("/api/admin/orders/:id/status", authenticate, async (req, res) => {
    const { status, description } = req.body;
    const orderId = req.params.id;
    
    const statusDescriptions: Record<string, string> = {
      pending: "Order has been placed and is awaiting confirmation.",
      confirmed: "Order has been confirmed and is being prepared for shipment.",
      shipped: "Order has been shipped and is on its way to you.",
      delivered: "Order has been successfully delivered."
    };

    await db("orders").where({ id: orderId }).update({ status });
    
    await db("order_status_history").insert({
      order_id: orderId,
      status,
      description: description || statusDescriptions[status] || `Order status updated to ${status}`
    });

    // Send status update email if email is provided
    try {
      const order = await db("orders").where({ id: orderId }).first();
      if (order && order.email) {
        const emailContent = generateShippingUpdateEmail(order, status);
        await sendEmail({
          to: order.email,
          ...emailContent
        });
      }
    } catch (emailError) {
      console.error("Failed to send shipping update email:", emailError);
    }

    res.json({ message: "Order status updated" });
  });

  // Reviews
  app.get("/api/products/:id/reviews", async (req, res) => {
    const reviews = await db("reviews")
      .where({ product_id: req.params.id })
      .orderBy("created_at", "desc");
    res.json(reviews);
  });

  app.post("/api/products/:id/reviews", async (req, res) => {
    const { customer_name, rating, comment } = req.body;
    if (!customer_name || !rating || !comment) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const [id] = await db("reviews").insert({
      product_id: req.params.id,
      customer_name,
      rating,
      comment
    });

    const newReview = await db("reviews").where({ id }).first();
    res.status(201).json(newReview);
  });

  // --- Vite Middleware ---
  if (process.env.NODE_ENV !== "production") {
    console.log("Initializing Vite middleware in development mode...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite middleware initialized.");
    
    // Catch-all route for SPA in development
    app.get("*", async (req, res, next) => {
      try {
        const url = req.originalUrl;
        const template = await vite.transformIndexHtml(url, await fs.readFile(path.join(__dirname, "index.html"), "utf-8"));
        res.status(200).set({ "Content-Type": "text/html" }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  console.log(`Server starting on port ${PORT}...`);
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Fatal error during server startup:", err);
  process.exit(1);
});
