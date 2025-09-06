import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface Claim {
  claimId: string;
  policyId: string;
  vehicleId: string;
  damageEvidence: string | null;
  garageId: string;
  billId: string;
  discrepancyReason: string | null;
  repaired: boolean;
  status: string | null;
}

interface ClaimDetailsModalProps {
  claimId: string;
  isOpen: boolean;
  onClose: () => void;
  onError: (message: string) => void;
}

export default function ClaimDetailsModal({ claimId, isOpen, onClose, onError }: ClaimDetailsModalProps) {
  const { data: claimData, isLoading, error } = useQuery<Claim>({
    queryKey: ["/api/claims", claimId],
    queryFn: async () => {
      const response = await fetch(`/api/claims/${claimId}`);
      if (!response.ok) throw new Error(`Failed to fetch claim details: ${response.statusText}`);
      const data = await response.json();
      console.log("ClaimDetailsModal API response:", data); // Debug log
      return {
        claimId: data.claim.claimId || "N/A",
        policyId: data.claim.policyId || "N/A",
        vehicleId: data.claim.vehicleId || "N/A",
        damageEvidence: data.claim.damageEvidence || null,
        garageId: data.claim.garageId || "N/A",
        billId: data.claim.billId || "N/A",
        discrepancyReason: data.claim.discrepancyReason || null,
        repaired: data.claim.repaired ?? false,
        status: data.claim.claimStatus || data.status || null,
      };
    },
    enabled: !!claimId,
    retry: 2,
    staleTime: 1000 * 60 * 5,
  });

  const getStatusBadge = (status: string | null) => {
    const s = status?.toUpperCase() || "UNKNOWN";
    const styles = {
      APPROVED: "bg-green-100 text-green-800",
      PROCESSING: "bg-blue-100 text-blue-800",
      PENDING_EVIDENCE: "bg-yellow-100 text-yellow-800",
      REJECTED: "bg-red-100 text-red-800",
      SUBMITTED: "bg-gray-100 text-gray-800",
      UNKNOWN: "bg-gray-100 text-gray-800",
    };
    return (
      <Badge className={cn("text-xs font-medium px-2 py-1 capitalize", styles[s as keyof typeof styles] || styles.UNKNOWN)}>
        {s.replace("_", " ").toLowerCase()}
      </Badge>
    );
  };

  if (error) {
    onError(`Failed to load claim details: ${(error as Error).message}`);
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg sm:max-w-xl p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-medium text-gray-900">
            Claim Details: {claimId}
          </DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : !claimData ? (
          <div className="text-center py-6 text-sm text-gray-600">
            No claim data available
          </div>
        ) : (
          <div className="grid gap-4 py-4 text-sm text-gray-600">
            <div className="grid grid-cols-3 items-center gap-4">
              <span className="font-medium text-gray-900">Claim ID:</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger className="col-span-2 truncate">{claimData.claimId}</TooltipTrigger>
                  <TooltipContent className="text-xs">{claimData.claimId}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <span className="font-medium text-gray-900">Policy ID:</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger className="col-span-2 truncate">{claimData.policyId}</TooltipTrigger>
                  <TooltipContent className="text-xs">{claimData.policyId}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <span className="font-medium text-gray-900">Vehicle ID:</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger className="col-span-2 truncate">{claimData.vehicleId}</TooltipTrigger>
                  <TooltipContent className="text-xs">{claimData.vehicleId}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <span className="font-medium text-gray-900">Damage Evidence:</span>
              <span className="col-span-2">{claimData.damageEvidence || "N/A"}</span>
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <span className="font-medium text-gray-900">Garage ID:</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger className="col-span-2 truncate">{claimData.garageId}</TooltipTrigger>
                  <TooltipContent className="text-xs">{claimData.garageId}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <span className="font-medium text-gray-900">Bill ID:</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger className="col-span-2 truncate">{claimData.billId}</TooltipTrigger>
                  <TooltipContent className="text-xs">{claimData.billId}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <span className="font-medium text-gray-900">Discrepancy Reason:</span>
              <span className="col-span-2">{claimData.discrepancyReason || "N/A"}</span>
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <span className="font-medium text-gray-900">Repaired:</span>
              <span className="col-span-2">{claimData.repaired ? "Yes" : "No"}</span>
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <span className="font-medium text-gray-900">Status:</span>
              <span className="col-span-2">{getStatusBadge(claimData.status)}</span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}