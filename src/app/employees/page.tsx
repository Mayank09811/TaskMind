'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import styles from './employees.module.css';

interface Employee {
  _id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', role: 'Employee' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchEmployees = async () => {
    try {
      const res = await fetch('/api/employees');
      const data = await res.json();
      setEmployees(data.employees || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.name || !form.email) {
      setError('Name and email are required.');
      return;
    }

    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess(`✅ ${form.name} added successfully!`);
        setForm({ name: '', email: '', role: 'Employee' });
        setShowForm(false);
        fetchEmployees();
      } else {
        setError(data.error || 'Failed to add employee.');
      }
    } catch (e) {
      setError('Network error.');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete ${name}?`)) return;
    try {
      await fetch(`/api/employees/${id}`, { method: 'DELETE' });
      fetchEmployees();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className={styles.container}>
      <Sidebar />
      <main className={styles.main}>
        <div className={styles.pageHeader}>
          <div>
            <h1>👥 Employees</h1>
            <p>Manage team members who interact with TaskMind</p>
          </div>
          <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : '+ Add Employee'}
          </button>
        </div>

        {error && <div className={styles.errorMsg}>{error}</div>}
        {success && <div className={styles.successMsg}>{success}</div>}

        {showForm && (
          <form className={`${styles.form} glass-panel`} onSubmit={handleSubmit}>
            <div className={styles.formGrid}>
              <div className={styles.field}>
                <label>Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
              <div className={styles.field}>
                <label>Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="john@company.com"
                />
              </div>
              <div className={styles.field}>
                <label>Role</label>
                <input
                  type="text"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  placeholder="Developer"
                />
              </div>
            </div>
            <button type="submit" className="btn-primary">Add Employee</button>
          </form>
        )}

        {loading ? (
          <p style={{ color: 'var(--text-muted)' }}>Loading employees...</p>
        ) : employees.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No employees yet. Add your first team member to get started!</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {employees.map((emp) => (
              <div key={emp._id} className={`${styles.card} card`}>
                <div className={styles.cardHeader}>
                  <div className={styles.empAvatar}>{emp.name[0]?.toUpperCase()}</div>
                  <div>
                    <div className={styles.empName}>{emp.name}</div>
                    <div className={styles.empRole}>{emp.role}</div>
                  </div>
                </div>
                <div className={styles.empEmail}>{emp.email}</div>
                <div className={styles.cardActions}>
                  <button
                    className={styles.deleteBtn}
                    onClick={() => handleDelete(emp._id, emp.name)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
