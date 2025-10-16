"use client";
import React, { useState,useEffect, useRef } from "react";
import gsap from "gsap";
import { useRouter } from "next/navigation";
interface Cloud {
  src: string;
  top: string;
  width: string;
  fromLeft: boolean;
  scale: number;
  opacity: number;
}

interface CloudTransitionProps {
  onComplete?: () => void;
}

const cloudImages: string[] = [
  "https://i.ibb.co/HrWcHqL/clouda1.png",
  "https://i.ibb.co/jThXncF/clouda2.png",
  "https://i.ibb.co/hmPBGGh/clouda3.png",
  "https://i.ibb.co/YBwsL7S/clouda4.png",
  "https://i.ibb.co/K7jNJPr/clouda5.png",
  "https://i.ibb.co/K7jNJPr/clouda6.png",
];

const CloudTransition: React.FC<CloudTransitionProps> = ({ onComplete }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const NUM_CLOUDS = 20;

  const cloudsArray: Cloud[] = Array.from({ length: NUM_CLOUDS }).map(() => {
    const src = cloudImages[Math.floor(Math.random() * cloudImages.length)];
    const top = `${Math.floor(Math.random() * 100)}%`;
    const width = `${Math.floor(Math.random() * 120) + 150}vw`; // 150–270vw
    const fromLeft = Math.random() > 0.5;
    const scale = 1.5 + Math.random() * 1.5; // 1.5–3
    const opacity = 0.6 + Math.random() * 0.4;
    return { src, top, width, fromLeft, scale, opacity };
  });

  useEffect(() => {
    if (!containerRef.current) {
      return () => {};
    }

    const cloudElements = containerRef.current.querySelectorAll<HTMLImageElement>(".cloud");
    const tl = gsap.timeline({
      onComplete: onComplete,
    });

    cloudElements.forEach((cloud, i) => {
      const distance = window.innerWidth + cloud.offsetWidth * 2;

      tl.fromTo(
        cloud,
        {
          x: cloudsArray[i].fromLeft ? -distance : distance,
          scale: cloudsArray[i].scale,
          opacity: cloudsArray[i].opacity,
        },
        {
          x: cloudsArray[i].fromLeft ? distance : -distance,
          duration: 3 + Math.random(),
          ease: "power1.inOut",
        },
        0
      );
    });

    return () => tl.kill();
  }, [cloudsArray, onComplete]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 overflow-hidden pointer-events-none z-50"
    >
      {cloudsArray.map((cloud, i) => (
        <img
          key={i}
          className="cloud absolute"
          style={{
            top: cloud.top,
            width: cloud.width,
            left: cloud.fromLeft ? "-150%" : "150%",
            transform: `scale(${cloud.scale})`,
            opacity: cloud.opacity,
          }}
          src={cloud.src}
          alt="cloud"
        />
      ))}
    </div>
  );
};

export default CloudTransition;



const Home: React.FC = () => {
  const router = useRouter();
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleClick = () => setIsTransitioning(true);

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-black text-white">
      <button
        onClick={handleClick}
        className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded z-10 relative"
      >
        Go to Page
      </button>

      {isTransitioning && (
        <CloudTransition
          onComplete={() => {
            router.push("/destination");
          }}
        />
      )}
    </div>
  );
};



//const Home: React.FC = () => {
//   const router = useRouter();
//   const [isTransitioning, setIsTransitioning] = useState(false);

//   const handleClick = () => setIsTransitioning(true);

//   return (
//     <div className="relative min-h-screen flex items-center justify-center bg-black text-white">
//       <button
//         onClick={handleClick}
//         className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded z-10 relative"
//       >
//         Go to Page
//       </button>

//       {isTransitioning && (
//         <CloudTransition
//           onComplete={() => {
//             router.push("/destination");
//           }}
//         />
//       )}
//     </div>
//   );
// };