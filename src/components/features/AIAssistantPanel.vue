<template>
  <div class="ai-assistant-panel">
    <div class="panel-header">
      <h3>🤖 AI智能任务分配</h3>
      <button @click="closePanel" class="btn-close">×</button>
    </div>

    <div class="panel-content">
      <!-- 简洁输入区 -->
      <div class="simple-input-section">
        <h4>📝 输入任务要求</h4>

        <div class="input-card">
          <textarea
              v-model="taskInput"
              placeholder="例如：1月13日到1月14日要洗澡、洗衣服、做作业、背100个单词"
              rows="3"
              class="simple-textarea"
          ></textarea>

          <div class="quick-tags">
            <span
                v-for="tag in quickTags"
                :key="tag"
                class="tag"
                @click="addTag(tag)"
            >
              {{ tag }}
            </span>
          </div>
        </div>

        <!-- 时间选择 -->
        <div class="time-selection">
          <div class="time-item">
            <label>开始日期</label>
            <input
                v-model="startDate"
                type="date"
                class="date-input"
                :min="today"
            >
          </div>
          <div class="time-item">
            <label>结束日期</label>
            <input
                v-model="endDate"
                type="date"
                class="date-input"
                :min="startDate || today"
            >
          </div>
          <div class="time-item">
            <label>每日可用时间</label>
            <select v-model="dailyHours" class="time-select">
              <option value="4">4小时</option>
              <option value="6">6小时</option>
              <option value="8">8小时</option>
            </select>
          </div>
        </div>

        <!-- 智能分析按钮 -->
        <button
            @click="analyzeTasks"
            :disabled="!canAnalyze"
            class="analyze-btn"
        >
          🤖 AI智能分析并分配
        </button>
      </div>

      <!-- 任务解析结果 -->
      <div v-if="parsedTasks.length > 0" class="parsed-section">
        <div class="section-header">
          <h4>📋 解析出的任务</h4>
          <span class="task-count">{{ parsedTasks.length }}个任务</span>
        </div>

        <div class="task-cards">
          <div
              v-for="(task, index) in parsedTasks"
              :key="index"
              class="task-card"
          >
            <div class="task-icon">{{ getTaskIcon(task.type) }}</div>
            <div class="task-content">
              <div class="task-name">{{ task.name }}</div>
              <div class="task-meta">
                <span class="task-duration">{{ task.duration }}分钟</span>
                <span class="task-type">{{ getTaskTypeText(task.type) }}</span>
              </div>
            </div>
            <div class="task-priority" :class="task.priority">
              {{ getPriorityText(task.priority) }}
            </div>
          </div>
          <!-- 在任务解析结果部分的task-card中添加时长输入 -->
          <div v-if="parsedTasks.length > 0" class="parsed-section">
            <div class="section-header">
              <h4>📋 解析出的任务（可修改时长）</h4>
              <span class="task-count">{{ parsedTasks.length }}个任务</span>
            </div>

            <div class="task-cards">
              <div
                  v-for="(task, index) in parsedTasks"
                  :key="index"
                  class="task-card"
              >
                <div class="task-icon">{{ getTaskIcon(task.type) }}</div>
                <div class="task-content">
                  <div class="task-name">{{ task.name }}</div>
                  <div class="task-meta">
                    <div class="duration-input">
                      <label>时长：</label>
                      <input
                          type="number"
                          v-model.number="customDurations[task.originalName]"
                          @change="updateTaskDuration(task, $event.target.value)"
                          min="5"
                          max="480"
                          step="5"
                          class="duration-input-field"
                      >
                      <span>分钟</span>
                    </div>
                    <span class="task-type">{{ getTaskTypeText(task.type) }}</span>
                  </div>
                </div>
                <div class="task-priority" :class="task.priority">
                  {{ getPriorityText(task.priority) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- AI分配方案 -->
      <div v-if="aiSchedule" class="schedule-section">
        <div class="section-header">
          <h4>📅 AI智能分配方案</h4>
          <div class="schedule-stats">
            <span>共{{ totalDays }}天</span>
            <span>平均{{ averageDailyHours }}小时/天</span>
          </div>
        </div>

        <!-- 时间线视图 -->
        <div class="timeline-view">
          <div
              v-for="(day, dayIndex) in aiSchedule.days"
              :key="dayIndex"
              class="timeline-day"
          >
            <div class="day-header">
              <div class="day-title">
                <span class="date">{{ formatDateShort(day.date) }}</span>
                <span class="weekday">{{ day.weekday }}</span>
              </div>
              <div class="day-total">{{ day.totalDuration }}分钟</div>
            </div>

            <div class="day-timeline">
              <div
                  v-for="(slot, slotIndex) in day.slots"
                  :key="slotIndex"
                  class="time-slot task-slot"
                  :style="getSlotStyle(slot)"
              >
                <div class="slot-info">
                  <div class="slot-time">{{ slot.startTime }}-{{ slot.endTime }}</div>
                  <div class="slot-task">
                    <span class="task-icon-small">{{ getTaskIcon(slot.task.type) }}</span>
                    {{ slot.task.name }}
                  </div>
                </div>
                <div class="slot-duration">{{ slot.task.duration }}分钟</div>
              </div>
            </div>
          </div>
        </div>

        <!-- AI建议 -->
        <div v-if="aiSchedule.suggestions.length > 0" class="ai-suggestions">
          <div class="suggestions-header">
            <span class="suggestions-icon">💡</span>
            <span>AI建议</span>
          </div>
          <div class="suggestions-content">
            <p v-for="(suggestion, index) in aiSchedule.suggestions" :key="index">
              {{ suggestion }}
            </p>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="action-buttons">
          <button @click="createAllTasks" class="create-btn">
            ✅ 创建所有任务
          </button>
          <button @click="regenerateSchedule" class="regenerate-btn">
            🔄 重新分配
          </button>
        </div>
      </div>

      <!-- 快速示例 -->
      <div class="examples-section">
        <h4>🚀 快速示例</h4>
        <div class="examples-grid">
          <div
              v-for="(example, index) in examples"
              :key="index"
              class="example-card"
              @click="loadExample(example)"
          >
            <div class="example-icon">{{ example.icon }}</div>
            <div class="example-text">{{ example.text }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useTaskStore } from '../../stores/taskStore'
import { useUIStore } from '../../stores/uiStore'
import {
  format,
  addDays,
  parseISO,
  differenceInDays,
  addMinutes,
  isSameDay
} from 'date-fns'

const taskStore = useTaskStore()
const uiStore = useUIStore()

// 状态
const taskInput = ref('')
const startDate = ref('')
const endDate = ref('')
const dailyHours = ref('6')
const parsedTasks = ref([])
const aiSchedule = ref(null)
const existingTasks = ref([])
const customDurations = ref({})

// 计算属性保持不变...
const today = computed(() => {
  return format(new Date(), 'yyyy-MM-dd')
})

const canAnalyze = computed(() => {
  return taskInput.value.trim() && startDate.value && endDate.value
})

const totalDays = computed(() => {
  if (!startDate.value || !endDate.value) return 0
  return differenceInDays(parseISO(endDate.value), parseISO(startDate.value)) + 1
})

const averageDailyHours = computed(() => {
  if (!aiSchedule.value) return 0
  const totalMinutes = aiSchedule.value.days.reduce((sum, day) => sum + day.totalDuration, 0)
  return Math.round((totalMinutes / 60 / aiSchedule.value.days.length) * 10) / 10
})

// 快速标签
const quickTags = computed(() => [
  '洗澡', '洗衣服', '做饭', '打扫',
  '写作业', '背单词', '看书', '运动'
])

// 示例
const examples = computed(() => [
  { icon: '🧹', text: '周末家务', input: '周六到周日要打扫房间、洗衣服、买菜做饭' },
  { icon: '📚', text: '学习计划', input: '3天内背完200个单词，完成数学作业' },
  { icon: '💼', text: '工作安排', input: '下周完成报告，每天4小时' }
])

// 工具函数保持不变...
const getTaskIcon = (type) => {
  const icons = {
    life: '🧹',
    study: '📚',
    work: '💼',
    exercise: '🏃',
    shopping: '🛒'
  }
  return icons[type] || '📝'
}

const getTaskTypeText = (type) => {
  const texts = {
    life: '生活',
    study: '学习',
    work: '工作',
    exercise: '运动',
    shopping: '购物'
  }
  return texts[type] || '其他'
}

const getPriorityText = (priority) => {
  const texts = { high: '高', medium: '中', low: '低' }
  return texts[priority] || priority
}

const formatDateShort = (dateStr) => {
  return dateStr.split('-').slice(1).join('/')
}

const getSlotStyle = (slot) => {
  const colors = {
    life: '#e3f2fd',
    study: '#f3e5f5',
    work: '#fff3e0',
    exercise: '#e8f5e9',
    shopping: '#fce4ec'
  }

  return {
    backgroundColor: colors[slot.task.type] || '#f5f5f5'
  }
}

const addTag = (tag) => {
  if (!taskInput.value.includes(tag)) {
    taskInput.value += (taskInput.value ? '、' : '') + tag
  }
}

// 获取已有任务
const loadExistingTasks = async () => {
  try {
    const start = parseISO(startDate.value)
    const end = parseISO(endDate.value)

    if (taskStore.tasks && Array.isArray(taskStore.tasks)) {
      existingTasks.value = taskStore.tasks.filter(task => {
        if (!task.startDate) return false
        const taskDate = parseISO(task.startDate)
        return taskDate >= start && taskDate <= end
      })
      console.log('已加载已有任务:', existingTasks.value.length)
    } else {
      existingTasks.value = []
    }
  } catch (error) {
    console.error('加载已有任务失败:', error)
    existingTasks.value = []
  }
}

// 智能分析任务
const analyzeTasks = () => {
  if (!taskInput.value.trim()) {
    alert('请输入任务要求')
    return
  }

  loadExistingTasks().then(() => {
    parsedTasks.value = parseTasks(taskInput.value)
    generateSchedule()
  })
}

// 解析任务输入
const parseTasks = (input) => {
  const tasks = []
  const taskStrings = input.split(/[、，,;；]/).map(s => s.trim()).filter(s => s)

  taskStrings.forEach(taskStr => {
    let duration = null
    let cleanTaskName = taskStr
    let type = 'life'
    let priority = 'medium'

    const minuteMatch = taskStr.match(/(\d+)\s*分钟/)
    const hourMatch = taskStr.match(/(\d+(?:\.\d+)?)\s*小时/)

    if (minuteMatch) {
      duration = parseInt(minuteMatch[1])
      cleanTaskName = taskStr.replace(minuteMatch[0], '').trim()
    } else if (hourMatch) {
      duration = parseFloat(hourMatch[1]) * 60
      cleanTaskName = taskStr.replace(hourMatch[0], '').trim()
    }

    if (duration === null && customDurations.value[taskStr]) {
      duration = customDurations.value[taskStr]
    }

    if (cleanTaskName.includes('洗澡')) {
      type = 'life'
    } else if (cleanTaskName.includes('洗衣')) {
      type = 'life'
    } else if (cleanTaskName.includes('打扫')) {
      type = 'life'
    } else if (cleanTaskName.includes('做饭') || cleanTaskName.includes('买菜')) {
      type = 'life'
    } else if (cleanTaskName.includes('作业') || cleanTaskName.includes('学习') || cleanTaskName.includes('看书')) {
      type = 'study'
    } else if (cleanTaskName.includes('单词')) {
      type = 'study'
      if (duration === null) {
        const wordMatch = cleanTaskName.match(/(\d+)\s*个单词/)
        if (wordMatch) {
          const wordCount = parseInt(wordMatch[1])
          duration = Math.max(30, Math.min(wordCount * 0.5, 180))
          cleanTaskName = `背${wordCount}个单词`
        }
      }
    } else if (cleanTaskName.includes('运动') || cleanTaskName.includes('健身')) {
      type = 'exercise'
    } else if (cleanTaskName.includes('报告') || cleanTaskName.includes('工作')) {
      type = 'work'
    }

    if (duration === null) {
      const defaults = {
        '洗澡': 30,
        '洗衣': 45,
        '打扫': 60,
        '做饭': 90,
        '买菜': 60,
        '作业': 90,
        '学习': 90,
        '看书': 60,
        '运动': 60,
        '健身': 60,
        '报告': 120,
        '工作': 120
      }

      for (const [key, value] of Object.entries(defaults)) {
        if (cleanTaskName.includes(key)) {
          duration = value
          break
        }
      }

      if (duration === null) {
        duration = 60
      }
    }

    const task = {
      name: cleanTaskName || taskStr,
      originalName: taskStr,
      type: type,
      duration: duration,
      priority: priority
    }

    tasks.push(task)
  })

  return tasks
}

// 更新任务时长
const updateTaskDuration = (task, minutes) => {
  customDurations.value[task.originalName] = parseInt(minutes) || 30
  task.duration = parseInt(minutes) || 30
}

// 生成分配方案 - 改进的版本，任务分散到全天
const generateSchedule = () => {
  const start = parseISO(startDate.value)
  const end = parseISO(endDate.value)
  const days = differenceInDays(end, start) + 1
  const dailyMinutes = parseInt(dailyHours.value) * 60

  const scheduleDays = []

  // 为每一天生成时间表
  for (let i = 0; i < days; i++) {
    const currentDate = addDays(start, i)
    const dateStr = format(currentDate, 'yyyy-MM-dd')
    const weekday = getWeekday(dateStr)

    // 生成一天的时间段（更细粒度，10分钟一个单位）
    const availableSlots = generateDetailedTimeSlots(currentDate, dailyMinutes)

    scheduleDays.push({
      date: dateStr,
      weekday: weekday,
      slots: availableSlots,
      totalDuration: 0
    })
  }

  // 标记已被现有任务占用的时间段
  markOccupiedSlots(scheduleDays)

  // 复制任务列表，按类型和时长排序
  let tasksToAllocate = [...parsedTasks.value]

  // 策略：不同类型的任务分配到不同时间段
  // 生活任务（如洗澡、洗衣）安排在早上或晚上
  // 学习/工作任务安排在上午和下午
  // 运动安排在下午
  const allocatedTasks = []
  const unallocatedTasks = []

  // 按类型分组
  const taskGroups = {
    life: tasksToAllocate.filter(task => task.type === 'life'),
    study: tasksToAllocate.filter(task => task.type === 'study'),
    work: tasksToAllocate.filter(task => task.type === 'work'),
    exercise: tasksToAllocate.filter(task => task.type === 'exercise'),
    other: tasksToAllocate.filter(task => !['life', 'study', 'work', 'exercise'].includes(task.type))
  }

  // 为每个任务类型定义偏好时间段
  const timePreferences = {
    life: { preferredTimes: ['morning', 'evening'], avoidTimes: ['afternoon'] },
    study: { preferredTimes: ['morning', 'afternoon'], avoidTimes: ['evening'] },
    work: { preferredTimes: ['morning', 'afternoon'], avoidTimes: [] },
    exercise: { preferredTimes: ['afternoon'], avoidTimes: ['morning', 'evening'] },
    other: { preferredTimes: [], avoidTimes: [] }
  }

  // 分配任务
  for (const day of scheduleDays) {
    // 将一天的时间段分成三部分：上午、下午、晚上
    const morningSlots = day.slots.filter(slot => isMorningTime(slot.startTime))
    const afternoonSlots = day.slots.filter(slot => isAfternoonTime(slot.startTime))
    const eveningSlots = day.slots.filter(slot => isEveningTime(slot.startTime))

    // 为每个时间段创建可用的槽位列表
    const timeSlotGroups = {
      morning: [...morningSlots],
      afternoon: [...afternoonSlots],
      evening: [...eveningSlots]
    }

    // 按类型分配任务
    for (const [type, tasks] of Object.entries(taskGroups)) {
      if (tasks.length === 0) continue

      const preferences = timePreferences[type] || timePreferences.other

      // 首先尝试偏好时间段
      for (const timeOfDay of preferences.preferredTimes) {
        for (let i = 0; i < tasks.length; i++) {
          const task = tasks[i]
          if (allocatedTasks.includes(task)) continue

          // 在偏好时间段内查找可用槽位
          const availableSlot = findAvailableSlotInGroup(timeSlotGroups[timeOfDay], task.duration, day)
          if (availableSlot) {
            allocateTaskToSlot(availableSlot, task, day)
            allocatedTasks.push(task)
            // 从原数组中移除已分配的任务
            tasks.splice(i, 1)
            i--
          }
        }
      }

      // 然后尝试其他时间段（除了避免的时间段）
      const allTimeSlots = [...morningSlots, ...afternoonSlots, ...eveningSlots]
      const avoidTimes = preferences.avoidTimes || []
      const availableSlots = allTimeSlots.filter(slot => {
        const timeOfDay = getTimeOfDay(slot.startTime)
        return !avoidTimes.includes(timeOfDay)
      })

      for (let i = 0; i < tasks.length; i++) {
        const task = tasks[i]
        if (allocatedTasks.includes(task)) continue

        const availableSlot = findAvailableSlotInGroup(availableSlots, task.duration, day)
        if (availableSlot) {
          allocateTaskToSlot(availableSlot, task, day)
          allocatedTasks.push(task)
          tasks.splice(i, 1)
          i--
        }
      }
    }
  }

  // 清理：移除未分配任务的空槽位
  scheduleDays.forEach(day => {
    day.slots = day.slots.filter(slot => slot.task)
  })

  // 收集未分配的任务
  for (const group of Object.values(taskGroups)) {
    unallocatedTasks.push(...group)
  }

  // 生成建议
  const suggestions = generateSuggestions(allocatedTasks, unallocatedTasks, scheduleDays, dailyMinutes)

  aiSchedule.value = {
    days: scheduleDays,
    suggestions: suggestions
  }
}

// 生成更详细的时间段（10分钟一个单位）
const generateDetailedTimeSlots = (date, dailyMinutes) => {
  const slots = []
  const dayOfWeek = date.getDay()
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

  // 工作日和周末的不同时间安排
  const timeBlocks = isWeekend
      ? [
        { start: '08:00', end: '12:00', label: '上午' },
        { start: '14:00', end: '18:00', label: '下午' },
        { start: '19:00', end: '22:00', label: '晚上' }
      ]
      : [
        { start: '07:00', end: '12:00', label: '上午' },
        { start: '13:00', end: '18:00', label: '下午' },
        { start: '19:00', end: '22:00', label: '晚上' }
      ]

  // 每10分钟一个时间段，更灵活
  const slotDuration = 10 // 分钟

  timeBlocks.forEach((block) => {
    const [startHour, startMinute] = block.start.split(':').map(Number)
    const [endHour, endMinute] = block.end.split(':').map(Number)

    const startTotalMinutes = startHour * 60 + startMinute
    const endTotalMinutes = endHour * 60 + endMinute

    for (let time = startTotalMinutes; time < endTotalMinutes; time += slotDuration) {
      const startTime = formatTime(Math.floor(time / 60), time % 60)
      const endTime = formatTime(Math.floor((time + slotDuration) / 60), (time + slotDuration) % 60)

      slots.push({
        originalStartTime: startTime,
        originalEndTime: endTime,
        originalDuration: slotDuration,
        startTime: startTime,
        endTime: endTime,
        duration: slotDuration,
        task: null,
        timeOfDay: getTimeOfDay(startTime),
        blockLabel: block.label
      })
    }
  })

  return slots
}

// 判断时间段属于哪个部分
const getTimeOfDay = (time) => {
  const [hour] = time.split(':').map(Number)
  if (hour < 12) return 'morning'
  if (hour < 18) return 'afternoon'
  return 'evening'
}

const isMorningTime = (time) => {
  const [hour] = time.split(':').map(Number)
  return hour >= 7 && hour < 12
}

const isAfternoonTime = (time) => {
  const [hour] = time.split(':').map(Number)
  return hour >= 12 && hour < 18
}

const isEveningTime = (time) => {
  const [hour] = time.split(':').map(Number)
  return hour >= 18 && hour < 22
}

// 标记已被占用的时间段
const markOccupiedSlots = (scheduleDays) => {
  scheduleDays.forEach(day => {
    // 标记现有任务占用的时间段
    existingTasks.value.forEach(task => {
      if (task.startDate === day.date && task.startTime && task.endTime) {
        const startMinutes = timeToMinutes(task.startTime)
        const endMinutes = timeToMinutes(task.endTime)
        const duration = endMinutes - startMinutes

        // 标记所有重叠的时间段
        day.slots.forEach(slot => {
          const slotStart = timeToMinutes(slot.startTime)
          const slotEnd = timeToMinutes(slot.endTime)

          // 检查时间段是否重叠
          if (slotStart < endMinutes && slotEnd > startMinutes) {
            slot.occupied = true
          }
        })
      }
    })
  })
}

// 在时间段组中查找可用槽位
const findAvailableSlotInGroup = (slots, requiredDuration, day) => {
  const slotDuration = 10 // 每个基础时间段10分钟
  const slotsNeeded = Math.ceil(requiredDuration / slotDuration)

  // 随机选择一个起始点，避免总是从第一个开始
  const startIndexes = Array.from({ length: Math.max(1, slots.length - slotsNeeded) }, (_, i) => i)
  // 打乱顺序，实现随机分配
  shuffleArray(startIndexes)

  for (const startIndex of startIndexes) {
    // 检查是否有足够的连续时间段
    if (startIndex + slotsNeeded > slots.length) continue

    let allAvailable = true
    for (let i = 0; i < slotsNeeded; i++) {
      const slot = slots[startIndex + i]
      if (slot.occupied || slot.task) {
        allAvailable = false
        break
      }
    }

    if (allAvailable) {
      return slots[startIndex]
    }
  }

  return null
}

// 打乱数组顺序
const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]]
  }
  return array
}

// 分配任务到时间段
const allocateTaskToSlot = (slot, task, day) => {
  slot.task = task
  slot.startTime = slot.originalStartTime
  slot.endTime = addMinutesToTime(slot.originalStartTime, task.duration)
  slot.duration = task.duration

  // 标记后续的时间段为占用（因为任务可能占用多个连续时间段）
  const slotsNeeded = Math.ceil(task.duration / 10)
  const startIndex = day.slots.findIndex(s => s === slot)

  for (let i = 1; i < slotsNeeded; i++) {
    if (startIndex + i < day.slots.length) {
      day.slots[startIndex + i].occupied = true
    }
  }

  day.totalDuration += task.duration
}

// 生成建议
const generateSuggestions = (allocatedTasks, unallocatedTasks, scheduleDays, dailyMinutes) => {
  const suggestions = []
  const allocatedCount = allocatedTasks.length
  const totalCount = allocatedCount + unallocatedTasks.length

  suggestions.push(`成功分配了 ${allocatedCount}/${totalCount} 个任务`)

  if (unallocatedTasks.length > 0) {
    suggestions.push(`以下 ${unallocatedTasks.length} 个任务未分配：`)
    unallocatedTasks.forEach(task => {
      suggestions.push(`- ${task.name} (${task.duration}分钟)`)
    })

    const totalAvailableMinutes = scheduleDays.length * dailyMinutes
    const totalAllocatedMinutes = scheduleDays.reduce((sum, day) => sum + day.totalDuration, 0)
    const totalRequiredMinutes = totalAllocatedMinutes + unallocatedTasks.reduce((sum, task) => sum + task.duration, 0)

    suggestions.push(`时间分析：`)
    suggestions.push(`- 总需求时间：${totalRequiredMinutes}分钟`)
    suggestions.push(`- 已分配时间：${totalAllocatedMinutes}分钟`)
    suggestions.push(`- 可用时间：${totalAvailableMinutes}分钟`)
    suggestions.push(`- 时间利用率：${Math.round((totalAllocatedMinutes / totalAvailableMinutes) * 100)}%`)

    if (totalRequiredMinutes > totalAvailableMinutes) {
      suggestions.push(`时间不足！还需要 ${totalRequiredMinutes - totalAvailableMinutes} 分钟`)
      suggestions.push(`建议：增加每日可用时间或延长总天数`)
    }
  }

  // 添加任务分布建议
  scheduleDays.forEach(day => {
    const taskTypes = new Set(day.slots.map(slot => slot.task?.type))
    if (taskTypes.size > 1) {
      suggestions.push(`${day.date}：任务类型多样，包含 ${Array.from(taskTypes).map(type => getTaskTypeText(type)).join('、')}`)
    }
  })

  return suggestions
}

// 辅助函数
const formatTime = (hours, minutes) => {
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
}

const addMinutesToTime = (time, minutes) => {
  const [hours, mins] = time.split(':').map(Number)
  const date = new Date()
  date.setHours(hours, mins, 0, 0)
  const newDate = addMinutes(date, minutes)
  return format(newDate, 'HH:mm')
}

const timeToMinutes = (time) => {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

const getWeekday = (dateStr) => {
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return weekdays[new Date(dateStr).getDay()]
}

// 创建所有任务
const createAllTasks = () => {
  if (!aiSchedule.value) {
    alert('请先生成分配方案')
    return
  }

  let createdCount = 0

  try {
    aiSchedule.value.days.forEach(day => {
      day.slots.forEach(slot => {
        if (slot.task) {
          const taskData = {
            title: slot.task.name,
            description: `AI智能分配：${day.date} ${slot.startTime}-${slot.endTime} (${slot.task.duration}分钟)`,
            category: slot.task.type === 'study' ? 'study' :
                slot.task.type === 'work' ? 'work' :
                    slot.task.type === 'exercise' ? 'exercise' : 'life',
            priority: slot.task.priority,
            startDate: day.date,
            endDate: day.date,
            startTime: slot.startTime,
            endTime: slot.endTime,
            taskType: 'time',
            estimatedTime: slot.task.duration,
            tags: ['AI分配'],
            completed: false
          }

          taskStore.addTask(taskData)
          createdCount++
        }
      })
    })

    alert(`✅ 成功创建 ${createdCount} 个任务！`)

    taskInput.value = ''
    parsedTasks.value = []
    aiSchedule.value = null
    customDurations.value = {}
    existingTasks.value = []

    setTimeout(() => {
      uiStore.showAIPanel = false
    }, 1000)

  } catch (error) {
    console.error('创建任务失败:', error)
    alert('创建任务失败，请稍后重试')
  }
}

// 重新生成分配方案
const regenerateSchedule = () => {
  if (!parsedTasks.value.length) {
    analyzeTasks()
  } else {
    parsedTasks.value.forEach(task => {
      if (customDurations.value[task.originalName]) {
        task.duration = customDurations.value[task.originalName]
      }
    })

    loadExistingTasks().then(() => {
      generateSchedule()
    })
  }
}

// 加载示例
const loadExample = (example) => {
  taskInput.value = example.input

  const tomorrow = addDays(new Date(), 1)
  startDate.value = format(tomorrow, 'yyyy-MM-dd')
  endDate.value = format(addDays(tomorrow, example.input.includes('天') ? 3 : 1), 'yyyy-MM-dd')

  setTimeout(() => {
    analyzeTasks()
  }, 100)
}

// 监听日期变化
watch([startDate, endDate], () => {
  if (startDate.value && endDate.value) {
    loadExistingTasks()
  }
})

// 初始化
onMounted(() => {
  const tomorrow = addDays(new Date(), 1)
  startDate.value = format(tomorrow, 'yyyy-MM-dd')
  endDate.value = format(addDays(tomorrow, 2), 'yyyy-MM-dd')

  setTimeout(() => {
    if (startDate.value && endDate.value) {
      loadExistingTasks()
    }
  }, 500)
})

const closePanel = () => {
  uiStore.showAIPanel = false
}
</script>

<style scoped>
.ai-assistant-panel {
  width: 420px;
  background: white;
  border-left: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  box-shadow: -2px 0 10px rgba(0,0,0,0.1);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.panel-header h3 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
}

.btn-close {
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-close:hover {
  background: rgba(255, 255, 255, 0.1);
}

.panel-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  background: #f8f9fa;
}

/* 简洁输入区 */
.simple-input-section {
  margin-bottom: 25px;
}

.simple-input-section h4 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 1.1rem;
  font-weight: 600;
}

.input-card {
  background: white;
  border-radius: 10px;
  padding: 15px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  margin-bottom: 15px;
}

.simple-textarea {
  width: 100%;
  padding: 12px;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-size: 0.95rem;
  line-height: 1.5;
  resize: none;
  min-height: 80px;
  font-family: inherit;
  transition: border-color 0.3s;
  box-sizing: border-box;
  margin-bottom: 10px;
}

.simple-textarea:focus {
  outline: none;
  border-color: #667eea;
}

.quick-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag {
  padding: 6px 12px;
  background: #f1f3ff;
  color: #667eea;
  border-radius: 20px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid #dbe4ff;
}

.tag:hover {
  background: #667eea;
  color: white;
  transform: translateY(-1px);
}

/* 时间选择 */
.time-selection {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.time-item {
  flex: 1;
  min-width: 120px;
}

.time-item label {
  display: block;
  margin-bottom: 8px;
  font-size: 0.9rem;
  color: #666;
  font-weight: 500;
}

.date-input, .time-select {
  width: 100%;
  padding: 10px;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-size: 0.9rem;
  background: white;
  box-sizing: border-box;
  transition: border-color 0.3s;
}

.date-input:focus, .time-select:focus {
  outline: none;
  border-color: #667eea;
}

/* 分析按钮 */
.analyze-btn {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 2px 10px rgba(102, 126, 234, 0.3);
}

.analyze-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.analyze-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 任务解析结果 */
.parsed-section {
  margin-bottom: 25px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.section-header h4 {
  margin: 0;
  color: #333;
  font-size: 1.1rem;
  font-weight: 600;
}

.task-count {
  background: #e3f2fd;
  color: #1976d2;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 500;
}

.task-cards {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.task-card {
  display: flex;
  align-items: center;
  padding: 12px 15px;
  background: white;
  border-radius: 10px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.task-icon {
  font-size: 1.2rem;
  margin-right: 12px;
}

.task-content {
  flex: 1;
}

.task-name {
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
  font-size: 0.95rem;
}

.task-meta {
  display: flex;
  gap: 15px;
  font-size: 0.85rem;
  color: #666;
}

.task-priority {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
}

.task-priority.high {
  background: #ffebee;
  color: #d32f2f;
}

.task-priority.medium {
  background: #fff3e0;
  color: #ff9800;
}

.task-priority.low {
  background: #e8f5e9;
  color: #388e3c;
}

/* 日程安排 */
.schedule-section {
  margin-bottom: 25px;
}

.schedule-stats {
  display: flex;
  gap: 15px;
  font-size: 0.9rem;
  color: #666;
}

/* 时间线视图 */
.timeline-view {
  background: white;
  border-radius: 10px;
  padding: 15px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  margin-bottom: 20px;
}

.timeline-day {
  margin-bottom: 20px;
}

.timeline-day:last-child {
  margin-bottom: 0;
}

.day-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid #f0f0f0;
}

.day-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.date {
  font-weight: 600;
  color: #333;
  font-size: 0.95rem;
}

.weekday {
  color: #666;
  font-size: 0.85rem;
}

.day-total {
  color: #667eea;
  font-weight: 500;
  font-size: 0.9rem;
}

.day-timeline {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.time-slot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  transition: all 0.2s;
  background-color: #f8f9fa;
}

.time-slot:hover {
  transform: translateX(2px);
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
}

.task-slot {
  border-left: 4px solid #667eea;
}



.slot-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
}

.slot-time {
  font-size: 0.85rem;
  color: #666;
  min-width: 85px;
}

.slot-task {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  color: #333;
  font-size: 0.9rem;
}

.task-icon-small {
  font-size: 1rem;
}


.slot-duration {
  font-size: 0.85rem;
  color: #666;
}

/* AI建议 */
.ai-suggestions {
  background: linear-gradient(135deg, #f8f9ff 0%, #f0f4ff 100%);
  border-radius: 10px;
  padding: 15px;
  margin-bottom: 20px;
  border-left: 4px solid #667eea;
}

.suggestions-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  font-weight: 500;
  color: #667eea;
  font-size: 0.95rem;
}

.suggestions-content {
  font-size: 0.9rem;
  color: #444;
  line-height: 1.5;
}

.suggestions-content p {
  margin: 8px 0;
}

.suggestions-content p:last-child {
  margin-bottom: 0;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  gap: 15px;
}

.create-btn, .regenerate-btn {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.create-btn {
  background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%);
  color: white;
}

.regenerate-btn {
  background: linear-gradient(135deg, #2196F3 0%, #0D47A1 100%);
  color: white;
}

.create-btn:hover, .regenerate-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

/* 示例区域 */
.examples-section {
  margin-top: 25px;
}

.examples-section h4 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 1.1rem;
  font-weight: 600;
}

.examples-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.example-card {
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
}

.example-card:hover {
  border-color: #667eea;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(102, 126, 234, 0.1);
}

.example-icon {
  font-size: 1.5rem;
  margin-bottom: 8px;
}

.example-text {
  font-size: 0.85rem;
  color: #333;
  font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .ai-assistant-panel {
    width: 100%;
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    z-index: 1000;
  }

  .time-selection {
    flex-direction: column;
  }

  .time-item {
    min-width: auto;
  }

  .examples-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .action-buttons {
    flex-direction: column;
  }
}

@media (max-width: 480px) {
  .examples-grid {
    grid-template-columns: 1fr;
  }

  .slot-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .slot-time {
    min-width: auto;
  }
}

/* 暗色模式支持 */
@media (prefers-color-scheme: dark) {
  .ai-assistant-panel {
    background: #1e1e1e;
    border-left-color: #333;
  }

  .panel-content {
    background: #121212;
  }

  .input-card,
  .timeline-view,
  .task-card,
  .example-card {
    background: #2d2d2d;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  }

  .simple-input-section h4,
  .section-header h4,
  .examples-section h4 {
    color: #ffffff;
  }

  .simple-textarea,
  .date-input,
  .time-select {
    background: #3d3d3d;
    border-color: #444;
    color: #ffffff;
  }

  .tag {
    background: #3d3d3d;
    border-color: #555;
    color: #bbbbbb;
  }

  .tag:hover {
    background: #667eea;
    color: white;
  }

  .task-name {
    color: #ffffff;
  }

  .day-title .date {
    color: #ffffff;
  }

  .slot-task {
    color: #ffffff;
  }

  .ai-suggestions {
    background: linear-gradient(135deg, #2d2d2d 0%, #252525 100%);
  }
}
</style>