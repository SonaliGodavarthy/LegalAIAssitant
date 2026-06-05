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

export interface QueryResponse {
  answer: string;
  sources: Source[];
}

export type QueryState = "idle" | "loading" | "streaming" | "done" | "error";
