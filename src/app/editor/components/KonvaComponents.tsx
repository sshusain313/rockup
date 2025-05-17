'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Stage, Layer, Image as KonvaImage, Group, Rect, Text, Line, Shape, Path, Circle } from 'react-konva';
import useImage from 'use-image';
import Konva from 'konva';
import { KonvaEventObject } from 'konva/lib/Node';

interface DesignCanvasProps {
  productImage: string;
  designImage: string | null;
  placeholder: any;
  containerWidth: number;
  containerHeight: number;
  categories?: string[];
  stageRef: React.RefObject<any>;
  maintainAspectRatio?: boolean;
  onToggleAspectRatio?: () => void;
  productName?: string;
  productDescription?: string;
  productPrice?: number;
  customShapePoints?: Array<{x: number, y: number}>;
  enableDesignDrag?: boolean; // Control whether the design can be dragged
  enableRotation?: boolean; // Control whether the design can be rotated
}

// Interface for mesh grid points
interface MeshPoint {
  x: number;
  y: number;
  originalX: number;
  originalY: number;
  displacementX: number;
  displacementY: number;
}

// Interface for surface properties
interface SurfaceProperties {
  bumpiness: number;      // 0-1: how bumpy the surface is
  elasticity: number;     // 0-1: how much the design stretches with the surface
  reflectivity: number;   // 0-1: how reflective the surface is
  textureScale: number;   // Scale of the texture pattern
  wrinklePattern: string; // Type of wrinkle pattern
}

const KonvaComponents = ({
  productImage,
  designImage,
  placeholder,
  containerWidth,
  containerHeight,
  categories = [],
  stageRef,
  maintainAspectRatio: propMaintainAspectRatio,
  onToggleAspectRatio,
  productName,
  productDescription,
  productPrice,
  customShapePoints = [],
  enableDesignDrag = true, // Default to true for design draggability
  enableRotation = true // Default to true for design rotation
}: DesignCanvasProps) => {
  // Load the product image
  const [productImg] = useImage(productImage);
  
  // Load the design image if available
  const [designImg] = useImage(designImage || '');
  
  // Load stored rotation from localStorage if available
  useEffect(() => {
    if (typeof window !== 'undefined' && designImage) {
      try {
        const storedRotation = localStorage.getItem('designRotation');
        if (storedRotation) {
          setDesignRotation(parseFloat(storedRotation));
        }
      } catch (error) {
        console.error('Error parsing stored rotation:', error);
      }
    }
  }, [designImage]);
  
  // State for design position, dimensions, and rotation
  const [designPosition, setDesignPosition] = useState({ x: 0, y: 0 });
  const [designDimensions, setDesignDimensions] = useState({ width: 0, height: 0 });
  const [designScale, setDesignScale] = useState(1);
  const [designRotation, setDesignRotation] = useState(0); // Rotation in degrees
  const [isRotating, setIsRotating] = useState(false); // Track rotation state
  const [rotationStartAngle, setRotationStartAngle] = useState(0); // Starting angle for rotation
  const [designCenter, setDesignCenter] = useState({ x: 0, y: 0 }); // Center point for rotation
  
  // State for dragging, resizing, and rotation functionality
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [selectedCorner, setSelectedCorner] = useState('');
  const [initialPointerPosition, setInitialPointerPosition] = useState({ x: 0, y: 0 });
  const [initialDesignPosition, setInitialDesignPosition] = useState({ x: 0, y: 0 });
  const [initialDesignDimensions, setInitialDesignDimensions] = useState({ width: 0, height: 0 });
  const [initialRotation, setInitialRotation] = useState(0);
  const [showBoundingBox, setShowBoundingBox] = useState(true); // Show bounding box by default
  const [showRotationControls, setShowRotationControls] = useState(true); // Show rotation controls by default
  
  // Refs to track the design group, bounding box, and rotation controls for direct manipulation
  const designGroupRef = useRef<Konva.Group>(null);
  const boundingBoxRef = useRef<Konva.Rect>(null);
  const rotationControlRef = useRef<Konva.Group>(null);
  const [maintainAspectRatio, setMaintainAspectRatio] = useState(
    propMaintainAspectRatio !== undefined ? propMaintainAspectRatio : true
  );
  
  // Update internal state when prop changes
  useEffect(() => {
    if (propMaintainAspectRatio !== undefined) {
      setMaintainAspectRatio(propMaintainAspectRatio);
    }
  }, [propMaintainAspectRatio]);
  
  // Update event listeners for keyboard shortcuts and clicking outside
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape key toggles the bounding box
      if (e.key === 'Escape') {
        setShowBoundingBox(!showBoundingBox);
        setShowRotationControls(!showRotationControls);
      }
      
      // Delete key can be used to remove the design (would need to be implemented)
      if (e.key === 'Delete' && showBoundingBox) {
        // This would need to be implemented with a callback to the parent component
        console.log('Delete key pressed while design selected');
      }
      
      // R key to reset rotation
      if (e.key === 'r' || e.key === 'R') {
        setDesignRotation(0);
      }
    };
    
    // We're keeping the bounding box visible by default, so we don't need to hide it on click outside
    // This makes the design always draggable and resizable
    
    // Add event listeners
    window.addEventListener('keydown', handleKeyDown);
    
    // Clean up event listeners
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [designPosition, designDimensions, showBoundingBox, showRotationControls, isDragging, isResizing]);
  
  // Reference dimensions used in PlaceholderDesignOverlay
  const REFERENCE_CANVAS_WIDTH = 400;
  const REFERENCE_CANVAS_HEIGHT = 400;
  
  // Calculate the scale to fit the product image in the reference canvas
  // This ensures consistent sizing between gallery and editor views
  const getProductScale = () => {
    if (!productImg) return 1;
    
    // Use the same scaling approach as in PlaceholderDesignOverlay
    return Math.min(
      REFERENCE_CANVAS_WIDTH / productImg.width,
      REFERENCE_CANVAS_HEIGHT / productImg.height
    );
  };
  
  // Get the product scale based on reference dimensions
  const referenceScale = getProductScale();
  
  // Calculate the container-to-reference ratio to adjust the scale for the actual container size
  const containerToReferenceRatio = Math.min(
    containerWidth / REFERENCE_CANVAS_WIDTH,
    containerHeight / REFERENCE_CANVAS_HEIGHT
  );
  
  // Final scale combines the reference scale with the container ratio
  const scale = referenceScale * containerToReferenceRatio;
  
  // Calculate the position to center the product image
  const x = productImg ? (containerWidth - productImg.width * scale) / 2 : 0;
  const y = productImg ? (containerHeight - productImg.height * scale) / 2 : 0;
  
  // Update design position and dimensions when placeholder or product image changes
  useEffect(() => {
    if (productImg && placeholder && designImg) {
      // Show the bounding box by default when a design is loaded
      setShowBoundingBox(true);
      setShowRotationControls(true);
      
      // Calculate and set the design center point for rotation
      const updateDesignCenter = () => {
        setDesignCenter({
          x: designPosition.x + designDimensions.width / 2,
          y: designPosition.y + designDimensions.height / 2
        });
      };
      
      // Call immediately and set up a timer to ensure it's calculated after state updates
      updateDesignCenter();
      const timerId = setTimeout(updateDesignCenter, 100);
      return () => clearTimeout(timerId);
      // CRITICAL: Use the exact same coordinate system and calculations as PlaceholderDesignOverlay
      // The MockupCanvas uses a fixed 400x400 canvas
      const REFERENCE_CANVAS_WIDTH = 400;
      const REFERENCE_CANVAS_HEIGHT = 400;
      
      // First check if we have stored percentage-based placeholder data from the gallery
      let percentagePlaceholder;
      if (typeof window !== 'undefined') {
        try {
          const storedPercentagePlaceholder = localStorage.getItem('percentagePlaceholderData');
          if (storedPercentagePlaceholder) {
            percentagePlaceholder = JSON.parse(storedPercentagePlaceholder);
            console.log('Using stored percentage placeholder data:', percentagePlaceholder);
          }
        } catch (error) {
          console.error('Error parsing stored percentage placeholder data:', error);
        }
      }
      
      // If we don't have stored data, calculate it from the placeholder
      if (!percentagePlaceholder) {
        percentagePlaceholder = {
          xPercent: (placeholder.x / REFERENCE_CANVAS_WIDTH) * 100,
          yPercent: (placeholder.y / REFERENCE_CANVAS_HEIGHT) * 100,
          widthPercent: (placeholder.width / REFERENCE_CANVAS_WIDTH) * 100,
          heightPercent: (placeholder.height / REFERENCE_CANVAS_HEIGHT) * 100
        };
        console.log('Calculated percentage placeholder data:', percentagePlaceholder);
      }
      
      // Convert back to absolute coordinates based on the current container dimensions
      const scaledPlaceholder = {
        x: (percentagePlaceholder.xPercent / 100) * containerWidth,
        y: (percentagePlaceholder.yPercent / 100) * containerHeight,
        width: (percentagePlaceholder.widthPercent / 100) * containerWidth,
        height: (percentagePlaceholder.heightPercent / 100) * containerHeight
      };
      
      console.log(`KonvaComponents using percentage-based positioning`);
      console.log(`Container dimensions: ${containerWidth}x${containerHeight}`);
      console.log(`Original placeholder: x=${placeholder.x}, y=${placeholder.y}, w=${placeholder.width}, h=${placeholder.height}`);
      console.log(`Percentage placeholder: x=${percentagePlaceholder.xPercent}%, y=${percentagePlaceholder.yPercent}%, w=${percentagePlaceholder.widthPercent}%, h=${percentagePlaceholder.heightPercent}%`);
      console.log(`Scaled placeholder: x=${scaledPlaceholder.x}, y=${scaledPlaceholder.y}, w=${scaledPlaceholder.width}, h=${scaledPlaceholder.height}`);
      
      // Calculate the design dimensions based on the placeholder
      if (designImg) {
        // Calculate the aspect ratios
        const designAspectRatio = designImg.width / designImg.height;
        const placeholderAspectRatio = scaledPlaceholder.width / scaledPlaceholder.height;
        
        console.log('Design aspect ratio:', designAspectRatio);
        console.log('Placeholder aspect ratio:', placeholderAspectRatio);
        console.log('Design dimensions:', designImg.width, 'x', designImg.height);

        // Determine how to scale the design to fit the placeholder while maintaining aspect ratio
        let scale, offsetX = 0, offsetY = 0;
        let finalWidth, finalHeight;

        // Check if we have stored design position data from the gallery
        let storedDesignPosition;
        if (typeof window !== 'undefined' && designImage) {
          try {
            const designId = designImage.split('/').pop()?.split('.')[0] || 'default';
            const storedData = localStorage.getItem(`designPosition_${designId}`);
            if (storedData) {
              storedDesignPosition = JSON.parse(storedData);
              console.log('Using stored design position data:', storedDesignPosition);
            }
          } catch (error) {
            console.error('Error parsing stored design position data:', error);
          }
        }

        if (maintainAspectRatio) {
          // Special handling for small images to ensure consistent alignment
          const isSmallDesign = designImg.width < 100 || designImg.height < 100;
          
          // For small images, we need to exactly match the TShirtGallery positioning
          // First try to get the stored design position data from localStorage
          const designPositionData = localStorage.getItem('designPlaceholderData');
          
          if ((storedDesignPosition || designPositionData) && isSmallDesign) {
            // Prefer the specific design position if available, otherwise use the placeholder data
            const positionData = storedDesignPosition || JSON.parse(designPositionData || '{}');
            console.log('Using stored position data for small design:', positionData);
            
            // Use the exact same scale from the gallery view
            scale = positionData.scale || 1;
            console.log('Using stored scale for small design:', scale);
            
            // Calculate dimensions based on the scale
            finalWidth = designImg.width * scale;
            finalHeight = designImg.height * scale;
            
            // Use the EXACT same reference dimensions as in TShirtGallery (400x400)
            const GALLERY_CANVAS_WIDTH = 400;
            const GALLERY_CANVAS_HEIGHT = 400;
            
            // Calculate the ratio between the container and gallery canvas
            const widthRatio = containerWidth / GALLERY_CANVAS_WIDTH;
            const heightRatio = containerHeight / GALLERY_CANVAS_HEIGHT;
            
            // Calculate absolute position based on percentage values and the same ratios
            // This ensures the position is exactly the same as in the gallery
            const designX = (positionData.xPercent / 100) * containerWidth;
            const designY = (positionData.yPercent / 100) * containerHeight;
            
            // Update position using the calculated values
            setDesignPosition({
              x: designX,
              y: designY
            });
            
            console.log('Using exact gallery position for small design:', designX, designY);
          } else {
            // Standard scaling logic for normal-sized images
            if (designAspectRatio > placeholderAspectRatio) {
              // Design is wider than placeholder (relative to height)
              scale = scaledPlaceholder.width / designImg.width;
              // Center vertically
              offsetY = (scaledPlaceholder.height - (designImg.height * scale)) / 2;
              console.log('Design is wider - scaling by width, offsetY:', offsetY);
            } else {
              // Design is taller than placeholder (relative to width)
              scale = scaledPlaceholder.height / designImg.height;
              // Center horizontally
              offsetX = (scaledPlaceholder.width - (designImg.width * scale)) / 2;
              console.log('Design is taller - scaling by height, offsetX:', offsetX);
            }
            
            console.log('Calculated scale factor:', scale);

            // Calculate the final dimensions and position in pixels
            finalWidth = designImg.width * scale;
            finalHeight = designImg.height * scale;
            
            // Update position to center the design within the placeholder
            setDesignPosition({ 
              x: scaledPlaceholder.x + offsetX, 
              y: scaledPlaceholder.y + offsetY 
            });
          }
          
          // Store the scale for reference
          setDesignScale(scale);
        } else {
          // Use exact placeholder dimensions (no aspect ratio preservation)
          finalWidth = scaledPlaceholder.width;
          finalHeight = scaledPlaceholder.height;
          
          // Position at the placeholder coordinates without offsets
          setDesignPosition({ 
            x: scaledPlaceholder.x, 
            y: scaledPlaceholder.y 
          });
        }
        
        // Set the final dimensions
        setDesignDimensions({
          width: finalWidth,
          height: finalHeight
        });
        
        console.log('Design positioning:');
        console.log('Final design position:', { x: scaledPlaceholder.x + offsetX, y: scaledPlaceholder.y + offsetY });
        console.log('Final design dimensions:', { width: finalWidth, height: finalHeight });
        
        // Store percentage-based positioning for consistency with PlaceholderDesignOverlay
        if (typeof window !== 'undefined' && designImage) {
          const designId = typeof designImage === 'string' ? designImage.split('/').pop()?.split('.')[0] || 'default' : 'default';
          
          // Calculate percentage-based positioning relative to the canvas
          const percentagePositioning = {
            xPercent: ((scaledPlaceholder.x + offsetX) / containerWidth) * 100,
            yPercent: ((scaledPlaceholder.y + offsetY) / containerHeight) * 100,
            widthPercent: (finalWidth / containerWidth) * 100,
            heightPercent: (finalHeight / containerHeight) * 100,
            scale: scale,
            maintainAspectRatio: maintainAspectRatio
          };
          
          // Store for consistency with PlaceholderDesignOverlay
          localStorage.setItem(`designPosition_${designId}`, JSON.stringify(percentagePositioning));
          localStorage.setItem('designPlaceholderData', JSON.stringify(percentagePositioning));
          
          console.log('Saved percentage positioning:', percentagePositioning);
        }
      }
    }
  }, [productImg, designImg, placeholder, containerWidth, containerHeight, maintainAspectRatio, designImage]);
  
  // Determine the appropriate blend mode based on t-shirt color
  const getBlendMode = () => {
    if (categories.includes("Dark") || categories.includes("Black")) {
      return 'screen';
    } else if (categories.includes("Colored")) {
      return 'multiply';
    } else {
      return 'multiply'; // Default for light colors
    }
  };
  
  // Create a clipping function for the custom shape
  const createClippingPath = () => {
    // If no custom shape points are provided, return null
    if (!customShapePoints || customShapePoints.length < 3) {
      return null;
    }
    
    // Use the same percentage-based scaling approach as the design positioning
    const REFERENCE_CANVAS_WIDTH = 400;
    const REFERENCE_CANVAS_HEIGHT = 400;
    
    // Create a scaled version of the custom shape points using percentage-based scaling
    const scaledPoints = customShapePoints.map(point => {
      // Convert point to percentage-based coordinates
      const xPercent = (point.x / REFERENCE_CANVAS_WIDTH) * 100;
      const yPercent = (point.y / REFERENCE_CANVAS_HEIGHT) * 100;
      
      // Convert back to absolute coordinates based on current container dimensions
      return {
        x: (xPercent / 100) * containerWidth,
        y: (yPercent / 100) * containerHeight
      };
    });
    
    // Create a path string for the clipping shape
    let pathData = `M${scaledPoints[0].x},${scaledPoints[0].y}`;
    
    for (let i = 1; i < scaledPoints.length; i++) {
      pathData += ` L${scaledPoints[i].x},${scaledPoints[i].y}`;
    }
    
    // Close the path
    pathData += ' Z';
    
    return pathData;
  };
  
  // Calculate opacity based on product type
  const getOpacity = () => {
    if (categories.includes("Dark") || categories.includes("Black")) {
      return 0.9;
    } else {
      return 0.95;
    }
  };
  
  // Determine if we should apply a distortion effect
  const shouldApplyDistortion = () => {
    return categories.includes("T-Shirts") || 
           categories.includes("Apparel") || 
           categories.includes("Fabric") ||
           categories.some(cat => [
             "Cotton", "Polyester", "Linen", "Silk", "Wool", 
             "Jersey", "Canvas", "Denim"
           ].includes(cat));
  };
  
  // Calculate distortion parameters based on product type
  const getDistortionParams = () => {
    if (categories.includes("Mannequin")) {
      return {
        perspective: true,
        curvature: 0.05,
        rotation: [0, 5, 0], // X, Y, Z rotation in degrees
        waveAmplitude: 2.5,   // Strength of fabric waves
        waveFrequency: 0.02,  // Frequency of fabric waves
        wrinkleIntensity: 0.8, // Intensity of wrinkles (0-1)
        meshResolution: 12,   // Higher = more detailed mesh but more expensive
        displacementStrength: 0.8 // How strongly the mesh deforms
      };
    } else if (categories.includes("Side View")) {
      return {
        perspective: true,
        curvature: 0.02,
        rotation: [0, 15, 0],
        waveAmplitude: 2.0,
        waveFrequency: 0.015,
        wrinkleIntensity: 0.6,
        meshResolution: 10,
        displacementStrength: 0.7
      };
    } else if (categories.some(cat => ["Cotton", "Linen", "Canvas"].includes(cat))) {
      return {
        perspective: false,
        curvature: 0.01,
        rotation: [0, 0, 0],
        waveAmplitude: 1.8,
        waveFrequency: 0.025,
        wrinkleIntensity: 0.7,
        meshResolution: 12,
        displacementStrength: 0.65
      };
    } else if (categories.some(cat => ["Silk", "Polyester"].includes(cat))) {
      return {
        perspective: false,
        curvature: 0.005,
        rotation: [0, 0, 0],
        waveAmplitude: 1.0,
        waveFrequency: 0.01,
        wrinkleIntensity: 0.4,
        meshResolution: 8,
        displacementStrength: 0.3
      };
    } else if (categories.some(cat => ["Denim", "Leather"].includes(cat))) {
      return {
        perspective: false,
        curvature: 0.015,
        rotation: [0, 0, 0],
        waveAmplitude: 1.2,
        waveFrequency: 0.03,
        wrinkleIntensity: 0.6,
        meshResolution: 10,
        displacementStrength: 0.5
      };
    } else {
      return {
        perspective: false,
        curvature: 0.01,
        rotation: [0, 0, 0],
        waveAmplitude: 1.5,
        waveFrequency: 0.015,
        wrinkleIntensity: 0.5,
        meshResolution: 8,
        displacementStrength: 0.4
      };
    }
  };
  
  // Get surface properties based on product material
  const getSurfaceProperties = (): SurfaceProperties => {
    if (categories.some(cat => ["Cotton", "Linen", "Canvas"].includes(cat))) {
      return {
        bumpiness: 0.7,
        elasticity: 0.5,
        reflectivity: 0.2,
        textureScale: 0.8,
        wrinklePattern: 'organic'
      };
    } else if (categories.some(cat => ["Silk", "Polyester"].includes(cat))) {
      return {
        bumpiness: 0.2,
        elasticity: 0.8,
        reflectivity: 0.6,
        textureScale: 0.5,
        wrinklePattern: 'smooth'
      };
    } else if (categories.some(cat => ["Denim", "Leather"].includes(cat))) {
      return {
        bumpiness: 0.8,
        elasticity: 0.3,
        reflectivity: 0.4,
        textureScale: 1.0,
        wrinklePattern: 'structured'
      };
    } else if (categories.includes("Mannequin")) {
      return {
        bumpiness: 0.6,
        elasticity: 0.7,
        reflectivity: 0.3,
        textureScale: 0.9,
        wrinklePattern: 'form-fitted'
      };
    } else {
      return {
        bumpiness: 0.5,
        elasticity: 0.5,
        reflectivity: 0.3,
        textureScale: 0.7,
        wrinklePattern: 'standard'
      };
    }
  };
  
  // Debug info
  useEffect(() => {
    if (productImg && designImg) {
      console.log('Canvas dimensions:', containerWidth, 'x', containerHeight);
      console.log('Product image dimensions:', productImg.width, 'x', productImg.height);
      console.log('Design image dimensions:', designImg.width, 'x', designImg.height);
      console.log('Product scale:', scale);
      console.log('Product position:', x, y);
      console.log('Design scale:', designScale);
      console.log('Design position:', designPosition);
      console.log('Categories:', categories);
      console.log('Blend mode:', getBlendMode());
    }
  }, [productImg, designImg, containerWidth, containerHeight, scale, x, y, designScale, designPosition, categories]);
  
  // Apply a shadow effect to the design
  const getShadowParams = () => {
    if (categories.includes("Dark") || categories.includes("Black")) {
      return {
        shadowColor: 'rgba(255, 255, 255, 0.2)',
        shadowBlur: 3,
        shadowOffset: { x: 1, y: 1 },
        shadowOpacity: 0.3
      };
    } else {
      return {
        shadowColor: 'rgba(0, 0, 0, 0.2)',
        shadowBlur: 3,
        shadowOffset: { x: 1, y: 1 },
        shadowOpacity: 0.3
      };
    }
  };
  
  // Get distortion parameters
  const distortionParams = getDistortionParams();
  const shadowParams = getShadowParams();
  
  // Toggle aspect ratio maintenance
  const toggleAspectRatio = () => {
    const newValue = !maintainAspectRatio;
    setMaintainAspectRatio(newValue);
    
    // Call the parent callback if provided
    if (onToggleAspectRatio) {
      onToggleAspectRatio();
    }
  };

  return (
    <>
    {process.env.NODE_ENV !== 'production' && (
        <div className="mb-2 flex items-center">
          <button
            onClick={toggleAspectRatio}
            className={`px-2 py-1 text-xs rounded ${
              maintainAspectRatio 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-300 text-gray-700'
            }`}
          >
            {maintainAspectRatio ? 'Maintaining Aspect Ratio' : 'Using Exact Placeholder Size'}
          </button>
          <span className="ml-2 text-xs text-gray-500">
            Click to toggle between maintaining aspect ratio and exact placeholder dimensions
          </span>
        </div>
      )}
      
      <Stage width={containerWidth} height={containerHeight} ref={stageRef}>
        <Layer>
          {/* Product info overlay */}
          {productName && (
            <Group>
              <Rect
                x={10}
                y={containerHeight - 100}
                width={containerWidth - 20}
                height={90}
                fill="rgba(255, 255, 255, 0.8)"
                cornerRadius={5}
                shadowColor="black"
                shadowBlur={5}
                shadowOpacity={0.2}
                shadowOffsetX={0}
                shadowOffsetY={2}
              />
              <Text
                x={20}
                y={containerHeight - 90}
                text={productName || ''}
                fontSize={18}
                fontStyle="bold"
                fill="#333"
                width={containerWidth - 40}
              />
              {productDescription && (
                <Text
                  x={20}
                  y={containerHeight - 65}
                  text={productDescription.length > 100 ? productDescription.substring(0, 100) + '...' : productDescription}
                  fontSize={12}
                  fill="#666"
                  width={containerWidth - 40}
                />
              )}
              {productPrice !== undefined && (
                <Text
                  x={20}
                  y={containerHeight - 30}
                  text={`Price: $${productPrice.toFixed(2)}`}
                  fontSize={14}
                  fontStyle="bold"
                  fill="#2563eb"
                  width={containerWidth - 40}
                />
              )}
            </Group>
          )}
        
          {/* Product image - sized to match TShirtGallery */}
          {productImg && (
            <KonvaImage
              image={productImg}
              x={x}
              y={y}
              width={productImg.width * scale}
              height={productImg.height * scale}
              // Apply a small adjustment to ensure consistent alignment with gallery view
              offsetX={-0.5}
              offsetY={-0.5}
            />
          )}
        
        {/* Design overlay - Positioned exactly according to placeholder */}
        {designImg && placeholder && designDimensions.width > 0 && (
          <Group
              ref={designGroupRef}
              x={designPosition.x}
              y={designPosition.y}
              rotation={designRotation} // Use our custom rotation value
              skewX={distortionParams.perspective ? distortionParams.curvature : 0}
              offset={{ x: designDimensions.width / 2, y: designDimensions.height / 2 }} // Set rotation point to center
              draggable={enableDesignDrag}
              onDragStart={(e) => {
                e.cancelBubble = true; // Prevent event bubbling
                setIsDragging(true);
                setInitialDesignPosition({ ...designPosition });
              }}
              onDragMove={(e) => {
                e.cancelBubble = true; // Prevent event bubbling
                // Update the design position as the group is dragged
                const newPos = {
                  x: e.target.x(),
                  y: e.target.y()
                };
                setDesignPosition(newPos);
                
                // Update the bounding box position to match
                if (boundingBoxRef.current) {
                  boundingBoxRef.current.position({
                    x: newPos.x,
                    y: newPos.y
                  });
                }
              }}
              onDragEnd={(e) => {
                setIsDragging(false);
                // Get the final position directly from the event
                const finalPosition = {
                  x: e.target.x(),
                  y: e.target.y()
                };
                
                // Update state with the final position
                setDesignPosition(finalPosition);
                
                // Update the bounding box position to match
                if (boundingBoxRef.current) {
                  boundingBoxRef.current.position(finalPosition);
                }
                
                // Save the position and rotation to localStorage for persistence
                localStorage.setItem('designPosition', JSON.stringify(finalPosition));
                localStorage.setItem('designRotation', designRotation.toString());
              }}
              clipFunc={customShapePoints && customShapePoints.length > 2 ? (ctx) => {
                // Create a clipping path from the custom shape points
                if (customShapePoints.length < 3) return;
                // Scale the custom shape points to match the current canvas size
                const ADMIN_CANVAS_WIDTH = 400;
                const ADMIN_CANVAS_HEIGHT = 400;
                const scaleX = containerWidth / ADMIN_CANVAS_WIDTH;
                const scaleY = containerHeight / ADMIN_CANVAS_HEIGHT;
                // Calculate the offset from the placeholder to the custom shape
                // This is critical to align the clipping path with the design
                const offsetX = placeholder.x * scaleX - designPosition.x;
                const offsetY = placeholder.y * scaleY - designPosition.y;
                ctx.beginPath();
                const firstPoint = customShapePoints[0];
                const designToPlaceholderRatioX = designDimensions.width / (placeholder.width * scaleX);
                const designToPlaceholderRatioY = designDimensions.height / (placeholder.height * scaleY);
                ctx.moveTo(
                  (firstPoint.x - placeholder.x) * scaleX * designToPlaceholderRatioX,
                  (firstPoint.y - placeholder.y) * scaleY * designToPlaceholderRatioY
                );
                for (let i = 1; i < customShapePoints.length; i++) {
                  const point = customShapePoints[i];
                  ctx.lineTo(
                    (point.x - placeholder.x) * scaleX * designToPlaceholderRatioX,
                    (point.y - placeholder.y) * scaleY * designToPlaceholderRatioY
                  );
                }
                ctx.closePath();
              } : undefined}
            >
              {/* Fabric surface simulation */}
              {shouldApplyDistortion() && (
              <Shape
                sceneFunc={(context: Konva.Context, shape: Konva.Shape) => {
                  const width = designDimensions.width;
                  const height = designDimensions.height;
                  const { waveAmplitude, waveFrequency, wrinkleIntensity } = distortionParams;
                  
                  // Create a gradient for the fabric surface
                  const gradient = context.createLinearGradient(0, 0, 0, height);
                  
                  if (categories.includes("Dark") || categories.includes("Black")) {
                    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.05)');
                    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.02)');
                    gradient.addColorStop(1, 'rgba(255, 255, 255, 0.08)');
                  } else {
                    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.02)');
                    gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.01)');
                    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.03)');
                  }
                  
                  // Draw fabric surface with wrinkles
                  context.beginPath();
                  
                  // Top edge with wrinkles
                  context.moveTo(0, 0);
                  for (let x = 0; x <= width; x += 10) {
                    const wrinkleY = Math.sin(x * waveFrequency) * waveAmplitude * wrinkleIntensity;
                    context.lineTo(x, wrinkleY);
                  }
                  
                  // Right edge with wrinkles
                  for (let y = 0; y <= height; y += 10) {
                    const wrinkleX = width + Math.sin(y * waveFrequency * 0.8) * waveAmplitude * wrinkleIntensity * 0.7;
                    context.lineTo(wrinkleX, y);
                  }
                  
                  // Bottom edge with wrinkles
                  for (let x = width; x >= 0; x -= 10) {
                    const wrinkleY = height + Math.sin(x * waveFrequency * 1.2) * waveAmplitude * wrinkleIntensity * 0.6;
                    context.lineTo(x, wrinkleY);
                  }
                  
                  // Left edge with wrinkles
                  for (let y = height; y >= 0; y -= 10) {
                    const wrinkleX = Math.sin(y * waveFrequency * 0.9) * waveAmplitude * wrinkleIntensity * 0.5;
                    context.lineTo(wrinkleX, y);
                  }
                  
                  context.closePath();
                  context.fillStyle = gradient;
                  context.fill();
                  
                  // Draw subtle wrinkle lines across the fabric
                  const wrinkleCount = Math.floor(height / 30);
                  context.strokeStyle = categories.includes("Dark") || categories.includes("Black") 
                    ? 'rgba(255, 255, 255, 0.03)' 
                    : 'rgba(0, 0, 0, 0.03)';
                  context.lineWidth = 0.5;
                  
                  for (let i = 1; i < wrinkleCount; i++) {
                    const y = (height / wrinkleCount) * i;
                    context.beginPath();
                    context.moveTo(0, y);
                    
                    for (let x = 0; x <= width; x += 5) {
                      const wrinkleY = y + Math.sin(x * waveFrequency * 2) * waveAmplitude * wrinkleIntensity * 0.4;
                      context.lineTo(x, wrinkleY);
                    }
                    
                    context.stroke();
                  }
                }}
                opacity={0.7}
                shadowColor={shadowParams.shadowColor}
                shadowBlur={shadowParams.shadowBlur * 1.5}
                shadowOffsetX={shadowParams.shadowOffset.x}
                shadowOffsetY={shadowParams.shadowOffset.y}
                shadowOpacity={shadowParams.shadowOpacity * 0.7}
              />
            )}
            
            {/* Advanced Mesh Deformation for Design */}
            {shouldApplyDistortion() && designImg && (
              <DisplacementMesh
                image={designImg}
                width={designDimensions.width}
                height={designDimensions.height}
                distortionParams={distortionParams}
                surfaceProperties={getSurfaceProperties()}
                categories={categories}
                blendMode={getBlendMode()}
                opacity={getOpacity()}
                shadowParams={shadowParams}
                customShapePoints={customShapePoints}
                containerWidth={containerWidth}
                containerHeight={containerHeight}
                designPosition={designPosition}
              />
            )}
            
            {/* Fallback for when distortion is disabled */}
              {!shouldApplyDistortion() && (
              <KonvaImage
                image={designImg}
                width={designDimensions.width}
                height={designDimensions.height}
                globalCompositeOperation={getBlendMode()}
                opacity={getOpacity()}
                shadowColor={shadowParams.shadowColor}
                shadowBlur={shadowParams.shadowBlur}
                shadowOffsetX={shadowParams.shadowOffset.x}
                shadowOffsetY={shadowParams.shadowOffset.y}
                shadowOpacity={shadowParams.shadowOpacity}
              />
            )}
            
            {/* Debug visualization of custom shape points */}
              {customShapePoints && customShapePoints.length > 2 && (
              <Shape
                sceneFunc={(context, shape) => {
                  // Scale the custom shape points to match the current canvas size
                  const ADMIN_CANVAS_WIDTH = 400;
                  const ADMIN_CANVAS_HEIGHT = 400;
                  const scaleX = containerWidth / ADMIN_CANVAS_WIDTH;
                  const scaleY = containerHeight / ADMIN_CANVAS_HEIGHT;
                  
                  // Calculate the offset from the placeholder to the custom shape
                  const offsetX = placeholder.x * scaleX - designPosition.x;
                  const offsetY = placeholder.y * scaleY - designPosition.y;
                  
                  // Draw the custom shape outline for debugging
                  context.beginPath();
                  
                  // Move to the first point
                  const firstPoint = customShapePoints[0];
                  
                  // Use the same transformation as in the clipping function
                  const designToPlaceholderRatioX = designDimensions.width / (placeholder.width * scaleX);
                  const designToPlaceholderRatioY = designDimensions.height / (placeholder.height * scaleY);
                  
                  context.moveTo(
                    (firstPoint.x - placeholder.x) * scaleX * designToPlaceholderRatioX, 
                    (firstPoint.y - placeholder.y) * scaleY * designToPlaceholderRatioY
                  );
                  
                  // Draw lines to each subsequent point
                  for (let i = 1; i < customShapePoints.length; i++) {
                    const point = customShapePoints[i];
                    context.lineTo(
                      (point.x - placeholder.x) * scaleX * designToPlaceholderRatioX, 
                      (point.y - placeholder.y) * scaleY * designToPlaceholderRatioY
                    );
                  }
                  
                  // Close the path
                  context.closePath();
                  
                  // Stroke the path with a visible color
                  context.strokeStyle = 'rgba(255, 0, 0, 0.5)';
                  context.lineWidth = 2;
                  context.stroke();
                  
                  // Fill with a semi-transparent color
                  context.fillStyle = 'rgba(255, 0, 0, 0.1)';
                  context.fill();
                  
                  context.fillStrokeShape(shape);
                }}
              />
            )}
            
            {/* Fabric highlights and shadows overlay */}
            {shouldApplyDistortion() && (
              <Shape
                sceneFunc={(context: Konva.Context, shape: Konva.Shape) => {
                  const width = designDimensions.width;
                  const height = designDimensions.height;
                  const { waveAmplitude, waveFrequency, wrinkleIntensity } = distortionParams;
                  
                  // Create highlights on the fabric edges
                  const isDark = categories.includes("Dark") || categories.includes("Black");
                  
                  // Top highlight/shadow
                  context.beginPath();
                  context.moveTo(0, 0);
                  for (let x = 0; x <= width; x += 5) {
                    const y = Math.sin(x * waveFrequency * 1.5) * waveAmplitude * wrinkleIntensity * 0.8;
                    context.lineTo(x, y);
                  }
                  context.lineTo(width, 0);
                  context.closePath();
                  
                  const topGradient = context.createLinearGradient(0, 0, 0, waveAmplitude * 2);
                  if (isDark) {
                    topGradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
                    topGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
                  } else {
                    topGradient.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
                    topGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
                  }
                  context.fillStyle = topGradient;
                  context.fill();
                  
                  // Bottom shadow
                  context.beginPath();
                  context.moveTo(0, height);
                  for (let x = 0; x <= width; x += 5) {
                    const y = height - Math.sin(x * waveFrequency * 1.2) * waveAmplitude * wrinkleIntensity * 0.6;
                    context.lineTo(x, y);
                  }
                  context.lineTo(width, height);
                  context.closePath();
                  
                  const bottomGradient = context.createLinearGradient(0, height - waveAmplitude * 2, 0, height);
                  if (isDark) {
                    bottomGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
                    bottomGradient.addColorStop(1, 'rgba(0, 0, 0, 0.15)');
                  } else {
                    bottomGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
                    bottomGradient.addColorStop(1, 'rgba(0, 0, 0, 0.08)');
                  }
                  context.fillStyle = bottomGradient;
                  context.fill();
                }}
                opacity={0.8}
                globalCompositeOperation="overlay"
              />
            )}
          </Group>
        )}
        
        {/* Interactive bounding box with resize handles */}
        {designImg && placeholder && designDimensions.width > 0 && showBoundingBox && (
          <Group 
            rotation={designRotation} 
            x={designPosition.x} 
            y={designPosition.y}
            offset={{ x: designDimensions.width / 2, y: designDimensions.height / 2 }} // Set rotation point to center
          >
            {/* Bounding box with move cursor */}
            <Rect
              ref={boundingBoxRef}
              x={0}
              y={0}
              width={designDimensions.width}
              height={designDimensions.height}
              stroke='#1a73e8'
              strokeWidth={2}
              dash={[]}
              fill='rgba(26, 115, 232, 0.05)'
              listening={true}
              onMouseEnter={(e) => {
                const container = e.target.getStage()?.container();
                if (container) {
                  container.style.cursor = 'move';
                }
              }}
              onMouseLeave={(e) => {
                const container = e.target.getStage()?.container();
                if (container) {
                  container.style.cursor = 'default';
                }
              }}
              onClick={() => setShowBoundingBox(true)}
              onTap={() => setShowBoundingBox(true)}
              draggable={true}
              onDragStart={(e) => {
                e.cancelBubble = true; // Prevent event bubbling
                setIsDragging(true);
                setInitialDesignPosition({ ...designPosition });
              }}
              onDragMove={(e) => {
                e.cancelBubble = true; // Prevent event bubbling
                // Update the design position as the bounding box is dragged
                const newPos = {
                  x: e.target.x(),
                  y: e.target.y()
                };
                setDesignPosition(newPos);
                
                // Directly update the design group position for immediate visual feedback
                if (designGroupRef.current) {
                  designGroupRef.current.position({
                    x: newPos.x,
                    y: newPos.y
                  });
                }
              }}
              onDragEnd={(e) => {
                e.cancelBubble = true; // Prevent event bubbling
                setIsDragging(false);
                
                // Get the final position
                const finalPosition = {
                  x: e.target.x(),
                  y: e.target.y()
                };
                
                // Update state with the final position
                setDesignPosition(finalPosition);
                
                // Save the final position
                localStorage.setItem('designPosition', JSON.stringify(finalPosition));
                
                // Ensure the design group is in the final position
                if (designGroupRef.current) {
                  designGroupRef.current.position(finalPosition);
                }
                
                // Store percentage-based position for consistency
                if (containerWidth && containerHeight) {
                  const percentagePosition = {
                    xPercent: (finalPosition.x / containerWidth) * 100,
                    yPercent: (finalPosition.y / containerHeight) * 100
                  };
                  localStorage.setItem('designPercentagePosition', JSON.stringify(percentagePosition));
                }
              }}
            />
            
            {/* Resize handles - 4 corners */}
            {/* Top-left corner */}
            <Rect
              x={-5}
              y={-5}
              width={10}
              height={10}
              fill='white'
              stroke='#1a73e8'
              strokeWidth={1}
              draggable={true}
              onMouseEnter={(e) => {
                const container = e.target.getStage()?.container();
                if (container) {
                  container.style.cursor = 'nwse-resize';
                }
              }}
              onMouseLeave={(e) => {
                const container = e.target.getStage()?.container();
                if (container) {
                  container.style.cursor = 'default';
                }
              }}
              onDragStart={(e) => {
                e.cancelBubble = true; // Prevent event bubbling
                setIsResizing(true);
                setSelectedCorner('top-left');
                setInitialPointerPosition({ x: e.evt.clientX, y: e.evt.clientY });
                setInitialDesignPosition({ ...designPosition });
                setInitialDesignDimensions({ ...designDimensions });
              }}
              onDragMove={(e) => {
                e.cancelBubble = true; // Prevent event bubbling
                const newX = e.target.x() + 5;
                const newY = e.target.y() + 5;
                const deltaX = newX - initialDesignPosition.x;
                const deltaY = newY - initialDesignPosition.y;
                
                // Calculate new dimensions (with minimum size constraint)
                const newWidth = Math.max(20, initialDesignDimensions.width - deltaX);
                const newHeight = Math.max(20, initialDesignDimensions.height - deltaY);
                
                // Update position and dimensions
                setDesignPosition({
                  x: newX,
                  y: newY
                });
                setDesignDimensions({
                  width: newWidth,
                  height: newHeight
                });
                
                // Directly update the design group for immediate visual feedback
                if (designGroupRef.current) {
                  designGroupRef.current.position({
                    x: newX,
                    y: newY
                  });
                  
                  // Update all children to reflect the new dimensions
                  const children = designGroupRef.current.getChildren();
                  children.forEach(child => {
                    if (child.getClassName() === 'Image' || child.getClassName() === 'Shape') {
                      child.size({
                        width: newWidth,
                        height: newHeight
                      });
                    }
                  });
                }
                
                // Reset handle position to corner
                e.target.position({
                  x: newX - 5,
                  y: newY - 5
                });
              }}
              onDragEnd={() => {
                setIsResizing(false);
              }}
            />
            
            {/* Top-right corner */}
            <Rect
              x={designDimensions.width - 5}
              y={-5}
              width={10}
              height={10}
              fill='white'
              stroke='#1a73e8'
              strokeWidth={1}
              draggable={true}
              onMouseEnter={(e) => {
                const container = e.target.getStage()?.container();
                if (container) {
                  container.style.cursor = 'nesw-resize';
                }
              }}
              onMouseLeave={(e) => {
                const container = e.target.getStage()?.container();
                if (container) {
                  container.style.cursor = 'default';
                }
              }}
              onDragStart={(e) => {
                e.cancelBubble = true; // Prevent event bubbling
                setIsResizing(true);
                setSelectedCorner('top-right');
                setInitialPointerPosition({ x: e.evt.clientX, y: e.evt.clientY });
                setInitialDesignPosition({ ...designPosition });
                setInitialDesignDimensions({ ...designDimensions });
              }}
              onDragMove={(e) => {
                e.cancelBubble = true; // Prevent event bubbling
                // Calculate new dimensions
                const newX = e.target.x() + 5;
                const newY = e.target.y() + 5;
                const newWidth = newX - designPosition.x;
                const deltaY = newY - initialDesignPosition.y;
                
                // Update position and dimensions
                setDesignPosition({
                  x: designPosition.x,
                  y: newY
                });
                setDesignDimensions({
                  width: Math.max(20, newWidth),
                  height: Math.max(20, initialDesignDimensions.height - deltaY)
                });
                
                // Reset handle position to corner
                e.target.position({
                  x: designPosition.x + Math.max(20, newWidth) - 5,
                  y: newY - 5
                });
              }}
              onDragEnd={() => {
                setIsResizing(false);
              }}
            />
            
            {/* Bottom-left corner */}
            <Rect
              x={-5}
              y={designDimensions.height - 5}
              width={10}
              height={10}
              fill='white'
              stroke='#1a73e8'
              strokeWidth={1}
              draggable={true}
              onMouseEnter={(e) => {
                const container = e.target.getStage()?.container();
                if (container) {
                  container.style.cursor = 'nesw-resize';
                }
              }}
              onMouseLeave={(e) => {
                const container = e.target.getStage()?.container();
                if (container) {
                  container.style.cursor = 'default';
                }
              }}
              onDragStart={(e) => {
                setIsResizing(true);
                setSelectedCorner('bottom-left');
                setInitialDesignPosition({ ...designPosition });
                setInitialDesignDimensions({ ...designDimensions });
              }}
              onDragMove={(e) => {
                // Calculate new dimensions
                const newX = e.target.x() + 5;
                const newY = e.target.y() + 5;
                const deltaX = newX - initialDesignPosition.x;
                const newHeight = newY - designPosition.y;
                
                // Update position and dimensions
                setDesignPosition({
                  x: newX,
                  y: designPosition.y
                });
                setDesignDimensions({
                  width: Math.max(20, initialDesignDimensions.width - deltaX),
                  height: Math.max(20, newHeight)
                });
                
                // Reset handle position to corner
                e.target.position({
                  x: newX - 5,
                  y: designPosition.y + Math.max(20, newHeight) - 5
                });
              }}
              onDragEnd={() => {
                setIsResizing(false);
              }}
            />
            
            {/* Bottom-right corner */}
            <Rect
              x={designDimensions.width - 5}
              y={designDimensions.height - 5}
              width={10}
              height={10}
              fill='white'
              stroke='#1a73e8'
              strokeWidth={1}
              draggable={true}
              onMouseEnter={(e) => {
                const container = e.target.getStage()?.container();
                if (container) {
                  container.style.cursor = 'nwse-resize';
                }
              }}
              onMouseLeave={(e) => {
                const container = e.target.getStage()?.container();
                if (container) {
                  container.style.cursor = 'default';
                }
              }}
              onDragStart={(e) => {
                setIsResizing(true);
                setSelectedCorner('bottom-right');
                setInitialDesignPosition({ ...designPosition });
                setInitialDesignDimensions({ ...designDimensions });
              }}
              onDragMove={(e) => {
                // Calculate new dimensions
                const newX = e.target.x() + 5;
                const newY = e.target.y() + 5;
                const newWidth = newX - designPosition.x;
                const newHeight = newY - designPosition.y;
                
                // Update dimensions
                setDesignDimensions({
                  width: Math.max(20, newWidth),
                  height: Math.max(20, newHeight)
                });
                
                // Reset handle position to corner
                e.target.position({
                  x: designPosition.x + Math.max(20, newWidth) - 5,
                  y: designPosition.y + Math.max(20, newHeight) - 5
                });
              }}
              onDragEnd={() => {
                setIsResizing(false);
              }}
            />
          </Group>
        )}
        
        {/* L-shaped Rotation Controls */}
        {designImg && placeholder && designDimensions.width > 0 && showRotationControls && enableRotation && (
          <Group 
            ref={rotationControlRef}
            x={designPosition.x} 
            y={designPosition.y} 
            rotation={designRotation}
            offset={{ x: designDimensions.width / 2, y: designDimensions.height / 2 }} // Set rotation point to center
          >
            {/* X-axis line (horizontal) */}
            <Line
              points={[0, -30, designDimensions.width + 30, -30]}
              stroke="#e74c3c"
              strokeWidth={2}
              dash={[5, 2]}
            />
            
            {/* Y-axis line (vertical) */}
            <Line
              points={[designDimensions.width + 30, -30, designDimensions.width + 30, designDimensions.height]}
              stroke="#2ecc71"
              strokeWidth={2}
              dash={[5, 2]}
            />
            
            {/* Rotation handle at the corner of the L */}
            <Circle
              x={designDimensions.width + 30}
              y={-30}
              radius={10}
              fill="#3498db"
              stroke="#2980b9"
              strokeWidth={2}
              draggable={true}
              onMouseEnter={(e: KonvaEventObject<MouseEvent>) => {
                const container = e.target.getStage()?.container();
                if (container) {
                  container.style.cursor = 'grab';
                }
              }}
              onMouseLeave={(e: KonvaEventObject<MouseEvent>) => {
                const container = e.target.getStage()?.container();
                if (container) {
                  container.style.cursor = 'default';
                }
              }}
              onDragStart={(e: KonvaEventObject<DragEvent>) => {
                e.cancelBubble = true; // Prevent event bubbling
                setIsRotating(true);
                setInitialRotation(designRotation);
                
                // Calculate center of design for rotation
                const designCenterX = designPosition.x + designDimensions.width / 2;
                const designCenterY = designPosition.y + designDimensions.height / 2;
                
                // Update the design center for consistent rotation calculations
                setDesignCenter({ x: designCenterX, y: designCenterY });
                
                // Calculate initial angle between pointer and design center
                const stage = e.target.getStage();
                if (stage) {
                  const pointerPos = stage.getPointerPosition();
                  if (pointerPos) {
                    const dx = pointerPos.x - designCenterX;
                    const dy = pointerPos.y - designCenterY;
                    setRotationStartAngle(Math.atan2(dy, dx) * 180 / Math.PI);
                  }
                }
              }}
              onDragMove={(e: KonvaEventObject<DragEvent>) => {
                e.cancelBubble = true; // Prevent event bubbling
                
                // Use the stored design center for consistent rotation calculations
                const designCenterX = designCenter.x;
                const designCenterY = designCenter.y;
                
                // Calculate current angle between pointer and design center
                const stage = e.target.getStage();
                if (stage) {
                  const pointerPos = stage.getPointerPosition();
                  if (pointerPos) {
                    const dx = pointerPos.x - designCenterX;
                    const dy = pointerPos.y - designCenterY;
                    const currentAngle = Math.atan2(dy, dx) * 180 / Math.PI;
                    
                    // Calculate angle difference and update rotation
                    const angleDiff = currentAngle - rotationStartAngle;
                    const newRotation = initialRotation + angleDiff;
                    
                    // Update rotation
                    setDesignRotation(newRotation);
                    
                    // Update all groups that need rotation for immediate visual feedback
                    if (designGroupRef.current) {
                      designGroupRef.current.rotation(newRotation);
                    }
                    
                    // Also update the bounding box group if it exists
                    const boundingBoxGroup = boundingBoxRef.current?.getParent();
                    if (boundingBoxGroup) {
                      boundingBoxGroup.rotation(newRotation);
                    }
                  }
                }
                
                // Reset handle position to the corner of the L
                e.target.position({
                  x: designDimensions.width + 30,
                  y: -30
                });
              }}
              onDragEnd={(e: KonvaEventObject<DragEvent>) => {
                setIsRotating(false);
                
                // Save the rotation to localStorage for persistence
                localStorage.setItem('designRotation', designRotation.toString());
              }}
            />
            
            {/* X-axis label */}
            <Text
              x={designDimensions.width / 2 - 10}
              y={-50}
              text="X"
              fontSize={14}
              fontStyle="bold"
              fill="#e74c3c"
            />
            
            {/* Y-axis label */}
            <Text
              x={designDimensions.width + 40}
              y={designDimensions.height / 2 - 20}
              text="Y"
              fontSize={14}
              fontStyle="bold"
              fill="#2ecc71"
              rotation={90}
            />
            
            {/* Rotation value display */}
            <Group x={designDimensions.width / 2 - 30} y={-80}>
              <Rect
                width={60}
                height={24}
                fill="rgba(255, 255, 255, 0.8)"
                stroke="#3498db"
                strokeWidth={1}
                cornerRadius={4}
              />
              <Text
                x={5}
                y={5}
                text={`${Math.round(designRotation)}°`}
                fontSize={14}
                fill="#333"
              />
            </Group>
          </Group>
        )}
        
        {/* Debug placeholder outline */}
        {process.env.NODE_ENV !== 'production' && placeholder && (
          <Group>
            {/* Original placeholder boundary */}
            <Rect
              x={x + (placeholder.x * scale)}
              y={y + (placeholder.y * scale)}
              width={placeholder.width * scale}
              height={placeholder.height * scale}
              // stroke="red"
              strokeWidth={1}
              dash={[5, 5]}
              opacity={0.5}
            />
            
            {/* Design boundary */}
            <Rect
              x={designPosition.x}
              y={designPosition.y}
              width={designDimensions.width}
              height={designDimensions.height}
              // stroke="blue"
              strokeWidth={1}
              dash={[2, 2]}
              opacity={0.5}
            />
            
            {/* Add text labels */}
            <Group>
              <Rect
                x={10}
                y={10}
                width={200}
                height={60}
                fill="rgba(255, 255, 255, 0.7)"
                cornerRadius={5}
              />
              <Text
                x={15}
                y={15}
                text={`Mode: ${maintainAspectRatio ? 'Aspect Ratio' : 'Exact Size'}`}
                fontSize={12}
                fill="black"
              />
              <Text
                x={15}
                y={30}
                text={`Placeholder: ${Math.round(placeholder.width * scale)}x${Math.round(placeholder.height * scale)}`}
                fontSize={12}
                fill="red"
              />
              <Text
                x={15}
                y={45}
                text={`Design: ${Math.round(designDimensions.width)}x${Math.round(designDimensions.height)}`}
                fontSize={12}
                fill="blue"
              />
            </Group>
          </Group>
        )}
      </Layer>
    </Stage>
  </>
  );
};

// DisplacementMesh component for realistic fabric simulation
interface DisplacementMeshProps {
  image: HTMLImageElement;
  width: number;
  height: number;
  distortionParams: any;
  surfaceProperties: SurfaceProperties;
  categories: string[];
  blendMode: string;
  opacity: number;
  shadowParams: any;
  customShapePoints?: Array<{x: number, y: number}>;
  containerWidth: number;
  containerHeight: number;
  designPosition: {x: number, y: number};
}

const DisplacementMesh: React.FC<DisplacementMeshProps> = ({
  image,
  width,
  height,
  distortionParams,
  surfaceProperties,
  categories,
  blendMode,
  opacity,
  shadowParams,
  customShapePoints,
  containerWidth,
  containerHeight,
  designPosition
}) => {
  const meshRef = useRef<Konva.Shape>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [meshPoints, setMeshPoints] = useState<MeshPoint[][]>([]);
  
  // Create the mesh grid
  useEffect(() => {
    if (!width || !height) return;
    
    const { meshResolution, waveFrequency, waveAmplitude, displacementStrength } = distortionParams;
    const { bumpiness, elasticity, textureScale, wrinklePattern } = surfaceProperties;
    
    // Create mesh grid
    const gridSize = meshResolution || 8;
    const cellWidth = width / gridSize;
    const cellHeight = height / gridSize;
    
    const newMeshPoints: MeshPoint[][] = [];
    
    // Generate base mesh grid
    for (let y = 0; y <= gridSize; y++) {
      const row: MeshPoint[] = [];
      for (let x = 0; x <= gridSize; x++) {
        const pointX = x * cellWidth;
        const pointY = y * cellHeight;
        
        // Calculate displacement based on material properties
        let displacementX = 0;
        let displacementY = 0;
        
        // Apply different displacement patterns based on material
        if (wrinklePattern === 'organic') {
          // Organic cotton-like wrinkles with randomness
          displacementX = Math.sin(pointX * waveFrequency * 0.5 + pointY * 0.02) * bumpiness * displacementStrength * 2;
          displacementY = Math.sin(pointY * waveFrequency * 0.7 + pointX * 0.03) * bumpiness * displacementStrength * 2;
          
          // Add some randomness for natural fabric look
          displacementX += (Math.random() - 0.5) * bumpiness * displacementStrength;
          displacementY += (Math.random() - 0.5) * bumpiness * displacementStrength;
        } 
        else if (wrinklePattern === 'smooth') {
          // Smooth silk-like subtle waves
          displacementX = Math.sin(pointX * waveFrequency * 0.3) * bumpiness * displacementStrength * 0.8;
          displacementY = Math.sin(pointY * waveFrequency * 0.2) * bumpiness * displacementStrength * 0.6;
        }
        else if (wrinklePattern === 'structured') {
          // Structured patterns for denim/leather
          displacementX = Math.sin(pointX * waveFrequency * 1.2) * bumpiness * displacementStrength * 1.5;
          displacementY = Math.cos(pointY * waveFrequency * 0.8) * bumpiness * displacementStrength * 1.2;
          
          // Add directional bias for structured materials
          if (x % 2 === 0) displacementX *= 1.5;
          if (y % 3 === 0) displacementY *= 1.2;
        }
        else if (wrinklePattern === 'form-fitted') {
          // Form-fitted for mannequin display
          const distFromCenter = Math.sqrt(Math.pow((pointX - width/2) / width, 2) + Math.pow((pointY - height/2) / height, 2));
          const curveFactor = 1 - distFromCenter * 2;
          
          displacementX = Math.sin(pointX * waveFrequency * 0.4) * bumpiness * displacementStrength * curveFactor * 3;
          displacementY = Math.sin(pointY * waveFrequency * 0.6) * bumpiness * displacementStrength * curveFactor * 2;
          
          // Add body curvature effect
          if (categories.includes("Mannequin")) {
            displacementY += Math.sin((pointX / width) * Math.PI) * 5 * bumpiness;
          }
        }
        else {
          // Standard pattern
          displacementX = Math.sin(pointX * waveFrequency + pointY * 0.01) * bumpiness * displacementStrength;
          displacementY = Math.cos(pointY * waveFrequency + pointX * 0.01) * bumpiness * displacementStrength;
        }
        
        // Edge effects - more pronounced wrinkles at edges
        const edgeFactorX = 1 + Math.max(0, 1 - Math.min(pointX, width - pointX) / (width * 0.2)) * 2;
        const edgeFactorY = 1 + Math.max(0, 1 - Math.min(pointY, height - pointY) / (height * 0.15)) * 2;
        
        displacementX *= edgeFactorX;
        displacementY *= edgeFactorY;
        
        // Apply elasticity - higher elasticity means less displacement at center
        const centerDistanceX = Math.abs(pointX - width / 2) / (width / 2);
        const centerDistanceY = Math.abs(pointY - height / 2) / (height / 2);
        const centerFactor = (centerDistanceX + centerDistanceY) / 2;
        
        displacementX *= 1 - (1 - centerFactor) * elasticity * 0.7;
        displacementY *= 1 - (1 - centerFactor) * elasticity * 0.7;
        
        // Create the mesh point
        row.push({
          x: pointX + displacementX,
          y: pointY + displacementY,
          originalX: pointX,
          originalY: pointY,
          displacementX,
          displacementY
        });
      }
      newMeshPoints.push(row);
    }
    
    setMeshPoints(newMeshPoints);
  }, [width, height, distortionParams, surfaceProperties, categories]);
  
  // Create offscreen canvas for image rendering
  useEffect(() => {
    if (!image || !width || !height) return;
    
    // Create offscreen canvas if it doesn't exist
    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
    }
    
    const canvas = canvasRef.current;
    canvas.width = width;
    canvas.height = height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw the image
    ctx.drawImage(image, 0, 0, width, height);
    
    // Apply material-specific effects
    const { reflectivity } = surfaceProperties;
    
    // Apply lighting effects for reflective materials
    if (reflectivity > 0.3) {
      // Create highlight gradient
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      
      if (categories.includes("Dark") || categories.includes("Black")) {
        gradient.addColorStop(0, `rgba(255, 255, 255, ${reflectivity * 0.15})`);
        gradient.addColorStop(0.5, `rgba(255, 255, 255, ${reflectivity * 0.05})`);
        gradient.addColorStop(1, `rgba(255, 255, 255, ${reflectivity * 0.2})`);
      } else {
        gradient.addColorStop(0, `rgba(255, 255, 255, ${reflectivity * 0.25})`);
        gradient.addColorStop(0.5, `rgba(255, 255, 255, 0)`);
        gradient.addColorStop(1, `rgba(255, 255, 255, ${reflectivity * 0.15})`);
      }
      
      // Apply the gradient overlay
      ctx.globalCompositeOperation = 'overlay';
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
      
      // Reset composite operation
      ctx.globalCompositeOperation = 'source-over';
    }
  }, [image, width, height, surfaceProperties, categories]);
  
  // Render the mesh
  const renderMesh = (context: Konva.Context) => {
    if (!canvasRef.current || meshPoints.length === 0) return;
    
    const canvas = canvasRef.current;
    
    // Apply custom shape clipping if available
    // Note: We don't need to apply clipping here since the parent Group already has clipFunc
    // This avoids double-clipping issues and ensures consistent behavior
    
    // Set composite operation and opacity
    context.globalCompositeOperation = blendMode as GlobalCompositeOperation;
    context.globalAlpha = opacity;
    
    // Apply shadows
    if (shadowParams) {
      context.shadowColor = shadowParams.shadowColor;
      context.shadowBlur = shadowParams.shadowBlur;
      context.shadowOffsetX = shadowParams.shadowOffset.x;
      context.shadowOffsetY = shadowParams.shadowOffset.y;
      // Set shadow opacity via globalAlpha since shadowOpacity doesn't exist on standard Context
      const originalAlpha = context.globalAlpha;
      context.globalAlpha = originalAlpha * (shadowParams.shadowOpacity || 1);
    }
    
    // Draw the mesh grid
    for (let y = 0; y < meshPoints.length - 1; y++) {
      for (let x = 0; x < meshPoints[y].length - 1; x++) {
        const p1 = meshPoints[y][x];
        const p2 = meshPoints[y][x + 1];
        const p3 = meshPoints[y + 1][x + 1];
        const p4 = meshPoints[y + 1][x];
        
        // Calculate texture coordinates
        const tx1 = p1.originalX / width;
        const ty1 = p1.originalY / height;
        const tx2 = p2.originalX / width;
        const ty2 = p2.originalY / height;
        const tx3 = p3.originalX / width;
        const ty3 = p3.originalY / height;
        const tx4 = p4.originalX / width;
        const ty4 = p4.originalY / height;
        
        // Draw first triangle (p1, p2, p3)
        context.save();
        context.beginPath();
        context.moveTo(p1.x, p1.y);
        context.lineTo(p2.x, p2.y);
        context.lineTo(p3.x, p3.y);
        context.closePath();
        
        // Create pattern from the canvas
        const pattern = context.createPattern(canvas, 'no-repeat');
        if (pattern) {
          // Apply transformation to the pattern
          const matrix = new DOMMatrix();
          matrix.a = width;
          matrix.d = height;
          pattern.setTransform(matrix);
          
          context.fillStyle = pattern;
        }
        
        // Apply clipping and fill
        context.clip();
        context.fillRect(0, 0, width, height);
        context.restore();
        
        // Draw second triangle (p1, p3, p4)
        context.save();
        context.beginPath();
        context.moveTo(p1.x, p1.y);
        context.lineTo(p3.x, p3.y);
        context.lineTo(p4.x, p4.y);
        context.closePath();
        
        // Create pattern from the canvas
        const pattern2 = context.createPattern(canvas, 'no-repeat');
        if (pattern2) {
          // Apply transformation to the pattern
          const matrix = new DOMMatrix();
          matrix.a = width;
          matrix.d = height;
          pattern2.setTransform(matrix);
          
          context.fillStyle = pattern2;
        }
        
        // Apply clipping and fill
        context.clip();
        context.fillRect(0, 0, width, height);
        context.restore();
      }
    }
    
    // Reset shadow
    context.shadowColor = 'transparent';
    context.shadowBlur = 0;
    context.shadowOffsetX = 0;
    context.shadowOffsetY = 0;
    
    // Reset composite operation and opacity
    context.globalCompositeOperation = 'source-over';
    context.globalAlpha = 1;
  };
  
  return (
    <Shape
      ref={meshRef}
      sceneFunc={renderMesh}
      width={width}
      height={height}
    />
  );
};

export default KonvaComponents;