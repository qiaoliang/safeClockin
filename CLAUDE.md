# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SafeGuard Frontend is a uni-app based cross-platform safety monitoring application for elderly care communities.

**Tech Stack**:

- **Framework**: uni-app (supports WeChat Mini Program, H5, and App)
- **Vue**: Vue 3 with Composition API
- **State Management**: Pinia (modular store architecture)
- **Build Tool**: Vite
- **UI Library**: @dcloudio/uni-ui
- **Security**: Custom XOR+Base64 encryption for sensitive data

## Common Commands

### Development

```bash
# Build for different environments
npm run build:unit      # Unit test environment
npm run build:func      # Functional test environment (current default)
npm run build:uat       # UAT environment
npm run build:prod      # Production environment
npm run build:mp-weixin # WeChat Mini Program build

# Linting
npm run lint            # Check code quality
npm run lint:fix        # Fix linting issues
```

### Testing

**Quick Commands (Makefile)**:

```bash
make ut                 # Run unit tests
npm run test:playwright # Headless mode
```

**NPM Scripts**:

```bash
# Unit tests (Vitest + jsdom)
npm run test            # Watch mode
npm run test:run        # Run once
npm run test:ui         # Vitest UI mode
npm run test:coverage   # Coverage report

# Integration tests (Vitest + MSW)
npm run test:func       # Watch mode
npm run test:func:run   # Run once

# E2E tests (Playwright)
npm run test:playwright                # Headless mode
npm run test:playwright:ui             # UI mode
npm run test:playwright:debug          # Debug mode
npm run test:playwright:headed         # Headed mode (show browser)
```

### Running Individual Tests

```bash
# Unit test specific file
npx vitest tests/unit/path/to/test.test.js

# Integration test specific file
npx vitest --config vitest.integration.config.js tests/integration/path/to/test.test.js

# E2E test specific file
make e2e TEST=login.spec.js
# or
npm run test:playwright tests/e2e-playwright/specs/login.spec.js
```

## High-Level Architecture

### Directory Structure

```
frontend/
├── src/
│   ├── api/              # API layer - backend interface encapsulation
│   │   ├── request.js    # Unified request wrapper (token refresh, error handling)
│   │   ├── auth.js       # Authentication APIs
│   │   ├── community.js  # Community management APIs
│   │   └── ...
│   ├── components/       # Reusable components
│   ├── config/           # Environment configurations (unit/func/uat/prod)
│   ├── constants/        # Constants and enums
│   ├── mixins/           # Vue mixins
│   ├── pages/            # 150+ Vue pages (login, home, profile, etc.)
│   ├── store/            # Pinia state management
│   │   ├── modules/
│   │   │   ├── user.js           # Core user state (500+ lines)
│   │   │   ├── checkin.js        # Check-in state
│   │   │   ├── community.js      # Community state
│   │   │   ├── event.js          # Event state
│   │   │   └── storage.js        # Local storage wrapper
│   ├── utils/            # Utility functions
│   │   ├── secure.js     # XOR+Base64 encryption/decryption
│   │   ├── auth.js       # Authentication utilities
│   │   └── locationHelper.js  # Map/location utilities
│   ├── uni.scss          # Global style variables and mixins (MANDATORY for all CSS)
│   ├── App.vue           # Root component
│   ├── main.js           # Application entry point
│   ├── manifest.json     # uni-app configuration
│   └── pages.json        # Page routing configuration
├── tests/
│   ├── unit/             # Unit tests (Vitest, mocked dependencies)
│   ├── integration/      # Integration tests (Vitest + MSW)
│   ├── e2e-playwright/   # E2E tests (Playwright)
│   │   ├── pages/        # Page Objects
│   │   ├── specs/        # Test specs
│   │   ├── utils/        # Test utilities
│   │   └── helpers/      # Test helpers
│   ├── setup.js                  # Unit test setup
│   ├── setup.integration.js      # Integration test setup (MSW handlers)
│   └── setup.e2e.js              # E2E test setup
├── scripts/           # Build and test automation scripts
├── vitest.config.js               # Unit test config
├── vitest.integration.config.js   # Integration test config
├── vitest.e2e.config.js           # E2E test config (Vitest-based)
├── playwright.config.js           # Playwright E2E config
└── Makefile                       # Test command shortcuts
```

### Core Architectural Patterns

**1. Three-Tier Testing Strategy**

- **Unit Tests** (`tests/unit/`): Completely mocked, no backend dependency. Tests utilities, components, and store logic in isolation.
- **Integration Tests** (`tests/integration/`): Uses MSW (Mock Service Worker) to simulate backend API responses. Tests API interaction flows.
- **E2E Tests** (`tests/e2e-playwright/`): Real browser automation with Page Object Model. Requires running H5 app and backend service.

**2. State Management (Pinia)**

Modular store architecture with these core modules:

- **user.js**: Central user state including auth (tokens), profile (user info, roles), and multi-community role management
- **checkin.js**: Check-in data management
- **community.js**: Community information and member management
- **event.js**: Event tracking and management

**Key Pattern**: User store uses development-mode Proxy protection to prevent direct state mutation. Use provided methods like `updateUserInfo()`, `updateTokens()` instead of direct assignment.

**3. API Layer Architecture**

Centralized request handling in `src/api/request.js`:

- Automatic token refresh (5min buffer before expiry)
- Concurrent request queueing during token refresh
- Snake_case ↔ camelCase field name conversion
- Unified error handling and token expiry detection

**4. Security Architecture**

Custom encryption system (`src/utils/secure.js`):

- XOR encryption + Base64 encoding
- Multi-level seed backup mechanism
- Automatic seed recovery
- All sensitive data must be encrypted before local storage

**5. Multi-Environment Configuration**

Four environments managed via `src/config/`:

- **unit**: Unit testing (ENV_TYPE=unit)
- **func**: Functional testing (current default, localhost:9999)
- **uat**: User acceptance testing
- **prod**: Production

Switch environments by modifying `src/config/index.js` import.

**6. Cross-Platform Adaptation**

Use uni-app conditional compilation:

```javascript
// #ifdef MP-WEIXIN
// WeChat Mini Program specific code
// #endif

// #ifdef H5
// H5 specific code
// #endif
```

**7. Routing and Navigation**

Three main tabs: Check-in (打卡), Community (社区), Profile (我的)
Page routing configured in `src/pages.json`
Role-based page navigation after login

### Important Conventions

**CSS**: ALL CSS MUST use variables from `@/src/uni.scss`. This includes colors, spacing, border-radius, shadows, and animations. Hardcoded values are prohibited.
**API**: ALL API 契约文档都放在 `backend/api-contract` 目录下，并以不同的领域名，放在不同的文件中。

**Color Scheme**:

- Primary: Orange (#f48224)
- Background: Beige (#fae9db)
- Accent: Dark brown (#624731)

**Authentication**:

- Always use `request()` wrapper for API calls
- Token refresh is automatic; never manually refresh
- Handle token expiry through user store methods

**Testing**:

- Unit tests should mock all external dependencies
- Integration tests use MSW handlers defined in `tests/setup.integration.js`
- E2E playwright tests use `data-testid` attributes for element selection
- Test verification code is always `123456` (configured in MSW handlers)
- e2e test is for H5 webapp, elements in pages are NOT always in uni-app styles.

**Error Handling**:

- Network errors are centrally intercepted in `request.js`
- Token expiry triggers automatic logout
- User not found triggers automatic state cleanup

## Key Files Reference

| File                         | Purpose                                        |
| ---------------------------- | ---------------------------------------------- |
| `src/main.js`                | Application entry point                        |
| `src/App.vue`                | Root component                                 |
| `src/pages.json`             | Page routing configuration                     |
| `src/uni.scss`               | Global style variables (MANDATORY for all CSS) |
| `src/store/modules/user.js`  | Core user state and auth management            |
| `src/api/request.js`         | HTTP request wrapper with token refresh        |
| `src/utils/secure.js`        | Encryption/decryption utilities                |
| `src/config/index.js`        | Current environment configuration              |
| `tests/setup.integration.js` | MSW API mocks for integration tests            |
| `playwright.config.js`       | Playwright E2E test configuration              |

## Special Developing Considerations

Treat the following guides as important as `CLAUDE.md`:

@./rules/code-style-guide.md
@./rules/commit-rule.md
@./rules/component-development-guide.md
@./ruiles/e2e-single-test-guide.md
@./rules/error-handling-guide.md
@./rules/performance-optimization-guide.md

## Special Testing Considerations

**E2E Test Prerequisites**:

1. Backend service must be running on `http://localhost:9999`
2. H5 app must be built and served on `https://localhost:8081`
3. Use `scripts/run-playwright-e2e.sh` which handles build and server startup

**E2E Test Data**:

- Automatic cleanup after each test
- Use helper functions in `tests/e2e-playwright/helpers/` for data creation
- Never hardcode user IDs or test data

**Playwright Modes**:

- Default: Headless (CI/CD friendly)
- `--ui`: Interactive UI mode for test development
- `--debug`: Step-by-step debugging with inspector
- `--headed`: Show browser window (useful for debugging)

**Test Parallelization**:

- Unit/Integration tests: Parallel by default
- E2E tests: `fullyParallel: false`, `workers: 1` (to avoid SQLite database locks)

## Build and Deployment Scripts

### Android Build Scripts

#### `scripts/adrbuild-local.sh` - Android 本地构建

使用 HBuilderX CLI 在本地构建 Android App 资源，并使用 Gradle 打包安装到模拟器。

```bash
# 基本用法（使用 func 环境）
./scripts/adrbuild-local.sh

# 指定环境类型
./scripts/adrbuild-local.sh ENV_TYPE=unit   # unit 环境
./scripts/adrbuild-local.sh ENV_TYPE=func   # func 环境（默认）
./scripts/adrbuild-local.sh ENV_TYPE=uat    # uat 环境
./scripts/adrbuild-local.sh ENV_TYPE=prod   # prod 环境
```

**功能流程**:

1. 检查/启动 Android 模拟器（支持 Pixel、Pixel_ARM64、Medium_Phone_API_36.1）
2. 使用 HBuilderX CLI 生成 App 资源 (`publish app --type appResource`)
3. 复制资源到 Android 项目 (`HBuilder-Integrate-AS/simpleDemo`)
4. 替换 URL 为 Android 模拟器地址 (localhost → 10.0.2.2)
5. 生成 launcher 图标
6. 使用 Gradle 构建并安装 APK 到模拟器
7. 自动启动应用

**注意事项**:

- 必需条件：HBuilderX 应用程序正在运行、Android SDK/模拟器已配置
- func/unit 环境会自动替换 API URL 为 10.0.2.2:9999（Android 模拟器访问宿主机）
- 其他环境使用真实域名

#### `scripts/adrbuild-cloud.sh` - Android 云端构建

使用 HBuilderX 云打包服务构建 Android APK。

```bash
./scripts/adrbuild-cloud.sh ENV_TYPE=func
```

**功能流程**:

1. 验证环境类型
2. 使用 HBuilderX CLI 云打包 (`cli pack`)
3. 轮询等待构建完成
4. 下载 APK 到 `build/outputs/apk/`
5. 安装到模拟器

### H5/Web Build Scripts

#### `scripts/h5build.sh` - H5 网站构建

使用 HBuilderX CLI 构建 H5 网站应用。

```bash
# 基本用法（默认 func 环境）
./scripts/h5build.sh

# 指定环境
./scripts/h5build.sh ENV_TYPE=unit   # unit 环境 (localhost:9999)
./scripts/h5build.sh ENV_TYPE=func   # func 环境 (localhost:9999)
./scripts/h5build.sh ENV_TYPE=uat    # uat 环境 (https://localhost:8080)
./scripts/h5build.sh ENV_TYPE=prod   # prod 环境 (生产域名)
```

**输出目录**: `src/unpackage/dist/build/web/`

**注意事项**:

- 需要 HBuilderX 应用程序正在运行
- 会临时修改配置文件以设置正确的 API URL
- 支持 worktree 环境，自动处理符号链接

#### `scripts/start-web-server.sh` - Web 服务器启动

使用 Python 启动本地 HTTP 服务器提供 H5 应用服务。

```bash
# 默认端口 8081
./scripts/start-web-server.sh

# 指定端口
WEB_PORT=8082 ./scripts/start-web-server.sh
```

**输出**:

- 访问地址: `http://localhost:<PORT>`
- 日志文件: `logs/web-server.log`

**注意事项**:

- 需要先运行 `h5build.sh` 构建 H5 应用
- 端口被占用时会尝试自动终止占用进程

### Mini-Program Build Scripts

#### `scripts/mpbuild.sh` - 微信小程序构建

使用 HBuilderX CLI 构建微信小程序。

```bash
./scripts/mpbuild.sh ENV_TYPE=func
```

**输出目录**: `src/unpackage/dist/build/mp-weixin/`

**AppID**: `wx55a59cbcd4156ce4`

### Testing Scripts

#### `scripts/run-playwright-e2e.sh` - E2E 测试运行

自动运行 Playwright 端到端测试。

```bash
# 默认无头模式
./scripts/run-playwright-e2e.sh

# UI 模式（交互式）
./scripts/run-playwright-e2e.sh --ui

# 调试模式
./scripts/run-playwright-e2e.sh --debug

# 有头模式（显示浏览器）
./scripts/run-playwright-e2e.sh --headed

# 运行特定测试文件
./scripts/run-playwright-e2e.sh tests/e2e-playwright/specs/login.spec.js
```

**前置条件**:

1. 后端服务运行在 `http://localhost:9999`
2. H5 应用已构建并部署

**功能流程**:

1. 检查/安装依赖
2. 构建 H5 应用
3. 验证后端服务
4. 启动/验证 Web 服务器
5. 运行 Playwright 测试
6. 显示测试报告

### Utility Scripts

#### `scripts/build-env.sh` - 环境构建脚本

根据环境变量设置执行相应的构建命令。
