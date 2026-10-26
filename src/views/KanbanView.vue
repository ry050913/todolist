<template>
  <div class="kanban-view" :class="{ 'dark-mode': uiStore.theme === 'dark' }">
    <!-- 顶部工具栏 -->
    <div class="kanban-toolbar">
      <div class="toolbar-left">
        <div class="view-controls">
          <div class="view-group">
            <span class="view-label">查看:</span>

            <!-- 查看模式选择 -->
            <select v-model="viewMode" class="view-select" @change="changeViewMode">
              <option value="status">按状态</option>
              <option value="priority">按优先级</option>
              <option value="category">按分类</option>
              <option value="time">按创建时间</option>
            </select>

            <!-- 关键词搜索 -->
            <div class="search-box">
              <input
                  v-model="searchText"
                  type="text"
                  placeholder="搜索任务..."
                  class="search-input"
                  @input="applySearch"
              >
              <span class="search-icon">🔍</span>
            </div>
          </div>
        </div>
      </div>

      <div class="toolbar-right">
        <!-- 在"进行中"列中添加任务按钮 -->
        <div v-if="viewMode === 'status'" class="action-buttons">
<!--          <button @click="addTaskToColumn('in-progress')" class="btn-primary">-->
<!--            + 添加任务到进行中-->
<!--          </button>-->
        </div>

        <!-- 操作按钮 -->
        <div class="action-buttons">
          <button @click="resetView" class="btn-secondary">
            🔄 重置视图
          </button>
        </div>
      </div>
    </div>

    <!-- 查看模式说明 -->
    <div v-if="viewMode" class="view-indicator">
      <div class="active-view">
        <span class="view-label">当前查看:</span>
        <span class="view-tag">
          {{ getViewModeText(viewMode) }}
        </span>
        <span class="view-result">
          显示 {{ filteredTasks.length }} 个任务（共 {{ taskStore.tasks.length }} 个）
        </span>
      </div>
    </div>

    <!-- 看板主体 -->
    <div class="kanban-container" ref="kanbanContainer">
      <!-- 按状态查看 - 只显示进行中和已完成 -->
      <template v-if="viewMode === 'status'">
        <div
            v-for="column in statusColumns"
            :key="column.id"
            class="kanban-column"
            :style="{ borderTopColor: column.color }"
        >
          <div class="column-header">
            <h3>
              {{ column.title }}
              <span class="task-count">
                ({{ getStatusColumnTaskCount(column.status) }})
              </span>
            </h3>

            <!-- 只在"进行中"列显示快速添加按钮 -->
            <button
                v-if="column.status === 'in-progress'"
                @click="addTaskToColumn(column.status)"
                class="column-add-btn"
                title="快速添加任务"
            >
              +
            </button>
          </div>

          <div
              class="tasks-container"
              @dragover.prevent
              @drop="onDrop($event, column.status)"
          >
            <div
                v-for="task in getStatusColumnTasks(column.status)"
                :key="task.id"
                class="kanban-task"
                draggable="true"
                @dragstart="onDragStart($event, task)"
                @click="selectTask(task)"
                :class="{
                'overdue': isOverdue(task),
                'today': isDueToday(task)
              }"
            >
              <div class="task-preview">
                <div class="task-title">{{ task.title }}</div>
                <div v-if="task.description" class="task-desc">
                  {{ task.description.substring(0, 50) }}{{ task.description.length > 50 ? '...' : '' }}
                </div>

                <div class="task-meta">
                  <span class="task-priority" :class="task.priority">
                    {{ getPriorityText(task.priority) }}
                  </span>
                  <span class="task-category">
                    {{ getCategoryName(task.category) }}
                  </span>
                </div>

                <div class="task-footer">
                  <span class="task-time-display" :class="{ 'overdue': isOverdue(task) }">
                    📅 {{ formatTaskTimeDisplay(task) }}
                    <span v-if="isOverdue(task)" class="overdue-badge">逾期</span>
                    <span v-else-if="isDueToday(task)" class="today-badge">今天</span>
                  </span>

                  <div v-if="task.tags?.length" class="task-tags">
                    <span v-for="tag in task.tags.slice(0, 2)" :key="tag" class="tag">
                      {{ tag }}
                    </span>
                    <span v-if="task.tags.length > 2" class="tag-more">
                      +{{ task.tags.length - 2 }}
                    </span>
                  </div>
                </div>
              </div>

              <div class="task-actions">
                <button @click.stop="toggleTaskComplete(task)" class="btn-icon complete">
                  {{ task.completed ? '↩️' : '✅' }}
                </button>
              </div>
            </div>

            <!-- 空列状态 -->
            <div v-if="getStatusColumnTasks(column.status).length === 0" class="empty-column">
              <div class="empty-column-content">
                <div class="empty-icon">📭</div>
                <div class="empty-text">暂无任务</div>
                <button v-if="column.status === 'in-progress'"
                        @click="addTaskToColumn(column.status)"
                        class="empty-add-btn">
                  + 添加第一个任务
                </button>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- 按优先级查看 -->
      <template v-else-if="viewMode === 'priority'">
        <div
            v-for="priority in priorityColumns"
            :key="priority.value"
            class="kanban-column"
            :style="{ borderTopColor: priority.color }"
        >
          <div class="column-header">
            <h3>
              {{ priority.label }}
              <span class="task-count">
                ({{ getPriorityColumnTaskCount(priority.value) }})
              </span>
            </h3>
          </div>

          <div class="tasks-container">
            <div
                v-for="task in getPriorityColumnTasks(priority.value)"
                :key="task.id"
                class="kanban-task"
                @click="selectTask(task)"
                :class="{
                'overdue': isOverdue(task),
                'today': isDueToday(task)
              }"
            >
              <div class="task-preview">
                <div class="task-title">{{ task.title }}</div>
                <div v-if="task.description" class="task-desc">
                  {{ task.description.substring(0, 50) }}{{ task.description.length > 50 ? '...' : '' }}
                </div>

                <div class="task-meta">
                  <span class="task-status">
                    {{ getStatusName(task.status || 'todo') }}
                  </span>
                  <span class="task-category">
                    {{ getCategoryName(task.category) }}
                  </span>
                </div>

                <div class="task-footer">
                  <span class="task-time-display" :class="{ 'overdue': isOverdue(task) }">
                    📅 {{ formatTaskTimeDisplay(task) }}
                    <span v-if="isOverdue(task)" class="overdue-badge">逾期</span>
                    <span v-if="isDueToday(task)" class="today-badge">今天</span>
                  </span>
                </div>
              </div>

              <div class="task-actions">
                <button @click.stop="toggleTaskComplete(task)" class="btn-icon complete">
                  {{ task.completed ? '↩️' : '✅' }}
                </button>
              </div>
            </div>

            <div v-if="getPriorityColumnTasks(priority.value).length === 0" class="empty-column">
              <div class="empty-column-content">
                <div class="empty-icon">📭</div>
                <div class="empty-text">暂无任务</div>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- 按分类查看 -->
      <template v-else-if="viewMode === 'category'">
        <div
            v-for="category in categoryColumns"
            :key="category.value"
            class="kanban-column"
            :style="{ borderTopColor: category.color }"
        >
          <div class="column-header">
            <h3>
              {{ category.label }}
              <span class="task-count">
                ({{ getCategoryColumnTaskCount(category.value) }})
              </span>
            </h3>
          </div>

          <div class="tasks-container">
            <div
                v-for="task in getCategoryColumnTasks(category.value)"
                :key="task.id"
                class="kanban-task"
                @click="selectTask(task)"
                :class="{
                'overdue': isOverdue(task),
                'today': isDueToday(task)
              }"
            >
              <div class="task-preview">
                <div class="task-title">{{ task.title }}</div>
                <div v-if="task.description" class="task-desc">
                  {{ task.description.substring(0, 50) }}{{ task.description.length > 50 ? '...' : '' }}
                </div>

                <div class="task-meta">
                  <span class="task-priority" :class="task.priority">
                    {{ getPriorityText(task.priority) }}
                  </span>
                  <span class="task-status">
                    {{ getStatusName(task.status || 'todo') }}
                  </span>
                </div>

                <div class="task-footer">
                  <span class="task-time-display" :class="{ 'overdue': isOverdue(task) }">
                    📅 {{ formatTaskTimeDisplay(task) }}
                    <span v-if="isOverdue(task)" class="overdue-badge">逾期</span>
                    <span v-if="isDueToday(task)" class="today-badge">今天</span>
                  </span>
                </div>
              </div>

              <div class="task-actions">
                <button @click.stop="toggleTaskComplete(task)" class="btn-icon complete">
                  {{ task.completed ? '↩️' : '✅' }}
                </button>
              </div>
            </div>

            <div v-if="getCategoryColumnTasks(category.value).length === 0" class="empty-column">
              <div class="empty-column-content">
                <div class="empty-icon">📭</div>
                <div class="empty-text">暂无任务</div>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- 按创建时间查看 -->
      <template v-else-if="viewMode === 'time'">
        <div
            v-for="timeRange in timeColumns"
            :key="timeRange.value"
            class="kanban-column"
            :style="{ borderTopColor: timeRange.color }"
        >
          <div class="column-header">
            <h3>
              {{ timeRange.label }}
              <span class="task-count">
                ({{ getTimeColumnTaskCount(timeRange.value) }})
              </span>
            </h3>
          </div>

          <div class="tasks-container">
            <div
                v-for="task in getTimeColumnTasks(timeRange.value)"
                :key="task.id"
                class="kanban-task"
                @click="selectTask(task)"
                :class="{
                'overdue': isOverdue(task),
                'today': isDueToday(task)
              }"
            >
              <div class="task-preview">
                <div class="task-title">{{ task.title }}</div>
                <div v-if="task.description" class="task-desc">
                  {{ task.description.substring(0, 50) }}{{ task.description.length > 50 ? '...' : '' }}
                </div>

                <div class="task-meta">
                  <span class="task-priority" :class="task.priority">
                    {{ getPriorityText(task.priority) }}
                  </span>
                  <span class="task-category">
                    {{ getCategoryName(task.category) }}
                  </span>
                </div>

                <div class="task-footer">
                  <div class="task-dates">
                    <span class="task-date created">
                      📝 创建: {{ formatDate(task.createdAt) }}
                    </span>
                    <span class="task-time-display" :class="{ 'overdue': isOverdue(task) }">
                      📅 计划: {{ formatTaskTimeDisplay(task) }}
                      <span v-if="isOverdue(task)" class="overdue-badge">逾期</span>
                      <span v-if="isDueToday(task)" class="today-badge">今天</span>
                    </span>
                  </div>
                </div>
              </div>

              <div class="task-actions">
                <button @click.stop="toggleTaskComplete(task)" class="btn-icon complete">
                  {{ task.completed ? '↩️' : '✅' }}
                </button>
              </div>
            </div>

            <div v-if="getTimeColumnTasks(timeRange.value).length === 0" class="empty-column">
              <div class="empty-column-content">
                <div class="empty-icon">📭</div>
                <div class="empty-text">暂无任务</div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- 添加任务模态框 -->
    <div v-if="showTaskModal" class="modal-overlay">
      <div class="modal">
        <h3>在看板中添加任务</h3>
        <form @submit.prevent="saveNewTask">
          <input
              v-model="taskForm.title"
              type="text"
              placeholder="任务标题"
              required
              class="modal-input"
          >

          <textarea
              v-model="taskForm.description"
              placeholder="任务描述（可选）"
              class="modal-textarea"
              rows="3"
          ></textarea>

          <div class="form-row">
            <div class="form-group">
              <label>分类</label>
              <select v-model="taskForm.category" class="modal-select">
                <option value="work">工作</option>
                <option value="study">学习</option>
                <option value="life">生活</option>
                <option value="shopping">购物</option>
                <option value="meeting">会议</option>
                <option value="exercise">运动</option>
              </select>
            </div>

            <div class="form-group">
              <label>优先级</label>
              <select v-model="taskForm.priority" class="modal-select">
                <option value="high">高优先级</option>
                <option value="medium">中优先级</option>
                <option value="low">低优先级</option>
              </select>
            </div>
          </div>

          <!-- 新增：任务类型选择 -->
          <div class="form-group">
            <label>任务类型</label>
            <select v-model="taskForm.taskType" class="modal-select" @change="onTaskTypeChange">
              <option value="time">时间段任务</option>
              <option value="allDay">全天任务</option>
            </select>
          </div>

          <!-- 时间段任务 -->
          <div class="form-row" v-if="taskForm.taskType === 'time'">
            <div class="form-group">
              <label>开始时间</label>
              <input
                  v-model="taskForm.startDateTime"
                  type="datetime-local"
                  class="modal-input"
                  required
              >
            </div>

            <div class="form-group">
              <label>结束时间</label>
              <input
                  v-model="taskForm.endDateTime"
                  type="datetime-local"
                  class="modal-input"
                  :min="taskForm.startDateTime"
                  required
              >
            </div>
          </div>

          <!-- 全天任务 -->
          <div class="form-row" v-if="taskForm.taskType === 'allDay'">
            <div class="form-group">
              <label>开始日期</label>
              <input
                  v-model="taskForm.startDate"
                  type="date"
                  class="modal-input"
                  required
              >
            </div>

            <div class="form-group">
              <label>结束日期</label>
              <input
                  v-model="taskForm.endDate"
                  type="date"
                  class="modal-input"
                  :min="taskForm.startDate"
                  required
              >
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>预估时间（分钟）</label>
              <input
                  v-model="taskForm.estimatedTime"
                  type="number"
                  min="1"
                  class="modal-input"
              >
            </div>

            <div class="form-group">
              <label>标签（用逗号分隔）</label>
              <input
                  v-model="taskForm.tagsInput"
                  type="text"
                  placeholder="例如：重要,紧急"
                  class="modal-input"
              >
            </div>
          </div>

          <div class="modal-actions">
            <button type="button" @click="showTaskModal = false" class="btn-secondary">
              取消
            </button>
            <button type="submit" class="btn-primary">
              创建任务
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useTaskStore } from '../stores/taskStore'
import { useUIStore } from '../stores/uiStore'
import { format, addDays, isBefore, startOfDay, parseISO, isValid } from 'date-fns'

const taskStore = useTaskStore()
const uiStore = useUIStore()

// 查看模式
const viewMode = ref('status')
const searchText = ref('')
const showTaskModal = ref(false)
const currentColumnStatus = ref('in-progress')

// 按状态查看的列
const statusColumns = ref([
  { id: 'in-progress', title: '进行中', status: 'in-progress', color: '#4ecdc4' },
  { id: 'done', title: '已完成', status: 'done', color: '#96ceb4' }
])

// 按优先级查看的列
const priorityColumns = ref([
  { value: 'high', label: '高优先级', color: '#ff6b6b' },
  { value: 'medium', label: '中优先级', color: '#4ecdc4' },
  { value: 'low', label: '低优先级', color: '#96ceb4' }
])

// 按分类查看的列
const categoryColumns = computed(() => {
  const categories = new Set()
  taskStore.tasks.forEach(task => {
    if (task.category) categories.add(task.category)
  })

  const colorMap = {
    work: '#ff6b6b',
    study: '#4ecdc4',
    life: '#45b7d1',
    shopping: '#96ceb4'
  }

  return Array.from(categories).map(cat => ({
    value: cat,
    label: getCategoryName(cat),
    color: colorMap[cat] || '#ffeaa7'
  }))
})

// 按创建时间查看的列
const timeColumns = ref([
  { value: 'today', label: '今天创建', color: '#ff6b6b' },
  { value: 'yesterday', label: '昨天创建', color: '#ff8e6b' },
  { value: 'this-week', label: '本周创建', color: '#4ecdc4' },
  { value: 'this-month', label: '本月创建', color: '#45b7d1' },
  { value: 'older', label: '更早之前', color: '#96ceb4' }
])

// 任务表单数据
const taskForm = ref({
  title: '',
  description: '',
  priority: 'medium',
  category: 'work',
  taskType: 'time',
  startDateTime: '',
  endDateTime: '',
  startDate: '',
  endDate: '',
  estimatedTime: 60,
  tagsInput: ''
})

// 计算属性
const filteredTasks = computed(() => {
  let tasks = [...taskStore.tasks]

  // 应用搜索
  if (searchText.value) {
    const searchLower = searchText.value.toLowerCase()
    tasks = tasks.filter(task =>
        task.title.toLowerCase().includes(searchLower) ||
        (task.description && task.description.toLowerCase().includes(searchLower)) ||
        (task.tags && task.tags.some(tag => tag.toLowerCase().includes(searchLower)))
    )
  }

  return tasks
})

// 工具函数
const getViewModeText = (mode) => {
  const texts = {
    status: '按状态',
    priority: '按优先级',
    category: '按分类',
    time: '按创建时间'
  }
  return texts[mode] || mode
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

const getPriorityText = (priority) => {
  const texts = { high: '高', medium: '中', low: '低' }
  return texts[priority] || priority
}

const getStatusName = (status) => {
  const names = {
    todo: '待处理',
    'in-progress': '进行中',
    review: '审核中',
    done: '已完成'
  }
  return names[status] || status
}

const formatDate = (date) => {
  if (!date) return '无'
  try {
    const parsedDate = parseISO(date)
    if (isValid(parsedDate)) {
      return format(parsedDate, 'MM/dd')
    }
    return '日期错误'
  } catch {
    return '日期错误'
  }
}

// 格式化任务时间显示（用于看板卡片）
const formatTaskTimeDisplay = (task) => {
  if (task.taskType === 'allDay' || !task.startTime || task.startTime === '全天') {
    // 全天任务
    if (task.startDate && task.endDate) {
      if (task.startDate === task.endDate) {
        return `全天 ${formatDate(task.startDate)}`
      } else {
        return `全天 ${formatDate(task.startDate)}-${formatDate(task.endDate)}`
      }
    }
    return task.startDate ? `全天 ${formatDate(task.startDate)}` : '全天'
  } else {
    // 时间段任务
    if (task.startDate && task.startTime && task.endTime) {
      const startDate = formatDate(task.startDate)
      const endDate = task.endDate ? formatDate(task.endDate) : startDate

      if (startDate === endDate) {
        return `${startDate} ${task.startTime}-${task.endTime}`
      } else {
        return `${startDate} ${task.startTime} - ${endDate} ${task.endTime}`
      }
    }
    return '时间未设置'
  }
}

const isOverdue = (task) => {
  if (task.completed) return false

  // 使用任务的结束日期判断是否逾期
  const endDate = task.endDate
  if (!endDate) return false

  try {
    const taskEndDate = parseISO(endDate)
    const today = startOfDay(new Date())
    return isBefore(taskEndDate, today)
  } catch {
    return false
  }
}

const isDueToday = (task) => {
  if (task.completed) return false
  if (!task.endDate) return false

  const today = startOfDay(new Date())
  const taskEndDate = parseISO(task.endDate)

  return format(taskEndDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')
}

// 判断是否为全天任务
const isAllDayTask = (task) => {
  if (!task) return false
  if (task.taskType === 'allDay') return true
  const startTime = task.startTime
  if (!startTime || startTime === '' || startTime === '全天') return true
  const timeRegex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/
  return !timeRegex.test(startTime)
}

// 任务类型变更处理
const onTaskTypeChange = () => {
  const now = new Date()
  const today = format(now, 'yyyy-MM-dd')
  const tomorrow = addDays(now, 1)

  if (taskForm.value.taskType === 'allDay') {
    // 全天任务
    taskForm.value.startDate = today
    taskForm.value.endDate = today
    taskForm.value.startDateTime = ''
    taskForm.value.endDateTime = ''
    taskForm.value.estimatedTime = 480
  } else {
    // 时间段任务
    const tomorrowStr = format(tomorrow, 'yyyy-MM-dd')
    taskForm.value.startDateTime = tomorrowStr + 'T09:00'
    taskForm.value.endDateTime = tomorrowStr + 'T10:00'
    taskForm.value.startDate = ''
    taskForm.value.endDate = ''
    taskForm.value.estimatedTime = 60
  }
}

// 验证时间格式
const isValidTime = (timeStr) => {
  if (!timeStr) return false
  const timeRegex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/
  return timeRegex.test(timeStr)
}

// 状态列相关方法
const getStatusColumnTasks = (status) => {
  return filteredTasks.value.filter(task => {
    if (status === 'done') {
      return task.completed === true
    } else if (status === 'in-progress') {
      return !task.completed
    }
    return false
  })
}

const getStatusColumnTaskCount = (status) => {
  return getStatusColumnTasks(status).length
}

// 优先级列相关方法
const getPriorityColumnTasks = (priority) => {
  return filteredTasks.value.filter(task => task.priority === priority)
}

const getPriorityColumnTaskCount = (priority) => {
  return getPriorityColumnTasks(priority).length
}

// 分类列相关方法
const getCategoryColumnTasks = (category) => {
  return filteredTasks.value.filter(task => task.category === category)
}

const getCategoryColumnTaskCount = (category) => {
  return getCategoryColumnTasks(category).length
}

// 时间列相关方法
const getTimeColumnTasks = (timeRange) => {
  const now = new Date()
  const today = startOfDay(now)
  const yesterday = addDays(today, -1)

  // 本周开始（周一）
  const thisWeek = startOfDay(addDays(today, 1 - (today.getDay() || 7)))

  // 本月开始
  const thisMonth = startOfDay(new Date(today.getFullYear(), today.getMonth(), 1))

  return filteredTasks.value.filter(task => {
    if (!task.createdAt) {
      return timeRange === 'older'
    }

    try {
      const createdDate = parseISO(task.createdAt)
      const createdDateStart = startOfDay(createdDate)

      switch (timeRange) {
        case 'today':
          return format(createdDateStart, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')
        case 'yesterday':
          return format(createdDateStart, 'yyyy-MM-dd') === format(yesterday, 'yyyy-MM-dd')
        case 'this-week':
          return createdDateStart >= thisWeek && createdDateStart <= today
        case 'this-month':
          return createdDateStart >= thisMonth && createdDateStart <= today
        case 'older':
          return createdDateStart < thisMonth
        default:
          return false
      }
    } catch {
      return false
    }
  })
}

const getTimeColumnTaskCount = (timeRange) => {
  return getTimeColumnTasks(timeRange).length
}

// 查看模式切换
const changeViewMode = () => {
  saveViewModeToStorage()
}

const resetView = () => {
  viewMode.value = 'status'
  searchText.value = ''
  saveViewModeToStorage()
}

const applySearch = () => {
  saveViewModeToStorage()
}

// 任务操作
const addTaskToColumn = (status) => {
  currentColumnStatus.value = status
  const now = new Date()
  const tomorrow = addDays(now, 1)

  taskForm.value = {
    title: '',
    description: '',
    priority: 'medium',
    category: 'work',
    taskType: 'time',
    startDateTime: format(tomorrow, 'yyyy-MM-dd') + 'T09:00',
    endDateTime: format(tomorrow, 'yyyy-MM-dd') + 'T10:00',
    startDate: format(now, 'yyyy-MM-dd'),
    endDate: format(now, 'yyyy-MM-dd'),
    estimatedTime: 60,
    tagsInput: ''
  }
  showTaskModal.value = true
}

const saveNewTask = () => {
  // 基本验证
  if (!taskForm.value.title?.trim()) {
    alert('请填写任务标题')
    return
  }

  // 处理标签
  const tags = taskForm.value.tagsInput
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0) || []

  const taskType = taskForm.value.taskType || 'time'
  const isAllDay = taskType === 'allDay'

  let taskData = {}
  const now = new Date()

  if (isAllDay) {
    // 全天任务验证
    if (!taskForm.value.startDate) {
      alert('请选择开始日期')
      return
    }

    taskData = {
      title: taskForm.value.title.trim(),
      description: (taskForm.value.description || '').trim(),
      category: taskForm.value.category || 'work',
      priority: taskForm.value.priority || 'medium',
      startDate: taskForm.value.startDate,
      endDate: taskForm.value.endDate || taskForm.value.startDate,
      startTime: '全天',
      endTime: '全天',
      taskType: 'allDay',
      dueDate: taskForm.value.endDate || taskForm.value.startDate, // 兼容性字段
      estimatedTime: parseInt(taskForm.value.estimatedTime) || 480,
      tags: tags,
      status: currentColumnStatus.value,
      completed: currentColumnStatus.value === 'done',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    }
  } else {
    // 时间段任务
    if (!taskForm.value.startDateTime) {
      alert('请选择开始时间')
      return
    }

    // 解析日期时间
    const startDateTime = new Date(taskForm.value.startDateTime)
    const endDateTime = taskForm.value.endDateTime
        ? new Date(taskForm.value.endDateTime)
        : new Date(startDateTime.getTime() + 60 * 60 * 1000)

    // 验证结束时间是否晚于开始时间
    if (endDateTime <= startDateTime) {
      alert('结束时间必须晚于开始时间')
      return
    }

    // 提取日期和时间部分
    const startDateStr = format(startDateTime, 'yyyy-MM-dd')
    const endDateStr = format(endDateTime, 'yyyy-MM-dd')
    const startTimeStr = format(startDateTime, 'HH:mm')
    const endTimeStr = format(endDateTime, 'HH:mm')

    // 计算持续时间
    const durationMinutes = Math.max(
        1,
        Math.round((endDateTime - startDateTime) / (1000 * 60))
    )

    taskData = {
      title: taskForm.value.title.trim(),
      description: (taskForm.value.description || '').trim(),
      category: taskForm.value.category || 'work',
      priority: taskForm.value.priority || 'medium',
      startDate: startDateStr,
      endDate: endDateStr,
      startTime: startTimeStr,
      endTime: endTimeStr,
      taskType: 'time',
      dueDate: endDateStr, // 兼容性字段，使用结束日期
      estimatedTime: durationMinutes,
      tags: tags,
      status: currentColumnStatus.value,
      completed: currentColumnStatus.value === 'done',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    }
  }

  // 生成任务ID
  const newTask = {
    ...taskData,
    id: 'task_' + Date.now() + Math.random().toString(36).substr(2, 9)
  }

  try {
    taskStore.addTask(newTask)
    console.log('任务创建成功:', newTask.title)
    showTaskModal.value = false

    // 重置表单
    const resetNow = new Date()
    const resetTomorrow = addDays(resetNow, 1)

    taskForm.value = {
      title: '',
      description: '',
      priority: 'medium',
      category: 'work',
      taskType: 'time',
      startDateTime: format(resetTomorrow, 'yyyy-MM-dd') + 'T09:00',
      endDateTime: format(resetTomorrow, 'yyyy-MM-dd') + 'T10:00',
      startDate: format(resetNow, 'yyyy-MM-dd'),
      endDate: format(resetNow, 'yyyy-MM-dd'),
      estimatedTime: 60,
      tagsInput: ''
    }
  } catch (error) {
    console.error('保存任务失败:', error)
    alert('保存任务失败: ' + (error.message || '未知错误'))
  }
}

const selectTask = (task) => {
  uiStore.selectTask(task)
  uiStore.showTaskDetail = true
}

const toggleTaskComplete = (task) => {
  const newStatus = task.completed ? 'in-progress' : 'done'
  taskStore.updateTask(task.id, {
    completed: !task.completed,
    status: newStatus
  })
}

// 拖拽功能
const onDragStart = (event, task) => {
  if (viewMode.value === 'status') {
    event.dataTransfer.setData('taskId', task.id)
    event.dataTransfer.setData('sourceStatus', task.completed ? 'done' : 'in-progress')
  }
}

const onDrop = (event, targetStatus) => {
  if (viewMode.value === 'status') {
    event.preventDefault()
    const taskId = event.dataTransfer.getData('taskId')
    const sourceStatus = event.dataTransfer.getData('sourceStatus')

    if (taskId && sourceStatus !== targetStatus) {
      const task = taskStore.tasks.find(t => t.id === taskId)
      if (task) {
        const isCompleted = targetStatus === 'done'
        taskStore.updateTask(taskId, {
          status: isCompleted ? 'done' : 'in-progress',
          completed: isCompleted
        })
      }
    }
  }
}

// 本地存储
const saveViewModeToStorage = () => {
  localStorage.setItem('kanban-view-mode', JSON.stringify({
    viewMode: viewMode.value,
    searchText: searchText.value
  }))
}

// 初始化
onMounted(() => {
  // 加载查看模式配置
  const savedViewMode = localStorage.getItem('kanban-view-mode')
  if (savedViewMode) {
    try {
      const { viewMode: savedViewModeValue, searchText: savedSearchText } = JSON.parse(savedViewMode)
      viewMode.value = savedViewModeValue || 'status'
      searchText.value = savedSearchText || ''
    } catch (e) {
      console.error('Failed to parse view mode:', e)
    }
  }
})
</script>

<style scoped>
.kanban-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
}

/* 工具栏样式 */
.kanban-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 15px 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 6px rgba(0,0,0,0.08);
  margin-bottom: 12px;
  flex-wrap: wrap;
  gap: 15px;
}

.toolbar-left {
  flex: 1;
  min-width: 300px;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.view-controls {
  margin-top: 12px;
}

.view-group {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.view-label {
  font-size: 0.9rem;
  color: #666;
  font-weight: 500;
}

.view-select {
  padding: 7px 12px;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  background: white;
  font-size: 0.95rem;
  min-width: 110px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.view-select:hover {
  border-color: #4ecdc4;
}

.search-box {
  position: relative;
}

.search-input {
  padding: 7px 12px 7px 32px;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  width: 220px;
  font-size: 0.95rem;
  transition: all 0.2s;
}

.search-input:focus {
  border-color: #4ecdc4;
  outline: none;
}

.search-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
  font-size: 0.9rem;
}

/* 查看模式指示器 */
.view-indicator {
  background: linear-gradient(135deg, #4ecdc4 0%, #45b7d1 100%);
  border-radius: 6px;
  padding: 10px 16px;
  margin-bottom: 12px;
  color: white;
}

.active-view {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.view-tag {
  background: rgba(255, 255, 255, 0.2);
  padding: 5px 10px;
  border-radius: 16px;
  font-size: 0.85rem;
  font-weight: 500;
}

.view-result {
  margin-left: auto;
  font-size: 0.85rem;
  opacity: 0.9;
}

/* 看板容器 */
.kanban-container {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  padding: 8px 0;
  flex: 1;
  min-height: 0;
  margin-bottom: 16px;
}

.kanban-column {
  min-width: 320px;
  max-width: 380px;
  background: white;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  border-top: 5px solid var(--column-color, #4ecdc4);
  flex-shrink: 0;
  box-shadow: 0 2px 10px rgba(0,0,0,0.06);
  transition: transform 0.2s;
}

.kanban-column:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 18px rgba(0,0,0,0.1);
}

.column-header {
  padding: 12px 16px;
  background: #f8fafc;
  border-bottom: 1px solid #e9ecef;
  border-radius: 10px 10px 0 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
}

.column-header h3 {
  margin: 0;
  font-size: 1.05rem;
  color: #2c3e50;
  font-weight: 600;
}

.task-count {
  font-size: 0.85rem;
  color: #7f8c8d;
  margin-left: 4px;
  font-weight: normal;
}

/* 列头部添加按钮样式 */
.column-add-btn {
  background: linear-gradient(135deg, #4ecdc4 0%, #45b7d1 100%);
  color: white;
  border: none;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1.2rem;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.column-add-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

.column-add-btn:active {
  transform: scale(0.95);
}

/* 任务卡片 */
.tasks-container {
  flex: 1;
  padding: 12px;
  overflow-y: auto;
  min-height: 0;

}

.kanban-task {
  background: white;
  border-radius: 8px;
  padding: 14px;
  margin-bottom: 10px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
  cursor: pointer;
  transition: all 0.2s;
  border-left: 4px solid #ddd;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.kanban-task:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(0,0,0,0.08);
}

.kanban-task.overdue {
  border-left-color: #e74c3c;
  background: #ffeaea;
}

.kanban-task.today {
  border-left-color: #f39c12;
  background: #fff8e6;
}

.task-preview {
  flex: 1;
}

.task-title {
  font-weight: 600;
  margin-bottom: 8px;
  color: #2c3e50;
  font-size: 0.95rem;
}

.task-desc {
  font-size: 0.85rem;
  color: #7f8c8d;
  margin-bottom: 10px;
  line-height: 1.4;
}

.task-meta {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 0.8rem;
  flex-wrap: wrap;
}

.task-priority {
  padding: 3px 8px;
  border-radius: 10px;
  font-weight: 600;
  font-size: 0.75rem;
}

.task-priority.high {
  background: #ffeaea;
  color: #e74c3c;
}

.task-priority.medium {
  background: #fff8e6;
  color: #f39c12;
}

.task-priority.low {
  background: #e8f6f3;
  color: #1abc9c;
}

.task-status {
  padding: 3px 8px;
  background: #e3f2fd;
  color: #3498db;
  border-radius: 10px;
  font-weight: 500;
  font-size: 0.75rem;
}

.task-category {
  padding: 3px 8px;
  background: #f3e5f5;
  color: #9b59b6;
  border-radius: 10px;
  font-weight: 500;
  font-size: 0.75rem;
}

.task-footer {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px solid #f1f1f1;
}

/* 改进的任务时间显示样式 */
.task-time-display {
  font-size: 0.8rem;
  color: #7f8c8d;
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
  flex-wrap: wrap;
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.task-time-display.overdue {
  color: #e74c3c;
  font-weight: 600;
}

.overdue-badge {
  background: #e74c3c;
  color: white;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 0.7rem;
  font-weight: bold;
  white-space: nowrap;
}

.today-badge {
  background: #f39c12;
  color: white;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 0.7rem;
  font-weight: bold;
  white-space: nowrap;
}

/* 空列样式改进 */
.empty-column {
  text-align: center;
  padding: 30px 15px;
  color: #bdc3c7;
  font-style: italic;
  background: white;
  border-radius: 6px;
  border: 2px dashed #ecf0f1;
  margin-top: 8px;
  font-size: 0.9rem;
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.empty-column:hover {
  border-color: #4ecdc4;
  background: rgba(78, 205, 196, 0.02);
}

.empty-column-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  animation: fadeIn 0.3s ease;
}

.empty-icon {
  font-size: 2rem;
  opacity: 0.5;
}

.empty-text {
  font-size: 0.9rem;
  color: #95a5a6;
}

.empty-add-btn {
  background: transparent;
  border: 2px dashed #dee2e6;
  border-radius: 6px;
  color: #7f8c8d;
  cursor: pointer;
  padding: 8px 16px;
  font-size: 0.85rem;
  transition: all 0.2s;
  margin-top: 10px;
}

.empty-add-btn:hover {
  border-color: #4ecdc4;
  color: #4ecdc4;
  background: rgba(78, 205, 196, 0.05);
}

/* 按钮样式 */
.btn-primary {
  background: linear-gradient(135deg, #4ecdc4 0%, #45b7d1 100%);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 600;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(78, 205, 196, 0.3);
}

.btn-secondary {
  background: white;
  color: #2c3e50;
  border: 2px solid #dfe6e9;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 600;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-secondary:hover {
  background: #f8f9fa;
  border-color: #b2bec3;
  transform: translateY(-2px);
}

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  padding: 5px;
  font-size: 1rem;
  opacity: 0.7;
  transition: all 0.2s;
  border-radius: 4px;
}

.btn-icon:hover {
  opacity: 1;
  background: rgba(0,0,0,0.05);
}

.btn-icon.complete:hover {
  color: #27ae60;
  background: rgba(39, 174, 96, 0.1);
}

/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  padding: 25px;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 15px 30px rgba(0,0,0,0.15);
  max-height: 90vh;
  overflow-y: auto;
}

.modal h3 {
  margin-bottom: 25px;
  color: #2c3e50;
  font-size: 1.3rem;
  text-align: center;
}

/* 新增：时间选择器样式 */
input[type="datetime-local"],
input[type="date"],
input[type="time"] {
  padding: 10px;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 0.95rem;
  box-sizing: border-box;
  transition: all 0.2s;
  width: 100%;
  background: white;
  font-family: inherit;
}

input[type="datetime-local"]:focus,
input[type="date"]:focus,
input[type="time"]:focus {
  border-color: #4ecdc4;
  outline: none;
  box-shadow: 0 0 0 3px rgba(78, 205, 196, 0.1);
}

input[type="datetime-local"]:hover,
input[type="date"]:hover,
input[type="time"]:hover {
  border-color: #b0b0b0;
}

.modal-input, .modal-textarea, .modal-select {
  width: 100%;
  padding: 12px;
  margin-bottom: 15px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  box-sizing: border-box;
  transition: all 0.2s;
  background: white;
}

.modal-input:focus, .modal-textarea:focus, .modal-select:focus {
  border-color: #4ecdc4;
  outline: none;
  box-shadow: 0 0 0 3px rgba(78, 205, 196, 0.1);
}

.modal-textarea {
  min-height: 100px;
  resize: vertical;
  line-height: 1.5;
}

/* 模态框中的表单组间距调整 */
.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 0.9rem;
  color: #555;
  font-weight: 500;
}

.form-row {
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
}

.form-group {
  flex: 1;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

/* 滚动条样式 */
.kanban-container::-webkit-scrollbar {
  height: 8px;
}

.kanban-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.kanban-container::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #4ecdc4 0%, #45b7d1 100%);
  border-radius: 4px;
}

.kanban-container::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, #3db9b1 0%, #3aa1c4 100%);
}

.tasks-container::-webkit-scrollbar {
  width: 6px;
}

.tasks-container::-webkit-scrollbar-track {
  background: transparent;
}

.tasks-container::-webkit-scrollbar-thumb {
  background: #bdc3c7;
  border-radius: 3px;
}

.tasks-container::-webkit-scrollbar-thumb:hover {
  background: #95a5a6;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .kanban-toolbar {
    flex-direction: column;
    gap: 12px;
  }

  .toolbar-right {
    align-items: flex-start;
    width: 100%;
    flex-wrap: wrap;
    gap: 8px;
  }

  .action-buttons {
    flex-wrap: wrap;
    gap: 8px;
  }
}

@media (max-width: 768px) {
  .kanban-column {
    min-width: 280px;
  }

  .view-group {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .view-select, .search-input {
    width: 100%;
  }

  .kanban-toolbar {
    padding: 12px 15px;
  }

  .modal {
    padding: 20px;
    width: 95%;
  }

  .toolbar-right {
    flex-direction: column;
    gap: 10px;
  }

  .action-buttons {
    width: 100%;
  }

  .action-buttons button {
    flex: 1;
  }

  .column-add-btn {
    width: 24px;
    height: 24px;
    font-size: 1rem;
  }

  .form-row {
    flex-direction: column;
    gap: 10px;
  }

  .form-group {
    width: 100%;
  }

  .task-time-display {
    font-size: 0.75rem;
    max-width: 150px;
  }

  .kanban-task .task-footer {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }

  .task-tags {
    width: 100%;
    justify-content: flex-start;
  }
}

@media (max-width: 480px) {
  .kanban-column {
    min-width: 260px;
  }

  .column-header {
    padding: 10px 12px;
  }

  .kanban-task {
    padding: 12px;
  }

  .task-title {
    font-size: 0.9rem;
  }

  .task-desc {
    font-size: 0.8rem;
  }

  .modal {
    padding: 20px;
    width: 95%;
  }

  input[type="datetime-local"],
  input[type="date"] {
    font-size: 0.9rem;
    padding: 8px;
  }

  .btn-primary,
  .btn-secondary {
    padding: 8px 16px;
    font-size: 0.9rem;
  }

  .column-header h3 {
    font-size: 0.95rem;
  }

  .column-add-btn {
    width: 22px;
    height: 22px;
    font-size: 0.9rem;
  }

  .task-time-display {
    max-width: 120px;
    font-size: 0.7rem;
  }

  .task-dates {
    flex-direction: column;
    gap: 3px;
  }

  /* 手机端更好的触摸体验 */
  .column-add-btn,
  .empty-add-btn,
  .btn-primary,
  .btn-secondary {
    min-height: 44px;
  }

  .column-add-btn {
    min-width: 44px;
    min-height: 44px;
  }
}

/* 动画效果 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 改进选择框样式 */
.modal-select {
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 10px center;
  background-size: 16px;
  padding-right: 35px;
}

/* 改进的任务卡片时间显示 */
.kanban-task:hover .task-time-display {
  color: #3498db;
}

.kanban-task.overdue:hover .task-time-display {
  color: #e74c3c;
}

.kanban-task.today:hover .task-time-display {
  color: #f39c12;
}

/* 模态框按钮布局 */
.modal-actions {
  display: flex;
  gap: 12px;
  margin-top: 25px;
}

.modal-actions button {
  flex: 1;
}

/* 任务标签样式 */
.task-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.tag {
  background: #e3f2fd;
  color: #1976d2;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 0.7rem;
}

.tag-more {
  background: #f5f5f5;
  color: #999;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 0.7rem;
  font-style: italic;
}

/* 任务日期显示 */
.task-dates {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 0.75rem;
  color: #7f8c8d;
}

.task-date.created {
  color: #95a5a6;
}

/* ==================== 深色模式样式 ==================== */
.kanban-view.dark-mode {
  background-color: var(--background-color);
  color: var(--text-color);
}

/* 工具栏深色模式 */
.dark-mode .kanban-toolbar {
  background: var(--surface-color);
  border-color: var(--border-color);
  box-shadow: var(--elevation-1);
  backdrop-filter: blur(10px);
  background: rgba(30, 30, 30, 0.8);
}

.dark-mode .view-label {
  color: var(--text-secondary);
}

.dark-mode .view-select {
  background: var(--input-bg);
  color: var(--input-text);
  border-color: var(--input-border);
}

.dark-mode .view-select:hover {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(144, 202, 249, 0.1);
}

.dark-mode .search-input {
  background: var(--input-bg);
  color: var(--input-text);
  border-color: var(--input-border);
}

.dark-mode .search-input:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(144, 202, 249, 0.1);
  background: var(--input-focus);
}

.dark-mode .search-icon {
  color: var(--text-secondary);
}

/* 按钮深色模式 */
.dark-mode .btn-primary {
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%);
  color: var(--btn-primary-text);
  border: none;
  position: relative;
  overflow: hidden;
}

.dark-mode .btn-primary::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  transition: left 0.5s;
}

.dark-mode .btn-primary:hover::before {
  left: 100%;
}

.dark-mode .btn-secondary {
  background: var(--btn-secondary-bg);
  color: var(--btn-secondary-text);
  border-color: var(--border-color);
}

.dark-mode .btn-secondary:hover {
  background: var(--btn-secondary-hover);
  border-color: var(--primary-color);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

/* 查看模式指示器深色模式 */
.dark-mode .view-indicator {
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--info-color) 100%);
  box-shadow: var(--elevation-2);
}

.dark-mode .view-tag {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(5px);
}

/* 看板列深色模式 */
.dark-mode .kanban-container {
  background: var(--background-color);
}

.dark-mode .kanban-column {
  background: var(--surface-color);
  border-color: var(--border-color);
  box-shadow: var(--elevation-1);
  border-top-width: 4px;
  border-top-style: solid;
  position: relative;
  overflow: hidden;
}

.dark-mode .kanban-column::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--primary-color), transparent);
  opacity: 0;
  transition: opacity 0.3s;
}

.dark-mode .kanban-column:hover::before {
  opacity: 0.5;
}

.dark-mode .kanban-column:hover {
  transform: translateY(-4px);
  box-shadow: var(--elevation-3);
  border-color: var(--primary-color);
}

/* 列头部深色模式 */
.dark-mode .column-header {
  background: rgba(30, 30, 30, 0.6);
  border-bottom-color: var(--border-color);
  backdrop-filter: blur(5px);
}

.dark-mode .column-header h3 {
  color: var(--text-color);
}

.dark-mode .task-count {
  color: var(--text-secondary);
}

.dark-mode .column-add-btn {
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--info-color) 100%);
  box-shadow: 0 2px 8px rgba(66, 165, 245, 0.3);
}

.dark-mode .column-add-btn:hover {
  box-shadow: 0 4px 16px rgba(66, 165, 245, 0.4);
  transform: scale(1.1) rotate(90deg);
}

.dark-mode .column-add-btn .add-tooltip {
  background: var(--surface-color);
  color: var(--text-color);
  border-color: var(--border-color);
  box-shadow: var(--elevation-2);
}

/* 任务卡片深色模式 */
.dark-mode .kanban-task {
  background: var(--surface-color);
  border-color: var(--border-color);
  border-left-width: 3px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.dark-mode .kanban-task::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--primary-color), transparent);
  opacity: 0;
  transition: opacity 0.3s;
}

.dark-mode .kanban-task:hover::after {
  opacity: 0.3;
}

.dark-mode .kanban-task:hover {
  background: var(--hover-color);
  transform: translateY(-3px);
  box-shadow: var(--elevation-2);
  border-color: var(--primary-color);
}

.dark-mode .kanban-task.overdue {
  background: linear-gradient(135deg, rgba(239, 83, 80, 0.1) 0%, rgba(30, 30, 30, 0.8) 100%);
  border-left-color: var(--error-color);
}

.dark-mode .kanban-task.today {
  background: linear-gradient(135deg, rgba(255, 183, 77, 0.1) 0%, rgba(30, 30, 30, 0.8) 100%);
  border-left-color: var(--warning-color);
}

.dark-mode .kanban-task.completed {
  background: linear-gradient(135deg, rgba(102, 187, 106, 0.1) 0%, rgba(30, 30, 30, 0.8) 100%);
  border-left-color: var(--success-color);
}

/* 任务标题深色模式 */
.dark-mode .task-title {
  color: var(--text-color);
}

.dark-mode .task-desc {
  color: var(--text-secondary);
}

/* 任务元数据深色模式 */
.dark-mode .task-priority,
.dark-mode .task-status,
.dark-mode .task-category {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-color);
  font-weight: 500;
  transition: all 0.2s;
}

.dark-mode .task-priority:hover,
.dark-mode .task-status:hover,
.dark-mode .task-category:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* 优先级特定样式 */
.dark-mode .task-priority.high {
  background: rgba(239, 83, 80, 0.15);
  color: var(--priority-high);
  border-color: rgba(239, 83, 80, 0.3);
}

.dark-mode .task-priority.medium {
  background: rgba(255, 183, 77, 0.15);
  color: var(--priority-medium);
  border-color: rgba(255, 183, 77, 0.3);
}

.dark-mode .task-priority.low {
  background: rgba(102, 187, 106, 0.15);
  color: var(--priority-low);
  border-color: rgba(102, 187, 106, 0.3);
}

/* 分类特定样式 */
.dark-mode .category-work {
  background: rgba(144, 202, 249, 0.15);
  color: var(--category-work);
  border-color: rgba(144, 202, 249, 0.3);
}

.dark-mode .category-study {
  background: rgba(128, 203, 196, 0.15);
  color: var(--category-study);
  border-color: rgba(128, 203, 196, 0.3);
}

.dark-mode .category-life {
  background: rgba(206, 147, 216, 0.15);
  color: var(--category-life);
  border-color: rgba(206, 147, 216, 0.3);
}

.dark-mode .category-shopping {
  background: rgba(255, 204, 128, 0.15);
  color: var(--category-shopping);
  border-color: rgba(255, 204, 128, 0.3);
}

/* 任务底部深色模式 */
.dark-mode .task-footer {
  border-top-color: var(--border-color);
}

.dark-mode .task-time-display {
  color: var(--text-secondary);
}

.dark-mode .task-time-display.overdue {
  color: var(--error-color);
}

.dark-mode .overdue-badge {
  background: linear-gradient(135deg, var(--error-color) 0%, var(--error-dark) 100%);
  color: white;
}

.dark-mode .today-badge {
  background: linear-gradient(135deg, var(--warning-color) 0%, var(--warning-dark) 100%);
  color: white;
}

/* 空列深色模式 */
.dark-mode .empty-column {
  background: var(--surface-color);
  border-color: var(--border-color);
  color: var(--text-secondary);
}

.dark-mode .empty-column:hover {
  background: var(--hover-color);
  border-color: var(--primary-color);
}

.dark-mode .empty-add-btn {
  background: var(--btn-secondary-bg);
  color: var(--btn-secondary-text);
  border-color: var(--border-color);
}

.dark-mode .empty-add-btn:hover {
  background: var(--btn-secondary-hover);
  border-color: var(--primary-color);
  color: var(--primary-color);
}

/* 按钮图标深色模式 */
.dark-mode .btn-icon {
  color: var(--text-secondary);
}

.dark-mode .btn-icon:hover {
  background: rgba(144, 202, 249, 0.1);
  color: var(--primary-color);
}

.dark-mode .btn-icon.complete:hover {
  background: rgba(102, 187, 106, 0.1);
  color: var(--success-color);
}

/* 模态框深色模式 */
.dark-mode .modal-overlay {
  background: var(--modal-overlay);
}

.dark-mode .modal {
  background: var(--modal-bg);
  border-color: var(--modal-border);
  box-shadow: var(--elevation-3);
}

.dark-mode .modal h3 {
  color: var(--text-color);
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--info-color) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.dark-mode .modal-input,
.dark-mode .modal-textarea,
.dark-mode .modal-select {
  background: var(--input-bg);
  color: var(--input-text);
  border-color: var(--input-border);
}

.dark-mode .modal-input:focus,
.dark-mode .modal-textarea:focus,
.dark-mode .modal-select:focus {
  background: var(--input-focus);
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(144, 202, 249, 0.1);
}

/* 滚动条深色模式 */
.dark-mode .kanban-container::-webkit-scrollbar-track {
  background: var(--scrollbar-track);
}

.dark-mode .kanban-container::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--info-color) 100%);
}

.dark-mode .kanban-container::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, var(--primary-dark) 0%, var(--info-dark) 100%);
}

.dark-mode .tasks-container::-webkit-scrollbar-thumb {
  background: var(--scrollbar-thumb);
}

.dark-mode .tasks-container::-webkit-scrollbar-thumb:hover {
  background: var(--scrollbar-thumb-hover);
}

/* 任务标签深色模式 */
.dark-mode .tag {
  background: rgba(25, 118, 210, 0.2);
  color: var(--primary-color);
  border: 1px solid rgba(25, 118, 210, 0.3);
}

.dark-mode .tag-more {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
}

/* 动画效果增强 */
@keyframes taskPulse {
  0% { box-shadow: 0 0 0 0 rgba(144, 202, 249, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(144, 202, 249, 0); }
  100% { box-shadow: 0 0 0 0 rgba(144, 202, 249, 0); }
}

.dark-mode .kanban-task.today {
  animation: taskPulse 2s infinite;
}

/* 拖拽效果 */
.dark-mode .tasks-container[dragover] {
  background: rgba(144, 202, 249, 0.05);
  border: 2px dashed var(--primary-color);
}

/* 响应式设计增强 */
@media (max-width: 768px) {
  .dark-mode .kanban-toolbar {
    background: var(--surface-color);
    backdrop-filter: none;
  }

  .dark-mode .kanban-column {
    min-width: 280px;
    border: 1px solid var(--border-color);
  }

  .dark-mode .kanban-task {
    padding: 12px;
  }
}

/* 暗色主题下的霓虹效果 */
.dark-mode .kanban-column[data-status="in-progress"] {
  box-shadow: 0 0 20px rgba(66, 165, 245, 0.1);
}

.dark-mode .kanban-column[data-status="in-progress"]:hover {
  box-shadow: 0 0 30px rgba(66, 165, 245, 0.2);
}

/* 状态列的发光效果 */
.dark-mode .kanban-task.high {
  border-left-color: var(--priority-high);
  box-shadow: 0 0 10px rgba(239, 83, 80, 0.1);
}

.dark-mode .kanban-task.medium {
  border-left-color: var(--priority-medium);
  box-shadow: 0 0 10px rgba(255, 183, 77, 0.1);
}

.dark-mode .kanban-task.low {
  border-left-color: var(--priority-low);
  box-shadow: 0 0 10px rgba(102, 187, 106, 0.1);
}

/* 悬停时的光晕效果 */
.dark-mode .kanban-task:hover {
  box-shadow: 0 4px 20px rgba(144, 202, 249, 0.15);
}

/* 渐变边框效果 */
.dark-mode .kanban-task {
  position: relative;
  background-clip: padding-box;
}

.dark-mode .kanban-task::before {
  content: '';
  position: absolute;
  top: -1px;
  right: -1px;
  bottom: -1px;
  left: -1px;
  background: linear-gradient(135deg, var(--primary-color), var(--info-color), var(--primary-color));
  border-radius: 9px;
  z-index: -1;
  opacity: 0;
  transition: opacity 0.3s;
}

.dark-mode .kanban-task:hover::before {
  opacity: 0.3;
}

/* 任务状态动画 */
@keyframes statusGlow {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}

.dark-mode .kanban-task.in-progress {
  animation: statusGlow 3s infinite;
}

/* 高级悬停效果 */
.dark-mode .kanban-task {
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.dark-mode .kanban-task:hover {
  transform: translateY(-4px) scale(1.01);
}

/* 玻璃态效果 */
.dark-mode .column-header {
  background: rgba(30, 30, 30, 0.7);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.dark-mode .kanban-task {
  background: rgba(30, 30, 30, 0.5);
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
}

/* 动态阴影 */
.dark-mode .kanban-column {
  position: relative;
}

.dark-mode .kanban-column::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.1) 100%);
  opacity: 0;
  transition: opacity 0.3s;
  pointer-events: none;
  z-index: 1;
}

.dark-mode .kanban-column:hover::after {
  opacity: 1;
}

/* 响应式打印样式 */
@media print {
  .dark-mode {
    --background-color: white;
    --text-color: black;
    --surface-color: white;
  }

  .dark-mode .kanban-task {
    border: 1px solid #ddd;
    box-shadow: none;
  }
}

/* 减少动效 */
@media (prefers-reduced-motion: reduce) {
  .dark-mode .kanban-task,
  .dark-mode .kanban-column,
  .dark-mode .btn-secondary {
    transition: none;
    animation: none;
  }

  .dark-mode .kanban-task:hover {
    transform: none;
  }
}
</style>