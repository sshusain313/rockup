import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { ChevronDown, Check, X } from 'lucide-react';

interface SubcategoryOption {
  value: string;
  label: string;
  category: string;
}

interface ProductSubcategoriesProps {
  category: string;
  subcategories: string[];
  onSubcategoryChange: (subcategories: string[]) => void;
}

// Subcategory options map
const subcategoryOptions: Record<string, SubcategoryOption[]> = {
  apparel: [
    { value: 't-shirt', label: 'T-Shirt', category: 'apparel' },
    { value: 'hoodie', label: 'Hoodie', category: 'apparel' },
    { value: 'pants', label: 'Pants', category: 'apparel' },
    { value: 'jacket', label: 'Jacket', category: 'apparel' },
    { value: 'socks', label: 'Socks', category: 'apparel' },
  ],
  electronics: [
    { value: 'smartphone', label: 'Smartphone', category: 'electronics' },
    { value: 'laptop', label: 'Laptop', category: 'electronics' },
    { value: 'tablet', label: 'Tablet', category: 'electronics' },
    { value: 'headphones', label: 'Headphones', category: 'electronics' },
    { value: 'smartwatch', label: 'Smartwatch', category: 'electronics' },
  ],
  furniture: [
    { value: 'chair', label: 'Chair', category: 'furniture' },
    { value: 'table', label: 'Table', category: 'furniture' },
    { value: 'sofa', label: 'Sofa', category: 'furniture' },
    { value: 'bed', label: 'Bed', category: 'furniture' },
  ],
  accessories: [
    { value: 'necklace', label: 'Necklace', category: 'accessories' },
    { value: 'bracelet', label: 'Bracelet', category: 'accessories' },
    { value: 'ring', label: 'Ring', category: 'accessories' },
    { value: 'watch', label: 'Watch', category: 'accessories' },
  ]
};

const ProductSubcategories: React.FC<ProductSubcategoriesProps> = ({ 
  category, 
  subcategories, 
  onSubcategoryChange 
}) => {
  const handleSubcategoryToggle = (value: string) => {
    const currentSubcategories = [...subcategories];
    if (currentSubcategories.includes(value)) {
      onSubcategoryChange(currentSubcategories.filter(sc => sc !== value));
    } else {
      onSubcategoryChange([...currentSubcategories, value]);
    }
  };

  const removeSubcategory = (value: string) => {
    onSubcategoryChange(subcategories.filter(sc => sc !== value));
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="subcategories" className="text-gray-700 font-medium">Subcategories</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            role="combobox" 
            aria-expanded={true} 
            disabled={!category}
            className="w-full justify-between font-normal text-left"
          >
            Select subcategories
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0 max-h-72 overflow-auto" align="start">
          <div className="p-2">
            {category && subcategoryOptions[category]?.map((option) => (
              <div key={option.value} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
                <Checkbox 
                  id={`subcategory-${option.value}`}
                  checked={subcategories.includes(option.value)}
                  onCheckedChange={() => handleSubcategoryToggle(option.value)}
                />
                <label 
                  htmlFor={`subcategory-${option.value}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                >
                  {option.label}
                </label>
                {subcategories.includes(option.value) && (
                  <Check className="h-4 w-4 text-green-500" />
                )}
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      <div className="flex flex-wrap gap-2 mt-3">
        {subcategories.length === 0 && category && (
          <span className="text-gray-400 text-sm">No subcategories selected</span>
        )}
        {subcategories.map(value => {
          const currentOptions = subcategoryOptions[category] || [];
          const option = currentOptions.find(o => o.value === value);
          return (
            <Badge key={value} variant="secondary" className="px-3 py-1.5 flex items-center gap-1.5">
              {option?.label || value}
              <button 
                type="button" 
                onClick={() => removeSubcategory(value)}
                className="rounded-full p-0.5 hover:bg-gray-200 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
                <span className="sr-only">Remove {option?.label || value}</span>
              </button>
            </Badge>
          );
        })}
      </div>
    </div>
  );
};

export default ProductSubcategories;
