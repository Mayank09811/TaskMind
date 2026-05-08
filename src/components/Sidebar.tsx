'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Sidebar.module.css';

const navItems = [
  { href: '/', icon: '📊', label: 'Dashboard' },
  { href: '/employees', icon: '👥', label: 'Employees' },
  { href: '/reports', icon: '📋', label: 'Reports' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <div className={styles.botIcon}>🤖</div>
        <span className="gradient-text">TaskMind</span>
      </div>
      <nav className={styles.nav}>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`${styles.navItem} ${pathname === item.href ? styles.active : ''}`}
          >
            <span>{item.icon}</span> {item.label}
          </Link>
        ))}
      </nav>
      <div className={styles.botStatusMini}>
        <div className={styles.statusDot}></div>
        <span>Gemini 2.5 Flash</span>
      </div>
    </aside>
  );
}
