import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Shipping & Returns",
    description: "Information about Vinnys Vogue shipping timelines, delivery, and return policies.",
};

export default function ShippingReturnsPage() {
    return (
        <main className="mx-auto w-full max-w-[720px] px-6 py-20">
            <h1 className="font-serif text-3xl font-light text-heading tracking-[-0.02em]">
                Shipping &amp; Returns
            </h1>
            <div className="gold-divider-gradient mt-4" />

            <div className="mt-10 space-y-8 text-[15px] leading-[1.8] text-muted">
                <section>
                    <h2 className="font-serif text-lg font-medium text-heading mb-3">Shipping</h2>
                    <ul className="list-disc ml-5 space-y-2">
                        <li>We ship across India via trusted courier partners.</li>
                        <li>Standard delivery takes 7–14 business days depending on your location.</li>
                        <li>Made-to-order pieces may take 3–6 weeks for production before dispatch.</li>
                        <li>You will receive a tracking number via email once your order ships.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="font-serif text-lg font-medium text-heading mb-3">Returns &amp; Exchanges</h2>
                    <ul className="list-disc ml-5 space-y-2">
                        <li>Due to the bespoke nature of our garments, we do not accept returns or exchanges unless the product is defective or damaged upon delivery.</li>
                        <li>If you receive a defective item, please contact us within 48 hours of delivery with photographs.</li>
                        <li>We will inspect the issue and arrange a replacement or store credit at our discretion.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="font-serif text-lg font-medium text-heading mb-3">Contact for Shipping Queries</h2>
                    <p>For any shipping or return inquiries, reach out at <a href="tel:+916262999986" className="text-gold hover:underline">+91 62629 99986</a> or message us on <a href="https://www.instagram.com/vinnys_vogue_" target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">Instagram</a>.</p>
                </section>
            </div>
        </main>
    );
}
