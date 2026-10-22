import './config/env.js';
import { createApp } from './app.js';
import { getPool } from './config/db.js';

const port = Number(process.env.PORT || 4000);

try {
  await getPool();
  const app = createApp();
  app.listen(port, () => {
    console.log(`API đang chạy tại http://localhost:${port}`);
  });
} catch (error) {
  console.error('Không nối được SQL Server. Kiểm tra dịch vụ SQL Server và database BanQuanAo.');
  console.error(error.message);
  process.exit(1);
}
