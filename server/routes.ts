import type { Express } from "express";
import { createServer, type Server } from "http";
import { insertClaimSchema } from "@shared/schema";
import authRoutes from './authRoutes';
import { authenticate } from './auth';
import { log } from "./vite";
import { submitTransaction, evaluateTransaction } from "./fabric/fabricClient";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  const apiPrefix = "/api";

  // -----------------------
  // AUTH ROUTES
  // -----------------------
  app.use(`${apiPrefix}/auth`, authRoutes);

  // -----------------------
  // USERS
  // -----------------------
  app.post(`${apiPrefix}/users`, async (req, res) => {
    log("👤 Registering new user:", req.body);
    const tx = await submitTransaction("CreateUser", [
      req.body.username,
      req.body.role,
      req.body.email,
      req.body.nrc
    ]);
    res.status(201).json({ message: "User created", tx });
  });

  app.get(`${apiPrefix}/users/role/:role`, async (req, res) => {
    const role = req.params.role;
    const users = await evaluateTransaction("GetUsersByRole", [role]);
    res.json({ users: JSON.parse(users) });
  });

  app.get(`${apiPrefix}/users/:id`, async (req, res) => {
    const user = await evaluateTransaction("GetUserById", [req.params.id]);
    res.json({ user: JSON.parse(user) });
  });

  // -----------------------
  // VEHICLES
  // -----------------------
  app.post(`${apiPrefix}/vehicles`, async (req, res) => {
    const { vehicleId, make, model, year, licensePlate, owner } = req.body;
    const tx = await submitTransaction("RegisterVehicle", [
      vehicleId, make, model, String(year), licensePlate, owner
    ]);
    res.status(201).json({ message: "Vehicle registered", tx });
  });

  app.get(`${apiPrefix}/vehicles/:id`, async (req, res) => {
    const vehicle = await evaluateTransaction("GetVehicleById", [req.params.id]);
    res.json({ vehicle: JSON.parse(vehicle) });
  });

  // -----------------------
  // POLICIES
  // -----------------------
  app.post(`${apiPrefix}/policies`, async (req, res) => {
    const { policyId, vehicleId, coverageType, premium, startDate, endDate, status } = req.body;
    const tx = await submitTransaction("CreatePolicy", [
      policyId, vehicleId, coverageType, String(premium), startDate, endDate, status
    ]);
    res.status(201).json({ message: "Policy created", tx });
  });

  app.get(`${apiPrefix}/policies/user/:userId`, async (req, res) => {
    const policies = await evaluateTransaction("GetPoliciesByUserId", [req.params.userId]);
    res.json({ policies: JSON.parse(policies) });
  });

  // -----------------------
  // CLAIMS
  // -----------------------
  app.post(`${apiPrefix}/claims`, async (req, res) => {
    const result = insertClaimSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: "Invalid claim", details: result.error });
    }

    const {
      claimId, policyId, vehicleId, incidentDate,
      incidentType, description, damageEstimate, status
    } = result.data;

    const tx = await submitTransaction("CreateClaim", [
      claimId, policyId, vehicleId, incidentDate,
      incidentType, description, String(damageEstimate), status
    ]);
    log("✅ Fabric TX: CreateClaim", tx);
    res.status(201).json({ message: "Claim submitted", tx });
  });

  app.get(`${apiPrefix}/claims`, async (_req, res) => {
    const claims = await evaluateTransaction("GetAllClaims", []);
    res.json({ claims: JSON.parse(claims) });
  });

  app.get(`${apiPrefix}/claims/:id`, async (req, res) => {
    const claim = await evaluateTransaction("GetClaimById", [req.params.id]);
    res.json({ claim: JSON.parse(claim) });
  });

  app.patch(`${apiPrefix}/claims/:id/assign/:adjusterId`, async (req, res) => {
    const tx = await submitTransaction("AssignAdjuster", [
      req.params.id, req.params.adjusterId
    ]);
    res.json({ message: "Adjuster assigned", tx });
  });

  app.patch(`${apiPrefix}/claims/:id/review`, async (req, res) => {
    const { status, reviewedBy } = req.body;
    const tx = await submitTransaction("ReviewClaim", [
      req.params.id, status, reviewedBy
    ]);
    res.json({ message: "Claim reviewed", tx });
  });

  app.patch(`${apiPrefix}/claims/:id/repair`, async (req, res) => {
    const tx = await submitTransaction("ConfirmRepair", [req.params.id]);
    res.json({ message: "Repair confirmed", tx });
  });

  // -----------------------
  // BLOCKCHAIN + NODES
  // -----------------------
  app.get(`${apiPrefix}/blockchain/blocks`, async (_req, res) => {
    const blocks = await evaluateTransaction("GetAllBlocks", []);
    res.json({ blocks: JSON.parse(blocks) });
  });

  app.get(`${apiPrefix}/blockchain/nodes`, async (_req, res) => {
    const nodes = await evaluateTransaction("GetAllNodes", []);
    res.json({ nodes: JSON.parse(nodes) });
  });

  // -----------------------
  // GARAGE / ADJUSTER
  // -----------------------
  app.post(`${apiPrefix}/adjustments/:claimId`, async (req, res) => {
    const { report, amount, garageId } = req.body;
    const tx = await submitTransaction("SubmitAdjustmentReport", [
      req.params.claimId, report, String(amount), garageId
    ]);
    res.status(201).json({ message: "Adjustment submitted", tx });
  });

  return httpServer;
}
