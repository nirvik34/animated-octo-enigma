"use client";

import React from "react";
import {
  Plus,
  FileText,
  Users,
  Settings,
  X,
} from "lucide-react";
import { ProviderType } from "@/lib/llm-provider";

export type TabType = "chat" | "dashboard" | "clients";

interface SidebarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  recordCount: number;
  provider?: ProviderType;
  onProviderChange?: (p: ProviderType) => void;
  onOpenSettings: () => void;
  onNewInspection?: () => void;
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
  onNewInspection,
  isOpenMobile = false,
  onCloseMobile,
}: SidebarProps) {
  const content = (
    <div className="flex flex-col h-full w-full bg-[#121212] text-neutral-200 border-r border-neutral-800 font-sans select-none">
      {/* App Header */}
      <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-neutral-800 border border-neutral-700 flex items-center justify-center font-bold text-white text-sm tracking-wider">
            S
          </div>
          <div>
            <span className="font-bold text-base text-white tracking-tight block leading-none">
              Saniti
            </span>
            <span className="text-xs text-neutral-400 block leading-tight mt-1">
              Site Inspection Tool
            </span>
          </div>
        </div>

        {/* Mobile close button */}
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="md:hidden p-2 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Main Navigation */}
      <div className="p-3 space-y-4 flex-1 overflow-y-auto">
        {/* + New Button */}
        <button
          onClick={() => {
            if (onNewInspection) {
              onNewInspection();
            } else {
              onTabChange("chat");
            }
            onCloseMobile?.();
          }}
          className="w-full flex items-center justify-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-bold bg-white text-black hover:bg-neutral-200 transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>New Inspection</span>
        </button>

        {/* Navigation Section */}
        <div className="space-y-1.5">
          <div className="px-2.5 py-1 text-xs font-bold text-neutral-400 uppercase tracking-wider">
            Workspace
          </div>

          <button
            onClick={() => {
              onTabChange("chat");
              onCloseMobile?.();
            }}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "chat"
                ? "bg-neutral-800 text-white font-semibold"
                : "text-neutral-300 hover:text-white hover:bg-neutral-800/50"
            }`}
          >
            <div className="flex items-center gap-3">
              <Plus className="w-4 h-4 text-neutral-400" />
              <span>New Inspection</span>
            </div>
          </button>

          <button
            onClick={() => {
              onTabChange("dashboard");
              onCloseMobile?.();
            }}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "dashboard"
                ? "bg-neutral-800 text-white font-semibold"
                : "text-neutral-300 hover:text-white hover:bg-neutral-800/50"
            }`}
          >
            <div className="flex items-center gap-3">
              <FileText className="w-4 h-4 text-neutral-400" />
              <span>Inspections</span>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-md bg-neutral-800 text-neutral-300 font-mono font-semibold">
              {recordCount}
            </span>
          </button>

          <button
            onClick={() => {
              onTabChange("clients");
              onCloseMobile?.();
            }}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "clients"
                ? "bg-neutral-800 text-white font-semibold"
                : "text-neutral-300 hover:text-white hover:bg-neutral-800/50"
            }`}
          >
            <div className="flex items-center gap-3">
              <Users className="w-4 h-4 text-neutral-400" />
              <span>Clients</span>
            </div>
          </button>
        </div>
      </div>

      {/* Provider Selector & Settings */}
      <div className="p-3 border-t border-neutral-800 bg-[#0d0d0d] space-y-3">
        {onProviderChange && (
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider px-1 block">
              AI Processing Engine
            </label>
            <select
              value={provider || "auto"}
              onChange={(e) => onProviderChange(e.target.value as ProviderType)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-neutral-600 cursor-pointer font-medium"
            >
              <option value="auto">⚡ Auto (Fastest Cascade)</option>
              <option value="groq">🚀 Groq LPU (Ultra Fast)</option>
              <option value="google">✦ Google Gemini (Flash)</option>
              <option value="openai">🤖 OpenAI GPT-4o-mini</option>
              <option value="ollama">🦙 Ollama Local</option>
            </select>
          </div>
        )}

        <button
          onClick={() => {
            onOpenSettings();
            onCloseMobile?.();
          }}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors"
        >
          <Settings className="w-4.5 h-4.5" />
          <span>Settings</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Persistent) */}
      <aside className="hidden md:flex w-56 shrink-0 h-full">
        {content}
      </aside>

      {/* Mobile Drawer Sidebar */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-60 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative w-64 max-w-[80vw] h-full z-10 animate-in slide-in-from-left duration-200">
            {content}
          </div>
        </div>
      )}
    </>
  );
}

