# Makefile for SafeGuard Frontend Testing
# 用于运行前端项目的三类自动化测试

.PHONY: ut test-integration e2e test-all help test-coverage test-clean

# 默认目标
help:
	@echo "SafeGuard Frontend 测试命令:"
	@echo ""
	@echo "  ut        - 运行单元测试"
	@echo "  test-integration - 运行集成测试"
	@echo "  e2e         - 运行端到端测试"
	@echo "  test-all         - 运行所有测试"
	@echo "  test-coverage    - 运行测试并生成覆盖率报告"
	@echo "  test-clean       - 清理测试相关文件"
	@echo "  help             - 显示此帮助信息"
	@echo ""
	@echo "使用示例:"
	@echo "  make ut"
	@echo "  make test-all"

# 运行单元测试
ut:
	@echo "🔬 运行单元测试..."
	npm run test:run

# 运行集成测试
test-integration:
	@echo "🔗 运行集成测试..."
	npx vitest run --config vitest.integration.config.js

# 运行端到端测试（Playwright E2E）
e2e:
	@echo "🌐 运行端到端测试（Playwright）..."
	./scripts/run-playwright-e2e.sh
	@echo "✅ Playwright E2E 测试完成"

# 运行所有测试（按顺序执行）
test-all: ut test-integration e2e
	@echo "✅ 所有测试完成！"

# 运行测试并生成覆盖率报告
test-coverage:
	@echo "📊 运行测试并生成覆盖率报告..."
	npm run test:coverage

# 清理测试相关文件
test-clean:
	@echo "🧹 清理测试相关文件..."
	rm -rf coverage/
	rm -rf node_modules/.cache/vitest/
	find . -name "*.log" -type f -delete
	@echo "✅ 清理完成"

# 快速检查（只运行单元测试，用于开发阶段）
test-quick:
	@echo "⚡ 快速检查（仅单元测试）..."
	npx vitest run tests/unit/

# 详细测试报告
test-detailed:
	@echo "📋 生成详细测试报告..."
	npx vitest run --reporter=verbose --config vitest.integration.config.js

# 监视模式运行单元测试
test-watch:
	@echo "👀 监视模式运行单元测试..."
	npm run test

# 监视模式运行集成测试
test-watch-integration:
	@echo "👀 监视模式运行集成测试..."
	npx vitest --config vitest.integration.config.js

# 监视模式运行E2E测试
test-watch-e2e:
	@echo "👀 监视模式运行E2E测试..."
	npm run test:e2e

# 性能测试（运行所有测试并显示耗时）
test-performance:
	@echo "⏱️  性能测试 - 运行所有测试并显示耗时..."
	@echo "单元测试耗时：" && time make ut
	@echo "集成测试耗时：" && time make test-integration
	@echo "E2E测试耗时：" && time make e2e
	@echo "总体测试耗时：" && time make test-all

# CI/CD 模式（严格运行，任何失败都会停止）
test-ci:
	@echo "🚀 CI/CD 模式 - 严格运行测试..."
	npx vitest run --config vitest.config.js || exit 1
	npx vitest run --config vitest.integration.config.js || exit 1
	npm run test:e2e:run || exit 1
	@echo "✅ CI/CD 测试全部通过！"

# 检查测试环境
test-check:
	@echo "🔍 检查测试环境..."
	@echo "Node.js版本:" && node --version
	@echo "npm版本:" && npm --version
	@echo "Vitest版本:" && npx vitest --version
	@echo "检查后端服务状态..." && curl -s http://localhost:8080/api/count || echo "后端服务未启动"