import { FadeIn } from "@/components/fade-in";

export default function AdminPage() {
  return (
    <FadeIn>
      <div className="space-y-3">
        <div className="gold-divider" />
        <div className="text-[11px] font-medium tracking-[0.25em] text-gold uppercase">Welcome</div>
        <h1 className="font-serif text-[clamp(24px,3vw,36px)] font-light tracking-[-0.02em] leading-[1.15] text-heading">
          Admin Dashboard
        </h1>
        <p className="text-[15px] text-muted leading-relaxed max-w-md">
          Select a section from the sidebar to manage your store.
        </p>
      </div>

      <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="rounded-[16px] border border-[rgba(0,0,0,0.06)] bg-white/60 backdrop-blur-sm p-6">
          <div className="text-[13px] text-muted">Quick tip</div>
          <div className="mt-2 text-[14px] text-heading leading-relaxed">
            Use <strong>Homepage Content</strong> to update hero images, stories, and newsletter sections visible to customers.
          </div>
        </div>
        <div className="rounded-[16px] border border-[rgba(0,0,0,0.06)] bg-white/60 backdrop-blur-sm p-6">
          <div className="text-[13px] text-muted">Quick tip</div>
          <div className="mt-2 text-[14px] text-heading leading-relaxed">
            Check <strong>Orders</strong> regularly to track payments, ship orders, and export reports.
          </div>
        </div>
      </div>

    </FadeIn>
  );
}

