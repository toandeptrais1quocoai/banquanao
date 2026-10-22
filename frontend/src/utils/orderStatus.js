export const ORDER_STATUS_LABEL = {
  awaiting_payment: 'Chờ thanh toán',
  pending: 'Đã đặt đơn',
  confirmed: 'Đã xác nhận',
  shipping: 'Đang giao',
  done: 'Hoàn tất',
  cancelled: 'Đã hủy',
};

export function formatOrderStatus(status) {
  return ORDER_STATUS_LABEL[status] || status || 'Đã đặt đơn';
}

/** Khách chỉ hủy được khi admin chưa xác nhận. */
export function canCustomerCancel(status) {
  return status === 'pending' || status === 'awaiting_payment';
}
