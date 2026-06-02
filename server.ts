import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import { GoogleGenerativeAI } from "@google/generative-ai";
import db, { initializeDatabase, queries } from "./database.js";
import {
  hashPassword,
  verifyPassword,
  generateToken,
  authenticateToken,
  optionalAuth,
  addComplianceMetadata,
  sanitizeForLog,
  type AuthRequest,
} from "./auth.js";
import { generateRecommendations, getQuickActions } from "./recommendations.js";

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Python backend service URL
const PYTHON_SERVICE_URL = "http://localhost:5000";

type PredictionInput = {
  Pregnancies: number;
  Glucose: number;
  BloodPressure: number;
  Insulin: number;
  BMI: number;
  DiabetesPedigreeFunction: number;
  Age: number;
};

type PredictionEvent = {
  timestamp: number;
  input: PredictionInput;
  riskScore: number;
  riskLevel: string;
};

const MAX_EVENTS = 1000;
const predictionEvents: PredictionEvent[] = [];

const FEATURE_LABELS: Record<keyof PredictionInput, string> = {
  Pregnancies: "Pregnancies",
  Glucose: "Glucose",
  BloodPressure: "BP",
  Insulin: "Insulin",
  BMI: "BMI",
  DiabetesPedigreeFunction: "Pedigree",
  Age: "Age",
};

const FALLBACK_CORRELATION_DATA = [
  { bmi: 18, glucose: 85, risk: 10 },
  { bmi: 22, glucose: 90, risk: 15 },
  { bmi: 25, glucose: 110, risk: 25 },
  { bmi: 28, glucose: 130, risk: 45 },
  { bmi: 32, glucose: 160, risk: 75 },
  { bmi: 35, glucose: 180, risk: 85 },
  { bmi: 40, glucose: 200, risk: 95 },
  { bmi: 20, glucose: 140, risk: 40 },
  { bmi: 38, glucose: 100, risk: 35 },
  { bmi: 26, glucose: 170, risk: 80 },
];

const FALLBACK_FEATURE_IMPORTANCE = [
  { feature: "Glucose", importance: 85 },
  { feature: "BMI", importance: 72 },
  { feature: "Age", importance: 64 },
  { feature: "Pedigree", importance: 58 },
  { feature: "Pregnancies", importance: 42 },
  { feature: "Insulin", importance: 35 },
  { feature: "BP", importance: 28 },
];

function toNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function pushPredictionEvent(input: PredictionInput, response: any) {
  const probability = toNumber(response?.probability);
  const riskScore = Math.max(0, Math.min(100, probability * 100));

  predictionEvents.push({
    timestamp: Date.now(),
    input,
    riskScore,
    riskLevel: String(response?.risk_level ?? "Unknown"),
  });

  if (predictionEvents.length > MAX_EVENTS) {
    predictionEvents.splice(0, predictionEvents.length - MAX_EVENTS);
  }
}

function pearsonCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length < 2) return 0;

  const n = x.length;
  const xMean = x.reduce((sum, value) => sum + value, 0) / n;
  const yMean = y.reduce((sum, value) => sum + value, 0) / n;

  let numerator = 0;
  let xVariance = 0;
  let yVariance = 0;

  for (let i = 0; i < n; i += 1) {
    const xDelta = x[i] - xMean;
    const yDelta = y[i] - yMean;
    numerator += xDelta * yDelta;
    xVariance += xDelta * xDelta;
    yVariance += yDelta * yDelta;
  }

  const denominator = Math.sqrt(xVariance * yVariance);
  if (denominator === 0) return 0;
  return numerator / denominator;
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  // Initialize database
  initializeDatabase();

  app.use(cors());
  app.use(express.json({ limit: "10mb" }));

  // ============ Authentication Routes ============
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, name } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "Email and password required" });
      }

      // Check if user exists
      const existing = queries.getUserByEmail.get(email) as any;
      if (existing) {
        return res.status(409).json({ error: "Email already registered" });
      }

      // Hash password and create user
      const passwordHash = hashPassword(password);
      const result = queries.createUser.run(email, passwordHash, name || null);
      const userId = (result as any).lastInsertRowid;

      // Generate token
      const token = generateToken(userId, email);

      // Audit log
      queries.createAuditLog.run(userId, "register", "user", null, req.ip);

      res.json({
        success: true,
        token,
        user: { id: userId, email, name },
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "Email and password required" });
      }

      const user = queries.getUserByEmail.get(email) as any;
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      if (!verifyPassword(password, user.password_hash)) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const token = generateToken(user.id, user.email);

      // Audit log
      queries.createAuditLog.run(user.id, "login", "user", null, req.ip);

      res.json({
        success: true,
        token,
        user: { id: user.id, email: user.email, name: user.name },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.get("/api/auth/me", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const user = queries.getUserById.get(req.user!.userId) as any;
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.created_at,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  // ============ Calculator Routes ============
  app.post("/api/calculators/bmi", optionalAuth, async (req: AuthRequest, res) => {
    try {
      const { height, weight } = req.body;
      
      if (!height || !weight || height <= 0 || weight <= 0) {
        return res.status(400).json({ error: "Valid height and weight required" });
      }

      const heightM = height / 100;
      const bmi = weight / (heightM * heightM);
      
      let category = '';
      if (bmi < 18.5) category = 'Underweight';
      else if (bmi < 25) category = 'Normal Weight';
      else if (bmi < 30) category = 'Overweight';
      else category = 'Obese';

      const result = { bmi: parseFloat(bmi.toFixed(1)), category, height, weight };
      
      // Store in database if user is authenticated
      const userId = req.user?.userId || null;
      if (userId) {
        queries.createCalculatorHistory.run(
          userId,
          'bmi',
          JSON.stringify({ height, weight }),
          JSON.stringify(result)
        );
        
        queries.createAuditLog.run(userId, 'calculator_use', 'bmi', null, req.ip);
      }

      res.json(addComplianceMetadata(result));
    } catch (error) {
      console.error("BMI calculator error:", error);
      res.status(500).json({ error: "BMI calculation failed" });
    }
  });

  app.post("/api/calculators/calorie", optionalAuth, async (req: AuthRequest, res) => {
    try {
      const { age, weight, height, gender, activity } = req.body;
      
      if (!age || !weight || !height || !gender || !activity) {
        return res.status(400).json({ error: "All fields required" });
      }

      // Calculate BMR using Mifflin-St Jeor Equation
      let bmr;
      if (gender === 'male') {
        bmr = 10 * weight + 6.25 * height - 5 * age + 5;
      } else {
        bmr = 10 * weight + 6.25 * height - 5 * age - 161;
      }

      const activityMultipliers: Record<string, number> = {
        sedentary: 1.2,
        light: 1.375,
        moderate: 1.55,
        active: 1.725,
        veryActive: 1.9,
      };

      const tdee = Math.round(bmr * activityMultipliers[activity]);
      const result = {
        bmr: Math.round(bmr),
        tdee,
        maintain: tdee,
        mildLoss: Math.round(tdee - 250),
        weightLoss: Math.round(tdee - 500),
        extremeLoss: Math.round(tdee - 1000),
        mildGain: Math.round(tdee + 250),
        weightGain: Math.round(tdee + 500),
      };

      // Store in database if user is authenticated
      const userId = req.user?.userId || null;
      if (userId) {
        queries.createCalculatorHistory.run(
          userId,
          'calorie',
          JSON.stringify({ age, weight, height, gender, activity }),
          JSON.stringify(result)
        );
        
        queries.createAuditLog.run(userId, 'calculator_use', 'calorie', null, req.ip);
      }

      res.json(addComplianceMetadata(result));
    } catch (error) {
      console.error("Calorie calculator error:", error);
      res.status(500).json({ error: "Calorie calculation failed" });
    }
  });

  app.post("/api/calculators/daily-risk", optionalAuth, async (req: AuthRequest, res) => {
    try {
      const { sleep, exercise, water, sugar, stress } = req.body;
      
      if (sleep === undefined || exercise === undefined || water === undefined || 
          sugar === undefined || stress === undefined) {
        return res.status(400).json({ error: "All fields required" });
      }

      let score = 100;
      const factors = [];

      // Sleep scoring
      if (sleep < 6) {
        score -= 15;
        factors.push({ factor: 'Sleep', impact: '↓ Low', status: 'poor' });
      } else if (sleep >= 7 && sleep <= 9) {
        factors.push({ factor: 'Sleep', impact: '✓ Good', status: 'good' });
      } else {
        score -= 10;
        factors.push({ factor: 'Sleep', impact: '↑ High', status: 'moderate' });
      }

      // Exercise scoring
      if (exercise < 15) {
        score -= 20;
        factors.push({ factor: 'Exercise', impact: '↓ Low', status: 'poor' });
      } else if (exercise >= 30) {
        factors.push({ factor: 'Exercise', impact: '✓ Good', status: 'good' });
      } else {
        score -= 10;
        factors.push({ factor: 'Exercise', impact: '~ Moderate', status: 'moderate' });
      }

      // Water scoring
      if (water < 6) {
        score -= 10;
        factors.push({ factor: 'Hydration', impact: '↓ Low', status: 'poor' });
      } else {
        factors.push({ factor: 'Hydration', impact: '✓ Good', status: 'good' });
      }

      // Sugar scoring
      if (sugar > 50) {
        score -= 25;
        factors.push({ factor: 'Sugar', impact: '↑ High', status: 'poor' });
      } else if (sugar <= 25) {
        factors.push({ factor: 'Sugar', impact: '✓ Low', status: 'good' });
      } else {
        score -= 15;
        factors.push({ factor: 'Sugar', impact: '~ Moderate', status: 'moderate' });
      }

      // Stress scoring
      if (stress >= 4) {
        score -= 15;
        factors.push({ factor: 'Stress', impact: '↑ High', status: 'poor' });
      } else {
        factors.push({ factor: 'Stress', impact: '✓ Low', status: 'good' });
      }

      score = Math.max(0, Math.min(100, score));
      let risk = '';
      if (score >= 80) risk = 'Low Risk';
      else if (score >= 60) risk = 'Medium Risk';
      else risk = 'High Risk';

      const result = { score, risk, factors };

      // Store in database if user is authenticated
      const userId = req.user?.userId || null;
      if (userId) {
        queries.createCalculatorHistory.run(
          userId,
          'daily-risk',
          JSON.stringify({ sleep, exercise, water, sugar, stress }),
          JSON.stringify(result)
        );
        
        queries.createAuditLog.run(userId, 'calculator_use', 'daily-risk', null, req.ip);
      }

      res.json(addComplianceMetadata(result));
    } catch (error) {
      console.error("Daily risk calculator error:", error);
      res.status(500).json({ error: "Daily risk calculation failed" });
    }
  });

  app.post("/api/calculators/sugar", optionalAuth, async (req: AuthRequest, res) => {
    try {
      const { foodName, sugar } = req.body;
      
      if (!foodName || sugar === undefined || sugar < 0) {
        return res.status(400).json({ error: "Food name and sugar amount required" });
      }

      const meal = {
        name: foodName,
        sugar: parseFloat(sugar),
        time: new Date().toISOString(),
      };

      // Store in database if user is authenticated
      const userId = req.user?.userId || null;
      if (userId) {
        queries.createCalculatorHistory.run(
          userId,
          'sugar',
          JSON.stringify(meal),
          JSON.stringify({ logged: true })
        );
        
        queries.createAuditLog.run(userId, 'calculator_use', 'sugar', null, req.ip);
      }

      res.json(addComplianceMetadata({ success: true, meal }));
    } catch (error) {
      console.error("Sugar tracker error:", error);
      res.status(500).json({ error: "Sugar tracking failed" });
    }
  });

  // Get calculator history for authenticated user
  app.get("/api/calculators/history", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.userId;
      const history = queries.getCalculatorHistory.all(userId);
      res.json({ history });
    } catch (error) {
      console.error("Calculator history error:", error);
      res.status(500).json({ error: "Failed to fetch history" });
    }
  });

  // ============ Prediction Routes ============
  app.post("/api/predict", optionalAuth, async (req: AuthRequest, res) => {
    try {
      // Validate input
      const requiredFields = [
        "Pregnancies",
        "Glucose",
        "BloodPressure",
        "Insulin",
        "BMI",
        "DiabetesPedigreeFunction",
        "Age",
      ];

      for (const field of requiredFields) {
        if (req.body[field] === undefined || req.body[field] === null) {
          return res.status(400).json({ error: `Missing field: ${field}` });
        }
      }

      // Try to call Python backend
      try {
        const response = await axios.post(`${PYTHON_SERVICE_URL}/predict`, req.body);
        const predictionData = response.data;

        // Generate personalized recommendations
        const recommendations = generateRecommendations(req.body as PredictionInput, predictionData);
        const quickActions = getQuickActions(predictionData.risk_level);

        // Add recommendations to response
        const fullResponse = {
          ...predictionData,
          recommendations,
          quickActions,
        };

        // Store in database (if user is authenticated)
        const userId = req.user?.userId || null;
        try {
          queries.createPrediction.run(
            userId,
            JSON.stringify(req.body),
            predictionData.prediction,
            predictionData.probability,
            predictionData.risk_level,
            predictionData.confidence || predictionData.probability * 100,
            JSON.stringify({ recommendations, quickActions })
          );
        } catch (dbError) {
          console.error("Failed to store prediction:", dbError);
        }

        // Also push to in-memory for analytics
        pushPredictionEvent(req.body as PredictionInput, predictionData);

        // Audit log
        if (userId) {
          queries.createAuditLog.run(
            userId,
            "prediction",
            "ml_model",
            JSON.stringify(sanitizeForLog({ risk_level: predictionData.risk_level })),
            req.ip
          );
        }

        console.log("✓ Using ML model prediction from Python service");
        res.json(addComplianceMetadata(fullResponse));
      } catch (pythonError: any) {
        // If Python service is not available, return error with instructions
        console.error(
          "❌ Python service unavailable at",
          PYTHON_SERVICE_URL,
          "-",
          pythonError.message
        );

        return res.status(503).json({
          error: "ML prediction service unavailable",
          message:
            "The Python ML service is not running. Please ensure you have started it with: python predict_service.py",
          details: {
            serviceUrl: PYTHON_SERVICE_URL,
            instruction:
              "Start the Python service in a separate terminal before making predictions",
          },
        });
      }
    } catch (error) {
      console.error("Prediction error:", error);
      res.status(500).json({ error: "Prediction failed" });
    }
  });

  // Health check endpoint
  app.get("/api/health", async (req, res) => {
    try {
      const pythonHealth = await axios.get(`${PYTHON_SERVICE_URL}/health`);
      res.json({ backend: "ok", pythonService: pythonHealth.data });
    } catch {
      res.json({
        backend: "ok",
        pythonService: "unavailable (fallback mode active)",
      });
    }
  });

  // ============ Chatbot Routes ============
  app.post("/api/chat", optionalAuth, async (req: AuthRequest, res) => {
    try {
      const { sessionId, message } = req.body;

      if (!sessionId || !message) {
        return res.status(400).json({ error: "Session ID and message required" });
      }

      // Initialize Google Generative AI
      const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
      if (!apiKey) {
        console.warn("⚠️ No GEMINI_API_KEY or GOOGLE_API_KEY found in environment");
        return res.status(503).json({
          error: "AI service not configured",
          message: "Please set GEMINI_API_KEY or GOOGLE_API_KEY environment variable",
        });
      }

      const genAI = new GoogleGenerativeAI(apiKey, { apiVersion: "v1beta" });

      // Build conversation context
      let conversationHistory: any[] = [];
      
      const userId = req.user?.userId || null;
      
      try {
        const existingSession = db.prepare("SELECT * FROM chatbot_sessions WHERE session_id = ?").get(sessionId) as any;
        
        if (!existingSession) {
          // Create new session
          queries.createChatSession.run(userId, sessionId);
        }

        // Get recent messages from this session (last 10)
        conversationHistory = queries.getChatMessages.all(sessionId).slice(-10) as any[];
      } catch (dbError) {
        console.error("Database error in chat:", dbError);
      }

      // System prompt with medical safety guidelines
      const systemPrompt = `You are a helpful AI health assistant specializing in diabetes prevention, nutrition, and healthy lifestyle guidance. 

IMPORTANT GUIDELINES:
- Provide general health information and educational content only
- NEVER diagnose conditions or prescribe medications
- ALWAYS remind users to consult healthcare providers for medical advice
- Use evidence-based information from reputable sources
- Be empathetic and supportive
- If asked about emergency symptoms, advise seeking immediate medical attention
- Flag any potentially dangerous medical advice with a disclaimer

Your response should be concise (2-4 paragraphs), accurate, and helpful.`;

      // Build conversation context
      let prompt = systemPrompt + "\n\n";
      
      if (conversationHistory.length > 0) {
        prompt += "Previous conversation:\n";
        conversationHistory.forEach((msg: any) => {
          prompt += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`;
        });
        prompt += "\n";
      }

      prompt += `User: ${message}\n\nAssistant:`;

      // Generate response using Google Generative AI
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const responseText = response.text() || "I'm sorry, I couldn't generate a response. Please try again.";

      // Check for potential safety issues (simple keyword check)
      const flagged = /\b(prescribe|diagnose|medication dosage|stop taking|medical emergency)\b/i.test(message.toLowerCase());

      // Store messages in database
      try {
        queries.createChatMessage.run(sessionId, 'user', message, null, 0);
        queries.createChatMessage.run(sessionId, 'assistant', responseText, null, flagged ? 1 : 0);
        queries.updateSessionLastMessage.run(sessionId);
      } catch (dbError) {
        console.error("Failed to store chat messages:", dbError);
      }

      // Audit log
      if (userId) {
        queries.createAuditLog.run(
          userId,
          "chatbot_use",
          "ai_chatbot",
          JSON.stringify(sanitizeForLog({ messageLength: message.length })),
          req.ip
        );
      }

      res.json(addComplianceMetadata({
        response: responseText,
        flagged,
        sessionId,
      }));
    } catch (error: any) {
      console.error("Chatbot error:", error);
      
      if (error.message?.includes('API key')) {
        return res.status(503).json({
          error: "AI service configuration error",
          message: "Invalid or missing API key",
        });
      }

      res.status(500).json({ error: "Failed to generate response" });
    }
  });

  // Test endpoint to list available models
  app.get("/api/chat/models", async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
      if (!apiKey) {
        return res.status(503).json({ error: "API key not configured" });
      }

      // Call the REST API directly to list models
      const response = await axios.get(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
      );
      
      res.json({ 
        count: response.data.models?.length || 0,
        models: response.data.models?.map((m: any) => ({
          name: m.name,
          displayName: m.displayName,
          supportedMethods: m.supportedGenerationMethods
        })) || []
      });
    } catch (error: any) {
      console.error("Error listing models:", error);
      res.status(500).json({ error: error.response?.data || error.message });
    }
  });

  // Get chat history for authenticated user
  app.get("/api/chat/history", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.userId;
      const sessions = db.prepare(`
        SELECT DISTINCT cs.session_id, cs.started_at, cs.last_message_at
        FROM chatbot_sessions cs
        WHERE cs.user_id = ?
        ORDER BY cs.last_message_at DESC
        LIMIT 20
      `).all(userId);
      
      res.json({ sessions });
    } catch (error) {
      console.error("Chat history error:", error);
      res.status(500).json({ error: "Failed to fetch chat history" });
    }
  });

  // ============ Food Scanner Routes ============
  
  // Configure multer for image uploads
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed'));
      }
    }
  });

  app.post("/api/nutrition/scan", optionalAuth, upload.single('image'), async (req: AuthRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file uploaded" });
      }

      const userId = req.user?.userId || null;
      const imageBuffer = req.file.buffer;

      // Use Gemini Vision API to analyze the food image
      const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
      if (!apiKey) {
        return res.status(503).json({
          error: "AI service not configured",
          message: "Please set GEMINI_API_KEY to enable food scanning",
        });
      }

      const genAI = new GoogleGenerativeAI(apiKey, { apiVersion: "v1beta" });
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      // Convert image buffer to base64
      const base64Image = imageBuffer.toString("base64");
      const mimeType = req.file.mimetype || "image/jpeg";

      const prompt = `Analyze this food image and identify the food item(s). Return ONLY a valid JSON object with no markdown formatting, no code fences, and no extra text. Use this exact structure:
{
  "foodName": "name of the food",
  "calories": <number>,
  "carbs": <number in grams>,
  "protein": <number in grams>,
  "fat": <number in grams>,
  "fiber": <number in grams>,
  "sugar": <number in grams>,
  "sodium": <number in mg>
}

If there are multiple food items, combine them into one entry with totals.
If you cannot identify the food, use your best guess based on appearance.
Base nutrition values on a typical single serving size.
Return ONLY the JSON object, nothing else.`;

      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            mimeType,
            data: base64Image,
          },
        },
      ]);

      const responseText = result.response.text();

      // Parse the JSON response from Gemini
      let parsedNutrition;
      try {
        // Strip any markdown code fences if present
        const cleanJson = responseText.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
        parsedNutrition = JSON.parse(cleanJson);
      } catch (parseError) {
        console.error("Failed to parse Gemini response:", responseText);
        return res.status(500).json({
          error: "Failed to analyze food image",
          message: "AI could not parse nutrition data from the image",
        });
      }

      const nutritionData = {
        foodName: parsedNutrition.foodName || "Unknown Food",
        calories: Number(parsedNutrition.calories) || 0,
        carbs: Number(parsedNutrition.carbs) || 0,
        protein: Number(parsedNutrition.protein) || 0,
        fat: Number(parsedNutrition.fat) || 0,
        fiber: Number(parsedNutrition.fiber) || 0,
        sugar: Number(parsedNutrition.sugar) || 0,
        sodium: Number(parsedNutrition.sodium) || 0,
        confidence: 0.85,
      };

      // Store in nutrition_logs table if user is authenticated
      if (userId) {
        try {
          queries.logNutrition.run(
            userId,
            nutritionData.foodName,
            nutritionData.calories,
            nutritionData.protein,
            nutritionData.carbs,
            nutritionData.fat,
            nutritionData.sugar
          );
        } catch (dbError) {
          console.error("Database error logging nutrition:", dbError);
          // Continue anyway, don't fail the request
        }
      }

      res.json(addComplianceMetadata({
        nutrition: nutritionData,
      }));
    } catch (error: any) {
      console.error("Food scan error:", error);
      res.status(500).json({ error: error.message || "Failed to scan food" });
    }
  });

  // Get nutrition history
  app.get("/api/nutrition/history", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.userId;
      const limit = parseInt(req.query.limit as string) || 50;
      
      const history = db.prepare(`
        SELECT * FROM nutrition_logs
        WHERE user_id = ?
        ORDER BY logged_at DESC
        LIMIT ?
      `).all(userId, limit);
      
      res.json({ history });
    } catch (error) {
      console.error("Nutrition history error:", error);
      res.status(500).json({ error: "Failed to fetch nutrition history" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`Frontend Server running on http://localhost:${PORT}`);
    console.log(`Python prediction service: ${PYTHON_SERVICE_URL}`);
    console.log(`${"=".repeat(60)}\n`);
  });
}

startServer();
