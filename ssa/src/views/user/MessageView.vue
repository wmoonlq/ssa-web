<template>
  <div>
    <el-card class="page-card">
      <template #header>
        <div
          style="
            display: flex;
            justify-content: space-between;
            align-items: center;
          "
        >
          <span class="card-title">
            消息通知
            <el-badge
              v-if="unreadCount > 0"
              :value="unreadCount"
              style="margin-left: 8px"
            />
          </span>
          <el-button size="small" plain @click="handleMarkAllRead"
            >全部标为已读</el-button
          >
        </div>
      </template>

      <el-table :data="messageList" border stripe v-loading="loading">
        <el-table-column prop="title" label="标题" />
        <el-table-column
          prop="content"
          label="通知内容"
          show-overflow-tooltip
        />
        <el-table-column prop="isRead" label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.isRead ? 'info' : 'success'">{{
              row.isRead ? "已读" : "未读"
            }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column
          prop="createTime"
          label="时间"
          width="180"
          align="center"
        />
        <el-table-column label="操作" width="100" align="center">
          <template #default="{ row }">
            <el-button
              v-if="!row.isRead"
              type="primary"
              size="small"
              plain
              @click="handleMarkRead(row)"
              >标为已读</el-button
            >
            <span v-else style="color: #c0c4cc">已读</span>
          </template>
        </el-table-column>
      </el-table>

      <el-empty
        v-if="!loading && messageList.length === 0"
        description="暂无消息通知"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { getPage, put } from "@/utils/api";
import type { Notification } from "@/types/api";

const BASE = "/api";

interface Notification {
  id: number;
  userId: number;
  title: string;
  content: string;
  isRead: number;
  createTime: string;
}

const currentUser = JSON.parse(
  sessionStorage.getItem("userInfo") || sessionStorage.getItem("user") || "{}"
);

const messageList = ref<Notification[]>([]);
const loading = ref(false);
const unreadCount = ref(0);

async function loadList() {
  if (!currentUser.id) return;
  loading.value = true;
  try {
    const { list } = await getPage<Notification>("/notification/list", {
      userId: currentUser.id,
      pageNum: 1,
      pageSize: 1000,
    });
    // 未读消息置顶
    messageList.value = [...list.filter((m: Notification) => !m.isRead), ...list.filter((m: Notification) => m.isRead)];
    unreadCount.value = messageList.value.filter((m: Notification) => !m.isRead).length;
  } catch { /* handled by interceptor */ } finally {
    loading.value = false;
  }
}

async function handleMarkRead(row: Notification) {
  try {
    await put(`/notification/read/${row.id}`);
    row.isRead = 1;
    unreadCount.value = Math.max(0, unreadCount.value - 1);
  } catch { /* handled by interceptor */ }
}

async function handleMarkAllRead() {
  if (!currentUser.id) return;
  try {
    await put(`/notification/read-all`, null, { params: { userId: currentUser.id } });
    messageList.value.forEach((m) => {
      m.isRead = 1;
    });
    unreadCount.value = 0;
    ElMessage.success("已全部标为已读");
  } catch { /* handled by interceptor */ }
}

onMounted(() => {
  loadList();
});
</script>

<style scoped>
.page-card {
  min-height: calc(100vh - 120px);
}
.card-title {
  font-size: 16px;
  font-weight: 600;
}
</style>
