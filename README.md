# Audiora - AI Personalized Podcast Platform

Audiora is a cutting-edge platform that generates personalized podcasts based on your interests, using advanced AI for script generation and high-quality TTS for audio.

## Features

- **AI Podcast Generation**: Create scripts in multiple languages (English, Telugu, etc.) with customizable tones.
- **Multi-Speaker Support**: Choose between single-host or conversational formats with distinct voices.
- **Social Discovery**: Follow other creators, share your podcasts to the global feed, and explore trending content.
- **Customizable Experience**: Dark mode, adjustable playback speed, and personalized niche categories.
- **Messaging & Notifications**: Stay connected with other creators through direct messages and real-time alerts.

## Project Structure

- `/src`: Frontend React application (Vite, Tailwind CSS, shadcn/ui).
- `/server`: Node.js backend for AI script generation and TTS processing.
- `/supabase`: Database migrations and configuration.

## Getting Started

### Prerequisites

- Node.js & npm
- Supabase account
- AI Provider API Keys (Gemini, OpenRouter)

### Local Development

1. **Clone the repository**:
   ```sh
   git clone <YOUR_GIT_URL>
   cd audiora-ai
   ```

2. **Install dependencies**:
   ```sh
   npm install
   cd server && npm install
   ```

3. **Set up Environment Variables**:
   Create a `.env` file in both the root and `/server` directories with your Supabase and API credentials.

4. **Start the Frontend**:
   ```sh
   npm run dev
   ```

5. **Start the Backend**:
   ```sh
   cd server
   npm run dev
   ```

## Technologies Used

- **Frontend**: Vite, React, TypeScript, Tailwind CSS, shadcn-ui, Supabase Client.
- **Backend**: Node.js, Express, Google Generative AI (Gemini), Microsoft Edge TTS.
- **Database**: Supabase (PostgreSQL) with Row-Level Security (RLS).

## Deployment

The frontend can be deployed to platforms like Vercel or Netlify. The backend can be hosted on Render, Heroku, or any Node.js compatible environment.
