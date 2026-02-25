import Layout from "@/components/layout/Layout";

const Terms = () => {
    return (
        <Layout hideNav>
            <div className="container max-w-4xl mx-auto px-4 py-20">
                <h1 className="font-display font-bold text-4xl mb-8">Terms of Service</h1>

                <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground">
                    <p>Last updated: October 2024</p>

                    <h2 className="text-2xl font-bold text-foreground mt-12 mb-4">1. Acceptance of Terms</h2>
                    <p>
                        By accessing or using Audiora, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the service.
                    </p>

                    <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">2. Intellectual Property</h2>
                    <p>
                        The generated audio and scripts are meant for your personal or commercial use depending on your subscription.
                        However, you may not use the platform to generate illegal, hateful, or abusive content.
                        Audiora retains the rights to the underlying software and platform design.
                    </p>

                    <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">3. User Conduct</h2>
                    <p>
                        You agree not to use the service for any unlawful purpose or to solicit others to perform or participate in any unlawful acts.
                        We reserve the right to terminate your account for violating any of the prohibited uses.
                    </p>

                    <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">4. Limitation of Liability</h2>
                    <p>
                        In no event shall Audiora, nor its directors, employees, partners, agents, suppliers, or affiliates,
                        be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation,
                        loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.
                    </p>

                    <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">5. Contact</h2>
                    <p>
                        If you have questions about these Terms, please contact us at vkr10906@gmail.com.
                    </p>
                </div>
            </div>
        </Layout>
    );
};

export default Terms;
