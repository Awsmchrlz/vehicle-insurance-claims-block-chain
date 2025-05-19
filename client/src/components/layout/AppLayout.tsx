import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Sidebar, SidebarHeader, SidebarContent, SidebarFooter, SidebarItem } from "@/components/ui/sidebar";
import { 
  LayoutDashboard, 
  FileText, 
  Link2, 
  Layers, 
  ShieldCheck,
  BookOpen,
  Menu,
  Search,
  Bell
} from "lucide-react";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(prev => !prev);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar (hidden on mobile) */}
      <div className="hidden md:flex md:flex-col w-64 bg-primary-950 text-white">
        <SidebarComponent currentPath={location} />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top navbar */}
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
            <div className="ml-4 flex items-center md:ml-6">
              <button type="button" className="p-1 rounded-full text-gray-400 hover:text-gray-500">
                <Bell className="h-6 w-6" />
              </button>
              <div className="ml-3 relative">
                <div className="flex items-center">
                  <button type="button" className="max-w-xs flex items-center text-sm rounded-full focus:outline-none">
                    <img 
                      className="h-8 w-8 rounded-full" 
                      src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" 
                      alt="User Avatar" 
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700 hidden md:block">Admin User</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-40 flex">
            {/* Overlay */}
            <div 
              className="fixed inset-0 bg-gray-600 bg-opacity-75"
              onClick={toggleMobileMenu}
            ></div>
            
            {/* Menu */}
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-primary-950 z-50">
              <div className="pt-5 pb-4">
                <SidebarComponent currentPath={location} onItemClick={toggleMobileMenu} />
              </div>
            </div>
          </div>
        )}

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

interface SidebarComponentProps {
  currentPath: string;
  onItemClick?: () => void;
}

function SidebarComponent({ currentPath, onItemClick }: SidebarComponentProps) {
  return (
    <Sidebar className="h-full">
      <SidebarHeader>
        <div className="flex items-center space-x-2">
          <Link2 className="h-6 w-6" />
          <span className="text-xl font-semibold">BlockInsure</span>
        </div>
        <div className="text-xs text-gray-400 mt-1">Motor Vehicle Insurance POC</div>
      </SidebarHeader>
      <SidebarContent>
        <Link href="/" onClick={onItemClick}>
          <SidebarItem active={currentPath === "/"}>
            <LayoutDashboard className="h-5 w-5" />
            <span>Dashboard</span>
          </SidebarItem>
        </Link>
        <Link href="/claims" onClick={onItemClick}>
          <SidebarItem active={currentPath === "/claims"}>
            <FileText className="h-5 w-5" />
            <span>Claims</span>
          </SidebarItem>
        </Link>
        <Link href="/blockchain" onClick={onItemClick}>
          <SidebarItem active={currentPath === "/blockchain"}>
            <Link2 className="h-5 w-5" />
            <span>Blockchain</span>
          </SidebarItem>
        </Link>
        <Link href="/explorer" onClick={onItemClick}>
          <SidebarItem active={currentPath === "/explorer"}>
            <Layers className="h-5 w-5" />
            <span>Explorer</span>
          </SidebarItem>
        </Link>
        <Link href="/policies" onClick={onItemClick}>
          <SidebarItem active={currentPath === "/policies"}>
            <ShieldCheck className="h-5 w-5" />
            <span>Policies</span>
          </SidebarItem>
        </Link>
        <Link href="/references" onClick={onItemClick}>
          <SidebarItem active={currentPath === "/references"}>
            <BookOpen className="h-5 w-5" />
            <span>Academic References</span>
          </SidebarItem>
        </Link>
      </SidebarContent>
      <SidebarFooter>
        <div className="flex items-center space-x-2 text-sm text-gray-400">
          <div className="h-5 w-5 flex items-center justify-center">
            <BookOpen className="h-4 w-4" />
          </div>
          <span>Academic Project POC v1.0</span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
