'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

// Simple markdown-like formatter for assistant messages
function formatMessage(content: string) {
  // Split into lines for processing
  const lines = content.split('\n');
  const formatted: React.ReactNode[] = [];
  let currentSection: { type: string; lines: string[] } | null = null;

  lines.forEach((line, idx) => {
    // Check if this is a day header (e.g., "**Day 1** (2026-01-16): Travel Day & Arrival")
    if (line.match(/^\*\*Day \d+\*\*/)) {
      if (currentSection) {
        formatted.push(renderSection(currentSection, formatted.length));
        currentSection = null;
      }
      formatted.push(
        <div key={`day-${idx}`} className="bg-blue-50 border border-blue-200 rounded-lg p-3 my-2">
          {renderLine(line)}
        </div>
      );
    }
    // Check for emoji-prefixed sections (🎉, 🏨, 🍽️, 🎯, ✨)
    else if (line.match(/^[🎉🏨🍽️🎯✨]/)) {
      if (currentSection) {
        formatted.push(renderSection(currentSection, formatted.length));
        currentSection = null;
      }
      const emojiMatch = line.match(/^([🎉🏨🍽️🎯✨])\s*(.+)/);
      if (emojiMatch) {
        const [, emoji, text] = emojiMatch;
        formatted.push(
          <div key={`emoji-${idx}`} className="flex items-start gap-2 my-1">
            <span className="text-lg shrink-0">{emoji}</span>
            <span className="text-sm">{renderLine(text)}</span>
          </div>
        );
      }
    }
    // Empty line - section break
    else if (line.trim() === '') {
      if (currentSection) {
        formatted.push(renderSection(currentSection, formatted.length));
        currentSection = null;
      }
    }
    // Regular line
    else {
      formatted.push(
        <div key={`line-${idx}`} className="my-1">
          {renderLine(line)}
        </div>
      );
    }
  });

  if (currentSection) {
    formatted.push(renderSection(currentSection, formatted.length));
  }

  return formatted;
}

function renderSection(section: { type: string; lines: string[] }, key: number) {
  return (
    <div key={`section-${key}`} className="space-y-1 my-2">
      {section.lines.map((line, idx) => (
        <div key={idx}>{renderLine(line)}</div>
      ))}
    </div>
  );
}

function renderLine(text: string): React.ReactNode {
  // Handle **bold** text
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let partKey = 0;

  while (remaining.length > 0) {
    const boldMatch = remaining.match(/\*\*([^*]+)\*\*/);
    if (boldMatch && boldMatch.index !== undefined) {
      // Add text before bold
      if (boldMatch.index > 0) {
        parts.push(
          <span key={`text-${partKey++}`}>
            {remaining.substring(0, boldMatch.index)}
          </span>
        );
      }
      // Add bold text
      parts.push(
        <strong key={`bold-${partKey++}`} className="font-semibold text-slate-900">
          {boldMatch[1]}
        </strong>
      );
      remaining = remaining.substring(boldMatch.index + boldMatch[0].length);
    } else {
      // No more bold text, add remaining
      parts.push(<span key={`text-${partKey++}`}>{remaining}</span>);
      break;
    }
  }

  return parts.length > 0 ? parts : text;
}

interface Message {
  _id: string;
  tripId: string;
  role: string;
  agentName?: string;
  content: string;
  createdAt: string;
}

interface ChatPanelProps {
  tripId: string | null;
  messages: Message[];
  onSendMessage: (content: string) => void;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

export function ChatPanel({ tripId, messages, onSendMessage, loading, error, onRetry }: ChatPanelProps) {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || !tripId || loading) return;
    onSendMessage(input.trim());
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.ctrlKey && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    // Auto-resize textarea
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 150) + 'px';
  };

  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <CardHeader className="flex-shrink-0">
        <CardTitle>Chat</CardTitle>
        <CardDescription>
          {tripId ? 'Discuss your travel plans' : 'Select a trip to start chatting'}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4 p-6 overflow-hidden min-h-0">
        <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin min-h-0">
          {!tripId ? (
            <div className="text-center text-slate-500 py-8">
              Select or create a trip to start chatting
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-slate-500 py-8">
              No messages yet. Start the conversation!
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div key={message._id}>
                  {index > 0 && <Separator className="my-4" />}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={
                        message.role === 'user' ? 'secondary' :
                        message.role === 'master' ? 'default' :
                        message.role === 'specialist' ? 'outline' :
                        'secondary'
                      }>
                        {message.role === 'user' ? '👤 You' :
                         message.role === 'master' ? '🤖 Master Agent' :
                         message.role === 'specialist' ? '⚙️ Specialist' :
                         message.role}
                      </Badge>
                      {message.agentName && (
                        <span className="text-xs text-slate-500">
                          ({message.agentName})
                        </span>
                      )}
                      <span className="text-xs text-slate-400 ml-auto">
                        {new Date(message.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-sm text-slate-700 leading-relaxed">
                      {message.role === 'master' || message.role === 'specialist'
                        ? formatMessage(message.content)
                        : <div className="whitespace-pre-wrap">{message.content}</div>
                      }
                    </div>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Processing...</span>
                </div>
              )}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-start gap-2">
                    <span className="text-red-600 font-semibold text-sm">Error:</span>
                    <span className="text-red-700 text-sm flex-1">{error}</span>
                  </div>
                  <Button
                    onClick={onRetry}
                    disabled={loading}
                    size="sm"
                    variant="outline"
                    className="w-full border-red-300 text-red-700 hover:bg-red-50"
                  >
                    Retry Last Message
                  </Button>
                </div>
              )}
              <div ref={scrollRef} />
            </div>
          )}
        </div>

        {tripId && (
          <div className="flex gap-2 flex-shrink-0">
            <textarea
              ref={textareaRef}
              placeholder="Type your message... (Enter to send, Ctrl+Enter for new line)"
              value={input}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              disabled={loading || !tripId}
              className="flex-1 min-h-10 max-h-36 px-3 py-2 text-sm rounded-md border border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
              rows={1}
            />
            <Button
              onClick={handleSend}
              disabled={loading || !input.trim() || !tripId}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Send'
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
