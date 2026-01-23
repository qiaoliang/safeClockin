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

**CSS**: ALL CSS MUST use variables from `@/uni.scss`. This includes colors, spacing, border-radius, shadows, and animations. Hardcoded values are prohibited.
**API**: ALL API  契约文档都放在 `backend/api-contract` 目录下，并以不同的领域名，放在不同的文件中。

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

| File | Purpose |
|------|---------|
| `src/main.js` | Application entry point |
| `src/App.vue` | Root component |
| `src/pages.json` | Page routing configuration |
| `src/uni.scss` | Global style variables (MANDATORY for all CSS) |
| `src/store/modules/user.js` | Core user state and auth management |
| `src/api/request.js` | HTTP request wrapper with token refresh |
| `src/utils/secure.js` | Encryption/decryption utilities |
| `src/config/index.js` | Current environment configuration |
| `tests/setup.integration.js` | MSW API mocks for integration tests |
| `playwright.config.js` | Playwright E2E test configuration |

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
