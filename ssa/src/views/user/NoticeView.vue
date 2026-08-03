<template>
  <div>
    <el-card class="page-card">
      <template #header>
        <span class="card-title">公告信息</span>
      </template>

      <!-- 搜索栏 -->
      <el-form :model="queryForm" inline style="margin-bottom: 12px">
        <el-form-item label="关键字">
          <el-input
            v-model="queryForm.keyword"
            placeholder="搜索标题"
            clearable
            style="width: 220px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch"
            >查询</el-button
          >
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <div v-loading="loading" class="notice-grid">
        <el-card
          v-for="item in noticeList"
          :key="item.id"
          class="notice-card"
          @click="handleView(item)"
        >
          <el-image
            v-if="item.cover"
            :src="item.cover"
            class="notice-cover"
            fit="cover"
          />
          <div v-else class="notice-cover notice-cover-placeholder">
            <el-icon size="32" color="#c0c4cc"><Bell /></el-icon>
          </div>
          <div class="notice-body">
            <div class="notice-title">{{ item.title }}</div>
            <div class="notice-time">{{ item.createTime }}</div>
          </div>
        </el-card>
      </div>

      <el-empty
        v-if="!loading && noticeList.length === 0"
        description="暂无公告"
      />

      <!-- 分页 -->
      <div class="pagination-wrap">
        <el-pagination
          v-model:current-page="pageNum"
          v-model:page-size="pageSize"
          :page-sizes="[5, 10, 20]"
          :total="total"
          layout="total, sizes, prev, pager, next"
          @current-change="fetchList"
          @size-change="handleSizeChange"
        />
      </div>
    </el-card>

    <!-- 公告详情弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="currentNotice?.title"
      width="660px"
    >
      <el-image
        v-if="currentNotice?.cover"
        :src="currentNotice.cover"
        style="
          width: 100%;
          max-height: 200px;
          object-fit: cover;
          margin-bottom: 12px;
        "
      />
      <div class="notice-meta">发布时间：{{ currentNotice?.createTime }}</div>
      <el-divider />
      <div class="notice-content" v-html="currentNotice?.content" />
      <template #footer>
        <el-button @click="dialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { Search, Refresh, Bell } from "@element-plus/icons-vue";
import { getPage } from "@/utils/api";
import type { Announcement } from "@/types/api";

const BASE_URL = "/api";

interface Notice {
  id: number;
  title: string;
  cover?: string;
  content: string;
  createTime?: string;
}

const noticeList = ref<Notice[]>([]);
const loading = ref(false);
const pageNum = ref(1);
const pageSize = ref(10);
const total = ref(0);

const queryForm = reactive({
  keyword: "",
});

const dialogVisible = ref(false);
const currentNotice = ref<Notice | null>(null);

async function fetchList() {
  loading.value = true;
  try {
    const { list, total: t } = await getPage<Announcement>(
      "/announcement/public/page",
      {
        pageNum: pageNum.value,
        pageSize: pageSize.value,
        keyword: queryForm.keyword,
      },
    );
    noticeList.value = list;
    total.value = t;
  } catch {
    /* handled by interceptor */
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  pageNum.value = 1;
  fetchList();
}

function handleReset() {
  queryForm.keyword = "";
  pageNum.value = 1;
  fetchList();
}

function handleSizeChange(val: number) {
  pageSize.value = val;
  pageNum.value = 1;
  fetchList();
}

function handleView(row: Notice) {
  currentNotice.value = row;
  dialogVisible.value = true;
}

function handleRowClick(row: Notice) {
  handleView(row);
}

onMounted(() => {
  fetchList();
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
.notice-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}
.notice-card {
  cursor: pointer;
  transition: box-shadow 0.2s;
  padding: 0;
  overflow: hidden;
}
.notice-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}
.notice-cover {
  width: 100%;
  height: 140px;
  display: block;
}
.notice-cover-placeholder {
  background: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;
}
.notice-body {
  padding: 10px 12px;
}
.notice-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.notice-time {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}
.notice-meta {
  font-size: 13px;
  color: #909399;
}
.notice-content {
  line-height: 1.8;
  color: #303133;
  word-break: break-word;
}
.notice-content :deep(*) {
  box-sizing: border-box;
}
.notice-content :deep(h1),
.notice-content :deep(h2),
.notice-content :deep(h3),
.notice-content :deep(h4),
.notice-content :deep(h5),
.notice-content :deep(h6) {
  margin: 1em 0 0.6em;
  line-height: 1.35;
  font-weight: 700;
  color: #1f2937;
}
.notice-content :deep(h1) {
  font-size: 30px;
}
.notice-content :deep(h2) {
  font-size: 24px;
}
.notice-content :deep(h3) {
  font-size: 20px;
}
.notice-content :deep(h4) {
  font-size: 18px;
}
.notice-content :deep(h5) {
  font-size: 16px;
}
.notice-content :deep(h6) {
  font-size: 15px;
}
.notice-content :deep(p) {
  margin: 0 0 14px;
  line-height: 1.9;
}
.notice-content :deep(ul),
.notice-content :deep(ol) {
  margin: 0 0 16px;
  padding-left: 24px;
}
.notice-content :deep(li) {
  margin: 8px 0;
  line-height: 1.9;
}
.notice-content :deep(blockquote) {
  margin: 18px 0;
  padding: 14px 16px;
  border-left: 4px solid #93c5fd;
  background: #f8fafc;
  color: #475569;
}
.notice-content :deep(img) {
  display: block;
  max-width: 100%;
  height: auto;
  margin: 16px auto;
  border-radius: 10px;
}
.notice-content :deep(a) {
  color: #2563eb;
  text-decoration: none;
}
.notice-content :deep(a:hover) {
  text-decoration: underline;
}
.notice-content :deep(pre) {
  overflow-x: auto;
  margin: 16px 0;
  padding: 14px 16px;
  border-radius: 10px;
  background: #0f172a;
  color: #e2e8f0;
  line-height: 1.7;
}
.notice-content :deep(code) {
  padding: 2px 6px;
  border-radius: 6px;
  background: #f1f5f9;
  color: #0f172a;
  font-family: Consolas, "Courier New", monospace;
}
.notice-content :deep(pre code) {
  padding: 0;
  background: transparent;
  color: inherit;
}
.notice-content :deep(table) {
  width: 100%;
  margin: 16px 0;
  border-collapse: collapse;
}
.notice-content :deep(th),
.notice-content :deep(td) {
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  text-align: left;
}
.notice-content :deep(th) {
  background: #f8fafc;
  font-weight: 600;
}
.notice-content :deep(hr) {
  border: 0;
  border-top: 1px solid #e5e7eb;
  margin: 20px 0;
}
.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
