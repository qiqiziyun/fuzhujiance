import request from './request'

// 登录
export const login = (credentials) => {
  return new Promise((resolve, reject) => {
    // 模拟API调用
    setTimeout(() => {
      const users = JSON.parse(localStorage.getItem('users') || '[]')
      const user = users.find(u => 
        u.username === credentials.username && 
        u.password === credentials.password
      )
      
      if (user) {
        const token = 'mock_token_' + Date.now()
        resolve({
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            avatar: user.avatar || 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png'
          },
          token
        })
      } else {
        reject(new Error('用户名或密码错误'))
      }
    }, 500)
  })
}

// 注册
export const register = (userData) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const users = JSON.parse(localStorage.getItem('users') || '[]')
      
      // 检查用户名是否已存在
      if (users.some(u => u.username === userData.username)) {
        reject(new Error('用户名已存在'))
        return
      }
      
      // 检查邮箱是否已存在
      if (users.some(u => u.email === userData.email)) {
        reject(new Error('邮箱已被注册'))
        return
      }
      
      // 创建新用户
      const newUser = {
        id: Date.now(),
        username: userData.username,
        password: userData.password,
        email: userData.email,
        avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
        createdAt: new Date().toISOString()
      }
      
      users.push(newUser)
      localStorage.setItem('users', JSON.stringify(users))
      
      resolve({ message: '注册成功' })
    }, 500)
  })
}

// 更新个人资料
export const updateProfile = (profileData) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const users = JSON.parse(localStorage.getItem('users') || '[]')
      const currentUser = JSON.parse(localStorage.getItem('user'))
      
      const userIndex = users.findIndex(u => u.id === currentUser.id)
      if (userIndex !== -1) {
        users[userIndex] = { ...users[userIndex], ...profileData }
        localStorage.setItem('users', JSON.stringify(users))
        
        resolve({
          user: users[userIndex]
        })
      } else {
        reject(new Error('用户不存在'))
      }
    }, 500)
  })
}

// 更新头像
export const updateAvatar = (avatarFile) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // 模拟文件上传，实际项目中应该上传到服务器
      const reader = new FileReader()
      reader.onload = (e) => {
        const avatar = e.target.result
        
        const users = JSON.parse(localStorage.getItem('users') || '[]')
        const currentUser = JSON.parse(localStorage.getItem('user'))
        
        const userIndex = users.findIndex(u => u.id === currentUser.id)
        if (userIndex !== -1) {
          users[userIndex].avatar = avatar
          localStorage.setItem('users', JSON.stringify(users))
          
          resolve({ avatar })
        } else {
          reject(new Error('用户不存在'))
        }
      }
      reader.readAsDataURL(avatarFile)
    }, 500)
  })
}

// 重置密码
export const resetPassword = (passwordData) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const users = JSON.parse(localStorage.getItem('users') || '[]')
      const currentUser = JSON.parse(localStorage.getItem('user'))
      
      const userIndex = users.findIndex(u => u.id === currentUser.id)
      if (userIndex !== -1) {
        // 验证当前密码
        if (users[userIndex].password !== passwordData.currentPassword) {
          reject(new Error('当前密码错误'))
          return
        }
        
        users[userIndex].password = passwordData.newPassword
        localStorage.setItem('users', JSON.stringify(users))
        
        resolve({ message: '密码重置成功' })
      } else {
        reject(new Error('用户不存在'))
      }
    }, 500)
  })
}