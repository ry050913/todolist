<template>
  <div class="calendar-view">
    <!-- 日历工具栏 -->
    <div class="calendar-toolbar">
      <div class="toolbar-left">
        <div class="view-controls">
          <button
              @click="changeView('month')"
              :class="{ active: currentView === 'month' }"
              class="view-btn"
          >
            📅 月视图
          </button>
          <button
              @click="changeView('week')"
              :class="{ active: currentView === 'week' }"
              class="view-btn"
          >
            📆 周视图
          </button>
          <button
              @click="changeView('day')"
              :class="{ active: currentView === 'day' }"
              class="view-btn"
          >
            📝 日视图
          </button>
        </div>

        <div class="date-navigation">
          <button @click="prevPeriod" class="nav-btn">
            ◀
          </button>

          <h2 class="current-period">
            {{ periodTitle }}
          </h2>

          <button @click="nextPeriod" class="nav-btn">
            ▶
          </button>

          <button @click="goToToday" class="today-btn">
            今天
          </button>
        </div>
      </div>

      <div class="toolbar-right">
        <div class="filter-controls">
          <select v-model="selectedCategory" class="filter-select">
            <option value="all">所有分类</option>
            <option v-for="cat in categories" :value="cat" :key="cat">
              {{ getCategoryName(cat) }}
            </option>
          </select>

          <select v-model="selectedPriority" class="filter-select">
            <option value="all">所有优先级</option>
            <option value="high">高优先级</option>
            <option value="medium">中优先级</option>
            <option value="low">低优先级</option>
          </select>
        </div>

        <button @click="openAddTaskModal()" class="btn-primary">
          ＋ 添加日程
        </button>
      </div>
    </div>

    <!-- 月视图 -->
    <div v-if="currentView === 'month'" class="month-view">
      <div class="calendar-header">
        <div v-for="day in weekdayLabels" :key="day" class="weekday-header">
          {{ day }}
        </div>
      </div>

      <div class="calendar-body">
        <div
            v-for="(week, weekIndex) in monthWeeks"
            :key="weekIndex"
            class="calendar-week"
        >
          <div
              v-for="day in week"
              :key="day.date.toISOString()"
              :class="{
              'calendar-day': true,
              'today': day.isToday,
              'current-month': day.isCurrentMonth,
              'weekend': day.isWeekend,
              'has-tasks': day.tasks.length > 0
            }"
              @click="selectDate(day.date)"
          >
            <div class="day-header">
              <span class="day-number">{{ day.date.getDate() }}</span>
              <span v-if="day.isToday" class="today-badge">今天</span>
            </div>

            <!-- 修改：任务统计信息 -->
            <div v-if="day.tasks.length > 0" class="day-stats">
              <div class="task-stats">
                <span class="completed-count">{{ day.completedCount }}</span>
                <span class="stats-separator">/</span>
                <span class="total-count">{{ day.tasks.length }}</span>
                <span class="stats-text">任务</span>
              </div>
            </div>

            <!-- 移除原来的全天任务和时间段任务区域 -->
          </div>
        </div>
      </div>
    </div>

    <!-- 周视图 -->
    <div v-if="currentView === 'week'" class="week-view">
      <!-- 新增：周视图头部 -->
      <div class="week-view-header">
        <!-- 时间列标题 -->
        <div class="time-column-header"></div>

        <!-- 日期列标题 -->
        <div
            v-for="day in weekDays"
            :key="day.date.toISOString()"
            :class="['day-column-header', { today: day.isToday, weekend: day.isWeekend }]"
        >
          <div class="day-header-content">
            <div class="weekday">{{ weekdayLabels[day.date.getDay()] }}</div>
            <div class="date">{{ day.date.getDate() }}</div>
          </div>
        </div>
      </div>

      <!-- 新增：全天任务区域（放在时间网格上方） -->
      <!-- 修改：周视图全天任务区域（放在时间网格上方） -->
      <div class="all-day-section">
        <div class="all-day-grid">
          <div class="all-day-time-label">全天</div>

          <div
              v-for="day in weekDays"
              :key="'all-day-' + day.date.toISOString()"
              :class="['all-day-day-column', { today: day.isToday, weekend: day.isWeekend }]"
          >
            <div class="all-day-tasks-container">
              <div v-if="getAllDayTasks(day.date).length > 0">
                <!-- 折叠状态：当全天任务>=3时 -->
                <div v-if="shouldFoldAllDayTasks(day.date)" class="folded-all-day-tasks">
                  <div
                      class="all-day-task-item"
                      @click.stop="selectTask(getAllDayTasks(day.date)[0])"
                  >
                    <div class="task-title">{{ getAllDayTasks(day.date)[0].title }}</div>
                  </div>
                  <div
                      class="all-day-task-more"
                      @click.stop="openAllDayTasksPopup(day.date)"
                  >
                    +{{ getAllDayTasks(day.date).length - 1 }} 更多
                  </div>
                </div>

                <!-- 展开状态 -->
                <div v-else class="expanded-all-day-tasks">
                  <div
                      v-for="task in getAllDayTasks(day.date)"
                      :key="task.id"
                      :class="['all-day-task-item', task.priority, { completed: task.completed }]"
                      @click.stop="selectTask(task)"
                  >
                    <div class="task-title">{{ task.title }}</div>
                    <div v-if="task.completed" class="task-completed">✓</div>
                  </div>
                </div>
              </div>
              <!-- 新增：没有全天任务时的提示 -->
              <div v-else class="no-all-day-tasks-per-day">
                <div class="no-tasks-per-day-content">
                  <div class="no-tasks-per-day-text"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 时间网格部分 -->
      <div class="week-time-grid">
        <!-- 时间列 -->
        <div class="time-column">
          <div class="hour-slot" v-for="hour in hours" :key="hour">
            {{ formatHourLabel(hour) }}
          </div>
        </div>

        <!-- 日期列 -->
        <div
            v-for="day in weekDays"
            :key="day.date.toISOString()"
            :class="['day-column', { today: day.isToday, weekend: day.isWeekend }]"
        >
          <div class="day-body">
            <div
                v-for="hour in hours"
                :key="hour"
                :class="['hour-cell', { 'current-hour': isCurrentHour(day.date, hour) }]"
                @click="debugClick(day.date, hour)"
            >
              <div class="hour-cell-click-area"></div>
            </div>
          </div>
        </div>
        <div class="tasks-overlay">
          <div
              v-for="day in weekDays"
              :key="'tasks-' + day.date.toISOString()"
              class="day-tasks-column"
          >
            <div
                v-for="task in getTimeSlotTasksForDay(day.date)"
                :key="task.id"
                :class="['time-task', task.priority, { completed: task.completed }]"
                :style="getTaskTimeSlotStyle(task, day.date)"
                @click.stop="selectTask(task)"
            >
              <div class="task-content">
                <div class="task-title">{{ task.title }}</div>
                <div class="task-time">
<!--                  {{ formatTaskTime(task) }}-->
                </div>
                <div v-if="task.estimatedTime" class="task-duration">
<!--                  {{ formatDuration(task.estimatedTime) }}-->
                </div>
                <div v-if="task.completed" class="task-completed">✓</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 任务渲染层（覆盖在时间网格上） -->

    </div>

    <!-- 日视图 -->
    <!-- 日视图 -->
    <div v-if="currentView === 'day'" class="day-view">
      <div class="day-header">
        <h2 class="day-title">
          {{ formatDateFull(currentDate) }}
          <span v-if="isWeekendDate" class="weekend-badge">周末</span>
          <span v-if="isTodayDate" class="today-badge">今天</span>
        </h2>
        <div class="day-stats">
          <div class="stat">总任务: {{ dayTasks.length }}</div>
          <div class="stat">已完成: {{ completedTasksCount }}</div>
          <div class="stat">总时长: {{ formatDuration(totalTaskTime) }}</div>
        </div>
      </div>

      <!-- 全天任务区域横向排列 -->
      <div class="all-day-section">
        <div class="section-header">
          <h3>全天任务</h3>
        </div>

        <!-- 有全天任务时显示任务列表 -->
        <div class="all-day-tasks-horizontal" v-if="getAllDayTasks(currentDate).length > 0">
          <div
              v-for="task in getAllDayTasks(currentDate).slice(0, 6)"
              :key="task.id"
              :class="['all-day-task-item-horizontal', task.priority, { completed: task.completed }]"
              @click="selectTask(task)"
          >
            <div class="task-content">
              <div class="task-title">{{ task.title }}</div>
              <div class="task-meta">
<!--                <span class="task-category">{{ getCategoryName(task.category) }}</span>-->
<!--                <span class="task-priority">{{ getPriorityText(task.priority) }}</span>-->
              </div>
              <div v-if="task.completed" class="task-completed">✓</div>
            </div>
          </div>

          <!-- 超过7个时显示剩余数量 -->
          <div
              v-if="getAllDayTasks(currentDate).length > 6"
              class="all-day-task-more-horizontal"
              @click="openAllDayTasksPopup(currentDate)"
          >
            <div class="more-content">
              <div class="more-number">+{{ getAllDayTasks(currentDate).length - 6 }}</div>
              <div class="more-text">更多</div>
            </div>
          </div>
        </div>

        <!-- 没有全天任务时显示"无"提示 -->
        <div class="no-all-day-tasks" v-else>
          <div class="no-tasks-content">
            <div class="no-tasks-icon">📅</div>
            <div class="no-tasks-text">无全天任务</div>
          </div>
        </div>
      </div>

      <!-- 时间段任务区域 - 将时间线和任务放在同一个可滚动容器 -->
      <div class="day-timeline-container">
        <!-- 时间线网格 -->
        <div class="day-timeline">
          <div
              v-for="hour in hours"
              :key="hour"
              class="timeline-hour"
          >
            <div class="hour-label">
              {{ formatHourLabel(hour) }}
            </div>
            <div
                class="hour-slot"
                @click="createTaskAtTime(currentDate, hour)"
            >
              <!-- 时间单元格，仅用于点击创建 -->
            </div>
          </div>
        </div>

        <!-- 任务渲染层（与时间线在同一层级，相对定位） -->
        <div class="timeline-tasks-container">
          <div
              v-for="task in getTimeSlotTasksForDay(currentDate)"
              :key="task.id"
              :class="['timeline-task', task.priority, { completed: task.completed }]"
              :style="getTaskTimelineStyle(task)"
              @click="selectTask(task)"
          >
            <div class="task-content">
              <div class="task-header">
                <div class="task-title">{{ task.title }}</div>
<!--                <div class="task-time">{{ formatTaskTime(task) }}</div>-->
                <div v-if="task.completed" class="task-completed">✓</div>
              </div>
              <div v-if="!isAllDayTask(task)" class="task-meta">
<!--                <span class="task-category">{{ getCategoryName(task.category) }}</span>-->
<!--                <span class="task-priority">{{ getPriorityText(task.priority) }}</span>-->
                <span class="task-duration" v-if="task.estimatedTime">
<!--              {{ formatDuration(task.estimatedTime) }}-->
            </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 任务详情模态框 -->
    <div v-if="selectedTask" class="modal-overlay" @click="selectedTask = null">
      <div class="task-modal" @click.stop>
        <button class="btn-close" @click="selectedTask = null">×</button>

        <div class="task-modal-header">
          <h3>
            {{ selectedTask.title }}
            <span v-if="selectedTask.completed" class="completed-badge">✓ 已完成</span>
          </h3>
          <div class="task-badges">
            <span :class="['priority-badge', selectedTask.priority]">
              {{ getPriorityText(selectedTask.priority) }}
            </span>
            <span class="category-badge">
              {{ getCategoryName(selectedTask.category) }}
            </span>
            <span v-if="selectedTask.startTime && selectedTask.startTime !== '全天'" class="time-badge">
              {{ formatDateTimeRange(selectedTask.startTime, selectedTask.endTime) }}
            </span>
            <span v-if="selectedTask.startTime === '全天'" class="time-badge">
              全天
            </span>
            <span v-if="selectedTask.estimatedTime" class="duration-badge">
              ⏱️ {{ formatDuration(selectedTask.estimatedTime) }}
            </span>
          </div>
        </div>

        <div class="task-modal-content">
          <div class="task-section">
            <h4>描述</h4>
            <p v-if="selectedTask.description">{{ selectedTask.description }}</p>
            <p v-else class="no-content">无描述</p>
          </div>

          <div class="task-section">
            <h4>时间信息</h4>
            <div class="time-info">
              <div class="time-item">
                <span class="label">创建时间:</span>
                <span class="value">{{ formatDateTime(selectedTask.createdAt) }}</span>
              </div>
              <div class="time-item">
                <span class="label">开始时间:</span>
                <span class="value">{{ formatTaskStartDateTime(selectedTask) }}</span>
              </div>
              <div v-if="selectedTask.endTime || selectedTask.dueDate" class="time-item">
                <span class="label">结束时间:</span>
                <span class="value">{{ formatTaskEndDateTime(selectedTask) }}</span>
              </div>
              <div v-if="selectedTask.estimatedTime" class="time-item">
                <span class="label">预估时间:</span>
                <span class="value">{{ formatDuration(selectedTask.estimatedTime) }}</span>
              </div>
              <div v-if="selectedTask.taskType" class="time-item">
                <span class="label">任务类型:</span>
                <span class="value">
                  {{ selectedTask.taskType === 'allDay' ? '全天任务' : '时间段任务' }}
                </span>
              </div>
            </div>
          </div>

          <div v-if="selectedTask.tags?.length" class="task-section">
            <h4>标签</h4>
            <div class="tags-list">
              <span v-for="tag in selectedTask.tags" :key="tag" class="tag">
                {{ tag }}
              </span>
            </div>
          </div>
        </div>

        <div class="task-modal-actions">
          <button
              @click="toggleTaskComplete(selectedTask)"
              :class="['btn-action', selectedTask.completed ? 'undo' : 'complete']"
          >
            {{ selectedTask.completed ? '↩ 标记为未完成' : '✓ 标记为完成' }}
          </button>
          <button @click="openEditTaskModal(selectedTask)" class="btn-action edit">
            ✏️ 编辑
          </button>
          <button @click="deleteTask(selectedTask)" class="btn-action delete">
            🗑️ 删除
          </button>
        </div>
      </div>
    </div>

    <!-- 全天任务弹窗 -->
    <div v-if="showAllDayTasksPopup" class="modal-overlay" @click="showAllDayTasksPopup = false">
      <div class="all-day-tasks-popup" @click.stop>
        <button class="btn-close" @click="showAllDayTasksPopup = false">×</button>

        <div class="popup-header">
          <h3>全天任务列表</h3>
          <div class="popup-subtitle" v-if="popupDate">
            {{ format(popupDate, 'yyyy年M月d日') }}
          </div>
        </div>

        <div class="popup-content">
          <div
              v-for="task in popupAllDayTasks"
              :key="task.id"
              :class="['all-day-task-popup-item', task.priority, { completed: task.completed }]"
              @click="selectTask(task)"
          >
            <div class="task-content">
              <div class="task-header">
                <div class="task-title">{{ task.title }}</div>
                <div v-if="task.completed" class="task-completed">✓</div>
              </div>
              <div class="task-meta">
<!--                <span class="task-category">{{ getCategoryName(task.category) }}</span>-->
<!--                <span class="task-priority">{{ getPriorityText(task.priority) }}</span>-->
                <span class="task-duration" v-if="task.estimatedTime">
<!--                  {{ formatDuration(task.estimatedTime) }}-->
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 任务表单模态框（添加/编辑共用） -->
    <div v-if="showTaskModal" class="modal-overlay" @click="showTaskModal = false">
      <div class="task-form-modal" @click.stop>
        <button class="btn-close" @click="showTaskModal = false">×</button>

        <h3>{{ isEditing ? '编辑日程' : '添加新日程' }}</h3>

        <form @submit.prevent="saveTask">
          <div class="form-group">
            <label>日程标题 *</label>
            <input
                v-model="taskForm.title"
                type="text"
                required
                class="form-input"
                placeholder="输入日程标题"
            >
          </div>

          <div class="form-group">
            <label>日程描述</label>
            <textarea
                v-model="taskForm.description"
                class="form-textarea"
                rows="3"
                placeholder="输入日程描述（可选）"
            ></textarea>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>分类</label>
              <select v-model="taskForm.category" class="form-select">
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
              <select v-model="taskForm.priority" class="form-select">
                <option value="high">高优先级</option>
                <option value="medium">中优先级</option>
                <option value="low">低优先级</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label>任务类型</label>
            <select v-model="taskForm.taskType" class="form-select" @change="onTaskTypeChange">
              <option value="time">时间段任务</option>
              <option value="allDay">全天任务</option>
            </select>
          </div>

          <!-- 时间段任务 -->
          <div class="form-row" v-if="taskForm.taskType === 'time'">
            <div class="form-group">
              <label>开始时间 *</label>
              <input
                  v-model="taskForm.startDateTime"
                  type="datetime-local"
                  required
                  class="form-input"
              >
            </div>

            <div class="form-group">
              <label>结束时间 *</label>
              <input
                  v-model="taskForm.endDateTime"
                  type="datetime-local"
                  required
                  class="form-input"
                  :min="taskForm.startDateTime"
              >
            </div>
          </div>

          <!-- 全天任务 -->
          <div class="form-row" v-if="taskForm.taskType === 'allDay'">
            <div class="form-group">
              <label>开始日期 *</label>
              <input
                  v-model="taskForm.startDate"
                  type="date"
                  required
                  class="form-input"
              >
            </div>

            <div class="form-group">
              <label>结束日期 *</label>
              <input
                  v-model="taskForm.endDate"
                  type="date"
                  required
                  class="form-input"
                  :min="taskForm.startDate"
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
                  class="form-input"
              >
            </div>

            <div class="form-group">
              <label>标签（用逗号分隔）</label>
              <input
                  v-model="taskForm.tagsInput"
                  type="text"
                  class="form-input"
                  placeholder="例如：重要,紧急"
              >
            </div>
          </div>

          <div class="form-actions">
            <button type="button" @click="showTaskModal = false" class="btn-secondary">
              取消
            </button>
            <button type="submit" class="btn-primary">
              {{ isEditing ? '更新日程' : '创建日程' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>



<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useTaskStore } from '../stores/taskStore'
import { useUIStore } from '../stores/uiStore'

import {
  format, addDays, subDays, startOfMonth, endOfMonth,
  startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth,
  isToday, isWeekend, addMonths, subMonths, addWeeks, subWeeks,
  parseISO, startOfDay, endOfDay, isSameDay,
  isValid, addMinutes, isBefore, isAfter, setHours, setMinutes
} from 'date-fns'
import { zhCN } from 'date-fns/locale'

const taskStore = useTaskStore()
const uiStore = useUIStore()

// 状态
const currentView = ref('month')
const currentDate = ref(new Date())
const selectedCategory = ref('all')
const selectedPriority = ref('all')
const selectedTask = ref(null)
const showTaskModal = ref(false)
const isEditing = ref(false)
const editingTaskId = ref(null)

// 新增：全天任务弹窗
const showAllDayTasksPopup = ref(false)
const popupDate = ref(null)
const popupAllDayTasks = ref([])

// 新增：折叠状态管理
const foldedAllDayTasks = ref({})

// 任务表单
const taskForm = ref({
  title: '',
  description: '',
  category: 'work',
  priority: 'medium',
  startDateTime: '',
  endDateTime: '',
  startDate: '',
  endDate: '',
  taskType: 'time',
  estimatedTime: 60,
  tagsInput: ''
})

// 任务类型变更处理
const onTaskTypeChange = () => {
  const now = new Date();
  const today = format(now, 'yyyy-MM-dd');
  const tomorrow = addDays(now, 1);

  if (taskForm.value.taskType === 'allDay') {
    if (!isEditing.value) {
      taskForm.value.startDate = today;
      taskForm.value.endDate = today;
    }
    taskForm.value.startDateTime = '';
    taskForm.value.endDateTime = '';
    if (!isEditing.value) {
      taskForm.value.estimatedTime = 480;
    }
  } else {
    if (!isEditing.value) {
      const tomorrowStr = format(tomorrow, 'yyyy-MM-dd');
      taskForm.value.startDateTime = tomorrowStr + 'T09:00';
      taskForm.value.endDateTime = tomorrowStr + 'T10:00';
      taskForm.value.startDate = '';
      taskForm.value.endDate = '';
      taskForm.value.estimatedTime = 60;
    }
  }
};

// 周标签
const weekdayLabels = ['日', '一', '二', '三', '四', '五', '六']

// 时间轴小时 - 0到23小时
const hours = Array.from({ length: 24 }, (_, i) => i)

// 为每个任务生成随机颜色
const taskColors = ref({})

// 获取任务的随机颜色
const getTaskColor = (taskId) => {
  if (!taskColors.value[taskId]) {
    const hue = Math.floor(Math.random() * 360);
    const saturation = 70 + Math.floor(Math.random() * 20);
    const lightness = 85 + Math.floor(Math.random() * 10);
    taskColors.value[taskId] = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  }
  return taskColors.value[taskId];
}

// 获取任务边框颜色
const getTaskBorderColor = (taskId) => {
  const bgColor = getTaskColor(taskId);
  const hsl = bgColor.match(/\d+/g);
  if (hsl) {
    const h = parseInt(hsl[0]);
    const s = parseInt(hsl[1]);
    const l = Math.max(40, parseInt(hsl[2]) - 20);
    return `hsl(${h}, ${s}%, ${l}%)`;
  }
  return '#ccc';
}

// 计算属性
const periodTitle = computed(() => {
  switch (currentView.value) {
    case 'month':
      return format(currentDate.value, 'yyyy年 M月', { locale: zhCN })
    case 'week':
      const start = startOfWeek(currentDate.value, { locale: zhCN })
      const end = endOfWeek(currentDate.value, { locale: zhCN })
      return `${format(start, 'M月d日', { locale: zhCN })} - ${format(end, 'M月d日', { locale: zhCN })}`
    case 'day':
      return format(currentDate.value, 'yyyy年 M月 d日', { locale: zhCN })
    default:
      return format(currentDate.value, 'yyyy年 M月', { locale: zhCN })
  }
})

const categories = computed(() => {
  return taskStore.categories.filter(cat => cat !== 'all')
})

// 新增：计算本周是否有全天任务
const hasAllDayTasksInWeek = computed(() => {
  return weekDays.value.some(day => getAllDayTasks(day.date).length > 0)
})

// 监听任务变化
watch(() => taskStore.tasks, () => {
  console.log('任务列表更新了:', taskStore.tasks.length, '个任务')
}, { deep: true })

// 过滤任务
const filteredTasks = computed(() => {
  return taskStore.tasks.filter(task => {
    const matchesCategory = selectedCategory.value === 'all' ||
        task.category === selectedCategory.value
    const matchesPriority = selectedPriority.value === 'all' ||
        task.priority === selectedPriority.value

    return matchesCategory && matchesPriority
  })
})

// 修改：月视图相关计算，添加已完成任务计数
const monthWeeks = computed(() => {
  const start = startOfMonth(currentDate.value)
  const end = endOfMonth(currentDate.value)
  const startOfFirstWeek = startOfWeek(start, { locale: zhCN })
  const endOfLastWeek = endOfWeek(end, { locale: zhCN })

  const days = eachDayOfInterval({ start: startOfFirstWeek, end: endOfLastWeek })
  const weeks = []

  for (let i = 0; i < days.length; i += 7) {
    const week = days.slice(i, i + 7).map(day => {
      const tasks = getTasksForDay(day)
      const completedCount = tasks.filter(task => task.completed).length

      return {
        date: day,
        isToday: isToday(day),
        isCurrentMonth: isSameMonth(day, currentDate.value),
        isWeekend: isWeekend(day),
        tasks: tasks,
        completedCount: completedCount
      }
    })
    weeks.push(week)
  }

  return weeks
})

// 周视图相关
const weekDays = computed(() => {
  const start = startOfWeek(currentDate.value, { locale: zhCN })
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(start, i)
    return {
      date,
      isToday: isToday(date),
      isWeekend: isWeekend(date)
    }
  })
})

// 日视图相关
const dayTasks = computed(() => {
  return getTasksForDay(currentDate.value)
})

const totalTaskTime = computed(() => {
  return dayTasks.value.reduce((sum, task) => sum + (task.estimatedTime || 0), 0)
})

const completedTasksCount = computed(() => {
  return dayTasks.value.filter(task => task.completed).length
})

const isTodayDate = computed(() => {
  return isToday(currentDate.value)
})

const isWeekendDate = computed(() => {
  return isWeekend(currentDate.value)
})

// 工具函数
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

const formatDateFull = (date) => {
  return format(date, 'yyyy年 M月 d日 EEEE', { locale: zhCN })
}

const formatDateTime = (dateString) => {
  if (!dateString) return '未设置'
  return format(new Date(dateString), 'yyyy-MM-dd HH:mm')
}

const formatHourLabel = (hour) => {
  return `${hour.toString().padStart(2, '0')}:00`
}

const formatTimeRange = (startTime, endTime) => {
  if (!startTime || startTime === '全天') return '全天'
  if (!endTime) return `${startTime} 开始`
  return `${startTime} - ${endTime}`
}

const formatDateTimeRange = (startTime, endTime) => {
  if (!startTime || startTime === '全天') return '全天'
  if (!endTime) return `${startTime} 开始`
  return `${startTime} - ${endTime}`
}

const formatTaskStartDateTime = (task) => {
  if (task.startDate && task.startTime && task.startTime !== '全天') {
    try {
      const startDate = new Date(task.startDate)
      return format(startDate, 'yyyy年MM月dd日') + ' ' + task.startTime
    } catch (error) {
      return '日期格式错误'
    }
  } else if (task.startDate) {
    try {
      const startDate = new Date(task.startDate)
      return format(startDate, 'yyyy年MM月dd日') + ' 全天'
    } catch (error) {
      return '日期格式错误'
    }
  } else if (task.dueDate) {
    try {
      const dueDate = new Date(task.dueDate)
      if (task.startTime && task.startTime !== '全天') {
        return format(dueDate, 'yyyy年MM月dd日') + ' ' + task.startTime
      }
      return format(dueDate, 'yyyy年MM月dd日') + ' 全天'
    } catch (error) {
      return '日期格式错误'
    }
  }
  return '未设置'
}

const formatTaskEndDateTime = (task) => {
  if (task.endTime && task.endTime !== '全天') {
    const endDate = new Date(task.endDate || task.startDate || task.dueDate)
    return format(endDate, 'yyyy年MM月dd日') + ' ' + task.endTime
  } else if (task.endDate || task.startDate || task.dueDate) {
    const dateStr = task.endDate || task.startDate || task.dueDate
    const date = new Date(dateStr)
    return format(date, 'yyyy年MM月dd日') + ' 全天'
  }
  return '未设置'
}

const formatTaskTime = (task) => {
  return formatTimeRange(task.startTime, task.endTime)
}

const formatDuration = (minutes) => {
  if (!minutes) return ''

  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60

  if (hours > 0 && mins > 0) {
    return `${hours}小时${mins}分钟`
  } else if (hours > 0) {
    return `${hours}小时`
  } else {
    return `${mins}分钟`
  }
}

const hasTime = (task) => {
  return !!task.startTime && task.startTime !== '全天'
}

// 新增辅助函数：获取某天的全天任务
const getAllDayTasks = (date) => {
  const tasks = getTasksForDay(date)
  return tasks.filter(task => isAllDayTask(task))
}

// 新增辅助函数：获取某天的时间段任务
const getTimeSlotTasks = (date) => {
  const tasks = getTasksForDay(date)
  return tasks.filter(task => !isAllDayTask(task))
}

// 新增辅助函数：获取周视图中某天的时间段任务
const getTimeSlotTasksForDay = (date) => {
  const tasks = getTasksForDay(date)
  return tasks.filter(task => !isAllDayTask(task))
}

// 新增辅助函数：判断是否应该折叠全天任务
const shouldFoldAllDayTasks = (date) => {
  const dateStr = format(date, 'yyyy-MM-dd')
  const allDayTasks = getAllDayTasks(date)

  if (allDayTasks.length < 3) return false

  return foldedAllDayTasks.value[dateStr] !== true
}

// 切换全天任务的折叠状态
const toggleAllDayTaskFold = (date) => {
  const dateStr = format(date, 'yyyy-MM-dd')

  if (foldedAllDayTasks.value[dateStr]) {
    delete foldedAllDayTasks.value[dateStr]
  } else {
    foldedAllDayTasks.value[dateStr] = true
  }
}

// 打开全天任务弹窗
const openAllDayTasksPopup = (date) => {
  popupDate.value = date
  popupAllDayTasks.value = getAllDayTasks(date)
  showAllDayTasksPopup.value = true
}

// 修复的日期解析函数
const parseDateSafe = (dateString) => {
  if (!dateString) return null

  try {
    let date = new Date(dateString)
    if (isValid(date)) {
      return date
    }

    if (dateString.includes('-')) {
      const parts = dateString.split('-')
      if (parts.length === 3) {
        const year = parseInt(parts[0])
        const month = parseInt(parts[1]) - 1
        const day = parseInt(parts[2])
        date = new Date(year, month, day)
        if (isValid(date)) {
          return date
        }
      }
    }

    console.warn('无法解析日期:', dateString)
    return null
  } catch (error) {
    console.error('日期解析错误:', dateString, error)
    return null
  }
}

// 判断是否为全天任务
const isAllDayTask = (task) => {
  if (!task) return false

  if (task.taskType === 'allDay') {
    return true
  }

  const startTime = task.startTime
  if (!startTime || startTime === '' || startTime === '全天') {
    return true
  }

  const timeRegex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/
  return !timeRegex.test(startTime)
}

// 获取任务的开始日期
const getTaskStartDate = (task) => {
  return task.startDate || task.dueDate || ''
}

// 获取任务的结束日期
const getTaskEndDate = (task) => {
  return task.endDate || task.startDate || task.dueDate || ''
}

// 获取某天的所有任务
const getTasksForDay = (date) => {
  const targetDateStr = format(date, 'yyyy-MM-dd')
  const targetDate = parseDateSafe(targetDateStr + 'T00:00:00')

  if (!targetDate) return []

  return filteredTasks.value.filter(task => {
    try {
      const taskStartDateStr = getTaskStartDate(task)
      const taskEndDateStr = getTaskEndDate(task)

      if (!taskStartDateStr || !taskEndDateStr) {
        return false
      }

      const taskStartDate = parseDateSafe(taskStartDateStr)
      const taskEndDate = parseDateSafe(taskEndDateStr)

      if (!taskStartDate || !taskEndDate) {
        return false
      }

      const targetDateStart = startOfDay(targetDate)
      const taskStartDateStart = startOfDay(taskStartDate)
      const taskEndDateStart = startOfDay(taskEndDate)

      const isInRange = targetDateStart >= taskStartDateStart && targetDateStart <= taskEndDateStart

      return isInRange
    } catch (error) {
      console.error('日期解析错误:', task.title, error)
      return false
    }
  })
}

// 辅助函数：检查时间格式是否有效
const isValidTime = (timeStr) => {
  if (!timeStr) return false
  const timeRegex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/
  return timeRegex.test(timeStr)
}

// 辅助函数：解析时间字符串为Date对象
const parseTimeToDate = (dateStr, timeStr) => {
  if (!dateStr || !timeStr) return null
  const dateTimeStr = `${dateStr}T${timeStr}:00`
  return parseDateSafe(dateTimeStr)
}

// 修复：计算任务在时间轴上的位置和高度（统一处理日视图和周视图）
// 修改后的 getTaskTimeSlotStyle 函数
const getTaskTimeSlotStyle = (task, date) => {
  try {
    const targetDateStr = format(date, 'yyyy-MM-dd')

    if (isAllDayTask(task)) {
      // 全天任务 - 不在时间网格中显示，在全天任务区域显示
      return {}
    }

    // 时间段任务
    const taskStartDateStr = getTaskStartDate(task)
    const taskEndDateStr = getTaskEndDate(task)

    if (!taskStartDateStr || !taskEndDateStr || !task.startTime) {
      return {}
    }

    // 检查任务是否在目标日期
    const taskStartDate = parseDateSafe(taskStartDateStr)
    const taskEndDate = parseDateSafe(taskEndDateStr)
    const targetDate = parseDateSafe(targetDateStr + 'T00:00:00')

    if (!taskStartDate || !taskEndDate || !targetDate) {
      return {}
    }

    const targetDateStart = startOfDay(targetDate)
    const taskStartDateStart = startOfDay(taskStartDate)
    const taskEndDateStart = startOfDay(taskEndDate)

    // 检查日期是否在任务范围内
    if (targetDateStart < taskStartDateStart || targetDateStart > taskEndDateStart) {
      return {}
    }

    // 解析开始和结束时间
    const startDateTime = parseTimeToDate(taskStartDateStr, task.startTime)
    let endDateTime = null

    if (task.endTime && isValidTime(task.endTime)) {
      endDateTime = parseTimeToDate(taskEndDateStr, task.endTime)
    }

    // 如果没有结束时间或结束时间无效，使用预估时间
    if (!endDateTime && task.estimatedTime) {
      endDateTime = addMinutes(startDateTime, task.estimatedTime)
    } else if (!endDateTime) {
      endDateTime = addMinutes(startDateTime, 60)
    }

    if (!startDateTime || !endDateTime) {
      return {}
    }

    // 确保结束时间在开始时间之后
    if (endDateTime <= startDateTime) {
      endDateTime = addMinutes(startDateTime, 60)
    }

    // 计算位置和高度 - 修复定位计算
    const cellHeight = 60; // 每个小时单元格的高度（像素）
    const startOfDayTime = startOfDay(startDateTime);

    // 计算从当天0点开始的分钟数
    const startMinutes = (startDateTime - startOfDayTime) / (1000 * 60);
    const endMinutes = (endDateTime - startOfDayTime) / (1000 * 60);

    // 处理跨天任务（只显示当天的部分）
    let adjustedStartMinutes = startMinutes;
    let adjustedEndMinutes = endMinutes;

    // 如果任务不是从当天开始
    if (taskStartDateStart < targetDateStart) {
      adjustedStartMinutes = 0; // 从当天的0点开始显示
    }

    // 如果任务不是当天结束
    if (taskEndDateStart > targetDateStart) {
      adjustedEndMinutes = 24 * 60; // 显示到当天的24点
    }

    // 计算顶部位置（相对于时间网格的开始位置）
    const top = (adjustedStartMinutes / 60) * cellHeight;

    // 计算高度
    const height = ((adjustedEndMinutes - adjustedStartMinutes) / 60) * cellHeight;

    // 确保最小高度
    const minHeight = Math.max(height, 25);

    // 计算周视图中的额外偏移
    // 考虑到周视图的时间网格有额外的内边距
    const extraOffset = 5; // 与CSS中的padding-top对应

    // 注意：周视图中任务渲染层的top是从184px开始的（头部高度 + 全天任务区域高度）
    // 所以在周视图中，实际位置应该是 top + 额外的偏移量

    return {
      position: 'absolute',
      top: `${top + extraOffset}px`, // 添加额外偏移
      height: `${minHeight - 10}px`, // 减去上下内边距
      left: '5px',
      right: '5px',
      backgroundColor: getTaskColor(task.id),
      border: `2px solid ${getTaskBorderColor(task.id)}`,
      borderRadius: '6px',
      zIndex: 3,
      opacity: task.completed ? 0.6 : 1,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      padding: '0 10px',
      boxSizing: 'border-box',
      overflow: 'hidden',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      pointerEvents: 'auto' // 确保任务可以点击
    }

  } catch (error) {
    console.error('计算任务样式错误:', task.title, error)
    return {}
  }
}
// 在script部分添加专用于日视图的任务定位函数
const getTaskTimelineStyle = (task) => {
  try {
    // 日视图只显示当天任务
    const currentDateStr = format(currentDate.value, 'yyyy-MM-dd')

    if (isAllDayTask(task)) {
      // 全天任务不在这里显示
      return {}
    }

    const taskStartDateStr = getTaskStartDate(task)
    const taskStartDate = parseDateSafe(taskStartDateStr)
    const currentDateTime = parseDateSafe(currentDateStr + 'T00:00:00')

    if (!taskStartDate || !currentDateTime) {
      return {}
    }

    // 检查任务是否在当前日
    if (!isSameDay(taskStartDate, currentDateTime)) {
      return {}
    }

    // 解析开始和结束时间
    const startDateTime = parseTimeToDate(taskStartDateStr, task.startTime)
    let endDateTime = null

    if (task.endTime && isValidTime(task.endTime)) {
      endDateTime = parseTimeToDate(taskStartDateStr, task.endTime)
    }

    // 如果没有结束时间或结束时间无效，使用预估时间
    if (!endDateTime && task.estimatedTime) {
      endDateTime = addMinutes(startDateTime, task.estimatedTime)
    } else if (!endDateTime) {
      endDateTime = addMinutes(startDateTime, 60)
    }

    if (!startDateTime || !endDateTime) {
      return {}
    }

    // 确保结束时间在开始时间之后
    if (endDateTime <= startDateTime) {
      endDateTime = addMinutes(startDateTime, 60)
    }

    // 计算位置和高度 - 日视图特定计算
    const hourCellHeight = 60 // 每个小时单元格的高度
    const startOfDayTime = startOfDay(startDateTime)

    // 计算从当天0点开始的分钟数
    const startMinutes = (startDateTime - startOfDayTime) / (1000 * 60)
    const endMinutes = (endDateTime - startOfDayTime) / (1000 * 60)

    // 计算顶部位置（从时间轴顶部开始）
    const top = (startMinutes / 60) * hourCellHeight

    // 计算高度
    const height = Math.max(
        25,
        ((endMinutes - startMinutes) / 60) * hourCellHeight
    )

    return {
      position: 'absolute',
      top: `${top + 6}px`,
      height: `${height}px`,
      left: '85px',
      right: '10px',
      backgroundColor: getTaskColor(task.id),
      border: `2px solid ${getTaskBorderColor(task.id)}`,
      borderRadius: '6px',
      zIndex: 3,
      opacity: task.completed ? 0.6 : 1,
      padding: '0 8px',
      boxSizing: 'border-box',
      overflow: 'hidden',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      pointerEvents: 'auto'
    }
  } catch (error) {
    console.error('计算日视图任务样式错误:', task.title, error)
    return {}
  }
}

// 打开添加任务模态框
const openAddTaskModal = () => {
  isEditing.value = false
  editingTaskId.value = null

  // 重置表单为默认值
  const now = new Date()
  const tomorrow = addDays(now, 1)

  taskForm.value = {
    title: '',
    description: '',
    category: 'work',
    priority: 'medium',
    startDateTime: format(tomorrow, 'yyyy-MM-dd') + 'T09:00',
    endDateTime: format(tomorrow, 'yyyy-MM-dd') + 'T10:00',
    startDate: format(now, 'yyyy-MM-dd'),
    endDate: format(now, 'yyyy-MM-dd'),
    taskType: 'time',
    estimatedTime: 60,
    tagsInput: ''
  }

  showTaskModal.value = true
}

// 打开编辑任务模态框
const openEditTaskModal = (task) => {
  isEditing.value = true
  editingTaskId.value = task.id

  // 填充表单数据
  taskForm.value = {
    title: task.title || '',
    description: task.description || '',
    category: task.category || 'work',
    priority: task.priority || 'medium',
    taskType: task.taskType || (isAllDayTask(task) ? 'allDay' : 'time'),
    estimatedTime: task.estimatedTime || 60,
    tagsInput: task.tags ? task.tags.join(', ') : ''
  }

  // 根据任务类型设置日期时间字段
  if (task.taskType === 'allDay' || isAllDayTask(task)) {
    taskForm.value.startDate = task.startDate || task.dueDate || ''
    taskForm.value.endDate = task.endDate || task.startDate || task.dueDate || ''
    taskForm.value.startDateTime = ''
    taskForm.value.endDateTime = ''
  } else {
    if (task.startDate && task.startTime && task.startTime !== '全天') {
      taskForm.value.startDateTime = `${task.startDate}T${task.startTime}`
    }
    if (task.endDate && task.endTime && task.endTime !== '全天') {
      taskForm.value.endDateTime = `${task.endDate}T${task.endTime}`
    }
  }

  // 关闭任务详情模态框，打开编辑模态框
  selectedTask.value = null
  showTaskModal.value = true
}

// 保存任务（新增或更新）
const saveTask = async () => {
  try {
    console.log('=== 开始保存任务 ===');
    console.log('编辑模式:', isEditing.value);
    console.log('任务ID:', editingTaskId.value);

    // 基本验证
    if (!taskForm.value.title?.trim()) {
      alert('请填写任务标题');
      return;
    }

    // 处理标签
    const tags = taskForm.value.tagsInput
        ?.split(',')
        ?.map(tag => tag.trim())
        ?.filter(tag => tag.length > 0) || [];

    const taskType = taskForm.value.taskType || 'time';
    const isAllDay = taskType === 'allDay';

    console.log('任务类型:', taskType);

    let taskData = {};
    const now = new Date();

    if (isAllDay) {
      // 全天任务验证
      if (!taskForm.value.startDate) {
        alert('请选择开始日期');
        return;
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
        estimatedTime: parseInt(taskForm.value.estimatedTime) || 480,
        tags: tags,
        completed: isEditing.value ? selectedTask.value?.completed || false : false,
        updatedAt: now.toISOString()
      };

    } else {
      // 时间段任务
      if (!taskForm.value.startDateTime) {
        alert('请选择开始时间');
        return;
      }

      // 解析日期时间
      const startDateTime = new Date(taskForm.value.startDateTime);
      const endDateTime = taskForm.value.endDateTime
          ? new Date(taskForm.value.endDateTime)
          : new Date(startDateTime.getTime() + 60 * 60 * 1000);

      // 验证结束时间是否晚于开始时间
      if (isAfter(startDateTime, endDateTime)) {
        alert('结束时间必须晚于开始时间');
        return;
      }

      // 提取日期和时间部分
      const startDateStr = format(startDateTime, 'yyyy-MM-dd');
      const endDateStr = format(endDateTime, 'yyyy-MM-dd');
      const startTimeStr = format(startDateTime, 'HH:mm');
      const endTimeStr = format(endDateTime, 'HH:mm');

      // 计算持续时间
      const durationMinutes = Math.max(
          1,
          Math.round((endDateTime - startDateTime) / (1000 * 60))
      );

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
        estimatedTime: durationMinutes,
        tags: tags,
        completed: isEditing.value ? selectedTask.value?.completed || false : false,
        updatedAt: now.toISOString()
      };
    }

    console.log('任务数据:', taskData);

    // 保存或更新任务
    if (isEditing.value && editingTaskId.value) {
      try {
        await taskStore.updateTask(editingTaskId.value, taskData);
        console.log('任务更新成功');
      } catch (error) {
        console.error('更新任务失败:', error);
        alert('更新任务失败: ' + (error.message || '未知错误'));
        return;
      }
    } else {
      // 添加新任务
      const newTask = {
        id: 'task_' + Date.now() + Math.random().toString(36).substr(2, 9),
        ...taskData,
        createdAt: now.toISOString()
      };

      try {
        await taskStore.addTask(newTask);
        console.log('任务创建成功');
      } catch (error) {
        console.error('保存到store失败:', error);
        alert('保存任务失败: ' + (error.message || '未知错误'));
        return;
      }
    }

    // 关闭模态框
    showTaskModal.value = false;
    isEditing.value = false;
    editingTaskId.value = null;

    // 重置表单
    const tomorrow = addDays(now, 1);
    taskForm.value = {
      title: '',
      description: '',
      category: 'work',
      priority: 'medium',
      startDateTime: format(tomorrow, 'yyyy-MM-dd') + 'T09:00',
      endDateTime: format(tomorrow, 'yyyy-MM-dd') + 'T10:00',
      startDate: format(now, 'yyyy-MM-dd'),
      endDate: format(now, 'yyyy-MM-dd'),
      taskType: 'time',
      estimatedTime: 60,
      tagsInput: ''
    };

    alert(isEditing.value ? '任务更新成功！' : '任务创建成功！');

  } catch (error) {
    console.error('保存任务失败:', error);
    alert('保存任务失败: ' + (error.message || '未知错误'));
  }
};

// 视图操作
const changeView = (view) => {
  currentView.value = view
  saveViewToStorage()
}

const prevPeriod = () => {
  switch (currentView.value) {
    case 'month':
      currentDate.value = subMonths(currentDate.value, 1)
      break
    case 'week':
      currentDate.value = subWeeks(currentDate.value, 1)
      break
    case 'day':
      currentDate.value = subDays(currentDate.value, 1)
      break
  }
}

const nextPeriod = () => {
  switch (currentView.value) {
    case 'month':
      currentDate.value = addMonths(currentDate.value, 1)
      break
    case 'week':
      currentDate.value = addWeeks(currentDate.value, 1)
      break
    case 'day':
      currentDate.value = addDays(currentDate.value, 1)
      break
  }
}

const goToToday = () => {
  currentDate.value = new Date()
}

const selectDate = (date) => {
  if (currentView.value === 'month') {
    currentDate.value = date
    currentView.value = 'day'
  } else {
    currentDate.value = date
  }
  saveViewToStorage()
}

const showDayDetails = (day) => {
  currentDate.value = day.date
  currentView.value = 'day'
  saveViewToStorage()
}

// 任务操作 - 创建任务
const createTaskAtTime = (date, hour) => {
  const startDate = format(date, 'yyyy-MM-dd')

  // 构建 datetime-local 格式的字符串
  const startDateTime = `${startDate}T${hour.toString().padStart(2, '0')}:00`
  const endHour = (hour + 1) % 24
  const endDateStr = hour === 23 ? format(addDays(date, 1), 'yyyy-MM-dd') : startDate
  const endDateTime = `${endDateStr}T${endHour.toString().padStart(2, '0')}:00`

  taskForm.value = {
    title: '',
    description: '',
    category: 'work',
    priority: 'medium',
    startDateTime: startDateTime,
    endDateTime: endDateTime,
    startDate: '',
    endDate: '',
    taskType: 'time',
    estimatedTime: 60,
    tagsInput: ''
  }

  isEditing.value = false
  editingTaskId.value = null
  showTaskModal.value = true

  console.log('创建任务时间:', startDateTime, '到', endDateTime)
}

// 调试点击函数
const debugClick = (date, hour) => {
  console.log('周视图点击了:', date, '时间:', hour)
  createTaskAtTime(date, hour)
}

const selectTask = (task) => {
  selectedTask.value = task
  showAllDayTasksPopup.value = false
}

const toggleTaskComplete = (task) => {
  try {
    taskStore.updateTask(task.id, {
      completed: !task.completed
    })
    // 更新选中的任务对象
    selectedTask.value = { ...selectedTask.value, completed: !task.completed }
    console.log('任务完成状态已更新')
  } catch (error) {
    console.error('更新任务状态失败:', error)
  }
}

const deleteTask = (task) => {
  if (confirm(`确定要删除任务 "${task.title}" 吗？`)) {
    try {
      // 直接使用 store 的 deleteTask 方法
      taskStore.deleteTask(task.id)
      selectedTask.value = null
      console.log('任务已删除')
    } catch (error) {
      console.error('删除任务失败:', error)
      alert('删除任务失败')
    }
  }
}

// 检查是否为当前小时
const isCurrentHour = (date, hour) => {
  const now = new Date()
  return isToday(date) && now.getHours() === hour
}

// 本地存储
const saveViewToStorage = () => {
  localStorage.setItem('calendar-view', JSON.stringify({
    view: currentView.value,
    date: currentDate.value.toISOString(),
    category: selectedCategory.value,
    priority: selectedPriority.value
  }))
}

// 初始化
onMounted(() => {
  // 恢复保存的视图设置
  const savedView = localStorage.getItem('calendar-view')
  if (savedView) {
    try {
      const { view, date, category, priority } = JSON.parse(savedView)
      currentView.value = view || 'month'
      currentDate.value = date ? new Date(date) : new Date()
      selectedCategory.value = category || 'all'
      selectedPriority.value = priority || 'all'
    } catch (e) {
      console.error('Failed to parse calendar view:', e)
    }
  }

  // 初始化表单默认值
  const now = new Date()
  const tomorrow = addDays(now, 1)

  taskForm.value.startDateTime = format(tomorrow, 'yyyy-MM-dd') + 'T09:00'
  taskForm.value.endDateTime = format(tomorrow, 'yyyy-MM-dd') + 'T10:00'
  taskForm.value.startDate = format(now, 'yyyy-MM-dd')
  taskForm.value.endDate = format(now, 'yyyy-MM-dd')

  console.log('日历组件已加载')
})
</script>

<style scoped>
/* 样式部分保持原有代码，只添加必要的修复 */
.calendar-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--background-color);
}

/* 工具栏样式 */
.calendar-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 15px;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.view-controls {
  display: flex;
  gap: 8px;
}

.view-btn {
  padding: 8px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s;
}

.view-btn.active {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.view-btn:hover:not(.active) {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.date-navigation {
  display: flex;
  align-items: center;
  gap: 12px;
}

.nav-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: #666;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s;
}

.nav-btn:hover {
  background: #f5f5f5;
  color: var(--primary-color);
}

.current-period {
  margin: 0;
  font-size: 1.3rem;
  color: #333;
  min-width: 200px;
  text-align: center;
}

.today-btn {
  padding: 6px 12px;
  border: 1px solid var(--primary-color);
  border-radius: 4px;
  background: white;
  color: var(--primary-color);
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.today-btn:hover {
  background: var(--primary-color);
  color: white;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 15px;
}

.filter-controls {
  display: flex;
  gap: 10px;
}

.filter-select {
  padding: 6px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  font-size: 0.9rem;
}

.btn-primary {
  padding: 8px 16px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-primary:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

   /* 月视图整体放大 */
 .month-view {
   flex: 1;
   display: flex;
   flex-direction: column;
   background: white;
   border-radius: 8px;
   overflow: hidden;
   box-shadow: 0 2px 8px rgba(0,0,0,0.1);
   height: calc(100vh - 180px); /* 增加高度，让整体放大 */
   min-height: 600px; /* 设置最小高度 */
 }

/* 修改日历表格头部 - 更紧凑 */
.calendar-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  background: #f8f9fa;
  border-bottom: 2px solid #dee2e6;
  padding: 12px 0; /* 增加头部内边距 */
}

.weekday-header {
  padding: 12px 5px; /* 增加内边距 */
  text-align: center;
  font-weight: 700; /* 加粗 */
  color: #495057;
  font-size: 1rem; /* 增大字体 */
  text-transform: uppercase;
  letter-spacing: 0.8px; /* 增加字母间距 */
  position: relative;
}

/* 为周一到周五添加不同的颜色 */
.weekday-header:nth-child(1), /* 周日 */
.weekday-header:nth-child(7) { /* 周六 */
  color: #dc3545; /* 周末红色 */
  background: rgba(220, 53, 69, 0.05);
}

/* 修改日历主体 - 减少列宽，增加行高 */
.calendar-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: auto;
  font-size: 0.95rem; /* 增大整体字体 */
}

.calendar-week {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  min-height: 100px; /* 增加行高，让整体更"胖" */
  border-bottom: 1px solid #e9ecef;
}

.calendar-week:last-child {
  border-bottom: none;
}

/* 修改日历日单元格 - 减少宽度，增加高度 */
.calendar-day {
  padding: 10px 8px; /* 增加内边距 */
  border-right: 1px solid #e9ecef;
  min-height: 125px; /* 增加最小高度 */
  max-height: 125px; /* 限制最大高度 */
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;

  flex-direction: column;
  position: relative;
  flex: 1; /* 让单元格均匀分布 */
 width: 190px; /* 防止内容溢出 */
}

.calendar-day:last-child {
  border-right: none;
}

/* 周末单元格特殊样式 */
.calendar-day.weekend {
  background: linear-gradient(135deg, #f8f9fa 0%, #f1f3f5 100%);
}

.calendar-day.weekend:hover {
  background: linear-gradient(135deg, #f1f3f5 0%, #e9ecef 100%);
}

.calendar-day:hover {
  background: linear-gradient(135deg, #f5f8fa 0%, #e9f7fe 100%);
  transform: translateY(-2px); /* 增加悬停上移距离 */
  box-shadow:
      inset 0 0 0 1px rgba(25, 118, 210, 0.3),
      0 2px 8px rgba(25, 118, 210, 0.15);
  z-index: 2;
}

.calendar-day.today {
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);

  z-index: 3;
  box-shadow: 0 4px 12px rgba(25, 118, 210, 0.2);
}

.calendar-day.today:hover {
  background: linear-gradient(135deg, #bbdefb 0%, #90caf9 100%);
  box-shadow:
      0 4px 12px rgba(25, 118, 210, 0.3),
      inset 0 0 0 1px rgba(255, 255, 255, 0.5);
}

.calendar-day:not(.current-month) {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  color: #adb5bd;
  opacity: 0.7;
}

.calendar-day:not(.current-month):hover {
  background: linear-gradient(135deg, #e9ecef 0%, #dee2e6 100%);
  opacity: 0.9;
}

.calendar-day:not(.current-month) .day-stats {
  opacity: 0.6;
}

/* 修改日期头部 - 放大 */
.day-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px; /* 增加下边距 */
  padding: 0 4px;
}

.day-number {
  font-size: 1.4rem; /* 增大日期数字 */
  font-weight: 700; /* 加粗 */
  color: #212529;
  width: 32px; /* 增大圆形背景 */
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s ease;
  position: relative;
}

.calendar-day.today .day-number {
  background: linear-gradient(135deg, #1976d2 0%, #0d47a1 100%);
  color: white;
  box-shadow: 0 2px 4px rgba(25, 118, 210, 0.3);
  transform: scale(1.1); /* 今天日期放大 */
}

.calendar-day.weekend .day-number {
  color: #dc3545;
  font-weight: 700;
}

.calendar-day:not(.current-month) .day-number {
  color: #adb5bd;
  font-weight: 500; /* 减粗非当月日期 */
}

/* 日期数字悬停效果 */
.calendar-day:hover .day-number {
  transform: scale(1.05);
}

.today-badge {
  background: linear-gradient(135deg, #1976d2 0%, #0d47a1 100%);
  color: white;
  font-size: 0.7rem; /* 稍微增大 */
  padding: 3px 8px; /* 增加内边距 */
  border-radius: 12px;
  font-weight: 600;
  letter-spacing: 0.4px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}

/* 修改：月视图任务统计样式 - 更放大更明显 */
.day-stats {
  margin-top: auto;
  padding: 8px 6px; /* 增加内边距 */
  background: rgba(248, 249, 250, 0.9);
  border-radius: 6px;
  border: 2px solid #e9ecef; /* 加粗边框 */
  backdrop-filter: blur(4px);
  position: relative;
  overflow: hidden;
}

.task-stats {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.95rem; /* 增大字体 */
  line-height: 1.3;
  font-weight: 600;
}

.completed-count {

  font-weight: 700; /* 更粗 */
  font-size: 1rem; /* 更大 */
  min-width: 26px; /* 增大 */
  text-align: center;
  background: linear-gradient(135deg, rgba(40, 167, 69, 0.15) 0%, rgba(40, 167, 69, 0.05) 100%);
  padding: 4px 6px; /* 增加内边距 */
  border-radius: 4px;

  text-shadow: 0 1px 1px rgba(0,0,0,0.1);
}

.stats-separator {
  color: #495057;
  font-weight: 700;
  font-size: 1.1rem; /* 增大 */
  margin: 0 4px;
}

.total-count {
  color: #212529;
  font-weight: 700; /* 更粗 */
  font-size: 1rem; /* 更大 */
  min-width: 26px; /* 增大 */
  text-align: center;
  background: linear-gradient(135deg, rgba(33, 37, 41, 0.1) 0%, rgba(33, 37, 41, 0.05) 100%);
  padding: 4px 6px; /* 增加内边距 */
  border-radius: 4px;

  text-shadow: 0 1px 1px rgba(0,0,0,0.1);
}

.stats-text {
  color: #495057;
  font-size: 0.85rem; /* 稍微增大 */
  margin-left: 6px;
  white-space: nowrap;
  font-weight: 500;
}

/* 添加任务状态指示器 - 更明显 */
.calendar-day.has-tasks {
  position: relative;
}

.calendar-day.has-tasks::before {

  position: absolute;
  top: 6px; /* 向下移动 */
  right: 6px; /* 向左移动 */
  width: 8px; /* 增大 */
  height: 8px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
  z-index: 1;
}

/* 有任务时日期数字右上角的小装饰 */
.calendar-day.has-tasks .day-number::after {
  position: absolute;
  top: -2px;
  right: -2px;
  width: 6px;
  height: 6px;
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
  border-radius: 50%;
  box-shadow: 0 1px 2px rgba(0,0,0,0.2);
}


@keyframes pulse {
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(40, 167, 69, 0.4);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 0 0 4px rgba(40, 167, 69, 0.2);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(40, 167, 69, 0);
  }
}

/* 添加任务完成进度背景 */
.day-stats::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: var(--completed-percent, 0%);
  height: 100%;
  background: linear-gradient(90deg,
  rgba(40, 167, 69, 0.1) 0%,
  rgba(40, 167, 69, 0.05) 100%
  );
  border-radius: 6px;
  z-index: -1;
  transition: width 0.5s ease;
}

/* 任务全部完成时的特殊样式 */
.calendar-day[data-all-completed="true"] .day-stats {
  background: rgba(40, 167, 69, 0.1);
  border-color: rgba(40, 167, 69, 0.4);
}

.calendar-day[data-all-completed="true"] .day-stats::before {
  background: linear-gradient(90deg,
  rgba(40, 167, 69, 0.2) 0%,
  rgba(40, 167, 69, 0.1) 100%
  );
}

/* 响应式调整 */
@media (max-width: 1200px) {
  .calendar-day {
    min-height: 90px;
    max-height: 90px;
    padding: 10px 6px;
  }

  .calendar-week {
    min-height: 90px;
  }

  .day-number {
    font-size: 1.2rem;
    width: 28px;
    height: 28px;
  }

  .task-stats {
    font-size: 0.85rem;
  }

  .completed-count,
  .total-count {
    font-size: 1rem;
    min-width: 22px;
  }
}

@media (max-width: 768px) {
  .calendar-day {
    min-height: 80px;
    max-height: 80px;
    padding: 8px 4px;
  }

  .calendar-week {
    min-height: 80px;
  }

  .day-number {
    font-size: 1rem;
    width: 24px;
    height: 24px;
  }

  .task-stats {
    font-size: 0.8rem;
  }

  .completed-count,
  .total-count {
    font-size: 0.9rem;
    min-width: 20px;
  }

  .stats-text {
    display: none;
  }

  .today-badge {
    font-size: 0.65rem;
    padding: 2px 6px;
  }
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .month-view {
    background: #2d2d2d;
  }

  .calendar-header {
    background: #3d3d3d;
    border-bottom-color: #404040;
  }

  .weekday-header {
    color: #e9ecef;
  }

  .weekday-header:nth-child(1),
  .weekday-header:nth-child(7) {
    color: #ff6b6b;
    background: rgba(255, 107, 107, 0.1);
  }

  .calendar-day {
    border-right-color: #404040;
  }

  .calendar-day:hover {
    background: linear-gradient(135deg, #3d3d3d 0%, #4d4d4d 100%);
  }

  .calendar-day.weekend {
    background: linear-gradient(135deg, #343a40 0%, #3a4149 100%);
  }

  .calendar-day.weekend:hover {
    background: linear-gradient(135deg, #3a4149 0%, #424952 100%);
  }

  .calendar-day.today {
    background: linear-gradient(135deg, #004080 0%, #002d5c 100%);
    border-color: #1976d2;
  }

  .calendar-day.today:hover {
    background: linear-gradient(135deg, #002d5c 0%, #001a3d 100%);
  }

  .calendar-day:not(.current-month) {
    background: linear-gradient(135deg, #252525 0%, #2d2d2d 100%);
    color: #6c757d;
  }

  .calendar-day:not(.current-month):hover {
    background: linear-gradient(135deg, #2d2d2d 0%, #353535 100%);
  }

  .day-number {
    color: #e9ecef;
  }

  .calendar-day.weekend .day-number {
    color: #ff6b6b;
  }

  .calendar-day:not(.current-month) .day-number {
    color: #6c757d;
  }

  .day-stats {
    background: rgba(61, 61, 61, 0.8);
    border-color: #404040;
  }

  .completed-count {
    color: #51cf66;
    background: linear-gradient(135deg, rgba(81, 207, 102, 0.15) 0%, rgba(81, 207, 102, 0.05) 100%);
    border-color: rgba(81, 207, 102, 0.4);
  }

  .total-count {
    color: #f8f9fa;
    background: linear-gradient(135deg, rgba(248, 249, 250, 0.1) 0%, rgba(248, 249, 250, 0.05) 100%);
    border-color: rgba(248, 249, 250, 0.2);
  }

  .stats-separator {
    color: #adb5bd;
  }

  .stats-text {
    color: #adb5bd;
  }
}

/* 月视图滚动条优化 */
.month-view::-webkit-scrollbar {
  width: 10px; /* 加宽滚动条 */
}

.month-view::-webkit-scrollbar-track {
  background: linear-gradient(180deg, #f1f1f1 0%, #e9ecef 100%);
  border-radius: 5px;
}

.month-view::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, #1976d2 0%, #0d47a1 100%);
  border-radius: 5px;
  border: 2px solid #f1f1f1;
}

.month-view::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, #1565c0 0%, #0a3d91 100%);
}

@media (prefers-color-scheme: dark) {
  .month-view::-webkit-scrollbar-track {
    background: linear-gradient(180deg, #3d3d3d 0%, #343a40 100%);
  }

  .month-view::-webkit-scrollbar-thumb {
    background: linear-gradient(180deg, #1976d2 0%, #0d47a1 100%);
    border-color: #3d3d3d;
  }

  .month-view::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(180deg, #1565c0 0%, #0a3d91 100%);
  }
}

/* 添加打印优化 */
@media print {
  .month-view {
    height: auto;
    min-height: auto;
    box-shadow: none;
    border: 1px solid #ccc;
  }

  .calendar-day {
    min-height: 80px;
    max-height: none;
    page-break-inside: avoid;
    border: 1px solid #ddd !important;
  }

  .calendar-day:hover {
    transform: none !important;
    box-shadow: none !important;
  }

  .task-stats {
    font-size: 0.9rem;
  }
}

/* 周视图样式 */
/* 周视图整体 */
.week-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  position: relative;
}

/* 新增：周视图头部 */
.week-view-header {
  display: flex;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}

.time-column-header {
  width: 80px;
  min-width: 80px;
  border-right: 1px solid #e9ecef;
}

.day-column-header {
  flex: 1;
  min-width: 180px;
  border-right: 1px solid #e9ecef;
  padding: 12px;
  text-align: center;
}

.day-column-header:last-child {
  border-right: none;
}

.day-column-header.today {
  background: #b1deff;
  border-radius: 8px;

}

.day-column-header.weekend {
  background: #f9f9f9;
}

.day-header-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.weekday {
  font-size: 0.9rem;
  font-weight: 600;
  color: #495057;
  margin-bottom: 4px;
}

.date {
  font-size: 1.2rem;
  font-weight: 500;
}

/* 新增：周视图全天任务区域 */
.all-day-section {
  border-bottom: 1px solid #e9ecef;
  background: white;
}

.all-day-grid {
  display: flex;
  height: 60px;
}

.all-day-time-label {
  width: 80px;
  min-width: 80px;
  padding: 10px;
  background: #f8f9fa;
  border-right: 1px solid #e9ecef;
  font-size: 0.9rem;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
}

.all-day-day-column {
  flex: 1;
  min-width: 180px;
  border-right: 1px solid #e9ecef;
  display: flex;
  flex-direction: column;
}

.all-day-day-column.today {
  background: #e3f2fd;
}

.all-day-day-column.weekend {
  background: #f9f9f9;
}

.all-day-day-column:last-child {
  border-right: none;
}

.all-day-tasks-container {
  flex: 1;
  padding: 5px;
  min-height: 80px;
}

/* 周视图时间网格 */
/* 修改时间网格部分，确保位置正确 */
.week-time-grid {
  flex: 1;
  display: flex;
  overflow-y: auto;
  position: relative;
  /* 移除之前的 top 设置 */
}

  .time-column {
    width: 80px;
    min-width: 80px;
    background: #f8f9fa;
    border-right: 1px solid #e9ecef;
    position: sticky;
    left: 0;
    z-index: 1;
    /* 确保时间列有足够高度 */
    min-height: calc(24 * 60px); /* 24小时 * 60px */
  }
.hour-slot {
  height: 60px;
  padding: 5px;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  align-items: flex-start;
  font-size: 0.8rem;
  color: #666;
  background: #f8f9fa;
}

.day-column {
  flex: 1;
  min-width: 180px;
  border-right: 1px solid #f1f1f1;
  position: relative;
  /* 确保日期列有足够高度 */
  min-height: calc(24 * 60px); /* 24小时 * 60px */
}

.day-column:last-child {
  border-right: none;
}

.day-column.today {
  background: #e3f2fd;
}

.day-column.weekend {
  background: #f9f9f9;
}

.day-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
}

.hour-cell {
  height: 60px;
  border-bottom: 1px solid #f1f1f1;
  position: relative;
  cursor: pointer;
  transition: all 0.2s;
  overflow: hidden;
  flex-shrink: 0;
  background-color: #ffffff;
  box-sizing: border-box;
}

.hour-cell:hover {
  background: #f5f5f5 !important;
}

/* 修复点击区域 */
.hour-cell-click-area {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
  pointer-events: auto;
}

/* 修正任务覆盖层的位置 */
.tasks-overlay {
  position: absolute;
  top: 0; /* 从时间网格的顶部开始 */
  left: 80px; /* 与time-column宽度相同 */
  right: 0;
  bottom: 0;
  display: flex;
  z-index: 2;
  pointer-events: none;
  overflow: hidden;
  height: 1440px;
}

.day-tasks-column {
  flex: 1;
  min-width: 180px;
  position: relative;
  border-right: 1px solid transparent;
  pointer-events: none;
  /* 确保任务列有足够高度 */
  min-height: calc(24 * 60px); /* 24小时 * 60px */
}

/* 任务样式 */
.time-task {
  z-index: 3;
  position: absolute;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  justify-content: center;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  pointer-events: auto; /* 任务可以点击 */

}

.time-task:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  z-index: 10 !important;
}

/* 任务内容 */
.task-content {
  display: flex;
  flex-direction: column;
  padding: 5px 8px;
  height: 100%;
  box-sizing: border-box;
  overflow: hidden;
}

.task-title {
  font-weight: 600;
  font-size: 0.8rem;
  line-height: 1.2;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 2px;
}

.task-time {
  font-size: 0.7rem;
  color: #666;
  margin-bottom: 2px;
}

.task-duration {
  font-size: 0.65rem;
  color: #888;
  font-style: italic;
}

/* 全天任务折叠/展开样式 */
.folded-all-day-tasks,
.expanded-all-day-tasks {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.all-day-task-item {
  padding: 4px 6px;
  border-radius: 3px;
  font-size: 0.75rem;
  cursor: pointer;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: all 0.2s;
  position: relative;
  background: #e3f2fd;
  border-left: 2px solid #1976d2;
}

.all-day-task-item.high {
  background: #ffebee;
  border-left-color: #f44336;
}

.all-day-task-item.medium {
  background: #fff3e0;
  border-left-color: #ff9800;
}

.all-day-task-item.low {
  background: #e8f5e9;
  border-left-color: #4caf50;
}

.all-day-task-item.completed {
  opacity: 0.7;
  text-decoration: line-through;
}

.all-day-task-more {
  font-size: 0.7rem;
  color: #1976d2;
  padding: 3px 6px;
  cursor: pointer;
  text-align: center;
  background: rgba(25, 118, 210, 0.1);
  border-radius: 3px;
  margin-top: 2px;
}

.all-day-task-more:hover {
  background: rgba(25, 118, 210, 0.2);
}

/* 已完成任务样式 */
.task-item.completed,
.time-task.completed,
.timeline-task.completed {
  opacity: 0.7;
  text-decoration: line-through;
}

.task-item.completed .task-title,
.time-task.completed .task-title,
.timeline-task.completed .task-title {
  opacity: 0.7;
}

.task-completed {
  position: absolute;
  top: 5px;
  right: 5px;
  background: #4caf50;
  color: white;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: bold;
}

/* 日视图样式 */
.day-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  position: relative;
}

.day-header {
  padding: 5px 20px;
  border-bottom: 1px solid #e9ecef;
  background: #f8f9fa;
}

.day-title {
  margin: 0 0 10px 0;
  font-size: 1.3rem;
  color: #333;
}

.weekend-badge {
  background: #ff9800;
  color: white;
  font-size: 0.8rem;
  padding: 3px 8px;
  border-radius: 12px;
  margin-left: 8px;
}

.completed-badge {
  background: #4caf50;
  color: white;
  font-size: 0.8rem;
  padding: 3px 8px;
  border-radius: 12px;
  margin-left: 8px;
}

.day-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
}

.stat {
  font-size: 0.9rem;
  color: #666;
}

/* 修改：日视图中的全天任务区域横向排列 */
.all-day-section {
  border-bottom: 1px solid #e9ecef;
  background: white;
}

.all-day-tasks-horizontal {
  display: flex;
  padding: 10px;
  gap: 10px;
  overflow-x: auto;
}

.all-day-task-item-horizontal {
  flex: 0 0 180px;
  min-width: 190px;
  border-radius: 8px;
  padding: 10px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background: #e3f2fd;
  border-left: 4px solid #1976d2;
}

.all-day-task-item-horizontal.high {
  background: #ffebee;
  border-left-color: #f44336;
}

.all-day-task-item-horizontal.medium {
  background: #fff3e0;
  border-left-color: #ff9800;
}

.all-day-task-item-horizontal.low {
  background: #e8f5e9;
  border-left-color: #4caf50;
}

.all-day-task-item-horizontal.completed {
  opacity: 0.7;
  text-decoration: line-through;
}

.all-day-task-item-horizontal:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.all-day-task-more-horizontal {
  flex: 0 0 180px;
  min-width: 180px;
  border: 2px dashed #ddd;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  background: #f8f9fa;
}

.all-day-task-more-horizontal:hover {
  border-color: var(--primary-color);
  background: #e3f2fd;
}

.more-content {
  text-align: center;
}

.more-number {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--primary-color);
}

.more-text {
  font-size: 0.9rem;
  color: #666;
}

.day-timeline {
  flex: 1;
  position: relative;
  overflow-y: auto;
}

.timeline-hour {
  display: flex;
  min-height: 60px;
  border-bottom: 1px solid #f1f1f1;
  transition: all 0.2s;
  background-color: #ffffff;
}

.timeline-hour:hover {
  background: #f5f5f5 !important;
}

.hour-label {
  width: 80px;
  padding: 10px;
  background: #f8f9fa;
  border-right: 1px solid #e9ecef;
  font-size: 0.9rem;
  color: #666;
  display: flex;
  align-items: flex-start;
  position: sticky;
  left: 0;
  z-index: 1;
}

.hour-slot {
  flex: 1;
  padding: 10px;
  position: relative;
  cursor: pointer;
  transition: all 0.2s;
  overflow: hidden;
  min-height: 60px;
}

/* 日视图任务覆盖层 */
.timeline-tasks-overlay {
  position: absolute;
  top: 0;
  left: 80px; /* 与hour-label宽度相同 */
  right: 0;
  bottom: 0;
  z-index: 2;
  pointer-events: none;
  padding-top: 5px;
}

.timeline-task {
  position: absolute;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  justify-content: center;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  pointer-events: auto;
}

.timeline-task:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  z-index: 10 !important;
}

.timeline-task .task-content {
  padding: 8px 12px;
}

.timeline-task .task-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 4px;
}

.timeline-task .task-title {
  font-weight: 600;
  font-size: 0.85rem;
  line-height: 1.2;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}

.timeline-task .task-time {
  font-size: 0.75rem;
  color: #666;
  white-space: nowrap;
}

.timeline-task .task-meta {
  display: flex;
  gap: 8px;
  font-size: 0.7rem;
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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

.task-modal, .task-form-modal, .all-day-tasks-popup {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 20px 40px rgba(0,0,0,0.2);
}

.btn-close {
  position: absolute;
  top: 15px;
  right: 15px;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
  padding: 5px;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-close:hover {
  background: #f5f5f5;
}

.task-modal-header {
  padding: 25px 30px 15px;
  border-bottom: 1px solid #e9ecef;
}

.task-modal-header h3 {
  margin: 0 0 15px 0;
  font-size: 1.4rem;
  color: #333;
}

.task-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.priority-badge, .category-badge, .time-badge, .duration-badge {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
}

.priority-badge.high {
  background: #ffebee;
  color: #f44336;
}

.priority-badge.medium {
  background: #fff3e0;
  color: #ff9800;
}

.priority-badge.low {
  background: #e8f5e9;
  color: #4caf50;
}

.category-badge {
  background: #f3e5f5;
  color: #9c27b0;
}

.time-badge {
  background: #e3f2fd;
  color: #1976d2;
}

.duration-badge {
  background: #e8f5e9;
  color: #388e3c;
}

.task-modal-content {
  padding: 20px 30px;
}

.task-section {
  margin-bottom: 20px;
}

.task-section h4 {
  margin: 0 0 10px 0;
  font-size: 1rem;
  color: #555;
}

.task-section p {
  margin: 0;
  line-height: 1.5;
  color: #666;
}

.no-content {
  color: #999;
  font-style: italic;
}

.time-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.time-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.time-item .label {
  color: #777;
  font-size: 0.9rem;
}

.time-item .value {
  color: #333;
  font-weight: 500;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag {
  padding: 4px 10px;
  background: #e3f2fd;
  color: #1976d2;
  border-radius: 12px;
  font-size: 0.8rem;
}

.task-modal-actions {
  padding: 20px 30px;
  border-top: 1px solid #e9ecef;
  display: flex;
  gap: 10px;
}

.btn-action {
  flex: 1;
  padding: 10px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-action.complete {
  background: #4caf50;
  color: white;
}

.btn-action.undo {
  background: #ff9800;
  color: white;
}

.btn-action.edit {
  background: #2196f3;
  color: white;
}

.btn-action.delete {
  background: #f44336;
  color: white;
}

.btn-action:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

/* 新增：全天任务弹窗样式 */
.all-day-tasks-popup {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 70vh;
  overflow-y: auto;
}

.popup-header {
  padding: 20px 30px 10px;
  border-bottom: 1px solid #e9ecef;
  text-align: center;
}

.popup-header h3 {
  margin: 0 0 10px 0;
  font-size: 1.4rem;
  color: #333;
}

.popup-subtitle {
  color: #666;
  font-size: 0.9rem;
}

.popup-content {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.all-day-task-popup-item {
  border-radius: 8px;
  padding: 12px 15px;
  cursor: pointer;
  transition: all 0.2s;
  background: #e3f2fd;
  border-left: 4px solid #1976d2;
}

.all-day-task-popup-item.high {
  background: #ffebee;
  border-left-color: #f44336;
}

.all-day-task-popup-item.medium {
  background: #fff3e0;
  border-left-color: #ff9800;
}

.all-day-task-popup-item.low {
  background: #e8f5e9;
  border-left-color: #4caf50;
}

.all-day-task-popup-item.completed {
  opacity: 0.7;
  text-decoration: line-through;
}

.all-day-task-popup-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.all-day-task-popup-item .task-content {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.all-day-task-popup-item .task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.all-day-task-popup-item .task-title {
  font-weight: 600;
  font-size: 0.95rem;
  color: #333;
  flex: 1;
}

.all-day-task-popup-item .task-meta {
  display: flex;
  gap: 10px;
  font-size: 0.8rem;
  color: #666;
}

/* 表单模态框 */
.task-form-modal {
  padding: 30px;
}

.task-form-modal h3 {
  margin: 0 0 25px 0;
  font-size: 1.4rem;
  color: #333;
  text-align: center;
}

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

.form-input, .form-textarea, .form-select {
  width: 100%;
  padding: 10px;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 0.95rem;
  box-sizing: border-box;
  transition: all 0.2s;
}

.form-input:focus, .form-textarea:focus, .form-select:focus {
  border-color: var(--primary-color);
  outline: none;
  box-shadow: 0 0 0 3px rgba(25, 118, 210, 0.1);
}

.form-textarea {
  min-height: 80px;
  resize: vertical;
}

.form-hint {
  display: block;
  font-size: 0.8rem;
  color: #999;
  margin-top: 4px;
}

.form-row {
  display: flex;
  gap: 15px;
}

.form-row .form-group {
  flex: 1;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 25px;
}

.btn-secondary {
  padding: 10px 20px;
  background: white;
  color: #666;
  border: 2px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: #f5f5f5;
  border-color: #ccc;
}

/* 新增：无全天任务时的提示样式 */
.no-all-day-tasks {
  padding: 10px 20px;
  text-align: center;
  background: #f9f9f9;
  border-radius: 0 0 8px 8px;
  height: 90px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.no-tasks-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  opacity: 0.6;
}

.no-tasks-icon {
  font-size: 2rem;
  color: #999;
}

.no-tasks-text {
  color: #666;
  font-size: 0.95rem;
}

/* 确保按钮可点击 */
button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 移除所有指针事件阻止 */
button,
.btn-primary,
.btn-secondary,
.btn-action,
.view-btn,
.nav-btn,
.today-btn {
  cursor: pointer !important;
  pointer-events: auto !important;
  user-select: none;
}

/* 修复模态框按钮层级 */
.modal-overlay .task-modal,
.modal-overlay .task-form-modal,
.modal-overlay .all-day-tasks-popup {
  z-index: 1001;
}

/* 确保按钮不被覆盖 */
.btn-close {
  z-index: 1002;
}

/* 修复表单按钮 */
.form-actions button {
  min-height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 修复时间选择器 */
input[type="datetime-local"],
input[type="date"],
input[type="time"] {
  cursor: pointer;
  height: 40px;
}

/* 确保任务块没有内部边框 */
.time-task,
.timeline-task {
  border: none !important;
}

/* 确保点击区域 */
.all-day-task-item,
.all-day-task-more,
.all-day-task-more-horizontal,
.all-day-task-item-horizontal {
  pointer-events: auto !important;
}

/* 调整任务详情模态框位置 */
.task-modal {
  z-index: 1002;
}

/* 响应式设计调整 */
@media (max-width: 768px) {
  .timeline-tasks-overlay {
    left: 60px;
  }

  .week-view-header .time-column-header,
  .all-day-time-label,
  .time-column {
    width: 60px;
    min-width: 60px;
  }

  .day-column-header,
  .all-day-day-column,
  .day-column {
    min-width: 150px;
  }

  .tasks-overlay {
    left: 60px;
    top: 164px;
  }

  .all-day-task-item-horizontal {
    flex: 0 0 150px;
    min-width: 150px;
  }

  .all-day-task-more-horizontal {
    flex: 0 0 150px;
    min-width: 150px;
  }

  .task-modal,
  .task-form-modal,
  .all-day-tasks-popup {
    width: 95%;
    max-width: 95%;
  }

  .form-row {
    flex-direction: column;
    gap: 10px;
  }
}

@media (max-width: 480px) {
  .timeline-tasks-overlay {
    left: 50px;
  }

  .week-view-header .time-column-header,
  .all-day-time-label,
  .time-column {
    width: 50px;
    min-width: 50px;
  }

  .day-column-header,
  .all-day-day-column,
  .day-column {
    min-width: 120px;
  }

  .tasks-overlay {
    left: 50px;
    top: 154px;
  }

  .all-day-task-item-horizontal {
    flex: 0 0 120px;
    min-width: 120px;
  }

  .all-day-task-more-horizontal {
    flex: 0 0 120px;
    min-width: 120px;
  }

  .calendar-toolbar {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }

  .toolbar-left,
  .toolbar-right {
    width: 100%;
  }

  .view-controls {
    flex-wrap: wrap;
  }

  .filter-controls {
    flex-wrap: wrap;
  }

  .current-period {
    min-width: auto;
  }

  .task-modal-actions {
    flex-direction: column;
  }

  .btn-action {
    width: 100%;
  }
}

/* 修复滚动条样式 */
.week-time-grid::-webkit-scrollbar,
.day-timeline::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.week-time-grid::-webkit-scrollbar-track,
.day-timeline::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.week-time-grid::-webkit-scrollbar-thumb,
.day-timeline::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.week-time-grid::-webkit-scrollbar-thumb:hover,
.day-timeline::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 提升任务项的z-index确保在滚动时可见 */
.time-task,
.timeline-task {
  z-index: 3;
}

.time-task:hover,
.timeline-task:hover {
  z-index: 10 !important;
}

/* 修复月视图单元格内的滚动 */
.calendar-day {
  overflow: hidden;
}

.calendar-day:hover {
  overflow: visible;
}

/* 修复任务详情模态框的滚动 */
.task-modal-content {
  max-height: 400px;
  overflow-y: auto;
}

.task-form-modal form {
  max-height: 650px;
  overflow-y: auto;
  padding-right: 10px;
}

/* 修复表单模态框滚动条 */
.task-form-modal form::-webkit-scrollbar {
  width: 6px;
}

.task-form-modal form::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.task-form-modal form::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

/* 修复全天任务区域的滚动 */
.all-day-tasks-horizontal::-webkit-scrollbar {
  height: 4px;
}

.all-day-tasks-horizontal::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 2px;
}

.all-day-tasks-horizontal::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 2px;
}

/* 修复周视图时间网格的垂直滚动 */
.week-time-grid {
  scrollbar-width: thin;
  scrollbar-color: #c1c1c1 #f1f1f1;
}

/* 优化触摸设备体验 */
@media (hover: none) and (pointer: coarse) {
  .calendar-day {
    min-height: 140px;
  }

  .view-btn,
  .nav-btn,
  .today-btn,
  .btn-primary,
  .btn-secondary {
    min-height: 44px;
    min-width: 44px;
  }

  .hour-cell {
    min-height: 70px;
  }

  .time-task,
  .timeline-task {
    font-size: 0.9rem;
    padding: 8px;
  }
}

/* 高对比度模式支持 */
@media (prefers-contrast: more) {
  .calendar-day.today {
    background: #d0e8ff;
    border: 2px solid #0066cc;
  }

  .calendar-day.weekend {
    background: #f0f0f0;
    border: 1px solid #ccc;
  }

  .time-task,
  .timeline-task {
    border: 2px solid #000;
  }

  .all-day-task-item {
    border: 1px solid #000;
  }
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .calendar-view {
    background: #1a1a1a;
  }

  .calendar-toolbar {
    background: #2d2d2d;
    color: #ffffff;
  }

  .month-view,
  .week-view,
  .day-view {
    background: #2d2d2d;
    color: #ffffff;
  }

  .calendar-header {
    background: #3d3d3d;
    color: #ffffff;
  }

  .calendar-day {
    border-color: #404040;
    color: #ffffff;
  }

  .calendar-day.today {
    background: #004080;
  }

  .calendar-day.weekend {
    background: #333333;
  }

  .calendar-day:not(.current-month) {
    background: #252525;
    color: #666;
  }

  .day-header,
  .hour-label,
  .time-column,
  .all-day-time-label {
    background: #3d3d3d;
    color: #ffffff;
    border-color: #404040;
  }

  .hour-cell,
  .timeline-hour {
    background: #2d2d2d;
    border-color: #404040;
  }

  .task-title {
    color: #ffffff;
  }

  .task-time,
  .task-duration {
    color: #cccccc;
  }

  .form-input,
  .form-textarea,
  .form-select,
  .filter-select {
    background: #3d3d3d;
    color: #ffffff;
    border-color: #555;
  }

  .modal-overlay {
    background: rgba(0, 0, 0, 0.8);
  }

  .task-modal,
  .task-form-modal,
  .all-day-tasks-popup {
    background: #2d2d2d;
    color: #ffffff;
  }
}

/* 打印样式 */
@media print {
  .calendar-toolbar,
  .btn-primary,
  .btn-secondary,
  .btn-action,
  .modal-overlay {
    display: none !important;
  }

  .month-view,
  .week-view,
  .day-view {
    box-shadow: none;
    border: 1px solid #ccc;
  }

  .calendar-day {
    min-height: 100px;
    page-break-inside: avoid;
  }

  .hour-cell {
    height: 50px;
  }
}

/* 动画效果 */
.calendar-day,
.hour-cell,
.timeline-hour,
.time-task,
.timeline-task,
.all-day-task-item,
.all-day-task-item-horizontal {
  transition: all 0.3s ease;
}

/* 焦点样式 */
button:focus,
input:focus,
textarea:focus,
select:focus {
  outline: 2px solid var(--primary-color);
  outline-offset: 2px;
}

/* 加载状态 */
.loading {
  opacity: 0.7;
  pointer-events: none;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
  color: #666;
}

.empty-state-icon {
  font-size: 3rem;
  margin-bottom: 20px;
  opacity: 0.5;
}

.empty-state-title {
  font-size: 1.2rem;
  margin-bottom: 10px;
  color: #333;
}

.empty-state-description {
  font-size: 0.9rem;
  max-width: 300px;
}

/* 工具提示 */
[data-tooltip] {
  position: relative;
}

[data-tooltip]:hover::after {
  content: attr(data-tooltip);
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: #333;
  color: white;
  padding: 5px 10px;
  border-radius: 4px;
  font-size: 0.8rem;
  white-space: nowrap;
  z-index: 1000;
  margin-bottom: 5px;
}

[data-tooltip]:hover::before {
  content: '';
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 5px solid transparent;
  border-top-color: #333;
  margin-bottom: -5px;
  z-index: 1000;
}

/* 键盘导航支持 */
.keyboard-navigation .calendar-day:focus,
.keyboard-navigation .hour-cell:focus,
.keyboard-navigation .time-task:focus,
.keyboard-navigation .timeline-task:focus {
  box-shadow: 0 0 0 3px rgba(25, 118, 210, 0.5);
  outline: none;
}

/* 可访问性改进 */
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* 确保所有交互元素都有足够的大小 */
@media (pointer: fine) {
  .view-btn,
  .nav-btn,
  .today-btn,
  .btn-primary,
  .btn-secondary,
  .btn-action {
    min-height: 36px;
    min-width: 36px;
  }
}

/* 平滑滚动 */
.week-time-grid,
.day-timeline,
.task-modal-content,
.task-form-modal form {
  scroll-behavior: smooth;
}

/* 优化性能 */
.will-change-transform {
  will-change: transform;
}

/* 减少动画对低端设备的影响 */
@media (prefers-reduced-motion: reduce) {
  .calendar-day,
  .hour-cell,
  .timeline-hour,
  .time-task,
  .timeline-task,
  .all-day-task-item,
  .all-day-task-item-horizontal,
  button,
  .view-btn,
  .nav-btn,
  .today-btn,
  .btn-primary,
  .btn-secondary,
  .btn-action {
    transition: none !important;
  }
}

/* 修复iOS Safari的点击延迟 */
button,
.calendar-day,
.hour-cell,
.all-day-task-item,
.all-day-task-item-horizontal {
  -webkit-tap-highlight-color: transparent;
}

/* 优化字体渲染 */
body {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* 确保模态框在移动设备上正确显示 */
@media (max-width: 768px) {
  .modal-overlay {
    padding: 10px;
    align-items: flex-start;
    padding-top: 20px;
  }

  .task-modal,
  .task-form-modal,
  .all-day-tasks-popup {
    max-height: calc(100vh - 40px);
    margin-top: 20px;
  }
}

/* 修复表单在移动设备上的显示 */
@media (max-width: 480px) {
  input[type="datetime-local"],
  input[type="date"],
  input[type="time"] {
    font-size: 16px; /* 防止iOS Safari缩放 */
  }
}

/* 确保任务详情模态框内容可读 */
.task-modal-content p,
.task-modal-content .time-item .value {
  line-height: 1.6;
}

/* 优化任务统计的显示 */
.day-stats .task-stats {
  line-height: 1.2;
}

/* 修复周视图滚动时的时间列固定 */
.time-column {
  position: sticky;
  left: 0;
  box-shadow: 2px 0 5px rgba(0,0,0,0.1);
}

/* 修复任务重叠时的显示 */
.time-task:hover,
.timeline-task:hover {
  z-index: 100 !important;
}

/* 确保全天任务区域在折叠状态下正确显示 */
.folded-all-day-tasks {
  max-height: 50px;
  overflow: hidden;
}

/* 修复月视图中非当前月份日期的显示 */
.calendar-day:not(.current-month) .day-stats {
  opacity: 0.7;
}

/* 优化周视图的日期头部显示 */
.day-column-header .weekday {
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* 确保任务表单中的必填字段有明显标识 */
.form-group label[required]::after {
  content: " *";
  color: #f44336;
}

/* 修复任务完成状态的动画 */
.task-completed {
  transition: all 0.3s ease;
}

/* 优化任务项的悬停效果 */
.time-task:hover .task-content,
.timeline-task:hover .task-content {
  transform: translateX(2px);
}

/* 确保响应式设计中的边距 */
@media (max-width: 768px) {
  .calendar-toolbar {
    margin-bottom: 10px;
    padding: 10px;
  }

  .month-view,
  .week-view,
  .day-view {
    border-radius: 6px;
  }
}

/* 修复深色模式下的文本颜色 */
@media (prefers-color-scheme: dark) {
  .stat,
  .stats-text,
  .no-tasks-text {
    color: #cccccc;
  }

  .completed-count {
    color: #81c784;
  }

  .total-count {
    color: #bbbbbb;
  }
}

/* 确保所有状态都有明确的视觉反馈 */
.calendar-day.has-tasks {
  position: relative;
}


/* 优化周视图的滚动性能 */
.week-time-grid,
.tasks-overlay {
  contain: layout style paint;
}

/* 修复表单验证样式 */


.form-input:invalid:focus,
.form-textarea:invalid:focus,
.form-select:invalid:focus {
  box-shadow: 0 0 0 3px rgba(244, 67, 54, 0.1);
}

/* 确保按钮在加载状态下有明确指示 */
.btn-primary.loading,
.btn-secondary.loading {
  position: relative;
  color: transparent;
}

.btn-primary.loading::after,
.btn-secondary.loading::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.btn-secondary.loading::after {
  border: 2px solid rgba(0, 0, 0, 0.3);
  border-top-color: #333;
}

@keyframes spin {
  to { transform: translate(-50%, -50%) rotate(360deg); }
}

/* 修复模态框的遮罩层 */
.modal-overlay {
  backdrop-filter: blur(2px);
}

/* 优化任务详情模态框的标签显示 */
.tags-list .tag {
  margin: 2px;
}

/* 确保周视图的日期列在滚动时保持宽度 */
.day-column {
  flex-shrink: 0;
}

/* 修复移动设备上的触摸反馈 */
@media (hover: none) and (pointer: coarse) {
  .calendar-day:active,
  .hour-cell:active,
  .all-day-task-item:active,
  .all-day-task-item-horizontal:active {
    background: rgba(25, 118, 210, 0.1) !important;
  }

  .time-task:active,
  .timeline-task:active {
    transform: scale(0.98);
  }
}

/* 确保表单在深色模式下正确显示 */
@media (prefers-color-scheme: dark) {
  .form-hint {
    color: #999;
  }

  .btn-secondary {
    background: #3d3d3d;
    color: #ffffff;
    border-color: #555;
  }

  .btn-secondary:hover {
    background: #4d4d4d;
    border-color: #666;
  }
}

/* 优化打印样式 */
@media print {
  @page {
    margin: 0.5in;
  }

  .calendar-view {
    background: white;
    color: black;
  }

  .calendar-day,
  .hour-cell,
  .timeline-hour {
    border-color: #ddd !important;
  }

  .time-task,
  .timeline-task {
    box-shadow: none !important;
    border: 1px solid #ccc !important;
  }

  .task-title,
  .stat,
  .day-number {
    color: black !important;
  }
}

.section-header h3{
  font-size: 18px;
  line-height: 18px;
  padding-top: 10px;
  padding-bottom: 10px;
  margin-left: 15px;
}

.section-header{
  background-color: #f8f9fa;
}

/* 新增：每日无全天任务时的提示样式 */
.no-all-day-tasks-per-day {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 80px;
}

.no-tasks-per-day-content {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
  opacity: 0.5;
}

.no-tasks-per-day-text {
  color: #999;
  font-size: 0.85rem;
  font-style: italic;
}

/* 确保任务容器适应空状态 */
.all-day-tasks-container {
  flex: 1;
  padding: 5px;
  min-height: 80px;
  display: flex;
  flex-direction: column;
}

/* 修复任务位置的关键样式 */
.day-tasks-column {
  position: relative;
  min-height: 1440px; /* 24小时 * 60px/小时 */
}

/* 修复日视图任务定位 */
.timeline-tasks-overlay {
  position: absolute;
  top: 0;
  left: 80px;
  right: 0;
  bottom: 0;
  z-index: 2;
  pointer-events: none;
  padding-top: 2px;
}

/* 确保任务内容可见 */
.time-task .task-content,
.timeline-task .task-content {
  padding: 6px 8px;
  height: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: center;
  overflow: hidden;
}

/* 确保任务时间显示正确 */
.time-task .task-time,
.timeline-task .task-time {
  font-size: 0.7rem;
  color: #666;
  margin-top: 2px;
}

/* 修复任务最小高度 */
.time-task,
.timeline-task {
  min-height: 30px;
}

/* 结束样式 */
/* 新增：日视图时间线容器 */
.day-timeline-container {
  flex: 1;
  position: relative;
  overflow-y: auto;
  min-height: 400px;
}

/* 修改：日视图时间线 */
.day-timeline {
  position: relative;
  z-index: 1;
  /* 确保时间线占据足够高度 */
  min-height: calc(24 * 60px); /* 24小时 * 60px */
}

/* 新增：任务容器 */
.timeline-tasks-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2;
  pointer-events: none;
  padding-top: 2px;
}


</style>