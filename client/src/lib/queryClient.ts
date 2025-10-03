import { QueryClient } from "@tanstack/react-query";

// Configure the query client with appropriate settings for blockchain interaction
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Blockchain data doesn't change as frequently, so we can cache for longer
      staleTime: 1000 * 60 * 2, // 2 minutes
      cacheTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

// Type definitions for better type safety
export interface ApiResponse<T = any> {
  success?: boolean;
  data?: T;
  message?: string;
  error?: string;
  tx?: string;
  transactionId?: string;
  result?: T;
}

// API request helper with proper error handling
export async function apiRequest(
  url: string,
  method: string = "GET",
  data?: unknown
): Promise<Response> {
  try {
    const options: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
        // Add any auth headers here if needed
        // "Authorization": `Bearer ${getAuthToken()}`
      },
    };

    // Only add body for methods that support it
    if (data && ["POST", "PUT", "PATCH", "DELETE"].includes(method.toUpperCase())) {
      options.body = JSON.stringify(data);
    }

    console.log(`🔄 API Request: ${method} ${url}`, data || "");

    const res = await fetch(url, options);

    // Log response status
    console.log(`📥 API Response: ${res.status} ${res.statusText}`);

    if (!res.ok) {
      let errorMessage = `Request failed: ${res.statusText}`;

      try {
        const errorData = await res.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch {
        // If response is not JSON, try to get text
        try {
          const errorText = await res.text();
          if (errorText) {
            errorMessage = errorText;
          }
        } catch {
          // Use default error message
        }
      }

      console.error(`❌ API Error: ${errorMessage}`);
      throw new Error(errorMessage);
    }

    return res;
  } catch (error) {
    console.error(`❌ API Request Error:`, error);
    throw error;
  }
}

// Typed API functions for blockchain operations

// Vehicle operations
export async function createVehicle(vehicleData: {
  vehicleId: string;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  owner: string;
}): Promise<ApiResponse> {
  const res = await apiRequest("/api/vehicles", "POST", vehicleData);
  return res.json();
}

export async function getAllVehicles(): Promise<{ vehicles: any[] }> {
  const res = await apiRequest("/api/vehicles", "GET");
  return res.json();
}

export async function getVehicleById(id: string): Promise<{ vehicle: any }> {
  const res = await apiRequest(`/api/vehicles/${id}`, "GET");
  return res.json();
}

// Policy operations
export async function createPolicy(policyData: {
  policyId: string;
  vehicleId: string;
  coverageType: string;
  premium: number;
  startDate: string;
  endDate: string;
  status: string;
}): Promise<ApiResponse> {
  const res = await apiRequest("/api/policies", "POST", policyData);
  return res.json();
}

export async function getAllPolicies(): Promise<{ policies: any[] }> {
  const res = await apiRequest("/api/policies", "GET");
  return res.json();
}

export async function getPoliciesByUserId(userId: string): Promise<{ policies: any[] }> {
  const res = await apiRequest(`/api/policies/user/${userId}`, "GET");
  return res.json();
}

// Claim operations
export async function createClaim(claimData: {
  claimId: string;
  policyId: string;
  vehicleId: string;
  incidentDate: string;
  incidentType: string;
  description: string;
  damageEstimate: number;
  status: string;
}): Promise<ApiResponse> {
  const res = await apiRequest("/api/claims", "POST", claimData);
  return res.json();
}

export async function getAllClaims(): Promise<{ claims: any[] }> {
  const res = await apiRequest("/api/claims", "GET");
  return res.json();
}

export async function getClaimById(id: string): Promise<{ claim: any }> {
  const res = await apiRequest(`/api/claims/${id}`, "GET");
  return res.json();
}

export async function assignAdjuster(claimId: string, adjusterId: string): Promise<ApiResponse> {
  const res = await apiRequest(`/api/claims/${claimId}/assign/${adjusterId}`, "PATCH");
  return res.json();
}

export async function reviewClaim(claimId: string, reviewData: {
  status: string;
  reviewedBy: string;
}): Promise<ApiResponse> {
  const res = await apiRequest(`/api/claims/${claimId}/review`, "PATCH", reviewData);
  return res.json();
}

export async function confirmRepair(claimId: string): Promise<ApiResponse> {
  const res = await apiRequest(`/api/claims/${claimId}/repair`, "PATCH");
  return res.json();
}

// Adjustment operations
export async function submitAdjustmentReport(claimId: string, adjustmentData: {
  report: string;
  amount: number;
  garageId: string;
}): Promise<ApiResponse> {
  const res = await apiRequest(`/api/adjustments/${claimId}`, "POST", adjustmentData);
  return res.json();
}

// Blockchain operations
export async function getBlockchainBlocks(): Promise<{ blocks: any[] }> {
  const res = await apiRequest("/api/blockchain/blocks", "GET");
  return res.json();
}

export async function getBlockchainNodes(): Promise<{ nodes: any[] }> {
  const res = await apiRequest("/api/blockchain/nodes", "GET");
  return res.json();
}

export async function getBlockchainStatus(): Promise<any> {
  const res = await apiRequest("/api/blockchain/status", "GET");
  return res.json();
}

export async function testBlockchainConnection(): Promise<{ connected: boolean }> {
  const res = await apiRequest("/api/blockchain/test", "GET");
  return res.json();
}

// Generic blockchain transaction submission
export async function submitBlockchainTransaction(functionName: string, args: string[] = []): Promise<ApiResponse> {
  const res = await apiRequest("/api/blockchain/submit", "POST", {
    function: functionName,
    args,
  });
  return res.json();
}

// Generic blockchain query
export async function queryBlockchain(functionName: string, args: string[] = []): Promise<ApiResponse> {
  const res = await apiRequest("/api/blockchain/query", "POST", {
    function: functionName,
    args,
  });
  return res.json();
}

// React Query hooks for common operations
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Vehicle hooks
export function useVehicles() {
  return useQuery({
    queryKey: ["vehicles"],
    queryFn: getAllVehicles,
  });
}

export function useVehicle(id: string) {
  return useQuery({
    queryKey: ["vehicle", id],
    queryFn: () => getVehicleById(id),
    enabled: !!id,
  });
}

export function useCreateVehicle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createVehicle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
    },
  });
}

// Policy hooks
export function usePolicies() {
  return useQuery({
    queryKey: ["policies"],
    queryFn: getAllPolicies,
  });
}

export function useUserPolicies(userId: string) {
  return useQuery({
    queryKey: ["policies", "user", userId],
    queryFn: () => getPoliciesByUserId(userId),
    enabled: !!userId,
  });
}

export function useCreatePolicy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPolicy,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["policies"] });
    },
  });
}

// Claim hooks
export function useClaims() {
  return useQuery({
    queryKey: ["claims"],
    queryFn: getAllClaims,
  });
}

export function useClaim(id: string) {
  return useQuery({
    queryKey: ["claim", id],
    queryFn: () => getClaimById(id),
    enabled: !!id,
  });
}

export function useCreateClaim() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createClaim,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["claims"] });
    },
  });
}

// Blockchain hooks
export function useBlockchainStatus() {
  return useQuery({
    queryKey: ["blockchain", "status"],
    queryFn: getBlockchainStatus,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

export function useBlockchainNodes() {
  return useQuery({
    queryKey: ["blockchain", "nodes"],
    queryFn: getBlockchainNodes,
  });
}

export function useBlockchainBlocks() {
  return useQuery({
    queryKey: ["blockchain", "blocks"],
    queryFn: getBlockchainBlocks,
    refetchInterval: 10000, // Refetch every 10 seconds for live updates
  });
}