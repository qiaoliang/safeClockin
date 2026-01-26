#!/bin/bash

# H5 小程序构建脚本
# 动态获取当前脚本的绝对路径，并运行微信小程序构建命令

set -e  # 遇到错误时退出

echo "=== 开始 H5 小程序构建 ==="

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

# 清理旧的构建结果
BUILD_DIST_PATH="$FRONTEND_PATH/src/unpackage/dist/$BUILD_OUTPUT_DIR/web"
# 检查是否是符号链接，如果是则不删除
if [ -L "$BUILD_DIST_PATH" ]; then
    echo "检测到符号链接，跳过清理: $BUILD_DIST_PATH"
else
    if [ -d "$BUILD_DIST_PATH" ]; then
        echo "清理旧的构建结果: $BUILD_DIST_PATH"
        rm -rf "$BUILD_DIST_PATH"
    fi
    mkdir -p $BUILD_DIST_PATH
fi

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

# 修改 index.js 中的 ENV_TYPE，H5 条件编译块内的代码需要硬编码
echo "修改 index.js 中的 H5 条件编译配置为 $ENV_TYPE..."

# 只修改 H5 条件编译块内的代码（第10-14行之间）
# 使用 sed 的地址范围功能: /start/,/end/s/pattern/replacement/
sed -i '' '/#ifdef H5/,/#endif/s/const ENV_TYPE = process\.env\.ENV_TYPE || '\''prod'\''/const ENV_TYPE = '\''$ENV_TYPE'\''/g' src/config/index.js

echo "H5 条件编译块内的 ENV_TYPE 已设置为: $ENV_TYPE"

# 根据环境类型修改对应配置文件中的 baseURL
if [ "$ENV_TYPE" = "unit" ]; then
    echo "修改 unit.js 中的 baseURL..."
    sed -i.bak "s|baseURL: 'http://localhost:9999'|baseURL: '$API_URL'|g" src/config/unit.js
elif [ "$ENV_TYPE" = "func" ]; then
    echo "修改 func.js 中的 baseURL..."
    sed -i.bak "s|baseURL: 'http://localhost:8080'|baseURL: '$API_URL'|g" src/config/func.js
elif [ "$ENV_TYPE" = "uat" ]; then
    echo "修改 uat.js 中的 baseURL..."
    sed -i.bak "s|baseURL: 'https://uat-safeguard-api.example.com'|baseURL: '$API_URL'|g" src/config/uat.js
elif [ "$ENV_TYPE" = "prod" ]; then
    echo "修改 prod.js 中的 baseURL..."
    sed -i.bak "s|baseURL: 'https://www.leadagile.cn'|baseURL: '$API_URL'|g" src/config/prod.js
fi

echo ""
echo "========================================"
echo "  环境配置结果"
echo "========================================"
echo "  环境类型: $ENV_TYPE"
echo "  API URL:  $API_URL"
echo "  配置文件: src/config/$ENV_TYPE.js"
echo "========================================"

PROJECT_PATH="$FRONTEND_PATH/src"
# Use the correct output path based on environment
BUILD_OUTPUT_PATH="$PROJECT_PATH/unpackage/dist/$BUILD_OUTPUT_DIR/web"
# 运行 H5 小程序构建命令
echo "正在构建H5 网站..."
echo "构建参数："
echo "  平台: web"
echo "  项目路径: $FRONTEND_PATH/src"
echo "  源码映射: true"




# 捕获构建输出以便诊断
BUILD_EXIT_CODE=0

# 检查是否是符号链接，如果是则不删除
if [ -L "$BUILD_OUTPUT_PATH" ]; then
    echo "检测到符号链接，跳过清理: $BUILD_OUTPUT_PATH"
else
    echo "清理上次构建残留的文件....$BUILD_OUTPUT_PATH"
    rm -rf "$BUILD_OUTPUT_PATH"
fi

# 运行 HBuilderX CLI 构建
# 传递 ENV_TYPE 环境变量给 HBuilderX CLI
echo "运行 HBuilderX CLI 构建..."
ENV_TYPE=$ENV_TYPE NODE_ENV=development /Applications/HBuilderX.app/Contents/MacOS/cli publish --platform h5 --project $PROJECT_PATH

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
        echo "警告: 构建目录已存在且不是符号链接，将被覆盖"
        rm -rf "$BUILD_OUTPUT_PATH"
        echo "创建符号链接: $BUILD_OUTPUT_PATH -> $MAIN_REPO_BUILD_PATH"
        ln -s "$MAIN_REPO_BUILD_PATH" "$BUILD_OUTPUT_PATH"
        if [ $? -eq 0 ]; then
            echo "✓ 符号链接创建成功"
        else
            echo "✗ 符号链接创建失败，尝试复制文件..."
            cp -R "$MAIN_REPO_BUILD_PATH" "$BUILD_OUTPUT_PATH"
        fi
    elif [ -d "$MAIN_REPO_BUILD_PATH" ]; then
        echo "检测到 HBuilderX CLI 将构建输出到主仓库路径"
        echo "主仓库构建路径: $MAIN_REPO_BUILD_PATH"
        echo "预期构建路径: $BUILD_OUTPUT_PATH"
        
        # 创建符号链接
        echo "创建符号链接: $BUILD_OUTPUT_PATH -> $MAIN_REPO_BUILD_PATH"
        ln -s "$MAIN_REPO_BUILD_PATH" "$BUILD_OUTPUT_PATH"
        
        if [ $? -eq 0 ]; then
            echo "✓ 符号链接创建成功"
        else
            echo "✗ 符号链接创建失败，尝试复制文件..."
            # 如果符号链接失败，复制文件
            cp -R "$MAIN_REPO_BUILD_PATH" "$BUILD_OUTPUT_PATH"
        fi
    else
        echo "警告: 主仓库构建路径不存在: $MAIN_REPO_BUILD_PATH"
    fi
else
    echo "检测到主仓库环境，无需创建符号链接"
fi

# 验证构建结果



# 恢复原始配置文件
echo "恢复原始配置文件..."
mv src/config/index.js.backup src/config/index.js

# 根据环境类型恢复对应的配置文件备份
if [ -f "src/config/unit.js.bak" ]; then
    mv src/config/unit.js.bak src/config/unit.js
fi
if [ -f "src/config/func.js.bak" ]; then
    mv src/config/func.js.bak src/config/func.js
fi
if [ -f "src/config/uat.js.bak" ]; then
    mv src/config/uat.js.bak src/config/uat.js
fi
if [ -f "src/config/prod.js.bak" ]; then
    mv src/config/prod.js.bak src/config/prod.js
fi

echo "=== H5 小程序构建完成 ==="
