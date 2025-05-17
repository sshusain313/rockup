"use client"

import React from 'react';
import Image from 'next/image';
import { ChevronDown } from 'lucide-react';
import Faqs from './Faqs';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";

const MockupsShowcase = () => {
  // Categories for the sidebar
  const categories = [
    "APPAREL",
    "ACCESSORIES",
    "PRINT",
  ];

  // Example mockup products
  const mockupProducts = [
    { id: 1, video: "/videos/video-mockup-001.mp4", name: "Red T-Shirt Mockup" },
    { id: 2, video: "/videos/video-mockup-002.mp4", name: "Blue Polo Mockup" },
    { id: 3, video: "/videos/video-mockup-003.mp4", name: "Black Hoodie Mockup" },
    { id: 4, video: "/videos/video-mockup-004.mp4", name: "Red T-Shirt Mockup" },
    { id: 5, video: "/videos/video-mockup-005.mp4", name: "Blue Polo Mockup" },
    { id: 6, video: "/videos/video-mockup-006.mp4", name: "Black Hoodie Mockup" },
    { id: 7, video: "/videos/video-mockup-007.mp4", name: "Red T-Shirt Mockup" },
    { id: 8, video: "/videos/video-mockup-008.mp4", name: "Blue Polo Mockup" },
    { id: 9, video: "/videos/video-mockup-009.mp4", name: "Black Hoodie Mockup" },
    { id: 10, video: "/videos/video-mockup-010.mp4", name: "Red T-Shirt Mockup" },
    { id: 11, video: "/videos/video-mockup-011.mp4", name: "Blue Polo Mockup" },
    { id: 12, video: "/videos/video-mockup-012.mp4", name: "Black Hoodie Mockup" },
    { id: 13, video: "/videos/video-mockup-013.mp4", name: "Red T-Shirt Mockup" },
    { id: 14, video: "/videos/video-mockup-014.mp4", name: "Blue Polo Mockup" },
    { id: 15, video: "/videos/video-mockup-015.mp4", name: "Black Hoodie Mockup" },
    { id: 16, video: "/videos/video-mockup-016.mp4", name: "Red T-Shirt Mockup" },
    { id: 17, video: "/videos/video-mockup-017.mp4", name: "Blue Polo Mockup" },
    { id: 18, video: "/videos/video-mockup-018.mp4", name: "Black Hoodie Mockup" },
    { id: 19, video: "/videos/video-mockup-019.mp4", name: "Red T-Shirt Mockup" },
    { id: 20, video: "/videos/video-mockup-020.mp4", name: "Blue Polo Mockup" },
    { id: 21, video: "/videos/video-mockup-021.mp4", name: "Black Hoodie Mockup" },
    { id: 22, video: "/videos/video-mockup-022.mp4", name: "Red T-Shirt Mockup" },
    { id: 23, video: "/videos/video-mockup-023.mp4", name: "Blue Polo Mockup" },
    { id: 24, video: "/videos/video-mockup-024.mp4", name: "Black Hoodie Mockup" },
    { id: 25, video: "/videos/video-mockup-025.mp4", name: "Red T-Shirt Mockup" },
  ];

  return (
    <div className="flex w-full">
      {/* Left Sidebar */}
      <aside className="w-64 min-h-screen border-r border-gray-200 bg-white p-4">
        {categories.map((category) => (
          <div key={category} className={`mb-4 `}>
            <button className="flex items-center justify-between w-full p-3 text-left border border-gray-200 rounded-md hover:bg-gray-50">
              {category}
              <ChevronDown size={18} />
            </button>
          </div>
        ))}
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6">
        {/* Header Section */}
        <div className="mb-4 flex justify-between items-center">
          <span className="text-white">Video-Mockups</span>
          <NavigationMenu className="hidden md:flex border-2 border-gray-200 rounded-md bg-white mr-4">
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger>New</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="w-20 border-2 border-gray-50">
                    <ul className="">
                      <li>
                        <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                          Random
                        </NavigationMenuLink>
                      </li>
                      <li>
                        <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                          New
                        </NavigationMenuLink>
                      </li>
                    </ul>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Main Heading */}
        <h1 className="text-4xl font-bold mb-4">
        Video Mockups Download Online | Make AI Video Mockup
        </h1>

        {/* Description */}
        <p className="text-gray-700 mb-8 max-w-4xl">
        Create AI Video Mockups Online with Mockey&apos;s AI Video Mockup Generator for apparel, TikTok ads, iPhone, and book video mockups. Add your design &amp; hit generate!
        </p>

        {/* Pinterest-like Product Grid */}
        <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
          {mockupProducts.map((product) => (
            <div
              key={product.id}
              className="break-inside-avoid bg-gray-50 rounded-lg overflow-hidden mb-4"
            >
              <video
                src={product.video}
                className="w-full h-auto object-cover rounded-md"
                autoPlay
                loop
                muted
                playsInline
                onMouseOver={(e) => e.currentTarget.play()}
                onMouseOut={(e) => e.currentTarget.pause()}
              />
            </div>
          ))}
        </div>

        <section className="bg-white p-6 md:p-8 rounded-xl shadow-sm max-w-7xl mx-auto my-10 flex flex-col md:flex-row gap-6 items-center">
  <div className="md:w-2/3">
    <h2 className="text-2xl font-bold text-gray-900 mb-4">
      How to Create a 3D Mockup on Mockey?
    </h2>
    <p className="text-gray-700 mb-2">To design a 3D mockup with Mockey.ai:</p>
    <p className="text-sm text-gray-800 mb-1">
      <strong>Step 1:</strong> Go to 3D Mockups, choose a product category, and select a 3D template.
    </p>
    <p className="text-sm text-gray-800 mb-1">
      <strong>Step 2:</strong> Click Upload Your Images to add multiple designs by dragging and dropping. 
      You can also change colors, add textures, or set a background.
    </p>
    <p className="text-sm text-gray-800">
      <strong>Step 3:</strong> Click Download to save your 3D mockup as a PNG or JPEG in different sizes, 
      or click Video to save it as a 5-second webm file.
    </p>
  </div>
  <div className="md:w-1/3 w-full">
    <Image
      src="/edit.webp" // 🔁 Replace with actual image path
      alt="Edit Mockups Fast"
      width={400}
      height={300}
      className="rounded-md"
    />
  </div>
</section>
  <section className='max-w-7xl mx-auto mb-10'>
    <Image src='/bag-black.webp' alt='bag-black' width={500} height={500} className='w-full h-auto rounded-md mb-10' />
  </section>

    <Faqs />
      </main>
    </div>
  );
};

export default MockupsShowcase;
