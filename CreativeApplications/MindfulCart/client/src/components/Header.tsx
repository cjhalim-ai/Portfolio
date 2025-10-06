import { Bell, Wallet, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";

export default function Header() {
  const { user } = useAuth();
  
  const { data: stats } = useQuery({
    queryKey: ["/api/stats"],
    queryFn: () => api.getStats(),
  });

  const { data: dueReviews } = useQuery({
    queryKey: ["/api/reviews/due"],
    queryFn: () => api.getDueReviews(),
  });

  return (
    <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Wallet className="h-4 w-4 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-semibold text-foreground">MindfulCart</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Money Saved Display */}
            <div className="hidden md:flex items-center space-x-2 bg-secondary/10 px-3 py-1 rounded-full">
              <Wallet className="h-4 w-4 text-secondary" />
              <span className="text-sm font-medium text-secondary" data-testid="total-saved">
                ${stats?.totalSaved?.toFixed(2) || "0.00"} saved
              </span>
            </div>
            
            {/* Notification Bell */}
            <Button
              variant="ghost"
              size="sm"
              className="relative p-2 text-gray-400 hover:text-foreground"
              data-testid="button-notifications"
            >
              <Bell className="h-5 w-5" />
              {dueReviews && dueReviews.length > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full" />
              )}
            </Button>
            
            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full" data-testid="button-user-menu">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.profileImageUrl || undefined} alt={user?.firstName || "User"} />
                    <AvatarFallback>
                      {user?.firstName?.charAt(0) || user?.email?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex flex-col space-y-1 p-2">
                  <p className="text-sm font-medium leading-none" data-testid="text-user-name">
                    {user?.firstName && user?.lastName 
                      ? `${user.firstName} ${user.lastName}`
                      : user?.email || "User"
                    }
                  </p>
                  {user?.email && (
                    <p className="text-xs leading-none text-muted-foreground" data-testid="text-user-email">
                      {user.email}
                    </p>
                  )}
                </div>
                <DropdownMenuItem asChild>
                  <a href="/api/logout" className="w-full" data-testid="link-logout">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
