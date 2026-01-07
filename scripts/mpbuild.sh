#!/bin/bash

# 微信小程序构建脚本
# 动态获取当前脚本的绝对路径，并运行微信小程序构建命令

set -e  # 遇到错误时退出

echo "=== 开始微信小程序构建 ==="

# 解析命令行参数
# 支持格式: ./mpbuild.sh ENV_TYPE=func
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

# 检查前端项目路径是否以 'frontend' 结尾
if [[ ! "$FRONTEND_PATH" =~ /frontend$ ]]; then
    echo "错误: 前端项目路径必须在以 'frontend' 结尾的目录下"
    echo "前端项目路径: $FRONTEND_PATH"
    echo "请确保脚本位于 frontend/scripts 目录中"
    exit 1
fi
echo "前端项目路径: $FRONTEND_PATH"

# 检查前端目录是否存在
if [ ! -d "$FRONTEND_PATH" ]; then
    echo "错误: 前端目录不存在: $FRONTEND_PATH"
    exit 1
fi

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

# 设置微信小程序 AppID
WX_APPID="wx55a59cbcd4156ce4"
echo "微信小程序 AppID: $WX_APPID"

# 清理微信开发者工具进程
echo "清理微信开发者工具进程..."
WECHAT_DEVTOOLS_PROCESS="/Applications/wechatwebdevtools.app/Contents/MacOS/wechatdevtools"
if pgrep -f "$WECHAT_DEVTOOLS_PROCESS" > /dev/null; then
    echo "发现微信开发者工具进程，正在终止..."
#    pkill -f "$WECHAT_DEVTOOLS_PROCESS"
    sleep 2  # 等待进程完全终止

    # 再次检查是否成功终止
    if pgrep -f "$WECHAT_DEVTOOLS_PROCESS" > /dev/null; then
        echo "警告：微信开发者工具进程仍在运行，尝试强制终止..."
 #       pkill -9 -f "$WECHAT_DEVTOOLS_PROCESS"
        sleep 1
    fi

    if ! pgrep -f "$WECHAT_DEVTOOLS_PROCESS" > /dev/null; then
        echo "微信开发者工具进程已成功终止"
    else
        echo "警告：无法终止微信开发者工具进程，构建可能会受到影响"
    fi
else
    echo "未发现运行中的微信开发者工具进程"
fi

# 根据环境类型设置输出路径
if [ "$ENV_TYPE" = "unit" ]; then
    BUILD_OUTPUT_DIR="build"
elif [ "$ENV_TYPE" = "func" ]; then
    BUILD_OUTPUT_DIR="build"
elif [ "$ENV_TYPE" = "uat" ]; then
    BUILD_OUTPUT_DIR="uat"
elif [ "$ENV_TYPE" = "prod" ]; then
    BUILD_OUTPUT_DIR="build"
else
    BUILD_OUTPUT_DIR="build"
fi

echo "===== ENV_TYPE ========="
echo $ENV_TYPE
echo "===== END ========="

# 清理旧的构建结果
BUILD_DIST_PATH="$FRONTEND_PATH/src/unpackage/dist/$BUILD_OUTPUT_DIR/mp-weixin"
if [ -d "$BUILD_DIST_PATH" ]; then
    echo "清理旧的构建结果: $BUILD_DIST_PATH"
    rm -rf "$BUILD_DIST_PATH"
fi

mkdir -p $BUILD_DIST_PATH

echo "构建输出目录: $BUILD_DIST_PATH"

# 检查HBuilderX主应用程序是否运行
echo "检查HBuilderX依赖..."
HBuilderX_MAIN_PROCESS="/Applications/HBuilderX.app/Contents/MacOS/HBuilderX"
#HBuilderX_NODE_PROCESS="/Applications/HBuilderX.app/Contents/HBuilderX/plugins/node/node"

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
    API_URL="https://flask-7pin-202852-6-1383741966.sh.run.tcloudbase.com"
elif [ "$ENV_TYPE" = "func" ]; then
    ENV_TYPE="func"
    API_URL="http://localhost:9999"
fi

echo "API URL: $API_URL"
echo "Environment: $ENV_TYPE"

# 备份原始配置文件
echo "备份原始配置文件..."
cp src/config/index.js src/config/index.js.backup

# 临时修改 index.js 文件，硬编码环境
echo "临时修改配置文件..."


if [ "$ENV_TYPE" = "unit" ]; then
    echo "# unit 环境，创建unit的配置文件"
    cat > src/config/index.js.tmp << 'EOF'
// 配置文件入口 - unit 环境
// 导入各环境配置
import unitConfig from './unit.js'
import funcConfig from './func.js'
import uatConfig from './uat.js'
import prodConfig from './prod.js'

// 直接返回 unit 配置
const config = unitConfig

// 导出环境信息
export const currentEnv = config.env
export const isProduction = config.env === 'prod'
export const isDevelopment = config.env === 'func'
export const isTesting = config.env === 'unit'

// 导出配置对象
export default config

// 便捷的配置获取函数
export function getAPIBaseURL() {
  return config.api.baseURL
}

export function getAPITimeout() {
  return config.api.timeout
}

export function isFeatureEnabled(feature) {
  return config.features[feature] || false
}
EOF

elif [ "$ENV_TYPE" = "func" ]; then
    echo "# func 环境，创建func的配置文件"
    cat > src/config/index.js.tmp << 'EOF'
// 配置文件入口 - func 环境
// 导入各环境配置
import unitConfig from './unit.js'
import funcConfig from './func.js'
import uatConfig from './uat.js'
import prodConfig from './prod.js'

// 直接返回 func 配置
const config = funcConfig

// 导出环境信息
export const currentEnv = config.env
export const isProduction = config.env === 'prod'
export const isDevelopment = config.env === 'func'
export const isTesting = config.env === 'unit'

// 导出配置对象
export default config

// 便捷的配置获取函数
export function getAPIBaseURL() {
  return config.api.baseURL
}

export function getAPITimeout() {
  return config.api.timeout
}

export function isFeatureEnabled(feature) {
  return config.features[feature] || false
}
EOF

elif [ "$ENV_TYPE" = "uat" ]; then
    echo "# uat 环境类型创建 UAT的配置文件"
    cat > src/config/index.js.tmp << 'EOF'
// 配置文件入口 - uat 环境
// 导入各环境配置
import unitConfig from './unit.js'
import funcConfig from './func.js'
import uatConfig from './uat.js'
import prodConfig from './prod.js'

// 直接返回 uat 配置
const config = uatConfig

// 导出环境信息
export const currentEnv = config.env
export const isProduction = config.env === 'prod'
export const isDevelopment = config.env === 'func'
export const isTesting = config.env === 'unit'

// 导出配置对象
export default config

// 便捷的配置获取函数
export function getAPIBaseURL() {
  return config.api.baseURL
}

export function getAPITimeout() {
  return config.api.timeout
}

export function isFeatureEnabled(feature) {
  return config.features[feature] || false
}
EOF
else
    cat > src/config/index.js.tmp << 'EOF'
// 配置文件入口 - prod 环境
// 导入各环境配置
import unitConfig from './unit.js'
import funcConfig from './func.js'
import uatConfig from './uat.js'
import prodConfig from './prod.js'

// 直接返回 prod 配置
const config = prodConfig

// 导出环境信息
export const currentEnv = config.env
export const isProduction = config.env === 'prod'
export const isDevelopment = config.env === 'func'
export const isTesting = config.env === 'unit'

// 导出配置对象
export default config

// 便捷的配置获取函数
export function getAPIBaseURL() {
  return config.api.baseURL
}

export function getAPITimeout() {
  return config.api.timeout
}

export function isFeatureEnabled(feature) {
  return config.features[feature] || false
}
EOF
fi

# 移动临时文件为正式文件
mv src/config/index.js.tmp src/config/index.js

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
    sed -i.bak "s|baseURL: 'https://flask-7pin-202852-6-1383741966.sh.run.tcloudbase.com'|baseURL: '$API_URL'|g" src/config/prod.js
fi


PROJECT_PATH="$FRONTEND_PATH/src"
# Use the correct output path based on environment
BUILD_OUTPUT_PATH="$PROJECT_PATH/unpackage/dist/$BUILD_OUTPUT_DIR/mp-weixin"
# 运行微信小程序构建命令
echo "正在构建微信小程序..."
echo "构建参数："
echo "  平台: mp-weixin"
echo "  项目路径: $FRONTEND_PATH/src"
echo "  AppID: $WX_APPID"
echo "  源码映射: true"




# 捕获构建输出以便诊断
BUILD_EXIT_CODE=0

echo "清理上次构建残留的文件....$BUILD_OUTPUT_PATH"
rm -rf "$PROJECT_PATH/unpackage/dist"

/Applications/HBuilderX.app/Contents/MacOS/cli publish --platform mp-weixin --project $PROJECT_PATH --appid wx55a59cbcd4156ce4 

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

echo "=== 微信小程序构建完成 ==="
