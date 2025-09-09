import React, { useState, useRef, useEffect } from 'react';
import { 
  PaperAirplaneIcon, 
  PhotoIcon, 
  MicrophoneIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

const MessageInput = ({ onSendMessage, isLoading, disabled }) => {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [autoRecordMode, setAutoRecordMode] = useState(false);
  const [silenceTimer, setSilenceTimer] = useState(null);
  
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const silenceDetectionRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (selectedImage) {
      // Send image with message
      onSendMessage(message || 'Can you help me identify this watch?', 'image', selectedImage);
      clearImageSelection();
    } else if (message.trim()) {
      // Send text message
      onSendMessage(message.trim(), 'text');
    }
    
    setMessage('');
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const clearImageSelection = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Auto-record mode: Start listening for voice activity
  const enableAutoRecordMode = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Set up audio context for voice activity detection
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 512;
      source.connect(analyserRef.current);
      
      setAutoRecordMode(true);
      detectVoiceActivity(stream);
    } catch (error) {
      console.error('Failed to enable auto-record mode:', error);
      alert('Failed to access microphone for voice-first mode.');
    }
  };

  const disableAutoRecordMode = () => {
    setAutoRecordMode(false);
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (silenceDetectionRef.current) {
      clearInterval(silenceDetectionRef.current);
      silenceDetectionRef.current = null;
    }
  };

  const detectVoiceActivity = (stream) => {
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    let voiceDetected = false;
    
    const checkAudio = () => {
      if (!analyserRef.current || !autoRecordMode) return;
      
      analyserRef.current.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / bufferLength;
      
      // Voice activity threshold
      const threshold = 30;
      
      if (average > threshold && !isRecording && !voiceDetected) {
        voiceDetected = true;
        startRecording(stream, true); // Auto-start recording
      }
      
      if (isRecording && average <= threshold) {
        // Start silence timer
        if (!silenceTimer) {
          const timer = setTimeout(() => {
            stopRecording();
            voiceDetected = false;
            setSilenceTimer(null);
          }, 2000); // Stop after 2 seconds of silence
          setSilenceTimer(timer);
        }
      } else if (silenceTimer && average > threshold) {
        // Cancel silence timer if voice detected again
        clearTimeout(silenceTimer);
        setSilenceTimer(null);
      }
    };
    
    silenceDetectionRef.current = setInterval(checkAudio, 100);
  };

  const startRecording = async (existingStream = null, isAutoMode = false) => {
    try {
      const stream = existingStream || await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Try to use a format that OpenAI supports
      let options = {};
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        options = { mimeType: 'audio/webm;codecs=opus' };
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        options = { mimeType: 'audio/mp4' };
      } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
        options = { mimeType: 'audio/ogg;codecs=opus' };
      } else if (MediaRecorder.isTypeSupported('audio/wav')) {
        options = { mimeType: 'audio/wav' };
      }

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      console.log('Recording with format:', mediaRecorder.mimeType);

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const mimeType = mediaRecorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        
        // Create a filename with proper extension based on mime type
        let filename = 'audio.webm';
        if (mimeType.includes('mp4')) filename = 'audio.mp4';
        else if (mimeType.includes('ogg')) filename = 'audio.ogg';
        else if (mimeType.includes('wav')) filename = 'audio.wav';
        else if (mimeType.includes('webm')) filename = 'audio.webm';
        
        // Add filename as a property to the blob for the backend
        audioBlob.filename = filename;
        
        console.log(`Sending audio: ${filename}, size: ${audioBlob.size} bytes, type: ${mimeType}`);
        onSendMessage('Voice message', 'voice', audioBlob);
        
        // Don't stop the stream if we're in auto-record mode
        if (!isAutoMode && !autoRecordMode) {
          stream.getTracks().forEach(track => track.stop());
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
      if (!isAutoMode) {
        alert('Failed to access microphone. Please check your permissions.');
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="border-t border-gray-200 bg-white p-4">
      {/* Image Preview */}
      <AnimatePresence>
        {imagePreview && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-3 relative"
          >
            <div className="relative inline-block">
              <img 
                src={imagePreview} 
                alt="Selected watch" 
                className="max-w-32 max-h-32 rounded-lg border border-gray-200"
              />
              <button
                onClick={clearImageSelection}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
              >
                <XMarkIcon className="w-3 h-3" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Image selected for analysis
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recording Indicator */}
      <AnimatePresence>
        {isRecording && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mb-3 flex items-center justify-center bg-red-50 border border-red-200 rounded-lg p-3"
          >
            <div className="flex items-center space-x-2">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="w-3 h-3 bg-red-500 rounded-full"
              />
              <span className="text-sm text-red-700">Recording... Click to stop</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex items-end space-x-2">
        {/* Text Input */}
        <div className="flex-1 relative">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={
              selectedImage 
                ? "Add context about this watch (optional)..." 
                : "Ask about watches, bidding, or marketplace..."
            }
            disabled={disabled || isLoading}
            className="w-full resize-none border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#3ab54a] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            rows={1}
            style={{ 
              minHeight: '40px',
              maxHeight: '120px',
              overflowY: message.length > 100 ? 'auto' : 'hidden'
            }}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-1">
          {/* Voice-First Mode Toggle */}
          <button
            type="button"
            onClick={autoRecordMode ? disableAutoRecordMode : enableAutoRecordMode}
            disabled={disabled || isLoading}
            className={`p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              autoRecordMode 
                ? 'text-[#3ab54a] bg-green-50 hover:bg-green-100' 
                : 'text-gray-500 hover:text-[#3ab54a] hover:bg-gray-100'
            }`}
            title={autoRecordMode ? "Disable voice-first mode" : "Enable voice-first mode"}
          >
            <div className="relative">
              <MicrophoneIcon className="w-5 h-5" />
              {autoRecordMode && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              )}
            </div>
          </button>

          {/* Image Upload Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isLoading || isRecording}
            className="p-2 text-gray-500 hover:text-[#3ab54a] hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Upload watch image"
          >
            <PhotoIcon className="w-5 h-5" />
          </button>

          {/* Manual Voice Recording Button (only show when not in auto mode) */}
          {!autoRecordMode && (
            <button
              type="button"
              onClick={isRecording ? stopRecording : startRecording}
              disabled={disabled || isLoading}
              className={`p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                isRecording 
                  ? 'text-red-500 bg-red-100 hover:bg-red-200' 
                  : 'text-gray-500 hover:text-[#3ab54a] hover:bg-gray-100'
              }`}
              title={isRecording ? "Stop recording" : "Record voice message"}
            >
              <MicrophoneIcon className="w-5 h-5" />
            </button>
          )}

          {/* Send Button */}
          <button
            type="submit"
            disabled={disabled || isLoading || (!message.trim() && !selectedImage) || isRecording}
            className="p-2 bg-[#3ab54a] text-white rounded-lg hover:bg-[#32a042] transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400"
            title="Send message"
          >
            <PaperAirplaneIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          className="hidden"
        />
      </form>

      {/* Helper Text */}
      <div className="mt-2 text-xs text-gray-500 flex items-center justify-between">
        <span>
          {autoRecordMode 
            ? "Voice-first mode active - speak naturally"
            : selectedImage 
              ? "Image ready for analysis" 
              : "Type a message, upload an image, or record voice"
          }
        </span>
        <span>
          {autoRecordMode ? "Auto-recording enabled" : "Press Enter to send"}
        </span>
      </div>
    </div>
  );
};

export default MessageInput;
