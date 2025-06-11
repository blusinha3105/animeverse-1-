
import React, { useEffect, useRef } from 'react';
import { JuicyAdsSettings } from '../../types'; // Ensure this path is correct

interface JuicyAdsBannerProps {
  spotId: string;
  width: number;
  height: number;
  className?: string;
}

const JuicyAdsBanner: React.FC<JuicyAdsBannerProps> = ({ spotId, width, height, className }) => {
  const adContainerRef = useRef<HTMLDivElement>(null);
  const adLoadedRef = useRef(false); // To prevent multiple script injections

  useEffect(() => {
    if (!adContainerRef.current || adLoadedRef.current) return;

    const storedSettings = localStorage.getItem('siteSettings');
    const settings: Partial<JuicyAdsSettings> = storedSettings ? JSON.parse(storedSettings) : {};

    if (settings.juicyAdsEnabled && spotId) {
      const mainScript = document.createElement('script');
      mainScript.async = true;
      mainScript.setAttribute('data-cfasync', 'false');
      mainScript.src = "//adserver.juicyads.com/js/jads.js";
      
      // Check if main script already exists to avoid duplicates
      const existingMainScript = document.querySelector(`script[src="${mainScript.src}"]`);
      if (!existingMainScript) {
        document.head.appendChild(mainScript);
      }
      
      const adIns = document.createElement('ins');
      adIns.id = spotId; // JuicyAds uses the spot ID as the element ID
      adIns.setAttribute('data-width', width.toString());
      adIns.setAttribute('data-height', height.toString());
      
      const adShowScript = document.createElement('script');
      adShowScript.async = true;
      adShowScript.setAttribute('data-cfasync', 'false');
      // Ensure adsbyjuicy is initialized
      adShowScript.innerHTML = `(window.adsbyjuicy = window.adsbyjuicy || []).push({'adshow':'${spotId}'});`;

      adContainerRef.current.appendChild(adIns);
      adContainerRef.current.appendChild(adShowScript);
      adLoadedRef.current = true; // Mark as loaded

      return () => {
        // Cleanup if component unmounts, though ad scripts might persist if not handled by JuicyAds lib itself
        if (adContainerRef.current) {
          adContainerRef.current.innerHTML = '';
        }
        // Potentially remove the scripts if they were specific to this instance and not global
      };
    }
  }, [spotId, width, height]);

  const storedSettings = localStorage.getItem('siteSettings');
  const settings: Partial<JuicyAdsSettings> = storedSettings ? JSON.parse(storedSettings) : {};
  if (!settings.juicyAdsEnabled || !spotId) {
    return null; // Don't render anything if ads are disabled or no spotId
  }

  return <div ref={adContainerRef} className={className} style={{ width: `${width}px`, height: `${height}px`, margin: 'auto' }}></div>;
};

export default JuicyAdsBanner;
