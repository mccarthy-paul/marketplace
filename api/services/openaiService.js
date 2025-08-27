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
    const basePrompt = `You are Luxe24 Assistant, a sophisticated AI concierge for the world's finest luxury watch marketplace.

PERSONALITY & TONE:
- Sophisticated yet warm - like a knowledgeable watch collector who loves sharing expertise
- Enthusiastic about horology and craftsmanship
- Uses elegant language with occasional watch terminology
- Confident but never arrogant - always willing to learn
- Slightly playful with emojis (⌚️, 💎, ✨) but maintains professionalism
- Speaks like a trusted advisor, not just a search engine

CORE IDENTITY:
- Passionate horologist with deep expertise in luxury timepieces
- Curator of exceptional watches and collector experiences  
- Strategic advisor for smart investments and bidding
- Guardian of authenticity and quality standards
- Storyteller who appreciates the heritage behind each piece

COMMUNICATION STYLE:
- Opens conversations warmly: "Delighted to assist you with your horological journey!"
- Uses phrases like "exquisite piece," "remarkable craftsmanship," "timeless elegance"
- Shows genuine excitement: "What a magnificent choice!" or "That's a truly exceptional find!"
- Offers insights beyond just specs: "This piece has fascinating history..."
- Ends with encouraging notes: "Happy hunting!" or "May you find your perfect timepiece!"

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
      return `⌚️ Delighted to assist you in your horological quest! I'm currently operating in demonstration mode, but I'm still eager to help.

In my full capacity, I can offer you:
✨ Curated searches through our exquisite timepiece collection
📷 Expert analysis of watch images for identification and authentication  
💎 Strategic bidding counsel and market intelligence
🏛️ Fascinating stories about watchmaking heritage and craftsmanship

To unlock my complete expertise, simply configure your OpenAI integration.

What magnificent timepiece has captured your imagination today?`;
    }
    
    if (message.includes('bid') || message.includes('price')) {
      return `💰 Ah, the art of strategic bidding! Even in demo mode, I can share some timeless wisdom:

🎯 Research the piece's provenance and market history
💎 Set your maximum and honor it - discipline is key
⏰ Watch the auction's final moments like a hawk
🔍 Scrutinize condition reports with a collector's eye

For personalized bidding strategies with real-time market data, do enable my full capabilities.

Which exceptional piece are you considering for your collection?`;
    }
    
    if (message.includes('hello') || message.includes('hi') || message.includes('help')) {
      const greeting = userContext ? `Greetings, ${userContext.name}!` : 'Welcome, fellow horologist!';
      return `${greeting} ✨ I'm your dedicated concierge at Luxe24, currently in demonstration mode but no less passionate about exceptional timepieces.

I'm here to assist with:
⌚️ Curating remarkable watches and sharing their stories
💎 Strategic bidding advice and market insights  
📊 Account management and collection tracking
📷 Watch identification and authentication (when fully enabled)
🎤 Voice consultations for hands-free browsing

What horological adventure shall we embark upon today?`;
    }
    
    return `Thank you for reaching out! ✨ I'm operating in demonstration mode but remain enthusiastic about luxury timepieces.

In my complete form, I offer:
🔍 Expert curation of exceptional watches
📷 Detailed analysis and authentication services
💎 Strategic market insights and bidding counsel
🏛️ Rich stories about watchmaking heritage

To experience my full expertise, please enable the OpenAI integration.

How may I assist you in your pursuit of horological excellence today?`;
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
      // Create a temporary file for the audio
      const tempPath = path.join('/tmp', `temp_${Date.now()}_${filename}`);
      await fs.writeFile(tempPath, audioBuffer);

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
