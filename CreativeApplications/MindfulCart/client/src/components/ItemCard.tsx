import { ExternalLink, Edit, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { type ItemWithProgress } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";

interface ItemCardProps {
  item: ItemWithProgress;
  onEdit: () => void;
  onReview: () => void;
}

export default function ItemCard({ item, onEdit, onReview }: ItemCardProps) {
  const priceChange = item.priceHistory && item.priceHistory.length > 1 
    ? item.priceHistory[item.priceHistory.length - 1].price - item.priceHistory[0].price
    : 0;

  const getStatusIndicator = () => {
    if (item.isDueForReview) {
      return <span className="status-indicator status-due" />;
    }
    return <span className="status-indicator status-on-track" />;
  };

  const getStatusText = () => {
    if (item.isDueForReview) {
      return "Due Review";
    }
    return "On Track";
  };

  const getStatusTextColor = () => {
    if (item.isDueForReview) {
      return "text-warning";
    }
    return "text-secondary";
  };

  return (
    <div className="mindful-card" data-testid={`card-item-${item.id}`}>
      <div className="p-6">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-foreground mb-1" data-testid={`text-item-name-${item.id}`}>
              {item.name}
            </h3>
            {item.description && (
              <p className="text-sm text-gray-600" data-testid={`text-item-description-${item.id}`}>
                {item.description}
              </p>
            )}
          </div>
          <div className="ml-3 flex flex-col items-end">
            <span className="text-lg font-bold text-foreground" data-testid={`text-item-price-${item.id}`}>
              ${Number(item.currentPrice || item.price).toFixed(2)}
            </span>
            {priceChange !== 0 && (
              <div className="flex items-center space-x-1 mt-1">
                {priceChange > 0 ? (
                  <TrendingUp className="h-3 w-3 text-destructive" />
                ) : priceChange < 0 ? (
                  <TrendingDown className="h-3 w-3 text-secondary" />
                ) : (
                  <Minus className="h-3 w-3 text-gray-400" />
                )}
                <span className={`text-xs font-medium ${
                  priceChange > 0 ? "text-destructive" : priceChange < 0 ? "text-secondary" : "text-gray-400"
                }`}>
                  {priceChange > 0 ? "+" : ""}${Math.abs(priceChange).toFixed(2)}
                </span>
              </div>
            )}
          </div>
        </div>
        
        {/* Item Meta */}
        <div className="flex items-center space-x-4 text-xs text-gray-500 mb-4">
          <span data-testid={`text-item-added-${item.id}`}>
            Added {formatDistanceToNow(new Date(item.createdAt))} ago
          </span>
          {item.nextReview && (
            <span data-testid={`text-item-next-review-${item.id}`}>
              Next review: {formatDistanceToNow(new Date(item.nextReview))}
            </span>
          )}
        </div>
        
        {/* Progress Indicator */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>Review Progress</span>
            <span data-testid={`text-item-progress-${item.id}`}>
              {item.reviewProgress.completed} of {item.reviewProgress.total} checkpoints
            </span>
          </div>
          <Progress 
            value={item.reviewProgress.percentage} 
            className="h-1.5"
            data-testid={`progress-item-${item.id}`}
          />
        </div>
        
        {/* Item Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {item.productUrl && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-gray-600 hover:text-primary h-auto p-1"
                onClick={() => window.open(item.productUrl, "_blank")}
                data-testid={`button-view-link-${item.id}`}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                View Link
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-gray-600 hover:text-primary h-auto p-1"
              onClick={onEdit}
              data-testid={`button-edit-item-${item.id}`}
            >
              <Edit className="h-3 w-3 mr-1" />
              Edit
            </Button>
          </div>
          
          <div className="flex items-center space-x-1">
            {getStatusIndicator()}
            <span className={`text-xs font-medium ${getStatusTextColor()}`}>
              {getStatusText()}
            </span>
            {item.isDueForReview && (
              <Button
                size="sm"
                variant="outline"
                className="ml-2 text-xs"
                onClick={onReview}
                data-testid={`button-review-item-${item.id}`}
              >
                Review
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
