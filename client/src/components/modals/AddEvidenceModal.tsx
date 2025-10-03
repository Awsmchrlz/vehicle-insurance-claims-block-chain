import * as React from "react";
import { useState, useContext } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import * as CryptoJS from "crypto-js";
import { PeerContext } from "@/components/layout/AppLayout"; // Adjust the import path based on your file structure; assuming AppLayout is in @/layouts/AppLayout or similar

interface AddEvidenceModalProps {
  claimId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onError: (message: string) => void;
}

const evidenceSchema = z.object({
  evidence: z.string().min(1, "Evidence description is required").max(1000, "Evidence description is too long"),
  evidenceSignature: z.string().min(1, "Evidence signature is required"),
});

export default function AddEvidenceModal({ claimId, isOpen, onClose, onSuccess, onError }: AddEvidenceModalProps) {
  const [evidence, setEvidence] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { selectedPeers } = useContext(PeerContext); // Access selected peers from context

  // Compute HMAC-SHA256 signature
  const computeHmac = (data: string, key: string): string => {
    return CryptoJS.HmacSHA256(data, key).toString(CryptoJS.enc.Base64);
  };

  const mutation = useMutation({
    mutationFn: async (data: { evidence: string; evidenceSignature: string }) => {
      if (!selectedPeers || selectedPeers.length === 0) {
        throw new Error("Please select at least one peer in the organization selector before submitting.");
      }

      // Verify signature before sending
      const expectedSignature = computeHmac(data.evidence, secretKey);
      if (data.evidenceSignature !== expectedSignature) {
        throw new Error("Failed to verify signature");
      }

      const response = await fetch(`/api/claims/${claimId}/evidence`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, selectedPeers }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to add evidence: ${response.statusText}`);
      }
      return response.json();
    },
    onSuccess: (data) => {
      console.log("AddEvidenceModal success:", data);
      onSuccess();
      setEvidence("");
      setSecretKey("");
      onClose();
    },
    onError: (error: Error) => {
      console.error("AddEvidenceModal error:", error.message);
      setErrorMessage(error.message);
      onError(error.message);
    },
  });

  const handleSubmit = () => {
    setErrorMessage(null);
    if (!secretKey) {
      setErrorMessage("Police secret key is required");
      return;
    }
    const evidenceSignature = computeHmac(evidence, secretKey);
    const result = evidenceSchema.safeParse({ evidence, evidenceSignature });
    if (!result.success) {
      setErrorMessage(result.error.errors[0].message);
      return;
    }
    mutation.mutate({ evidence, evidenceSignature });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg sm:max-w-xl p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-medium text-gray-900">
            Add Evidence for Claim: {claimId}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="secretKey" className="text-sm font-medium text-gray-900">
              Police Secret Key
            </Label>
            <Input
              id="secretKey"
              type="password"
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              placeholder="Enter police secret key"
              className="text-sm"
              disabled={mutation.isPending}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="evidence" className="text-sm font-medium text-gray-900">
              Evidence Description
            </Label>
            <Input
              id="evidence"
              value={evidence}
              onChange={(e) => setEvidence(e.target.value)}
              placeholder="Enter evidence details (e.g., Police Report #12345, Photo ID: IMG_789)"
              className="text-sm"
              disabled={mutation.isPending}
            />
            {errorMessage && (
              <p className="text-xs text-red-600">{errorMessage}</p>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs border-gray-300 hover:bg-gray-50"
              onClick={onClose}
              disabled={mutation.isPending}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleSubmit}
              disabled={mutation.isPending}
            >
              {mutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              )}
              Submit Evidence
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}