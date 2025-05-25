import express, { type Request, type Response, type NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { Gateway, Wallets } from "fabric-network";
import * as fs from "fs";
import * as path from "path";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ------------------------------
// Fabric Network Setup
// ------------------------------
async function connectToFabric() {
  try {
    const ccpPath = path.resolve(__dirname, "..","server" ,"fabric", "connection.json");
    const ccp = JSON.parse(fs.readFileSync(ccpPath, "utf8"));

    const walletPath = path.resolve(__dirname, "..", "server","fabric", "wallet");
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    const identityLabel = "admin";

    const identity = await wallet.get(identityLabel);
    if (!identity) {
        throw new Error('Admin identity not found in wallet');
    }
    const gateway = new Gateway();
    await gateway.connect(ccp, {
      wallet,
      identity: identityLabel,
      discovery: { enabled: false, asLocalhost: true },
    });

    const network = await gateway.getNetwork("mychannel");
    const contract = network.getContract("mycc");

    log("✅ Connected to Hyperledger Fabric");
    return contract;
  } catch (error) {
    log(`❌ Error connecting to Fabric: ${(error as Error).message}`);
    return null;
  }
}

// ------------------------------
// Express App Setup
// ------------------------------
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// ------------------------------
// Boot Application
// ------------------------------
import {enrollAdmin } from './fabric/enrollAdmin';

import {enrollAppUser } from './fabric/enrollAppUser';

(async () => {
    enrollAdmin();
    enrollAppUser().catch((e) => console.error("❌ Failed to enroll appUser:", e));

  const contract = await connectToFabric();
  app.set("fabricContract", contract); // Optional: store globally on the app

  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = 5002;
  server.listen({ port, host: "0.0.0.0", reusePort: true }, () => {
    log(`🚀 App running on port ${port}`);
  });
})();


