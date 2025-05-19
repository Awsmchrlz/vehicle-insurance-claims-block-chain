import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import ClaimDetailsModal from "@/components/modals/ClaimDetailsModal";
import NewClaimForm from "@/components/dashboard/NewClaimForm";
import { formatDate, getStatusColor } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export default function Claims() {
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);

  // Fetch all claims
  const { data: claimsData, isLoading } = useQuery({
    queryKey: ['/api/claims'],
  });

  const handleOpenClaimDetails = (claimId: string) => {
    setSelectedClaimId(claimId);
  };

  const handleCloseClaimDetails = () => {
    setSelectedClaimId(null);
  };

  // Filter claims by status
  const filterClaimsByStatus = (status: string) => {
    if (!claimsData?.claims) return [];
    if (status === "all") return claimsData.claims;
    return claimsData.claims.filter(
      (claim) => claim.status.toLowerCase() === status.toLowerCase()
    );
  };

  return (
    <div>
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Insurance Claims</h1>
        <p className="mt-1 text-sm text-gray-600">
          View and manage all motor vehicle insurance claims on the blockchain
        </p>
      </div>

      {/* Claims section */}
      <div className="grid grid-cols-1 gap-6">
        <Tabs defaultValue="all" className="w-full">
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="all">All Claims</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="processing">Processing</TabsTrigger>
              <TabsTrigger value="pending_evidence">Pending Evidence</TabsTrigger>
            </TabsList>
            <Button>Submit New Claim</Button>
          </div>

          <TabsContent value="all">
            <ClaimsTable 
              claims={claimsData?.claims || []} 
              isLoading={isLoading} 
              onOpenDetails={handleOpenClaimDetails}
            />
          </TabsContent>
          
          <TabsContent value="approved">
            <ClaimsTable 
              claims={filterClaimsByStatus("approved")} 
              isLoading={isLoading} 
              onOpenDetails={handleOpenClaimDetails}
            />
          </TabsContent>
          
          <TabsContent value="processing">
            <ClaimsTable 
              claims={filterClaimsByStatus("processing")} 
              isLoading={isLoading} 
              onOpenDetails={handleOpenClaimDetails}
            />
          </TabsContent>
          
          <TabsContent value="pending_evidence">
            <ClaimsTable 
              claims={filterClaimsByStatus("pending_evidence")} 
              isLoading={isLoading} 
              onOpenDetails={handleOpenClaimDetails}
            />
          </TabsContent>
        </Tabs>

        {/* Claim information card */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Blockchain Claims Process</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600">
              <p className="mb-4">
                All claims submitted through this system are permanently recorded on the blockchain, 
                ensuring transparency and immutability. Each claim goes through the following stages:
              </p>
              <ol className="list-decimal pl-5 space-y-2">
                <li>Claim submission and initial validation</li>
                <li>Evidence uploading and verification by authorized nodes</li>
                <li>Automatic processing through smart contracts</li>
                <li>Approval or rejection based on policy terms and evidence</li>
                <li>Settlement and payment processing</li>
              </ol>
              <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-100">
                <p className="text-blue-800">
                  <span className="font-medium">Academic Project Note:</span> This system demonstrates 
                  how blockchain technology can reduce fraud and streamline claim processing in the 
                  Zambian motor vehicle insurance industry.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      {selectedClaimId && (
        <ClaimDetailsModal
          claimId={selectedClaimId}
          isOpen={!!selectedClaimId}
          onClose={handleCloseClaimDetails}
        />
      )}
    </div>
  );
}

interface ClaimsTableProps {
  claims: any[];
  isLoading: boolean;
  onOpenDetails: (claimId: string) => void;
}

function ClaimsTable({ claims, isLoading, onOpenDetails }: ClaimsTableProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!claims.length) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <p className="text-gray-500">No claims found in this category</p>
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Claim ID</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Incident Date</TableHead>
              <TableHead>Incident Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Blockchain</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {claims.map((claim) => (
              <TableRow 
                key={claim.claimId}
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => onOpenDetails(claim.claimId)}
              >
                <TableCell className="font-medium text-blue-600">{claim.claimId}</TableCell>
                <TableCell>{claim.vehicleId}</TableCell>
                <TableCell>{formatDate(claim.incidentDate)}</TableCell>
                <TableCell className="capitalize">{claim.incidentType}</TableCell>
                <TableCell>ZMW {claim.damageEstimate.toLocaleString()}</TableCell>
                <TableCell>
                  <Badge className={getStatusColor(claim.status)}>
                    {claim.status.replace("_", " ")}
                  </Badge>
                </TableCell>
                <TableCell>
                  {claim.blockIndex ? (
                    <Badge variant="outline">Block #{claim.blockIndex}</Badge>
                  ) : (
                    <Badge variant="outline" className="bg-yellow-100">Pending</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenDetails(claim.claimId);
                    }}
                  >
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
