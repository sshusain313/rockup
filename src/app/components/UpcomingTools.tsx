import Image from 'next/image';

export default function Home() {
  return (
    <main className="min-h-screen bg-white flex flex-col items-center">
      <div className='w-full max-w-5xl mb-8 flex flex-col items-start'>
        <h1 className="text-3xl font-bold mb-2 items-start">Upcoming AI and other tools</h1>
        <p className="text-gray-600 mb-8 text-xl items-start">
          Our upcoming AI suite and 3D editor will change the way you design
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 w-full max-w-5xl">
        {/* AI Product Photography */}
        <div className="bg-white shadow-md rounded-2xl p-6 flex flex-col items-start">
          <Image
            src="/product-photography.png"
            alt="AI Product Photography"
            width={500}
            height={500}
            className="rounded-xl"
          />
        </div>

        {/* 3D Mockup Generator */}
        <div className="bg-black shadow-md rounded-2xl p-6 flex flex-col items-start">
          <Image
            src="/3d-mockup.png"
            alt="3D Mockup"
            width={500}
            height={500}
            className="rounded-xl"
          />
        </div>
      </div>
    </main>
  );
}
