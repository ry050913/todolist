<template>
  <div class="statistics-view" ref="statsViewRef" :class="{ 'dark-mode': uiStore?.theme === 'dark' }">
    <!-- 统计概览卡片 -->
    <div class="stats-overview">
      <div class="stats-card total">
        <div class="stats-icon">📊</div>
        <div class="stats-content">
          <h3>{{ stats.total }}</h3>
          <p>总任务数</p>
        </div>
        <div class="stats-bg"></div>
      </div>

      <div class="stats-card completed">
        <div class="stats-icon">✅</div>
        <div class="stats-content">
          <h3>{{ stats.completed }}</h3>
          <p>已完成</p>
        </div>
        <div class="stats-bg"></div>
      </div>

      <div class="stats-card pending">
        <div class="stats-icon">⏳</div>
        <div class="stats-content">
          <h3>{{ stats.pending }}</h3>
          <p>进行中</p>
        </div>
        <div class="stats-bg"></div>
      </div>

      <div class="stats-card overdue">
        <div class="stats-icon">⚠️</div>
        <div class="stats-content">
          <h3>{{ stats.overdue }}</h3>
          <p>已逾期</p>
        </div>
        <div class="stats-bg"></div>
      </div>
    </div>

    <!-- 主要统计区域 -->
    <div class="main-stats">
      <!-- 左侧：完成率图表和分类统计 -->
      <div class="stats-left">
        <!-- 完成率环形图 -->
        <div class="chart-container">
          <div class="chart-header">
            <h3>任务完成率</h3>
            <span class="completion-rate">{{ stats.completionRate }}%</span>
          </div>
          <div class="ring-chart">
            <svg width="200" height="200" viewBox="0 0 200 200">
              <!-- 背景圆环 -->
              <circle
                  cx="100"
                  cy="100"
                  r="80"
                  fill="none"
                  :stroke="themeColors.ringBg"
                  stroke-width="16"
                  stroke-linecap="round"
              />
              <!-- 进度圆环 -->
              <circle
                  cx="100"
                  cy="100"
                  r="80"
                  fill="none"
                  :stroke="themeColors.primary"
                  stroke-width="16"
                  stroke-linecap="round"
                  :stroke-dasharray="`${completionRingLength} ${totalRingLength}`"
                  :stroke-dashoffset="completionRingOffset"
                  transform="rotate(-90 100 100)"
              />
              <text
                  x="100"
                  y="100"
                  text-anchor="middle"
                  dominant-baseline="central"
                  font-size="32"
                  font-weight="bold"
                  :fill="themeColors.primary"
              >
                {{ stats.completionRate }}%
              </text>
              <text
                  x="100"
                  y="130"
                  text-anchor="middle"
                  dominant-baseline="central"
                  font-size="14"
                  :fill="themeColors.textSecondary"
              >
                完成率
              </text>
            </svg>
          </div>
          <div class="chart-legend">
            <div class="legend-item">
              <span class="legend-color completed"></span>
              <span>已完成: {{ stats.completed }}</span>
            </div>
            <div class="legend-item">
              <span class="legend-color pending"></span>
              <span>进行中: {{ stats.pending }}</span>
            </div>
          </div>
        </div>

        <!-- 分类统计 -->
        <div class="category-stats">
          <div class="stats-header">
            <h3>任务分类分布</h3>
            <div class="stats-actions">
              <button class="btn-expand" @click="toggleCategoryExpanded">
                {{ categoryExpanded ? '收起' : '展开' }}
              </button>
            </div>
          </div>
          <div class="category-list" :class="{ 'expanded': categoryExpanded }">
            <div
                v-for="category in categoryStats"
                :key="category.name"
                class="category-item"
            >
              <div class="category-info">
                <span class="category-icon">{{ getCategoryIcon(category.name) }}</span>
                <div class="category-details">
                  <span class="category-name">{{ getCategoryName(category.name) }}</span>
                  <span class="category-count">{{ category.count }} 个</span>
                </div>
                <span class="category-percentage">{{ Math.round(category.percentage) }}%</span>
              </div>
              <div class="progress-bar">
                <div
                    class="progress"
                    :style="{ width: category.percentage + '%' }"
                    :class="category.name"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：优先级统计和时间分析 -->
      <div class="stats-right">
        <!-- 优先级统计 -->
        <div class="priority-stats">
          <h3>任务优先级分布</h3>
          <div class="priority-list">
            <div class="priority-item high">
              <div class="priority-header">
                <div class="priority-label">
                  <span class="priority-dot"></span>
                  <span>高优先级</span>
                </div>
                <div class="priority-numbers">
                  <span class="priority-count">{{ priorityStats.high }}</span>
                  <span class="priority-percentage">{{ Math.round(priorityPercentages.high) }}%</span>
                </div>
              </div>
              <div class="priority-bar">
                <div
                    class="progress"
                    :style="{ width: priorityPercentages.high + '%' }"
                ></div>
              </div>
            </div>

            <div class="priority-item medium">
              <div class="priority-header">
                <div class="priority-label">
                  <span class="priority-dot"></span>
                  <span>中优先级</span>
                </div>
                <div class="priority-numbers">
                  <span class="priority-count">{{ priorityStats.medium }}</span>
                  <span class="priority-percentage">{{ Math.round(priorityPercentages.medium) }}%</span>
                </div>
              </div>
              <div class="priority-bar">
                <div
                    class="progress"
                    :style="{ width: priorityPercentages.medium + '%' }"
                ></div>
              </div>
            </div>

            <div class="priority-item low">
              <div class="priority-header">
                <div class="priority-label">
                  <span class="priority-dot"></span>
                  <span>低优先级</span>
                </div>
                <div class="priority-numbers">
                  <span class="priority-count">{{ priorityStats.low }}</span>
                  <span class="priority-percentage">{{ Math.round(priorityPercentages.low) }}%</span>
                </div>
              </div>
              <div class="priority-bar">
                <div
                    class="progress"
                    :style="{ width: priorityPercentages.low + '%' }"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <!-- 时间趋势分析 - 折线图 -->
        <div class="trend-analysis">
          <div class="trend-header">
            <h3>最近7天完成任务趋势</h3>
            <div class="trend-controls">
              <button class="btn-trend" @click="cycleTrendView">
                {{ trendViewMode === 'week' ? '切换月度视图' : '切换周视图' }}
              </button>
            </div>
          </div>
          <div class="line-chart-container">
            <svg :width="lineChartWidth" :height="lineChartHeight" class="line-chart">
              <!-- 背景网格 -->
              <g class="chart-grid">
                <line
                    v-for="(grid, index) in gridLines"
                    :key="'grid-' + index"
                    :x1="chartPadding.left"
                    :y1="grid.y"
                    :x2="lineChartWidth - chartPadding.right"
                    :y2="grid.y"
                    :stroke="themeColors.gridLine"
                    stroke-width="1"
                    stroke-dasharray="4,2"
                />
              </g>

              <!-- X轴 -->
              <line
                  :x1="chartPadding.left"
                  :y1="lineChartHeight - chartPadding.bottom"
                  :x2="lineChartWidth - chartPadding.right"
                  :y2="lineChartHeight - chartPadding.bottom"
                  :stroke="themeColors.axisLine"
                  stroke-width="2"
              />

              <!-- Y轴 -->
              <line
                  :x1="chartPadding.left"
                  :y1="chartPadding.top"
                  :x2="chartPadding.left"
                  :y2="lineChartHeight - chartPadding.bottom"
                  :stroke="themeColors.axisLine"
                  stroke-width="2"
              />

              <!-- Y轴刻度 -->
              <g v-for="(grid, index) in gridLines" :key="'label-' + index">
                <text
                    :x="chartPadding.left - 8"
                    :y="grid.y"
                    text-anchor="end"
                    dominant-baseline="middle"
                    font-size="12"
                    :fill="themeColors.textSecondary"
                >
                  {{ grid.value }}
                </text>
              </g>

              <!-- 折线路径 -->
              <path
                  :d="linePath"
                  fill="none"
                  :stroke="themeColors.primary"
                  stroke-width="3"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="trend-line"
              />

              <!-- 填充区域 -->
              <path
                  :d="areaPath"
                  :fill="themeColors.areaFill"
                  stroke="none"
                  class="trend-area"
              />

              <!-- 数据点和标签 -->
              <g v-for="(point, index) in lineChartPoints" :key="'point-' + index">
                <!-- 数据点 -->
                <circle
                    :cx="point.x"
                    :cy="point.y"
                    r="6"
                    :fill="themeColors.surface"
                    :stroke="themeColors.primary"
                    stroke-width="3"
                    class="data-point"
                    @mouseenter="showTooltip(point, $event)"
                    @mouseleave="hideTooltip"
                />

                <!-- 悬浮显示详细信息 -->
                <title>{{ point.date }}: {{ point.completed }} 个任务</title>

                <!-- 日期标签 -->
                <text
                    :x="point.x"
                    :y="lineChartHeight - chartPadding.bottom + 20"
                    text-anchor="middle"
                    font-size="12"
                    :fill="themeColors.textSecondary"
                    font-weight="500"
                >
                  {{ point.dateLabel }}
                </text>

                <!-- 坐标轴刻度线 -->
                <line
                    :x1="point.x"
                    :y1="lineChartHeight - chartPadding.bottom"
                    :x2="point.x"
                    :y2="lineChartHeight - chartPadding.bottom + 5"
                    :stroke="themeColors.axisLine"
                    stroke-width="2"
                />

                <!-- 完成数量标签 -->
                <g v-if="point.completed > 0">
                  <rect
                      :x="point.x - 20"
                      :y="point.y - 40"
                      width="40"
                      height="24"
                      rx="4"
                      :fill="themeColors.primary"
                      opacity="0.9"
                  />
                  <text
                      :x="point.x"
                      :y="point.y - 25"
                      text-anchor="middle"
                      font-size="12"
                      fill="white"
                      font-weight="bold"
                  >
                    {{ point.completed }}
                  </text>
                  <line
                      :x1="point.x"
                      :y1="point.y - 15"
                      :x2="point.x"
                      :y2="point.y - 5"
                      :stroke="themeColors.primary"
                      stroke-width="1"
                      opacity="0.7"
                  />
                </g>
              </g>
            </svg>

            <!-- 悬浮提示框 -->
            <div
                v-if="tooltip.show"
                class="chart-tooltip"
                :style="{
                left: tooltip.x + 'px',
                top: tooltip.y + 'px'
              }"
            >
              <div class="tooltip-date">{{ tooltip.date }}</div>
              <div class="tooltip-count">完成任务: <strong>{{ tooltip.count }}</strong> 个</div>
            </div>
          </div>

          <!-- 图例说明 -->
          <div class="chart-legend">
            <div class="legend-item">
              <span class="legend-line"></span>
              <span>折线: 完成任务数量趋势</span>
            </div>
            <div class="legend-item">
              <span class="legend-point"></span>
              <span>圆点: 每日完成数量</span>
            </div>
          </div>
        </div>

        <!-- 效率指标 -->
        <div class="efficiency-metrics">
          <h3>效率指标</h3>
          <div class="metrics-grid">
            <div class="metric-card">
              <div class="metric-icon">⏱️</div>
              <div class="metric-content">
                <h4>{{ avgCompletionTime }}天</h4>
                <p>平均完成时间</p>
              </div>
            </div>
            <div class="metric-card">
              <div class="metric-icon">⚡</div>
              <div class="metric-content">
                <h4>{{ completionRate7Days }}%</h4>
                <p>7天完成率</p>
              </div>
            </div>
            <div class="metric-card">
              <div class="metric-icon">📈</div>
              <div class="metric-content">
                <h4>{{ productivityScore }}</h4>
                <p>生产力得分</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 详细数据表格 -->
    <div class="detailed-stats">
      <div class="detailed-header">
        <h3>详细任务统计</h3>
        <div class="table-controls">
          <button class="btn-export-csv" @click="exportAsCSV">📥 导出CSV</button>
        </div>
      </div>
      <div class="stats-table-container">
        <table class="stats-table">
          <thead>
          <tr>
            <th>分类</th>
            <th>总任务</th>
            <th>已完成</th>
            <th>进行中</th>
            <th>逾期</th>
            <th>完成率</th>
            <th>平均耗时(天)</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="category in detailedCategoryStats" :key="category.name">
            <td class="category-cell">
              <span class="category-icon-small">{{ getCategoryIcon(category.name) }}</span>
              {{ getCategoryName(category.name) }}
            </td>
            <td><span class="table-value">{{ category.total }}</span></td>
            <td><span class="table-value completed">{{ category.completed }}</span></td>
            <td><span class="table-value pending">{{ category.pending }}</span></td>
            <td><span class="table-value overdue">{{ category.overdue }}</span></td>
            <td>
              <div class="completion-cell">
                <span class="completion-text">{{ category.completionRate }}%</span>
                <div class="mini-progress">
                  <div
                      class="mini-progress-bar"
                      :style="{ width: category.completionRate + '%' }"
                  ></div>
                </div>
              </div>
            </td>
            <td><span class="table-value time">{{ category.avgCompletionTime }}</span></td>
          </tr>
          <tr class="total-row">
            <td><strong>总计</strong></td>
            <td><strong>{{ stats.total }}</strong></td>
            <td><strong>{{ stats.completed }}</strong></td>
            <td><strong>{{ stats.pending }}</strong></td>
            <td><strong>{{ stats.overdue }}</strong></td>
            <td><strong>{{ stats.completionRate }}%</strong></td>
            <td><strong>{{ avgCompletionTime }}天</strong></td>
          </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 图片导出按钮 -->
    <div class="stats-actions">
      <button class="btn-export-image" @click="exportAsImage">
        <span class="export-icon">🖼️</span>
        <span>导出统计视图为图片</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useTaskStore } from '../stores/taskStore'
import { useUIStore } from '../stores/uiStore'
import { format, subDays, differenceInDays, subMonths } from 'date-fns'
import html2canvas from 'html2canvas'

const taskStore = useTaskStore()
const uiStore = useUIStore()
const statsViewRef = ref(null)

// 视图状态
const categoryExpanded = ref(false)
const trendViewMode = ref('week') // 'week' or 'month'

// 折线图尺寸和配置
const lineChartWidth = 700
const lineChartHeight = 300
const chartPadding = { top: 40, right: 30, bottom: 60, left: 60 }

// 悬浮提示框状态
const tooltip = ref({
  show: false,
  x: 0,
  y: 0,
  date: '',
  count: 0
})

// 根据主题动态计算颜色
const themeColors = computed(() => {
  const isDark = uiStore?.theme === 'dark'
  return {
    primary: isDark ? 'var(--primary-color, #90caf9)' : 'var(--primary-color, #1976d2)',
    surface: isDark ? 'var(--surface-color, #1e1e1e)' : 'var(--surface-color, #ffffff)',
    background: isDark ? 'var(--background-color, #121212)' : 'var(--background-color, #f8f9fa)',
    textPrimary: isDark ? 'var(--text-color, #ffffff)' : 'var(--text-color, #333333)',
    textSecondary: isDark ? 'var(--text-secondary, #b0b0b0)' : 'var(--text-secondary, #666666)',
    border: isDark ? 'var(--border-color, #2d2d2d)' : 'var(--border-color, #e0e0e0)',
    cardBg: isDark ? 'var(--surface-color, #1e1e1e)' : 'var(--surface-color, #ffffff)',
    ringBg: isDark ? 'var(--secondary-color, #1e1e1e)' : '#e0e0e0',
    gridLine: isDark ? 'var(--border-color, #2d2d2d)' : '#f0f0f0',
    axisLine: isDark ? 'var(--border-color, #2d2d2d)' : '#666',
    areaFill: isDark ? 'rgba(144, 202, 249, 0.1)' : 'rgba(25, 118, 210, 0.1)',
    success: isDark ? 'var(--success-color, #66bb6a)' : '#4caf50',
    warning: isDark ? 'var(--warning-color, #ffb74d)' : '#ff9800',
    error: isDark ? 'var(--error-color, #ef5350)' : '#f44336',
    info: isDark ? 'var(--info-color, #42a5f5)' : '#2196f3'
  }
})

// 显示悬浮提示
const showTooltip = (point, event) => {
  const rect = event.target.getBoundingClientRect()
  const svgRect = event.target.closest('svg').getBoundingClientRect()

  tooltip.value = {
    show: true,
    x: rect.left - svgRect.left + 15,
    y: rect.top - svgRect.top - 60,
    date: `${point.dateLabel} (${point.date})`,
    count: point.completed
  }
}

// 隐藏悬浮提示
const hideTooltip = () => {
  tooltip.value.show = false
}

// 切换分类展开状态
const toggleCategoryExpanded = () => {
  categoryExpanded.value = !categoryExpanded.value
}

// 切换趋势视图模式
const cycleTrendView = () => {
  trendViewMode.value = trendViewMode.value === 'week' ? 'month' : 'week'
}

// 基础统计数据
const stats = computed(() => {
  const tasks = taskStore.tasks
  const total = tasks.length
  const completed = tasks.filter(t => t.completed).length
  const pending = total - completed
  const overdue = tasks.filter(t => {
    if (t.completed) return false
    if (!t.dueDate) return false
    return new Date(t.dueDate) < new Date()
  }).length

  return {
    total,
    completed,
    pending,
    overdue,
    completionRate: total ? Math.round((completed / total) * 100) : 0
  }
})

// 环形图计算
const totalRingLength = computed(() => 2 * Math.PI * 80)
const completionRingLength = computed(() => {
  return (stats.value.completionRate / 100) * totalRingLength.value
})
const completionRingOffset = computed(() => {
  return totalRingLength.value - completionRingLength.value
})

// 分类统计
const categoryStats = computed(() => {
  const tasks = taskStore.tasks
  const categories = {}

  tasks.forEach(task => {
    const category = task.category || 'general'
    if (!categories[category]) {
      categories[category] = 0
    }
    categories[category]++
  })

  const total = tasks.length
  return Object.entries(categories)
      .map(([name, count]) => ({
        name,
        count,
        percentage: total ? (count / total) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count)
})

// 详细分类统计
const detailedCategoryStats = computed(() => {
  const tasks = taskStore.tasks
  const categories = {}

  tasks.forEach(task => {
    const category = task.category || 'general'
    if (!categories[category]) {
      categories[category] = {
        name: category,
        total: 0,
        completed: 0,
        pending: 0,
        overdue: 0,
        completionTimes: []
      }
    }

    categories[category].total++

    if (task.completed) {
      categories[category].completed++
      if (task.createdAt && task.completedAt) {
        const start = new Date(task.createdAt)
        const end = new Date(task.completedAt)
        const days = differenceInDays(end, start)
        categories[category].completionTimes.push(Math.max(1, days))
      }
    } else {
      categories[category].pending++
      if (task.dueDate && new Date(task.dueDate) < new Date()) {
        categories[category].overdue++
      }
    }
  })

  return Object.values(categories).map(category => {
    const completionRate = category.total ? Math.round((category.completed / category.total) * 100) : 0
    const avgCompletionTime = category.completionTimes.length
        ? Math.round(category.completionTimes.reduce((a, b) => a + b, 0) / category.completionTimes.length)
        : 0

    return {
      ...category,
      completionRate,
      avgCompletionTime
    }
  }).sort((a, b) => b.total - a.total)
})

// 优先级统计
const priorityStats = computed(() => {
  const tasks = taskStore.tasks
  const stats = { high: 0, medium: 0, low: 0 }

  tasks.forEach(task => {
    const priority = task.priority || 'medium'
    if (stats[priority] !== undefined) {
      stats[priority]++
    }
  })

  return stats
})

const priorityPercentages = computed(() => {
  const total = stats.value.total
  if (!total) return { high: 0, medium: 0, low: 0 }

  return {
    high: (priorityStats.value.high / total) * 100,
    medium: (priorityStats.value.medium / total) * 100,
    low: (priorityStats.value.low / total) * 100
  }
})

// 最近7天完成任务趋势数据
const last7DaysCompleted = computed(() => {
  const tasks = taskStore.tasks
  const days = []

  for (let i = 6; i >= 0; i--) {
    const date = subDays(new Date(), i)
    const dateStr = format(date, 'yyyy-MM-dd')
    const dateLabel = format(date, 'M/d')

    const completed = tasks.filter(task => {
      if (!task.completed) return false
      if (!task.createdAt) return false
      const taskDate = format(new Date(task.createdAt), 'yyyy-MM-dd')
      return taskDate === dateStr
    }).length

    days.push({
      date: dateStr,
      dateLabel: dateLabel,
      completed
    })
  }

  return days
})

// 折线图数据点计算
const lineChartPoints = computed(() => {
  const data = last7DaysCompleted.value
  const maxValue = Math.max(...data.map(d => d.completed), 1)

  const pointWidth = (lineChartWidth - chartPadding.left - chartPadding.right) / (data.length - 1)

  return data.map((day, index) => {
    const x = chartPadding.left + (index * pointWidth)
    const y = chartPadding.top + (lineChartHeight - chartPadding.top - chartPadding.bottom) *
        (1 - day.completed / maxValue)

    return {
      ...day,
      x,
      y,
      value: day.completed
    }
  })
})

// 折线路径生成
const linePath = computed(() => {
  const points = lineChartPoints.value
  if (points.length < 2) return ''

  let path = `M ${points[0].x} ${points[0].y}`

  for (let i = 1; i < points.length; i++) {
    path += ` L ${points[i].x} ${points[i].y}`
  }

  return path
})

// 填充区域路径生成
const areaPath = computed(() => {
  const points = lineChartPoints.value
  if (points.length < 2) return ''

  let path = `M ${points[0].x} ${points[0].y}`

  for (let i = 1; i < points.length; i++) {
    path += ` L ${points[i].x} ${points[i].y}`
  }

  path += ` L ${points[points.length - 1].x} ${lineChartHeight - chartPadding.bottom}`
  path += ` L ${points[0].x} ${lineChartHeight - chartPadding.bottom}`
  path += ' Z'

  return path
})

// 网格线计算
const gridLines = computed(() => {
  const maxValue = Math.max(...last7DaysCompleted.value.map(d => d.completed), 1)
  const numGridLines = 5
  const lines = []

  for (let i = 0; i <= numGridLines; i++) {
    const value = Math.round((maxValue / numGridLines) * i)
    const y = chartPadding.top + (lineChartHeight - chartPadding.top - chartPadding.bottom) *
        (1 - i / numGridLines)

    lines.push({ y, value })
  }

  return lines
})

// 效率指标
const avgCompletionTime = computed(() => {
  const completedTasks = taskStore.tasks.filter(t => t.completed && t.createdAt && t.completedAt)
  if (completedTasks.length === 0) return 0

  const totalDays = completedTasks.reduce((sum, task) => {
    const start = new Date(task.createdAt)
    const end = new Date(task.completedAt)
    return sum + Math.max(1, differenceInDays(end, start))
  }, 0)

  return Math.round(totalDays / completedTasks.length)
})

const completionRate7Days = computed(() => {
  const lastWeek = subDays(new Date(), 7)
  const recentTasks = taskStore.tasks.filter(task => {
    if (!task.createdAt) return false
    return new Date(task.createdAt) >= lastWeek
  })

  if (recentTasks.length === 0) return 0

  const completed = recentTasks.filter(t => t.completed).length
  return Math.round((completed / recentTasks.length) * 100)
})

const productivityScore = computed(() => {
  const total = stats.value.total
  if (total === 0) return 0

  const score = Math.min(100, Math.round(
      stats.value.completionRate * 0.6 +
      (100 - (stats.value.overdue / total * 100)) * 0.4
  ))
  return isNaN(score) ? 0 : score
})

// 工具函数
const getCategoryIcon = (category) => {
  const icons = {
    work: '💼',
    study: '📚',
    life: '🏠',
    shopping: '🛒',
    meeting: '👥',
    exercise: '🏃',
    general: '📝'
  }
  return icons[category] || '📋'
}

const getCategoryName = (category) => {
  const names = {
    work: '工作',
    study: '学习',
    life: '生活',
    shopping: '购物',
    meeting: '会议',
    exercise: '运动',
    general: '通用'
  }
  return names[category] || category
}

// 导出为图片功能
const exportAsImage = async () => {
  if (!statsViewRef.value) {
    alert('无法获取统计视图内容')
    return
  }

  try {
    const originalText = event.target.textContent
    event.target.textContent = '正在生成图片...'
    event.target.disabled = true

    await nextTick()

    const canvas = await html2canvas(statsViewRef.value, {
      backgroundColor: uiStore?.theme === 'dark' ? '#121212' : '#f8f9fa',
      scale: 2,
      useCORS: true,
      logging: false
    })

    const imageUrl = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.href = imageUrl
    link.download = `任务统计报告_${format(new Date(), 'yyyy-MM-dd_HH-mm-ss')}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    event.target.textContent = originalText
    event.target.disabled = false

  } catch (error) {
    console.error('导出图片失败:', error)
    alert('导出图片失败，请重试')
    event.target.textContent = '导出统计视图为图片'
    event.target.disabled = false
  }
}

// 导出为CSV功能
const exportAsCSV = () => {
  const headers = ['分类', '总任务', '已完成', '进行中', '逾期', '完成率(%)', '平均耗时(天)']
  const rows = detailedCategoryStats.value.map(cat => [
    getCategoryName(cat.name),
    cat.total,
    cat.completed,
    cat.pending,
    cat.overdue,
    cat.completionRate,
    cat.avgCompletionTime
  ])

  rows.push(['总计', stats.value.total, stats.value.completed, stats.value.pending,
    stats.value.overdue, stats.value.completionRate, avgCompletionTime.value])

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n')

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `任务统计_${format(new Date(), 'yyyy-MM-dd_HH-mm-ss')}.csv`
  link.click()
}

// 初始化
onMounted(() => {
  console.log('统计视图已加载')
})
</script>

<style scoped>
/* ========== 基础样式 ========== */
.statistics-view {
  padding: 24px;
  min-height: 100vh;
  transition: background-color 0.4s ease, color 0.4s ease;
  background: var(--background-color, #f8f9fa);
  color: var(--text-color, #333333);
}

/* ========== 统计概览卡片 ========== */
.stats-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.stats-card {
  position: relative;
  background: var(--surface-color, #ffffff);
  border-radius: 16px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: var(--card-shadow, 0 2px 12px rgba(0, 0, 0, 0.08));
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  border: 1px solid var(--border-color, transparent);
}

.stats-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--elevation-2, 0 8px 24px rgba(0, 0, 0, 0.12));
}

.stats-card.total {
  border-left: 4px solid var(--info-color, #2196f3);
}

.stats-card.completed {
  border-left: 4px solid var(--success-color, #4caf50);
}

.stats-card.pending {
  border-left: 4px solid var(--warning-color, #ff9800);
}

.stats-card.overdue {
  border-left: 4px solid var(--error-color, #f44336);
}

.stats-icon {
  font-size: 2.8rem;
  opacity: 0.9;
}

.stats-content h3 {
  margin: 0;
  font-size: 2.2rem;
  font-weight: 700;
  color: var(--text-color, #333333);
  line-height: 1;
}

.stats-content p {
  margin: 8px 0 0 0;
  color: var(--text-secondary, #666666);
  font-size: 0.95rem;
  font-weight: 500;
}

.stats-bg {
  position: absolute;
  top: 0;
  right: 0;
  width: 80px;
  height: 80px;
  opacity: 0.1;
  background: currentColor;
  clip-path: polygon(100% 0, 0% 100%, 100% 100%);
}

/* ========== 主要统计区域 ========== */
.main-stats {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 32px;
  margin-bottom: 32px;
}

@media (max-width: 1200px) {
  .main-stats {
    grid-template-columns: 1fr;
  }
}

/* ========== 左侧统计 ========== */
.stats-left {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.chart-container {
  background: var(--surface-color, #ffffff);
  border-radius: 16px;
  padding: 24px;
  box-shadow: var(--card-shadow, 0 2px 12px rgba(0, 0, 0, 0.08));
  border: 1px solid var(--border-color, transparent);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.chart-header h3 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--text-color, #333333);
}

.completion-rate {
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--primary-color, #1976d2);
}

.ring-chart {
  display: flex;
  justify-content: center;
  margin: 20px 0;
}

.chart-legend {
  display: flex;
  justify-content: center;
  gap: 24px;
  margin-top: 20px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.95rem;
  color: var(--text-secondary, #666666);
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.legend-color.completed {
  background: var(--primary-color, #1976d2);
}

.legend-color.pending {
  background: var(--warning-color, #ff9800);
}

/* ========== 分类统计 ========== */
.category-stats {
  background: var(--surface-color, #ffffff);
  border-radius: 16px;
  padding: 24px;
  box-shadow: var(--card-shadow, 0 2px 12px rgba(0, 0, 0, 0.08));
  border: 1px solid var(--border-color, transparent);
}

.stats-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.stats-header h3 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--text-color, #333333);
}

.btn-expand {
  padding: 6px 12px;
  background: var(--secondary-color, #f5f5f5);
  border: 1px solid var(--border-color, #e0e0e0);
  border-radius: 6px;
  color: var(--text-secondary, #666666);
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-expand:hover {
  background: var(--hover-color, #e0e0e0);
}

.category-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-height: 300px;
  overflow-y: hidden;
  transition: max-height 0.3s ease;
}

.category-list.expanded {
  max-height: 600px;
  overflow-y: auto;
}

.category-list::-webkit-scrollbar {
  width: 6px;
}

.category-list::-webkit-scrollbar-track {
  background: var(--secondary-color, #f5f5f5);
  border-radius: 3px;
}

.category-list::-webkit-scrollbar-thumb {
  background: var(--border-color, #e0e0e0);
  border-radius: 3px;
}

.category-item {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.category-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.category-icon {
  font-size: 1.4rem;
}

.category-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.category-name {
  font-weight: 500;
  color: var(--text-color, #333333);
}

.category-count {
  font-size: 0.85rem;
  color: var(--text-secondary, #666666);
}

.category-percentage {
  font-weight: 600;
  color: var(--text-color, #333333);
  min-width: 40px;
  text-align: right;
}

.progress-bar {
  height: 8px;
  background: var(--secondary-color, #f5f5f5);
  border-radius: 4px;
  overflow: hidden;
  position: relative;
}

.progress {
  height: 100%;
  border-radius: 4px;
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 分类颜色 */
.progress.work { background: var(--category-work, #1976d2); }
.progress.study { background: var(--category-study, #4caf50); }
.progress.life { background: var(--category-life, #ff9800); }
.progress.shopping { background: var(--category-shopping, #9c27b0); }
.progress.meeting { background: var(--category-meeting, #00bcd4); }
.progress.exercise { background: var(--category-exercise, #ff5722); }
.progress.general { background: var(--category-general, #607d8b); }

/* ========== 右侧统计 ========== */
.stats-right {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.priority-stats,
.trend-analysis,
.efficiency-metrics {
  background: var(--surface-color, #ffffff);
  border-radius: 16px;
  padding: 24px;
  box-shadow: var(--card-shadow, 0 2px 12px rgba(0, 0, 0, 0.08));
  border: 1px solid var(--border-color, transparent);
}

.priority-stats h3,
.trend-analysis h3,
.efficiency-metrics h3 {
  margin: 0 0 24px 0;
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--text-color, #333333);
}

/* 优先级统计 */
.priority-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.priority-item {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.priority-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.priority-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  color: var(--text-color, #333333);
}

.priority-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.priority-item.high .priority-dot {
  background: var(--priority-high, #f44336);
  box-shadow: 0 0 8px rgba(244, 67, 54, 0.3);
}

.priority-item.medium .priority-dot {
  background: var(--priority-medium, #ff9800);
  box-shadow: 0 0 8px rgba(255, 152, 0, 0.3);
}

.priority-item.low .priority-dot {
  background: var(--priority-low, #4caf50);
  box-shadow: 0 0 8px rgba(76, 175, 80, 0.3);
}

.priority-numbers {
  display: flex;
  gap: 12px;
  align-items: center;
}

.priority-count {
  font-weight: 600;
  color: var(--text-color, #333333);
}

.priority-percentage {
  font-size: 0.9rem;
  color: var(--text-secondary, #666666);
  min-width: 40px;
  text-align: right;
}

.priority-bar {
  height: 8px;
  background: var(--secondary-color, #f5f5f5);
  border-radius: 4px;
  overflow: hidden;
}

.priority-item.high .priority-bar .progress {
  background: var(--priority-high, #f44336);
}

.priority-item.medium .priority-bar .progress {
  background: var(--priority-medium, #ff9800);
}

.priority-item.low .priority-bar .progress {
  background: var(--priority-low, #4caf50);
}

/* 趋势分析 */
.trend-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.btn-trend {
  padding: 6px 12px;
  background: var(--secondary-color, #f5f5f5);
  border: 1px solid var(--border-color, #e0e0e0);
  border-radius: 6px;
  color: var(--text-secondary, #666666);
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-trend:hover {
  background: var(--hover-color, #e0e0e0);
}

.line-chart-container {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px 0;
  margin: 20px 0;
}

.line-chart {
  background: var(--surface-color, #ffffff);
  border-radius: 12px;
  box-shadow: var(--elevation-1, 0 2px 4px rgba(0, 0, 0, 0.1));
  border: 1px solid var(--border-color, transparent);
}

.data-point {
  cursor: pointer;
  transition: all 0.2s ease;
}

.data-point:hover {
  r: 8;
  stroke-width: 4;
  fill: var(--primary-color, #1976d2);
}

/* 悬浮提示框 */
.chart-tooltip {
  position: absolute;
  background: var(--surface-color, rgba(0, 0, 0, 0.85));
  color: var(--text-color, white);
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  pointer-events: none;
  z-index: 1000;
  box-shadow: var(--elevation-2, 0 4px 12px rgba(0, 0, 0, 0.15));
  min-width: 180px;
  transform: translateX(-50%);
  backdrop-filter: blur(4px);
  border: 1px solid var(--border-color, transparent);
}

.chart-tooltip::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  border-width: 8px 8px 0;
  border-style: solid;
  border-color: var(--surface-color, rgba(0, 0, 0, 0.85)) transparent transparent;
}

.tooltip-date {
  font-weight: 600;
  margin-bottom: 4px;
  color: var(--text-color, #fff);
  border-bottom: 1px solid var(--border-color, rgba(255, 255, 255, 0.2));
  padding-bottom: 4px;
}

.tooltip-count {
  color: var(--text-secondary, #e0e0e0);
}

.tooltip-count strong {
  color: var(--text-color, white);
  font-size: 16px;
}

/* 趋势图图例 */
.trend-analysis .chart-legend {
  display: flex;
  justify-content: center;
  gap: 24px;
  margin-top: 20px;
  padding: 16px;
  background: var(--secondary-color, #f8f9fa);
  border-radius: 8px;
  font-size: 0.9rem;
}

.trend-analysis .legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-secondary, #666666);
}

.legend-line {
  width: 24px;
  height: 3px;
  background: var(--primary-color, #1976d2);
  border-radius: 2px;
}

.legend-point {
  width: 12px;
  height: 12px;
  background: var(--primary-color, #1976d2);
  border: 2px solid var(--surface-color, #ffffff);
  border-radius: 50%;
  box-shadow: 0 0 0 2px var(--primary-color, #1976d2);
}

/* 效率指标 */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 20px;
}

.metric-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: var(--secondary-color, #f8f9fa);
  border-radius: 12px;
  transition: all 0.3s;
  border: 1px solid var(--border-color, transparent);
}

.metric-card:hover {
  transform: translateY(-2px);
  background: var(--hover-color, #e0e0e0);
  box-shadow: var(--elevation-1, 0 4px 8px rgba(0, 0, 0, 0.1));
}

.metric-icon {
  font-size: 2rem;
  opacity: 0.9;
}

.metric-content h4 {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--text-color, #333333);
}

.metric-content p {
  margin: 6px 0 0 0;
  font-size: 0.85rem;
  color: var(--text-secondary, #666666);
}

/* ========== 详细统计表格 ========== */
.detailed-stats {
  background: var(--surface-color, #ffffff);
  border-radius: 16px;
  padding: 24px;
  box-shadow: var(--card-shadow, 0 2px 12px rgba(0, 0, 0, 0.08));
  border: 1px solid var(--border-color, transparent);
  margin-bottom: 32px;
}

.detailed-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.detailed-header h3 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--text-color, #333333);
}

.btn-export-csv {
  padding: 8px 16px;
  background: var(--secondary-color, #f5f5f5);
  border: 1px solid var(--border-color, #e0e0e0);
  border-radius: 8px;
  color: var(--text-secondary, #666666);
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-export-csv:hover {
  background: var(--hover-color, #e0e0e0);
}

.stats-table-container {
  overflow-x: auto;
  border-radius: 8px;
  border: 1px solid var(--border-color, #e0e0e0);
}

.stats-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 800px;
}

.stats-table th {
  background: var(--secondary-color, #f8f9fa);
  padding: 16px;
  text-align: left;
  font-weight: 600;
  color: var(--text-color, #333333);
  border-bottom: 2px solid var(--border-color, #eee);
  font-size: 0.95rem;
}

.stats-table td {
  padding: 16px;
  border-bottom: 1px solid var(--border-color, #eee);
  color: var(--text-secondary, #666666);
  font-size: 0.95rem;
}

.stats-table tr:hover {
  background: var(--hover-color, #f8f9fa);
}

.category-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  color: var(--text-color, #333333);
}

.category-icon-small {
  font-size: 1.1rem;
}

.table-value {
  font-weight: 600;
}

.table-value.completed { color: var(--success-color, #4caf50); }
.table-value.pending { color: var(--warning-color, #ff9800); }
.table-value.overdue { color: var(--error-color, #f44336); }
.table-value.time { color: var(--info-color, #2196f3); }

.completion-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.completion-text {
  min-width: 40px;
  font-weight: 600;
}

.mini-progress {
  flex: 1;
  height: 6px;
  background: var(--secondary-color, #f0f0f0);
  border-radius: 3px;
  overflow: hidden;
}

.mini-progress-bar {
  height: 100%;
  background: var(--primary-color, #1976d2);
  border-radius: 3px;
  transition: width 0.5s ease;
}

.total-row {
  background: var(--secondary-color, #f8f9fa);
  font-weight: 700;
}

.total-row td {
  border-top: 2px solid var(--border-color, #eee);
  color: var(--text-color, #333333);
}

/* ========== 导出按钮 ========== */
.stats-actions {
  display: flex;
  justify-content: center;
  padding: 20px;
}

.btn-export-image {
  padding: 14px 28px;
  background: linear-gradient(135deg, var(--primary-color, #667eea) 0%, var(--info-color, #764ba2) 100%);
  color: white;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.btn-export-image:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
}

.btn-export-image:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.btn-export-image:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.export-icon {
  font-size: 1.2rem;
}

/* ========== 深色模式 ========== */
.dark-mode .statistics-view {
  background: var(--background-color, #121212);
}

.dark-mode .stats-card {
  background: var(--surface-color, #1e1e1e);
  border-color: var(--border-color, #2d2d2d);
}

.dark-mode .chart-container,
.dark-mode .category-stats,
.dark-mode .priority-stats,
.dark-mode .trend-analysis,
.dark-mode .efficiency-metrics,
.dark-mode .detailed-stats {
  background: var(--surface-color, #1e1e1e);
  border-color: var(--border-color, #2d2d2d);
}

.dark-mode .chart-header h3,
.dark-mode .stats-header h3,
.dark-mode .priority-stats h3,
.dark-mode .trend-analysis h3,
.dark-mode .efficiency-metrics h3,
.dark-mode .detailed-header h3 {
  color: var(--text-color, #ffffff);
}

.dark-mode .stats-content p,
.dark-mode .legend-item,
.dark-mode .category-count,
.dark-mode .priority-percentage,
.dark-mode .metric-content p {
  color: var(--text-secondary, #b0b0b0);
}

.dark-mode .stats-content h3,
.dark-mode .completion-rate,
.dark-mode .category-name,
.dark-mode .category-percentage,
.dark-mode .priority-label,
.dark-mode .priority-count,
.dark-mode .metric-content h4,
.dark-mode .table-value,
.dark-mode .completion-text {
  color: var(--text-color, #ffffff);
}

.dark-mode .completion-rate {
  color: var(--primary-color, #90caf9);
}

.dark-mode .btn-expand,
.dark-mode .btn-trend,
.dark-mode .btn-export-csv {
  background: var(--secondary-color, #2d2d2d);
  border-color: var(--border-color, #424242);
  color: var(--text-secondary, #b0b0b0);
}

.dark-mode .btn-expand:hover,
.dark-mode .btn-trend:hover,
.dark-mode .btn-export-csv:hover {
  background: var(--hover-color, #3d3d3d);
}

.dark-mode .progress-bar,
.dark-mode .priority-bar,
.dark-mode .mini-progress {
  background: var(--secondary-color, #2d2d2d);
}

.dark-mode .line-chart {
  background: var(--surface-color, #1e1e1e);
  border-color: var(--border-color, #2d2d2d);
}

.dark-mode .data-point:hover {
  fill: var(--primary-color, #90caf9);
}

.dark-mode .chart-tooltip {
  background: var(--surface-color, #2d2d2d);
  border-color: var(--border-color, #424242);
}

.dark-mode .trend-analysis .chart-legend {
  background: var(--secondary-color, #2d2d2d);
}

.dark-mode .metric-card {
  background: var(--secondary-color, #2d2d2d);
  border-color: var(--border-color, #424242);
}

.dark-mode .metric-card:hover {
  background: var(--hover-color, #3d3d3d);
}

.dark-mode .stats-table th {
  background: var(--secondary-color, #2d2d2d);
  color: var(--text-color, #ffffff);
  border-bottom-color: var(--border-color, #424242);
}

.dark-mode .stats-table td {
  color: var(--text-secondary, #b0b0b0);
  border-bottom-color: var(--border-color, #424242);
}

.dark-mode .stats-table tr:hover {
  background: var(--hover-color, #2a2a2a);
}

.dark-mode .total-row {
  background: var(--secondary-color, #2d2d2d);
}

.dark-mode .total-row td {
  color: var(--text-color, #ffffff);
  border-top-color: var(--border-color, #424242);
}

.dark-mode .btn-export-image {
  background: linear-gradient(135deg,
  var(--primary-color, #90caf9) 0%,
  var(--info-color, #42a5f5) 100%);
  box-shadow: 0 4px 12px rgba(144, 202, 249, 0.3);
}

/* ========== 响应式设计 ========== */
@media (max-width: 1400px) {
  .main-stats {
    gap: 24px;
  }
}

@media (max-width: 1200px) {
  .stats-overview {
    grid-template-columns: repeat(2, 1fr);
  }

  .metrics-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 992px) {
  .statistics-view {
    padding: 16px;
  }

  .stats-overview {
    gap: 16px;
  }

  .stats-card {
    padding: 20px;
  }
}

@media (max-width: 768px) {
  .stats-overview {
    grid-template-columns: 1fr;
  }

  .main-stats {
    gap: 20px;
  }

  .metrics-grid {
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  }

  .line-chart-container {
    overflow-x: auto;
    justify-content: flex-start;
  }

  .line-chart {
    min-width: 600px;
  }

  .trend-analysis .chart-legend {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .stats-actions {
    flex-direction: column;
    gap: 12px;
  }

  .btn-export-image {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .stats-card {
    flex-direction: column;
    text-align: center;
    gap: 16px;
  }

  .stats-icon {
    font-size: 2.2rem;
  }

  .stats-content h3 {
    font-size: 1.8rem;
  }

  .chart-header,
  .stats-header,
  .trend-header,
  .detailed-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .line-chart {
    min-width: 500px;
  }
}

/* ========== 减少动效 ========== */
@media (prefers-reduced-motion: reduce) {
  .statistics-view,
  .stats-card,
  .chart-container,
  .category-stats,
  .priority-stats,
  .trend-analysis,
  .efficiency-metrics,
  .detailed-stats,
  .metric-card,
  .progress,
  .mini-progress-bar {
    transition: none !important;
  }

  .stats-card:hover,
  .metric-card:hover {
    transform: none !important;
  }
}
</style>