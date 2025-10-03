import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Circle } from "lucide-react";

// Initial dummy data for blockchain
const initialBlockchain = {
  blocks: [
    {
      index: 1,
      hash: "0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0",
      timestamp: "2025-08-07T06:00:00Z",
      data: { transactions: [{ id: "TXN001", type: "claim" }, { id: "TXN002", type: "policy" }] },
      isNew: false,
    },
    {
      index: 2,
      hash: "0x2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1",
      timestamp: "2025-08-07T06:05:00Z",
      data: { transactions: [{ id: "TXN003", type: "bill" }] },
      isNew: false,
    },
    {
      index: 3,
      hash: "0x3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2",
      timestamp: "2025-08-07T06:10:00Z",
      data: { transactions: [{ id: "TXN004", type: "claim" }, { id: "TXN005", type: "evidence" }] },
      isNew: false,
    },
    {
      index: 4,
      hash: "0x4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3",
      timestamp: "2025-08-07T06:15:00Z",
      data: { transactions: [{ id: "TXN006", type: "policy" }] },
      isNew: false,
    },
    {
      index: 5,
      hash: "0x5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4",
      timestamp: "2025-08-07T06:20:00Z",
      data: { transactions: [{ id: "TXN007", type: "bill" }, { id: "TXN008", type: "claim" }] },
      isNew: false,
    },
  ],
};

// Mock getBlockType function
const getBlockType = (block: any) => {
  const types = block.data.transactions.map((tx: any) => tx.type);
  if (types.includes("claim")) return { type: "Claim", color: "blue" };
  if (types.includes("bill")) return { type: "Bill", color: "green" };
  if (types.includes("policy")) return { type: "Policy", color: "purple" };
  return { type: "Generic", color: "gray" };
};

// Mock formatDate function
const formatDate = (timestamp: string) => {
  return new Date(timestamp).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Mock shortenHash function
const shortenHash = (hash: string) => {
  return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
};

// Generate a new block
const generateNewBlock = (currentBlocks: any[]) => {
  const lastIndex = currentBlocks.length > 0 ? Math.max(...currentBlocks.map(b => b.index)) : 0;
  const newIndex = lastIndex + 1;
  const timestamp = new Date("2025-08-07T06:44:00Z").toISOString();
  const transactionTypes = ["claim", "bill", "policy", "evidence"];
  const numTransactions = Math.floor(Math.random() * 3) + 1; // 1-3 transactions
  const transactions = Array.from({ length: numTransactions }, (_, i) => ({
    id: `TXN${(newIndex * 100 + i + 1).toString().padStart(3, "0")}`,
    type: transactionTypes[Math.floor(Math.random() * transactionTypes.length)],
  }));
  return {
    index: newIndex,
    hash: `0x${Math.random().toString(16).slice(2, 18)}${newIndex}...${Math.random().toString(16).slice(2, 6)}`,
    timestamp,
    data: { transactions },
    isNew: true,
  };
};

interface BlockchainVisualizationProps {
  onOpenBlockDetails: (index: number) => void;
  fullWidth?: boolean;
}

export default function BlockchainVisualization({
  onOpenBlockDetails,
  fullWidth = false,
}: BlockchainVisualizationProps) {
  const blockchainRef = useRef<HTMLDivElement>(null);
  const [blockchain, setBlockchain] = useState(initialBlockchain);
  const [connections, setConnections] = useState<Array<{ left: number; width: number }>>([]);
  const [triggerAnimation, setTriggerAnimation] = useState(0);

  // Limit the number of blocks shown in the visualization
  const visibleBlocks = blockchain.blocks.slice(0, 5);

  // Calculate connections between blocks
  useEffect(() => {
    if (!blockchainRef.current || !visibleBlocks.length) {
      return;
    }

    const calculateConnections = () => {
      const blockElements = blockchainRef.current?.querySelectorAll(".block");
      const newConnections: Array<{ left: number; width: number }> = [];

      if (blockElements && blockElements.length > 1) {
        const containerRect = blockchainRef.current?.getBoundingClientRect();

        for (let i = 0; i < blockElements.length - 1; i++) {
          const block1Rect = blockElements[i].getBoundingClientRect();
          const block2Rect = blockElements[i + 1].getBoundingClientRect();

          newConnections.push({
            left: block1Rect.right - containerRect.left + 8, // Adjust for padding
            width: block2Rect.left - block1Rect.right - 16,
          });
        }

        setConnections(newConnections);
      }
    };

    // Initial calculation
    setTimeout(calculateConnections, 100);

    // Recalculate on window resize
    window.addEventListener("resize", calculateConnections);
    return () => {
      window.removeEventListener("resize", calculateConnections);
    };
  }, [visibleBlocks.length, triggerAnimation]);

  // Simulate dynamic blockchain updates
  useEffect(() => {
    const interval = setInterval(() => {
      setBlockchain((prev) => {
        const newBlocks = [...prev.blocks];
        // 70% chance to add a new block, 30% chance to update an existing one
        if (Math.random() > 0.3) {
          // Add new block, remove oldest if > 5
          const newBlock = generateNewBlock(newBlocks);
          newBlocks.unshift(newBlock);
          if (newBlocks.length > 5) {
            newBlocks.pop();
          }
        } else {
          // Update a random block's transactions
          const indexToUpdate = Math.floor(Math.random() * newBlocks.length);
          const transactionTypes = ["claim", "bill", "policy", "evidence"];
          const numTransactions = Math.floor(Math.random() * 3) + 1;
          newBlocks[indexToUpdate].data.transactions = Array.from({ length: numTransactions }, (_, i) => ({
            id: `TXN${(newBlocks[indexToUpdate].index * 100 + i + 1).toString().padStart(3, "0")}`,
            type: transactionTypes[Math.floor(Math.random() * transactionTypes.length)],
          }));
          newBlocks[indexToUpdate].timestamp = new Date("2025-08-07T06:44:00Z").toISOString();
          newBlocks[indexToUpdate].isNew = true;
        }
        // Clear isNew flag after 10 seconds
        setTimeout(() => {
          setBlockchain((prev2) => ({
            ...prev2,
            blocks: prev2.blocks.map((b) => ({ ...b, isNew: false })),
          }));
        }, 10000);
        return { blocks: newBlocks };
      });
      setTriggerAnimation((prev) => prev + 1);
    }, 12000); // Update every 12 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <Card
      className={`${
        fullWidth ? "" : "lg:col-span-2"
      } bg-white shadow-lg transition-all duration-300 hover:shadow-xl mb-8`}
    >
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold text-gray-900">Blockchain Visualization</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-blue-600 hover:bg-blue-50 hover:text-blue-700 transition-all duration-200"
            asChild
          >
            <a href="/blockchain">View All</a>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0 pb-8">
        <div ref={blockchainRef} className="blockchain relative">
          <div className="flex space-x-4 overflow-x-auto py-4 px-2">
            {visibleBlocks.map((block: any, index: number) => {
              const blockTypeInfo = getBlockType(block);

              return (
                <div
                  key={block.hash}
                  onClick={() => onOpenBlockDetails(block.index)}
                  className={`block bg-${blockTypeInfo.color}-50 border border-${blockTypeInfo.color}-200/50 rounded-lg p-3 min-w-[200px] z-10 shadow-sm cursor-pointer hover:scale-105 transition-all duration-200 animate-block-update`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-center justify-between">
                    <div className={`text-xs font-semibold text-${blockTypeInfo.color}-600 mb-1`}>
                      {blockTypeInfo.type} Block
                    </div>
                    {block.isNew && (
                      <Badge className="bg-blue-600 text-white text-xs animate-pulse">
                        New
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm font-mono truncate text-gray-800">
                    #{block.index.toString().padStart(4, "0")}
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    Hash: {shortenHash(block.hash)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Timestamp: {formatDate(block.timestamp)}
                  </div>
                  <div className="mt-2 text-xs flex items-center text-gray-600">
                    <FileText className="h-3 w-3 mr-1" />
                    <span className={block.isNew ? "animate-pulse" : ""}>
                      {block.data.transactions?.length || 0} transaction
                      {(block.data.transactions?.length || 0) !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Connection lines between blocks */}
          {connections.map((conn, index) => (
            <div
              key={index}
              className="connection absolute top-1/2 h-2 bg-gradient-to-r from-gray-300 to-gray-400 rounded-full z-0 animate-connection"
              style={{
                left: `${conn.left}px`,
                width: `${conn.width}px`,
              }}
            ></div>
          ))}
        </div>

        <div className="mt-6 text-sm text-gray-500 flex items-center">
          <Circle className="h-3 w-3 mr-2 text-green-500 animate-pulse" />
          <p>
            Total of {blockchain.blocks.length} blocks on the chain. Each block contains immutable transaction records.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}