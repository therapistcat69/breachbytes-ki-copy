"use client";
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Pirata_One } from 'next/font/google'; 
import { useState, useEffect } from 'react';



const pirata = Pirata_One({
  subsets: ['latin'],
  weight: ['400'],
});

// --- Interface and Data ---
interface MapPoint {
  id: number;
  title: string;
  icon: string;
  position: { top: string; left: string };
  targetPage: string;
}


const mapPoints: MapPoint[] = [
    { id: 1, title: 'Kraken\'s Lair', icon: '/map-assets/kraken.svg', position: { top: '65%', left: '55%' }, targetPage: '/challenge/kraken' },
    { id: 2, title: 'Shipwreck Cove', icon: '/map-assets/shipwreck.svg', position: { top: '35%', left: '80%' }, targetPage: '/challenge/shipwreck' },
    { id: 3, title: 'Treasure Island', icon: '/map-assets/treasure.svg', position: { top: '70%', left: '12%' }, targetPage: '/challenge/treasure' },
    { id: 4, title: 'Mermaid Lagoon', icon: '/map-assets/mermaid.svg', position: { top: '35%', left: '45%' }, targetPage: '/challenge/mermaid' },
    { id: 5, title: 'Volcano Peak', icon: '/map-assets/volcano.svg', position: { top: '35%', left: '14%' }, targetPage: '/challenge/volcano' },
    { id: 6, title: 'Pirate Fort', icon: '/map-assets/fort.svg', position: { top: '10%', left: '30%' }, targetPage: '/challenge/fort' },
    { id: 7, title: 'Skull Island', icon: '/map-assets/skull.svg', position: { top: '14%', left: '55%' }, targetPage: '/challenge/locker' },
];

// --- Component ---
interface InteractiveMapProps {
  isVisible: boolean;
  onClose: () => void;
}

const InteractiveMap = ({ isVisible, onClose }: InteractiveMapProps) => {
  const router = useRouter();
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => setIsAnimating(true), 10);
      return () => clearTimeout(timer);
    } else {
      setIsAnimating(false);
    }
  }, [isVisible]);

  const handlePointClick = (pageUrl: string) => {
    router.push(pageUrl);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="map-overlay">
      <button className="map-close-button" onClick={onClose}>
        &times;
      </button>
      
      <div className="map-container">
        <Image src="/map-assets/map.svg" alt="World Map" layout="fill" objectFit="cover" className="background-map" />
        
        {/* --- ADD YOUR DECORATIVE SVGS HERE --- */}
        <div className="map-decoration" style={{ top: '60%', left: '70%' }}>
          <Image src="/map-assets/boat1.svg" alt="Wandering Boat" width={80} height={80} />
        </div>

        <div className="map-decoration" style={{ top: '80%', left: '36%' }}>
          <Image src="/map-assets/boat2.svg" alt="Wandering Boat" width={80} height={80} />
        </div>
        
        
        <div className="map-decoration" style={{ top: '30%', left: '5%' }}>
          <Image src="/map-assets/Treasure casket.svg" alt="Sunken Treasure" width={60} height={60} />
        </div>

        <div className="map-decoration" style={{ top: '25%', left: '78%' }}>
          <Image src="/map-assets/Treasure casket.svg" alt="Sunken Treasure" width={60} height={60} />
        </div>

        <div className="map-decoration" style={{ top: '20%', left: '78%' }}>
          <Image src="/map-assets/skullface.svg" alt="skull" width={30} height={30} />
        </div>
        {/* ------------------------------------ */}

        {mapPoints.map(point => (
          <div
            key={point.id}
            className="map-point"
            style={{ top: point.position.top, left: point.position.left }}
            onClick={() => handlePointClick(point.targetPage)}
            title={point.title}
          >
            <Image 
              src={point.icon} 
              alt={point.title} 
              width={300}
              height={300}
            />
             <span className={`${pirata.className} point-title`}>
               {point.title}
             </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InteractiveMap;