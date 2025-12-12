# Caching Strategy Plan

## 1. Redis Caching (Server-Side)

Áp dụng cho dữ liệu đọc nhiều, ít thay đổi (Read-heavy).

| Cache Key Pattern      | Data Content                   | TTL (Time To Live) | Invalidation Strategy              |
| :--------------------- | :----------------------------- | :----------------- | :--------------------------------- |
| `catalog:products:all` | List of all products (summary) | 10 minutes         | Xóa khi Admin thêm/sửa/xóa Product |
| `catalog:product:{id}` | Product detail                 | 30 minutes         | Xóa khi update Product đó          |

## 2. HTTP Caching (Client-Side)

Sử dụng HTTP Headers để browser/proxy cache lại response.

- **Cache-Control**: `public, max-age=60` (Cache 60s cho danh sách sản phẩm).
- **ETag**: Server tính toán hash của data trả về.
  - Nếu Client gửi `If-None-Match` trùng với hash hiện tại -> Trả về `304 Not Modified` (Không tốn băng thông body).

## 3. Implemented Caching Flows (Update)

Dưới đây là các luồng Cache đã được triển khai thực tế trong code:

### A. Basket Service (Redis as Primary Store)

- **Mục đích:** Lưu trữ giỏ hàng tạm thời (Stateful).
- **Key Pattern:** `{UserId}` (GUID Raw).
  - _Lưu ý:_ Đã **loại bỏ** `InstanceName` prefix trong `Program.cs` để đảm bảo Ordering Service có thể đọc được key này.
- **Data Structure:** JSON String (Serialized `ShoppingCart` object).
- **TTL:** Persist (Không tự hết hạn, chờ User đặt hàng xong sẽ xóa).
- **Logic:**
  - Write: `BasketController` ghi đè toàn bộ JSON mới.
  - Read: `BasketController` đọc JSON trả về Client.

### B. Ordering Service (Redis Reader)

- **Mục đích:** Lấy dữ liệu giỏ hàng để tạo đơn (Bảo mật giá).
- **Logic:**
  - Khi gọi `POST /api/orders`, Service lấy `UserId` từ Token -> Đọc Redis Key `{UserId}`.
  - **Invalidation:** Sau khi `SaveChanges` thành công vào PostgreSQL -> Gọi lệnh `RemoveAsync(userId)` để xóa sạch giỏ hàng.

### C. Payment Service (Idempotency Key)

- **Mục đích:** Chống trùng lặp giao dịch (Idempotency).
- **Key Pattern:** `processed_order_{OrderId}`
- **TTL:** 24 giờ.
- **Logic:**
  - Trước khi xử lý: `Get(key)`. Nếu tồn tại -> Return.
  - Sau khi xử lý: `Set(key, "processed")` để đánh dấu.
