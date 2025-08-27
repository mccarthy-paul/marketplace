import React, { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';

const ChatInterface = ({ messages, isLoading, sessionId }) => {
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
      className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
      style={{ maxHeight: 'calc(100% - 80px)' }}
    >
      {/* Welcome state when no session */}
      {!sessionId && messages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 max-w-sm">
            <div className="w-12 h-12 bg-[#3ab54a] rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Welcome to Luxe24 Assistant
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              I'm here to help you with watch searches, bidding advice, and marketplace questions.
            </p>
            <div className="text-xs text-gray-500">
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
