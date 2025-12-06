#!/bin/bash

# 手机号注册流程自动化测试运行脚本

set -e

echo "=== 手机号注册流程自动化测试 ==="
echo "开始时间: $(date)"

# 获取脚本目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# 进入项目目录
cd "$PROJECT_ROOT"

# 检查依赖
echo "📦 检查测试依赖..."
if [ ! -d "node_modules" ]; then
    echo "安装依赖..."
    npm install
fi

# 运行单元测试
echo ""
echo "🧪 运行单元测试..."
npm test -- phone-registration.test.js --run

# 运行端到端测试
echo ""
echo "🌐 运行端到端测试..."
npm test -- phone-registration-e2e.test.js --run

# 生成测试报告
echo ""
echo "📊 生成测试报告..."
if [ -f "tests/coverage/lcov-report/index.html" ]; then
    echo "测试覆盖率报告已生成: tests/coverage/lcov-report/index.html"
fi

# 运行性能测试
echo ""
echo "⚡ 运行性能测试..."
npm test -- phone-registration.test.js --run --reporter=verbose | grep -E "(性能|响应时间|duration)"

echo ""
echo "=== 测试完成 ==="
echo "结束时间: $(date)"
echo ""
echo "📋 测试结果查看："
echo "1. 单元测试: npm test -- phone-registration.test.js"
echo "2. 端到端测试: npm test -- phone-registration-e2e.test.js"
echo "3. 覆盖率报告: open tests/coverage/lcov-report/index.html"
echo ""
echo "🔧 调试工具："
echo "1. 访问调试页面: /pages/debug/user-debug"
echo "2. 查看控制台日志进行问题排查"
echo ""
echo "✅ 测试配置："
echo "- 测试手机号: 13800138000"
echo "- 测试密码: Test123456"
echo "- 统一验证码: 123456"