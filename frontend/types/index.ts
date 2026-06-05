export interface Law {
  id: string;
  name: string;
  name_en: string;
  languages: string[];
}

export interface Source {
  law: string;
  source: string;
  language: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources: Source[];
  streaming: boolean;
}

export interface HistoryItem {
  role: "user" | "assistant";
  content: string;
}
