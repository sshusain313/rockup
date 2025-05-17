'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, RefreshCw, AlertCircle } from "lucide-react";
import FAQSection from "./FaqSection";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { 
  getAllMockups, 
  clearUserUploadedMockups, 
  MockupItem 
} from "@/lib/mockupService";
import { 
  fetchAllMockups, 
  clearUserUploadedMockups as clearServerMockups 
} from "@/lib/serverMockupService";
import { fetchProductsAsMockups } from "@/lib/productToMockupService";
import { useSession } from "next-auth/react";
import { PlaceholderDesignOverlay } from "./PlaceholderDesignOverlay";
import { 
  fetchProductsByCategory, 
  fetchProductsBySubcategory 
} from "@/lib/productService";

interface TShirtGalleryProps {
  activeCategory: string;
  setActiveCategory: (category: string) => void;
  uploadedDesign: string | null;
}

interface IProduct {
  _id: string;
  name: string;
  description: string;
  category: string;
  subcategory: string;
  price: number;
  image: string;
  tags?: string[];
  colors?: string[];
  colorVariants?: Array<{
    color: string;
    hex: string;
    image: string;
  }>;
  mockupImage?: string | null;
  placeholder?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  createdAt?: string;
  updatedAt?: string;
}

// Function to validate product data
function validateProduct(product: any): boolean {
  if (!product || !product.category) {
    console.error('Product or category is undefined');
    return false;
  }
  return true;
}

export function TShirtGallery({ 
  activeCategory, 
  setActiveCategory,
  uploadedDesign
}: TShirtGalleryProps) {
  const [mockups, setMockups] = useState<MockupItem[]>([]);
  const [productMockups, setProductMockups] = useState<MockupItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isClearing, setIsClearing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const { data: session } = useSession();
  
  // State for products
  const [products, setProducts] = useState<IProduct[]>([]);
  
  // Initialize mockups and products from server or local storage
  useEffect(() => {
    const initData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Try to fetch mockups from server
        const serverMockups = await fetchAllMockups();
        setMockups(serverMockups);
        
        // Fetch products as mockups
        const productMockups = await fetchProductsAsMockups();
        setProductMockups(productMockups);
        
        // Fetch all products by category
        const fetchedProducts = await fetchProductsByCategory('Apparel');
        console.log('Fetched products:', fetchedProducts);
        
        // Filter products by subcategory if needed
        const tshirtProducts = fetchedProducts.filter(product => 
          product.subcategory === 'T-Shirts' || 
          product.subcategory === 'T-Shirt'
        );
        
        // Validate products and filter out invalid ones
        const validProducts = tshirtProducts.filter(product => validateProduct(product));
        console.log('Valid T-shirt products:', validProducts);
        
        setProducts(validProducts);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load data from server. Showing local data instead.');
        // Fallback to local storage
        const localMockups = getAllMockups();
        setMockups(localMockups);
      } finally {
        setIsLoading(false);
      }
    };

    initData();
  }, [refreshing]);
  
  // Categories for filtering
  const categories = [
    "Blank", "Round Neck", "Without People", "White", "Oversized", "Unisex", 
    "Closeup", "Acid Wash", "Washed", "Red", "Black", "Boxy", "Navy Blue", 
    "Mannequin", "Women"
  ];

  // Handle category change
  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
  };

  // Handle mockup click
  const handleMockupClick = (mockup: MockupItem) => {
    router.push(`/editor?mockupId=${mockup.id}`);
  };

  // Handle clear uploads
  const handleClearUploads = async () => {
    setIsClearing(true);
    setError(null);
    try {
      // Clear uploads from server first
      await clearServerMockups();
      
      // Also clear from local storage as fallback
      clearUserUploadedMockups();
      
      // Refresh mockups
      const updatedMockups = await fetchAllMockups();
      setMockups(updatedMockups);
    } catch (error) {
      console.error('Error clearing uploads:', error);
      setError('Failed to clear uploads from server. Local storage has been cleared.');
      // Fallback to local storage
      clearUserUploadedMockups();
      setMockups(getAllMockups());
    } finally {
      setIsClearing(false);
    }
  };

  // Handle refresh mockups
  const handleRefreshMockups = () => {
    setRefreshing(prev => !prev); // Toggle to trigger useEffect
  };

  // Filter mockups based on active category
  const filteredMockups = activeCategory === "Blank" 
    ? [...mockups, ...productMockups]
    : [...mockups, ...productMockups].filter(
        mockup => mockup.categories && mockup.categories.includes(activeCategory)
      );

  return (
    <div className="flex-1 overflow-y-auto p-4 w-full">
      {/* Header with refresh button */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">T-Shirt Gallery</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshMockups}
            disabled={isLoading}
            className="flex items-center gap-1"
          >
            <RefreshCw size={16} className={`${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {session?.user && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearUploads}
              disabled={isClearing || isLoading}
              className="flex items-center gap-1"
            >
              {isClearing ? 'Clearing...' : 'Clear Uploads'}
            </Button>
          )}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4 flex items-start gap-2">
          <AlertCircle size={18} className="text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      
      <div className="mb-6 overflow-x-auto whitespace-nowrap pb-2">
        {/* Regular buttons for filtering */}
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
          Showing {filteredMockups.length} mockups {activeCategory !== "Blank" ? `for category "${activeCategory}"` : "across all categories"}
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
      
      {/* Loading state */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12">
          <RefreshCw size={32} className="text-gray-400 animate-spin mb-4" />
          <p className="text-gray-500">Loading mockups...</p>
        </div>
      )}
      
      {/* Empty state */}
      {!isLoading && filteredMockups.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 border border-dashed border-gray-200 rounded-lg">
          <div className="bg-gray-100 p-4 rounded-full mb-4">
            <AlertCircle size={32} className="text-gray-400" />
          </div>
          <p className="text-gray-500 mb-2">No mockups found</p>
          <p className="text-sm text-gray-400 mb-4">Try selecting a different category or refreshing the page</p>
          <Button variant="outline" size="sm" onClick={handleRefreshMockups}>
            <RefreshCw size={16} className="mr-2" />
            Refresh mockups
          </Button>
        </div>
      )}
      
      {/* T-shirt mockup grid */}
      {!isLoading && filteredMockups.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mt-4">
          {filteredMockups.map((mockup) => (
            <div 
              key={mockup.id} 
              className="relative group overflow-hidden rounded-lg shadow-sm border border-gray-200 bg-white cursor-pointer hover:shadow-md transition-shadow duration-200"
              onClick={() => handleMockupClick(mockup)}
            >
              <div className="relative aspect-square overflow-hidden">
                {mockup.image ? (
                  <Image
                    src={mockup.image}
                    alt={mockup.title || 'T-shirt mockup'}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover transition-transform group-hover:scale-105 duration-300"
                    loading="lazy"
                    placeholder="blur"
                    blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjFmMWYxIi8+PC9zdmc+"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <span className="text-gray-400">No image</span>
                  </div>
                )}
                
                {/* PRO badge */}
                {mockup.isPro && (
                  <div className="absolute top-2 right-2 bg-black text-white text-xs font-medium px-2 py-0.5 rounded">
                    PRO
                  </div>
                )}
                
                {/* Product badge - show for mockups from products */}
                {productMockups.some(pm => pm.id === mockup.id) && (
                  <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs font-medium px-2 py-0.5 rounded">
                    PRODUCT
                  </div>
                )}
                
                {/* Uploaded Design Overlay */}
                {uploadedDesign && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    {/* Always use placeholder-based overlay for consistent positioning */}
                    <PlaceholderDesignOverlay 
                      designImage={uploadedDesign}
                      placeholder={mockup.placeholder || {
                        // Default placeholder if none is defined - center of the mockup
                        x: 100,
                        y: 100,
                        width: 200,
                        height: 200
                      }}
                      mockupWidth={400}
                      mockupHeight={400}
                      categories={mockup.categories || []}
                    />
                  </div>
                )}
              </div>
              <div className="p-3 text-sm text-gray-700 truncate font-medium">{mockup.title || 'T-shirt mockup'}</div>
            </div>
          ))}
        </div>
      )}
      
      {/* Products Grid Section */}
      <div className="mt-10">
        <h2 className="text-xl font-semibold mb-4">Products from Database</h2>
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <RefreshCw size={32} className="text-gray-400 animate-spin mb-4" />
            <p className="ml-2 text-gray-500">Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 border border-dashed border-gray-200 rounded-lg">
            <div className="bg-gray-100 p-4 rounded-full mb-4">
              <AlertCircle size={32} className="text-gray-400" />
            </div>
            <p className="text-gray-500 mb-2">No products found</p>
            <p className="text-sm text-gray-400 mb-4">Try refreshing or adding products in the admin panel</p>
            <Button variant="outline" size="sm" onClick={handleRefreshMockups}>
              <RefreshCw size={16} className="mr-2" />
              Refresh products
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <div 
                key={product._id} 
                className="relative group overflow-hidden rounded-lg shadow-sm border border-gray-200 bg-white hover:shadow-md transition-shadow duration-200"
              >
                <div className="relative aspect-square overflow-hidden">
                  {product.image ? (
                    <Image
                      src={product.image}
                      alt={product.name || 'Product image'}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover transition-transform group-hover:scale-105 duration-300"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                      <span className="text-gray-400">No image</span>
                    </div>
                  )}
                  
                  {/* Category badge */}
                  <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs font-medium px-2 py-0.5 rounded">
                    {product.subcategory || product.category}
                  </div>
                  
                  {/* Price badge */}
                  <div className="absolute top-2 right-2 bg-black text-white text-xs font-medium px-2 py-0.5 rounded">
                    ${product.price.toFixed(2)}
                  </div>
                  
                  {/* Placeholder visualization */}
                  {product.placeholder && (
                    <div 
                      className="absolute border-2 border-dashed border-pink-500 opacity-50 pointer-events-none" 
                      style={{
                        left: `${product.placeholder.x}px`,
                        top: `${product.placeholder.y}px`,
                        width: `${product.placeholder.width}px`,
                        height: `${product.placeholder.height}px`,
                      }}
                      data-testid="placeholder-outline"
                    />
                  )}
                  
                  {/* Uploaded Design Overlay */}
                  {uploadedDesign && product.placeholder && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <PlaceholderDesignOverlay 
                        designImage={uploadedDesign}
                        placeholder={product.placeholder}
                        mockupWidth={400}
                        mockupHeight={400}
                        categories={[product.category, product.subcategory]}
                      />
                    </div>
                  )}
                </div>
                
                <div className="p-4">
                  <h3 className="text-sm font-medium text-gray-900 truncate">{product.name}</h3>
                  
                  {/* Color variants */}
                  {product.colors && product.colors.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-500 mb-1">Available colors:</p>
                      <div className="flex flex-wrap gap-1">
                        {product.colors.map((color) => (
                          <div 
                            key={color}
                            className="w-4 h-4 rounded-full border border-gray-300"
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Placeholder coordinates */}
                  {product.placeholder && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-500 mb-1">Placeholder position:</p>
                      <p className="text-xs text-gray-700">
                        x: {product.placeholder.x}, y: {product.placeholder.y}, 
                        w: {product.placeholder.width}, h: {product.placeholder.height}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
