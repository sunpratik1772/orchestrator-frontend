import { Link } from "wouter";
import { AlertCircle, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[var(--c-bg)]">
      <div className="flex flex-col items-center gap-5 text-center px-6">
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <AlertCircle className="w-7 h-7 text-red-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white font-mono">404</h1>
          <p className="text-sm text-[var(--c-text-2)] mt-1">Page not found</p>
        </div>
        <Link href="/">
          <button className="flex items-center gap-2 text-xs font-mono text-primary hover:text-primary/80 border border-primary/20 hover:border-primary/40 px-4 py-2 rounded-lg transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Dashboard
          </button>
        </Link>
      </div>
    </div>
  );
}
