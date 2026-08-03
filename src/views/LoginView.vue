<template>
  <div class="login-container">
    <!-- 登录卡片 -->
    <div class="login-card">
      <!-- Logo 区域 -->
      <div class="logo-section">
        <div class="logo-icon">
          <img :src="APP_ICON" :alt="APP_NAME" class="logo-image" />
        </div>
        <h1 class="logo-title">{{ APP_NAME }}</h1>
        <p class="logo-subtitle">{{ APP_DESCRIPTION }}</p>
      </div>

      <!-- 表单区域 -->
      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="rules"
        label-width="0"
        class="login-form"
        autocomplete="off"
        @keyup.enter="handleLogin"
      >
        <!-- 身份选择 -->
        <el-form-item prop="role">
          <el-select
            v-model="loginForm.role"
            placeholder="请选择登录身份"
            class="custom-select"
          >
            <el-option label="管理员" value="1">
              <div class="option-content">
                <el-icon><Setting /></el-icon>
                <span>管理员</span>
              </div>
            </el-option>
            <el-option label="普通用户" value="2">
              <div class="option-content">
                <el-icon><User /></el-icon>
                <span>普通用户</span>
              </div>
            </el-option>
          </el-select>
        </el-form-item>

        <!-- 用户名 -->
        <el-form-item prop="name">
          <el-input
            v-model="loginForm.name"
            placeholder="请输入用户名"
            :prefix-icon="User"
            clearable
            class="custom-input"
            autocomplete="new-username"
            name="login-username"
          />
        </el-form-item>

        <!-- 密码 -->
        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            :prefix-icon="Lock"
            show-password
            clearable
            class="custom-input"
            autocomplete="new-password"
            name="login-password"
          />
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            class="login-btn"
            :loading="loading"
            @click="handleLogin"
          >
            <span v-if="!loading">登 录</span>
            <span v-else>登录中...</span>
          </el-button>
        </el-form-item>
      </el-form>

      <!-- 快捷填充 -->
      <div class="quick-fill">
        <span class="quick-label">快捷登录：</span>
        <button class="quick-btn admin" @click="fillAdmin">
          <el-icon><Setting /></el-icon>
          管理员
        </button>
        <button class="quick-btn user" @click="fillUser">
          <el-icon><User /></el-icon>
          普通用户
        </button>
      </div>

      <!-- 注册入口 -->
      <div class="register-link">
        <span class="register-label">还没有账号？</span>
        <router-link to="/register" class="register-link-btn">立即注册</router-link>
      </div>
    </div>

    <!-- 底部版权 -->
    <div class="footer">
      <p>{{ APP_COPYRIGHT }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { User, Lock, Setting } from "@element-plus/icons-vue";
import { post } from "@/utils/api";
import { APP_COPYRIGHT, APP_DESCRIPTION, APP_ICON, APP_NAME } from "@/branding";

const router = useRouter();
const loginFormRef = ref();
const loading = ref(false);

const loginForm = reactive({
  role: "",
  name: "",
  password: "",
});

const rules = {
  role: [{ required: true, message: "请选择登录身份", trigger: "change" }],
  name: [
    { required: true, message: "请输入用户名", trigger: "blur" },
    { min: 1, max: 10, message: "用户名长度在 1 到 10 个字符", trigger: "blur" },
  ],
  password: [
    { required: true, message: "请输入密码", trigger: "blur" },
    { min: 1, max: 20, message: "密码长度在 1 到 20 个字符", trigger: "blur" },
  ],
};

async function handleLogin() {
  if (!loginFormRef.value) return;
  await loginFormRef.value.validate(async (valid: boolean) => {
    if (!valid) return;
    loading.value = true;
    try {
      const res = await post<any>("/user/login", {
        name: loginForm.name,
        password: loginForm.password,
        role: loginForm.role,
      });
      if (res) {
        const loginData = res as any;
        const userInfo = loginData.userInfo;
        const token = loginData.token;
        if (!userInfo || !token) {
          ElMessage.error("登录响应缺少凭证信息");
          return;
        }
        sessionStorage.setItem("token", token);
        sessionStorage.setItem("userInfo", JSON.stringify(userInfo));
        router.push(userInfo.role === "1" ? "/admin" : "/user");
      } else {
        ElMessage.error("用户名或密码错误");
      }
    } catch { /* handled by interceptor */ } finally {
      loading.value = false;
    }
  });
}

function fillAdmin() {
  loginForm.role = "1";
  loginForm.name = "admin";
  loginForm.password = "123456";
}

function fillUser() {
  loginForm.role = "2";
  loginForm.name = "user1";
  loginForm.password = "123456";
}
</script>

<style scoped>
.login-container {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: url('/login.png') center/cover no-repeat;
  overflow: hidden;
  padding: 20px;
}

/* 登录卡片 */
.login-card {
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 420px;
  padding: 40px 36px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 20px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

/* Logo 区域 */
.logo-section {
  text-align: center;
  margin-bottom: 32px;
}

.logo-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 16px;
  padding: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: linear-gradient(135deg, #8B7355 0%, #A08060 100%);
  border-radius: 16px;
  color: white;
  box-shadow: 0 8px 20px rgba(139, 115, 85, 0.3);
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

.logo-title {
  font-size: 26px;
  font-weight: 700;
  color: #5D4E37;
  margin: 0 0 6px;
  letter-spacing: 2px;
}

.logo-subtitle {
  font-size: 14px;
  color: #8B7355;
  margin: 0;
  letter-spacing: 1px;
}

/* 表单样式 */
.login-form {
  margin-bottom: 20px;
}

.login-form :deep(.el-form-item) {
  margin-bottom: 20px;
}

.login-form :deep(.el-input__wrapper) {
  padding: 8px 16px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.7);
  box-shadow: 0 2px 8px rgba(93, 78, 55, 0.08);
  border: 1px solid rgba(93, 78, 55, 0.15);
  transition: all 0.25s ease;
}

.login-form :deep(.el-input__wrapper:hover) {
  border-color: rgba(139, 115, 85, 0.4);
  box-shadow: 0 4px 12px rgba(93, 78, 55, 0.12);
}

.login-form :deep(.el-input__wrapper.is-focus) {
  border-color: #8B7355;
  box-shadow: 0 0 0 3px rgba(139, 115, 85, 0.15);
}

.login-form :deep(.el-select) {
  width: 100%;
}

.login-form :deep(.el-select .el-input__wrapper) {
  padding: 8px 16px;
  border-radius: 12px;
}

.option-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 登录按钮 */
.login-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 4px;
  border-radius: 12px;
  background: linear-gradient(135deg, #8B7355 0%, #6B5344 100%);
  border: none;
  box-shadow: 0 8px 20px rgba(139, 115, 85, 0.3);
  transition: all 0.25s ease;
}

.login-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 28px rgba(139, 115, 85, 0.4);
}

.login-btn:active {
  transform: translateY(0);
}

/* 快捷填充 */
.quick-fill {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding-top: 20px;
  border-top: 1px solid rgba(139, 115, 85, 0.15);
}

.quick-label {
  font-size: 13px;
  color: #8B7355;
}

.quick-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 14px;
  font-size: 13px;
  font-weight: 500;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.quick-btn.admin {
  background: rgba(184, 84, 80, 0.1);
  color: #B85450;
}

.quick-btn.admin:hover {
  background: rgba(184, 84, 80, 0.2);
}

.quick-btn.user {
  background: rgba(124, 154, 110, 0.1);
  color: #7C9A6E;
}

.quick-btn.user:hover {
  background: rgba(124, 154, 110, 0.2);
}

/* 注册入口 */
.register-link {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 16px;
}

.register-label {
  font-size: 13px;
  color: #8B7355;
}

.register-link-btn {
  font-size: 13px;
  color: #8B7355;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s ease;
}

.register-link-btn:hover {
  color: #6B5344;
  text-decoration: underline;
}

/* 底部版权 */
.footer {
  position: absolute;
  bottom: 20px;
  text-align: center;
}

.footer p {
  font-size: 12px;
  color: #8B7355;
  margin: 0;
}

/* 响应式 */
@media (max-width: 480px) {
  .login-card {
    padding: 32px 24px;
    margin: 0 16px;
  }
  
  .logo-title {
    font-size: 22px;
  }
  
  .quick-fill {
    flex-wrap: wrap;
  }
}
</style>
