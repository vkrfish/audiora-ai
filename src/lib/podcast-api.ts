import { supabase } from '@/integrations/supabase/client';

const FUNCTIONS_URL = import.meta.env.VITE_SUPABASE_URL;

interface GeneratePodcastParams {
  inputType: 'topic' | 'content' | 'file';
  topic?: string;
  content?: string;
  fileContent?: string;
  outputLanguage: string;
  duration: 'short' | 'medium' | 'long';
  tone: 'educational' | 'conversational' | 'storytelling' | 'professional';
}

interface PodcastScript {
  title: string;
  description: string;
  language: string;
  estimatedDuration: number;
  chapters: {
    title: string;
    content: string;
    durationSeconds: number;
  }[];
  fullScript: string;
  tags: string[];
}

export const generatePodcast = async (params: GeneratePodcastParams): Promise<PodcastScript> => {
  const { data, error } = await supabase.functions.invoke('generate-podcast', {
    body: params,
  });

  if (error) {
    throw new Error(error.message || 'Failed to generate podcast');
  }

  if (data.error) {
    throw new Error(data.error);
  }

  return data;
};

export const generateAudio = async (text: string, language: string = 'en'): Promise<{ audioContent: string; mimeType: string }> => {
  const { data, error } = await supabase.functions.invoke('text-to-speech', {
    body: { text, language },
  });

  if (error) {
    throw new Error(error.message || 'Failed to generate audio');
  }

  if (data.error) {
    throw new Error(data.error);
  }

  return data;
};

export const readFileContent = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === 'string') {
        resolve(result);
      } else {
        reject(new Error('Failed to read file'));
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    
    // For text files, read as text
    if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
      reader.readAsText(file);
    } else {
      // For PDF and DOCX, we'll just read as text for now
      // In production, you'd want to use a proper parser
      reader.readAsText(file);
    }
  });
};
