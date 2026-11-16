import express from "express";
import { renderHome } from "./src/page.js";

const app = express();

app.get("/", (_req, res) => {
  res.type("html").send(renderHome());
});

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

// On Vercel the app is exported and run as a function; locally we listen on a port.
if (!process.env.VERCEL && process.env.NODE_ENV !== "test") {
  const port = Number(process.env.PORT) || 3000;
  app.listen(port, () => {
    console.log(`uniclothes running at http://localhost:${port}`);
  });
}

export default app;
