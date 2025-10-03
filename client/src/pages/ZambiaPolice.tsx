import * as React from "react";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
} from "@/components/ui/toast";
import AddEvidenceModal from "@/components/modals/AddEvidenceModal";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ToastMessage {
  id: string;
  title: string;
  message: string;
  variant: "default" | "destructive";
}

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

export default function ZambiaPolice() {
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);
  const [isAddEvidenceModalOpen, setIsAddEvidenceModalOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const queryClient = useQueryClient();

  // Add toast
  const addToast = (title: string, message: string, variant: "default" | "destructive") => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, title, message, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 5000);
  };

  // Fetch all claims
  const { data: claimsData, isLoading, error } = useQuery<{
    claims: Claim[];
  }>({
    queryKey: ["/api/claims"],
    queryFn: async () => {
      const response = await fetch("/api/claims");
      if (!response.ok) throw new Error(`Failed to fetch claims: ${response.statusText}`);
      const data = await response.json();
      console.log("ZambiaPolice API response:", data);
      const normalizedClaims = data.claims.map((claim: any) => ({
        claimId: claim.claimId || "N/A",
        policyId: claim.policyId || "N/A",
        vehicleId: claim.vehicleId || "N/A",
        damageEvidence: claim.damageEvidence || null,
        garageId: claim.garageId || "N/A",
        billId: claim.billId || "N/A",
        discrepancyReason: claim.discrepancyReason || null,
        repaired: claim.repaired ?? false,
        status: claim.claimStatus || claim.status || null,
      }));
      return { claims: normalizedClaims };
    },
    retry: 2,
    staleTime: 1000 * 60 * 5,
  });

  const handleOpenAddEvidence = (claimId: string) => {
    setSelectedClaimId(claimId);
    setIsAddEvidenceModalOpen(true);
  };

  const handleCloseAddEvidence = () => {
    setSelectedClaimId(null);
    setIsAddEvidenceModalOpen(false);
  };

  // Filter claims by status
  const filterClaimsByStatus = (status: string) => {
    if (!claimsData?.claims) return [];
    if (status === "all") return claimsData.claims;
    return claimsData.claims.filter(
      (claim) => claim.status?.toUpperCase() === status.toUpperCase()
    );
  };

  // Status badge function
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
    return (
      <Card className="shadow-lg mt-8 mx-4">
        <CardContent className="p-6">
          <div className="text-red-600 text-center text-sm">
            Error fetching claims: {(error as Error).message}
          </div>
          <div className="text-center mt-4">
            <Button
              onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/claims"] })}
              className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white"
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <ToastProvider>
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="flex items-center gap-3">

            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Zambia Police Service</h1>
              <p className="mt-1 text-sm text-gray-600">
                Submit and review evidence for motor vehicle insurance claims
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all" className="space-y-8">
          <TabsList className="bg-gray-100 p-1 rounded-md flex flex-wrap justify-start gap-3">
            {["all", "SUBMITTED", "PENDING_EVIDENCE", "PROCESSING", "APPROVED", "REJECTED"].map((tab) => (
              <TabsTrigger
                key={tab}
                value={tab}
                className="px-4 py-2 text-sm font-medium rounded-md data-[state=active]:bg-blue-600 data-[state=active]:text-white hover:bg-gray-200 transition-all"
              >
                {tab === "all" ? "All Claims" : tab.replace("_", " ")}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Claims Table */}
          {["all", "SUBMITTED", "PENDING_EVIDENCE", "PROCESSING", "APPROVED", "REJECTED"].map((status) => (
            <TabsContent key={status} value={status}>
              <Card className="shadow-lg mt-6">
                <CardHeader className="bg-gray-50">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg font-medium text-gray-900">
                      {status === "all" ? "All Claims" : `${status.replace("_", " ")} Claims`}
                    </CardTitle>
                    <Badge variant="outline" className="ml-2 text-xs border-gray-300">
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : `${filterClaimsByStatus(status).length} claims`}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    </div>
                  ) : filterClaimsByStatus(status).length === 0 ? (
                    <div className="text-center py-12">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No claims found</h3>
                      <p className="text-sm text-gray-500">No claims found in this category.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table className="w-full">
                        <TableHeader>
                          <TableRow className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                            <TableHead className="px-4 py-3 text-left min-w-[120px]">Claim ID</TableHead>
                            <TableHead className="px-4 py-3 text-left min-w-[120px]">Policy ID</TableHead>
                            <TableHead className="px-4 py-3 text-left min-w-[120px]">Vehicle ID</TableHead>
                            <TableHead className="px-4 py-3 text-left min-w-[120px]">Evidence</TableHead>
                            <TableHead className="px-4 py-3 text-left min-w-[120px]">Garage ID</TableHead>
                            <TableHead className="px-4 py-3 text-left min-w-[120px]">Bill ID</TableHead>
                            <TableHead className="px-4 py-3 text-left min-w-[100px]">Repaired</TableHead>
                            <TableHead className="px-4 py-3 text-left min-w-[120px]">Status</TableHead>
                            <TableHead className="px-4 py-3 text-right min-w-[150px]">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-gray-200">
                          {filterClaimsByStatus(status).map((claim) => (
                            <TableRow key={claim.claimId} className="hover:bg-gray-50">
                              <TableCell className="px-4 py-4 text-sm font-medium text-gray-900 truncate max-w-[150px]">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger className="truncate">{claim.claimId}</TooltipTrigger>
                                    <TooltipContent className="text-xs">{claim.claimId}</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </TableCell>
                              <TableCell className="px-4 py-4 text-sm text-gray-500 truncate max-w-[150px]">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger className="truncate">{claim.policyId}</TooltipTrigger>
                                    <TooltipContent className="text-xs">{claim.policyId}</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </TableCell>
                              <TableCell className="px-4 py-4 text-sm text-gray-500 truncate max-w-[150px]">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger className="truncate">{claim.vehicleId}</TooltipTrigger>
                                    <TooltipContent className="text-xs">{claim.vehicleId}</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </TableCell>
                              <TableCell className="px-4 py-4 text-sm text-gray-500 truncate max-w-[150px]">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger className="truncate">
                                      {claim.damageEvidence || "N/A"}
                                    </TooltipTrigger>
                                    <TooltipContent className="text-xs max-w-[300px] break-words">
                                      {claim.damageEvidence || "No evidence provided"}
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </TableCell>
                              <TableCell className="px-4 py-4 text-sm text-gray-500 truncate max-w-[150px]">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger className="truncate">{claim.garageId}</TooltipTrigger>
                                    <TooltipContent className="text-xs">{claim.garageId}</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </TableCell>
                              <TableCell className="px-4 py-4 text-sm text-gray-500 truncate max-w-[150px]">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger className="truncate">{claim.billId}</TooltipTrigger>
                                    <TooltipContent className="text-xs">{claim.billId}</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </TableCell>
                              <TableCell className="px-4 py-4 text-sm text-gray-500">
                                {claim.repaired ? "Yes" : "No"}
                              </TableCell>
                              <TableCell className="px-4 py-4">
                                {getStatusBadge(claim.status)}
                              </TableCell>
                              <TableCell className="px-4 py-4 text-right text-sm">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 text-xs border-gray-300 hover:bg-gray-50 px-2"
                                        onClick={() => handleOpenAddEvidence(claim.claimId)}
                                      >
                                        <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                        </svg>
                                        Add Evidence
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent className="text-xs">Add evidence to claim</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>

        {selectedClaimId && (
          <AddEvidenceModal
            claimId={selectedClaimId}
            isOpen={isAddEvidenceModalOpen}
            onClose={handleCloseAddEvidence}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ["/api/claims"] });
              addToast("Success", "Evidence added successfully!", "default");
            }}
            onError={(message) => addToast("Error", message, "destructive")}
          />
        )}

        {/* Toasts */}
        <ToastViewport className="fixed top-4 right-4 w-80 max-w-[90vw]" />
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            variant={toast.variant}
            className={cn(
              "rounded-md p-4",
              toast.variant === "default" ? "bg-blue-600 text-white" : "bg-red-600 text-white"
            )}
          >
            <ToastTitle className="text-sm font-semibold">{toast.title}</ToastTitle>
            <ToastDescription className="text-xs">{toast.message}</ToastDescription>
            <ToastClose />
          </Toast>
        ))}
      </div>
    </ToastProvider>
  );
}