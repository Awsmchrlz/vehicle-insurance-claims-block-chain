import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useContext } from "react";
import { PeerContext } from "@/components/layout/AppLayout"; // Adjust import path as needed

interface Garage {
  garageId: string;
  garageName: string;
}

interface AssignGarageFormProps {
  claimId: string;
  garages: Garage[];
  onSuccess: () => void;
  onError: (error: Error) => void;
}

const assignGarageSchema = z.object({
  garageId: z.string().min(1, "Please select a garage"),
});

type AssignGarageFormValues = z.infer<typeof assignGarageSchema>;

export default function AssignGarageForm({ claimId, garages, onSuccess, onError }: AssignGarageFormProps) {
  const queryClient = useQueryClient();
  const { selectedPeers } = useContext(PeerContext); // Access selected peers from context

  const form = useForm<AssignGarageFormValues>({
    resolver: zodResolver(assignGarageSchema),
    defaultValues: {
      garageId: "",
    },
  });

  const assignGarageMutation = useMutation({
    mutationFn: async (values: AssignGarageFormValues) => {
      if (!selectedPeers || selectedPeers.length === 0) {
        throw new Error("Please select at least one peer in the organization selector before submitting.");
      }
      console.log(`Assigning garage to claim: ${claimId} with payload:`, { ...values, selectedPeers });
      const response = await fetch(`/api/claims/${claimId}/assign-garage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ garageId: values.garageId, selectedPeers }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to assign garage: ${response.statusText}`);
      }
      const result = await response.json();
      console.log("Assign garage response:", result);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/claims"] });
      onSuccess();
    },
    onError: (error: Error) => {
      console.error("Assign garage error:", error);
      onError(error);
    },
  });

  const onSubmit = (values: AssignGarageFormValues) => {
    assignGarageMutation.mutate(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="garageId"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">Select Garage</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="h-8 text-xs border-gray-300">
                    <SelectValue placeholder="Select a garage" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {garages.map((garage) => (
                    <SelectItem key={garage.garageId} value={garage.garageId} className="text-xs">
                      {garage.garageName} ({garage.garageId})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage className="text-xs text-red-600" />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-3">
          <Button
            type="submit"
            disabled={assignGarageMutation.isLoading}
            className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white"
          >
            {assignGarageMutation.isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Assign Garage"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}