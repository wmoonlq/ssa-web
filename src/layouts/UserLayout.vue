<template>
  <el-container class="layout-container">
    <!-- 侧边栏 -->
    <el-aside width="240px" class="aside">
      <div class="logo">
        <div class="logo-icon">
          <img :src="APP_ICON" :alt="APP_NAME" class="logo-image" />
        </div>
        <span class="logo-text">{{ APP_NAME }}</span>
      </div>

      <nav class="nav-menu">
        <router-link
          v-for="item in menuItems"
          :key="item.path"
          :to="item.path"
          class="nav-item"
          :class="{ active: activeMenu === item.path }"
        >
          <el-icon class="nav-icon"><component :is="item.icon" /></el-icon>
          <span class="nav-text">{{ item.title }}</span>
        </router-link>
      </nav>
    </el-aside>

    <el-container class="main-container">
      <!-- 顶部导航 -->
      <el-header class="header">
        <div class="header-left">
          <h1 class="page-title">{{ APP_NAME }}</h1>
        </div>
        <div class="header-right">
          <!-- 消息通知铃铛 -->
          <div class="msg-bell-wrap" ref="bellWrapRef">
            <button class="bell-btn" @click="toggleMsgPanel" title="消息通知">
              <el-icon size="20"><Bell /></el-icon>
              <span v-if="unreadCount > 0" class="badge">{{
                unreadCount > 99 ? "99+" : unreadCount
              }}</span>
            </button>

            <!-- 消息下拉面板 -->
            <Teleport to="body">
              <transition name="dropdown">
                <div
                  v-if="msgPanelVisible"
                  ref="msgDropdownRef"
                  class="msg-dropdown"
                  :style="dropdownStyle"
                >
                  <div class="msg-header">
                    <span class="msg-title">
                      消息通知
                      <span v-if="unreadCount > 0" class="unread-tag"
                        >{{ unreadCount }} 未读</span
                      >
                    </span>
                    <button class="mark-all-btn" @click="handleMarkAllRead">
                      全部已读
                    </button>
                  </div>
                  <div class="msg-body" v-loading="msgLoading">
                    <el-empty
                      v-if="!msgLoading && msgList.length === 0"
                      description="暂无消息"
                      :image-size="60"
                    />
                    <div class="chat-container">
                      <div
                        v-for="item in msgList"
                        :key="item.id"
                        class="chat-item"
                        :class="{ unread: !item.isRead }"
                      >
                        <!-- 头像 -->
                        <div class="chat-avatar">
                          <img
                            v-if="!item.isRead"
                            src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2322c55e'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z'/%3E%3C/svg%3E"
                            alt="系统"
                          />
                          <el-icon v-else size="20"><Bell /></el-icon>
                        </div>
                        <!-- 消息内容 -->
                        <div class="chat-content">
                          <div class="chat-bubble">
                            <div class="chat-title">{{ item.title }}</div>
                            <div class="chat-text">{{ item.content }}</div>
                          </div>
                          <div class="chat-info">
                            <span class="chat-time">{{
                              formatTime(item.createTime)
                            }}</span>
                            <span v-if="!item.isRead" class="chat-status"
                              >未读</span
                            >
                          </div>
                        </div>
                        <!-- 操作按钮 -->
                        <div class="chat-actions">
                          <el-button
                            v-if="!item.isRead"
                            type="primary"
                            size="small"
                            link
                            @click.stop="handleMarkRead(item)"
                          >
                            标为已读
                          </el-button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="msg-footer">
                    <el-pagination
                      v-model:current-page="msgPageNum"
                      :total="msgTotal"
                      :page-size="msgPageSize"
                      layout="prev, pager, next"
                      small
                      @current-change="loadMsgList"
                    />
                  </div>
                </div>
              </transition>
            </Teleport>
          </div>

          <!-- 用户信息（下拉菜单） -->
          <el-dropdown trigger="hover" @command="handleUserCmd">
            <div class="avatar-only">
              <div class="avatar">
                <img
                  v-if="userInfo?.avatar"
                  :src="userInfo.avatar"
                  class="avatar-img"
                />
                <el-icon v-else size="18"><UserFilled /></el-icon>
              </div>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="edit-profile" :icon="Edit">
                  编辑资料
                </el-dropdown-item>
                <el-dropdown-item command="change-pwd" :icon="Key">
                  修改密码
                </el-dropdown-item>
                <el-dropdown-item command="logout" :icon="SwitchButton" divided>
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <!-- 内容区 -->
      <el-main class="main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>

  <!-- 消息详情弹窗 -->
  <el-dialog
    v-model="msgDialogVisible"
    :title="currentMsg?.title"
    width="520px"
    class="msg-dialog"
    append-to-body
  >
    <div class="detail-meta">
      <el-icon><Clock /></el-icon>
      {{ currentMsg?.createTime }}
    </div>
    <el-divider />
    <div class="detail-content">{{ currentMsg?.content }}</div>
    <template #footer>
      <el-button
        v-if="currentMsg && !currentMsg.isRead"
        type="primary"
        @click="handleMarkRead(currentMsg)"
        >标为已读</el-button
      >
      <el-button @click="msgDialogVisible = false">关闭</el-button>
    </template>
  </el-dialog>

  <!-- 编辑资料弹窗 -->
  <el-dialog
    v-model="editProfileVisible"
    title="编辑个人资料"
    width="460px"
    :close-on-click-modal="false"
    append-to-body
  >
    <el-form :model="editProfileForm" label-width="90px" style="padding: 0 8px">
      <!-- 头像上传 -->
      <el-form-item label="头像">
        <div class="avatar-upload-wrap">
          <el-upload
            class="avatar-uploader"
            action="/api/upload/image"
            :headers="uploadHeaders"
            :show-file-list="false"
            :on-success="handleAvatarSuccess"
            :before-upload="beforeAvatarUpload"
            accept="image/jpeg,image/png,image/webp,image/gif"
          >
            <img
              v-if="editProfileForm.avatar"
              :src="editProfileForm.avatar"
              class="avatar-preview"
            />
            <div v-else class="avatar-placeholder">
              <el-icon size="28"><Plus /></el-icon>
              <span>上传头像</span>
            </div>
          </el-upload>
          <span class="avatar-tip">支持 JPG/PNG/WEBP，不超过 5MB</span>
        </div>
      </el-form-item>
      <el-form-item label="新用户名">
        <el-input
          v-model="editProfileForm.name"
          placeholder="请输入新用户名"
          maxlength="20"
          show-word-limit
          clearable
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="editProfileVisible = false">取消</el-button>
      <el-button
        type="primary"
        :loading="editProfileSaving"
        @click="handleSaveProfile"
      >
        保存
      </el-button>
    </template>
  </el-dialog>

  <!-- 修改密码弹窗 -->
  <el-dialog
    v-model="changePwdVisible"
    title="修改密码"
    width="420px"
    :close-on-click-modal="false"
    append-to-body
  >
    <el-form :model="changePwdForm" label-width="100px" style="padding: 0 8px">
      <el-form-item label="原密码">
        <el-input
          v-model="changePwdForm.oldPwd"
          type="password"
          show-password
          placeholder="请输入原密码"
        />
      </el-form-item>
      <el-form-item label="新密码">
        <el-input
          v-model="changePwdForm.newPwd"
          type="password"
          show-password
          placeholder="请输入新密码（至少6位）"
        />
      </el-form-item>
      <el-form-item label="确认新密码">
        <el-input
          v-model="changePwdForm.confirmPwd"
          type="password"
          show-password
          placeholder="请再次输入新密码"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="changePwdVisible = false">取消</el-button>
      <el-button
        type="primary"
        :loading="changePwdSaving"
        @click="handleSavePwd"
      >
        保存
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { useRouter, useRoute } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  Search,
  Calendar,
  Finished,
  ChatDotSquare,
  Bell,
  User,
  UserFilled,
  SwitchButton,
  Clock,
  ArrowDown,
  Edit,
  Key,
  Plus,
} from "@element-plus/icons-vue";
import axios from "axios";
import { APP_ICON, APP_NAME } from "@/branding";

const BASE = "/api";
const router = useRouter();
const route = useRoute();
const userInfo = ref<{
  id: number;
  name: string;
  role: string;
  avatar?: string;
} | null>(null);

const menuItems = [
  { path: "/user/seat-query", title: "自习室查询", icon: Search },
  { path: "/user/reservation", title: "我的预约", icon: Calendar },
  { path: "/user/checkin", title: "预约签到", icon: Finished },
  { path: "/user/feedback", title: "反馈与报修", icon: ChatDotSquare },
  { path: "/user/notice", title: "公告信息", icon: Bell },
  { path: "/user/profile", title: "个人信息", icon: User },
];

menuItems.splice(4, 0, {
  path: "/user/lost-found",
  title: "失物招领",
  icon: ChatDotSquare,
});

const activeMenu = computed(() => route.path);

// -------- 消息通知 --------
interface Notification {
  id: number;
  userId: number;
  title: string;
  content: string;
  isRead: number;
  createTime: string;
}

const msgPanelVisible = ref(false);
const msgLoading = ref(false);
const msgList = ref<Notification[]>([]);
const unreadCount = ref(0);
const msgPageNum = ref(1);
const msgPageSize = ref(8);
const msgTotal = ref(0);
const msgDialogVisible = ref(false);
const currentMsg = ref<Notification | null>(null);
const bellWrapRef = ref<HTMLElement | null>(null);
const msgDropdownRef = ref<HTMLElement | null>(null);
const dropdownPos = ref({ top: 0, right: 0 });

const dropdownStyle = computed(() => ({
  position: "fixed" as const,
  top: dropdownPos.value.top + "px",
  right: dropdownPos.value.right + "px",
  zIndex: 10001,
}));

function formatTime(timeStr: string): string {
  if (!timeStr) return "";
  const date = new Date(timeStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  return timeStr.slice(0, 16).replace("T", " ");
}

async function loadMsgList() {
  if (!userInfo.value?.id) return;
  msgLoading.value = true;
  try {
    const [listRes, unreadRes] = await Promise.all([
      axios.get(`${BASE}/notification/list`, {
        params: {
          pageNum: msgPageNum.value,
          pageSize: msgPageSize.value,
        },
      }),
      axios.get(`${BASE}/notification/unread-count`),
    ]);
    if (listRes.data.code === 200) {
      const data = listRes.data.data;
      const raw: Notification[] = data?.list ?? data?.records ?? data ?? [];
      msgList.value = [
        ...raw.filter((m: Notification) => !m.isRead),
        ...raw.filter((m: Notification) => m.isRead),
      ];
      msgTotal.value = data?.total ?? raw.length;
    }
    if (unreadRes.data.code === 200) {
      unreadCount.value = unreadRes.data.data ?? 0;
    }
  } catch {
    /* 静默失败 */
  } finally {
    msgLoading.value = false;
  }
}

async function loadUnreadCount() {
  if (!userInfo.value?.id) return;
  try {
    const res = await axios.get(`${BASE}/notification/unread-count`);
    if (res.data.code === 200) {
      unreadCount.value = res.data.data ?? 0;
    }
  } catch {
    /* 静默失败 */
  }
}

function toggleMsgPanel() {
  msgPanelVisible.value = !msgPanelVisible.value;
  if (msgPanelVisible.value) {
    // 计算铃铛按钮位置，用于 fixed 定位面板
    if (bellWrapRef.value) {
      const rect = bellWrapRef.value.getBoundingClientRect();
      dropdownPos.value = {
        top: rect.bottom + 12,
        right: window.innerWidth - rect.right,
      };
    }
    loadMsgList();
  }
}

function handleViewMsg(row: Notification) {
  currentMsg.value = row;
  msgDialogVisible.value = true;
  msgPanelVisible.value = false;
}

async function handleMarkRead(row: Notification) {
  try {
    const res = await axios.put(`${BASE}/notification/read/${row.id}`);
    if (res.data.code === 200) {
      row.isRead = 1;
      msgDialogVisible.value = false;
      loadUnreadCount();
    }
  } catch {
    /* handled by interceptor */
  }
}

async function handleMarkAllRead() {
  if (!userInfo.value?.id) return;
  try {
    const res = await axios.put(`${BASE}/notification/read-all`);
    if (res.data.code === 200) {
      msgList.value.forEach((m) => {
        m.isRead = 1;
      });
      ElMessage.success("已全部标为已读");
      loadUnreadCount();
    }
  } catch {
    /* handled by interceptor */
  }
}

function onClickOutside(e: MouseEvent) {
  const target = e.target as Node;
  const clickedBell = bellWrapRef.value?.contains(target);
  const clickedDropdown = msgDropdownRef.value?.contains(target);

  if (!clickedBell && !clickedDropdown) {
    msgPanelVisible.value = false;
  }
}

// -------- 通用 --------
onMounted(() => {
  const stored = sessionStorage.getItem("userInfo");
  if (stored) {
    userInfo.value = JSON.parse(stored);
    loadUnreadCount();
  } else {
    router.push("/login");
  }
  document.addEventListener("click", onClickOutside, true);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", onClickOutside, true);
});

async function handleLogout() {
  await ElMessageBox.confirm("确认退出登录？", "提示", {
    confirmButtonText: "确认",
    cancelButtonText: "取消",
    type: "warning",
  });
  try {
    await axios.post(`${BASE}/user/logout`);
  } catch {
    // 忽略异常
  }
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("userInfo");
  ElMessage.success("已退出登录");
  router.push("/login");
}

// -------- 用户下拉菜单 --------
function handleUserCmd(cmd: string) {
  if (cmd === "edit-profile") {
    openEditProfile();
  } else if (cmd === "change-pwd") {
    openChangePwd();
  } else if (cmd === "logout") {
    handleLogout();
  }
}

// 编辑资料
const editProfileVisible = ref(false);
const editProfileSaving = ref(false);
const editProfileForm = ref({ name: "", avatar: "" });

// 头像上传相关
const uploadHeaders = computed(() => {
  const token = sessionStorage.getItem("token") ?? "";
  return { Authorization: token || "" };
});

function handleAvatarSuccess(res: {
  code: number;
  data: string;
  message: string;
}) {
  if (res.code === 200) {
    editProfileForm.value.avatar = res.data;
    ElMessage.success("头像上传成功");
  } else {
    ElMessage.error(res.message || "头像上传失败");
  }
}

function beforeAvatarUpload(file: File) {
  const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowed.includes(file.type)) {
    ElMessage.error("仅支持 JPG/PNG/WEBP/GIF 格式");
    return false;
  }
  if (file.size > 5 * 1024 * 1024) {
    ElMessage.error("图片大小不能超过 5MB");
    return false;
  }
  return true;
}

function openEditProfile() {
  editProfileForm.value.name = userInfo.value?.name ?? "";
  editProfileForm.value.avatar = userInfo.value?.avatar ?? "";
  editProfileVisible.value = true;
}

async function handleSaveProfile() {
  const trimmed = editProfileForm.value.name.trim();
  if (!trimmed) {
    ElMessage.warning("用户名不能为空");
    return;
  }
  editProfileSaving.value = true;
  try {
    const res = await axios.put(`${BASE}/user/update-profile`, {
      name: trimmed,
      avatar: editProfileForm.value.avatar || undefined,
    });
    if (res.data.code === 200) {
      ElMessage.success("资料更新成功");
      editProfileVisible.value = false;
      const updated = res.data.data;
      // 更新内存与 sessionStorage
      if (userInfo.value)
        userInfo.value = {
          ...userInfo.value,
          name: updated.name,
          avatar: updated.avatar,
        };
      const stored = sessionStorage.getItem("userInfo");
      if (stored) {
        sessionStorage.setItem(
          "userInfo",
          JSON.stringify({
            ...JSON.parse(stored),
            name: updated.name,
            avatar: updated.avatar,
          }),
        );
      }
    }
  } catch {
    /* handled by interceptor */
  } finally {
    editProfileSaving.value = false;
  }
}

// 修改密码
const changePwdVisible = ref(false);
const changePwdSaving = ref(false);
const changePwdForm = ref({ oldPwd: "", newPwd: "", confirmPwd: "" });

function openChangePwd() {
  changePwdForm.value = { oldPwd: "", newPwd: "", confirmPwd: "" };
  changePwdVisible.value = true;
}

async function handleSavePwd() {
  const { oldPwd, newPwd, confirmPwd } = changePwdForm.value;
  if (!oldPwd.trim()) {
    ElMessage.warning("请输入原密码");
    return;
  }
  if (!newPwd.trim()) {
    ElMessage.warning("请输入新密码");
    return;
  }
  if (newPwd.length < 6) {
    ElMessage.warning("新密码不能少于6位");
    return;
  }
  if (newPwd !== confirmPwd) {
    ElMessage.warning("两次密码不一致");
    return;
  }
  if (!userInfo.value?.id) {
    ElMessage.error("用户信息不存在，请重新登录");
    return;
  }
  changePwdSaving.value = true;
  try {
    const res = await axios.put(`${BASE}/user/update-password`, {
      userId: userInfo.value.id,
      oldPassword: oldPwd,
      newPassword: newPwd,
    });
    if (res.data.code === 200) {
      ElMessage.success("密码修改成功，请重新登录");
      changePwdVisible.value = false;
    }
  } catch {
    /* handled by interceptor */
  } finally {
    changePwdSaving.value = false;
  }
}
</script>

<style scoped>
.layout-container {
  height: 100vh;
  background: var(--bg-page);
}

/* 侧边栏 */
.aside {
  background: linear-gradient(180deg, #6b5344 0%, #4b5563 100%);
  display: flex;
  flex-direction: column;
  box-shadow: 4px 0 20px rgba(139, 115, 85, 0.2);
}

.logo {
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: rgba(0, 0, 0, 0.1);
}

.logo-icon {
  width: 36px;
  height: 36px;
  padding: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 10px;
  color: white;
}

.logo-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.logo-icon svg {
  width: 100%;
  height: 100%;
}

.logo-text {
  font-size: 18px;
  font-weight: 600;
  color: white;
  letter-spacing: 2px;
}

/* 导航菜单 */
.nav-menu {
  flex: 1;
  padding: 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 18px;
  border-radius: 12px;
  color: rgba(255, 255, 255, 0.75);
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.25s ease;
  cursor: pointer;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.nav-item.active {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.nav-icon {
  font-size: 18px;
}

/* 主容器 */
.main-container {
  display: flex;
  flex-direction: column;
}

/* 顶部导航 */
.header {
  height: 68px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 28px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(139, 115, 85, 0.1);
  box-shadow: 0 2px 12px rgba(139, 115, 85, 0.06);
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* 简洁头像 - 悬停显示 */
.avatar-only {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border-radius: 50%;
  cursor: pointer;
  transition: background 0.2s ease;
}

.avatar-only:hover {
  background: rgba(0, 0, 0, 0.05);
}

.avatar {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  color: white;
  overflow: hidden;
}

/* 消息铃铛 */
.msg-bell-wrap {
  position: relative;
}

.bell-btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 12px;
  background: rgba(139, 115, 85, 0.08);
  color: var(--primary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.bell-btn:hover {
  background: rgba(139, 115, 85, 0.15);
  transform: translateY(-1px);
}

.badge {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  font-size: 11px;
  font-weight: 600;
  color: white;
  background: #ef4444;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 消息下拉面板 */
.msg-dropdown {
  position: fixed;
  width: 400px;
  background: #f5f5f5;
  border-radius: 8px;
  box-shadow: 0 12px 40px rgba(139, 115, 85, 0.2);
  border: 1px solid rgba(139, 115, 85, 0.1);
  overflow: hidden;
  z-index: 10000;
}

.msg-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: white;
  border-bottom: 1px solid #e5e5e5;
}

.msg-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  display: flex;
  align-items: center;
  gap: 8px;
}

.unread-tag {
  font-size: 12px;
  font-weight: 500;
  padding: 2px 8px;
  background: #ef4444;
  color: white;
  border-radius: 10px;
}

.mark-all-btn {
  font-size: 13px;
  color: #1d9bf0;
  background: none;
  border: none;
  cursor: pointer;
  transition: opacity 0.2s;
}

.mark-all-btn:hover {
  opacity: 0.7;
}

.msg-body {
  max-height: 420px;
  overflow-y: auto;
  padding: 8px;
  background: #f5f5f5;
}

/* QQ聊天风格 */
.chat-container {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.chat-item {
  display: flex;
  align-items: flex-start;
  padding: 10px 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
  background: transparent;
}

.chat-item:hover {
  background: rgba(0, 0, 0, 0.04);
}

.chat-item.unread {
  background: rgba(29, 155, 240, 0.08);
}

.chat-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
  margin-right: 10px;
}

.chat-item.unread .chat-avatar {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
}

.chat-content {
  flex: 1;
  min-width: 0;
}

.chat-bubble {
  position: relative;
  background: white;
  border-radius: 8px;
  padding: 10px 14px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
  max-width: 280px;
}

.chat-bubble::before {
  content: "";
  position: absolute;
  left: -8px;
  top: 12px;
  width: 0;
  height: 0;
  border: 6px solid transparent;
  border-right-color: white;
  border-left: 0;
}

.chat-title {
  font-size: 13px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
  line-height: 1.4;
}

.chat-text {
  font-size: 13px;
  color: #666;
  line-height: 1.5;
  word-break: break-word;
}

.chat-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
}

.chat-time {
  font-size: 11px;
  color: #999;
}

.chat-status {
  font-size: 11px;
  color: #22c55e;
  background: rgba(34, 197, 94, 0.1);
  padding: 1px 6px;
  border-radius: 4px;
}

.chat-actions {
  opacity: 0;
  transition: opacity 0.2s;
  margin-left: 8px;
}

.chat-item:hover .chat-actions {
  opacity: 1;
}

.msg-footer {
  padding: 12px;
  background: white;
  border-top: 1px solid #e5e5e5;
  display: flex;
  justify-content: center;
}

/* 下拉动画 */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* 头像图片 */
.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

/* 头像上传区域 */
.avatar-upload-wrap {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.avatar-uploader {
  width: 88px;
  height: 88px;
  border: 2px dashed rgba(139, 115, 85, 0.3);
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: border-color 0.2s;
}

.avatar-uploader:hover {
  border-color: var(--primary, #0891b2);
}

.avatar-preview {
  width: 88px;
  height: 88px;
  object-fit: cover;
  display: block;
}

.avatar-placeholder {
  width: 88px;
  height: 88px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: #94a3b8;
  font-size: 12px;
}

.avatar-tip {
  font-size: 12px;
  color: var(--text-muted, #94a3b8);
}

/* 内容区 */
.main {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  background: var(--bg-page);
}

/* 消息详情弹窗 */
.detail-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--text-muted);
}

.detail-content {
  line-height: 1.8;
  color: var(--text-primary);
  white-space: pre-wrap;
}
</style>
