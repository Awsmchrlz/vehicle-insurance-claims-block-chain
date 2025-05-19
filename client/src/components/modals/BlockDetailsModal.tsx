import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { Loader2, X } from "lucide-react";

interface BlockDetailsModalProps {
  blockIndex: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function BlockDetailsModal({
  blockIndex,
  isOpen,
  onClose,
}: BlockDetailsModalProps) {
  // Fetch block data
  const { data: blockData, isLoading } = useQuery({
    queryKey: [`/api/blocks/${blockIndex}`],
    enabled: isOpen, // Only fetch when modal is open
  });

  // Format transactions for display
  const formatTransactionData = (data: any) => {
    if (!data) return "";
    try {
      return JSON.stringify(data, null, 2);
    } catch (error) {
      return JSON.stringify(data);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            <span>
              Block Details: 
              {isLoading ? (
                <Loader2 className="ml-2 h-4 w-4 inline animate-spin" />
              ) : (
                <span className="text-blue-600 ml-2">
                  #{blockData?.block.index}
                </span>
              )}
            </span>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose}
              className="h-6 w-6 rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-sm font-medium text-gray-500">Block Hash</div>
                <div className="font-mono text-xs mt-1 break-all">
                  {blockData?.block.hash}
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-sm font-medium text-gray-500">Previous Hash</div>
                <div className="font-mono text-xs mt-1 break-all">
                  {blockData?.block.index === 0 
                    ? "Genesis Block (no previous hash)" 
                    : blockData?.block.previousHash
                  }
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-sm font-medium text-gray-500">Timestamp</div>
                <div className="text-sm mt-1">
                  {formatDate(blockData?.block.timestamp)} 
                  {new Date(blockData?.block.timestamp).toLocaleTimeString()}
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-sm font-medium text-gray-500">Nonce</div>
                <div className="text-sm mt-1">{blockData?.block.nonce}</div>
              </div>
              {blockData?.block.merkleRoot && (
                <div className="bg-gray-50 rounded-lg p-3 md:col-span-2">
                  <div className="text-sm font-medium text-gray-500">Merkle Root</div>
                  <div className="font-mono text-xs mt-1">{blockData?.block.merkleRoot}</div>
                </div>
              )}
            </div>
            
            <div className="mb-4">
              <div className="text-sm font-medium text-gray-500 mb-2">Transaction Data</div>
              <div className="bg-gray-50 p-3 rounded-lg overflow-x-auto">
                <pre className="font-mono text-xs whitespace-pre-wrap">
                  {formatTransactionData(blockData?.block.data)}
                </pre>
              </div>
            </div>
          </>
        )}

        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
