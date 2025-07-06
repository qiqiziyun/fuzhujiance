// 全局变量
let currentUser = null;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // 检查是否已登录
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showMainPage();
    } else {
        showAuthPage();
    }
    
    // 绑定事件监听器
    bindEventListeners();
}

function bindEventListeners() {
    // 登录表单提交
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    
    // 注册表单提交
    document.getElementById('register-form').addEventListener('submit', handleRegister);
    
    // 侧边栏菜单点击
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', handleMenuClick);
    });
    
    // 实时验证
    document.getElementById('reg-username').addEventListener('input', validateUsername);
    document.getElementById('reg-password').addEventListener('input', validatePassword);
    document.getElementById('reg-confirm-password').addEventListener('input', validateConfirmPassword);
    document.getElementById('reg-email').addEventListener('input', validateEmail);
}

// 显示登录表单
function showLogin() {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));
    
    event.target.classList.add('active');
    document.getElementById('login-form').classList.add('active');
}

// 显示注册表单
function showRegister() {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));
    
    event.target.classList.add('active');
    document.getElementById('register-form').classList.add('active');
}

// 处理登录
function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    
    // 清除之前的错误信息
    clearErrors(['login-username-error', 'login-password-error']);
    
    // 基本验证
    if (!username) {
        showError('login-username-error', '请输入用户名');
        return;
    }
    
    if (!password) {
        showError('login-password-error', '请输入密码');
        return;
    }
    
    // 从本地存储获取用户信息
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
        currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        showMainPage();
    } else {
        showError('login-password-error', '用户名或密码错误');
    }
}

// 处理注册
function handleRegister(e) {
    e.preventDefault();
    
    const username = document.getElementById('reg-username').value;
    const password = document.getElementById('reg-password').value;
    const confirmPassword = document.getElementById('reg-confirm-password').value;
    const email = document.getElementById('reg-email').value;
    
    // 验证所有字段
    if (!validateAllFields(username, password, confirmPassword, email)) {
        return;
    }
    
    // 检查用户名是否已存在
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    if (users.some(u => u.username === username)) {
        showError('reg-username-error', '用户名已存在');
        return;
    }
    
    // 检查邮箱是否已存在
    if (users.some(u => u.email === email)) {
        showError('reg-email-error', '邮箱已被注册');
        return;
    }
    
    // 创建新用户
    const newUser = {
        id: Date.now(),
        username,
        password,
        email,
        avatar: 'https://via.placeholder.com/100',
        createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    
    alert('注册成功！请登录');
    showLogin();
}

// 验证用户名
function validateUsername() {
    const username = document.getElementById('reg-username').value;
    const regex = /^[a-zA-Z0-9_]{4,20}$/;
    
    if (!username) {
        showError('reg-username-error', '请输入用户名');
        return false;
    }
    
    if (!regex.test(username)) {
        showError('reg-username-error', '用户名长度4-20位，只能包含字母、数字和下划线');
        return false;
    }
    
    clearErrors(['reg-username-error']);
    return true;
}

// 验证密码
function validatePassword() {
    const password = document.getElementById('reg-password').value;
    const regex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,20}$/;
    
    if (!password) {
        showError('reg-password-error', '请输入密码');
        return false;
    }
    
    if (!regex.test(password)) {
        showError('reg-password-error', '密码长度8-20位，必须包含字母和数字');
        return false;
    }
    
    clearErrors(['reg-password-error']);
    return true;
}

// 验证确认密码
function validateConfirmPassword() {
    const password = document.getElementById('reg-password').value;
    const confirmPassword = document.getElementById('reg-confirm-password').value;
    
    if (!confirmPassword) {
        showError('reg-confirm-error', '请确认密码');
        return false;
    }
    
    if (password !== confirmPassword) {
        showError('reg-confirm-error', '两次输入的密码不一致');
        return false;
    }
    
    clearErrors(['reg-confirm-error']);
    return true;
}

// 验证邮箱
function validateEmail() {
    const email = document.getElementById('reg-email').value;
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!email) {
        showError('reg-email-error', '请输入邮箱');
        return false;
    }
    
    if (!regex.test(email)) {
        showError('reg-email-error', '请输入有效的邮箱地址');
        return false;
    }
    
    clearErrors(['reg-email-error']);
    return true;
}

// 验证所有字段
function validateAllFields(username, password, confirmPassword, email) {
    const isUsernameValid = validateUsername();
    const isPasswordValid = validatePassword();
    const isConfirmPasswordValid = validateConfirmPassword();
    const isEmailValid = validateEmail();
    
    return isUsernameValid && isPasswordValid && isConfirmPasswordValid && isEmailValid;
}

// 显示错误信息
function showError(elementId, message) {
    document.getElementById(elementId).textContent = message;
}

// 清除错误信息
function clearErrors(elementIds) {
    elementIds.forEach(id => {
        document.getElementById(id).textContent = '';
    });
}

// 显示认证页面
function showAuthPage() {
    document.getElementById('auth-container').classList.remove('hidden');
    document.getElementById('main-container').classList.add('hidden');
}

// 显示主页面
function showMainPage() {
    document.getElementById('auth-container').classList.add('hidden');
    document.getElementById('main-container').classList.remove('hidden');
    
    // 更新用户信息显示
    document.getElementById('user-name').textContent = currentUser.username;
    document.getElementById('user-avatar').src = currentUser.avatar;
    
    // 默认显示仪表盘
    showDashboard();
}

// 处理菜单点击
function handleMenuClick(e) {
    e.preventDefault();
    
    // 更新菜单状态
    document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));
    e.target.classList.add('active');
    
    // 根据href属性显示对应内容
    const href = e.target.getAttribute('href');
    switch(href) {
        case '#dashboard':
            showDashboard();
            break;
        case '#monitoring':
            showMonitoring();
            break;
        case '#history':
            showHistory();
            break;
        case '#alerts':
            showAlerts();
            break;
        case '#profile':
            showProfile();
            break;
    }
}

// 显示仪表盘
function showDashboard() {
    document.getElementById('page-title').textContent = '仪表盘';
    document.getElementById('content-body').innerHTML = `
        <div class="dashboard-grid">
            <div class="dashboard-card">
                <h3><i class="fas fa-wheelchair"></i> 设备状态</h3>
                <p class="status-text">正常运行</p>
                <div class="status-indicator online"></div>
            </div>
            <div class="dashboard-card">
                <h3><i class="fas fa-battery-three-quarters"></i> 电池电量</h3>
                <p class="battery-level">85%</p>
                <div class="battery-bar"><div class="battery-fill" style="width: 85%"></div></div>
            </div>
            <div class="dashboard-card">
                <h3><i class="fas fa-route"></i> 今日行程</h3>
                <p class="distance">2.3 公里</p>
                <small>步行时间: 45分钟</small>
            </div>
            <div class="dashboard-card">
                <h3><i class="fas fa-exclamation-triangle"></i> 告警信息</h3>
                <p class="alert-count">0 条新告警</p>
                <small>系统运行正常</small>
            </div>
        </div>
    `;
    
    // 添加仪表盘样式
    addDashboardStyles();
}

// 显示实时监测
function showMonitoring() {
    document.getElementById('page-title').textContent = '实时监测';
    document.getElementById('content-body').innerHTML = `
        <div class="monitoring-container">
            <h3>实时监测数据</h3>
            <p>此功能正在开发中...</p>
        </div>
    `;
}

// 显示历史记录
function showHistory() {
    document.getElementById('page-title').textContent = '历史记录';
    document.getElementById('content-body').innerHTML = `
        <div class="history-container">
            <h3>历史记录</h3>
            <p>此功能正在开发中...</p>
        </div>
    `;
}

// 显示告警信息
function showAlerts() {
    document.getElementById('page-title').textContent = '告警信息';
    document.getElementById('content-body').innerHTML = `
        <div class="alerts-container">
            <h3>告警信息</h3>
            <p>暂无告警信息</p>
        </div>
    `;
}

// 显示个人中心
function showProfile() {
    document.getElementById('page-title').textContent = '个人中心';
    document.getElementById('content-body').innerHTML = `
        <div class="profile-container">
            <!-- 个人信息卡片 -->
            <div class="profile-card">
                <div class="profile-header">
                    <img src="${currentUser.avatar}" alt="头像" class="profile-avatar" id="profile-avatar">
                    <h2 class="profile-name">${currentUser.username}</h2>
                    <p class="profile-email">${currentUser.email}</p>
                </div>
            </div>
            
            <!-- 基本资料 -->
            <div class="profile-card">
                <div class="profile-section">
                    <h3 class="section-title">基本资料</h3>
                    <form id="profile-form">
                        <div class="form-row">
                            <div class="form-col">
                                <label>用户名</label>
                                <input type="text" value="${currentUser.username}" readonly>
                            </div>
                            <div class="form-col">
                                <label>邮箱</label>
                                <input type="email" id="profile-email" value="${currentUser.email}">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-col">
                                <label>注册时间</label>
                                <input type="text" value="${new Date(currentUser.createdAt).toLocaleDateString()}" readonly>
                            </div>
                        </div>
                        <button type="submit" class="btn btn-success">保存修改</button>
                    </form>
                </div>
            </div>
            
            <!-- 更换头像 -->
            <div class="profile-card">
                <div class="profile-section">
                    <h3 class="section-title">更换头像</h3>
                    <div class="avatar-upload">
                        <img src="${currentUser.avatar}" alt="头像预览" class="avatar-preview" id="avatar-preview">
                        <input type="file" id="avatar-input" class="file-input" accept="image/*">
                        <label for="avatar-input" class="upload-btn">选择头像</label>
                        <button type="button" class="btn" onclick="updateAvatar()">更新头像</button>
                    </div>
                </div>
            </div>
            
            <!-- 重置密码 -->
            <div class="profile-card">
                <div class="profile-section">
                    <h3 class="section-title">重置密码</h3>
                    <form id="password-form">
                        <div class="form-group">
                            <label>当前密码</label>
                            <input type="password" id="current-password" required>
                            <span class="error-msg" id="current-password-error"></span>
                        </div>
                        <div class="form-group">
                            <label>新密码</label>
                            <input type="password" id="new-password" required>
                            <span class="help-text">密码长度8-20位，必须包含字母和数字</span>
                            <span class="error-msg" id="new-password-error"></span>
                        </div>
                        <div class="form-group">
                            <label>确认新密码</label>
                            <input type="password" id="confirm-new-password" required>
                            <span class="error-msg" id="confirm-new-password-error"></span>
                        </div>
                        <button type="submit" class="btn btn-danger">重置密码</button>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    // 绑定个人中心事件
    bindProfileEvents();
}

// 绑定个人中心事件
function bindProfileEvents() {
    // 基本资料表单
    document.getElementById('profile-form').addEventListener('submit', updateProfile);
    
    // 密码重置表单
    document.getElementById('password-form').addEventListener('submit', resetPassword);
    
    // 头像文件选择
    document.getElementById('avatar-input').addEventListener('change', previewAvatar);
}

// 更新个人资料
function updateProfile(e) {
    e.preventDefault();
    
    const newEmail = document.getElementById('profile-email').value;
    
    // 验证邮箱
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
        alert('请输入有效的邮箱地址');
        return;
    }
    
    // 更新用户信息
    currentUser.email = newEmail;
    updateUserInStorage();
    
    alert('资料更新成功！');
}

// 预览头像
function previewAvatar() {
    const file = document.getElementById('avatar-input').files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('avatar-preview').src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

// 更新头像
function updateAvatar() {
    const file = document.getElementById('avatar-input').files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            currentUser.avatar = e.target.result;
            updateUserInStorage();
            
            // 更新页面中的头像显示
            document.getElementById('user-avatar').src = currentUser.avatar;
            document.getElementById('profile-avatar').src = currentUser.avatar;
            
            alert('头像更新成功！');
        };
        reader.readAsDataURL(file);
    } else {
        alert('请先选择头像文件');
    }
}

// 重置密码
function resetPassword(e) {
    e.preventDefault();
    
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmNewPassword = document.getElementById('confirm-new-password').value;
    
    // 清除错误信息
    clearErrors(['current-password-error', 'new-password-error', 'confirm-new-password-error']);
    
    // 验证当前密码
    if (currentPassword !== currentUser.password) {
        showError('current-password-error', '当前密码错误');
        return;
    }
    
    // 验证新密码
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,20}$/;
    if (!passwordRegex.test(newPassword)) {
        showError('new-password-error', '密码长度8-20位，必须包含字母和数字');
        return;
    }
    
    // 验证确认密码
    if (newPassword !== confirmNewPassword) {
        showError('confirm-new-password-error', '两次输入的密码不一致');
        return;
    }
    
    // 更新密码
    currentUser.password = newPassword;
    updateUserInStorage();
    
    // 清空表单
    document.getElementById('password-form').reset();
    
    alert('密码重置成功！');
}

// 更新本地存储中的用户信息
function updateUserInStorage() {
    // 更新当前用户
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    // 更新用户列表
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const userIndex = users.findIndex(u => u.id === currentUser.id);
    if (userIndex !== -1) {
        users[userIndex] = currentUser;
        localStorage.setItem('users', JSON.stringify(users));
    }
}

// 添加仪表盘样式
function addDashboardStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .dashboard-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }
        
        .dashboard-card {
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            text-align: center;
        }
        
        .dashboard-card h3 {
            color: #2c3e50;
            margin-bottom: 15px;
        }
        
        .dashboard-card i {
            margin-right: 8px;
            color: #3498db;
        }
        
        .status-text {
            font-size: 18px;
            color: #27ae60;
            font-weight: bold;
        }
        
        .battery-level {
            font-size: 24px;
            color: #f39c12;
            font-weight: bold;
        }
        
        .battery-bar {
            width: 100%;
            height: 10px;
            background: #ecf0f1;
            border-radius: 5px;
            margin-top: 10px;
            overflow: hidden;
        }
        
        .battery-fill {
            height: 100%;
            background: linear-gradient(90deg, #27ae60, #f39c12);
            transition: width 0.3s ease;
        }
        
        .distance {
            font-size: 20px;
            color: #3498db;
            font-weight: bold;
        }
        
        .alert-count {
            font-size: 18px;
            color: #27ae60;
            font-weight: bold;
        }
        
        .status-indicator {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin: 10px auto;
        }
        
        .status-indicator.online {
            background: #27ae60;
            box-shadow: 0 0 10px rgba(39, 174, 96, 0.5);
        }
    `;
    document.head.appendChild(style);
}

// 退出登录
function logout() {
    localStorage.removeItem('currentUser');
    currentUser = null;
    showAuthPage();
    
    // 重置表单
    document.getElementById('login-form').reset();
    document.getElementById('register-form').reset();
    clearErrors(['login-username-error', 'login-password-error']);
}