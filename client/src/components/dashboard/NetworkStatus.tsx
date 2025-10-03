import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { timeAgo } from "@/lib/utils";
import { RefreshCw, Info } from "lucide-react";

// Initial dummy data for nodes
const initialNodes = [
  { id: "node1", name: "peer0.rtsa.insurance-claims.com:7061", status: "active" },
  { id: "node2", name: "peer0.pia.insurance-claims.com:7081", status: "active" },
  { id: "node3", name: "peer0.zsic.insurance-claims.com:7041", status: "syncing" },
  { id: "node4", name: "peer0.zp.insurance-claims.com:7101", status: "active" },
  { id: "node5", name: "peer0.garage.insurance-claims.com:7121", status: "active" },
];

// Initial dummy consensus data
const initialConsensus = {
  nodeCount: 5,
  activeNodes: 4,
  consensusAchieved: true,
  lastConsensusTime: "2025-08-07T06:00:00Z",
  chainValid: true,
};

interface NetworkStatusProps {
  consensusData?: {
    nodeCount: number;
    activeNodes: number;
    consensusAchieved: boolean;
    lastConsensusTime: string;
    chainValid: boolean;
  };
}

export default function NetworkStatus({ consensusData = initialConsensus }: NetworkStatusProps) {
  const [nodes, setNodes] = useState(initialNodes);
  const [consensus, setConsensus] = useState(consensusData);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [triggerAnimation, setTriggerAnimation] = useState(0);

  // Simulate dynamic status updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Update node statuses
      const updatedNodes = nodes.map((node) => ({
        ...node,
        status: Math.random() > 0.2 ? "active" : "syncing", // 80% chance of active
      }));

      // Count active nodes
      const activeNodesCount = updatedNodes.filter((node) => node.status === "active").length;

      // Update consensus data
      const newConsensus = {
        ...consensus,
        activeNodes: activeNodesCount,
        lastConsensusTime: new Date(
          new Date(consensus.lastConsensusTime).getTime() + (5 + Math.random() * 5) * 60 * 1000
        ).toISOString(), // Add 5-10 minutes
        consensusAchieved: activeNodesCount >= 3, // Consensus if 3+ nodes active
        chainValid: activeNodesCount >= 3,
      };

      setNodes(updatedNodes);
      setConsensus(newConsensus);
      setTriggerAnimation((prev) => prev + 1); // Trigger animation
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [nodes, consensus]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Simulate refresh by triggering an immediate status update
    const updatedNodes = nodes.map((node) => ({
      ...node,
      status: Math.random() > 0.2 ? "active" : "syncing",
    }));
    const activeNodesCount = updatedNodes.filter((node) => node.status === "active").length;
    const newConsensus = {
      ...consensus,
      activeNodes: activeNodesCount,
      lastConsensusTime: new Date(
        new Date(consensus.lastConsensusTime).getTime() + (5 + Math.random() * 5) * 60 * 1000
      ).toISOString(),
      consensusAchieved: activeNodesCount >= 3,
      chainValid: activeNodesCount >= 3,
    };

    setNodes(updatedNodes);
    setConsensus(newConsensus);
    setTriggerAnimation((prev) => prev + 1);
    setTimeout(() => setIsRefreshing(false), 1000); // End refresh animation
  };

  return (
    <Card className="lg:col-span-1 bg-white shadow-lg transition-all duration-300 hover:shadow-xl">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold text-gray-900">Network Status</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            className="h-8 px-2 text-blue-600 hover:bg-blue-50 hover:text-blue-700 transition-all duration-200"
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          {nodes.map((node) => (
            <div
              key={node.id}
              className={`flex items-center justify-between p-3 bg-gray-50 rounded-lg animate-status-change`}
              style={{ animationDelay: `${nodes.indexOf(node) * 0.1}s` }}
            >
              <div className="flex items-center">
                <div
                  className={`h-3 w-3 ${
                    node.status === "active" ? "bg-green-500 node-pulse" : "bg-amber-500"
                  } rounded-full mr-3 transition-colors duration-300`}
                ></div>
                <span className="font-medium text-gray-700 text-sm">{node.name}</span>
              </div>
              <span
                className={`text-xs px-2 py-1 ${
                  node.status === "active"
                    ? "bg-green-100 text-green-800"
                    : "bg-amber-100 text-amber-800"
                } rounded-full font-medium transition-all duration-300`}
              >
                {node.status.charAt(0).toUpperCase() + node.status.slice(1)}
              </span>
            </div>
          ))}
        </div>
        <div
          className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100 text-sm text-blue-800 animate-status-change"
          key={triggerAnimation}
        >
          <p className="flex items-center">
            <Info className="h-4 w-4 mr-2" />
            Last consensus reached: {timeAgo(consensus.lastConsensusTime)}
          </p>
          <p className="flex items-center mt-1">
            <Info className="h-4 w-4 mr-2" />
            {consensus.consensusAchieved ? "Consensus Achieved" : "Consensus Pending"}
          </p>
          <p className="flex items-center mt-1">
            <Info className="h-4 w-4 mr-2" />
            Chain Status: {consensus.chainValid ? "Valid" : "Invalid"}
          </p>
          <p className="flex items-center mt-1">
            <Info className="h-4 w-4 mr-2" />
            Active Nodes: {consensus.activeNodes}/{consensus.nodeCount}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}