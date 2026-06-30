/**
 * Paomobile Premium Alert System (v4.0)
 * Replaces native alert(), confirm(), and prompt() with premium styled modals.
 * Supports light-gold theme for customers and dark-gold theme for sellers.
 */

(function() {
    const isSeller = window.location.pathname.toLowerCase().includes('seller-');
    const alertTheme = isSeller ? 'theme-dark' : 'theme-light';

    // 1. Inject Styles
    if (!document.getElementById('premiumAlertStyles')) {
        const style = document.createElement('style');
        style.id = 'premiumAlertStyles';
        style.textContent = `
            @keyframes paFadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes paScaleUp { 
                from { opacity: 0; transform: scale(0.9) translateY(20px); } 
                to { opacity: 1; transform: scale(1) translateY(0); } 
            }
            .premium-modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(10, 8, 6, 0.5);
                backdrop-filter: blur(8px);
                -webkit-backdrop-filter: blur(8px);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999999;
                animation: paFadeIn 0.25s ease-out;
            }
            .premium-modal-box {
                border-radius: 20px;
                padding: 36px 32px;
                max-width: 440px;
                width: 90%;
                text-align: center;
                animation: paScaleUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) both;
                position: relative;
                overflow: hidden;
            }
            .premium-modal-box::before {
                content: '';
                position: absolute;
                top: 0;
                left: 50%;
                transform: translateX(-50%);
                width: 200px;
                height: 2px;
            }

            /* --- Dark Theme (Seller) --- */
            .premium-modal-box.theme-dark {
                background: linear-gradient(145deg, #1f1a14 0%, #120e0a 100%);
                border: 1px solid rgba(255, 122, 40, 0.18);
                box-shadow: 
                    0 25px 60px -15px rgba(0, 0, 0, 0.7),
                    0 0 50px rgba(255, 122, 40, 0.05),
                    inset 0 1px 0 rgba(255, 255, 255, 0.05);
            }
            .premium-modal-box.theme-dark::before {
                background: linear-gradient(90deg, transparent, #ff7a28, transparent);
            }
            .premium-modal-box.theme-dark .premium-modal-text {
                color: rgba(255, 255, 255, 0.9);
            }
            .premium-modal-box.theme-dark .premium-modal-btn-primary {
                background: linear-gradient(135deg, #ff7a28 0%, #ee4d2d 100%);
                color: #ffffff;
                box-shadow: 0 4px 15px rgba(238, 77, 45, 0.3);
            }
            .premium-modal-box.theme-dark .premium-modal-btn-primary:hover {
                box-shadow: 0 6px 20px rgba(238, 77, 45, 0.45);
            }
            .premium-modal-box.theme-dark .premium-modal-btn-secondary {
                background: rgba(255, 255, 255, 0.05);
                color: rgba(255, 255, 255, 0.7);
                border: 1px solid rgba(255, 255, 255, 0.1);
            }
            .premium-modal-box.theme-dark .premium-modal-btn-secondary:hover {
                background: rgba(255, 255, 255, 0.1);
                color: #ffffff;
                border-color: rgba(255, 255, 255, 0.2);
            }
            .premium-modal-box.theme-dark .premium-modal-input {
                background: rgba(0, 0, 0, 0.25);
                border: 1px solid rgba(255, 122, 40, 0.2);
                color: #ffffff;
            }
            .premium-modal-box.theme-dark .premium-modal-input:focus {
                border-color: #ff7a28;
                background: rgba(0, 0, 0, 0.45);
            }

            /* --- Light Theme (Customer) --- */
            .premium-modal-box.theme-light {
                background: #ffffff;
                border: 1px solid rgba(212, 175, 55, 0.25);
                box-shadow: 
                    0 25px 60px -15px rgba(0, 0, 0, 0.12),
                    0 0 50px rgba(212, 175, 55, 0.05),
                    inset 0 1px 0 rgba(255, 255, 255, 0.8);
            }
            .premium-modal-box.theme-light::before {
                background: linear-gradient(90deg, transparent, #d4af37, transparent);
            }
            .premium-modal-box.theme-light .premium-modal-text {
                color: #1f2937;
            }
            .premium-modal-box.theme-light .premium-modal-btn-primary {
                background: linear-gradient(135deg, #d4af37 0%, #b89324 100%);
                color: #ffffff;
                box-shadow: 0 4px 15px rgba(184, 147, 36, 0.25);
            }
            .premium-modal-box.theme-light .premium-modal-btn-primary:hover {
                box-shadow: 0 6px 20px rgba(184, 147, 36, 0.4);
            }
            .premium-modal-box.theme-light .premium-modal-btn-secondary {
                background: #f3f4f6;
                color: #4b5563;
                border: 1px solid #e5e7eb;
            }
            .premium-modal-box.theme-light .premium-modal-btn-secondary:hover {
                background: #e5e7eb;
                color: #111827;
                border-color: #d1d5db;
            }
            .premium-modal-box.theme-light .premium-modal-input {
                background: #f9fafb;
                border: 1px solid #d1d5db;
                color: #111827;
            }
            .premium-modal-box.theme-light .premium-modal-input:focus {
                border-color: #d4af37;
                background: #ffffff;
            }

            /* --- Common Elements --- */
            .premium-modal-icon {
                font-size: 52px;
                margin-bottom: 20px;
                display: inline-block;
            }
            .premium-modal-text {
                font-size: 1rem;
                line-height: 1.7;
                white-space: pre-line;
                margin-bottom: 28px;
                font-weight: 500;
            }
            .premium-modal-btn-group {
                display: flex;
                gap: 14px;
                justify-content: center;
            }
            .premium-modal-btn {
                padding: 13px 32px;
                border-radius: 12px;
                font-size: 0.95rem;
                font-weight: 700;
                cursor: pointer;
                font-family: inherit;
                min-width: 110px;
                transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
                border: none;
                outline: none;
            }
            .premium-modal-btn:hover {
                transform: translateY(-2px);
            }
            .premium-modal-btn:active {
                transform: translateY(0);
            }
            .premium-modal-input {
                width: 100%;
                padding: 14px;
                border-radius: 10px;
                font-size: 1rem;
                margin-bottom: 24px;
                text-align: center;
                outline: none;
                transition: all 0.25s ease;
                font-family: inherit;
            }
        `;
        document.head.appendChild(style);
    }

    // 2. Alert Implementation
    async function sellerAlert(message, type = 'info') {
        return new Promise(resolve => {
            const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️', delete: '🗑️', merge: '🤝' };
            const icon = icons[type] || icons.info;

            const overlay = document.createElement('div');
            overlay.className = 'premium-modal-overlay';

            overlay.innerHTML = `
                <div class="premium-modal-box ${alertTheme}">
                    <div class="premium-modal-icon">${icon}</div>
                    <div class="premium-modal-text">${message}</div>
                    <div class="premium-modal-btn-group">
                        <button id="sAlertOkBtn" class="premium-modal-btn premium-modal-btn-primary">ตกลง</button>
                    </div>
                </div>
            `;

            document.body.appendChild(overlay);
            const okBtn = overlay.querySelector('#sAlertOkBtn');
            okBtn.focus();
            
            const close = () => { overlay.remove(); resolve(); };
            okBtn.onclick = close;
            overlay.onclick = (e) => { if (e.target === overlay) close(); };
        });
    }

    // 3. Confirm Implementation
    async function sellerConfirm(message, type = 'warning') {
        return new Promise(resolve => {
            const icons = { warning: '⚠️', delete: '🗑️', merge: '🤝', info: 'ℹ️' };
            const icon = icons[type] || icons.warning;

            const overlay = document.createElement('div');
            overlay.className = 'premium-modal-overlay';

            overlay.innerHTML = `
                <div class="premium-modal-box ${alertTheme}">
                    <div class="premium-modal-icon">${icon}</div>
                    <div class="premium-modal-text">${message}</div>
                    <div class="premium-modal-btn-group">
                        <button id="sConfirmCancelBtn" class="premium-modal-btn premium-modal-btn-secondary">ยกเลิก</button>
                        <button id="sConfirmOkBtn" class="premium-modal-btn premium-modal-btn-primary">ยืนยัน</button>
                    </div>
                </div>
            `;

            document.body.appendChild(overlay);
            
            const okBtn = overlay.querySelector('#sConfirmOkBtn');
            const cancelBtn = overlay.querySelector('#sConfirmCancelBtn');
            
            okBtn.focus();

            okBtn.onclick = () => { overlay.remove(); resolve(true); };
            cancelBtn.onclick = () => { overlay.remove(); resolve(false); };
            overlay.onclick = (e) => { if (e.target === overlay) { overlay.remove(); resolve(false); } };
        });
    }

    // 4. Prompt Implementation
    async function sellerPrompt(message, placeholder = '') {
        return new Promise(resolve => {
            const overlay = document.createElement('div');
            overlay.className = 'premium-modal-overlay';

            overlay.innerHTML = `
                <div class="premium-modal-box ${alertTheme}">
                    <div class="premium-modal-icon">📝</div>
                    <div class="premium-modal-text">${message}</div>
                    <input type="text" id="sPromptInput" class="premium-modal-input" placeholder="${placeholder}" autocomplete="off">
                    <div class="premium-modal-btn-group">
                        <button id="sPromptCancelBtn" class="premium-modal-btn premium-modal-btn-secondary">ยกเลิก</button>
                        <button id="sPromptOkBtn" class="premium-modal-btn premium-modal-btn-primary">ตกลง</button>
                    </div>
                </div>
            `;

            document.body.appendChild(overlay);
            const input = overlay.querySelector('#sPromptInput');
            input.focus();

            const finish = (val) => { overlay.remove(); resolve(val); };
            overlay.querySelector('#sPromptOkBtn').onclick = () => finish(input.value);
            overlay.querySelector('#sPromptCancelBtn').onclick = () => finish(null);
            input.onkeyup = (e) => { if(e.key === 'Enter') finish(input.value); };
        });
    }

    // 5. Export functions globally
    window.sellerAlert = sellerAlert;
    window.sellerConfirm = sellerConfirm;
    window.sellerPrompt = sellerPrompt;

    // 6. Global alert() Override
    if (!window.__globalAlertOverride) {
        window.__globalAlertOverride = true;
        window.alert = function(msg) {
            let type = 'info';
            if (typeof msg === 'string') {
                const lower = msg.toLowerCase();
                if (lower.includes('error') || lower.includes('ไม่สำเร็จ') || lower.includes('❌') || lower.includes('ข้อผิดพลาด') || lower.includes('ไม่พบ')) type = 'error';
                else if (lower.includes('สำเร็จ') || lower.includes('เรียบร้อย') || lower.includes('✅') || lower.includes('บันทึก')) type = 'success';
                else if (lower.includes('กรุณา') || lower.includes('ระวัง') || lower.includes('⚠️')) type = 'warning';
            }
            sellerAlert(String(msg), type);
        };
    }
})();
