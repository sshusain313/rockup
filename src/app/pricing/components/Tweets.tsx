import Image from "next/image";

const tweets = [
  "/tweets/tweet1.png",
  "/tweets/tweet2.png",
  "/tweets/tweet3.png",
  "/tweets/tweet4.png",
  "/tweets/tweet5.png",
  "/tweets/tweet6.png",
  "/tweets/tweet7.png",
  "/tweets/tweet8.png",
  "/tweets/tweet9.png",
  "/tweets/tweet10.png",
  "/tweets/tweet11.png",
  "/tweets/tweet12.png",
  "/tweets/tweet13.png",
  "/tweets/tweet14.png",
  "/tweets/tweet15.png",
];

export default function TrustedPage() {
  return (
    <div className="bg-gray-50 py-16 px-6">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-center text-black">
          Trusted by 1M+ Users
        </h2>
        <p className="text-center text-gray-600 mt-2 text-sm">
          It’s easy, it’s fast and it’s curated
        </p>

        <div className="mt-10 [column-count:1] sm:[column-count:2] md:[column-count:3] gap-4 space-y-4">
          {tweets.map((src, index) => (
            <div key={index} className="break-inside-avoid rounded-lg overflow-hidden shadow bg-white">
              <Image
                src={src}
                alt={`Tweet ${index + 1}`}
                width={500}
                height={500}
                className="w-full h-auto object-cover"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
