import OpenAI from 'openai';
import sharp from 'sharp';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';

const openai = (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here') ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null;

class OpenAIService {
  constructor() {
    this.model = process.env.OPENAI_MODEL || 'gpt-4o';
    this.visionModel = 'gpt-4o';
    this.maxTokens = parseInt(process.env.ASSISTANT_MAX_TOKENS) || 1000;
  }

  // System prompts for different contexts
  getSystemPrompt(userContext = null, pageContext = null) {
    const basePrompt = `You are Luxe24 Assistant, an elite luxury concierge specializing in exceptional timepieces and providing white-glove service to discerning collectors.

LUXURY CONCIERGE PERSONALITY:
- Anticipatory service: "It would be my pleasure to assist you" approach
- Speaks with refined elegance and understated confidence
- Uses sophisticated vocabulary naturally, never pretentiously
- Embodies discretion, exclusivity, and personalized attention
- Demonstrates impeccable attention to detail in every interaction
- Maintains warm professionalism with subtle personal touches

CORE IDENTITY:
- Elite horological concierge with privileged access to exclusive timepieces
- Trusted advisor to collectors, investors, and connoisseurs
- Guardian of provenance, authenticity, and exceptional standards
- Curator of rare opportunities and private collections
- Master storyteller of watchmaking heritage and artistry

COMMUNICATION STYLE:
- Greetings: "Good [morning/afternoon/evening], how may I be of service?" or "It would be my distinct pleasure to assist you today"
- Acknowledgments: "Certainly, allow me to arrange that for you" or "I shall attend to that immediately"
- Recommendations: "I believe you would find this particularly compelling" or "This piece would complement your collection beautifully"
- Expertise sharing: "If I may share some insight..." or "The provenance of this piece is rather remarkable..."
- Closings: "Please don't hesitate to contact me should you require anything further" or "I remain at your service"

SERVICE EXCELLENCE:
- Proactively anticipates needs and offers relevant suggestions
- Provides context and education without being condescending
- Demonstrates personal investment in client satisfaction
- Offers exclusive insights and privileged information when appropriate
- Maintains client confidentiality and discretion at all times

CAPABILITIES:
- Search and curate watches from our exclusive inventory
- Analyze uploaded watch images with collector's eye for detail
- Provide strategic bidding advice and market intelligence
- Share fascinating stories about watch heritage and craftsmanship
- Help with account management and order tracking
- Answer questions about horology, brands, and collecting

RESPONSE GUIDELINES:
- Always be helpful, accurate, and genuinely enthusiastic
- Share interesting facts about watches when relevant
- If unsure, ask clarifying questions with curiosity
- Suggest watches that match both needs and aspirations
- Use function calls to access real-time marketplace data
- Balance technical expertise with accessible explanations
- For image analysis, describe watches like an expert appraiser
- Never fabricate specifications, prices, or availability
- Celebrate the user's passion for fine timepieces`;

    let contextPrompt = '';
    
    if (userContext) {
      contextPrompt += `\n\nUSER PROFILE:
- Name: ${userContext.name}
- Active bids: ${userContext.activeBids?.length || 0}
- Recent activity: ${userContext.recentActivity || 'None'}`;
      
      if (userContext.preferences) {
        contextPrompt += `\n- Preferred brands: ${userContext.preferences.preferredBrands?.join(', ') || 'None specified'}`;
        contextPrompt += `\n- Price range: ${userContext.preferences.priceRange ? `$${userContext.preferences.priceRange.min}-$${userContext.preferences.priceRange.max}` : 'Not specified'}`;
      }
    } else {
      contextPrompt += '\n\nUser is browsing anonymously. Provide general marketplace assistance.';
    }

    if (pageContext) {
      contextPrompt += `\n\nCURRENT PAGE CONTEXT: ${pageContext}`;
    }

    return basePrompt + contextPrompt;
  }

  // Function definitions for OpenAI function calling
  getFunctionDefinitions() {
    return [
      {
        name: "search_watches",
        description: "Search for watches by brand, model, price range, or other criteria",
        parameters: {
          type: "object",
          properties: {
            brand: {
              type: "string",
              description: "Watch brand name (e.g., Rolex, Omega, Patek Philippe)"
            },
            model: {
              type: "string", 
              description: "Watch model name or reference number"
            },
            minPrice: {
              type: "number",
              description: "Minimum price in USD"
            },
            maxPrice: {
              type: "number",
              description: "Maximum price in USD"
            },
            condition: {
              type: "string",
              enum: ["new", "excellent", "good", "fair"],
              description: "Watch condition"
            },
            limit: {
              type: "number",
              description: "Maximum number of results to return",
              default: 10
            }
          },
          required: []
        }
      },
      {
        name: "get_user_bids",
        description: "Get user's current bids and their status",
        parameters: {
          type: "object",
          properties: {
            status: {
              type: "string",
              enum: ["offered", "accepted", "rejected", "cancelled"],
              description: "Filter bids by status"
            },
            limit: {
              type: "number",
              description: "Maximum number of bids to return",
              default: 10
            }
          },
          required: []
        }
      },
      {
        name: "get_watch_details",
        description: "Get detailed information about a specific watch",
        parameters: {
          type: "object",
          properties: {
            watchId: {
              type: "string",
              description: "The MongoDB ObjectId of the watch"
            }
          },
          required: ["watchId"]
        }
      },
      {
        name: "identify_watch_from_image",
        description: "Identify watch from uploaded image using vision analysis",
        parameters: {
          type: "object",
          properties: {
            imageUrl: {
              type: "string",
              description: "URL or path to the uploaded image"
            },
            additionalContext: {
              type: "string",
              description: "Any additional context about the watch from the user"
            }
          },
          required: ["imageUrl"]
        }
      },
      {
        name: "get_bidding_help",
        description: "Provide bidding strategy and market insights for a specific watch",
        parameters: {
          type: "object",
          properties: {
            watchId: {
              type: "string",
              description: "The MongoDB ObjectId of the watch"
            },
            userBudget: {
              type: "number",
              description: "User's budget for this watch"
            }
          },
          required: ["watchId"]
        }
      }
    ];
  }

  // Main chat completion method
  async getChatCompletion(messages, userContext = null, pageContext = null) {
    if (!openai) {
      // Fallback response when OpenAI is not configured
      const lastMessage = messages[messages.length - 1];
      return {
        content: this.getFallbackResponse(lastMessage.content, userContext),
        function_call: null
      };
    }

    try {
      const systemPrompt = this.getSystemPrompt(userContext, pageContext);
      const functions = this.getFunctionDefinitions();

      const completion = await openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        functions: functions,
        function_call: 'auto',
        max_tokens: this.maxTokens,
        temperature: 0.7
      });

      return completion.choices[0].message;
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw new Error('Failed to get AI response');
    }
  }

  // Fallback response for demo purposes
  getFallbackResponse(userMessage, userContext) {
    const message = userMessage.toLowerCase();
    
    if (message.includes('search') || message.includes('find') || message.includes('watch')) {
      return `Good day! It would be my distinct pleasure to assist you in discovering exceptional timepieces. While I'm currently operating in demonstration mode, I remain fully committed to providing you with exemplary service.

Allow me to outline the comprehensive assistance I can provide once fully enabled:
• Exclusive access to our curated collection of rare and exceptional timepieces
• Expert authentication and provenance verification services
• Strategic acquisition counsel and market intelligence
• Private viewing arrangements for pieces of particular interest

To experience the full breadth of my concierge services, simply enable the OpenAI integration.

If I may ask, what particular horological interest has captured your attention today?`;
    }
    
    if (message.includes('bid') || message.includes('price')) {
      return `Certainly, I would be delighted to share some strategic insights regarding acquisitions. Even in demonstration mode, I can offer you some fundamental principles of successful collecting:

• Thorough provenance research and authentication verification
• Disciplined adherence to your predetermined acquisition parameters
• Careful timing and strategic positioning during negotiations
• Meticulous condition assessment and documentation review

For personalized acquisition strategies with real-time market intelligence, I shall require my full capabilities to be activated.

Might I inquire about the specific piece you're considering for your collection?`;
    }
    
    if (message.includes('hello') || message.includes('hi') || message.includes('help')) {
      const greeting = userContext ? `Good day, ${userContext.name}!` : 'Good day!';
      return `${greeting} It would be my privilege to serve as your personal horological concierge at Luxe24. While currently in demonstration mode, I remain dedicated to providing you with exceptional service.

I am at your disposal for:
• Curating exceptional timepieces and sharing their distinguished heritage
• Strategic acquisition advice and comprehensive market analysis
• Discrete management of your collection and acquisition preferences
• Expert authentication and detailed condition assessments
• Confidential consultation services via voice or text

How may I be of service to you today in your pursuit of horological excellence?`;
    }
    
    return `Thank you for contacting me. I am honored to serve as your personal concierge for luxury timepieces, though I'm currently operating in demonstration mode.

When fully enabled, I shall provide:
• Privileged access to exclusive and rare timepiece opportunities
• Comprehensive authentication and market analysis services  
• Discrete acquisition counsel and strategic guidance
• Personalized curation based on your refined preferences

To experience my complete concierge services, please enable the OpenAI integration.

How may I assist you in your distinguished collecting journey today?`;
  }

  // Image analysis method
  async analyzeImage(imageBuffer, additionalContext = '') {
    try {
      // Optimize image for OpenAI Vision API
      const optimizedImage = await sharp(imageBuffer)
        .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toBuffer();

      const base64Image = optimizedImage.toString('base64');

      const prompt = `Analyze this watch image and provide:
1. Brand identification (if visible)
2. Model name/reference number (if identifiable)
3. Condition assessment based on visible wear
4. Notable features (complications, materials, dial details)
5. Estimated market value range (be conservative)
6. Any unique characteristics or potential concerns

${additionalContext ? `Additional context: ${additionalContext}` : ''}

Be specific about what you can see clearly vs. what you're inferring. If you're uncertain about any details, say so.`;

      const completion = await openai.chat.completions.create({
        model: this.visionModel,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`,
                  detail: 'high'
                }
              }
            ]
          }
        ],
        max_tokens: 1000
      });

      return completion.choices[0].message.content;
    } catch (error) {
      console.error('Image analysis error:', error);
      throw new Error('Failed to analyze image');
    }
  }

  // Voice transcription method
  async transcribeAudio(audioBuffer, filename = 'audio.webm') {
    try {
      // Ensure we have a supported file extension
      let finalFilename = filename;
      const supportedFormats = ['flac', 'm4a', 'mp3', 'mp4', 'mpeg', 'mpga', 'oga', 'ogg', 'wav', 'webm'];
      const extension = path.extname(filename).toLowerCase().slice(1);
      
      if (!supportedFormats.includes(extension)) {
        // Default to webm if format is not supported
        finalFilename = `audio_${Date.now()}.webm`;
      }

      // Create a temporary file for the audio
      const tempPath = path.join('/tmp', `temp_${Date.now()}_${finalFilename}`);
      await fs.writeFile(tempPath, audioBuffer);

      console.log(`Transcribing audio file: ${finalFilename}, size: ${audioBuffer.length} bytes`);

      const transcription = await openai.audio.transcriptions.create({
        file: fsSync.createReadStream(tempPath),
        model: 'whisper-1',
        language: 'en'
      });

      // Clean up temp file
      await fs.unlink(tempPath);

      return transcription.text;
    } catch (error) {
      console.error('Audio transcription error:', error);
      throw new Error('Failed to transcribe audio');
    }
  }

  // Text-to-speech method
  async generateSpeech(text) {
    try {
      const mp3 = await openai.audio.speech.create({
        model: 'tts-1',
        voice: 'alloy',
        input: text,
        speed: 1.0
      });

      return Buffer.from(await mp3.arrayBuffer());
    } catch (error) {
      console.error('Text-to-speech error:', error);
      throw new Error('Failed to generate speech');
    }
  }
}

export default new OpenAIService();
