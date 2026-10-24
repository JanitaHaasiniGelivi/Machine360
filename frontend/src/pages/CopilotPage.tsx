import React, { useState, useRef, useEffect } from 'react';
import { api } from '@/services/api';
import { CopilotChatResponse } from '@/types';
import {
  Bot,
  Send,
  Sparkles,
  ClipboardList,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  Cpu,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  checklist?: string[];
  insights?: string[];
  actions?: string[];
  timestamp: string;
}

export const CopilotPage: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'assistant',
      text:
        'Greetings! I am your MachineMind 360 AI Maintenance Copilot. I can explain ML classification probabilities, ' +
        'troubleshoot the 5 AI4I industrial failure modes (TWF, HDF, PWF, OSF, RNF), analyze torque and spindle speeds, and ' +
        'generate customized technician inspection checklists. How can I assist your plant operations today?',
      actions: [
        'Explain HDF Heat Dissipation Failure',
        'Generate Spindle Inspection Checklist',
        'Analyze Tool Wear Limits (TWF)',
        'What causes Spindle Power Failures (PWF)?',
      ],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: String(Date.now()),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res: CopilotChatResponse = await api.copilotChat({
        message: textToSend,
      });

      const assistantMsg: ChatMessage = {
        id: String(Date.now() + 1),
        sender: 'assistant',
        text: res.reply,
        checklist: res.checklist.length > 0 ? res.checklist : undefined,
        insights: res.technical_insights.length > 0 ? res.technical_insights : undefined,
        actions: res.recommended_actions.length > 0 ? res.recommended_actions : undefined,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      const errMsg: ChatMessage = {
        id: String(Date.now() + 1),
        sender: 'assistant',
        text: 'Apologies, I encountered a connection issue reaching the diagnostics engine.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Bot className="w-6 h-6 text-[#23C8BB]" />
            AI Industrial Maintenance Copilot
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Physics-guided deterministic reasoning engine specialized in predictive factory maintenance.
          </p>
        </div>

        <span className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-800 text-[11px] font-mono text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Zero Paid API Key Required</span>
        </span>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {messages.map(m => (
          <div
            key={m.id}
            className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-2xl rounded-xl p-4 text-xs space-y-2.5 shadow-md ${
                m.sender === 'user'
                  ? 'bg-[#23C8BB] text-slate-950 font-medium'
                  : 'bg-[#111C30] border border-slate-800 text-slate-200'
              }`}
            >
              <p className="leading-relaxed whitespace-pre-wrap">{m.text}</p>

              {/* Technical Insights */}
              {m.insights && m.insights.length > 0 && (
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5 text-slate-300">
                  <span className="font-semibold text-[#60A5FA] flex items-center gap-1.5 text-[11px]">
                    <Lightbulb className="w-3.5 h-3.5" />
                    Technical Insights & Physics Breakdown:
                  </span>
                  <ul className="space-y-1 pl-3 list-disc text-[11px]">
                    {m.insights.map((ins, i) => (
                      <li key={i} dangerouslySetInnerHTML={{ __html: ins }} />
                    ))}
                  </ul>
                </div>
              )}

              {/* Checklist */}
              {m.checklist && m.checklist.length > 0 && (
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5 text-slate-300">
                  <span className="font-semibold text-[#23C8BB] flex items-center gap-1.5 text-[11px]">
                    <ClipboardList className="w-3.5 h-3.5" />
                    Step-by-Step Inspection Checklist:
                  </span>
                  <ul className="space-y-1 pl-3 list-disc text-[11px]">
                    {m.checklist.map((chk, i) => (
                      <li key={i}>{chk}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommended Action Chips */}
              {m.actions && m.actions.length > 0 && (
                <div className="pt-2 border-t border-slate-800/80 flex flex-wrap gap-1.5">
                  {m.actions.map((act, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(act)}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-[#23C8BB] border border-slate-700 transition-colors"
                    >
                      {act}
                    </button>
                  ))}
                </div>
              )}

              <span className={`text-[9px] block text-right font-mono ${m.sender === 'user' ? 'text-slate-800' : 'text-slate-500'}`}>
                {m.timestamp}
              </span>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center space-x-2 text-xs text-slate-400 font-mono">
            <Bot className="w-4 h-4 animate-spin text-[#23C8BB]" />
            <span>Consulting physics rules & ML model...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <form
        onSubmit={e => {
          e.preventDefault();
          handleSend();
        }}
        className="flex items-center space-x-2 pt-2 border-t border-slate-800"
      >
        <input
          type="text"
          placeholder="Ask about machine telemetry, failure modes (HDF, TWF, PWF), or maintenance guidelines..."
          value={input}
          onChange={e => setInput(e.target.value)}
          className="flex-1 px-4 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#23C8BB]"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="px-4 py-2.5 rounded-lg bg-[#23C8BB] hover:bg-[#1eb0a4] text-slate-950 font-bold text-xs flex items-center space-x-1.5 disabled:opacity-50 transition-all"
        >
          <Send className="w-4 h-4" />
          <span>Send</span>
        </button>
      </form>
    </div>
  );
};
