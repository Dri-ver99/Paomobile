/* โ”€โ”€ Premium Alert Override (auto-injected) โ”€โ”€ */
(function() {
    if (window.__alertOverrideInjected) return;
    window.__alertOverrideInjected = true;
    var _nativeAlert = window.alert;
    window.alert = function(msg) {
        if (window.sellerAlert) {
            // Detect type from message content
            var type = 'info';
            if (msg && (msg.includes('Error') || msg.includes('error') || msg.includes('เนเธกเนเธชเธณเน€เธฃเนเธ') || msg.includes('โ') || msg.includes('โ ๏ธ') || msg.includes('เธฅเธ') || msg.includes('เธเนเธญเธเธดเธ”เธเธฅเธฒเธ”'))) type = 'error';
            else if (msg && (msg.includes('โ…') || msg.includes('เธชเธณเน€เธฃเนเธ') || msg.includes('เน€เธฃเธตเธขเธเธฃเนเธญเธข') || msg.includes('เธเธฑเธเธ—เธถเธ'))) type = 'success';
            else if (msg && (msg.includes('โ ๏ธ') || msg.includes('เธเธฃเธธเธ“เธฒ') || msg.includes('เธฃเธฐเธงเธฑเธ'))) type = 'warning';
            window.sellerAlert(String(msg), type);
        } else {
            _nativeAlert(msg);
        }
    };
})();
/* โ”€โ”€ End Premium Alert Override โ”€โ”€ */
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
navbar.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

// --- Global Performance & Image Optimizer (v1.1) ---
(function() {
    // 0. Enable Firestore Persistence (Compat SDK) for all pages
    if (typeof firebase !== 'undefined' && firebase.firestore) {
        try {
            firebase.firestore().enablePersistence({ synchronizeTabs: true }).catch(err => {
                if (err.code == 'failed-precondition') {
                    console.warn("[Persistence] Multiple tabs active.");
                } else if (err.code == 'unimplemented') {
                    console.warn("[Persistence] Browser not supported.");
                }
            });
        } catch (e) { /* Already enabled or script loading order issue */ }
    }

    const optimizeImages = () => {
        document.querySelectorAll('img:not([loading])').forEach(img => {
            img.setAttribute('loading', 'lazy');
            img.setAttribute('decoding', 'async');
        });
    };
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', optimizeImages);
    } else {
        optimizeImages();
    }
    // Observe dynamic changes (lazy load newly added items)
    const observer = new MutationObserver(mutations => {
        mutations.forEach(m => m.addedNodes.forEach(node => {
            if (node.nodeType === 1) {
                if (node.tagName === 'IMG' && !node.hasAttribute('loading')) {
                    node.setAttribute('loading', 'lazy');
                    node.setAttribute('decoding', 'async');
                }
                node.querySelectorAll('img:not([loading])').forEach(img => {
                    img.setAttribute('loading', 'lazy');
                    img.setAttribute('decoding', 'async');
                });
            }
        }));
    });
    observer.observe(document.body, { childList: true, subtree: true });
})();
const menuToggle = document.getElementById('menuToggle');
const mobileMenu = document.getElementById('mobileMenu');
const mobileMenuPanels = document.getElementById('mobileMenuPanels');
const mobileClose = document.getElementById('mobileClose');
const mobileBackBtn = document.getElementById('mobileBackBtn');
const subMenuTitle = document.getElementById('subMenuTitle');
const subMenuContent = document.getElementById('subMenuContent');
function openMenu() {
  if (typeof CartUI !== 'undefined') CartUI.close();
  mobileMenu.classList.add('active');
  if (menuToggle) menuToggle.classList.add('active');
  document.body.classList.add('menu-open');
  document.body.style.overflow = 'hidden';
}
function closeMenu() {
mobileMenu.classList.remove('active');
if (menuToggle) menuToggle.classList.remove('active');
document.body.classList.remove('menu-open');
document.body.style.overflow = '';
setTimeout(() => {
mobileMenuPanels.classList.remove('showing-sub');
}, 400);
}
if (menuToggle) {
menuToggle.addEventListener('click', () => {
if (mobileMenu.classList.contains('active')) {
closeMenu();
} else {
openMenu();
}
});
}
if (mobileClose) mobileClose.addEventListener('click', closeMenu);
if (mobileBackBtn) {
    const handleBack = (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        mobileMenuPanels.classList.remove('showing-sub');
    };
    mobileBackBtn.addEventListener('click', handleBack);
    mobileBackBtn.addEventListener('touchstart', handleBack, { passive: false });
}

// Delegate mobile back button clicks for maximum robustness
mobileMenu.addEventListener('click', (e) => {
    // 1. Handle Back Button
    if (e.target.closest('#mobileBackBtn')) {
        mobileMenuPanels.classList.remove('showing-sub');
        return;
    }

    // 2. Handle Sub-menu triggers
    const parent = e.target.closest('.menu-item-parent');
    if (parent) {
        const wrapper = parent.closest('.menu-item-wrapper');
        const subMenuTemplate = wrapper.querySelector('.mobile-sub-menu');
        if (subMenuTemplate && subMenuContent) {
            subMenuTitle.textContent = parent.textContent.trim();
            subMenuContent.innerHTML = subMenuTemplate.innerHTML;
            mobileMenuPanels.classList.add('showing-sub');
            subMenuContent.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', closeMenu);
            });
        }
    }
});
const animatedElements = document.querySelectorAll('[data-animate]');
const animObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const delay = parseInt(entry.target.dataset.delay) || 0;
            // Immediate class for better performance, delay only if specified
            if (delay === 0) {
                entry.target.classList.add('visible');
            } else {
                setTimeout(() => {
                    entry.target.classList.add('visible');
                }, delay);
            }
            animObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.05, rootMargin: '100px' }); // Increased rootMargin for pre-emptive loading
animatedElements.forEach(el => animObserver.observe(el));

// Force visible for anything in initial viewport with a quicker check
const forceInitialVisible = () => {
    animatedElements.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight + 100) {
            el.classList.add('visible');
        }
    });
};
if (document.readyState === 'complete') forceInitialVisible();
else window.addEventListener('load', forceInitialVisible);
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');
window.addEventListener('scroll', () => {
const scrollY = window.scrollY + 150;
sections.forEach(section => {
const top = section.offsetTop;
const height = section.offsetHeight;
const id = section.getAttribute('id');
if (scrollY >= top && scrollY < top + height) {
navLinks.forEach(link => {
link.classList.remove('active');
if (link.getAttribute('href') === '#' + id) {
link.classList.add('active');
}
});
}
});
}, { passive: true });
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
anchor.addEventListener('click', (e) => {
e.preventDefault();
const target = document.querySelector(anchor.getAttribute('href'));
if (target) {
const offset = 80;
const top = target.getBoundingClientRect().top + window.pageYOffset - offset;
window.scrollTo({ top, behavior: 'smooth' });
if (typeof closeMenu === 'function') closeMenu();
}
});
});
function animateCounter(el) {
const target = parseInt(el.dataset.count, 10);
const suffix = el.dataset.suffix || '';
const duration = 1800;
const startTime = performance.now();
function easeOutQuart(t) {
return 1 - Math.pow(1 - t, 4);
}
function step(currentTime) {
const elapsed = currentTime - startTime;
const progress = Math.min(elapsed / duration, 1);
const eased = easeOutQuart(progress);
const current = Math.floor(eased * target);
el.textContent = current.toLocaleString() + suffix;
if (progress < 1) {
requestAnimationFrame(step);
} else {
el.textContent = target.toLocaleString() + suffix;
}
}
requestAnimationFrame(step);
}
const counters = document.querySelectorAll('[data-count]');
const counterObserver = new IntersectionObserver((entries) => {
entries.forEach(entry => {
if (entry.isIntersecting) {
animateCounter(entry.target);
counterObserver.unobserve(entry.target);
}
});
}, { threshold: 0.5 });
counters.forEach(el => counterObserver.observe(el));
const heroVisual = document.querySelector('.hero-visual');
if (heroVisual && window.innerWidth > 768) {
window.addEventListener('scroll', () => {
const scroll = window.scrollY;
if (scroll < window.innerHeight) {
heroVisual.style.transform = `translateY(${scroll * 0.08}px)`;
}
}, { passive: true });
}
document.querySelectorAll('.service-card .btn-outline').forEach(btn => {
btn.addEventListener('mouseenter', () => {
btn.style.background = 'var(--gold-50)';
});
btn.addEventListener('mouseleave', () => {
btn.style.background = '';
});
});
document.addEventListener("DOMContentLoaded", function() {
const mapElement = document.getElementById('branch-map');
const branchItems = document.querySelectorAll('.branch-item');
if (mapElement && typeof L !== 'undefined') {
const map = L.map('branch-map', { 
scrollWheelZoom: true,
zoomControl: false,
attributionControl: false
}).setView([13.1, 100.95], 10);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
maxZoom: 19
}).addTo(map);
const customIcon = L.icon({
iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
iconSize: [25, 41],
iconAnchor: [12, 41],
popupAnchor: [1, -34],
shadowSize: [41, 41]
});
const markers = [];
branchItems.forEach((item, index) => {
const lat = parseFloat(item.dataset.lat);
const lng = parseFloat(item.dataset.lng);
const zoom = parseInt(item.dataset.zoom) || 16;
const detailsText = item.querySelector('.branch-item-details').innerHTML;
const mapLink = item.querySelector('h3 a')?.href;
const marker = L.marker([lat, lng], {icon: customIcon}).addTo(map)
.bindPopup(`<div class="map-popup">${detailsText}</div>`);
markers.push(marker);
marker.on('click', () => {
if (mapLink) {
window.open(mapLink, '_blank');
}
});
item.addEventListener('click', () => {
branchItems.forEach(b => b.classList.remove('active'));
item.classList.add('active');
map.flyTo([lat, lng], zoom);
setTimeout(() => marker.openPopup(), 400);
});
});
const urlParams = new URLSearchParams(window.location.search);
let initialBranch = 0;
if (urlParams.has('branch')) {
initialBranch = parseInt(urlParams.get('branch'));
if (isNaN(initialBranch) || initialBranch < 0 || initialBranch >= branchItems.length) {
initialBranch = 0;
}
}
if (markers.length > 0) {
const group = new L.featureGroup(markers);
map.fitBounds(group.getBounds().pad(0.1));
if (initialBranch !== 0 && branchItems[initialBranch]) {
setTimeout(() => {
branchItems[initialBranch].click();
}, 500); 
} else {
branchItems[0].classList.add('active');
}
}
document.querySelectorAll('a[href="#branches"], a[href="index.html#branches"]').forEach(link => {
link.addEventListener('click', () => {
if(markers.length > 0 && mapElement.offsetParent !== null) {
setTimeout(() => {
branchItems[0].click();
}, 600);
}
});
});
}
document.querySelectorAll('.nav-branch-link').forEach(link => {
link.addEventListener('click', (e) => {
const isIndex = window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/');
if (isIndex && document.getElementById('branch-map')) {
e.preventDefault();
const branchIndex = parseInt(link.getAttribute('data-branch'));
const target = document.querySelector('#branches');
if (target) {
const offset = 80;
const top = target.getBoundingClientRect().top + window.pageYOffset - offset;
window.scrollTo({ top, behavior: 'smooth' });
}
const branchItems = document.querySelectorAll('.branch-item');
if (branchItems[branchIndex]) {
branchItems[branchIndex].click();
}
if (typeof closeMenu === 'function') {
closeMenu();
}
}
});
});
});
document.addEventListener('DOMContentLoaded', () => {
const branchHoursElements = document.querySelectorAll('.branch-hours');
function updateBranchStatus() {
const now = new Date();
const thailandTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));
const currentHour = thailandTime.getHours();
const currentMin = thailandTime.getMinutes();
const currentTotalMin = currentHour * 60 + currentMin;
branchHoursElements.forEach(el => {
const openTime = el.getAttribute('data-open');
const closeTime = el.getAttribute('data-close');
const badge = el.querySelector('.status-badge');
if (openTime && closeTime && badge) {
const [openH, openM] = openTime.split(':').map(Number);
const [closeH, closeM] = closeTime.split(':').map(Number);
const openTotalMin = openH * 60 + openM;
const closeTotalMin = closeH * 60 + closeM;
if (currentTotalMin >= openTotalMin && currentTotalMin < closeTotalMin) {
const minutesUntilClose = closeTotalMin - currentTotalMin;
if (minutesUntilClose <= 60) {
badge.className = 'status-badge closing-soon';
badge.textContent = '⚫ ใกล้ปิดให้บริการ';
} else {
badge.className = 'status-badge open';
badge.textContent = '⚫ เปิดให้บริการ';
}
} else {
badge.className = 'status-badge closed';
badge.textContent = '⚫ ปิดให้บริการ';
}
}
});
}
    updateBranchStatus();
    setInterval(updateBranchStatus, 60000);
});

// v1.9.0 - Global Real-time Chat System with Online Status (Fixed Position)
(function initFloatingChat() {
    const isSellerPage = window.location.pathname.includes('seller-');
    if (isSellerPage) return;

    let chatUnsubscribe = null;
    let statusUnsubscribe = null;
    let pendingChatFile = null;
    let pendingChatType = null;
    let presenceInterval = null;

    const PAGE_MAP = {
        'index.html': 'หน้าหลัก',
        'parts.html': 'เลือกซื้ออะไหล่',
        'accessory.html': 'อุปกรณ์เสริม',
        'new-products.html': 'มือถือมือหนึ่ง',
        'used-products.html': 'มือถือมือสอง',
        'member.html': 'หน้าสมาชิก',
        'purchases.html': 'รายการซื้อ',
        'cart.html': 'ตะกร้าสินค้า',
        'checkout.html': 'หน้าชำระเงิน',
        'promotions.html': 'โปรโมชั่น'
    };

    function getCurrentPageName() {
        const path = window.location.pathname.split('/').pop() || 'index.html';
        return PAGE_MAP[path] || path;
    }

    // --- Build UI ---
    const chatContainer = document.createElement('div');
    // Inject Styles Directly
    const style = document.createElement('style');
    style.innerHTML = `
        @keyframes chatFadeIn { from { opacity: 0; transform: translateY(20px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .chat-window.active { animation: chatFadeIn 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28) forwards; }
        .msg-row { display: flex; flex-direction: column; width: 100%; margin: 8px 0; }
        .msg-row.customer { align-items: flex-end; }
        .msg-row.seller { align-items: flex-start; }
        .msg-bubble { box-shadow: 0 2px 5px rgba(0,0,0,0.05); max-width: 85%; }
        .msg-row.customer .msg-bubble { background: #ffffff !important; color: #000 !important; border: 1px solid #eef2f6 !important; border-radius: 18px 18px 4px 18px !important; }
        .msg-row.seller .msg-bubble { background: #fff5f0 !important; color: #000 !important; border: 1px solid #ffe4d1 !important; border-radius: 18px 18px 18px 4px !important; }
        
        /* Force Sticker Transparency */
        .msg-row.sticker .msg-bubble { background: transparent !important; border: none !important; box-shadow: none !important; padding: 0 !important; overflow: visible !important; }
        .emoji-picker { 
            display:none; 
            position:absolute; 
            bottom:70px; 
            left:5px; 
            width:240px; 
            background: rgba(255, 255, 255, 0.95); 
            backdrop-filter: blur(10px);
            border-radius:20px; 
            box-shadow:0 10px 40px rgba(0,0,0,0.15); 
            border:1px solid rgba(226, 232, 240, 0.8); 
            padding:15px; 
            z-index:200; 
            grid-template-columns: repeat(4, 1fr); 
            gap:10px; 
        }
        .emoji-picker.active { display:grid; animation: chatFadeIn 0.2s ease-out; }
        .emoji-item { cursor:pointer; width:100%; aspect-ratio:1; border-radius:12px; transition:all 0.2s; display:flex; align-items:center; justify-content:center; background: transparent !important; }
        .emoji-item:hover { background: transparent !important; transform:scale(1.2); }
        .emoji-item img { width:95%; height:auto; object-fit:contain; mix-blend-mode: multiply; }

        /* Sticker Image Rendering */
        .sticker-img { 
            max-width: 160px; 
            max-height: 160px; 
            cursor: pointer; 
            transition: transform 0.2s; 
            background: transparent !important;
            mix-blend-mode: multiply;
        }
        .sticker-img:hover { transform: scale(1.05); }
        
        .chat-img-thumb { 
            max-width: 180px; 
            max-height: 240px; 
            border-radius: 8px; 
            display: block; 
            cursor: zoom-in; 
            object-fit: cover;
        }
        .chat-img-thumb:hover { transform: scale(1.02); }
        
        .preview-container { 
            display:none; 
            align-items:center; 
            gap:12px; 
            padding:10px 15px; 
            background:#f8fafc; 
            border-top:1px solid #e2e8f0; 
            position: relative;
        }
        .preview-thumb { 
            width:45px; 
            height:45px; 
            border-radius:8px; 
            object-fit:contain; 
            background:#fff;
            mix-blend-mode: multiply;
        }
        .preview-remove {
            cursor:pointer;
            width:24px;
            height:24px;
            display:flex;
            align-items:center;
            justify-content:center;
            background:rgba(0,0,0,0.05);
            border-radius:50%;
            font-size:0.7rem;
            color:#64748b;
        }

        /* Mobile Compact Chat Adjustments */
        @media (max-width: 768px) {
            .msg-bubble { 
                font-size: 0.95rem !important; 
                padding: 10px 14px !important; 
                max-width: 88% !important;
            }
            .sticker-img { 
                max-width: 200px !important; 
                max-height: 200px !important; 
            }
            .chat-img-thumb { 
                max-width: 160px !important; 
                max-height: 200px !important; 
            }
            .msg-time { font-size: 0.65rem !important; }
            
            .emoji-picker {
                width: calc(100% - 30px) !important;
                bottom: 150px !important;
                left: 10px !important;
                grid-template-columns: repeat(4, 1fr) !important;
                max-height: 280px;
                overflow-y: auto;
            }
        }
    `;
    document.head.appendChild(style);

    chatContainer.innerHTML = `
        <div id="chatWindow" class="chat-window">
            <div class="chat-header">
                <div style="display:flex; align-items:center; gap:12px;">
                    <div style="width:34px; height:34px; background:#fff; border-radius:50%; display:flex; align-items:center; justify-content:center; overflow:hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
                        <img src="logo.png" style="width:24px; height:auto;">
                    </div>
                    <div>
                        <div style="font-weight:700; font-size:0.95rem; margin-bottom:1px;">แชทกับ Paomobile</div>
                        <div id="chatHeaderStatus" style="font-size:0.7rem; opacity:0.8; display:flex; align-items:center; gap:4px;">
                            <span id="chatStatusDot" style="width:6px; height:6px; background:#94a3b8; border-radius:50%;"></span>
                            <span id="chatStatusText">เชื่อมต่อ...</span>
                        </div>
                    </div>
                </div>
                <span class="chat-close-btn" onclick="toggleChat()" style="font-size:1.5rem; cursor:pointer;">&times;</span>
            </div>
            <div id="chatMessages" class="chat-messages" style="background:#f1f5f9; padding:20px 15px;">
                <div style="text-align:center; padding:60px 40px; color:#94a3b8;">
                    <div class="loading-spinner" style="font-size:1.5rem; margin-bottom:10px;">⏳</div>
                    กำลังเรียกข้อมูลการสนทนา...
                </div>
            </div>
            
            <!-- File Preview Area -->
            <div id="chatPreview" class="preview-container" style="display:none;">
                <img id="previewImg" class="preview-thumb" src="">
                <div style="flex:1; min-width:0;">
                    <div id="previewName" style="font-size:0.8rem; font-weight:600; color:#1e293b; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">filename.jpg</div>
                    <div style="font-size:0.7rem; color:#94a3b8;">เตรียมส่งรูปภาพ...</div>
                </div>
                <div class="preview-remove" onclick="removeChatPreview()">✕</div>
            </div>

            <div class="chat-input-area">
                <div class="chat-input-container">
                    <!-- Tools move back to the left, outside the pill -->
                    <div class="chat-tools">
                        <label for="custImageUpload" title="ส่งรูปภาพ">🖼️</label>
                        <input type="file" id="custImageUpload" accept="image/*" onchange="handleCustomerFileUpload(this, 'image')">
                        <span title="อีโมจิ" onclick="toggleEmojiPicker()">😊</span>
                    </div>

                    <!-- Emoji Picker Grid -->
                    <div id="emojiPicker" class="emoji-picker"></div>

                    <!-- Input Pill with Guaranteed Full Width remaining -->
                    <div class="chat-input-pill">
                        <input type="text" id="chatInput" class="chat-input" placeholder="พิมพ์บอกร้านได้เลยค๊าบ..." onkeypress="if(event.key === 'Enter') sendChatMessage()">
                        <button class="btn-send" onclick="sendChatMessage()">
                            <span>🏹</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
        <div class="chat-floating-btn" id="chatFloatingBtn" onclick="toggleChat()">
            <div id="customerChatBadge" style="display:none; position:absolute; top:-6px; right:-6px; background:#ee4d2d; color:#fff; border:2px solid #fff; border-radius:50%; width:24px; height:24px; font-size:0.75rem; font-weight:700; align-items:center; justify-content:center; box-shadow:0 2px 5px rgba(0,0,0,0.2); z-index:20;">0</div>
            <div class="chat-tooltip">สวัสดีครับ สอบถามเราได้ที่นี่ ✨</div>
            <div class="chat-avatar-wrapper">
                <img src="logo.png" alt="Paomobile Logo">
                <div class="online-indicator offline" id="chatStatusIndicator"></div>
            </div>
        </div>
    `;
    
    // Start badge sync for unread messages
    startCustomerBadgeSync();

    // --- Emoji Picker Implementation ---
    function renderEmojiPicker() {
        const picker = document.getElementById('emojiPicker');
        if (!picker) return;
        let html = '';
        for (let i = 1; i <= 16; i++) {
            html += `<div class="emoji-item" onclick="sendEmojiSticker(${i})"><img src="${i}.png" alt="emoji"></div>`;
        }
        picker.innerHTML = html;
    }

    window.toggleEmojiPicker = () => {
        const picker = document.getElementById('emojiPicker');
        if (picker) {
            picker.classList.toggle('active');
            if (picker.classList.contains('active') && !picker.innerHTML) {
                renderEmojiPicker();
            }
        }
    };

    window.sendEmojiSticker = async (index) => {
        const user = getChatUser();
        if (!user) {
            alert("🚨 กรุณาเข้าสู่ระบบก่อนนะครับ");
            window.location.href = "login.html";
            return;
        }

        const timestamp = new Date().toISOString();
        const normalizedEmail = (user.email || user.uid || 'guest').trim().toLowerCase();
        
        toggleEmojiPicker(); // Close picker

        try {
            await window.supabase.from('chat_messages').insert({ id: crypto.randomUUID(),
                chatId: normalizedEmail,
                type: 'sticker',
                fileUrl: `${index}.png`,
                sender: 'customer',
                timestamp: timestamp,
                isRead: false
            });

            await window.supabase.from('chats').upsert({
                id: normalizedEmail,
                lastMessage: "✨ ส่งสติ๊กเกอร์",
                lastTimestamp: timestamp
            });
            
        } catch (err) {
            console.error("[Chat] Sticker Send Error:", err);
            alert("❌ ส่งสติ๊กเกอร์ไม่สำเร็จครับ");
        }
    };

    document.body.appendChild(chatContainer);

    // --- Helpers ---
    window.removeChatPreview = () => {
        pendingChatFile = null;
        pendingChatType = null;
        document.getElementById('chatPreview').style.display = 'none';
        document.getElementById('previewImg').src = '';
    };

    // --- Toggle Chat ---
    window.toggleChat = () => {
        const win = document.getElementById('chatWindow');
        const isOpen = win.classList.toggle('active');
        if (isOpen) {
            setupChatSync();
        } else if (chatUnsubscribe) {
            chatUnsubscribe();
            chatUnsubscribe = null;
        }
    };

    // --- Seller Status Sync ---
    function syncSellerStatus() {
        const indicator = document.getElementById('chatStatusIndicator');
        const headerDot = document.getElementById('chatStatusDot');
        const headerText = document.getElementById('chatStatusText');
        
        if (!indicator) return;

        if (!window.supabase) {
            setTimeout(syncSellerStatus, 2000);
            return;
        }

        const fetchStatus = async () => {
            const { data } = await window.supabase.from('settings').select('value').eq('id', 'seller_status').single();
            if (data && data.value) {
                const statusData = data.value;
                const lastSeen = statusData.lastSeen ? new Date(statusData.lastSeen) : new Date(0);
                const now = new Date();
                const diffSeconds = (now - lastSeen) / 1000;
                
                // If last active in 3 minutes, consider online
                const isOnlineNow = diffSeconds < 180 && statusData.isOnline;

                if (isOnlineNow) {
                    indicator.classList.remove('offline');
                    if (headerDot) headerDot.style.background = '#26af11';
                    if (headerText) headerText.textContent = 'ออนไลน์';
                } else {
                    indicator.classList.add('offline');
                    if (headerDot) headerDot.style.background = '#888';
                    const awayMsg = diffSeconds < 3600 ? 'ไม่อยู่ชั่วคราว' : 'ออฟไลน์';
                    if (headerText) headerText.textContent = awayMsg;
                }
            } else {
                indicator.classList.add('offline');
                if (headerDot) headerDot.style.background = '#888';
                if (headerText) headerText.textContent = 'ออฟไลน์';
            }
        };

        if (statusUnsubscribe) window.supabase.removeChannel(statusUnsubscribe);
        fetchStatus();
        
        statusUnsubscribe = window.supabase.channel('public:settings_seller_status')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'settings', filter: 'id=eq.seller_status' }, fetchStatus)
            .subscribe();
    }

    // --- Core Functions ---
    function getChatUser() {
        const userData = localStorage.getItem('paomobile_user');
        return userData ? JSON.parse(userData) : null;
    }

    async function ensureFirebaseAuth() {
        if (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser) {
            return true;
        }
        return new Promise((resolve) => {
            if (typeof firebase === 'undefined') return resolve(false);
            const unsubscribe = firebase.auth().onAuthStateChanged(user => {
                unsubscribe();
                if (user) {
                    resolve(true);
                } else {
                    firebase.auth().signInAnonymously().then(() => resolve(true)).catch(err => {
                        console.warn("[Chat] Silent Auth failed:", err);
                        resolve(false);
                    });
                }
            });
        });
    }

    async function setupChatSync() {
        const user = getChatUser();
        const msgsArea = document.getElementById('chatMessages');

        if (!user) {
            msgsArea.innerHTML = `
                <div style="text-align:center; padding:40px 20px; color:#666;">
                    <p style="margin-bottom:20px; font-weight:500; color:#475569;">🔔 เข้าสู่ระบบเพื่อถามเราได้ทันทีค๊าบ</p>
                    <a href="login.html" class="btn btn-sm btn-primary" style="padding:10px 30px; border-radius:30px; text-decoration:none; font-size:0.9rem; background:#ee4d2d; color:#fff; display:inline-block; font-weight:600; box-shadow:0 4px 12px rgba(238,77,45,0.3);">เริ่มการสนทนา</a>
                </div>
            `;
            return;
        }

        // Try to get DB
        if (!window.db) {
            if (typeof db !== 'undefined') window.db = db;
            else if (typeof firebase !== 'undefined') window.db = firebase.firestore();
        }
        
        if (!window.db) {
            console.warn("[ChatSync] DB not initialized, retrying...");
            setTimeout(setupChatSync, 100);
            return;
        }

        await ensureFirebaseAuth();
        const normalizedEmail = (user.email || user.uid || 'guest').trim().toLowerCase();

        const updatePresence = () => {
            if (!window.db) return;
            window.db.collection('chats').doc(normalizedEmail).set({
                userName: user.name || user.email || 'ลูกค้า',
                userAvatar: user.avatar || "",
                userEmail: normalizedEmail,
                lastSeen: firebase.firestore.FieldValue.serverTimestamp(),
                presence: {
                    page: getCurrentPageName(),
                    lastSeen: firebase.firestore.FieldValue.serverTimestamp()
                }
            }, { merge: true }).catch(err => {});
        };

        updatePresence();
        if (presenceInterval) clearInterval(presenceInterval);
        
        // Update presence every 5 minutes instead of 30 seconds to save writes
        presenceInterval = setInterval(() => {
            if (document.visibilityState === 'visible') {
                updatePresence();
            }
        }, 300000); 

        const renderCustomerMessages = (docsArray) => {
            if (!docsArray || docsArray.length === 0) {
                msgsArea.innerHTML = `
                    <div style="text-align:center; padding:60px 20px; color:#94a3b8;">
                        <div style="font-size:3rem; margin-bottom:15px; filter:grayscale(0.5);">👋</div>
                        <div style="font-weight:600; color:#475569; margin-bottom:5px;">สวัสดีครับ! ยินดีที่ได้คุยด้วยนะครับ</div>
                        <div style="font-size:0.85rem; opacity:0.8;">พิมพ์บอกอาการหรือสิ่งที่ต้องการให้เราช่วยได้เลยค๊าบ</div>
                    </div>
                `;
                return;
            }
            
            let html = '';
            
            docsArray.forEach(msg => {
                const isCustomer = msg.sender === 'customer' || msg.sender === 'user';
                
                let timeStr = '...';
                if (msg.timestamp_ms) {
                    timeStr = new Date(msg.timestamp_ms).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                } else if (msg.timestamp && msg.timestamp.toDate) {
                    timeStr = new Date(msg.timestamp.toDate()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                }

                const tickHtml = isCustomer 
                    ? (msg.isRead ? '<span style="color:#2ecc71; margin-left:4px; font-weight:800;">✓✓ <span style="font-size:0.65rem; font-weight:500;">อ่านแล้ว</span></span>' : '<span style="color:#2ecc71; margin-left:4px; font-weight:800;">✓</span>') 
                    : '';
                const timeHtml = `<div class="msg-time" style="font-size:0.65rem; opacity:0.7; text-align:right; margin-top:4px; margin-bottom:-2px;">${timeStr}${tickHtml}</div>`;
                
                if (msg.type === 'card') {
                    html += `
                        <div class="msg-row seller">
                            <div class="chat-card" style="background:#fff; border-radius:12px; overflow:hidden; border:1px solid #eef2f6; cursor:pointer;" onclick="handleChatCardClick('${msg.cardData.productId}', '${msg.cardData.category}', '${msg.cardData.link}')">
                                <img src="${msg.cardData.image}" class="chat-card-img" style="border-radius:12px 12px 0 0;" onload="var c=document.getElementById('chatMessages');if(c)c.scrollTop=c.scrollHeight;">
                                <div class="chat-card-info" style="padding:10px;">
                                    <div class="chat-card-title" style="font-weight:600; color:#1e293b;">${msg.cardData.title}</div>
                                    <div class="chat-card-price" style="color:#ee4d2d; font-weight:700;">${msg.cardData.price}</div>
                                </div>
                                <div class="chat-card-btn" style="display:block; text-align:center; padding:8px; background:#f8fafc; color:#64748b; text-decoration:none; font-size:0.85rem; border-top:1px solid #f1f5f9;">ดูรายละเอียด</div>
                            </div>
                            ${timeHtml}
                        </div>
                    `;
                } else if (msg.type === 'image') {
                    html += `
                        <div class="msg-row ${isCustomer ? 'customer' : 'seller'} sticker">
                            <div class="msg-bubble" style="background:transparent !important; border:none !important; box-shadow:none !important; padding:4px 0 !important; overflow:visible !important;">
                                <img src="${msg.fileUrl}" class="sticker-img" style="mix-blend-mode:multiply !important; filter:contrast(1.1) brightness(1.1) !important;" onclick="openImageLarge('${msg.fileUrl}')" onload="var c=document.getElementById('chatMessages');if(c)c.scrollTop=c.scrollHeight;">
                            </div>
                            ${timeHtml}
                        </div>
                    `;
                } else if (msg.type === 'file') {
                    html += `
                        <div class="msg-row ${isCustomer ? 'customer' : 'seller'}">
                            <div class="msg-bubble" style="padding:12px 16px;">
                                <div style="display:flex; align-items:center; gap:10px;">
                                    <div style="font-size:1.6rem;">📁</div>
                                    <div style="min-width:0;">
                                        <div style="font-size:0.85rem; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:140px; color:inherit;">${msg.fileName || 'ไฟล์แนบ'}</div>
                                        <a href="${msg.fileUrl}" target="_blank" style="font-size:0.75rem; color:#ee4d2d; font-weight:700; text-decoration:none;">📄 ดาวน์โหลดไฟล์</a>
                                    </div>
                                </div>
                                ${timeHtml}
                            </div>
                        </div>
                    `;
                } else if (msg.type === 'sticker') {
                    html += `
                        <div class="msg-row ${isCustomer ? 'customer' : 'seller'} sticker">
                            <div class="msg-bubble" style="background:transparent !important; border:none !important; box-shadow:none !important; padding:0 !important; overflow:visible !important;">
                                <img src="${msg.fileUrl}" class="sticker-img" onclick="openImageLarge('${msg.fileUrl}')" onload="var c=document.getElementById('chatMessages');if(c)c.scrollTop=c.scrollHeight;">
                            </div>
                            ${timeHtml}
                        </div>
                    `;
                } else {
                    const emojiRegex = /^(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff]|[\s])*$/g;
                    const isBigEmoji = msg.text && emojiRegex.test(msg.text) && msg.text.length < 10;
                    const bubbleStyle = isBigEmoji 
                        ? 'background:transparent !important; border:none !important; box-shadow:none !important; padding:0 !important; font-size:2.5rem !important;' 
                        : 'padding:10px 16px; line-height:1.5;';

                    html += `
                        <div class="msg-row ${isCustomer ? 'customer' : 'seller'} ${isBigEmoji ? 'sticker' : ''}">
                            <div class="msg-bubble" style="${bubbleStyle}">
                                ${msg.text}
                                ${timeHtml}
                            </div>
                        </div>
                    `;
                }
            });
            msgsArea.innerHTML = html;
            setTimeout(() => { msgsArea.scrollTop = msgsArea.scrollHeight; }, 50);
        };

        // Attempt instant load from cache
        try {
            const cachedMsgs = localStorage.getItem('paomobile_customer_msgs_' + normalizedEmail);
            if (cachedMsgs) {
                renderCustomerMessages(JSON.parse(cachedMsgs));
            }
        } catch(e) {}

        const fetchMessages = async () => {
            const { data } = await window.supabase.from('chat_messages').select('*').eq('chatId', normalizedEmail).order('timestamp', { ascending: true });
            if (data) {
                const docsArray = data.map(msg => {
                    msg.timestamp_ms = new Date(msg.timestamp).getTime();
                    return msg;
                });
                renderCustomerMessages(docsArray);
                try { localStorage.setItem('paomobile_customer_msgs_' + normalizedEmail, JSON.stringify(docsArray)); } catch(e) {}
                
                const unreadIds = data.filter(msg => msg.sender !== 'customer' && !msg.isRead).map(msg => msg.id);
                if (unreadIds.length > 0) {
                    window.supabase.from('chat_messages').update({ isRead: true }).in('id', unreadIds).then();
                }
            }
        };

        if (chatUnsubscribe) window.supabase.removeChannel(chatUnsubscribe);
        window.fetchCustomerMessages = fetchMessages;
        fetchMessages();
        
        if (window.customerChatInterval) clearInterval(window.customerChatInterval);
        window.customerChatInterval = setInterval(fetchMessages, 3000);

        chatUnsubscribe = window.supabase.channel('public:chat_messages_' + normalizedEmail)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_messages', filter: 'chatId=eq.' + normalizedEmail }, fetchMessages)
            .subscribe();
    }

    window.sendChatMessage = async () => {
        const input = document.getElementById('chatInput');
        if (!input) return;
        const text = input.value.trim();
        
        // If nothing to send, return
        if (!text && !pendingChatFile) return;

        const user = getChatUser();
        if (!user) {
            alert("🚨 กรุณาเข้าสู่ระบบก่อนนะครับ");
            window.location.href = "login.html";
            return;
        }

        if (!window.supabase) {
            alert("🚨 ระบบฐานข้อมูลยังไม่พร้อม กรุณารอสักครู่ค๊าบ");
            return;
        }

        const originalText = text;
        const fileToSend = pendingChatFile;
        const typeToSend = pendingChatType;

        // Clear input and current preview immediately
        input.value = '';
        removeChatPreview();

        try {
            const normalizedEmail = (user.email || user.uid || 'guest').trim().toLowerCase();
            const timestamp = new Date().toISOString();
            
            // 1. Handle File/Image Send
            if (fileToSend) {
                const msgsArea = document.getElementById('chatMessages');
                const loadingId = 'loading-' + Date.now();
                if (msgsArea) {
                    const lDiv = document.createElement('div');
                    lDiv.id = loadingId;
                    lDiv.className = 'upload-status-bubble';
                    lDiv.innerHTML = `<div class="msg-row customer"><div class="msg-bubble" style="opacity:0.6; padding:8px 15px;">⏳ กำลังส่งข้อมูล...</div></div>`;
                    msgsArea.appendChild(lDiv);
                    msgsArea.scrollTop = msgsArea.scrollHeight;
                }

                try {
                    let finalUrl = "";
                    let finalName = fileToSend.name;

                    if (typeToSend === 'image') {
                        // --- DIRECT INJECTION MODE ---
                        // Compress and get Base64 to bypass Storage/CORS issues
                        finalUrl = await compressImage(fileToSend);
                    } else {
                        const filePath = `customer/${normalizedEmail}/${Date.now()}_${fileToSend.name}`;
                        const { data, error } = await window.supabase.storage.from('chat_uploads').upload(filePath, fileToSend);
                        if (error) throw error;
                        const { data: { publicUrl } } = window.supabase.storage.from('chat_uploads').getPublicUrl(filePath);
                        finalUrl = publicUrl;
                    }

                    document.querySelectorAll('[id^="loading-"], .upload-status-bubble').forEach(el => el.remove());

                    await window.supabase.from('chats').upsert({
                        id: normalizedEmail,
                        lastMessage: typeToSend === 'image' ? "📷 ส่งรูปภาพ" : "📁 ส่งไฟล์: " + finalName,
                        lastTimestamp: timestamp
                    });

                    await window.supabase.from('chat_messages').insert({ id: crypto.randomUUID(),
                        chatId: normalizedEmail,
                        type: typeToSend,
                        fileUrl: finalUrl,
                        sender: 'customer',
                        timestamp: timestamp,
                        isRead: false
                    });

                } catch (upErr) {
                    console.error("[Chat] Image Process Failed:", upErr);
                    document.querySelectorAll('[id^="loading-"], .upload-status-bubble').forEach(el => el.remove());
                    alert("⚠️ ส่งรูปไม่สำเร็จ: บราวเซอร์ของคุณมีข้อจำกัดสิทธิ์ความปลอดภัย กรุณาลองใช้ขนาดรูปอื่นครับ");
                }
            }

            if (originalText) {
                const msgsArea = document.getElementById('chatMessages');
                if (msgsArea) {
                    const tempHtml = `
                        <div class="msg-row customer" style="opacity: 0.7;">
                            <div class="msg-bubble">${originalText.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
                        </div>
                    `;
                    msgsArea.insertAdjacentHTML('beforeend', tempHtml);
                    msgsArea.scrollTop = msgsArea.scrollHeight;
                }

                await window.supabase.from('chats').upsert({
                    id: normalizedEmail,
                    userEmail: normalizedEmail,
                    userName: user.name || user.email || 'ลูกค้า',
                    userAvatar: user.avatar || "",
                    lastMessage: originalText,
                    lastTimestamp: timestamp
                });

                await window.supabase.from('chat_messages').insert({ id: crypto.randomUUID(),
                    chatId: normalizedEmail,
                    text: originalText,
                    sender: 'customer',
                    timestamp: timestamp,
                    type: 'text',
                    isRead: false
                });
            }

            if (window.fetchCustomerMessages) window.fetchCustomerMessages();

        } catch (err) {
            console.error("[Chat] Send Error:", err);
            alert("❌ ส่งไม่สำเร็จ: " + (err.message || "เกิดข้อผิดพลาดบางอย่าง"));
            input.value = originalText; // Restore text
        } finally {
            input.disabled = false;
            input.style.opacity = '1';
            input.focus();
        }
    };

    window.handleCustomerFileUpload = async (input, type) => {
        const file = input.files[0];
        if (!file) return;

        pendingChatFile = file;
        pendingChatType = type;

        // Show Preview UI
        const previewArea = document.getElementById('chatPreview');
        const previewImg = document.getElementById('previewImg');
        const previewName = document.getElementById('previewName');

        if (previewArea && previewImg && previewName) {
            previewName.innerText = file.name;
            previewArea.style.display = 'flex';
            
            if (type === 'image') {
                const reader = new FileReader();
                reader.onload = e => { previewImg.src = e.target.result; };
                reader.readAsDataURL(file);
                previewImg.style.display = 'block';
            } else {
                previewImg.style.display = 'none';
            }
        }

        // Reset input for next selection
        input.value = '';
    };

    function startCustomerBadgeSync() {
        const user = getChatUser();
        if (!user) return; // Only sync badge if logged in
        
        const checkDb = setInterval(() => {
            if (window.supabase) {
                clearInterval(checkDb);
                const normalizedEmail = (user.email || user.uid || 'guest').trim().toLowerCase();
                
                const fetchBadge = async () => {
                    const { data } = await window.supabase.from('chat_messages').select('*').eq('chatId', normalizedEmail).eq('sender', 'seller').eq('isRead', false);
                    const badge = document.getElementById('customerChatBadge');
                    if (badge) {
                        if (data && data.length > 0) {
                            badge.textContent = data.length > 99 ? '99+' : data.length;
                            badge.style.display = 'flex';
                        } else {
                            badge.style.display = 'none';
                        }
                    }
                };
                fetchBadge();
                window.supabase.channel('public:chat_messages_badge_' + normalizedEmail)
                    .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_messages', filter: 'chatId=eq.' + normalizedEmail }, fetchBadge)
                    .subscribe();
            }
        }, 1000);
    }

    // --- Heartbeat for Online Status ---
    async function startCustomerHeartbeat() {
        const user = getChatUser();
        if (!user) return;

        const sendHeartbeat = () => {
            if (!window.supabase) return;
            const normalizedEmail = (user.email || user.uid || 'guest').trim().toLowerCase();
            window.supabase.from('chats').upsert({
                id: normalizedEmail,
                lastSeen: new Date().toISOString()
            }).then(({error}) => {}); // Silent fail
        };

        // Initial and periodic
        sendHeartbeat();
        setInterval(sendHeartbeat, 30000);
    }

    // Lightbox Modal Helper
    const lbContainer = document.createElement('div');
    lbContainer.id = 'chatOverlay';
    lbContainer.className = 'img-overlay';
    lbContainer.onclick = (e) => { if(e.target === lbContainer) closeImgOverlay(); };
    lbContainer.innerHTML = `<span class="img-overlay-close" onclick="closeImgOverlay()">&times;</span><img id="imgOverlaySrc" class="img-overlay-content">`;
    document.body.appendChild(lbContainer);

    window.openImageLarge = (url) => {
        document.getElementById('imgOverlaySrc').src = url;
        document.getElementById('chatOverlay').classList.add('active');
        document.body.style.overflow = 'hidden';
    };
    window.closeImgOverlay = () => {
        document.getElementById('chatOverlay').classList.remove('active');
        document.body.style.overflow = '';
    };

    const compressImage = (file, maxWidth = 600) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let w = img.width, h = img.height;
                    if(w > maxWidth) { h = Math.round((h * maxWidth) / w); w = maxWidth; }
                    canvas.width = w; canvas.height = h;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img,0,0,w,h);
                    resolve(canvas.toDataURL('image/jpeg', 0.65));
                };
                img.onerror = reject;
                img.src = e.target.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    // --- Initial Load ---
    setTimeout(() => {
        syncSellerStatus();
        startCustomerHeartbeat();
    }, 500);
    window.handleChatCardClick = (productId, category, link) => {
        // ALWAYS navigate to ensure we follow the "Go to Page" requirement.
        // ProductSync in the destination page will handle auto-opening the modal.
        window.location.href = link;
    };
})();
