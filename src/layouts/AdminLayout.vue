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
          <h1 class="page-title">{{ APP_ADMIN_NAME }}</h1>
        </div>
        <div class="header-right">
          <!-- 用户信息（下拉菜单） -->
          <el-dropdown trigger="hover" @command="handleAdminCmd">
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

  <!-- 修改密码弹窗 -->
  <el-dialog
    v-model="adminPwdVisible"
    title="修改密码"
    width="420px"
    :close-on-click-modal="false"
    append-to-body
  >
    <el-form :model="adminPwdForm" label-width="100px" style="padding: 0 8px">
      <el-form-item label="原密码">
        <el-input
          v-model="adminPwdForm.oldPwd"
          type="password"
          show-password
          placeholder="请输入原密码"
        />
      </el-form-item>
      <el-form-item label="新密码">
        <el-input
          v-model="adminPwdForm.newPwd"
          type="password"
          show-password
          placeholder="请输入新密码（至少6位）"
        />
      </el-form-item>
      <el-form-item label="确认新密码">
        <el-input
          v-model="adminPwdForm.confirmPwd"
          type="password"
          show-password
          placeholder="请再次输入新密码"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="adminPwdVisible = false">取消</el-button>
      <el-button
        type="primary"
        :loading="adminPwdSaving"
        @click="handleAdminSavePwd"
      >
        保存
      </el-button>
    </template>
  </el-dialog>
  <!-- 编辑资料弹窗 -->
  <el-dialog
    v-model="editProfileVisible"
    title="编辑资料"
    width="420px"
    :close-on-click-modal="false"
    append-to-body
  >
    <el-form :model="editProfileForm" label-width="80px" style="padding: 0 8px">
      <el-form-item label="头像">
        <el-upload
          class="avatar-uploader"
          action="/api/upload/image"
          :headers="uploadHeaders"
          :show-file-list="false"
          :on-success="handleAvatarSuccess"
          :before-upload="beforeAvatarUpload"
          accept="image/jpeg,image/png,image/webp,image/gif"
        >
          <div class="avatar-upload-preview">
            <img
              v-if="editProfileForm.avatar"
              :src="editProfileForm.avatar"
              class="avatar-preview-img"
            />
            <el-icon v-else size="28" class="avatar-upload-icon"
              ><UserFilled
            /></el-icon>
          </div>
          <div class="avatar-upload-hint">点击上传头像</div>
        </el-upload>
      </el-form-item>
      <el-form-item label="昵称">
        <el-input
          v-model="editProfileForm.name"
          placeholder="请输入昵称"
          maxlength="20"
          show-word-limit
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
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import axios from "axios";
import {
  DataLine,
  UserFilled,
  OfficeBuilding,
  Calendar,
  ChatDotSquare,
  Notification,
  House,
  Search,
  SwitchButton,
  ArrowDown,
  Key,
  Edit,
  Setting,
} from "@element-plus/icons-vue";
import { APP_ADMIN_NAME, APP_ICON, APP_NAME } from "@/branding";

const router = useRouter();
const route = useRoute();
const userInfo = ref<{
  name: string;
  role: string;
  avatar?: string;
  id?: number;
} | null>(null);

const menuItems = [
  { path: "/admin/dashboard", title: "数据统计", icon: DataLine },
  { path: "/admin/buildings", title: "楼栋管理", icon: House },
  { path: "/admin/rooms", title: "自习室管理", icon: OfficeBuilding },
  { path: "/admin/users", title: "用户管理", icon: UserFilled },
  { path: "/admin/user-messages", title: "用户消息管理", icon: ChatDotSquare },
  { path: "/admin/reservations", title: "预约管理", icon: Calendar },
  { path: "/admin/reservation-rule", title: "预约规则管理", icon: Setting },
  { path: "/admin/feedback", title: "反馈与报修", icon: ChatDotSquare },
  { path: "/admin/notice", title: "公告管理", icon: Notification },
];

menuItems.splice(8, 0, {
  path: "/admin/lost-found",
  title: "失物招领",
  icon: ChatDotSquare,
});

const activeMenu = computed(() => route.path);

onMounted(() => {
  const stored = sessionStorage.getItem("userInfo");
  if (stored) userInfo.value = JSON.parse(stored);
  else router.push("/login");
});

async function handleLogout() {
  await ElMessageBox.confirm("确认退出登录？", "提示", {
    confirmButtonText: "确认",
    cancelButtonText: "取消",
    type: "warning",
  });
  try {
    await axios.post("/api/user/logout");
  } catch {
    // 忽略异常
  }
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("userInfo");
  ElMessage.success("已退出登录");
  router.push("/login");
}

// -------- 编辑资料 --------
const editProfileVisible = ref(false);
const editProfileSaving = ref(false);
const editProfileForm = ref({ name: "", avatar: "" });

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
  if (!editProfileForm.value.name.trim()) {
    ElMessage.warning("昵称不能为空");
    return;
  }
  const stored = sessionStorage.getItem("userInfo");
  const uid = stored ? JSON.parse(stored).id : null;
  if (!uid) return;
  editProfileSaving.value = true;
  try {
    const res = await axios.put("/api/user/admin/update", {
      id: uid,
      name: editProfileForm.value.name,
      avatar: editProfileForm.value.avatar || null,
    });
    if (res.data.code === 200) {
      ElMessage.success("资料更新成功");
      const newInfo = {
        ...JSON.parse(sessionStorage.getItem("userInfo") ?? "{}"),
        name: editProfileForm.value.name,
        avatar: editProfileForm.value.avatar,
      };
      sessionStorage.setItem("userInfo", JSON.stringify(newInfo));
      userInfo.value = newInfo;
      editProfileVisible.value = false;
    }
  } catch {
    /* handled by interceptor */
  } finally {
    editProfileSaving.value = false;
  }
}

// -------- 管理员下拉菜单 --------
function handleAdminCmd(cmd: string) {
  if (cmd === "edit-profile") {
    openEditProfile();
  } else if (cmd === "change-pwd") {
    adminPwdForm.value = { oldPwd: "", newPwd: "", confirmPwd: "" };
    adminPwdVisible.value = true;
  } else if (cmd === "logout") {
    handleLogout();
  }
}

const adminPwdVisible = ref(false);
const adminPwdSaving = ref(false);
const adminPwdForm = ref({ oldPwd: "", newPwd: "", confirmPwd: "" });

async function handleAdminSavePwd() {
  const { oldPwd, newPwd, confirmPwd } = adminPwdForm.value;
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
  const stored = sessionStorage.getItem("userInfo");
  const uid = stored ? JSON.parse(stored).id : null;
  if (!uid) {
    ElMessage.error("用户信息不存在，请重新登录");
    return;
  }
  adminPwdSaving.value = true;
  try {
    const res = await axios.put("/api/user/update-password", {
      userId: uid,
      oldPassword: oldPwd,
      newPassword: newPwd,
    });
    if (res.data.code === 200) {
      ElMessage.success("密码修改成功，请重新登录");
      adminPwdVisible.value = false;
    }
  } catch {
    /* handled by interceptor */
  } finally {
    adminPwdSaving.value = false;
  }
}
</script>

<style scoped>
.layout-container {
  height: 100vh;
  background: var(--bg-page);
}

/* 侧边栏 - 青色渐变主题 */
.aside {
  background: linear-gradient(180deg, #374151 0%, #1f2937 100%);
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
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.logo-icon {
  width: 36px;
  height: 36px;
  padding: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: linear-gradient(135deg, #4f46e5 0%, #818cf8 100%);
  border-radius: 10px;
  color: white;
  box-shadow: 0 4px 12px rgba(139, 115, 85, 0.3);
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
  gap: 4px;
  overflow-y: auto;
}

.nav-menu::-webkit-scrollbar {
  width: 4px;
}

.nav-menu::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 2px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 10px;
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.25s ease;
  cursor: pointer;
  position: relative;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.nav-item.active {
  background: rgba(255, 255, 255, 0.18);
  color: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.nav-item.active::before {
  content: "";
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 20px;
  background: #6366f1;
  border-radius: 0 4px 4px 0;
}

.nav-icon {
  font-size: 18px;
  flex-shrink: 0;
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
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(139, 115, 85, 0.08);
  box-shadow: 0 2px 12px rgba(139, 115, 85, 0.04);
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
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
  border: 2px solid #fff;
}

/* 头像图片 */
.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

/* 编辑资料 - 头像上传 */
.avatar-uploader {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}

.avatar-upload-preview {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: rgba(139, 115, 85, 0.06);
  border: 2px dashed rgba(139, 115, 85, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  transition: border-color 0.2s;
}

.avatar-upload-preview:hover {
  border-color: var(--primary);
}

.avatar-preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-upload-icon {
  color: var(--text-light);
}

.avatar-upload-hint {
  font-size: 12px;
  color: var(--text-muted);
}
</style>
