import { useEffect, useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getBlockType, formatDate, shortenHash } from "@/lib/utils";
import { FileText, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface BlockchainVisualizationProps {
  onOpenBlockDetails: (index: number) => void;
  fullWidth?: boolean;
}

export default function BlockchainVisualization({ 
  onOpenBlockDetails, 
  fullWidth = false 
}: BlockchainVisualizationProps) {
  const blockchainRef = useRef<HTMLDivElement>(null);
  const [connections, setConnections] = useState<Array<{ left: number, width: number }>>([]);

  // Fetch blockchain data
  const { data: blockchainData, isLoading } = useQuery({
    queryKey: ['/api/blockchain'],
  });

  // Limit the number of blocks shown in the visualization
  const visibleBlocks = blockchainData?.blocks.slice(0, 5) || [];

  // Calculate connections between blocks
  useEffect(() => {
    if (!blockchainRef.current || isLoading || !visibleBlocks.length) {
      return;
    }

    const calculateConnections = () => {
      const blockElements = blockchainRef.current?.querySelectorAll('.block');
      const newConnections: Array<{ left: number, width: number }> = [];
      
      if (blockElements && blockElements.length > 1) {
        const containerRect = blockchainRef.current?.getBoundingClientRect();
        
        for (let i = 0; i < blockElements.length - 1; i++) {
          const block1Rect = blockElements[i].getBoundingClientRect();
          const block2Rect = blockElements[i + 1].getBoundingClientRect();
          
          newConnections.push({
            left: block1Rect.right - containerRect.left,
            width: block2Rect.left - block1Rect.right
          });
        }
        
        setConnections(newConnections);
      }
    };

    // Initial calculation
    setTimeout(calculateConnections, 100);

    // Recalculate on window resize
    window.addEventListener('resize', calculateConnections);
    return () => {
      window.removeEventListener('resize', calculateConnections);
    };
  }, [isLoading, visibleBlocks.length]);

  return (
    <Card className={fullWidth ? "" : "lg:col-span-2"}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Blockchain Visualization</CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 px-2 text-blue-600"
            asChild
          >
            <a href="/blockchain">View All</a>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div ref={blockchainRef} className="blockchain relative">
          {isLoading ? (
            // Skeleton loading state
            <div className="flex space-x-4 overflow-x-auto py-4 px-2">
              {Array(5).fill(0).map((_, i) => (
                <div key={i} className="min-w-[180px] p-3 rounded-lg border border-gray-200">
                  <Skeleton className="h-4 w-20 mb-1" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-3 w-24 mt-2" />
                  <Skeleton className="h-3 w-16 mt-2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex space-x-4 overflow-x-auto py-4 px-2">
              {visibleBlocks.map((block: any, index: number) => {
                const blockTypeInfo = getBlockType(block);
                
                return (
                  <div 
                    key={block.hash}
                    onClick={() => onOpenBlockDetails(block.index)}
                    className={`block bg-${blockTypeInfo.color}-50 border border-${blockTypeInfo.color}-100 rounded-lg p-3 min-w-[180px] z-10 shadow-sm cursor-pointer`}
                  >
                    <div className={`text-xs font-semibold text-${blockTypeInfo.color}-500 mb-1`}>
                      {blockTypeInfo.type} Block
                    </div>
                    <div className="text-sm font-mono truncate text-gray-700">
                      #{block.index.toString().padStart(4, '0')}
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      Timestamp: {formatDate(block.timestamp)}
                    </div>
                    <div className="mt-2 text-xs flex items-center text-gray-600">
                      <FileText className="h-3 w-3 mr-1" /> 
                      {block.data.transactions?.length || 0} transaction
                      {(block.data.transactions?.length || 0) !== 1 ? "s" : ""}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          {/* Connection lines between blocks */}
          {connections.map((conn, index) => (
            <div 
              key={index} 
              className="connection" 
              style={{
                left: `${conn.left}px`,
                width: `${conn.width}px`
              }}
            ></div>
          ))}
        </div>
        
        <div className="mt-4 text-sm text-gray-500">
          <p className="flex items-center">
            <FileText className="h-4 w-4 mr-2" /> 
            Total of {blockchainData?.blocks.length || 0} blocks on the chain. Each block contains immutable transaction records.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
