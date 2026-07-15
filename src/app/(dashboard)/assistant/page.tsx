'use client';
import React, { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import Card from '@/components/ui/Card';
import Btn from '@/components/ui/Btn';
import { PageWrap, SectionTitle } from '@/components/ui/Layout';
import T from '@/lib/tokens';

interface Message {
  sender: 'user' | 'assistant';
  text: string;
  time: string;
}

export default function AssistantPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize with a welcome message
  useEffect(() => {
    setMessages([
      {
        sender: 'assistant',
        text: `Hello ${user?.name?.split(' ')[0] || 'there'}! 👋 I am your GhanaPay AI Assistant. I have analyzed your wallet history and saving goals.\n\nAsk me anything about your finances, or choose a prompt below!`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  }, [user]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || sending) return;

    const userMsg: Message = {
      sender: 'user',
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setSending(true);

    try {
      const res = await api.post('/analytics/assistant/chat', { message: textToSend });
      const reply = res.data?.response || res.response || 'Sorry, I encountered an issue processing your request.';

      const botMsg: Message = {
        sender: 'assistant',
        text: reply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: '❌ There was an error connecting to the AI service. Please check your internet connection and try again.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const SUGGESTED_PROMPTS = [
    { label: 'Suggest a budget plan', text: 'Suggest a monthly budget plan based on my income.' },
    { label: 'Summarize my spending', text: 'Summarize my spending and expenses for this month.' },
    { label: 'How are my savings goals?', text: 'How am I doing on my savings goals?' },
    { label: 'How to save utility costs', text: 'Recommend ways to cut utility costs and bills.' },
  ];

  return (
    <PageWrap
      title="AI Financial Assistant"
      subtitle="Interact with our intelligent assistant for transaction insights and budgeting tips."
      breadcrumb="AI Assistant"
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }} className="assistant-grid">
        {/* Chat Card */}
        <Card style={{ padding: 0, display: 'flex', flexDirection: 'column', height: '620px', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ padding: '16px 24px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: 'linear-gradient(135deg, #020259 0%, #1e7b9e 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 20
            }}>
              <span className="material-symbols-outlined">auto_awesome</span>
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: T.navy }}>GhanaPay AI</div>
              <div style={{ fontSize: 11, color: T.success, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: 9999, backgroundColor: T.success }}></span>
                Online | Transaction-Aware
              </div>
            </div>
          </div>

          {/* Messages Feed */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px', backgroundColor: '#f9faff', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {messages.map((m, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: m.sender === 'user' ? 'flex-end' : 'flex-start',
                  width: '100%',
                }}
              >
                <div style={{ display: 'flex', gap: 8, flexDirection: m.sender === 'user' ? 'row-reverse' : 'row', maxWidth: '75%' }}>
                  {/* Icon */}
                  <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: m.sender === 'user' ? 'linear-gradient(135deg, #cea62c 0%, #a88118 100%)' : 'linear-gradient(135deg, #020259 0%, #1e7b9e 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 16, flexShrink: 0,
                    alignSelf: 'flex-start'
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                      {m.sender === 'user' ? 'person' : 'auto_awesome'}
                    </span>
                  </div>

                  {/* Message Bubble */}
                  <div>
                    <div
                      style={{
                        padding: '12px 16px',
                        borderRadius: 12,
                        borderTopRightRadius: m.sender === 'user' ? 2 : 12,
                        borderTopLeftRadius: m.sender === 'assistant' ? 2 : 12,
                        backgroundColor: m.sender === 'user' ? '#fff' : '#020259',
                        color: m.sender === 'user' ? T.textPrimary : '#ffffff',
                        border: m.sender === 'user' ? `1px solid ${T.border}` : 'none',
                        fontSize: 13,
                        lineHeight: 1.5,
                        whiteSpace: 'pre-line',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                      }}
                    >
                      {m.text}
                    </div>
                    <div style={{ fontSize: 9, color: T.textMuted, marginTop: 4, textAlign: m.sender === 'user' ? 'right' : 'left' }}>
                      {m.time}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {sending && (
              <div style={{ display: 'flex', justifyContent: 'flex-start', width: '100%' }}>
                <div style={{ display: 'flex', gap: 8, maxWidth: '75%' }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: 'linear-gradient(135deg, #020259 0%, #1e7b9e 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 16
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>auto_awesome</span>
                  </div>
                  <div style={{
                    padding: '12px 16px',
                    borderRadius: 12,
                    borderTopLeftRadius: 2,
                    backgroundColor: '#e8ecff',
                    color: T.textPrimary,
                    fontSize: 13,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}>
                    <span className="animate-pulse">GhanaPay AI is thinking</span>
                    <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
                    <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
                    <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>

          {/* Prompt suggestions & Inputs */}
          <div style={{ padding: '16px 24px', borderTop: `1px solid ${T.border}`, backgroundColor: '#fff' }}>
            {/* Quick Action Suggestions */}
            {messages.length <= 2 && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                {SUGGESTED_PROMPTS.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(p.text)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 9999,
                      border: `1px solid ${T.navy}`,
                      backgroundColor: 'transparent',
                      color: T.navy,
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = T.sidebarActive;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            )}

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend(input);
              }}
              style={{ display: 'flex', gap: 12 }}
            >
              <input
                type="text"
                placeholder="Ask about your budget, transactions, or bills..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={sending}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  borderRadius: 10,
                  border: `1px solid ${T.border}`,
                  fontSize: 13,
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = T.navy;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = T.border;
                }}
              />
              <Btn type="submit" variant="primary" disabled={sending || !input.trim()}>
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>send</span>
              </Btn>
            </form>
          </div>
        </Card>

        {/* Side Panel Suggestions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Card>
            <SectionTitle>Tips & Topics</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { title: 'Budget Allocation', desc: 'Propose a 50/30/20 breakdown of your salary.' },
                { title: 'Spending Summary', desc: 'List category percentages for your utilities, transfers, and shopping.' },
                { title: 'Goal Optimization', desc: 'Predict when you will complete your active savings targets.' },
                { title: 'Airtime Cost Analysis', desc: 'Identify how much is spent on phone recharge cards.' }
              ].map((topic, i) => (
                <div
                  key={i}
                  onClick={() => handleSend(topic.desc)}
                  style={{
                    padding: 12, borderRadius: 8, border: `1px solid ${T.border}`, cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = T.navy;
                    (e.currentTarget as HTMLDivElement).style.backgroundColor = '#fafbff';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = T.border;
                    (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent';
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 4 }}>{topic.title}</div>
                  <div style={{ fontSize: 11, color: T.textMuted }}>{topic.desc}</div>
                </div>
              ))}
            </div>
          </Card>

          <Card style={{ backgroundColor: T.warningBg, border: `1px solid #f5ddb0` }}>
            <SectionTitle>Security Notice</SectionTitle>
            <p style={{ fontSize: 11, color: T.textSec, lineHeight: 1.5, margin: 0 }}>
              GhanaPay AI only has read-access to your wallet ledger. The assistant **will never** ask for your wallet passcode, card numbers, or authorize payments on your behalf.
            </p>
          </Card>
        </div>
      </div>
    </PageWrap>
  );
}
