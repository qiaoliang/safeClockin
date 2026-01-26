#!/bin/bash

# H5 网站构建脚本
# 使用 HBuilderX CLI 构建 H5 网站应用

set -e  # 遇到错误时退出

echo "=== 开始 H5 网站构建 ==="

# 解析命令行参数
# 支持格式: ./h5build.sh ENV_TYPE=func
for arg in "$@"; do
    if [[ $arg =~ ^ENV_TYPE=(.+)$ ]]; then
        ENV_TYPE="${BASH_REMATCH[1]}"
    fi
done

# 验证并设置默认环境类型
VALID_ENVS=("unit" "func" "uat" "prod")

if [ -z "$ENV_TYPE" ]; then
    echo "未指定环境类型，使用默认值: func"
    ENV_TYPE="func"
else
    # 验证环境类型是否有效
    if [[ ! " ${VALID_ENVS[@]} " =~ " ${ENV_TYPE} " ]]; then
        echo "错误: 无效的环境类型 '$ENV_TYPE'"
        echo "支持的环境类型: ${VALID_ENVS[*]}"
        echo "使用方法: $0 ENV_TYPE=<unit|func|uat|prod>"
        exit 1
    fi
    echo "使用环境类型: $ENV_TYPE"
fi

# 导出环境变量供脚本使用
export ENV_TYPE

# 获取脚本所在目录的绝对路径
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "脚本目录: $SCRIPT_DIR"

# 获取前端项目路径（脚本目录的上一级）
FRONTEND_PATH="$(dirname "$SCRIPT_DIR")"
echo "前端项目路径: $FRONTEND_PATH"

# 检查前端目录是否存在
if [ ! -d "$FRONTEND_PATH" ]; then
    echo "错误: 前端目录不存在: $FRONTEND_PATH"
    exit 1
fi

# 检查是否是有效的前端项目目录（通过检查 package.json）
if [ ! -f "$FRONTEND_PATH/package.json" ]; then
    echo "错误: 不是有效的前端项目目录（未找到 package.json）"
    echo "前端项目路径: $FRONTEND_PATH"
    exit 1
fi
echo "✓ 前端项目目录验证通过"

# 进入前端目录
cd "$FRONTEND_PATH"
echo "当前工作目录: $(pwd)"

# 检查 package.json 是否存在
if [ ! -f "package.json" ]; then
    echo "错误: package.json 文件不存在"
    exit 1
fi

# 检查是否安装了依赖
if [ ! -d "node_modules" ]; then
    echo "正在安装依赖..."
    npm install
fi

# 根据环境类型设置输出路径（所有环境统一使用 build）
BUILD_OUTPUT_DIR="build"

echo "===== ENV_TYPE ========="
echo $ENV_TYPE
echo "===== END ========="

# 输出路径
BUILD_DIST_PATH="$FRONTEND_PATH/src/unpackage/dist/$BUILD_OUTPUT_DIR/web"

echo "构建输出目录: $BUILD_DIST_PATH"

# 检查HBuilderX主应用程序是否运行
echo "检查HBuilderX依赖..."
HBuilderX_MAIN_PROCESS="/Applications/HBuilderX.app/Contents/MacOS/HBuilderX"

# 检查HBuilderX主进程
if ! pgrep -f "$HBuilderX_MAIN_PROCESS" > /dev/null; then
    echo ""
    echo "=========================================="
    echo "错误: HBuilderX主应用程序未运行"
    echo ""
    echo "请先启动HBuilderX应用程序："
    echo "1. 打开HBuilderX应用程序"
    echo "   或者双击 /Applications/HBuilderX.app"
    echo "2. 等待HBuilderX完全启动"
    echo "3. 确保看到HBuilderX主界面"
    echo ""
    echo "然后重新运行构建命令。"
    echo "=========================================="
    exit 1
fi

echo "✓ HBuilderX依赖检查通过"

# 根据环境变量设置 API URL
API_URL="http://localhost:8080"

# 根据 ENV_TYPE 设置 API URL
if [ "$ENV_TYPE" = "unit" ]; then
    ENV_TYPE="unit"
    API_URL="http://localhost:9999"
elif [ "$ENV_TYPE" = "uat" ]; then
    ENV_TYPE="uat"
    API_URL="https://localhost:8080"
elif [ "$ENV_TYPE" = "prod" ]; then
    ENV_TYPE="prod"
    API_URL="https://www.leadagile.cn"
elif [ "$ENV_TYPE" = "func" ]; then
    ENV_TYPE="func"
    API_URL="http://localhost:9999"
fi

echo "API URL: $API_URL"
echo "Environment: $ENV_TYPE"

# 备份原始配置文件
echo "备份原始配置文件..."
cp src/config/index.js src/config/index.js.backup

# 定义每个环境的配置字符串
case "$ENV_TYPE" in
  prod)
    CONFIG_LINE='config = { env: '\''prod'\'', api: { baseURL: '\''https://www.leadagile.cn'\'' }, app: { name: '\''安全守护'\'', version: '\''1.0.0'\'', debug: false }, map: { key: '\''EY7BZ-WB5WL-B3PPE-MK6FU-MHQ3T-Y2FFP'\'', secret: '\''oWjfgcA2ismvRGAksDhL8w4qjUIdtkBp'\'' }, features: { enableMockData: false, enableDebugLog: false, enableErrorReporting: true } }'
    ;;
  func)
    CONFIG_LINE='config = { env: '\''func'\'', api: { baseURL: '\''http://localhost:9999'\'' }, app: { name: '\''安全守护'\'', version: '\''1.0.0'\'', debug: true }, map: { key: '\''EY7BZ-WB5WL-B3PPE-MK6FU-MHQ3T-Y2FFP'\'', secret: '\''oWjfgcA2ismvRGAksDhL8w4qjUIdtkBp'\'' }, features: { enableMockData: false, enableDebugLog: true, enableErrorReporting: true } }'
    ;;
  uat)
    CONFIG_LINE='config = { env: '\''uat'\'', api: { baseURL: '\''http://localhost:8080'\'' }, app: { name: '\''安全守护'\'', version: '\''1.0.0'\'', debug: true }, map: { key: '\''EY7BZ-WB5WL-B3PPE-MK6FU-MHQ3T-Y2FFP'\'', secret: '\''oWjfgcA2ismvRGAksDhL8w4qjUIdtkBp'\'' }, features: { enableMockData: false, enableDebugLog: true, enableErrorReporting: true } }'
    ;;
  unit)
    CONFIG_LINE='config = { env: '\''unit'\'', api: { baseURL: '\''http://localhost:8080'\'' }, app: { name: '\''安全守护'\'', version: '\''1.0.0'\'', debug: true }, map: { key: '\''EY7BZ-WB5WL-B3PPE-MK6FU-MHQ3T-Y2FFP'\'', secret: '\''oWjfgcA2ismvRGAksDhL8w4qjUIdtkBp'\'' }, features: { enableMockData: true, enableDebugLog: true, enableErrorReporting: false } }'
    ;;
  *)
    echo "未知的环境类型: $ENV_TYPE，使用 prod 配置"
    CONFIG_LINE='config = { env: '\''prod'\'', api: { baseURL: '\''https://www.leadagile.cn'\'' }, app: { name: '\''安全守护'\'', version: '\''1.0.0'\'', debug: false }, map: { key: '\''EY7BZ-WB5WL-B3PPE-MK6FU-MHQ3T-Y2FFP'\'', secret: '\''oWjfgcA2ismvRGAksDhL8w4qjUIdtkBp'\'' }, features: { enableMockData: false, enableDebugLog: false, enableErrorReporting: true } }'
    ;;
esac

# 使用 sed 替换 config 赋值行
echo "替换 H5 配置为 $ENV_TYPE..."

# 使用更精确的模式匹配整行配置（匹配以 config = { env: 'prod' 开头并以 } 结尾的行）
sed -i '' "s|^config = { env: 'prod'.*}$|${CONFIG_LINE}|" src/config/index.js

echo ""
echo "========================================"
echo "  环境配置结果"
echo "========================================"
echo "  环境类型: $ENV_TYPE"
echo "  API URL:  $API_URL"
echo "========================================"

PROJECT_PATH="$FRONTEND_PATH/src"
BUILD_OUTPUT_PATH="$PROJECT_PATH/unpackage/dist/$BUILD_OUTPUT_DIR/web"

echo ""
echo "正在构建H5 网站..."
echo "构建参数："
echo "  平台: web"
echo "  项目路径: $PROJECT_PATH"
echo "  源码映射: true"

# 清理旧的构建结果
if [ -L "$BUILD_OUTPUT_PATH" ]; then
    echo "检测到符号链接，跳过清理: $BUILD_OUTPUT_PATH"
elif [ -d "$BUILD_OUTPUT_PATH" ]; then
    echo "清理上次构建残留的文件: $BUILD_OUTPUT_PATH"
    rm -rf "$BUILD_OUTPUT_PATH"
fi

# 运行 HBuilderX CLI 构建 H5
# 使用 --webHosting false 避免云托管需求
# 使用 ENV_TYPE 环境变量传递条件编译变量
echo ""
echo "运行 HBuilderX CLI 构建..."
echo "命令: /Applications/HBuilderX.app/Contents/MacOS/cli publish web --project $PROJECT_PATH --webHosting false"

ENV_TYPE=$ENV_TYPE NODE_ENV=development /Applications/HBuilderX.app/Contents/MacOS/cli publish web --project "$PROJECT_PATH" --webHosting false

BUILD_EXIT_CODE=$?

if [ $BUILD_EXIT_CODE -eq 0 ]; then
    echo "✓ HBuilderX 构建成功"
else
    echo "✗ HBuilderX 构建失败，退出码: $BUILD_EXIT_CODE"
    # 恢复原始配置文件
    mv src/config/index.js.backup src/config/index.js 2>/dev/null || true
    exit $BUILD_EXIT_CODE
fi

# HBuilderX CLI 在 worktree 中可能会将构建输出到主仓库路径
# 检查并处理这种情况
MAIN_REPO_BUILD_PATH="/Users/qiaoliang/working/code/safeGuard/frontend/src/unpackage/dist/build/web"

# 检查是否在 worktree 环境中
if [[ "$FRONTEND_PATH" =~ /worktree/ ]]; then
    echo "检测到 worktree 环境"

    # 检查符号链接是否已存在
    if [ -L "$BUILD_OUTPUT_PATH" ]; then
        echo "✓ 符号链接已存在，跳过创建"
    elif [ -d "$BUILD_OUTPUT_PATH" ]; then
        echo "✓ 构建输出已存在于预期路径: $BUILD_OUTPUT_PATH"
    elif [ -d "$MAIN_REPO_BUILD_PATH" ]; then
        echo "检测到 HBuilderX CLI 将构建输出到主仓库路径"
        echo "主仓库构建路径: $MAIN_REPO_BUILD_PATH"
        echo "预期构建路径: $BUILD_OUTPUT_PATH"

        # 创建符号链接
        echo "创建符号链接: $BUILD_OUTPUT_PATH -> $MAIN_REPO_BUILD_PATH"
        ln -sf "$MAIN_REPO_BUILD_PATH" "$BUILD_OUTPUT_PATH"

        if [ $? -eq 0 ]; then
            echo "✓ 符号链接创建成功"
        else
            echo "✗ 符号链接创建失败"
        fi
    else
        echo "注意: 主仓库构建路径不存在: $MAIN_REPO_BUILD_PATH"
    fi
else
    echo "检测到主仓库环境"
fi

# 验证构建结果
if [ -d "$BUILD_OUTPUT_PATH" ] && [ "$(ls -A "$BUILD_OUTPUT_PATH" 2>/dev/null)" ]; then
    echo "✓ 构建输出目录已创建且包含文件"
    echo "构建文件列表："
    ls -la "$BUILD_OUTPUT_PATH"
else
    echo "✗ 错误: 构建输出目录不存在或为空: $BUILD_OUTPUT_PATH"

    # 尝试查找实际输出位置
    echo "尝试查找构建输出..."
    if [ -d "$MAIN_REPO_BUILD_PATH" ] && [ "$(ls -A "$MAIN_REPO_BUILD_PATH" 2>/dev/null)" ]; then
        echo "找到构建输出: $MAIN_REPO_BUILD_PATH"
    fi

    # 恢复原始配置文件
    mv src/config/index.js.backup src/config/index.js 2>/dev/null || true
    exit 1
fi

# 恢复原始配置文件（只恢复 index.js）
echo "恢复原始配置文件..."
mv src/config/index.js.backup src/config/index.js

echo ""
echo "=== H5 网站构建完成 ==="
echo "构建输出目录: $BUILD_OUTPUT_PATH"
