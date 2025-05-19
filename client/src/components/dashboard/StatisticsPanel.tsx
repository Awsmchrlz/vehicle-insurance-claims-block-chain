import { Card, CardContent } from "@/components/ui/card";
import { 
  ShieldCheck, 
  FileText, 
  Layers, 
  Users,
  TrendingUp,
  CheckCircle
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface StatisticsPanelProps {
  isLoading: boolean;
  stats?: {
    totalPolicies: number;
    activeClaims: number;
    blocksInChain: number;
    activeNodes: number;
  };
}

export default function StatisticsPanel({ isLoading, stats }: StatisticsPanelProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Total Policies */}
      <Card>
        <CardContent className="p-5">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Policies</p>
              {isLoading ? (
                <Skeleton className="h-8 w-16 mt-1" />
              ) : (
                <p className="text-2xl font-semibold mt-1">{stats?.totalPolicies || 0}</p>
              )}
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
              <ShieldCheck className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-2 flex items-center text-sm">
            <span className="text-green-500 flex items-center">
              <TrendingUp className="h-4 w-4 mr-1" /> 8%
            </span>
            <span className="text-gray-500 ml-2">from last month</span>
          </div>
        </CardContent>
      </Card>

      {/* Active Claims */}
      <Card>
        <CardContent className="p-5">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Active Claims</p>
              {isLoading ? (
                <Skeleton className="h-8 w-16 mt-1" />
              ) : (
                <p className="text-2xl font-semibold mt-1">{stats?.activeClaims || 0}</p>
              )}
            </div>
            <div className="h-12 w-12 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600">
              <FileText className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-2 flex items-center text-sm">
            <span className="text-amber-500 flex items-center">
              <TrendingUp className="h-4 w-4 mr-1" /> 12%
            </span>
            <span className="text-gray-500 ml-2">from last month</span>
          </div>
        </CardContent>
      </Card>

      {/* Blocks in Chain */}
      <Card>
        <CardContent className="p-5">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Blocks in Chain</p>
              {isLoading ? (
                <Skeleton className="h-8 w-16 mt-1" />
              ) : (
                <p className="text-2xl font-semibold mt-1">{stats?.blocksInChain || 0}</p>
              )}
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
              <Layers className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-2 flex items-center text-sm">
            <span className="text-green-500 flex items-center">
              <TrendingUp className="h-4 w-4 mr-1" /> 4%
            </span>
            <span className="text-gray-500 ml-2">from last week</span>
          </div>
        </CardContent>
      </Card>

      {/* Active Nodes */}
      <Card>
        <CardContent className="p-5">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Active Nodes</p>
              {isLoading ? (
                <Skeleton className="h-8 w-16 mt-1" />
              ) : (
                <p className="text-2xl font-semibold mt-1">{stats?.activeNodes || 0}</p>
              )}
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">
              <Users className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-2 flex items-center text-sm">
            <span className="text-green-500 flex items-center">
              <CheckCircle className="h-4 w-4 mr-1" /> 
            </span>
            <span className="text-gray-500 ml-2">All nodes healthy</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
