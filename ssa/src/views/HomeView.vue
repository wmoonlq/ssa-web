<template>
  <div class="redirect-container">
    <el-icon :size="40" class="loading-icon"><Loading /></el-icon>
    <p>正在跳转...</p>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { useRouter } from "vue-router";
import { Loading } from "@element-plus/icons-vue";

const router = useRouter();

onMounted(() => {
  const stored = sessionStorage.getItem("userInfo");
  if (!stored) {
    router.push("/login");
    return;
  }
  const userInfo = JSON.parse(stored);
  if (userInfo.role === "1") {
    router.push("/admin");
  } else {
    router.push("/user");
  }
});
</script>

<style scoped>
.redirect-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
  color: #909399;
  gap: 12px;
}

.loading-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
