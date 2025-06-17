// Shared type definitions for the application

// Language types
export type Language = 'tr' | 'en';

export interface TranslationDictionary {
  [key: string]: string;
}

export interface Translations {
  [language: string]: TranslationDictionary;
}

export interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
}

// Chat types
export interface Message {
  id: string; // Benzersiz ID
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  responseTime?: string; // Yanıt süresi (sadece asistan mesajları için)
}

// Bileşen prop tipleri
export interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  formatMessage: (content: string) => React.ReactNode;
}

export interface ChatInterfaceProps {
  // Gerekirse özel prop'lar eklenebilir
}

// Langflow API types
export interface LangflowResult {
  response: string;
  sessionId: string;
}

export interface LangflowResponse {
  session_id?: string;
  outputs?: Array<{
    outputs?: Array<{
      results?: {
        message?: {
          text: string;
        };
      };
      artifacts?: {
        message: string;
      };
      outputs?: {
        message?: {
          message: string;
        };
      };
      messages?: Array<{
        message: string;
      }>;
    }>;
  }>;
}
