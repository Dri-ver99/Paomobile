(function() {
    let currentProduct = null;
    let selectedQty = 1;
    let selectedColor = "";
    let modalSwiper = null;

    const ProductDetail = {
        init() {
            this.modal = document.getElementById('productDetailModal');
            if (!this.modal) return;

            this.overlay = this.modal;
            this.container = this.modal.querySelector('.product-modal-container');
            
            // Re-bind close event
            this.modal.addEventListener('click', (e) => {
                if (e.target === this.modal) this.close();
            });

            // Prevent clicks inside container from closing
            this.container.addEventListener('click', (e) => e.stopPropagation());
        },

        open(data) {
            currentProduct = data;
            selectedQty = 1;
            selectedColor = data.colors && data.colors.length > 0 ? data.colors[0] : "";

            this.render();
            this.modal.classList.add('open');
            document.body.style.overflow = 'hidden';

            // Initialize Swiper if needed
            this.initSwiper();
        },

        close() {
            this.modal.classList.remove('open');
            document.body.style.overflow = '';
            if (modalSwiper) {
                modalSwiper.destroy();
                modalSwiper = null;
            }
        },

        initSwiper() {
            if (modalSwiper) {
                modalSwiper.destroy();
                modalSwiper = null;
            }

            if (currentProduct && currentProduct.images && currentProduct.images.length > 0) {
                // Short delay to ensure DOM is ready
                setTimeout(() => {
                    modalSwiper = new Swiper('.modal-swiper', {
                        loop: true,
                        pagination: {
                            el: '.swiper-pagination',
                            clickable: true,
                        },
                        navigation: {
                            nextEl: '.swiper-button-next',
                            prevEl: '.swiper-button-prev',
                        },
                    });
                }, 100);
            }
        },

        updateQty(delta) {
            selectedQty = Math.max(1, selectedQty + delta);
            const qtyVal = this.modal.querySelector('.pd-qty-val');
            if (qtyVal) qtyVal.textContent = selectedQty;
        },

        selectColor(color) {
            selectedColor = color;
            this.modal.querySelectorAll('.pd-option').forEach(opt => {
                opt.classList.toggle('selected', opt.dataset.color === color);
            });

            // Auto-slide to the corresponding image if variantImages mapping exists
            if (modalSwiper && currentProduct.variantImages && currentProduct.variantImages[color]) {
                const imgPath = currentProduct.variantImages[color];
                const imgIndex = currentProduct.images.indexOf(imgPath);
                if (imgIndex >= 0) {
                    modalSwiper.slideToLoop(imgIndex);
                }
            }
        },

        addToCart() {
            if (!currentProduct) return;
            
            // Determine image for the cart: use variant-specific image if available
            let cartImg = currentProduct.img || (currentProduct.images && currentProduct.images.length > 0 ? currentProduct.images[0] : null);
            if (selectedColor && currentProduct.variantImages && currentProduct.variantImages[selectedColor]) {
                cartImg = currentProduct.variantImages[selectedColor];
            }

            const itemToAdd = {
                id: currentProduct.id + (selectedColor ? '-' + selectedColor.toLowerCase().replace(/[^a-z0-9]/g, '-') : ''),
                name: currentProduct.name + (selectedColor ? ' (' + selectedColor + ')' : ''),
                price: currentProduct.price,
                emoji: currentProduct.emoji || '📦',
                img: cartImg,
                qty: selectedQty
            };

            // Call CartAPI (assume it exists globally)
            if (window.CartAPI) {
                // Modified CartAPI.add to support quantity
                this.apiAddWithQty(itemToAdd);
                this.close();
                if (window.CartUI) CartUI.open();
            }
        },

        buyNow() {
            this.addToCart();
            // In a real app, this might redirect to checkout directly
        },

        // Helper since current CartAPI only adds 1 at a time
        apiAddWithQty(product) {
            const cart = CartAPI.getAll();
            const idx = cart.findIndex(i => i.id === product.id);
            if (idx >= 0) {
                cart[idx].qty += product.qty;
            } else {
                cart.push(product);
            }
            // Save using the internal method if possible, or just repeat the logic
            localStorage.setItem('pao_cart', JSON.stringify(cart));
            if (window.CartUI) {
                CartUI.update();
                CartUI.flash();
            }
        },

        render() {
            if (!currentProduct) return;

            const nameEl = this.modal.querySelector('.pd-name');
            const brandEl = this.modal.querySelector('.pd-brand');
            const skuEl = this.modal.querySelector('.pd-sku');
            const imgEl = this.modal.querySelector('.pd-image-side');
            const priceOrigEl = this.modal.querySelector('.pd-price-original');
            const pricePromoEl = this.modal.querySelector('.pd-price-promo');
            const descEl = this.modal.querySelector('.pd-desc');
            const colorGroup = this.modal.querySelector('.pd-options');
            const optionLabelEl = this.modal.querySelector('.pd-selector-item .pd-label');

            if (optionLabelEl) {
                optionLabelEl.textContent = currentProduct.optionLabel || 'สี';
            }

            if (nameEl) nameEl.textContent = currentProduct.name;
            if (brandEl) brandEl.textContent = currentProduct.brand || 'Paomobile';
            if (skuEl) skuEl.textContent = 'SKU: ' + (currentProduct.sku || 'N/A');
            
            if (imgEl) {
                if (currentProduct.images && currentProduct.images.length > 0) {
                    imgEl.innerHTML = `
                        <div class="swiper modal-swiper" style="width:100%; height:100%;">
                            <div class="swiper-wrapper">
                                ${currentProduct.images.map(img => `
                                    <div class="swiper-slide" style="display:flex; align-items:center; justify-content:center;">
                                        <img src="${img}" style="max-width:100%; max-height:100%; object-fit:contain;">
                                    </div>
                                `).join('')}
                            </div>
                            <div class="swiper-pagination"></div>
                            <div class="swiper-button-next"></div>
                            <div class="swiper-button-prev"></div>
                        </div>
                    `;
                } else if (currentProduct.img) {
                    imgEl.innerHTML = `<img src="${currentProduct.img}" style="max-width:100%; max-height:100%; object-fit:contain; border-radius:16px;">`;
                } else {
                    imgEl.textContent = currentProduct.emoji || '📦';
                }
            }
            
            if (pricePromoEl) {
                if (currentProduct.price === 0) {
                    pricePromoEl.textContent = 'สอบถามราคา';
                } else {
                    pricePromoEl.textContent = '฿' + currentProduct.price.toLocaleString();
                }
            }
            
            if (currentProduct.originalPrice) {
                if (priceOrigEl) {
                    priceOrigEl.style.display = 'block';
                    priceOrigEl.textContent = '฿' + currentProduct.originalPrice.toLocaleString();
                }
                const badge = this.modal.querySelector('.pd-sale-badge');
                if (badge) badge.style.display = 'inline-block';
            } else {
                if (priceOrigEl) priceOrigEl.style.display = 'none';
                const badge = this.modal.querySelector('.pd-sale-badge');
                if (badge) badge.style.display = 'none';
            }

            if (descEl) descEl.textContent = currentProduct.description || 'ไม่มีรายละเอียดสินค้า';

            // Render colors
            if (colorGroup) {
                if (currentProduct.colors && currentProduct.colors.length > 0) {
                    this.modal.querySelector('.pd-selector-item').style.display = 'block';
                    colorGroup.innerHTML = currentProduct.colors.map(c => `
                        <div class="pd-option ${c === selectedColor ? 'selected' : ''}" 
                             data-color="${c}" onclick="ProductDetail.selectColor('${c}')">
                            ${c}
                        </div>
                    `).join('');
                } else {
                    this.modal.querySelector('.pd-selector-item').style.display = 'none';
                }
            }

            // Reset quantity display
            const qtyVal = this.modal.querySelector('.pd-qty-val');
            if (qtyVal) qtyVal.textContent = selectedQty;
        }
    };

    window.ProductDetail = ProductDetail;

    document.addEventListener('DOMContentLoaded', () => {
        ProductDetail.init();
    });
})();
