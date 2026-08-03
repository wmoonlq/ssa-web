<template>
  <router-view />
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #app {
  height: 100%;
  overflow: hidden;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC',
    'Hiragino Sans GB', 'Microsoft YaHei', '微软雅黑', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: var(--text-primary);
  background: var(--bg-page);
}

/* 滚动条美化 */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgba(14, 116, 144, 0.2);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(14, 116, 144, 0.35);
}

/* Element Plus 全局覆盖 */
.el-button--primary {
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
  border: none;
  box-shadow: 0 4px 12px rgba(8, 145, 178, 0.25);
  transition: all 0.25s ease;
}

.el-button--primary:hover {
  background: linear-gradient(135deg, var(--primary-dark) 0%, #155E75 100%);
  box-shadow: 0 6px 16px rgba(8, 145, 178, 0.35);
  transform: translateY(-1px);
}

.el-button--primary:active {
  transform: translateY(0);
}

.el-button--success {
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.25);
}

.el-button--danger {
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);
}

.el-button--warning {
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.2);
}

.el-input__wrapper {
  border-radius: var(--radius-sm) !important;
  transition: all 0.25s ease !important;
}

.el-input__wrapper:hover {
  box-shadow: 0 0 0 1px rgba(14, 116, 144, 0.3) inset !important;
}

.el-input__wrapper.is-focus {
  box-shadow: 0 0 0 1px var(--primary) inset, 0 0 0 3px rgba(8, 145, 178, 0.1) !important;
}

.el-card {
  border-radius: var(--radius-lg) !important;
  border: 1px solid rgba(14, 116, 144, 0.08) !important;
  box-shadow: var(--shadow-md) !important;
  transition: all 0.25s ease !important;
}

.el-card:hover {
  box-shadow: var(--shadow-lg) !important;
}

.el-dialog {
  border-radius: var(--radius-lg) !important;
}

.el-table {
  border-radius: var(--radius-md) !important;
  overflow: hidden;
}

.el-table th.el-table__cell {
  background: #F8FAFC !important;
  color: var(--text-primary) !important;
  font-weight: 600;
  font-size: 13px;
}

.el-table tr:hover > td.el-table__cell {
  background: #F0FDFA !important;
}

.el-tag {
  border-radius: 6px !important;
  font-weight: 500 !important;
}

.el-pagination {
  --el-pagination-button-bg-color: #FFFFFF;
  --el-pagination-hover-color: var(--primary);
}

/* 链接通用样式 */
a {
  color: var(--primary);
  text-decoration: none;
  transition: color 0.2s ease;
}

a:hover {
  color: var(--primary-dark);
}

/* 选中文字颜色 */
::selection {
  background: rgba(8, 145, 178, 0.2);
  color: var(--text-primary);
}
</style>
