import express from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import ChatSession from '../db/chatSessionModel.js';
import AssistantContext from '../db/assistantContextModel.js';
import User from '../db/userModel.js';
import openaiService from '../services/openaiService.js';
import assistantFunctions from '../services/assistantFunctions.js';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images and audio files
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image and audio files are allowed'), false);
    }
  }
});

// Middleware to get user context
async function getUserContext(req, res, next) {
  try {
    if (req.session && req.session.user) {
      const user = await User.findById(req.session.user._id);
      if (user) {
        req.userContext = {
          id: user._id,
          name: user.name,
          email: user.email,
          company_name: user.company_name
        };

        // Get or create assistant context
        let assistantContext = await AssistantContext.findOne({ user: user._id });
        if (assistantContext) {
          req.userContext.preferences = assistantContext.contextData.preferences;
          req.userContext.recentActivity = assistantContext.contextData.recentWatches?.slice(0, 3);
          req.userContext.activeBids = assistantContext.contextData.activeBids;
        }
      }
    }
    next();
  } catch (error) {
    console.error('Error getting user context:', error);
    next();
  }
}

// Create new chat session
router.post('/session', getUserContext, async (req, res) => {
  try {
    const sessionId = uuidv4();
    const { pageContext } = req.body;

    const chatSession = new ChatSession({
      user: req.userContext?.id || null,
      sessionId,
      userAgent: req.get('User-Agent'),
      ipAddress: req.ip
    });

    await chatSession.save();

    // Send welcome message
    const welcomeMessage = req.userContext 
      ? `Hello ${req.userContext.name}! I'm your Luxe24 Assistant. How can I help you with watches today?`
      : `Welcome to Luxe24! I'm your Luxe24 Assistant. I can help you search for watches, get bidding advice, or answer any questions about our marketplace. How can I assist you?`;

    chatSession.messages.push({
      role: 'assistant',
      content: welcomeMessage,
      messageType: 'text'
    });

    await chatSession.save();

    res.json({
      success: true,
      sessionId,
      welcomeMessage
    });
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create chat session'
    });
  }
});

// Send message to assistant
router.post('/message', getUserContext, async (req, res) => {
  try {
    const { sessionId, message, pageContext } = req.body;

    if (!sessionId || !message) {
      return res.status(400).json({
        success: false,
        error: 'Session ID and message are required'
      });
    }

    // Find chat session
    const chatSession = await ChatSession.findOne({ sessionId, isActive: true });
    if (!chatSession) {
      return res.status(404).json({
        success: false,
        error: 'Chat session not found'
      });
    }

    // Add user message to session
    chatSession.messages.push({
      role: 'user',
      content: message,
      messageType: 'text'
    });

    // Prepare messages for OpenAI (last 10 messages for context)
    const recentMessages = chatSession.messages
      .slice(-10)
      .map(msg => ({
        role: msg.role,
        content: msg.content
      }));

    // Get AI response
    const aiResponse = await openaiService.getChatCompletion(
      recentMessages,
      req.userContext,
      pageContext
    );

    let responseContent = aiResponse.content;
    let functionResults = [];

    // Handle function calls
    if (aiResponse.function_call) {
      const functionName = aiResponse.function_call.name;
      const functionArgs = JSON.parse(aiResponse.function_call.arguments);

      console.log(`Executing function: ${functionName}`, functionArgs);

      const functionResult = await assistantFunctions.executeFunction(
        functionName,
        functionArgs,
        req.userContext?.id
      );

      functionResults.push({
        function: functionName,
        result: functionResult
      });

      // Generate follow-up response based on function result
      const followUpMessages = [
        ...recentMessages,
        {
          role: 'assistant',
          content: null,
          function_call: aiResponse.function_call
        },
        {
          role: 'function',
          name: functionName,
          content: JSON.stringify(functionResult)
        }
      ];

      const followUpResponse = await openaiService.getChatCompletion(
        followUpMessages,
        req.userContext,
        pageContext
      );

      responseContent = followUpResponse.content;
    }

    // Add assistant response to session
    chatSession.messages.push({
      role: 'assistant',
      content: responseContent,
      messageType: 'text',
      metadata: {
        functionCall: aiResponse.function_call || null,
        functionResults: functionResults.length > 0 ? functionResults : null
      }
    });

    await chatSession.save();

    // Generate speech response for text messages
    let speechResponse = null;
    try {
      const speechBuffer = await openaiService.generateSpeech(responseContent);
      speechResponse = speechBuffer.toString('base64');
    } catch (speechError) {
      console.warn('Failed to generate speech response:', speechError.message);
    }

    res.json({
      success: true,
      response: responseContent,
      functionResults: functionResults.length > 0 ? functionResults : null,
      speechResponse
    });

  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process message'
    });
  }
});

// Upload and analyze image
router.post('/upload', getUserContext, upload.single('image'), async (req, res) => {
  try {
    const { sessionId, additionalContext } = req.body;

    if (!sessionId || !req.file) {
      return res.status(400).json({
        success: false,
        error: 'Session ID and image file are required'
      });
    }

    // Find chat session
    const chatSession = await ChatSession.findOne({ sessionId, isActive: true });
    if (!chatSession) {
      return res.status(404).json({
        success: false,
        error: 'Chat session not found'
      });
    }

    // Analyze image with OpenAI Vision
    const analysisResult = await openaiService.analyzeImage(
      req.file.buffer,
      additionalContext || ''
    );

    // Add user message for image upload
    chatSession.messages.push({
      role: 'user',
      content: `I've uploaded an image of a watch. ${additionalContext || 'Can you help me identify it?'}`,
      messageType: 'image',
      metadata: {
        originalFileName: req.file.originalname,
        imageAnalysis: analysisResult
      }
    });

    // Add assistant response
    chatSession.messages.push({
      role: 'assistant',
      content: analysisResult,
      messageType: 'text'
    });

    await chatSession.save();

    res.json({
      success: true,
      analysis: analysisResult
    });

  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze image'
    });
  }
});

// Handle voice input
router.post('/voice', getUserContext, upload.single('audio'), async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId || !req.file) {
      return res.status(400).json({
        success: false,
        error: 'Session ID and audio file are required'
      });
    }

    // Find chat session
    const chatSession = await ChatSession.findOne({ sessionId, isActive: true });
    if (!chatSession) {
      return res.status(404).json({
        success: false,
        error: 'Chat session not found'
      });
    }

    // Transcribe audio
    console.log('Voice file info:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });
    
    const transcription = await openaiService.transcribeAudio(
      req.file.buffer,
      req.file.originalname || 'audio.webm'
    );

    // Add user message with transcription
    chatSession.messages.push({
      role: 'user',
      content: transcription,
      messageType: 'voice',
      metadata: {
        voiceTranscript: transcription,
        originalFileName: req.file.originalname
      }
    });

    // Process the transcribed message like a regular text message
    const recentMessages = chatSession.messages
      .slice(-10)
      .map(msg => ({
        role: msg.role,
        content: msg.content
      }));

    const aiResponse = await openaiService.getChatCompletion(
      recentMessages,
      req.userContext
    );

    let responseContent = aiResponse.content;

    // Handle function calls if any
    if (aiResponse.function_call) {
      const functionName = aiResponse.function_call.name;
      const functionArgs = JSON.parse(aiResponse.function_call.arguments);

      const functionResult = await assistantFunctions.executeFunction(
        functionName,
        functionArgs,
        req.userContext?.id
      );

      const followUpMessages = [
        ...recentMessages,
        {
          role: 'assistant',
          content: null,
          function_call: aiResponse.function_call
        },
        {
          role: 'function',
          name: functionName,
          content: JSON.stringify(functionResult)
        }
      ];

      const followUpResponse = await openaiService.getChatCompletion(
        followUpMessages,
        req.userContext
      );

      responseContent = followUpResponse.content;
    }

    // Add assistant response
    chatSession.messages.push({
      role: 'assistant',
      content: responseContent,
      messageType: 'text'
    });

    await chatSession.save();

    // Generate speech response
    const speechBuffer = await openaiService.generateSpeech(responseContent);

    res.json({
      success: true,
      transcription,
      response: responseContent,
      speechResponse: speechBuffer.toString('base64')
    });

  } catch (error) {
    console.error('Voice input error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process voice input'
    });
  }
});

// Get chat history
router.get('/history/:sessionId', getUserContext, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { limit = 50 } = req.query;

    const chatSession = await ChatSession.findOne({ sessionId });
    if (!chatSession) {
      return res.status(404).json({
        success: false,
        error: 'Chat session not found'
      });
    }

    // Return recent messages
    const messages = chatSession.messages
      .slice(-parseInt(limit))
      .map(msg => ({
        role: msg.role,
        content: msg.content,
        messageType: msg.messageType,
        timestamp: msg.timestamp
      }));

    res.json({
      success: true,
      messages,
      sessionInfo: {
        sessionId: chatSession.sessionId,
        created_at: chatSession.created_at,
        isActive: chatSession.isActive
      }
    });

  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve chat history'
    });
  }
});

// Clear chat session
router.delete('/session/:sessionId', getUserContext, async (req, res) => {
  try {
    const { sessionId } = req.params;

    const chatSession = await ChatSession.findOne({ sessionId });
    if (!chatSession) {
      return res.status(404).json({
        success: false,
        error: 'Chat session not found'
      });
    }

    // Mark session as inactive instead of deleting
    chatSession.isActive = false;
    await chatSession.save();

    res.json({
      success: true,
      message: 'Chat session cleared'
    });

  } catch (error) {
    console.error('Clear session error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear chat session'
    });
  }
});

export default router;
