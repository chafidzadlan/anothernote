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
  created_at: string;
};

export interface AdminNoteResult {
  id: string;
  title: string;
  content: string;
  user_id: string;
  created_at: string;
  updated_at?: string;
  user_name?: string;
  user_email?: string;
};