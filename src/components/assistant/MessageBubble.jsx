import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  UserIcon, 
  SparklesIcon, 
  PhotoIcon, 
  SpeakerWaveIcon,
  ClipboardDocumentIcon
} from '@heroicons/react/24/outline';

const MessageBubble = ({ message, isLatest }) => {
  const [showFunctionResults, setShowFunctionResults] = useState(false);
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      // Could add a toast notification here
    }).catch(err => {
      console.error('Failed to copy text:', err);
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div className={`flex max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 ${isUser ? 'ml-2' : 'mr-2'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            isUser 
              ? 'bg-blue-500 text-white' 
              : 'bg-[#3ab54a] text-white'
          }`}>
            {isUser ? (
              <UserIcon className="w-4 h-4" />
            ) : (
              <SparklesIcon className="w-4 h-4" />
            )}
          </div>
        </div>

        {/* Message Content */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          <div className={`rounded-2xl px-4 py-2 max-w-full ${
            isUser 
              ? 'bg-blue-500 text-white rounded-br-md' 
              : 'bg-white text-gray-800 border border-gray-200 rounded-bl-md shadow-sm'
          }`}>
            {/* Message Type Indicator */}
            {message.messageType !== 'text' && (
              <div className="flex items-center mb-2 text-xs opacity-75">
                {message.messageType === 'image' && (
                  <>
                    <PhotoIcon className="w-3 h-3 mr-1" />
                    Image
                  </>
                )}
                {message.messageType === 'voice' && (
                  <>
                    <SpeakerWaveIcon className="w-3 h-3 mr-1" />
                    Voice
                  </>
                )}
              </div>
            )}

            {/* Message Text */}
            <div className="text-sm whitespace-pre-wrap break-words">
              {message.content}
            </div>

            {/* Function Results */}
            {message.functionResults && message.functionResults.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <button
                  onClick={() => setShowFunctionResults(!showFunctionResults)}
                  className="text-xs text-gray-600 hover:text-gray-800 flex items-center"
                >
                  <ClipboardDocumentIcon className="w-3 h-3 mr-1" />
                  {showFunctionResults ? 'Hide' : 'Show'} function results
                </button>
                
                {showFunctionResults && (
                  <div className="mt-2 space-y-2">
                    {message.functionResults.map((result, index) => (
                      <div key={index} className="bg-gray-50 rounded p-2 text-xs">
                        <div className="font-medium text-gray-700 mb-1">
                          Function: {result.function}
                        </div>
                        <div className="text-gray-600">
                          {result.result.success ? (
                            <span className="text-green-600">✓ Success</span>
                          ) : (
                            <span className="text-red-600">✗ {result.result.error}</span>
                          )}
                        </div>
                        {result.result.data && (
                          <div className="mt-1 text-gray-500">
                            {Array.isArray(result.result.data) 
                              ? `${result.result.data.length} results`
                              : 'Data returned'
                            }
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Audio Response */}
            {message.speechResponse && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <button
                  onClick={() => playAudioResponse(message.speechResponse)}
                  className="text-xs text-gray-600 hover:text-gray-800 flex items-center"
                >
                  <SpeakerWaveIcon className="w-3 h-3 mr-1" />
                  Play audio response
                </button>
              </div>
            )}
          </div>

          {/* Message Actions */}
          <div className={`flex items-center mt-1 space-x-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
            <span className="text-xs text-gray-500">
              {formatTimestamp(message.timestamp)}
            </span>
            
            {isAssistant && (
              <button
                onClick={() => copyToClipboard(message.content)}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                title="Copy message"
              >
                <ClipboardDocumentIcon className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MessageBubble;
