import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BlockDetailsModal from "@/components/modals/BlockDetailsModal";
import BlockchainVisualization from "@/components/dashboard/BlockchainVisualization";
import NetworkStatus from "@/components/dashboard/NetworkStatus";
import { MiningVisualizer } from "@/components/blockchain/MiningVisualizer";
import { Loader2, Info } from "lucide-react";
import { getBlockType, formatDate, shortenHash } from "@/lib/utils";

export default function Blockchain() {
  const [selectedBlockIndex, setSelectedBlockIndex] = useState<number | null>(null);

  // Fetch blockchain data
  const { data: blockchainData, isLoading } = useQuery({
    queryKey: ['/api/blockchain'],
  });

  // Fetch consensus data
  const { data: consensusData } = useQuery({
    queryKey: ['/api/consensus'],
  });

  const handleOpenBlockDetails = (index: number) => {
    setSelectedBlockIndex(index);
  };

  const handleCloseBlockDetails = () => {
    setSelectedBlockIndex(null);
  };

  return (
    <div>
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Blockchain</h1>
        <p className="mt-1 text-sm text-gray-600">
          Explore the blockchain network and all blocks in the chain
        </p>
      </div>

      {/* Network Status and Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <NetworkStatus consensusData={consensusData} />
        <div className="lg:col-span-2">
          <BlockchainVisualization 
            onOpenBlockDetails={handleOpenBlockDetails} 
            fullWidth
          />
        </div>
      </div>
      
      {/* Mining Visualizer */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Mining Process</h2>
        <div className="w-full">
          <MiningVisualizer />
        </div>
      </div>

      {/* Blockchain table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Blockchain Ledger</CardTitle>
            <Badge variant="outline" className="ml-2">
              {isLoading 
                ? <Loader2 className="h-4 w-4 animate-spin" /> 
                : `${blockchainData?.blocks.length || 0} blocks`
              }
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="overflow-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                    <th className="px-4 py-3 text-left">Height</th>
                    <th className="px-4 py-3 text-left">Timestamp</th>
                    <th className="px-4 py-3 text-left">Transactions</th>
                    <th className="px-4 py-3 text-left">Type</th>
                    <th className="px-4 py-3 text-left">Hash</th>
                    <th className="px-4 py-3 text-left">Previous Hash</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {blockchainData?.blocks.map((block: any) => {
                    const blockTypeInfo = getBlockType(block);
                    const txCount = block.data?.transactions?.length || 0;
                    
                    return (
                      <tr 
                        key={block.hash} 
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleOpenBlockDetails(block.index)}
                      >
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                          #{block.index}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(block.timestamp)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          {txCount}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <Badge className={`bg-${blockTypeInfo.color}-100 text-${blockTypeInfo.color}-800`}>
                            {blockTypeInfo.type}
                          </Badge>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-mono text-gray-500">
                          {shortenHash(block.hash)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-mono text-gray-500">
                          {block.index === 0 ? 'Genesis' : shortenHash(block.previousHash)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right text-sm">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenBlockDetails(block.index);
                            }}
                          >
                            View
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          
          <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-100 flex items-start">
            <Info className="h-5 w-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p>
                <strong>Blockchain Explanation:</strong> Each block contains multiple transactions and is 
                cryptographically linked to the previous block, creating an immutable chain. This ensures 
                that insurance records cannot be altered, providing transparency and trust for all parties.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      {selectedBlockIndex !== null && (
        <BlockDetailsModal 
          blockIndex={selectedBlockIndex}
          isOpen={selectedBlockIndex !== null}
          onClose={handleCloseBlockDetails}
        />
      )}
    </div>
  );
}
