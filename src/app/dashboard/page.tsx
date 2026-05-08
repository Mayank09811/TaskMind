'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import styles from './dashboard.module.css';

interface Employee {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface DailyStats {
  totalEmployees: number;
  activePlans: number;
  completedPlans: number;
}

export default function Dashboard() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [stats, setStats] = useState<DailyStats>({ totalEmployees: 0, activePlans: 0, completedPlans: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const empRes = await fetch('/api/employees');
        const empData = await empRes.json();
        setEmployees(empData.employees || []);
        
        // Mock stats for now or fetch from a real stats API if exists
        setStats({
          totalEmployees: empData.employees?.length || 0,
          activePlans: 1, // This would normally come from a real aggregation API
          completedPlans: 0
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div className={styles.container}>
      <Sidebar />
      <main className={styles.main}>
        <header className={styles.header}>
          <h1>Team Dashboard</h1>
          <p>Real-time oversight of daily tasks and progress.</p>
        </header>

        <section className={styles.statsGrid}>
          <div className={styles.statCard}>
            <h3>Total Employees</h3>
            <div className={styles.statValue}>{stats.totalEmployees}</div>
            <p className={styles.statLabel}>Registered in system</p>
          </div>
          <div className={styles.statCard}>
            <h3>Active Today</h3>
            <div className={styles.statValue}>{stats.activePlans}</div>
            <p className={styles.statLabel}>Currently tracking tasks</p>
          </div>
          <div className={styles.statCard}>
            <h3>Completed</h3>
            <div className={styles.statValue}>{stats.completedPlans}</div>
            <p className={styles.statLabel}>EOD Reports generated</p>
          </div>
        </section>

        <section className={styles.employeeList}>
          <h2>Employee Directory</h2>
          {loading ? (
            <p>Loading team data...</p>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Role</th>
                    <th>Email</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp) => (
                    <tr key={emp._id}>
                      <td className={styles.empName}>{emp.name}</td>
                      <td>{emp.role}</td>
                      <td>{emp.email}</td>
                      <td>
                        <span className={styles.statusBadge}>Online</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
