import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Size Guide",
    description: "Find your perfect fit with Vinnys Vogue sizing chart and measurement guide.",
};

export default function SizeGuidePage() {
    return (
        <main className="mx-auto w-full max-w-[720px] px-6 py-20">
            <h1 className="font-serif text-3xl font-light text-heading tracking-[-0.02em]">
                Size Guide
            </h1>
            <div className="gold-divider-gradient mt-4" />

            <div className="mt-10 space-y-8 text-[15px] leading-[1.8] text-muted">
                <section>
                    <h2 className="font-serif text-lg font-medium text-heading mb-3">How to Measure</h2>
                    <p>For the best fit, we recommend taking your measurements over undergarments with a soft measuring tape. Keep the tape snug but not tight.</p>
                    <ul className="list-disc ml-5 mt-3 space-y-2">
                        <li><strong>Bust:</strong> Measure around the fullest part of your bust.</li>
                        <li><strong>Waist:</strong> Measure around the narrowest part of your natural waist.</li>
                        <li><strong>Hips:</strong> Measure around the fullest part of your hips.</li>
                        <li><strong>Length:</strong> Measure from the shoulder to the desired hemline.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="font-serif text-lg font-medium text-heading mb-3">Size Chart</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-[rgba(0,0,0,0.08)] text-[14px]">
                            <thead>
                                <tr className="bg-bg-card">
                                    <th className="border border-[rgba(0,0,0,0.08)] px-4 py-3 text-left font-medium text-heading">Size</th>
                                    <th className="border border-[rgba(0,0,0,0.08)] px-4 py-3 text-left font-medium text-heading">Bust (in)</th>
                                    <th className="border border-[rgba(0,0,0,0.08)] px-4 py-3 text-left font-medium text-heading">Waist (in)</th>
                                    <th className="border border-[rgba(0,0,0,0.08)] px-4 py-3 text-left font-medium text-heading">Hips (in)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    ["XS", "32", "26", "35"],
                                    ["S", "34", "28", "37"],
                                    ["M", "36", "30", "39"],
                                    ["L", "38", "32", "41"],
                                    ["XL", "40", "34", "43"],
                                    ["XXL", "42", "36", "45"],
                                ].map(([size, bust, waist, hips]) => (
                                    <tr key={size}>
                                        <td className="border border-[rgba(0,0,0,0.08)] px-4 py-3 font-medium text-heading">{size}</td>
                                        <td className="border border-[rgba(0,0,0,0.08)] px-4 py-3">{bust}</td>
                                        <td className="border border-[rgba(0,0,0,0.08)] px-4 py-3">{waist}</td>
                                        <td className="border border-[rgba(0,0,0,0.08)] px-4 py-3">{hips}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                <section>
                    <h2 className="font-serif text-lg font-medium text-heading mb-3">Custom Sizing</h2>
                    <p>All our garments can be customized to your exact measurements. Contact us at <a href="tel:+916262999986" className="text-gold hover:underline">+91 62629 99986</a> for bespoke sizing assistance.</p>
                </section>
            </div>
        </main>
    );
}
