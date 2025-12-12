# Event Messaging Specification

## 1. Message Broker

- **Technology**: RabbitMQ
- **Exchange Type**: Fanout (hoặc Topic)

## 2. Event Contracts

Các sự kiện nghiệp vụ (Domain Events) được bắn ra hệ thống.

### `OrderCreatedEvent`

- **Trigger**: Khi User đặt hàng thành công tại Ordering Service.
- **Publisher**: Ordering Service.
- **Consumers**:
  - _Email Service_: Gửi mail xác nhận.
  - _Cart Service_: Xóa giỏ hàng.
- **Payload Format (JSON)**:
  ```json
  {
    "OrderId": "guid-xxx",
    "UserId": "guid-yyy",
    "TotalAmount": 150.0,
    "CreatedAt": "2025-12-01T10:00:00Z"
  }
  ```

## 3. Retry Policy

- Sử dụng thư viện **MassTransit** Retry Policy.
- **Strategy**: Incremental Retry (Thử lại tăng dần).
- **Config**: Retry 3 lần, khoảng cách 2s, 5s, 10s. Nếu vẫn lỗi -> Đẩy vào Dead Letter Queue (DLQ).

## 4. Implemented Event Saga (Update)

Quy trình xử lý đơn hàng (Choreography) đã được triển khai như sau:

### Config RabbitMQ

- **Host:** `shoporbit-rabbitmq` (Docker Network).
- **Retry Policy:** Incremental (3 lần: 2s, 5s, 10s) cấu hình trong `Program.cs` consumer.

### Luồng sự kiện 1: Order Created

- **Trigger:** API `POST /api/orders` thành công (Status: Pending).
- **Publisher:** `Ordering Service`.
- **Consumer:** `Payment Service` (Class `OrderCreatedConsumer`).
- **Payload:**
  ```json
  {
    "OrderId": "Guid",
    "UserId": "Guid",
    "TotalAmount": decimal,
    "CreatedAt": "DateTime"
  }
  ```

### Luồng sự kiện 2: Payment Succeeded

Đây là bước xác nhận thanh toán để hoàn tất quy trình đơn hàng (Saga Choreography).

- **Tên sự kiện:** `ShopOrbit.BuildingBlocks.Contracts.PaymentSucceededEvent`
- **Trigger (Kích hoạt):**
  - Sau khi `Payment Service` xử lý sự kiện `OrderCreatedEvent` thành công.
  - Giao dịch thanh toán đã được lưu an toàn vào bảng `Payments` trong Database.
- **Publisher (Người gửi):** `Payment Service`
- **Consumer (Người nhận):** `Ordering Service` (Class `PaymentSucceededConsumer`)

#### Data Payload (JSON)

Dữ liệu được gửi đi trên RabbitMQ:

```json
{
  "OrderId": "Guid (ID của đơn hàng gốc)",
  "PaymentId": "Guid (ID của giao dịch thanh toán vừa tạo)",
  "ProcessedAt": "DateTime (Thời gian xử lý, UTC)"
}
```
