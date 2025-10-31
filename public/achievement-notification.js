// Achievement Notification System
class AchievementNotification {
  constructor() {
    this.notifications = [];
    this.initStyles();
  }

  initStyles() {
    if (document.getElementById('achievement-notification-styles')) return;

    const style = document.createElement('style');
    style.id = 'achievement-notification-styles';
    style.innerHTML = `
      .achievement-notification-container {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        max-width: 400px;
      }

      .achievement-notification {
        background: linear-gradient(135deg, #FAD961 0%, #F76B1C 100%);
        color: white;
        padding: 20px;
        border-radius: 15px;
        margin-bottom: 15px;
        box-shadow: 0 10px 30px rgba(247, 107, 28, 0.4);
        animation: slideInRight 0.5s ease, glow 2s infinite;
        display: flex;
        align-items: center;
        gap: 15px;
        cursor: pointer;
        transition: transform 0.3s ease;
      }

      .achievement-notification:hover {
        transform: translateX(-5px);
      }

      @keyframes slideInRight {
        from {
          transform: translateX(500px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }

      @keyframes glow {
        0%, 100% {
          box-shadow: 0 10px 30px rgba(247, 107, 28, 0.4);
        }
        50% {
          box-shadow: 0 10px 40px rgba(247, 107, 28, 0.7);
        }
      }

      @keyframes slideOutRight {
        to {
          transform: translateX(500px);
          opacity: 0;
        }
      }

      .achievement-notification.removing {
        animation: slideOutRight 0.5s ease;
      }

      .achievement-icon {
        font-size: 3em;
        filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.3));
      }

      .achievement-content {
        flex: 1;
      }

      .achievement-title {
        font-size: 0.9em;
        opacity: 0.9;
        margin-bottom: 5px;
      }

      .achievement-name {
        font-size: 1.3em;
        font-weight: bold;
        margin-bottom: 5px;
      }

      .achievement-reward {
        font-size: 1em;
        opacity: 0.9;
      }

      .xp-notification {
        background: linear-gradient(135deg, #6c5ce7, #00cec9);
        color: white;
        padding: 20px;
        border-radius: 15px;
        margin-bottom: 15px;
        box-shadow: 0 10px 30px rgba(108, 92, 231, 0.4);
        animation: slideInRight 0.5s ease;
        text-align: center;
      }

      .xp-amount {
        font-size: 3em;
        font-weight: bold;
        margin-bottom: 10px;
      }

      .xp-breakdown {
        margin-top: 15px;
        font-size: 0.9em;
        opacity: 0.9;
      }

      .xp-breakdown-item {
        display: flex;
        justify-content: space-between;
        margin: 5px 0;
        padding: 5px 10px;
        background: rgba(255,255,255,0.2);
        border-radius: 5px;
      }

      .tier-notification {
        background: linear-gradient(135deg, #FFD700, #FFA500);
        color: #333;
        padding: 25px;
        border-radius: 15px;
        margin-bottom: 15px;
        box-shadow: 0 10px 30px rgba(255, 215, 0, 0.5);
        animation: slideInRight 0.5s ease, glow 2s infinite;
        text-align: center;
      }

      .tier-icon {
        font-size: 4em;
        margin-bottom: 10px;
      }

      .tier-title {
        font-size: 1.2em;
        margin-bottom: 10px;
        opacity: 0.9;
      }

      .tier-name {
        font-size: 2em;
        font-weight: bold;
        margin-bottom: 10px;
      }

      @media (max-width: 768px) {
        .achievement-notification-container {
          max-width: calc(100% - 40px);
          right: 20px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  createContainer() {
    let container = document.getElementById('achievement-notification-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'achievement-notification-container';
      container.className = 'achievement-notification-container';
      document.body.appendChild(container);
    }
    return container;
  }

  showAchievement(achievement) {
    const container = this.createContainer();

    const notification = document.createElement('div');
    notification.className = 'achievement-notification';
    notification.innerHTML = `
      <div class="achievement-icon">${achievement.icon}</div>
      <div class="achievement-content">
        <div class="achievement-title">🏆 Achievement Unlocked!</div>
        <div class="achievement-name">${achievement.name}</div>
        <div class="achievement-reward">+${achievement.xpReward} XP</div>
      </div>
    `;

    container.appendChild(notification);

    // Auto remove after 5 seconds
    setTimeout(() => {
      this.removeNotification(notification);
    }, 5000);

    // Click to dismiss
    notification.addEventListener('click', () => {
      this.removeNotification(notification);
    });

    // Play sound if available
    this.playAchievementSound();
  }

  showXP(xpData) {
    const container = this.createContainer();

    const notification = document.createElement('div');
    notification.className = 'xp-notification';

    let breakdownHtml = '';
    if (xpData.breakdown) {
      breakdownHtml = '<div class="xp-breakdown">';
      if (xpData.breakdown.completion) {
        breakdownHtml += `<div class="xp-breakdown-item"><span>Completion</span><span>+${xpData.breakdown.completion} XP</span></div>`;
      }
      if (xpData.breakdown.correctAnswers) {
        breakdownHtml += `<div class="xp-breakdown-item"><span>Correct Answers</span><span>+${xpData.breakdown.correctAnswers} XP</span></div>`;
      }
      if (xpData.breakdown.scoreBonus) {
        breakdownHtml += `<div class="xp-breakdown-item"><span>Score Bonus</span><span>+${xpData.breakdown.scoreBonus} XP</span></div>`;
      }
      if (xpData.breakdown.speedBonus) {
        breakdownHtml += `<div class="xp-breakdown-item"><span>Speed Bonus</span><span>+${xpData.breakdown.speedBonus} XP</span></div>`;
      }
      if (xpData.breakdown.firstAttempt) {
        breakdownHtml += `<div class="xp-breakdown-item"><span>First Attempt</span><span>+${xpData.breakdown.firstAttempt} XP</span></div>`;
      }
      breakdownHtml += '</div>';
    }

    notification.innerHTML = `
      <div class="xp-amount">+${xpData.xpEarned} XP</div>
      <div>Total XP: ${xpData.totalXP.toLocaleString()}</div>
      ${breakdownHtml}
    `;

    container.appendChild(notification);

    // Auto remove after 6 seconds
    setTimeout(() => {
      this.removeNotification(notification);
    }, 6000);

    // Click to dismiss
    notification.addEventListener('click', () => {
      this.removeNotification(notification);
    });
  }

  showTierUp(tierData) {
    const container = this.createContainer();

    const notification = document.createElement('div');
    notification.className = 'tier-notification';
    notification.innerHTML = `
      <div class="tier-icon">${tierData.icon}</div>
      <div class="tier-title">🎉 Rank Up!</div>
      <div class="tier-name">${tierData.name}</div>
      <div>${tierData.benefits}</div>
    `;

    container.appendChild(notification);

    // Auto remove after 7 seconds
    setTimeout(() => {
      this.removeNotification(notification);
    }, 7000);

    // Click to dismiss
    notification.addEventListener('click', () => {
      this.removeNotification(notification);
    });

    // Play special sound
    this.playTierUpSound();
  }

  removeNotification(notification) {
    notification.classList.add('removing');
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 500);
  }

  playAchievementSound() {
    try {
      // Try to use the existing sound manager if available
      if (window.soundManager && typeof window.soundManager.playSuccess === 'function') {
        window.soundManager.playSuccess();
      } else {
        // Create a simple achievement sound
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 800;
        gainNode.gain.value = 0.3;

        oscillator.start();
        setTimeout(() => {
          oscillator.frequency.value = 1000;
        }, 100);
        setTimeout(() => {
          oscillator.frequency.value = 1200;
        }, 200);
        setTimeout(() => {
          oscillator.stop();
        }, 300);
      }
    } catch (e) {
      console.log('Could not play achievement sound:', e);
    }
  }

  playTierUpSound() {
    try {
      if (window.soundManager && typeof window.soundManager.playPerfectScore === 'function') {
        window.soundManager.playPerfectScore();
      } else {
        // Create a triumphant tier-up sound
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.type = 'sine';
        gainNode.gain.value = 0.3;

        const notes = [523, 659, 784, 1047]; // C, E, G, C (triumphant chord)
        let time = 0;

        notes.forEach((freq, i) => {
          setTimeout(() => {
            oscillator.frequency.value = freq;
          }, time);
          time += 150;
        });

        oscillator.start();
        setTimeout(() => {
          oscillator.stop();
        }, time);
      }
    } catch (e) {
      console.log('Could not play tier-up sound:', e);
    }
  }

  showResults(achievementData) {
    if (!achievementData) return;

    // Show XP first
    if (achievementData.xpEarned) {
      this.showXP({
        xpEarned: achievementData.xpEarned,
        totalXP: achievementData.totalXP,
        breakdown: achievementData.xpBreakdown
      });
    }

    // Show tier up if applicable (with delay)
    if (achievementData.tierChanged && achievementData.newTier) {
      setTimeout(() => {
        this.showTierUp(achievementData.newTier);
      }, 1500);
    }

    // Show achievements (with delays)
    if (achievementData.unlockedAchievements && achievementData.unlockedAchievements.length > 0) {
      achievementData.unlockedAchievements.forEach((achievement, index) => {
        setTimeout(() => {
          this.showAchievement(achievement);
        }, 2500 + (index * 1000)); // Stagger achievement notifications
      });
    }
  }
}

// Create global instance
if (typeof window !== 'undefined') {
  window.achievementNotification = new AchievementNotification();
}
