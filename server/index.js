import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fetch from 'node-fetch';
import { execFile, execFileSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { supabase } from './supabase.js';
import multer from 'multer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Log ALL requests early
app.use((req, res, next) => {
    const startTime = Date.now();
    const size = req.headers['content-length'];
    console.log(`[${new Date().toISOString()}] INCOMING: ${req.method} ${req.url} - Size: ${size || 'unknown'} bytes`);

    // Log when response is finished
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        console.log(`[${new Date().toISOString()}] OUTGOING: ${req.method} ${req.url} - Status: ${res.statusCode} - Duration: ${duration}ms`);
    });

    next();
});

app.use(cors());
app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ limit: '200mb', extended: true }));

// Configure Multer for file uploads (disk storage for Python access)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 200 * 1024 * 1024 } // 200MB limit
});

// Auth middleware
const requireAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        console.warn(`[${new Date().toISOString()}] AUTH FAILED: No Authorization header for ${req.url}`);
        return res.status(401).json({ error: 'Missing Authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
        console.warn(`[${new Date().toISOString()}] AUTH FAILED: Invalid token for ${req.url}. Error: ${error?.message || 'No user found'}`);
        return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.user = user;
    next();
};

// Initialize Google SDK for Audio (Gemini 2.0 Flash)
const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY);

// New endpoint to parse PDF/DOCX files using Python
app.post('/api/parse-file', requireAuth, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const filePath = req.file.path;
        console.log(`[${new Date().toISOString()}] Parsing file with Python: ${req.file.originalname} (${req.file.mimetype})`);

        // Execute the python parser script
        execFile('python', ['parse_document.py', filePath], { maxBuffer: 50 * 1024 * 1024 }, (error, stdout, stderr) => {
            // Delete temp file after parsing
            try { fs.unlinkSync(filePath); } catch (e) { console.error('Failed to delete temp file:', e); }

            if (error) {
                console.error('Python Parsing error:', stderr);
                return res.status(500).json({ error: 'Failed to extract text: ' + stderr });
            }

            const extractedText = stdout.trim();
            if (!extractedText) {
                return res.status(400).json({ error: 'Could not extract any text from this file.' });
            }

            console.log(`[${new Date().toISOString()}] Successfully extracted ${extractedText.length} characters.`);
            res.json({ text: extractedText });
        });
    } catch (error) {
        console.error('File parsing error:', error);
        res.status(500).json({ error: 'Failed to parse file: ' + error.message });
    }
});

// Endpoint to generate podcast script using OpenRouter (Step 3.5 Flash)
app.post('/api/generate-script', requireAuth, async (req, res) => {
    const startTime = Date.now();
    try {
        const { systemPrompt, userPrompt } = req.body;
        console.log(`[${new Date().toISOString()}] Incoming script generation request.`);
        console.log(`System Prompt (first 100 chars): ${systemPrompt.substring(0, 100)}...`);
        console.log(`User Prompt (first 100 chars): ${userPrompt.substring(0, 100)}...`);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                "HTTP-Referer": "https://github.com/vkrfish/audiora-ai",
                "X-Title": "Audiora AI",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "openai/gpt-4o-mini",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt }
                ]
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        const data = await response.json();

        if (!response.ok) {
            console.error(`[${new Date().toISOString()}] OpenRouter error (${response.status}):`, JSON.stringify(data, null, 2));
            return res.status(response.status).json({
                error: data.error?.message || 'OpenRouter API error',
                details: data
            });
        }

        const text = data.choices[0].message.content;
        const duration = (Date.now() - startTime) / 1000;
        console.log(`Raw AI Response received in ${duration}s.`);

        // Robust JSON extraction: Find the first '{' and last '}'
        const firstBrace = text.indexOf('{');
        const lastBrace = text.lastIndexOf('}');

        if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) {
            console.error('No JSON object found in AI response:', text);
            return res.status(500).json({ error: 'AI did not return a valid JSON script format' });
        }

        const cleanedText = text.substring(firstBrace, lastBrace + 1);

        try {
            const script = JSON.parse(cleanedText);
            res.json(script);
        } catch (parseError) {
            console.error('Failed to parse AI response. Cleaned text snippet:', cleanedText.substring(0, 100) + '...');
            console.error('Parse Error:', parseError.message);
            res.status(500).json({ error: 'Failed to parse podcast script' });
        }
    } catch (error) {
        if (error.name === 'AbortError') {
            console.error('Script generation timed out after 120s.');
            return res.status(504).json({ error: 'Request timed out. Please try again with a shorter duration.' });
        }
        console.error('Script generation error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Endpoint to generate audio (TTS) using Edge TTS (via Python bridge)
app.post('/api/generate-audio', requireAuth, async (req, res) => {
    try {
        const { text, voice = 'en-US-AvaMultilingualNeural', voice2, language } = req.body;
        console.log('Generating audio with Edge TTS. Conversational:', !!voice2);

        // Path to our python bridge script
        const pythonScript = path.join(__dirname, 'generate_audio.py');

        // If it's conversational, we need to parse segments
        const segments = [];
        if (voice2) {
            const lines = text.split('\n');
            let currentSpeaker = 'Host';
            let currentText = '';

            for (const line of lines) {
                const hostMatch = line.match(/^Host:\s*(.*)/i);
                const guestMatch = line.match(/^Guest:\s*(.*)/i);

                if (hostMatch) {
                    if (currentText) segments.push({ speaker: currentSpeaker, text: currentText.trim() });
                    currentSpeaker = 'Host';
                    currentText = hostMatch[1];
                } else if (guestMatch) {
                    if (currentText) segments.push({ speaker: currentSpeaker, text: currentText.trim() });
                    currentSpeaker = 'Guest';
                    currentText = guestMatch[1];
                } else {
                    currentText += ' ' + line;
                }
            }
            if (currentText) segments.push({ speaker: currentSpeaker, text: currentText.trim() });
        } else {
            segments.push({ speaker: 'Host', text: text });
        }

        // Filter out empty segments
        const validSegments = segments.filter(s => s.text.trim().length > 0);

        // Map segments to voices
        const payload = validSegments.map(s => ({
            text: s.text,
            voice: s.speaker === 'Guest' ? voice2 : voice
        }));

        // Execute the python script with the JSON payload
        execFile('python', [pythonScript, JSON.stringify(payload)], { maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
            if (error) {
                console.error('Edge TTS Execution error:', stderr);
                return res.status(500).json({ error: 'Audio generation process failed', details: stderr });
            }

            const base64Data = stdout.trim();
            if (!base64Data) {
                return res.status(500).json({ error: 'No audio data received from process' });
            }

            res.json({
                audioContent: base64Data,
                mimeType: 'audio/mp3'
            });
        });
    } catch (error) {
        console.error('Audio generation error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Global Error Handler
app.use((err, req, res, next) => {
    if (err) {
        console.error(`[${new Date().toISOString()}] SERVER ERROR (${err.status || 500}): ${err.message}`);
        if (err.status === 413) {
            console.error('Payload too large! Current limits: JSON/URL 100mb, Multer 100mb');
        }
        res.status(err.status || 500).json({ error: err.message });
    } else {
        next();
    }
});

app.listen(port, () => {
    console.log(`Backend server running at http://localhost:${port}`);
    console.log(`OpenRouter Key Loaded: ${process.env.OPENROUTER_API_KEY ? 'Yes' : 'No'}`);
    if (process.env.OPENROUTER_API_KEY) {
        console.log(`OpenRouter Key Prefix: ${process.env.OPENROUTER_API_KEY.substring(0, 10)}`);
    }
    console.log(`Gemini Key Loaded: ${process.env.VITE_GEMINI_API_KEY ? 'Yes' : 'No'}`);
    if (process.env.VITE_GEMINI_API_KEY) {
        console.log(`Gemini Key Prefix: ${process.env.VITE_GEMINI_API_KEY.substring(0, 10)}`);
        console.log(`Gemini Key Length: ${process.env.VITE_GEMINI_API_KEY.length}`);
    }
});
