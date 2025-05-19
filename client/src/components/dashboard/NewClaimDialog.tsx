import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import NewClaimForm from "./NewClaimForm";
import { useQueryClient } from "@tanstack/react-query";

export default function NewClaimDialog() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const handleSuccess = () => {
    setOpen(false);
    // Invalidate relevant queries to refresh data
    queryClient.invalidateQueries({ queryKey: ['/api/claims'] });
    queryClient.invalidateQueries({ queryKey: ['/api/claims/recent/4'] });
    queryClient.invalidateQueries({ queryKey: ['/api/blockchain'] });
    queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default">Submit New Claim</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Submit New Insurance Claim</DialogTitle>
          <DialogDescription>
            Submit claim details to be recorded on the blockchain network.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <NewClaimForm onSuccess={handleSuccess} />
        </div>
      </DialogContent>
    </Dialog>
  );
}