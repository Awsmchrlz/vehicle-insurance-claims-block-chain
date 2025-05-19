import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { blockchain } from "./blockchain/Blockchain";
import { initializeNodeNetwork } from "./blockchain/Node";
import { Block } from "./blockchain/Block";
import { TransactionFactory, TransactionType } from "./blockchain/Transaction";
import { z } from "zod";
import { insertClaimSchema } from "@shared/schema";

// Initialize the blockchain node network
const nodes = initializeNodeNetwork(blockchain);

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // API route prefix
  const apiPrefix = "/api";

  // Endpoint to get network status (nodes)
  app.get(`${apiPrefix}/nodes`, async (req, res) => {
    try {
      const networkNodes = await storage.getNodes();
      res.json({ nodes: networkNodes });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch nodes" });
    }
  });

  // Endpoint to get blockchain (all blocks)
  app.get(`${apiPrefix}/blockchain`, async (req, res) => {
    try {
      const blocks = await storage.getBlocks();
      res.json({ blocks });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch blockchain" });
    }
  });

  // Endpoint to get a specific block by index
  app.get(`${apiPrefix}/blocks/:index`, async (req, res) => {
    try {
      const index = parseInt(req.params.index);
      if (isNaN(index)) {
        return res.status(400).json({ error: "Invalid block index" });
      }

      const block = await storage.getBlockByIndex(index);
      if (!block) {
        return res.status(404).json({ error: "Block not found" });
      }

      res.json({ block });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch block" });
    }
  });

  // Endpoint to get a specific block by hash
  app.get(`${apiPrefix}/blocks/hash/:hash`, async (req, res) => {
    try {
      const hash = req.params.hash;
      const block = await storage.getBlockByHash(hash);
      if (!block) {
        return res.status(404).json({ error: "Block not found" });
      }

      res.json({ block });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch block" });
    }
  });

  // Endpoint to get policies
  app.get(`${apiPrefix}/policies`, async (req, res) => {
    try {
      const policies = await storage.getPolicies();
      res.json({ policies });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch policies" });
    }
  });

  // Endpoint to get a specific policy
  app.get(`${apiPrefix}/policies/:policyId`, async (req, res) => {
    try {
      const policyId = req.params.policyId;
      const policy = await storage.getPolicyByPolicyId(policyId);
      if (!policy) {
        return res.status(404).json({ error: "Policy not found" });
      }

      res.json({ policy });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch policy" });
    }
  });

  // Endpoint to get vehicles
  app.get(`${apiPrefix}/vehicles`, async (req, res) => {
    try {
      const vehicles = await storage.getVehicles();
      res.json({ vehicles });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch vehicles" });
    }
  });

  // Endpoint to get claims
  app.get(`${apiPrefix}/claims`, async (req, res) => {
    try {
      const claims = await storage.getClaims();
      res.json({ claims });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch claims" });
    }
  });

  // Endpoint to get recent claims with limit
  app.get(`${apiPrefix}/claims/recent/:limit`, async (req, res) => {
    try {
      const limit = parseInt(req.params.limit) || 5;
      const claims = await storage.getClaimsWithLimit(limit);
      res.json({ claims });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch recent claims" });
    }
  });

  // Endpoint to get a specific claim
  app.get(`${apiPrefix}/claims/:claimId`, async (req, res) => {
    try {
      const claimId = req.params.claimId;
      const claim = await storage.getClaimByClaimId(claimId);
      if (!claim) {
        return res.status(404).json({ error: "Claim not found" });
      }

      res.json({ claim });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch claim" });
    }
  });

  // Endpoint to submit a new claim
  app.post(`${apiPrefix}/claims`, async (req, res) => {
    try {
      // Validate the request body
      const result = insertClaimSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid claim data", details: result.error });
      }

      // Create the claim in storage
      const claim = await storage.createClaim(result.data);

      // Create a blockchain transaction for this claim
      const transactionHash = blockchain.createClaimTransaction({
        claimId: claim.claimId,
        policyId: claim.policyId,
        vehicleId: claim.vehicleId,
        dateOfIncident: new Date(claim.incidentDate),
        description: claim.description,
        damageAmount: claim.damageEstimate,
        status: claim.status
      });

      // Mine a new block with this transaction
      const newBlock = blockchain.minePendingTransactions();

      if (newBlock) {
        // Update claim with blockchain reference
        await storage.updateClaimBlockInfo(claim.claimId, newBlock.index, transactionHash);

        // Broadcast the new block to all nodes
        for (const [_, node] of nodes) {
          node.broadcastBlock(newBlock);
        }

        // Return the updated claim
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
    } catch (error) {
      res.status(500).json({ error: "Failed to submit claim" });
    }
  });

  // Endpoint to get statistics for dashboard
  app.get(`${apiPrefix}/stats`, async (req, res) => {
    try {
      const policies = await storage.getPolicies();
      const claims = await storage.getClaims();
      const blocks = await storage.getBlocks();
      const nodes = await storage.getNodes();

      // Calculate active claims (not settled)
      const activeClaims = claims.filter(claim => 
        claim.status !== 'settled' && claim.status !== 'rejected'
      );

      res.json({
        totalPolicies: policies.length,
        activeClaims: activeClaims.length,
        blocksInChain: blocks.length,
        activeNodes: nodes.filter(node => node.status === 'active').length
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch statistics" });
    }
  });

  // Endpoint to get network consensus status
  app.get(`${apiPrefix}/consensus`, async (req, res) => {
    try {
      const networkNodes = await storage.getNodes();
      
      // In a real implementation, this would check the actual consensus state
      // For this POC, we'll simulate consensus status
      const lastConsensusTime = new Date();
      lastConsensusTime.setMinutes(lastConsensusTime.getMinutes() - 2); // 2 minutes ago
      
      res.json({
        nodeCount: networkNodes.length,
        activeNodes: networkNodes.filter(node => node.status === 'active').length,
        consensusAchieved: true,
        lastConsensusTime: lastConsensusTime.toISOString(),
        chainValid: blockchain.isChainValid()
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch consensus status" });
    }
  });

  /**
   * Academic purpose only - endpoint to simulate mining a new block 
   * This would typically happen automatically based on network consensus
   */
  app.post(`${apiPrefix}/mine`, async (req, res) => {
    try {
      // Check if there are pending transactions
      if (blockchain.pendingTransactions.length === 0) {
        // If no pending transactions, create a dummy transaction for demonstration
        blockchain.addTransaction(
          TransactionFactory.createGenesisTransaction("Demonstration transaction for academic purposes")
        );
      }
      
      // Mine a new block
      const newBlock = blockchain.minePendingTransactions();
      
      if (!newBlock) {
        return res.status(400).json({ error: "Failed to mine a new block" });
      }
      
      // Add the block to storage
      await storage.createBlock({
        index: newBlock.index,
        timestamp: newBlock.timestamp,
        previousHash: newBlock.previousHash,
        hash: newBlock.hash,
        data: newBlock.data,
        nonce: newBlock.nonce,
        merkleRoot: newBlock.merkleRoot
      });
      
      // Broadcast the new block to all nodes
      for (const [_, node] of nodes) {
        node.broadcastBlock(newBlock);
      }
      
      res.json({ 
        message: "New block mined successfully", 
        block: newBlock 
      });
    } catch (error) {
      res.status(500).json({ error: "Mining operation failed" });
    }
  });

  return httpServer;
}
