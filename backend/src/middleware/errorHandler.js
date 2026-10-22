export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    next(err);
    return;
  }
  if (err.type === 'entity.parse.failed') {
    res.status(400).json({ message: 'Dữ liệu gửi lên không đọc được.' });
    return;
  }
  const status = err.status || 500;
  if (status === 500) {
    console.error(err);
  }
  const message = status === 500 ? 'Có lỗi ở máy chủ. Bạn thử lại giúp.' : err.message;
  res.status(status).json({ message });
}
