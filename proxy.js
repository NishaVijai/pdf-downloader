import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());

// Endpoint to check if a PDF exists (HEAD request)
app.get("/check-pdf", async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).json({ ok: false, error: "No URL provided" });

  try {
    const response = await fetch(url, { method: "HEAD" });
    const contentType = response.headers.get("content-type") || "";
    const isPdf = response.ok && contentType.includes("application/pdf");
    res.json({ ok: isPdf });
  } catch (err) {
    res.json({ ok: false, error: err.message });
  }
});

// Endpoint to download a PDF and stream it to the client
app.get("/download-pdf", async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).json({ error: "No URL provided" });

  try {
    const response = await fetch(url);
    if (!response.ok) {
      return res.status(404).json({ error: "File not found" });
    }
    const contentType = response.headers.get("content-type") || "application/pdf";
    res.setHeader("Content-Type", contentType);
    const filename = url.split("/").pop() || "file.pdf";
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    response.body.pipe(res);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = 4000;
app.listen(PORT, () => console.log(`Proxy server running on port ${PORT}`));
