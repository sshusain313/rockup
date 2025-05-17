'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, RefreshCw, AlertCircle } from "lucide-react";
import FAQSection from "./FaqSection";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { PlaceholderDesignOverlay } from "../../tshirt/components/PlaceholderDesignOverlay";
import { IProduct } from '@/models/Product';
import Link from "next/link";

interface MockupItem {
  id: string;
  title?: string;
  image?: string;
  categories?: string[];
  isPro?: boolean;
  placeholder?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  customShapePoints?: Array<{ x: number, y: number }>;
}

interface HoodieGalleryProps {
  activeCategory: string;
  setActiveCategory: (category: string) => void;
  uploadedDesign: string | null;
  products?: IProduct[];
}

function validateProduct(product: any): boolean {
  if (!product || !product.category) {
    console.error('Product or category is undefined');
    return false;
  }
  return true;
}

export function HoodieGallery({
  activeCategory,
  setActiveCategory,
  uploadedDesign,
  products = []
}: HoodieGalleryProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { data: session } = useSession();

  const PRODUCT_CANVAS_WIDTH = 400;
  const PRODUCT_CANVAS_HEIGHT = 400;

  const productMockups: MockupItem[] = products.map(product => ({
    id: product._id,
    title: product.name,
    image: product.image,
    categories: [...(product.tags || []), product.category, product.subcategory],
    placeholder: product.placeholder,
    customShapePoints: product.customShapePoints,
    isPro: false
  }));

  useEffect(() => {
    console.log('Current products count:', products.length);
    console.log('Converted to mockups count:', productMockups.length);
    if (products.length > 0) {
      console.log('Sample product:', {
        _id: products[0]._id,
        name: products[0].name,
        placeholder: products[0].placeholder
      });
      console.log('Sample mockup:', productMockups[0]);
    }
  }, [products, productMockups]);

  const filterProductsByCategory = (mockup: MockupItem, category: string): boolean => {
    if (category === "Blank") return true;
    return mockup.categories?.some(cat =>
      cat.toLowerCase() === category.toLowerCase()
    ) || false;
  };

  const extractCategories = (): string[] => {
    const categorySet = new Set<string>(["Blank"]);
    products.forEach(product => {
      if (product.category) categorySet.add(product.category);
      if (product.subcategory) categorySet.add(product.subcategory);
      product.tags?.forEach(tag => categorySet.add(tag));
      product.colors?.forEach(color => categorySet.add(color));
    });
    return Array.from(categorySet);
  };

  const categories = extractCategories();

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
  };

  const handleMockupClick = (mockup: MockupItem) => {
    localStorage.setItem('selectedProductId', mockup.id);
    if (uploadedDesign) {
      localStorage.setItem('userUploadedDesignPath', uploadedDesign);
      router.push(`/editor/hoodie?productId=${mockup.id}`);
    } else {
      router.push(`/editor/hoodie?productId=${mockup.id}`);
    }
  };

  const handleRefresh = () => {
    console.log('Refreshing page...');
    window.location.reload();
  };

  const filteredMockups = activeCategory === "Blank"
    ? productMockups
    : productMockups.filter(mockup => filterProductsByCategory(mockup, activeCategory));

  return (
    <div className="flex-1 overflow-y-auto p-4 w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Hoodie Gallery</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center gap-1"
          >
            <RefreshCw size={16} />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4 flex items-start gap-2">
          <AlertCircle size={18} className="text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="mb-6 overflow-x-auto whitespace-nowrap pb-2">
        <div className="flex gap-2 min-w-max mb-2">
          {categories.map((category) => (
            <Button
              key={category}
              variant={activeCategory === category ? "default" : "outline"}
              className={`rounded-md px-4 py-2 ${activeCategory === category ? "bg-gray-900 text-white" : "bg-white text-gray-800 border-gray-200 hover:bg-gray-50"}`}
              onClick={() => handleCategoryChange(category)}
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      <div className="mb-4 flex justify-between items-center">
        <p className="text-sm text-gray-500">
          Showing {filteredMockups.length} products {activeCategory !== "Blank" ? `for category "${activeCategory}"` : "across all categories"}
        </p>
        {uploadedDesign && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Your design is applied</span>
            <div className="w-8 h-8 rounded-full border border-gray-200 overflow-hidden">
              <Image
                src={uploadedDesign}
                alt="Your design"
                width={32}
                height={32}
                className="object-cover"
              />
            </div>
          </div>
        )}
      </div>

      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12">
          <RefreshCw size={32} className="text-gray-400 animate-spin mb-4" />
          <p className="text-gray-500">Loading products...</p>
        </div>
      )}

      {!isLoading && filteredMockups.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 border border-dashed border-gray-200 rounded-lg">
          <div className="bg-gray-100 p-4 rounded-full mb-4">
            <AlertCircle size={32} className="text-gray-400" />
          </div>
          <p className="text-gray-500 mb-2">No products found</p>
          <p className="text-sm text-gray-400 mb-4">Try selecting a different category or refreshing the page</p>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw size={16} className="mr-2" />
            Refresh products
          </Button>
        </div>
      )}

      {!isLoading && filteredMockups.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
          {filteredMockups.map((mockup) => (
            <div
              key={mockup.id}
              className="relative group overflow-hidden rounded-lg shadow-sm border border-gray-200 bg-white hover:shadow-md transition-shadow duration-200"
            >
              <div className="relative aspect-square overflow-hidden">
                {mockup.image ? (
                  <Link
                    href={`/editor/hoodie?productId=${mockup.id}${uploadedDesign ? `&designImage=${encodeURIComponent(uploadedDesign)}` : ''}`}
                    onClick={() => {
                      localStorage.setItem('selectedProductId', mockup.id);
                      localStorage.setItem('selectedProductImage', mockup.image || '');
                      localStorage.setItem('uploadedDesignImage', uploadedDesign || '');
                      const placeholder = mockup.placeholder ? {
                        x: Number(mockup.placeholder.x),
                        y: Number(mockup.placeholder.y),
                        width: Number(mockup.placeholder.width),
                        height: Number(mockup.placeholder.height)
                      } : {
                        x: 150,
                        y: 150,
                        width: 200,
                        height: 200
                      };
                      localStorage.setItem('productPlaceholder', JSON.stringify(placeholder));
                    }}
                  >
                    <Image
                      src={mockup.image}
                      alt={mockup.title || 'Hoodie product'}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover transition-transform duration-300 cursor-pointer"
                      loading="lazy"
                      placeholder="blur"
                      blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjFmMWYxIi8+PC9zdmc+"
                    />
                  </Link>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <span className="text-gray-400">No image</span>
                  </div>
                )}

                {uploadedDesign && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <PlaceholderDesignOverlay
                      designImage={uploadedDesign}
                      placeholder={mockup.placeholder ? {
                        x: Number(mockup.placeholder.x),
                        y: Number(mockup.placeholder.y),
                        width: Number(mockup.placeholder.width),
                        height: Number(mockup.placeholder.height)
                      } : {
                        x: 100,
                        y: 100,
                        width: 200,
                        height: 200
                      }}
                      customShapePoints={mockup.customShapePoints}
                      categories={mockup.categories || []}
                      mockupWidth={400}
                      mockupHeight={400}
                    />
                  </div>
                )}

                {mockup.categories && mockup.categories.some(cat =>
                  ['White', 'Black', 'Red', 'Blue', 'Green', 'Yellow', 'Navy Blue', 'Gray'].includes(cat)
                ) && (
                  <div className="absolute bottom-2 right-2 flex gap-1">
                    {mockup.categories.filter(cat =>
                      ['White', 'Black', 'Red', 'Blue', 'Green', 'Yellow', 'Navy Blue', 'Gray'].includes(cat)
                    ).map(color => (
                      <div
                        key={color}
                        className="w-4 h-4 rounded-full border border-gray-200"
                        style={{
                          backgroundColor:
                            color === 'White' ? '#FFFFFF' :
                            color === 'Black' ? '#000000' :
                            color === 'Red' ? '#FF0000' :
                            color === 'Blue' ? '#0000FF' :
                            color === 'Green' ? '#00FF00' :
                            color === 'Yellow' ? '#FFFF00' :
                            color === 'Navy Blue' ? '#000080' :
                            color === 'Gray' ? '#808080' : '#CCCCCC'
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="p-3">
                <div className="text-sm text-gray-700 truncate font-medium">{mockup.title || 'Hoodie product'}</div>
                {mockup.categories && mockup.categories.some(cat =>
                  ['White', 'Black', 'Red', 'Blue', 'Green', 'Yellow', 'Navy Blue', 'Gray'].includes(cat)
                ) && (
                  <div className="text-xs text-gray-500 mt-1">
                    Colors: {mockup.categories.filter(cat =>
                      ['White', 'Black', 'Red', 'Blue', 'Green', 'Yellow', 'Navy Blue', 'Gray'].includes(cat)
                    ).join(', ')}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <FAQSection />
    </div>
  );
}

export default HoodieGallery;