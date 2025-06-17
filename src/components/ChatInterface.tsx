
import React, { useState, useEffect, useRef, useCallback, useMemo, KeyboardEvent } from 'react';
import { Send, Dna, X } from 'lucide-react';
import { sendMessageToLangflow } from '../lib/langflow-client';
import { useLanguage } from '../hooks/useLanguage';
import MessageList from './MessageList';
import { Message, MessageListProps } from '../types';

// Message interface is now imported from types

const ChatInterface = () => {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const messageEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { t } = useLanguage();

  // Generate unique ID for messages
  const generateId = useCallback(() => {
    return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Scroll to bottom only for new user messages
  useEffect(() => {
    if (messages.length > 0 && messages[messages.length - 1].role === 'user') {
      messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Close chat and reset - memoize to prevent recreation on each render
  const handleCloseChat = useCallback(() => {
    setIsChatOpen(false);
    // Focus on input after a short delay to allow animation to complete
    setTimeout(() => {
      inputRef.current?.focus();
    }, 500);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      handleCloseChat();
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  }, [handleCloseChat]);

  // Memoize function to prevent recreation on each render
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedQuery = query.trim();
    if (!trimmedQuery || isLoading) return;
    
    // Open chat window if it's the first message
    if (!isChatOpen) {
      setIsChatOpen(true);
    }
    
    // Add user message to chat
    const userMessage: Message = {
      id: generateId(),
      content: trimmedQuery,
      role: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setQuery('');
    
    try {
      // Send message to langflow API
      const result = await sendMessageToLangflow(trimmedQuery, sessionId);
      
      // Save session ID for conversation continuity
      setSessionId(result.sessionId);
      
      // Add assistant response to chat
      const assistantMessage: Message = {
        id: generateId(),
        content: result.response,
        role: 'assistant',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error communicating with Langflow:', error);
      
      // Determine error type
      let errorMessage = t('error.api_connection');
      if (error instanceof Error) {
        if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
          errorMessage = t('error.network');
        }
      }
      
      // Add error message to chat
      const errorMessageObj: Message = {
        id: generateId(),
        content: errorMessage,
        role: 'assistant',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessageObj]);
    } finally {
      setIsLoading(false);
    }
  }, [query, isChatOpen, sessionId, t, generateId, isLoading]);

  // Simple text formatter that handles basic formatting - memoized to prevent recreation
  const formatMessage = useCallback((content: string) => {
    // Replace newlines with <br> tags
    const lines = content.split('\n');
    return (
      <div className="whitespace-pre-wrap break-words">
        {lines.map((line, i) => (
          <React.Fragment key={i}>
            {line}
            {i < lines.length - 1 && <br />}
          </React.Fragment>
        ))}
      </div>
    );
  }, []);
  
  // Calculate response times for assistant messages
  const messagesWithResponseTimes = useMemo(() => {
    return messages.map((message, index) => {
      if (message.role === 'assistant' && index > 0) {
        const prevMessage = messages[index - 1];
        if (prevMessage.role === 'user') {
          const responseTimeMs = message.timestamp.getTime() - prevMessage.timestamp.getTime();
          const seconds = Math.floor(responseTimeMs / 1000);
          let responseTimeText = '';
          
          if (seconds < 1) responseTimeText = '<1sn';
          else if (seconds < 60) responseTimeText = `${seconds}sn`;
          else {
            const minutes = Math.floor(seconds / 60);
            responseTimeText = `${minutes}d ${seconds % 60}sn`;
          }
          
          return { ...message, responseTime: responseTimeText };
        }
      }
      return message;
    });
  }, [messages]);

  // Memoize message list props to prevent unnecessary re-renders
  const messageListProps = {
    messages: messagesWithResponseTimes,
    isLoading,
    formatMessage: (content: string) => formatMessage(content) as JSX.Element
  };

  return (
    <div className="relative w-full h-screen overflow-hidden flex items-center justify-center">
      <video
        autoPlay
        loop
        muted
        className="absolute inset-0 w-full h-full object-cover z-0"
      >
        <source src="/Wall.mp4" type="video/mp4" />
        Tarayıcınız video etiketini desteklemiyor.
      </video>
      
      {/* Main Container */}
      <div className="relative z-10 w-full h-full flex items-center justify-center">
          {!isChatOpen ? (
            /* Initial Simple Form */
            <div 
              className="mb-12 transition-all duration-300 ease-in-out transform opacity-100 scale-100"
              style={{ animation: isChatOpen ? 'fadeOut 0.3s forwards' : 'none' }}
            >
              <div className="flex items-center justify-center space-x-3 mb-4">
                <Dna className="w-12 h-12 text-venice-coral" />
                <h1 className="font-playfair text-6xl md:text-8xl italic text-venice-dark floating-element">
                  {t('chat.title')}
                </h1>
              </div>
              
              <p className="text-xl text-venice-dark/80 mb-8 font-inter">
                {t('chat.subtitle')}
              </p>
              
              <form onSubmit={handleSubmit} className="relative mb-8 floating-element">
                <div className="relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t('chat.placeholder')}
                    className="w-full px-6 py-4 bg-white/80 backdrop-blur-sm border border-venice-stone/30 rounded-full text-lg placeholder-venice-dark/60 focus:outline-none focus:ring-2 focus:ring-venice-coral focus:border-transparent shadow-lg"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-venice-coral text-white p-3 rounded-full hover:bg-venice-coral/90 transition-colors shadow-md"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* Expanded Chat Interface */
            <div
              className="w-[70%] max-w-[3400px] mx-auto rounded-2xl overflow-hidden shadow-2xl transition-all duration-500 ease-in-out"
              style={{ 
                opacity: 1,
                height: '75vh',
                animation: 'expandChat 0.5s forwards'
              }}
            >
              <div className="flex flex-col h-full bg-white/85 backdrop-blur-md">
                {/* Chat Header */}
                <div className="px-6 py-3 bg-white/90 backdrop-blur-sm shadow-sm flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Dna className="w-6 h-6 text-venice-coral" />
                    <h2 className="font-playfair text-xl italic text-venice-dark">{t('chat.title')}</h2>
                  </div>
                  <button 
                    onClick={handleCloseChat}
                    className="text-venice-dark/60 hover:text-venice-coral transition-colors p-1 rounded-full hover:bg-venice-coral/10"
                  >
                    <X size={18} />
                  </button>
                </div>
                
                {/* Chat Messages */}
                <div 
                  className="flex-1 overflow-y-auto px-4 py-4"
                  role="log"
                  aria-live="polite"
                  aria-atomic="false"
                  aria-relevant="additions"
                >
                  <MessageList {...messageListProps} />
                  <div 
                    ref={messageEndRef} 
                    aria-hidden="true"
                    className="h-px"
                  />
                </div>
                
                {/* Input Form */}
                <div className="p-3 bg-white/90 backdrop-blur-sm shadow-inner">
                  <form onSubmit={handleSubmit} className="relative">
                    <div className="relative">
                      <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={t('chat.placeholder')}
                        disabled={isLoading}
                        aria-label={t('chat.placeholder')}
                        aria-busy={isLoading}
                        className="w-full px-4 py-3 bg-white border border-venice-stone/30 rounded-full text-base placeholder-venice-dark/60 focus:outline-none focus:ring-2 focus:ring-venice-coral focus:border-transparent shadow-sm"
                      />
                      <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                        {isLoading ? (
                          <div className="w-5 h-5 border-2 border-venice-coral/50 border-t-venice-coral rounded-full animate-spin" />
                        ) : (
                          <button
                            type="submit"
                            disabled={!query.trim()}
                            className="p-1.5 rounded-full text-venice-coral hover:bg-venice-coral/10 transition-colors"
                            aria-label={t('chat.send')}
                          >
                            <Send className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
      </div>
      
      {/* Animation is handled via CSS classes in the stylesheets */}
    </div>
  );
};

export default ChatInterface;
