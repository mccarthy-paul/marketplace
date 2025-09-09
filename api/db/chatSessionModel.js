import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'voice'],
    default: 'text'
  },
  metadata: {
    imageUrl: String,
    voiceTranscript: String,
    functionCall: Object,
    originalFileName: String
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const chatSessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // null for anonymous users
  },
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  messages: [messageSchema],
  isActive: {
    type: Boolean,
    default: true
  },
  userAgent: String,
  ipAddress: String,
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

// Update the updated_at field before saving
chatSessionSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

const ChatSession = mongoose.model('ChatSession', chatSessionSchema);

export default ChatSession;
