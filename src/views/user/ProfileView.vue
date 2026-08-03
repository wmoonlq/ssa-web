<template>
  <div class="profile-page" v-loading="loading">
    <el-row :gutter="20" class="profile-layout">
      <el-col :xs="24" :xl="9">
        <el-card class="profile-card">
          <div class="identity-header">
            <div class="avatar-shell">
              <img
                v-if="userInfo?.avatar"
                :src="userInfo.avatar"
                class="avatar-img"
                alt="用户头像"
              />
              <el-avatar v-else :size="84" :icon="UserFilled" />
            </div>

            <div class="identity-body">
              <div class="identity-name-row">
                <h2 class="identity-name">{{ userInfo?.name || "未登录用户" }}</h2>
                <el-tag type="success" effect="light">普通用户</el-tag>
              </div>
              <div class="identity-meta">
                <span class="meta-chip">ID {{ userInfo?.id ?? "--" }}</span>
                <span class="meta-chip">注册于 {{ formatDate(userInfo?.createTime) }}</span>
              </div>
            </div>
          </div>

          <div class="overview-strip">
            <div class="overview-item">
              <span class="overview-label">账号状态</span>
              <strong
                class="overview-value"
                :class="userInfo?.status === 'active' ? 'is-success' : 'is-danger'"
              >
                {{ userInfo?.status === "active" ? "正常" : "禁用" }}
              </strong>
            </div>
            <div class="overview-item">
              <span class="overview-label">违约次数</span>
              <strong
                class="overview-value"
                :class="(userInfo?.violationCount ?? 0) > 0 ? 'is-danger' : 'is-success'"
              >
                {{ userInfo?.violationCount ?? 0 }} 次
              </strong>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :xl="15">
        <el-card class="stats-panel">
          <template #header>
            <div class="section-header">
              <span class="section-title">使用概览</span>
            </div>
          </template>

          <div class="stats-grid">
            <div
              v-for="card in primaryStats"
              :key="card.label"
              class="stat-card"
            >
              <div class="stat-icon" :class="card.theme">
                <el-icon :size="18"><component :is="card.icon" /></el-icon>
              </div>
              <div class="stat-content">
                <span class="stat-label">{{ card.label }}</span>
                <strong class="stat-value">{{ card.value }}</strong>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { get } from "@/utils/api";
import { ElMessage } from "element-plus";
import {
  UserFilled,
  Calendar,
  Select,
  ChatDotRound,
  Tools,
} from "@element-plus/icons-vue";

interface UserInfo {
  id: number;
  name: string;
  role: string;
  avatar?: string;
  violationCount?: number;
  status?: string;
  createTime?: string;
}

interface UserStatistics {
  reservationCount: number;
  checkedInCount: number;
  feedbackCount: number;
  repairCount: number;
  totalGeneratedDataCount: number;
}

const loading = ref(false);
const userInfo = ref<UserInfo | null>(null);
const stats = ref<UserStatistics | null>(null);

const reservationCount = computed(() => stats.value?.reservationCount ?? 0);
const checkedInCount = computed(() => stats.value?.checkedInCount ?? 0);
const feedbackCount = computed(() => stats.value?.feedbackCount ?? 0);
const repairCount = computed(() => stats.value?.repairCount ?? 0);

const primaryStats = computed(() => [
  {
    label: "预约总数",
    value: `${reservationCount.value} 次`,
    icon: Calendar,
    theme: "teal",
  },
  {
    label: "已签到",
    value: `${checkedInCount.value} 次`,
    icon: Select,
    theme: "amber",
  },
  {
    label: "意见反馈",
    value: `${feedbackCount.value} 条`,
    icon: ChatDotRound,
    theme: "slate",
  },
  {
    label: "报修记录",
    value: `${repairCount.value} 条`,
    icon: Tools,
    theme: "sand",
  },
]);

function formatDate(value?: string) {
  if (!value) return "--";
  return value.replace("T", " ").slice(0, 16);
}

async function loadProfilePage() {
  loading.value = true;

  try {
    const [profileResult, statResult] = await Promise.allSettled([
      get<UserInfo>("/user/profile"),
      get<UserStatistics>("/statistics/user/profile"),
    ]);

    if (profileResult.status === "fulfilled" && profileResult.value) {
      userInfo.value = profileResult.value;
      sessionStorage.setItem("userInfo", JSON.stringify(userInfo.value));
    } else {
      const stored = sessionStorage.getItem("userInfo");
      if (stored) userInfo.value = JSON.parse(stored);
    }

    if (statResult.status === "fulfilled" && statResult.value) {
      stats.value = statResult.value;
    } else {
      stats.value = {
        reservationCount: 0,
        checkedInCount: 0,
        feedbackCount: 0,
        repairCount: 0,
        totalGeneratedDataCount: 0,
      };
      ElMessage.warning("个人统计数据加载失败，已展示基础资料");
    }
  } catch {
    /* handled by interceptor */
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadProfilePage();
});
</script>

<style scoped>
.profile-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.profile-card,
.stats-panel {
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 20px;
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.05);
}

.profile-card {
  overflow: hidden;
  background:
    radial-gradient(circle at top right, rgba(15, 118, 110, 0.1), transparent 32%),
    linear-gradient(135deg, #fffdf7 0%, #f8fafc 100%);
}

.stats-panel {
  background: #fff;
}

.identity-header {
  display: flex;
  gap: 18px;
  align-items: flex-start;
}

.avatar-shell {
  width: 92px;
  height: 92px;
  border-radius: 26px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(15, 118, 110, 0.16), rgba(217, 119, 6, 0.14));
  border: 1px solid rgba(15, 118, 110, 0.12);
  flex-shrink: 0;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.identity-body {
  flex: 1;
  min-width: 0;
}

.identity-name-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.identity-name {
  margin: 0;
  font-size: 28px;
  line-height: 1.2;
  font-weight: 700;
  color: #1f2937;
}

.identity-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 14px;
}

.meta-chip {
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(148, 163, 184, 0.18);
  color: #475569;
  font-size: 12px;
}

.overview-strip {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 20px;
}

.overview-item {
  padding: 16px 18px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.74);
  border: 1px solid rgba(226, 232, 240, 0.9);
}

.overview-label {
  display: block;
  font-size: 13px;
  color: #64748b;
}

.overview-value {
  display: block;
  margin-top: 8px;
  font-size: 22px;
  line-height: 1.2;
  color: #0f172a;
}

.overview-value.is-success {
  color: #0f766e;
}

.overview-value.is-danger {
  color: #dc2626;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.section-title {
  display: block;
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.stat-card {
  border-radius: 18px;
  padding: 18px;
  display: flex;
  gap: 14px;
  align-items: center;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  border: 1px solid rgba(226, 232, 240, 0.95);
}

.stat-icon {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.stat-icon.teal {
  background: linear-gradient(135deg, #0f766e 0%, #115e59 100%);
}

.stat-icon.amber {
  background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
}

.stat-icon.slate {
  background: linear-gradient(135deg, #475569 0%, #334155 100%);
}

.stat-icon.sand {
  background: linear-gradient(135deg, #8b6b4c 0%, #6b5847 100%);
}

.stat-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.stat-label {
  font-size: 13px;
  color: #64748b;
}

.stat-value {
  font-size: 24px;
  line-height: 1.2;
  font-weight: 700;
  color: #0f172a;
}

@media (max-width: 1200px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .profile-page {
    gap: 16px;
  }

  .identity-header,
  .section-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .identity-name {
    font-size: 24px;
  }

  .overview-strip {
    grid-template-columns: 1fr;
  }
}
</style>
