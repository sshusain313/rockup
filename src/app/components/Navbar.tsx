'use client';

import Head from 'next/head';
import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight, Search, LogIn, LogOut, User, Menu, X } from 'react-feather';
import { signIn, signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export function TShirtGallery() {
  const mockups = [
    {
      id: 1,
      title: "White Acid Wash Tshirt Mockup Male Model Hand In Pocket",
      image: "/appearl/model-1001.webp",
    },
    {
      id: 2,
      title: "Flat Lay White Boxy Tshirt Mockup On Carpeted Floor",
      image: "/appearl/model-1002.webp",
    },
    {
      id: 3,
      title: "Back View White Tshirt Mockup Female Model With Straight Black Hair",
      image: "/appearl/model-1003.webp",
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-4">
      {mockups.map((mockup) => (
        <Link href="/editor" key={mockup.id}>
          <a>
            <Image
              src={mockup.image}
              alt={mockup.title}
              width={300}
              height={300}
              className="rounded-lg hover:scale-105 transition-transform duration-300"
            />
          </a>
        </Link>
      ))}
    </div>
  );
}

function AuthButton() {
  const { data: session, status } = useSession();
  const isLoading = status === 'loading';
  const router = useRouter();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  if (isLoading) {
    return (
      <button className="bg-gray-200 text-gray-500 font-semibold text-sm px-5 py-2 rounded-md cursor-wait">
        Loading...
      </button>
    );
  }

  if (session && session.user) {
    return (
      <div className="flex items-center gap-2 relative">
        <div 
          className="flex items-center gap-2 bg-gray-100 rounded-full px-2 py-1 cursor-pointer"
          onClick={() => setUserDropdownOpen(!userDropdownOpen)}
        >
          {session.user.image ? (
            <Image 
              src={session.user.image} 
              alt={session.user.name || 'User'} 
              width={32} 
              height={32} 
              className="rounded-full"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
              <User size={16} />
            </div>
          )}
          <span className="text-sm font-medium">
            {session.user.name ? session.user.name.split(' ')[0] : 'User'}
          </span>
          <ChevronRight
            size={16}
            className={`transition-transform duration-200 ${userDropdownOpen ? 'rotate-90' : ''}`}
          />
        </div>
        
        {/* User dropdown menu */}
        {userDropdownOpen && (
          <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
            {/* Admin Dashboard link - only for admin users */}
            {session.user.role === 'admin' && (
              <Link 
                href="/admin/dashboard" 
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 border-b border-gray-100"
                onClick={() => setUserDropdownOpen(false)}
              >
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-600">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                  </svg>
                  <span>Admin Dashboard</span>
                </div>
              </Link>
            )}
            
            {/* Profile link */}
            <Link 
              href="/profile" 
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => setUserDropdownOpen(false)}
            >
              <div className="flex items-center gap-2">
                <User size={16} />
                <span>Profile</span>
              </div>
            </Link>
            
            {/* Logout button */}
            <button 
              onClick={() => {
                setUserDropdownOpen(false);
                signOut({ callbackUrl: '/', redirect: true });
              }}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <div className="flex items-center gap-2">
                <LogOut size={16} />
                <span>Logout</span>
              </div>
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button 
        onClick={() => router.push('/auth/signin')}
        className="bg-black text-white font-semibold text-sm px-5 py-2 rounded-md hover:opacity-90 flex items-center gap-2"
      >
        <LogIn size={16} />
        Login
      </button>
      <button 
        onClick={() => router.push('/auth/signup')}
        className="border border-black text-black font-semibold text-sm px-5 py-2 rounded-md hover:bg-gray-100 flex items-center gap-2"
      >
        <User size={16} />
        Sign Up
      </button>
    </div>
  );
}

export default function NavbarPage() {
  const { data: session } = useSession();
  // Define all possible section types for better type safety
  type SectionType = 'apparel' | 'accessories' | 'home' | 'print' | 'packaging' | 'tech' | 'jewelry' | 'image-editing' | 'ai-tools' | 'image-converter' | 'mobile-mockups' | 'mobile-apparel' | 'mobile-accessories' | 'mobile-tech' | 'mobile-tools' | 'mobile-image-editing' | 'mobile-ai-tools' | null;
  
  // Helper function to check if a section is open
  const isSectionOpen = (section: SectionType): boolean => {
    return openSection === section;
  };
  const [openSection, setOpenSection] = useState<SectionType>(null);
  const [activeDropdown, setActiveDropdown] = useState<'mockups' | 'tools' | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const closeTimer = useRef<NodeJS.Timeout | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = (menu: 'mockups' | 'tools') => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    setActiveDropdown(menu);
  };

  const handleMouseLeave = () => {
    closeTimer.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 2500);
  };

  const handleClick = (menu: 'mockups' | 'tools') => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    setActiveDropdown(activeDropdown === menu ? null : menu);
  };

  // Helper function to handle section toggling with proper type safety
  const toggleSection = (section: typeof openSection) => {
    setOpenSection(prev => prev === section ? null : section);
  };

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <>
      <Head>
        <title>Navbar Clone</title>
      </Head>
      <nav className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 bg-white shadow-sm">
        {/* Left side: Logo */}
        <div className="flex items-center">
          <div className="text-pink-500 text-3xl italic font-extrabold tracking-tight font-[cursive]">
            <Link href='/'><Image src="/mockey-logo.svg" alt="Mockey" width={90} height={36} className="sm:w-[100px] sm:h-[40px]" /></Link>
          </div>
        </div>
        
        {/* Hamburger Menu Button - Only visible on mobile */}
        <button 
          className="flex md:hidden items-center justify-center p-2 rounded-md text-gray-700 hover:text-pink-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-pink-500 transition-colors" 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-expanded="false"
        >
          <span className="sr-only">Open main menu</span>
          {isMobileMenuOpen ? (
            <X className="h-6 w-6" aria-hidden="true" />
          ) : (
            <Menu className="h-6 w-6" aria-hidden="true" />
          )}
        </button>

        {/* Center: Navigation Links - Hidden on mobile */}
        <div className="hidden md:block">
          <ul className="flex items-center gap-6 text-sm font-medium text-black">
            
            {/* Mockups */}
            <li
              className="relative cursor-pointer flex items-center justify-between"
              onMouseEnter={() => handleMouseEnter('mockups')}
              onMouseLeave={handleMouseLeave}
              onClick={() => handleClick('mockups')}
            >
              <span className="flex text-sm font-medium items-center">
                Mockups
                <ChevronRight
                  size={12}
                  className={`ml-1 transition-transform duration-200 ${
                    activeDropdown === 'mockups' ? 'rotate-90' : ''
                  }`}
                />
              </span>

              {activeDropdown === 'mockups' && (
                <div
                  className={`absolute top-full left-0 mt-2 bg-white border border-gray-200 shadow-xl rounded-md z-50 flex p-4 transition-all duration-300 ${
                    openSection === 'print'
                      ? 'w-[700px]'
                      : openSection === 'apparel'
                      ? 'w-[550px]'
                      : 'w-[500px]'
                  }`}
                  onMouseEnter={() => handleMouseEnter('mockups')}
                  onMouseLeave={handleMouseLeave}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Left Visual */}
                  <div className="w-[150px] pr-3 border-r border-gray-200">
                    <Image
                      src="/mocknav.webp"
                      alt="Mockup Promo"
                      width={140}
                      height={180}
                      className="rounded-md object-cover"
                    />
                  </div>

                  {/* Dropdown Content */}
                  <div className="flex-1 grid grid-cols-2 gap-4 pl-3 text-sm">
                    {/* Column 1 */}
                    <div className="space-y-2">
                      {['apparel', 'accessories', 'home', 'print', 'packaging', 'tech', 'jewelry'].map(
                        (item) => (
                          <h4
                            key={item}
                            className="cursor-pointer font-semibold text-black flex items-center justify-between"
                            onClick={() => setOpenSection(openSection === item ? null : item as SectionType)}
                          >
                            {item.charAt(0).toUpperCase() + item.slice(1).replace('&', '& ')}
                            <ChevronRight
                              size={18}
                              className={`transition-transform duration-200 ${
                                openSection === item ? 'rotate-90' : ''
                              }`}
                            />
                          </h4>
                        )
                      )}
                    </div>

                    {/* Column 2 */}
                    <div>
                      {openSection === 'apparel' && (
                        <ul className="space-y-2 text-gray-700 grid grid-cols-2 gap-x-2 gap-y-1">
                          <li>
                            <Link href="/apparel/tshirt">T-Shirt</Link>
                          </li>
                          <li>
                            <Link href="/apparel/tanktop">Tank Top</Link>
                          </li>
                          <li>
                            <Link href="/apparel/hoodie">Hoodie</Link>
                          </li>
                          <li>
                            <Link href="#">Sweatshirt</Link>
                          </li>
                          <li>
                            <Link href="#">Jacket</Link>
                          </li>
                          <li>
                            <Link href="#">Crop Top</Link>
                          </li>
                          <li>
                            <Link href="#">Apron</Link>
                          </li>
                          <li>
                            <Link href="#">Scarf</Link>
                          </li>
                          <li>
                            <Link href="#">Jersey</Link>
                          </li>
                        </ul>
                      )}
                       {openSection === 'accessories' && (
                        <ul className="space-y-2 text-gray-700">
                          <li>
                            <Link href="/accessories/totebag">Tote Bag</Link>
                          </li>
                          <li>
                            <Link href="/accessories/cap">Cap</Link>
                          </li>
                          <li>
                            <Link href="/accessories/phone-cover">Phone Cover</Link>
                          </li>
                          <li>
                            <Link href="#">Gaming Pad</Link>
                          </li>
                          <li>
                            <Link href="#">Beanie</Link>
                          </li>
                        </ul>
                      )}
                       {openSection === 'home' && (
                        <ul className="space-y-2 text-gray-700">
                          <li>
                            <Link href="./home-living/can">Can</Link>
                          </li>
                          <li>
                            <Link href="./home-living/mug">Mug</Link>
                          </li>
                          <li>
                            <Link href="./home-living/cushion">Cushion</Link>
                          </li>
                          <li>
                            <Link href="#">Frame</Link>
                          </li>
                          <li>
                            <Link href="#">Coaster</Link>
                          </li>
                        </ul>
                      )}
                       {openSection === 'print' && (
                        <ul className="space-y-2 text-gray-700 grid grid-cols-2 gap-2">
  
<li>
  <Link href="./print/business-card">Business Card</Link>
</li>
<li>
  <Link href="./print/book">Book</Link>
</li>
<li>
  <Link href="./print/id-card">ID Card</Link>
</li>
<li>
  <Link href="#">Sticker</Link>
</li>
<li>
  <Link href="#">Poster</Link>
</li>
<li>
  <Link href="#">Flyer</Link>
</li>
<li>
  <Link href="#">Greeting Card</Link>
</li>
<li>
  <Link href="#">Billboard</Link>
</li>
<li>
  <Link href="#">Magazine</Link>
</li>
<li>
  <Link href="#">Brochure</Link>
</li>
<li>
  <Link href="#">Lanyard</Link>
</li>
<li>
  <Link href="#">Banner</Link>
</li>
<li>
  <Link href="#">Canvas</Link>
</li>
<li>
  <Link href="#">Notebook</Link>
</li>
                        </ul>
                      )}
                       {openSection === 'packaging' && (
                        <ul className="space-y-2 text-gray-700">
                          <li>
                            <Link href="#">Box</Link>
                          </li>
                          <li>
                            <Link href="#">Tube</Link>
                          </li>
                          <li>
                            <Link href="#">Dropper Bottle</Link>
                          </li>
                          <li>
                            <Link href="#">Pouch</Link>
                          </li>
                          <li>
                            <Link href="#">Cosmetic</Link>
                          </li>
                          <li>
                            <Link href="#">Bottle</Link>
                          </li>
                        </ul>
                      )}
                       {openSection === 'tech' && (
                        <ul className="space-y-2 text-gray-700">
                          <li>
                            <Link href="/tech/iphone">IPhone</Link>
                          </li>
                          <li>
                            <Link href="/tech/laptop">Lap Top</Link>
                          </li>
                          <li>
                            <Link href="/tech/ipad">IPad</Link>
                          </li>
                          <li>
                            <Link href="#">Macbook</Link>
                          </li>
                          <li>
                            <Link href="#">Phone</Link>
                          </li>
                        </ul>
                      )}
                       {openSection === 'jewelry' && (
                        <ul className="space-y-2 text-gray-700">
                          <li>
                            <Link href="#">Ring</Link>
                          </li>
                          <li>
                            <Link href="#">Necklace</Link>
                          </li>
                          <li>
                            <Link href="#">Earring</Link>
                          </li>
                          
                        </ul>
                      )}
                      {/* Add other sections here */}
                    </div>
                  </div>
                </div>
              )}
            </li>

            {/* Tools */}
            <li
              className="relative flex text-sm font-medium cursor-pointer hover:text-gray-700"
              onMouseEnter={() => handleMouseEnter('tools')}
              onMouseLeave={handleMouseLeave}
              onClick={() => handleClick('tools')}
            >
              Tools <span className="ml-1">
                <ChevronRight
                  size={12}
                  className={`ml-1 mt-1 transition-transform duration-200 ${
                    activeDropdown === 'tools' ? 'rotate-90' : ''
                  }`}
                />
              </span>

              {activeDropdown === 'tools' && (
                <div
                  className={`absolute top-full left-0 mt-2 bg-white border border-gray-200 shadow-xl rounded-md transition-all duration-300 w-auto min-w-[600px] z-50`}
                  onMouseEnter={() => handleMouseEnter('tools')}
                  onMouseLeave={handleMouseLeave}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex">
                    {/* Left Visual */}
                    <div className="w-[180px] p-4 border-r border-gray-200">
                      <Image
                        src="/tools.png"
                        alt="Tools Promo"
                        width={140}
                        height={180}
                        className="rounded-md object-cover mb-4"
                      />
                    </div>

                    {/* Categories in a row */}
                    <div className="flex flex-row p-4 relative">
                      <div className="flex flex-col space-x-8 items-start justify-around">
                        <div
                          className={`flex items-center cursor-pointer ${
                            openSection === 'image-editing' ? 'text-gray-700' : 'hover:text-gray-900'
                          }`}
                          onClick={() =>
                            setOpenSection(openSection === 'image-editing' ? null : 'image-editing')
                          }
                        >
                          <span className="font-medium">Image Editing</span>
                          <ChevronRight
                            size={16}
                            className={`ml-1 transition-transform ${
                              openSection === 'image-editing' ? 'rotate-90' : ''
                            }`}
                          />
                        </div>
                        <div
                          className={`flex items-center cursor-pointer ${
                            openSection === 'ai-tools' ? 'text-gray-700' : 'hover:text-gray-900'
                          }`}
                          onClick={() =>
                            setOpenSection(openSection === 'ai-tools' ? null : 'ai-tools')
                          }
                        >
                          <span className="font-medium">AI Tools</span>
                          <ChevronRight
                            size={16}
                            className={`ml-1 transition-transform ${
                              openSection === 'ai-tools' ? 'rotate-90' : ''
                            }`}
                          />
                        </div>
                        <div
                          className={`flex items-center cursor-pointer ${
                            openSection === 'image-converter'
                              ? 'text-gray-700'
                              : 'hover:text-gray-900'
                          }`}
                          onClick={() =>
                            setOpenSection(
                              openSection === 'image-converter' ? null : 'image-converter'
                            )
                          }
                        >
                          <span className="font-medium">Image Converter</span>
                          <ChevronRight
                            size={16}
                            className={`ml-1 transition-transform ${
                              openSection === 'image-converter' ? 'rotate-90' : ''
                            }`}
                          />
                        </div>
                      </div>

                      <div className="flex flex-col pt-4">
                        {openSection === 'image-editing' && (
                          <div className="flex flex-col gap-3">
                            <Link href="#" className="">Image background</Link>
                            <Link href="#" className="">Outfits AI</Link>
                            <Link href="#" className="">Blur Background</Link>
                          </div>
                        )}

                        {openSection === 'ai-tools' && (
                          <div className="flex flex-col gap-3">
                            <Link href="#" className="">AI Photography</Link>
                            <Link href="#" className="">AI Image Generator</Link>
                          </div>
                        )}

                        {openSection === 'image-converter' && (
                          <div className="grid grid-cols-2 gap-3">
                            <Link href="#" className="">PNG to WebP</Link>
                            <Link href="#" className="">WebP to PNG</Link>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </li>

            {/* Static Links */}
            <li className="cursor-pointer hover:text-pink-500"><Link href='/3d'>3D Mockup</Link></li>
            <li className="cursor-pointer flex items-center gap-1 hover:text-pink-500">
              <Link href='/custom'>Custom Mockup</Link>
              <span className="text-white text-xs font-semibold bg-pink-500 px-2 py-0.5 rounded-full">NEW</span>
            </li>
            <li className="cursor-pointer flex items-center gap-1 hover:text-pink-500">
              <Link href='/vide-mockup'>Video Mockup</Link>
              <span className="text-white text-xs font-semibold bg-pink-500 px-2 py-0.5 rounded-full">NEW</span>
            </li>
            <li className="cursor-pointer hover:text-pink-500"><Link href='/pricing'>Pricing</Link></li>

            {/* Products Gallery - only visible to admin users */}
            {session && session.user && session.user.role === 'admin' && (
              <li>
                <Link href="/product-gallery" className="hover:text-gray-700">
                  Product Gallery
                </Link>
              </li>
            )}
          </ul>
        </div>

        {/* Right side: Search Bar and Auth Button */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Search Bar - Hidden on mobile */}
          <div 
            className="hidden md:flex relative items-center w-48 lg:w-64 border border-gray-300 rounded-md hover:border-gray-400 transition-colors cursor-pointer"
            onClick={() => {
              setIsSearchOpen(true);
              setTimeout(() => {
                if (searchInputRef.current) {
                  searchInputRef.current.focus();
                }
              }, 100);
            }}
          >
            <div className="absolute left-3 text-gray-400">
              <Search size={16} />
            </div>
            <div className="w-full py-2 pl-9 pr-12 text-sm text-gray-500 rounded-md">
              Search Mockups
            </div>
            <div className="absolute right-3 text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
              Ctrl K
            </div>
          </div>
          {/* Search Icon - Only visible on mobile */}
          <button 
            className="md:hidden p-2 text-gray-700 hover:text-pink-500 hover:bg-gray-100 rounded-full"
            onClick={() => {
              setIsSearchOpen(true);
              setTimeout(() => {
                if (searchInputRef.current) {
                  searchInputRef.current.focus();
                }
              }, 100);
            }}
          >
            <Search size={20} />
          </button>
          {/* Auth Button */}
          <AuthButton />
        </div>

      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 z-40 bg-black bg-opacity-25 overflow-hidden transition-opacity duration-300 ease-in-out"
          aria-modal="true"
        >
          <div 
            ref={mobileMenuRef}
            className="relative w-full max-w-xs bg-white h-screen overflow-y-auto shadow-xl transform transition-transform duration-300 ease-in-out"
            style={{ maxHeight: '100vh' }}
          >
            <div className="px-4 pt-5 pb-6 space-y-6 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="text-pink-500 text-3xl italic font-extrabold tracking-tight font-[cursive]">
                  <Link href='/' onClick={() => setIsMobileMenuOpen(false)}>
                    <Image src="/mockey-logo.svg" alt="Mockey" width={100} height={40} />
                  </Link>
                </div>
                <button
                  type="button"
                  className="p-2 rounded-md text-gray-400 hover:text-pink-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-pink-500 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span className="sr-only">Close menu</span>
                  <X className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>

              {/* Mobile Navigation Links */}
              <div className="mt-6">
                <nav className="grid gap-y-2">
                  {/* Mockups Section */}
                  <div className="border-b border-gray-100 pb-2">
                    <button
                      className="flex items-center justify-between w-full text-left px-3 py-2 text-base font-medium text-gray-900 rounded-md hover:bg-gray-50"
                      onClick={() => toggleSection('mobile-mockups')}
                    >
                      <span>Mockups</span>
                      <ChevronRight
                        size={16}
                        className={`transition-transform duration-200 ${
                          isSectionOpen('mobile-mockups') ? 'rotate-90' : ''
                        }`}
                      />
                    </button>
                    {isSectionOpen('mobile-mockups') && (
                      <div className="mt-2 pl-4">
                        {/* Apparel */}
                        <div className="mb-2">
                          <button
                            className="flex items-center justify-between w-full text-left px-3 py-1.5 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50"
                            onClick={() => toggleSection('mobile-apparel')}
                          >
                            <span>Apparel</span>
                            <ChevronRight
                              size={14}
                              className={`transition-transform duration-200 ${
                                isSectionOpen('mobile-apparel') ? 'rotate-90' : ''
                              }`}
                            />
                          </button>
                          {openSection === 'mobile-apparel' && (
                            <div className="grid grid-cols-2 gap-x-2 gap-y-1 pl-4 mt-1">
                              <Link
                                href="/apparel/tshirt"
                                className="px-3 py-1.5 text-sm text-gray-600 rounded-md hover:bg-gray-50"
                                onClick={() => setIsMobileMenuOpen(false)}
                              >
                                T-Shirt
                              </Link>
                              <Link
                                href="/apparel/tanktop"
                                className="px-3 py-1.5 text-sm text-gray-600 rounded-md hover:bg-gray-50"
                                onClick={() => setIsMobileMenuOpen(false)}
                              >
                                Tank Top
                              </Link>
                              <Link
                                href="/apparel/hoodie"
                                className="px-3 py-1.5 text-sm text-gray-600 rounded-md hover:bg-gray-50"
                                onClick={() => setIsMobileMenuOpen(false)}
                              >
                                Hoodie
                              </Link>
                              <Link
                                href="#"
                                className="px-3 py-1.5 text-sm text-gray-600 rounded-md hover:bg-gray-50"
                                onClick={() => setIsMobileMenuOpen(false)}
                              >
                                Sweatshirt
                              </Link>
                            </div>
                          )}
                        </div>
                        
                        {/* Accessories */}
                        <div className="mb-2">
                          <button
                            className="flex items-center justify-between w-full text-left px-3 py-1.5 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50"
                            onClick={() => toggleSection('mobile-accessories')}
                          >
                            <span>Accessories</span>
                            <ChevronRight
                              size={14}
                              className={`transition-transform duration-200 ${
                                isSectionOpen('mobile-accessories') ? 'rotate-90' : ''
                              }`}
                            />
                          </button>
                          {isSectionOpen('mobile-accessories') && (
                            <div className="pl-4 mt-1 space-y-1">
                              <Link
                                href="/accessories/totebag"
                                className="block px-3 py-1.5 text-sm text-gray-600 rounded-md hover:bg-gray-50"
                                onClick={() => setIsMobileMenuOpen(false)}
                              >
                                Tote Bag
                              </Link>
                              <Link
                                href="/accessories/cap"
                                className="block px-3 py-1.5 text-sm text-gray-600 rounded-md hover:bg-gray-50"
                                onClick={() => setIsMobileMenuOpen(false)}
                              >
                                Cap
                              </Link>
                            </div>
                          )}
                        </div>
                        
                        {/* Tech */}
                        <div className="mb-2">
                          <button
                            className="flex items-center justify-between w-full text-left px-3 py-1.5 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50"
                            onClick={() => toggleSection('mobile-tech')}
                          >
                            <span>Tech</span>
                            <ChevronRight
                              size={14}
                              className={`transition-transform duration-200 ${
                                isSectionOpen('mobile-tech') ? 'rotate-90' : ''
                              }`}
                            />
                          </button>
                          {isSectionOpen('mobile-tech') && (
                            <div className="pl-4 mt-1 space-y-1">
                              <Link
                                href="/tech/iphone"
                                className="block px-3 py-1.5 text-sm text-gray-600 rounded-md hover:bg-gray-50"
                                onClick={() => setIsMobileMenuOpen(false)}
                              >
                                iPhone
                              </Link>
                              <Link
                                href="/tech/laptop"
                                className="block px-3 py-1.5 text-sm text-gray-600 rounded-md hover:bg-gray-50"
                                onClick={() => setIsMobileMenuOpen(false)}
                              >
                                Laptop
                              </Link>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Tools Section */}
                  <div className="border-b border-gray-100 pb-2">
                    <button
                      className="flex items-center justify-between w-full text-left px-3 py-2 text-base font-medium text-gray-900 rounded-md hover:bg-gray-50"
                      onClick={() => toggleSection('mobile-tools')}
                    >
                      <span>Tools</span>
                      <ChevronRight
                        size={16}
                        className={`transition-transform duration-200 ${
                          isSectionOpen('mobile-tools') ? 'rotate-90' : ''
                        }`}
                      />
                    </button>
                    {isSectionOpen('mobile-tools') && (
                      <div className="mt-2 pl-4 space-y-2">
                        {/* Image Editing */}
                        <div>
                          <button
                            className="flex items-center justify-between w-full text-left px-3 py-1.5 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50"
                            onClick={() => toggleSection('mobile-image-editing')}
                          >
                            <span>Image Editing</span>
                            <ChevronRight
                              size={14}
                              className={`transition-transform duration-200 ${
                                isSectionOpen('mobile-image-editing') ? 'rotate-90' : ''
                              }`}
                            />
                          </button>
                          {isSectionOpen('mobile-image-editing') && (
                            <div className="pl-4 mt-1 space-y-1">
                              <Link
                                href="#"
                                className="block px-3 py-1.5 text-sm text-gray-600 rounded-md hover:bg-gray-50"
                                onClick={() => setIsMobileMenuOpen(false)}
                              >
                                Image Background
                              </Link>
                              <Link
                                href="#"
                                className="block px-3 py-1.5 text-sm text-gray-600 rounded-md hover:bg-gray-50"
                                onClick={() => setIsMobileMenuOpen(false)}
                              >
                                Blur Background
                              </Link>
                            </div>
                          )}
                        </div>
                        
                        {/* AI Tools */}
                        <div>
                          <button
                            className="flex items-center justify-between w-full text-left px-3 py-1.5 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50"
                            onClick={() => toggleSection('mobile-ai-tools')}
                          >
                            <span>AI Tools</span>
                            <ChevronRight
                              size={14}
                              className={`transition-transform duration-200 ${
                                isSectionOpen('mobile-ai-tools') ? 'rotate-90' : ''
                              }`}
                            />
                          </button>
                          {isSectionOpen('mobile-ai-tools') && (
                            <div className="pl-4 mt-1 space-y-1">
                              <Link
                                href="#"
                                className="block px-3 py-1.5 text-sm text-gray-600 rounded-md hover:bg-gray-50"
                                onClick={() => setIsMobileMenuOpen(false)}
                              >
                                AI Photography
                              </Link>
                              <Link
                                href="#"
                                className="block px-3 py-1.5 text-sm text-gray-600 rounded-md hover:bg-gray-50"
                                onClick={() => setIsMobileMenuOpen(false)}
                              >
                                AI Image Generator
                              </Link>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Static Links Section */}
                  <div className="pt-2 space-y-1">
                    <Link
                      href="/3d"
                      className="block px-3 py-2 text-base font-medium text-gray-900 rounded-md hover:bg-gray-50"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      3D Mockup
                    </Link>
                    <Link
                      href="/custom"
                      className="flex items-center px-3 py-2 text-base font-medium text-gray-900 rounded-md hover:bg-gray-50"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Custom Mockup
                      <span className="ml-2 text-white text-xs font-semibold bg-pink-500 px-2 py-0.5 rounded-full">NEW</span>
                    </Link>
                    <Link
                      href="/vide-mockup"
                      className="flex items-center px-3 py-2 text-base font-medium text-gray-900 rounded-md hover:bg-gray-50"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Video Mockup
                      <span className="ml-2 text-white text-xs font-semibold bg-pink-500 px-2 py-0.5 rounded-full">NEW</span>
                    </Link>
                    <Link
                      href="/pricing"
                      className="block px-3 py-2 text-base font-medium text-gray-900 rounded-md hover:bg-gray-50"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Pricing
                    </Link>

                    {/* Admin link - only for admin users */}
                    {session && session.user && session.user.role === 'admin' && (
                      <Link
                        href="/admin/dashboard"
                        className="block px-3 py-2 text-base font-medium text-gray-900 rounded-md hover:bg-gray-50"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Admin Dashboard
                      </Link>
                    )}
                  </div>
                </nav>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 bg-opacity-50 backdrop-blur-xs z-50 flex items-start justify-center pt-[10vh]">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden">
            {/* Search Input */}
            <div className="relative border-b border-gray-200">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                <Search size={18} />
              </div>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search Mockups"
                className="w-full py-4 pl-12 pr-12 text-lg focus:outline-none"
                autoFocus
              />
              <button 
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => setIsSearchOpen(false)}
              >
                <span className="text-2xl font-light">×</span>
              </button>
            </div>
            
            {/* Suggestions */}
            <div className="p-4">
              <h3 className="text-sm font-medium text-gray-500 mb-3">Suggestions</h3>
              <ul className="space-y-1">
                <li className="p-2 hover:bg-gray-100 rounded cursor-pointer">Tshirt Mockup</li>
                <li className="p-2 hover:bg-gray-100 rounded cursor-pointer">Oversized Tshirt Mockup</li>
                <li className="p-2 hover:bg-gray-100 rounded cursor-pointer">Tote Bag Mockup</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
