import styles from './Dashboard.module.css';
import ChatBox from '@/components/ChatBox';
import Sidebar from '@/components/Sidebar';

export default function Home() {
  return (
    <div className={styles.container}>
      <Sidebar />

      <main className={styles.main}>
        <header className={styles.header}>
          <div className={styles.search}>
            <input type="text" placeholder="Search tasks, projects..." />
          </div>
          <div className={styles.userProfile}>
            <div className={styles.avatar}>M</div>
            <div className={styles.userInfo}>
              <div className={styles.userName}>Mayank09811</div>
              <div className={styles.userRole}>Product Manager</div>
            </div>
          </div>
        </header>

        <section className={styles.content}>
          <div className={styles.hero}>
            <h1>Welcome back, <span className="gradient-text">Mayank</span></h1>
            <p>Your PM-Bot is ready to track tasks and generate reports.</p>
          </div>

          <div className={styles.statsGrid}>
            <div className="card">
              <div className={styles.statHeader}>
                <span className={styles.statTitle}>Active Projects</span>
                <span className={styles.statIcon}>🚀</span>
              </div>
              <div className={styles.statValue} id="stat-projects">—</div>
              <div className={styles.statChange}>Live from MongoDB</div>
            </div>
            <div className="card">
              <div className={styles.statHeader}>
                <span className={styles.statTitle}>Employees</span>
                <span className={styles.statIcon}>👥</span>
              </div>
              <div className={styles.statValue} id="stat-employees">—</div>
              <div className={styles.statChange}>Registered</div>
            </div>
            <div className="card">
              <div className={styles.statHeader}>
                <span className={styles.statTitle}>Tasks Today</span>
                <span className={styles.statIcon}>⏳</span>
              </div>
              <div className={styles.statValue} id="stat-tasks">—</div>
              <div className={styles.statChange}>Across all plans</div>
            </div>
          </div>

          <div className={styles.chatSection}>
            <ChatBox />
          </div>
        </section>
      </main>
    </div>
  );
}
