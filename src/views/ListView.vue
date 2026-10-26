<template>
  <div class="list-view">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <div class="left-tools">
        <button @click="showAddModal = true" class="btn-primary">
          + 新建任务
        </button>

        <!-- 批量操作工具栏 -->
        <div v-if="selectedTasks.length > 0" class="batch-actions">
          <span class="batch-count">
            已选中 {{ selectedTasks.length }} 个任务
          </span>
          <button @click="toggleAllSelection" class="btn-secondary">
            {{ isAllSelected ? '取消全选' : '全选当前页' }}
          </button>
          <button @click="confirmBatchDelete" class="btn-danger">
            🗑️ 批量删除
          </button>
          <button @click="clearSelection" class="btn-secondary">
            取消选择
          </button>
        </div>
      </div>

      <div class="right-tools">
        <div class="filters">
          <!-- 导入导出按钮组 -->
          <div class="import-export-group">
            <button @click="exportTasks" class="btn-secondary" title="导出任务">
              📤 导出
            </button>
            <button @click="showImportModal = true" class="btn-secondary" title="导入任务">
              📥 导入
            </button>
          </div>

          <input
              v-model="taskStore.searchQuery"
              type="text"
              placeholder="搜索任务..."
              class="search-input"
          >

          <select v-model="taskStore.filter" class="filter-select">
            <option value="all">全部</option>
            <option value="active">进行中</option>
            <option value="completed">已完成</option>
          </select>

          <!-- 添加排序选项 -->
          <select v-model="sortBy" class="filter-select">
            <option value="dueDate">按截止时间</option>
            <option value="priority">按优先级</option>
            <option value="createdAt">按创建时间</option>
            <option value="title">按标题</option>
          </select>
        </div>
      </div>
    </div>

    <!-- 任务列表 -->
    <div class="task-list">
      <div v-if="sortedTasks.length === 0" class="empty-state">
        <p>📝 暂无任务</p>
        <button @click="showAddModal = true" class="btn-secondary">
          创建第一个任务
        </button>
      </div>

      <!-- 显示未完成任务 -->
      <div v-if="hasIncompleteTasks" class="section-header">
        <div class="section-header-content">
          <h4>进行中的任务 ({{ incompleteTasks.length }})</h4>
          <label class="select-all-checkbox" v-if="incompleteTasks.length > 0">
            <input
                type="checkbox"
                :checked="areAllIncompleteSelected"
                @change="toggleIncompleteSelection"
                class="checkbox"
            >
            <span class="checkbox-custom"></span>
            全选
          </label>
        </div>
      </div>

      <div
          v-for="task in incompleteTasks"
          :key="task.id"
          class="task-card"
          :class="{
            selected: isTaskSelected(task.id),
            'selection-mode': selectedTasks.length > 0
          }"
      >
        <div class="task-header">
          <input
              type="checkbox"
              :checked="isTaskSelected(task.id)"
              @change="toggleTaskSelection(task.id)"
              class="task-checkbox selection-checkbox"
          >
          <input
              type="checkbox"
              :checked="task.completed"
              @change="toggleTask(task)"
              class="task-checkbox completion-checkbox"
          >
          <h3 class="task-title">{{ task.title }}</h3>
          <span class="task-priority" :class="task.priority">
            {{ getPriorityText(task.priority) }}
          </span>
        </div>

        <p v-if="task.description" class="task-description">
          {{ task.description }}
        </p>

        <div class="task-footer">
          <span class="task-category">
            {{ getCategoryName(task.category) }}
          </span>
          <!-- 修改这里：使用新的时间显示函数 -->
          <span class="task-date" :class="{ overdue: isOverdue(task) }">
            📅 {{ formatTaskDisplayDate(task) }}
            <span v-if="isOverdue(task)" class="overdue-badge">逾期</span>
          </span>
          <div class="task-actions">
            <button @click="editTask(task)" class="btn-icon" :disabled="selectedTasks.length > 0">✏️</button>
            <button @click="deleteTask(task.id)" class="btn-icon" :disabled="selectedTasks.length > 0">🗑️</button>
          </div>
        </div>
      </div>

      <!-- 显示已完成任务 -->
      <div v-if="hasCompletedTasks" class="section-header completed">
        <div class="section-header-content">
          <h4>已完成的任务 ({{ completedTasks.length }})</h4>
          <label class="select-all-checkbox" v-if="completedTasks.length > 0">
            <input
                type="checkbox"
                :checked="areAllCompletedSelected"
                @change="toggleCompletedSelection"
                class="checkbox"
            >
            <span class="checkbox-custom"></span>
            全选
          </label>
        </div>
      </div>

      <div
          v-for="task in completedTasks"
          :key="task.id"
          class="task-card completed"
          :class="{
            selected: isTaskSelected(task.id),
            'selection-mode': selectedTasks.length > 0
          }"
      >
        <div class="task-header">
          <input
              type="checkbox"
              :checked="isTaskSelected(task.id)"
              @change="toggleTaskSelection(task.id)"
              class="task-checkbox selection-checkbox"
          >
          <input
              type="checkbox"
              :checked="task.completed"
              @change="toggleTask(task)"
              class="task-checkbox completion-checkbox"
          >
          <h3 class="task-title">{{ task.title }}</h3>
          <span class="task-priority" :class="task.priority">
            {{ getPriorityText(task.priority) }}
          </span>
        </div>

        <p v-if="task.description" class="task-description">
          {{ task.description }}
        </p>

        <div class="task-footer">
          <span class="task-category">
            {{ getCategoryName(task.category) }}
          </span>
          <!-- 修改这里：使用新的时间显示函数 -->
          <span class="task-date">
            📅 {{ formatTaskDisplayDate(task) }}
          </span>
          <div class="task-actions">
            <button @click="editTask(task)" class="btn-icon" :disabled="selectedTasks.length > 0">✏️</button>
            <button @click="deleteTask(task.id)" class="btn-icon" :disabled="selectedTasks.length > 0">🗑️</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 任务导入模态框 -->
    <div v-if="showImportModal" class="modal-overlay">
      <div class="modal">
        <h3>📥 导入任务</h3>

        <div class="import-options">
          <div class="option-card" @click="importFromJSON" :class="{ active: importOption === 'json' }">
            <div class="option-icon">📄</div>
            <div class="option-content">
              <h4>从JSON文件导入</h4>
              <p>导入之前导出的任务数据文件</p>
            </div>
          </div>

<!--          <div class="option-card" @click="importFromCSV" :class="{ active: importOption === 'csv' }">-->
<!--            <div class="option-icon">📊</div>-->
<!--            <div class="option-content">-->
<!--              <h4>从CSV文件导入</h4>-->
<!--              <p>支持通用格式的CSV文件</p>-->
<!--            </div>-->
<!--          </div>-->

          <div class="option-card" @click="importFromText" :class="{ active: importOption === 'text' }">
            <div class="option-icon">📝</div>
            <div class="option-content">
              <h4>手动输入导入</h4>
              <p>手动输入或粘贴JSON数据</p>
            </div>
          </div>
        </div>

        <!-- JSON输入区域 -->
        <div v-if="importOption === 'text'" class="json-input-area">
          <label class="form-label">JSON数据：</label>
          <textarea
              v-model="jsonInput"
              placeholder='请粘贴JSON格式的任务数据，例如：
[
  {
    "title": "示例任务",
    "description": "任务描述",
    "category": "work",
    "priority": "medium"
  }
]'
              class="json-textarea"
              rows="10"
          ></textarea>
          <div class="input-hint">
            支持JSON数组格式的任务数据
          </div>
        </div>

        <!-- 导入预览 -->
        <div v-if="importPreview.length > 0" class="import-preview">
          <h4>导入预览 ({{ importPreview.length }} 个任务)</h4>
          <div class="preview-list">
            <div
                v-for="(task, index) in importPreview.slice(0, 3)"
                :key="index"
                class="preview-task"
            >
              <span class="preview-title">{{ task.title }}</span>
              <span class="preview-category">{{ getCategoryName(task.category) }}</span>
              <span class="preview-priority" :class="task.priority">
                {{ getPriorityText(task.priority) }}
              </span>
            </div>
            <div v-if="importPreview.length > 3" class="preview-more">
              还有 {{ importPreview.length - 3 }} 个任务...
            </div>
          </div>
        </div>

        <!-- 导入选项 -->
        <div class="import-settings">
          <label class="checkbox-label">
            <input
                type="checkbox"
                v-model="importOptions.mergeMode"
                class="checkbox"
            >
            <span class="checkbox-custom"></span>
            合并模式（保留现有任务）
          </label>
          <p class="hint">关闭此选项将清空现有任务后再导入</p>

          <label class="checkbox-label">
            <input
                type="checkbox"
                v-model="importOptions.skipDuplicates"
                class="checkbox"
            >
            <span class="checkbox-custom"></span>
            跳过重复任务（根据标题判断）
          </label>
          <p class="hint">开启后将不会导入标题相同的任务</p>
        </div>

        <!-- 状态提示 -->
        <div v-if="importStatus.message" class="import-status" :class="importStatus.type">
          {{ importStatus.message }}
        </div>

        <div class="modal-actions">
          <button type="button" @click="closeImportModal" class="btn-secondary">
            取消
          </button>
          <button
              type="button"
              @click="confirmImport"
              class="btn-primary"
              :disabled="importPreview.length === 0"
          >
            确认导入 ({{ importPreview.length }})
          </button>
        </div>
      </div>
    </div>

    <!-- 批量删除确认模态框 -->
    <div v-if="showBatchDeleteModal" class="modal-overlay">
      <div class="modal">
        <h3>⚠️ 确认批量删除</h3>
        <div class="batch-delete-content">
          <div class="warning-icon">
            🗑️
          </div>
          <p class="warning-text">
            确定要删除选中的 <strong>{{ selectedTasks.length }}</strong> 个任务吗？
          </p>
          <div v-if="selectedTasksPreview.length > 0" class="selected-tasks-preview">
            <p>即将删除的任务：</p>
            <ul>
              <li v-for="task in selectedTasksPreview" :key="task.id">
                {{ task.title }}
              </li>
              <li v-if="selectedTasks.length > 5" class="more-tasks">
                ... 还有 {{ selectedTasks.length - 5 }} 个任务
              </li>
            </ul>
          </div>
          <div class="delete-options">
            <label class="checkbox-label">
              <input
                  type="checkbox"
                  v-model="deleteCompletedOnly"
                  class="checkbox"
              >
              <span class="checkbox-custom"></span>
              仅删除已完成的任务
            </label>
            <p class="hint" v-if="deleteCompletedOnly">
              此选项将过滤掉未完成的任务，只删除已完成的任务
            </p>
          </div>
        </div>
        <div class="modal-actions">
          <button type="button" @click="showBatchDeleteModal = false" class="btn-secondary">
            取消
          </button>
          <button type="button" @click="executeBatchDelete" class="btn-danger">
            🗑️ 确认删除
          </button>
        </div>
      </div>
    </div>

    <!-- 添加/编辑任务模态框（已修改） -->
    <div v-if="showAddModal || showEditModal" class="modal-overlay">
      <div class="modal">
        <h3>{{ isEditing ? '编辑任务' : '新建任务' }}</h3>
        <form @submit.prevent="handleSubmit">
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
                <option value="general">通用</option>
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

          <div class="form-group" v-if="isEditing">
            <label class="checkbox-label">
              <input
                  type="checkbox"
                  v-model="taskForm.completed"
                  class="checkbox"
              >
              <span class="checkbox-custom"></span>
              标记为已完成
            </label>
          </div>

          <div class="modal-actions">
            <button type="button" @click="closeModal" class="btn-secondary">
              取消
            </button>
            <button type="submit" class="btn-primary">
              {{ isEditing ? '更新任务' : '创建任务' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useTaskStore } from '../stores/taskStore'
import { format, addDays, parseISO, isValid } from 'date-fns'

const taskStore = useTaskStore()

// 排序选项
const sortBy = ref('dueDate')

// 模态框状态
const showAddModal = ref(false)
const showEditModal = ref(false)
const showBatchDeleteModal = ref(false)
const showImportModal = ref(false)

// 批量操作状态
const selectedTasks = ref([])
const deleteCompletedOnly = ref(true)

// 导入相关状态
const importOption = ref('json')
const jsonInput = ref('')
const importOptions = ref({
  mergeMode: true,
  skipDuplicates: true
})
const importPreview = ref([])
const importStatus = ref({
  type: '', // 'success' | 'error' | 'warning'
  message: ''
})

// 任务表单数据
const taskForm = ref({
  id: null,
  title: '',
  description: '',
  category: 'work',
  priority: 'medium',
  taskType: 'time',
  startDateTime: '',
  endDateTime: '',
  startDate: '',
  endDate: '',
  estimatedTime: 60,
  tagsInput: '',
  completed: false
})

// 计算属性
const isEditing = computed(() => showEditModal.value)
const isAllSelected = computed(() => {
  if (sortedTasks.value.length === 0) return false
  return selectedTasks.value.length === sortedTasks.value.length
})

const areAllIncompleteSelected = computed(() => {
  if (incompleteTasks.value.length === 0) return false
  const incompleteTaskIds = incompleteTasks.value.map(t => t.id)
  return incompleteTaskIds.every(id => selectedTasks.value.includes(id))
})

const areAllCompletedSelected = computed(() => {
  if (completedTasks.value.length === 0) return false
  const completedTaskIds = completedTasks.value.map(t => t.id)
  return completedTaskIds.every(id => selectedTasks.value.includes(id))
})

const selectedTasksPreview = computed(() => {
  return sortedTasks.value
      .filter(task => selectedTasks.value.includes(task.id))
      .slice(0, 5)
})

const sortedTasks = computed(() => {
  const tasks = [...taskStore.filteredTasks]

  tasks.sort((a, b) => {
    if (a.completed && !b.completed) return 1
    if (!a.completed && b.completed) return -1
    return 0
  })

  return tasks.sort((a, b) => {
    if (a.completed && b.completed) {
      const aCompletedTime = a.completedAt ? new Date(a.completedAt) : new Date(0)
      const bCompletedTime = b.completedAt ? new Date(b.completedAt) : new Date(0)
      return bCompletedTime - aCompletedTime
    }

    if (!a.completed && !b.completed) {
      switch (sortBy.value) {
        case 'dueDate': {
          // 使用任务的结束时间作为排序依据
          const getTaskEndDate = (task) => {
            if (task.endDate) return new Date(task.endDate)
            if (task.dueDate) return new Date(task.dueDate)
            return new Date('9999-12-31')
          }
          const aEndDate = getTaskEndDate(a)
          const bEndDate = getTaskEndDate(b)
          return aEndDate - bEndDate
        }
        case 'priority': {
          const priorityValues = { high: 3, medium: 2, low: 1 }
          const aPriority = priorityValues[a.priority] || 0
          const bPriority = priorityValues[b.priority] || 0
          return bPriority - aPriority
        }
        case 'createdAt': {
          const aCreated = a.createdAt ? new Date(a.createdAt) : new Date(0)
          const bCreated = b.createdAt ? new Date(b.createdAt) : new Date(0)
          return bCreated - aCreated
        }
        case 'title':
          return a.title.localeCompare(b.title)
        default:
          return 0
      }
    }

    return 0
  })
})

// 分离已完成和未完成的任务
const completedTasks = computed(() => sortedTasks.value.filter(task => task.completed))
const incompleteTasks = computed(() => sortedTasks.value.filter(task => !task.completed))

const hasCompletedTasks = computed(() => completedTasks.value.length > 0)
const hasIncompleteTasks = computed(() => incompleteTasks.value.length > 0)

// 工具函数
const getPriorityText = (priority) => {
  const texts = { high: '高', medium: '中', low: '低' }
  return texts[priority] || priority
}

const getCategoryName = (category) => {
  const names = {
    work: '工作',
    study: '学习',
    life: '生活',
    shopping: '购物',
    general: '通用'
  }
  return names[category] || category
}

const formatDate = (date) => {
  if (!date) return '无截止日'
  try {
    return format(new Date(date), 'MM/dd')
  } catch {
    return '日期错误'
  }
}

// 格式化任务显示日期（用于任务卡片显示）
const formatTaskDisplayDate = (task) => {
  if (task.taskType === 'allDay' || !task.startTime || task.startTime === '全天') {
    // 全天任务
    if (task.startDate && task.endDate) {
      if (task.startDate === task.endDate) {
        return `全天 ${formatDate(task.startDate)}`
      } else {
        return `全天 ${formatDate(task.startDate)} - ${formatDate(task.endDate)}`
      }
    }
    return task.startDate ? `全天 ${formatDate(task.startDate)}` : '全天任务'
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
  const endDate = task.endDate || task.dueDate
  if (!endDate) return false

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const taskEndDate = new Date(endDate)
  return taskEndDate < today
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

const isTaskSelected = (taskId) => {
  return selectedTasks.value.includes(taskId)
}

// 任务类型变更处理
const onTaskTypeChange = () => {
  const now = new Date()
  const today = format(now, 'yyyy-MM-dd')
  const tomorrow = addDays(now, 1)

  if (taskForm.value.taskType === 'allDay') {
    // 全天任务
    if (!isEditing.value) {
      taskForm.value.startDate = today
      taskForm.value.endDate = today
    }
    taskForm.value.startDateTime = ''
    taskForm.value.endDateTime = ''
    if (!isEditing.value) {
      taskForm.value.estimatedTime = 480
    }
  } else {
    // 时间段任务
    if (!isEditing.value) {
      const tomorrowStr = format(tomorrow, 'yyyy-MM-dd')
      taskForm.value.startDateTime = tomorrowStr + 'T09:00'
      taskForm.value.endDateTime = tomorrowStr + 'T10:00'
      taskForm.value.startDate = ''
      taskForm.value.endDate = ''
      taskForm.value.estimatedTime = 60
    }
  }
}

// 选择操作函数
const toggleTaskSelection = (taskId) => {
  const index = selectedTasks.value.indexOf(taskId)
  if (index === -1) {
    selectedTasks.value.push(taskId)
  } else {
    selectedTasks.value.splice(index, 1)
  }
}

const toggleIncompleteSelection = () => {
  const incompleteTaskIds = incompleteTasks.value.map(t => t.id)

  if (areAllIncompleteSelected.value) {
    selectedTasks.value = selectedTasks.value.filter(
        id => !incompleteTaskIds.includes(id)
    )
  } else {
    incompleteTaskIds.forEach(id => {
      if (!selectedTasks.value.includes(id)) {
        selectedTasks.value.push(id)
      }
    })
  }
}

const toggleCompletedSelection = () => {
  const completedTaskIds = completedTasks.value.map(t => t.id)

  if (areAllCompletedSelected.value) {
    selectedTasks.value = selectedTasks.value.filter(
        id => !completedTaskIds.includes(id)
    )
  } else {
    completedTaskIds.forEach(id => {
      if (!selectedTasks.value.includes(id)) {
        selectedTasks.value.push(id)
      }
    })
  }
}

const toggleAllSelection = () => {
  const allTaskIds = sortedTasks.value.map(t => t.id)

  if (isAllSelected.value) {
    selectedTasks.value = []
  } else {
    selectedTasks.value = [...allTaskIds]
  }
}

const clearSelection = () => {
  selectedTasks.value = []
}

// 批量删除函数
const confirmBatchDelete = () => {
  if (selectedTasks.value.length === 0) {
    alert('请先选择要删除的任务')
    return
  }
  showBatchDeleteModal.value = true
}

const executeBatchDelete = () => {
  let tasksToDelete = [...selectedTasks.value]

  if (deleteCompletedOnly.value) {
    tasksToDelete = tasksToDelete.filter(taskId => {
      const task = taskStore.tasks.find(t => t.id === taskId)
      return task && task.completed
    })
  }

  if (tasksToDelete.length === 0) {
    alert('没有符合条件的任务可以删除')
    showBatchDeleteModal.value = false
    return
  }

  tasksToDelete.forEach(taskId => {
    taskStore.deleteTask(taskId)
  })

  alert(`已成功删除 ${tasksToDelete.length} 个任务`)
  selectedTasks.value = []
  showBatchDeleteModal.value = false
  deleteCompletedOnly.value = true
}

// 导入导出功能函数
const exportTasks = () => {
  try {
    // 准备要导出的数据
    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      totalTasks: taskStore.tasks.length,
      tasks: taskStore.tasks.map(task => ({
        ...task,
        // 确保所有日期字段都是字符串格式
        createdAt: task.createdAt || new Date().toISOString(),
        updatedAt: task.updatedAt || new Date().toISOString(),
        dueDate: task.dueDate || '',
        startDate: task.startDate || '',
        endDate: task.endDate || ''
      }))
    }

    // 创建JSON字符串
    const jsonString = JSON.stringify(exportData, null, 2)

    // 创建Blob并下载
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tasks_export_${format(new Date(), 'yyyyMMdd_HHmmss')}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    // 显示成功提示
    importStatus.value = {
      type: 'success',
      message: `成功导出 ${exportData.totalTasks} 个任务`
    }
    setTimeout(() => {
      importStatus.value = { type: '', message: '' }
    }, 3000)
  } catch (error) {
    console.error('导出失败:', error)
    importStatus.value = {
      type: 'error',
      message: '导出失败：' + error.message
    }
  }
}

const importFromJSON = () => {
  importOption.value = 'json'
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json,application/json'

  input.onchange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    try {
      const text = await file.text()
      processImportData(text)
    } catch (error) {
      console.error('读取文件失败:', error)
      importStatus.value = {
        type: 'error',
        message: '读取文件失败：' + error.message
      }
    }
  }

  input.click()
}

const importFromCSV = () => {
  importOption.value = 'csv'
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.csv,text/csv'

  input.onchange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    try {
      const text = await file.text()
      // 简单的CSV解析（可以根据需要增强）
      const lines = text.split('\n').filter(line => line.trim())
      const headers = lines[0].split(',').map(h => h.trim())
      const tasks = lines.slice(1).map(line => {
        const values = line.split(',')
        const task = {}
        headers.forEach((header, index) => {
          task[header] = values[index] ? values[index].trim() : ''
        })
        return normalizeTaskData(task)
      }).filter(task => task.title)

      importPreview.value = tasks
    } catch (error) {
      console.error('解析CSV失败:', error)
      importStatus.value = {
        type: 'error',
        message: '解析CSV文件失败：' + error.message
      }
    }
  }

  input.click()
}

const importFromText = () => {
  importOption.value = 'text'
  jsonInput.value = ''
  importPreview.value = []
}

const processImportData = (jsonString) => {
  try {
    const data = JSON.parse(jsonString)

    // 支持多种格式
    let tasks = []
    if (Array.isArray(data)) {
      // 如果是数组，直接使用
      tasks = data
    } else if (data.tasks && Array.isArray(data.tasks)) {
      // 如果是导出格式，使用tasks字段
      tasks = data.tasks
    } else if (typeof data === 'object' && data !== null) {
      // 如果是单个任务对象，包装成数组
      tasks = [data]
    } else {
      throw new Error('不支持的数据格式')
    }

    // 标准化任务数据
    const normalizedTasks = tasks
        .map(task => normalizeTaskData(task))
        .filter(task => task.title) // 过滤掉没有标题的任务

    importPreview.value = normalizedTasks

    if (normalizedTasks.length === 0) {
      importStatus.value = {
        type: 'warning',
        message: '未找到有效的任务数据'
      }
    } else {
      importStatus.value = {
        type: 'success',
        message: `找到 ${normalizedTasks.length} 个有效任务`
      }
    }
  } catch (error) {
    console.error('解析JSON失败:', error)
    importStatus.value = {
      type: 'error',
      message: '解析JSON失败：' + error.message
    }
    importPreview.value = []
  }
}

const normalizeTaskData = (task) => {
  const now = new Date()

  // 确保必需字段存在
  const normalized = {
    ...task,
    title: task.title || '未命名任务',
    description: task.description || '',
    category: task.category || 'general',
    priority: task.priority || 'medium',
    completed: task.completed || false,
    createdAt: task.createdAt || now.toISOString(),
    updatedAt: task.updatedAt || now.toISOString()
  }

  // 处理任务类型
  if (task.taskType) {
    normalized.taskType = task.taskType
  } else if (task.startTime === '全天' || !task.startTime) {
    normalized.taskType = 'allDay'
  } else {
    normalized.taskType = 'time'
  }

  // 确保ID存在
  if (!normalized.id) {
    normalized.id = 'import_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
  }

  return normalized
}

const confirmImport = async () => {
  if (importPreview.value.length === 0) {
    importStatus.value = {
      type: 'warning',
      message: '没有可导入的任务'
    }
    return
  }

  try {
    // 根据选项处理导入
    let tasksToImport = importPreview.value

    if (importOptions.value.skipDuplicates) {
      const existingTitles = taskStore.tasks.map(t => t.title.toLowerCase().trim())
      tasksToImport = tasksToImport.filter(task =>
          !existingTitles.includes(task.title.toLowerCase().trim())
      )
    }

    if (!importOptions.value.mergeMode) {
      // 清空现有任务
      taskStore.tasks.forEach(task => {
        taskStore.deleteTask(task.id)
      })
    }

    // 导入任务
    let importedCount = 0
    for (const task of tasksToImport) {
      try {
        if (importOptions.value.mergeMode) {
          // 检查是否已存在相同ID的任务
          const existingTask = taskStore.tasks.find(t => t.id === task.id)
          if (!existingTask) {
            taskStore.addTask(task)
            importedCount++
          }
        } else {
          taskStore.addTask(task)
          importedCount++
        }
      } catch (error) {
        console.error('导入单个任务失败:', task, error)
      }
    }

    // 更新状态
    importStatus.value = {
      type: 'success',
      message: `成功导入 ${importedCount} 个任务${importOptions.value.skipDuplicates ? '（已跳过重复项）' : ''}`
    }

    // 关闭模态框
    setTimeout(() => {
      showImportModal.value = false
      resetImportState()
    }, 1500)

  } catch (error) {
    console.error('导入失败:', error)
    importStatus.value = {
      type: 'error',
      message: '导入失败：' + error.message
    }
  }
}

const closeImportModal = () => {
  showImportModal.value = false
  resetImportState()
}

const resetImportState = () => {
  jsonInput.value = ''
  importPreview.value = []
  importStatus.value = { type: '', message: '' }
}

// 表单处理函数
const resetForm = () => {
  const now = new Date()
  const tomorrow = addDays(now, 1)

  taskForm.value = {
    id: null,
    title: '',
    description: '',
    category: 'work',
    priority: 'medium',
    taskType: 'time',
    startDateTime: format(tomorrow, 'yyyy-MM-dd') + 'T09:00',
    endDateTime: format(tomorrow, 'yyyy-MM-dd') + 'T10:00',
    startDate: format(now, 'yyyy-MM-dd'),
    endDate: format(now, 'yyyy-MM-dd'),
    estimatedTime: 60,
    tagsInput: '',
    completed: false
  }
}

// 验证时间格式
const isValidTime = (timeStr) => {
  if (!timeStr) return false
  const timeRegex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/
  return timeRegex.test(timeStr)
}

const handleSubmit = () => {
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
      completed: taskForm.value.completed || false,
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
      completed: taskForm.value.completed || false,
      updatedAt: now.toISOString()
    }
  }

  if (isEditing.value) {
    // 更新现有任务
    try {
      taskStore.updateTask(taskForm.value.id, taskData)
      console.log('任务更新成功')
    } catch (error) {
      console.error('更新任务失败:', error)
      alert('更新任务失败: ' + (error.message || '未知错误'))
      return
    }
  } else {
    // 添加新任务
    const newTask = {
      ...taskData,
      id: 'task_' + Date.now() + Math.random().toString(36).substr(2, 9),
      createdAt: now.toISOString(),
      status: 'todo'
    }

    try {
      taskStore.addTask(newTask)
      console.log('任务创建成功')
    } catch (error) {
      console.error('保存任务失败:', error)
      alert('保存任务失败: ' + (error.message || '未知错误'))
      return
    }
  }

  closeModal()
}

const closeModal = () => {
  showAddModal.value = false
  showEditModal.value = false
  resetForm()
}

// 任务操作函数
const toggleTask = (task) => {
  if (selectedTasks.value.length > 0) {
    toggleTaskSelection(task.id)
  } else {
    taskStore.toggleTask(task.id)
  }
}

const editTask = (task) => {
  if (selectedTasks.value.length > 0) return

  showEditModal.value = true

  // 判断任务类型
  const isAllDay = task.taskType === 'allDay' || !task.startTime || task.startTime === '全天'

  taskForm.value = {
    id: task.id,
    title: task.title,
    description: task.description || '',
    category: task.category || 'work',
    priority: task.priority || 'medium',
    taskType: isAllDay ? 'allDay' : 'time',
    startDateTime: task.startDate && task.startTime && isValidTime(task.startTime)
        ? `${task.startDate}T${task.startTime}`
        : '',
    endDateTime: task.endDate && task.endTime && isValidTime(task.endTime)
        ? `${task.endDate}T${task.endTime}`
        : '',
    startDate: task.startDate || format(new Date(), 'yyyy-MM-dd'),
    endDate: task.endDate || task.startDate || format(new Date(), 'yyyy-MM-dd'),
    estimatedTime: task.estimatedTime || (isAllDay ? 480 : 60),
    tagsInput: task.tags ? task.tags.join(', ') : '',
    completed: task.completed || false
  }
}

const deleteTask = (taskId) => {
  if (selectedTasks.value.length > 0) return
  if (confirm('确定要删除这个任务吗？')) {
    taskStore.deleteTask(taskId)
  }
}

// 监听模态框状态变化
watch(showAddModal, (newVal) => {
  if (newVal) {
    showEditModal.value = false
    resetForm()
  }
})

watch(showEditModal, (newVal) => {
  if (newVal) {
    showAddModal.value = false
  }
})

// 监听JSON输入变化
watch(jsonInput, (newValue) => {
  if (newValue.trim()) {
    processImportData(newValue)
  } else {
    importPreview.value = []
  }
})

// 监听筛选变化时清除选择
watch(() => taskStore.searchQuery, () => {
  clearSelection()
})

watch(() => taskStore.filter, () => {
  clearSelection()
})

// 初始化表单
onMounted(() => {
  resetForm()
})
</script>

<style scoped>
.list-view {
  height: 100%;
}

/* 工具栏样式 */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 20px;
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  gap: 20px;
}

.left-tools {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.right-tools {
  display: flex;
  align-items: center;
}

/* 导入导出按钮组样式 */
.import-export-group {
  display: flex;
  gap: 8px;
  margin-right: 10px;
}

.import-export-group .btn-secondary {
  padding: 8px 12px;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 5px;
}

/* 批量操作工具栏 */
.batch-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #ff6b6b;
  animation: slideIn 0.3s ease;
}

.batch-count {
  font-weight: bold;
  color: #495057;
  font-size: 0.95rem;
}

/* 按钮样式 */
.btn-primary {
  background: var(--primary-color, #1976d2);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  transition: background 0.3s;
  align-self: flex-start;
}

.btn-primary:hover {
  background: #1565c0;
}

.btn-secondary {
  background: #f8f9fa;
  color: #495057;
  border: 1px solid #dee2e6;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s;
}

.btn-secondary:hover {
  background: #e9ecef;
}

.btn-danger {
  background: #dc3545;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background 0.3s;
}

.btn-danger:hover {
  background: #c82333;
}

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px;
  font-size: 1rem;
  opacity: 0.7;
  transition: all 0.3s;
  border-radius: 4px;
}

.btn-icon:hover:not(:disabled) {
  opacity: 1;
  background: #f5f5f5;
}

.btn-icon:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

/* 筛选器样式 */
.filters {
  display: flex;
  gap: 10px;
  align-items: center;
}

.search-input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  width: 200px;
}

.filter-select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  cursor: pointer;
}

/* 任务列表样式 */
.task-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.section-header {
  padding: 12px 20px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-top: 10px;
  margin-bottom: 5px;
  border-left: 4px solid var(--primary-color, #1976d2);
}

.section-header.completed {
  border-left-color: #28a745;
  background: #f1f8e9;
}

.section-header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-header h4 {
  margin: 0;
  font-size: 1rem;
  color: #495057;
}

.select-all-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  color: #666;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background 0.3s;
}

.select-all-checkbox:hover {
  background: rgba(0,0,0,0.05);
}

.select-all-checkbox .checkbox {
  display: none;
}

.select-all-checkbox .checkbox-custom {
  width: 16px;
  height: 16px;
  border: 2px solid #adb5bd;
  border-radius: 3px;
  display: inline-block;
  position: relative;
  transition: all 0.3s;
}

.select-all-checkbox .checkbox:checked + .checkbox-custom {
  background: var(--primary-color);
  border-color: var(--primary-color);
}

.select-all-checkbox .checkbox:checked + .checkbox-custom::after {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 10px;
}

/* 任务卡片样式 */
.task-card {
  background: white;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  transition: all 0.3s;
  border-left: 4px solid #ddd;
  position: relative;
}

.task-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.task-card.selected {
  background: #e8f4fd;
  border-color: var(--primary-color, #1976d2);
}

.task-card.selection-mode {
  cursor: pointer;
}

.task-card.completed {
  background: #f9f9f9;
  opacity: 0.8;
}

.task-card.completed:hover {
  opacity: 1;
}

.task-card.completed.selected {
  background: #e8f5e9;
  border-color: #28a745;
}

.task-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
  position: relative;
}

/* 复选框样式 */
.task-checkbox {
  width: 20px;
  height: 20px;
  cursor: pointer;
  flex-shrink: 0;
}

.selection-checkbox {
  position: relative;
  z-index: 2;
}

.completion-checkbox {
  opacity: 0;
  position: absolute;
  left: 20px;
  pointer-events: none;
}

.task-card:not(.selection-mode) .selection-checkbox {
  display: none;
}

.task-card:not(.selection-mode) .completion-checkbox {
  opacity: 1;
  position: static;
  pointer-events: auto;
}

.task-card.selection-mode .completion-checkbox {
  display: none;
}

.task-title {
  flex: 1;
  margin: 0;
  font-size: 1.1rem;
  color: #212529;
  transition: color 0.3s;
}

.task-card.completed .task-title {
  text-decoration: line-through;
  color: #6c757d;
}

.task-card.selected .task-title {
  color: #1976d2;
}

.task-card.completed.selected .task-title {
  color: #28a745;
}

.task-priority {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: bold;
  min-width: 30px;
  text-align: center;
  flex-shrink: 0;
}

.task-priority.high {
  background: #ffebee;
  color: #d32f2f;
  border: 1px solid #ffcdd2;
}

.task-priority.medium {
  background: #fff3e0;
  color: #f57c00;
  border: 1px solid #ffe0b2;
}

.task-priority.low {
  background: #e8f5e9;
  color: #388e3c;
  border: 1px solid #c8e6c9;
}

.task-description {
  color: #666;
  margin-bottom: 15px;
  line-height: 1.5;
  font-size: 0.95rem;
  padding-left: 32px;
}

.task-card.completed .task-description {
  color: #999;
}

.task-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
  padding-top: 10px;
  border-top: 1px solid #f1f1f1;
  padding-left: 32px;
}

.task-category {
  background: #e3f2fd;
  color: #1976d2;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
}

.task-date {
  color: #6c757d;
  display: flex;
  align-items: center;
  gap: 5px;
}

.task-date.overdue {
  color: #dc3545;
  font-weight: bold;
}

.overdue-badge {
  background: #dc3545;
  color: white;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 0.7rem;
  font-weight: bold;
}

.task-actions {
  display: flex;
  gap: 8px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.empty-state p {
  font-size: 1.2rem;
  margin-bottom: 20px;
  color: #666;
}

/* 导入选项卡片 */
.import-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.option-card {
  display: flex;
  align-items: center;
  padding: 15px;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: white;
}

.option-card:hover {
  border-color: var(--primary-color, #1976d2);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(25, 118, 210, 0.15);
}

.option-card.active {
  border-color: var(--primary-color, #1976d2);
  background: #f0f7ff;
}

.option-icon {
  font-size: 2rem;
  margin-right: 15px;
  flex-shrink: 0;
}

.option-content h4 {
  margin: 0 0 5px 0;
  font-size: 1rem;
  color: #333;
}

.option-content p {
  margin: 0;
  font-size: 0.85rem;
  color: #666;
}

/* JSON输入区域 */
.json-input-area {
  margin: 20px 0;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #555;
}

.json-textarea {
  width: 100%;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.9rem;
  line-height: 1.4;
  resize: vertical;
  min-height: 150px;
  transition: border-color 0.3s;
}

.json-textarea:focus {
  border-color: var(--primary-color);
  outline: none;
  box-shadow: 0 0 0 3px rgba(25, 118, 210, 0.1);
}

.input-hint {
  font-size: 0.85rem;
  color: #888;
  margin-top: 5px;
  font-style: italic;
}

/* 导入预览 */
.import-preview {
  margin: 20px 0;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 10px;
  border: 1px solid #e9ecef;
}

.import-preview h4 {
  margin: 0 0 10px 0;
  font-size: 1rem;
  color: #495057;
}

.preview-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.preview-task {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  background: white;
  border-radius: 6px;
  border: 1px solid #dee2e6;
}

.preview-title {
  flex: 1;
  font-size: 0.95rem;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.preview-category {
  font-size: 0.8rem;
  padding: 2px 8px;
  background: #e3f2fd;
  color: #1976d2;
  border-radius: 12px;
  flex-shrink: 0;
}

.preview-priority {
  font-size: 0.8rem;
  padding: 2px 8px;
  border-radius: 12px;
  font-weight: bold;
  min-width: 30px;
  text-align: center;
  flex-shrink: 0;
}

.preview-priority.high {
  background: #ffebee;
  color: #d32f2f;
  border: 1px solid #ffcdd2;
}

.preview-priority.medium {
  background: #fff3e0;
  color: #f57c00;
  border: 1px solid #ffe0b2;
}

.preview-priority.low {
  background: #e8f5e9;
  color: #388e3c;
  border: 1px solid #c8e6c9;
}

.preview-more {
  text-align: center;
  padding: 10px;
  color: #6c757d;
  font-style: italic;
  font-size: 0.9rem;
}

/* 导入设置 */
.import-settings {
  margin: 20px 0;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 10px;
}

.import-settings .checkbox-label {
  margin-bottom: 10px;
}

.import-settings .hint {
  font-size: 0.85rem;
  color: #6c757d;
  margin: 0 0 15px 0;
  margin-left: 28px;
}

/* 导入状态提示 */
.import-status {
  padding: 12px 15px;
  margin: 15px 0;
  border-radius: 8px;
  font-weight: 500;
  text-align: center;
}

.import-status.success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.import-status.error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.import-status.warning {
  background: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
}

/* 批量删除模态框样式 */
.batch-delete-content {
  padding: 20px 0;
}

.warning-icon {
  font-size: 3rem;
  text-align: center;
  margin-bottom: 20px;
}

.warning-text {
  text-align: center;
  font-size: 1.1rem;
  margin-bottom: 20px;
  color: #495057;
}

.selected-tasks-preview {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 20px;
  max-height: 200px;
  overflow-y: auto;
}

.selected-tasks-preview p {
  margin: 0 0 10px 0;
  font-weight: bold;
  color: #495057;
}

.selected-tasks-preview ul {
  margin: 0;
  padding-left: 20px;
}

.selected-tasks-preview li {
  margin-bottom: 5px;
  padding: 4px 0;
  border-bottom: 1px solid #dee2e6;
}

.selected-tasks-preview li:last-child {
  border-bottom: none;
}

.more-tasks {
  color: #6c757d;
  font-style: italic;
}

.delete-options {
  margin: 20px 0;
}

.delete-options .checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 1rem;
  color: #495057;
  padding: 8px;
  border-radius: 6px;
  background: #f8f9fa;
  transition: background 0.3s;
}

.delete-options .checkbox-label:hover {
  background: #e9ecef;
}

.hint {
  font-size: 0.85rem;
  color: #6c757d;
  margin-top: 5px;
  margin-left: 28px;
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
  padding: 30px;
  border-radius: 15px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.3);
  max-height: 90vh;
  overflow-y: auto;
}

.modal h3 {
  margin-bottom: 20px;
  color: #333;
}

.modal-input,
.modal-textarea,
.modal-select {
  width: 100%;
  padding: 10px;
  margin-bottom: 15px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  box-sizing: border-box;
}

.modal-textarea {
  min-height: 100px;
  resize: vertical;
}

.form-row {
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
}

.form-group {
  flex: 1;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  color: #666;
  font-size: 0.9rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.checkbox {
  display: none;
}

.checkbox-custom {
  width: 18px;
  height: 18px;
  border: 2px solid #dee2e6;
  border-radius: 4px;
  display: inline-block;
  position: relative;
  transition: all 0.3s;
}

.checkbox:checked + .checkbox-custom {
  background: var(--primary-color);
  border-color: var(--primary-color);
}

.checkbox:checked + .checkbox-custom::after {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 12px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

/* 动画 */
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .toolbar {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }

  .left-tools, .right-tools {
    width: 100%;
  }

  .batch-actions {
    flex-wrap: wrap;
  }

  .filters {
    flex-wrap: wrap;
  }

  .search-input, .filter-select {
    flex: 1;
    min-width: 120px;
  }

  .import-export-group {
    flex-direction: column;
    gap: 5px;
  }

  .import-export-group .btn-secondary {
    width: 100%;
    justify-content: center;
  }

  .task-footer {
    flex-wrap: wrap;
    gap: 10px;
  }

  .task-actions {
    width: 100%;
    justify-content: flex-end;
  }

  .section-header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .select-all-checkbox {
    align-self: flex-end;
  }

  .option-card {
    flex-direction: column;
    text-align: center;
    padding: 12px;
  }

  .option-icon {
    margin-right: 0;
    margin-bottom: 10px;
  }

  .preview-task {
    flex-wrap: wrap;
    gap: 8px;
  }

  .preview-title {
    width: 100%;
    margin-bottom: 5px;
  }
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
  border-color: var(--primary-color, #1976d2);
  outline: none;
  box-shadow: 0 0 0 3px rgba(25, 118, 210, 0.1);
}

input[type="datetime-local"]:hover,
input[type="date"]:hover,
input[type="time"]:hover {
  border-color: #b0b0b0;
}

/* 改进的任务日期显示样式 */
.task-date {
  font-size: 0.85rem;
  color: #666;
  display: flex;
  align-items: center;
  gap: 5px;
  flex-wrap: wrap;
}

.task-date.overdue {
  color: #dc3545;
  font-weight: bold;
}

.overdue-badge {
  background: #dc3545;
  color: white;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 0.7rem;
  font-weight: bold;
  white-space: nowrap;
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

/* 确保模态框有足够的空间 */
.modal {
  max-height: 85vh;
  overflow-y: auto;
  padding: 25px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .form-row {
    flex-direction: column;
    gap: 10px;
  }

  .form-group {
    width: 100%;
  }

  .task-date {
    font-size: 0.8rem;
  }
}

@media (max-width: 480px) {
  .modal {
    padding: 20px;
    width: 95%;
  }

  input[type="datetime-local"],
  input[type="date"] {
    font-size: 0.9rem;
    padding: 8px;
  }

  .task-footer {
    flex-wrap: wrap;
    gap: 8px;
  }

  .task-date {
    order: 2;
    width: 100%;
    margin-top: 5px;
  }

  .task-category {
    order: 1;
  }

  .task-actions {
    order: 3;
    margin-left: auto;
  }
}

/* 优化选择框样式 */
.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 0.95rem;
  color: #555;
  padding: 8px 0;
  transition: color 0.2s;
}

.checkbox-label:hover {
  color: #333;
}

.checkbox {
  display: none;
}

.checkbox-custom {
  width: 18px;
  height: 18px;
  border: 2px solid #dee2e6;
  border-radius: 4px;
  display: inline-block;
  position: relative;
  transition: all 0.2s;
  flex-shrink: 0;
}

.checkbox:checked + .checkbox-custom {
  background: var(--primary-color);
  border-color: var(--primary-color);
}

.checkbox:checked + .checkbox-custom::after {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 12px;
  font-weight: bold;
}

/* 改进的模态框样式 */
.modal h3 {
  margin-bottom: 25px;
  color: #333;
  font-size: 1.4rem;
  text-align: center;
}

.modal-input,
.modal-textarea,
.modal-select {
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

.modal-input:focus,
.modal-textarea:focus,
.modal-select:focus {
  border-color: var(--primary-color);
  outline: none;
  box-shadow: 0 0 0 3px rgba(25, 118, 210, 0.1);
}

.modal-textarea {
  min-height: 100px;
  resize: vertical;
  line-height: 1.5;
}

/* 改进的任务卡片时间显示 */
.task-card:hover .task-date {
  color: #1976d2;
}

.task-card.completed .task-date {
  color: #999;
}

.task-card.selected .task-date {
  color: white;
}

/* 确保时间显示不会过长 */
.task-date {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 768px) {
  .task-date {
    max-width: 150px;
  }
}

@media (max-width: 480px) {
  .task-date {
    max-width: 100%;
    white-space: normal;
  }
}

/* 在 ListView.vue 的 style 部分添加深色模式样式 */

/* 基础深色模式适配 */
.dark .list-view {
  background-color: var(--background-color);
  color: var(--text-color);
}

/* 工具栏深色模式 */
.dark .toolbar {
  background-color: var(--surface-color);
  box-shadow: var(--card-shadow);
  border: 1px solid var(--border-color);
}

.dark .batch-actions {
  background: var(--secondary-color);
  border-left-color: var(--error-color);
}

.dark .batch-count {
  color: var(--text-color);
}

/* 按钮深色模式 */
.dark .btn-primary {
  background-color: var(--btn-primary-bg);
  color: var(--btn-primary-text);
  border: none;
  transition: background-color 0.3s, transform 0.2s;
}

.dark .btn-primary:hover {
  background-color: var(--btn-primary-hover);
  transform: translateY(-1px);
}

.dark .btn-secondary {
  background-color: var(--btn-secondary-bg);
  color: var(--btn-secondary-text);
  border: 1px solid var(--border-color);
  transition: all 0.3s;
}

.dark .btn-secondary:hover {
  background-color: var(--btn-secondary-hover);
  border-color: var(--primary-color);
}

.dark .btn-danger {
  background-color: var(--error-color);
  color: white;
  border: none;
  position: relative;
  overflow: hidden;
}

.dark .btn-danger:hover {
  background-color: var(--error-dark);
}

.dark .btn-danger::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 5px;
  height: 5px;
  background: rgba(255, 255, 255, 0.5);
  opacity: 0;
  border-radius: 100%;
  transform: scale(1, 1) translate(-50%);
  transform-origin: 50% 50%;
}

.dark .btn-danger:focus:not(:active)::after {
  animation: ripple 1s ease-out;
}

/* 搜索框和选择框深色模式 */
.dark .search-input,
.dark .filter-select {
  background-color: var(--input-bg);
  color: var(--input-text);
  border: 2px solid var(--input-border);
  transition: all 0.3s;
}

.dark .search-input:focus,
.dark .filter-select:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(144, 202, 249, 0.2);
  outline: none;
}

.dark .search-input::placeholder {
  color: var(--input-placeholder);
}

/* 任务列表深色模式 */
.dark .task-list {
  background-color: transparent;
}

.dark .section-header {
  background: var(--secondary-color);
  border-left-color: var(--primary-color);
}

.dark .section-header.completed {
  background: var(--surface-color);
  border-left-color: var(--completed-color);
}

.dark .section-header h4 {
  color: var(--text-color);
}

/* 任务卡片深色模式 */
.dark .task-card {
  background-color: var(--surface-color);
  border: 1px solid var(--border-color);
  box-shadow: var(--card-shadow);
  border-left: 4px solid var(--border-color);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.dark .task-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, var(--primary-color), transparent);
  opacity: 0;
  transition: opacity 0.3s;
}

.dark .task-card:hover::before {
  opacity: 1;
}

.dark .task-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--elevation-3);
  border-color: var(--primary-color);
}

.dark .task-card.selected {
  background: linear-gradient(135deg, var(--surface-color) 0%, var(--secondary-color) 100%);
  border-color: var(--primary-color);
  border-left-color: var(--primary-color);
}

.dark .task-card.completed {
  background: var(--surface-color);
  opacity: 0.9;
  border-left-color: var(--completed-color);
}

.dark .task-card.completed.selected {
  background: linear-gradient(135deg, var(--surface-color) 0%, rgba(102, 187, 106, 0.1) 100%);
  border-color: var(--completed-color);
}

.dark .task-title {
  color: var(--text-color);
  transition: color 0.3s;
}

.dark .task-card.completed .task-title {
  color: var(--text-secondary);
}

.dark .task-card.selected .task-title {
  color: var(--primary-color);
}

.dark .task-card.completed.selected .task-title {
  color: var(--completed-color);
}

/* 优先级标签深色模式 */
.dark .task-priority.high {
  background: rgba(239, 83, 80, 0.2);
  color: var(--priority-high);
  border: 1px solid rgba(239, 83, 80, 0.3);
  position: relative;
  overflow: hidden;
}

.dark .task-priority.high::after {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(
      45deg,
      transparent 30%,
      rgba(239, 83, 80, 0.1) 50%,
      transparent 70%
  );
  animation: shimmer 2s infinite;
}

.dark .task-priority.medium {
  background: rgba(255, 183, 77, 0.2);
  color: var(--priority-medium);
  border: 1px solid rgba(255, 183, 77, 0.3);
}

.dark .task-priority.low {
  background: rgba(102, 187, 106, 0.2);
  color: var(--priority-low);
  border: 1px solid rgba(102, 187, 106, 0.3);
}

/* 任务描述深色模式 */
.dark .task-description {
  color: var(--text-secondary);
}

.dark .task-card.completed .task-description {
  color: var(--text-disabled);
}

/* 任务分类深色模式 */
.dark .task-category {
  background: rgba(144, 202, 249, 0.2);
  color: var(--category-work);
  border: 1px solid rgba(144, 202, 249, 0.3);
}

/* 任务时间深色模式 */
.dark .task-date {
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  transition: all 0.3s;
}

.dark .task-card:hover .task-date {
  background: rgba(255, 255, 255, 0.1);
  color: var(--primary-color);
}

.dark .task-date.overdue {
  color: var(--overdue-color);
  background: rgba(239, 83, 80, 0.1);
  border: 1px solid rgba(239, 83, 80, 0.2);
}

.dark .task-date.overdue:hover {
  background: rgba(239, 83, 80, 0.2);
}

.dark .overdue-badge {
  background: var(--overdue-color);
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* 任务底部边框 */
.dark .task-footer {
  border-top: 1px solid var(--divider-color);
}

/* 复选框深色模式 */
.dark .task-checkbox {
  accent-color: var(--primary-color);
}

.dark .checkbox-custom {
  border-color: var(--border-color);
}

.dark .checkbox:checked + .checkbox-custom {
  background: var(--primary-color);
  border-color: var(--primary-color);
}

/* 导入导出深色模式 */
.dark .import-options {
  background: transparent;
}

.dark .option-card {
  background: var(--surface-color);
  border: 2px solid var(--border-color);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.dark .option-card:hover {
  border-color: var(--primary-color);
  transform: translateY(-2px);
  box-shadow: var(--elevation-2);
}

.dark .option-card.active {
  background: linear-gradient(135deg, var(--surface-color) 0%, var(--secondary-color) 100%);
  border-color: var(--primary-color);
}

.dark .option-content h4 {
  color: var(--text-color);
}

.dark .option-content p {
  color: var(--text-secondary);
}

/* JSON输入区域深色模式 */
.dark .json-input-area .form-label {
  color: var(--text-color);
}

.dark .json-textarea {
  background: var(--input-bg);
  color: var(--input-text);
  border: 2px solid var(--input-border);
  font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
}

.dark .json-textarea:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(144, 202, 249, 0.2);
}

.dark .input-hint {
  color: var(--text-secondary);
}

/* 导入预览深色模式 */
.dark .import-preview {
  background: var(--secondary-color);
  border: 1px solid var(--border-color);
}

.dark .import-preview h4 {
  color: var(--text-color);
}

.dark .preview-task {
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  transition: all 0.3s;
}

.dark .preview-task:hover {
  border-color: var(--primary-color);
  transform: translateX(4px);
}

.dark .preview-title {
  color: var(--text-color);
}

.dark .preview-more {
  color: var(--text-secondary);
}

/* 导入设置深色模式 */
.dark .import-settings {
  background: var(--secondary-color);
  border: 1px solid var(--border-color);
}

/* 批量删除模态框深色模式 */
.dark .batch-delete-content {
  color: var(--text-color);
}

.dark .selected-tasks-preview {
  background: var(--secondary-color);
  border: 1px solid var(--border-color);
}

.dark .selected-tasks-preview p {
  color: var(--text-color);
}

.dark .selected-tasks-preview li {
  border-bottom: 1px solid var(--divider-color);
  color: var(--text-secondary);
}

.dark .more-tasks {
  color: var(--text-secondary);
}

.dark .delete-options .checkbox-label {
  background: var(--surface-color);
  color: var(--text-color);
}

.dark .delete-options .checkbox-label:hover {
  background: var(--hover-color);
}

.dark .hint {
  color: var(--text-secondary);
}

/* 模态框深色模式 */
.dark .modal-overlay {
  background: var(--modal-overlay);
  backdrop-filter: blur(4px);
}

.dark .modal {
  background: var(--modal-bg);
  border: 1px solid var(--modal-border);
  box-shadow: var(--elevation-3);
}

.dark .modal h3 {
  color: var(--text-color);
  position: relative;
  padding-bottom: 15px;
}

.dark .modal h3::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 60px;
  height: 3px;
  background: var(--primary-color);
  border-radius: 2px;
}

.dark .modal-input,
.dark .modal-textarea,
.dark .modal-select {
  background: var(--input-bg);
  color: var(--input-text);
  border: 2px solid var(--input-border);
  transition: all 0.3s;
}

.dark .modal-input:focus,
.dark .modal-textarea:focus,
.dark .modal-select:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(144, 202, 249, 0.2);
}

.dark .modal-input::placeholder,
.dark .modal-textarea::placeholder {
  color: var(--input-placeholder);
}

.dark .form-group label {
  color: var(--text-secondary);
}

.dark .form-group label:focus-within {
  color: var(--primary-color);
}

/* 空状态深色模式 */
.dark .empty-state {
  background: var(--surface-color);
  border: 1px solid var(--border-color);
}

.dark .empty-state p {
  color: var(--text-secondary);
}

/* 状态提示深色模式 */
.dark .import-status.success {
  background: rgba(102, 187, 106, 0.2);
  color: var(--success-color);
  border: 1px solid rgba(102, 187, 106, 0.3);
}

.dark .import-status.error {
  background: rgba(239, 83, 80, 0.2);
  color: var(--error-color);
  border: 1px solid rgba(239, 83, 80, 0.3);
}

.dark .import-status.warning {
  background: rgba(255, 183, 77, 0.2);
  color: var(--warning-color);
  border: 1px solid rgba(255, 183, 77, 0.3);
}

/* 滚动条深色模式 */
.dark .task-list,
.dark .modal,
.dark .selected-tasks-preview {
  scrollbar-width: thin;
  scrollbar-color: var(--scrollbar-thumb) var(--scrollbar-track);
}

.dark .task-list::-webkit-scrollbar,
.dark .modal::-webkit-scrollbar,
.dark .selected-tasks-preview::-webkit-scrollbar {
  width: 8px;
}

.dark .task-list::-webkit-scrollbar-track,
.dark .modal::-webkit-scrollbar-track,
.dark .selected-tasks-preview::-webkit-scrollbar-track {
  background: var(--scrollbar-track);
  border-radius: 4px;
}

.dark .task-list::-webkit-scrollbar-thumb,
.dark .modal::-webkit-scrollbar-thumb,
.dark .selected-tasks-preview::-webkit-scrollbar-thumb {
  background: var(--scrollbar-thumb);
  border-radius: 4px;
}

.dark .task-list::-webkit-scrollbar-thumb:hover,
.dark .modal::-webkit-scrollbar-thumb:hover,
.dark .selected-tasks-preview::-webkit-scrollbar-thumb:hover {
  background: var(--scrollbar-thumb-hover);
}

/* 动画定义 */
@keyframes ripple {
  0% {
    transform: scale(0, 0);
    opacity: 1;
  }
  20% {
    transform: scale(25, 25);
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: scale(40, 40);
  }
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

@keyframes pulse-glow {
  0%, 100% {
    box-shadow: 0 0 5px rgba(144, 202, 249, 0.5);
  }
  50% {
    box-shadow: 0 0 20px rgba(144, 202, 249, 0.8);
  }
}

/* 选中任务的光效 */
.dark .task-card.selected {
  animation: pulse-glow 2s infinite;
}

/* 响应式深色模式 */
@media (max-width: 768px) {
  .dark .toolbar {
    background: var(--surface-color);
    border: 1px solid var(--border-color);
  }

  .dark .filters {
    background: var(--surface-color);
    padding: 10px;
    border-radius: var(--border-radius-md);
    border: 1px solid var(--border-color);
  }

  .dark .task-card {
    border: 1px solid var(--border-color);
  }

  .dark .task-card:hover {
    transform: translateY(-2px);
  }
}

/* 高对比度模式支持 */
@media (prefers-contrast: high) {
  .dark .task-card {
    border: 2px solid var(--border-color);
  }

  .dark .btn-primary,
  .dark .btn-secondary,
  .dark .btn-danger {
    border: 2px solid currentColor;
  }

  .dark .task-card.selected {
    outline: 3px solid var(--primary-color);
    outline-offset: 2px;
  }
}

/* 减少动画模式 */
@media (prefers-reduced-motion: reduce) {
  .dark .task-card,
  .dark .btn-primary,
  .dark .btn-secondary,
  .dark .option-card {
    transition: none;
    animation: none;
  }

  .dark .task-card:hover {
    transform: none;
  }
}

/* 时间选择器深色模式 */
.dark input[type="datetime-local"],
.dark input[type="date"],
.dark input[type="time"] {
  background: var(--input-bg);
  color: var(--input-text);
  border: 2px solid var(--input-border);
}

.dark input[type="datetime-local"]:focus,
.dark input[type="date"]:focus,
.dark input[type="time"]:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(144, 202, 249, 0.2);
}

/* 图标按钮深色模式 */
.dark .btn-icon {
  color: var(--text-secondary);
  background: transparent;
  transition: all 0.3s;
}

.dark .btn-icon:hover:not(:disabled) {
  color: var(--primary-color);
  background: rgba(144, 202, 249, 0.1);
  transform: scale(1.1);
}

.dark .btn-icon:disabled {
  color: var(--text-disabled);
  opacity: 0.5;
}

/* 全选复选框深色模式 */
.dark .select-all-checkbox {
  color: var(--text-color);
}

.dark .select-all-checkbox:hover {
  background: rgba(255, 255, 255, 0.05);
}

/* 工具提示深色模式 */
.dark .btn-icon[title] {
  position: relative;
}

.dark .btn-icon[title]:hover::after {
  content: attr(title);
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: var(--surface-color);
  color: var(--text-color);
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.8rem;
  white-space: nowrap;
  border: 1px solid var(--border-color);
  box-shadow: var(--elevation-2);
  z-index: 1000;
  margin-bottom: 8px;
}

/* 键盘导航支持 */
.dark .task-card:focus-visible {
  outline: 3px solid var(--primary-color);
  outline-offset: 2px;
}

.dark .btn-primary:focus-visible,
.dark .btn-secondary:focus-visible {
  outline: 3px solid var(--primary-color);
  outline-offset: 2px;
}

/* 拖拽指示器深色模式 */
.dark .task-card[draggable="true"] {
  cursor: grab;
}

.dark .task-card[draggable="true"]:active {
  cursor: grabbing;
}

.dark .task-card.drag-over {
  background: rgba(144, 202, 249, 0.1);
  border-color: var(--primary-color);
  box-shadow: 0 0 20px rgba(144, 202, 249, 0.2);
}
</style>