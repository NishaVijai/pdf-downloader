import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());

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

const PORT = 4000;
app.listen(PORT, () => console.log(`Proxy server running on port ${PORT}`));
