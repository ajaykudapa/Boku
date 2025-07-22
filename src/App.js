import React from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Sudoku from "./components/Sudoku";
import Leaderboard from "./components/Leaderboard";
import "./App.css";

function App() {
  return (
    <div className="App" style={{ padding: "20px", textAlign: "center" }}>
      <div className="top-bar">
        <ConnectButton />
      </div>
      <Sudoku />
      <Leaderboard />   {/* ✅ Ensure this is here */}
    </div>
  );
}

export default App;
