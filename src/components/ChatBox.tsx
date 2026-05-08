'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import styles from './ChatBox.module.css';

interface Message {
  role: 'user' | 'model';
  text: string;
}

interface Employee {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface DailyPlanInfo {
  status: string | null;
  completedCount: number;
  totalCount: number;
}

export default function ChatBox() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [planInfo, setPlanInfo] = useState<DailyPlanInfo>({ status: null, completedCount: 0, totalCount: 0 });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch employees on mount
  useEffect(() => {
    fetch('/api/employees')
      .then((res) => res.json())
      .then((data) => {
        if (data.employees) {
          setEmployees(data.employees);
        }
      })
      .catch(console.error);
  }, []);

  // Poll for notifications every 10 seconds
  useEffect(() => {
    if (!selectedEmployee) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/notifications?employeeId=${selectedEmployee}`);
        const data = await res.json();
        if (data.notifications && data.notifications.length > 0) {
          // Add bot notifications as messages
          for (const notif of data.notifications) {
            setMessages((prev) => [...prev, { role: 'model', text: notif.message }]);
          }
          // Mark as read
          const ids = data.notifications.map((n: any) => n.id);
          await fetch('/api/notifications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ notificationIds: ids }),
          });
        }
      } catch (e) {
        // Silent fail for polling
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [selectedEmployee]);

  // Auto morning check-in when employee is selected
  const triggerMorningCheckIn = useCallback(async (empId: string) => {
    const emp = employees.find((e) => e._id === empId);
    if (!emp) return;

    setIsLoading(true);
    try {
      const userMsg = `Hi, I'm ${emp.name}. Starting my day.`;
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          history: [],
          employeeId: empId,
        }),
      });

      const data = await response.json();
      if (data.text) {
        setMessages([
          { role: 'user', text: userMsg },
          { role: 'model', text: data.text }
        ]);
        if (data.dailyPlanStatus) {
          setPlanInfo({
            status: data.dailyPlanStatus,
            completedCount: data.completedCount || 0,
            totalCount: data.totalCount || 0,
          });
        }
      }
    } catch (error) {
      setMessages([{ role: 'model', text: '❌ Failed to start morning check-in.' }]);
    } finally {
      setIsLoading(false);
    }
  }, [employees]);

  const handleEmployeeChange = (empId: string) => {
    setSelectedEmployee(empId);
    setMessages([]);
    setPlanInfo({ status: null, completedCount: 0, totalCount: 0 });
    if (empId) {
      triggerMorningCheckIn(empId);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    if (!selectedEmployee) {
      setMessages((prev) => [...prev, { role: 'model', text: '⚠️ Please select an employee first.' }]);
      return;
    }

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
          history: messages,
          employeeId: selectedEmployee,
        }),
      });

      const data = await response.json();
      if (data.error) {
        setMessages((prev) => [...prev, { role: 'model', text: `❌ ${data.error}` }]);
      } else {
        setMessages((prev) => [...prev, { role: 'model', text: data.text }]);
        if (data.dailyPlanStatus) {
          setPlanInfo({
            status: data.dailyPlanStatus,
            completedCount: data.completedCount || 0,
            totalCount: data.totalCount || 0,
          });
        }
      }
    } catch (error) {
      setMessages((prev) => [...prev, { role: 'model', text: '❌ Failed to connect to TaskMind AI.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const progressPercent = planInfo.totalCount > 0
    ? Math.round((planInfo.completedCount / planInfo.totalCount) * 100)
    : 0;

  return (
    <div className={`${styles.chatContainer} glass-panel`}>
      <div className={styles.chatHeader}>
        <div className={styles.headerLeft}>
          <h3>🤖 TaskMind AI</h3>
          <span className={styles.onlineBadge}>Online</span>
        </div>
        <select
          className={styles.employeeSelect}
          value={selectedEmployee}
          onChange={(e) => handleEmployeeChange(e.target.value)}
        >
          <option value="">Select Employee</option>
          {employees.map((emp) => (
            <option key={emp._id} value={emp._id}>
              {emp.name}
            </option>
          ))}
        </select>
      </div>

      {/* Progress bar */}
      {planInfo.totalCount > 0 && (
        <div className={styles.progressSection}>
          <div className={styles.progressLabel}>
            <span>Today&apos;s Progress</span>
            <span>{planInfo.completedCount}/{planInfo.totalCount} tasks • {progressPercent}%</span>
          </div>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      <div className={styles.messagesList}>
        {messages.length === 0 && !selectedEmployee && (
          <div className={styles.emptyState}>
            <p>👆 Select an employee to start the check-in</p>
          </div>
        )}
        {messages.length === 0 && selectedEmployee && !isLoading && (
          <div className={styles.emptyState}>
            <p>Starting morning check-in...</p>
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
              <span className={styles.typing}>
                <span className={styles.dot}></span>
                <span className={styles.dot}></span>
                <span className={styles.dot}></span>
              </span>
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
          placeholder={selectedEmployee ? "Type your update..." : "Select an employee first"}
          disabled={isLoading || !selectedEmployee}
        />
        <button type="submit" disabled={isLoading || !selectedEmployee} className="btn-primary">
          {isLoading ? '...' : 'Send'}
        </button>
      </form>
    </div>
  );
}
