"use client";

import React, { useState } from "react";
import { X, Key, Eye, EyeOff, Check, Trash2, ShieldCheck } from "lucide-react";

export interface CustomApiKeys {
  openaiApiKey?: string;
  googleApiKey?: string;
  groqApiKey?: string;
  ollamaBaseUrl?: string;
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedKeys: CustomApiKeys;
  onSaveKeys: (keys: CustomApiKeys) => void;
  showToast: (msg: string) => void;
}

export default function SettingsModal({
  isOpen,
  onClose,
  savedKeys,
  onSaveKeys,
  showToast,
}: SettingsModalProps) {
  const [prevIsOpen, setPrevIsOpen] = useState<boolean>(isOpen);
  const [prevSavedKeys, setPrevSavedKeys] = useState<CustomApiKeys>(savedKeys);

  const [openaiKey, setOpenaiKey] = useState<string>(savedKeys.openaiApiKey || "");
  const [googleKey, setGoogleKey] = useState<string>(savedKeys.googleApiKey || "");
  const [groqKey, setGroqKey] = useState<string>(savedKeys.groqApiKey || "");
  const [ollamaUrl, setOllamaUrl] = useState<string>(savedKeys.ollamaBaseUrl || "http://localhost:11434");

  const [showOpenai, setShowOpenai] = useState<boolean>(false);
  const [showGoogle, setShowGoogle] = useState<boolean>(false);
  const [showGroq, setShowGroq] = useState<boolean>(false);

  if (prevIsOpen !== isOpen || prevSavedKeys !== savedKeys) {
    setPrevIsOpen(isOpen);
    setPrevSavedKeys(savedKeys);
    if (isOpen) {
      setOpenaiKey(savedKeys.openaiApiKey || "");
      setGoogleKey(savedKeys.googleApiKey || "");
      setGroqKey(savedKeys.groqApiKey || "");
      setOllamaUrl(savedKeys.ollamaBaseUrl || "http://localhost:11434");
    }
  }

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: CustomApiKeys = {
      openaiApiKey: openaiKey.trim() || undefined,
      googleApiKey: googleKey.trim() || undefined,
      groqApiKey: groqKey.trim() || undefined,
      ollamaBaseUrl: ollamaUrl.trim() || "http://localhost:11434",
    };
    onSaveKeys(updated);
    showToast("API Key settings updated successfully.");
    onClose();
  };

  const handleClear = () => {
    setOpenaiKey("");
    setGoogleKey("");
    setGroqKey("");
    setOllamaUrl("http://localhost:11434");
    onSaveKeys({});
    showToast("All custom API keys cleared.");
  };

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-xl bg-[#121212] text-white border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-emerald-400">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-white">LLM API Credentials</h2>
              <p className="text-xs text-neutral-400">Configure custom API keys and local server endpoint</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-6 overflow-y-auto flex-1">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">API Credentials</span>
              <span className="text-[11px] text-neutral-500 font-mono">Stored in local browser storage</span>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-neutral-200">OpenAI API Key</label>
                {openaiKey ? (
                  <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Configured
                  </span>
                ) : (
                  <span className="text-[10px] font-mono text-neutral-500">Not set (Uses .env fallback)</span>
                )}
              </div>
              <div className="relative flex items-center">
                <input
                  type={showOpenai ? "text" : "password"}
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                  placeholder="sk-proj-..."
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white placeholder:text-neutral-600 outline-none focus:border-emerald-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowOpenai(!showOpenai)}
                  className="absolute right-3 text-neutral-500 hover:text-neutral-300"
                >
                  {showOpenai ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-neutral-200">Google Gemini API Key</label>
                {googleKey ? (
                  <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Configured
                  </span>
                ) : (
                  <span className="text-[10px] font-mono text-neutral-500">Not set (Uses .env fallback)</span>
                )}
              </div>
              <div className="relative flex items-center">
                <input
                  type={showGoogle ? "text" : "password"}
                  value={googleKey}
                  onChange={(e) => setGoogleKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white placeholder:text-neutral-600 outline-none focus:border-emerald-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowGoogle(!showGoogle)}
                  className="absolute right-3 text-neutral-500 hover:text-neutral-300"
                >
                  {showGoogle ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-neutral-200">Groq API Key</label>
                {groqKey ? (
                  <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Configured
                  </span>
                ) : (
                  <span className="text-[10px] font-mono text-neutral-500">Not set</span>
                )}
              </div>
              <div className="relative flex items-center">
                <input
                  type={showGroq ? "text" : "password"}
                  value={groqKey}
                  onChange={(e) => setGroqKey(e.target.value)}
                  placeholder="gsk_..."
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white placeholder:text-neutral-600 outline-none focus:border-emerald-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowGroq(!showGroq)}
                  className="absolute right-3 text-neutral-500 hover:text-neutral-300"
                >
                  {showGroq ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-neutral-200">Local Ollama Base URL</label>
                <span className="text-[10px] font-mono text-neutral-500">Default: http://localhost:11434</span>
              </div>
              <input
                type="text"
                value={ollamaUrl}
                onChange={(e) => setOllamaUrl(e.target.value)}
                placeholder="http://localhost:11434"
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white placeholder:text-neutral-600 outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-start gap-3">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              API keys are encrypted in client browser memory during requests and never stored on persistent servers.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-between gap-3 border-t border-neutral-800">
            <button
              type="button"
              onClick={handleClear}
              className="px-4 py-2.5 rounded-xl border border-neutral-800 text-xs font-semibold text-neutral-400 hover:text-red-400 hover:bg-neutral-900 transition-all flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Keys</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-neutral-800 text-xs font-semibold text-neutral-300 hover:bg-neutral-800 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-white text-black text-xs font-bold hover:bg-neutral-200 transition-all shadow-md active:scale-95 flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Save Settings</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
