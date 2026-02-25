import Layout from "@/components/layout/Layout";
import { Headphones } from "lucide-react";

const About = () => {
    return (
        <Layout hideNav>
            <div className="container max-w-4xl mx-auto px-4 py-20">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center p-2 shadow-glow">
                        <Headphones className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <h1 className="font-display font-bold text-4xl">About Audiora</h1>
                </div>

                <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground">
                    <p className="text-xl">
                        Audiora is modernizing the way we create and consume audio content.
                        We believe that creating high-quality podcasts should be accessible to everyone, regardless of their technical expertise or equipment.
                    </p>

                    <h2 className="text-2xl font-bold text-foreground mt-12 mb-4">Our Mission</h2>
                    <p>
                        Our mission is to democratize podcast creation through the power of Artificial Intelligence.
                        Whether you are an educator looking to turn your notes into an engaging lesson, a storyteller bringing your narrative to life,
                        or a professional sharing industry insights, Audiora provides the tools to generate captivating audio in seconds.
                    </p>

                    <h2 className="text-2xl font-bold text-foreground mt-12 mb-4">What We Do</h2>
                    <ul className="list-disc pl-6 space-y-2">
                        <li><strong>AI Podcast Generation:</strong> Transform written text, topics, or documents into fully-fledged podcast scripts and audio.</li>
                        <li><strong>Multi-Language Support:</strong> Break down language barriers by generating content in over 30 global languages.</li>
                        <li><strong>Audio Social Feed:</strong> Connect with fellow creators, share your podcasts, and discover trending audio content tailored to your taste.</li>
                    </ul>
                </div>
            </div>
        </Layout>
    );
};

export default About;
