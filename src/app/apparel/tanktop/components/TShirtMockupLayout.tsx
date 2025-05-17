import { useState } from "react";
import { TShirtSidebar } from "./TShirtSidebar";
import { TankTopGallery } from "./TankTopGallery";
import { TShirtHeader } from "./TShirtHeader";


export function TShirtMockupLayout() {
  const [selectedColor, setSelectedColor] = useState("#FFFFFF");
  const [activeCategory, setActiveCategory] = useState("Blank");
  const [uploadedDesign, setUploadedDesign] = useState<string | null>(null);
  
  return (
    <div className="min-h-screen flex flex-col w-full bg-white">
      <div className="flex flex-1 overflow-hidden">
        <TShirtSidebar 
          selectedColor={selectedColor} 
          setSelectedColor={setSelectedColor}
          uploadedDesign={uploadedDesign}
          setUploadedDesign={setUploadedDesign}
        />
        <div className="flex-1 flex flex-col">
          <TShirtHeader />
          <TankTopGallery 
            activeCategory={activeCategory} 
            setActiveCategory={setActiveCategory}
            uploadedDesign={uploadedDesign}
            products={[]}
          />
        </div>
        
      </div>
    </div>
  );
}
