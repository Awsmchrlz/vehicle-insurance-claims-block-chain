import * as React from "react";
import { useEffect, useState, useContext } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ToastProvider, Toast, ToastTitle, ToastDescription, ToastClose, ToastViewport } from "@/components/ui/toast";
import { PeerContext } from "@/components/layout/AppLayout"; // Adjust the import path as needed

interface Claim {
  claimId: string;
  policyId: string;
  vehicleId: string;
  status: string | null;
}

interface Policy {
  policyId: string;
  nrcNumber: string;
  coverageDetails: string;
  policyStatus: string;
  vehicleIds: string[];
  insuranceCompanyId: string;
}

interface InsuranceCompany {
  companyId: string;
  companyName: string;
}

interface ToastMessage {
  id: string;
  title: string;
  message: string;
  variant: "default" | "destructive";
}

interface CreateBillFormProps {
  claim: Claim | null;
  onSuccess: () => void;
  onError: (error: Error) => void;
  currencySymbol?: string;
}

const createBillSchema = z.object({
  claimId: z.string().min(1, "Please select a claim"),
  totalAmount: z
    .number()
    .min(0.01, "Amount must be greater than 0")
    .max(1000000, "Amount cannot exceed 1,000,000")
    .transform((val) => Number(val.toFixed(2))),
  insuranceCompanyId: z.string().min(1, "Insurance company is required"),
  customerNrc: z.string().min(1, "Customer NRC is required"),
});

type CreateBillFormValues = z.infer<typeof createBillSchema>;

export default function CreateBillForm({ claim, onSuccess, onError, currencySymbol = "ZMW" }: CreateBillFormProps) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const limit = 50;
  const { selectedPeers } = useContext(PeerContext); // Access selected peers from context

  const addToast = (title: string, message: string, variant: "default" | "destructive") => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, title, message, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 5000);
  };

  const { data: claimsData, isLoading: claimsLoading, error: claimsError } = useQuery({
    queryKey: ["/api/claims", page, limit],
    queryFn: async () => {
      const response = await fetch(`/api/claims?status=REPAIRED&hasGarage=true&hasBill=false&page=${page}&limit=${limit}`);
      if (!response.ok) {
        const errorMessage = await response.text().catch(() => "Failed to fetch claims");
        throw new Error(errorMessage);
      }
      const data = await response.json();
      return {
        claims: (data.claims || []).map((c: any) => ({
          claimId: c.claimId,
          policyId: c.policyId,
          vehicleId: c.vehicleId,
          status: c.status,
        })),
        total: data.total || 0,
      };
    },
    retry: 0,
    staleTime: 1000 * 60 * 5,
    keepPreviousData: true,
  });

  const form = useForm<CreateBillFormValues>({
    resolver: zodResolver(createBillSchema),
    defaultValues: {
      claimId: claim?.claimId || "",
      totalAmount: 0,
      insuranceCompanyId: "",
      customerNrc: "",
    },
  });

  const selectedClaimId = form.watch("claimId") || claim?.claimId;
  const selectedClaim = claimsData?.claims.find((c) => c.claimId === selectedClaimId);

  const { data: policyData, isLoading: policyLoading, error: policyError } = useQuery({
    queryKey: ["/api/policies", selectedClaimId, selectedClaim?.policyId],
    queryFn: async () => {
      if (!selectedClaim?.policyId) return null;
      const response = await fetch(`/api/policies/${selectedClaim.policyId}`);
      if (!response.ok) {
        const errorMessage = await response.text().catch(() => "Failed to fetch policy");
        throw new Error(errorMessage);
      }
      const data = await response.json();
      return {
        policy: {
          policyId: data.policy?.policyId || "N/A",
          nrcNumber: data.policy?.nrcNumber || "N/A",
          coverageDetails: data.policy?.coverageDetails || "N/A",
          policyStatus: data.policy?.policyStatus || "N/A",
          vehicleIds: data.policy?.vehicleIds || [],
          insuranceCompanyId: data.policy?.insuranceCompanyId || "N/A",
        },
      };
    },
    enabled: !!selectedClaim?.policyId,
    retry: 0,
    staleTime: 1000 * 60 * 5,
  });

  const { data: insuranceCompanyData, isLoading: insuranceCompanyLoading, error: insuranceCompanyError } = useQuery({
    queryKey: ["/api/insurance-companies", policyData?.policy?.insuranceCompanyId],
    queryFn: async () => {
      if (!policyData?.policy?.insuranceCompanyId || policyData.policy.insuranceCompanyId === "N/A") return null;
      const response = await fetch(`/api/insurance-companies/${policyData.policy.insuranceCompanyId}`);
      if (!response.ok) {
        let errorMessage = "Failed to fetch insurance company";
        try {
          const errorData = await response.json();
          if (errorData.error.includes("INSURANCE_COMPANY_NOT_FOUND")) {
            errorMessage = `Insurance company ${policyData.policy.insuranceCompanyId} not found`;
          } else {
            errorMessage = errorData.error || errorData.message || errorMessage;
          }
        } catch {
          errorMessage = await response.text().catch(() => errorMessage);
        }
        throw new Error(errorMessage);
      }
      const data = await response.json();
      return {
        insuranceCompany: {
          companyId: data.insuranceCompany?.companyId || "N/A",
          companyName: data.insuranceCompany?.companyName || "Unknown",
        },
      };
    },
    enabled: !!policyData?.policy?.insuranceCompanyId && policyData.policy.insuranceCompanyId !== "N/A",
    retry: 0,
    staleTime: 1000 * 60 * 10,
  });

  useEffect(() => {
    if (claim) form.setValue("claimId", claim.claimId);
    if (!selectedClaimId) return;
    form.clearErrors(["customerNrc", "insuranceCompanyId"]);
    if (policyData?.policy?.nrcNumber && policyData.policy.nrcNumber !== "N/A") {
      form.setValue("customerNrc", policyData.policy.nrcNumber);
    } else {
      form.setValue("customerNrc", "");
      form.setError("customerNrc", { type: "manual", message: "No NRC found for this policy" });
    }
    if (insuranceCompanyData?.insuranceCompany?.companyId && insuranceCompanyData.insuranceCompany.companyId !== "N/A") {
      form.setValue("insuranceCompanyId", insuranceCompanyData.insuranceCompany.companyId);
    } else {
      form.setValue("insuranceCompanyId", "");
      form.setError("insuranceCompanyId", { type: "manual", message: insuranceCompanyError?.message || "No insurance company found" });
    }
  }, [claim, selectedClaimId, policyData, insuranceCompanyData, insuranceCompanyError, form]);

  const totalAmount = form.watch("totalAmount") || 0;
  const customerAmount = Number((totalAmount * 0.1).toFixed(2));
  const insuranceAmount = Number((totalAmount * 0.9).toFixed(2));

  const createBillMutation = useMutation({
    mutationFn: async (values: CreateBillFormValues) => {
      if (!selectedPeers || selectedPeers.length === 0) {
        throw new Error("Please select at least one peer in the organization selector before submitting.");
      }
      try {
        const response = await fetch("/api/bills", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            claimId: values.claimId,
            totalAmount: values.totalAmount.toString(),
            insuranceCompanyId: values.insuranceCompanyId,
            customerNrc: values.customerNrc,
            selectedPeers,
          }),
        });
        if (!response.ok) {
          let errorMessage = "Failed to create bill";
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorData.message || errorMessage;
          } catch {
            errorMessage = await response.text().catch(() => errorMessage);
          }
          throw new Error(errorMessage);
        }
        return await response.json();
      } catch (error) {
        console.error("Bill creation error:", error);
        throw new Error(error instanceof Error ? error.message : "An unexpected error occurred");
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/claims"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bills"] });
      queryClient.invalidateQueries({ queryKey: ["/api/policies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/insurance-companies"] });
      addToast("Success", `Bill created successfully!`, "default");
      onSuccess();
      form.reset({ claimId: "", totalAmount: 0, insuranceCompanyId: "", customerNrc: "" });
    },
    onError: (error: Error) => {
      const errorMessage = error.message || "An unexpected error occurred";
      addToast("Error", errorMessage, "destructive");
    },
    retry: 0,
  });

  const onSubmit = async (values: CreateBillFormValues) => {
    try {
      await createBillMutation.mutateAsync(values);
    } catch (error) {
      console.error("Submit error:", error);
    }
  };

  const totalPages = claimsData?.total ? Math.ceil(claimsData.total / limit) : 1;

  return (
    <ToastProvider>
      <Card className="shadow-md border-none bg-white rounded-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-t-lg py-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-sm font-bold text-gray-800">Create New Bill</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-3 space-y-2">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="bg-gray-50 border-none shadow-sm">
              <CardHeader className="py-1">
                <CardTitle className="text-xs font-semibold text-gray-800">Policy Details</CardTitle>
              </CardHeader>
              <CardContent className="pb-1">
                {policyLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                  </div>
                ) : policyError ? (
                  <p className="text-xs text-red-500 font-medium">Error: {(policyError as Error).message}</p>
                ) : !selectedClaim || !policyData?.policy ? (
                  <p className="text-xs text-gray-500">Select a claim to view policy details</p>
                ) : (
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    <div><span className="font-medium">Policy ID:</span> {policyData.policy.policyId}</div>
                    <div><span className="font-medium">Coverage:</span> {policyData.policy.coverageDetails}</div>
                    <div><span className="font-medium">Status:</span> <span className={cn("font-medium", policyData.policy.policyStatus === "Active" ? "text-green-600" : "text-red-600")}>{policyData.policy.policyStatus}</span></div>
                    <div><span className="font-medium">Vehicles:</span> {policyData.policy.vehicleIds.length > 0 ? policyData.policy.vehicleIds.join(", ") : "None"}</div>
                    <div><span className="font-medium">Ins. Company:</span> {insuranceCompanyLoading ? <Loader2 className="h-4 w-4 animate-spin text-gray-400 inline" /> : insuranceCompanyError ? <span className="text-red-500">{insuranceCompanyError.message}</span> : insuranceCompanyData?.insuranceCompany?.companyName || "Unknown"}</div>
                    <div><span className="font-medium">Customer NRC:</span> {policyData.policy.nrcNumber}</div>
                  </div>
                )}
              </CardContent>
            </Card>
            <Card className="bg-gray-50 border-none shadow-sm">
              <CardHeader className="py-1">
                <CardTitle className="text-xs font-semibold text-gray-800">Bill Split</CardTitle>
              </CardHeader>
              <CardContent className="pb-1">
                <div className="grid grid-cols-2 gap-1 text-xs">
                  <div><span className="font-medium">Total Amount:</span> {currencySymbol} {totalAmount.toFixed(2)}</div>
                  <div><span className="font-medium">Customer (10%):</span> {currencySymbol} {customerAmount.toFixed(2)}</div>
                  <div><span className="font-medium">Insurance (90%):</span> {currencySymbol} {insuranceAmount.toFixed(2)}</div>
                </div>
              </CardContent>
            </Card>
          </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
              <FormField
                control={form.control}
                name="claimId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium text-gray-700">Claim</FormLabel>
                    <FormDescription className="text-xs text-gray-500">Select a repaired claim to create a bill</FormDescription>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value} disabled={claimsLoading || !!claimsError}>
                        <SelectTrigger className="h-8 text-xs border-gray-300 bg-white rounded-md shadow-sm hover:bg-gray-50">
                          <SelectValue placeholder={claimsLoading ? "Loading claims..." : "Select a claim"} />
                        </SelectTrigger>
                        <SelectContent>
                          {claimsData?.claims.map((claim) => (
                            <SelectItem key={claim.claimId} value={claim.claimId} className="text-xs">
                              {claim.claimId} (Vehicle: {claim.vehicleId})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    {claimsError && <p className="text-xs text-red-500 font-medium">Error: {(claimsError as Error).message}</p>}
                    <FormMessage className="text-xs text-red-500 font-medium" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="insuranceCompanyId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium text-gray-700">Insurance Company</FormLabel>
                    <FormDescription className="text-xs text-gray-500">Automatically populated from the selected claim's policy</FormDescription>
                    <FormControl>
                      <div className="relative">
                        {insuranceCompanyLoading && <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />}
                        <Input
                          type="text"
                          value={insuranceCompanyData?.insuranceCompany?.companyName || (insuranceCompanyLoading ? "Loading..." : "Select a claim to auto-populate")}
                          disabled
                          className={cn("h-8 text-xs bg-gray-100 border-gray-300 rounded-md shadow-sm cursor-not-allowed", insuranceCompanyLoading && "pr-10")}
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs text-red-500 font-medium" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="totalAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium text-gray-700">Total Amount</FormLabel>
                    <FormDescription className="text-xs text-gray-500">Enter the total bill amount (up to 2 decimal places)</FormDescription>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-medium bg-white px-1 rounded">{currencySymbol}</span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0.01"
                          max="1000000"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          className="h-8 text-xs pl-8 border-gray-300 bg-white rounded-md shadow-sm focus:ring-2 focus:ring-blue-400"
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs text-red-500 font-medium" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="customerNrc"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium text-gray-700">Customer NRC</FormLabel>
                    <FormDescription className="text-xs text-gray-500">Automatically fetched from the policy</FormDescription>
                    <FormControl>
                      <div className="relative">
                        {policyLoading && <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />}
                        <Input
                          type="text"
                          placeholder={policyLoading ? "Loading NRC..." : "Customer NRC"}
                          {...field}
                          disabled
                          className={cn("h-8 text-xs bg-gray-100 border-gray-300 rounded-md shadow-sm cursor-not-allowed", policyLoading && "pr-10")}
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs text-red-500 font-medium" />
                  </FormItem>
                )}
              />
              <div className="flex gap-2 pt-2">
                {claimsData?.total > limit && (
                  <div className="flex gap-2 items-center">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs border-gray-300 bg-white rounded-md shadow-sm hover:bg-gray-50"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1 || claimsLoading}
                    >
                      Previous
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs border-gray-300 bg-white rounded-md shadow-sm hover:bg-gray-50"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages || claimsLoading}
                    >
                      Next
                    </Button>
                    <span className="text-xs text-gray-500">Page {page} of {totalPages}</span>
                  </div>
                )}
                <div className="flex gap-2 ml-auto">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-8 text-xs border-gray-300 bg-white rounded-md shadow-sm hover:bg-gray-50"
                    onClick={() => form.reset({ claimId: "", totalAmount: 0, insuranceCompanyId: "", customerNrc: "" })}
                    disabled={createBillMutation.isLoading}
                  >
                    Reset
                  </Button>
                  <Button
                    type="submit"
                    disabled={createBillMutation.isLoading || claimsLoading || policyLoading || insuranceCompanyLoading}
                    className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-sm"
                  >
                    {createBillMutation.isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Bill"}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      <ToastViewport className="top-4 right-4" />
      {toasts.map((toast) => (
        <Toast key={toast.id} variant={toast.variant} className="shadow-md">
          <ToastTitle className="text-xs font-semibold">{toast.title}</ToastTitle>
          <ToastDescription className="text-xs">{toast.message}</ToastDescription>
          <ToastClose />
        </Toast>
      ))}
    </ToastProvider>
  );
}