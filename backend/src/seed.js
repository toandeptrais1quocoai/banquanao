import './config/env.js';
import bcrypt from 'bcryptjs';
import { getPool, sql } from './config/db.js';

const categories = [
  { name: 'Áo', slug: 'ao' },
  { name: 'Quần', slug: 'quan' },
  { name: 'Váy', slug: 'vay' },
  { name: 'Áo khoác', slug: 'ao-khoac' },
  { name: 'Giày', slug: 'giay' },
  { name: 'Dép', slug: 'dep' },
  { name: 'Phụ kiện', slug: 'phu-kien' },
];

const products = [
  {
    category: 'ao-khoac',
    name: 'Áo khoác dạ be',
    slug: 'ao-khoac-da-be',
    description: 'Mangto dạ màu be, cổ rộng, đai buộc eo. Dài qua gối, mặc ngoài áo len những ngày se lạnh.',
    price: 1490000,
    imageUrl: '/images/khoac-da.jpg',
    colorName: 'Be',
    colorHex: '#c6a36a',
    sizes: 'S,M,L',
    material: 'Dạ',
    isFeatured: true,
  },
  {
    category: 'vay',
    name: 'Đầm đỏ hoa nhí',
    slug: 'dam-do-hoa-nhi',
    description: 'Đầm đỏ hoa vàng, cổ V, đai lưng bản to. Dài qua gối, mặc được đi tiệc nhỏ.',
    price: 850000,
    imageUrl: '/images/dam-do.jpg',
    colorName: 'Đỏ',
    colorHex: '#c4312c',
    sizes: 'S,M,L',
    material: 'Lụa pha',
    isFeatured: true,
  },
  {
    category: 'ao',
    name: 'Áo len cổ lọ',
    slug: 'ao-len-co-lo',
    description: 'Len gân cổ lọ, form rộng, tay dài phủ nửa bàn tay. Màu kem, dễ phối với quần tối.',
    price: 620000,
    imageUrl: '/images/ao-len.jpg',
    colorName: 'Kem',
    colorHex: '#e4e0d6',
    sizes: 'S,M,L',
    material: 'Len gân',
    isFeatured: true,
  },
  {
    category: 'ao',
    name: 'Áo sơ mi thêu hoa',
    slug: 'ao-so-mi-theu-hoa',
    description: 'Sơ mi tay ngắn, thân thêu hoa nhỏ, tà cột trước. Mặc với quần jean hoặc chân váy.',
    price: 529000,
    imageUrl: '/images/so-mi-theu.jpg',
    colorName: 'Trắng hoa',
    colorHex: '#f4f1ea',
    sizes: 'S,M,L',
    material: 'Cotton thêu',
    isFeatured: true,
  },
  {
    category: 'quan',
    name: 'Quần kaki ống côn',
    slug: 'quan-kaki-ong-con',
    description: 'Kaki nâu cát, ống đứng hơi ôm, gấu có thể xắn. Mặc với áo thun hoặc sơ mi.',
    price: 490000,
    imageUrl: '/images/quan-kaki.jpg',
    colorName: 'Nâu cát',
    colorHex: '#b7a078',
    sizes: '29,30,31,32,33',
    material: 'Kaki',
    isFeatured: true,
  },
  {
    category: 'vay',
    name: 'Đầm trắng trễ vai',
    slug: 'dam-trang-tre-vai',
    description: 'Đầm ngắn trễ vai, thân chun, chân váy xếp tầng. Mặc trời mát, đi chơi trong ngày.',
    price: 690000,
    imageUrl: '/images/dam-trang.jpg',
    colorName: 'Trắng',
    colorHex: '#f7f7f5',
    sizes: 'S,M,L',
    material: 'Cotton',
    isFeatured: true,
  },
  {
    category: 'ao-khoac',
    name: 'Áo khoác bomber',
    slug: 'ao-khoac-bomber',
    description: 'Bomber khóa kéo, bo cổ và bo tay, màu đất nung. Tay áo có một túi khóa nhỏ.',
    price: 890000,
    imageUrl: '/images/bomber.jpg',
    colorName: 'Đất nung',
    colorHex: '#c4846a',
    sizes: 'S,M,L,XL',
    material: 'Nylon',
    isFeatured: false,
  },
  {
    category: 'vay',
    name: 'Đầm hoa quấn',
    slug: 'dam-hoa-quan',
    description: 'Đầm quấn hoa, cổ V, xẻ tà. Vải rủ nhẹ, hợp đi biển hoặc đi phố.',
    price: 780000,
    imageUrl: '/images/dam-hoa.jpg',
    colorName: 'Kem hoa',
    colorHex: '#f0e6dc',
    sizes: 'S,M,L',
    material: 'Voan',
    isFeatured: false,
  },
  {
    category: 'ao',
    name: 'Áo thun cotton cổ tròn',
    slug: 'ao-thun-cotton-co-tron',
    description: 'Cotton dày vừa, cổ tròn không bai. Form ôm nhẹ, mặc một mình hoặc làm lớp trong.',
    price: 289000,
    imageUrl: '/images/ao-thun.jpg',
    colorName: 'Trắng',
    colorHex: '#f5f5f5',
    sizes: 'S,M,L,XL',
    material: 'Cotton',
    isFeatured: false,
  },
  {
    category: 'quan',
    name: 'Quần short jean',
    slug: 'quan-short-jean',
    description: 'Short jean xanh nhạt, gấu xắn, có vết mài nhẹ ở túi. Dài trên gối.',
    price: 390000,
    imageUrl: '/images/quan-short.jpg',
    colorName: 'Xanh nhạt',
    colorHex: '#b7c9dc',
    sizes: 'S,M,L',
    material: 'Denim',
    isFeatured: false,
  },
  {
    category: 'ao',
    name: 'Áo sơ mi trắng',
    slug: 'ao-so-mi-trang',
    description: 'Sơ mi trắng cổ Đức, cotton ít nhăn. Mặc đi làm, hoặc thả cùng quần kaki cuối tuần.',
    price: 459000,
    imageUrl: '/images/so-mi.jpg',
    colorName: 'Trắng',
    colorHex: '#f7f7f7',
    sizes: 'S,M,L,XL',
    material: 'Cotton',
    isFeatured: false,
  },
  {
    category: 'quan',
    name: 'Quần jogger túi hộp',
    slug: 'quan-jogger-tui-hop',
    description: 'Cạp chun, hai túi hộp phía trước, ống bó nhẹ ở cổ chân. Màu hồng đất.',
    price: 420000,
    imageUrl: '/images/quan-jogger.jpg',
    colorName: 'Hồng đất',
    colorHex: '#d7a08e',
    sizes: 'S,M,L',
    material: 'Cotton',
    isFeatured: false,
  },
  {
    category: 'phu-kien',
    name: 'Khăn choàng kẻ',
    slug: 'khan-choang-ke',
    description: 'Khăn kẻ ô lớn, quàng cổ ngày mát. Chất mềm, không cộm khi cho vào trong áo khoác.',
    price: 280000,
    imageUrl: '/images/khan.jpg',
    colorName: 'Kẻ nâu',
    colorHex: '#8a6a52',
    sizes: 'Freesize',
    material: 'Len pha',
    isFeatured: false,
  },
  {
    category: 'phu-kien',
    name: 'Túi vải đeo vai',
    slug: 'tui-vai-deo-vai',
    description: 'Túi đứng màu cát, quai bản rộng đeo vai. Đựng vừa ví, sách và một bình nước.',
    price: 190000,
    imageUrl: '/images/tui.jpg',
    colorName: 'Cát',
    colorHex: '#c4a574',
    sizes: 'Freesize',
    material: 'Canvas',
    isFeatured: false,
  },
  {
    category: 'giay',
    name: 'Giày sneaker trắng',
    slug: 'giay-sneaker-trang',
    description: 'Sneaker trắng đế cao su, form cơ bản, đi học đi làm đều được. Lót êm, buộc dây.',
    price: 650000,
    imageUrl: '/images/giay-sneaker.jpg',
    colorName: 'Trắng',
    colorHex: '#f5f5f5',
    sizes: '38,39,40,41,42,43',
    material: 'Da tổng hợp',
    isFeatured: true,
  },
  {
    category: 'giay',
    name: 'Giày thể thao đen',
    slug: 'giay-the-thao-den',
    description: 'Giày chạy bộ đệm êm, lưới thoáng. Màu đen dễ phối quần short hoặc jogger.',
    price: 790000,
    imageUrl: '/images/giay-the-thao.jpg',
    colorName: 'Đen',
    colorHex: '#222222',
    sizes: '39,40,41,42,43,44',
    material: 'Mesh',
    isFeatured: false,
  },
  {
    category: 'dep',
    name: 'Dép hai quai',
    slug: 'dep-le-nau',
    description: 'Dép hai quai khóa đồng, đế cork êm. Đi phố hoặc dạo gần nhà.',
    price: 280000,
    imageUrl: '/images/dep-le.jpg',
    colorName: 'Xám olive',
    colorHex: '#6b6a62',
    sizes: '38,39,40,41,42,43',
    material: 'Da lộn / cork',
    isFeatured: true,
  },
  {
    category: 'dep',
    name: 'Sandal đế gỗ',
    slug: 'sandal-quai-cheo',
    description: 'Sandal quai chéo có khóa, đế gỗ cao. Hợp đi phố mùa nóng.',
    price: 420000,
    imageUrl: '/images/sandal.jpg',
    colorName: 'Đỏ rượu',
    colorHex: '#6b2b35',
    sizes: '36,37,38,39,40',
    material: 'Da / gỗ',
    isFeatured: false,
  },
  {
    category: 'ao',
    name: 'Áo polo basic',
    slug: 'ao-polo-basic',
    description: 'Polo cotton cổ bẻ, form vừa. Đi làm hoặc đi chơi cuối tuần.',
    price: 349000,
    imageUrl: '/images/ao-thun.jpg',
    colorName: 'Trắng',
    colorHex: '#f5f5f5',
    sizes: 'S,M,L,XL',
    material: 'Cotton pique',
    isFeatured: true,
  },
  {
    category: 'ao',
    name: 'Áo hoodie nỉ',
    slug: 'ao-hoodie-ni',
    description: 'Hoodie nỉ mềm, túi kangaroo, bo tay. Mặc lớp ngoài ngày se lạnh.',
    price: 520000,
    imageUrl: '/images/ao-len.jpg',
    colorName: 'Xám',
    colorHex: '#8a8f96',
    sizes: 'S,M,L,XL',
    material: 'Nỉ',
    isFeatured: false,
  },
  {
    category: 'ao',
    name: 'Áo sơ mi kẻ',
    slug: 'ao-so-mi-ke',
    description: 'Sơ mi kẻ nhỏ, cổ Đức, tay dài. Có thể sơ vin hoặc thả ngoài.',
    price: 479000,
    imageUrl: '/images/so-mi.jpg',
    colorName: 'Xanh kẻ',
    colorHex: '#6b8cae',
    sizes: 'S,M,L,XL',
    material: 'Cotton',
    isFeatured: false,
  },
  {
    category: 'ao',
    name: 'Áo croptop tay dài',
    slug: 'ao-croptop-tay-dai',
    description: 'Croptop tay dài ôm nhẹ, phối với quần jean ống rộng.',
    price: 299000,
    imageUrl: '/images/so-mi-theu.jpg',
    colorName: 'Kem',
    colorHex: '#f0e6dc',
    sizes: 'S,M,L',
    material: 'Cotton co giãn',
    isFeatured: false,
  },
  {
    category: 'quan',
    name: 'Quần jean ống rộng',
    slug: 'quan-jean-ong-rong',
    description: 'Jean ống rộng, cạp cao, màu xanh đậm. Dễ phối áo thun hoặc sơ mi.',
    price: 590000,
    imageUrl: '/images/quan-short.jpg',
    colorName: 'Xanh đậm',
    colorHex: '#2f4a6a',
    sizes: '28,29,30,31,32',
    material: 'Denim',
    isFeatured: true,
  },
  {
    category: 'quan',
    name: 'Quần Tây công sở',
    slug: 'quan-tay-cong-so',
    description: 'Quần tây ống đứng, có ly, vải ít nhăn. Phù hợp đi làm.',
    price: 560000,
    imageUrl: '/images/quan-kaki.jpg',
    colorName: 'Đen',
    colorHex: '#1a1a1a',
    sizes: '29,30,31,32,33',
    material: 'Poly cotton',
    isFeatured: false,
  },
  {
    category: 'quan',
    name: 'Quần short kaki',
    slug: 'quan-short-kaki',
    description: 'Short kaki trên gối, có túi sau. Đi chơi mùa nóng.',
    price: 320000,
    imageUrl: '/images/quan-kaki.jpg',
    colorName: 'Be',
    colorHex: '#c9b896',
    sizes: 'S,M,L,XL',
    material: 'Kaki',
    isFeatured: false,
  },
  {
    category: 'quan',
    name: 'Quần ống suông linen',
    slug: 'quan-ong-suong-linen',
    description: 'Linen mỏng, ống suông, cạp chun sau. Thoáng mát ngày hè.',
    price: 450000,
    imageUrl: '/images/quan-jogger.jpg',
    colorName: 'Trắng kem',
    colorHex: '#efe8dc',
    sizes: 'S,M,L',
    material: 'Linen',
    isFeatured: false,
  },
  {
    category: 'vay',
    name: 'Chân váy chữ A',
    slug: 'chan-vay-chu-a',
    description: 'Chân váy chữ A ngang gối, cạp khóa sau. Đi học đi làm đều được.',
    price: 310000,
    imageUrl: '/images/dam-trang.jpg',
    colorName: 'Đen',
    colorHex: '#1c1c1c',
    sizes: 'S,M,L',
    material: 'Tuyết mưa',
    isFeatured: false,
  },
  {
    category: 'vay',
    name: 'Đầm suông công sở',
    slug: 'dam-suong-cong-so',
    description: 'Đầm suông cổ tròn, dài qua gối, xẻ nhẹ. Form đứng, ít nhăn.',
    price: 720000,
    imageUrl: '/images/dam-trang.jpg',
    colorName: 'Xanh navy',
    colorHex: '#1e3a5f',
    sizes: 'S,M,L,XL',
    material: 'Cotton lạnh',
    isFeatured: true,
  },
  {
    category: 'vay',
    name: 'Đầm maxi hoa',
    slug: 'dam-maxi-hoa',
    description: 'Maxi hoa nhí, dây buộc vai, xẻ tà. Hợp đi biển hoặc cafe.',
    price: 680000,
    imageUrl: '/images/dam-hoa.jpg',
    colorName: 'Hồng hoa',
    colorHex: '#e8a0b0',
    sizes: 'S,M,L',
    material: 'Voan',
    isFeatured: false,
  },
  {
    category: 'vay',
    name: 'Set váy hai dây',
    slug: 'set-vay-hai-day',
    description: 'Váy hai dây kèm cardigan mỏng. Diện được cả trong nhà và đi chơi.',
    price: 540000,
    imageUrl: '/images/dam-do.jpg',
    colorName: 'Đỏ đô',
    colorHex: '#8b1e1e',
    sizes: 'S,M,L',
    material: 'Cotton',
    isFeatured: false,
  },
  {
    category: 'ao-khoac',
    name: 'Áo khoác blazer',
    slug: 'ao-khoac-blazer',
    description: 'Blazer một khuy, ve cổ vừa, có túi ngực. Mặc đi làm hoặc đi tiệc nhẹ.',
    price: 890000,
    imageUrl: '/images/khoac-da.jpg',
    colorName: 'Be',
    colorHex: '#c6a36a',
    sizes: 'S,M,L,XL',
    material: 'Tuyết mưa',
    isFeatured: true,
  },
  {
    category: 'ao-khoac',
    name: 'Áo khoác gió',
    slug: 'ao-khoac-gio',
    description: 'Khoác gió mỏng, chống nhẹ mưa phùn, có mũ. Gấp gọn bỏ túi.',
    price: 450000,
    imageUrl: '/images/bomber.jpg',
    colorName: 'Xanh rêu',
    colorHex: '#4a5d3a',
    sizes: 'S,M,L,XL',
    material: 'Nylon',
    isFeatured: false,
  },
  {
    category: 'ao-khoac',
    name: 'Áo cardigan dài',
    slug: 'ao-cardigan-dai',
    description: 'Cardigan dệt kim dài qua hông, không nút. Quàng ngoài áo thun.',
    price: 480000,
    imageUrl: '/images/ao-len.jpg',
    colorName: 'Kem',
    colorHex: '#e4e0d6',
    sizes: 'Freesize',
    material: 'Len pha',
    isFeatured: false,
  },
  {
    category: 'giay',
    name: 'Giày loafer da',
    slug: 'giay-loafer-da',
    description: 'Loafer mũi tròn, không dây. Đi làm hoặc đi cafe lịch sự.',
    price: 720000,
    imageUrl: '/images/giay-sneaker.jpg',
    colorName: 'Nâu',
    colorHex: '#6b4a2f',
    sizes: '38,39,40,41,42,43',
    material: 'Da PU',
    isFeatured: false,
  },
  {
    category: 'giay',
    name: 'Giày búp bê',
    slug: 'giay-bup-be',
    description: 'Búp bê đế bệt, mũi tròn, êm chân. Đi học đi làm nhẹ nhàng.',
    price: 390000,
    imageUrl: '/images/giay-sneaker.jpg',
    colorName: 'Đen',
    colorHex: '#1a1a1a',
    sizes: '35,36,37,38,39',
    material: 'Da tổng hợp',
    isFeatured: true,
  },
  {
    category: 'giay',
    name: 'Giày chạy bộ xám',
    slug: 'giay-chay-bo-xam',
    description: 'Giày chạy đệm êm, lưới thoáng, đế cao su chống trượt.',
    price: 850000,
    imageUrl: '/images/giay-the-thao.jpg',
    colorName: 'Xám',
    colorHex: '#8a9099',
    sizes: '39,40,41,42,43,44',
    material: 'Mesh',
    isFeatured: false,
  },
  {
    category: 'dep',
    name: 'Dép quai ngang',
    slug: 'dep-quai-ngang',
    description: 'Dép lê quai ngang EVA, nhẹ, đi trong nhà hoặc dạo gần.',
    price: 120000,
    imageUrl: '/images/dep-le.jpg',
    colorName: 'Đen',
    colorHex: '#222222',
    sizes: '38,39,40,41,42,43',
    material: 'EVA',
    isFeatured: false,
  },
  {
    category: 'dep',
    name: 'Sandal thể thao',
    slug: 'sandal-the-thao',
    description: 'Sandal quai dán, đế dày, đi leo nhẹ hoặc đi chơi ngày nóng.',
    price: 350000,
    imageUrl: '/images/sandal.jpg',
    colorName: 'Xám',
    colorHex: '#6b6a62',
    sizes: '37,38,39,40,41,42',
    material: 'Cao su',
    isFeatured: true,
  },
  {
    category: 'dep',
    name: 'Guốc đế xuồng',
    slug: 'guoc-de-xuong',
    description: 'Guốc đế xuồng vừa, quai ngang. Đi tiệc nhẹ hoặc đi chơi tối.',
    price: 480000,
    imageUrl: '/images/sandal.jpg',
    colorName: 'Be',
    colorHex: '#d9c7a8',
    sizes: '35,36,37,38,39',
    material: 'Da PU',
    isFeatured: false,
  },
  {
    category: 'phu-kien',
    name: 'Mũ bucket',
    slug: 'mu-bucket',
    description: 'Mũ bucket vải, vành mềm. Che nắng đi chơi cuối tuần.',
    price: 150000,
    imageUrl: '/images/khan.jpg',
    colorName: 'Be',
    colorHex: '#c4a574',
    sizes: 'Freesize',
    material: 'Cotton',
    isFeatured: false,
  },
  {
    category: 'phu-kien',
    name: 'Thắt lưng da',
    slug: 'that-lung-da',
    description: 'Thắt lưng bản vừa, khóa kim loại. Đi với quần jean hoặc kaki.',
    price: 220000,
    imageUrl: '/images/tui.jpg',
    colorName: 'Nâu',
    colorHex: '#6b4a2f',
    sizes: 'Freesize',
    material: 'Da PU',
    isFeatured: false,
  },
  {
    category: 'phu-kien',
    name: 'Túi đeo chéo mini',
    slug: 'tui-deo-cheo-mini',
    description: 'Túi mini đeo chéo, ngăn khóa. Đựng điện thoại và ví nhỏ.',
    price: 260000,
    imageUrl: '/images/tui.jpg',
    colorName: 'Đen',
    colorHex: '#1f1f1f',
    sizes: 'Freesize',
    material: 'Da tổng hợp',
    isFeatured: true,
  },
  {
    category: 'phu-kien',
    name: 'Tất cổ ngắn 3 đôi',
    slug: 'tat-co-ngan-3-doi',
    description: 'Set 3 đôi tất cotton cổ ngắn, êm, thấm hút. Đi sneaker mỗi ngày.',
    price: 99000,
    imageUrl: '/images/khan.jpg',
    colorName: 'Trắng',
    colorHex: '#f5f5f5',
    sizes: 'Freesize',
    material: 'Cotton',
    isFeatured: false,
  },
];

const pool = await getPool();
const transaction = new sql.Transaction(pool);
await transaction.begin();

try {
  for (const category of categories) {
    const found = await new sql.Request(transaction)
      .input('slug', sql.NVarChar(80), category.slug)
      .query('SELECT Id FROM dbo.Categories WHERE Slug = @slug');
    if (!found.recordset.length) {
      await new sql.Request(transaction)
        .input('name', sql.NVarChar(80), category.name)
        .input('slug', sql.NVarChar(80), category.slug)
        .query('INSERT INTO dbo.Categories (Name, Slug) VALUES (@name, @slug)');
    }
  }

  for (const product of products) {
    const found = await new sql.Request(transaction)
      .input('slug', sql.NVarChar(180), product.slug)
      .query('SELECT Id FROM dbo.Products WHERE Slug = @slug');
    if (found.recordset.length) continue;

    await new sql.Request(transaction)
      .input('category', sql.NVarChar(80), product.category)
      .input('name', sql.NVarChar(160), product.name)
      .input('slug', sql.NVarChar(180), product.slug)
      .input('description', sql.NVarChar(800), product.description)
      .input('price', sql.Int, product.price)
      .input('originalPrice', sql.Int, Math.round(product.price * 1.18))
      .input('imageUrl', sql.NVarChar(300), product.imageUrl)
      .input('colorName', sql.NVarChar(40), product.colorName)
      .input('colorHex', sql.Char(7), product.colorHex)
      .input('sizes', sql.NVarChar(80), product.sizes)
      .input('material', sql.NVarChar(80), product.material)
      .input('isFeatured', sql.Bit, product.isFeatured ? 1 : 0)
      .query(`
        INSERT INTO dbo.Products (
          CategoryId, Name, Slug, Description, Price, OriginalPrice, ImageUrl,
          ColorName, ColorHex, Sizes, Material, IsFeatured
        )
        SELECT c.Id, @name, @slug, @description, @price, @originalPrice, @imageUrl,
               @colorName, @colorHex, @sizes, @material, @isFeatured
        FROM dbo.Categories c
        WHERE c.Slug = @category
      `);
  }

  const demoEmail = 'an@ntshop.local';
  const passwordHash = await bcrypt.hash('123456', 10);
  const demo = await new sql.Request(transaction)
    .input('email', sql.NVarChar(255), demoEmail)
    .query('SELECT Id FROM dbo.Users WHERE Email = @email');
  if (demo.recordset.length) {
    await new sql.Request(transaction)
      .input('email', sql.NVarChar(255), demoEmail)
      .input('passwordHash', sql.NVarChar(255), passwordHash)
      .query('UPDATE dbo.Users SET PasswordHash = @passwordHash WHERE Email = @email');
  } else {
    const legacy = await new sql.Request(transaction)
      .input('legacy', sql.NVarChar(255), 'an@moc.local')
      .query('SELECT Id FROM dbo.Users WHERE Email = @legacy');
    if (legacy.recordset.length) {
      await new sql.Request(transaction)
        .input('legacy', sql.NVarChar(255), 'an@moc.local')
        .input('email', sql.NVarChar(255), demoEmail)
        .input('passwordHash', sql.NVarChar(255), passwordHash)
        .query('UPDATE dbo.Users SET Email = @email, PasswordHash = @passwordHash WHERE Email = @legacy');
    } else {
      await new sql.Request(transaction)
        .input('fullName', sql.NVarChar(80), 'Nguyễn An')
        .input('email', sql.NVarChar(255), demoEmail)
        .input('passwordHash', sql.NVarChar(255), passwordHash)
        .query('INSERT INTO dbo.Users (FullName, Email, PasswordHash) VALUES (@fullName, @email, @passwordHash)');
    }
  }

  await transaction.commit();
  console.log('Đã nạp danh mục, sản phẩm và tài khoản an@ntshop.local / 123456.');
  console.log('Chạy lại lệnh này sẽ không ghi đè món bạn đã sửa trong SSMS.');
} catch (error) {
  await transaction.rollback();
  console.error(error);
  process.exitCode = 1;
} finally {
  await pool.close();
}
