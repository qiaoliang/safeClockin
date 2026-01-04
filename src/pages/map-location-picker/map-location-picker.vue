<template>
  <view class="map-location-picker-page">
    <!-- 搜索框 -->
    <view class="search-bar">
      <input
        v-model="searchKeyword"
        class="search-input"
        placeholder="搜索地址"
        @confirm="handleSearch"
      />
      <button
        v-if="searchKeyword"
        class="clear-btn"
        @click="clearSearch"
      >
        ✕
      </button>
    </view>

    <!-- 地图组件 -->
    <!-- #ifdef H5 -->
    <view
      id="communityMap"
      class="map-container"
    />
    <!-- #endif -->

    <!-- #ifndef H5 -->
    <map
      id="communityMap"
      class="map-container"
      :latitude="mapCenter.latitude"
      :longitude="mapCenter.longitude"
      :scale="mapScale"
      :show-location="true"
      :enable-traffic="false"
      :markers="markers"
      @tap="handleMapTap"
      @markertap="handleMarkerTap"
    />
    <!-- #endif -->

    <!-- 选点标记 -->
    <view class="marker-center">
      <view class="marker-icon" />
    </view>

    <!-- 地址信息卡片 -->
    <view class="address-card">
      <view class="address-info">
        <text class="address-text">{{ selectedAddress || '请在地图上选择位置' }}</text>
        <text
          v-if="administrativeInfo"
          class="administrative-text"
        >
          {{ administrativeInfo }}
        </text>
      </view>
      <button
        class="confirm-btn"
        :disabled="!selectedAddress"
        @click="handleConfirm"
      >
        确认选择
      </button>
    </view>

    <!-- 搜索结果列表 -->
    <view
      v-if="searchResults.length > 0"
      class="search-results"
    >
      <view
        v-for="(item, index) in searchResults"
        :key="index"
        class="result-item"
        @click="selectSearchResult(item)"
      >
        <text class="result-name">{{ item.title }}</text>
        <text class="result-address">{{ item.address }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import config from '@/config'
import { generateTencentMapSignature } from '@/utils/tencentMapSignature.js'

// 腾讯地图配置
const TENCENT_MAP_KEY = config.map?.key || ''
const TENCENT_MAP_SECRET = config.map?.secret || ''

// 状态
const searchKeyword = ref('')
const mapCenter = ref({
  latitude: 39.9042,
  longitude: 116.4074
})
const mapScale = ref(16)
const markers = ref([])
const selectedLocation = ref(null)
const selectedAddress = ref('')
const administrativeInfo = ref('')
const searchResults = ref([])
const eventChannel = ref(null)

// 页面加载
onLoad((options) => {
  console.log('onLoad 被调用，参数:', options)

  // 获取事件通道
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  eventChannel.value = currentPage.getOpenerEventChannel()

  console.log('事件通道获取结果:', eventChannel.value ? '成功' : '失败')

  // 如果传入了初始位置
  if (options.latitude && options.longitude) {
    mapCenter.value = {
      latitude: parseFloat(options.latitude),
      longitude: parseFloat(options.longitude)
    }
  } else {
    // 获取当前位置
    getCurrentLocation()
  }

  // #ifdef H5
  // H5环境下初始化腾讯地图
  initH5Map()
  // #endif
})

// #ifdef H5
// H5环境下初始化腾讯地图
const initH5Map = () => {
  console.log('初始化H5地图')
  // 等待腾讯地图SDK加载完成
  const checkMapSDK = setInterval(() => {
    if (window.TMap) {
      clearInterval(checkMapSDK)
      console.log('腾讯地图SDK已加载')

      // 创建地图实例
      const map = new TMap.Map('communityMap', {
        center: new TMap.LatLng(mapCenter.value.latitude, mapCenter.value.longitude),
        zoom: mapScale.value,
        viewMode: '2D'
      })

      // 添加点击事件
      map.on('click', (evt) => {
        const { lat, lng } = evt.latLng
        handleMapTap({
          detail: {
            latitude: lat,
            longitude: lng
          }
        })
      })

      console.log('H5地图初始化完成')
    }
  }, 100)
}
// #endif

// 获取当前位置
const getCurrentLocation = () => {
  console.log('开始获取当前位置')
  uni.getLocation({
    type: 'gcj02',
    success: (res) => {
      console.log('获取位置成功:', res)
      mapCenter.value = {
        latitude: res.latitude,
        longitude: res.longitude
      }
      // 获取详细地址
      reverseGeocode(res.latitude, res.longitude)
    },
    fail: (err) => {
      console.error('获取位置失败:', err)
      console.error('错误详情:', JSON.stringify(err))
      // 在 H5 环境下，如果获取位置失败，使用默认位置
      // #ifdef H5
      console.log('H5环境：使用默认位置')
      mapCenter.value = {
        latitude: 39.9042,
        longitude: 116.4074
      }
      // 不调用 reverseGeocode，等待用户点击地图
      // #endif

      // #ifndef H5
      uni.showModal({
        title: '定位权限说明',
        content: '需要获取您的位置信息以便选择地址。请在设置中允许应用访问您的位置信息。',
        showCancel: false,
        confirmText: '去设置',
        success: (res) => {
          if (res.confirm) {
            uni.openSetting({
              success: (settingRes) => {
                if (settingRes.authSetting['scope.userLocation']) {
                  // 用户已授权，重新获取位置
                  getCurrentLocation()
                }
              }
            })
          }
        }
      })
      // #endif
    }
  })
}

// 地图加载完成事件
const handleMapReady = (e) => {
  console.log('地图加载完成:', e)
  console.log('地图实例:', e.detail)
}

// 地图点击事件
const handleMapTap = (e) => {
  const { latitude, longitude } = e.detail

  // 验证坐标有效性
  if (latitude === undefined || latitude === null || longitude === undefined || longitude === null) {
    console.error('handleMapTap: 收到无效坐标:', { latitude, longitude })
    return
  }

  selectedLocation.value = { latitude, longitude }

  // 更新标记
  markers.value = [
    {
      id: 1,
      latitude,
      longitude,
      iconPath: '/static/marker.png',
      width: 30,
      height: 30,
      callout: {
        content: '选中位置',
        color: '#333',
        fontSize: 12,
        borderRadius: 5,
        bgColor: '#fff',
        padding: 5
      }
    }
  ]

  // 逆地理编码获取地址
  reverseGeocode(latitude, longitude)
}

// 标记点击事件
const handleMarkerTap = (e) => {
  console.log('Marker tapped:', e.detail.markerId)
}

// 逆地理编码（坐标转地址）
const reverseGeocode = (latitude, longitude) => {
  console.log('开始逆地理编码:', { latitude, longitude, apiKey: TENCENT_MAP_KEY })
  console.log('坐标类型:', { latitude: typeof latitude, longitude: typeof longitude })

  // Layer 3: 环境守卫 - 验证坐标有效性
  if (latitude === undefined || latitude === null || longitude === undefined || longitude === null) {
    console.error('坐标无效:', { latitude, longitude })
    console.error('调用栈:', new Error().stack)
    uni.showToast({
      title: '位置信息无效',
      icon: 'none',
      duration: 3000
    })
    return
  }

  // 准备请求参数（不包含签名，签名由 jsonpRequest 函数生成）
  const params = {
    location: `${latitude},${longitude}`,
    key: TENCENT_MAP_KEY,
    get_poi: 1,
    output: 'jsonp' // 使用JSONP方式解决CORS问题
  }

  // 使用腾讯地图 Web API（JSONP方式）
  const requestUrl = 'https://apis.map.qq.com/ws/geocoder/v1'
  console.log('完整请求URL:', requestUrl)
  console.log('请求参数:', params)

  // 使用JSONP方式请求（签名由 jsonpRequest 函数内部生成）
  jsonpRequest(requestUrl, params, (data) => {
    console.log('逆地理编码响应:', data)
    if (data.status === 0) {
      const result = data.result

      // 兼容新旧两种API响应格式
      if (typeof result.address === 'string') {
        // 旧格式：result.address 是字符串
        selectedAddress.value = result.address
        console.log('使用旧格式地址:', result.address)
      } else if (result.formatted_addresses && result.formatted_addresses.recommend) {
        // 新格式：result.address 是对象，地址在 formatted_addresses.recommend
        selectedAddress.value = result.formatted_addresses.recommend
        console.log('使用新格式地址:', result.formatted_addresses.recommend)
      } else if (result.address_component) {
        // 备用方案：组合地址组件
        selectedAddress.value = `${result.address_component.province}${result.address_component.city}${result.address_component.district}${result.address_component.street || ''}${result.address_component.street_number || ''}`
        console.log('使用备用方案地址:', selectedAddress.value)
      }

      // 提取行政区划信息
      if (result.address_component) {
        administrativeInfo.value = `${result.address_component.province}${result.address_component.city}${result.address_component.district}`
        console.log('行政区划信息:', administrativeInfo.value)
      }

      console.log('地址解析成功:', { address: selectedAddress.value, admin: administrativeInfo.value })
      console.log('状态更新完成:', {
        selectedAddress: selectedAddress.value,
        administrativeInfo: administrativeInfo.value,
        selectedLocation: selectedLocation.value
      })
    } else {
      console.error('逆地理编码返回错误:', data)
      uni.showToast({
        title: `获取地址失败: ${data.message || '未知错误'}`,
        icon: 'none',
        duration: 3000
      })
    }
  }, (error) => {
    console.error('逆地理编码请求失败:', error)
    uni.showToast({
      title: '网络请求失败',
      icon: 'none',
      duration: 3000
    })
  })
}

// #ifdef H5
// JSONP请求函数（H5专用）
const jsonpRequest = (url, params, successCallback, errorCallback) => {
  console.log('🔍 [Layer 4] 开始JSONP请求')
  console.log('🔍 [Layer 4] 请求URL:', url)
  console.log('🔍 [Layer 4] 原始参数:', JSON.stringify(params, null, 2))

  // 生成回调函数名
  const callbackName = `jsonpCallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  console.log('🔍 [Layer 4] 回调函数名:', callbackName)

  // 将callback参数添加到params中，用于签名计算
  const paramsWithCallback = {
    ...params,
    callback: callbackName
  }
  console.log('🔍 [Layer 4] 包含callback的参数:', JSON.stringify(paramsWithCallback, null, 2))

  // 从 URL 中提取 API 路径（用于签名计算）
  const apiUrl = new URL(url)
  const apiPath = apiUrl.pathname
  console.log('🔍 [Layer 4] API 路径:', apiPath)

  // 计算签名（包含callback参数，但不包含sig）
  const signedParams = generateTencentMapSignature(paramsWithCallback, TENCENT_MAP_SECRET, apiPath)

  // 构建完整的URL（使用签名后的参数）
  const queryString = Object.keys(signedParams)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(signedParams[key])}`)
    .join('&')

  const fullUrl = `${url}?${queryString}`

  console.log('🔍 [Layer 4] JSONP请求URL:', fullUrl)
  console.log('🔍 [Layer 4] 最终签名:', signedParams.sig)

  // 创建全局回调函数
  window[callbackName] = (data) => {
    console.log('🔍 [Layer 4] JSONP回调执行:', data)
    successCallback(data)
    // 清理
    delete window[callbackName]
    if (scriptElement && scriptElement.parentNode) {
      scriptElement.parentNode.removeChild(scriptElement)
    }
  }

  // 创建script标签
  const scriptElement = document.createElement('script')
  scriptElement.src = fullUrl
  scriptElement.onerror = () => {
    console.error('🔍 [Layer 4] JSONP请求失败')
    errorCallback(new Error('JSONP请求失败'))
    // 清理
    delete window[callbackName]
    if (scriptElement && scriptElement.parentNode) {
      scriptElement.parentNode.removeChild(scriptElement)
    }
  }

  // 添加到页面
  document.body.appendChild(scriptElement)
  console.log('🔍 [Layer 4] JSONP请求已发送')
}
// #endif

// #ifndef H5
// 普通请求函数（小程序专用）
const jsonpRequest = (url, params, successCallback, errorCallback) => {
  console.log('🔍 [Layer 4] 开始普通请求')
  console.log('🔍 [Layer 4] 请求URL:', url)
  console.log('🔍 [Layer 4] 请求参数:', JSON.stringify(params, null, 2))

  uni.request({
    url: url,
    data: params,
    success: (res) => {
      console.log('🔍 [Layer 4] 请求响应:', res.data)
      console.log('🔍 [Layer 4] 响应类型:', typeof res.data)

      // 解析JSONP格式的响应
      let data = res.data
      if (typeof res.data === 'string') {
        console.log('🔍 [Layer 4] 检测到JSONP格式响应，需要解析')
        // JSONP格式: QQmap&&QQmap({...})
        // 使用非贪婪匹配 (.+?) 来正确提取 JSON 数据
        const match = res.data.match(/QQmap&&QQmap\((.+?)\)/)
        if (match) {
          console.log('🔍 [Layer 4] 提取JSON数据:', match[1])
          data = JSON.parse(match[1])
        } else {
          console.error('🔍 [Layer 4] JSONP响应格式不匹配:', res.data)
        }
      }

      console.log('🔍 [Layer 4] 解析后的数据:', data)
      successCallback(data)
    },
    fail: (error) => {
      console.error('🔍 [Layer 4] 请求失败:', error)
      errorCallback(error)
    }
  })
}
// #endif

// 地址搜索
const handleSearch = () => {
  if (!searchKeyword.value.trim()) {
    return
  }

  console.log('开始地址搜索:', { keyword: searchKeyword.value, apiKey: TENCENT_MAP_KEY })

  // 准备请求参数（不包含签名，签名由 jsonpRequest 函数生成）
  const params = {
    keyword: searchKeyword.value,
    boundary: `nearby(${mapCenter.value.latitude},${mapCenter.value.longitude},10000)`,
    key: TENCENT_MAP_KEY,
    page_size: 10,
    output: 'jsonp' // 使用JSONP方式解决CORS问题
  }

  // 使用腾讯地图 Web API（JSONP方式）
  const requestUrl = 'https://apis.map.qq.com/ws/place/v1/search'

  // 使用JSONP方式请求（签名由 jsonpRequest 函数内部生成）
  jsonpRequest(requestUrl, params, (data) => {
    console.log('地址搜索响应:', data)
    if (data.status === 0) {
      searchResults.value = data.data.map(item => ({
        title: item.title,
        address: item.address,
        location: {
          latitude: item.location.lat,
          longitude: item.location.lng
        },
        ad_info: item.ad_info
      }))
      console.log('搜索成功，找到', searchResults.value.length, '个结果')
    } else {
      console.error('地址搜索返回错误:', data)
      uni.showToast({
        title: `搜索失败: ${data.message || '未知错误'}`,
        icon: 'none',
        duration: 3000
      })
    }
  }, (error) => {
    console.error('地址搜索请求失败:', error)
    uni.showToast({
      title: '网络请求失败',
      icon: 'none',
      duration: 3000
    })
  })
}

// 选择搜索结果
const selectSearchResult = (item) => {
  selectedLocation.value = item.location
  selectedAddress.value = item.address
  administrativeInfo.value = `${item.ad_info.province}${item.ad_info.city}${item.ad_info.district}`

  // 更新地图中心
  mapCenter.value = item.location
  mapScale.value = 17

  // 更新标记
  markers.value = [
    {
      id: 1,
      latitude: item.location.latitude,
      longitude: item.location.longitude,
      iconPath: '/static/marker.png',
      width: 30,
      height: 30
    }
  ]

  // 清空搜索结果
  searchResults.value = []
  searchKeyword.value = ''
}

// 清空搜索
const clearSearch = () => {
  searchKeyword.value = ''
  searchResults.value = []
}

// 确认选择
const handleConfirm = () => {
  console.log('handleConfirm 被调用')
  console.log('当前状态:', {
    selectedLocation: selectedLocation.value,
    selectedAddress: selectedAddress.value,
    administrativeInfo: administrativeInfo.value
  })

  if (!selectedLocation.value || !selectedAddress.value) {
    console.error('验证失败: 请先选择位置')
    uni.showToast({
      title: '请先选择位置',
      icon: 'none'
    })
    return
  }

  // 解析行政区划信息
  const province = administrativeInfo.value.substring(0, 3)
  const city = administrativeInfo.value.substring(3, 6)
  const district = administrativeInfo.value.substring(6, 9)
  const street = selectedAddress.value.replace(administrativeInfo.value, '')

  console.log('解析后的行政区划:', { province, city, district, street })

  // 通过事件通道返回数据
  if (eventChannel.value) {
    console.log('通过事件通道发送数据')
    eventChannel.value.emit('onLocationSelected', {
      location: selectedAddress.value,
      location_lat: selectedLocation.value.latitude,
      location_lon: selectedLocation.value.longitude,
      province,
      city,
      district,
      street
    })
  } else {
    console.error('事件通道不存在')
  }

  // 返回上一页
  console.log('准备返回上一页')
  uni.navigateBack()
}
</script>

<style lang="scss" scoped>
@import '@/uni.scss';

.map-location-picker-page {
  position: relative;
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.search-bar {
  position: absolute;
  top: 20rpx;
  left: 20rpx;
  right: 20rpx;
  z-index: 1000; /* 提高 z-index 确保在地图之上 */
  display: flex;
  align-items: center;
  background: $uni-bg-color-white;
  border-radius: $uni-radius-base;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
  padding: 0 20rpx;
  pointer-events: auto; /* 确保可以接收点击事件 */
}

.search-input {
  flex: 1;
  height: 80rpx;
  font-size: $uni-font-size-base;
  color: $uni-text-primary;
}

.clear-btn {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: $uni-font-size-lg;
  color: $uni-text-secondary;
  background: transparent;
  border: none;
  padding: 0;
  margin: 0;
}

.map-container {
  flex: 1;
  width: 100%;
  height: 100%;
  min-height: 400px;
}

.marker-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 50;
  pointer-events: none;
}

.marker-icon {
  width: 40rpx;
  height: 40rpx;
  background: $uni-primary;
  border-radius: 50%;
  border: 4rpx solid $uni-bg-color-white;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.3);
}

.address-card {
  position: absolute;
  bottom: 40rpx;
  left: 20rpx;
  right: 20rpx;
  background: $uni-bg-color-white;
  border-radius: $uni-radius-base;
  box-shadow: 0 -4rpx 16rpx rgba(0, 0, 0, 0.1);
  padding: 24rpx;
  z-index: 1000; /* 提高 z-index 确保在地图之上 */
  pointer-events: auto; /* 确保可以接收点击事件 */
}

.address-info {
  margin-bottom: 24rpx;
}

.address-text {
  display: block;
  font-size: $uni-font-size-lg;
  color: $uni-text-primary;
  font-weight: $uni-font-weight-base;
  margin-bottom: 12rpx;
}

.administrative-text {
  display: block;
  font-size: $uni-font-size-sm;
  color: $uni-text-secondary;
}

.confirm-btn {
  width: 100%;
  height: 88rpx;
  @include btn-primary;
  border: none;
  border-radius: $uni-radius-base;
  font-size: $uni-font-size-base;
  font-weight: $uni-font-weight-base;

  &:disabled {
    opacity: 0.5;
  }
}

.search-results {
  position: absolute;
  top: 120rpx;
  left: 20rpx;
  right: 20rpx;
  background: $uni-bg-color-white;
  border-radius: $uni-radius-base;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
  max-height: 600rpx;
  overflow-y: auto;
  z-index: 100;
}

.result-item {
  padding: 24rpx;
  border-bottom: 1rpx solid $uni-border-color;

  &:last-child {
    border-bottom: none;
  }
}

.result-name {
  display: block;
  font-size: $uni-font-size-base;
  color: $uni-text-primary;
  font-weight: $uni-font-weight-base;
  margin-bottom: 8rpx;
}

.result-address {
  display: block;
  font-size: $uni-font-size-sm;
  color: $uni-text-gray-600;
}
</style>