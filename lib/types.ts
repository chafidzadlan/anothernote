export interface Note {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at?: string;
  user_id: string;
};

export interface User {
  id: string;
  email: string;
  role: "user" | "admin";
  name?: string;
  avatar_url?: string;
};