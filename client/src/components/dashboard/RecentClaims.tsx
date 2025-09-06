import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ToastProvider, ToastViewport, Toast, ToastTitle, ToastDescription, ToastClose } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Info, Loader2 } from "lucide-react";
import { formatDate, getStatusColor, cn } from "@/lib/utils";

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
  incidentDate: string;
}

interface ToastMessage {
  id: string;
  title: string;
  message: string;
  variant: "default" | "destructive";
}

interface RecentClaimsProps {
  onOpenClaimDetails: (claimId: string) => void;
}

export default function RecentClaims({ onOpenClaimDetails }: RecentClaimsProps) {
  const queryClient = useQueryClient();
  const [toasts, setToasts] = React.useState<ToastMessage[]>([]);

  // Add toast
  const addToast = (title: string, message: string, variant: "default" | "destructive") => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, title, message, variant }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000);
  };

  // Fetch recent claims (limited to 4)
  const { data: claimsData, isLoading, error } = useQuery<{
    claims: Claim[];
  }>({
    queryKey: ["/api/claims"],
    queryFn: async () => {
      const response = await fetch("/api/claims");
      if (!response.ok) {
        const errorMessage = `Failed to fetch recent claims: ${response.statusText}`;
        addToast("Error", errorMessage, "destructive");
        throw new Error(errorMessage);
      }
      const data = await response.json();
      // Normalize claimStatus to status
      const normalizedClaims = data.claims.map((claim: any) => ({
        claimId: claim.claimId,
        policyId: claim.policyId,
        vehicleId: claim.vehicleId,
        damageEvidence: claim.damageEvidence || null,
        garageId: claim.garageId,
        billId: claim.billId,
        discrepancyReason: claim.discrepancyReason || null,
        repaired: claim.repaired || false,
        status: claim.claimStatus || claim.status || null,
        incidentDate: claim.incidentDate || new Date().toISOString(),
      }));
      return { claims: normalizedClaims };
    },
    retry: 2,
    staleTime: 1000 * 60 * 5,
  });

  if (error) {
    return (
      <Card className="shadow-lg border-none bg-white rounded-lg">
        <CardContent className="p-4">
          <div className="text-red-600 text-center text-sm">
            Error fetching recent claims: {(error as Error).message}
          </div>
          <div className="text-center mt-4">
            <Button
              onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/claims"] })}
              className="h-8 text-xs bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-md shadow-sm transition-all duration-200"
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
      <Card className="shadow-lg border-none bg-white rounded-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-t-lg pb-3">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-medium text-gray-900">Recent Claims</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-md shadow-sm transition-all duration-200"
              asChild
            >
              <a href="/claims">View All</a>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Claim ID
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vehicle
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  Array(4).fill(0).map((_, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Skeleton className="h-5 w-24 rounded-md" />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Skeleton className="h-5 w-32 rounded-md" />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Skeleton className="h-5 w-24 rounded-md" />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Skeleton className="h-5 w-20 rounded-full" />
                      </td>
                    </tr>
                  ))
                ) : claimsData?.claims.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-12 text-center text-sm text-gray-500">
                      No recent claims found.
                    </td>
                  </tr>
                ) : (
                  claimsData?.claims.map((claim: Claim) => (
                    <tr
                      key={claim.claimId}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => onOpenClaimDetails(claim.claimId)}
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-blue-600 truncate max-w-[150px]">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger className="truncate">{claim.claimId}</TooltipTrigger>
                            <TooltipContent className="text-xs">{claim.claimId}</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 truncate max-w-[150px]">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger className="truncate">{claim.vehicleId}</TooltipTrigger>
                            <TooltipContent className="text-xs">{claim.vehicleId}</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(claim.incidentDate)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge className={cn("text-xs font-medium px-2 py-1 capitalize", getStatusColor(claim.status))}>
                          {claim.status?.replace("_", " ").toLowerCase()}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-4 text-sm text-gray-500 p-3 border-t border-gray-100">
            <p className="flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              All claims are permanently recorded on the blockchain.
            </p>
          </div>
        </CardContent>
      </Card>
      <ToastViewport className="fixed top-4 right-4 w-80 max-w-[90vw]">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            className={cn(
              "p-4 rounded-md shadow-lg",
              toast.variant === "destructive" ? "bg-gradient-to-r from-red-600 to-red-700 text-white" : "bg-gradient-to-r from-blue-600 to-blue-700 text-white"
            )}
          >
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <ToastTitle className="flex items-center gap-2 text-xs font-semibold">
                  {toast.variant === "default" ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  {toast.title}
                </ToastTitle>
                <ToastDescription className="text-xs">{toast.message}</ToastDescription>
              </div>
              <ToastClose
                className="text-xs"
                onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              >
                ✕
              </ToastClose>
            </div>
          </Toast>
        ))}
      </ToastViewport>
    </ToastProvider>
  );
}