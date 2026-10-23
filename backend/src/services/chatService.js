import { AppError } from '../utils/errors.js';
import * as catalog from '../repositories/catalogRepository.js';

const MAX_MESSAGE = 500;
const MAX_HISTORY = 8;
const CONTEXT_TTL_MS = 60_000;

let contextCache = null;
let contextExpiresAt = 0;
let contextPromise = null;

function text(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function formatPrice(value) {
  return `${Number(value || 0).toLocaleString('vi-VN')}đ`;
}

async function shopContext() {
  const now = Date.now();
  if (contextCache && now < contextExpiresAt) {
    return contextCache;
  }
  if (contextPromise) {
    return contextPromise;
  }

  contextPromise = (async () => {
    const [categories, brief] = await Promise.all([
      catalog.listCategories(),
      catalog.listProductsBrief(60),
    ]);
    const ctx = {
      categories: categories.map((c) => `${c.name} (${c.productCount} món)`),
      products: brief.products,
      productCount: brief.productCount,
    };
    contextCache = ctx;
    contextExpiresAt = Date.now() + CONTEXT_TTL_MS;
    return ctx;
  })();

  try {
    return await contextPromise;
  } finally {
    contextPromise = null;
  }
}

function findProducts(products, message) {
  const raw = message.toLowerCase();
  const tokens = raw
    .split(/[^a-z0-9àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ\s]+/i)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2);
  if (!tokens.length) return [];

  const scored = [];
  for (const item of products) {
    const hay = `${item.name} ${item.category} ${(item.colors || []).join(' ')}`.toLowerCase();
    let score = 0;
    for (const token of tokens) {
      if (hay.includes(token)) score += token.length > 3 ? 3 : 1;
    }
    if (score > 0) scored.push({ item, score });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 4).map((row) => row.item);
}

function localReply(message, ctx) {
  const q = message.toLowerCase();

  if (/xin chào|hello|hi\b|chào|hey/.test(q)) {
    return 'Xin chào! Mình là Ong NT — trợ lý của NT shop. Bạn hỏi size, giá, COD/QR, hoặc tên món mình gợi ý giúp nhé.';
  }
  if (/ship|giao hàng|freeship|phí ship|bao lâu/.test(q)) {
    return 'NT shop giao COD toàn quốc. Đơn từ 399K thường được freeship (theo chương trình đang chạy trên trang). Sau khi đặt, bạn theo dõi trạng thái ở mục Trạng thái đơn hàng.';
  }
  if (/cod|thanh toán|qr|chuyển khoản|vietqr/.test(q)) {
    return 'Bạn thanh toán COD (trả khi nhận) hoặc quét VietQR chuyển khoản đúng số tiền + nội dung NTmãđơn. Đặt xong sẽ hiện hóa đơn / mã QR nếu chọn QR.';
  }
  if (/size|số đo|hướng dẫn size/.test(q)) {
    return 'Mỗi món có size riêng trên trang sản phẩm. Bạn xem thêm bảng hướng dẫn tại /huong-dan-size. Nêu chiều cao/cân nặng + món muốn mua, mình gợi ý size gần đúng giúp.';
  }
  if (/đổi trả|hoàn|hủy đơn/.test(q)) {
    return 'Khách có thể hủy đơn khi shop chưa xác nhận (trạng thái Đã đặt đơn). Vào icon tài khoản → Trạng thái đơn hàng → Hủy đơn. Đổi trả cụ thể liên hệ hotline 0325.589.396.';
  }
  if (/admin|đăng nhập|tài khoản|mật khẩu/.test(q)) {
    return 'Đăng ký/đăng nhập góc phải. Quên mật khẩu dùng OTP Gmail. Đổi mật khẩu và theo dõi đơn nằm trong menu tài khoản (icon người).';
  }
  if (/hotline|liên hệ|sđt|số điện thoại/.test(q)) {
    return 'Hotline NT shop: 0325.589.396. Bạn cũng chat tiếp với mình tại đây nhé.';
  }

  const hits = findProducts(ctx.products, message);
  if (hits.length) {
    const lines = hits.map(
      (item) =>
        `• ${item.name} — ${formatPrice(item.price)}` +
        (item.stock > 0 ? ` (còn ${item.stock})` : ' (hết hàng)') +
        ` · /san-pham/${item.slug}`,
    );
    return `Mình tìm được vài món liên quan:\n${lines.join('\n')}\nBạn muốn xem màu/size món nào cứ nói tên nhé.`;
  }

  if (/danh mục|có gì|bán gì|sản phẩm/.test(q)) {
    return `NT shop đang có ${ctx.productCount} món, danh mục: ${ctx.categories.join(', ')}. Bạn gõ tên món hoặc kiểu đồ (áo thun, quần jean, giày…) mình lọc giúp.`;
  }

  return 'Mình chưa khớp đúng ý bạn. Thử hỏi: “áo thun bao nhiêu”, “ship thế nào”, “hủy đơn”, hoặc tên món cụ thể. Hotline: 0325.589.396.';
}

async function llmReply(message, history, ctx) {
  const apiKey = String(process.env.OPENAI_API_KEY || process.env.GROQ_API_KEY || '').trim();
  if (!apiKey) return null;

  const baseUrl = String(
    process.env.OPENAI_BASE_URL ||
      (process.env.GROQ_API_KEY ? 'https://api.groq.com/openai/v1' : 'https://api.openai.com/v1'),
  ).replace(/\/$/, '');
  const model =
    process.env.CHAT_MODEL ||
    (process.env.GROQ_API_KEY ? 'llama-3.1-8b-instant' : 'gpt-4o-mini');

  const catalogLines = ctx.products
    .slice(0, 25)
    .map(
      (p) =>
        `- ${p.name} | ${formatPrice(p.price)} | ${p.category} | size ${(p.sizes || []).join('/')} | /san-pham/${p.slug}`,
    )
    .join('\n');

  const system = `Bạn là Ong NT, trợ lý bán hàng thân thiện của NT shop (quần áo, giày dép Việt Nam).
Trả lời ngắn gọn tiếng Việt. Gợi ý link /san-pham/... khi nói về món.
Thanh toán: COD hoặc VietQR. Hotline 0325.589.396. Freeship đơn từ ~399K.
Không bịa giá; dùng catalog dưới đây.
Danh mục: ${ctx.categories.join(', ')}
Catalog:
${catalogLines}`;

  const messages = [
    { role: 'system', content: system },
    ...history.slice(-MAX_HISTORY).map((item) => ({
      role: item.role === 'assistant' ? 'assistant' : 'user',
      content: String(item.content || '').slice(0, MAX_MESSAGE),
    })),
    { role: 'user', content: message },
  ];

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 0.4,
      max_tokens: 400,
      messages,
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`LLM ${response.status}: ${errText.slice(0, 200)}`);
  }
  const data = await response.json();
  const reply = data?.choices?.[0]?.message?.content;
  return text(reply) || null;
}

export async function chat(body) {
  const message = text(body?.message);
  if (message.length < 1 || message.length > MAX_MESSAGE) {
    throw new AppError(400, 'Tin nhắn cần từ 1 đến 500 ký tự.');
  }
  const history = Array.isArray(body?.history) ? body.history : [];
  const ctx = await shopContext();

  try {
    const ai = await llmReply(message, history, ctx);
    if (ai) {
      return { reply: ai, source: 'ai' };
    }
  } catch {
    // Fallback local nếu API lỗi / hết hạn mức
  }

  return { reply: localReply(message, ctx), source: 'shop' };
}
