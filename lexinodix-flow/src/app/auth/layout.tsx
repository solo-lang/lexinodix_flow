export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-warm-bg flex flex-col relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="fixed -top-40 -left-40 w-96 h-96 rounded-full bg-warm-accent ambient-glow pointer-events-none" />
      <div className="fixed -bottom-40 -right-40 w-96 h-96 rounded-full bg-deep-blue ambient-glow pointer-events-none" />

      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        {children}
      </div>

      <footer className="text-center pb-6 text-[11px] text-neutral-gray relative z-10">
        © {new Date().getFullYear()} Lexinodix. All rights reserved.
      </footer>
    </div>
  );
}
