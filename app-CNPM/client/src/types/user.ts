export interface User {
  id: number;
  name: string;
  role: "REQUESTER" | "MANAGER" | "STOREKEEPER";
  email?: string;
}
