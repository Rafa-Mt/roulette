import { useEffect, useState, useMemo } from "react";
import "./App.css";
import Roulette from "./components/Roulette";
import BettingTable from "./components/BettingTable";
import Login from "./components/Login";
import Register from "./components/Register";
import type { Bet } from "./types";
import { useLogin, useRegister } from "./lib/hooks/api/useAuth";
import { authStateAtom } from "./lib/atoms/authState";
import { userAtom } from "./lib/atoms/user";
import { betsAtom } from "./lib/atoms/bets";
import { gameStateAtom } from "./lib/atoms/gameState";
import { useAtom } from "jotai";
import { useAtomValue } from "jotai";
import SocketController from "./lib/controllers/SocketController";
import type { RouletteSpinEvent } from "./lib/types/game";

function App() {
  const handleToggleBetsLock = () => {
    const totalBet = bets.reduce((sum, b) => sum + b.amount, 0);
    if (totalBet > (user?.balance ?? 0)) {
      alert("Insufficient balance.");
      return;
    }

    if (!areBetsLocked) {
      SocketController.placeBets(bets);
    } else {
      SocketController.removeBets();
    }

    setAreBetsLocked((prev) => !prev);
  };
  const handleClearBets = () => {
    setBets([]);
    setAreBetsLocked(false);
    SocketController.removeBets();
  };
  const [authState, setAuthState] = useAtom(authStateAtom);
  const [user, setUser] = useAtom(userAtom);
  const [isSpinning, setIsSpinning] = useState(false);
  const [bets, setBets] = useState<Bet[]>([]);
  const allBets = useAtomValue(betsAtom);
  const gameState = useAtomValue(gameStateAtom);
  const [areBetsLocked, setAreBetsLocked] = useState(false);
  const [betAmount, setBetAmount] = useState(100);
  const [lastResult, setLastResult] = useState<{
    number: number;
    winnings: number;
  } | null>(null);
  const [balanceMessage, setBalanceMessage] = useState<string | null>(null);
  const [serverVelocity, setServerVelocity] = useState<number | undefined>(
    undefined
  );

  const { mutate: login, isPending: loginLoading } = useLogin();
  const handleLogin = (username: string, password: string) => {
    login({ username, password });
  };

  const handleLogout = () => {
    setAuthState("login");
    setBets([]);
    setAreBetsLocked(false);
    setLastResult(null);
    setIsSpinning(false);
    setUser(null);
  };

  const { mutate: register, isPending: registerLoading } = useRegister();
  const handleRegister = (username: string, password: string) => {
    register({ username, password });
  };

  useEffect(() => {
    console.log(user);
    if (user) {
      setAuthState("authenticated");
    }
  }, [user, setAuthState]);

  // Set up balance update callback when component mounts
  useEffect(() => {
    const handleBalanceUpdate = (oldBalance: number, newBalance: number) => {
      const difference = newBalance - oldBalance;
      if (difference > 0) {
        setBalanceMessage(`You won $${difference}!`);
      } else if (difference < 0) {
        setBalanceMessage(`You lost $${Math.abs(difference)}. Keep trying!`);
      }

      // Clear message after 3 seconds
      setTimeout(() => {
        setBalanceMessage(null);
      }, 3000);
    };

    const handleSpinStart = (spinEvent: RouletteSpinEvent) => {
      console.log("Received spin event:", spinEvent);
      setServerVelocity(spinEvent.rotationVelocity);
      setIsSpinning(true);
    };

    const handleSpinResult = (winningNumber: number) => {
      console.log("Received official spin result:", winningNumber);
      setLastResult({ number: winningNumber, winnings: 0 }); // winnings updated via balance callback
      setIsSpinning(false);
      setBets([]);
      setAreBetsLocked(false);
    };

    SocketController.setBalanceUpdateCallback(handleBalanceUpdate);
    SocketController.setSpinStartCallback(handleSpinStart);
    SocketController.setSpinResultCallback(handleSpinResult);

    // Cleanup
    return () => {
      SocketController.setBalanceUpdateCallback(() => {});
      SocketController.setSpinStartCallback(() => {});
      SocketController.setSpinResultCallback(() => {});
    };
  }, []);

  const handlePlaceBet = (bet: Omit<Bet, "amount">) => {
    if (betAmount > (user?.balance ?? 0)) {
      alert("Insufficient balance.");
      return;
    }
    if (isSpinning || areBetsLocked) {
      return;
    }
    setBets((prev) => [...prev, { ...bet, amount: betAmount }]);
    setLastResult(null);
  };

  const gamePhaseMessage = useMemo(() => {
    const timeRemaining =
      gameState?.timeRemaining !== undefined
        ? ` ${Math.floor(gameState.timeRemaining / 60)}:${String(
            gameState.timeRemaining % 60
          ).padStart(2, "0")} remaining`
        : "";

    if (gameState?.phase === "BETTING") {
      return `Betting is open! Try your luck.${timeRemaining}`;
    } else if (gameState?.phase === "SPINNING") {
      return `The wheel is spinning! `;
    }
    return `Next round in${timeRemaining}`;
  }, [gameState]);

  const buttonsDisabled = useMemo(() => {
    return isSpinning || gameState?.phase !== "BETTING" || bets.length === 0;
  }, [isSpinning, gameState, bets]);

  const handleSpinEnd = async (winningNumber: number) => {
    console.log(`Local roulette animation ended with number: ${winningNumber}`);

    // Reset server velocity for next spin
    setServerVelocity(undefined);

    // Note: We don't update balance here since server handles it via socket events
    // We don't clear bets or update UI state here since server will send official result
    // setLastResult({ number: winningNumber, winnings: 0 });
    // setIsSpinning(false);
    // setBets([]);
    // setAreBetsLocked(false);
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
          loading={loginLoading}
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
          loading={registerLoading}
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
        <h1>WELCOME, {user?.username ?? "Guest"}!</h1>
        <div className="subtitle">
          Deployed by Tomitomitomi, DP, ILevizzz, Reecs, Frex & Atlas
        </div>
        <div className="game-status">
          <strong>{gamePhaseMessage}</strong>
        </div>
        {balanceMessage && (
          <div
            className={`balance-message ${
              balanceMessage.includes("🎉") ? "balance-win" : "balance-loss"
            }`}
          >
            <strong>{balanceMessage}</strong>
          </div>
        )}
      </header>
      <div className="wallet-container">
        <div className="wallet">Your Balance: ${user?.balance ?? 0}</div>
        {/* button to add more balance */}
        <a href="https://stripe.com" target="_blank" rel="noopener noreferrer" className="wallet-logout-btn">
          Add Balance
        </a>
        <button onClick={handleLogout} className="wallet-logout-btn">
          Log Out
        </button>
      </div>
      <div className="game-container">
        <main className="game-area">
          <Roulette
            isSpinning={isSpinning}
            onSpinEnd={handleSpinEnd}
            serverVelocity={serverVelocity}
          />
        </main>
        <aside className="betting-area">
          <BettingTable
            onPlaceBet={handlePlaceBet}
            isDisabled={isSpinning || gameState?.phase !== "BETTING"}
          />
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
                disabled={isSpinning || gameState?.phase !== "BETTING"}
                min="1"
              />
            </div>
            <button
              onClick={handleToggleBetsLock}
              disabled={buttonsDisabled}
              className={`lock-bets ${buttonsDisabled ? "spin-disabled" : ""}`}
            >
              {areBetsLocked ? "Unlock Bets" : "Lock In Bets"}
            </button>
            <button
              className={`clear-bets ${buttonsDisabled ? "spin-disabled" : ""}`}
              onClick={handleClearBets}
              disabled={buttonsDisabled}
            >
              Clear Bets
            </button>
          </div>
          <div className="game-info">
            {lastResult && (
              <div className="last-result">
                Winning Number: {lastResult.number}.
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
        <div className="all-bets-footer">
          <strong>All Players' Bets:</strong>{" "}
          {allBets.length > 0
            ? allBets
                .flatMap((userBet) =>
                  userBet.bet.map(
                    (bet) =>
                      `${userBet.username}: ${bet.type}${
                        bet.number !== undefined ? `(${bet.number})` : ""
                      } - $${bet.amount}`
                  )
                )
                .join(", ")
            : "No bets from other players"}
        </div>
      </footer>
    </div>
  );
}

export default App;
