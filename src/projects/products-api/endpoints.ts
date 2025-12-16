import { EndpointConfig } from '../../core/types'

/**
 * Products API Endpoints
 * 
 * ทุก endpoint ต้องมี JWT token (inject อัตโนมัติจาก httpClient)
 */

// Helper: สร้าง random product data
function randomProductData() {
  const id = Math.floor(Math.random() * 1000)
  return {
    name: `Product ${id}`,
    description: `Description for product ${id}`,
    price: Math.floor(Math.random() * 10000) + 100,
    stock: Math.floor(Math.random() * 100) + 1,
  }
}

// Helper: random product ID (1-10 สำหรับ test)
function randomProductId(): number {
  return Math.floor(Math.random() * 10) + 1
}

/**
 * Endpoints สำหรับ simple scenario
 * ยิงทุก endpoint ตามลำดับ
 */
export const endpoints: EndpointConfig[] = [
  {
    name: 'Get All Products',
    method: 'GET',
    url: '/products',
  },
  {
    name: 'Get Product by ID',
    method: 'GET',
    url: '/products/1',
  },
  {
    name: 'Create Product',
    method: 'POST',
    url: '/products',
    body: () => randomProductData(),
  },
  {
    name: 'Update Product',
    method: 'PUT',
    url: '/products/1',
    body: () => ({
      name: 'Updated Product',
      price: 999,
    }),
  },
  {
    name: 'Delete Product',
    method: 'DELETE',
    url: '/products/1',
  },
]

/**
 * Flow Steps สำหรับ flow scenario
 * จำลอง user journey: ดูสินค้า → สร้าง → แก้ไข → ลบ
 */
export const flowSteps: EndpointConfig[] = [
  // Step 1: ดูรายการสินค้าทั้งหมด
  {
    name: 'Browse Products',
    method: 'GET',
    url: '/products',
  },
  // Step 2: ดูรายละเอียดสินค้า
  {
    name: 'View Product Detail',
    method: 'GET',
    url: '/products/1',
  },
  // Step 3: สร้างสินค้าใหม่
  {
    name: 'Create New Product',
    method: 'POST',
    url: '/products',
    body: () => randomProductData(),
  },
  // Step 4: อัพเดทสินค้า
  {
    name: 'Update Product',
    method: 'PUT',
    url: '/products/1',
    body: () => ({
      name: 'Updated via Load Test',
      price: 1234,
    }),
  },
]

/**
 * Read-only endpoints (สำหรับ test แบบไม่ modify data)
 */
export const readOnlyEndpoints: EndpointConfig[] = [
  {
    name: 'Get All Products',
    method: 'GET',
    url: '/products',
  },
  {
    name: 'Get Product 1',
    method: 'GET',
    url: '/products/1',
  },
  {
    name: 'Get Product 2',
    method: 'GET',
    url: '/products/2',
  },
  {
    name: 'Get Product 3',
    method: 'GET',
    url: '/products/3',
  },
]

