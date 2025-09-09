# LLM Virtual Assistant Implementation

This document provides a comprehensive overview of the LLM Virtual Assistant implementation for the Luxe24.1 marketplace.

## Overview

The LLM Virtual Assistant is a multimodal AI-powered chat interface that provides users with intelligent assistance for watch searches, bidding strategies, account management, and general marketplace questions.

## Features

### ✅ Implemented Features

- **Floating Assistant Button**: Always accessible from any page
- **Multimodal Input Support**:
  - Text messaging
  - Image upload for watch identification
  - Voice input with transcription
- **Smart Responses**: Context-aware responses based on user profile and current page
- **Function Calling**: Integration with marketplace data (watches, bids, orders)
- **Session Management**: Persistent chat sessions with history
- **Responsive Design**: Works on desktop and mobile devices
- **Demo Mode**: Fallback responses when OpenAI is not configured

### 🔧 Backend Infrastructure

- **Database Models**:
  - `ChatSession`: Stores chat conversations and metadata
  - `AssistantContext`: Caches user preferences and activity
- **API Endpoints**:
  - `POST /api/chat/session` - Create new chat session
  - `POST /api/chat/message` - Send text message
  - `POST /api/chat/upload` - Upload and analyze images
  - `POST /api/chat/voice` - Process voice input
  - `GET /api/chat/history/:sessionId` - Retrieve chat history
  - `DELETE /api/chat/session/:sessionId` - Clear chat session
- **OpenAI Integration**:
  - GPT-4 for text responses and function calling
  - GPT-4 Vision for image analysis
  - Whisper for voice transcription
  - TTS for voice responses

### 🎨 Frontend Components

- `AssistantButton`: Floating action button with animations
- `AssistantPopup`: Main chat interface container
- `ChatInterface`: Message display with auto-scroll
- `MessageBubble`: Individual message rendering
- `MessageInput`: Multimodal input with file upload and voice recording
- `TypingIndicator`: Loading state animation

## Setup Instructions

### 1. Backend Setup

The backend dependencies are already installed. To enable full functionality:

1. **Configure OpenAI API Key**:
   ```bash
   # Edit api/.env
   OPENAI_API_KEY=your_openai_api_key_here
   ```

2. **Start the API Server**:
   ```bash
   cd api
   pnpm run dev
   ```

### 2. Frontend Setup

The frontend components are already integrated. To start the development server:

```bash
pnpm run dev
```

### 3. Testing the Assistant

1. **Access the Assistant**: Look for the floating green chat button in the bottom-right corner
2. **Demo Mode**: The assistant works in demo mode without OpenAI configuration
3. **Full Mode**: Add your OpenAI API key to enable all features

## Usage Examples

### Text Queries
- "Show me Rolex watches under $10,000"
- "Help me with bidding strategy for watch ID 123"
- "What are my current bids?"

### Image Analysis
- Upload a watch image for identification
- Get condition assessment and market value estimates
- Find similar watches in inventory

### Voice Interaction
- Record voice messages for hands-free interaction
- Receive audio responses (when configured)

## Architecture

### Data Flow
1. User interacts with AssistantButton
2. AssistantPopup creates chat session via API
3. Messages sent to OpenAI with function calling
4. Assistant functions query marketplace data
5. Responses displayed in ChatInterface

### Function Calling
The assistant can execute these functions:
- `search_watches`: Search inventory by criteria
- `get_user_bids`: Retrieve user's bidding history
- `get_watch_details`: Get detailed watch information
- `identify_watch_from_image`: Analyze uploaded images
- `get_bidding_help`: Provide bidding strategies

### Security & Privacy
- User authentication integration
- Session-based access control
- Secure file upload handling
- API rate limiting
- Input sanitization

## Configuration

### Environment Variables
```bash
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4-turbo-preview
ASSISTANT_MAX_TOKENS=1000

# File Upload Configuration
UPLOAD_MAX_SIZE=10485760
VOICE_MAX_DURATION=60
```

### Customization Options
- Modify system prompts in `openaiService.js`
- Adjust UI styling in component files
- Configure function definitions for different capabilities
- Update fallback responses for demo mode

## Performance Considerations

### Optimization Features
- Image compression before OpenAI Vision API
- Response caching for common queries
- Lazy loading of chat history
- Efficient session management

### Cost Management
- Token usage monitoring
- Function call optimization
- Image size limits
- Voice duration limits

## Troubleshooting

### Common Issues

1. **Assistant not responding**:
   - Check OpenAI API key configuration
   - Verify API server is running
   - Check browser console for errors

2. **Image upload failing**:
   - Ensure file size is under 10MB
   - Check supported image formats
   - Verify multer configuration

3. **Voice recording not working**:
   - Check microphone permissions
   - Ensure HTTPS for production
   - Verify MediaRecorder API support

### Debug Mode
Enable debug logging by setting:
```bash
NODE_ENV=development
```

## Future Enhancements

### Planned Features
- Real-time notifications
- Advanced search filters
- Multi-language support
- Integration with external watch databases
- Advanced analytics and insights

### Scalability Improvements
- WebSocket support for real-time chat
- Redis caching for session management
- CDN integration for file uploads
- Load balancing for high traffic

## API Documentation

### Chat Session Management
```javascript
// Create session
POST /api/chat/session
{
  "pageContext": "/watches"
}

// Send message
POST /api/chat/message
{
  "sessionId": "uuid",
  "message": "Show me Rolex watches",
  "pageContext": "/watches"
}
```

### File Upload
```javascript
// Upload image
POST /api/chat/upload
FormData: {
  sessionId: "uuid",
  image: File,
  additionalContext: "This is my watch"
}
```

## Support

For technical support or questions about the LLM Assistant implementation:

1. Check the troubleshooting section above
2. Review the API logs for error details
3. Ensure all dependencies are properly installed
4. Verify environment configuration

The assistant is designed to be robust and user-friendly, providing valuable assistance to marketplace users while maintaining high performance and security standards.
