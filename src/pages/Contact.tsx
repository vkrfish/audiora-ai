import Layout from "@/components/layout/Layout";
import { Mail, Phone } from "lucide-react";

const Contact = () => {
    return (
        <Layout hideNav>
            <div className="container max-w-4xl mx-auto px-4 py-20">
                <h1 className="font-display font-bold text-4xl mb-8">Contact Us</h1>

                <div className="glass-card p-8 md:p-12 mb-12">
                    <h2 className="text-2xl font-bold mb-6">Get in Touch</h2>
                    <p className="text-muted-foreground mb-8">
                        Have questions, feedback, or need support? We're here to help. Reach out to us using the contact information below and our team will get back to you as soon as possible.
                    </p>

                    <div className="space-y-6">
                        <div className="flex items-center gap-4 text-lg">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                <Mail className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Email Support</p>
                                <a href="mailto:vkr10906@gmail.com" className="font-medium hover:text-primary transition-colors">
                                    vkr10906@gmail.com
                                </a>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 text-lg">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                <Phone className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Phone Support</p>
                                <a href="tel:+916305118577" className="font-medium hover:text-primary transition-colors">
                                    +91 6305118577
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Contact;
