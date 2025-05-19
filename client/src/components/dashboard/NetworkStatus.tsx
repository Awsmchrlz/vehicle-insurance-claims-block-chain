import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { timeAgo } from "@/lib/utils";
import { RefreshCw, Info } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface NetworkStatusProps {
  consensusData?: {
    nodeCount: number;
    activeNodes: number;
    consensusAchieved: boolean;
    lastConsensusTime: string;
    chainValid: boolean;
  };
}

export default function NetworkStatus({ consensusData }: NetworkStatusProps) {
  // Fetch nodes data
  const { data: nodesData, isLoading, refetch } = useQuery({
    queryKey: ['/api/nodes'],
  });

  const handleRefresh = () => {
    refetch();
  };

  return (
    <Card className="lg:col-span-1">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Network Status</CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleRefresh}
            className="h-8 px-2 text-blue-600"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          {isLoading ? (
            // Skeleton loading state
            Array(5).fill(0).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <Skeleton className="h-3 w-3 rounded-full mr-3" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            ))
          ) : (
            // Actual node data
            nodesData?.nodes.map((node: any) => (
              <div key={node.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className={`h-3 w-3 ${node.status === 'active' ? 'bg-green-500 node-pulse' : 'bg-amber-500'} rounded-full mr-3`}></div>
                  <span className="font-medium">{node.name}</span>
                </div>
                <span className={`text-xs px-2 py-1 ${
                  node.status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-amber-100 text-amber-800'
                } rounded-full`}>
                  {node.status === 'active' ? 'Active' : 'Syncing'}
                </span>
              </div>
            ))
          )}
        </div>
        
        {consensusData && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100 text-sm text-blue-800">
            <p className="flex items-center">
              <Info className="h-4 w-4 mr-2" /> 
              Last consensus reached: {timeAgo(consensusData.lastConsensusTime)}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
