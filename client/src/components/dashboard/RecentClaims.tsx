import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate, getStatusColor } from "@/lib/utils";
import { FileText, Info, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface RecentClaimsProps {
  onOpenClaimDetails: (claimId: string) => void;
}

export default function RecentClaims({ onOpenClaimDetails }: RecentClaimsProps) {
  // Fetch recent claims (limited to 4)
  const { data: claimsData, isLoading } = useQuery({
    queryKey: ['/api/claims/recent/4'],
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Recent Claims</CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 px-2 text-blue-600"
            asChild
          >
            <a href="/claims">View All</a>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="overflow-hidden">
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
                // Skeleton loading state
                Array(4).fill(0).map((_, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Skeleton className="h-5 w-24" />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Skeleton className="h-5 w-32" />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Skeleton className="h-5 w-24" />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Skeleton className="h-5 w-20 rounded-full" />
                    </td>
                  </tr>
                ))
              ) : (
                // Actual claim data
                claimsData?.claims.map((claim: any) => (
                  <tr 
                    key={claim.claimId} 
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => onOpenClaimDetails(claim.claimId)}
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-blue-600">
                      {claim.claimId}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                      {claim.vehicleId}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(claim.incidentDate)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge className={getStatusColor(claim.status)}>
                        {claim.status.replace("_", " ")}
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
            <Info className="h-4 w-4 mr-2" />
            All claims are permanently recorded on the blockchain.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
