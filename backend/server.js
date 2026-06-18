// Tiny JWT-minting service for the embedded "Acme" demo.
//
// Why this exists: the Prismatic embedded SDK authenticates with an RS256 JWT
// signed by the ORG's signing key. That key can mint tokens for ANY customer in
// the org, so it must never touch client-side code. This service holds the key
// as a Cloud Run secret env var and mints only short-lived, demo-customer-scoped
// tokens. The static GitHub Pages frontend calls GET /token to get one.

const express = require("express");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = process.env.PORT || 8080;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "https://smeltser-dev.github.io";
const ORG = process.env.PRISMATIC_ORG_ID;          // organization claim
const KEY = process.env.PRISMATIC_SIGNING_KEY;     // RSA private key (PEM), injected as a secret

// Fixed demo identity — every visitor is the same throwaway demo customer.
// A leaked token can only ever act as "Acme Corp [Demo]", never your org.
const DEMO = {
  sub: "acme-demo-user",
  external_id: "acme-demo-user",
  customer: "acme-demo",
  customer_name: "Acme Corp [Demo]",
  name: "Acme Demo User",
  email: "demo@acme.example.com",
};

app.use((req, res, next) => {
  // Scope CORS to the Pages origin — not "*".
  res.set("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  res.set("Vary", "Origin");
  next();
});

app.get("/", (_req, res) => res.send("ok"));

app.get("/token", (_req, res) => {
  if (!ORG || !KEY) return res.status(500).json({ error: "service not configured" });
  const now = Math.floor(Date.now() / 1000);
  const exp = now + 600; // 10 minutes
  const token = jwt.sign(
    { ...DEMO, organization: ORG, iat: now - 5, exp },
    KEY,
    { algorithm: "RS256" },
  );
  res.json({ token, expiresAt: exp * 1000 });
});

app.listen(PORT, () => console.log(`token service listening on :${PORT}`));
