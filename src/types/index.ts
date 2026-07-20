export type TabType = 'home' | 'ai-tutor' | 'notes' | 'profile';

export type MessageType = {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  hasAudio?: boolean;
  imageUrl?: string;
  timestamp: Date;
};

export type NoteType = {
  id: string;
  book: string;
  page: string;
  problem: string;
  date: string;
  tag: string;
  solved: boolean;
  hint: string;
};
