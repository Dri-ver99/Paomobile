window.ProductDetail = {
    currentProduct: null,
    currentImageIndex: 0,
    qty: 1,

    init() {
        // Only inject if not already present
        if (!document.getElementById('productDetailModal')) {
            this.injectStyles();
            this.injectModalHTML();
        }
    },

    injectStyles() {
        const styleId = 'pd-hammer-styles';
        if (document.getElementById(styleId)) return;

        const style = document.createElement('style');
        style.id = styleId;
        style.innerHTML = `
            /* Product Modal Hammer Fix (Premium & High Priority) */
            .product-modal-overlay {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                backdrop-filter: blur(4px);
                z-index: 10000;
                justify-content: center;
                align-items: center;
                opacity: 0;
                transition: opacity 0.3s ease;
            }
            .product-modal-overlay.open {
                display: flex;
                opacity: 1;
            }
            .product-modal-container {
                background: #fff;
                width: 90%;
                max-width: 900px;
                max-height: 90vh;
                border-radius: 24px;
                position: relative;
                overflow: hidden;
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                transform: translateY(20px);
                transition: transform 0.3s ease;
            }
            .product-modal-overlay.open .product-modal-container {
                transform: translateY(0);
            }
            .pd-close-btn {
                position: absolute;
                top: 20px;
                right: 20px;
                width: 40px;
                height: 40px;
                background: rgba(255, 255, 255, 0.9);
                border: 1px solid rgba(0, 0, 0, 0.05);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.2rem;
                color: #333;
                cursor: pointer;
                z-index: 10;
                transition: all 0.2s;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            }
            .pd-close-btn:hover {
                transform: rotate(90deg);
                background: #fff;
            }

            /* Responsive (Screen Circle drawing fix) */
            @media (max-width: 768px) {
                .product-modal-overlay.open {
                    background: rgba(0, 0, 0, 0.9) !important;
                    z-index: 20000 !important;
                }
                .product-modal-container {
                    width: 100% !important;
                    height: 100dvh !important;
                    max-height: 100dvh !important;
                    border-radius: 0 !important;
                    display: flex !important;
                    flex-direction: column !important;
                    padding: 0 !important;
                }
                .pd-layout {
                    flex-direction: column !important;
                    height: 100% !important;
                    overflow-y: auto !important;
                }
                .pd-image-side {
                    width: 100% !important;
                    aspect-ratio: 1/1 !important;
                    padding: 40px 20px 20px !important;
                    background: #fbfbfd !important;
                }
                .pd-info-side {
                    padding: 24px !important;
                    padding-bottom: 120px !important;
                }
                .pd-close-btn {
                    position: fixed !important;
                    top: 15px !important;
                    right: 15px !important;
                    width: 44px !important;
                    height: 44px !important;
                    font-size: 1.5rem !important;
                    color: #333333 !important; /* Premium Grey/Black */
                    z-index: 20002 !important;
                    background: rgba(255, 255, 255, 0.9) !important;
                    backdrop-filter: blur(10px) !important;
                    box-shadow: 0 4px 16px rgba(0,0,0,0.15) !important;
                }
                .pd-actions {
                    position: fixed !important;
                    bottom: 0 !important;
                    left: 0 !important;
                    right: 0 !important;
                    background: #fff !important;
                    padding: 20px 24px !important;
                    padding-bottom: calc(20px + env(safe-area-inset-bottom)) !important;
                    display: grid !important;
                    grid-template-columns: 1fr !important;
                    gap: 12px !important;
                    border-top: 1px solid #eee !important;
                    box-shadow: 0 -10px 30px rgba(0,0,0,0.08) !important;
                    z-index: 20001 !important;
                }
            }

            /* Reuse base styles from style.css but allow overrides */
            .pd-layout { display: flex; gap: 40px; padding: 40px; }
            .pd-image-side { flex: 1; min-height: 400px; display: flex; align-items: center; justify-content: center; }
            .pd-info-side { flex: 1; display: flex; flex-direction: column; }
            .pd-brand { color: var(--accent); font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
            .pd-name { font-size: 2rem; font-weight: 700; margin-bottom: 8px; color: #1d1d1f; }
            .pd-sku { color: #86868b; font-size: 0.9rem; margin-bottom: 24px; }
            .pd-price-wrap { margin-bottom: 24px; }
            .pd-price-promo { font-size: 1.8rem; font-weight: 700; color: var(--accent); }
            .pd-price-original { text-decoration: line-through; color: #86868b; margin-left: 10px; font-size: 1.2rem; }
            .pd-sale-badge { background: #fee2e2; color: #ef4444; padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 600; margin-left: 10px; }
            .pd-desc { color: #424245; line-height: 1.6; margin-bottom: 30px; }
            .pd-qty-selector { display: flex; align-items: center; gap: 15px; margin-bottom: 30px; }
            .pd-qty-btn { width: 36px; height: 36px; border-radius: 50%; border: 1px solid #d2d2d7; background: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; transition: all 0.2s; }
            .pd-qty-btn:hover { background: #f5f5f7; border-color: #86868b; }
            .pd-actions { display: flex; gap: 15px; margin-top: auto; }
            .pd-main-img { width: 100%; height: 100%; object-fit: contain; }
            .pd-carousel { position: relative; width: 100%; height: 100%; }
            .pd-carousel-prev, .pd-carousel-next { position: absolute; top: 50%; transform: translateY(-50%); background: rgba(255,255,255,0.8); border: none; width: 40px; height: 40px; border-radius: 50%; cursor: pointer; z-index: 2; font-size: 1.2rem; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
            .pd-carousel-prev { left: 10px; }
            .pd-carousel-next { right: 10px; }
            .pd-carousel-dots { display: flex; justify-content: center; gap: 8px; margin-top: 15px; }
            .pd-dot { width: 8px; height: 8px; border-radius: 50%; background: #d2d2d7; cursor: pointer; }
            .pd-dot.active { background: var(--accent); width: 20px; border-radius: 10px; }
            .pd-selector-item { margin-bottom: 20px; }
            .pd-label { display: block; font-weight: 600; margin-bottom: 8px; font-size: 0.9rem; }
            .pd-options { display: flex; gap: 10px; flex-wrap: wrap; }
            .pd-option { padding: 8px 20px; border-radius: 20px; border: 1px solid #d2d2d7; background: #fff; cursor: pointer; transition: all 0.2s; font-size: 0.9rem; }
            .pd-option.selected { border-color: var(--accent); background: var(--accent); color: #fff; }
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
                            <span class="pd-price-original"></span>
                            <span class="pd-price-promo">฿0</span>
                            <span class="pd-sale-badge">ลดราคา</span>
                        </div>
                        <div class="pd-desc">Product description goes here...</div>
                        
                        <div class="pd-selector-item" style="display:none">
                            <span class="pd-label">ตัวเลือก</span>
                            <div class="pd-options"></div>
                        </div>

                        <div class="pd-qty-selector">
                            <span class="pd-label">จำนวน</span>
                            <div class="pd-qty-group" style="display:flex; align-items:center; gap:20px;">
                                <button class="pd-qty-btn" onclick="ProductDetail.updateQty(-1)">-</button>
                                <span class="pd-qty-val">1</span>
                                <button class="pd-qty-btn" onclick="ProductDetail.updateQty(1)">+</button>
                            </div>
                        </div>

                        <div class="pd-actions">
                            <button class="btn btn-ghost" onclick="ProductDetail.addToCart()" style="border:1.5px solid #1d1d1f; color:#1d1d1f">เพิ่มลงในตะกร้าสินค้า</button>
                            <button class="btn btn-primary" onclick="ProductDetail.buyNow()">ซื้อเลย</button>
                        </div>
                    </div>
                </div>
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
        
        if(brandEl) brandEl.textContent = product.brand || 'Paomobile';
        if(nameEl) nameEl.textContent = product.name;
        if(pricePromoEl) pricePromoEl.textContent = '฿' + (product.price ? product.price.toLocaleString() : '0');
        if(skuEl) skuEl.textContent = 'SKU: ' + (product.id || 'N/A');
        
        if (product.originalPrice && priceOrigEl && saleBadgeEl) {
            priceOrigEl.textContent = '฿' + product.originalPrice.toLocaleString();
            priceOrigEl.style.display = 'inline-block';
            saleBadgeEl.style.display = 'inline-block';
        } else if (priceOrigEl && saleBadgeEl) {
            priceOrigEl.style.display = 'none';
            saleBadgeEl.style.display = 'none';
        }
        
        if(descEl) descEl.innerHTML = product.description || '';
        if(qtyValEl) qtyValEl.textContent = this.qty;
        
        this.renderImages();

        // Handle variations
        const colorOptions = modal.querySelector('.pd-options');
        const colorContainer = colorOptions ? colorOptions.closest('.pd-selector-item') : null;
        if (product.colors && product.colors.length > 0 && colorOptions) {
            colorOptions.innerHTML = product.colors.map((c, i) => 
                `<button class="pd-option ${i===0?'selected':''}" onclick="window.ProductDetail.selectColor(this)">${c}</button>`
            ).join('');
            if(colorContainer) colorContainer.style.display = 'block';
        } else if(colorContainer) {
            colorContainer.style.display = 'none';
        }

        // Show Modal
        modal.classList.add('open');
        document.body.style.overflow = 'hidden'; // Prevent scroll
    },

    renderImages() {
        const modal = document.getElementById('productDetailModal');
        const imageSide = modal.querySelector('.pd-image-side');
        if(!imageSide) return;
        
        const p = this.currentProduct;
        if (p.images && p.images.length > 1) {
            imageSide.innerHTML = `
                <div class="pd-carousel">
                    <button class="pd-carousel-prev" onclick="event.stopPropagation(); window.ProductDetail.prevImage()">❮</button>
                    <img src="${p.images[this.currentImageIndex]}" alt="${p.name}" class="pd-main-img">
                    <button class="pd-carousel-next" onclick="event.stopPropagation(); window.ProductDetail.nextImage()">❯</button>
                    <div class="pd-carousel-dots">
                        ${p.images.map((img, idx) => `
                            <span class="pd-dot ${idx === this.currentImageIndex ? 'active' : ''}" onclick="event.stopPropagation(); window.ProductDetail.setImage(${idx})"></span>
                        `).join('')}
                    </div>
                </div>
            `;
        } else if (p.images && p.images.length === 1) {
            imageSide.innerHTML = `<img src="${p.images[0]}" alt="${p.name}" class="pd-main-img">`;
        } else if (p.img) {
            imageSide.innerHTML = `<img src="${p.img}" alt="${p.name}" class="pd-main-img">`;
        } else {
            imageSide.innerHTML = `<div style="font-size: 80px;">${p.emoji || '📦'}</div>`;
        }
    },

    prevImage() {
        if (!this.currentProduct || !this.currentProduct.images) return;
        this.currentImageIndex = (this.currentImageIndex - 1 + this.currentProduct.images.length) % this.currentProduct.images.length;
        this.renderImages();
    },

    nextImage() {
        if (!this.currentProduct || !this.currentProduct.images) return;
        this.currentImageIndex = (this.currentImageIndex + 1) % this.currentProduct.images.length;
        this.renderImages();
    },

    setImage(idx) {
        this.currentImageIndex = idx;
        this.renderImages();
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
        if(qtyValEl) qtyValEl.textContent = this.qty;
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
        const colorBtn = document.querySelector('.pd-option.selected');
        const color = colorBtn ? colorBtn.textContent : null;
        
        const productId = this.currentProduct.id + (color ? `-${color}` : '');
        const itemName = this.currentProduct.name + (color ? ` (${color})` : '');
        let cartImg = this.currentProduct.img || (this.currentProduct.images && this.currentProduct.images[0]);
        if (color && this.currentProduct.variantImages && this.currentProduct.variantImages[color]) {
            cartImg = this.currentProduct.variantImages[color];
        }

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
                price: this.currentProduct.price,
                img: cartImg,
                emoji: this.currentProduct.emoji,
                qty: this.qty
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

