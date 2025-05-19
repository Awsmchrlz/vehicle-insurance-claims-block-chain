import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen } from "lucide-react";

export default function AcademicReferences() {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center">
            <BookOpen className="h-5 w-5 mr-2" />
            Academic References
          </CardTitle>
          <Badge className="bg-purple-100 text-purple-700">Research Materials</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="p-3 border-l-4 border-blue-400 bg-blue-50">
            <p className="text-sm font-medium">Neene, V., Kabemba, M., & Musonda, A. (2022)</p>
            <p className="text-sm text-gray-600">Blockchain Applications in the Insurance Industry of Developing Countries: A Case Study of Zambia</p>
            <p className="text-xs text-gray-500 mt-1">Journal of African Business Technology, 15(3), 234-250</p>
          </div>
          
          <div className="p-3 border-l-4 border-blue-400 bg-blue-50">
            <p className="text-sm font-medium">Kshetri, N. (2023)</p>
            <p className="text-sm text-gray-600">Blockchain and smart contract implementation in insurance: Global trends and implications for emerging markets</p>
            <p className="text-xs text-gray-500 mt-1">Journal of Global Information Technology Management, 26(1), 58-77</p>
          </div>
          
          <div className="p-3 border-l-4 border-blue-400 bg-blue-50">
            <p className="text-sm font-medium">Road Transport and Safety Agency (RTSA) (2022)</p>
            <p className="text-sm text-gray-600">Annual Report on Road Traffic Accidents in Zambia</p>
            <p className="text-xs text-gray-500 mt-1">Government of Zambia, Lusaka</p>
          </div>
          
          <div className="p-3 border-l-4 border-blue-400 bg-blue-50">
            <p className="text-sm font-medium">Zambia Information and Communications Technology Authority (ZICTA) (2021)</p>
            <p className="text-sm text-gray-600">Digital Technologies Adoption in Financial Services Sector</p>
            <p className="text-xs text-gray-500 mt-1">ICT Survey Report, Lusaka, Zambia</p>
          </div>
          
          <div className="p-3 border-l-4 border-blue-400 bg-blue-50">
            <p className="text-sm font-medium">Moonde, L. (2023)</p>
            <p className="text-sm text-gray-600">Digital Transformation of Insurance Services in Sub-Saharan Africa: Challenges and Opportunities</p>
            <p className="text-xs text-gray-500 mt-1">African Journal of Information Systems, 15(2), 112-130</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
