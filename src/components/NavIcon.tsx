"use client";
import React from 'react';
import { useState } from 'react';
import Image from 'next/image';
import InteractiveMap from './InteractiveMap';

const NavIcon = () => {
  const [isMapVisible, setMapVisible] = useState(false);

  return (
    <>
      {/* Map Icon (Parrot) */}
      <div className="map-icon" onClick={() => setMapVisible(true)}>
        <Image src="/parrot.svg" alt="Open Map" width={120} height={120} />
      </div>

      {/* The Interactive Map Overlay */}
      <InteractiveMap 
        isVisible={isMapVisible} 
        onClose={() => setMapVisible(false)} 
      />
    </>
  );
};

export default NavIcon;