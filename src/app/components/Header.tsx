import { CloudUpload } from 'lucide-react';

export default function Header() {
  return (
    <div className="min-h-[90vh] flex items-center justify-center bg-gradient-to-b from-pink-300 to-white text-center px-4">
      <div className="max-w-5xl">
        {/* Tags */}
        <div className="mb-6 w-1/3 mx-auto flex justify-center gap-4 bg-white rounded-full p-2 shadow-md">
          {['crisp', 'fast', 'smooth'].map((tag, index) => (
            <span
              key={tag}
              className=" text-pink-500 font-semibold text-sm py-1"
            >
              {tag}
              {index < 2 && <span className="mx-2 font-bold text-pink-400">•</span>}
            </span>
          ))}
        </div>

        {/* Heading */}
        <h1 className="font-bricolage text-4xl sm:text-5xl font-extrabold text-black leading-tight mb-4">
          Free Mockup Generator with <br /> 5000+ Mockup Templates
        </h1>

        {/* Subtext */}
        <p className="text-gray-700 text-sm sm:text-base mb-8">
          Create free product mockups with premium and unique templates. Free AI mockup generator with 45+ mockup categories <br />
          including t-shirt mockups, accessories, iPhone and more.
        </p>

        {/* Upload Button */}
        <button className="flex items-center gap-2 mx-auto bg-pink-500 hover:bg-pink-600 text-white font-medium px-6 py-3 rounded-lg transition">
          <CloudUpload className="w-5 h-5" />
          Upload Design
        </button>
      </div>
    </div>
  );
}
