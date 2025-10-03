import { useState, useContext } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
} from "@/components/ui/toast";
import { Loader2, Info, ShieldCheck, AlertTriangle, Calendar, Plus, Eye,AlertCircle,CheckCircle } from "lucide-react";
import NewPolicyForm from "@/components/dashboard/NewPolicyForm";
import { useMutation } from "@tanstack/react-query";
import { PeerContext } from "@/components/layout/AppLayout";

export default function Policies() {
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<any>(null);
  const [toastData, setToastData] = useState<{
    open: boolean;
    variant: "default" | "destructive";
    title: string;
    description: string;
  }>({ open: false, variant: "default", title: "", description: "" });
  const { selectedPeers } = useContext(PeerContext); // Access selected peers from context


  // Fetch all policies
  const { data: policiesData, isLoading, error: policiesError } = useQuery({
    queryKey: ["/api/policies"],
    queryFn: async () => {
      const response = await fetch("/api/policies");
      if (!response.ok) {
        throw new Error(`Failed to fetch policies: ${response.statusText}`);
      }
      const data = await response.json();
      console.log("Fetched policies data:", data);
      return data;
    },
    retry: 2,
    staleTime: 1000 * 60 * 5,
  });

  // Fetch vehicles
  const { data: vehiclesData, error: vehiclesError } = useQuery({
    queryKey: ["/api/vehicles"],
    queryFn: async () => {
      const response = await fetch("/api/vehicles");
      if (!response.ok) {
        throw new Error(`Failed to fetch vehicles: ${response.statusText}`);
      }
      const data = await response.json();
      console.log("Fetched vehicles data:", data);
      return data;
    },
    retry: 2,
    staleTime: 1000 * 60 * 5,
  });

  // Approve policy mutation
  const approvePolicyMutation = useMutation({
    mutationFn: async (policyId: string) => {
      const response = await fetch("/api/policies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          function: "registerPolicy",
          args: [policyId],selectedPeers
        }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        const chaincodeErrorMatch = errorText.match(/message:"([^"]+)"/);
        const errorMessage = chaincodeErrorMatch
          ? chaincodeErrorMatch[1]
          : `Failed to approve policy: ${response.statusText} - ${errorText}`;
        throw new Error(errorMessage);
      }
      return response.json();
    },
    onSuccess: () => {
      setToastData({
        open: true,
        variant: "default",
        title: "Policy Approved",
        description: "Policy has been successfully approved.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/policies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      setTimeout(() => setToastData((prev) => ({ ...prev, open: false })), 3000);
    },
    onError: (error: any) => {
      console.error("Approval error:", error.message);
      setToastData({
        open: true,
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to approve policy",
      });
    },
  });

  // Reject policy mutation
  const rejectPolicyMutation = useMutation({
    mutationFn: async (policyId: string) => {
      const response = await fetch("/api/policies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          function: "rejectPolicy",
          args: [policyId],
        }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        const chaincodeErrorMatch = errorText.match(/message:"([^"]+)"/);
        const errorMessage = chaincodeErrorMatch
          ? chaincodeErrorMatch[1]
          : `Failed to reject policy: ${response.statusText} - ${errorText}`;
        throw new Error(errorMessage);
      }
      return response.json();
    },
    onSuccess: () => {
      setToastData({
        open: true,
        variant: "default",
        title: "Policy Rejected",
        description: "Policy has been successfully rejected.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/policies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      setTimeout(() => setToastData((prev) => ({ ...prev, open: false })), 3000);
    },
    onError: (error: any) => {
      console.error("Rejection error:", error.message);
      setToastData({
        open: true,
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to reject policy",
      });
    },
  });

  // Filter policies by status
  const filterPoliciesByStatus = (status: string) => {
    if (!policiesData?.policies) return [];
    if (status === "all") return policiesData.policies;
    return policiesData.policies.filter(
      (policy: any) => policy.policyStatus.toUpperCase() === status.toUpperCase()
    );
  };

  // Find vehicle details by vehicle ID
  const getVehicleDetails = (vehicleIds: string[]) => {
    if (!vehiclesData?.vehicles || !vehicleIds) return [];
    return vehicleIds
      .map((id) => vehiclesData.vehicles.find((vehicle: any) => vehicle.vehicleId === id))
      .filter((vehicle) => vehicle);
  };

  // Handle policy added
  const handlePolicyAdded = () => {
    console.log("Refetching policies after adding...");
    setIsAddDialogOpen(false);
    queryClient.invalidateQueries({ queryKey: ["/api/policies"] });
    queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
  };

  // Handle error state
  if (policiesError || vehiclesError) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="text-red-600 text-center">
            Error: {policiesError?.message || vehiclesError?.message}
          </div>
          <div className="text-center mt-4">
            <Button onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/policies", "/api/vehicles"] })}>
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <ToastProvider>
      <div>
        {/* Page header */}
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Insurance Policies</h1>
              <p className="mt-1 text-sm text-gray-600">
                View and manage motor vehicle insurance policies stored on the blockchain
              </p>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Policy
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Policy</DialogTitle>
                </DialogHeader>
                <NewPolicyForm onSuccess={handlePolicyAdded} vehicles={vehiclesData?.vehicles || []} />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Policies section */}
        <div className="grid grid-cols-1 gap-6">
          <Tabs defaultValue="all" className="w-full">
            <div className="flex justify-between items-center mb-4">
              <TabsList>
                <TabsTrigger value="all">All Policies</TabsTrigger>
                <TabsTrigger value="ACTIVE">Active</TabsTrigger>
                <TabsTrigger value="WAITING_APPROVAL">Waiting Approval</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="all">
              <PoliciesTable
                policies={policiesData?.policies || []}
                isLoading={isLoading}
                getVehicleDetails={getVehicleDetails}
                setSelectedPolicy={setSelectedPolicy}
                setIsViewDialogOpen={setIsViewDialogOpen}
                approvePolicy={approvePolicyMutation.mutate}
                rejectPolicy={rejectPolicyMutation.mutate}
                isActionLoading={approvePolicyMutation.isLoading || rejectPolicyMutation.isLoading}
              />
            </TabsContent>

            <TabsContent value="ACTIVE">
              <PoliciesTable
                policies={filterPoliciesByStatus("ACTIVE")}
                isLoading={isLoading}
                getVehicleDetails={getVehicleDetails}
                setSelectedPolicy={setSelectedPolicy}
                setIsViewDialogOpen={setIsViewDialogOpen}
                approvePolicy={approvePolicyMutation.mutate}
                rejectPolicy={rejectPolicyMutation.mutate}
                isActionLoading={approvePolicyMutation.isLoading || rejectPolicyMutation.isLoading}
              />
            </TabsContent>

            <TabsContent value="WAITING_APPROVAL">
              <PoliciesTable
                policies={filterPoliciesByStatus("WAITING_APPROVAL")}
                isLoading={isLoading}
                getVehicleDetails={getVehicleDetails}
                setSelectedPolicy={setSelectedPolicy}
                setIsViewDialogOpen={setIsViewDialogOpen}
                approvePolicy={approvePolicyMutation.mutate}
                rejectPolicy={rejectPolicyMutation.mutate}
                isActionLoading={approvePolicyMutation.isLoading || rejectPolicyMutation.isLoading}
              />
            </TabsContent>
          </Tabs>

          {/* Policy details dialog */}
          <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Policy Details</DialogTitle>
              </DialogHeader>
              {selectedPolicy && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">Policy ID</h3>
                    <p className="text-gray-900">{selectedPolicy.policyId}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">Owner NRC</h3>
                    <p className="text-gray-900">{selectedPolicy.nrcNumber}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">Coverage Details</h3>
                    <p className="text-gray-900">{selectedPolicy.coverageDetails}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">Driver's License Number</h3>
                    <p className="text-gray-900">{selectedPolicy.driversLicenseNumber}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">Status</h3>
                    <Badge
                      className={
                        selectedPolicy.policyStatus === "ACTIVE"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }
                    >
                      {selectedPolicy.policyStatus}
                    </Badge>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">Vehicles</h3>
                    {getVehicleDetails(selectedPolicy.vehicleIds || []).length > 0 ? (
                      getVehicleDetails(selectedPolicy.vehicleIds).map((vehicle, index) => (
                        <div key={index} className="mt-2">
                          <p className="text-gray-900">
                            {vehicle.make} {vehicle.model} ({vehicle.plateNumber})
                          </p>
                          <p className="text-sm text-gray-500">Year: {vehicle.year}</p>
                          <p className="text-sm text-gray-500">Vehicle ID: {vehicle.vehicleId}</p>
                          <p className="text-sm text-gray-500">Owner NRC: {vehicle.nrcNumber}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500">No vehicles assigned</p>
                    )}
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Policy information card */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Blockchain-Based Policies</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-600">
                <p className="mb-4">
                  Insurance policies stored on the blockchain provide several benefits:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <ShieldCheck className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Immutable Records</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Policy details cannot be altered once recorded, protecting both insurers and policyholders.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <Calendar className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Automated Processes</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Smart contracts automatically handle policy creation and verification.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Fraud Prevention</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Transparent history prevents fraudulent claims and policy manipulations.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <Info className="h-5 w-5 text-purple-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Regulatory Compliance</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Easily demonstrate compliance with regulations through transparent records.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-3 bg-blue-50 rounded-md border border-blue-100">
                  <p className="text-blue-800">
                    <span className="font-medium">Academic Project Note:</span> This demonstration shows how
                    blockchain can address the 45% of Lusaka's motor vehicle owners who lack comprehensive
                    insurance due to distrust in traditional systems.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <ToastViewport />
      {toastData.open && (
        <Toast
          variant={toastData.variant}
          onOpenChange={(open) => setToastData((prev) => ({ ...prev, open }))}
        >
          <ToastTitle className="flex items-center gap-2">
            {toastData.variant === "default" ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-500" />
            )}
            {toastData.title}
          </ToastTitle>
          <ToastDescription>{toastData.description}</ToastDescription>
          <ToastClose />
        </Toast>
      )}
    </ToastProvider>
  );
}

interface PoliciesTableProps {
  policies: any[];
  isLoading: boolean;
  getVehicleDetails: (vehicleIds: string[]) => any[];
  setSelectedPolicy: (policy: any) => void;
  setIsViewDialogOpen: (open: boolean) => void;
  approvePolicy: (policyId: string) => void;
  rejectPolicy: (policyId: string) => void;
  isActionLoading: boolean;
}

function PoliciesTable({
  policies,
  isLoading,
  getVehicleDetails,
  setSelectedPolicy,
  setIsViewDialogOpen,
  approvePolicy,
  rejectPolicy,
  isActionLoading,
}: PoliciesTableProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!policies.length) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <p className="text-gray-500">No policies found in this category</p>
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Policy ID</TableHead>
              <TableHead>Vehicles</TableHead>
              <TableHead>Owner NRC</TableHead>
              <TableHead>Coverage Details</TableHead>
              <TableHead>Driver's License</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {policies.map((policy) => {
              const vehicles = getVehicleDetails(policy.vehicleIds || []);

              return (
                <TableRow key={policy.policyId} className="hover:bg-gray-50">
                  <TableCell className="font-medium text-blue-600">{policy.policyId}</TableCell>
                  <TableCell>
                    {vehicles.length > 0 ? (
                      vehicles.map((vehicle, index) => (
                        <div key={index}>
                          <div>{vehicle.make} {vehicle.model}</div>
                          <div className="text-xs text-gray-500">{vehicle.plateNumber}</div>
                        </div>
                      ))
                    ) : (
                      <span className="text-gray-500">No vehicles assigned</span>
                    )}
                  </TableCell>
                  <TableCell>{policy.nrcNumber}</TableCell>
                  <TableCell>{policy.coverageDetails}</TableCell>
                  <TableCell>{policy.driversLicenseNumber}</TableCell>
                  <TableCell>
                    <Badge
                      className={
                        policy.policyStatus === "ACTIVE"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }
                    >
                      {policy.policyStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedPolicy(policy);
                          setIsViewDialogOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      {policy.policyStatus === "WAITING_APPROVAL" && (
                        <>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => approvePolicy(policy.policyId)}
                            disabled={isActionLoading}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => rejectPolicy(policy.policyId)}
                            disabled={isActionLoading}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}