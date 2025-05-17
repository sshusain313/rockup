'use client';

import { Download, ChevronDown, RotateCcw } from 'lucide-react';
import { useState, useRef, ChangeEvent, useEffect } from 'react';
import Image from 'next/image';

interface SidebarProps {
  colorValue: string;
  setColorValue: (color: string) => void;
  warpingValue: number;
  setWarpingValue: (value: number) => void;
  unclipDesign: boolean;
  setUnclipDesign: (value: boolean) => void;
  activeDesign: string | null;
  setActiveDesign?: (design: string | null) => void;
  handleDownload: () => void;
  // We'll keep the original colorValue for backward compatibility
  // but add new multi-color support
  selectedColors?: string[];
  setSelectedColors?: (colors: string[]) => void;
  // Design draggability control
  isDesignDraggable?: boolean;
  setIsDesignDraggable?: (value: boolean) => void;
}

export function Sidebar({
  colorValue,
  setColorValue,
  warpingValue,
  setWarpingValue,
  unclipDesign,
  setUnclipDesign,
  activeDesign,
  setActiveDesign,
  handleDownload,
  selectedColors = [],
  setSelectedColors,
  isDesignDraggable = true,
  setIsDesignDraggable
}: SidebarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPro, setIsPro] = useState(false);
  const [filename, setFilename] = useState("cating1.png");
  const [newColorInput, setNewColorInput] = useState("");
  const [isColorMenuOpen, setIsColorMenuOpen] = useState(false);
  
  // Initialize local state for colors if not provided via props
  const [localSelectedColors, setLocalSelectedColors] = useState<string[]>(() => {
    // If colorValue is not in the selectedColors array, add it
    if (colorValue && !selectedColors.includes(colorValue)) {
      return [...selectedColors, colorValue];
    }
    return selectedColors;
  });
  const colorMenuRef = useRef<HTMLDivElement>(null);
  const colorTriggerRef = useRef<HTMLDivElement>(null);
  
  // Handle click outside to close the color menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        colorMenuRef.current && 
        !colorMenuRef.current.contains(event.target as Node) &&
        colorTriggerRef.current && 
        !colorTriggerRef.current.contains(event.target as Node)
      ) {
        setIsColorMenuOpen(false);
      }
    }
    
    // Add event listener when the menu is open
    if (isColorMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    // Clean up the event listener
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isColorMenuOpen]);
  
  // Sync local state with parent component
  useEffect(() => {
    if (setSelectedColors) {
      setSelectedColors(localSelectedColors);
    }
  }, [localSelectedColors, setSelectedColors]);
  
  // Predefined color options
  const colorOptions = [
    { name: "White", value: "#FFFFFF" },
    { name: "Black", value: "#000000" },
    { name: "Red", value: "#FF0000" },
    { name: "Green", value: "#00FF00" },
    { name: "Blue", value: "#0000FF" },
    { name: "Yellow", value: "#FFFF00" },
    { name: "Purple", value: "#800080" },
    { name: "Orange", value: "#FFA500" },
    { name: "Pink", value: "#FFC0CB" },
    { name: "Gray", value: "#808080" },
  ];
  
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && setActiveDesign) {
      // Check if the file is an image
      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file');
        return;
      }

      // Create a URL for the uploaded image
      const imageUrl = URL.createObjectURL(file);
      console.log('Created object URL for uploaded image:', imageUrl);
      
      // Set the active design
      setActiveDesign(imageUrl);
      setFilename(file.name);
    }
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleColorChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setColorValue(newColor);
    
    // Also add to selected colors if not already there
    if (!localSelectedColors.includes(newColor)) {
      const updatedColors = [...localSelectedColors, newColor];
      setLocalSelectedColors(updatedColors);
      if (setSelectedColors) {
        setSelectedColors(updatedColors);
      }
    }
  };
  
  const handleColorInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setNewColorInput(e.target.value);
  };
  
  const handleColorInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newColorInput.trim()) {
      // Validate if it's a proper hex color
      const isValidHex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(newColorInput);
      
      if (isValidHex) {
        addColor(newColorInput);
      } else {
        alert('Please enter a valid hex color (e.g., #FF0000)');
      }
    }
  };
  
  const addColor = (color: string) => {
    // Normalize to uppercase for consistency
    const normalizedColor = color.toUpperCase();
    
    // Check if color already exists
    if (!localSelectedColors.includes(normalizedColor)) {
      const updatedColors = [...localSelectedColors, normalizedColor];
      setLocalSelectedColors(updatedColors);
      if (setSelectedColors) {
        setSelectedColors(updatedColors);
      }
      
      // Also set as current color
      setColorValue(normalizedColor);
      
      // Clear input
      setNewColorInput('');
    }
  };
  
  const removeColor = (colorToRemove: string) => {
    const updatedColors = localSelectedColors.filter(color => color !== colorToRemove);
    setLocalSelectedColors(updatedColors);
    if (setSelectedColors) {
      setSelectedColors(updatedColors);
    }
    
    // If we removed the current color, set to the first available or white
    if (colorValue === colorToRemove) {
      setColorValue(updatedColors.length > 0 ? updatedColors[0] : '#FFFFFF');
    }
  };
  
  const selectPredefinedColor = (colorValue: string) => {
    addColor(colorValue);
    setIsColorMenuOpen(false);
  };

  const handleWarpingChange = (e: ChangeEvent<HTMLInputElement>) => {
    setWarpingValue(Number(e.target.value));
  };

  const handleUnclipChange = () => {
    setUnclipDesign(!unclipDesign);
  };

  const handleResetWarping = () => {
    setWarpingValue(0);
  };

  // CSS for the toggle switch
  const toggleStyles = `
    .toggle-checkbox {
      right: 0;
      z-index: 5;
      transition: all 0.3s;
    }
    .toggle-checkbox:checked {
      right: 4px;
      transform: translateX(100%);
    }
    .toggle-label {
      transition: background-color 0.3s;
    }
  `;

  return (
    <div className="w-80 bg-white border-r border-gray-200 h-screen flex-shrink-0 overflow-y-auto p-4">
      {/* Inline styles for toggle switch */}
      <style>{toggleStyles}</style>
      {/* Download Button */}
      <button 
        onClick={handleDownload}
        className="w-full bg-pink-500 text-white rounded-md py-3 mb-6 flex items-center justify-center gap-2"
      >
        <span className="font-medium">Download</span>
        <ChevronDown className="h-4 w-4" />
      </button>

      {/* Design Section */}
      <div className="mb-6">
        <h3 className="text-sm font-medium uppercase text-gray-900 mb-2">DESIGN</h3>
        
        {/* Design Draggability Toggle */}
        {setIsDesignDraggable && (
          <div className="flex items-center justify-between mb-4 p-2 border border-gray-200 rounded-md">
            <span className="text-sm text-gray-700">Design Draggable</span>
            <div className="relative inline-block w-10 mr-2 align-middle select-none">
              <input
                type="checkbox"
                id="design-draggable"
                checked={isDesignDraggable}
                onChange={() => setIsDesignDraggable(!isDesignDraggable)}
                className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
              />
              <label
                htmlFor="design-draggable"
                className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"
                style={{ backgroundColor: isDesignDraggable ? '#3B82F6' : '#D1D5DB' }}
              />
            </div>
          </div>
        )}
        <div className="flex items-center gap-2 mb-2">
          <div className="flex-1 border border-gray-300 rounded-md p-2 text-sm flex items-center">
            {activeDesign ? (
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 relative overflow-hidden rounded">
                  <Image 
                    src={activeDesign} 
                    alt="Design" 
                    width={24} 
                    height={24} 
                    className="object-cover"
                  />
                </div>
                <span className="truncate">{filename}</span>
              </div>
            ) : (
              <span className="text-gray-500">No file selected</span>
            )}
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
          <button 
            onClick={handleUploadClick}
            className="p-2 border border-gray-300 rounded-md"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </button>
        </div>
        {/* <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <span className="text-sm font-medium">PRO</span>
            <div className={`w-4 h-4 rounded ${isPro ? 'bg-orange-500' : 'bg-orange-500'}`}></div>
          </div>
          <button className="text-gray-500 hover:text-gray-700">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div> */}
      </div>

      {/* Color Section */}
      <div className="mb-6">
        <h3 className="text-sm font-medium uppercase text-gray-900 mb-2">COLOR</h3>
        
        {/* Current Color Display */}
        {/* <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-full border border-gray-300 overflow-hidden">
            <div className="w-full h-full" style={{ backgroundColor: colorValue }}></div>
          </div>
          <div 
            ref={colorTriggerRef}
            className="flex-1 border border-gray-300 rounded-md p-2 text-sm flex items-center justify-between cursor-pointer hover:bg-gray-50"
            onClick={() => setIsColorMenuOpen(!isColorMenuOpen)}
          >
            <span>{colorValue ? colorValue.toUpperCase() : '#FFFFFF'}</span>
            <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${isColorMenuOpen ? 'rotate-180' : ''}`} />
          </div>
        </div>
        
        {/* Color Picker */}
        {/* <div className="relative h-6 overflow-hidden mb-3">
          <input 
            type="color" 
            value={colorValue} 
            onChange={handleColorChange}
            className="absolute w-full h-12 -top-3 cursor-pointer"
          />
          <div className="w-full h-6 bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 rounded"></div>
        </div> */}
        
        {/* Color Input Field */}
        {/* <div className="mb-3">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newColorInput}
              onChange={handleColorInputChange}
              onKeyDown={handleColorInputKeyDown}
              placeholder="#RRGGBB"
              className="flex-1 border border-gray-300 rounded-md p-2 text-sm"
            />
            <button
              onClick={() => {
                if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(newColorInput)) {
                  addColor(newColorInput);
                } else {
                  alert('Please enter a valid hex color (e.g., #FF0000)');
                }
              }}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-md text-sm"
            >
              Add
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">Enter a hex color code (e.g., #FF0000) and press Enter</p>
        </div> */}
        
        {/* Selected Colors */}
        <div className="mb-3">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-xs font-medium text-gray-700">
              Selected Colors {localSelectedColors.length > 0 && `(${localSelectedColors.length})`}
            </h4>
            {localSelectedColors.length > 0 && (
              <button 
                onClick={() => {
                  setLocalSelectedColors([]);
                  if (setSelectedColors) {
                    setSelectedColors([]);
                  }
                  setColorValue('#FFFFFF');
                }}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Clear All
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {localSelectedColors.length > 0 ? (
              localSelectedColors.map((color, index) => (
                <div 
                  key={index} 
                  className={`flex items-center gap-1 rounded-full pl-1 pr-2 py-1 ${
                    colorValue === color ? 'bg-blue-100 border border-blue-300' : 'bg-gray-100'
                  } cursor-pointer hover:bg-gray-200`}
                  title={color}
                  onClick={() => setColorValue(color)}
                >
                  <div 
                    className="w-4 h-4 rounded-full border border-gray-300 cursor-pointer" 
                    style={{ backgroundColor: color }}
                    onClick={() => setColorValue(color)}
                  ></div>
                  <span 
                    className="text-xs cursor-pointer" 
                    onClick={() => setColorValue(color)}
                  >
                    {color.substring(1, 7)}
                  </span>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      removeColor(color);
                    }}
                    className="text-gray-500 hover:text-gray-700 ml-1"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-500">No colors selected. Use the color picker or input field to add colors.</p>
            )}
          </div>
        </div>
        
        {/* Predefined Colors Dropdown */}
        {isColorMenuOpen && (
          <div 
            ref={colorMenuRef}
            className="border border-gray-200 rounded-md shadow-sm bg-white p-2 mb-3">
            <h4 className="text-xs font-medium text-gray-700 mb-2">Common Colors</h4>
            <div className="grid grid-cols-5 gap-2">
              {colorOptions.map((color, index) => (
                <div 
                  key={index}
                  className="flex flex-col items-center cursor-pointer hover:bg-gray-50 p-1 rounded"
                  onClick={() => selectPredefinedColor(color.value)}
                  title={color.name}
                >
                  <div 
                    className="w-6 h-6 rounded-full border border-gray-300 mb-1" 
                    style={{ backgroundColor: color.value }}
                  ></div>
                  <span className="text-xs text-gray-600 truncate w-full text-center">{color.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Warping Section */}
      <div className="mb-6">
        <h3 className="text-sm font-medium uppercase text-gray-900 mb-2">WARPING</h3>
        <div className="flex items-center gap-2 mb-2">
          <input 
            type="range" 
            min="-30" 
            max="30" 
            value={warpingValue} 
            onChange={handleWarpingChange}
            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex items-center gap-1">
            <div className="w-12 h-8 border border-gray-300 rounded-md flex items-center justify-center text-sm">
              {warpingValue}
            </div>
            <span className="text-sm">%</span>
            <button 
              onClick={handleResetWarping}
              className="p-1 border border-gray-300 rounded-md ml-1"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Unclip Design Section */}
      <div className="mb-6">
        <h3 className="text-sm font-medium uppercase text-gray-900 mb-2">UNCLIP DESIGN</h3>
        <div className="flex items-center">
          <div 
            className={`w-10 h-6 rounded-full p-1 cursor-pointer ${unclipDesign ? 'bg-blue-500' : 'bg-gray-300'}`}
            onClick={handleUnclipChange}
          >
            <div 
              className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ease-in-out ${unclipDesign ? 'translate-x-4' : ''}`}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
