export type Role = "student" | "faculty" | "admin" | "accountant";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}
