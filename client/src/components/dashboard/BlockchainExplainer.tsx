import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ShieldCheck,
  Users,
  Zap, 
  Check
} from "lucide-react";

export default function BlockchainExplainer() {
  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>How This Works: Blockchain for Motor Vehicle Insurance</CardTitle>
          <Badge className="bg-blue-100 text-blue-700">Academic POC</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="text-blue-600 mb-3">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="text-md font-semibold mb-2">Immutable Records</h3>
            <p className="text-sm text-gray-600">
              All policies, claims, and settlements are recorded on a blockchain, making them tamper-proof and providing a permanent audit trail. This reduces fraud and increases transparency.
            </p>
            <div className="mt-3 text-xs text-gray-500">
              Reference: Neene et al., 2022
            </div>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="text-blue-600 mb-3">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="text-md font-semibold mb-2">Distributed Network</h3>
            <p className="text-sm text-gray-600">
              Multiple nodes (insurance companies, RTSA, auditors) maintain a copy of the blockchain, ensuring no single entity controls the data and enabling real-time verification of information.
            </p>
            <div className="mt-3 text-xs text-gray-500">
              Reference: ZICTA, 2021
            </div>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="text-blue-600 mb-3">
              <Zap className="h-6 w-6" />
            </div>
            <h3 className="text-md font-semibold mb-2">Smart Contracts</h3>
            <p className="text-sm text-gray-600">
              Automated claim processing and settlements through predefined rules encoded on the blockchain, reducing processing time and human error while ensuring consistent policy enforcement.
            </p>
            <div className="mt-3 text-xs text-gray-500">
              Reference: Kshetri, 2023
            </div>
          </div>
        </div>
        
        <div className="mt-6">
          <h3 className="text-md font-semibold mb-3">Key Benefits for Zambian Motor Insurance</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 text-green-500 mt-0.5">
                <Check className="h-4 w-4" />
              </div>
              <p className="ml-2 text-sm text-gray-600">Reduced fraud through immutable accident and claim records</p>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 text-green-500 mt-0.5">
                <Check className="h-4 w-4" />
              </div>
              <p className="ml-2 text-sm text-gray-600">Faster claim processing with automatic verification</p>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 text-green-500 mt-0.5">
                <Check className="h-4 w-4" />
              </div>
              <p className="ml-2 text-sm text-gray-600">Transparent history of vehicle accidents and repairs</p>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 text-green-500 mt-0.5">
                <Check className="h-4 w-4" />
              </div>
              <p className="ml-2 text-sm text-gray-600">Increased trust between insurers and policyholders</p>
            </div>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600">
            According to RTSA (2022), Lusaka recorded over 11,000 road traffic accidents in 2022. This POC demonstrates how blockchain technology can improve the insurance claim process, reducing settlement times and increasing transparency for the 45% of vehicle owners in Lusaka who currently lack comprehensive insurance due to distrust in claims handling.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
