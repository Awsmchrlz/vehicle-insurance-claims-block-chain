import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate, getStatusColor } from "@/lib/utils";
import { Loader2, X, FileText, Download, Info, ExternalLink, Shield, CheckCircle2, Clock } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ClaimDetailsModalProps {
  claimId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ClaimDetailsModal({
  claimId,
  isOpen,
  onClose,
}: ClaimDetailsModalProps) {
  // Fetch claim data
  const { data: claimData, isLoading } = useQuery<{claim: {
    claimId: string;
    policyId: string;
    vehicleId: string;
    incidentDate: string;
    incidentType: string;
    description: string;
    damageEstimate: number;
    status: string;
    blockIndex?: number;
    transactionHash?: string;
    createdAt: string;
    evidence?: {
      files?: Array<{
        type: string;
        name: string;
        uploaded: string;
        verifiedBy?: string;
        reportId?: string;
      }>
    }
  }}>({
    queryKey: [`/api/claims/${claimId}`],
    enabled: isOpen, // Only fetch when modal is open
  });

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            <span>
              Claim Details: 
              {isLoading ? (
                <Loader2 className="ml-2 h-4 w-4 inline animate-spin" />
              ) : (
                <span className="text-blue-600 ml-2">
                  {claimData?.claim.claimId}
                </span>
              )}
            </span>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose}
              className="h-6 w-6 rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-500 mb-2">Claim Information</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-gray-500">Vehicle</div>
                      <div className="text-sm font-medium">{claimData?.claim.vehicleId}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Policy ID</div>
                      <div className="text-sm font-medium">{claimData?.claim.policyId}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Date of Incident</div>
                      <div className="text-sm font-medium">{claimData?.claim.incidentDate ? formatDate(claimData.claim.incidentDate) : '-'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Status</div>
                      <div className="text-sm font-medium">
                        <Badge className={getStatusColor(claimData?.claim.status)}>
                          {claimData?.claim.status.replace("_", " ")}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Claim Amount</div>
                      <div className="text-sm font-medium">ZMW {claimData?.claim.damageEstimate.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Incident Type</div>
                      <div className="text-sm font-medium capitalize">{claimData?.claim.incidentType}</div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="text-xs text-gray-500">Description</div>
                    <div className="text-sm mt-1">{claimData?.claim.description}</div>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Blockchain Record</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="space-y-3">
                    {claimData?.claim.transactionHash ? (
                      <>
                        <div className="flex items-center">
                          <Shield className="h-4 w-4 text-green-600 mr-2" />
                          <div className="text-sm font-medium text-green-700">Blockchain Verified</div>
                        </div>
                        <div className="pt-1">
                          <div className="text-xs text-gray-500 flex items-center">
                            Transaction Hash
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="h-3 w-3 ml-1 text-gray-400 cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="w-[200px] text-xs">
                                    This unique identifier confirms your claim is permanently recorded on the blockchain ledger
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <div className="text-xs font-mono truncate bg-gray-100 p-1 rounded mt-1">{claimData?.claim.transactionHash}</div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 pt-1">
                          <div>
                            <div className="text-xs text-gray-500">Block Number</div>
                            <div className="text-sm font-medium">#{claimData?.claim.blockIndex}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">Timestamp</div>
                            <div className="text-sm">{claimData?.claim.createdAt ? formatDate(claimData.claim.createdAt) : '-'}</div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <div className="text-xs text-gray-500 flex items-center">
                              Consensus Status
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Info className="h-3 w-3 ml-1 text-gray-400 cursor-help" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="w-[200px] text-xs">
                                      Indicates how many nodes in the blockchain network have verified and agreed on this claim record
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                            <div className="text-sm flex items-center">
                              <CheckCircle2 className="h-3 w-3 mr-1 text-green-600" />
                              <span className="text-green-700">Verified (5/5 nodes)</span>
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">Confirmations</div>
                            <div className="text-sm">22</div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="py-4 text-amber-600 flex flex-col items-center space-y-2 bg-amber-50 rounded-lg">
                        <Clock className="h-6 w-6" />
                        <div className="flex flex-col items-center">
                          <span className="font-medium">Pending Blockchain Verification</span>
                          <span className="text-xs text-amber-700 text-center mt-1">
                            This claim is waiting to be mined in the next block
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  {claimData?.claim.blockIndex && (
                    <div className="mt-4 flex">
                      <Button variant="outline" size="sm" className="text-xs flex items-center">
                        <ExternalLink className="h-3 w-3 mr-1" /> View on Explorer
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div>
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-500 mb-2">Evidence & Documentation</h4>
                <div className="space-y-3">
                  {claimData?.claim.evidence?.files ? (
                    claimData.claim.evidence.files.map((file: any, index: number) => (
                      <div key={index} className="bg-gray-50 rounded-lg overflow-hidden">
                        {file.type === 'image' ? (
                          <>
                            <img 
                              src="https://images.unsplash.com/photo-1563341591-ad0a750911cf?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=600&h=350" 
                              alt="Car damage photo" 
                              className="w-full h-auto"
                            />
                            <div className="p-3">
                              <div className="text-sm font-medium">Damage Photo</div>
                              <div className="text-xs text-gray-500">Uploaded {formatDate(file.uploaded)}</div>
                              <div className="mt-2 text-xs flex items-center justify-between">
                                <Badge className="bg-green-100 text-green-800">Verified</Badge>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                  <Download className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="bg-blue-50 p-4 flex items-center">
                              <FileText className="text-blue-500 h-6 w-6 mr-3" />
                              <div>
                                <div className="text-sm font-medium">{file.name}</div>
                                <div className="text-xs text-gray-500">1.2 MB - Uploaded {formatDate(file.uploaded)}</div>
                              </div>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 ml-auto">
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="p-3">
                              <div className="text-xs flex items-center justify-between">
                                <Badge className="bg-green-100 text-green-800">
                                  Verified by {file.verifiedBy}
                                </Badge>
                                <div className="text-gray-500">Report ID: {file.reportId}</div>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-500">
                      No evidence files uploaded yet
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Claim Timeline</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="space-y-4">
                    {claimData?.claim.status === "approved" && (
                      <div className="flex">
                        <div className="flex-shrink-0 h-4 w-4 mt-0.5 rounded-full bg-green-500"></div>
                        <div className="ml-3">
                          <div className="text-sm font-medium">Claim Approved</div>
                          <div className="text-xs text-gray-500">{formatDate(claimData?.claim.createdAt)} - 16:45</div>
                          <div className="text-xs text-gray-600 mt-1">
                            Claim approved by smart contract after verification of all evidence.
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {claimData?.claim.evidence && (
                      <div className="flex">
                        <div className="flex-shrink-0 h-4 w-4 mt-0.5 rounded-full bg-blue-500"></div>
                        <div className="ml-3">
                          <div className="text-sm font-medium">Evidence Verified</div>
                          <div className="text-xs text-gray-500">{formatDate(claimData?.claim.createdAt)} - 14:30</div>
                          <div className="text-xs text-gray-600 mt-1">
                            Documents verified by appropriate authorities on the blockchain.
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {claimData?.claim.evidence && (
                      <div className="flex">
                        <div className="flex-shrink-0 h-4 w-4 mt-0.5 rounded-full bg-blue-500"></div>
                        <div className="ml-3">
                          <div className="text-sm font-medium">Evidence Submitted</div>
                          <div className="text-xs text-gray-500">{formatDate(claimData?.claim.createdAt)} - 10:15</div>
                          <div className="text-xs text-gray-600 mt-1">
                            Photos and documents submitted to blockchain.
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex">
                      <div className="flex-shrink-0 h-4 w-4 mt-0.5 rounded-full bg-blue-500"></div>
                      <div className="ml-3">
                        <div className="text-sm font-medium">Claim Filed</div>
                        <div className="text-xs text-gray-500">{formatDate(claimData?.claim.createdAt)} - 09:30</div>
                        <div className="text-xs text-gray-600 mt-1">
                          Initial claim created on blockchain.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="sm:justify-between border-t border-gray-200 pt-4 gap-4">
          <div className="text-sm text-gray-500 flex items-center">
            <Info className="h-4 w-4 mr-1" /> All claim data is securely stored on the blockchain and cannot be altered.
          </div>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
