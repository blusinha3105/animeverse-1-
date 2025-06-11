
import React, { useState, useEffect } from 'react';
import { Anime } from '../../types';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa6';
import TrendingCarouselSlide from './TrendingCarouselSlide';

interface TrendingCarouselProps {
  animes: Anime[];
}

const TrendingCarousel: React.FC<TrendingCarouselProps> = ({ animes }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const itemsToShow = animes.slice(0, 4); // Ensure max 4 items

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? itemsToShow.length - 1 : prevIndex - 1));
  };

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex === itemsToShow.length - 1 ? 0 : prevIndex + 1));
  };

  useEffect(() => {
    if (itemsToShow.length <= 1) return; // No need for interval if 0 or 1 slide
    const interval = setInterval(() => {
      nextSlide();
    }, 7000); // Change slide every 7 seconds
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsToShow.length, currentIndex]); // Re-run if length changes or user navigates manually

  if (!itemsToShow || itemsToShow.length === 0) {
    return <div className="h-72 md:h-96 lg:h-[480px] xl:h-[550px] flex items-center justify-center bg-card rounded-xl text-text-secondary">Nenhum destaque disponível.</div>;
  }

  return (
    <div className="relative w-full h-72 md:h-96 lg:h-[480px] xl:h-[550px] rounded-xl overflow-hidden group shadow-2xl">
      <div
        className="flex transition-transform duration-700 ease-in-out h-full"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {itemsToShow.map((anime) => (
          <div key={anime.id} className="w-full h-full flex-shrink-0">
            <TrendingCarouselSlide anime={anime} />
          </div>
        ))}
      </div>

      {itemsToShow.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute top-1/2 left-2 md:left-4 transform -translate-y-1/2 bg-black/30 hover:bg-black/60 text-white p-2 md:p-3 rounded-full transition-opacity duration-300 opacity-0 group-hover:opacity-100 z-10"
            aria-label="Slide anterior"
          >
            <FaChevronLeft size={20} />
          </button>
          <button
            onClick={nextSlide}
            className="absolute top-1/2 right-2 md:right-4 transform -translate-y-1/2 bg-black/30 hover:bg-black/60 text-white p-2 md:p-3 rounded-full transition-opacity duration-300 opacity-0 group-hover:opacity-100 z-10"
            aria-label="Próximo slide"
          >
            <FaChevronRight size={20} />
          </button>
        </>
      )}

      <div className="absolute bottom-3 md:bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
        {itemsToShow.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 md:w-2.5 md:h-2.5 rounded-full transition-colors duration-300 ${
              currentIndex === index ? 'bg-primary-action' : 'bg-white/50 hover:bg-white/80'
            }`}
            aria-label={`Ir para o slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default TrendingCarousel;
