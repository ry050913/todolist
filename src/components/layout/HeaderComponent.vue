<!-- HeaderComponent.vue -->
<template>
  <header class="header" :class="{ 'dark-mode': uiStore.theme === 'dark' }">
    <div class="logo">
      <h1>📝 智能TodoList</h1>
      <span class="theme-indicator">{{ themeLabel }}</span>
    </div>

    <div class="actions">
      <button
          @click="toggleTheme"
          class="btn-icon theme-toggle"
          :title="themeToggleTitle"
          :aria-label="themeToggleTitle"
      >
        <span class="icon">{{ themeIcon }}</span>
        <span class="tooltip">{{ themeToggleTooltip }}</span>
      </button>

      <button
          @click="toggleAIPanel"
          class="btn-icon ai-toggle"
          title="AI助手"
          aria-label="打开AI助手面板"
      >
        <span class="icon">🤖</span>
        <span class="tooltip">AI助手</span>
        <span v-if="uiStore.showAIPanel" class="indicator"></span>
      </button>
    </div>
  </header>
</template>

<script setup>
import { computed, onErrorCaptured } from 'vue'
import { useUIStore } from '../../stores/uiStore'

// 错误处理
onErrorCaptured((error) => {
  console.error('HeaderComponent error:', error)
  return false
})

// 使用store
const uiStore = useUIStore()

// 计算属性
const themeIcon = computed(() => {
  return uiStore.theme === 'light' ? '🌙' : '☀️'
})

const themeLabel = computed(() => {
  return uiStore.theme === 'light' ? '浅色模式' : '深色模式'
})

const themeToggleTitle = computed(() => {
  return `切换到${uiStore.theme === 'light' ? '深色' : '浅色'}模式`
})

const themeToggleTooltip = computed(() => {
  return uiStore.theme === 'light' ? '开启深色模式' : '开启浅色模式'
})

// 方法
const toggleTheme = () => {
  uiStore.toggleTheme()
}

const toggleAIPanel = () => {
  uiStore.showAIPanel = !uiStore.showAIPanel
}
</script>

<style scoped>
/* 基础样式 */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: var(--primary-color, #1976d2);
  color: white;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  z-index: 100;
  box-shadow: var(--elevation-1, 0 2px 4px rgba(0, 0, 0, 0.1));
}

.logo {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.logo h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  letter-spacing: -0.5px;
}

.theme-indicator {
  font-size: 0.75rem;
  opacity: 0.8;
  font-weight: 400;
}

.actions {
  display: flex;
  gap: 12px;
}

.btn-icon {
  position: relative;
  background: rgba(255, 255, 255, 0.15);
  border: none;
  border-radius: var(--border-radius-lg, 12px);
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1.3rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.btn-icon:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.btn-icon:active {
  transform: translateY(0);
  transition-duration: 0.1s;
}

.btn-icon .tooltip {
  position: absolute;
  bottom: -30px;
  left: 50%;
  transform: translateX(-50%) translateY(10px);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 6px 12px;
  border-radius: var(--border-radius-sm, 4px);
  font-size: 0.75rem;
  white-space: nowrap;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s;
  pointer-events: none;
  z-index: 1000;
}

.btn-icon:hover .tooltip {
  opacity: 1;
  visibility: visible;
  transform: translateX(-50%) translateY(0);
}

.ai-toggle .indicator {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 8px;
  height: 8px;
  background: var(--info-color, #42a5f5);
  border-radius: 50%;
  animation: pulse 2s infinite;
}

/* 深色模式样式 */
.header.dark-mode {
  background: var(--surface-color, #1e1e1e);
  color: var(--text-color, #ffffff);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid var(--border-color, #2d2d2d);
}

.header.dark-mode .logo h1 {
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.header.dark-mode .theme-indicator {
  color: var(--text-secondary, #b0b0b0);
}

.header.dark-mode .btn-icon {
  background: var(--btn-secondary-bg, #2d2d2d);
  color: var(--btn-secondary-text, #e0e0e0);
  box-shadow: var(--elevation-1, 0 2px 4px rgba(0, 0, 0, 0.3));
}

.header.dark-mode .btn-icon:hover {
  background: var(--btn-secondary-hover, #3d3d3d);
  box-shadow: var(--elevation-2, 0 4px 8px rgba(0, 0, 0, 0.4));
}

.header.dark-mode .btn-icon .tooltip {
  background: var(--surface-color, #1e1e1e);
  color: var(--text-color, #ffffff);
  border: 1px solid var(--border-color, #2d2d2d);
  box-shadow: var(--elevation-2);
}

.header.dark-mode .ai-toggle .indicator {
  box-shadow: 0 0 8px var(--info-color, #42a5f5);
}

/* 主题切换按钮的特殊样式 */
.theme-toggle {
  position: relative;
}

.theme-toggle::after {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  border-radius: var(--border-radius-lg, 12px);
  background: linear-gradient(45deg,
  var(--primary-color, #1976d2),
  var(--info-color, #42a5f5),
  var(--primary-color, #1976d2)
  );
  z-index: -1;
  opacity: 0;
  transition: opacity 0.3s;
}

.header.dark-mode .theme-toggle::after {
  background: linear-gradient(45deg,
  var(--primary-color, #90caf9),
  var(--category-meeting, #80deea),
  var(--primary-color, #90caf9)
  );
}

.theme-toggle:hover::after {
  opacity: 0.3;
}

/* 动画 */
@keyframes pulse {
  0% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(66, 165, 245, 0.7);
  }
  70% {
    transform: scale(1);
    box-shadow: 0 0 0 6px rgba(66, 165, 245, 0);
  }
  100% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(66, 165, 245, 0);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .header {
    padding: 16px 20px;
  }

  .logo h1 {
    font-size: 1.25rem;
  }

  .btn-icon {
    width: 40px;
    height: 40px;
    font-size: 1.2rem;
  }

  .btn-icon .tooltip {
    display: none;
  }

  .theme-indicator {
    display: none;
  }
}

@media (max-width: 480px) {
  .header {
    flex-direction: column;
    gap: 12px;
    padding: 16px;
  }

  .logo {
    align-items: center;
  }

  .actions {
    width: 100%;
    justify-content: center;
  }
}

/* 打印样式 */
@media print {
  .header {
    background: white !important;
    color: black !important;
    box-shadow: none !important;
  }

  .btn-icon {
    display: none;
  }
}

/* 减少动效 */
@media (prefers-reduced-motion: reduce) {
  .header,
  .btn-icon,
  .btn-icon .tooltip {
    transition: none !important;
    animation: none !important;
  }

  .btn-icon:hover {
    transform: none !important;
  }
}
</style>