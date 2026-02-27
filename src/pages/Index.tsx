import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Play,
  Mic,
  FileText,
  Globe,
  Zap,
  Users,
  Sparkles,
  ArrowRight,
  Headphones,
  Radio,
  MessageSquare,
  Music2,
  Volume2,
  Music
} from "lucide-react";
import Layout from "@/components/layout/Layout";
import Waveform from "@/components/audio/Waveform";
import PodcastCard from "@/components/cards/PodcastCard";
import CreatorCard from "@/components/cards/CreatorCard";

const Index = () => {
  const features = [
    {
      icon: Mic,
      title: "AI Podcast Generation",
      description: "Enter a topic, paste content, or upload documents. Our AI creates engaging podcast scripts instantly."
    },
    {
      icon: Globe,
      title: "Multi-Language Support",
      description: "Generate podcasts in 30+ languages. Input in one language, output in another seamlessly."
    },
    {
      icon: Radio,
      title: "Audio Social Feed",
      description: "Discover, share, and engage with audio content in a social-first experience."
    },
    {
      icon: Sparkles,
      title: "Smart Recommendations",
      description: "Personalized content discovery based on your listening habits and interests."
    }
  ];

  const samplePodcasts = [
    {
      title: "The Future of Sustainable Tech",
      creator: "Green Innovations",
      coverUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=400&fit=crop",
      duration: "18:42",
      likes: 1247
    },
    {
      title: "Mastering Remote Work",
      creator: "Career Boost",
      coverUrl: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=400&fit=crop",
      duration: "24:15",
      likes: 892
    },
    {
      title: "AI in Creative Industries",
      creator: "Tech Forward",
      coverUrl: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=400&fit=crop",
      duration: "32:08",
      likes: 2341
    },
    {
      title: "Mindfulness for Busy People",
      creator: "Zen Space",
      coverUrl: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&h=400&fit=crop",
      duration: "15:33",
      likes: 1876
    }
  ];

  const topCreators = [
    {
      name: "Sarah Chen",
      username: "sarahtalks",
      avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
      category: "Technology",
      followers: 125000,
      totalListens: 4500000,
      isVerified: true
    },
    {
      name: "Marcus Johnson",
      username: "marcuspod",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
      category: "Business",
      followers: 89000,
      totalListens: 2800000,
      isVerified: true
    },
    {
      name: "Elena Rodriguez",
      username: "elenavoice",
      avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop",
      category: "Lifestyle",
      followers: 156000,
      totalListens: 5200000,
      isVerified: true
    }
  ];

  return (
    <Layout hideNav>
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* ── Rich glossy background ── */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Base gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#020d0b] via-[#050505] to-[#0d0805]" />

          {/* Primary teal glow — top left */}
          <div className="absolute -top-32 -left-32 w-[700px] h-[700px] bg-[#3DDABA]/12 rounded-full blur-[160px] animate-pulse" style={{ animationDuration: '5s' }} />
          {/* Orange accent — bottom right */}
          <div className="absolute -bottom-40 -right-20 w-[600px] h-[600px] bg-[#F19861]/10 rounded-full blur-[140px] animate-pulse" style={{ animationDuration: '7s', animationDelay: '1s' }} />
          {/* Purple mid accent */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#7B5EA7]/8 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '9s', animationDelay: '2s' }} />
          {/* Small teal top-right */}
          <div className="absolute top-10 right-1/4 w-72 h-72 bg-[#3DDABA]/8 rounded-full blur-[80px] animate-pulse" style={{ animationDuration: '6s', animationDelay: '0.5s' }} />

          {/* Radial shimmer center */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_40%,rgba(61,218,186,0.07)_0%,transparent_70%)]" />

          {/* Subtle mesh grid */}
          <div className="absolute inset-0 opacity-[0.018]" style={{ backgroundImage: 'linear-gradient(rgba(61,218,186,1) 1px,transparent 1px),linear-gradient(90deg,rgba(61,218,186,1) 1px,transparent 1px)', backgroundSize: '60px 60px' }} />

          {/* Light shafts */}
          <div className="absolute top-0 left-1/3 w-px h-full bg-gradient-to-b from-[#3DDABA]/20 via-transparent to-transparent" />
          <div className="absolute top-0 right-1/3 w-px h-full bg-gradient-to-b from-[#F19861]/12 via-transparent to-transparent" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#3DDABA]/20 to-transparent" />

          {/* Floating icons */}
          {[
            { Icon: Headphones, top: '8%', left: '6%', size: 40, dur: 8, delay: 0, rot: -12 },
            { Icon: Mic, top: '12%', right: '8%', size: 32, dur: 6.5, delay: 1, rot: 8 },
            { Icon: Radio, top: '65%', left: '4%', size: 36, dur: 9, delay: 0.5, rot: 15 },
            { Icon: Music2, top: '75%', right: '6%', size: 28, dur: 7, delay: 2, rot: -8 },
            { Icon: Sparkles, top: '30%', left: '2%', size: 24, dur: 5.5, delay: 1.5, rot: 6 },
            { Icon: Volume2, top: '45%', right: '3%', size: 30, dur: 8.5, delay: 0.8, rot: -15 },
            { Icon: Zap, top: '20%', left: '18%', size: 22, dur: 6, delay: 2.5, rot: 10 },
            { Icon: Music, top: '80%', left: '22%', size: 26, dur: 7.5, delay: 1.2, rot: -6 },
          ].map(({ Icon, top, left, right, size, dur, delay, rot }, i) => (
            <div
              key={i}
              className="absolute text-primary/[0.07] pointer-events-none"
              style={{
                top, left, right,
                animation: `float-icon ${dur}s ease-in-out ${delay}s infinite alternate`,
              }}
            >
              <Icon style={{ width: size, height: size, transform: `rotate(${rot}deg)` }} />
            </div>
          ))}
        </div>

        <style>{`
          @keyframes float-icon {
            0%   { transform: translateY(0px) scale(1); }
            100% { transform: translateY(-18px) scale(1.06); }
          }
        `}</style>

        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Logo */}
            <div className="flex items-center justify-center gap-3 mb-8 animate-fade-in">
              <div className="w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow">
                <Headphones className="w-7 h-7 text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-3xl gradient-text">
                Audiora
              </span>
            </div>

            {/* Headline */}
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 animate-fade-in-up">
              Turn Any Content Into{" "}
              <span className="gradient-text">Captivating Podcasts</span>
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              AI-powered podcast generation meets audio social media. Create, discover, and share audio content in any language.
            </p>

            {/* Waveform decoration */}
            <div className="flex justify-center mb-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="flex items-center gap-1 h-8">
                {[...Array(15)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1.5 bg-gradient-to-t from-primary to-accent rounded-full waveform-bar"
                    style={{
                      height: `${30 + Math.sin(i * 0.5) * 70}%`,
                      animationDelay: `${i * 0.1}s`
                    }}
                  />
                ))}
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              <Link to="/create">
                <Button variant="hero" size="xl" className="gap-2 w-full sm:w-auto">
                  <Mic className="w-5 h-5" />
                  Start Creating
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/feed">
                <Button variant="glass" size="xl" className="gap-2 w-full sm:w-auto">
                  <Play className="w-5 h-5" />
                  Explore Feed
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap justify-center gap-8 mt-16 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              {[
                { value: "10M+", label: "Audio Created" },
                { value: "150K+", label: "Creators" },
                { value: "30+", label: "Languages" }
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="font-display text-3xl font-bold gradient-text">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex justify-center pt-2">
            <div className="w-1.5 h-3 bg-muted-foreground/50 rounded-full" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
              Everything You Need for Audio
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              From AI-powered podcast generation to social audio sharing, Audiora has it all.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="glass-card-hover p-6 text-center animate-fade-in-up"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="font-display font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Create Section */}
      <section className="py-24 relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1/2 h-96 bg-primary/10 blur-3xl rounded-full" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-display text-3xl sm:text-4xl font-bold mb-6">
                Create Podcasts in{" "}
                <span className="gradient-text">Seconds</span>
              </h2>
              <p className="text-muted-foreground mb-8">
                Simply enter a topic, paste your content, or upload documents. Our AI handles the rest — from script generation to audio production.
              </p>

              <div className="space-y-4 mb-8">
                {[
                  { icon: Zap, text: "Enter a topic and let AI generate the script" },
                  { icon: FileText, text: "Upload PDFs, DOCX, or TXT files" },
                  { icon: Globe, text: "Choose from 30+ output languages" },
                  { icon: MessageSquare, text: "Select tone: educational, conversational, storytelling" }
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.text} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-sm">{item.text}</span>
                    </div>
                  );
                })}
              </div>

              <Link to="/create">
                <Button variant="hero" size="lg" className="gap-2">
                  Try It Now
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>

            <div className="glass-card p-6 lg:p-8">
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-4 border-b border-border">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-destructive" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                  </div>
                  <span className="text-sm text-muted-foreground">Podcast Generator</span>
                </div>

                <div className="space-y-3">
                  <div className="glass-card p-3 flex items-center gap-3">
                    <Mic className="w-5 h-5 text-primary" />
                    <span className="text-sm">The future of renewable energy...</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Sparkles className="w-4 h-4 text-accent animate-pulse" />
                    <span>AI generating script...</span>
                  </div>

                  <div className="glass-card p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center">
                        <Radio className="w-5 h-5 text-primary-foreground" />
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">Energy Revolution</h4>
                        <p className="text-xs text-muted-foreground">15 min • English</p>
                      </div>
                    </div>
                    <Waveform isPlaying barCount={20} className="h-8" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trending Podcasts */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold mb-2">
                Trending Now
              </h2>
              <p className="text-muted-foreground">Discover what the community is listening to</p>
            </div>
            <Link to="/discover">
              <Button variant="ghost" className="gap-2">
                View All
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {samplePodcasts.map((podcast, i) => (
              <PodcastCard key={i} {...podcast} />
            ))}
          </div>
        </div>
      </section>

      {/* Top Creators */}
      <section className="py-24 bg-gradient-to-b from-transparent via-card/50 to-transparent">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-2xl sm:text-3xl font-bold mb-2">
              Top Creators
            </h2>
            <p className="text-muted-foreground">Follow your favorite audio creators</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {topCreators.map((creator, i) => (
              <CreatorCard key={i} {...creator} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="glass-card p-8 md:p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-accent/10" />

            <div className="relative z-10">
              <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
                Ready to Create Your First Podcast?
              </h2>
              <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                Join thousands of creators using Audiora to produce and share engaging audio content.
              </p>
              <Link to="/signup">
                <Button variant="hero" size="xl" className="gap-2">
                  Get Started Free
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                <Headphones className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-lg">Audiora</span>
            </div>

            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link to="/about" className="hover:text-foreground transition-colors">About</Link>
              <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
              <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
              <Link to="/contact" className="hover:text-foreground transition-colors">Contact</Link>
            </div>

            <div className="text-right">
              <p className="text-sm text-muted-foreground">
                © 2024 Audiora. All rights reserved.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Contact: vkr10906@gmail.com | +91 6305118577
              </p>
            </div>
          </div>
        </div>
      </footer>
    </Layout>
  );
};

export default Index;
