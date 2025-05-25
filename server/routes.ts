import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { blockchain } from "./blockchain/Blockchain";
import { initializeNodeNetwork } from "./blockchain/Node";
import { Block } from "./blockchain/Block";
import { TransactionFactory, TransactionType } from "./blockchain/Transaction";
import { z } from "zod";
import { insertClaimSchema } from "@shared/schema";
import authRoutes from './authRoutes';
import { authenticate } from './auth';

// Future: Import Fabric SDK components (will integrate when Hyperledger Fabric is set up)
// import { submitTransaction } from './fabric/fabricClient';

// Initialize the blockchain node network
const nodes = initializeNodeNetwork(blockchain);

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  const apiPrefix = "/api";

  // Register auth routes
  app.use(`${apiPrefix}/auth`, authRoutes);

  // --- Blockchain Network Info Endpoints ---

  app.get(`${apiPrefix}/nodes`, async (req, res) => {
    try {
      const networkNodes = await storage.getNodes();
      res.json({ nodes: networkNodes });
    } catch {
      res.status(500).json({ error: "Failed to fetch nodes" });
    }
  });

  app.get(`${apiPrefix}/blockchain`, async (req, res) => {
    try {
      const blocks = await storage.getBlocks();
      res.json({ blocks });
    } catch {
      res.status(500).json({ error: "Failed to fetch blockchain" });
    }
  });

  app.get(`${apiPrefix}/blocks/:index`, async (req, res) => {
    const index = parseInt(req.params.index);
    if (isNaN(index)) return res.status(400).json({ error: "Invalid block index" });

    try {
      const block = await storage.getBlockByIndex(index);
      if (!block) return res.status(404).json({ error: "Block not found" });
      res.json({ block });
    } catch {
      res.status(500).json({ error: "Failed to fetch block" });
    }
  });

  app.get(`${apiPrefix}/blocks/hash/:hash`, async (req, res) => {
    try {
      const block = await storage.getBlockByHash(req.params.hash);
      if (!block) return res.status(404).json({ error: "Block not found" });
      res.json({ block });
    } catch {
      res.status(500).json({ error: "Failed to fetch block" });
    }
  });

  // --- Policy APIs ---

  app.get(`${apiPrefix}/policies`, async (req, res) => {
    try {
      const policies = await storage.getPolicies();
      res.json({ policies });
    } catch {
      res.status(500).json({ error: "Failed to fetch policies" });
    }
  });

  app.get(`${apiPrefix}/policies/:policyId`, async (req, res) => {
    try {
      const policy = await storage.getPolicyByPolicyId(req.params.policyId);
      if (!policy) return res.status(404).json({ error: "Policy not found" });
      res.json({ policy });
    } catch {
      res.status(500).json({ error: "Failed to fetch policy" });
    }
  });

  // --- Vehicle API ---

  app.get(`${apiPrefix}/vehicles`, async (req, res) => {
    try {
      const vehicles = await storage.getVehicles();
      res.json({ vehicles });
    } catch {
      res.status(500).json({ error: "Failed to fetch vehicles" });
    }
  });

  // --- Claim APIs ---

  app.get(`${apiPrefix}/claims`, async (req, res) => {
    try {
      const claims = await storage.getClaims();
      res.json({ claims });
    } catch {
      res.status(500).json({ error: "Failed to fetch claims" });
    }
  });

  app.get(`${apiPrefix}/claims/recent/:limit`, async (req, res) => {
    try {
      const limit = parseInt(req.params.limit) || 5;
      const claims = await storage.getClaimsWithLimit(limit);
      res.json({ claims });
    } catch {
      res.status(500).json({ error: "Failed to fetch recent claims" });
    }
  });

  app.get(`${apiPrefix}/claims/:claimId`, async (req, res) => {
    try {
      const claim = await storage.getClaimByClaimId(req.params.claimId);
      if (!claim) return res.status(404).json({ error: "Claim not found" });
      res.json({ claim });
    } catch {
      res.status(500).json({ error: "Failed to fetch claim" });
    }
  });

  app.post(`${apiPrefix}/claims`, async (req, res) => {
    try {
      const result = insertClaimSchema.safeParse(req.body);
      if (!result.success) return res.status(400).json({ error: "Invalid claim data", details: result.error });

      const claim = await storage.createClaim(result.data);

      // --- Blockchain integration ---
      const transactionHash = blockchain.createClaimTransaction({
        claimId: claim.claimId,
        policyId: claim.policyId,
        vehicleId: claim.vehicleId,
        dateOfIncident: new Date(claim.incidentDate),
        description: claim.description,
        damageAmount: claim.damageEstimate,
        status: claim.status
      });

      const newBlock = blockchain.minePendingTransactions();

      if (newBlock) {
        await storage.updateClaimBlockInfo(claim.claimId, newBlock.index, transactionHash);

        // Broadcast to other nodes
        for (const [_, node] of nodes) {
          node.broadcastBlock(newBlock);
        }

        const updatedClaim = await storage.getClaimByClaimId(claim.claimId);
        res.status(201).json({
          claim: updatedClaim,
          message: "Claim submitted and recorded on blockchain",
          blockIndex: newBlock.index,
          blockHash: newBlock.hash
        });
      } else {
        res.status(201).json({
          claim,
          message: "Claim submitted but not yet recorded on blockchain"
        });
      }

      // 🔁 Future Hyperledger Fabric support:
      // await submitTransaction('CreateClaim', [claim.claimId, claim.policyId, claim.vehicleId, ...])

    } catch (error) {
      res.status(500).json({ error: "Failed to submit claim", details: error });
    }
  });

  // --- Stats API ---

  app.get(`${apiPrefix}/stats`, async (req, res) => {
    try {
      const [policies, claims, blocks, nodes] = await Promise.all([
        storage.getPolicies(),
        storage.getClaims(),
        storage.getBlocks(),
        storage.getNodes()
      ]);

      const activeClaims = claims.filter(claim =>
        claim.status !== 'settled' && claim.status !== 'rejected'
      );

      res.json({
        totalPolicies: policies.length,
        activeClaims: activeClaims.length,
        blocksInChain: blocks.length,
        activeNodes: nodes.filter(node => node.status === 'active').length
      });
    } catch {
      res.status(500).json({ error: "Failed to fetch statistics" });
    }
  });

  // --- Consensus Status (simulated) ---

  app.get(`${apiPrefix}/consensus`, async (req, res) => {
    try {
      const networkNodes = await storage.getNodes();
      const lastConsensusTime = new Date();
      lastConsensusTime.setMinutes(lastConsensusTime.getMinutes() - 2);

      res.json({
        nodeCount: networkNodes.length,
        activeNodes: networkNodes.filter(node => node.status === 'active').length,
        consensusAchieved: true,
        lastConsensusTime: lastConsensusTime.toISOString(),
        chainValid: blockchain.isChainValid()
      });
    } catch {
      res.status(500).json({ error: "Failed to fetch consensus status" });
    }
  });

  // --- Simulate Mining (for demo/academic use) ---

  app.post(`${apiPrefix}/mine`, async (req, res) => {
    try {
      if (blockchain.pendingTransactions.length === 0) {
        blockchain.addTransaction(
          TransactionFactory.createGenesisTransaction("Demonstration transaction for academic purposes")
        );
      }

      const newBlock = blockchain.minePendingTransactions();
      if (!newBlock) return res.status(400).json({ error: "Failed to mine new block" });

      await storage.createBlock({
        index: newBlock.index,
        timestamp: newBlock.timestamp,
        previousHash: newBlock.previousHash,
        hash: newBlock.hash,
        data: newBlock.data,
        nonce: newBlock.nonce,
        merkleRoot: newBlock.merkleRoot
      });

      for (const [_, node] of nodes) {
        node.broadcastBlock(newBlock);
      }

      res.json({ message: "New block mined successfully", block: newBlock });
    } catch {
      res.status(500).json({ error: "Mining operation failed" });
    }
  });

  return httpServer;
}
