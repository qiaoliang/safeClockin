#!/usr/bin/env bash

# 环境构建脚本
# 用于构建不同环境的版本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 显示帮助信息
show_help() {
    echo "环境构建脚本"
    echo ""
    echo "用法: $0 [环境]"
    echo ""
    echo "环境:"
    echo "  unit     单元测试环境"
    echo "  func     功能测试环境"
    echo "  uat      UAT环境"
    echo "  prod     生产环境"
    echo ""
    echo "示例:"
    echo "  $0 func    # 构建功能测试环境"
    echo "  $0 prod    # 构建生产环境"
}

# 检查参数
if [ $# -eq 0 ]; then
    log_error "请指定构建环境"
    show_help
    exit 1
fi

ENV=$1

# 验证环境参数
case $ENV in
    unit|func|uat|prod)
        ;;
    *)
        log_error "无效的环境: $ENV"
        show_help
        exit 1
        ;;
esac

log_info "开始构建 $ENV 环境..."

# 设置环境变量
export UNI_ENV=$ENV
export ENV_TYPE=$ENV
export NODE_ENV=$(if [ "$ENV" = "prod" ]; then echo "production"; else echo "development"; fi)

# 显示当前配置
log_info "环境配置:"
log_info "  ENV_TYPE: $ENV_TYPE"
log_info "  UNI_ENV: $UNI_ENV"
log_info "  NODE_ENV: $NODE_ENV"

# 根据环境执行不同的构建命令
case $ENV in
    unit)
        log_info "构建单元测试环境..."
        # 单元测试环境可能不需要构建，直接运行测试
        npm run test:unit:run
        ;;
    func)
        log_info "构建功能测试环境..."
        # 功能测试环境构建
        npm run build:mp-weixin
        ;;
    uat)
        log_info "构建UAT环境..."
        # UAT环境构建，传递环境变量
        export BUILD_ENV=uat
        npm run build:mp-weixin
        ;;
    prod)
        log_info "构建生产环境..."
        # 生产环境构建，传递环境变量
        export BUILD_ENV=prod
        npm run build:mp-weixin
        ;;
esac

log_info "构建完成！"

# 显示输出目录
if [ -d "dist" ]; then
    log_info "输出目录: dist/"
fi

if [ -d "unpackage" ]; then
    log_info "输出目录: unpackage/"
fi
