import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

const reviewIntervals = [
  { value: "1day", label: "1 Day", description: "Initial check" },
  { value: "1week", label: "1 Week", description: "Still interested?" },
  { value: "1month", label: "1 Month", description: "Deep reflection" },
  { value: "3months", label: "3 Months", description: "Long-term value" },
  { value: "6months", label: "6 Months", description: "Final check" },
  { value: "1year", label: "1 Year", description: "Final decision" },
];

const addItemSchema = z.object({
  name: z.string().min(1, "Item name is required"),
  description: z.string().optional(),
  price: z.string().min(1, "Price is required").regex(/^\d+(\.\d{1,2})?$/, "Invalid price format"),
  productUrl: z.string().url().optional().or(z.literal("")),
  notes: z.string().optional(),
  folderId: z.string().optional(),
  reviewSchedule: z.array(z.string()).min(1, "Select at least one review interval"),
  aiFeatures: z.object({
    priceTracking: z.boolean(),
    alternatives: z.boolean(),
    sustainability: z.boolean(),
  }),
});

type AddItemFormData = z.infer<typeof addItemSchema>;

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddItemModal({ isOpen, onClose }: AddItemModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<AddItemFormData>({
    resolver: zodResolver(addItemSchema),
    defaultValues: {
      name: "",
      description: "",
      price: "",
      productUrl: "",
      notes: "",
      folderId: "",
      reviewSchedule: ["1day", "1week", "1month"],
      aiFeatures: {
        priceTracking: true,
        alternatives: true,
        sustainability: false,
      },
    },
  });

  const { data: folders } = useQuery({
    queryKey: ["/api/folders"],
    queryFn: () => api.getFolders(),
  });

  const createItemMutation = useMutation({
    mutationFn: (data: AddItemFormData) => api.createItem(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/folders"] });
      toast({
        title: "Item added",
        description: "Your item has been added to your mindful shopping list.",
      });
      form.reset();
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
        description: "Failed to add item. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AddItemFormData) => {
    createItemMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="modal-add-item">
        <DialogHeader>
          <DialogTitle>Add New Item</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Item Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g. Apple MacBook Pro 14&quot;" 
                          {...field} 
                          data-testid="input-item-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-gray-500">$</span>
                        <Input 
                          placeholder="0.00" 
                          className="pl-8"
                          {...field} 
                          data-testid="input-item-price"
                        />
                      </div>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-folder">
                          <SelectValue placeholder="Select a folder" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {folders?.map((folder) => (
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
              
              <div className="md:col-span-2">
                <FormField
                  control={form.control}
                  name="productUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Link</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="https://..." 
                          {...field} 
                          data-testid="input-product-url"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="md:col-span-2">
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Brief description of the item..." 
                          className="h-20 resize-none"
                          {...field} 
                          data-testid="textarea-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="md:col-span-2">
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Personal Notes</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Why do you want this? How will it improve your life?" 
                          className="h-20 resize-none"
                          {...field} 
                          data-testid="textarea-notes"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            {/* Review Schedule */}
            <div className="border-t border-gray-100 pt-6">
              <h3 className="font-medium text-foreground mb-4">Review Schedule</h3>
              <FormField
                control={form.control}
                name="reviewSchedule"
                render={() => (
                  <FormItem>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {reviewIntervals.map((interval) => (
                        <FormField
                          key={interval.value}
                          control={form.control}
                          name="reviewSchedule"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:border-primary/50 cursor-pointer transition-colors">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(interval.value)}
                                  onCheckedChange={(checked) => {
                                    const updatedValue = checked
                                      ? [...(field.value || []), interval.value]
                                      : (field.value || []).filter(value => value !== interval.value);
                                    field.onChange(updatedValue);
                                  }}
                                  data-testid={`checkbox-${interval.value}`}
                                />
                              </FormControl>
                              <div>
                                <div className="text-sm font-medium text-foreground">{interval.label}</div>
                                <div className="text-xs text-gray-500">{interval.description}</div>
                              </div>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* AI Features */}
            <div className="border-t border-gray-100 pt-6">
              <h3 className="font-medium text-foreground mb-4">AI Assistance</h3>
              <div className="space-y-3">
                <FormField
                  control={form.control}
                  name="aiFeatures.priceTracking"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-3">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="checkbox-price-tracking"
                        />
                      </FormControl>
                      <div>
                        <div className="text-sm font-medium text-foreground">Price Tracking</div>
                        <div className="text-xs text-gray-500">Get notified of price drops and deals</div>
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="aiFeatures.alternatives"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-3">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="checkbox-alternatives"
                        />
                      </FormControl>
                      <div>
                        <div className="text-sm font-medium text-foreground">Alternative Suggestions</div>
                        <div className="text-xs text-gray-500">Discover similar or better options</div>
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="aiFeatures.sustainability"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-3">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="checkbox-sustainability"
                        />
                      </FormControl>
                      <div>
                        <div className="text-sm font-medium text-foreground">Sustainability Insights</div>
                        <div className="text-xs text-gray-500">Environmental impact and ethical considerations</div>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-100">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createItemMutation.isPending}
                data-testid="button-add-item"
              >
                {createItemMutation.isPending ? "Adding..." : "Add Item"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
