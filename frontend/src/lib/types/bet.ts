export type BetType =
  | "number"
  | "red"
  | "black"
  | "green"
  | "even"
  | "odd"
  | "1-18"
  | "19-36"
  | "1st 12"
  | "2nd 12"
  | "3rd 12"
  | "col1"
  | "col2"
  | "col3";

export interface Bet {
  type: BetType;
  amount: number;
  number?: number;
}

export interface UserBet {
  userId: string;
  username: string;
  bet: Bet[];
}
