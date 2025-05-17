'use client';

import { useEffect, useRef, useState } from 'react';

interface DesignConfig {
  scaleX: number;
  scaleY: number;
  top: number;
  left: number;
  angle: number;
  opacity: number;
}

interface UseFabricCanvasProps {
  mockupImage: string;
  designImage: string | null;
  categories: string[];
  width?: number;
  height?: number;
}

export const useFabricCanvas = ({
  mockupImage,
  designImage,
  categories = [],
  width = 300,
  height = 300
}: UseFabricCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<any>(null);
  const [isReady, setIsReady] = useState(false);
  const [fabric, setFabric] = useState<any>(null);

  // Helper function to determine design size and position based on mockup categories
  const getDesignConfig = (categories: string[] = []): DesignConfig => {
    // Default configuration
    let config: DesignConfig = {
      scaleX: 0.35,
      scaleY: 0.35,
      top: height / 2,
      left: width / 2,
      angle: 0,
      opacity: 0.9
    };

    // Adjust based on mockup type
    if (categories.includes("Closeup")) {
      config = {
        ...config,
        scaleX: 0.5,
        scaleY: 0.5,
      };
    } else if (categories.includes("Without People") || categories.includes("Blank")) {
      config = {
        ...config,
        scaleX: 0.6,
        scaleY: 0.6,
      };
    } else if (categories.includes("Mannequin")) {
      config = {
        ...config,
        scaleX: 0.45,
        scaleY: 0.45,
        angle: 0
      };
    } else if (categories.includes("Oversized")) {
      config = {
        ...config,
        scaleX: 0.3,
        scaleY: 0.3,
      };
    } else if (categories.includes("Boxy")) {
      config = {
        ...config,
        scaleX: 0.45,
        scaleY: 0.45,
      };
    }

    // Adjust for specific angles
    if (categories.includes("Side View")) {
      config.angle = 15;
    }

    return config;
  };

  // Load Fabric.js library
  useEffect(() => {
    // Only import Fabric.js on the client side
    if (typeof window !== 'undefined') {
      import('fabric').then((fabricModule) => {
        console.log('Fabric.js loaded successfully');
        setFabric(fabricModule);
        setIsReady(true);
      }).catch(error => {
        console.error('Failed to load Fabric.js:', error);
      });
    }
  }, []);

  // Initialize and update the canvas when fabric, mockupImage, or designImage changes
  useEffect(() => {
    if (!canvasRef.current || !isReady || !fabric) return;

    console.log('Initializing Fabric.js canvas with:', { mockupImage, designImage });

    // Initialize Fabric.js canvas
    const canvas = new fabric.Canvas(canvasRef.current, {
      width,
      height,
      selection: false,
      renderOnAddRemove: true,
      preserveObjectStacking: true
    });

    fabricCanvasRef.current = canvas;

    // Clear any existing objects
    canvas.clear();

    // Load the mockup image
    const loadMockupImage = (url: string) => {
      // Ensure the URL is absolute for Fabric.js
      const absoluteUrl = url.startsWith('/') 
        ? `${window.location.origin}${url}` 
        : url;
      
      console.log('Loading mockup image:', absoluteUrl);
      
      fabric.Image.fromURL(absoluteUrl, (img: any) => {
        console.log('Mockup image loaded successfully');
        // Scale the image to fit the canvas
        img.scaleToWidth(width);
        canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas));

        // If there's a design image, add it on top
        if (designImage) {
          loadDesignImage(designImage);
        }
      }, { 
        crossOrigin: 'anonymous',
        // Add error handling for image loading
        onerror: () => {
          console.error('Failed to load mockup image:', absoluteUrl);
        }
      });
    };

    // Load the design image
    const loadDesignImage = (url: string) => {
      console.log('Loading design image:', url);
      
      fabric.Image.fromURL(url, (designImg: any) => {
        console.log('Design image loaded successfully');
        const config = getDesignConfig(categories);
        
        // Center the design
        designImg.set({
          originX: 'center',
          originY: 'center',
          left: config.left,
          top: config.top,
          scaleX: config.scaleX,
          scaleY: config.scaleY,
          angle: config.angle,
          opacity: config.opacity,
          // Use multiply blend mode for better integration with the t-shirt
          globalCompositeOperation: 'multiply'
        });
        
        canvas.add(designImg);
        canvas.renderAll();
      }, { 
        crossOrigin: 'anonymous',
        // Add error handling for image loading
        onerror: () => {
          console.error('Failed to load design image:', url);
        }
      });
    };

    // Start loading the mockup image
    loadMockupImage(mockupImage);

    // Cleanup
    return () => {
      canvas.dispose();
      fabricCanvasRef.current = null;
    };
  }, [mockupImage, designImage, categories, isReady, fabric, width, height]);

  return { canvasRef, isReady };
};
