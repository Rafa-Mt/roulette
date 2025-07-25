import { useState } from "react";
import "./App.css";
import Roulette from "./components/Roulette";
import BettingTable from "./components/BettingTable";
import Login from "./components/Login";
import Register from "./components/Register";
import type { Bet } from "./types";
import { RED_NUMBERS, BLACK_NUMBERS } from "./lib/roulette-data";
import useLogin from "./lib/hooks/api/useLogin";
import { authStateAtom } from "./lib/atoms/authState";
import { useAtom } from "jotai";

const DOZENS = {
  "1st 12": Array.from({ length: 12 }, (_, i) => i + 1),
  "2nd 12": Array.from({ length: 12 }, (_, i) => i + 13),
  "3rd 12": Array.from({ length: 12 }, (_, i) => i + 25),
};

const COLUMNS = {
  col1: [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34],
  col2: [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35],
  col3: [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36],
};

function App() {
  const handleToggleBetsLock = () => {
    setAreBetsLocked((prev) => !prev);
  };
  const [authState, setAuthState] = useAtom(authStateAtom);
  const [currentUser, setCurrentUser] = useState<string>("");
  const [balance, setBalance] = useState(200000);
  const [isSpinning, setIsSpinning] = useState(false);
  const [bets, setBets] = useState<Bet[]>([]);
  const [areBetsLocked, setAreBetsLocked] = useState(false);
  const [betAmount, setBetAmount] = useState(100);
  const [lastResult, setLastResult] = useState<{
    number: number;
    winnings: number;
  } | null>(null);

  //   useEffect(() => {
  //   const token = localStorage.getItem('token');
  //   if (token) {
  //     // Verify token and get user data
  //     fetch('/api/auth/verify', {
  //       headers: { 'Authorization': `Bearer ${token}` }
  //     })
  //       .then(res => res.json())
  //       .then(data => {
  //         if (data.username) {
  //           setCurrentUser(data.username);
  //           setBalance(data.balance);
  //           setAuthState("authenticated");
  //         }
  //       })
  //       .catch(() => {
  //         localStorage.removeItem('token');
  //       });
  //   }
  // }, []);
  const { mutate: login, isPending } = useLogin();
  const handleLogin = (username: string, password: string) => {
    login({ username, password });
  };

  const handleLogout = () => {
    // localStorage.removeItem('token');
    setCurrentUser("");
    setAuthState("login");
    setBalance(0);
    setBets([]);
    setAreBetsLocked(false);
    setLastResult(null);
    setIsSpinning(false);
  };

  const handleRegister = (
    username: string,
    password: string,
  ) => {
    // try {
    //   const response = await fetch('/api/auth/register', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({ username, password })
    //   });
    //   const data = await response.json();
    //   if (data.token) {
    //     localStorage.setItem('token', data.token);
    //     setCurrentUser(data.username);
    //     setBalance(5000); // New accounts start with $5000
    //     setAuthState("authenticated");
    //   }
    // } catch (err) {
    //   alert("Registration failed. Please try again.");
    // }
  };



  const handlePlaceBet = (bet: Omit<Bet, "amount">) => {
    if (betAmount > balance) {
      alert("Insufficient balance.");
      return;
    }
    if (isSpinning || areBetsLocked) {
      return;
    }
    setBets((prev) => [...prev, { ...bet, amount: betAmount }]);
    setLastResult(null);
  };

  const updateBalance = async (newBalance: number) => {
    // try {
    //   const token = localStorage.getItem('token');
    //   await fetch('/api/user/balance', {
    //     method: 'PUT',
    //     headers: {
    //       'Content-Type': 'application/json',
    //       'Authorization': `Bearer ${token}`
    //     },
    //     body: JSON.stringify({ balance: newBalance })
    //   });
    //   setBalance(newBalance);
    // } catch (err) {
    //   console.error('Failed to update balance:', err);
    // }
    setBalance(newBalance);
  };

  const handleSpin = () => {
    if (!areBetsLocked || bets.length === 0) {
      alert("Please place and lock in your bets before spinning.");
      return;
    }
    const totalBet = bets.reduce((sum, b) => sum + b.amount, 0);
    if (totalBet > balance) {
      alert("Insufficient balance.");
      return;
    }
    setBalance((prev) => prev - totalBet);
    if (!isSpinning) {
      setIsSpinning(true);
      setLastResult(null);
    }
  };

  const handleSpinEnd = async (winningNumber: number) => {
    let totalWinnings = 0;
    bets.forEach((bet) => {
      let betWinnings = 0;
      if (bet.type === "number" && bet.number === winningNumber)
        betWinnings = bet.amount * 36;
      else if (bet.type === "red" && RED_NUMBERS.includes(winningNumber))
        betWinnings = bet.amount * 2;
      else if (bet.type === "black" && BLACK_NUMBERS.includes(winningNumber))
        betWinnings = bet.amount * 2;
      else if (bet.type === "green" && winningNumber === 0)
        betWinnings = bet.amount * 36;
      else if (
        bet.type === "even" &&
        winningNumber !== 0 &&
        winningNumber % 2 === 0
      )
        betWinnings = bet.amount * 2;
      else if (bet.type === "odd" && winningNumber % 2 !== 0)
        betWinnings = bet.amount * 2;
      else if (bet.type === "1-18" && winningNumber >= 1 && winningNumber <= 18)
        betWinnings = bet.amount * 2;
      else if (
        bet.type === "19-36" &&
        winningNumber >= 19 &&
        winningNumber <= 36
      )
        betWinnings = bet.amount * 2;
      else if (
        bet.type === "1st 12" &&
        DOZENS["1st 12"].includes(winningNumber)
      )
        betWinnings = bet.amount * 3;
      else if (
        bet.type === "2nd 12" &&
        DOZENS["2nd 12"].includes(winningNumber)
      )
        betWinnings = bet.amount * 3;
      else if (
        bet.type === "3rd 12" &&
        DOZENS["3rd 12"].includes(winningNumber)
      )
        betWinnings = bet.amount * 3;
      else if (bet.type === "col1" && COLUMNS.col1.includes(winningNumber))
        betWinnings = bet.amount * 3;
      else if (bet.type === "col2" && COLUMNS.col2.includes(winningNumber))
        betWinnings = bet.amount * 3;
      else if (bet.type === "col3" && COLUMNS.col3.includes(winningNumber))
        betWinnings = bet.amount * 3;
      totalWinnings += betWinnings;
    });

    const totalBet = bets.reduce((sum, b) => sum + b.amount, 0);
    const netWinnings = totalWinnings - totalBet;

    if (totalWinnings > 0) {
      await updateBalance(balance + totalWinnings);
    }

    setLastResult({ number: winningNumber, winnings: netWinnings });
    setIsSpinning(false);
    setBets([]);
    setAreBetsLocked(false);
  };

  if (authState === "login") {
    return (
      <div className="app">
        <header className="app-header">
          <h1>LET'S GO GAMBLING!</h1>
          <div className="subtitle">
            Deployed by Tomitomitomi, DP, ILevizzz, Reecs, Frex & Atlas
          </div>
        </header>
        <Login
          onLogin={handleLogin}
          onSwitchToRegister={() => setAuthState("register")}
        />
      </div>
    );
  }

  if (authState === "register") {
    return (
      <div className="app">
        <header className="app-header">
          <h1>LET'S GO GAMBLING!</h1>
          <div className="subtitle">
            Deployed by Tomitomitomi, DP, ILevizzz, Reecs, Frex & Atlas
          </div>
        </header>
        <Register
          onRegister={handleRegister}
          onSwitchToLogin={() => setAuthState("login")}
        />
      </div>
    );
  }

  // Main game (authenticated state)
  return (
    <div className="app">
      <header className="app-header">
        <h1>WELCOME, {currentUser}!</h1>
        <div className="subtitle">
          Deployed by Tomitomitomi, ILevizzz, Reecs, Frex & Atlas
        </div>
      </header>
      <div className="wallet-container">
        <div className="wallet">Your Balance: ${balance}</div>
        <button onClick={handleLogout} className="wallet-logout-btn">
          Log Out
        </button>
      </div>
      <div className="game-container">
        <main className="game-area">
          <Roulette isSpinning={isSpinning} onSpinEnd={handleSpinEnd} />
        </main>
        <aside className="betting-area">
          <BettingTable onPlaceBet={handlePlaceBet} isSpinning={isSpinning} />
          <div className="controls">
            <div className="bet-input">
              <label htmlFor="bet-amount" className="bet-label">
                Bet Amount ($):
              </label>
              <input
                id="bet-amount"
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(parseInt(e.target.value, 10))}
                disabled={isSpinning}
                min="1"
              />
            </div>
            <button
              onClick={handleToggleBetsLock}
              disabled={isSpinning || bets.length === 0}
              className={isSpinning || bets.length === 0 ? "spin-disabled" : ""}
            >
              {areBetsLocked ? "Unlock Bets" : "Lock In Bets"}
            </button>
            <button
              onClick={handleSpin}
              disabled={isSpinning || !areBetsLocked || bets.length === 0}
              className={
                isSpinning || !areBetsLocked || bets.length === 0
                  ? "spin-disabled"
                  : ""
              }
            >
              {isSpinning ? "Spinning..." : "Spin"}
            </button>
            <button
              className="clear-bets"
              onClick={() => setBets([])}
              disabled={isSpinning || bets.length === 0}
            >
              Clear Bets
            </button>
          </div>
          <div className="game-info">
            {lastResult && (
              <div className="last-result">
                Winning Number: {lastResult.number}.{" "}
                {lastResult.winnings > 0
                  ? `You won $${lastResult.winnings}.`
                  : lastResult.winnings < 0
                  ? `You lost $${Math.abs(lastResult.winnings)}.`
                  : "You broke even."}
              </div>
            )}
          </div>
        </aside>
      </div>
      <footer className="app-footer">
        <div className="current-bets-footer">
          <strong>
            Current Bets{areBetsLocked ? " (Locked)" : " (Draft)"}:
          </strong>{" "}
          {bets.length > 0
            ? Object.values(
                bets.reduce((acc, b) => {
                  const key =
                    b.type + (b.number !== undefined ? `_${b.number}` : "");
                  if (!acc[key]) {
                    acc[key] = { ...b };
                  } else {
                    acc[key].amount += b.amount;
                  }
                  return acc;
                }, {} as Record<string, Bet>)
              )
                .map(
                  (b) =>
                    `${b.type}${
                      b.number !== undefined ? `(${b.number})` : ""
                    }: $${b.amount}`
                )
                .join(", ")
            : "No bets placed"}
        </div>
      </footer>
    </div>
  );
}

export default App;
