
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface CategoryFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (category: any) => void;
  category?: {
    id?: string;
    name: string;
    image: string;
    subTypes: string[];
  };
  mode: 'add' | 'edit';
  isEquipment?: boolean;
}

export default function CategoryFormDialog({ open, onClose, onSubmit, category, mode, isEquipment = true }: CategoryFormDialogProps) {
  const [formData, setFormData] = useState({
    name: category?.name || '',
    image: category?.image || '',
    subTypes: category?.subTypes || [],
    isEquipment: isEquipment
  });
  const [newSubType, setNewSubType] = useState("");

  useEffect(() => {
    console.log('CategoryFormDialog opened:', { category, mode, open, isEquipment });
    if (category && mode === 'edit') {
      setFormData({
        name: category.name,
        image: category.image,
        subTypes: category.subTypes,
        isEquipment: isEquipment
      });
    } else {
      setFormData({
        name: '',
        image: '',
        subTypes: [],
        isEquipment: isEquipment
      });
    }
  }, [category, mode, open, isEquipment]);

  const handleAddSubType = () => {
    if (newSubType.trim() && !formData.subTypes.includes(newSubType.trim())) {
      setFormData({
        ...formData,
        subTypes: [...formData.subTypes, newSubType.trim()]
      });
      setNewSubType("");
    }
  };

  const handleRemoveSubType = (subType: string) => {
    setFormData({
      ...formData,
      subTypes: formData.subTypes.filter(st => st !== subType)
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.image && formData.subTypes.length > 0) {
      onSubmit(formData);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl" data-testid={`dialog-${mode}-category`}>
        <DialogHeader>
          <DialogTitle>{mode === 'add' ? 'Add New Category' : 'Edit Category'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Category Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Drones"
              required
              data-testid="input-category-name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">Image URL *</Label>
            <Input
              id="image"
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              placeholder="https://example.com/image.jpg"
              required
              data-testid="input-category-image"
            />
            {formData.image && (
              <img 
                src={formData.image} 
                alt="Preview" 
                className="w-full h-40 object-cover rounded-lg mt-2"
                onError={(e) => {
                  e.currentTarget.src = 'https://via.placeholder.com/400x200?text=Invalid+Image+URL';
                }}
              />
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="subTypes">Product Types *</Label>
            <div className="flex gap-2">
              <Input
                id="subTypes"
                value={newSubType}
                onChange={(e) => setNewSubType(e.target.value)}
                placeholder="e.g., Quadcopter"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubType();
                  }
                }}
                data-testid="input-subtype"
              />
              <Button 
                type="button" 
                onClick={handleAddSubType}
                variant="outline"
                data-testid="button-add-subtype"
              >
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.subTypes.map((subType, index) => (
                <Badge 
                  key={index} 
                  variant="secondary"
                  className="bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white px-3 py-1"
                >
                  {subType}
                  <button
                    type="button"
                    onClick={() => handleRemoveSubType(subType)}
                    className="ml-2 hover:text-red-200"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} data-testid="button-cancel">
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-gradient-to-r from-[#667eea] to-[#764ba2]"
              data-testid="button-submit"
              disabled={!formData.name || !formData.image || formData.subTypes.length === 0}
            >
              {mode === 'add' ? 'Add Category' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
