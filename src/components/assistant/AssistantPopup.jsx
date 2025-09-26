import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { XMarkIcon, SparklesIcon } from '@heroicons/react/24/outline';
import ChatInterface from './ChatInterface';
import MessageInput from './MessageInput';
import axios from 'axios';
import { useTheme } from '../../contexts/ThemeContext';

// Configure axios defaults for this component
axios.defaults.withCredentials = true;

const AssistantPopup = ({ isOpen, onClose }) => {
  const { theme } = useTheme();
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const popupRef = useRef(null);

  // Initialize chat session when popup opens
  useEffect(() => {
    if (isOpen && !sessionId) {
      initializeSession();
    }
  }, [isOpen]);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  const initializeSession = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await axios.post('/api/chat/session', {
        pageContext: window.location.pathname
      }, {
        withCredentials: true
      });

      if (response.data.success) {
        setSessionId(response.data.sessionId);
        setMessages([{
          role: 'assistant',
          content: response.data.welcomeMessage,
          timestamp: new Date(),
          messageType: 'text'
        }]);
      } else {
        throw new Error('Failed to create session');
      }
    } catch (error) {
      console.error('Failed to initialize session:', error);
      setError('Failed to connect to assistant. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (message, messageType = 'text', file = null) => {
    if (!sessionId) {
      setError('No active session. Please refresh and try again.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Add user message to UI immediately
      const userMessage = {
        role: 'user',
        content: message,
        timestamp: new Date(),
        messageType
      };
      setMessages(prev => [...prev, userMessage]);

      let response;

      if (messageType === 'image' && file) {
        // Handle image upload
        const formData = new FormData();
        formData.append('sessionId', sessionId);
        formData.append('image', file);
        formData.append('additionalContext', message);

        response = await axios.post('/api/chat/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          withCredentials: true
        });

        if (response.data.success) {
          const assistantMessage = {
            role: 'assistant',
            content: response.data.analysis,
            timestamp: new Date(),
            messageType: 'text'
          };
          setMessages(prev => [...prev, assistantMessage]);
        }
      } else if (messageType === 'voice' && file) {
        // Handle voice input
        const formData = new FormData();
        formData.append('sessionId', sessionId);
        formData.append('audio', file);

        response = await axios.post('/api/chat/voice', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          withCredentials: true
        });

        if (response.data.success) {
          // Update user message with transcription
          setMessages(prev => prev.map((msg, index) => 
            index === prev.length - 1 
              ? { ...msg, content: response.data.transcription }
              : msg
          ));

          const assistantMessage = {
            role: 'assistant',
            content: response.data.response,
            timestamp: new Date(),
            messageType: 'text',
            speechResponse: response.data.speechResponse
          };
          setMessages(prev => [...prev, assistantMessage]);

          // Voice response is available but NOT auto-played (muted by default)
          // User can manually play it using the speaker icon in the message
        }
      } else {
        // Handle text message
        response = await axios.post('/api/chat/message', {
          sessionId,
          message,
          pageContext: window.location.pathname
        }, {
          withCredentials: true
        });

        if (response.data.success) {
          console.log('Assistant response:', response.data);
          console.log('Function results:', response.data.functionResults);
          
          const assistantMessage = {
            role: 'assistant',
            content: response.data.response,
            timestamp: new Date(),
            messageType: 'text',
            functionResults: response.data.functionResults,
            speechResponse: response.data.speechResponse
          };
          setMessages(prev => [...prev, assistantMessage]);

          // Voice response is available but NOT auto-played (muted by default)
          // User can manually play it using the speaker icon in the message
        }
      }

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setError('Failed to send message. Please try again.');
      
      // Remove the user message that failed to send
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const playAudioResponse = (base64Audio) => {
    try {
      const audioBlob = new Blob([
        Uint8Array.from(atob(base64Audio), c => c.charCodeAt(0))
      ], { type: 'audio/mpeg' });
      
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.play();
      
      // Clean up URL after playing
      audio.onended = () => URL.revokeObjectURL(audioUrl);
    } catch (error) {
      console.error('Failed to play audio:', error);
    }
  };

  const clearChat = async () => {
    if (!sessionId) return;

    try {
      await axios.delete(`http://localhost:8001/api/chat/session/${sessionId}`, {
        withCredentials: true
      });
      
      // Reset state
      setSessionId(null);
      setMessages([]);
      setError(null);
      
      // Initialize new session
      await initializeSession();
    } catch (error) {
      console.error('Failed to clear chat:', error);
      setError('Failed to clear chat. Please refresh and try again.');
    }
  };

  return (
    <motion.div
      ref={popupRef}
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: 20 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={`fixed bottom-20 right-6 w-96 h-[600px] rounded-2xl shadow-2xl border z-50 flex flex-col overflow-hidden ${
        theme === 'dark'
          ? 'bg-luxury-dark border-luxury-gray'
          : 'bg-white border-gray-200'
      }`}
      style={{ maxHeight: 'calc(100vh - 120px)' }}
    >
      {/* Header */}
      <div className={`p-4 flex items-center justify-between ${
        theme === 'dark'
          ? 'bg-gradient-to-r from-gold to-gold-dark text-luxury-dark'
          : 'bg-gradient-to-r from-luxe-bronze to-luxe-bronze/90 text-white'
      }`}>
        <div className="flex items-center space-x-2">
          <SparklesIcon className="h-5 w-5" />
          <h3 className="font-semibold">Luxe24 Assistant</h3>
        </div>
        <div className="flex items-center space-x-2">
          {sessionId && (
            <button
              onClick={clearChat}
              className={`text-xs px-2 py-1 rounded transition-colors ${
                theme === 'dark'
                  ? 'text-luxury-dark/80 hover:text-luxury-dark hover:bg-luxury-dark/10'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
              title="Clear chat"
            >
              Clear
            </button>
          )}
          <button
            onClick={onClose}
            className={`transition-colors ${
              theme === 'dark'
                ? 'text-luxury-dark/80 hover:text-luxury-dark'
                : 'text-white/80 hover:text-white'
            }`}
            aria-label="Close assistant"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-3 m-3 rounded">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-xs text-red-600 hover:text-red-800 mt-1"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Interface */}
      <div className="flex-1 flex flex-col min-h-0">
        <ChatInterface 
          messages={messages}
          isLoading={isLoading}
          sessionId={sessionId}
        />
        
        <MessageInput 
          onSendMessage={sendMessage}
          isLoading={isLoading}
          disabled={!sessionId}
        />
      </div>

      {/* Status indicator */}
      <div className={`px-4 py-2 border-t ${
        theme === 'dark'
          ? 'bg-luxury-charcoal border-luxury-gray'
          : 'bg-gray-50 border-gray-200'
      }`}>
        <div className={`flex items-center justify-between text-xs ${
          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
        }`}>
          <span>
            {sessionId ? (
              <span className="flex items-center">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                Connected
              </span>
            ) : (
              <span className="flex items-center">
                <div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
                Connecting...
              </span>
            )}
          </span>
          <span>Powered by AI</span>
        </div>
      </div>
    </motion.div>
  );
};

export default AssistantPopup;
