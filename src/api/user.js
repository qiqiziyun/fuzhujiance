import { request } from './index'

// 用户信息管理API
export const userAPI = {
  // 获取用户基本信息
  getUserInfo() {
    return request.get('/user/info')
  },

  // 更新用户基本信息
  updateUserInfo(userInfo) {
    return request.put('/user/info', {
      realName: userInfo.realName,
      gender: userInfo.gender,
      birthday: userInfo.birthday,
      phone: userInfo.phone,
      email: userInfo.email,
      emergencyContact: userInfo.emergencyContact,
      emergencyPhone: userInfo.emergencyPhone,
      region: userInfo.region,
      address: userInfo.address,
      height: userInfo.height,
      weight: userInfo.weight,
      bloodType: userInfo.bloodType,
      allergies: userInfo.allergies,
      medicalHistory: userInfo.medicalHistory,
      bio: userInfo.bio
    })
  },

  // 更新用户头像
  updateAvatar(avatarFile) {
    const formData = new FormData()
    formData.append('avatar', avatarFile)
    return request.upload('/user/avatar', formData)
  },

  // 删除用户头像
  deleteAvatar() {
    return request.delete('/user/avatar')
  },

  // 获取预设头像列表
  getPresetAvatars() {
    return request.get('/user/preset-avatars')
  },

  // 设置预设头像
  setPresetAvatar(avatarId) {
    return request.post('/user/preset-avatar', {
      avatarId
    })
  },

  // 裁剪头像
  cropAvatar(cropData) {
    return request.post('/user/avatar/crop', {
      x: cropData.x,
      y: cropData.y,
      width: cropData.width,
      height: cropData.height,
      rotate: cropData.rotate || 0,
      scaleX: cropData.scaleX || 1,
      scaleY: cropData.scaleY || 1
    })
  },

  // 获取用户偏好设置
  getUserPreferences() {
    return request.get('/user/preferences')
  },

  // 更新用户偏好设置
  updateUserPreferences(preferences) {
    return request.put('/user/preferences', {
      language: preferences.language,
      timezone: preferences.timezone,
      theme: preferences.theme,
      notifications: preferences.notifications,
      privacy: preferences.privacy,
      display: preferences.display
    })
  },

  // 获取用户统计信息
  getUserStats() {
    return request.get('/user/stats')
  },

  // 获取用户活动记录
  getUserActivities(params = {}) {
    return request.get('/user/activities', {
      page: params.page || 1,
      pageSize: params.pageSize || 20,
      type: params.type,
      startDate: params.startDate,
      endDate: params.endDate
    })
  },

  // 记录用户活动
  recordActivity(activity) {
    return request.post('/user/activities', {
      type: activity.type,
      description: activity.description,
      metadata: activity.metadata,
      timestamp: activity.timestamp || new Date().toISOString()
    })
  },

  // 获取用户设备列表
  getUserDevices() {
    return request.get('/user/devices')
  },

  // 添加用户设备
  addUserDevice(device) {
    return request.post('/user/devices', {
      deviceId: device.deviceId,
      deviceName: device.deviceName,
      deviceType: device.deviceType,
      description: device.description
    })
  },

  // 更新用户设备
  updateUserDevice(deviceId, device) {
    return request.put(`/user/devices/${deviceId}`, {
      deviceName: device.deviceName,
      description: device.description,
      isActive: device.isActive
    })
  },

  // 删除用户设备
  deleteUserDevice(deviceId) {
    return request.delete(`/user/devices/${deviceId}`)
  },

  // 获取用户通知设置
  getNotificationSettings() {
    return request.get('/user/notification-settings')
  },

  // 更新用户通知设置
  updateNotificationSettings(settings) {
    return request.put('/user/notification-settings', settings)
  },

  // 获取用户隐私设置
  getPrivacySettings() {
    return request.get('/user/privacy-settings')
  },

  // 更新用户隐私设置
  updatePrivacySettings(settings) {
    return request.put('/user/privacy-settings', settings)
  }
}

// 用户健康档案API
export const healthProfileAPI = {
  // 获取健康档案
  getHealthProfile() {
    return request.get('/user/health-profile')
  },

  // 更新健康档案
  updateHealthProfile(profile) {
    return request.put('/user/health-profile', {
      height: profile.height,
      weight: profile.weight,
      bloodType: profile.bloodType,
      bloodPressure: profile.bloodPressure,
      heartRate: profile.heartRate,
      allergies: profile.allergies,
      medications: profile.medications,
      medicalHistory: profile.medicalHistory,
      emergencyContact: profile.emergencyContact,
      doctor: profile.doctor,
      lastCheckup: profile.lastCheckup
    })
  },

  // 添加健康记录
  addHealthRecord(record) {
    return request.post('/user/health-records', {
      type: record.type,
      value: record.value,
      unit: record.unit,
      notes: record.notes,
      recordDate: record.recordDate || new Date().toISOString()
    })
  },

  // 获取健康记录
  getHealthRecords(params = {}) {
    return request.get('/user/health-records', {
      type: params.type,
      startDate: params.startDate,
      endDate: params.endDate,
      page: params.page || 1,
      pageSize: params.pageSize || 50
    })
  },

  // 删除健康记录
  deleteHealthRecord(recordId) {
    return request.delete(`/user/health-records/${recordId}`)
  },

  // 获取健康趋势
  getHealthTrends(type, timeRange = '30d') {
    return request.get('/user/health-trends', {
      type,
      timeRange
    })
  },

  // 获取健康建议
  getHealthRecommendations() {
    return request.get('/user/health-recommendations')
  },

  // 生成健康报告
  generateHealthReport(params = {}) {
    return request.post('/user/health-report', {
      startDate: params.startDate,
      endDate: params.endDate,
      includeCharts: params.includeCharts || true,
      format: params.format || 'pdf'
    })
  }
}

// 用户数据管理API
export const userDataAPI = {
  // 获取数据概览
  getDataOverview() {
    return request.get('/user/data/overview')
  },

  // 导出用户数据
  exportUserData(params = {}) {
    return request.download('/user/data/export', {
      dataTypes: params.dataTypes || ['all'],
      format: params.format || 'json',
      startDate: params.startDate,
      endDate: params.endDate
    })
  },

  // 导入用户数据
  importUserData(dataFile, dataType) {
    const formData = new FormData()
    formData.append('data', dataFile)
    formData.append('dataType', dataType)
    return request.upload('/user/data/import', formData)
  },

  // 清除用户数据
  clearUserData(dataTypes, confirmPassword) {
    return request.post('/user/data/clear', {
      dataTypes,
      password: confirmPassword
    })
  },

  // 获取数据存储统计
  getStorageStats() {
    return request.get('/user/data/storage-stats')
  },

  // 数据备份
  backupData(backupConfig) {
    return request.post('/user/data/backup', backupConfig)
  },

  // 获取备份列表
  getBackupList() {
    return request.get('/user/data/backups')
  },

  // 恢复数据
  restoreData(backupId, confirmPassword) {
    return request.post('/user/data/restore', {
      backupId,
      password: confirmPassword
    })
  },

  // 删除备份
  deleteBackup(backupId) {
    return request.delete(`/user/data/backups/${backupId}`)
  }
}

// 用户反馈API
export const feedbackAPI = {
  // 提交反馈
  submitFeedback(feedback) {
    return request.post('/user/feedback', {
      type: feedback.type,
      title: feedback.title,
      content: feedback.content,
      category: feedback.category,
      priority: feedback.priority,
      attachments: feedback.attachments
    })
  },

  // 获取反馈列表
  getFeedbackList(params = {}) {
    return request.get('/user/feedback', {
      page: params.page || 1,
      pageSize: params.pageSize || 10,
      status: params.status,
      type: params.type
    })
  },

  // 获取反馈详情
  getFeedbackDetail(feedbackId) {
    return request.get(`/user/feedback/${feedbackId}`)
  },

  // 更新反馈
  updateFeedback(feedbackId, updates) {
    return request.put(`/user/feedback/${feedbackId}`, updates)
  },

  // 删除反馈
  deleteFeedback(feedbackId) {
    return request.delete(`/user/feedback/${feedbackId}`)
  },

  // 上传反馈附件
  uploadFeedbackAttachment(file) {
    const formData = new FormData()
    formData.append('attachment', file)
    return request.upload('/user/feedback/attachment', formData)
  }
}

// 用户订阅API
export const subscriptionAPI = {
  // 获取订阅信息
  getSubscriptionInfo() {
    return request.get('/user/subscription')
  },

  // 获取订阅计划
  getSubscriptionPlans() {
    return request.get('/user/subscription/plans')
  },

  // 订阅计划
  subscribe(planId, paymentMethod) {
    return request.post('/user/subscription/subscribe', {
      planId,
      paymentMethod
    })
  },

  // 取消订阅
  cancelSubscription(reason) {
    return request.post('/user/subscription/cancel', {
      reason
    })
  },

  // 更改订阅计划
  changeSubscription(newPlanId) {
    return request.post('/user/subscription/change', {
      planId: newPlanId
    })
  },

  // 获取账单历史
  getBillingHistory(params = {}) {
    return request.get('/user/subscription/billing', {
      page: params.page || 1,
      pageSize: params.pageSize || 10,
      startDate: params.startDate,
      endDate: params.endDate
    })
  },

  // 下载发票
  downloadInvoice(invoiceId) {
    return request.download(`/user/subscription/invoice/${invoiceId}`)
  },

  // 更新支付方式
  updatePaymentMethod(paymentMethod) {
    return request.put('/user/subscription/payment-method', paymentMethod)
  }
}

// 用户社交API
export const socialAPI = {
  // 获取好友列表
  getFriends(params = {}) {
    return request.get('/user/friends', {
      page: params.page || 1,
      pageSize: params.pageSize || 20,
      status: params.status
    })
  },

  // 搜索用户
  searchUsers(keyword, params = {}) {
    return request.get('/user/search', {
      keyword,
      page: params.page || 1,
      pageSize: params.pageSize || 10
    })
  },

  // 发送好友请求
  sendFriendRequest(userId, message) {
    return request.post('/user/friend-request', {
      userId,
      message
    })
  },

  // 处理好友请求
  handleFriendRequest(requestId, action, message) {
    return request.post('/user/friend-request/handle', {
      requestId,
      action, // 'accept' | 'reject'
      message
    })
  },

  // 删除好友
  removeFriend(userId) {
    return request.delete(`/user/friends/${userId}`)
  },

  // 获取好友请求列表
  getFriendRequests(type = 'received') {
    return request.get('/user/friend-requests', {
      type // 'sent' | 'received'
    })
  },

  // 分享数据给好友
  shareDataWithFriend(userId, dataType, timeRange) {
    return request.post('/user/share-data', {
      userId,
      dataType,
      timeRange
    })
  },

  // 获取分享记录
  getShareHistory(params = {}) {
    return request.get('/user/share-history', {
      page: params.page || 1,
      pageSize: params.pageSize || 10,
      type: params.type
    })
  }
}

// 导出所有用户相关API
export default {
  user: userAPI,
  healthProfile: healthProfileAPI,
  userData: userDataAPI,
  feedback: feedbackAPI,
  subscription: subscriptionAPI,
  social: socialAPI
}