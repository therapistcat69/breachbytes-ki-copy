"use client";
import { useState } from "react"; // Import useState
import Leaderboard from "@/components/Leaderboard";
import { DomainWiseLeaderBoard } from "@/components/DomainWiseLeaderBoard";
import dynamic from "next/dynamic";
const OceanScene = dynamic(() => import("@/components/Ocean"), { ssr: false });

export default function Homes() {
  const [isSceneLoaded, setIsSceneLoaded] = useState(false);

  return (
    <main className="h-full w-full relative">
      <OceanScene onLoaded={() => setTimeout(() => setIsSceneLoaded(true), 1500)} />

      {!isSceneLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <p className="text-white text-2xl">Loading Scene...</p>
        </div>
      )}

      {isSceneLoaded && (
        <>
          <DomainWiseLeaderBoard />
          <Leaderboard />
        </>
      )}
    </main>
  );
}