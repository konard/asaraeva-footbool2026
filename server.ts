import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Parse JSON and urlencoded request bodies
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Proxy route for Integram API to bypass CORS ("Failed to fetch")
  app.all("/api/integram/*", async (req, res) => {
    try {
      // Extract subpath including query parameters from the route in a bulletproof way
      let subpath = req.originalUrl;
      if (subpath.startsWith("/api/integram/")) {
        subpath = subpath.substring("/api/integram/".length);
      } else if (subpath.startsWith("/api/integram")) {
        subpath = subpath.substring("/api/integram".length);
      }
      subpath = subpath.replace(/^\/+/, "");

      const targetUrl = `https://ideav.ru/${subpath}`;

      const headers: Record<string, string> = {};
      
      // Copy relevant authorization and content type headers
      if (req.headers['x-authorization']) {
        headers['X-Authorization'] = req.headers['x-authorization'] as string;
      }
      if (req.headers['accept']) {
        headers['Accept'] = req.headers['accept'] as string;
      }
      if (req.headers['content-type']) {
        headers['Content-Type'] = req.headers['content-type'] as string;
      }

      const fetchOptions: any = {
        method: req.method,
        headers,
      };

      // Handle request body for POST requests
      if (req.method === "POST" && req.body) {
        if (req.headers['content-type']?.includes('application/x-www-form-urlencoded')) {
          const params = new URLSearchParams();
          Object.entries(req.body).forEach(([k, v]) => {
            params.append(k, String(v));
          });
          fetchOptions.body = params.toString();
        } else if (req.headers['content-type']?.includes('application/json')) {
          fetchOptions.body = JSON.stringify(req.body);
        } else {
          fetchOptions.body = req.body;
        }
      }

      console.log(`[Proxy] ${req.method} ${req.originalUrl} -> ${targetUrl}`);

      const response = await fetch(targetUrl, fetchOptions);
      const text = await response.text();

      // Forward headers
      if (response.headers.get('content-type')) {
        res.setHeader('Content-Type', response.headers.get('content-type')!);
      }

      res.status(response.status).send(text);
    } catch (error: any) {
      console.error(`[Proxy Error] ${error.message}`);
      res.status(500).json({ error: "Proxy failed", message: error.message });
    }
  });

  // Vite dev middleware for asset serving in development mode
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
