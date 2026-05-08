'use client';

import { useState, useRef, useEffect } from 'react';
import styles from './ChatBox.module.css';

interface Message {
  role: 'user' | 'model';
  text: string;
}

export default function ChatBox() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMessage,
          history: messages // Send previous messages
        }),
      });

      const data = await response.json();
      if (data.error) {
        setMessages((prev) => [...prev, { role: 'model', text: `❌ Error: ${data.error}` }]);
      } else {
        setMessages((prev) => [...prev, { role: 'model', text: data.text }]);
      }
    } catch (error) {
      setMessages((prev) => [...prev, { role: 'model', text: '❌ Failed to connect to TaskMind AI.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`${styles.chatContainer} glass-panel`}>
      <div className={styles.chatHeader}>
        <h3>AI Assistant</h3>
        <span className={styles.onlineBadge}>Online</span>
      </div>

      <div className={styles.messagesList}>
        {messages.length === 0 && (
          <div className={styles.emptyState}>
            <p>How can TaskMind help you today?</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`${styles.message} ${styles[msg.role]}`}>
            <div className={styles.bubble}>
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className={`${styles.message} ${styles.model}`}>
            <div className={styles.bubble}>
              <span className={styles.typing}>...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className={styles.inputArea}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask TaskMind anything..."
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading} className="btn-primary">
          {isLoading ? '...' : 'Send'}
        </button>
      </form>
    </div>
  );
}
