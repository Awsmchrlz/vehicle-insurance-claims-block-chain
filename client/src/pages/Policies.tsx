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
import { formatDate, formatCurrency } from "@/lib/utils";
import { 
  Loader2, 
  Info, 
  ShieldCheck, 
  AlertTriangle,
  Calendar 
} from "lucide-react";

export default function Policies() {
  // Fetch all policies
  const { data: policiesData, isLoading } = useQuery({
    queryKey: ['/api/policies'],
  });

  // Fetch vehicles
  const { data: vehiclesData } = useQuery({
    queryKey: ['/api/vehicles'],
  });

  // Filter policies by status
  const filterPoliciesByStatus = (status: string) => {
    if (!policiesData?.policies) return [];
    if (status === "all") return policiesData.policies;
    return policiesData.policies.filter(
      (policy: any) => policy.status.toLowerCase() === status.toLowerCase()
    );
  };

  // Find vehicle details by vehicle ID
  const getVehicleDetails = (vehicleId: string) => {
    if (!vehiclesData?.vehicles) return null;
    return vehiclesData.vehicles.find(
      (vehicle: any) => vehicle.vehicleId === vehicleId
    );
  };

  return (
    <div>
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Insurance Policies</h1>
        <p className="mt-1 text-sm text-gray-600">
          View all motor vehicle insurance policies stored on the blockchain
        </p>
      </div>

      {/* Policies section */}
      <div className="grid grid-cols-1 gap-6">
        <Tabs defaultValue="all" className="w-full">
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="all">All Policies</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="expired">Expired</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="all">
            <PoliciesTable 
              policies={policiesData?.policies || []} 
              isLoading={isLoading} 
              getVehicleDetails={getVehicleDetails}
            />
          </TabsContent>
          
          <TabsContent value="active">
            <PoliciesTable 
              policies={filterPoliciesByStatus("active")} 
              isLoading={isLoading} 
              getVehicleDetails={getVehicleDetails}
            />
          </TabsContent>
          
          <TabsContent value="expired">
            <PoliciesTable 
              policies={filterPoliciesByStatus("expired")} 
              isLoading={isLoading} 
              getVehicleDetails={getVehicleDetails}
            />
          </TabsContent>
        </Tabs>

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
                  <div className="mt-0.5">
                    <ShieldCheck className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="font-medium">Immutable Records</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Policy details cannot be altered once recorded, protecting both insurers and policyholders.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="mt-0.5">
                    <Calendar className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="font-medium">Automated Processes</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Smart contracts automatically handle policy renewals and claim verification.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="mt-0.5">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="font-medium">Fraud Prevention</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Transparent history prevents fraudulent claims and policy manipulations.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="mt-0.5">
                    <Info className="h-5 w-5 text-purple-500" />
                  </div>
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
  );
}

interface PoliciesTableProps {
  policies: any[];
  isLoading: boolean;
  getVehicleDetails: (vehicleId: string) => any;
}

function PoliciesTable({ policies, isLoading, getVehicleDetails }: PoliciesTableProps) {
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
              <TableHead>Vehicle</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Coverage</TableHead>
              <TableHead>Premium</TableHead>
              <TableHead>Valid From</TableHead>
              <TableHead>Valid Until</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {policies.map((policy) => {
              const vehicle = getVehicleDetails(policy.vehicleId);
              
              return (
                <TableRow 
                  key={policy.policyId}
                  className="hover:bg-gray-50"
                >
                  <TableCell className="font-medium text-blue-600">{policy.policyId}</TableCell>
                  <TableCell>
                    {vehicle ? (
                      <div>
                        <div>{vehicle.make} {vehicle.model}</div>
                        <div className="text-xs text-gray-500">{vehicle.licensePlate}</div>
                      </div>
                    ) : (
                      policy.vehicleId
                    )}
                  </TableCell>
                  <TableCell>{vehicle?.owner || "Unknown"}</TableCell>
                  <TableCell className="capitalize">{policy.coverageType}</TableCell>
                  <TableCell>{formatCurrency(policy.premium)}</TableCell>
                  <TableCell>{formatDate(policy.startDate)}</TableCell>
                  <TableCell>{formatDate(policy.endDate)}</TableCell>
                  <TableCell>
                    <Badge className={
                      policy.status === "active" 
                        ? "bg-green-100 text-green-800" 
                        : "bg-gray-100 text-gray-800"
                    }>
                      {policy.status}
                    </Badge>
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
