-- 1. ฟังก์ชันตรวจสอบ Admin (ตรวจสอบจากอีเมลที่ล็อกอิน)
CREATE OR REPLACE FUNCTION is_admin() 
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (auth.jwt() ->> 'email') = 'sattawat2560@gmail.com';
END;
$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 2. เปิดใช้งาน RLS (Row Level Security) สำหรับทุกตาราง
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vouchers_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE voucher_qrs ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- 3. นโยบายความปลอดภัย (Policies) แทน Firestore Rules

-- ==========================================
-- Users (ผู้ใช้งาน)
-- ==========================================
-- ลบกฎเก่าทิ้งก่อนเพื่อป้องกัน Error ถ้าเคยกดรันไปแล้ว
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can write own data" ON users;

CREATE POLICY "Users can read own data" ON users 
FOR SELECT USING (auth.uid()::text = id OR is_admin());

CREATE POLICY "Users can write own data" ON users 
FOR ALL USING (auth.uid()::text = id OR is_admin());

-- ==========================================
-- Orders (คำสั่งซื้อ)
-- ==========================================
DROP POLICY IF EXISTS "Anyone can create orders" ON orders;
DROP POLICY IF EXISTS "Users can read own orders or admin" ON orders;
DROP POLICY IF EXISTS "Users can update own orders or admin" ON orders;
DROP POLICY IF EXISTS "Admin can delete orders" ON orders;

CREATE POLICY "Anyone can create orders" ON orders 
FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can read own orders or admin" ON orders 
FOR SELECT USING (
  auth.uid()::text = customer OR 
  (auth.jwt() ->> 'email') = "customerEmail" OR 
  is_admin()
);

CREATE POLICY "Users can update own orders or admin" ON orders 
FOR UPDATE USING (
  auth.uid()::text = customer OR 
  (auth.jwt() ->> 'email') = "customerEmail" OR 
  is_admin()
);

CREATE POLICY "Admin can delete orders" ON orders 
FOR DELETE USING (is_admin());

-- ==========================================
-- Vouchers (คูปองต่างๆ)
-- ==========================================
DROP POLICY IF EXISTS "Anyone can read vouchers" ON vouchers;
DROP POLICY IF EXISTS "Admin can write vouchers" ON vouchers;
DROP POLICY IF EXISTS "Auth users can read/write redemptions" ON vouchers_redemptions;
DROP POLICY IF EXISTS "Anyone can read voucher_qrs" ON voucher_qrs;
DROP POLICY IF EXISTS "Auth users can write voucher_qrs" ON voucher_qrs;

CREATE POLICY "Anyone can read vouchers" ON vouchers 
FOR SELECT USING (true);

CREATE POLICY "Admin can write vouchers" ON vouchers 
FOR ALL USING (is_admin());

CREATE POLICY "Auth users can read/write redemptions" ON vouchers_redemptions 
FOR ALL USING (auth.role() = 'authenticated' OR is_admin());

CREATE POLICY "Anyone can read voucher_qrs" ON voucher_qrs 
FOR SELECT USING (true);

CREATE POLICY "Auth users can write voucher_qrs" ON voucher_qrs 
FOR ALL USING (auth.role() = 'authenticated' OR is_admin());

-- ==========================================
-- Chats (แชท)
-- ==========================================
-- สร้างฟังก์ชัน is_seller() เพื่อตรวจสอบว่าเป็น Seller หรือไม่
CREATE OR REPLACE FUNCTION is_seller() 
RETURNS BOOLEAN AS $
BEGIN
  RETURN is_admin() OR 
         EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND role = 'seller');
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

DROP POLICY IF EXISTS "Auth users and admin can access chats" ON chats;
DROP POLICY IF EXISTS "Users can read own chat" ON chats;
DROP POLICY IF EXISTS "Sellers can access all chats" ON chats;

CREATE POLICY "Users can read own chat" ON chats 
FOR SELECT USING (id = auth.uid()::text OR "userEmail" = (auth.jwt() ->> 'email'));

CREATE POLICY "Sellers can access all chats" ON chats 
FOR ALL USING (is_seller());

DROP POLICY IF EXISTS "Auth users and admin can access chat_messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can access own chat messages" ON chat_messages;
DROP POLICY IF EXISTS "Sellers can access all chat_messages" ON chat_messages;

CREATE POLICY "Users can access own chat messages" ON chat_messages 
FOR ALL USING ("chatId" = auth.uid()::text OR "chatId" = (auth.jwt() ->> 'email'));

CREATE POLICY "Sellers can access all chat_messages" ON chat_messages 
FOR ALL USING (is_seller());

-- ==========================================
-- Products (สินค้า)
-- ==========================================
DROP POLICY IF EXISTS "Anyone can read and write products" ON products;

CREATE POLICY "Anyone can read and write products" ON products 
FOR ALL USING (true);



-- เพิ่ม Index เพื่อเพิ่มความเร็วในการโหลดแชท (ลดปัญหา Timeout)
CREATE INDEX IF NOT EXISTS idx_chat_messages_chatid ON chat_messages("chatId");


