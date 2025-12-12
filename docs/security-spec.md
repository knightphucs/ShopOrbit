# Security Specification - ShopOrbit

## 1. Authentication Flow (JWT)

Hệ thống sử dụng cơ chế **JSON Web Token (JWT)** để xác thực.

1.  **Client** gửi credentials (username, password) tới `Identity Service`.
2.  **Identity Service** xác thực. Nếu đúng, trả về `Access Token` (chứa Claims: Sub, Role, Exp).
3.  **Client** gửi request tới các Resource API (Catalog, Ordering) thông qua **API Gateway**.
4.  **Header** của request phải chứa: `Authorization: Bearer <token>`.

## 2. Roles & Permissions

Hệ thống định nghĩa 3 Roles chính:

- **Admin**: Toàn quyền hệ thống (CRUD Products, Manage Users, View All Orders).
- **Staff**: Quản lý đơn hàng, xem danh sách sản phẩm (Update Order Status).
- **User**: Khách hàng (View Products, Place Order, View My Orders).

## 3. Protected Endpoints

| Service  | Method | Endpoint           | Required Role | Description         |
| :------- | :----- | :----------------- | :------------ | :------------------ |
| Catalog  | POST   | /api/products      | Admin         | Tạo sản phẩm mới    |
| Catalog  | PUT    | /api/products/{id} | Admin, Staff  | Cập nhật giá/kho    |
| Ordering | GET    | /api/orders        | Admin, Staff  | Xem tất cả đơn hàng |
| Ordering | POST   | /api/orders        | User          | Đặt hàng            |

## 4. Implementation Details (Update)

Chi tiết triển khai bảo mật trong code (Authentication & Authorization):

### JWT Configuration

- **Middleware:** `Microsoft.AspNetCore.Authentication.JwtBearer`.
- **Secret Key:** Đọc từ biến môi trường `JwtSettings__Secret` (trong Docker Compose).
- **Claims:** Hệ thống phụ thuộc vào claim `http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier` để định danh User ID (GUID).

### Secure Basket Flow (Basket Service)

- **Attribute:** `[Authorize]` trên `BasketController`.
- **Logic:**
  - API **không nhận** tham số `userName` từ URL hay Body để tránh IDOR.
  - Code tự động trích xuất `UserId` từ Token Context:
    ```csharp
    var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
    ```
  - Dùng `userId` này để truy xuất Redis.

### Secure Order Flow (Ordering Service)

- **Attribute:** `[Authorize]` trên `OrdersController`.
- **Logic:**
  - Client gửi Request Body rỗng (hoặc chỉ chứa address).
  - Server lấy `UserId` từ Token -> Tự động query sang Redis để lấy Items.
  - Ngăn chặn việc Client giả mạo đơn giá hoặc số lượng sản phẩm.
