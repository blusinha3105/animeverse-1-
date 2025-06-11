
import React, { useEffect, useRef } from 'react';
import { JuicyAdsSettings } from '../../types'; // Ensure this path is correct

const JuicyAdsPopunder: React.FC = () => {
  const popunderLoadedRef = useRef(false);

  useEffect(() => {
    if (popunderLoadedRef.current) return;

    const storedSettings = localStorage.getItem('siteSettings');
    const settings: Partial<JuicyAdsSettings> = storedSettings ? JSON.parse(storedSettings) : {};
    const popunderSpotId = settings.juicyAdsSpotPopunder;

    if (settings.juicyAdsEnabled && popunderSpotId) {
      const mainScriptId = 'juicyads-main-jads';
      if (!document.getElementById(mainScriptId)) {
        const mainScript = document.createElement('script');
        mainScript.id = mainScriptId;
        mainScript.async = true;
        mainScript.setAttribute('data-cfasync', 'false');
        mainScript.src = "//adserver.juicyads.com/js/jads.js";
        document.head.appendChild(mainScript);
      }
      
      // Check if this specific popunder spot has already been initialized
      const popunderInsId = `juicyads-popunder-${popunderSpotId}`;
      if(!document.getElementById(popunderInsId)) {
        const adIns = document.createElement('ins');
        adIns.id = popunderSpotId; // JuicyAds uses the spot ID as the element ID
        adIns.setAttribute('data-width', '0'); // Popunders typically use 0x0
        adIns.setAttribute('data-height', '0');
        // Hide the <ins> tag for popunders
        adIns.style.display = 'none'; 
        adIns.id = popunderInsId; // Unique ID for the ins element
        
        const adShowScript = document.createElement('script');
        adShowScript.async = true;
        adShowScript.setAttribute('data-cfasync', 'false');
        adShowScript.innerHTML = `(window.adsbyjuicy = window.adsbyjuicy || []).push({'adshow':'${popunderSpotId}'});`;

        document.body.appendChild(adIns);
        document.body.appendChild(adShowScript); // Scripts often go at the end of body
      }
      
      popunderLoadedRef.current = true;
    }
  }, []);

  return null; // This component doesn't render any visible UI itself
};

export default JuicyAdsPopunder;
