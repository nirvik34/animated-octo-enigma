import SiteCardDashboard from "@/components/SiteCardDashboard";
import { ShieldCheck, Cpu, Database, Terminal, Palette } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-warmgray-950 text-warmgray-100 flex flex-col font-sans selection:bg-sage-600 selection:text-warmgray-50">
      <header className="border-b border-warmgray-800/80 bg-warmgray-900/80 backdrop-blur-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sage-600 to-terracotta-600 flex items-center justify-center shadow-lg shadow-sage-900/30">
              <Cpu className="w-5 h-5 text-warmgray-50" />
            </div>
            <div>
              <div className="font-bold text-warmgray-100 text-base tracking-tight flex items-center gap-2">
                <span>SitePulse AI</span>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-sage-500/15 text-sage-300 border border-sage-500/30">
                  v1.0.0 • Anti-Slop Palette
                </span>
              </div>
              <p className="text-xs text-warmgray-400">
                Unstructured Notes to Clean Dashboard Extractor
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="hidden md:flex items-center gap-4 text-warmgray-400 border-r border-warmgray-800 pr-4">
              <span className="flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-sage-400" />
                Earthy Muted Design System
              </span>
              <span className="flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-terracotta-400" />
                Zod Schema Validated
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-sage-300" />
                Zero-Leakage Privacy
              </span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-warmgray-900 border border-warmgray-800 text-warmgray-300 font-mono">
              <Terminal className="w-3.5 h-3.5 text-terracotta-400" />
              <span>Next.js 16 App Router</span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        <SiteCardDashboard />
      </div>

      <footer className="border-t border-warmgray-900 bg-warmgray-950 py-6 text-center text-xs text-warmgray-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 SitePulse AI — Anti-Slop Designer UI Architecture</p>
          <div className="flex items-center gap-4">
            <span className="text-sage-400 font-medium">Muted Sage & Dusty Terracotta Palette</span>
            <span>•</span>
            <span>Warm Charcoal Backgrounds</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
