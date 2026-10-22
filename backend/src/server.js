import './config/env.js';
import { createApp } from './app.js';
import { getPool } from './config/db.js';

const port = Number(process.env.PORT || 4000);

try {
  await getPool();
  const app = createApp();
  app.listen(port, '0.0.0.0', () => {
    console.log(`API đang chạy tại http://localhost:${port}`);
  });
} catch (error) {
  console.error('Không nối được SQL Server. Kiểm tra biến môi trường DB_* và database BanQuanAo.');
  console.error(error.message);
  process.exit(1);
}
