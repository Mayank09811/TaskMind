'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import styles from './reports.module.css';

interface Pointer {
  title: string;
  plannedETA: number;
  actualTime: number | null;
  status: string;
  delayReason: string | null;
  blocker: string | null;
  extensions: { extraTime: number; reason: string }[];
}

interface DailyPlan {
  _id: string;
  employee: { _id: string; name: string; email: string; role: string };
  date: string;
  status: string;
  pointers: Pointer[];
  eodReport: { generated: boolean; summary: string | null };
}

interface Stats {
  totalPlans: number;
  totalPointers: number;
  completedPointers: number;
  blockedPointers: number;
  delayedPointers: number;
  avgProductivityPercent: number;
}

export default function ReportsPage() {
  const [plans, setPlans] = useState<DailyPlan[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<DailyPlan | null>(null);

  useEffect(() => {
    fetch('/api/reports')
      .then((res) => res.json())
      .then((data) => {
        setPlans(data.plans || []);
        setStats(data.stats || null);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const getStatusEmoji = (status: string) => {
    switch (status) {
      case 'done': return '✅';
      case 'blocked': return '🚨';
      case 'delayed': return '⚠️';
      case 'in_progress': return '🔄';
      default: return '⏳';
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'done': return styles.statusDone;
      case 'blocked': return styles.statusBlocked;
      case 'delayed': return styles.statusDelayed;
      case 'in_progress': return styles.statusProgress;
      default: return styles.statusPending;
    }
  };

  return (
    <div className={styles.container}>
      <Sidebar />
      <main className={styles.main}>
        <div className={styles.pageHeader}>
          <h1>📋 Reports</h1>
          <p>Daily and weekly productivity summaries</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className={styles.statsRow}>
            <div className={`${styles.statCard} card`}>
              <div className={styles.statLabel}>Total Plans</div>
              <div className={styles.statNum}>{stats.totalPlans}</div>
            </div>
            <div className={`${styles.statCard} card`}>
              <div className={styles.statLabel}>Completed</div>
              <div className={`${styles.statNum} ${styles.green}`}>{stats.completedPointers}</div>
            </div>
            <div className={`${styles.statCard} card`}>
              <div className={styles.statLabel}>Blocked</div>
              <div className={`${styles.statNum} ${styles.red}`}>{stats.blockedPointers}</div>
            </div>
            <div className={`${styles.statCard} card`}>
              <div className={styles.statLabel}>Productivity</div>
              <div className={`${styles.statNum} ${styles.purple}`}>{stats.avgProductivityPercent}%</div>
            </div>
          </div>
        )}

        {loading ? (
          <p style={{ color: 'var(--text-muted)' }}>Loading reports...</p>
        ) : plans.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No daily plans found yet. Start a chat session with an employee to begin tracking!</p>
          </div>
        ) : (
          <div className={styles.plansList}>
            {plans.map((plan) => (
              <div key={plan._id} className={`${styles.planCard} glass-panel`}>
                <div className={styles.planHeader} onClick={() => setSelectedPlan(selectedPlan?._id === plan._id ? null : plan)}>
                  <div className={styles.planInfo}>
                    <span className={styles.planEmployee}>{plan.employee?.name || 'Unknown'}</span>
                    <span className={styles.planDate}>{plan.date}</span>
                    <span className={`${styles.planStatus} ${getStatusClass(plan.status)}`}>{plan.status}</span>
                  </div>
                  <div className={styles.planSummary}>
                    {plan.pointers.filter(p => p.status === 'done').length}/{plan.pointers.length} done
                  </div>
                </div>

                {selectedPlan?._id === plan._id && (
                  <div className={styles.planDetail}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Task</th>
                          <th>Status</th>
                          <th>Planned</th>
                          <th>Actual</th>
                          <th>Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {plan.pointers.map((p, i) => (
                          <tr key={i}>
                            <td>{i + 1}</td>
                            <td>{p.title}</td>
                            <td><span className={getStatusClass(p.status)}>{getStatusEmoji(p.status)} {p.status}</span></td>
                            <td>{p.plannedETA}h</td>
                            <td>{p.actualTime ? `${p.actualTime.toFixed(1)}h` : '—'}</td>
                            <td className={styles.notes}>
                              {p.blocker && <span className={styles.blockerNote}>🚨 {p.blocker}</span>}
                              {p.delayReason && <span>⚠️ {p.delayReason}</span>}
                              {p.extensions.length > 0 && (
                                <span>Extended {p.extensions.length}x</span>
                              )}
                              {!p.blocker && !p.delayReason && p.extensions.length === 0 && '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
