# data-testid 属性添加进度文档

## 概述

本文档记录前端 Vue 组件中 `data-testid` 属性的添加进度，与测试代码中的 `utils/selectors.js` 定义保持一致。

## 添加原则

1. **使用 kebab-case 命名**: `data-testid="my-component"`
2. **使用描述性名称**: 能清楚标识元素用途
3. **保持一致性**: 与测试选择器定义匹配
4. **避免动态值**: 静态标识符，不含变化的数据

## 已完成的组件

### 1. 登录相关 ✅

#### `src/pages/login/login.vue`
- ✅ `data-testid="login-welcome-page"` - 登录页面容器
- ✅ `data-testid="login-welcome-title"` - 标题元素
- ✅ `data-testid="wechat-login-button"` - 微信登录按钮
- ✅ `data-testid="phone-login-button"` - 手机号登录按钮

#### `src/pages/phone-login/phone-login.vue`
- ✅ `data-testid="tab-register"` - 注册标签
- ✅ `data-testid="tab-code-login"` - 验证码登录标签
- ✅ `data-testid="tab-password-login"` - 密码登录标签
- ✅ `data-testid="phone-input"` - 手机号输入框
- ✅ `data-testid="code-input"` - 验证码输入框
- ✅ `data-testid="get-code-button"` - 获取验证码按钮
- ✅ `data-testid="password-input"` - 密码输入框
- ✅ `data-testid="agreement-checkbox"` - 用户协议复选框
- ✅ `data-testid="login-submit-button"` - 登录/注册提交按钮

### 2. 个人中心相关 ✅

#### `src/pages/profile/profile.vue`
- ✅ `data-testid="profile-page"` - 个人中心页面容器
- ✅ `data-testid="user-info-section"` - 用户信息区域
- ✅ `:data-testid="`logout-button"`"` - 退出登录按钮
- ✅ `:data-testid="`menu-社区列表"`"` - 社区列表菜单项（动态）

### 3. 社区管理相关 ✅

#### `src/pages/community-manage/community-manage.vue`
- ✅ `data-testid="community-list-page"` - 社区列表页面容器（NEW）
- ✅ `data-testid="community-list-title"` - 社区列表标题
- ✅ `:data-testid="`community-item-${item.name}`"` - 社区列表项（动态）
- ✅ `data-testid="add-community-button"` - 添加社区按钮

#### `src/pages/community-form/community-form.vue`
- ✅ `data-testid="create-community-page"` - 创建社区页面容器
- ✅ `data-testid="community-name-input"` - 社区名称输入框
- ✅ `data-testid="location-select-button"` - 位置选择按钮
- ✅ `data-testid="create-community-submit-button"` - 提交按钮
- ✅ `data-testid="create-community-cancel-button"` - 取消按钮

### 4. 首页相关 ✅

#### `src/pages/home-solo/home-solo.vue`
- ✅ `data-testid="home-page"` - 首页容器
- ✅ `data-testid="home-role-checkin"` - 打卡角色标签
- ✅ `data-testid="home-role-supervisor"` - 监护角色标签
- ✅ `data-testid="one-click-help-button"` - 一键求助按钮
- ✅ `data-testid="view-rules-button"` - 查看规则按钮（NEW）
- ✅ `data-testid="close-reason-input"` - 关闭原因输入框
- ✅ `data-testid="close-event-cancel-button"` - 关闭事件取消按钮
- ✅ `data-testid="close-event-submit-button"` - 关闭事件确认按钮

#### `src/pages/home-community/home-community.vue`
- ✅ `data-testid="home-community-page"` - 社区首页容器

### 5. 事件管理相关 ✅

事件相关的 data-testid 已在 `home-solo.vue` 中完成。

### 6. 打卡规则相关 ✅

#### `src/pages/rule-setting/rule-setting.vue`
- ✅ `data-testid="rule-list-page"` - 规则列表页面
- ✅ `data-testid="rule-list-title"` - 列表标题
- ✅ `:data-testid="`rule-item-${rule.rule_name}`"` - 规则项（动态）
- ✅ `data-testid="rule-edit-button"` - 编辑按钮
- ✅ `data-testid="rule-delete-button"` - 删除按钮
- ✅ `data-testid="rule-invite-button"` - 邀请按钮
- ✅ `data-testid="add-personal-rule-button"` - 添加个人规则按钮

#### `src/pages/checkin-list/checkin-list.vue`
- ✅ `data-testid="checkin-home-page"` - 打卡首页容器
- ✅ `data-testid="today-rules-list"` - 今日规则列表
- ✅ `data-testid="checkin-button"` - 打卡按钮

#### `src/pages/add-rule/add-rule.vue`
- ✅ `data-testid="rule-form-page"` - 规则表单页面
- ✅ `data-testid="rule-name-input"` - 规则名称输入框
- ✅ `data-testid="rule-submit-button"` - 提交按钮

## 完成状态总结

✅ **所有主要组件已完成 data-testid 添加**

已完成组件类别：
1. 登录相关（login, phone-login）
2. 个人中心（profile）
3. 社区管理（community-manage, community-form）
4. 首页（home-solo, home-community）
5. 事件管理（home-solo 中的事件处理）
6. 打卡规则（rule-setting, checkin-list, add-rule）

## 待处理文件列表

1. ~~`src/pages/home-solo/home-solo.vue`~~ - ✅ 已完成
2. ~~`src/pages/home-community/home-community.vue`~~ - ✅ 已完成
3. ~~`src/pages/rule-setting/rule-setting.vue`~~ - ✅ 已完成
4. ~~`src/pages/checkin-list/checkin-list.vue`~~ - ✅ 已完成
5. ~~`src/pages/add-rule/add-rule.vue`~~ - ✅ 已完成

## 注意事项

1. **动态值处理**: 对于列表项等动态内容，使用模板字符串格式
   ```vue
   :data-testid="`community-item-${item.name}`"
   ```

2. **测试覆盖**: 确保 testId 与测试代码中的选择器完全匹配

3. **性能影响**: data-testid 属性对性能影响极小，可以大量添加

4. **维护性**: 保持与 `tests/e2e-playwright/utils/selectors.js` 同步更新

## 验证方法

添加 data-testid 后，可以运行以下命令验证：
```bash
npm run test:playwright
```

如果测试通过，说明 data-testid 添加正确。
