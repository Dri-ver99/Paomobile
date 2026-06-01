/**
 * Paomobile Premium Alert System
 * Replaces native alert(), confirm(), and prompt() with premium styled modals.
 */

(function() {
    // 1. Create Modal Functions
    async function sellerAlert(message, type = 'info') {
        return new Promise(resolve => {
            const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️', delete: '🗑️', merge: '🤝' };
            const colors = { success: '#52c41a', error: '#ff4d4f', warning: '#faad14', info: '#1890ff', delete: '#ff4d4f', merge: '#764ba2' };
            const icon = icons[type] || icons.info;
            const color = colors[type] || colors.info;

            const overlay = document.createElement('div');
            overlay.className = 'premium-modal-overlay';
            overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:999999;backdrop-filter:blur(4px);animation:sModalFadeIn 0.2s ease;';

            overlay.innerHTML = `
                <div style="background:#fff;border-radius:16px;padding:32px;max-width:420px;width:90%;box-shadow:0 20px 60px rgba(0,0,0,0.3);text-align:center;animation:sModalSlideIn 0.3s ease;">
                    <div style="font-size:48px;margin-bottom:16px;">${icon}</div>
                    <div style="font-size:0.95rem;color:#333;line-height:1.7;white-space:pre-line;margin-bottom:24px;">${message}</div>
                    <button id="sAlertOkBtn" style="background:${color};color:#fff;border:none;padding:12px 40px;border-radius:10px;font-size:0.95rem;font-weight:600;cursor:pointer;font-family:inherit;min-width:120px;transition:all 0.2s;">ตกลง</button>
                </div>
            `;

            if (!document.getElementById('premiumModalStyles')) {
                const style = document.createElement('style');
                style.id = 'premiumModalStyles';
                style.textContent = `
                    @keyframes sModalFadeIn { from { opacity: 0; } to { opacity: 1; } }
                    @keyframes sModalSlideIn { from { opacity: 0; transform: scale(0.9) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }
                    #sAlertOkBtn:hover, #sConfirmOkBtn:hover, #sPromptOkBtn:hover { filter: brightness(1.1); transform: scale(1.02); }
                    #sConfirmCancelBtn:hover, #sPromptCancelBtn:hover { background: #f5f5f5 !important; }
                `;
                document.head.appendChild(style);
            }

            document.body.appendChild(overlay);
            const okBtn = overlay.querySelector('#sAlertOkBtn');
            okBtn.focus();
            okBtn.onclick = () => { overlay.remove(); resolve(); };
            overlay.onclick = (e) => { if (e.target === overlay) { overlay.remove(); resolve(); } };
        });
    }

    async function sellerConfirm(message, type = 'warning') {
        return new Promise(resolve => {
            const icons = { warning: '⚠️', delete: '🗑️', merge: '🤝', info: 'ℹ️' };
            const colors = { warning: '#faad14', delete: '#ff4d4f', merge: '#764ba2', info: '#1890ff' };
            const icon = icons[type] || icons.warning;
            const color = colors[type] || colors.warning;

            const overlay = document.createElement('div');
            overlay.className = 'premium-modal-overlay';
            overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:999999;backdrop-filter:blur(4px);animation:sModalFadeIn 0.2s ease;';

            overlay.innerHTML = `
                <div style="background:#fff;border-radius:16px;padding:32px;max-width:440px;width:90%;box-shadow:0 20px 60px rgba(0,0,0,0.3);text-align:center;animation:sModalSlideIn 0.3s ease;">
                    <div style="font-size:48px;margin-bottom:16px;">${icon}</div>
                    <div style="font-size:0.95rem;color:#333;line-height:1.7;white-space:pre-line;margin-bottom:28px;">${message}</div>
                    <div style="display:flex;gap:12px;justify-content:center;">
                        <button id="sConfirmCancelBtn" style="background:#fff;color:#666;border:1px solid #ddd;padding:12px 32px;border-radius:10px;font-size:0.95rem;font-weight:600;cursor:pointer;font-family:inherit;min-width:100px;transition:all 0.2s;">ยกเลิก</button>
                        <button id="sConfirmOkBtn" style="background:${color};color:#fff;border:none;padding:12px 32px;border-radius:10px;font-size:0.95rem;font-weight:600;cursor:pointer;font-family:inherit;min-width:100px;transition:all 0.2s;">ยืนยัน</button>
                    </div>
                </div>
            `;

            document.body.appendChild(overlay);
            overlay.querySelector('#sConfirmOkBtn').onclick = () => { overlay.remove(); resolve(true); };
            overlay.querySelector('#sConfirmCancelBtn').onclick = () => { overlay.remove(); resolve(false); };
            overlay.onclick = (e) => { if (e.target === overlay) { overlay.remove(); resolve(false); } };
        });
    }

    async function sellerPrompt(message, placeholder = '') {
        return new Promise(resolve => {
            const overlay = document.createElement('div');
            overlay.className = 'premium-modal-overlay';
            overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:999999;backdrop-filter:blur(4px);animation:sModalFadeIn 0.2s ease;';

            overlay.innerHTML = `
                <div style="background:#fff;border-radius:16px;padding:32px;max-width:440px;width:90%;box-shadow:0 20px 60px rgba(0,0,0,0.3);text-align:center;animation:sModalSlideIn 0.3s ease;">
                    <div style="font-size:40px;margin-bottom:16px;">📝</div>
                    <div style="font-size:0.95rem;color:#333;line-height:1.7;white-space:pre-line;margin-bottom:20px;">${message}</div>
                    <input type="text" id="sPromptInput" placeholder="${placeholder}" style="width:100%;padding:12px;border:1px solid #ddd;border-radius:8px;font-size:1rem;margin-bottom:24px;text-align:center;outline:none;font-family:inherit;" autocomplete="off">
                    <div style="display:flex;gap:12px;justify-content:center;">
                        <button id="sPromptCancelBtn" style="background:#fff;color:#666;border:1px solid #ddd;padding:12px 32px;border-radius:10px;font-size:0.95rem;font-weight:600;cursor:pointer;font-family:inherit;min-width:100px;transition:all 0.2s;">ยกเลิก</button>
                        <button id="sPromptOkBtn" style="background:#1890ff;color:#fff;border:none;padding:12px 32px;border-radius:10px;font-size:0.95rem;font-weight:600;cursor:pointer;font-family:inherit;min-width:100px;transition:all 0.2s;">ตกลง</button>
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

    // 2. Export to Window
    window.sellerAlert = sellerAlert;
    window.sellerConfirm = sellerConfirm;
    window.sellerPrompt = sellerPrompt;

})();
