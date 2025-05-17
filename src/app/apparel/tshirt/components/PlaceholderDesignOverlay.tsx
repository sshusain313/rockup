'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import Image from 'next/image';
// Import directly from the utils directory
import { PlaceholderRect, PercentagePlaceholder, convertToPercentage, convertFromPercentage } from '@/utils/designPositioning';

interface PlaceholderDesignOverlayProps {
  designImage?: string;
  placeholder?: PlaceholderRect;
  mockupWidth?: number;
  mockupHeight?: number;
  categories?: string[]; // Optional categories for determining blend mode
  customShapePoints?: Array<{x: number, y: number}>;
}

export const PlaceholderDesignOverlay: React.FC<PlaceholderDesignOverlayProps> = ({
  designImage = '/mockups/placeholder-design.png',
  placeholder = { x: 150, y: 150, width: 100, height: 100 },
  mockupWidth = 400,
  mockupHeight = 500,
  categories = [],
  customShapePoints = []
}) => {
  const [designDimensions, setDesignDimensions] = useState({ width: 0, height: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  // Don't set initial state from prop to avoid update loops
  const [imageSrc, setImageSrc] = useState('');
  
  // Set the image source once on mount
  useEffect(() => {
    setImageSrc(designImage);
  }, []);

  const uniqueAriaId = useMemo(() => `DndDescribedBy-${placeholder.x}-${placeholder.y}`, [placeholder.x, placeholder.y]);
  
  // This function is now defined inside the useEffect to avoid dependency issues

  // Load the design image to get its dimensions
  useEffect(() => {
    if (!designImage || typeof window === 'undefined') return;

    // Function to check if an image URL is valid - defined inside useEffect to avoid dependency issues
    const isValidImageUrl = (url: string) => {
      // Check if it's a data URL or blob URL
      if (url.startsWith('data:') || url.startsWith('blob:')) {
        return true;
      }
      
      // Check if it's a relative URL starting with /
      if (url.startsWith('/')) {
        return true;
      }
      
      // Check if it's an absolute URL with http or https
      if (url.startsWith('http://') || url.startsWith('https://')) {
        return true;
      }
      
      return false;
    };

    // Reset states when design image changes
    setIsLoading(true);
    setImageError(false);
    
    // Validate the image URL first
    if (!isValidImageUrl(designImage)) {
      console.warn('Invalid image URL format:', designImage);
      setIsLoading(false);
      setImageError(true);
      setImageSrc('/mockups/placeholder-design.png');
      return;
    }
    
    console.log('PlaceholderDesignOverlay: Loading design image:', designImage);
    
    // Set a timeout to handle cases where the image might hang
    const timeoutId = setTimeout(() => {
      console.warn('Design image load timed out');
      setIsLoading(false);
      setImageError(true);
      // Try fallback if timeout occurs
      if (designImage !== '/mockups/placeholder-design.png') {
        setImageSrc('/mockups/placeholder-design.png');
      }
    }, 5000); // 5 second timeout
    
    try {
      const img = new window.Image(); // Use the browser's Image constructor
      img.crossOrigin = "anonymous"; // Add cross-origin attribute for external images
      
      img.onload = () => {
        clearTimeout(timeoutId);
        console.log('Design image loaded successfully:', img.width, 'x', img.height);
        
        // Only update dimensions if we got valid values
        if (img.width > 0 && img.height > 0) {
          setDesignDimensions({
            width: img.width,
            height: img.height
          });
          setIsLoading(false);
          setImageError(false);
        } else {
          console.warn('Image loaded but has invalid dimensions:', img.width, 'x', img.height);
          setIsLoading(false);
          setImageError(true);
          // Try fallback for invalid dimensions
          if (designImage !== '/mockups/placeholder-design.png') {
            setImageSrc('/mockups/placeholder-design.png');
          }
        }
      };
      
      img.onerror = (error) => {
        clearTimeout(timeoutId);
        console.error('Failed to load design image:', error);
        setIsLoading(false);
        setImageError(true);
        // Fall back to placeholder image
        if (designImage !== '/mockups/placeholder-design.png') {
          console.log('Falling back to placeholder image after error');
          setImageSrc('/mockups/placeholder-design.png');
        }
      };
      
      // Prepare the image URL
      let finalImageUrl = designImage;
      
      // Handle both data URLs and object URLs
      if (designImage.startsWith('blob:') || designImage.startsWith('data:')) {
        finalImageUrl = designImage;
        console.log('Loading blob/data URL');
      } else if (designImage.startsWith('/')) {
        // For relative URLs, ensure they're absolute
        finalImageUrl = `${window.location.origin}${designImage}`;
        console.log('Loading absolute URL from relative:', finalImageUrl);
      } else if (!designImage.startsWith('http://') && !designImage.startsWith('https://')) {
        // If it's not already an absolute URL and not a relative URL starting with /
        // assume it's a relative URL without the leading slash
        finalImageUrl = `${window.location.origin}/${designImage}`;
        console.log('Loading absolute URL from implied relative:', finalImageUrl);
      }
      
      // Set the image source
      img.src = finalImageUrl;
      setImageSrc(finalImageUrl);
      
      // Cleanup function
      return () => {
        clearTimeout(timeoutId);
        img.onload = null;
        img.onerror = null;
      };
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('Error creating image:', error);
      setIsLoading(false);
      setImageError(true);
      // Fall back to placeholder image
      if (designImage !== '/mockups/placeholder-design.png') {
        setImageSrc('/mockups/placeholder-design.png');
      }
      return () => {
        clearTimeout(timeoutId);
      };
    }
  }, [designImage]); // Remove isValidImageUrl from dependencies to prevent infinite updates

  // Determine the appropriate blend mode based on t-shirt color
  const getBlendMode = () => {
    if (categories.includes("Dark") || categories.includes("Black")) {
      return "screen";
    } else if (categories.includes("Colored") || 
               categories.includes("Red") || 
               categories.includes("Blue") || 
               categories.includes("Green")) {
      return "overlay";
    } else {
      // Default for white/light t-shirts
      return "multiply";
    }
  };

  // Determine opacity based on t-shirt color
  const getOpacity = () => {
    if (categories.includes("Dark") || categories.includes("Black")) {
      return 0.85;
    } else if (categories.includes("Colored")) {
      return 0.9;
    } else {
      return 0.95;
    }
  };

  // Calculate the scaling and positioning to fit the design within the placeholder
  const calculateDesignStyle = () => {
    if (!placeholder) return {};

    // Important: The MockupCanvas uses a fixed 400x400 canvas
    // We need to ensure we're using the same coordinate system
    const REFERENCE_CANVAS_WIDTH = 400;
    const REFERENCE_CANVAS_HEIGHT = 400;
    
    // CRITICAL: Store the original placeholder for debugging
    console.log('Original placeholder:', JSON.stringify(placeholder));
    
    // Convert placeholder to percentage-based coordinates for consistency
    const percentagePlaceholder = convertToPercentage(placeholder);
    
    // Store the percentage-based placeholder for consistency with editor
    if (typeof window !== 'undefined') {
      localStorage.setItem('percentagePlaceholderData', JSON.stringify(percentagePlaceholder));
    }
    
    // Convert back to absolute coordinates based on the current mockup dimensions
    const scaledPlaceholder = convertFromPercentage(
      percentagePlaceholder,
      mockupWidth,
      mockupHeight
    );
    
    // Log positioning information for debugging
    console.log(`Design overlay using percentage-based positioning`);
    console.log(`Mockup dimensions: ${mockupWidth}x${mockupHeight}`);
    console.log(`Original placeholder: x=${placeholder.x}, y=${placeholder.y}, w=${placeholder.width}, h=${placeholder.height}`);
    console.log(`Percentage placeholder: x=${percentagePlaceholder.xPercent}%, y=${percentagePlaceholder.yPercent}%, w=${percentagePlaceholder.widthPercent}%, h=${percentagePlaceholder.heightPercent}%`);
    console.log(`Scaled placeholder: x=${scaledPlaceholder.x}, y=${scaledPlaceholder.y}, w=${scaledPlaceholder.width}, h=${scaledPlaceholder.height}`);

    // If image dimensions couldn't be determined, use the placeholder dimensions
    if (isLoading || designDimensions.width === 0 || designDimensions.height === 0) {
      // Apply percentage-based positioning
      const style = {
        position: 'absolute' as const,
        left: `${scaledPlaceholder.x}px`,
        top: `${scaledPlaceholder.y}px`,
        width: `${scaledPlaceholder.width}px`,
        height: `${scaledPlaceholder.height}px`,
        objectFit: 'contain' as const,
        pointerEvents: 'none' as const,
        mixBlendMode: getBlendMode() as any,
        opacity: getOpacity(),
        // No border for cleaner appearance
      };
      console.log('Using placeholder dimensions for design style:', style);
      
      // Store percentage-based positioning for consistency with editor
      if (typeof window !== 'undefined') {
        localStorage.setItem('designPlaceholderData', JSON.stringify({
          ...percentagePlaceholder,
          maintainAspectRatio: true
        }));
      }
      
      return style;
    }

    // Calculate the aspect ratios
    const designAspectRatio = designDimensions.width / designDimensions.height;
    const placeholderAspectRatio = scaledPlaceholder.width / scaledPlaceholder.height;
    
    console.log('Design aspect ratio:', designAspectRatio);
    console.log('Placeholder aspect ratio:', placeholderAspectRatio);

    // Determine how to scale the design to fit the placeholder while maintaining aspect ratio
    let scale, offsetX = 0, offsetY = 0;

    if (designAspectRatio > placeholderAspectRatio) {
      // Design is wider than placeholder (relative to height)
      scale = scaledPlaceholder.width / designDimensions.width;
      // Center vertically
      offsetY = (scaledPlaceholder.height - (designDimensions.height * scale)) / 2;
      console.log('Design is wider - scaling by width, offsetY:', offsetY);
    } else {
      // Design is taller than placeholder (relative to width)
      scale = scaledPlaceholder.height / designDimensions.height;
      // Center horizontally
      offsetX = (scaledPlaceholder.width - (designDimensions.width * scale)) / 2;
      console.log('Design is taller - scaling by height, offsetX:', offsetX);
    }
    
    console.log('Calculated scale factor:', scale);

    // Calculate the final dimensions and position in pixels
    const scaledWidth = designDimensions.width * scale;
    const scaledHeight = designDimensions.height * scale;
    const left = scaledPlaceholder.x + offsetX;
    const top = scaledPlaceholder.y + offsetY;
    
    console.log('Scaled dimensions:', scaledWidth, 'x', scaledHeight);
    console.log('Position:', left, ',', top);
    
    // Store percentage-based positioning for consistency with editor
    if (typeof window !== 'undefined' && designImage) {
      const designId = designImage.split('/').pop()?.split('.')[0] || 'default';
      
      // Calculate percentage-based positioning relative to the canvas
      const percentagePositioning = {
        xPercent: (left / mockupWidth) * 100,
        yPercent: (top / mockupHeight) * 100,
        widthPercent: (scaledWidth / mockupWidth) * 100,
        heightPercent: (scaledHeight / mockupHeight) * 100,
        scale: scale,
        maintainAspectRatio: true
      };
      
      // Store for consistency with editor
      localStorage.setItem(`designPosition_${designId}`, JSON.stringify(percentagePositioning));
      localStorage.setItem('designPlaceholderData', JSON.stringify(percentagePositioning));
      
      console.log('Saved percentage positioning:', percentagePositioning);
    }

    // Apply additional adjustments based on t-shirt categories
    let adjustedTop = top;
    let adjustedLeft = left;
    let rotation = 0;
    let perspective = '';
    
    // Adjust vertical position based on t-shirt type
    if (categories.includes("Oversized")) {
      // Move design slightly higher on oversized shirts
      adjustedTop = top - (mockupHeight * 0.005); // Use percentage-based adjustment
    } else if (categories.includes("Closeup")) {
      // Center design more precisely on closeups
      adjustedTop = top - (mockupHeight * 0.0025);
    } else if (categories.includes("Mannequin")) {
      // Adjust for mannequin perspective
      adjustedTop = top - (mockupHeight * 0.0075);
      perspective = 'perspective(500px) rotateX(5deg)';
    }
    
    // Adjust for side view
    if (categories.includes("Side View")) {
      rotation = 15;
      adjustedLeft = left - (mockupWidth * 0.005);
    } else if (categories.includes("Back View")) {
      rotation = 0;
    }
    
    // Create the final style object with all adjustments
    const finalStyle = {
      position: 'absolute' as const,
      left: `${adjustedLeft}px`,
      top: `${adjustedTop}px`,
      width: `${scaledWidth}px`,
      height: `${scaledHeight}px`,
      objectFit: 'contain' as const,
      pointerEvents: 'none' as const,
      mixBlendMode: getBlendMode() as any,
      opacity: getOpacity(),
      transform: `${perspective} ${rotation ? `rotate(${rotation}deg)` : ''}`,
      transformOrigin: 'center center'
    };
    
    // Update the final percentage-based positioning if we applied category-specific adjustments
    if (typeof window !== 'undefined' && designImage && 
        (categories.includes("Oversized") || categories.includes("Closeup") || 
         categories.includes("Mannequin") || categories.includes("Side View"))) {
      
      const designId = designImage.split('/').pop()?.split('.')[0] || 'default';
      
      // Calculate adjusted percentage-based positioning
      const adjustedPercentagePositioning = {
        xPercent: (adjustedLeft / mockupWidth) * 100,
        yPercent: (adjustedTop / mockupHeight) * 100,
        widthPercent: (scaledWidth / mockupWidth) * 100,
        heightPercent: (scaledHeight / mockupHeight) * 100,
        scale: scale,
        maintainAspectRatio: true,
        rotation: rotation,
        perspective: perspective ? true : false
      };
      
      // Update stored positioning with adjustments
      localStorage.setItem(`designPosition_${designId}`, JSON.stringify(adjustedPercentagePositioning));
      localStorage.setItem('designPlaceholderData', JSON.stringify(adjustedPercentagePositioning));
      
      console.log('Saved adjusted percentage positioning:', adjustedPercentagePositioning);
    }
    
    console.log('Final design style:', finalStyle);
    return finalStyle;

  };
  
  if (!designImage || !placeholder) return null;

  const handlePointerDown = () => {
    console.log('Pointer down');
  };

  const handleKeyDown = () => {
    console.log('Key down');
  };

  // Calculate the style for the design image
  const designStyle = calculateDesignStyle();
  
  // Add debug information to help troubleshoot positioning issues
  const debugInfo = {
    originalPlaceholder: placeholder,
    mockupDimensions: { width: mockupWidth, height: mockupHeight },
    designDimensions: designDimensions,
    calculatedStyle: designStyle
  };
  
  console.log('PlaceholderDesignOverlay Debug:', debugInfo);
  
  // Create a clipping path SVG if we have custom shape points
  const clipPathId = useMemo(() => `clip-path-${Math.random().toString(36).substring(2, 9)}`, []);
  
  // Create the SVG path data for the clipping path
  const createClipPathData = () => {
    if (!customShapePoints || customShapePoints.length < 3) return null;
    
    // Scale the custom shape points to match the current canvas size
    const ADMIN_CANVAS_WIDTH = 400;
    const ADMIN_CANVAS_HEIGHT = 400;
    const scaleX = mockupWidth / ADMIN_CANVAS_WIDTH;
    const scaleY = mockupHeight / ADMIN_CANVAS_HEIGHT;
    
    // Create a path string for the clipping shape
    let pathData = `M${customShapePoints[0].x * scaleX},${customShapePoints[0].y * scaleY}`;
    
    for (let i = 1; i < customShapePoints.length; i++) {
      pathData += ` L${customShapePoints[i].x * scaleX},${customShapePoints[i].y * scaleY}`;
    }
    
    // Close the path
    pathData += ' Z';
    
    return pathData;
  };
  
  const clipPathData = createClipPathData();
  
  return (
    <div 
      className="absolute inset-0 overflow-hidden"
      data-testid="design-overlay-container"
      data-placeholder-x={placeholder.x}
      data-placeholder-y={placeholder.y}
      data-placeholder-width={placeholder.width}
      data-placeholder-height={placeholder.height}
    >
      {/* SVG for clipping path */}
      {clipPathData && (
        <svg 
          width="0" 
          height="0" 
          style={{ position: 'absolute', visibility: 'hidden' }}
        >
          <defs>
            <clipPath id={clipPathId}>
              <path d={clipPathData} />
            </clipPath>
          </defs>
        </svg>
      )}
      
      {/* Debug outline for placeholder area */}
      {process.env.NODE_ENV !== 'production' && (
        <>
          <div 
            style={{
              position: 'absolute',
              left: `${placeholder.x * (mockupWidth / 400)}px`,
              top: `${placeholder.y * (mockupHeight / 400)}px`,
              width: `${placeholder.width * (mockupWidth / 400)}px`,
              height: `${placeholder.height * (mockupHeight / 400)}px`,
              border: '1px dashed rgba(255, 0, 0, 0.5)',
              pointerEvents: 'none',
              zIndex: 10
            }}
          />
          
          {/* Debug visualization of custom shape points */}
          {clipPathData && (
            <svg 
              className="absolute inset-0 pointer-events-none" 
              style={{ zIndex: 9 }}
            >
              <path 
                d={clipPathData} 
                fill="none" 
                stroke="rgba(0, 255, 0, 0.5)" 
                strokeWidth="1" 
                strokeDasharray="4 2"
              />
            </svg>
          )}
        </>
      )}
      
      {/* Use a conditional rendering approach with multiple fallbacks */}
      {(() => {
        // Helper function to validate image URL format
        const isValidImageUrl = (url: string) => {
          if (!url) return false;
          // Check if it's a data URL or blob URL
          if (url.startsWith('data:') || url.startsWith('blob:')) {
            return true;
          }
          // Check if it's a relative URL starting with /
          if (url.startsWith('/')) {
            return true;
          }
          // Check if it's an absolute URL with http or https
          if (url.startsWith('http://') || url.startsWith('https://')) {
            return true;
          }
          return false;
        };
        
        // First, validate the image URL
        if (!isValidImageUrl(imageSrc)) {
          console.warn('Invalid image URL format:', imageSrc);
          return (
            <div 
              style={{
                ...designStyle,
                backgroundColor: 'rgba(200, 200, 200, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                clipPath: clipPathData ? `url(#${clipPathId})` : 'none'
              }}
              data-testid="design-overlay-invalid-url"
            >
              <div className="text-xs text-center p-2 text-gray-600">
                Invalid image format
              </div>
            </div>
          );
        }
        
        // If we've already encountered an error, show the fallback
        if (imageError) {
          return (
            <div 
              style={{
                ...designStyle,
                backgroundColor: 'rgba(200, 200, 200, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                clipPath: clipPathData ? `url(#${clipPathId})` : 'none'
              }}
              data-testid="design-overlay-fallback"
            >
              <div className="text-xs text-center p-2 text-gray-600">
                Design preview unavailable
              </div>
            </div>
          );
        }
        
        // Otherwise, try to render the image with safety measures
        return (
          <img
            key={`img-${imageSrc}`} // Force re-render on src change
            src={imageSrc}
            alt="Design overlay"
            style={{
              ...designStyle,
              clipPath: clipPathData ? `url(#${clipPathId})` : 'none'
            }}
            crossOrigin="anonymous"
            onLoad={() => {
              console.log('Image loaded successfully in render:', imageSrc);
              setIsLoading(false);
              setImageError(false);
            }}
            onError={(e) => {
              console.error('Error loading image in render:', e);
              setIsLoading(false);
              setImageError(true);
              
              // Try to fall back to placeholder image if the current src isn't already the placeholder
              if (imageSrc !== '/mockups/placeholder-design.png') {
                console.log('Falling back to placeholder image');
                setImageSrc('/mockups/placeholder-design.png');
              } else {
                console.error('Even placeholder image failed to load');
              }
            }}
            data-testid="design-overlay-image"
          />
        );
      })()}
      <div
        aria-describedby={uniqueAriaId}
        role="button"
        tabIndex={0}
        onPointerDown={handlePointerDown}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
};