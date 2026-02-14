import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Sustainability",
    description: "Vinnys Vogue's commitment to ethical fashion, sustainable practices, and artisan partnerships.",
};

export default function SustainabilityPage() {
    return (
        <main className="mx-auto w-full max-w-[720px] px-6 py-20">
            <h1 className="font-serif text-3xl font-light text-heading tracking-[-0.02em]">
                Sustainability
            </h1>
            <div className="gold-divider-gradient mt-4" />

            <div className="mt-10 space-y-8 text-[15px] leading-[1.8] text-muted">
                <section>
                    <h2 className="font-serif text-lg font-medium text-heading mb-3">Our Commitment</h2>
                    <p>At Vinnys Vogue, we believe luxury and responsibility go hand in hand. Every piece we create is designed to last — not just trends, but generations.</p>
                </section>

                <section>
                    <h2 className="font-serif text-lg font-medium text-heading mb-3">Artisan Partnerships</h2>
                    <p>We work directly with skilled artisans, ensuring fair wages, safe working conditions, and the preservation of traditional craft techniques. Our partnerships sustain livelihoods and protect heritage embroidery art forms.</p>
                </section>

                <section>
                    <h2 className="font-serif text-lg font-medium text-heading mb-3">Mindful Materials</h2>
                    <p>We prioritize natural and responsibly sourced fabrics. From silk to handwoven textiles, each material is chosen for quality, durability, and minimal environmental impact.</p>
                </section>

                <section>
                    <h2 className="font-serif text-lg font-medium text-heading mb-3">Made to Order</h2>
                    <p>Our made-to-order model means we produce only what is needed — eliminating waste from overproduction. Each garment is crafted specifically for you.</p>
                </section>
            </div>
        </main>
    );
}
