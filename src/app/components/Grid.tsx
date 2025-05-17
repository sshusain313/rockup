const mockupItems = [
    { label: "T-shirt", src: "/mockups/tshirt.jpg" },
    { label: "Hoodie", src: "/mockups/hoodie.jpg" },
    { label: "Totebag", src: "/mockups/totebag.jpg" },
    { label: "Box", src: "/mockups/box.jpg" },
    { label: "Poster", src: "/mockups/poster.jpg" },
    { label: "iPhone", src: "/mockups/iphone.jpg" },
    { label: "Book", src: "/mockups/book.jpg" },
    { label: "Business Card", src: "/mockups/business-card.jpg" },
  ];
  
  export default function Grid() {
    return (
      <div className="px-4 py-12">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {mockupItems.map(({ label, src }) => (
            <div key={label} className="relative rounded-xl overflow-hidden shadow-md group cursor-pointer">
              <img
                src={src}
                alt={label}
                className="w-full h-60 object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute bottom-2 left-2 text-white font-bold text-lg drop-shadow-md">
                {label}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  