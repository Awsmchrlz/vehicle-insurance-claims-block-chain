import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import StatisticsPanel from "@/components/dashboard/StatisticsPanel";
import NetworkStatus from "@/components/dashboard/NetworkStatus";
import BlockchainVisualization from "@/components/dashboard/BlockchainVisualization";
import RecentClaims from "@/components/dashboard/RecentClaims";
import NewClaimForm from "@/components/dashboard/NewClaimForm";
import BlockchainExplainer from "@/components/dashboard/BlockchainExplainer";
import AcademicReferences from "@/components/dashboard/AcademicReferences";
import BlockDetailsModal from "@/components/modals/BlockDetailsModal";
import ClaimDetailsModal from "@/components/modals/ClaimDetailsModal";

export default function Dashboard() {
  const [selectedBlockIndex, setSelectedBlockIndex] = useState<number | null>(null);
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);

  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/stats'],
  });
  
  // Fetch consensus data
  const { data: consensus } = useQuery({
    queryKey: ['/api/consensus'],
  });

  // Handlers for block and claim details
  const handleOpenBlockDetails = (index: number) => {
    setSelectedBlockIndex(index);
  };

  const handleCloseBlockDetails = () => {
    setSelectedBlockIndex(null);
  };

  const handleOpenClaimDetails = (claimId: string) => {
    setSelectedClaimId(claimId);
  };

  const handleCloseClaimDetails = () => {
    setSelectedClaimId(null);
  };

  return (
    <div>
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Vehicle Insurance Blockchain POC</h1>
        <p className="mt-1 text-sm text-gray-600">
          Proof of Concept for Motor Vehicle Insurance using Blockchain Technology
        </p>
      </div>

      {/* Dashboard statistics */}
      <StatisticsPanel isLoading={statsLoading} stats={stats} />

      {/* Network Status and Blockchain Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <NetworkStatus consensusData={consensus} />
        <BlockchainVisualization onOpenBlockDetails={handleOpenBlockDetails} />
      </div>

      {/* Recent Claims and New Claim Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <RecentClaims onOpenClaimDetails={handleOpenClaimDetails} />
        <NewClaimForm />
      </div>

      {/* Blockchain Explainer */}
      <BlockchainExplainer />

      {/* Academic References */}
      <AcademicReferences />

      {/* Modals */}
      {selectedBlockIndex !== null && (
        <BlockDetailsModal 
          blockIndex={selectedBlockIndex}
          isOpen={selectedBlockIndex !== null}
          onClose={handleCloseBlockDetails}
        />
      )}

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
