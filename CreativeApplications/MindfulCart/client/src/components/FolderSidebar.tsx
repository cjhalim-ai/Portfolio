import { useState } from "react";
import { Plus, Folder, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type FolderWithCount } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";

interface FolderSidebarProps {
  selectedFolderId?: string;
  onFolderSelect: (folderId?: string) => void;
}

export default function FolderSidebar({ selectedFolderId, onFolderSelect }: FolderSidebarProps) {
  const [location] = useLocation();
  const [isAddFolderOpen, setIsAddFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: folders, isLoading } = useQuery({
    queryKey: ["/api/folders"],
    queryFn: () => api.getFolders(),
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/stats"],
    queryFn: () => api.getStats(),
  });

  const createFolderMutation = useMutation({
    mutationFn: (name: string) => api.createFolder({ name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/folders"] });
      setIsAddFolderOpen(false);
      setNewFolderName("");
      toast({
        title: "Folder created",
        description: "Your new folder has been created successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create folder. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      createFolderMutation.mutate(newFolderName.trim());
    }
  };

  if (isLoading) {
    return (
      <div className="lg:col-span-1">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded"></div>
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-8 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="lg:col-span-1">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-foreground">Folders</h2>
          <Dialog open={isAddFolderOpen} onOpenChange={setIsAddFolderOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center hover:bg-primary/90"
                data-testid="button-add-folder"
              >
                <Plus className="h-4 w-4 text-primary-foreground" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Folder</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Folder name"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
                  data-testid="input-folder-name"
                />
                <div className="flex space-x-2">
                  <Button
                    onClick={handleCreateFolder}
                    disabled={!newFolderName.trim() || createFolderMutation.isPending}
                    data-testid="button-create-folder"
                  >
                    Create
                  </Button>
                  <Button variant="outline" onClick={() => setIsAddFolderOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        {/* Navigation Links */}
        <div className="space-y-2 mb-4">
          <Link href="/">
            <button
              className={`w-full group flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors ${
                location === "/" ? "bg-primary/10 text-primary" : "text-foreground"
              }`}
              data-testid="link-dashboard"
            >
              <Folder className="h-4 w-4" />
              <span className="text-sm font-medium flex-1 text-left">Dashboard</span>
            </button>
          </Link>
          
          <Link href="/archive">
            <button
              className={`w-full group flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors ${
                location === "/archive" ? "bg-primary/10 text-primary" : "text-foreground"
              }`}
              data-testid="link-archive"
            >
              <Archive className="h-4 w-4" />
              <span className="text-sm font-medium flex-1 text-left">Archive</span>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                {stats?.archivedItems || 0}
              </span>
            </button>
          </Link>
        </div>

        <hr className="my-4 border-gray-100" />
        
        {/* All Items Option */}
        <button
          onClick={() => onFolderSelect(undefined)}
          className={`w-full group flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors mb-2 ${
            !selectedFolderId ? "bg-primary/10 text-primary" : "text-foreground"
          }`}
          data-testid="button-all-items"
        >
          <Folder className="h-4 w-4" />
          <span className="text-sm font-medium flex-1 text-left">All Items</span>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            {stats?.activeItems || 0}
          </span>
        </button>

        {/* Folder List */}
        <div className="space-y-2">
          {folders?.map((folder: FolderWithCount) => (
            <button
              key={folder.id}
              onClick={() => onFolderSelect(folder.id)}
              className={`w-full group flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors ${
                selectedFolderId === folder.id ? "bg-primary/10 text-primary" : "text-foreground"
              }`}
              data-testid={`button-folder-${folder.id}`}
            >
              <Folder className="h-4 w-4" style={{ color: folder.color || "#6366F1" }} />
              <span className="text-sm font-medium flex-1 text-left">{folder.name}</span>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                {folder.itemCount}
              </span>
            </button>
          ))}
        </div>
        
        <hr className="my-4 border-gray-100" />
        
        {/* Quick Stats */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Active Items</span>
            <span className="font-semibold text-foreground" data-testid="text-active-items">
              {stats?.activeItems || 0}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Due for Review</span>
            <span className="font-semibold text-warning" data-testid="text-due-review">
              {stats?.dueReview || 0}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Archived Items</span>
            <span className="font-semibold text-secondary" data-testid="text-archived-items">
              {stats?.archivedItems || 0}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
