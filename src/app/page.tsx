import styles from './Dashboard.module.css';
import ChatBox from '@/components/ChatBox';

export default function Home() {
  return (
    <div className={styles.container}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <div className={styles.botIcon}>🤖</div>
          <span className="gradient-text">TaskMind</span>
        </div>
        <nav className={styles.nav}>
          <div className={`${styles.navItem} ${styles.active}`}>
            <span>📊</span> Dashboard
          </div>
          <div className={styles.navItem}>
            <span>📅</span> Projects
          </div>
          <div className={styles.navItem}>
            <span>💬</span> AI Chat
          </div>
          <div className={styles.navItem}>
            <span>⚙️</span> Settings
          </div>
        </nav>
      </aside>

      {/* Main Content */}
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
            <p>Your AI assistant has analyzed 12 new updates since your last visit.</p>
          </div>

          <div className={styles.statsGrid}>
            <div className="card">
              <div className={styles.statHeader}>
                <span className={styles.statTitle}>Active Projects</span>
                <span className={styles.statIcon}>🚀</span>
              </div>
              <div className={styles.statValue}>24</div>
              <div className={styles.statChange}>+2 this week</div>
            </div>
            <div className="card">
              <div className={styles.statHeader}>
                <span className={styles.statTitle}>Pending Tasks</span>
                <span className={styles.statIcon}>⏳</span>
              </div>
              <div className={styles.statValue}>142</div>
              <div className={styles.statChange}>12 urgent</div>
            </div>
            <div className="card">
              <div className={styles.statHeader}>
                <span className={styles.statTitle}>AI Efficiency</span>
                <span className={styles.statIcon}>⚡</span>
              </div>
              <div className={styles.statValue}>98.4%</div>
              <div className={styles.statChange}>Optimal</div>
            </div>
          </div>

          <div className={styles.layout}>
            <div className={`${styles.recentActivity} glass-panel`}>
              <h3>Recent Activity</h3>
              <div className={styles.activityList}>
                <div className={styles.activityItem}>
                  <div className={styles.activityDot}></div>
                  <div className={styles.activityInfo}>
                    <strong>TaskMind</strong> optimized the roadmap for Project Alpha.
                    <span>2 hours ago</span>
                  </div>
                </div>
                <div className={styles.activityItem}>
                  <div className={styles.activityDot}></div>
                  <div className={styles.activityInfo}>
                    <strong>Mayank</strong> approved the budget for Q3.
                    <span>5 hours ago</span>
                  </div>
                </div>
                <div className={styles.activityItem}>
                  <div className={styles.activityDot}></div>
                  <div className={styles.activityInfo}>
                    <strong>System</strong> completed the nightly sync.
                    <span>Yesterday</span>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.rightColumn}>
              <div className={`${styles.botStatus} glass-panel`}>
                <h3>Bot Status</h3>
                <div className={styles.statusRow}>
                  <div className={styles.statusPulse}></div>
                  <p>System Online</p>
                </div>
                <div className={styles.botSpecs}>
                  <div className={styles.spec}>
                    <span>Model</span>
                    <span>Gemini 1.5 Flash</span>
                  </div>
                </div>
              </div>
              
              <ChatBox />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
