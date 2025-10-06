import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { api, type ItemWithProgress, type FolderWithCount } from "@/lib/api";
import { insertItemSchema } from "@shared/schema";
import { z } from "zod";

interface EditItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: ItemWithProgress;
}

const editItemSchema = insertItemSchema.extend({
  id: z.string(),
}).partial().omit({ userId: true });

type EditItemFormData = z.infer<typeof editItemSchema>;

export default function EditItemModal({ isOpen, onClose, item }: EditItemModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: folders } = useQuery({
    queryKey: ["/api/folders"],
    queryFn: () => api.getFolders(),
  });

  const form = useForm<EditItemFormData>({
    resolver: zodResolver(editItemSchema),
    defaultValues: {
      name: item.name,
      description: item.description ?? "",
      price: item.price,
      productUrl: item.productUrl ?? "",
      notes: item.notes ?? "",
      folderId: item.folderId ?? "",
      reviewSchedule: item.reviewSchedule,
      aiFeatures: item.aiFeatures,
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: async (data: EditItemFormData) => {
      const { id, ...updateData } = data;
      // Convert null values to undefined for API compatibility
      const cleanedData = Object.fromEntries(
        Object.entries(updateData).map(([key, value]) => [key, value === null ? undefined : value])
      );
      return await api.updateItem(item.id, cleanedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/folders"] });
      toast({
        title: "Success",
        description: "Item updated successfully",
      });
      onClose();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update item. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EditItemFormData) => {
    updateItemMutation.mutate(data);
  };

  const reviewScheduleOptions = [
    { value: "1day", label: "1 Day" },
    { value: "1week", label: "1 Week" },
    { value: "1month", label: "1 Month" },
    { value: "3months", label: "3 Months" },
    { value: "6months", label: "6 Months" },
    { value: "1year", label: "1 Year" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="modal-edit-item">
        <DialogHeader>
          <DialogTitle>Edit Item</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Basic Information</h3>
              
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Item Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="What do you want to buy?" 
                        data-testid="input-edit-item-name"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe the item (optional)"
                        data-testid="textarea-edit-item-description"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="0.00" 
                          data-testid="input-edit-item-price"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="folderId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Folder</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        data-testid="select-edit-item-folder"
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a folder" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">No folder</SelectItem>
                          {folders?.map((folder: FolderWithCount) => (
                            <SelectItem key={folder.id} value={folder.id}>
                              {folder.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="productUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product URL</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="https://example.com/product" 
                        data-testid="input-edit-item-url"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Any additional notes or thoughts..."
                        data-testid="textarea-edit-item-notes"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Review Schedule */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Review Schedule</h3>
              <FormField
                control={form.control}
                name="reviewSchedule"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>When should you review this item?</FormLabel>
                    <div className="grid grid-cols-2 gap-2">
                      {reviewScheduleOptions.map((option) => (
                        <FormItem
                          key={option.value}
                          className="flex flex-row items-center space-x-2 space-y-0"
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(option.value)}
                              onCheckedChange={(checked) => {
                                const currentValue = field.value || [];
                                if (checked) {
                                  field.onChange([...currentValue, option.value]);
                                } else {
                                  field.onChange(currentValue.filter((v) => v !== option.value));
                                }
                              }}
                              data-testid={`checkbox-edit-schedule-${option.value}`}
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">
                            {option.label}
                          </FormLabel>
                        </FormItem>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* AI Features */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">AI Features</h3>
              <div className="grid grid-cols-1 gap-3">
                <FormField
                  control={form.control}
                  name="aiFeatures.priceTracking"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="checkbox-edit-price-tracking"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Price Tracking</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Monitor price changes and get alerts for deals
                        </p>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="aiFeatures.alternatives"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="checkbox-edit-alternatives"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Product Alternatives</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Discover similar products at different price points
                        </p>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="aiFeatures.sustainability"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="checkbox-edit-sustainability"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Sustainability Analysis</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Get insights on environmental impact and eco-friendly options
                        </p>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                data-testid="button-cancel-edit"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={updateItemMutation.isPending}
                data-testid="button-save-edit"
              >
                {updateItemMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}