import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Check, Clock, Hash, Server } from "lucide-react";
import { useMutation, useQueryClient } from '@tanstack/react-query';

// Mining stages for visualization
enum MiningStage {
  COLLECTING = 'COLLECTING',
  HASHING = 'HASHING',
  CALCULATING = 'CALCULATING',
  VERIFYING = 'VERIFYING',
  COMPLETE = 'COMPLETE'
}

// Sample transaction data
const sampleTransactions = [
  { id: 'tx001', type: 'CLAIM', data: { claimId: 'CLM-2023-0045', policyId: 'POL-2023-0018' } },
  { id: 'tx002', type: 'POLICY', data: { policyId: 'POL-2023-0021', vehicleId: 'VEH-2023-0033' } }
];

export function MiningVisualizer() {
  const [stage, setStage] = useState<MiningStage>(MiningStage.COLLECTING);
  const [progress, setProgress] = useState(0);
  const [difficulty, setDifficulty] = useState(2);
  const [nonce, setNonce] = useState(0);
  const [transactions, setTransactions] = useState(sampleTransactions);
  const [currentHashAttempt, setCurrentHashAttempt] = useState('');
  const [finalHash, setFinalHash] = useState('');
  const [isMining, setIsMining] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [merkleRoot, setMerkleRoot] = useState('');
  
  const queryClient = useQueryClient();
  
  // Mine block mutation
  const mineMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/mine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error('Mining failed');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/blockchain'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
    }
  });

  // Start the mining process
  const startMining = () => {
    setIsMining(true);
    setStage(MiningStage.COLLECTING);
    setProgress(0);
    setNonce(0);
    setCurrentHashAttempt('');
    setFinalHash('');
    setTimeElapsed(0);
    
    // Start the timer
    const startTime = Date.now();
    const timer = setInterval(() => {
      setTimeElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    
    // Simulate collecting transactions
    setTimeout(() => {
      setProgress(20);
      setStage(MiningStage.CALCULATING);
      
      // Simulate calculating merkle root
      setTimeout(() => {
        const mockMerkleRoot = '4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b';
        setMerkleRoot(mockMerkleRoot);
        setProgress(40);
        setStage(MiningStage.HASHING);
        
        // Simulate hashing attempts
        let hashingProgress = 40;
        let currentNonce = 0;
        
        const hashingInterval = setInterval(() => {
          if (hashingProgress >= 90) {
            clearInterval(hashingInterval);
            setStage(MiningStage.VERIFYING);
            setProgress(95);
            
            // Simulate verification
            setTimeout(() => {
              setProgress(100);
              setStage(MiningStage.COMPLETE);
              setFinalHash('00' + Math.random().toString(16).slice(2));
              setIsMining(false);
              clearInterval(timer);
              
              // Actually mine the block using the API
              mineMutation.mutate();
            }, 1000);
            return;
          }
          
          currentNonce += Math.floor(Math.random() * 100) + 1;
          setNonce(currentNonce);
          
          // Generate a random hash
          const randomHash = Math.random().toString(16).slice(2);
          setCurrentHashAttempt(randomHash);
          
          hashingProgress += Math.random() * 5;
          setProgress(Math.min(Math.floor(hashingProgress), 90));
        }, 200);
      }, 1000);
    }, 1500);
  };
  
  const formatHash = (hash: string) => {
    if (!hash) return '';
    if (hash.length <= 10) return hash;
    return `${hash.substring(0, 6)}...${hash.substring(hash.length - 4)}`;
  };
  
  const getStageDescription = (stage: MiningStage) => {
    switch (stage) {
      case MiningStage.COLLECTING:
        return 'Collecting transactions for the new block';
      case MiningStage.CALCULATING:
        return 'Calculating merkle root for transaction integrity';
      case MiningStage.HASHING:
        return `Finding valid hash (difficulty: ${difficulty})`;
      case MiningStage.VERIFYING:
        return 'Verifying block integrity and broadcasting to network';
      case MiningStage.COMPLETE:
        return 'Block successfully mined and added to the blockchain';
      default:
        return '';
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto border border-primary-700 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-primary-800 to-primary-900 text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-2">
          <Server className="h-5 w-5" />
          <span>Block Mining Visualizer</span>
        </CardTitle>
        <CardDescription className="text-primary-100">
          Explore the computational process of mining a new block
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-6 space-y-6">
        {/* Stage and progress indicator */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Mining Progress</span>
            <span className="text-sm">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
          
          <div className="flex items-center mt-2 text-sm">
            <Badge variant={stage === MiningStage.COMPLETE ? "default" : "secondary"} className="mr-2">
              {stage}
            </Badge>
            <span className="text-muted-foreground">
              {getStageDescription(stage)}
            </span>
          </div>
        </div>
        
        <Separator />
        
        {/* Mining parameters */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm font-medium mb-1">Difficulty</div>
            <div className="flex items-center">
              <Hash className="h-4 w-4 mr-2 text-primary-600" />
              <span className="font-mono">{difficulty} (requires {difficulty} leading zeros)</span>
            </div>
          </div>
          
          <div>
            <div className="text-sm font-medium mb-1">Current Nonce</div>
            <div className="flex items-center">
              <AlertCircle className="h-4 w-4 mr-2 text-primary-600" />
              <span className="font-mono">{nonce.toLocaleString()}</span>
            </div>
          </div>
        </div>
        
        <Separator />
        
        {/* Transactions being included */}
        <div>
          <div className="text-sm font-medium mb-2">Transactions</div>
          <div className="bg-gray-50 rounded-md p-3 max-h-24 overflow-y-auto">
            {transactions.map(tx => (
              <div key={tx.id} className="text-xs mb-1 flex justify-between">
                <span className="font-medium">{tx.type}</span>
                <span className="text-gray-500 font-mono">{JSON.stringify(tx.data).slice(0, 30)}...</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Hash attempts */}
        <div>
          <div className="text-sm font-medium mb-2">Current Hash Attempt</div>
          <div className="bg-gray-50 rounded-md p-3 font-mono text-xs break-all">
            {currentHashAttempt || 'Waiting to start...'}
          </div>
        </div>
        
        {stage === MiningStage.COMPLETE && (
          <div className="bg-green-50 border border-green-200 rounded-md p-3">
            <div className="flex items-center text-green-800 font-medium mb-1">
              <Check className="h-4 w-4 mr-2" />
              <span>Block successfully mined!</span>
            </div>
            <div className="text-xs font-mono text-green-700">
              Block Hash: {finalHash}
            </div>
            <div className="text-xs font-mono text-green-700">
              Merkle Root: {formatHash(merkleRoot)}
            </div>
            <div className="text-xs text-green-600 mt-1">
              Time elapsed: {timeElapsed} seconds with {nonce.toLocaleString()} nonce attempts
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="bg-gray-50 p-4 border-t">
        <div className="flex items-center gap-2 w-full">
          <Button 
            onClick={startMining} 
            disabled={isMining || mineMutation.isPending}
            className="w-full"
          >
            {isMining ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                Mining in Progress...
              </>
            ) : mineMutation.isPending ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                Recording Block...
              </>
            ) : (
              'Mine New Block'
            )}
          </Button>
          
          {stage === MiningStage.COMPLETE && (
            <Button variant="outline" onClick={() => window.location.reload()}>
              View Updated Blockchain
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}