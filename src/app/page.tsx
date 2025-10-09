"use client";
import WaterScene from "@/components/WaterScene";
import WaterScene2 from "@/components/WaterScene2";
import dynamic from "next/dynamic";
import Leaderboard from "@/components/Leaderboard"; // Import the Leaderboard component

const OceanScene = dynamic(() => import("@/components/Ocean"), { ssr: false });

export default function Home() {
  return (
    <main className="h-full w-full">
      {/* Our scene component will take up the full space of the main element */}
      {/* <WaterScene /> */}
      {/* <WaterScene2 /> */}
      <OceanScene />
      <Leaderboard /> {/* Add the Leaderboard component here */}
    </main>
  );
}