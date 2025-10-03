import { useState, useEffect, createContext, useContext } from "react";
import { useLocation, Link } from "wouter";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarItem
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  FileText,
  Link2,
  Layers,
  ShieldCheck,
  BookOpen,
  Menu,
  Search,
  Bell,
  Wrench,
  Building2,
  Users
} from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

interface AppLayoutProps {
  children: React.ReactNode;
}

// Create context for selectedPeers
export const PeerContext = createContext<{
  selectedPeers: string[];
  setSelectedPeers: (peers: string[]) => void;
}>({
  selectedPeers: [],
  setSelectedPeers: () => {}
});

const VALID_ORGANIZATIONS = ['rtsa', 'pia', 'zsic', 'zp', 'garage'];

const PEER_MAP: { [key: string]: string } = {
  rtsa: 'peer0.rtsa.insurance-claims.com:7061',
  pia: 'peer0.pia.insurance-claims.com:7081',
  zsic: 'peer0.zsic.insurance-claims.com:7041',
  zp: 'peer0.zp.insurance-claims.com:7101',
  garage: 'peer0.garage.insurance-claims.com:7121'
};

const ORG_ROUTES: { [key: string]: string[] } = {
  rtsa: ['/vehicles', '/claims', '/policies'],
  zp: ['/police', '/claims'],
  garage: ['/garages', '/claims', '/insurer'],
  zsic: ['/policies', '/claims', '/insurer'],
  pia: ['/insurer', '/policies']
};

const AVAILABLE_PEERS = [
  { name: 'peer0.rtsa.insurance-claims.com', url: 'peer0.rtsa.insurance-claims.com:7061' },
  { name: 'peer0.garage.insurance-claims.com', url: 'peer0.garage.insurance-claims.com:7121' },
  { name: 'peer0.pia.insurance-claims.com', url: 'peer0.pia.insurance-claims.com:7081' },
  { name: 'peer0.zsic.insurance-claims.com', url: 'peer0.zsic.insurance-claims.com:7041' },
  { name: 'peer0.zp.insurance-claims.com', url: 'peer0.zp.insurance-claims.com:7101' }
];

function OrgSelectorModal({ onClose, setSelectedOrg, selectedPeers, setSelectedPeers }: {
  onClose: () => void;
  setSelectedOrg: (org: string) => void;
  selectedPeers: string[];
  setSelectedPeers: (peers: string[]) => void;
}) {
  const [tempOrg, setTempOrg] = useState('rtsa');

  const mutation = useMutation({
    mutationFn: async (org: string) => {
      const response = await fetch('/api/set-org', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ org }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to set organization');
      }
      return response.json();
    },
    onSuccess: (data, org) => {
      console.log(`Organization set to ${org}:`, data.message);
      setSelectedOrg(org);
      setTempOrg(org);
      localStorage.setItem('selectedOrg', org);
      onClose();
    },
    onError: (error: any) => {
      console.error('Error setting organization:', error.message);
    },
  });

  useEffect(() => {
    const storedOrg = localStorage.getItem('selectedOrg');
    if (storedOrg && VALID_ORGANIZATIONS.includes(storedOrg)) {
      setTempOrg(storedOrg);
    }
  }, []);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white rounded-lg shadow-lg p-6 transition-all duration-300">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-gray-900">Select Organization</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <Select
            value={tempOrg}
            onValueChange={(value) => {
              mutation.mutate(value);
            }}
            disabled={mutation.isLoading}
          >
            <SelectTrigger className="w-full h-9 bg-white border-gray-300 rounded-md shadow-sm text-sm focus:ring-2 focus:ring-blue-500 transition-all duration-200">
              <SelectValue placeholder="Select Organization" />
            </SelectTrigger>
            <SelectContent className="bg-white border-gray-200 shadow-lg rounded-md max-h-60 overflow-y-auto">
              {VALID_ORGANIZATIONS.map((org) => (
                <SelectItem
                  key={org}
                  value={org}
                  className="text-sm text-gray-900 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200"
                >
                  {org.toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="mt-4 p-4 bg-gray-50 rounded-md">
            <p className="text-sm font-medium text-gray-700">Acting as Peer:</p>
            <p className="text-sm text-gray-900">{PEER_MAP[tempOrg]}</p>
          </div>
          <div className="mt-4 p-4 bg-gray-50 rounded-md">
            <p className="text-sm font-medium text-gray-700">Select Peers for Transactions:</p>
            {AVAILABLE_PEERS.map((peer) => (
              <div key={peer.name} className="flex items-center space-x-2 mt-2">
                <Checkbox
                  id={peer.name}
                  checked={selectedPeers.includes(peer.name)}
                  onCheckedChange={(checked) => {
                    const newPeers = checked
                      ? [...selectedPeers, peer.name]
                      : selectedPeers.filter((p) => p !== peer.name);
                    setSelectedPeers(newPeers);
                    localStorage.setItem('selectedPeers', JSON.stringify(newPeers));
                  }}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
                <label htmlFor={peer.name} className="text-sm text-gray-900">
                  {peer.name}
                </label>
              </div>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            className="h-9 text-sm border-gray-300 rounded-md shadow-sm hover:bg-gray-100 transition-all duration-200"
            onClick={onClose}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface SidebarComponentProps {
  currentPath: string;
  selectedOrg: string;
  setSelectedOrg: (org: string) => void;
  onItemClick?: () => void;
}

function SidebarComponent({ currentPath, selectedOrg, setSelectedOrg, onItemClick }: SidebarComponentProps) {
  const { setSelectedPeers } = useContext(PeerContext);
  const [isOrgModalOpen, setIsOrgModalOpen] = useState(false);

  const { data: initialOrg, isLoading } = useQuery({
    queryKey: ['currentOrg'],
    queryFn: async () => {
      const response = await fetch('/api/get-org');
      if (!response.ok) {
        throw new Error('Failed to fetch current organization');
      }
      const data = await response.json();
      return data.org;
    },
    onSuccess: (org) => {
      setSelectedOrg(org);
      localStorage.setItem('selectedOrg', org);
    },
    onError: (error: any) => {
      console.error('Error fetching current organization:', error.message);
    },
  });

  const sidebarItems = [
    { path: '/vehicles', label: 'Vehicles', icon: Layers, restrictedTo: ['rtsa'] },
    { path: '/claims', label: 'Claims', icon: FileText },
    { path: '/policies', label: 'Policies', icon: ShieldCheck },
    { path: '/garages', label: 'Garage Panel', icon: Wrench },
    { path: '/insurer', label: 'Insurance Panel', icon: Building2 },
    { path: '/police', label: 'Zambia Police', icon: Link2 },
  ];

  const visibleItems = sidebarItems.filter(item =>
    !item.restrictedTo || item.restrictedTo.includes(selectedOrg)
  );

  return (
    <>
      <Sidebar className="h-full !bg-primary-950 text-white">
        <SidebarHeader className="!bg-primary-950 text-white">
          <div className="flex items-center space-x-2">
            <Link2 className="h-6 w-6 text-white" />
            <span className="text-xl font-semibold text-white">BlockInsure</span>
          </div>
          <div className="text-xs text-gray-400 mt-1">Motor Vehicle Insurance</div>
        </SidebarHeader>
        <SidebarContent className="!bg-primary-950 text-white">
          {visibleItems.map((item) => (
            <div key={item.path} onClick={onItemClick}>
              <Link href={item.path}>
                <SidebarItem active={currentPath === item.path} className="text-white">
                  <item.icon className="h-5 w-5 text-white" />
                  <span>{item.label}</span>
                </SidebarItem>
              </Link>
            </div>
          ))}
          <div onClick={() => setIsOrgModalOpen(true)}>
            <SidebarItem active={false} className="text-white">
              <Users className="h-5 w-5 text-white" />
              <span>Select Organization</span>
            </SidebarItem>
          </div>
        </SidebarContent>
        <SidebarFooter className="!bg-primary-950 text-gray-300">
          <div className="flex flex-col space-y-2 text-sm">
            <div className="flex items-center space-x-2">
              <div className="h-5 w-5 flex items-center justify-center">
                <BookOpen className="h-4 w-4 text-gray-300" />
              </div>
              <span>POC v1.0</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-5 w-5 flex items-center justify-center">
                <Users className="h-4 w-4 text-gray-300" />
              </div>
              <span>Acting as: {isLoading ? 'Loading...' : PEER_MAP[selectedOrg]}</span>
            </div>
          </div>
        </SidebarFooter>
      </Sidebar>
      {isOrgModalOpen && (
        <OrgSelectorModal
          onClose={() => setIsOrgModalOpen(false)}
          setSelectedOrg={setSelectedOrg}
          selectedPeers={useContext(PeerContext).selectedPeers}
          setSelectedPeers={setSelectedPeers}
        />
      )}
    </>
  );
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState('rtsa');
  const [selectedPeers, setSelectedPeers] = useState<string[]>([]);

  useEffect(() => {
    const storedOrg = localStorage.getItem('selectedOrg');
    if (storedOrg && VALID_ORGANIZATIONS.includes(storedOrg)) {
      setSelectedOrg(storedOrg);
    }
    const storedPeers = localStorage.getItem('selectedPeers');
    if (storedPeers) {
      try {
        const parsedPeers = JSON.parse(storedPeers);
        if (Array.isArray(parsedPeers)) {
          setSelectedPeers(parsedPeers);
        }
      } catch (error) {
        console.error('Error parsing stored peers:', error);
      }
    }
  }, []);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(prev => !prev);
  };

  return (
    <PeerContext.Provider value={{ selectedPeers, setSelectedPeers }}>
      <div className="flex h-screen overflow-hidden">
        <div className="hidden md:flex md:flex-col w-64 bg-primary-950 text-white">
          <SidebarComponent
            currentPath={location}
            selectedOrg={selectedOrg}
            setSelectedOrg={setSelectedOrg}
          />
        </div>
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="bg-white border-b border-gray-200 shadow-sm">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center md:hidden">
                <button
                  type="button"
                  className="text-gray-600 hover:text-gray-900"
                  onClick={toggleMobileMenu}
                >
                  <Menu className="h-6 w-6" />
                </button>
                <span className="ml-2 text-lg font-semibold">BlockInsure</span>
              </div>
              <div className="flex-1 flex justify-center px-2 lg:ml-6 lg:justify-end">
                <div className="max-w-lg w-full">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Search claims, policies, or blocks..."
                      type="search"
                    />
                  </div>
                </div>
              </div>
              <div className="ml-4 flex items-center md:ml-6 space-x-2">
                <button type="button" className="p-1 rounded-full text-gray-400 hover:text-gray-500">
                  <Bell className="h-6 w-6" />
                </button>
                <span className="text-sm font-semibold text-gray-900 bg-gray-100 px-3 py-1 rounded-md">
                  Peer: {PEER_MAP[selectedOrg]}
                </span>
              </div>
            </div>
          </header>
          {mobileMenuOpen && (
            <div className="md:hidden fixed inset-0 z-40 flex">
              <div
                className="fixed inset-0 bg-gray-600 bg-opacity-75"
                onClick={toggleMobileMenu}
              ></div>
              <div className="relative flex-1 flex flex-col max-w-xs w-full bg-primary-950 text-white z-50">
                <div className="pt-5 pb-4">
                  <SidebarComponent
                    currentPath={location}
                    selectedOrg={selectedOrg}
                    setSelectedOrg={setSelectedOrg}
                    onItemClick={toggleMobileMenu}
                  />
                </div>
              </div>
            </div>
          )}
          <main className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </PeerContext.Provider>
  );
}