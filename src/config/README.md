# 配置管理说明

## 概述

本项目使用配置文件管理不同环境的设置，支持 unit、func、uat、prod 四个环境，与后端环境保持一致。

## 配置文件结构

```
src/config/
├── index.js          # 主配置入口，根据环境变量选择配置
├── unit.js           # 单元测试环境
├── func.js           # 功能测试环境
├── uat.js            # UAT环境
└── prod.js           # 生产环境
```

## 环境说明

### unit (单元测试环境)
- **用途**: 单元测试和本地开发
- **API地址**: `http://localhost:8080`
- **特点**: 启用调试日志和模拟数据

### func (功能测试环境)
- **用途**: 功能测试和集成测试
- **API地址**: `http://localhost:8080`
- **特点**: 启用调试日志，关闭模拟数据

### uat (UAT环境)
- **用途**: 用户验收测试
- **API地址**: `https://uat-safeguard-api.example.com`
- **特点**: 接近生产环境配置

### prod (生产环境)
- **用途**: 正式发布版本
- **API地址**: `https://flask-7pin-202852-6-1383741966.sh.run.tcloudbase.com`
- **特点**: 优化性能，关闭调试功能

## 使用方法

### 1. 开发环境

```bash
# 默认使用 func 环境
npm run dev

# 或指定环境
UNI_ENV=func npm run dev
```

### 2. 构建不同环境

```bash
# 构建功能测试环境
npm run build:func

# 构建UAT环境
npm run build:uat

# 构建生产环境
npm run build:prod
```

### 3. 测试

```bash
# E2E 测试（自动使用 func 环境）
npm run test:e2e:run

# 单元测试（自动使用 unit 环境）
npm run test:unit:run
```

### 4. 在代码中使用配置

```javascript
// 导入配置
import config, { getAPIBaseURL, isFeatureEnabled } from '@/config'

// 使用 API 基础 URL
const baseURL = getAPIBaseURL()

// 检查功能开关
if (isFeatureEnabled('enableDebugLog')) {
  console.log('调试信息')
}

// 获取当前环境
console.log('当前环境:', config.env)
```

## 环境变量

### UNI_ENV

uni-app 环境变量，用于指定当前环境：
- `unit`: 单元测试环境
- `func`: 功能测试环境
- `uat`: UAT环境
- `prod`: 生产环境

### BASE_URL_FOR_SAFEGUARD (可选)

覆盖默认的 API 地址，主要用于测试：

```bash
# 使用自定义后端地址运行 E2E 测试
BASE_URL_FOR_SAFEGUARD=http://localhost:9999 npm run test:e2e:run
```

## 配置项说明

每个配置文件包含以下部分：

```javascript
export default {
  env: '环境标识',
  
  api: {
    baseURL: 'API基础地址',
    timeout: '请求超时时间(ms)'
  },
  
  app: {
    name: '应用名称',
    version: '应用版本',
    debug: '是否启用调试'
  },
  
  features: {
    enableMockData: '是否启用模拟数据',
    enableDebugLog: '是否启用调试日志',
    enableErrorReporting: '是否启用错误上报'
  }
}
```

## 添加新配置项

1. 在各个环境配置文件中添加新配置
2. 在 `config/index.js` 中添加便捷获取函数（可选）
3. 在代码中使用新配置

## 注意事项

1. **敏感信息**: 生产环境的敏感信息（如密钥）不应直接写在配置文件中，应通过环境变量或加密方式处理
2. **版本控制**: 确保配置文件中的占位符地址（如 UAT 环境）在部署前被替换为实际地址
3. **测试**: 每次修改配置后，建议在对应环境中进行测试验证

## 故障排除

### 配置未生效

1. 检查环境变量是否正确设置
2. 确认配置文件语法正确
3. 清理缓存后重新构建

### API 请求失败

1. 检查当前环境的 baseURL 是否正确
2. 使用 `BASE_URL_FOR_SAFEGUARD` 环境变量临时覆盖
3. 查看控制台日志确认请求地址

### 环境切换问题

1. 清理项目缓存：`rm -rf node_modules/.cache`
2. 重新安装依赖：`npm install`
3. 重新构建项目