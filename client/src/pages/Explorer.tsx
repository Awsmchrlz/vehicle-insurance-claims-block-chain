import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import BlockDetailsModal from "@/components/modals/BlockDetailsModal";
import { formatDate, shortenHash } from "@/lib/utils";
import { Loader2, Search, FileText, AlertCircle, Hash } from "lucide-react";

export default function Explorer() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState("block");
  const [selectedBlockIndex, setSelectedBlockIndex] = useState<number | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<any | null>(null);

  // Fetch blocks for display
  const { data: blocksData, isLoading: blocksLoading } = useQuery({
    queryKey: ['/api/blockchain'],
  });

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setSearchError("Please enter a search term");
      return;
    }

    setSearchError(null);
    setSearchResults(null);

    if (searchType === "block") {
      // Handle search by block index or hash
      const isNumeric = !isNaN(parseInt(searchQuery));
      
      if (isNumeric) {
        // Search by block index
        fetch(`/api/blocks/${searchQuery}`)
          .then(res => {
            if (!res.ok) throw new Error("Block not found");
            return res.json();
          })
          .then(data => {
            setSearchResults(data.block);
          })
          .catch(err => {
            setSearchError(err.message);
          });
      } else {
        // Search by block hash
        fetch(`/api/blocks/hash/${searchQuery}`)
          .then(res => {
            if (!res.ok) throw new Error("Block not found");
            return res.json();
          })
          .then(data => {
            setSearchResults(data.block);
          })
          .catch(err => {
            setSearchError(err.message);
          });
      }
    } else if (searchType === "claim") {
      // Search by claim ID
      fetch(`/api/claims/${searchQuery}`)
        .then(res => {
          if (!res.ok) throw new Error("Claim not found");
          return res.json();
        })
        .then(data => {
          setSearchResults(data.claim);
        })
        .catch(err => {
          setSearchError(err.message);
        });
    } else if (searchType === "policy") {
      // Search by policy ID
      fetch(`/api/policies/${searchQuery}`)
        .then(res => {
          if (!res.ok) throw new Error("Policy not found");
          return res.json();
        })
        .then(data => {
          setSearchResults(data.policy);
        })
        .catch(err => {
          setSearchError(err.message);
        });
    }
  };

  const handleOpenBlockDetails = (index: number) => {
    setSelectedBlockIndex(index);
  };

  const handleCloseBlockDetails = () => {
    setSelectedBlockIndex(null);
  };

  return (
    <div>
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Blockchain Explorer</h1>
        <p className="mt-1 text-sm text-gray-600">
          Search and explore blocks, claims, and policies on the blockchain
        </p>
      </div>

      {/* Search section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Search Blockchain</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <div className="flex-1">
              <Input
                placeholder="Search by block index, hash, claim ID, or policy ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <Tabs
              defaultValue="block"
              value={searchType}
              onValueChange={setSearchType}
              className="w-auto"
            >
              <TabsList>
                <TabsTrigger value="block">Block</TabsTrigger>
                <TabsTrigger value="claim">Claim</TabsTrigger>
                <TabsTrigger value="policy">Policy</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button onClick={handleSearch}>
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>

          {searchError && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{searchError}</AlertDescription>
            </Alert>
          )}

          {searchResults && (
            <div className="mt-4 p-4 border rounded-md bg-gray-50">
              <h3 className="text-lg font-medium mb-2">Search Results</h3>
              
              {searchType === "block" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-white rounded-md border">
                    <p className="text-sm font-medium text-gray-500">Block Height</p>
                    <p className="font-mono text-sm">{searchResults.index}</p>
                  </div>
                  <div className="p-3 bg-white rounded-md border">
                    <p className="text-sm font-medium text-gray-500">Timestamp</p>
                    <p className="text-sm">{formatDate(searchResults.timestamp)}</p>
                  </div>
                  <div className="p-3 bg-white rounded-md border">
                    <p className="text-sm font-medium text-gray-500">Hash</p>
                    <p className="font-mono text-xs truncate">{searchResults.hash}</p>
                  </div>
                  <div className="p-3 bg-white rounded-md border">
                    <p className="text-sm font-medium text-gray-500">Previous Hash</p>
                    <p className="font-mono text-xs truncate">
                      {searchResults.index === 0 ? 'Genesis' : searchResults.previousHash}
                    </p>
                  </div>
                  <div className="p-3 bg-white rounded-md border md:col-span-2">
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-medium text-gray-500">Transactions</p>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        {searchResults.data.transactions?.length || 0} transactions
                      </span>
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <Button
                      variant="outline"
                      onClick={() => handleOpenBlockDetails(searchResults.index)}
                      className="w-full"
                    >
                      View Block Details
                    </Button>
                  </div>
                </div>
              )}

              {searchType === "claim" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-white rounded-md border">
                    <p className="text-sm font-medium text-gray-500">Claim ID</p>
                    <p className="font-medium text-blue-600">{searchResults.claimId}</p>
                  </div>
                  <div className="p-3 bg-white rounded-md border">
                    <p className="text-sm font-medium text-gray-500">Policy ID</p>
                    <p className="text-sm">{searchResults.policyId}</p>
                  </div>
                  <div className="p-3 bg-white rounded-md border">
                    <p className="text-sm font-medium text-gray-500">Vehicle ID</p>
                    <p className="text-sm">{searchResults.vehicleId}</p>
                  </div>
                  <div className="p-3 bg-white rounded-md border">
                    <p className="text-sm font-medium text-gray-500">Incident Date</p>
                    <p className="text-sm">{formatDate(searchResults.incidentDate)}</p>
                  </div>
                  <div className="p-3 bg-white rounded-md border">
                    <p className="text-sm font-medium text-gray-500">Status</p>
                    <p className="text-sm capitalize">{searchResults.status.replace("_", " ")}</p>
                  </div>
                  <div className="p-3 bg-white rounded-md border">
                    <p className="text-sm font-medium text-gray-500">Block Reference</p>
                    <p className="text-sm">
                      {searchResults.blockIndex 
                        ? `Block #${searchResults.blockIndex}`
                        : "Not yet on blockchain"
                      }
                    </p>
                  </div>
                </div>
              )}

              {searchType === "policy" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-white rounded-md border">
                    <p className="text-sm font-medium text-gray-500">Policy ID</p>
                    <p className="font-medium text-blue-600">{searchResults.policyId}</p>
                  </div>
                  <div className="p-3 bg-white rounded-md border">
                    <p className="text-sm font-medium text-gray-500">Vehicle ID</p>
                    <p className="text-sm">{searchResults.vehicleId}</p>
                  </div>
                  <div className="p-3 bg-white rounded-md border">
                    <p className="text-sm font-medium text-gray-500">Coverage Type</p>
                    <p className="text-sm capitalize">{searchResults.coverageType}</p>
                  </div>
                  <div className="p-3 bg-white rounded-md border">
                    <p className="text-sm font-medium text-gray-500">Premium</p>
                    <p className="text-sm">ZMW {searchResults.premium.toLocaleString()}</p>
                  </div>
                  <div className="p-3 bg-white rounded-md border">
                    <p className="text-sm font-medium text-gray-500">Start Date</p>
                    <p className="text-sm">{formatDate(searchResults.startDate)}</p>
                  </div>
                  <div className="p-3 bg-white rounded-md border">
                    <p className="text-sm font-medium text-gray-500">End Date</p>
                    <p className="text-sm">{formatDate(searchResults.endDate)}</p>
                  </div>
                  <div className="p-3 bg-white rounded-md border">
                    <p className="text-sm font-medium text-gray-500">Status</p>
                    <p className="text-sm capitalize">{searchResults.status}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent blocks section */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Blocks</CardTitle>
        </CardHeader>
        <CardContent>
          {blocksLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {blocksData?.blocks.slice(0, 6).map((block: any) => (
                <Card 
                  key={block.hash} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleOpenBlockDetails(block.index)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Block #{block.index}</p>
                        <p className="text-xs text-gray-400">{formatDate(block.timestamp)}</p>
                      </div>
                      <div className="bg-blue-100 h-10 w-10 rounded-lg flex items-center justify-center text-blue-600">
                        <Hash className="h-5 w-5" />
                      </div>
                    </div>
                    <div className="mt-3">
                      <p className="text-xs font-medium text-gray-500">Hash</p>
                      <p className="font-mono text-xs truncate text-gray-700">{shortenHash(block.hash)}</p>
                    </div>
                    <div className="mt-2">
                      <p className="text-xs font-medium text-gray-500">Transactions</p>
                      <div className="flex items-center space-x-1">
                        <FileText className="h-3 w-3 text-gray-500" />
                        <p className="text-xs text-gray-700">
                          {block.data.transactions?.length || 0} transactions
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          
          <div className="mt-6 text-center">
            <Button variant="outline" asChild>
              <a href="/blockchain">View All Blocks</a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      {selectedBlockIndex !== null && (
        <BlockDetailsModal 
          blockIndex={selectedBlockIndex}
          isOpen={selectedBlockIndex !== null}
          onClose={handleCloseBlockDetails}
        />
      )}
    </div>
  );
}
