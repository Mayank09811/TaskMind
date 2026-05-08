/**
 * TimerManager — In-memory timer management for ETA-based follow-ups.
 * 
 * Stores setTimeout references per employee per pointer.
 * When a timer fires, it stores a notification in a queue that can
 * be polled by the frontend via the notifications API.
 */

export interface TimerNotification {
  id: string;
  employeeId: string;
  pointerIndex: number;
  pointerTitle: string;
  type: 'check_in' | 'nudge' | 'eod_reminder';
  message: string;
  createdAt: Date;
  read: boolean;
}

class TimerManager {
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private notifications: TimerNotification[] = [];

  /**
   * Create a unique key for a timer
   */
  private getKey(employeeId: string, pointerIndex: number): string {
    return `${employeeId}_${pointerIndex}`;
  }

  /**
   * Schedule a check-in for a specific pointer
   */
  scheduleCheckIn(
    employeeId: string,
    pointerIndex: number,
    pointerTitle: string,
    delayMs: number
  ): void {
    const key = this.getKey(employeeId, pointerIndex);

    // Clear existing timer for this key
    this.clearTimer(key);

    const timer = setTimeout(() => {
      const notification: TimerNotification = {
        id: `${key}_${Date.now()}`,
        employeeId,
        pointerIndex,
        pointerTitle,
        type: 'check_in',
        message: `⏰ Time check for "${pointerTitle}" — Is this task completed? Reply: ✅ Done / 🕐 Need more time / 🚨 Blocked`,
        createdAt: new Date(),
        read: false,
      };

      this.notifications.push(notification);
      console.log(`🔔 Timer fired for employee ${employeeId}, pointer: "${pointerTitle}"`);

      // Clean up the timer reference
      this.timers.delete(key);
    }, delayMs);

    this.timers.set(key, timer);
    console.log(`⏰ Timer scheduled for "${pointerTitle}" in ${Math.round(delayMs / 1000 / 60)} minutes`);
  }

  /**
   * Clear a specific timer
   */
  clearTimer(key: string): void {
    const existing = this.timers.get(key);
    if (existing) {
      clearTimeout(existing);
      this.timers.delete(key);
    }
  }

  /**
   * Clear all timers for an employee
   */
  clearAllForEmployee(employeeId: string): void {
    for (const [key, timer] of this.timers.entries()) {
      if (key.startsWith(employeeId)) {
        clearTimeout(timer);
        this.timers.delete(key);
      }
    }
  }

  /**
   * Get unread notifications for an employee
   */
  getNotifications(employeeId: string): TimerNotification[] {
    return this.notifications.filter(
      (n) => n.employeeId === employeeId && !n.read
    );
  }

  /**
   * Mark notifications as read
   */
  markAsRead(notificationIds: string[]): void {
    for (const n of this.notifications) {
      if (notificationIds.includes(n.id)) {
        n.read = true;
      }
    }
  }

  /**
   * Get active timer count
   */
  getActiveTimerCount(): number {
    return this.timers.size;
  }
}

// Singleton instance
declare global {
  // eslint-disable-next-line no-var
  var timerManagerInstance: TimerManager | undefined;
}

const timerManager: TimerManager =
  global.timerManagerInstance || new TimerManager();

if (!global.timerManagerInstance) {
  global.timerManagerInstance = timerManager;
}

export default timerManager;
