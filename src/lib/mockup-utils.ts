// Helper functions for the mockup generator

// Function to merge a user image onto a mockup template
export const mergeImageOntoMockup = (
    mockupSrc: string, 
    userImageSrc: string, 
    placeholderCoords: MockupPlaceholder
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      // Create canvas elements for manipulation
      const mockupImage = new Image();
      const userImage = new Image();
      
      // Set crossOrigin to anonymous to prevent CORS issues
      mockupImage.crossOrigin = "anonymous";
      userImage.crossOrigin = "anonymous";
      
      mockupImage.onload = () => {
        userImage.onload = () => {
          // Create a canvas to merge the images
          const canvas = document.createElement('canvas');
          canvas.width = mockupImage.width;
          canvas.height = mockupImage.height;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }
          
          // Draw the mockup first
          ctx.drawImage(mockupImage, 0, 0);
          
          // Calculate actual pixel positions if using percentages
          const x = placeholderCoords.isRelative 
            ? (placeholderCoords.x / 100) * mockupImage.width 
            : placeholderCoords.x;
          
          const y = placeholderCoords.isRelative 
            ? (placeholderCoords.y / 100) * mockupImage.height 
            : placeholderCoords.y;
          
          const width = placeholderCoords.isRelative 
            ? (placeholderCoords.width / 100) * mockupImage.width 
            : placeholderCoords.width;
          
          const height = placeholderCoords.isRelative 
            ? (placeholderCoords.height / 100) * mockupImage.height 
            : placeholderCoords.height;
          
          // Draw the user image onto the placeholder area
          ctx.drawImage(
            userImage, 
            x, 
            y,
            width,
            height
          );
          
          // Convert canvas to data URL
          resolve(canvas.toDataURL('image/png'));
        };
        
        userImage.onerror = (e) => {
          console.error("Error loading user image:", e);
          reject(new Error('Failed to load user image'));
        };
        
        userImage.src = userImageSrc;
      };
      
      mockupImage.onerror = (e) => {
        console.error("Error loading mockup image:", e);
        reject(new Error('Failed to load mockup image'));
      };
      
      mockupImage.src = mockupSrc;
    });
  };
  
  // Define the types for our mockup data
  export interface MockupPlaceholder {
    x: number;
    y: number;
    width: number;
    height: number;
    isRelative?: boolean; // Flag to indicate if coordinates are percentages (0-100)
  }
  
  export interface Mockup {
    id: string;
    name: string;
    description: string;
    imageSrc: string;
    placeholder: MockupPlaceholder;
  }
  
  // Helper function to ensure placeholder stays within image boundaries
  export const normalizePlaceholder = (
    placeholder: MockupPlaceholder, 
    imageWidth: number, 
    imageHeight: number
  ): MockupPlaceholder => {
    if (placeholder.isRelative) {
      return {
        ...placeholder,
        x: Math.min(Math.max(placeholder.x, 0), 100),
        y: Math.min(Math.max(placeholder.y, 0), 100),
        width: Math.min(Math.max(placeholder.width, 1), 100 - placeholder.x),
        height: Math.min(Math.max(placeholder.height, 1), 100 - placeholder.y),
      };
    }
    
    return {
      ...placeholder,
      x: Math.min(Math.max(placeholder.x, 0), imageWidth - 10),
      y: Math.min(Math.max(placeholder.y, 0), imageHeight - 10),
      width: Math.min(Math.max(placeholder.width, 10), imageWidth - placeholder.x),
      height: Math.min(Math.max(placeholder.height, 10), imageHeight - placeholder.y),
    };
  };
  
  // Helper functions for dragging operations
  export interface DragState {
    isDragging: boolean;
    startX: number;
    startY: number;
    originalX: number;
    originalY: number;
    type: 'move' | 'resize' | null;
    resizeHandle: 'se' | 'sw' | 'ne' | 'nw' | null;
  }
  
  export const getInitialDragState = (): DragState => ({
    isDragging: false,
    startX: 0,
    startY: 0,
    originalX: 0,
    originalY: 0,
    type: null,
    resizeHandle: null
  });
  
  // Sample mockups data
  export const sampleMockups: Mockup[] = [
    {
      id: '1',
      name: 'T-Shirt Mockup',
      description: 'A t-shirt mockup for custom designs',
      imageSrc: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1000',
      placeholder: { x: 20, y: 30, width: 40, height: 30, isRelative: true }
    },
    {
      id: '2',
      name: 'Coffee Mug',
      description: 'A coffee mug mockup for custom prints',
      imageSrc: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=1000',
      placeholder: { x: 30, y: 20, width: 30, height: 30, isRelative: true }
    },
    {
      id: '3',
      name: 'Wall Art Frame',
      description: 'A frame mockup for wall art prints',
      imageSrc: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=1000',
      placeholder: { x: 10, y: 10, width: 80, height: 70, isRelative: true }
    }
  ];
  