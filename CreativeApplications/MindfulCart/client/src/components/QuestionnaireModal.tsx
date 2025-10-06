import { useState } from "react";
import { Clock, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type ReviewWithItem } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface QuestionnaireModalProps {
  isOpen: boolean;
  onClose: () => void;
  review: ReviewWithItem | null;
}

const presetQuestions = [
  {
    id: "desire_level",
    text: "Do you still want this item as much as when you first added it?",
    options: [
      { value: "more", label: "Yes, I want it even more" },
      { value: "same", label: "About the same" },
      { value: "less", label: "Less than before" },
      { value: "none", label: "I don't want it anymore" },
    ],
  },
  {
    id: "usage_frequency",
    text: "If you bought this item today, how often would you realistically use it?",
    options: [
      { value: "daily", label: "Daily" },
      { value: "weekly", label: "A few times a week" },
      { value: "monthly", label: "Weekly" },
      { value: "rarely", label: "Monthly or less" },
    ],
  },
];

export default function QuestionnaireModal({ isOpen, onClose, review }: QuestionnaireModalProps) {
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [prioritiesReflection, setPrioritiesReflection] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const completeReviewMutation = useMutation({
    mutationFn: (data: { responses: Record<string, any>; decision: "keep" | "archive" | "purchase" }) =>
      api.completeReview(review!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reviews/due"] });
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Review completed",
        description: "Thank you for your thoughtful reflection.",
      });
      onClose();
      resetForm();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to complete review. Please try again.",
        variant: "destructive",
      });
    },
  });

  const archiveItemMutation = useMutation({
    mutationFn: () => api.archiveItem(review!.itemId, "Archived during review process"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reviews/due"] });
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Item archived",
        description: "Great job practicing mindful spending! 🎉",
        className: "animate-celebrate",
      });
      onClose();
      resetForm();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to archive item. Please try again.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setResponses({});
    setPrioritiesReflection("");
  };

  const handleSubmit = () => {
    const allResponses = {
      ...responses,
      priorities: prioritiesReflection,
    };

    completeReviewMutation.mutate({
      responses: allResponses,
      decision: "keep",
    });
  };

  const handleArchive = () => {
    archiveItemMutation.mutate();
  };

  const handleSkip = () => {
    // Mark as completed without responses
    completeReviewMutation.mutate({
      responses: { skipped: true },
      decision: "keep",
    });
  };

  if (!review || !review.item) return null;

  const timeSinceAdded = formatDistanceToNow(new Date(review.item.createdAt));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="modal-questionnaire">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="h-8 w-8 text-primary" />
          </div>
          <DialogHeader>
            <DialogTitle className="mb-2">Time to Reflect</DialogTitle>
          </DialogHeader>
          <p className="text-gray-600" data-testid="text-review-description">
            It's been {timeSinceAdded} since you added "{review.item.name}" to your wishlist.
          </p>
        </div>
        
        <div className="space-y-6">
          {presetQuestions.map((question) => (
            <div key={question.id} className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-foreground mb-3">{question.text}</h3>
              <RadioGroup
                value={responses[question.id] || ""}
                onValueChange={(value) => setResponses(prev => ({ ...prev, [question.id]: value }))}
              >
                <div className="space-y-2">
                  {question.options.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <RadioGroupItem 
                        value={option.value} 
                        id={`${question.id}-${option.value}`}
                        data-testid={`radio-${question.id}-${option.value}`}
                      />
                      <Label 
                        htmlFor={`${question.id}-${option.value}`} 
                        className="text-sm text-gray-700 cursor-pointer"
                      >
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </div>
          ))}
          
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-foreground mb-3">
              Have your priorities or circumstances changed since adding this item?
            </h3>
            <Textarea
              placeholder="Reflect on any changes in your life or priorities..."
              className="h-20 resize-none bg-white"
              value={prioritiesReflection}
              onChange={(e) => setPrioritiesReflection(e.target.value)}
              data-testid="textarea-priorities"
            />
          </div>
        </div>
        
        <div className="flex items-center justify-between pt-6 border-t border-gray-100">
          <Button
            variant="outline"
            onClick={handleArchive}
            className="text-accent border-accent hover:bg-accent hover:text-accent-foreground"
            disabled={archiveItemMutation.isPending}
            data-testid="button-archive"
          >
            <Archive className="h-4 w-4 mr-2" />
            {archiveItemMutation.isPending ? "Archiving..." : "Archive Item"}
          </Button>
          <div className="flex items-center space-x-3">
            <Button 
              variant="outline" 
              onClick={handleSkip}
              disabled={completeReviewMutation.isPending}
              data-testid="button-skip"
            >
              Skip
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={completeReviewMutation.isPending}
              data-testid="button-submit"
            >
              {completeReviewMutation.isPending ? "Submitting..." : "Submit Reflection"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
