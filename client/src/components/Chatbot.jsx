import { useState, useRef, useEffect } from 'react';
import { processMessage } from '../utils/chatEngine.js';

export default function Chatbot({ context }) {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'bot', text: `👋 Hi! I'm your EMR assistant for **${context.tenant?.name || 'this organization'}**. Type "help" to see what I can do.` }
    ]);
    const [input, setInput] = useState('');
    const bottomRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        if (open) inputRef.current?.focus();
    }, [open]);

    function handleSend(e) {
        e?.preventDefault();
        const text = input.trim();
        if (!text) return;

        setMessages(prev => [...prev, { role: 'user', text }]);
        setInput('');

        // Process with a tiny delay for natural feel
        setTimeout(() => {
            const result = processMessage(text, context);
            setMessages(prev => [...prev, { role: 'bot', text: result.text }]);

            if (result.action?.type === 'navigate' && context.setView) {
                context.setView(result.action.payload);
            }
        }, 300);
    }

    // Simple markdown-like bold rendering
    function renderText(text) {
        const parts = text.split(/(\*\*[^*]+\*\*)/g);
        return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i}>{part.slice(2, -2)}</strong>;
            }
            return part;
        });
    }

    return (
        <>
            {/* Floating Action Button */}
            <button
                className={`chat-fab ${open ? 'chat-fab-hidden' : ''}`}
                onClick={() => setOpen(true)}
                aria-label="Open chat assistant"
            >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
            </button>

            {/* Chat Panel */}
            {open && (
                <div className="chat-panel">
                    <div className="chat-header">
                        <div className="chat-header-info">
                            <div className="chat-avatar">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                                </svg>
                            </div>
                            <div>
                                <h4>EMR Assistant</h4>
                                <span>{context.tenant?.name || 'System'}</span>
                            </div>
                        </div>
                        <button className="chat-close" onClick={() => setOpen(false)} aria-label="Close chat">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    </div>

                    <div className="chat-messages">
                        {messages.map((msg, i) => (
                            <div key={i} className={`chat-msg chat-msg-${msg.role}`}>
                                <div className="chat-bubble">
                                    {msg.text.split('\n').map((line, j) => (
                                        <p key={j}>{renderText(line)}</p>
                                    ))}
                                </div>
                            </div>
                        ))}
                        <div ref={bottomRef} />
                    </div>

                    <form className="chat-input-area" onSubmit={handleSend}>
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask about patients, appointments..."
                            className="chat-input"
                        />
                        <button type="submit" className="chat-send" disabled={!input.trim()}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                            </svg>
                        </button>
                    </form>
                </div>
            )}
        </>
    );
}
