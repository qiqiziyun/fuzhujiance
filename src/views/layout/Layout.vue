<template>
  <div class="layout-container">
    <!-- 侧边栏 -->
    <aside class="sidebar" :class="{ collapsed: isCollapsed }">
      <div class="sidebar-header">
        <div class="logo">
          <el-icon class="logo-icon"><UserFilled /></el-icon>
          <span v-show="!isCollapsed" class="logo-text">监测系统</span>
        </div>
        <el-button
          class="collapse-btn"
          :icon="isCollapsed ? Expand : Fold"
          @click="toggleCollapse"
        />
      </div>
      
      <nav class="sidebar-nav">
        <el-menu
          :default-active="$route.path"
          :collapse="isCollapsed"
          :unique-opened="true"
          router
          class="sidebar-menu"
        >
          <el-menu-item index="/dashboard">
            <el-icon><Odometer /></el-icon>
            <span>仪表盘</span>
          </el-menu-item>
          
          <el-menu-item index="/dashboard/grip-strength">
            <el-icon><Connection /></el-icon>
            <span>握力展示</span>
          </el-menu-item>
          
          <el-menu-item index="/dashboard/posture-angle">
            <el-icon><Compass /></el-icon>
            <span>姿态角展示</span>
          </el-menu-item>
          
          <el-menu-item index="/dashboard/speed">
            <el-icon><Stopwatch /></el-icon>
            <span>速度展示</span>
          </el-menu-item>
          
          <el-menu-item index="/dashboard/gps">
            <el-icon><Location /></el-icon>
            <span>GPS位置</span>
          </el-menu-item>
          
          <el-sub-menu index="/dashboard/profile">
            <template #title>
              <el-icon><User /></el-icon>
              <span>个人中心</span>
            </template>
            <el-menu-item index="/dashboard/profile/edit">
              <el-icon><Document /></el-icon>
              <span>基本资料</span>
            </el-menu-item>
            <el-menu-item index="/dashboard/profile/avatar">
              <el-icon><Picture /></el-icon>
              <span>更换头像</span>
            </el-menu-item>
            <el-menu-item index="/dashboard/profile/password">
              <el-icon><Lock /></el-icon>
              <span>重置密码</span>
            </el-menu-item>
          </el-sub-menu>
        </el-menu>
      </nav>
      
      <div class="sidebar-footer">
        <el-button
          type="danger"
          :icon="SwitchButton"
          @click="handleLogout"
        >
          <span v-show="!isCollapsed">退出登录</span>
        </el-button>
      </div>
    </aside>
    
    <!-- 主内容区 -->
    <main class="main-content" :class="{ expanded: isCollapsed }">
      <header class="content-header">
        <div class="header-left">
          <h1 class="page-title">{{ pageTitle }}</h1>
        </div>
        <div class="header-right">
          <div class="user-info">
            <el-avatar
              :src="userStore.user?.avatar"
              :size="36"
              class="user-avatar"
            >
              <el-icon><User /></el-icon>
            </el-avatar>
            <span class="user-name">{{ userStore.user?.username }}</span>
          </div>
        </div>
      </header>
      
      <div class="content-body">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'
import {
  UserFilled,
  Expand,
  Fold,
  Odometer,
  Connection,
  Compass,
  Stopwatch,
  Location,
  User,
  Document,
  Picture,
  Lock,
  SwitchButton
} from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

// 侧边栏折叠状态
const isCollapsed = ref(false)

// 页面标题映射
const pageTitleMap = {
  '/dashboard': '仪表盘',
  '/grip-strength': '握力展示',
  '/posture-angle': '姿态角展示',
  '/speed': '速度展示',
  '/gps': 'GPS位置展示',
  '/profile/edit': '基本资料',
  '/profile/avatar': '更换头像',
  '/profile/password': '重置密码'
}

// 当前页面标题
const pageTitle = computed(() => {
  return pageTitleMap[route.path] || '监测系统'
})

// 切换侧边栏折叠状态
const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
}

// 处理退出登录
const handleLogout = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要退出登录吗？',
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    userStore.logout()
    ElMessage.success('已退出登录')
    router.push('/login')
  } catch {
    // 用户取消
  }
}
</script>

<style scoped>
.layout-container {
  display: flex;
  height: 100vh;
  background-color: #f5f7fa;
}

/* 侧边栏样式 */
.sidebar {
  width: 250px;
  background: #2c3e50;
  color: white;
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
  position: relative;
  z-index: 1000;
}

.sidebar.collapsed {
  width: 64px;
}

.sidebar-header {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  border-bottom: 1px solid #34495e;
  background: #34495e;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 18px;
  font-weight: 600;
}

.logo-icon {
  font-size: 24px;
  color: #3498db;
}

.logo-text {
  transition: opacity 0.3s ease;
}

.collapse-btn {
  background: transparent;
  border: none;
  color: white;
  padding: 8px;
}

.sidebar-nav {
  flex: 1;
  overflow-y: auto;
}

.sidebar-menu {
  border: none;
  background: transparent;
}

.sidebar-menu :deep(.el-menu-item),
.sidebar-menu :deep(.el-sub-menu__title) {
  color: #bdc3c7;
  border-bottom: 1px solid #34495e;
}

.sidebar-menu :deep(.el-menu-item:hover),
.sidebar-menu :deep(.el-sub-menu__title:hover) {
  background-color: #34495e;
  color: white;
}

.sidebar-menu :deep(.el-menu-item.is-active) {
  background-color: #3498db;
  color: white;
}

.sidebar-menu :deep(.el-sub-menu .el-menu-item) {
  background-color: #2c3e50;
  border-bottom: 1px solid #34495e;
}

.sidebar-menu :deep(.el-sub-menu .el-menu-item:hover) {
  background-color: #34495e;
}

.sidebar-menu :deep(.el-sub-menu .el-menu-item.is-active) {
  background-color: #3498db;
}

.sidebar-footer {
  padding: 16px;
  border-top: 1px solid #34495e;
}

.sidebar-footer .el-button {
  width: 100%;
}

/* 主内容区样式 */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  margin-left: 0;
  transition: margin-left 0.3s ease;
}

.content-header {
  height: 60px;
  background: white;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-name {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

.content-body {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    left: 0;
    top: 0;
    height: 100vh;
    z-index: 1000;
    transform: translateX(-100%);
    transition: transform 0.3s ease;
  }
  
  .sidebar.show {
    transform: translateX(0);
  }
  
  .main-content {
    margin-left: 0;
    width: 100%;
  }
  
  .content-header {
    padding: 0 16px;
  }
  
  .content-body {
    padding: 16px;
  }
}
</style>