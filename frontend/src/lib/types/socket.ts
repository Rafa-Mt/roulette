export interface UserChangeEvent {
  users: {
    username: string;
    balance: number;
  }[];
}
