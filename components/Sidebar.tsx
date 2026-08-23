"use client";

import React from "react";
import {
  MessageSquare,
  LayoutDashboard,
  Settings,
  Server,
  Zap,
  ShieldCheck,
  X,
  Key,
} from "lucide-react";
import { ProviderType } from "@/lib/llm-provider";

interface SidebarProps {
  activeTab: "chat" | "dashboard";
  onTabChange: (tab: "chat" | "dashboard") => void;
  recordCount: number;
  provider: ProviderType;
  onProviderChange: (p: ProviderType) => void;
  onOpenSettings: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export default function Sidebar({
  activeTab,
  onTabChange,
  recordCount,
  provider,
  onProviderChange,
  onOpenSettings,
  isOpenMobile = false,
  onCloseMobile,
}: SidebarProps) {
  const content = (
    <div className="flex flex-col h-full w-full bg-[#0e0e0e] text-white border-r border-neutral-800 selection:bg-[#f36458]">
      {/* Header */}
      <div className="p-5 border-b border-neutral-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-red-600 via-amber-500 to-emerald-400 p-0.5 flex items-center justify-center">
            <div className="w-full h-full bg-[#0e0e0e] rounded-[10px] flex items-center justify-center font-bold text-white text-xs">
              S
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight text-white">Saniti AI</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block">
              Inspection Engine
            </span>
          </div>
        </div>

        {/* Mobile close button */}
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="md:hidden p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Main Workspace Navigation */}
      <div className="p-3 space-y-1 flex-1 overflow-y-auto">
        <div className="px-3 py-2 text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
          Main Workspace
        </div>

        <button
          onClick={() => {
            onTabChange("chat");
            onCloseMobile?.();
          }}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "chat"
              ? "bg-white text-black shadow-md font-bold"
              : "text-neutral-400 hover:text-white hover:bg-neutral-900"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <MessageSquare className="w-4 h-4" />
            <span>AI Assistant Chat</span>
          </div>
          <span
            className={`w-2 h-2 rounded-full ${
              activeTab === "chat" ? "bg-black" : "bg-emerald-500"
            }`}
          />
        </button>

        <button
          onClick={() => {
            onTabChange("dashboard");
            onCloseMobile?.();
          }}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "dashboard"
              ? "bg-white text-black shadow-md font-bold"
              : "text-neutral-400 hover:text-white hover:bg-neutral-900"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <LayoutDashboard className="w-4 h-4" />
            <span>Inspection Records</span>
          </div>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === "dashboard"
                ? "bg-black text-white"
                : "bg-neutral-800 text-neutral-300"
            }`}
          >
            {recordCount}
          </span>
        </button>

        <div className="pt-3 px-3 pb-1 text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
          Preferences
        </div>

        <button
          onClick={() => {
            onOpenSettings();
            onCloseMobile?.();
          }}
          className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white hover:bg-neutral-900 transition-all group"
        >
          <div className="flex items-center gap-2.5">
            <Settings className="w-4 h-4 text-neutral-400 group-hover:text-emerald-400 transition-colors" />
            <span>API Keys & Settings</span>
          </div>
          <Key className="w-3.5 h-3.5 text-neutral-600 group-hover:text-emerald-400 transition-colors" />
        </button>
      </div>

      {/* Provider Selector Footer */}
      <div className="p-4 border-t border-neutral-800 space-y-3 bg-neutral-950/60">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
            <Server className="w-3 h-3 text-neutral-400" />
            AI Provider
          </span>
          <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
            <Zap className="w-3 h-3" />
            Active
          </span>
        </div>

        <div className="grid grid-cols-4 gap-1 p-1 bg-neutral-900 rounded-lg border border-neutral-800 text-[10px]">
          {(["ollama", "openai", "google", "groq"] as ProviderType[]).map((p) => (
            <button
              key={p}
              onClick={() => {
                onProviderChange(p);
              }}
              className={`py-1 rounded font-semibold text-center uppercase tracking-tighter transition-all ${
                provider === p
                  ? "bg-white text-black font-bold shadow-xs"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              {p === "google" ? "Gemini" : p}
            </button>
          ))}
        </div>

        <div className="p-2.5 rounded-xl bg-neutral-900/90 border border-neutral-800 text-[11px] text-neutral-400 space-y-1">
          <div className="flex items-center gap-1.5 text-white font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Fast Fallback Engine</span>
          </div>
          <p className="text-[10px] text-neutral-500 leading-tight">
            Sub-10ms automatic recovery enabled if LLM times out or is offline.
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Persistent) */}
      <aside className="hidden md:flex w-64 shrink-0 h-full">
        {content}
      </aside>

      {/* Mobile Drawer Sidebar */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-60 md:hidden flex">
          {/* Overlay Backdrop */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity duration-300"
            onClick={onCloseMobile}
          />
          {/* Drawer Panel */}
          <div className="relative w-72 max-w-[80vw] h-full z-10 animate-in slide-in-from-left duration-300">
            {content}
          </div>
        </div>
      )}
    </>
  );
}
