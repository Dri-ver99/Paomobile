window.ProductDetail = {
    currentProduct: null,
    currentImageIndex: 0,
    qty: 1,

    init() {
        // Always inject styles
        this.injectStyles();
        // Remove any stale static modal and inject our dynamic one
        const existing = document.getElementById('productDetailModal');
        if (existing) existing.remove();
        this.injectModalHTML();
    },

    injectStyles() {
        const styleId = 'pd-hammer-styles';
        if (document.getElementById(styleId)) return;

        const style = document.createElement('style');
        style.id = styleId;
        style.innerHTML = `
            /* Product Modal Hammer Fix (Premium v2.0) */
            .product-modal-overlay {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.4);
                backdrop-filter: blur(12px);
                z-index: 2147483647;
                justify-content: center;
                align-items: center;
                opacity: 0;
                transition: opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            }
            .product-modal-overlay.open {
                display: flex;
                opacity: 1;
            }
            .product-modal-container {
                background: #fff;
                width: 95%;
                max-width: 880px;
                max-height: 88vh;
                border-radius: 24px;
                position: relative;
                overflow-x: hidden;
                overflow-y: auto;
                box-shadow: 0 40px 100px -20px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(0,0,0,0.04);
                transform: translateY(30px) scale(0.98);
                transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
            }
            .product-modal-overlay.open .product-modal-container {
                transform: translateY(0) scale(1);
            }
            .pd-close-btn {
                position: absolute;
                top: 14px;
                right: 14px;
                width: 32px;
                height: 32px;
                background: rgba(255,255,255,0.85);
                backdrop-filter: blur(8px);
                border: 1px solid rgba(0,0,0,0.08);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 0.85rem;
                color: #71717a;
                cursor: pointer;
                z-index: 10;
                transition: all 0.25s ease;
                box-shadow: 0 2px 8px rgba(0,0,0,0.06);
            }
            .pd-close-btn:hover {
                background: #fff;
                color: #18181b;
                transform: rotate(90deg) scale(1.05);
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            }

            .pd-layout { display: flex; gap: 0; min-height: 420px; }
            .pd-image-side { 
                flex: 1.15; padding: 24px; display: flex; align-items: center; justify-content: center; 
                background: linear-gradient(145deg, #fafafa 0%, #f0f0f0 100%); 
                position: relative; border-right: 1px solid #eee;
                border-radius: 24px 0 0 24px;
            }
            .pd-main-img { width: 100%; height: 100%; object-fit: contain; border-radius: 16px; transition: all 0.4s ease; }
            .pd-info-side { 
                flex: 0.85; padding: 28px 24px 24px; display: flex; flex-direction: column; 
                justify-content: flex-start; overflow-y: auto;
            }
            
            .pd-brand { color: #a1a1aa; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 4px; }
            .pd-name { font-size: 1.5rem; font-weight: 800; margin-bottom: 4px; color: #18181b; letter-spacing: -0.5px; line-height: 1.3; }
            .pd-sku { color: #d4d4d8; font-size: 0.68rem; margin-bottom: 14px; font-weight: 500; text-transform: uppercase; }
            
            .pd-price-wrap { display: flex; align-items: baseline; gap: 10px; margin-bottom: 6px; flex-wrap: wrap; }
            .pd-price-promo { font-size: 1.9rem; font-weight: 800; color: #f97316; letter-spacing: -1px; line-height: 1; }
            .pd-price-original { font-size: 0.95rem; color: #a1a1aa; text-decoration: line-through; font-weight: 500; }
            .pd-sale-badge { background: linear-gradient(135deg, #fecaca, #fde8e8); color: #ef4444; font-size: 0.65rem; font-weight: 700; padding: 3px 8px; border-radius: 100px; }
            
            .pd-shipping-info { color: #b0b0b0; font-size: 0.72rem; margin-bottom: 18px; font-weight: 500; }
            
            .pd-selector-item { margin-bottom: 18px; }
            .pd-label { display: block; font-weight: 700; margin-bottom: 8px; font-size: 0.82rem; color: #18181b; }
            .pd-options { display: flex; flex-wrap: wrap; gap: 8px; }
            .pd-option { 
                padding: 6px 14px; border: 1.5px solid #e4e4e7; border-radius: 10px; 
                background: #fff; cursor: pointer; font-size: 0.78rem; font-weight: 600; transition: all 0.2s; color: #52525b;
            }
            .pd-option:hover { border-color: #18181b; color: #18181b; background: #fafafa; }
            .pd-option.selected { background: #18181b; border-color: #18181b; color: #fff; box-shadow: 0 4px 12px rgba(0,0,0,0.12); }
            
            .pd-qty-section { margin-bottom: 20px; }
            .pd-qty-group { display: flex; align-items: center; gap: 14px; }
            .pd-qty-btn { 
                width: 34px; height: 34px; border-radius: 50%; border: 1.5px solid #e4e4e7; 
                background: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; 
                font-size: 1rem; transition: all 0.2s; color: #18181b; outline: none;
            }
            .pd-qty-btn:hover { border-color: #18181b; background: #f9f9f9; }
            .pd-qty-val { font-size: 1rem; font-weight: 700; min-width: 22px; text-align: center; }
            
            .pd-actions { display: flex; gap: 10px; width: 100%; margin-bottom: 14px; }
            .btn-pd { 
                flex: 1; height: 44px; border-radius: 12px; font-size: 0.85rem; font-weight: 700; 
                display: flex; align-items: center; justify-content: center; cursor: pointer; 
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); border: none;
            }
            .btn-pd-outline { background: #fff; border: 2px solid #18181b; color: #18181b; }
            .btn-pd-outline:hover { background: #f4f4f5; }
            .btn-pd-solid { background: linear-gradient(135deg, #18181b, #27272a); color: #fff; box-shadow: 0 4px 14px rgba(0,0,0,0.15); }
            .btn-pd-solid:hover { transform: translateY(-1px); box-shadow: 0 8px 20px rgba(0,0,0,0.25); }
            
            .pd-desc { 
                color: #1e293b; 
                line-height: 1.75; 
                font-size: 1rem; 
                margin-top: 0; 
                padding: 24px 30px; 
                background: #f8fafc;
                border-top: 1px solid #f1f5f9;
                white-space: pre-line;
                font-weight: 600;
                width: 100%;
            }

            /* Carousel & Arrows */
            .pd-carousel { position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
            .pd-main-img-container { position: relative; width: 100%; aspect-ratio: 1/1; display: flex; align-items: center; justify-content: center; background: transparent; border-radius: 16px; overflow: hidden; }
            
            .pd-carousel-prev, .pd-carousel-next { 
                position: absolute; top: 50%; transform: translateY(-50%); 
                width: 36px; height: 36px; background: rgba(0,0,0,0.35); backdrop-filter: blur(10px);
                border: 1px solid rgba(255,255,255,0.25); border-radius: 50%; cursor: pointer; 
                display: flex; align-items: center; justify-content: center;
                transition: all 0.25s; z-index: 10; color: #fff; font-size: 0.8rem;
                box-shadow: 0 2px 10px rgba(0,0,0,0.15); opacity: 0.7;
            }
            .pd-carousel-prev { left: 10px; }
            .pd-carousel-next { right: 10px; }
            .pd-carousel-prev:hover, .pd-carousel-next:hover { opacity: 1; background: rgba(0,0,0,0.6); transform: translateY(-50%) scale(1.08); }
            
            .pd-carousel-dots { position: absolute; bottom: 12px; left: 50%; transform: translateX(-50%); display: flex; gap: 6px; z-index: 11; }
            .pd-dot { width: 6px; height: 6px; background: rgba(0,0,0,0.15); border-radius: 50%; cursor: pointer; transition: all 0.3s; }
            .pd-dot.active { width: 20px; background: #18181b; border-radius: 8px; }

            /* Responsive */
            @media (max-width: 768px) {
                .product-modal-container { width: 100%; height: 100dvh; max-height: 100dvh; border-radius: 0; box-shadow: none; display: flex; flex-direction: column; overflow-y: auto; }
                .pd-layout { flex-direction: column; min-height: auto; width: 100%; }
                .pd-image-side { padding: 50px 24px 20px; border-right: none; border-bottom: 1px solid #eee; min-height: 320px; border-radius: 0; }
                .pd-info-side { padding: 20px 18px 80px; }
                .pd-name { font-size: 1.4rem; }
                .pd-price-promo { font-size: 1.7rem; }
                .pd-close-btn { top: 12px; right: 12px; }
                .pd-actions { position: fixed; bottom: 0; left: 0; right: 0; padding: 14px 18px; background: rgba(255,255,255,0.92); backdrop-filter: blur(12px); z-index: 100; border-top: 1px solid #eee; margin-bottom: 0; }
        `;
        document.head.appendChild(style);
    },

    injectModalHTML() {
        const modalDiv = document.createElement('div');
        modalDiv.id = 'productDetailModal';
        modalDiv.className = 'product-modal-overlay';
        modalDiv.innerHTML = `
            <div class="product-modal-container">
                <button class="pd-close-btn" onclick="ProductDetail.close()">✕</button>
                <div class="pd-layout">
                    <div class="pd-image-side">📦</div>
                    <div class="pd-info-side">
                        <div class="pd-brand">Brand</div>
                        <h2 class="pd-name">Product Name</h2>
                        <div class="pd-sku">SKU: N/A</div>
                        <div class="pd-price-wrap">
                            <span class="pd-price-original" style="display: none;"></span>
                            <span class="pd-price-promo">฿0</span>
                            <span class="pd-sale-badge" style="display: none;">ลดราคา</span>
                        </div>
                        <div class="pd-shipping-info">ค่าจัดส่งที่คำนวณในขั้นตอนการชำระเงิน</div>
                        
                        <div id="pdVariationSection" class="pd-selector-item" style="display: none;">
                            <span class="pd-label" id="pdVariationLabel">ตัวเลือกสินค้า</span>
                            <div class="pd-options" id="pdVariationOptions"></div>
                        </div>

                        <div class="pd-qty-section">
                            <span class="pd-label">ปริมาณ</span>
                            <div class="pd-qty-group">
                                <button class="pd-qty-btn" onclick="ProductDetail.updateQty(-1)">-</button>
                                <span class="pd-qty-val">1</span>
                                <button class="pd-qty-btn" onclick="ProductDetail.updateQty(1)">+</button>
                            </div>
                        </div>

                        <div class="pd-actions">
                            <button class="btn-pd btn-pd-outline" onclick="ProductDetail.addToCart()">เพิ่มลงในตะกร้าสินค้า</button>
                            <button class="btn-pd btn-pd-solid" onclick="ProductDetail.buyNow()">ซื้อเลย</button>
                        </div>
                    </div>
                </div>
                <div class="pd-desc">คำอธิบายสินค้า...</div>
            </div>
        `;
        document.body.appendChild(modalDiv);

        // Click outside to close
        modalDiv.addEventListener('click', (e) => {
            if (e.target === modalDiv) this.close();
        });
    },

    open(product) {
        this.init(); // Ensure modal exists
        this.currentProduct = product;
        this.qty = 1;
        this.currentImageIndex = 0;

        const modal = document.getElementById('productDetailModal');
        const container = modal.querySelector('.product-modal-container');

        // Update DOM
        const brandEl = modal.querySelector('.pd-brand');
        const nameEl = modal.querySelector('.pd-name');
        const pricePromoEl = modal.querySelector('.pd-price-promo');
        const priceOrigEl = modal.querySelector('.pd-price-original');
        const saleBadgeEl = modal.querySelector('.pd-sale-badge');
        const descEl = modal.querySelector('.pd-desc');
        const qtyValEl = modal.querySelector('.pd-qty-val');
        const skuEl = modal.querySelector('.pd-sku');

        if (brandEl) brandEl.textContent = product.brand || 'Paomobile';
        if (nameEl) nameEl.textContent = product.name;
        if (pricePromoEl) pricePromoEl.textContent = '฿' + (product.price ? product.price.toLocaleString() : '0');
        if (skuEl) skuEl.textContent = 'SKU: ' + (product.id || 'N/A');

        if (product.originalPrice && priceOrigEl && saleBadgeEl) {
            priceOrigEl.textContent = '฿' + product.originalPrice.toLocaleString();
            priceOrigEl.style.display = 'inline-block';
            saleBadgeEl.style.display = 'inline-block';
        } else if (priceOrigEl && saleBadgeEl) {
            priceOrigEl.style.display = 'none';
            saleBadgeEl.style.display = 'none';
        }

        if (descEl) descEl.innerHTML = product.description || 'ไม่มีรายละเอียดเพิ่มเติมสำหรับสินค้านี้';
        if (qtyValEl) qtyValEl.textContent = this.qty;

        this.currentVariation = null;

        // --- FEATURE: Auto-select first variation (price & button only, keep cover image) ---
        if (product.variations && product.variations.length > 0) {
            this.currentVariation = product.variations[0];
            // Update initial price to variation price
            const vPrice = this.currentVariation.price || product.price;
            if (pricePromoEl) pricePromoEl.textContent = '฿' + vPrice.toLocaleString();
        }

        this.renderVariations();
        this.renderImages();
        // NOTE: Always show cover/main image first — variation image only changes when customer clicks

        // Show Modal
        modal.classList.add('open');
        document.body.style.overflow = 'hidden'; // Prevent scroll
    },

    openByElement(el) {
        try {
            const data = el.getAttribute('data-product-json');
            if (data) {
                const product = JSON.parse(data);
                this.open(product);
            }
        } catch (e) {
            console.error("[ProductDetail] Error opening via element:", e);
        }
    },

    renderVariations() {
        const modal = document.getElementById('productDetailModal');
        const section = modal.querySelector('#pdVariationSection');
        const optionsEl = modal.querySelector('#pdVariationOptions');
        const p = this.currentProduct;

        if (p.variations && p.variations.length > 0) {
            section.style.display = 'block';
            optionsEl.innerHTML = p.variations.map(v => `
                <button class="pd-option ${this.currentVariation?.id === v.id ? 'selected' : ''}" 
                        onclick="window.ProductDetail.selectVariation('${v.id}')">
                    ${v.name}
                </button>
            `).join('');
        } else {
            section.style.display = 'none';
        }
    },

    selectVariation(variationId) {
        const v = this.currentProduct.variations.find(v => v.id === variationId);
        if (!v) return;

        this.currentVariation = v;

        // Update Price UI
        const pricePromoEl = document.querySelector('.pd-price-promo');
        const price = v.price || this.currentProduct.price;
        if (pricePromoEl) pricePromoEl.textContent = '฿' + price.toLocaleString();

        // Update Image if variation has one
        if (v.img) {
            const mainImg = document.getElementById('pdMainImg');
            if (mainImg) {
                mainImg.src = v.img;
            }
        }

        this.renderVariations();
    },

    renderImages() {
        const modal = document.getElementById('productDetailModal');
        const imageSide = modal.querySelector('.pd-image-side');
        if (!imageSide) return;

        const p = this.currentProduct;
        const images = this.getImages();

        if (images.length > 0) {
            const hasMultiple = images.length > 1;
            imageSide.innerHTML = `
                <div class="pd-carousel">
                    <div class="pd-main-img-container">
                        ${hasMultiple ? `<button class="pd-carousel-prev" onclick="event.stopPropagation(); window.ProductDetail.prevImage()">❮</button>` : ''}
                        <img src="${images[this.currentImageIndex]}" alt="${p.name}" class="pd-main-img" id="pdMainImg">
                        ${hasMultiple ? `<button class="pd-carousel-next" onclick="event.stopPropagation(); window.ProductDetail.nextImage()">❯</button>` : ''}
                        
                        ${hasMultiple ? `
                            <div class="pd-carousel-dots">
                                ${images.map((img, idx) => `
                                    <span class="pd-dot ${idx === this.currentImageIndex ? 'active' : ''}" 
                                          onclick="event.stopPropagation(); window.ProductDetail.setImage(${idx})"></span>
                                `).join('')}
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        } else {
            imageSide.innerHTML = `<div style="font-size: 80px; text-align: center; width: 100%; padding: 40px;">${p.emoji || '📦'}</div>`;
        }
    },

    setImage(index) {
        if (!this.currentProduct) return;
        const images = (this.currentProduct.images && this.currentProduct.images.length > 0)
            ? this.currentProduct.images
            : [this.currentProduct.img];

        if (index < 0 || index >= images.length) return;

        this.currentImageIndex = index;

        // Fast update without full re-render for smoothness
        const mainImg = document.getElementById('pdMainImg');
        if (mainImg) {
            mainImg.style.opacity = '0.5';
            setTimeout(() => {
                mainImg.src = images[index];
                mainImg.style.opacity = '1';
            }, 50);
        }

        // Update active thumbnail
        const thumbs = document.querySelectorAll('.pd-thumb-item');
        thumbs.forEach((t, i) => {
            if (i === index) t.classList.add('active');
            else t.classList.remove('active');
        });
    },

    prevImage() {
        const images = this.getImages();
        if (images.length <= 1) return;
        this.currentImageIndex = (this.currentImageIndex - 1 + images.length) % images.length;
        this.updateImageView();
    },

    nextImage() {
        const images = this.getImages();
        if (images.length <= 1) return;
        this.currentImageIndex = (this.currentImageIndex + 1) % images.length;
        this.updateImageView();
    },

    setImage(idx) {
        const images = this.getImages();
        if (idx < 0 || idx >= images.length) return;
        this.currentImageIndex = idx;
        this.updateImageView();
    },

    getImages() {
        const p = this.currentProduct;
        if (!p) return [];
        return (p.images && p.images.length > 0) ? p.images : (p.img ? [p.img] : []);
    },

    updateImageView() {
        const images = this.getImages();
        const mainImg = document.getElementById('pdMainImg');
        if (mainImg && images[this.currentImageIndex]) {
            mainImg.style.opacity = '0.3';
            setTimeout(() => {
                mainImg.src = images[this.currentImageIndex];
                mainImg.style.opacity = '1';
            }, 60);
        }

        // Update dots
        const dots = document.querySelectorAll('.pd-dot');
        dots.forEach((dot, i) => {
            if (i === this.currentImageIndex) dot.classList.add('active');
            else dot.classList.remove('active');
        });
    },

    close() {
        const modal = document.getElementById('productDetailModal');
        if (modal) {
            modal.classList.remove('open');
            document.body.style.overflow = '';
        }
    },

    updateQty(delta) {
        this.qty = Math.max(1, this.qty + delta);
        const qtyValEl = document.querySelector('.pd-qty-val');
        if (qtyValEl) qtyValEl.textContent = this.qty;
    },

    selectColor(btn) {
        document.querySelectorAll('.pd-option').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        const color = btn.textContent;
        if (this.currentProduct.variantImages && this.currentProduct.variantImages[color]) {
            const idx = this.currentProduct.images.indexOf(this.currentProduct.variantImages[color]);
            if (idx !== -1) this.setImage(idx);
        }
    },

    addToCart() {
        if (!this.currentProduct) return;
        const p = this.currentProduct;
        const v = this.currentVariation;

        // If product has variations but none selected, prompt user
        if (p.variations && p.variations.length > 0 && !v) {
            alert('กรุณาเลือกตัวเลือกสินค้าก่อนเพิ่มลงตะกร้า');
            return;
        }

        const productId = this.currentProduct.id + (v ? `-${v.id}` : '');
        const itemName = this.currentProduct.name + (v ? ` (${v.name})` : '');
        const price = v ? (v.price || this.currentProduct.price) : this.currentProduct.price;

        let cartImg = (v && v.img) ? v.img : (this.currentProduct.img || (this.currentProduct.images && this.currentProduct.images[0]));

        const getActiveUserId = () => { try { const u = JSON.parse(localStorage.getItem('paomobile_user')); return u ? (u.uid || u.phone || 'default') : 'guest'; } catch { return 'guest'; } };
        const cartKey = 'pao_cart_' + getActiveUserId();
        const cart = JSON.parse(localStorage.getItem(cartKey)) || [];
        const idx = cart.findIndex(i => i.id === productId);

        if (idx >= 0) {
            cart[idx].qty += this.qty;
        } else {
            cart.push({
                id: productId,
                name: itemName,
                price: price,
                img: cartImg,
                emoji: this.currentProduct.emoji,
                qty: this.qty,
                variationName: v ? v.name : null
            });
        }

        localStorage.setItem(cartKey, JSON.stringify(cart));
        if (window.CartUI) {
            CartUI.update();
            CartUI.open();
        }
        this.close();
    },

    buyNow() {
        if (window.AuthAPI && !window.AuthAPI.isLoggedIn()) {
            alert('กรุณาเข้าสู่ระบบก่อนดำเนินการสั่งซื้อสินค้า');
            window.AuthAPI.redirectToLogin();
            return;
        }
        this.addToCart();
        window.location.href = 'cart.html';
    }
};

// Initial run
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => window.ProductDetail.init());
}

