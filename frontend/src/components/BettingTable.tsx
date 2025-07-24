import { RED_NUMBERS, BLACK_NUMBERS } from "../lib/roulette-data";
import type { Bet, BetType } from "../types";

interface BettingTableProps {
  onPlaceBet: (bet: Omit<Bet, "amount">) => void;
  isSpinning: boolean;
}

const BettingTable = ({ onPlaceBet, isSpinning }: BettingTableProps) => {
  const getNumberColor = (n: number) => {
    if (RED_NUMBERS.includes(n)) return "red";
    if (BLACK_NUMBERS.includes(n)) return "black";
    return "";
  };

  const handleBet = (type: BetType, number?: number) => {
    if (isSpinning) return;
    onPlaceBet({ type, number });
  };

  const rows = [
    Array.from({ length: 12 }, (_, i) => 3 * i + 1),
    Array.from({ length: 12 }, (_, i) => 3 * i + 2),
    Array.from({ length: 12 }, (_, i) => 3 * i + 3),
  ];

  return (
    <div className="betting-table">
      <div className="number-grid-accurate">
        <div className="zero-and-main">
          <div className="bet-area zero" onClick={() => handleBet("green")}>
            0
          </div>
          <div className="main-grid">
            {rows.map((row, rowIdx) => (
              <div className="number-row" key={rowIdx}>
                {row.map((n) => (
                  <div
                    key={n}
                    className={`bet-area number ${getNumberColor(n)}`}
                    onClick={() => handleBet("number", n)}
                  >
                    {n}
                  </div>
                ))}
                <div
                  className="bet-area col-bet"
                  onClick={() => handleBet(`col${rowIdx + 1}` as BetType)}
                >
                  2-1
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="dozens-row">
          <div
            className="bet-area dozen-bet"
            style={{ gridColumn: "2 / span 4" }}
            onClick={() => handleBet("1st 12")}
          >
            1st 12
          </div>
          <div
            className="bet-area dozen-bet"
            style={{ gridColumn: "6 / span 4" }}
            onClick={() => handleBet("2nd 12")}
          >
            2nd 12
          </div>
          <div
            className="bet-area dozen-bet"
            style={{ gridColumn: "10 / span 4" }}
            onClick={() => handleBet("3rd 12")}
          >
            3rd 12
          </div>
        </div>
        <div className="outside-bets-row">
          <div className="bet-area" onClick={() => handleBet("1-18")}>
            1-18
          </div>
          <div className="bet-area" onClick={() => handleBet("even")}>
            Even
          </div>
          <div className="bet-area red" onClick={() => handleBet("red")}></div>
          <div
            className="bet-area black"
            onClick={() => handleBet("black")}
          ></div>
          <div className="bet-area" onClick={() => handleBet("odd")}>
            Odd
          </div>
          <div className="bet-area" onClick={() => handleBet("19-36")}>
            19-36
          </div>
        </div>
      </div>
    </div>
  );
};

export default BettingTable;
