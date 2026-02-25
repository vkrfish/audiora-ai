import Layout from "@/components/layout/Layout";

const Privacy = () => {
    return (
        <Layout hideNav>
            <div className="container max-w-4xl mx-auto px-4 py-20">
                <h1 className="font-display font-bold text-4xl mb-8">Privacy Policy</h1>

                <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground">
                    <p>Last updated: October 2024</p>

                    <h2 className="text-2xl font-bold text-foreground mt-12 mb-4">1. Information We Collect</h2>
                    <p>
                        When you use Audiora, we may collect information regarding your account registration (such as email and username),
                        and data related to your generated podcasts (such as provided text, generated scripts, and audio files).
                    </p>

                    <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">2. How We Use Your Information</h2>
                    <p>
                        We use your information to provide and improve the Audiora service. This includes processing AI generation requests,
                        serving podcast audio, showing your profile on the social feed, and optimizing the platform based on user interactions.
                    </p>

                    <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">3. Data Sharing and Third Parties</h2>
                    <p>
                        We utilize third-party APIs (such as Google Gemini and Supabase) to process text generation, voice synthesis, and database storage.
                        Data required for these services is transmitted securely. We do not sell your personal data to marketing agencies.
                    </p>

                    <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">4. Security</h2>
                    <p>
                        We take reasonable precautions to protect your data. Your account is secured via enterprise-grade authentication provided by Supabase.
                    </p>

                    <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">5. Contact</h2>
                    <p>
                        If you have questions about this privacy policy, please contact us at vkr10906@gmail.com.
                    </p>
                </div>
            </div>
        </Layout>
    );
};

export default Privacy;
