# E2E 单个测试用例运行指南

## 概述

`make e2e-single` 命令允许您运行指定的 E2E 测试用例,而不是运行所有测试。这对于开发和调试特定功能非常有用。

## 基本用法

### 运行指定的测试文件

```bash
make e2e-single TEST=supervision-qrcode.spec.js
```

这将运行 `supervision-qrcode.spec.js` 文件中的所有测试用例。

### 运行指定文件中的特定测试用例

```bash
make e2e-single TEST=supervision-qrcode.spec.js:10
```

这将运行 `supervision-qrcode.spec.js` 文件中第 10 行的测试用例。

### 使用调试模式运行

```bash
make e2e-single TEST=supervision-qrcode.spec.js MODE=--debug
```

这将使用 Playwright 的调试模式运行测试,可以逐步执行并检查页面状态。

### 使用 UI 模式运行

```bash
make e2e-single TEST=supervision-qrcode.spec.js MODE=--ui
```

这将使用 Playwright 的 UI 模式运行测试,提供图形化界面来选择和运行测试。

### 使用有头模式运行(显示浏览器窗口)

```bash
make e2e-single TEST=supervision-qrcode.spec.js MODE=--headed
```

这将显示浏览器窗口,便于观察测试执行过程。

## 可用的测试文件

当前可用的 E2E 测试文件:

- `add-personal-rule.spec.js` - 添加个人打卡规则测试
- `api-community-response.spec.js` - 社区 API 响应测试
- `basic.spec.js` - 基础功能测试
- `checkin-page-community-name.spec.js` - 打卡页面社区名称测试
- `close-event.spec.js` - 关闭事件测试
- `community.spec.js` - 社区功能测试
- `login.spec.js` - 登录功能测试
- `one-click-help.spec.js` - 一键求助测试
- `staff-close-event.spec.js` - 工作人员关闭事件测试
- `super-admin-helper.spec.js` - 超级管理员辅助功能测试
- `supervision-qrcode.spec.js` - 监督二维码功能测试
- `user-community-info.spec.js` - 用户社区信息测试
- `user-registration.spec.js` - 用户注册测试

## 示例场景

### 场景 1: 开发监督二维码功能

```bash
# 运行监督二维码的所有测试
make e2e-single TEST=supervision-qrcode.spec.js

# 如果某个测试失败,使用调试模式查看详细信息
make e2e-single TEST=supervision-qrcode.spec.js MODE=--debug

# 运行特定的测试用例(例如场景1)
make e2e-single TEST=supervision-qrcode.spec.js:10
```

### 场景 2: 调试登录功能

```bash
# 使用有头模式观察登录过程
make e2e-single TEST=login.spec.js MODE=--headed

# 使用 UI 模式选择特定的登录测试
make e2e-single TEST=login.spec.js MODE=--ui
```

### 场景 3: 快速验证修复

```bash
# 修复 bug 后,只运行相关的测试文件
make e2e-single TEST=user-registration.spec.js
```

## 注意事项

1. **必需参数**: `TEST` 参数是必需的,必须指定测试文件名
2. **路径格式**: 测试文件路径相对于 `tests/e2e-playwright/specs/` 目录
3. **行号格式**: 使用 `文件名:行号` 格式来运行特定测试用例
4. **环境检查**: 脚本会自动检查后端服务和 Web 服务器是否运行
5. **自动构建**: 脚本会自动构建 H5 应用(如果需要)

## 错误处理

如果忘记指定测试文件,会看到以下错误:

```bash
$ make e2e-single
❌ 错误: 请指定测试文件
使用示例: make e2e-single TEST=supervision-qrcode.spec.js
使用示例: make e2e-single TEST=supervision-qrcode.spec.js:10
make: *** [e2e-single] Error 1
```

## 与 `make e2e` 的区别

| 特性 | `make e2e` | `make e2e-single` |
|------|-----------|-------------------|
| 运行范围 | 所有 E2E 测试 | 指定的测试文件 |
| 运行时间 | 较长(所有测试) | 较短(单个文件) |
| 适用场景 | 完整回归测试 | 开发和调试 |
| 参数 | 无(可选模式) | 必需 TEST 参数 |

## 高级用法

### 组合使用 grep 过滤

虽然 `make e2e-single` 主要用于指定文件,但您也可以在测试文件中使用 `test.describe` 和 `test` 的名称来组织测试,然后使用 Playwright 的 `--grep` 选项:

```bash
# 直接使用 npx playwright test 命令
cd /Users/qiaoliang/working/code/safeGuard/frontend
npx playwright test supervision-qrcode.spec.js --grep "场景1"
```

### 查看可用的测试

```bash
# 列出所有测试但不运行
npx playwright test --list

# 列出特定文件的测试
npx playwright test supervision-qrcode.spec.js --list
```

## 故障排除

### 问题: 测试文件未找到

**错误信息**: `Error: No tests found`

**解决方案**:
- 确认测试文件名正确
- 确认文件存在于 `tests/e2e-playwright/specs/` 目录
- 使用 `make help` 查看可用的测试文件列表

### 问题: 后端服务未运行

**错误信息**: `后端服务未运行,请先启动后端服务`

**解决方案**:
```bash
cd /Users/qiaoliang/working/code/safeGuard/backend
./localrun.sh
```

### 问题: Web 服务器未运行

**错误信息**: `Web 服务器启动失败`

**解决方案**:
- 脚本会自动尝试启动 Web 服务器
- 如果自动启动失败,可以手动启动:
```bash
cd /Users/qiaoliang/working/code/safeGuard/frontend
./scripts/start-h5-https.sh 8081
```

## 相关文档

- [Playwright 官方文档](https://playwright.dev/)
- [项目 E2E 测试指南](../tests/e2e-playwright/README.md)
- [Makefile 完整命令](../Makefile)