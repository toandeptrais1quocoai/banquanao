import { formatPrice } from '../utils/format';

function formatDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

const STATUS_LABEL = {
  pending: 'Chờ giao',
  confirmed: 'Đã xác nhận',
  shipping: 'Đang giao',
  done: 'Hoàn tất',
  cancelled: 'Đã hủy',
};

function formatStatus(status) {
  return STATUS_LABEL[status] || status || 'Mới';
}

export default function Invoice({ order }) {
  const items = order.items || [];
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <article className="invoice" id="hoa-don">
      <header className="invoice-head">
        <div>
          <p className="invoice-brand">NT shop</p>
          <p className="invoice-sub">Hóa đơn bán hàng</p>
        </div>
        <div className="invoice-meta">
          <p>
            <span>Số hóa đơn</span>
            <strong>#{order.id}</strong>
          </p>
          <p>
            <span>Ngày lập</span>
            <strong>{formatDateTime(order.createdAt)}</strong>
          </p>
          <p>
            <span>Trạng thái</span>
            <strong>{formatStatus(order.status)}</strong>
          </p>
        </div>
      </header>

      <section className="invoice-parties">
        <div>
          <h2>Người bán</h2>
          <p>
            <strong>NT shop</strong>
          </p>
          <p>Gian hàng quần áo</p>
          <p>Thanh toán khi nhận hàng (COD)</p>
        </div>
        <div>
          <h2>Người mua</h2>
          <p>
            <strong>{order.fullName}</strong>
          </p>
          <p>ĐT: {order.phone}</p>
          {order.address ? <p>{order.address}</p> : null}
          {order.note ? <p>Ghi chú: {order.note}</p> : null}
        </div>
      </section>

      <table className="invoice-table">
        <thead>
          <tr>
            <th scope="col">#</th>
            <th scope="col">Sản phẩm</th>
            <th scope="col">Màu</th>
            <th scope="col">Size</th>
            <th scope="col">Đơn giá</th>
            <th scope="col">SL</th>
            <th scope="col">Thành tiền</th>
          </tr>
        </thead>
        <tbody>
          {items.length ? (
            items.map((item, index) => (
              <tr key={item.id || `${item.productId}-${item.size}-${item.color}-${index}`}>
                <td>{index + 1}</td>
                <td>{item.productName || item.name}</td>
                <td>{item.color || item.colorName || '—'}</td>
                <td>{item.size}</td>
                <td>{formatPrice(item.unitPrice)}</td>
                <td>{item.quantity}</td>
                <td>{formatPrice(item.lineTotal ?? item.unitPrice * item.quantity)}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={7}>Chưa có dòng hàng.</td>
            </tr>
          )}
        </tbody>
      </table>

      <footer className="invoice-foot">
        <p>
          {itemCount} món · {order.paymentMethod || 'COD'}
        </p>
        <p className="invoice-total">
          <span>Tổng cộng</span>
          <strong>{formatPrice(order.total)}</strong>
        </p>
      </footer>
    </article>
  );
}
