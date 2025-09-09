import React from 'react';
import { motion } from 'framer-motion';
import { SparklesIcon } from '@heroicons/react/24/outline';

const TypingIndicator = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex justify-start mb-4"
    >
      <div className="flex flex-row">
        {/* Avatar */}
        <div className="flex-shrink-0 mr-2">
          <div className="w-8 h-8 rounded-full bg-[#3ab54a] text-white flex items-center justify-center">
            <SparklesIcon className="w-4 h-4" />
          </div>
        </div>

        {/* Typing bubble */}
        <div className="bg-white text-gray-800 border border-gray-200 rounded-2xl rounded-bl-md shadow-sm px-4 py-3">
          <div className="flex items-center space-x-1">
            <div className="flex space-x-1">
              <motion.div
                className="w-2 h-2 bg-gray-400 rounded-full"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: 0,
                }}
              />
              <motion.div
                className="w-2 h-2 bg-gray-400 rounded-full"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: 0.2,
                }}
              />
              <motion.div
                className="w-2 h-2 bg-gray-400 rounded-full"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: 0.4,
                }}
              />
            </div>
            <span className="text-xs text-gray-500 ml-2">Assistant is thinking...</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default TypingIndicator;
