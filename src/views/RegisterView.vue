<template>
  <div class="register-container">
    <!-- 注册卡片 -->
    <div class="register-card">
      <!-- Logo 区域 -->
      <div class="logo-section">
        <div class="logo-icon">
          <img :src="APP_ICON" :alt="APP_NAME" class="logo-image" />
        </div>
        <h1 class="logo-title">{{ APP_NAME }}</h1>
        <p class="logo-subtitle">注册成为普通用户</p>
      </div>

      <!-- 表单区域 -->
      <el-form
        ref="registerFormRef"
        :model="registerForm"
        :rules="rules"
        label-width="0"
        class="register-form"
        autocomplete="off"
        @keyup.enter="handleRegister"
      >
        <!-- 用户名 -->
        <el-form-item prop="name">
          <el-input
            v-model="registerForm.name"
            placeholder="请输入用户名"
            :prefix-icon="User"
            clearable
            class="custom-input"
            autocomplete="new-username"
            name="register-username"
          />
        </el-form-item>

        <!-- 密码 -->
        <el-form-item prop="password">
          <el-input
            v-model="registerForm.password"
            type="password"
            placeholder="请输入密码（6-20位）"
            :prefix-icon="Lock"
            show-password
            clearable
            class="custom-input"
            autocomplete="new-password"
            name="register-password"
          />
        </el-form-item>

        <!-- 确认密码 -->
        <el-form-item prop="confirmPassword">
          <el-input
            v-model="registerForm.confirmPassword"
            type="password"
            placeholder="请确认密码"
            :prefix-icon="Lock"
            show-password
            clearable
            class="custom-input"
            autocomplete="new-password"
            name="register-confirm-password"
          />
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            class="register-btn"
            :loading="loading"
            @click="handleRegister"
          >
            <span v-if="!loading">注 册</span>
            <span v-else>注册中...</span>
          </el-button>
        </el-form-item>
      </el-form>

      <!-- 返回登录 -->
      <div class="back-login">
        <span class="back-label">已有账号？</span>
        <router-link to="/login" class="back-link">返回登录</router-link>
      </div>
    </div>

    <!-- 底部版权 -->
    <div class="footer">
      <p>{{ APP_COPYRIGHT }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { User, Lock } from "@element-plus/icons-vue";
import axios from "axios";
import { APP_COPYRIGHT, APP_ICON, APP_NAME } from "@/branding";

const router = useRouter();
const registerFormRef = ref();
const loading = ref(false);

const registerForm = reactive({
  name: "",
  password: "",
  confirmPassword: "",
});

onMounted(() => {
  // 清空表单数据，防止浏览器自动填充
  registerForm.name = "";
  registerForm.password = "";
  registerForm.confirmPassword = "";
});

const validateConfirmPassword = (rule: any, value: string, callback: any) => {
  if (value !== registerForm.password) {
    callback(new Error("两次输入的密码不一致"));
  } else {
    callback();
  }
};

const rules = {
  name: [
    { required: true, message: "请输入用户名", trigger: "blur" },
    {
      min: 1,
      max: 10,
      message: "用户名长度在 1 到 10 个字符",
      trigger: "blur",
    },
  ],
  password: [
    { required: true, message: "请输入密码", trigger: "blur" },
    { min: 6, max: 20, message: "密码长度在 6 到 20 个字符", trigger: "blur" },
  ],
  confirmPassword: [
    { required: true, message: "请确认密码", trigger: "blur" },
    { validator: validateConfirmPassword, trigger: "blur" },
  ],
};

async function handleRegister() {
  if (!registerFormRef.value) return;
  await registerFormRef.value.validate(async (valid: boolean) => {
    if (!valid) return;
    loading.value = true;
    try {
      const res = await axios.post("/api/user/register", {
        name: registerForm.name,
        password: registerForm.password,
      });
      if (res.data.code === 200) {
        ElMessage.success("注册成功！");
        const registerData = res.data.data || {};
        const userInfo = registerData.userInfo;
        const token = registerData.token;
        if (!userInfo || !token) {
          ElMessage.error("注册响应缺少凭证信息");
          return;
        }
        sessionStorage.setItem("token", token);
        sessionStorage.setItem("userInfo", JSON.stringify(userInfo));
        router.push("/user");
      }
    } catch {
      /* handled by interceptor */
    } finally {
      loading.value = false;
    }
  });
}
</script>

<style scoped>
.register-container {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: url("/login.png") center/cover no-repeat;
  overflow: hidden;
  padding: 20px;
}

/* 注册卡片 */
.register-card {
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
  background: linear-gradient(135deg, #4f46e5 0%, #818cf8 100%);
  border-radius: 16px;
  color: white;
  box-shadow: 0 10px 25px -5px rgba(79, 70, 229, 0.4);
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
  font-size: 24px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 6px;
  letter-spacing: 1px;
}

.logo-subtitle {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
  letter-spacing: 0.5px;
}

/* 表单样式 */
.register-form {
  margin-bottom: 20px;
}

.register-form :deep(.el-form-item) {
  margin-bottom: 20px;
}

.register-form :deep(.el-input__wrapper) {
  padding: 10px 16px;
  border-radius: 12px;
  background: #f9fafb;
  box-shadow: none;
  border: 1px solid #e5e7eb;
  transition: all 0.2s ease;
}

.register-form :deep(.el-input__wrapper:hover) {
  border-color: #818cf8;
}

.register-form :deep(.el-input__wrapper.is-focus) {
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

/* 注册按钮 */
.register-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 2px;
  border-radius: 12px;
  background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%);
  border: none;
  box-shadow: 0 10px 25px -5px rgba(79, 70, 229, 0.4);
  transition: all 0.2s ease;
}

.register-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 20px 25px -5px rgba(79, 70, 229, 0.3);
}

.register-btn:active {
  transform: translateY(0);
}

/* 返回登录 */
.back-login {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;
}

.back-label {
  font-size: 13px;
  color: #6b7280;
}

.back-link {
  font-size: 13px;
  color: #4f46e5;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s ease;
}

.back-link:hover {
  color: #4338ca;
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
  color: #9ca3af;
  margin: 0;
}

/* 响应式 */
@media (max-width: 480px) {
  .register-card {
    padding: 32px 24px;
    margin: 0 16px;
  }

  .logo-title {
    font-size: 22px;
  }
}
</style>
