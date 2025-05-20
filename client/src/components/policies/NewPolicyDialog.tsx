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
import NewPolicyForm from "./NewPolicyForm";
import { useQueryClient } from "@tanstack/react-query";

export default function NewPolicyDialog() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const handleSuccess = () => {
    setOpen(false);
    // Invalidate relevant queries to refresh data
    queryClient.invalidateQueries({ queryKey: ['/api/policies'] });
    queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default">Create New Policy</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create Insurance Policy</DialogTitle>
          <DialogDescription>
            Create a new vehicle insurance policy to be recorded on the blockchain network.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <NewPolicyForm onSuccess={handleSuccess} />
        </div>
      </DialogContent>
    </Dialog>
  );
}