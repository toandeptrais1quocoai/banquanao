# NT shop — gian hàng quần áo & giày dép

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

Tài khoản mẫu: `an@ntshop.local` / `123456`

API lắng nghe cổng 4000. Ứng dụng web gọi `/api` qua Vite, nên trình duyệt không cần biết cổng đó.

## Giỏ hàng & thanh toán

- Biểu tượng giỏ trên từng món: thêm nhanh với size đầu tiên của món đó.
- Chưa đăng nhập: giỏ giữ trên máy (localStorage).
- Đã đăng nhập: giỏ lưu bảng `dbo.CartItems`. Xem nhanh bằng `dbo.vw_GioHang`.
- Đăng nhập khi đang có giỏ khách: hệ thống gộp vào tài khoản rồi xóa giỏ khách.
- Thanh toán COD: đơn lưu `dbo.Orders` / `dbo.OrderItems`, xem bằng `dbo.vw_DonHang`.

## Quên mật khẩu

Gắn Gmail App Password trong `backend/.env` (`GMAIL_USER`, `GMAIL_APP_PASSWORD`) để gửi OTP. Mã có hiệu lực 15 phút, lưu dạng băm trong `PasswordResets`.

## Đưa web lên mạng (24/7)

Stack đề xuất (miễn phí / gần miễn phí):

| Phần | Dịch vụ |
| --- | --- |
| Database | [Azure SQL](https://azure.microsoft.com/free/) (Free SQL Database) |
| API | [Render](https://render.com) (Web Service, root `backend`) |
| Giao diện | [Vercel](https://vercel.com) (root `frontend`) |
| Mã nguồn | GitHub (repo public hoặc private) |

### 1. Azure SQL

1. Tạo SQL Database tên `BanQuanAo`, ghi lại server `*.database.windows.net`, user, password.
2. Networking: cho phép Azure services + thêm IP máy bạn (để chạy schema/seed).
3. Mở Query editor, chạy `database/cloud-schema.sql`.
4. Trên máy (trỏ `.env` sang Azure), chạy `npm run seed --prefix backend` rồi `node backend/src/seedColors.js`.

### 2. GitHub + Render (API)

1. Đẩy repo lên GitHub.
2. Render → New → Blueprint / Web Service từ repo, hoặc dùng `render.yaml`.
3. Env bắt buộc: `DB_SERVER`, `DB_USER`, `DB_PASSWORD`, `DB_NAME=BanQuanAo`, `DB_ENCRYPT=true`, `JWT_SECRET`, `CORS_ORIGIN` = URL Vercel (cập nhật sau bước 3).

### 3. Vercel (frontend)

1. Import repo, **Root Directory** = `frontend`.
2. Env: `VITE_API_URL` = URL Render (ví dụ `https://nt-shop-api.onrender.com`, không có `/` cuối).
3. Deploy xong, copy URL Vercel vào `CORS_ORIGIN` trên Render và redeploy API.

Lưu ý: gói free Render có thể ngủ khi không ai vào (~1 phút lạnh khi mở lại). Tunnel Cloudflare chỉ dùng tạm khi máy bạn đang bật.
