"use client";
import { useState, useEffect } from 'react';
import Image from 'next/image';
import './Leaderboard.css';

// Define the structure of a team's data
interface Team {
  rank: number;
  teamName: string;
  totalPoints: number;
}

const Leaderboard = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);

  // Fetch leaderboard data when the component mounts
  useEffect(() => {
    fetch('/Data.json')
      .then((res) => res.json())
      .then((data) => setTeams(data.leaderboard || []));
  }, []);

  const toggleLeaderboard = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div>
      {/* SVG Icon */}
      <div className="leaderboard-icon" onClick={toggleLeaderboard}>
        <Image
          src="/compass.svg"
          alt="Leaderboard"
          width={200}
          height={200}
        />
      </div>

      {/* Leaderboard Modal */}
      {isOpen && (
        <div className="leaderboard-modal">
          <div className="leaderboard-content">
            <button className="close-button" onClick={toggleLeaderboard}>
              &times;
            </button>
            <h2>Captain&apos;s Log: CTF Rankings</h2>
            <table>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Team Name</th>
                  <th>Total Points</th>
                </tr>
              </thead>
              <tbody>
                {teams.map((team) => (
                  <tr key={team.rank}>
                    <td>{team.rank}</td>
                    <td>{team.teamName}</td>
                    <td>{team.totalPoints} pts</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;