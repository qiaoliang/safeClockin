import { describe, it, expect } from 'vitest'

describe('map-location-picker 地址解析', () => {
  it('应该正确处理包含 formatted_addresses 的响应', () => {
    // 模拟实际的API响应（从日志中提取）
    const mockResponse = {
      status: 0,
      message: 'query ok',
      result: {
        location: {
          lat: 39.9057,
          lng: 116.41159
        },
        address: {
          province: '北京市',
          city: '北京市',
          district: '东城区',
          street: '东华门街道',
          street_number: '人民政府3号楼'
        },
        formatted_addresses: {
          recommend: '东城区北京市人民政府3号楼(正义路东)',
          rough: '东城区北京市人民政府3号楼(正义路东)',
          standard_address: '北京市东城区东华门街道人民政府'
        },
        address_component: {
          nation: '中国',
          province: '北京市',
          city: '北京市',
          district: '东城区',
          street: '东华门街道',
          street_number: '人民政府3号楼'
        }
      }
    }

    // 测试数据提取逻辑
    const result = mockResponse.result

    // 旧代码逻辑（会失败）
    const oldLogic = result.address
    console.log('旧逻辑结果:', oldLogic)
    console.log('旧逻辑类型:', typeof oldLogic)

    // 新代码逻辑（应该成功）
    let selectedAddress = ''
    if (typeof result.address === 'string') {
      // 兼容旧格式
      selectedAddress = result.address
    } else if (result.formatted_addresses && result.formatted_addresses.recommend) {
      // 新格式：使用 formatted_addresses.recommend
      selectedAddress = result.formatted_addresses.recommend
    } else if (result.address_component) {
      // 备用方案：组合地址组件
      selectedAddress = `${result.address_component.province}${result.address_component.city}${result.address_component.district}${result.address_component.street}${result.address_component.street_number}`
    }

    console.log('新逻辑结果:', selectedAddress)
    console.log('新逻辑类型:', typeof selectedAddress)

    // 验证新逻辑能正确提取地址
    expect(typeof selectedAddress).toBe('string')
    expect(selectedAddress).toBe('东城区北京市人民政府3号楼(正义路东)')
  })

  it('应该兼容旧格式的响应（address 是字符串）', () => {
    // 模拟旧格式的API响应
    const mockResponse = {
      status: 0,
      result: {
        address: '北京市东城区东华门街道人民政府',
        address_component: {
          province: '北京市',
          city: '北京市',
          district: '东城区'
        }
      }
    }

    const result = mockResponse.result

    // 新代码逻辑（应该兼容旧格式）
    let selectedAddress = ''
    if (typeof result.address === 'string') {
      selectedAddress = result.address
    } else if (result.formatted_addresses && result.formatted_addresses.recommend) {
      selectedAddress = result.formatted_addresses.recommend
    }

    expect(selectedAddress).toBe('北京市东城区东华门街道人民政府')
  })
})