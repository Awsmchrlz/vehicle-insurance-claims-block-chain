import { pgTable, text, serial, integer, jsonb, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// Nodes in the blockchain network
export const nodes = pgTable("nodes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  type: text("type").notNull(), // primary, insurance, audit, rtsa
  status: text("status").notNull(), // active, inactive, syncing
  lastSeen: timestamp("last_seen"),
});

export const insertNodeSchema = createInsertSchema(nodes).pick({
  name: true,
  address: true,
  type: true,
  status: true,
});

// Blocks in the blockchain
export const blocks = pgTable("blocks", {
  id: serial("id").primaryKey(),
  index: integer("index").notNull(), // The block number/height
  timestamp: timestamp("timestamp").notNull(),
  previousHash: text("previous_hash").notNull(),
  hash: text("hash").notNull().unique(),
  data: jsonb("data").notNull(), // JSON with transactions
  nonce: integer("nonce").notNull(),
  merkleRoot: text("merkle_root"),
});

export const insertBlockSchema = createInsertSchema(blocks).pick({
  index: true,
  timestamp: true,
  previousHash: true,
  hash: true,
  data: true,
  nonce: true,
  merkleRoot: true,
});

// Vehicles insured
export const vehicles = pgTable("vehicles", {
  id: serial("id").primaryKey(),
  vehicleId: text("vehicle_id").notNull().unique(), // e.g., ZM-LUS-1234
  make: text("make").notNull(),
  model: text("model").notNull(),
  year: integer("year").notNull(),
  licensePlate: text("license_plate").notNull(),
  owner: text("owner").notNull(),
});

export const insertVehicleSchema = createInsertSchema(vehicles).pick({
  vehicleId: true,
  make: true,
  model: true,
  year: true,
  licensePlate: true,
  owner: true,
});

// Insurance policies
export const policies = pgTable("policies", {
  id: serial("id").primaryKey(),
  policyId: text("policy_id").notNull().unique(), // e.g., POL-2023-0018
  vehicleId: text("vehicle_id").notNull().references(() => vehicles.vehicleId),
  coverageType: text("coverage_type").notNull(), // comprehensive, third-party
  premium: integer("premium").notNull(), // Amount in ZMW
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  status: text("status").notNull(), // active, expired, cancelled
  createdAt: timestamp("created_at").notNull(),
});

export const insertPolicySchema = createInsertSchema(policies).pick({
  policyId: true,
  vehicleId: true,
  coverageType: true,
  premium: true,
  startDate: true,
  endDate: true,
  status: true,
  createdAt: true,
});

// Insurance claims
export const claims = pgTable("claims", {
  id: serial("id").primaryKey(),
  claimId: text("claim_id").notNull().unique(), // e.g., CLM-2025-1234
  policyId: text("policy_id").notNull().references(() => policies.policyId),
  garageId: text("garage_id").notNull().references(() => garages.garageId),
  vehicleId: text("vehicle_id").notNull().references(() => vehicles.vehicleId),
  blockIndex: integer("block_index"), // Reference to which block this claim is saved in
  transactionHash: text("transaction_hash"), // The transaction hash in the blockchain
});

export const insertClaimSchema = createInsertSchema(claims).omit({
  id: true,
  blockIndex: true,
  transactionHash: true,
});

// Adjusters
export const adjusters = pgTable("adjusters", {
  id: serial("id").primaryKey(),
  adjusterId: text("adjuster_id").notNull().unique(), // e.g., ADJ001
  name: text("name").notNull(),
});

export const insertAdjusterSchema = createInsertSchema(adjusters).pick({
  adjusterId: true,
  name: true,
});

// Garages
export const garages = pgTable("garages", {
  id: serial("id").primaryKey(),
  garageId: text("garage_id").notNull().unique(), // e.g., GAR001
  garageName: text("garage_name").notNull(),
  address: text("address").notNull(),
  contactNumber: text("contact_number").notNull(),
  specialization: text("specialization").notNull(),
  garageStatus: text("garageStatus").notNull(), // UNDER_REVIEW, APPROVED, REJECTED
});

export const insertGarageSchema = createInsertSchema(garages).pick({
  garageId: true,
  garageName: true,
  address: true,
  contactNumber: true,
  specialization: true,
});

// Adjustment reports
export const insertAdjustmentReportSchema = z.object({
  adjusterId: z.string().min(1, "Adjuster ID is required"),
  assessmentReport: z.string().min(1, "Assessment report is required"),
  repairCost: z.number().min(0, "Repair cost must be non-negative"),
});

// Define types for frontend usage
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Node = typeof nodes.$inferSelect;
export type InsertNode = z.infer<typeof insertNodeSchema>;

export type Block = typeof blocks.$inferSelect;
export type InsertBlock = z.infer<typeof insertBlockSchema>;

export type Vehicle = typeof vehicles.$inferSelect;
export type InsertVehicle = z.infer<typeof insertVehicleSchema>;

export type Policy = typeof policies.$inferSelect;
export type InsertPolicy = z.infer<typeof insertPolicySchema>;

export type Claim = typeof claims.$inferSelect;
export type InsertClaim = z.infer<typeof insertClaimSchema>;

export type Adjuster = typeof adjusters.$inferSelect;
export type InsertAdjuster = z.infer<typeof insertAdjusterSchema>;

export type Garage = typeof garages.$inferSelect;
export type InsertGarage = z.infer<typeof insertGarageSchema>;

export type InsertAdjustmentReport = z.infer<typeof insertAdjustmentReportSchema>;