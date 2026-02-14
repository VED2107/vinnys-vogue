import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Privacy Policy",
    description: "How Vinnys Vogue collects, uses, and protects your personal information.",
};

export default function PrivacyPolicyPage() {
    return (
        <main className="mx-auto w-full max-w-[720px] px-6 py-20">
            <h1 className="font-serif text-3xl font-light text-heading tracking-[-0.02em]">
                Privacy Policy
            </h1>
            <div className="gold-divider-gradient mt-4" />

            <div className="mt-10 space-y-8 text-[15px] leading-[1.8] text-muted">
                <section>
                    <h2 className="font-serif text-lg font-medium text-heading mb-3">1. Information We Collect</h2>
                    <p>We collect information you provide directly: name, email, phone number, and shipping address when placing an order. We also collect browsing data (pages visited, time spent) through cookies to improve our service.</p>
                </section>

                <section>
                    <h2 className="font-serif text-lg font-medium text-heading mb-3">2. How We Use Your Information</h2>
                    <p>Your data is used to process orders, send order updates, improve our website, and communicate promotional offers (only with your consent). We never sell your personal data to third parties.</p>
                </section>

                <section>
                    <h2 className="font-serif text-lg font-medium text-heading mb-3">3. Payment Security</h2>
                    <p>All payments are processed securely through Razorpay. We do not store your credit/debit card details on our servers. Razorpay is PCI-DSS compliant and ensures industry-standard encryption.</p>
                </section>

                <section>
                    <h2 className="font-serif text-lg font-medium text-heading mb-3">4. Data Protection</h2>
                    <p>We implement industry-standard security measures including SSL encryption, secure server infrastructure, and restricted access controls to protect your personal information.</p>
                </section>

                <section>
                    <h2 className="font-serif text-lg font-medium text-heading mb-3">5. Your Rights</h2>
                    <p>You may request access to, correction of, or deletion of your personal data at any time by contacting us. We will respond to your request within 30 days.</p>
                </section>

                <section>
                    <h2 className="font-serif text-lg font-medium text-heading mb-3">6. Contact Us</h2>
                    <p>For privacy-related inquiries, reach us at <a href="tel:+916262999986" className="text-gold hover:underline">+91 62629 99986</a> or via our <a href="https://www.instagram.com/vinnys_vogue_" target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">Instagram</a>.</p>
                </section>
            </div>
        </main>
    );
}
