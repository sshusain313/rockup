import Image from "next/image";
import Header from "./components/Header";
import Grid from "./components/Grid";
import Appearl from "./components/Appearl";
import UpcomingTools from "./components/UpcomingTools";
import Cards from "./components/Cards";
import Video from "./components/Video";
import Free from "./components/Free";
import Faqs from "./components/Faqs";
import Last from "./components/Last";
// import { MockupLayout } from "./components/mockey/MockupLayout";
export default function Home() {
  return (
    <div className="overflow-x-hidden">
      <Header />
      <div className="-mt-16 sm:-mt-20 px-4 sm:px-6 md:px-8"> 
        <Grid />
      </div>
      <div className="px-4 sm:px-6 md:px-8">
        <Appearl />
      </div>
      <div className="px-4 sm:px-6 md:px-8">
        <UpcomingTools />
      </div>
      <div className="flex flex-col items-center justify-center py-10 sm:py-16 px-4 sm:px-6 md:px-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6 sm:mb-10">Our Services</h2>
        <div className="w-full max-w-4xl mx-auto">
          <Cards />
        </div>
      </div>
      <div className="px-4 sm:px-6 md:px-8">
        <Video />
      </div>
      <div className="px-4 sm:px-6 md:px-8">
        <Free />
      </div>
      <div className="px-4 sm:px-6 md:px-8">
        <Faqs />
      </div>
      <div className="px-4 sm:px-6 md:px-8">
        <Last />
      </div>
    </div>
  );
}
