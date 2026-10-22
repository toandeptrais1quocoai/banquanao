# MỘC — gian hàng quần áo

Ba phần tách riêng, để sau này thêm giỏ hàng hay đơn hàng mà không phải viết lại từ đầu.

| Thư mục | Vai trò |
| --- | --- |
| `frontend/` | Giao diện React. Trang, thành phần, gọi API. |
| `backend/` | API. `routes` nhận yêu cầu, `services` xử lý, `repositories` viết SQL. |
| `database/` | Script tạo database trên SQL Server của máy này. |

Dữ liệu nằm ở SQL Server, database `BanQuanAo`, instance mặc định trên máy này. API đăng nhập bằng tài khoản Windows qua ODBC, cùng kiểu SSMS đang dùng. Mở SQL Server Management Studio, server `localhost`, rồi sửa thẳng bảng `dbo.Products` (giá, tên, mô tả, size). Xem nhanh bằng `dbo.vw_SanPham` và `dbo.vw_TaiKhoan`. Cột `PasswordHash` là mật khẩu đã băm, không sửa tay — đổi mật khẩu ở trang Quên mật khẩu.

## Chạy

```powershell
cd e:\banquanao
npm install
npm install --prefix backend
npm install --prefix frontend
npm run db
npm run seed
npm run dev
```

Mở http://localhost:5173

Tài khoản mẫu: `an@moc.local` / `123456`

API lắng nghe cổng 4000. Ứng dụng web gọi `/api` qua Vite, nên trình duyệt không cần biết cổng đó.

## Giỏ hàng & thanh toán

- Biểu tượng giỏ trên từng món: thêm nhanh với size đầu tiên của món đó.
- Chưa đăng nhập: giỏ giữ trên máy (localStorage).
- Đã đăng nhập: giỏ lưu bảng `dbo.CartItems`. Xem nhanh bằng `dbo.vw_GioHang`.
- Đăng nhập khi đang có giỏ khách: hệ thống gộp vào tài khoản rồi xóa giỏ khách.
- Thanh toán COD: đơn lưu `dbo.Orders` / `dbo.OrderItems`, xem bằng `dbo.vw_DonHang`.

## Quên mật khẩu

Shop chạy trên máy, chưa gắn hộp thư. Sau khi nhập email, mã 6 số hiện ngay trên trang và có hiệu lực 15 phút. Mã được lưu dạng băm trong bảng `PasswordResets`.
