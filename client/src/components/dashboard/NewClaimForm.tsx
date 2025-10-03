import * as React from "react";
import { useState, useContext } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
} from "@/components/ui/toast";
import { Check, Info, Loader2, Search } from "lucide-react";
import { PeerContext } from "@/components/layout/AppLayout"; // Adjust the import path based on your file structure; assuming AppLayout is in @/layouts/AppLayout or similar

interface ToastMessage {
  id: string;
  title: string;
  message: string;
  variant: "default" | "destructive";
}

interface Policy {
  nrcNumber: string;
  driversLicenseNumber: string;
  policyId: string;
  coverageDetails: string;
  policyStatus: string;
  vehicleIds: string[];
}

interface Garage {
  garageId: string;
  name: string;
  address: string;
  contactNumber: string;
}

const claimFormSchema = z.object({
  claimId: z.string().min(1, "Claim ID is required"),
  policyId: z.string().min(1, "Policy ID is required"),
  garageId: z.string().min(1, "Garage ID is required"),
  vehicleId: z.string().min(1, "Vehicle ID is required"),
});

type ClaimFormValues = z.infer<typeof claimFormSchema>;

interface NewClaimFormProps {
  onSuccess?: () => void;
}

export default function NewClaimForm({ onSuccess }: NewClaimFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const [open, setOpen] = useState(false);
  const { selectedPeers } = useContext(PeerContext); // Access selected peers from context

  // Generate claimId
  const generateClaimId = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(1000 + Math.random() * 9000);
    return `CLM-${year}-${random}`;
  };

  const [generatedClaimId] = useState(generateClaimId());

  // Add toast
  const addToast = (title: string, message: string, variant: "default" | "destructive") => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, title, message, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 5000);
  };

  // Fetch policies
  const { data: policiesData } = useQuery<{
    policies: Array<{
      policyId: string;
      nrcNumber: string;
      driversLicenseNumber: string;
      coverageDetails: string;
      policyStatus: string;
      premium: number;
      vehicleIds: string[];
    }>;
  }>({
    queryKey: ["/api/policies"],
    queryFn: async () => {
      const response = await fetch("/api/policies");
      if (!response.ok) throw new Error("Failed to fetch policies");
      return response.json();
    },
    retry: 2,
    staleTime: 1000 * 60 * 5,
  });

  // Fetch garages
  const { data: garagesData } = useQuery<{ garages: Garage[] }>({
    queryKey: ["/api/garages"],
    queryFn: async () => {
      const response = await fetch("/api/garages");
      if (!response.ok) throw new Error("Failed to fetch garages");
      return response.json();
    },
    retry: 2,
    staleTime: 1000 * 60 * 5,
  });

  // Form setup
  const form = useForm<ClaimFormValues>({
    resolver: zodResolver(claimFormSchema),
    defaultValues: {
      claimId: generatedClaimId,
      policyId: "",
      garageId: "",
      vehicleId: "",
    },
  });

  // Handle policy selection
  const handlePolicyChange = async (policyId: string) => {
    if (!policyId) {
      form.setValue("policyId", "", { shouldValidate: true });
      form.setValue("vehicleId", "", { shouldValidate: true });
      setSelectedPolicy(null);
      setOpen(false);
      return;
    }
    try {
      const response = await fetch(`/api/policies/${policyId}`);
      if (!response.ok) throw new Error("Failed to fetch policy");
      const data = await response.json();
      console.log("Fetched policy:", data);
      const policy = data.policy;
      if (!policy.vehicleIds?.length) {
        form.setValue("policyId", policyId, { shouldValidate: true });
        form.setValue("vehicleId", "", { shouldValidate: true });
        setSelectedPolicy(null);
        addToast("Warning", "No vehicles found for this policy", "destructive");
        setOpen(false);
        return;
      }
      form.setValue("policyId", policyId, { shouldValidate: true });
      form.setValue("vehicleId", "", { shouldValidate: true });
      setSelectedPolicy({
        nrcNumber: policy.nrcNumber,
        driversLicenseNumber: policy.driversLicenseNumber,
        policyId: policy.policyId,
        coverageDetails: policy.coverageDetails,
        policyStatus: policy.policyStatus,
        vehicleIds: policy.vehicleIds,
      });
      setOpen(false);
    } catch (error) {
      console.error("Policy fetch error:", error);
      addToast("Error", "Failed to fetch policy details", "destructive");
      form.setValue("policyId", "", { shouldValidate: true });
      form.setValue("vehicleId", "", { shouldValidate: true });
      setSelectedPolicy(null);
      setOpen(false);
    }
  };

  // Submit handler
  const onSubmit = async (data: ClaimFormValues) => {
    setSubmitting(true);
    try {
      if (!selectedPeers || selectedPeers.length === 0) {
        throw new Error("Please select at least one peer in the organization selector before submitting.");
      }

      const payload = {
        claimId: data.claimId,
        policyId: data.policyId,
        garageId: data.garageId,
        vehicleId: data.vehicleId,
        selectedPeers,
      };
      console.log("Payload:", payload);
      const response = await fetch("/api/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json();
        let errorMessage = errorData.error || "Failed to submit claim";
        if (errorData.details?.issues) {
          const issueMessages = errorData.details.issues.map((issue: any) =>
            `${issue.path?.join(".") || "Field"}: ${issue.message}`
          ).join("; ");
          errorMessage += `: ${issueMessages}`;
        }
        throw new Error(errorMessage);
      }
      const result = await response.json();

      addToast(
        "Success",
        `Claim ${result.claim?.claimId || data.claimId} submitted successfully!`,
        "default"
      );

      try {
        await fetch("/api/mine", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ selectedPeers }), // Include selected peers in mining request
        });
        addToast("Success", "Claim added to blockchain ledger!", "default");
      } catch (error) {
        addToast(
          "Note",
          "Claim submitted, will be added to blockchain in next mining cycle.",
          "default"
        );
      }

      form.reset({
        claimId: generateClaimId(),
        policyId: "",
        garageId: "",
        vehicleId: "",
      });
      setSelectedPolicy(null);

      if (onSuccess) onSuccess();
    } catch (error: any) {
      addToast("Error", error.message, "destructive");
    } finally {
      setSubmitting(false);
    }
  };

  // Get display value for selected policy
  const selectedPolicyDisplay = policiesData?.policies?.find(
    (p) => p.policyId === form.watch("policyId")
  );

  return (
    <ToastProvider>
      <Card className="shadow-md border-none bg-white rounded-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-t-lg py-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-sm font-bold text-gray-800">
              Create New Claim
            </CardTitle>
            <Badge className="bg-blue-600 text-white text-xs px-2 py-0.5">
              Blockchain Secured
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-3 space-y-2">
          {selectedPolicy && (
            <Card className="bg-gray-50 border-none shadow-sm">
              <CardHeader className="py-1">
                <CardTitle className="text-xs font-semibold text-gray-800">
                  Policy Details
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-1">
                <div className="grid grid-cols-2 gap-1 text-xs">
                  <div>
                    <span className="font-medium">Policy ID:</span>{" "}
                    {selectedPolicy.policyId}
                  </div>
                  <div>
                    <span className="font-medium">NRC Number:</span>{" "}
                    {selectedPolicy.nrcNumber}
                  </div>
                  <div>
                    <span className="font-medium">Driver's License:</span>{" "}
                    {selectedPolicy.driversLicenseNumber}
                  </div>
                  <div>
                    <span className="font-medium">Coverage:</span>{" "}
                    {selectedPolicy.coverageDetails}
                  </div>
                  <div>
                    <span className="font-medium">Status:</span>{" "}
                    <Badge
                      className={
                        selectedPolicy.policyStatus === "ACTIVE"
                          ? "bg-green-100 text-green-800 text-xs"
                          : "bg-red-100 text-red-800 text-xs"
                      }
                    >
                      {selectedPolicy.policyStatus}
                    </Badge>
                  </div>
                  <div>
                    <span className="font-medium">Vehicles:</span>{" "}
                    {selectedPolicy.vehicleIds.join(", ")}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
              <FormField
                control={form.control}
                name="claimId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Claim ID</FormLabel>
                    <FormDescription className="text-xs">
                      Auto-generated unique identifier
                    </FormDescription>
                    <FormControl>
                      <Input {...field} readOnly disabled className="bg-gray-100 text-xs h-8" />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="policyId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Policy ID</FormLabel>
                    <FormDescription className="text-xs">
                      Search by Policy ID or NRC Number
                    </FormDescription>
                    <Popover open={open} onOpenChange={setOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className="w-full justify-between text-xs h-8 border-gray-300 hover:bg-gray-50"
                            disabled={submitting}
                          >
                            {selectedPolicyDisplay
                              ? `${selectedPolicyDisplay.policyId} (NRC: ${selectedPolicyDisplay.nrcNumber})`
                              : "Select Policy"}
                            <Search className="ml-2 h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="p-0 w-[384px]">
                        <Command>
                          <CommandInput
                            placeholder="Search Policy..."
                            className="text-xs h-8"
                            disabled={submitting}
                          />
                          <CommandList>
                            <CommandEmpty>No policies found</CommandEmpty>
                            <CommandGroup>
                              {policiesData?.policies?.map((policy) => (
                                <CommandItem
                                  key={policy.policyId}
                                  value={`${policy.policyId} ${policy.nrcNumber}`}
                                  onSelect={() => {
                                    field.onChange(policy.policyId);
                                    handlePolicyChange(policy.policyId);
                                  }}
                                  className="text-xs"
                                >
                                  <Check
                                    className={`mr-2 h-4 w-4 ${
                                      field.value === policy.policyId ? "opacity-100" : "opacity-0"
                                    }`}
                                  />
                                  {policy.policyId} (NRC: {policy.nrcNumber})
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="vehicleId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Vehicle ID</FormLabel>
                    <FormDescription className="text-xs">
                      Select a vehicle from the policy
                    </FormDescription>
                    <Select
                      onValueChange={(value) => field.onChange(value)}
                      value={field.value}
                      disabled={submitting || !selectedPolicy?.vehicleIds?.length}
                    >
                      <FormControl>
                        <SelectTrigger className="text-xs h-8 border-gray-300 hover:bg-gray-50">
                          <SelectValue placeholder="Select Vehicle" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {selectedPolicy?.vehicleIds?.map((vehicleId) => (
                          <SelectItem key={vehicleId} value={vehicleId} className="text-xs">
                            {vehicleId}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="garageId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Garage</FormLabel>
                    <FormDescription className="text-xs">
                      Select a garage for the claim
                    </FormDescription>
                    <Select
                      onValueChange={(value) => field.onChange(value)}
                      value={field.value}
                      disabled={submitting || !garagesData?.garages?.length}
                    >
                      <FormControl>
                        <SelectTrigger className="text-xs h-8 border-gray-300 hover:bg-gray-50">
                          <SelectValue placeholder="Select Garage" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {garagesData?.garages?.map((garage) => (
                          <SelectItem key={garage.garageId} value={garage.garageId} className="text-xs">
                            {garage.name} ({garage.garageId})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              <div>
                <Alert className="bg-blue-50 border-blue-200 py-1">
                  <Info className="h-3 w-3 text-blue-700" />
                  <AlertDescription className="text-xs text-blue-800">
                    Claims are securely stored on the blockchain and cannot be altered.
                  </AlertDescription>
                </Alert>
              </div>
              <div>
                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs h-8 rounded-md"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>Submit Claim to Blockchain</>
                  )}
                </Button>
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