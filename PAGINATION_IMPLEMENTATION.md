# Реализация пагинации заказов в админ-панели

## Обзор
Добавлена полная функциональность пагинации для управления заказами в административной панели EcoBazar.

## Реализованные компоненты

### 1. AdminOrders.tsx
**Изменения в интерфейсе Props:**
```typescript
interface Props {
  orders: Order[];
  couriers: User[];
  loading: boolean;
  error: string | null;
  onStatusChange: (orderId: number, status: string) => Promise<void>;
  onCourierAssign: (orderId: number, courierId: number) => Promise<void>;
  // Новые props для пагинации
  onPageChange: (page: number) => void;
  currentPage: number;
  totalPages: number;
  totalOrders: number;
}
```

**Добавленная пагинация UI:**
- Навигационные кнопки "Предыдущая" и "Следующая"
- Пронумерованные кнопки страниц (показывает до 5 страниц)
- Отображение текущей позиции (например, "Страница 1 из 3")
- Общее количество заказов
- Адаптивный дизайн с правильным отключением кнопок

### 2. AdminPage.tsx
**Новые состояния пагинации:**
```typescript
const [ordersCurrentPage, setOrdersCurrentPage] = useState(1);
const [ordersTotalPages, setOrdersTotalPages] = useState(1);
const [ordersTotalCount, setOrdersTotalCount] = useState(0);
```

**Обновленная функция loadOrders:**
```typescript
const loadOrders = async (page = 1) => {
  try {
    setOrdersLoading(true);
    setOrdersError(null);
    const response = await apiGetAdminOrders(page, 10); // 10 заказов на страницу
    if (response.success && response.data) {
      setOrders(response.data.orders);
      setOrdersCurrentPage(response.data.page);
      setOrdersTotalPages(response.data.totalPages);
      setOrdersTotalCount(response.data.total);
    }
  } catch (error) {
    console.error('Ошибка загрузки заказов:', error);
    setOrdersError('Ошибка загрузки заказов');
  } finally {
    setOrdersLoading(false);
  }
};
```

**Обработчик смены страницы:**
```typescript
const handleOrdersPageChange = (page: number) => {
  loadOrders(page);
};
```

### 3. API интеграция
**Обновленная функция apiGetAdminOrders:**
```typescript
export const apiGetAdminOrders = async (page = 1, limit = 10) => {
  const response = await apiCall(
    'GET',
    `/admin/orders?page=${page}&limit=${limit}`
  );
  return response;
};
```

## Особенности реализации

### Пользовательский интерфейс
- **Адаптивная навигация:** Показывает до 5 номеров страниц одновременно
- **Умные кнопки:** Автоматическое отключение кнопок "Предыдущая/Следующая" на крайних страницах
- **Информативность:** Отображение текущей позиции и общего количества записей
- **Загрузочные состояния:** Правильная обработка состояний загрузки

### Техническая архитектура
- **Состояние пагинации:** Централизованное управление в AdminPage.tsx
- **API интеграция:** Поддержка параметров page и limit
- **TypeScript:** Полная типизация всех новых интерфейсов
- **Обработка ошибок:** Корректная обработка ошибок загрузки

### Параметры пагинации
- **Размер страницы:** 10 заказов на страницу (настраиваемо)
- **Навигация:** Поддержка прямого перехода на любую страницу
- **Производительность:** Загрузка только необходимых данных

## Использование

1. **Переход между страницами:** Клик по номеру страницы или кнопкам навигации
2. **Отображение информации:** Автоматическое обновление счетчиков и позиции
3. **Сохранение контекста:** Пагинация работает независимо от других операций

## Совместимость

- ✅ Работает с существующей системой ролей (ADMIN, SELLER, COURIER)
- ✅ Совместимо с фильтрацией и сортировкой заказов
- ✅ Поддерживает все существующие операции (изменение статуса, назначение курьера)
- ✅ Адаптивный дизайн для различных размеров экрана

## Тестирование

Для тестирования пагинации:
1. Запустите приложение: `PORT=3001 npm start`
2. Войдите как администратор
3. Перейдите в раздел "Заказы"
4. Проверьте навигацию между страницами
5. Убедитесь в корректности отображения счетчиков

## Дальнейшие улучшения

- Возможность изменения размера страницы
- Фильтрация по статусу с сохранением пагинации
- Поиск по заказам с пагинацией результатов
- Кэширование данных для улучшения производительности
