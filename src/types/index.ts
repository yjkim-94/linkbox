export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';

export interface User {
  id: string;
  email: string;
}

export interface Bookmark {
  id: string;
  user_id: string;
  url: string;
  title: string;
  description?: string;
  tags: string[];
  favicon?: string;
  created_at: string;
  updated_at: string;
}
