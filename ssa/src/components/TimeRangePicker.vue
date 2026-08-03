<template>
  <div class="time-range-picker">
    <div class="time-inputs">
      <el-input
        v-model="selectedTimeRange"
        placeholder="选择时间段"
        readonly
        @click="showPicker = true"
        class="time-input"
      >
        <template #prefix>
          <el-icon><Clock /></el-icon>
        </template>
      </el-input>
    </div>

    <el-dialog
      v-model="showPicker"
      title="选择时间段"
      width="520px"
      :close-on-click-modal="true"
      class="time-picker-dialog"
    >
      <div class="picker-content">
        <div class="slider-section">
          <div class="slider-header">
            <span class="slider-label">开始时间</span>
            <span class="slider-value">{{ formatTime(startSlot) }}</span>
          </div>
          <el-slider
            v-model="startSlot"
            :min="0"
            :max="47"
            :step="1"
            :marks="sliderMarks"
            :format-tooltip="formatTime"
            @change="onStartChange"
          />
        </div>

        <div class="slider-section">
          <div class="slider-header">
            <span class="slider-label">结束时间</span>
            <span class="slider-value">{{ formatTime(endSlot) }}</span>
          </div>
          <el-slider
            v-model="endSlot"
            :min="1"
            :max="48"
            :step="1"
            :marks="sliderMarks"
            :format-tooltip="formatTime"
            @change="onEndChange"
          />
        </div>

        <div class="selected-range">
          <el-tag type="info" size="large">
            所选时间段：{{ formatTime(startSlot) }} - {{ formatTime(endSlot) }}
          </el-tag>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showPicker = false">取消</el-button>
          <el-button type="primary" @click="handleConfirm">确定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { Clock } from "@element-plus/icons-vue";

const props = defineProps<{
  modelValue?: string;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const showPicker = ref(false);
const selectedTimeRange = ref("");
const DEFAULT_START_SLOT = 14;
const DEFAULT_END_SLOT = 44;
const DAY_END_SLOT = 48;
const DAY_END_STORAGE_TIME = "23:59";
// slot: 0=00:00, 1=00:30, 2=01:00, ..., 47=23:30, 48=24:00
const startSlot = ref(DEFAULT_START_SLOT); // 07:00
const endSlot = ref(DEFAULT_END_SLOT); // 22:00

/** slot -> "HH:MM" */
function formatTime(slot: number): string {
  const totalMinutes = slot * 30;
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, "0")}:${m === 0 ? "00" : "30"}`;
}

function formatStorageTime(slot: number): string {
  return slot === DAY_END_SLOT ? DAY_END_STORAGE_TIME : formatTime(slot);
}

/** "HH:MM" -> slot */
function timeToSlot(time: string): number {
  const parts = time.split(":");
  const h = parseInt(parts[0] ?? "0", 10);
  const m = parseInt(parts[1] ?? "0", 10);
  if (h >= 24 || (h === 23 && m >= 59)) {
    return DAY_END_SLOT;
  }
  return h * 2 + (m >= 30 ? 1 : 0);
}

/** 解析 "HH:MM:SS-HH:MM:SS" 或 "HH:MM-HH:MM" */
function parseTimeRange(val: string): { start: number; end: number } {
  if (!val) return { start: DEFAULT_START_SLOT, end: DEFAULT_END_SLOT };
  const parts = val.split("-");
  if (parts.length >= 2) {
    return {
      start: timeToSlot(parts[0] ?? "07:00"),
      end: timeToSlot(parts[1] ?? "22:00"),
    };
  }
  return { start: DEFAULT_START_SLOT, end: DEFAULT_END_SLOT };
}

watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal) {
      const { start, end } = parseTimeRange(newVal);
      startSlot.value = start;
      endSlot.value = end;
      selectedTimeRange.value = `${formatTime(start)}-${formatTime(end)}`;
    } else {
      startSlot.value = DEFAULT_START_SLOT;
      endSlot.value = DEFAULT_END_SLOT;
      selectedTimeRange.value = "";
    }
  },
  { immediate: true },
);

// 每隔2小时显示一个刻度（每4个slot）
const sliderMarks = computed(() => {
  const marks: Record<number, string> = {};
  for (let slot = 0; slot <= 48; slot += 4) {
    marks[slot] = formatTime(slot);
  }
  return marks;
});

function onStartChange() {
  if (endSlot.value <= startSlot.value) {
    endSlot.value = startSlot.value + 1;
  }
}

function onEndChange() {
  if (endSlot.value <= startSlot.value) {
    startSlot.value = endSlot.value - 1;
  }
}

function handleConfirm() {
  const displayTimeRange = `${formatTime(startSlot.value)}-${formatTime(endSlot.value)}`;
  const storageTimeRange = `${formatStorageTime(startSlot.value)}-${formatStorageTime(endSlot.value)}`;
  emit("update:modelValue", storageTimeRange);
  selectedTimeRange.value = displayTimeRange;
  showPicker.value = false;
}
</script>

<style scoped>
.time-range-picker {
  width: 100%;
}

.time-inputs {
  width: 100%;
}

.time-input {
  width: 100%;
  cursor: pointer;
}

.picker-content {
  padding: 20px 10px;
}

.slider-section {
  margin-bottom: 40px;
}

.slider-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.slider-label {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}

.slider-value {
  font-size: 16px;
  font-weight: 700;
  color: #0891b2;
}

.selected-range {
  display: flex;
  justify-content: center;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e2e8f0;
}

.dialog-footer {
  display: flex;
  justify-content: center;
  gap: 12px;
}

:deep(.el-slider) {
  margin: 20px 10px;
}

:deep(.el-slider__bar) {
  background: linear-gradient(90deg, #0891b2 0%, #22d3ee 100%);
}

:deep(.el-slider__button) {
  width: 20px;
  height: 20px;
  border: 3px solid #0891b2;
  background: #fff;
}

:deep(.el-slider__button:hover) {
  transform: scale(1.2);
}

:deep(.el-slider__marks-text) {
  font-size: 11px;
  color: #64748b;
  margin-top: 8px;
}

:deep(.el-tag--large) {
  padding: 12px 20px;
  font-size: 15px;
  font-weight: 600;
}
</style>
