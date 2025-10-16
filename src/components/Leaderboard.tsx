"use client";
import { useState, useEffect } from 'react';
import Image from 'next/image';
import './Leaderboard.css';

// Define the structure of a team's data to match the JSON
interface Team {
  rank: number;
  name: string;
  score: number;
}

const Leaderboard = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  const [teams, setTeams] = useState<Team[]>([]);
  const [myTeam, setMyTeam] = useState<Team | null>(null);
  const [otherTeams, setOtherTeams] = useState<Team[]>([]);
  
  const myTeamName = "Kraken's Crew";

  useEffect(() => {
    if (isOpen) {
      fetch('/data.json')
        .then((response) => response.json())
        .then((data) => {
          const allTeams: Team[] = data.leaderboard;
          
          const userTeam = allTeams.find(team => team.name === myTeamName) || null;
          const otherTeamsData = allTeams.filter(team => team.name !== myTeamName);
          
          setTeams(allTeams);
          setMyTeam(userTeam);
          setOtherTeams(otherTeamsData);
        })
        .catch((error) => console.error("Failed to fetch leaderboard data:", error));
    }
  }, [isOpen]);

  const toggleLeaderboard = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div>
      <div className="leaderboard-icon" onClick={toggleLeaderboard}>
        <Image
          src="/compass.svg"
          alt="Leaderboard"
          width={200}
          height={200}
        />
      </div>
      {isOpen && (
        <div className="leaderboard-modal">
          <div className="leaderboard-content">
            <button className="close-button" onClick={toggleLeaderboard}>
              &times;
            </button>
            <h2>Captain's Log: CTF Rankings</h2>
            <div className="table-wrapper">
              <table className="leaderboard-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Team Name</th>
                    <th>Total Points</th>
                  </tr>
                </thead>
                <tbody className="scrollable-tbody">
                  {otherTeams.map((team) => (
                    <tr key={team.rank}>
                      <td>{team.rank}</td>
                      <td>{team.name}</td>
                      <td>{team.score} pts</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* UPDATED: Replaced <tfoot> with a div for the log background */}
              {myTeam && (
                <div className="my-team-log-container">
                  <span className="log-rank">{myTeam.rank}</span>
                  <span className="log-name">{myTeam.name}</span>
                  <span className="log-score">{myTeam.score} pts</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;

