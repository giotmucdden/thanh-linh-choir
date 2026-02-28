import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";

// Get directory path - works in both development and production (bundled)
function getBaseDir(): string {
  // In production, use process.cwd() since we're running from dist/
  if (process.env.NODE_ENV === "production") {
    return process.cwd();
  }
  // In development, always use process.cwd() which is the project root
  return process.cwd();
}

export async function setupVite(app: Express, server: Server) {
  // Dynamically import vite only in development to avoid bundling issues
  const { createServer: createViteServer } = await import("vite");
  const viteConfig = (await import("../../vite.config")).default;
  
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const baseDir = getBaseDir();
      const clientTemplate = path.resolve(
        baseDir,
        "client",
        "index.html"
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const baseDir = getBaseDir();
  // In production, files are in dist/public relative to cwd
  const distPath = path.resolve(baseDir, "dist", "public");

  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
