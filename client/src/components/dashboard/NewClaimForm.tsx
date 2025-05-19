import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertClaimSchema } from "@shared/schema";
import { Info, Upload, AlertCircle, Loader2 } from "lucide-react";

// Extend the insert schema with validation rules
const claimFormSchema = insertClaimSchema.extend({
  policyId: z.string().min(1, "Policy ID is required"),
  incidentDate: z.string().min(1, "Incident date is required"),
  incidentType: z.string().min(1, "Incident type is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  damageEstimate: z.coerce.number().min(1, "Damage estimate must be greater than 0"),
});

type ClaimFormValues = z.infer<typeof claimFormSchema>;

interface NewClaimFormProps {
  onSuccess?: () => void;
}

export default function NewClaimForm({ onSuccess }: NewClaimFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  
  // Fetch policies for the dropdown
  const { data: policiesData } = useQuery<{policies: Array<{
    policyId: string;
    vehicleId: string;
    startDate: string;
    endDate: string;
    coverageType: string;
    status: string;
    premium: number;
  }>}>({
    queryKey: ['/api/policies'],
  });

  // Create form
  const form = useForm<ClaimFormValues>({
    resolver: zodResolver(claimFormSchema),
    defaultValues: {
      policyId: "",
      incidentDate: new Date().toISOString().split("T")[0], // Today's date as default
      incidentType: "",
      description: "",
      damageEstimate: 0,
    },
  });

  // Submit handler
  const onSubmit = async (data: ClaimFormValues) => {
    try {
      setSubmitting(true);
      
      // Get policy details to get the vehicle ID
      const policyResponse = await fetch(`/api/policies/${data.policyId}`);
      const policyData = await policyResponse.json();
      
      if (!policyResponse.ok || !policyData.policy) {
        throw new Error("Could not fetch policy details");
      }
      
      // Create a unique claim ID (format: CLM-YYYY-XXXX)
      const year = new Date().getFullYear();
      const random = Math.floor(1000 + Math.random() * 9000); // 4-digit random number
      const claimId = `CLM-${year}-${random}`;
      
      // Prepare claim data
      const claimData = {
        claimId,
        policyId: data.policyId,
        vehicleId: policyData.policy.vehicleId,
        incidentDate: new Date(data.incidentDate),
        incidentType: data.incidentType,
        description: data.description,
        damageEstimate: data.damageEstimate,
        status: "processing",
        createdAt: new Date(),
        evidence: null,
      };
      
      // Submit claim to API
      const response = await apiRequest("POST", "/api/claims", claimData);
      const result = await response.json();
      
      // Show success message
      toast({
        title: "Claim Submitted Successfully",
        description: `Claim ID: ${result.claim.claimId} has been recorded. Mining to blockchain...`,
      });
      
      // Add to blockchain
      try {
        // Mine a new block with this claim transaction
        await fetch('/api/mine', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        
        toast({
          title: "Blockchain Updated",
          description: "Your claim has been successfully added to the blockchain ledger.",
        });
      } catch (error) {
        console.error("Error mining block:", error);
        toast({
          variant: "default",
          title: "Note",
          description: "Claim submitted, will be added to blockchain in next mining cycle.",
        });
      }
      
      // Reset form
      form.reset({
        policyId: "",
        incidentDate: new Date().toISOString().split("T")[0],
        incidentType: "",
        description: "",
        damageEstimate: 0,
      });
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error submitting claim:", error);
      toast({
        variant: "destructive",
        title: "Failed to submit claim",
        description: "An error occurred while submitting your claim. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Submit New Claim</CardTitle>
          <Badge className="bg-blue-100 text-blue-700">POC Demo</Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="policyId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Policy ID</FormLabel>
                  <FormDescription>
                    Select the insurance policy for the vehicle involved in this claim
                  </FormDescription>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={submitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Policy" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {policiesData?.policies?.map((policy) => (
                        <SelectItem key={policy.policyId} value={policy.policyId}>
                          {policy.policyId} ({policy.vehicleId})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="incidentDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date of Incident</FormLabel>
                  <FormDescription>
                    Date when the incident occurred (immutably recorded on the blockchain)
                  </FormDescription>
                  <FormControl>
                    <Input 
                      type="date" 
                      {...field} 
                      disabled={submitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="incidentType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Incident Type</FormLabel>
                  <FormDescription>
                    Type of incident is verified by all blockchain nodes for consensus
                  </FormDescription>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={submitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="collision">Collision</SelectItem>
                      <SelectItem value="theft">Theft</SelectItem>
                      <SelectItem value="fire">Fire Damage</SelectItem>
                      <SelectItem value="vandalism">Vandalism</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormDescription>
                    Detailed description of the incident (stored permanently on the blockchain)
                  </FormDescription>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe what happened..." 
                      className="resize-none" 
                      rows={3}
                      {...field}
                      disabled={submitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="damageEstimate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estimated Damage (ZMW)</FormLabel>
                  <FormDescription>
                    Claim amount in Zambian Kwacha (verified through blockchain consensus)
                  </FormDescription>
                  <FormControl>
                    <Input 
                      type="number" 
                      min="0" 
                      step="100"
                      placeholder="0.00" 
                      {...field}
                      disabled={submitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div>
              <FormLabel className="block mb-1">Evidence Files</FormLabel>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600 justify-center">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500"
                    >
                      <span>Upload files</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        multiple
                        disabled={submitting}
                        className="sr-only"
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG, PDF up to 10MB</p>
                </div>
              </div>
            </div>
            
            <Alert className="bg-blue-50 border-blue-200">
              <Info className="h-4 w-4 text-blue-700" />
              <AlertDescription className="text-sm text-blue-800">
                All submitted claims will be securely stored on the blockchain with timestamps and cannot be altered.
              </AlertDescription>
            </Alert>
            
            <Button 
              type="submit" 
              className="w-full flex items-center justify-center"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>Submit Claim to Blockchain</>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
