import { Trophy, Heart, Coins } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { api, type ItemWithProgress } from "@/lib/api";
import Header from "@/components/Header";
import FolderSidebar from "@/components/FolderSidebar";
import { formatDistanceToNow } from "date-fns";

export default function Archive() {
  const { data: archivedItems, isLoading } = useQuery({
    queryKey: ["/api/items", undefined, true],
    queryFn: () => api.getItems(undefined, true),
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/stats"],
    queryFn: () => api.getStats(),
  });

  const { data: achievements } = useQuery({
    queryKey: ["/api/achievements"],
    queryFn: () => api.getAchievements(),
  });

  const totalSaved = archivedItems?.reduce((sum, item) => sum + Number(item.price), 0) || 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
              ))}
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
          <FolderSidebar selectedFolderId={undefined} onFolderSelect={() => {}} />
          
          <div className="lg:col-span-3">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="text-archive-title">
                🎉 Your Mindful Achievements
              </h1>
              <p className="text-gray-600" data-testid="text-archive-description">
                Celebrate your thoughtful decisions and sustainable consumption choices!
              </p>
            </div>

            {/* Achievement Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center space-x-2 text-secondary">
                    <Coins className="h-5 w-5" />
                    <span>Money Saved</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground" data-testid="text-money-saved">
                    ${totalSaved.toFixed(2)}
                  </div>
                  <p className="text-sm text-gray-600">Through mindful decisions</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center space-x-2 text-primary">
                    <Trophy className="h-5 w-5" />
                    <span>Items Archived</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground" data-testid="text-items-archived">
                    {archivedItems?.length || 0}
                  </div>
                  <p className="text-sm text-gray-600">Thoughtful choices made</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center space-x-2 text-accent">
                    <Heart className="h-5 w-5" />
                    <span>Sustainability Score</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">95%</div>
                  <p className="text-sm text-gray-600">Mindful consumption</p>
                </CardContent>
              </Card>
            </div>

            {/* Celebration Message */}
            <div className="bg-gradient-to-r from-secondary/20 via-primary/20 to-accent/20 rounded-2xl p-8 mb-8">
              <div className="text-center">
                <div className="text-6xl mb-4">🌟</div>
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  Amazing Work on Mindful Shopping!
                </h2>
                <p className="text-gray-700 text-lg max-w-2xl mx-auto">
                  Your thoughtful approach to consumption is making a real difference. Every item you've 
                  chosen not to purchase represents a mindful decision that aligns with your values and goals.
                </p>
              </div>
            </div>

            {/* Archived Items */}
            {archivedItems && archivedItems.length > 0 ? (
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-6" data-testid="text-archived-items-title">
                  Your Mindful Decisions ({archivedItems.length} items)
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6" data-testid="grid-archived-items">
                  {archivedItems.map((item: ItemWithProgress) => (
                    <Card key={item.id} className="hover:shadow-md transition-shadow" data-testid={`card-archived-${item.id}`}>
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-foreground mb-1" data-testid={`text-archived-name-${item.id}`}>
                              {item.name}
                            </h3>
                            {item.description && (
                              <p className="text-sm text-gray-600">{item.description}</p>
                            )}
                          </div>
                          <div className="ml-3 text-right">
                            <span className="text-lg font-bold text-secondary" data-testid={`text-archived-price-${item.id}`}>
                              ${Number(item.price).toFixed(2)}
                            </span>
                            <div className="text-xs text-secondary">saved</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-xs text-gray-500 mb-3">
                          <span>Added {formatDistanceToNow(new Date(item.createdAt))} ago</span>
                          {item.archivedAt && (
                            <span>Archived {formatDistanceToNow(new Date(item.archivedAt))} ago</span>
                          )}
                        </div>
                        
                        {item.archivedReason && (
                          <div className="bg-gray-50 rounded-lg p-3 mb-3">
                            <div className="text-xs font-medium text-gray-600 mb-1">Reason for archiving:</div>
                            <div className="text-sm text-gray-700">{item.archivedReason}</div>
                          </div>
                        )}
                        
                        <Badge variant="secondary" className="bg-secondary/10 text-secondary border-secondary/20">
                          💡 Mindful Decision
                        </Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📱</div>
                <h3 className="text-lg font-medium text-foreground mb-2">No archived items yet</h3>
                <p className="text-gray-600">
                  As you practice mindful shopping, your archived items will appear here as achievements!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
