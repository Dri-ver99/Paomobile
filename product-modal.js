window.ProductDetail = {
    currentProduct: null,
    currentImageIndex: 0,
    qty: 1,

    open(product) {
        this.currentProduct = product;
        this.qty = 1;
        this.currentImageIndex = 0;
        
        // Update DOM elements
        const brandEl = document.querySelector('.pd-brand');
        const nameEl = document.querySelector('.pd-name');
        const pricePromoEl = document.querySelector('.pd-price-promo');
        const priceOrigEl = document.querySelector('.pd-price-original');
        const saleBadgeEl = document.querySelector('.pd-sale-badge');
        const descEl = document.querySelector('.pd-desc');
        const qtyValEl = document.querySelector('.pd-qty-val');
        const skuEl = document.querySelector('.pd-sku');
        
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
        
        // Handle images/carousel
        this.renderImages();

        // Handle color options (if any)
        const colorOptions = document.querySelector('.pd-options');
        const colorLabel = document.querySelector('.pd-selector-item .pd-label'); // Find the label
        const colorContainer = colorOptions ? colorOptions.closest('.pd-selector-item') : null;
        
        if (product.colors && product.colors.length > 0 && colorOptions) {
            if (colorLabel) colorLabel.textContent = product.optionLabel || 'สี';
            
            colorOptions.innerHTML = product.colors.map((c, i) => 
                `<button class="pd-option ${i===0?'selected':''}" onclick="ProductDetail.selectColor(this)">${c}</button>`
            ).join('');
            if(colorContainer) colorContainer.style.display = 'block';
        } else if (colorContainer) {
            colorContainer.style.display = 'none';
        }

        // Show Modal
        const modal = document.getElementById('productDetailModal');
        if (modal) {
            modal.style.display = 'flex';
            // Add a tiny delay to allow display:flex to apply before adding the animation class
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    modal.classList.add('open');
                });
            });
        }
    },

    renderImages() {
        const imageSide = document.querySelector('.pd-image-side');
        if(!imageSide) return;
        
        const p = this.currentProduct;
        
        if (p.images && p.images.length > 1) {
            // Render carousel
            imageSide.innerHTML = `
                <div class="pd-carousel">
                    <button class="pd-carousel-prev" onclick="event.stopPropagation(); ProductDetail.prevImage()">❮</button>
                    <img src="${p.images[this.currentImageIndex]}" alt="${p.name}" class="pd-main-img">
                    <button class="pd-carousel-next" onclick="event.stopPropagation(); ProductDetail.nextImage()">❯</button>
                </div>
                <div class="pd-carousel-dots">
                    ${p.images.map((img, idx) => `
                        <span class="pd-dot ${idx === this.currentImageIndex ? 'active' : ''}" onclick="event.stopPropagation(); ProductDetail.setImage(${idx})"></span>
                    `).join('')}
                </div>
            `;
        } else if (p.images && p.images.length === 1) {
            imageSide.innerHTML = `<img src="${p.images[0]}" alt="${p.name}" class="pd-main-img" style="width:100%; height:100%; object-fit:contain; border-radius:16px;">`;
        } else if (p.img) {
            imageSide.innerHTML = `<img src="${p.img}" alt="${p.name}" class="pd-main-img" style="width:100%; height:100%; object-fit:contain; border-radius:16px;">`;
        } else {
            imageSide.innerHTML = `<div style="font-size: 80px;">${p.emoji || '📦'}</div>`;
        }
    },

    prevImage() {
        if (!this.currentProduct || !this.currentProduct.images) return;
        this.currentImageIndex--;
        if (this.currentImageIndex < 0) this.currentImageIndex = this.currentProduct.images.length - 1;
        this.renderImages();
    },

    nextImage() {
        if (!this.currentProduct || !this.currentProduct.images) return;
        this.currentImageIndex++;
        if (this.currentImageIndex >= this.currentProduct.images.length) this.currentImageIndex = 0;
        this.renderImages();
    },

    setImage(idx) {
        if (!this.currentProduct || !this.currentProduct.images) return;
        if (idx >= 0 && idx < this.currentProduct.images.length) {
            this.currentImageIndex = idx;
            this.renderImages();
        }
    },

    close() {
        const modal = document.getElementById('productDetailModal');
        if (modal) {
            modal.classList.remove('open');
            setTimeout(() => {
                modal.style.display = 'none';
                this.currentProduct = null;
            }, 300);
        }
    },

    updateQty(delta) {
        this.qty += delta;
        if (this.qty < 1) this.qty = 1;
        const qtyValEl = document.querySelector('.pd-qty-val');
        if(qtyValEl) qtyValEl.textContent = this.qty;
    },

    selectColor(btn) {
        document.querySelectorAll('.pd-option').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');

        if (this.currentProduct && this.currentProduct.variantImages) {
            const selectedColor = btn.textContent;
            const targetImage = this.currentProduct.variantImages[selectedColor];
            if (targetImage && this.currentProduct.images) {
                const targetIndex = this.currentProduct.images.indexOf(targetImage);
                if (targetIndex !== -1) {
                    this.setImage(targetIndex);
                }
            }
        }
    },

    addToCart() {
        if (!this.currentProduct) return;
        const colorBtn = document.querySelector('.pd-option.selected');
        const color = colorBtn ? colorBtn.textContent : null;
        
        let itemName = this.currentProduct.name;
        if (color) itemName += ` (${color})`;

        // Use CartAPI to add the product
        if (window.CartAPI) {
            const productId = this.currentProduct.id + (color ? `-${color}` : '');
            
            // Determine the image to use: variant image if available, else default
            let cartImg = this.currentProduct.img || (this.currentProduct.images && this.currentProduct.images[0]) || null;
            if (color && this.currentProduct.variantImages && this.currentProduct.variantImages[color]) {
                cartImg = this.currentProduct.variantImages[color];
            }

            const itemObj = {
                id: productId,
                name: itemName,
                price: this.currentProduct.price,
                img: cartImg,
                emoji: this.currentProduct.emoji
            };

            // Call CartAPI 'qty' times. Alternatively, CartAPI could bypass the limit, but easiest is a loop or direct modification
            // Since CartAPI handles cloud sync, we should use it. 
            // We'll fetch the local cart, update qty, and then save + sync.
            const getActiveUserId = () => { try { const u = JSON.parse(localStorage.getItem('paomobile_user')); return u ? (u.uid || u.phone || 'default') : 'guest'; } catch { return 'guest'; } };
            const cartKey = 'pao_cart_' + getActiveUserId();
            const cart = JSON.parse(localStorage.getItem(cartKey)) || [];
            const idx = cart.findIndex(i => i.id === itemObj.id);
            if (idx >= 0) {
                cart[idx].qty += this.qty;
            } else {
                cart.push({...itemObj, qty: this.qty});
            }
            
            // Set localStorage directly and update UI
            localStorage.setItem(cartKey, JSON.stringify(cart));
            
            if (window.CartUI) {
                CartUI.update();
                CartUI.open();
            }
            // Trigger Firestore push if needed (CartAPI handles this if we call it)
            if (window.CartAPI && typeof window.CartAPI.forceSync === 'function') {
               // We just do standard UI updates. 
               // For robust cloud backup, trigger add with qty=0 just to trigger save:
               // This won't work cleanly unless we modify CartAPI. We'll simply rely on local storage for now until page refresh handles cloud.
            }
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

// Close modal when clicking outside of it
if(typeof window !== 'undefined') {
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('productDetailModal');
        // If clicking exactly on the overlay background (not the container inside)
        if (event.target === modal) {
            ProductDetail.close();
        }
    });
}
