import React, { useEffect, useState } from 'react';
import { useReadContract } from 'wagmi';

const CONTRACT_ADDRESS = '0x03BD9Be20078963d762E1733633a617C6F05e0C3';
const CONTRACT_ABI = [
  {
    "inputs": [],
    "name": "getEntries",
    "outputs": [
      {
        "components": [
          { "internalType": "address", "name": "player", "type": "address" },
          { "internalType": "uint256", "name": "time", "type": "uint256" },
          { "internalType": "string", "name": "difficulty", "type": "string" }
        ],
        "internalType": "struct SudokuLeaderboard.Entry[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

function Leaderboard() {
  const { data, refetch } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getEntries'
  });

  const [easy, setEasy] = useState([]);
  const [medium, setMedium] = useState([]);
  const [hard, setHard] = useState([]);

  useEffect(() => {
    if (data) {
      const formatted = data.map(entry => ({
        player: entry.player,
        time: Number(entry.time),
        difficulty: entry.difficulty
      }));

      setEasy(formatted.filter(e => e.difficulty === 'easy').sort((a, b) => a.time - b.time).slice(0, 5));
      setMedium(formatted.filter(e => e.difficulty === 'medium').sort((a, b) => a.time - b.time).slice(0, 5));
      setHard(formatted.filter(e => e.difficulty === 'hard').sort((a, b) => a.time - b.time).slice(0, 5));
    }
  }, [data]);

  const renderTable = (entries, title) => (
    <div style={{
      flex: '0 0 300px',
      margin: '10px',
      padding: '15px',
      borderRadius: '10px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
      backgroundColor: '#fff',
      color: '#333'
    }}>
      <h3 style={{ textAlign: 'center', marginBottom: '10px', fontWeight: 'bold', color: '#222' }}>{title}</h3>
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '14px'
      }}>
        <thead>
          <tr style={{ backgroundColor: '#f0f0f0', color: '#333' }}>
            <th style={{ padding: '8px', borderBottom: '1px solid #ccc' }}>#</th>
            <th style={{ padding: '8px', borderBottom: '1px solid #ccc' }}>Player</th>
            <th style={{ padding: '8px', borderBottom: '1px solid #ccc' }}>Time (s)</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, index) => (
            <tr key={index} style={{
              backgroundColor: index % 2 === 0 ? '#fafafa' : '#fff'
            }}>
              <td style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid #eee' }}>{index + 1}</td>
              <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                {entry.player.slice(0, 6)}...{entry.player.slice(-4)}
              </td>
              <td style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid #eee' }}>{entry.time}</td>
            </tr>
          ))}
          {entries.length === 0 && (
            <tr>
              <td colSpan="3" style={{ padding: '8px', textAlign: 'center', color: '#777' }}>No entries yet</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div style={{ marginTop: '30px' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#333' }}>Leaderboards</h2>
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'flex-start',
        flexWrap: 'nowrap',
        overflowX: 'auto'
      }}>
        {renderTable(easy, 'Easy')}
        {renderTable(medium, 'Medium')}
        {renderTable(hard, 'Hard')}
      </div>
      <div style={{ textAlign: 'center', marginTop: '15px' }}>
        <button onClick={() => refetch()} style={{
          padding: '8px 16px',
          borderRadius: '6px',
          border: 'none',
          backgroundColor: '#6a5acd',
          color: '#fff',
          cursor: 'pointer',
          fontWeight: 'bold',
          boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
        }}>
          Refresh All
        </button>
      </div>
    </div>
  );
}

export default Leaderboard;