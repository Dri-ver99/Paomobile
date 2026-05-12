/**
 * Paomobile Product Recovery Script
 * Run this to restore the 3 main merged products.
 */
async function restoreLostProducts() {
    if (typeof db === 'undefined') {
        alert("❌ ไม่พบการเชื่อมต่อฐานข้อมูล กรุณาเปิดหน้านี้ใน Seller Centre ครับ");
        return;
    }

    console.log("🚀 Starting Product Recovery...");

    const recoveredProducts = [
        {
            id: "p-recovered-iphone-battery",
            name: "🔋 เปลี่ยนแบตเตอรี่ iPhone (ทุกรุ่น) - แบตแท้ / Dissing เพิ่มความจุ",
            brand: "Apple",
            category: "parts",
            partModel: "iPhone",
            partType: "เปลี่ยนแบตเตอรี่",
            price: 490,
            description: "บริการเปลี่ยนแบตเตอรี่ iPhone ทุกรุ่น\n✅ แบตแท้คุณภาพสูง\n✅ แบต Dissing เพิ่มความจุ (รับประกัน 1 ปี)\n✅ รอรับได้เลย 30-60 นาที",
            emoji: "🔋",
            img: "https://www.paomobile.com/images/battery-service.jpg", // Placeholder or use real if known
            images: [],
            variations: [
                { id: "v15pm-t", name: "iPhone 15 Pro Max (แบตแท้)", price: 2900 },
                { id: "v15pm-d", name: "iPhone 15 Pro Max (Dissing)", price: 3500 },
                { id: "v15p-t", name: "iPhone 15 Pro (แบตแท้)", price: 2500 },
                { id: "v15p-d", name: "iPhone 15 Pro (Dissing)", price: 3200 },
                { id: "v14pm-t", name: "iPhone 14 Pro Max (แบตแท้)", price: 2500 },
                { id: "v14pm-d", name: "iPhone 14 Pro Max (Dissing)", price: 3200 },
                { id: "v13pm-t", name: "iPhone 13 Pro Max (แบตแท้)", price: 1900 },
                { id: "v13pm-d", name: "iPhone 13 Pro Max (Dissing)", price: 2500 },
                { id: "v12pm-t", name: "iPhone 12 Pro Max (แบตแท้)", price: 1500 },
                { id: "v12pm-d", name: "iPhone 12 Pro Max (Dissing)", price: 2200 },
                { id: "v11pm-t", name: "iPhone 11 Pro Max (แบตแท้)", price: 1290 },
                { id: "v11-t", name: "iPhone 11 (แบตแท้)", price: 990 },
                { id: "vxm-t", name: "iPhone XS Max (แบตแท้)", price: 1190 },
                { id: "vx-t", name: "iPhone X (แบตแท้)", price: 990 }
            ],
            updatedAt: new Date().toISOString()
        },
        {
            id: "p-recovered-samsung-z",
            name: "📱 ซ่อมหน้าจอ Samsung Galaxy Z Series (Fold/Flip)",
            brand: "Samsung",
            category: "parts",
            partModel: "Samsung",
            partType: "เปลี่ยนหน้าจอ",
            price: 5900,
            description: "บริการเปลี่ยนจอแท้ Samsung Galaxy Z Series\n✅ จอแท้ศูนย์ สีสด ทัชลื่น\n✅ รับประกันงานซ่อม\n✅ ช่างเชี่ยวชาญงานพับโดยเฉพาะ",
            emoji: "📱",
            img: "",
            images: [],
            variations: [
                { id: "vz-fold5", name: "Galaxy Z Fold 5", price: 12900 },
                { id: "vz-fold4", name: "Galaxy Z Fold 4", price: 11900 },
                { id: "vz-fold3", name: "Galaxy Z Fold 3", price: 9900 },
                { id: "vz-flip5", name: "Galaxy Z Flip 5", price: 7900 },
                { id: "vz-flip4", name: "Galaxy Z Flip 4", price: 6900 },
                { id: "vz-flip3", name: "Galaxy Z Flip 3", price: 5900 }
            ],
            updatedAt: new Date().toISOString()
        },
        {
            id: "p-recovered-samsung-battery",
            name: "🔋 เปลี่ยนแบตเตอรี่ Samsung Galaxy (รวมรุ่น)",
            brand: "Samsung",
            category: "parts",
            partModel: "Samsung",
            partType: "เปลี่ยนแบตเตอรี่",
            price: 690,
            description: "บริการเปลี่ยนแบตเตอรี่ Samsung ทุกรุ่น\n✅ แบตแท้คุณภาพสูง\n✅ รับประกัน 6-12 เดือน",
            emoji: "🔋",
            img: "",
            images: [],
            variations: [
                { id: "vs24u", name: "Galaxy S24 Ultra", price: 2900 },
                { id: "vs23u", name: "Galaxy S23 Ultra", price: 2500 },
                { id: "vs22u", name: "Galaxy S22 Ultra", price: 2200 },
                { id: "vn20u", name: "Galaxy Note 20 Ultra", price: 1900 },
                { id: "va55", name: "Galaxy A55", price: 1290 },
                { id: "va54", name: "Galaxy A54", price: 1190 }
            ],
            updatedAt: new Date().toISOString()
        }
    ];

    try {
        const batch = db.batch();
        recoveredProducts.forEach(p => {
            const ref = db.collection('products').doc(p.id);
            batch.set(ref, p, { merge: true });
        });
        await batch.commit();
        
        console.log("✅ Recovery Successful!");
        alert("✨ กู้คืนสินค้า 3 รายการหลักเรียบร้อยแล้วครับ!\n1. แบตเตอรี่ iPhone\n2. หน้าจอ Samsung Z Series\n3. แบตเตอรี่ Samsung\n\nสินค้าจะปรากฏในรายการเร็วๆ นี้ครับ");
        
        // Refresh page to show new data
        location.reload();
    } catch (err) {
        console.error("❌ Recovery Failed:", err);
        alert("เกิดข้อผิดพลาดในการกู้คืน: " + err.message);
    }
}

// Auto-run if URL has ?restore=true
if (new URLSearchParams(window.location.search).get('restore') === 'true') {
    setTimeout(restoreLostProducts, 1000);
}
