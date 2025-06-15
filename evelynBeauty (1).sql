CREATE DATABASE IF NOT EXISTS evelynBeauty;

USE evelynBeauty;

CREATE TABLE accounts (
    account_id VARCHAR(20) PRIMARY KEY NOT NULL,
    name NVARCHAR(40) NOT NULL,
    email VARCHAR(320) NOT NULL UNIQUE,
    password VARCHAR(130) NOT NULL,
    role ENUM('OS', 'SF', 'CU') NOT NULL
);
INSERT INTO accounts (account_id, name, email, password, role) VALUES
('AC001', 'Trần Huỳnh Minh Tân', 'TanTHMSE184812@fpt.edu.vn', '123', 'OS'),
('AC002', 'Nguyễn Quốc Khánh', 'KhanhNQSE180122@fpt.edu.vn', '123', 'SF'),
('AC003', 'Đỗ Trần Hải Sơn', 'SonDTHSE181676@fpt.edu.vn', '123', 'SF'),
('AC004', 'Nguyễn Minh Hoàng', 'hoang1305stewie@gmail.com', '123', 'CU'),
('AC005', 'Trần Thị Lệ Quyên', 'Quyenneblog@gmail.com', '123', 'OS'),
('AC006', 'Trần Vĩnh Phước', 'PhuoctvSE182687@fpt.edu.vn', '123', 'CU');

CREATE TABLE profiles (
    profile_id VARCHAR(20) PRIMARY KEY NOT NULL,
    account_id VARCHAR(20) NOT NULL,
    name NVARCHAR(40),
    phone VARCHAR(10),
    address VARCHAR(255),
    gender ENUM('F', 'M'),
    birthday DATE,
    image VARCHAR(2083),
    FOREIGN KEY (account_id) REFERENCES accounts(account_id)
);
INSERT INTO profiles (profile_id, account_id, name, phone, address, gender, birthday, image) VALUES
('PF001', 'AC001', 'Trần Huỳnh Minh Tân', '0978371707', 'Bình Dương', 'M', '2004-07-28', NULL),
('PF002', 'AC002', 'Nguyễn Quốc Khánh', '0123456789', 'Lâm Đồng', 'M', '2004-07-29', NULL),
('PF003', 'AC003', 'Đỗ Trần Hải Sơn', '0123456789', 'Gia Lai', 'M', '2005-07-29', NULL),
('PF004', 'AC004', 'Nguyễn Minh Hoàng', '0123456789', 'Vũng Tàu', 'M', '2006-07-29', NULL),
('PF005', 'AC005', 'Trần Thị Lệ Quyên', '0123456789', 'Tp. Hồ Chí Minh', 'F', '2007-07-29', NULL),
('PF006', 'AC006', 'Trần Vĩnh Phước', '0123456789', 'Tp. Hồ Chí Minh', 'M', '2008-07-29', NULL),
('PF007', 'AC003', 'Bo', '0123456789', 'Tp. Hồ Chí Minh', 'M', '2009-07-29', NULL);

CREATE TABLE promotion_programs (
    program_id VARCHAR(20) PRIMARY KEY NOT NULL,
    name VARCHAR(5000),
    condition_1 VARCHAR(20),
    condition_2 VARCHAR(20),
    value DECIMAL(10,2),
    start_date DATETIME,
    end_date DATETIME,
    account_id VARCHAR(20) NOT NULL,
    FOREIGN KEY (account_id) REFERENCES accounts(account_id)
);
INSERT INTO promotion_programs 
(program_id, name, condition_1, condition_2, value, start_date, end_date, account_id)
VALUES
('PG001', 'Free ship', NULL, NULL, NULL, NULL, NULL, 'AC002'),
('PG002', '10% Off Minimum Order 1 million vietnamdong', 1000000, NULL, 0.10, NULL, NULL, 'AC002'),
('PG003', '15% Off Discount Minimum Order 1 million 500 vietnamdong', 1500000, NULL, 0.15, NULL, NULL, 'AC002'),
('PG004', '22% Off Minimum Order 2 million 200 vietnamdong', 2200000, NULL, 0.22, NULL, NULL, 'AC002'),
('PG005', '24% Off Minimum Order 2 million 400 vietnamdong', 2400000, NULL, 0.24, NULL, NULL, 'AC002'),
('PG006', '25% Off Minimum Order 2 million 500 vietnamdong', 2500000, NULL, 0.25, '2025-12-06', '2025-12-12', 'AC002'),
('PG007', '28% Off Minimum Order 2 million 800 vietnamdong', 2800000, NULL, 0.28, '2025-12-06', '2025-12-12', 'AC002'),
('PG008', '30% Off Minimum Order 3 million vietnamdong', 3000000, NULL, 0.30, '2025-12-06', '2025-12-12', 'AC002');

CREATE TABLE delivery (
    delivery_id VARCHAR(20) PRIMARY KEY NOT NULL,
    transaction_no INT NOT NULL
);
INSERT INTO delivery (delivery_id, transaction_no) VALUES
('DL002', 66016),
('DL003', 61507),
('DL004', 23765),
('DL005', 14827),
('DL006', 69537),
('DL007', 55980),
('DL008', 96347),
('DL009', 78015);

CREATE TABLE payment (
    payment_id VARCHAR(20) PRIMARY KEY NOT NULL,
    transaction_no INT NOT NULL
);
INSERT INTO payment (payment_id, transaction_no) VALUES
('PM001', 22915),
('PM002', 37266),
('PM003', 22808),
('PM004', 38420),
('PM005', 67372),
('PM006', 12352),
('PM007', 47996),
('PM008', 48299),
('PM009', 28300);

CREATE TABLE category (
    category_id VARCHAR(20) PRIMARY KEY NOT NULL,
    name NVARCHAR(40) NOT NULL
);
INSERT INTO category (category_id, name) VALUES
('CT001', 'High-end'),
('CT002', 'Make up'),
('CT003', 'Skin care'),
('CT004', 'Personal care'),
('CT005', 'Body care');

CREATE TABLE products (
    product_id VARCHAR(20) PRIMARY KEY NOT NULL,
    name NVARCHAR(5000) NOT NULL,
    origin NVARCHAR(20),
    quantity INT,
    brand NVARCHAR(20),
    price DECIMAL(15,0),
    description NVARCHAR(255),
    image VARCHAR(2083)
);
INSERT INTO products (product_id, name, origin, quantity, brand, price, description, image) VALUES
('PD001', 'Nước Thần Giảm Nếp Nhăn Trên Da Su:m37° Secret Essence 80ml', 'Korea', 500, 'SU:M37°', 1780000, '50', 'https://image.hsv-tech.io/600x600/bbx/common/a908e022-1a17-4690-9a95-9b7ed30903f2.webp'),
('PD002', 'Nước Thần Giảm Nếp Nhăn Trên Da Su:m37° Secret Essence 80ml', 'Korea', 500, 'SU:M37°', 1780000, '100', 'https://image.hsv-tech.io/600x600/bbx/common/a908e022-1a17-4690-9a95-9b7ed30903f2.webp'),
('PD003', 'Kem Nền Dạng Thỏi Ohui Ultimate Cover Stick Foundation 15G', 'Korea', 500, 'OHUI', 1300000, 'Vàng nhạt', 'https://image.hsv-tech.io/600x600/bbx/products/4c65312a-b0fc-4979-9719-8e7d9a50e4e2.webp'),
('PD004', 'Kem Nền Dạng Thỏi Ohui Ultimate Cover Stick Foundation 15G', 'Korea', 500, 'OHUI', 1300000, 'Nâu nhạt', 'https://image.hsv-tech.io/600x600/bbx/products/4c65312a-b0fc-4979-9719-8e7d9a50e4e2.webp'),
('PD005', 'Nước Hoa A\'ddict Eau De Parfum 50ml', 'Korea', 500, 'A\'DDICT', 1188000, 'Blance de Bloom', 'https://image.hsv-tech.io/600x600/bbx/common/191cbb78-e370-4d4c-8cd3-337bc169b5dd.webp');
INSERT INTO products (product_id, name, origin, quantity, brand, price, description, image) VALUES
('PD006', 'Nước Hoa A\'ddict Eau De Parfum 50ml', 'Korea', 500, 'A\'DDICT', 1188000, 'Eat the Peach', 'https://image.hsv-tech.io/600x600/bbx/common/191cbb78-e370-4d4c-8cd3-337bc169b5dd.webp'),
('PD007', 'Nước Hoa A\'ddict Eau De Parfum 50ml', 'Korea', 500, 'A\'DDICT', 1188000, 'The First', 'https://image.hsv-tech.io/600x600/bbx/common/191cbb78-e370-4d4c-8cd3-337bc169b5dd.webp'),
('PD008', 'Nước Hoa A\'ddict Eau De Parfum 50ml', 'Korea', 500, 'A\'DDICT', 1188000, 'Void Wood', 'https://image.hsv-tech.io/600x600/bbx/common/191cbb78-e370-4d4c-8cd3-337bc169b5dd.webp'),
('PD009', 'Nước Hoa Khô A\'ddict Solid Perfume Naked 30ml', 'Korea', 500, 'A\'DDICT', 682000, 'Musk 103', 'https://image.hsv-tech.io/600x600/bbx/common/d884b58a-4e28-4861-b75e-e169723a481f.webp'),
('PD010', 'Nước Hoa Khô A\'ddict Solid Perfume Naked 30ml', 'Korea', 500, 'A\'DDICT', 682000, 'Sandalwood 201', 'https://image.hsv-tech.io/600x600/bbx/common/d884b58a-4e28-4861-b75e-e169723a481f.webp'),
('PD011', 'Nước Hoa Khô A\'ddict Solid Perfume Naked 30ml', 'Korea', 500, 'A\'DDICT', 682000, 'Muguet 313', 'https://image.hsv-tech.io/600x600/bbx/common/d884b58a-4e28-4861-b75e-e169723a481f.webp'),
('PD012', 'Nước Hoa Khô A\'ddict Solid Perfume Naked 30ml', 'Korea', 500, 'A\'DDICT', 682000, 'Tuberose 420', 'https://image.hsv-tech.io/600x600/bbx/common/d884b58a-4e28-4861-b75e-e169723a481f.webp'),
('PD013', 'Bàn Chải Điện Làm Sạch Sâu Halio Sonic SmartClean Electric Toothbrush', 'America', 500, 'HALIO', 900000, 'Hồng phấn', 'https://image.hsv-tech.io/600x600/bbx/common/3735a630-4527-486d-a17f-299d441a3080.webp'),
('PD014', 'Bàn Chải Điện Làm Sạch Sâu Halio Sonic SmartClean Electric Toothbrush', 'America', 500, 'HALIO', 900000, 'Xanh biển mint', 'https://image.hsv-tech.io/600x600/bbx/common/3735a630-4527-486d-a17f-299d441a3080.webp'),
('PD015', 'Nước Hoa Nữ Cacharel Noa Edt Vaporisateur Spray', 'France', 500, 'CACHAREL', 1298000, '50', 'https://image.hsv-tech.io/600x600/bbx/common/aa18d5b2-6acd-409f-adcd-a68163d4ee6d.webp'),
('PD016', 'Nước Hoa Nữ Cacharel Noa Edt Vaporisateur Spray', 'France', 500, 'CACHAREL', 1298000, '100', 'https://image.hsv-tech.io/600x600/bbx/common/aa18d5b2-6acd-409f-adcd-a68163d4ee6d.webp'),
('PD017', '(Phiên bản mới) Phấn Nước Clio Kiềm Dầu, Lâu Trôi Kill Cover Skin Fixer Cushion 15g (Tặng kèm lõi)', 'Korea', 500, 'CLUB CLIO', 679000, 'Hồng sáng', 'https://beautybox.com.vn/products/phien-ban-moi-phan-nuoc-clio-kiem-dau-lau-troi-kill-cover-skin-fixer-cushion-15gx2'),
('PD018', '(Phiên bản mới) Phấn Nước Clio Kiềm Dầu, Lâu Trôi Kill Cover Skin Fixer Cushion 15g (Tặng kèm lõi)', 'Korea', 500, 'CLUB CLIO', 679000, 'Be sáng', 'https://beautybox.com.vn/products/phien-ban-moi-phan-nuoc-clio-kiem-dau-lau-troi-kill-cover-skin-fixer-cushion-15gx2'),
('PD019', '(Phiên bản mới) Phấn Nước Clio Kiềm Dầu, Lâu Trôi Kill Cover Skin Fixer Cushion 15g (Tặng kèm lõi)', 'Korea', 500, 'CLUB CLIO', 679000, 'Ngà ấm', 'https://beautybox.com.vn/products/phien-ban-moi-phan-nuoc-clio-kiem-dau-lau-troi-kill-cover-skin-fixer-cushion-15gx2'),
('PD020', '(Phiên bản mới) Phấn Nước Clio Kiềm Dầu, Lâu Trôi Kill Cover Skin Fixer Cushion 15g (Tặng kèm lõi)', 'Korea', 500, 'CLUB CLIO', 679000, 'Trắng sứ', 'https://beautybox.com.vn/products/phien-ban-moi-phan-nuoc-clio-kiem-dau-lau-troi-kill-cover-skin-fixer-cushion-15gx2');
INSERT INTO products (product_id, name, origin, quantity, brand, price, description, image) VALUES
('PD021', '(Phiên bản mới) Phấn Nước Clio Kiềm Dầu, Lâu Trôi Kill Cover Skin Fixer Cushion 15g (Tặng kèm lõi)', 'Korea', 500, 'CLUB CLIO', 679000, 'Cát nhạt', 'https://beautybox.com.vn/products/phien-ban-moi-phan-nuoc-clio-kiem-dau-lau-troi-kill-cover-skin-fixer-cushion-15gx2'),
('PD022', '(Phiên bản mới) Phấn Nước Clio Kiềm Dầu, Lâu Trôi Kill Cover Skin Fixer Cushion 15g (Tặng kèm lõi)', 'Korea', 500, 'CLUB CLIO', 679000, 'Be đào', 'https://beautybox.com.vn/products/phien-ban-moi-phan-nuoc-clio-kiem-dau-lau-troi-kill-cover-skin-fixer-cushion-15gx2'),
('PD023', '(Phiên bản mới) Phấn Nước Clio Kiềm Dầu, Lâu Trôi Kill Cover Skin Fixer Cushion 15g (Tặng kèm lõi)', 'Korea', 500, 'CLUB CLIO', 679000, 'Nâu sáng', 'https://beautybox.com.vn/products/phien-ban-moi-phan-nuoc-clio-kiem-dau-lau-troi-kill-cover-skin-fixer-cushion-15gx2'),
('PD024', 'Son Kem Peripera Mịn Lì Over Blur Tint 3.5g', 'Korea', 500, 'CLUB CLIO', 249000, 'Cam san hô', 'https://beautybox.com.vn/products/son-kem-peripera-min-li-over-blur-tint-35g'),
('PD025', 'Son Kem Peripera Mịn Lì Over Blur Tint 3.5g', 'Korea', 500, 'CLUB CLIO', 249000, 'Hồng baby', 'https://beautybox.com.vn/products/son-kem-peripera-min-li-over-blur-tint-35g'),
('PD026', 'Son Kem Peripera Mịn Lì Over Blur Tint 3.5g', 'Korea', 500, 'CLUB CLIO', 249000, 'Hồng cánh hoa hồng', 'https://beautybox.com.vn/products/son-kem-peripera-min-li-over-blur-tint-35g'),
('PD027', 'Son Kem Peripera Mịn Lì Over Blur Tint 3.5g', 'Korea', 500, 'CLUB CLIO', 249000, 'Đỏ san hô', 'https://beautybox.com.vn/products/son-kem-peripera-min-li-over-blur-tint-35g'),
('PD028', 'Son Kem Peripera Mịn Lì Over Blur Tint 3.5g', 'Korea', 500, 'CLUB CLIO', 249000, 'Hồng đất gạch', 'https://beautybox.com.vn/products/son-kem-peripera-min-li-over-blur-tint-35g'),
('PD029', 'Son Kem Peripera Mịn Lì Over Blur Tint 3.5g', 'Korea', 500, 'CLUB CLIO', 249000, 'Hồng berry', 'https://beautybox.com.vn/products/son-kem-peripera-min-li-over-blur-tint-35g'),
('PD030', 'Son Kem Peripera Mịn Lì Over Blur Tint 3.5g', 'Korea', 500, 'CLUB CLIO', 249000, 'Hồng mận đậm', 'https://beautybox.com.vn/products/son-kem-peripera-min-li-over-blur-tint-35g'),
('PD031', 'Phấn Nước Clio Mỏng Nhẹ & Che Khuyết Điểm Hoàn Hảo Kill Cover Founwear Cushion The Original Spf50+ Pa+++ 15g (tặng kèm lõi)', 'Korea', 500, 'CLUB CLIO', 729000, 'Hồng đào', 'https://beautybox.com.vn/products/phan-nuoc-clio-kill-cover-founwear-cushion-the-original-15g'),
('PD032', 'Phấn Nước Clio Mỏng Nhẹ & Che Khuyết Điểm Hoàn Hảo Kill Cover Founwear Cushion The Original Spf50+ Pa+++ 15g (tặng kèm lõi)', 'Korea', 500, 'CLUB CLIO', 729000, 'Be sáng', 'https://beautybox.com.vn/products/phan-nuoc-clio-kill-cover-founwear-cushion-the-original-15g'),
('PD033', 'Phấn Nước Clio Mỏng Nhẹ & Che Khuyết Điểm Hoàn Hảo Kill Cover Founwear Cushion The Original Spf50+ Pa+++ 15g (tặng kèm lõi)', 'Korea', 500, 'CLUB CLIO', 729000, 'Be vàng', 'https://beautybox.com.vn/products/phan-nuoc-clio-kill-cover-founwear-cushion-the-original-15g'),
('PD034', 'Phấn Nước Clio Mỏng Nhẹ & Che Khuyết Điểm Hoàn Hảo Kill Cover Founwear Cushion The Original Spf50+ Pa+++ 15g (tặng kèm lõi)', 'Korea', 500, 'CLUB CLIO', 729000, 'Be nhẹ', 'https://beautybox.com.vn/products/phan-nuoc-clio-kill-cover-founwear-cushion-the-original-15g'),
('PD035', 'Phấn Nước Clio Mỏng Nhẹ & Che Khuyết Điểm Hoàn Hảo Kill Cover Founwear Cushion The Original Spf50+ Pa+++ 15g (tặng kèm lõi)', 'Korea', 500, 'CLUB CLIO', 729000, 'Trắng ngà', 'https://beautybox.com.vn/products/phan-nuoc-clio-kill-cover-founwear-cushion-the-original-15g'),
('PD036', '[Blooming Edition] Má Hồng Dạng Nước Dear Dahlia Petal Drop Liquid Blush 4g', 'Korea', 500, 'DEAR DAHLIA', 769000, 'Cam đào', 'https://beautybox.com.vn/products/ma-hong-dang-nuoc-dear-dahlia-blooming-edition-petal-drop-liquid-blush-4g'),
('PD037', '[Blooming Edition] Má Hồng Dạng Nước Dear Dahlia Petal Drop Liquid Blush 4g', 'Korea', 500, 'DEAR DAHLIA', 769000, 'Hồng baby', 'https://beautybox.com.vn/products/ma-hong-dang-nuoc-dear-dahlia-blooming-edition-petal-drop-liquid-blush-4g'),
('PD038', '[Blooming Edition] Má Hồng Dạng Nước Dear Dahlia Petal Drop Liquid Blush 4g', 'Korea', 500, 'DEAR DAHLIA', 769000, 'Hồng đất', 'https://beautybox.com.vn/products/ma-hong-dang-nuoc-dear-dahlia-blooming-edition-petal-drop-liquid-blush-4g'),
('PD039', '[Blooming Edition] Má Hồng Dạng Nước Dear Dahlia Petal Drop Liquid Blush 4g', 'Korea', 500, 'DEAR DAHLIA', 769000, 'Hồng nude', 'https://beautybox.com.vn/products/ma-hong-dang-nuoc-dear-dahlia-blooming-edition-petal-drop-liquid-blush-4g'),
('PD040', '[Blooming Edition] Má Hồng Dạng Nước Dear Dahlia Petal Drop Liquid Blush 4g', 'Korea', 500, 'DEAR DAHLIA', 769000, 'Hồng nâu', 'https://beautybox.com.vn/products/ma-hong-dang-nuoc-dear-dahlia-blooming-edition-petal-drop-liquid-blush-4g');
INSERT INTO products (product_id, name, origin, quantity, brand, price, description, image) VALUES
('PD041', '[Blooming Edition] Má Hồng Dạng Nước Dear Dahlia Petal Drop Liquid Blush 4g', 'Korea', 500, 'DEAR DAHLIA', 769000, 'Hồng cam', 'https://beautybox.com.vn/products/ma-hong-dang-nuoc-dear-dahlia-blooming-edition-petal-drop-liquid-blush-4g'),
('PD042', '[Blooming Edition] Má Hồng Dạng Nước Dear Dahlia Petal Drop Liquid Blush 4g', 'Korea', 500, 'DEAR DAHLIA', 769000, 'Hồng dâu', 'https://beautybox.com.vn/products/ma-hong-dang-nuoc-dear-dahlia-blooming-edition-petal-drop-liquid-blush-4g'),
('PD043', '(Ver. mới - Cherry) Son Nước Peripera Bóng Nhẹ Water Bare Tint 3.7g', 'Korea', 500, 'CLUB CLIO', 249000, 'Hồng cam', 'https://beautybox.com.vn/products/son-nuoc-bong-nhe-peripera-water-bare-tint-37g'),
('PD044', '(Ver. mới - Cherry) Son Nước Peripera Bóng Nhẹ Water Bare Tint 3.7g', 'Korea', 500, 'CLUB CLIO', 249000, 'Hồng đào', 'https://beautybox.com.vn/products/son-nuoc-bong-nhe-peripera-water-bare-tint-37g'),
('PD045', '(Ver. mới - Cherry) Son Nước Peripera Bóng Nhẹ Water Bare Tint 3.7g', 'Korea', 500, 'CLUB CLIO', 249000, 'Hồng đất', 'https://beautybox.com.vn/products/son-nuoc-bong-nhe-peripera-water-bare-tint-37g'),
('PD046', '(Ver. mới - Cherry) Son Nước Peripera Bóng Nhẹ Water Bare Tint 3.7g', 'Korea', 500, 'CLUB CLIO', 249000, 'Hồng dâu', 'https://beautybox.com.vn/products/son-nuoc-bong-nhe-peripera-water-bare-tint-37g'),
('PD047', '(Ver. mới - Cherry) Son Nước Peripera Bóng Nhẹ Water Bare Tint 3.7g', 'Korea', 500, 'CLUB CLIO', 249000, 'Hồng mận', 'https://beautybox.com.vn/products/son-nuoc-bong-nhe-peripera-water-bare-tint-37g'),
('PD048', '(Ver. mới - Cherry) Son Nước Peripera Bóng Nhẹ Water Bare Tint 3.7g', 'Korea', 500, 'CLUB CLIO', 249000, 'Hồng đất gạch', 'https://beautybox.com.vn/products/son-nuoc-bong-nhe-peripera-water-bare-tint-37g'),
('PD049', '(Ver. mới - Cherry) Son Nước Peripera Bóng Nhẹ Water Bare Tint 3.7g', 'Korea', 500, 'CLUB CLIO', 249000, 'Hồng berry', 'https://beautybox.com.vn/products/son-nuoc-bong-nhe-peripera-water-bare-tint-37g'),
('PD050', '(Ver. mới - Cherry) Son Nước Peripera Bóng Nhẹ Water Bare Tint 3.7g', 'Korea', 500, 'CLUB CLIO', 249000, 'Đỏ nâu', 'https://beautybox.com.vn/products/son-nuoc-bong-nhe-peripera-water-bare-tint-37g'),
('PD051', '(Ver. mới - Cherry) Son Nước Peripera Bóng Nhẹ Water Bare Tint 3.7g', 'Korea', 500, 'CLUB CLIO', 249000, 'Hồng tím', 'https://beautybox.com.vn/products/son-nuoc-bong-nhe-peripera-water-bare-tint-37g'),
('PD052', '(Ver. mới - Cherry) Son Nước Peripera Bóng Nhẹ Water Bare Tint 3.7g', 'Korea', 500, 'CLUB CLIO', 249000, 'Hồng nude', 'https://beautybox.com.vn/products/son-nuoc-bong-nhe-peripera-water-bare-tint-37g'),
('PD053', '(Ver. mới - Cherry) Son Nước Peripera Bóng Nhẹ Water Bare Tint 3.7g', 'Korea', 500, 'CLUB CLIO', 249000, 'Hồng phấn', 'https://beautybox.com.vn/products/son-nuoc-bong-nhe-peripera-water-bare-tint-37g'),
('PD054', '(Ver. mới - Cherry) Son Nước Peripera Bóng Nhẹ Water Bare Tint 3.7g', 'Korea', 500, 'CLUB CLIO', 249000, 'Hồng baby', 'https://beautybox.com.vn/products/son-nuoc-bong-nhe-peripera-water-bare-tint-37g'),
('PD055', '(Ver. mới - Cherry) Son Nước Peripera Bóng Nhẹ Water Bare Tint 3.7g', 'Korea', 500, 'CLUB CLIO', 249000, 'Hồng kẹo', 'https://beautybox.com.vn/products/son-nuoc-bong-nhe-peripera-water-bare-tint-37g'),
('PD056', '[Fruit Grocery edition] Phấn Nước Clio Che Khuyết Điểm Kill Cover The New Founwear Cushion SPF50+ PA+++ (15g) (Tặng 1 lõi refill)', 'Korea', 500, 'CLUB CLIO', 679000, 'Hồng sáng', 'https://beautybox.com.vn/products/ver-fruit-grocery-phan-nuoc-clio-che-khuyet-diem-hoan-hao-kill-cover-the-new-founwear-cushion'),
('PD057', '[Fruit Grocery edition] Phấn Nước Clio Che Khuyết Điểm Kill Cover The New Founwear Cushion SPF50+ PA+++ (15g) (Tặng 1 lõi refill)', 'Korea', 500, 'CLUB CLIO', 679000, 'Be cam', 'https://beautybox.com.vn/products/ver-fruit-grocery-phan-nuoc-clio-che-khuyet-diem-hoan-hao-kill-cover-the-new-founwear-cushion'),
('PD058', '[Fruit Grocery edition] Phấn Nước Clio Che Khuyết Điểm Kill Cover The New Founwear Cushion SPF50+ PA+++ (15g) (Tặng 1 lõi refill)', 'Korea', 500, 'CLUB CLIO', 679000, 'Ngà vàng', 'https://beautybox.com.vn/products/ver-fruit-grocery-phan-nuoc-clio-che-khuyet-diem-hoan-hao-kill-cover-the-new-founwear-cushion'),
('PD059', 'Son Nước Bóng Thuần Chay Amuse Dew Tint 4g', 'Korea', 500, 'AMUSE', 399000, 'Hồng khói', 'https://beautybox.com.vn/products/son-nuoc-bong-thuan-chay-amuse-dew-tint-4g'),
('PD060', 'Son Nước Bóng Thuần Chay Amuse Dew Tint 4g', 'Korea', 500, 'AMUSE', 399000, 'Hồng đào', 'https://beautybox.com.vn/products/son-nuoc-bong-thuan-chay-amuse-dew-tint-4g');
INSERT INTO products (product_id, name, origin, quantity, brand, price, description, image) VALUES
('PD061', 'Son Nước Bóng Thuần Chay Amuse Dew Tint 4g', 'Korea', 500, 'AMUSE', 399000, 'Cam san hô', 'https://beautybox.com.vn/products/son-nuoc-bong-thuan-chay-amuse-dew-tint-4g'),
('PD062', 'Son Nước Bóng Thuần Chay Amuse Dew Tint 4g', 'Korea', 500, 'AMUSE', 399000, 'Đỏ đất', 'https://beautybox.com.vn/products/son-nuoc-bong-thuan-chay-amuse-dew-tint-4g'),
('PD063', 'Son Nước Bóng Thuần Chay Amuse Dew Tint 4g', 'Korea', 500, 'AMUSE', 399000, 'Hồng cánh sen', 'https://beautybox.com.vn/products/son-nuoc-bong-thuan-chay-amuse-dew-tint-4g'),
('PD064', 'Son Nước Bóng Thuần Chay Amuse Dew Tint 4g', 'Korea', 500, 'AMUSE', 399000, 'Hồng baby', 'https://beautybox.com.vn/products/son-nuoc-bong-thuan-chay-amuse-dew-tint-4g'),
('PD065', 'Son Nước Bóng Thuần Chay Amuse Dew Tint 4g', 'Korea', 500, 'AMUSE', 399000, 'Hồng nude', 'https://beautybox.com.vn/products/son-nuoc-bong-thuan-chay-amuse-dew-tint-4g'),
('PD066', 'Son Nước Bóng Thuần Chay Amuse Dew Tint 4g', 'Korea', 500, 'AMUSE', 399000, 'Hồng đất', 'https://beautybox.com.vn/products/son-nuoc-bong-thuan-chay-amuse-dew-tint-4g'),
('PD067', 'Son Nước Bóng Thuần Chay Amuse Dew Tint 4g', 'Korea', 500, 'AMUSE', 399000, 'Đỏ hồng', 'https://beautybox.com.vn/products/son-nuoc-bong-thuan-chay-amuse-dew-tint-4g'),
('PD068', 'Son Nước Bóng Thuần Chay Amuse Dew Tint 4g', 'Korea', 500, 'AMUSE', 399000, 'Hồng cam nhạt', 'https://beautybox.com.vn/products/son-nuoc-bong-thuan-chay-amuse-dew-tint-4g'),
('PD069', 'Son Nước Bóng Thuần Chay Amuse Dew Tint 4g', 'Korea', 500, 'AMUSE', 399000, 'Hồng phấn', 'https://beautybox.com.vn/products/son-nuoc-bong-thuan-chay-amuse-dew-tint-4g'),
('PD070', 'Son Nước Bóng Thuần Chay Amuse Dew Tint 4g', 'Korea', 500, 'AMUSE', 399000, 'Hồng sen', 'https://beautybox.com.vn/products/son-nuoc-bong-thuan-chay-amuse-dew-tint-4g'),
('PD071', 'Máy Tăm Nước Cầm Tay Halio UltraClean Oral Irrigator', 'America', 500, 'HALIO', 1300000, 'Tím', 'https://image.hsv-tech.io/600x600/bbx/common/55638e90-238a-4f93-9779-2d76888af9b8.webp'),
('PD072', 'Máy Tăm Nước Cầm Tay Halio UltraClean Oral Irrigator', 'America', 500, 'HALIO', 1300000, 'Xanh Dương', 'https://image.hsv-tech.io/600x600/bbx/common/55638e90-238a-4f93-9779-2d76888af9b8.webp'),
('PD073', 'Bàn Chải Điện Làm Trắng Răng Halio Sonic Whitening Toothbrush Pro', 'America', 500, 'HALIO', 1300000, 'Tím', 'https://image.hsv-tech.io/600x600/bbx/common/f1b16da2-4f90-47fe-acd6-9562652ba71f.webp'),
('PD074', 'Bàn Chải Điện Làm Trắng Răng Halio Sonic Whitening Toothbrush Pro', 'America', 500, 'HALIO', 1300000, 'Da', 'https://image.hsv-tech.io/600x600/bbx/common/f1b16da2-4f90-47fe-acd6-9562652ba71f.webp'),
('PD075', 'Bàn Chải Điện Làm Trắng Răng Halio Sonic Whitening Toothbrush Pro', 'America', 500, 'HALIO', 1300000, 'Đen', 'https://image.hsv-tech.io/600x600/bbx/common/f1b16da2-4f90-47fe-acd6-9562652ba71f.webp'),
('PD076', 'Nước Hoa Nữ Laura Anne Perfume Diamond Femme 45Ml', 'Viet Nam', 500, 'LAURA ANNE', 599000, 'White', 'https://image.hsv-tech.io/600x600/bbx/common/624894e4-cc10-4ebf-9cff-d9b52e96a89a.webp'),
('PD077', 'Nước Hoa Nữ Laura Anne Perfume Diamond Femme 45Ml', 'Viet Nam', 500, 'LAURA ANNE', 599000, 'Pink', 'https://image.hsv-tech.io/600x600/bbx/common/624894e4-cc10-4ebf-9cff-d9b52e96a89a.webp'),
('PD078', 'Nước Hoa Nữ Laura Anne Perfume Diamond Femme 45Ml', 'Viet Nam', 500, 'LAURA ANNE', 599000, 'Black', 'https://image.hsv-tech.io/600x600/bbx/common/624894e4-cc10-4ebf-9cff-d9b52e96a89a.webp'),
('PD079', 'Nước Hoa Nữ Laura Anne Perfume Diamond Femme 45Ml', 'Viet Nam', 500, 'LAURA ANNE', 599000, 'Brown', 'https://image.hsv-tech.io/600x600/bbx/common/624894e4-cc10-4ebf-9cff-d9b52e96a89a.webp'),
('PD080', 'Nước Hoa Nữ Laura Anne Perfume Diamond Femme 45Ml', 'Viet Nam', 500, 'LAURA ANNE', 599000, 'Ruby Red', 'https://image.hsv-tech.io/600x600/bbx/common/624894e4-cc10-4ebf-9cff-d9b52e96a89a.webp');
INSERT INTO products (product_id, name, origin, quantity, brand, price, description, image) VALUES
('PD081', 'Nước Hoa Dạng Xịt De Memoria 30Ml', 'France', 500, 'DE MEMORIA', 550000, '01 Spello', 'https://image.hsv-tech.io/600x600/bbx/products/2c025498-57bc-4621-a647-4bc823c4864e.webp'),
('PD082', 'Nước Hoa Dạng Xịt De Memoria 30Ml', 'France', 500, 'DE MEMORIA', 550000, '02 Val De Loire', 'https://image.hsv-tech.io/600x600/bbx/products/2c025498-57bc-4621-a647-4bc823c4864e.webp'),
('PD083', 'Nước Hoa Dạng Xịt De Memoria 30Ml', 'France', 500, 'DE MEMORIA', 550000, '03 Granada', 'https://image.hsv-tech.io/600x600/bbx/products/2c025498-57bc-4621-a647-4bc823c4864e.webp'),
('PD084', 'Nước Hoa Dạng Xịt De Memoria 30Ml', 'France', 500, 'DE MEMORIA', 550000, '04 Dresden', 'https://image.hsv-tech.io/600x600/bbx/products/2c025498-57bc-4621-a647-4bc823c4864e.webp'),
('PD085', 'Nước Hoa Dạng Xịt De Memoria 30Ml', 'France', 500, 'DE MEMORIA', 550000, '05 Montpellier', 'https://image.hsv-tech.io/600x600/bbx/products/2c025498-57bc-4621-a647-4bc823c4864e.webp'),
('PD086', 'Nước Hoa Dạng Xịt De Memoria 30Ml', 'France', 500, 'DE MEMORIA', 550000, '06 Grasse', 'https://image.hsv-tech.io/600x600/bbx/products/2c025498-57bc-4621-a647-4bc823c4864e.webp'),
('PD087', 'Nước Hoa Nữ Gennie Laura Anne Perfume Little Dress 50Ml', 'Viet Nam', 500, 'GENNIE', 239000, 'Rose', 'https://beautybox.com.vn/categories/cham-soc-ca-nhan'),
('PD088', 'Nước Hoa Nữ Gennie Laura Anne Perfume Little Dress 50Ml', 'Viet Nam', 500, 'GENNIE', 239000, 'Black', 'https://beautybox.com.vn/categories/cham-soc-ca-nhan'),
('PD089', 'Nước Hoa Nữ Gennie Laura Anne Perfume Little Dress 50Ml', 'Viet Nam', 500, 'GENNIE', 239000, 'Red', 'https://beautybox.com.vn/categories/cham-soc-ca-nhan'),
('PD090', 'Nước Hoa Nữ Gennie Laura Anne Perfume Little Dress 50Ml', 'Viet Nam', 500, 'GENNIE', 239000, 'Gold', 'https://beautybox.com.vn/categories/cham-soc-ca-nhan'),
('PD091', 'Xịt Thơm Cơ Thể De Memoria Body Mist 50ml', 'Korea', 500, 'DE MEMORIA', 400000, '01 First Snow', 'https://image.hsv-tech.io/600x600/bbx/common/0769d3dc-609d-48c0-8b45-0c54c5fa57fa.webp'),
('PD092', 'Xịt Thơm Cơ Thể De Memoria Body Mist 50ml', 'Korea', 500, 'DE MEMORIA', 400000, '02 In Blossm', 'https://image.hsv-tech.io/600x600/bbx/common/0769d3dc-609d-48c0-8b45-0c54c5fa57fa.webp'),
('PD093', 'Xịt Thơm Cơ Thể De Memoria Body Mist 50ml', 'Korea', 500, 'DE MEMORIA', 400000, '03 Popcorn', 'https://image.hsv-tech.io/600x600/bbx/common/0769d3dc-609d-48c0-8b45-0c54c5fa57fa.webp'),
('PD094', 'Xịt Thơm Cơ Thể De Memoria Body Mist 50ml', 'Korea', 500, 'DE MEMORIA', 400000, '04 His Shirt', 'https://image.hsv-tech.io/600x600/bbx/common/0769d3dc-609d-48c0-8b45-0c54c5fa57fa.webp'),
('PD095', 'Nước Hoa Nữ Marc Jacobs Daisy Love Edt', 'America', 500, 'MARC JACOBS', 1940000, '30', 'https://image.hsv-tech.io/600x600/bbx/common/925f256d-81c2-4dd5-b6c8-56e0585c4632.webp'),
('PD096', 'Nước Hoa Nữ Marc Jacobs Daisy Love Edt', 'America', 500, 'MARC JACOBS', 1940000, '50', 'https://image.hsv-tech.io/600x600/bbx/common/925f256d-81c2-4dd5-b6c8-56e0585c4632.webp'),
('PD097', 'Nước Hoa Nữ Marc Jacobs Daisy Love Edt', 'America', 500, 'MARC JACOBS', 1940000, '100', 'https://image.hsv-tech.io/600x600/bbx/common/925f256d-81c2-4dd5-b6c8-56e0585c4632.webp'),
('PD098', 'Nước Hoa Cho Nữ Giới Marc Jacobs Daisy Dream Forever Edp', 'America', 500, 'MARC JACOBS', 2960000, '50', 'https://image.hsv-tech.io/600x600/bbx/common/0440eadd-ad85-48c4-bb35-1b84e008cf31.webp'),
('PD099', 'Nước Hoa Cho Nữ Giới Marc Jacobs Daisy Dream Forever Edp', 'America', 500, 'MARC JACOBS', 2960000, '100', 'https://image.hsv-tech.io/600x600/bbx/common/0440eadd-ad85-48c4-bb35-1b84e008cf31.webp');

CREATE TABLE product_category (
    product_id VARCHAR(20) NOT NULL,
    category_id VARCHAR(20) NOT NULL,
    FOREIGN KEY (product_id) REFERENCES products(product_id),
    FOREIGN KEY (category_id) REFERENCES category(category_id)
);
INSERT INTO product_category (product_id, category_id) VALUES
('PD001', 'CT001'),
('PD002', 'CT001'),
('PD003', 'CT001'),
('PD004', 'CT001'),
('PD005', 'CT001'),
('PD006', 'CT001'),
('PD007', 'CT001'),
('PD008', 'CT001'),
('PD009', 'CT001'),
('PD010', 'CT001'),
('PD011', 'CT001'),
('PD012', 'CT001'),
('PD013', 'CT001'),
('PD014', 'CT001'),
('PD015', 'CT001'),
('PD016', 'CT001'),
('PD017', 'CT002'),
('PD018', 'CT002'),
('PD019', 'CT002'),
('PD020', 'CT002');
INSERT INTO product_category (product_id, category_id) VALUES
('PD021', 'CT002'),
('PD022', 'CT002'),
('PD023', 'CT002'),
('PD024', 'CT002'),
('PD025', 'CT002'),
('PD026', 'CT002'),
('PD027', 'CT002'),
('PD028', 'CT002'),
('PD029', 'CT002'),
('PD030', 'CT002'),
('PD031', 'CT002'),
('PD032', 'CT002'),
('PD033', 'CT002'),
('PD034', 'CT002'),
('PD035', 'CT002'),
('PD036', 'CT002'),
('PD037', 'CT002'),
('PD038', 'CT002'),
('PD039', 'CT002'),
('PD040', 'CT002'),
('PD041', 'CT002');
INSERT INTO product_category (product_id, category_id) VALUES
('PD042', 'CT002'),
('PD043', 'CT002'),
('PD044', 'CT002'),
('PD045', 'CT002'),
('PD046', 'CT002'),
('PD047', 'CT002'),
('PD048', 'CT002'),
('PD049', 'CT002'),
('PD050', 'CT002'),
('PD051', 'CT002'),
('PD052', 'CT002'),
('PD053', 'CT002'),
('PD054', 'CT002'),
('PD055', 'CT002'),
('PD056', 'CT002'),
('PD057', 'CT002'),
('PD058', 'CT002'),
('PD059', 'CT002'),
('PD060', 'CT002'),
('PD061', 'CT002'),
('PD062', 'CT002'),
('PD063', 'CT002'),
('PD064', 'CT002'),
('PD065', 'CT002'),
('PD066', 'CT002'),
('PD067', 'CT002'),
('PD068', 'CT002'),
('PD069', 'CT002'),
('PD070', 'CT002');
INSERT INTO product_category (product_id, category_id) VALUES
('PD071', 'CT004'),
('PD072', 'CT004'),
('PD073', 'CT004'),
('PD074', 'CT004'),
('PD075', 'CT004'),
('PD076', 'CT004'),
('PD077', 'CT004'),
('PD078', 'CT004'),
('PD079', 'CT004'),
('PD080', 'CT004'),
('PD081', 'CT004'),
('PD082', 'CT004'),
('PD083', 'CT004'),
('PD084', 'CT004'),
('PD085', 'CT004'),
('PD086', 'CT004'),
('PD087', 'CT004'),
('PD088', 'CT004'),
('PD089', 'CT004'),
('PD090', 'CT004'),
('PD091', 'CT004'),
('PD092', 'CT004'),
('PD093', 'CT004'),
('PD094', 'CT004'),
('PD095', 'CT004'),
('PD096', 'CT004'),
('PD097', 'CT004'),
('PD098', 'CT004'),
('PD099', 'CT004');

CREATE TABLE cart (
    cart_id VARCHAR(20) PRIMARY KEY NOT NULL,
    product_id VARCHAR(20) NOT NULL,
    account_id VARCHAR(20) NOT NULL,
    quantity INT,
    FOREIGN KEY (product_id) REFERENCES products(product_id),
    FOREIGN KEY (account_id) REFERENCES accounts(account_id)
);
INSERT INTO cart (cart_id, product_id, account_id, quantity) VALUES
('CA001', 'PD001', 'AC003', 1),
('CA002', 'PD001', 'AC004', 2),
('CA003', 'PD001', 'AC006', 1);

CREATE TABLE orders (
    order_id VARCHAR(20) PRIMARY KEY NOT NULL,
    program_id VARCHAR(20) NOT NULL,
    ship_fee DECIMAL(15,0),
    date DATETIME,
    status ENUM('in_transit', 'delivered', 'returned', 'cancel', 'done'),
    account_id VARCHAR(20) NOT NULL,
    payment_id VARCHAR(20) NOT NULL,
    delivery_id VARCHAR(20),
    profile_id VARCHAR(20) NOT NULL,
    FOREIGN KEY (program_id) REFERENCES promotion_programs(program_id),
    FOREIGN KEY (account_id) REFERENCES accounts(account_id),
    FOREIGN KEY (payment_id) REFERENCES payment(payment_id),
    FOREIGN KEY (delivery_id) REFERENCES delivery(delivery_id),
    FOREIGN KEY (profile_id) REFERENCES profiles(profile_id)
);
INSERT INTO orders (order_id, program_id, ship_fee, date, status, account_id, payment_id, delivery_id, profile_id) VALUES
('OD001', 'PG002', 30000, '2025-05-30', 'cancel', 'AC002', 'PM001', NULL, 'PF004'),
('OD002', 'PG002', 30000, '2025-05-28', 'done', 'AC002', 'PM002', 'DL002', 'PF004'),
('OD003', 'PG002', 30000, '2025-05-28', 'done', 'AC002', 'PM003', 'DL003', 'PF004'),
('OD004', 'PG002', 30000, '2025-05-28', 'done', 'AC002', 'PM004', 'DL004', 'PF004'),
('OD005', 'PG002', 30000, '2025-05-28', 'done', 'AC002', 'PM005', 'DL005', 'PF004'),
('OD006', 'PG002', 30000, '2025-05-28', 'done', 'AC002', 'PM006', 'DL006', 'PF004'),
('OD007', 'PG002', 30000, '2025-05-28', 'done', 'AC002', 'PM007', 'DL007', 'PF004'),
('OD008', 'PG002', 30000, '2025-05-28', 'done', 'AC002', 'PM008', 'DL008', 'PF004'),
('OD009', 'PG002', 30000, '2025-05-28', 'done', 'AC002', 'PM009', 'DL009', 'PF004');

CREATE TABLE order_details (
    orderDetail_id VARCHAR(20) PRIMARY KEY NOT NULL,
    product_id VARCHAR(20) NOT NULL,
    order_id VARCHAR(20) NOT NULL,
    quantity INT,
    comment NVARCHAR(5000),
    rate INT,
    image_evaluate VARCHAR(2083),
    FOREIGN KEY (product_id) REFERENCES products(product_id),
    FOREIGN KEY (order_id) REFERENCES orders(order_id)
);
INSERT INTO order_details (orderDetail_id, product_id, order_id, quantity, comment, rate, image_evaluate) VALUES
('OT001', 'PD001', 'OD001', 1, 'Order nhầm', NULL, NULL),
('OT002', 'PD017', 'OD002', 1, 'Sản phẩm đẹp, đúng mô tả, chất lượng tốt hơn mong đợi', 4, NULL),
('OT003', 'PD018', 'OD002', 1, 'Hàng chuẩn, đúng hình ảnh, dùng rất ok', 4, NULL),
('OT004', 'PD019', 'OD002', 1, 'Chất liệu xịn, đáng tiền, sẽ ủng hộ tiếp', 4, NULL),
('OT005', 'PD020', 'OD002', 1, 'Sản phẩm rất tốt trong tầm giá, mình rất ưng ý', 4, NULL),
('OT006', 'PD021', 'OD002', 1, 'Shop tư vấn nhiệt tình, phản hồi nhanh chóng', 4, NULL),
('OT007', 'PD022', 'OD002', 1, 'Chủ shop dễ thương, hỗ trợ khách hàng rất tốt', 4, NULL),
('OT008', 'PD023', 'OD002', 1, 'Shop giao hàng nhanh, đóng gói kỹ, rất chuyên nghiệp', 4, NULL),
('OT009', 'PD024', 'OD002', 1, 'Mua lần 2 rồi, shop lúc nào cũng làm mình hài lòng', 4, NULL);
INSERT INTO order_details (orderDetail_id, product_id, order_id, quantity, comment, rate, image_evaluate) VALUES
('OT010', 'PD025', 'OD003', 1, 'Giao hàng siêu nhanh, đặt hôm trước hôm sau nhận luôn', 4, NULL),
('OT011', 'PD026', 'OD003', 1, 'Đặt hàng cuối tuần mà vẫn nhận rất nhanh, tuyệt vời!', 4, NULL),
('OT012', 'PD027', 'OD003', 1, 'Shipper thân thiện, giao hàng đúng hẹn', 4, NULL),
('OT013', 'PD028', 'OD003', 1, 'Lần đầu mua hàng online mà hài lòng như vậy', 4, NULL),
('OT014', 'PD029', 'OD003', 1, 'Sẽ tiếp tục ủng hộ shop trong tương lai', 4, NULL),
('OT015', 'PD030', 'OD003', 1, 'Chất kem mịn, dễ thoa, thấm nhanh, không bị bết dính', 4, NULL),
('OT016', 'PD031', 'OD003', 1, 'Trải nghiệm mua hàng tuyệt vời, 5 sao', 5, NULL),
('OT017', 'PD032', 'OD003', 1, 'Son lên màu chuẩn, giữ màu lâu, không bị khô môi', 5, NULL),
('OT018', 'PD033', 'OD003', 1, 'Dùng thử thấy da mềm mịn hơn hẳn, rất ưng!', 5, NULL),
('OT019', 'PD034', 'OD003', 1, 'Tẩy trang sạch mà không gây rát da, nhẹ dịu đúng như mô tả', 5, NULL),
('OT020', 'PD035', 'OD003', 1, 'Dùng vài ngày đã thấy da căng mướt, sẽ mua lại lần nữa', 5, NULL),
('OT021', 'PD036', 'OD003', 1, 'Hiệu quả rõ rệt sau một tuần sử dụng, da đều màu hơn', 5, NULL),
('OT022', 'PD037', 'OD003', 1, 'Trị mụn khá ổn, nốt mụn xẹp nhanh, da không bị kích ứng', 5, NULL),
('OT023', 'PD038', 'OD003', 1, 'Dưỡng ẩm tốt, da không còn khô ráp vào mùa đông nữa', 5, NULL),
('OT024', 'PD039', 'OD003', 1, 'Da sáng hơn thấy rõ sau khi dùng hết 1 lọ, quá tuyệt', 5, NULL),
('OT025', 'PD040', 'OD003', 1, 'Bao bì xinh xắn, chắc chắn, nhìn rất xịn', 5, NULL),
('OT026', 'PD041', 'OD003', 1, 'Đóng gói kỹ càng, có chống sốc cẩn thận, sản phẩm nguyên vẹn', 5, NULL),
('OT027', 'PD042', 'OD003', 1, 'Hộp đẹp, sản phẩm còn được niêm phong đầy đủ', 5, NULL),
('OT028', 'PD043', 'OD003', 1, 'Nhận hàng không bị móp méo gì cả, rất hài lòng', 4, NULL),
('OT029', 'PD044', 'OD003', 1, 'Mùi thơm dịu nhẹ, dễ chịu, không bị nồng', 4, NULL),
('OT030', 'PD045', 'OD003', 1, 'Cảm giác mát lạnh khi thoa lên da, rất dễ chịu', 4, NULL),
('OT031', 'PD046', 'OD004', 1, 'Kết cấu gel nhẹ tênh, không nặng mặt, thẩm thấu nhanh.', 4, NULL),
('OT032', 'PD047', 'OD004', 1, 'Không gây châm chích hay đỏ da, hợp với da nhạy cảm.', 4, NULL),
('OT033', 'PD048', 'OD004', 1, 'Giá hợp lý, chất lượng vượt mong đợi', 4, NULL),
('OT034', 'PD049', 'OD004', 1, 'Mua đợt sale được giá tốt, quá hời!', 4, NULL),
('OT035', 'PD050', 'OD004', 1, 'Shop uy tín, mua lần thứ 3 rồi vẫn hài lòng như lần đầu', 4, NULL);
INSERT INTO order_details (orderDetail_id, product_id, order_id, quantity, comment, rate, image_evaluate) VALUES
('OT036', 'PD051', 'OD004', 1, 'Mỹ phẩm chính hãng, chất lượng tốt, giao nhanh. Rất đáng mua!', 4, NULL),
('OT037', 'PD052', 'OD004', 1, 'Sản phẩm phù hợp với da mình, sẽ tiếp tục sử dụng lâu dài', 4, NULL),
('OT038', 'PD053', 'OD004', 1, 'Từng dùng nhiều loại nhưng đây là loại mình ưng ý nhất.', 4, NULL),
('OT039', 'PD054', 'OD004', 1, 'Dùng thấy hợp da, không bị kích ứng, rất đáng tiền', 4, NULL),
('OT040', 'PD055', 'OD004', 1, 'Giao hàng nhanh, sản phẩm chính hãng, đóng gói cẩn thận', 4, NULL),
('OT041', 'PD056', 'OD004', 1, 'Mua lần đầu thấy rất ưng, chắc chắn sẽ quay lại mua tiếp', 5, NULL),
('OT042', 'PD057', 'OD005', 1, 'Serum thấm nhanh, không gây nhờn rít, da căng bóng hơn sau vài lần dùng.', 5, NULL),
('OT043', 'PD058', 'OD005', 1, 'Mùi dễ chịu, không bị hăng, da mình nhạy cảm mà vẫn dùng được.', 5, NULL),
('OT044', 'PD059', 'OD005', 1, 'Hiệu quả dưỡng trắng rõ rệt, sẽ gắn bó lâu dài', 4, NULL),
('OT045', 'PD060', 'OD005', 1, 'Rửa mặt xong da sạch mà vẫn mềm, không bị khô căng', 4, NULL),
('OT046', 'PD061', 'OD005', 1, 'Bọt mịn, làm sạch tốt, không gây kích ứng. Dùng rất thích!', 4, NULL),
('OT047', 'PD062', 'OD005', 1, 'Làm sạch sâu nhưng vẫn dịu nhẹ, da sáng lên trông thấy', 4, NULL),
('OT048', 'PD063', 'OD005', 1, 'Kem dưỡng thấm nhanh, da đủ ẩm cả đêm mà không bí.', 4, NULL),
('OT049', 'PD064', 'OD005', 1, 'Dưỡng ẩm tốt, sáng hôm sau da mềm mịn, không bong tróc.', 4, NULL),
('OT050', 'PD065', 'OD005', 1, 'Không gây mụn ẩn hay bít tắc lỗ chân lông, rất ổn với da dầu', 4, NULL),
('OT051', 'PD066', 'OD005', 1, 'Chống nắng tốt, không làm xuống tone, không nhờn dính', 4, NULL),
('OT052', 'PD067', 'OD006', 1, 'Chất kem mỏng nhẹ, dễ tán, không để lại vệt trắng', 4, NULL),
('OT053', 'PD068', 'OD007', 1, 'Dùng cả ngày không bị đổ dầu, da vẫn thông thoáng', 4, NULL),
('OT054', 'PD069', 'OD008', 1, 'Mỗi lần dùng cảm giác như được spa tại nhà vậy', 4, NULL),
('OT055', 'PD070', 'OD009', 1, 'Da mềm mịn, đều màu hơn rõ rệt, không còn thô ráp nữa', 4, NULL);

CREATE TABLE order_cancel (
    orderCancel_id VARCHAR(20) PRIMARY KEY NOT NULL,
    order_id VARCHAR(20) NOT NULL,
    date DATETIME,
    account_id VARCHAR(20) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(order_id),
    FOREIGN KEY (account_id) REFERENCES accounts(account_id)
);
INSERT INTO order_cancel (orderCancel_id, order_id, date, account_id) VALUES
('OC001', 'OD001', '2025-05-30', 'AC002');

CREATE TABLE support (
    support_id VARCHAR(20) PRIMARY KEY NOT NULL,
    account_id_customer VARCHAR(20) NOT NULL,
    account_id_staff VARCHAR(20) NOT NULL,
    date_create DATETIME,
    comment NVARCHAR(5000),
    date_resolve DATETIME,
    resolve NVARCHAR(5000),
    FOREIGN KEY (account_id_customer) REFERENCES accounts(account_id),
    FOREIGN KEY (account_id_staff) REFERENCES accounts(account_id)
);
INSERT INTO support (support_id, account_id_customer, account_id_staff, date_create, comment, date_resolve, resolve) VALUES
('SP001', 'AC003', 'AC002', '2025-06-12', 'Sản phẩm nước Thần Giảm Nếp Nhăn Trên Da Su:m37° Secret Essence 80ml còn ko shop?', '2025-06-12', 'Dạ còn ạ');
