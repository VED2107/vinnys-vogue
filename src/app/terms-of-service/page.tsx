import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Terms of Service",
    description: "Terms and conditions for using Vinnys Vogue and placing orders.",
};

export default function TermsOfServicePage() {
    return (
        <main className="mx-auto w-full max-w-[720px] px-6 py-20">
            <h1 className="font-serif text-3xl font-light text-heading tracking-[-0.02em]">
                Terms of Service
            </h1>
            <div className="gold-divider-gradient mt-4" />

            <div className="mt-10 space-y-8 text-[15px] leading-[1.8] text-muted">
                <section>
                    <h2 className="font-serif text-lg font-medium text-heading mb-3">1. Acceptance of Terms</h2>
                    <p>By accessing or using Vinnys Vogue, you agree to be bound by these Terms of Service. If you do not agree, please do not use our website.</p>
                </section>

                <section>
                    <h2 className="font-serif text-lg font-medium text-heading mb-3">2. Products &amp; Pricing</h2>
                    <p>All product descriptions and pricing are accurate to the best of our knowledge. We reserve the right to modify prices without prior notice. All prices are displayed in Indian Rupees (INR).</p>
                </section>

                <section>
                    <h2 className="font-serif text-lg font-medium text-heading mb-3">3. Orders &amp; Payment</h2>
                    <p>By placing an order, you confirm that the information provided is accurate. Orders are confirmed upon successful payment via Razorpay. We reserve the right to cancel orders in case of pricing errors or stock unavailability.</p>
                </section>

                <section>
                    <h2 className="font-serif text-lg font-medium text-heading mb-3">4. Intellectual Property</h2>
                    <p>All content on this website — including images, text, logos, and designs — is the property of Vinnys Vogue. Unauthorized reproduction or distribution is prohibited.</p>
                </section>

                <section>
                    <h2 className="font-serif text-lg font-medium text-heading mb-3">5. Limitation of Liability</h2>
                    <p>Vinnys Vogue shall not be liable for any indirect, incidental, or consequential damages arising from the use of our website or products.</p>
                </section>

                <section>
                    <h2 className="font-serif text-lg font-medium text-heading mb-3">6. Governing Law</h2>
                    <p>These terms shall be governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in Madhya Pradesh, India.</p>
                </section>
            </div>
        </main>
    );
}
