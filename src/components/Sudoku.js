import React, { useState, useEffect } from 'react';
import { useWriteContract, useAccount, useReadContract, useWaitForTransactionReceipt } from 'wagmi';

const HINT_CONTRACT_ADDRESS = '0x556C691B4c560D0d1A1530b5c08ea467b1d6bdC6';
const HINT_CONTRACT_ABI = [
  { inputs: [], name: 'buyHint', outputs: [], stateMutability: 'payable', type: 'function' },
  { inputs: [], name: 'owner', outputs: [{ internalType: 'address', name: '', type: 'address' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'withdraw', outputs: [], stateMutability: 'nonpayable', type: 'function' }
];

const LEADERBOARD_CONTRACT_ADDRESS = '0x03BD9Be20078963d762E1733633a617C6F05e0C3';
const LEADERBOARD_CONTRACT_ABI = [
  { inputs: [{ internalType: 'uint256', name: 'time', type: 'uint256' }, { internalType: 'string', name: 'difficulty', type: 'string' }], name: 'submitResult', outputs: [], stateMutability: 'nonpayable', type: 'function' }
];

const clone = (board) => board.map(row => [...row]);
const isSafe = (board, row, col, num) => {
  for (let x = 0; x < 9; x++) if (board[row][x] === num || board[x][col] === num) return false;
  const startRow = row - row % 3, startCol = col - col % 3;
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) if (board[i + startRow][j + startCol] === num) return false;
  return true;
};

const fillBoard = (board) => {
  const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] === 0) {
        for (let num of numbers) {
          if (isSafe(board, row, col, num)) {
            board[row][col] = num;
            if (fillBoard(board)) return true;
            board[row][col] = 0;
          }
        }
        return false;
      }
    }
  }
  return true;
};

const generateSolution = () => {
  const board = Array(9).fill(0).map(() => Array(9).fill(0));
  fillBoard(board);
  return board;
};

const createPuzzle = (solution, holes) => {
  const puzzle = clone(solution);
  let count = 0;
  while (count < holes) {
    const row = Math.floor(Math.random() * 9);
    const col = Math.floor(Math.random() * 9);
    if (puzzle[row][col] !== 0) { puzzle[row][col] = 0; count++; }
  }
  return puzzle;
};

export default function Sudoku() {
  const [solution, setSolution] = useState([]);
  const [board, setBoard] = useState([]);
  const [difficulty, setDifficulty] = useState(null);
  const [hasWon, setHasWon] = useState(false);
  const [lives, setLives] = useState(3);
  const [timer, setTimer] = useState(0);
  const [intervalId, setIntervalId] = useState(null);
  const [incorrectCells, setIncorrectCells] = useState([]);
  const [hints, setHints] = useState(0);
  const [buyHintTxHash, setBuyHintTxHash] = useState(null);

  const { address } = useAccount();
  const { data: ownerAddress } = useReadContract({ address: HINT_CONTRACT_ADDRESS, abi: HINT_CONTRACT_ABI, functionName: 'owner' });
  const isOwner = ownerAddress && address && ownerAddress.toLowerCase() === address.toLowerCase();

  const { writeContractAsync } = useWriteContract();
  const { isLoading: isBuyingHint, isSuccess: isHintBought } = useWaitForTransactionReceipt({ hash: buyHintTxHash });

  const generateGame = (holes, startingHints) => {
    const sol = generateSolution();
    const puzzle = createPuzzle(sol, holes);
    setSolution(sol);
    setBoard(puzzle);
    setHasWon(false);
    setLives(3);
    setTimer(0);
    setIncorrectCells([]);
    setHints(startingHints);
    if (intervalId) clearInterval(intervalId);
    const id = setInterval(() => setTimer(t => t + 1), 1000);
    setIntervalId(id);
  };

  const handleDifficultySelect = (level) => {
    setDifficulty(level);
    const holes = level === 'Easy' ? 30 : level === 'Medium' ? 39 : 48;
    const startingHints = level === 'Easy' ? 1 : level === 'Medium' ? 2 : 4;
    generateGame(holes, startingHints);
  };

  const handleChange = (row, col, value) => {
    if (/^[1-9]?$/.test(value)) {
      const newBoard = clone(board);
      const val = value ? parseInt(value, 10) : 0;
      const newIncorrectCells = incorrectCells.filter(([r, c]) => !(r === row && c === col));
      if (val !== 0 && val !== solution[row][col]) { setLives(l => l - 1); newIncorrectCells.push([row, col]); }
      else newBoard[row][col] = val;
      setBoard(newBoard);
      setIncorrectCells(newIncorrectCells);
    }
  };

  useEffect(() => { if (solution.length > 0) checkWin(); }, [board, solution]);

  const checkWin = async () => {
    for (let i = 0; i < 9; i++) for (let j = 0; j < 9; j++) if (board[i][j] !== solution[i][j]) return;
    setHasWon(true);
    if (intervalId) clearInterval(intervalId);
    try { await writeContractAsync({ address: LEADERBOARD_CONTRACT_ADDRESS, abi: LEADERBOARD_CONTRACT_ABI, functionName: 'submitResult', args: [timer, difficulty.toLowerCase()] }); }
    catch (err) { console.error('Leaderboard submission failed:', err); }
  };

  const handleHint = () => {
    if (hints <= 0) return;
    const emptyCells = [];
    for (let i = 0; i < 9; i++) for (let j = 0; j < 9; j++) if (board[i][j] === 0) emptyCells.push([i, j]);
    if (emptyCells.length > 0) {
      const [row, col] = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      const newBoard = clone(board);
      newBoard[row][col] = solution[row][col];
      setBoard(newBoard);
      setIncorrectCells(prev => prev.filter(([r, c]) => !(r === row && c === col)));
      setHints(h => h - 1);
    }
  };

  const handleBuyHint = async () => {
    try {
      const hash = await writeContractAsync({ address: HINT_CONTRACT_ADDRESS, abi: HINT_CONTRACT_ABI, functionName: 'buyHint', value: BigInt(1e15) });
      setBuyHintTxHash(hash);
    } catch (err) { console.error('Hint purchase failed:', err); }
  };

  const handleWithdraw = async () => {
    try { await writeContractAsync({ address: HINT_CONTRACT_ADDRESS, abi: HINT_CONTRACT_ABI, functionName: 'withdraw' }); alert('Withdrawal successful!'); }
    catch (err) { console.error('Withdraw failed:', err); }
  };

  useEffect(() => { if (isHintBought) { setHints(h => h + 1); setBuyHintTxHash(null); } }, [isHintBought]);

  const buttonStyle = { padding: '8px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: 14, marginRight: 8 };

  return (
    <div style={{ marginTop: 20, textAlign: 'center' }}>
      {!difficulty ? (
        <>
          <h3 style={{ color: '#fff' }}>Select Difficulty:</h3>
          {['Easy', 'Medium', 'Hard'].map(level => (
            <button key={level} onClick={() => handleDifficultySelect(level)}
              style={{ ...buttonStyle, backgroundColor: '#6a5acd', color: '#fff', marginBottom: 10 }}>
              {level}
            </button>
          ))}
        </>
      ) : (
        <>
          <div style={{
            display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 20, margin: '10px auto',
            fontSize: 15, fontWeight: 500, color: '#fff'
          }}>
            <div>🎯 <strong>{difficulty}</strong></div>
            <div>⏱️ {timer}s</div>
            <div>❤️ {lives}</div>
            <div>💡 {hints}</div>
          </div>

          <div style={{ marginBottom: 10 }}>
            {hints > 0 ? (
              <button onClick={handleHint} style={{ ...buttonStyle, backgroundColor: '#28a745', color: '#fff' }}>
                Use Hint
              </button>
            ) : (
              <button onClick={handleBuyHint} disabled={isBuyingHint} style={{ ...buttonStyle, backgroundColor: '#007bff', color: '#fff' }}>
                Buy Hint (0.001 ETH)
              </button>
            )}

            {isOwner && (
              <button onClick={handleWithdraw} style={{ ...buttonStyle, backgroundColor: '#dc3545', color: '#fff' }}>
                Withdraw Funds
              </button>
            )}
          </div>

          <div style={{ position: 'relative', display: 'inline-block', border: '3px solid #000', marginTop: 5 }}>
            {board.map((row, r) => (
              <div key={r} style={{ display: 'flex' }}>
                {row.map((cell, c) => {
                  const prefilled = solution[r][c] !== 0 && board[r][c] === solution[r][c];
                  const incorrect = incorrectCells.some(([ri, ci]) => ri === r && ci === c);
                  return (
                    <input key={c} value={cell === 0 ? '' : cell} onChange={e => handleChange(r, c, e.target.value)}
                      disabled={prefilled || lives <= 0}
                      style={{
                        width: 40, height: 40, textAlign: 'center', fontSize: 18,
                        backgroundColor: prefilled ? '#eee' : incorrect ? '#fdd' : '#fff',
                        border: '1px solid #000', borderTop: r % 3 === 0 ? '2px solid #000' : '1px solid #000',
                        borderLeft: c % 3 === 0 ? '2px solid #000' : '1px solid #000'
                      }} />
                  );
                })}
              </div>
            ))}
            {lives <= 0 && (
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.8)',
                display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: 20, fontWeight: 'bold', color: '#dc3545' }}>
                Out of Lives!
              </div>
            )}
          </div>

          {hasWon && <div style={{ marginTop: 10, fontWeight: 'bold', color: 'green' }}>🎉 You win in {timer} seconds!</div>}
        </>
      )}
    </div>
  );
}
