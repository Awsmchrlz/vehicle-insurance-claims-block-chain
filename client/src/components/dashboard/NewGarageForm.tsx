import { useState, useContext } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { insertGarageSchema } from "@shared/schema";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { ToastProvider, ToastViewport, Toast, ToastTitle, ToastDescription, ToastClose } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { PeerContext } from "@/components/layout/AppLayout"; // Adjust the import path based on your file structure; assuming AppLayout is in @/layouts/AppLayout or similar

interface ToastMessage {
  id: string;
  title: string;
  message: string;
  variant: "default" | "destructive";
}

interface CreateGarageFormProps {
  onSuccess: () => void;
  onError?: (error: Error) => void;
}

// Extend insertGarageSchema with address and garageId validation
const enhancedGarageSchema = insertGarageSchema.refine(
  (data) => !/[\/\\]/.test(data.address),
  {
    message: "Address cannot contain slashes (/ or \\)",
    path: ["address"],
  }
).refine(
  (data) => data.garageId.match(/^GAR-\d{4}-\d{4}$/),
  {
    message: "Invalid Garage ID format (e.g., GAR-2025-1234)",
    path: ["garageId"],
  }
);

type GarageFormValues = z.infer<typeof enhancedGarageSchema>;

export default function CreateGarageForm({ onSuccess, onError }: CreateGarageFormProps) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const { selectedPeers } = useContext(PeerContext);

  // Generate unique garageId
  const generateGarageId = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(1000 + Math.random() * 9000);
    return `GAR-${year}-${random}`;
  };

  const [generatedGarageId] = useState(generateGarageId());

  const form = useForm<GarageFormValues>({
    resolver: zodResolver(enhancedGarageSchema),
    defaultValues: {
      garageId: generatedGarageId,
      garageName: "",
      address: "",
      contactNumber: "",
      specialization: "",
      status: "UNDER_REVIEW",
    },
    mode: "onChange",
  });

  const addToast = (title: string, message: string, variant: "default" | "destructive") => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, title, message, variant }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  };

  const createGarageMutation = useMutation({
    mutationFn: async (data: GarageFormValues) => {
      if (!selectedPeers || selectedPeers.length === 0) {
        throw new Error("Please select at least one peer in the organization selector before submitting.");
      }

      const payload = {
        garageId: data.garageId,
        garageName: data.garageName.trim(),
        address: data.address.trim(),
        contactNumber: data.contactNumber.trim(),
        specialization: data.specialization.trim(),
        status: data.status,
        selectedPeers, // Include selected peers from context
      };

      const response = await fetch("/api/garages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        const errorMessage = errorText.includes("All fields are required")
          ? "Please fill in all required fields correctly."
          : errorText.match(/message:"([^"]+)"/)?.[1] || `Failed to create garage: ${response.status}`;
        throw new Error(errorMessage);
      }

      const contentType = response.headers.get("content-type");
      if (!contentType?.includes("application/json")) {
        throw new Error(`Invalid response format: Expected JSON, received ${contentType || "unknown"}`);
      }

      return await response.json();
    },
    onSuccess: (data) => {
      addToast("Success", `Garage ${data.garageId} created successfully!`, "default");
      form.reset({
        garageId: generateGarageId(),
        garageName: "",
        address: "",
        contactNumber: "",
        specialization: "",
        status: "UNDER_REVIEW",
      });
      onSuccess();
    },
    onError: (error: Error) => {
      addToast("Error", error.message, "destructive");
      if (onError) onError(error);
    },
    retry: 0,
  });

  const isFormValid = form.formState.isValid;

  return (
    <ToastProvider>
      <Card className="shadow-md border-none bg-white rounded-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-t-lg py-2">
          <CardTitle className="text-sm font-bold text-gray-800">Create New Garage</CardTitle>
        </CardHeader>
        <CardContent className="p-3 space-y-3">
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => createGarageMutation.mutate(data))} className="space-y-3">
              <FormField
                control={form.control}
                name="garageId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium text-gray-700">Garage ID</FormLabel>
                    <FormDescription className="text-xs text-gray-500">Auto-generated unique identifier</FormDescription>
                    <FormControl>
                      <Input
                        {...field}
                        readOnly
                        disabled
                        className="h-8 text-xs bg-gray-100 border-gray-300 rounded-md shadow-sm cursor-not-allowed"
                      />
                    </FormControl>
                    <FormMessage className="text-xs text-red-500 font-medium" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="garageName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium text-gray-700">Garage Name</FormLabel>
                    <FormDescription className="text-xs text-gray-500">Enter the name of the garage</FormDescription>
                    <FormControl>
                      <Input
                        placeholder="AutoFix Garage"
                        {...field}
                        className="h-8 text-xs border-gray-300 bg-white rounded-md shadow-sm focus:ring-2 focus:ring-blue-400"
                        disabled={createGarageMutation.isLoading}
                      />
                    </FormControl>
                    <FormMessage className="text-xs text-red-500 font-medium" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium text-gray-700">Address</FormLabel>
                    <FormDescription className="text-xs text-gray-500">Enter the garage address (no slashes)</FormDescription>
                    <FormControl>
                      <Input
                        placeholder="123 Main St, Lusaka"
                        {...field}
                        className="h-8 text-xs border-gray-300 bg-white rounded-md shadow-sm focus:ring-2 focus:ring-blue-400"
                        disabled={createGarageMutation.isLoading}
                      />
                    </FormControl>
                    <FormMessage className="text-xs text-red-500 font-medium" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contactNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium text-gray-700">Contact Number</FormLabel>
                    <FormDescription className="text-xs text-gray-500">Enter the contact number (e.g., +260977123456)</FormDescription>
                    <FormControl>
                      <Input
                        placeholder="+260977123456"
                        {...field}
                        className="h-8 text-xs border-gray-300 bg-white rounded-md shadow-sm focus:ring-2 focus:ring-blue-400"
                        disabled={createGarageMutation.isLoading}
                      />
                    </FormControl>
                    <FormMessage className="text-xs text-red-500 font-medium" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="specialization"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium text-gray-700">Specialization</FormLabel>
                    <FormDescription className="text-xs text-gray-500">Enter the garage's specialization</FormDescription>
                    <FormControl>
                      <Input
                        placeholder="Body Repair"
                        {...field}
                        className="h-8 text-xs border-gray-300 bg-white rounded-md shadow-sm focus:ring-2 focus:ring-blue-400"
                        disabled={createGarageMutation.isLoading}
                      />
                    </FormControl>
                    <FormMessage className="text-xs text-red-500 font-medium" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium text-gray-700">Status</FormLabel>
                    <FormDescription className="text-xs text-gray-500">Default status for new garages</FormDescription>
                    <FormControl>
                      <Input
                        {...field}
                        value="UNDER_REVIEW"
                        disabled
                        className="h-8 text-xs bg-gray-100 border-gray-300 rounded-md shadow-sm cursor-not-allowed"
                      />
                    </FormControl>
                    <FormMessage className="text-xs text-red-500 font-medium" />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-8 text-xs border-gray-300 text-gray-700 hover:bg-gray-100 rounded-md shadow-sm transition-all duration-200"
                  onClick={() => form.reset({
                    garageId: generateGarageId(),
                    garageName: "",
                    address: "",
                    contactNumber: "",
                    specialization: "",
                    status: "UNDER_REVIEW",
                  })}
                  disabled={createGarageMutation.isLoading}
                >
                  Reset
                </Button>
                <Button
                  type="submit"
                  className="h-8 text-xs bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-md shadow-sm hover:shadow-md transition-all duration-200"
                  disabled={createGarageMutation.isLoading || !isFormValid}
                >
                  {createGarageMutation.isLoading ? (
                    <>
                      <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Garage"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      <ToastViewport className="fixed top-4 right-4 w-80 max-w-[90vw]">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            className={cn(
              "p-4 rounded-md shadow-lg",
              toast.variant === "destructive" ? "bg-gradient-to-r from-red-600 to-red-700 text-white" : "bg-gradient-to-r from-blue-600 to-blue-700 text-white"
            )}
          >
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <ToastTitle className="flex items-center gap-2 text-xs font-semibold">
                  {toast.variant === "default" ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  {toast.title}
                </ToastTitle>
                <ToastDescription className="text-xs">{toast.message}</ToastDescription>
              </div>
              <ToastClose
                className="text-xs"
                onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              >
                ✕
              </ToastClose>
            </div>
          </Toast>
        ))}
      </ToastViewport>
    </ToastProvider>
  );
}