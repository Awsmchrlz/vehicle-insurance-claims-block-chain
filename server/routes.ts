
import type { Express } from "express";
import { createServer, type Server } from "http";
import { insertClaimSchema, insertAdjusterSchema, insertAdjustmentReportSchema, insertGarageSchema } from "@shared/schema";
import { z } from "zod";
import authRoutes from './authRoutes';
import { authenticate } from './auth';
import { log } from "./vite";
import { submitTransaction, evaluateTransaction, getNetworkStatus, testConnection, handleSetOrgRequest, getOrganization, handleSubmitTransactionRequest } from "./fabric/fabricClient";

// Schema for vehicle registration
const insertVehicleSchema = z.object({
  vehicleId: z.string().min(1, "Vehicle ID is required"),
  make: z.string().min(1, "Make is required"),
  model: z.string().min(1, "Model is required"),
  year: z.number().int().min(1900, "Year must be a valid year").max(2026, "Year cannot be in the future"),
  licensePlate: z.string().min(1, "License plate is required"),
  owner: z.string().min(1, "Owner NRC is required").regex(/^\d+\/\d+\/\d+$/, "Owner must be a valid NRC number (e.g., 123456/10/1)")
});

// Schema for peer selection (requires RTSA peer for vehicles)
const peerSelectionSchema = z.object({
  selectedPeers: z.array(z.string().min(1, "Peer name cannot be empty")).min(1, "At least one peer is required").refine(
    (peers) => peers.includes("peer0.rtsa.insurance-claims.com"),
    { message: "At least one RTSA peer (peer0.rtsa.insurance-claims.com) is required" }
  )
});

const insertBillSchema = z.object({
  claimId: z.string().min(1, "Claim ID is required"),
  totalAmount: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Total amount must be a number with up to 2 decimal places")
    .transform((val) => parseFloat(val))
    .refine((val) => val > 0, "Total amount must be greater than 0")
    .refine((val) => val <= 1000000, "Total amount cannot exceed 1,000,000"),
  insuranceCompanyId: z.string().min(1, "Insurance company ID is required"),
  customerNrc: z.string().min(1, "Customer NRC is required"),
});

const evidenceSchema = z.object({
  evidence: z.string().min(1, "Evidence description is required").max(1000, "Evidence description is too long"),
  evidenceSignature: z.string().min(1, "Evidence signature is required"),
});

const setOrgSchema = z.object({
  org: z.enum(['rtsa', 'pia', 'zsic', 'zp', 'garage'], {
    errorMap: () => ({ message: "Invalid organization, must be one of: rtsa, pia, zsic, zp, garage" })
  })
});

const updatePaymentStatusSchema = z.object({
  status: z.enum(['PENDING', 'ISSUED', 'CLEARED', 'FAILED'], {
    errorMap: () => ({ message: "Invalid status, must be one of: PENDING, ISSUED, CLEARED, FAILED" })
  })
});

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  const apiPrefix = "/api";

  // Generate unique request ID
  const generateRequestId = () => Math.random().toString(36).substring(2);

  // -----------------------
  // VEHICLES
  // -----------------------
  app.post(`${apiPrefix}/vehicles`, async (req, res) => {
    const requestId = generateRequestId();
    try {
      console.log(`[${requestId}] Received POST /api/vehicles with payload:`, req.body);
      const result = insertVehicleSchema.safeParse(req.body);
      const peerResult = peerSelectionSchema.safeParse({ selectedPeers: req.body.selectedPeers });
      if (!result.success) {
        console.log(`[${requestId}] Payload validation failed:`, result.error);
        return res.status(400).json({ error: "Invalid vehicle data", details: result.error });
      }
      if (!peerResult.success) {
        console.log(`[${requestId}] Peer selection validation failed:`, peerResult.error);
        return res.status(400).json({ error: "Invalid peer selection", details: peerResult.error });
      }
      const { vehicleId, make, model, year, licensePlate, owner, orgId } = result.data;
      const tx = await handleSubmitTransactionRequest({
        body: {
          functionName: "registerVehicle",
          args: [vehicleId, make, model, String(year), licensePlate, owner, orgId],
          selectedPeers: req.body.selectedPeers
        }
      }, res);
      console.log(`[${requestId}] Vehicle registration transaction submitted:`, tx);
    } catch (error: any) {
      console.error(`[${requestId}] Error registering vehicle:`, error.message, error.stack);
      if (error.message.includes("VEHICLE_EXISTS")) {
        return res.status(409).json({ error: `Vehicle ${req.body.vehicleId} already exists` });
      }

      res.status(500).json({ error: `Failed to register vehicle: ${error.message}` });
    }
  });

  app.get(`${apiPrefix}/vehicles`, async (req, res) => {
    const requestId = generateRequestId();
    try {
      console.log(`[${requestId}] Received GET /api/vehicles`);
      const vehicles = await evaluateTransaction("getAllVehicles", []);
      res.json({ vehicles: JSON.parse(vehicles) });
    } catch (error: any) {
      console.error(`[${requestId}] Error fetching vehicles:`, error);
      res.status(500).json({ error: "Failed to fetch vehicles: " + error.message });
    }
  });

  app.get(`${apiPrefix}/vehicles/:id`, async (req, res) => {
    const requestId = generateRequestId();
    try {
      console.log(`[${requestId}] Received GET /api/vehicles/${req.params.id}`);
      const vehicle = await evaluateTransaction("readVehicle", [req.params.id]);
      res.json({ vehicle: JSON.parse(vehicle) });
    } catch (error: any) {
      console.error(`[${requestId}] Error reading vehicle:`, error);
      res.status(500).json({ error: "Failed to read vehicle: " + error.message });
    }
  });

  // -----------------------
  // POLICIES
  // -----------------------
  app.post(`${apiPrefix}/policies`, async (req, res) => {
    const requestId = generateRequestId();
    try {
      console.log(`[${requestId}] Received POST /api/policies with payload:`, req.body);
      const { function: functionName, args, selectedPeers } = req.body;
      if (!functionName) {
        return res.status(400).json({ error: 'Function name is required' });
      }
      const peerResult = peerSelectionSchema.safeParse({ selectedPeers });
      if (!peerResult.success) {
        return res.status(400).json({ error: "Invalid peer selection", details: peerResult.error });
      }
      const result = await handleSubmitTransactionRequest({
        body: { functionName, args: args || [], selectedPeers }
      }, res);
    } catch (error: any) {
      console.error(`[${requestId}] Error submitting policy transaction:`, error);
      res.status(500).json({ error: "Failed to submit policy transaction: " + error.message });
    }
  });

  app.get(`${apiPrefix}/policies`, async (req, res) => {
    const requestId = generateRequestId();
    try {
      console.log(`[${requestId}] Received GET /api/policies`);
      const policies = await evaluateTransaction("getAllPolicies", []);
      res.json({ policies: JSON.parse(policies) });
    } catch (error: any) {
      console.error(`[${requestId}] Error fetching policies:`, error);
      res.status(500).json({ error: "Failed to fetch policies: " + error.message });
    }
  });

  app.get(`${apiPrefix}/policies/:policyId`, async (req, res) => {
    const requestId = generateRequestId();
    try {
      console.log(`[${requestId}] Received GET /api/policies/${req.params.policyId}`);
      const policy = await evaluateTransaction("readPolicy", [req.params.policyId]);
      res.json({ policy: JSON.parse(policy) });
    } catch (error: any) {
      console.error(`[${requestId}] Error reading policy:`, error);
      res.status(500).json({ error: "Failed to read policy: " + error.message });
    }
  });

  // -----------------------
  // CLAIMS
  // -----------------------
  app.post(`${apiPrefix}/claims`, async (req, res) => {
    const requestId = generateRequestId();
    try {
      console.log(`[${requestId}] Received POST /api/claims with payload:`, req.body);
      const result = insertClaimSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid claim", details: result.error });
      }
      const peerResult = peerSelectionSchema.safeParse({ selectedPeers: req.body.selectedPeers });
      if (!peerResult.success) {
        return res.status(400).json({ error: "Invalid peer selection", details: peerResult.error });
      }
      const { claimId, policyId, vehicleId, garageId, selectedPeers } = result.data;
      const tx = await handleSubmitTransactionRequest({
        body: { functionName: "createClaim", args: [claimId, policyId, garageId, vehicleId], selectedPeers }
      }, res);
    } catch (error: any) {
      console.error(`[${requestId}] Error creating claim:`, error);
      res.status(500).json({ error: "Failed to create claim: " + error.message });
    }
  });

  app.get(`${apiPrefix}/claims`, async (req, res) => {
    const requestId = generateRequestId();
    try {
      console.log(`[${requestId}] Received GET /api/claims`);
      const claims = await evaluateTransaction("getAllClaims", []);
      res.json({ claims: JSON.parse(claims) });
    } catch (error: any) {
      console.error(`[${requestId}] Error fetching claims:`, error);
      res.status(500).json({ error: "Failed to fetch claims: " + error.message });
    }
  });

  app.get(`${apiPrefix}/claims/:id`, async (req, res) => {
    const requestId = generateRequestId();
    try {
      console.log(`[${requestId}] Received GET /api/claims/${req.params.id}`);
      const claim = await evaluateTransaction("readClaim", [req.params.id]);
      res.json({ claim: JSON.parse(claim) });
    } catch (error: any) {
      console.error(`[${requestId}] Error reading claim:`, error);
      res.status(500).json({ error: "Failed to read claim: " + error.message });
    }
  });

  app.patch(`${apiPrefix}/claims/:id/assign/:adjusterId`, async (req, res) => {
    const requestId = generateRequestId();
    try {
      console.log(`[${requestId}] Received PATCH /api/claims/${req.params.id}/assign/${req.params.adjusterId}`);
      const peerResult = peerSelectionSchema.safeParse({ selectedPeers: req.body.selectedPeers });
      if (!peerResult.success) {
        return res.status(400).json({ error: "Invalid peer selection", details: peerResult.error });
      }
      const tx = await handleSubmitTransactionRequest({
        body: { functionName: "assignAdjuster", args: [req.params.id, req.params.adjusterId], selectedPeers: req.body.selectedPeers }
      }, res);
    } catch (error: any) {
      console.error(`[${requestId}] Error assigning adjuster:`, error);
      res.status(500).json({ error: "Failed to assign adjuster: " + error.message });
    }
  });

  app.patch(`${apiPrefix}/claims/:id/review`, async (req, res) => {
    const requestId = generateRequestId();
    try {
      console.log(`[${requestId}] Received PATCH /api/claims/${req.params.id}/review with payload:`, req.body);
      const { status, reviewedBy, selectedPeers } = req.body;
      const peerResult = peerSelectionSchema.safeParse({ selectedPeers });
      if (!peerResult.success) {
        return res.status(400).json({ error: "Invalid peer selection", details: peerResult.error });
      }
      const tx = await handleSubmitTransactionRequest({
        body: { functionName: "reviewClaim", args: [req.params.id, status, reviewedBy], selectedPeers }
      }, res);
    } catch (error: any) {
      console.error(`[${requestId}] Error reviewing claim:`, error);
      res.status(500).json({ error: "Failed to review claim: " + error.message });
    }
  });

  app.patch(`${apiPrefix}/claims/:id/repair`, async (req, res) => {
    const requestId = generateRequestId();
    try {
      console.log(`[${requestId}] Received PATCH /api/claims/${req.params.id}/repair`);
      const peerResult = peerSelectionSchema.safeParse({ selectedPeers: req.body.selectedPeers });
      if (!peerResult.success) {
        return res.status(400).json({ error: "Invalid peer selection", details: peerResult.error });
      }
      const tx = await handleSubmitTransactionRequest({
        body: { functionName: "confirmRepair", args: [req.params.id], selectedPeers: req.body.selectedPeers }
      }, res);
    } catch (error: any) {
      console.error(`[${requestId}] Error confirming repair:`, error);
      res.status(500).json({ error: "Failed to confirm repair: " + error.message });
    }
  });

  app.post(`${apiPrefix}/claims/:id/evidence`, async (req, res) => {
    const requestId = generateRequestId();
    try {
      console.log(`[${requestId}] Received POST /api/claims/${req.params.id}/evidence with payload:`, req.body);
      const result = evidenceSchema.safeParse(req.body);
      const peerResult = peerSelectionSchema.safeParse({ selectedPeers: req.body.selectedPeers });
      if (!result.success) {
        return res.status(400).json({ error: "Invalid evidence", details: result.error });
      }
      if (!peerResult.success) {
        return res.status(400).json({ error: "Invalid peer selection", details: peerResult.error });
      }
      const { evidence, evidenceSignature } = result.data;
      const tx = await handleSubmitTransactionRequest({
        body: { functionName: "policeUpdateEvidence", args: [req.params.id, evidence, evidenceSignature], selectedPeers: req.body.selectedPeers }
      }, res);
    } catch (error: any) {
      console.error(`[${requestId}] Error adding evidence for claim ${req.params.id}:`, error);
      res.status(500).json({ error: "Failed to add evidence: " + error.message });
    }
  });

  // -----------------------
  // INSURANCE COMPANIES
  // -----------------------
  app.post(`${apiPrefix}/insurance-companies`, async (req, res) => {
    const requestId = generateRequestId();
    try {
      console.log(`[${requestId}] Received POST /api/insurance-companies with payload:`, req.body);
      const { companyId, companyName, address, contactEmail, registrationNumber, selectedPeers } = req.body;
      if (!companyId || !companyName || !address || !contactEmail || !registrationNumber) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      const peerResult = peerSelectionSchema.safeParse({ selectedPeers });
      if (!peerResult.success) {
        return res.status(400).json({ error: "Invalid peer selection", details: peerResult.error });
      }
      const result = await handleSubmitTransactionRequest({
        body: { functionName: "registerInsuranceCompany", args: [companyId, companyName, address, contactEmail, registrationNumber], selectedPeers }
      }, res);
    } catch (error: any) {
      console.error(`[${requestId}] Error registering insurance company:`, error);
      if (error.message.includes("COMPANY_EXISTS")) {
        return res.status(409).json({ error: `Insurance company ${req.body.companyId} already exists` });
      }
      res.status(500).json({ error: "Failed to register insurance company: " + error.message });
    }
  });

  app.post(`${apiPrefix}/insurance-companies/:companyId/approve`, async (req, res) => {
    const requestId = generateRequestId();
    try {
      console.log(`[${requestId}] Received POST /api/insurance-companies/${req.params.companyId}/approve`);
      const { companyId } = req.params;
      const { selectedPeers } = req.body;
      const peerResult = peerSelectionSchema.safeParse({ selectedPeers });
      if (!peerResult.success) {
        return res.status(400).json({ error: "Invalid peer selection", details: peerResult.error });
      }
      const result = await handleSubmitTransactionRequest({
        body: { functionName: "approveInsuranceCompany", args: [companyId], selectedPeers }
      }, res);
    } catch (error: any) {
      console.error(`[${requestId}] Error approving insurance company:`, error);
      if (error.message.includes("INSURANCE_COMPANY_NOT_FOUND")) {
        return res.status(404).json({ error: `Insurance company ${req.params.companyId} not found` });
      }
      if (error.message.includes("COMPANY_ALREADY_ACTIVE")) {
        return res.status(400).json({ error: `Insurance company ${req.params.companyId} is already active` });
      }
      res.status(500).json({ error: "Failed to approve insurance company: " + error.message });
    }
  });

  app.get(`${apiPrefix}/insurance-companies/:companyId`, async (req, res) => {
    const requestId = generateRequestId();
    try {
      console.log(`[${requestId}] Received GET /api/insurance-companies/${req.params.companyId}`);
      const { companyId } = req.params;
      const insuranceCompany = await evaluateTransaction("readInsuranceCompany", [companyId]);
      res.status(200).json({ insuranceCompany: JSON.parse(insuranceCompany) });
    } catch (error: any) {
      console.error(`[${requestId}] Error reading insurance company:`, error);
      if (error.message.includes("INSURANCE_COMPANY_NOT_FOUND")) {
        return res.status(404).json({ error: `Insurance company ${req.params.companyId} not found` });
      }
      res.status(500).json({ error: "Failed to read insurance company: " + error.message });
    }
  });

  app.get(`${apiPrefix}/insurance-companies/exists/:companyId`, async (req, res) => {
    const requestId = generateRequestId();
    try {
      console.log(`[${requestId}] Received GET /api/insurance-companies/exists/${req.params.companyId}`);
      const { companyId } = req.params;
      const exists = await evaluateTransaction("insuranceCompanyExists", [companyId]);
      res.status(200).json({ exists: JSON.parse(exists) });
    } catch (error: any) {
      console.error(`[${requestId}] Error checking insurance company existence:`, error);
      res.status(500).json({ error: "Failed to check insurance company existence: " + error.message });
    }
  });

  app.get(`${apiPrefix}/insurance-companies`, async (req, res) => {
    const requestId = generateRequestId();
    try {
      console.log(`[${requestId}] Received GET /api/insurance-companies?page=${req.query.page}&limit=${req.query.limit}`);
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const insuranceCompanies = JSON.parse(await evaluateTransaction("getAllInsuranceCompanies", []));
      const start = (page - 1) * limit;
      const end = start + limit;
      const paginatedCompanies = insuranceCompanies.slice(start, end);
      res.status(200).json({
        insuranceCompanies: paginatedCompanies,
        total: insuranceCompanies.length,
        page,
        limit,
      });
    } catch (error: any) {
      console.error(`[${requestId}] Error fetching insurance companies:`, error);
      if (error.message.includes("QUERY_ERROR")) {
        return res.status(500).json({ error: "Failed to query insurance companies" });
      }
      res.status(500).json({ error: "Failed to fetch insurance companies: " + error.message });
    }
  });

  // -----------------------
  // GARAGES
  // -----------------------
  app.post(`${apiPrefix}/garages`, async (req, res) => {
    const requestId = generateRequestId();
    try {
      console.log(`[${requestId}] Received POST /api/garages with payload:`, req.body);
      const { garageId, garageName, address, contactNumber, specialization, status, selectedPeers } = req.body;
      console.log(req.body);
      if (!garageId || !garageName || !address || !contactNumber || !specialization) {
        return res.status(400).json({ error: "All fields are required" });
      }
      const peerResult = peerSelectionSchema.safeParse({ selectedPeers });
      if (!peerResult.success) {
        return res.status(400).json({ error: "Invalid peer selection", details: peerResult.error });
      }
      const result = await handleSubmitTransactionRequest({
        body: { functionName: "createGarage", args: [garageId, garageName, address, contactNumber, specialization], selectedPeers }
      }, res);
    } catch (error: any) {
      console.error(`[${requestId}] Error creating garage:`, error);
      if (error.message.includes("Garage") && error.message.includes("already exists")) {
        return res.status(400).json({ error: `Garage with ID ${req.body.garageId} already exists` });
      }
      const errorMessage = error.message.includes("Address contains invalid characters")
        ? "Address contains invalid characters (e.g., slashes are not allowed)"
        : error.message || "Failed to create garage";
      res.status(500).json({ error: errorMessage });
    }
  });

  app.get(`${apiPrefix}/garages/:garageId/claims`, async (req, res) => {
    const requestId = generateRequestId();
    try {
      console.log(`[${requestId}] Received GET /api/garages/${req.params.garageId}/claims`);
      const { garageId } = req.params;
      const result = await evaluateTransaction("queryClaimsByGarage", [garageId]);
      res.status(200).json({ claims: JSON.parse(result) });
    } catch (error: any) {
      console.error(`[${requestId}] Error fetching claims for garage ${req.params.garageId}:`, error);
      res.status(500).json({ error: "Failed to fetch claims for garage: " + error.message });
    }
  });

  app.get(`${apiPrefix}/garages`, async (req, res) => {
    const requestId = generateRequestId();
    try {
      console.log(`[${requestId}] Received GET /api/garages`);
      const garages = await evaluateTransaction("getAllGarages", []);
      res.json({ garages: JSON.parse(garages) });
    } catch (error: any) {
      console.error(`[${requestId}] Error fetching garages:`, error);
      res.status(500).json({ error: "Failed to fetch garages: " + error.message });
    }
  });

  app.post(`${apiPrefix}/garages/:id/approve`, async (req, res) => {
    const requestId = generateRequestId();
    try {
      console.log(`[${requestId}] Received POST /api/garages/${req.params.id}/approve`);
      const peerResult = peerSelectionSchema.safeParse({ selectedPeers: req.body.selectedPeers });
      if (!peerResult.success) {
        return res.status(400).json({ error: "Invalid peer selection", details: peerResult.error });
      }
      const tx = await handleSubmitTransactionRequest({
        body: { functionName: "approveGarage", args: [req.params.id], selectedPeers: req.body.selectedPeers }
      }, res);
    } catch (error: any) {
      console.error(`[${requestId}] Error approving garage:`, error);
      res.status(500).json({ error: "Failed to approve garage: " + error.message });
    }
  });

  app.post(`${apiPrefix}/garages/:id/suspend`, async (req, res) => {
    const requestId = generateRequestId();
    try {
      console.log(`[${requestId}] Received POST /api/garages/${req.params.id}/suspend`);
      const peerResult = peerSelectionSchema.safeParse({ selectedPeers: req.body.selectedPeers });
      if (!peerResult.success) {
        return res.status(400).json({ error: "Invalid peer selection", details: peerResult.error });
      }
      const tx = await handleSubmitTransactionRequest({
        body: { functionName: "suspendGarage", args: [req.params.id], selectedPeers: req.body.selectedPeers }
      }, res);
    } catch (error: any) {
      console.error(`[${requestId}] Error suspending garage:`, error);
      res.status(500).json({ error: "Failed to suspend garage: " + error.message });
    }
  });

  // -----------------------
  // BILLS
  // -----------------------
  app.post(`${apiPrefix}/bills`, async (req, res) => {
    const requestId = generateRequestId();
    try {
      console.log(`[${requestId}] Received POST /api/bills with payload:`, req.body);
      const result = insertBillSchema.safeParse(req.body);
      const peerResult = peerSelectionSchema.safeParse({ selectedPeers: req.body.selectedPeers });
      if (!result.success) {
        return res.status(400).json({ error: "Invalid bill data", details: result.error });
      }
      if (!peerResult.success) {
        return res.status(400).json({ error: "Invalid peer selection", details: peerResult.error });
      }
      const { claimId, totalAmount, insuranceCompanyId, customerNrc, selectedPeers } = result.data;
      const tx = await handleSubmitTransactionRequest({
        body: { functionName: "createBill", args: [claimId, totalAmount.toString(), insuranceCompanyId, customerNrc], selectedPeers }
      }, res);
    } catch (error: any) {
      console.error(`[${requestId}] Error creating bill:`, error);
      if (error.message.includes("BILL_ALREADY_EXISTS")) {
        return res.status(409).json({ error: `Bill for claim ${req.body.claimId} already exists` });
      }
      if (error.message.includes("CLAIM_NOT_FOUND")) {
        return res.status(404).json({ error: `Claim ${req.body.claimId} not found` });
      }
      if (error.message.includes("INSURANCE_COMPANY_NOT_FOUND")) {
        return res.status(404).json({ error: `Insurance company ${req.body.insuranceCompanyId} not found` });
      }
      if (error.message.includes("EVIDENCE_PROVIDED")) {
        return res.status(400).json({ error: `Claim ${req.body.claimId} requires evidence to be uploaded` });
      }
      if (error.message.includes("INVALID_AMOUNT")) {
        return res.status(400).json({ error: "Invalid bill amount" });
      }
      if (error.message.includes("STATE_UPDATE_ERROR")) {
        return res.status(500).json({ error: "Failed to update blockchain state" });
      }
      res.status(500).json({ error: "Failed to create bill: " + error.message });
    }
  });

  app.get(`${apiPrefix}/bills`, async (req, res) => {
    const requestId = generateRequestId();
    try {
      console.log(`[${requestId}] Received GET /api/bills?page=${req.query.page}&limit=${req.query.limit}`);
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const bills = JSON.parse(await evaluateTransaction("getAllBills", []));
      const start = (page - 1) * limit;
      const end = start + limit;
      const paginatedBills = bills.slice(start, end);
      res.status(200).json({
        bills: paginatedBills,
        total: bills.length,
        page,
        limit,
      });
    } catch (error: any) {
      console.error(`[${requestId}] Error fetching bills:`, error);
      if (error.message.includes("QUERY_ERROR")) {
        return res.status(500).json({ error: "Failed to query bills" });
      }
      res.status(500).json({ error: "Failed to fetch bills: " + error.message });
    }
  });

  app.get(`${apiPrefix}/bills/:billId`, async (req, res) => {
    const requestId = generateRequestId();
    try {
      console.log(`[${requestId}] Received GET /api/bills/${req.params.billId}`);
      const { billId } = req.params;
      const bill = await evaluateTransaction("readBill", [billId]);
      res.status(200).json({ bill: JSON.parse(bill) });
    } catch (error: any) {
      console.error(`[${requestId}] Error reading bill:`, error);
      if (error.message.includes("BILL_NOT_FOUND")) {
        return res.status(404).json({ error: `Bill ${req.params.billId} not found` });
      }
      res.status(500).json({ error: "Failed to read bill: " + error.message });
    }
  });

  // -----------------------
  // PAYMENTS
  // -----------------------
  app.get(`${apiPrefix}/payments/:paymentId`, async (req, res) => {
    const requestId = generateRequestId();
    try {
      console.log(`[${requestId}] Received GET /api/payments/${req.params.paymentId}`);
      const { paymentId } = req.params;
      const payment = await evaluateTransaction("readPayment", [paymentId]);
      res.status(200).json({ payment: JSON.parse(payment) });
    } catch (error: any) {
      console.error(`[${requestId}] Error reading payment:`, error);
      if (error.message.includes("PAYMENT_NOT_FOUND")) {
        return res.status(404).json({ error: `Payment ${req.params.paymentId} not found` });
      }
      if (error.message.includes("DESERIALIZATION_ERROR")) {
        return res.status(500).json({ error: "Failed to deserialize payment data" });
      }
      res.status(500).json({ error: "Failed to read payment: " + error.message });
    }
  });

  app.get(`${apiPrefix}/payments`, async (req, res) => {
    const requestId = generateRequestId();
    try {
      console.log(`[${requestId}] Received GET /api/payments?page=${req.query.page}&limit=${req.query.limit}`);
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const payments = JSON.parse(await evaluateTransaction("getAllPayments", []));
      const start = (page - 1) * limit;
      const end = start + limit;
      const paginatedPayments = payments.slice(start, end);
      res.status(200).json({
        payments: paginatedPayments,
        total: payments.length,
        page,
        limit,
      });
    } catch (error: any) {
      console.error(`[${requestId}] Error fetching payments:`, error);
      if (error.message.includes("QUERY_ERROR")) {
        return res.status(500).json({ error: "Failed to query payments" });
      }
      if (error.message.includes("DESERIALIZATION_ERROR")) {
        return res.status(500).json({ error: "Failed to deserialize payment data" });
      }
      res.status(500).json({ error: "Failed to fetch payments: " + error.message });
    }
  });

  app.get(`${apiPrefix}/claims/:claimId/payments`, async (req, res) => {
    const requestId = generateRequestId();
    try {
      console.log(`[${requestId}] Received GET /api/claims/${req.params.claimId}/payments`);
      const { claimId } = req.params;
      const payments = await evaluateTransaction("getPaymentsByClaim", [claimId]);
      res.status(200).json({ payments: JSON.parse(payments) });
    } catch (error: any) {
      console.error(`[${requestId}] Error fetching payments for claim ${req.params.claimId}:`, error);
      if (error.message.includes("QUERY_ERROR")) {
        return res.status(500).json({ error: "Failed to query payments" });
      }
      if (error.message.includes("DESERIALIZATION_ERROR")) {
        return res.status(500).json({ error: "Failed to deserialize payment data" });
      }
      res.status(500).json({ error: "Failed to fetch payments for claim: " + error.message });
    }
  });

  app.patch(`${apiPrefix}/payments/:paymentId/status`, async (req, res) => {
    const requestId = generateRequestId();
    try {
      console.log(`[${requestId}] Received PATCH /api/payments/${req.params.paymentId}/status with payload:`, req.body);
      const result = updatePaymentStatusSchema.safeParse(req.body);
      const peerResult = peerSelectionSchema.safeParse({ selectedPeers: req.body.selectedPeers });
      if (!result.success) {
        return res.status(400).json({ error: "Invalid status", details: result.error });
      }
      if (!peerResult.success) {
        return res.status(400).json({ error: "Invalid peer selection", details: peerResult.error });
      }
      const { paymentId } = req.params;
      const { status } = result.data;
      const tx = await handleSubmitTransactionRequest({
        body: { functionName: "updatePaymentStatus", args: [paymentId, status], selectedPeers: req.body.selectedPeers }
      }, res);
    } catch (error: any) {
      console.error(`[${requestId}] Error updating payment status:`, error);
      if (error.message.includes("PAYMENT_NOT_FOUND")) {
        return res.status(404).json({ error: `Payment ${req.params.paymentId} not found` });
      }
      if (error.message.includes("INVALID_PAYMENT_STATUS")) {
        return res.status(400).json({ error: "Invalid payment status" });
      }
      if (error.message.includes("DESERIALIZATION_ERROR")) {
        return res.status(500).json({ error: "Failed to deserialize payment data" });
      }
      res.status(500).json({ error: "Failed to update payment status: " + error.message });
    }
  });

  // -----------------------
  // ORGANIZATION
  // -----------------------
  app.post(`${apiPrefix}/set-org`, async (req, res) => {
    const requestId = generateRequestId();
    try {
      console.log(`[${requestId}] Received POST /api/set-org with payload:`, req.body);
      const result = setOrgSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid organization", details: result.error });
      }
      await handleSetOrgRequest({ body: result.data }, res);
    } catch (error: any) {
      console.error(`[${requestId}] Error setting organization:`, error);
      res.status(500).json({ error: "Failed to set organization: " + error.message });
    }
  });

  app.get(`${apiPrefix}/get-org`, async (req, res) => {
    const requestId = generateRequestId();
    try {
      console.log(`[${requestId}] Received GET /api/get-org`);
      const org = await getOrganization();
      res.status(200).json({ org });
    } catch (error: any) {
      console.error(`[${requestId}] Error fetching organization:`, error);
      res.status(500).json({ error: "Failed to fetch organization: " + error.message });
    }
  });

  return httpServer;
}