import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  UserIcon, 
  SparklesIcon, 
  PhotoIcon, 
  SpeakerWaveIcon,
  ClipboardDocumentIcon
} from '@heroicons/react/24/outline';

const MessageBubble = ({ message, isLatest }) => {
  const [showFunctionResults, setShowFunctionResults] = useState(false);
  const navigate = useNavigate();
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

  // Function to render balance results as a table
  const renderBalanceResults = (functionResults) => {
    const balanceResult = functionResults.find(r => 
      r.function === 'getAccountBalances' || r.function === 'get_account_balances'
    );
    
    if (!balanceResult || !balanceResult.result.success || !balanceResult.result.data) {
      return null;
    }

    const balances = balanceResult.result.data;
    if (!Array.isArray(balances) || balances.length === 0) {
      return null;
    }

    return (
      <div className="mt-4">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Currency
                </th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Balance
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {balances.map((balance, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-3 py-2 whitespace-nowrap text-gray-900 font-medium">
                    {balance.currency}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-right text-gray-600">
                    {typeof balance.balance === 'number' 
                      ? balance.balance.toLocaleString('en-US', { 
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2 
                        })
                      : balance.balance}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Function to render watch search results with images
  const renderWatchResults = (functionResults) => {
    // Check for both possible function names
    const searchResult = functionResults.find(r => 
      r.function === 'searchWatches' || r.function === 'search_watches'
    );
    if (!searchResult || !searchResult.result.success || !searchResult.result.data) {
      console.log('No valid search results found in:', functionResults);
      return null;
    }

    const watches = searchResult.result.data;
    if (!Array.isArray(watches) || watches.length === 0) {
      return null;
    }
    
    // Debug: Log watch data to see what's available
    console.log('Watch search results:', watches);

    return (
      <div className="mt-4 space-y-3">
        <div className="text-xs font-medium text-gray-600 mb-2">Found {watches.length} watch{watches.length !== 1 ? 'es' : ''}:</div>
        {watches.slice(0, 5).map((watch) => (
          <div 
            key={watch._id}
            onClick={() => navigate(`/watches/${watch._id}`)}
            className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
          >
            {/* Watch Image */}
            {(watch.imageUrl || watch.images?.[0]) && (
              <img 
                src={watch.imageUrl || watch.images[0]} 
                alt={`${watch.brand} ${watch.model}`}
                className="w-16 h-16 object-cover rounded-md flex-shrink-0"
                onError={(e) => {
                  console.error('Image failed to load:', e.target.src);
                  e.target.style.display = 'none';
                }}
              />
            )}
            
            {/* Watch Details */}
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-gray-900 truncate">
                {watch.brand} {watch.model}
              </h4>
              <p className="text-xs text-gray-600">
                Ref: {watch.reference_number}
              </p>
              {watch.price && (
                <p className="text-sm font-medium text-[#3ab54a] mt-1">
                  ${watch.price.toLocaleString()}
                </p>
              )}
              {watch.condition && (
                <p className="text-xs text-gray-500">
                  Condition: {watch.condition}
                </p>
              )}
            </div>
          </div>
        ))}
        {watches.length > 5 && (
          <button 
            onClick={() => navigate('/watches')}
            className="text-xs text-[#3ab54a] hover:text-[#32a042] font-medium"
          >
            View all {watches.length} results →
          </button>
        )}
      </div>
    );
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

            {/* Balance Results Table */}
            {message.functionResults && renderBalanceResults(message.functionResults)}

            {/* Watch Search Results with Images */}
            {message.functionResults && renderWatchResults(message.functionResults)}

            {/* Function Results (for non-watch searches) */}
            {message.functionResults && message.functionResults.length > 0 && 
             !message.functionResults.some(r => 
               r.function === 'searchWatches' || 
               r.function === 'search_watches' || 
               r.function === 'getAccountBalances' || 
               r.function === 'get_account_balances'
             ) && (
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
                  className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors text-xs text-gray-700"
                  title="Click to play audio response"
                >
                  <SpeakerWaveIcon className="w-4 h-4" />
                  <span>Play audio response</span>
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
