"use client";

import { useState } from "react";
import Image from "next/image";
import "./TreasureChest.css";

interface TreasureChestProps {
  points?: number;
  players?: number;
}

export default function TreasureChest({
  points = 100,
  players = 1,
}: TreasureChestProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = () => setIsOpen((v) => !v);

  return (
    <div className="treasure-chest-wrapper">
      <button
        onClick={handleToggle}
        aria-pressed={isOpen}
        title={isOpen ? "Close" : "Open"}
        className="treasure-chest-button"
      >
        <Image
          src={isOpen ? "/assets/chest-open.png" : "/assets/chest-closed.png"}
          alt={isOpen ? "Open chest" : "Closed chest"}
          width={120}
          height={120}
          className="treasure-chest-image"
        />
      </button>

      {isOpen && (
        <div className="treasure-popup">
          <div className="treasure-popup-content">
            <div className="treasure-popup-header">
              <div className="treasure-popup-points">
                <span className="sparkles-icon">✨</span>
                <strong>+{points} Points</strong>
              </div>
              <button
                onClick={handleToggle}
                aria-label="Close"
                className="treasure-popup-close"
              >
                ×
              </button>
            </div>

            <div className="treasure-popup-info">
              <div className="treasure-popup-label">Players tried</div>
              <div className="treasure-popup-value">{players.toLocaleString()}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
