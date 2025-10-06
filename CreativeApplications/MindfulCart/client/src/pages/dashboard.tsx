import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { api, type ItemWithProgress, type ReviewWithItem } from "@/lib/api";
import Header from "@/components/Header";
import FolderSidebar from "@/components/FolderSidebar";
import ItemCard from "@/components/ItemCard";
import AddItemModal from "@/components/AddItemModal";
import EditItemModal from "@/components/EditItemModal";
import QuestionnaireModal from "@/components/QuestionnaireModal";
import { Lightbulb } from "lucide-react";

export default function Dashboard() {
  const [selectedFolderId, setSelectedFolderId] = useState<string | undefined>();
  const [showAllItems, setShowAllItems] = useState(true);
  const [showDueReview, setShowDueReview] = useState(false);
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [isEditItemModalOpen, setIsEditItemModalOpen] = useState(false);
  const [selectedItemForEdit, setSelectedItemForEdit] = useState<ItemWithProgress | null>(null);
  const [isQuestionnaireModalOpen, setIsQuestionnaireModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<ReviewWithItem | null>(null);

  const { data: items, isLoading: itemsLoading } = useQuery({
    queryKey: ["/api/items", selectedFolderId, false],
    queryFn: () => api.getItems(selectedFolderId, false),
  });

  const { data: dueReviews } = useQuery({
    queryKey: ["/api/reviews/due"],
    queryFn: () => api.getDueReviews(),
  });

  const { data: folder } = useQuery({
    queryKey: ["/api/folders", selectedFolderId],
    queryFn: () => selectedFolderId ? api.getItem(selectedFolderId) : null,
    enabled: !!selectedFolderId,
  });

  const { data: folders } = useQuery({
    queryKey: ["/api/folders"],
    queryFn: () => api.getFolders(),
  });

  const filteredItems = items?.filter((item: ItemWithProgress) => {
    if (showDueReview) {
      return item.isDueForReview;
    }
    return true;
  }) || [];

  const selectedFolder = folders?.find(f => f.id === selectedFolderId);
  const folderName = selectedFolder?.name || "All Items";
  const itemCount = filteredItems.length;

  const handleReviewItem = (item: ItemWithProgress) => {
    const review = dueReviews?.find(r => r.itemId === item.id);
    if (review) {
      setSelectedReview(review);
      setIsQuestionnaireModalOpen(true);
    }
  };

  const handleEditItem = (item: ItemWithProgress) => {
    setSelectedItemForEdit(item);
    setIsEditItemModalOpen(true);
  };

  if (itemsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded mb-6"></div>
                <div className="space-y-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-8 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </div>
            </div>
            <div className="lg:col-span-3">
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded mb-6"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-64 bg-gray-200 rounded-xl"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <FolderSidebar 
            selectedFolderId={selectedFolderId} 
            onFolderSelect={setSelectedFolderId} 
          />
          
          <div className="lg:col-span-3">
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground" data-testid="text-page-title">
                  {folderName}
                </h2>
                <p className="text-gray-600 text-sm mt-1" data-testid="text-item-count">
                  {itemCount} items waiting for your thoughtful consideration
                </p>
              </div>
              
              <div className="flex items-center space-x-3">
                {/* Filter Toggle */}
                <div className="flex items-center space-x-2 bg-white rounded-lg border border-gray-200 p-1">
                  <Button
                    variant={showAllItems && !showDueReview ? "default" : "ghost"}
                    size="sm"
                    onClick={() => {
                      setShowAllItems(true);
                      setShowDueReview(false);
                    }}
                    className="text-sm font-medium"
                    data-testid="button-filter-all"
                  >
                    All Items
                  </Button>
                  <Button
                    variant={showDueReview ? "default" : "ghost"}
                    size="sm"
                    onClick={() => {
                      setShowAllItems(false);
                      setShowDueReview(true);
                    }}
                    className="text-sm font-medium"
                    data-testid="button-filter-due"
                  >
                    Due Review
                  </Button>
                </div>
                
                <Button
                  onClick={() => setIsAddItemModalOpen(true)}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  data-testid="button-add-item"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>
            </div>

            {/* Items Grid */}
            {filteredItems.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plus className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">No items yet</h3>
                <p className="text-gray-600 mb-4">
                  {showDueReview 
                    ? "No items are due for review right now."
                    : "Start your mindful shopping journey by adding your first item."}
                </p>
                {!showDueReview && (
                  <Button
                    onClick={() => setIsAddItemModalOpen(true)}
                    data-testid="button-add-first-item"
                  >
                    Add Your First Item
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6" data-testid="grid-items">
                {filteredItems.map((item: ItemWithProgress) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    onEdit={() => handleEditItem(item)}
                    onReview={() => handleReviewItem(item)}
                  />
                ))}
              </div>
            )}

            {/* Mindfulness Insight */}
            {filteredItems.length > 0 && (
              <div className="mt-8 bg-gradient-to-r from-secondary/10 to-primary/10 rounded-xl p-6 border border-secondary/20">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center flex-shrink-0">
                    <Lightbulb className="h-5 w-5 text-secondary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">✨ Mindful Moment</h3>
                    <p className="text-sm text-gray-700 mb-3">
                      You're building a thoughtful approach to shopping. Each item you add represents an intentional 
                      decision to pause and reflect before purchasing. Keep up the mindful practice!
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-secondary hover:text-secondary/80 p-0 h-auto"
                      data-testid="button-view-achievements"
                    >
                      View your achievements →
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <AddItemModal 
        isOpen={isAddItemModalOpen} 
        onClose={() => setIsAddItemModalOpen(false)} 
      />

      {selectedItemForEdit && (
        <EditItemModal
          isOpen={isEditItemModalOpen}
          onClose={() => {
            setIsEditItemModalOpen(false);
            setSelectedItemForEdit(null);
          }}
          item={selectedItemForEdit}
        />
      )}
      
      <QuestionnaireModal
        isOpen={isQuestionnaireModalOpen}
        onClose={() => {
          setIsQuestionnaireModalOpen(false);
          setSelectedReview(null);
        }}
        review={selectedReview}
      />
    </div>
  );
}
