#!/bin/bash

# Android 本地打包脚本
# 使用 HBuilderX 本地打包功能生成 APK
# 注意: 需要先制作自定义调试基座

set -e  # 遇到错误时退出

echo "=== 开始 Android 本地打包 ==="

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

# 根据环境类型设置输出路径（所有环境统一使用 build）
BUILD_OUTPUT_DIR="build"

echo "===== ENV_TYPE ========="
echo $ENV_TYPE
echo "===== END ========="

# 清理旧的构建结果
BUILD_DIST_PATH="$FRONTEND_PATH/src/unpackage/dist/$BUILD_OUTPUT_DIR/android"
if [ -d "$BUILD_DIST_PATH" ]; then
    echo "清理旧的构建结果: $BUILD_DIST_PATH"
    rm -rf "$BUILD_DIST_PATH"
fi

mkdir -p $BUILD_DIST_PATH

echo "构建输出目录: $BUILD_DIST_PATH"

# 检查HBuilderX主应用 是否运行
echo "检查HBuilderX依赖..."
HBuilderX_MAIN_PROCESS="/Applications/HBuilderX.app/Contents/MacOS/HBuilderX"

# 检查HBuilderX主进程
if ! pgrep -f "$HBuilderX_MAIN_PROCESS" > /dev/null; then
    echo ""
    echo "=========================================="
    echo "错误: HBuilderX主应用 未运行"
    echo ""
    echo "请先启动HBuilderX应用 ："
    echo "1. 打开HBuilderX应用 "
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
BUILD_OUTPUT_PATH="$PROJECT_PATH/unpackage/dist/$BUILD_OUTPUT_DIR/android"
# 运行 Android 小 构建命令
echo "正在构建Android 网站..."
echo "构建参数："
echo "  平台: android"
echo "  项目路径: $FRONTEND_PATH/src"
echo "  源码映射: true"




# 捕获构建输出以便诊断
BUILD_EXIT_CODE=0

echo "清理上次构建残留的文件....$BUILD_OUTPUT_PATH"
rm -rf "$BUILD_OUTPUT_PATH"

echo "开始本地打包（使用自定义调试基座）..."
echo "注意: 本地打包需要先制作自定义调试基座"
echo "      菜单: 运行 -> 手机或模拟器 -> 制作自定义调试基座"

# 使用本地打包模式（不使用云打包）
BUILD_OUTPUT=$(/Applications/HBuilderX.app/Contents/MacOS/cli pack --platform android --project $PROJECT_PATH --config $FRONTEND_PATH/HBuilderConfig.json --force --type=local 2>&1)
echo "$BUILD_OUTPUT"

# 等待构建完成
echo "等待本地构建完成..."
sleep 5

# 查找生成的 APK 文件
echo "查找生成的 APK 文件..."
APK_PATH=$(find "$BUILD_OUTPUT_PATH" -name "*.apk" -type f | head -1)

if [ -z "$APK_PATH" ]; then
    echo "错误: 未找到生成的 APK 文件"
    echo "构建输出目录: $BUILD_OUTPUT_PATH"
    echo "请检查构建是否成功"
    exit 1
fi

echo "✓ 找到 APK 文件: $APK_PATH"

APK_SIZE=$(stat -f%z "$APK_PATH" 2>/dev/null || stat -c%s "$APK_PATH" 2>/dev/null)
echo "✓ APK 构建完成: $APK_PATH ($(echo $APK_SIZE | awk '{printf "%.2f MB", $1/1024/1024}'))"

# 检查模拟器是否运行
echo "检查模拟器状态..."
if ! adb devices | grep -q "device$"; then
    echo "模拟器未运行，正在启动 Pixel 模拟器..."
    $HOME/Library/Android/sdk/emulator/emulator -avd Pixel &
    echo "等待模拟器启动..."
    sleep 30
    
    # 等待模拟器完全启动
    MAX_WAIT=120
    WAIT_TIME=0
    while [ $WAIT_TIME -lt $MAX_WAIT ]; do
        if adb devices | grep -q "device$"; then
            echo "✓ 模拟器已启动"
            break
        fi
        sleep 5
        WAIT_TIME=$((WAIT_TIME + 5))
    done
    
    if [ $WAIT_TIME -ge $MAX_WAIT ]; then
        echo "错误: 模拟器启动超时"
        exit 1
    fi
else
    echo "✓ 模拟器正在运行"
fi

# 安装 APK
echo "开始安装 APK..."
adb install -r "$APK_PATH"

if [ $? -eq 0 ]; then
    echo "=========================================="
    echo "✓ APK 安装成功！"
    echo "=========================================="
    echo "包名: com.leadagile.safeguard"
    echo "APK 路径: $APK_PATH"
    echo ""
    echo "您可以使用以下命令启动应用："
    echo "  adb shell am start -n com.leadagile.safeguard/io.dcloud.PandoraEntry"
    echo "=========================================="
else
    echo "错误: APK 安装失败"
    exit 1
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

echo "=== Android  构建完成 ==="
