<template>
  <div class="app" :class="theme">
    <HeaderComponent />
    <div class="main-container">
      <SidebarComponent />
      <main class="main-content">
        <router-view />
      </main>
      <AIAssistantPanel v-if="showAIPanel" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useUIStore } from './stores/uiStore'
import HeaderComponent from './components/layout/HeaderComponent.vue'
import SidebarComponent from './components/layout/SidebarComponent.vue'
import AIAssistantPanel from './components/features/AIAssistantPanel.vue'

const uiStore = useUIStore()
const theme = computed(() => uiStore.theme)
const showAIPanel = computed(() => uiStore.showAIPanel)
</script>

<style>
:root {
  --primary-color: #1976d2;
  --background-color: #f5f5f5;
  --text-color: #333;
}

.dark {
  --primary-color: #90caf9;
  --background-color: #121212;
  --text-color: #fff;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.app {
  min-height: 100vh;
  background: var(--background-color);
  color: var(--text-color);
  transition: all 0.3s;
}

.main-container {
  display: flex;
  height: calc(100vh - 80px); /* 减去header高度 */
}

.main-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}
</style>