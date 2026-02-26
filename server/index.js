import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fetch from 'node-fetch';
import { execFile } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { supabase } from './supabase.js';
import multer from 'multer';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Set up storage for voice samples
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `${req.user.id}_${Date.now()}_${file.originalname}`);
    }
});

const upload = multer({ storage: storage });

// Path to python executable in venv
const pythonPath = path.join(__dirname, 'venv', 'Scripts', 'python.exe');
const clonedVoicesDir = path.join(__dirname, 'cloned_voices');

// Auth middleware
const requireAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    console.log(`[AUTH DEBUG] Request to ${req.path}`);
    console.log(`[AUTH DEBUG] Authorization header prefix:`, authHeader ? authHeader.substring(0, 20) : 'MISSING');

    if (!authHeader) {
        return res.status(401).json({ error: 'Missing Authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');
    console.log(`[AUTH DEBUG] Token extracted, length: ${token.length}`);

    // Explicitly check the token against Supabase
    const { data, error } = await supabase.auth.getUser(token);

    if (error) {
        console.error("[AUTH DEBUG] getUser error:", error);
    }

    if (error || !data?.user) {
        console.error("[AUTH ERROR] requireAuth failed:", error?.message || "No user found");
        return res.status(401).json({ error: error?.message || 'Invalid or expired token' });
    }

    console.log(`[AUTH DEBUG] User authenticated successfully: ${data.user.id}`);
    req.user = data.user;
    next();
};

// Initialize Google SDK for Audio (Gemini 2.0 Flash)
const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY);

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
                model: "google/gemini-2.0-flash-001",
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
            console.error('OpenRouter error:', data);
            return res.status(response.status).json({ error: data.error?.message || 'OpenRouter API error' });
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
        execFile(pythonPath, [pythonScript, JSON.stringify(payload)], { maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
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

// Endpoint to clone a voice locally
app.post('/api/clone-voice', requireAuth, upload.single('sample'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No audio sample uploaded' });
        }

        const speakerName = req.body.name || `voice_${req.user.id}`;
        const referenceAudioPath = req.file.path;
        const cloningScript = path.join(__dirname, 'clone_voice.py');

        console.log(`Cloning voice for user ${req.user.id} with name ${speakerName}`);

        execFile(pythonPath, [cloningScript, referenceAudioPath, clonedVoicesDir, req.user.id], (error, stdout, stderr) => {
            if (error) {
                console.error('Cloning script execution error:', stderr);
                return res.status(500).json({ error: 'Cloning process failed', details: stderr });
            }

            try {
                const result = JSON.parse(stdout.trim());
                res.json(result);
            } catch (parseError) {
                console.error('Failed to parse cloning script output:', stdout);
                res.status(500).json({ error: 'Invalid response from cloning script' });
            } finally {
                // Cleanup uploaded file
                fs.unlink(referenceAudioPath, (err) => {
                    if (err) console.error('Error deleting temp file:', err);
                });
            }
        });
    } catch (error) {
        console.error('Clone voice error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Endpoint to list cloned voices for the user
app.get('/api/voices', requireAuth, async (req, res) => {
    try {
        const files = await fs.promises.readdir(clonedVoicesDir);
        const userVoices = files
            .filter(f => f.startsWith(`${req.user.id}_`) && f.endsWith('_se.pth'))
            .map(f => ({
                id: f.replace('_se.pth', ''),
                name: 'My Cloned Voice', // In a real app, we'd store the name in DB
                type: 'cloned'
            }));

        res.json(userVoices);
    } catch (error) {
        console.error('Error listing voices:', error);
        res.status(500).json({ error: error.message });
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
