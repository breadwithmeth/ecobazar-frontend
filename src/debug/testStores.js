// Тестовый файл для проверки API магазинов
const API_URL = 'http://localhost:8080/api/v2';

async function testStores() {
  const token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJlY29iYXphciIsImF1ZCI6InVzZXJzIiwiaWF0IjoxNzM3NTM1Mjg4LCJleHAiOjE3Mzc1Mzg4ODgsInVzZXJfaWQiOjEwMDEsInJvbGUiOiJBRE1JTiJ9.qTSHYa7_zOyqBKTNpuSzEqgOJwDnOq3ZD9a3Ek5FHng'; // Замените на реальный токен
  
  try {
    console.log('Testing stores API...');
    const response = await fetch(`${API_URL}/stores?page=1&limit=100`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      return;
    }
    
    const data = await response.json();
    console.log('Raw response:', data);
    console.log('Response type:', typeof data);
    console.log('Is array:', Array.isArray(data));
    
    if (data && typeof data === 'object') {
      console.log('Object keys:', Object.keys(data));
      if (data.data) {
        console.log('data.data:', data.data);
        console.log('data.data type:', typeof data.data);
        console.log('data.data keys:', Object.keys(data.data));
        
        if (data.data.stores) {
          console.log('stores found:', data.data.stores.length, 'items');
          console.log('first store:', data.data.stores[0]);
        }
      }
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Запускаем тест
testStores();
