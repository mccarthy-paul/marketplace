import React, { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import { useTheme } from '../../contexts/ThemeContext';

const ChatInterface = ({ messages, isLoading, sessionId }) => {
  const { theme } = useTheme();
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end'
      });
    }
  }, [messages, isLoading]);

  return (
    <div
      ref={containerRef}
      className={`flex-1 overflow-y-auto p-4 space-y-4 ${
        theme === 'dark' ? 'bg-luxury-charcoal' : 'bg-gray-50'
      }`}
      style={{ maxHeight: 'calc(100% - 80px)' }}
    >
      {/* Welcome state when no session */}
      {!sessionId && messages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <div className={`rounded-lg p-6 shadow-sm border max-w-sm ${
            theme === 'dark'
              ? 'bg-luxury-dark border-luxury-gray'
              : 'bg-white border-gray-200'
          }`}>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${
              theme === 'dark' ? 'bg-gold' : 'bg-luxe-bronze'
            }`}>
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className={`text-lg font-semibold mb-2 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Welcome to Luxe24 Assistant
            </h3>
            <p className={`text-sm mb-4 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              I'm here to help you with watch searches, bidding advice, and marketplace questions.
            </p>
            <div className={`text-xs ${
              theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
            }`}>
              Connecting to assistant...
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      {messages.map((message, index) => (
        <MessageBubble 
          key={`${message.timestamp}-${index}`}
          message={message}
          isLatest={index === messages.length - 1}
        />
      ))}

      {/* Typing indicator */}
      {isLoading && <TypingIndicator />}

      {/* Scroll anchor */}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatInterface;
