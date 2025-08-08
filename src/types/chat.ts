export type Role = "system" | "user" | "assistant";

export interface ChatRow {
  id: string;
  title: string;
  created_at?: string;
  updated_at?: string;
}

export interface MessageRow {
  id: string;
  chat_id: string;
  role: Role;
  content: string;
  created_at?: string;
}

export interface LocalMessage {
  id: string;
  role: Role;
  content: string;
}
