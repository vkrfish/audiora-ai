import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type InputType = "topic" | "content" | "file" | "record";
type GenerationStep = "input" | "options" | "generating" | "review" | "complete";

interface GeneratedPodcast {
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
    audioContent?: string;
    audioMimeType?: string;
}

interface CreationState {
    inputType: InputType;
    topic: string;
    content: string;
    outputLanguage: string;
    podcastType: "solo" | "conversation";
    duration: "short" | "medium" | "long";
    tone: "educational" | "conversational" | "storytelling" | "professional";
    voice: string;
    voice2: string;
    niche: string;
    step: GenerationStep;
    progress: number;
    progressText: string;
    generatedPodcast: GeneratedPodcast | null;
    editableScript: string;
    coverPreview: string | null;
    extractedText: string;
    uploadedFileName: string;
}

interface CreationContextType extends CreationState {
    setInputType: (type: InputType) => void;
    setTopic: (topic: string) => void;
    setContent: (content: string) => void;
    setOutputLanguage: (lang: string) => void;
    setPodcastType: (type: "solo" | "conversation") => void;
    setDuration: (duration: "short" | "medium" | "long") => void;
    setTone: (tone: "educational" | "conversational" | "storytelling" | "professional") => void;
    setVoice: (voice: string) => void;
    setVoice2: (voice: string) => void;
    setNiche: (niche: string) => void;
    setStep: (step: GenerationStep) => void;
    setProgress: (progress: number) => void;
    setProgressText: (text: string) => void;
    setGeneratedPodcast: (podcast: GeneratedPodcast | null) => void;
    setEditableScript: (script: string) => void;
    setCoverPreview: (preview: string | null) => void;
    setExtractedText: (text: string) => void;
    setUploadedFileName: (name: string) => void;
    resetProgress: () => void;
    prevStep: () => void;
}

const initialState: CreationState = {
    inputType: "topic",
    topic: "",
    content: "",
    outputLanguage: "en",
    podcastType: "solo",
    duration: "medium",
    tone: "conversational",
    voice: "en-US-AvaMultilingualNeural",
    voice2: "en-US-AndrewMultilingualNeural",
    niche: "technology",
    step: "input",
    progress: 0,
    progressText: "",
    generatedPodcast: null,
    editableScript: "",
    coverPreview: null,
    extractedText: "",
    uploadedFileName: "",
};

const CreationContext = createContext<CreationContextType | undefined>(undefined);

const STORAGE_KEY = "audiora_creation_progress";

export const CreationProvider = ({ children }: { children: ReactNode }) => {
    const [state, setState] = useState<CreationState>(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error("Failed to parse saved creation progress", e);
            }
        }
        return initialState;
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }, [state]);

    const updateState = (updates: Partial<CreationState>) => {
        setState((prev) => ({ ...prev, ...updates }));
    };

    const setInputType = (inputType: InputType) => updateState({ inputType });
    const setTopic = (topic: string) => updateState({ topic });
    const setContent = (content: string) => updateState({ content });
    const setOutputLanguage = (outputLanguage: string) => updateState({ outputLanguage });
    const setPodcastType = (podcastType: "solo" | "conversation") => updateState({ podcastType });
    const setDuration = (duration: "short" | "medium" | "long") => updateState({ duration });
    const setTone = (tone: "educational" | "conversational" | "storytelling" | "professional") => updateState({ tone });
    const setVoice = (voice: string) => updateState({ voice });
    const setVoice2 = (voice2: string) => updateState({ voice2 });
    const setNiche = (niche: string) => updateState({ niche });
    const setStep = (step: GenerationStep) => updateState({ step });
    const setProgress = (progress: number) => updateState({ progress });
    const setProgressText = (progressText: string) => updateState({ progressText });
    const setGeneratedPodcast = (generatedPodcast: GeneratedPodcast | null) => updateState({ generatedPodcast });
    const setEditableScript = (editableScript: string) => updateState({ editableScript });
    const setCoverPreview = (coverPreview: string | null) => updateState({ coverPreview });
    const setExtractedText = (extractedText: string) => updateState({ extractedText });
    const setUploadedFileName = (uploadedFileName: string) => updateState({ uploadedFileName });

    const resetProgress = () => {
        setState(initialState);
        localStorage.removeItem(STORAGE_KEY);
    };

    const prevStep = () => {
        const standardSteps: GenerationStep[] = ["input", "options", "generating", "review", "complete"];
        const fileSteps: GenerationStep[] = ["input", "generating", "review", "complete"];

        const steps = state.inputType === "file" ? fileSteps : standardSteps;
        const currentIndex = steps.indexOf(state.step);

        if (currentIndex > 0) {
            setStep(steps[currentIndex - 1]);
        }
    };

    return (
        <CreationContext.Provider
            value={{
                ...state,
                setInputType,
                setTopic,
                setContent,
                setOutputLanguage,
                setPodcastType,
                setDuration,
                setTone,
                setVoice,
                setVoice2,
                setNiche,
                setStep,
                setProgress,
                setProgressText,
                setGeneratedPodcast,
                setEditableScript,
                setCoverPreview,
                setExtractedText,
                setUploadedFileName,
                resetProgress,
                prevStep,
            }}
        >
            {children}
        </CreationContext.Provider>
    );
};

export const useCreation = () => {
    const context = useContext(CreationContext);
    if (context === undefined) {
        throw new Error("useCreation must be used within a CreationProvider");
    }
    return context;
};
