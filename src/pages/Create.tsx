import { useState } from "react";
import { 
  Mic, 
  FileText, 
  Upload, 
  Globe, 
  Clock, 
  Sparkles,
  Play,
  Download,
  Share2,
  ChevronRight,
  Check,
  Loader2,
  X,
  FileUp
} from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Waveform from "@/components/audio/Waveform";

type InputType = "topic" | "content" | "file";
type GenerationStep = "input" | "options" | "generating" | "complete";

const Create = () => {
  const [inputType, setInputType] = useState<InputType>("topic");
  const [topic, setTopic] = useState("");
  const [content, setContent] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [outputLanguage, setOutputLanguage] = useState("en");
  const [duration, setDuration] = useState("medium");
  const [tone, setTone] = useState("conversational");
  const [step, setStep] = useState<GenerationStep>("input");
  const [progress, setProgress] = useState(0);

  const languages = [
    { code: "en", name: "English" },
    { code: "es", name: "Spanish" },
    { code: "fr", name: "French" },
    { code: "de", name: "German" },
    { code: "pt", name: "Portuguese" },
    { code: "it", name: "Italian" },
    { code: "ja", name: "Japanese" },
    { code: "ko", name: "Korean" },
    { code: "zh", name: "Chinese" },
    { code: "ar", name: "Arabic" },
    { code: "hi", name: "Hindi" },
    { code: "ru", name: "Russian" },
  ];

  const durations = [
    { value: "short", label: "Short", time: "5-10 min" },
    { value: "medium", label: "Medium", time: "15-20 min" },
    { value: "long", label: "Long", time: "30-45 min" },
  ];

  const tones = [
    { value: "educational", label: "Educational", description: "Informative and structured" },
    { value: "conversational", label: "Conversational", description: "Casual and engaging" },
    { value: "storytelling", label: "Storytelling", description: "Narrative and immersive" },
    { value: "professional", label: "Professional", description: "Formal and authoritative" },
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
  };

  const canProceed = () => {
    if (inputType === "topic") return topic.trim().length > 10;
    if (inputType === "content") return content.trim().length > 50;
    if (inputType === "file") return uploadedFile !== null;
    return false;
  };

  const handleGenerate = () => {
    setStep("generating");
    // Simulate generation progress
    let prog = 0;
    const interval = setInterval(() => {
      prog += Math.random() * 15;
      if (prog >= 100) {
        prog = 100;
        setProgress(100);
        setTimeout(() => setStep("complete"), 500);
        clearInterval(interval);
      } else {
        setProgress(prog);
      }
    }, 500);
  };

  const renderInputStep = () => (
    <div className="animate-fade-in">
      <div className="text-center mb-8">
        <h1 className="font-display text-3xl sm:text-4xl font-bold mb-3">
          Create Your Podcast
        </h1>
        <p className="text-muted-foreground">
          Start with a topic, paste content, or upload a document
        </p>
      </div>

      <Tabs value={inputType} onValueChange={(v) => setInputType(v as InputType)} className="w-full">
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="topic" className="gap-2">
            <Mic className="w-4 h-4" />
            <span className="hidden sm:inline">Topic</span>
          </TabsTrigger>
          <TabsTrigger value="content" className="gap-2">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Content</span>
          </TabsTrigger>
          <TabsTrigger value="file" className="gap-2">
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Upload</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="topic" className="space-y-4">
          <div className="glass-card p-6">
            <Label htmlFor="topic" className="text-base font-medium mb-3 block">
              What's your podcast about?
            </Label>
            <Textarea
              id="topic"
              placeholder="e.g., The future of renewable energy and how it will transform our daily lives..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="min-h-[120px] bg-secondary/50 border-border resize-none"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Minimum 10 characters. Be descriptive for better results.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="content" className="space-y-4">
          <div className="glass-card p-6">
            <Label htmlFor="content" className="text-base font-medium mb-3 block">
              Paste your content
            </Label>
            <Textarea
              id="content"
              placeholder="Paste an article, blog post, research paper, or any text you want to turn into a podcast..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[200px] bg-secondary/50 border-border resize-none"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Minimum 50 characters. The AI will detect the language automatically.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="file" className="space-y-4">
          <div className="glass-card p-6">
            {!uploadedFile ? (
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl p-12 cursor-pointer hover:border-primary/50 transition-colors">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <FileUp className="w-8 h-8 text-primary" />
                </div>
                <p className="font-medium mb-1">Drop your file here or click to upload</p>
                <p className="text-sm text-muted-foreground">
                  Supports PDF, DOCX, TXT (max 10MB)
                </p>
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.docx,.doc,.txt"
                  onChange={handleFileUpload}
                />
              </label>
            ) : (
              <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{uploadedFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={removeFile}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end mt-6">
        <Button
          variant="hero"
          size="lg"
          disabled={!canProceed()}
          onClick={() => setStep("options")}
          className="gap-2"
        >
          Continue
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );

  const renderOptionsStep = () => (
    <div className="animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="font-display text-2xl sm:text-3xl font-bold mb-3">
          Customize Your Podcast
        </h2>
        <p className="text-muted-foreground">
          Select language, duration, and tone
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {/* Language */}
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-5 h-5 text-primary" />
            <Label className="text-base font-medium">Output Language</Label>
          </div>
          <Select value={outputLanguage} onValueChange={setOutputLanguage}>
            <SelectTrigger className="bg-secondary/50">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              {languages.map((lang) => (
                <SelectItem key={lang.code} value={lang.code}>
                  {lang.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Duration */}
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-primary" />
            <Label className="text-base font-medium">Duration</Label>
          </div>
          <div className="space-y-2">
            {durations.map((d) => (
              <button
                key={d.value}
                onClick={() => setDuration(d.value)}
                className={cn(
                  "w-full flex items-center justify-between p-3 rounded-lg border transition-all",
                  duration === d.value
                    ? "border-primary bg-primary/10"
                    : "border-border bg-secondary/30 hover:bg-secondary/50"
                )}
              >
                <span className="font-medium">{d.label}</span>
                <span className="text-sm text-muted-foreground">{d.time}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tone */}
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-primary" />
            <Label className="text-base font-medium">Tone</Label>
          </div>
          <div className="space-y-2">
            {tones.map((t) => (
              <button
                key={t.value}
                onClick={() => setTone(t.value)}
                className={cn(
                  "w-full text-left p-3 rounded-lg border transition-all",
                  tone === t.value
                    ? "border-primary bg-primary/10"
                    : "border-border bg-secondary/30 hover:bg-secondary/50"
                )}
              >
                <span className="font-medium block">{t.label}</span>
                <span className="text-xs text-muted-foreground">{t.description}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="ghost" onClick={() => setStep("input")}>
          Back
        </Button>
        <Button variant="hero" size="lg" onClick={handleGenerate} className="gap-2">
          <Sparkles className="w-4 h-4" />
          Generate Podcast
        </Button>
      </div>
    </div>
  );

  const renderGeneratingStep = () => (
    <div className="animate-fade-in text-center py-12">
      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
      <h2 className="font-display text-2xl font-bold mb-3">
        Creating Your Podcast
      </h2>
      <p className="text-muted-foreground mb-8 max-w-md mx-auto">
        Our AI is analyzing your content and generating an engaging podcast script...
      </p>

      <div className="max-w-md mx-auto mb-4">
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      <p className="text-sm text-muted-foreground">{Math.round(progress)}% complete</p>

      <div className="flex justify-center mt-8">
        <Waveform isPlaying barCount={15} className="h-12" />
      </div>
    </div>
  );

  const renderCompleteStep = () => (
    <div className="animate-fade-in">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-green-500" />
        </div>
        <h2 className="font-display text-2xl font-bold mb-2">
          Podcast Ready!
        </h2>
        <p className="text-muted-foreground">
          Your podcast has been generated successfully
        </p>
      </div>

      <div className="glass-card p-6 mb-8">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center shrink-0">
            <Mic className="w-10 h-10 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <Badge className="mb-2">Generated</Badge>
            <h3 className="font-display text-xl font-bold mb-1">
              The Future of Renewable Energy
            </h3>
            <p className="text-muted-foreground mb-2">
              A comprehensive look at sustainable power solutions
            </p>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                18:24
              </span>
              <span className="flex items-center gap-1">
                <Globe className="w-4 h-4" />
                English
              </span>
            </div>
          </div>
        </div>

        {/* Audio Player */}
        <div className="bg-secondary/50 rounded-xl p-4">
          <div className="flex items-center gap-4 mb-3">
            <Button variant="hero" size="icon-lg">
              <Play className="w-5 h-5 ml-0.5" />
            </Button>
            <div className="flex-1">
              <Waveform isPlaying={false} barCount={30} className="h-10" />
            </div>
            <span className="text-sm text-muted-foreground">0:00 / 18:24</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <Button variant="hero" size="lg" className="flex-1 gap-2">
          <Download className="w-4 h-4" />
          Download Audio
        </Button>
        <Button variant="glass" size="lg" className="flex-1 gap-2">
          <Share2 className="w-4 h-4" />
          Share to Feed
        </Button>
      </div>

      <div className="text-center mt-8">
        <Button
          variant="ghost"
          onClick={() => {
            setStep("input");
            setTopic("");
            setContent("");
            setUploadedFile(null);
            setProgress(0);
          }}
        >
          Create Another Podcast
        </Button>
      </div>
    </div>
  );

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-12">
          {["input", "options", "generating", "complete"].map((s, i) => {
            const steps = ["input", "options", "generating", "complete"];
            const currentIndex = steps.indexOf(step);
            const stepIndex = i;
            const isActive = stepIndex <= currentIndex;
            const isCurrent = s === step;

            return (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground",
                    isCurrent && "ring-2 ring-primary/50"
                  )}
                >
                  {stepIndex < currentIndex ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    i + 1
                  )}
                </div>
                {i < 3 && (
                  <div
                    className={cn(
                      "w-12 h-0.5 rounded",
                      stepIndex < currentIndex ? "bg-primary" : "bg-secondary"
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Step Content */}
        {step === "input" && renderInputStep()}
        {step === "options" && renderOptionsStep()}
        {step === "generating" && renderGeneratingStep()}
        {step === "complete" && renderCompleteStep()}
      </div>
    </Layout>
  );
};

export default Create;
