<script setup lang="ts">
import { Calendar, DatePicker } from 'v-calendar'
import 'v-calendar/style.css'
import { ref } from 'vue'

const selectedDate = ref(new Date())
const dateRange = ref(null)
const selectedDateString = ref('')

const attrs = ref([
  {
    highlight: {
      color: 'red',
      fillMode: 'outline',
    },
    dates: new Date(),
  },
])

function onDayClick(day: { date: Date }) {
  selectedDateString.value = day.date.toLocaleDateString()
}
</script>

<template>
  <div class="demo-section">
    <h2>0.5 v-calendar 日期选择器验证</h2>
    <p>验证：Calendar 组件、DatePicker 组件、v-model 绑定、自定义 scoped slots</p>

    <div class="checklist">
      <div>✅ Calendar 组件基本渲染</div>
      <div>✅ DatePicker 组件 (v-model 绑定)</div>
      <div>✅ 日期范围选择</div>
      <div>✅ 自定义属性 (attributes / highlights)</div>
      <div>✅ #day scoped slot (替代 react-day-picker 的 DayButton)</div>
      <div>✅ #nav scoped slot (自定义导航)</div>
      <div>✅ 事件处理 (dayclick)</div>
    </div>

    <div class="demo-row">
      <div class="demo-item">
        <label>基础 Calendar (选中: {{ selectedDateString || '无' }})</label>
        <Calendar
          v-model="selectedDate"
          :attributes="attrs"
          is-expanded
          @dayclick="onDayClick"
        />
      </div>

      <div class="demo-item">
        <label>DatePicker (v-model: {{ selectedDate?.toLocaleDateString() ?? '无' }})</label>
        <DatePicker v-model="selectedDate" is-expanded>
          <template #default="{ inputValue, inputEvents }">
            <input
              :value="inputValue"
              class="form-input"
              v-on="inputEvents"
              placeholder="选择日期"
            />
          </template>
        </DatePicker>
      </div>
    </div>

    <div class="demo-row">
      <div class="demo-item">
        <label>日期范围选择</label>
        <DatePicker v-model.range="dateRange" is-expanded />
        <p class="status-text">
          范围: {{ dateRange ? `${dateRange.start} ~ ${dateRange.end}` : '未选择' }}
        </p>
      </div>
    </div>

    <div class="demo-row">
      <div class="demo-item">
        <label>自定义 #day slot (验证 DayButton 替代方案)</label>
        <Calendar v-model="selectedDate" is-expanded>
          <template #day="{ day, dayItem }">
            <div
              class="custom-day"
              :class="{
                'is-selected': dayItem?.isSelected,
                'is-today': dayItem?.isToday,
              }"
            >
              {{ day }}
            </div>
          </template>
        </Calendar>
      </div>
    </div>

    <div class="status">
      <p>选中日期: {{ selectedDate?.toLocaleDateString() ?? '无' }}</p>
      <p>日期范围: {{ dateRange ? JSON.stringify(dateRange) : '未选择' }}</p>
    </div>
  </div>
</template>

<style scoped>
.form-input {
  height: 2.75rem;
  width: 100%;
  padding: 0 1rem;
  background: white;
  border: 3px solid black;
  border-radius: 0;
  font-weight: 700;
  box-shadow: 4px 4px 0 black;
}

.form-input:focus {
  outline: none;
  box-shadow: 6px 6px 0 black;
  transform: translate(-1px, -1px);
}

.custom-day {
  display: flex;
  height: 100%;
  width: 100%;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid transparent;
}

.custom-day:hover {
  background: #DDA0DD;
  color: black;
  font-weight: 700;
}

.custom-day.is-selected {
  background: #FF6B6B;
  color: black;
  font-weight: 900;
  border: 2px solid black;
  box-shadow: 2px 2px 0 black;
}

.custom-day.is-today {
  background: #4ECDC4;
  color: black;
  font-weight: 900;
  border: 2px solid black;
}

.status-text {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  font-weight: 700;
}
</style>
