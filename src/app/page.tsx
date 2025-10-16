"use client";
import CloudTransition from "@/components/Cloud";
import Homes from "@/components/Home";

export default function Home() {
  return (
    <main className="h-full w-full">
      <Homes />
      <CloudTransition />
    </main>
  );
}