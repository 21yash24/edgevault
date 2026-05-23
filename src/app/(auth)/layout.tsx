export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#07080D] flex items-center justify-center p-4">
      {/* Background glow effects */}
      <div className="fixed top-1/4 left-1/4 w-[500px] h-[500px] bg-accent-green/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 w-[600px] h-[600px] bg-accent-violet/10 blur-[150px] rounded-full pointer-events-none" />
      
      <div className="w-full max-w-md relative z-10">
        {children}
      </div>
    </div>
  );
}
