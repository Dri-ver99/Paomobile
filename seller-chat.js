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
// seller-chat.js - Real-time Chat Management for Sellers (Shopee UI)
(function () {
    // Inject Premium styles for images and lightbox
    const style = document.createElement('style');
    style.innerHTML = `
        .chat-img-thumb { 
            max-width: 280px; 
            max-height: 350px; 
            border-radius: 12px; 
            display: block; 
            cursor: zoom-in; 
            transition: transform 0.2s;
            object-fit: cover;
            margin: 2px 0;
            border: 1px solid #eef2f6;
        }
        .chat-img-thumb:hover { transform: scale(1.02); filter: brightness(0.95); }
        .img-overlay { display:none; position:fixed; z-index:10000; left:0; top:0; width:100%; height:100%; background:rgba(0,0,0,0.9); backdrop-filter:blur(5px); align-items:center; justify-content:center; }
        .img-overlay-content { max-width:92%; max-height:88%; border-radius:12px; box-shadow:0 10px 50px rgba(0,0,0,0.8); transform:scale(0.85); transition:transform 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28); }
        .img-overlay.active { display:flex; }
        .img-overlay.active .img-overlay-content { transform:scale(1); }
        .img-overlay-close { position:absolute; top:20px; right:25px; color:#fff; font-size:40px; cursor:pointer; }
        
        /* Emoji Picker Styles (Seller Side) - Enlarged */
        .emoji-picker-seller { display:none; position:absolute; bottom:40px; left:0; width:300px; background:#fff; border-radius:12px; box-shadow:0 10px 40px rgba(0,0,0,0.15); border:1px solid #e2e8f0; padding:12px; z-index:100; grid-template-columns: repeat(4, 1fr); gap:12px; }
        .emoji-picker-seller.active { display:grid; animation: chatFadeIn 0.2s ease-out; }
        .emoji-item-seller { cursor:pointer; width:100%; aspect-ratio:1; border-radius:8px; transition:all 0.2s; display:flex; align-items:center; justify-content:center; }
        .emoji-item-seller:hover { background:#f1f5f9; transform:scale(1.05); }
        .emoji-item-seller img { width:90%; height:auto; object-fit:contain; mix-blend-mode: multiply; }
        
        /* Sticker Message Bubble - Enlarged & Transparent */
        .msg-row.sticker .msg-bubble { background: transparent !important; border: none !important; box-shadow: none !important; padding: 0 !important; overflow: visible !important; }
        .sticker-img { 
            max-width: 280px; 
            max-height: 280px; 
            cursor: pointer; 
            transition: transform 0.2s; 
            mix-blend-mode: multiply; 
            filter: contrast(1.1) brightness(1.1);
        }
        .sticker-img:hover { transform: scale(1.05); }
        @keyframes chatFadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        
        /* Preview UI (Seller Side) */
        .preview-container-seller { display:none; padding:12px 16px; background:#fff; border-top:1px solid #f1f5f9; align-items:center; gap:12px; }
        .preview-thumb-seller { width:52px; height:52px; border-radius:8px; object-fit:cover; border:2px solid #ee4d2d; }
        .preview-remove-seller { cursor:pointer; color:#94a3b8; font-size:1.2rem; transition:color 0.2s; padding:4px; }
        .preview-remove-seller:hover { color:#ef4444; }

        /* Loading Skeletons for Chat */
        .chat-skeleton { padding: 15px; border-bottom: 1px solid #f8fafc; display: flex; gap: 12px; align-items: center; pointer-events: none; }
        .skeleton-avatar { width: 44px; height: 44px; border-radius: 50%; background: #f1f5f9; }
        .skeleton-info { flex: 1; }
        .skeleton-line { height: 14px; background: #f1f5f9; border-radius: 4px; margin-bottom: 8px; width: 60%; }
        .skeleton-line.short { width: 40%; height: 10px; }
        .skeleton-animate { background: linear-gradient(90deg, #f1f5f9 25%, #f8fafc 50%, #f1f5f9 75%); background-size: 200% 100%; animation: skeletonLoading 1.5s infinite; }
        @keyframes skeletonLoading { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

        .chat-item { animation: chatItemFadeIn 0.4s ease-out both; }
        @keyframes chatItemFadeIn { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: translateX(0); } }
    `;
    document.head.appendChild(style);
    
    let activeChatId = null;
    let messagesUnsubscribe = null;
    let chatListUnsubscribe = null; // Track chat list listener to prevent duplicates
    let allChats = []; // Global cache for chat list filtering
    let pendingChatFile = null;
    let pendingChatType = null;

    // Call it after initialization (Replaced by consolidated logic in seller-config.js)

    // 1. Load Chat List (Real-time)
    async function loadChatList() {
        console.log("[SellerChat] loadChatList() called (Supabase)");
        
        const supabase = window.supabaseClient;
        if (!supabase) {
            console.error("[SellerChat] No supabase available in loadChatList!");
            const listArea = document.getElementById('chatList');
            if (listArea) listArea.innerHTML = '<div style="padding:40px; text-align:center; color:#ef4444;">❌ Supabase ยังไม่พร้อม กรุณารีเฟรชหน้าเว็บครับ</div>';
            return;
        }

        if (chatListUnsubscribe) {
            supabase.removeChannel(chatListUnsubscribe);
            chatListUnsubscribe = null;
        }

        const chatListArea = document.getElementById('chatList');
        
        try {
            const cached = localStorage.getItem('paomobile_chat_cache');
            if (cached) {
                allChats = JSON.parse(cached);
                if (allChats && allChats.length > 0) {
                    renderChatList();
                }
            }
        } catch(e) {}

        if (chatListArea && allChats.length === 0) {
            chatListArea.innerHTML = Array(6).fill(0).map(() => '<div class="chat-skeleton"><div class="skeleton-avatar skeleton-animate"></div><div class="skeleton-info"><div class="skeleton-line skeleton-animate"></div><div class="skeleton-line short skeleton-animate"></div></div></div>').join('');
        }

        const fetchChats = async () => {
            const { data, error } = await supabase.from('chats').select('*');
            if (error) {
                console.error("[SellerChat] Load Error:", error.message);
                if (chatListArea) {
                    chatListArea.innerHTML = '<div style="padding:40px; text-align:center;"><div style="color:#ef4444; font-weight:600; font-size:1.1rem; margin-bottom:10px;">⚠️ ไม่มีสิทธิ์เข้าถึงข้อมูล</div></div>';
                }
                return;
            }
            if (data) {
                allChats = data.map(chat => ({...chat, id: chat.id}));
                sortAndRenderChats();
            }
        };

        const sortAndRenderChats = () => {
            allChats.sort((a, b) => {
                const getT = x => (x.lastTimestamp ? new Date(x.lastTimestamp).getTime() : 0);
                const unreadA = (a.unreadCount || 0) > 0 ? 1 : 0;
                const unreadB = (b.unreadCount || 0) > 0 ? 1 : 0;
                if (unreadA !== unreadB) return unreadB - unreadA;
                return getT(b) - getT(a);
            });
            try { localStorage.setItem('paomobile_chat_cache', JSON.stringify(allChats)); } catch(e) {}
            renderChatList();
        };

        await fetchChats();

        chatListUnsubscribe = supabase.channel('chats-list-sync')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'chats' }, payload => {
                if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                    const idx = allChats.findIndex(c => c.id === payload.new.id);
                    if (idx >= 0) allChats[idx] = { ...allChats[idx], ...payload.new };
                    else allChats.push({ ...payload.new, id: payload.new.id });
                } else if (payload.eventType === 'DELETE') {
                    allChats = allChats.filter(c => c.id !== payload.old.id);
                }
                sortAndRenderChats();
            })
            .subscribe();
    }
    window.loadChatList = loadChatList;

    // New: Unified rendering with search and filter
    window.renderChatList = () => {
        const chatListArea = document.getElementById('chatList');
        if (!chatListArea) return;

        const searchInputEl = document.getElementById('chatSearchInput');
        const searchQuery = (searchInputEl && searchInputEl.value) ? searchInputEl.value.toLowerCase() : "";
        
        const filterSelectEl = document.getElementById('chatFilterSelect');
        const filterStatus = (filterSelectEl && filterSelectEl.value) ? filterSelectEl.value : "all";

        if (allChats.length === 0) {
            chatListArea.innerHTML = '<div style="text-align: center; padding: 60px 40px; color: #666; font-size: 1rem; font-weight: 500;">🔔 ยังไม่มีบทสนทนาในขณะนี้</div>';
            return;
        }

        const filtered = allChats.filter(chat => {
            if (!chat) return false;
            const matchesSearch = String(chat.userName || "").toLowerCase().includes(searchQuery);
            const matchesFilter = filterStatus === 'all' || (filterStatus === 'unread' && chat.unreadCount > 0);
            return matchesSearch && matchesFilter;
        });

        if (filtered.length === 0) {
            chatListArea.innerHTML = `<div style="text-align: center; padding: 40px; color: #999;">ไม่พบแชทที่ตรงตามเงื่อนไข</div>`;
            return;
        }

        const safeToDate = (ts) => {
            try {
                if (!ts) return new Date(0);
                if (ts.toDate) return ts.toDate();
                if (ts.seconds) return new Date(ts.seconds * 1000);
                const d = new Date(ts);
                return isNaN(d.getTime()) ? new Date(0) : d;
            } catch(e) { return new Date(0); }
        };

        let html = '';
        filtered.forEach(chat => {
            try {
                const isActive = chat.id === activeChatId;
                const lastTime = safeToDate(chat.lastTimestamp);
                
                // Check Online Status (within 2 mins)
                const lastSeen = chat.lastSeen ? safeToDate(chat.lastSeen) : lastTime;
                const now = new Date();
                const isOnline = (now - lastSeen) < 120000; // 2 minutes window

                const isClosed = (new Date() - lastTime) > 86400000;
                const time = chat.lastTimestamp ? formatChatTime(lastTime) : '';
                const initial = chat.userName ? String(chat.userName).charAt(0).toUpperCase() : '?';
                const avatarHtml = chat.userAvatar 
                    ? `<img src="${chat.userAvatar}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">` 
                    : `<span>${initial}</span>`;
                
                // Presence UI (v1.8.5)
                const presence = chat.presence;
                const currentPage = (presence && presence.lastSeen && (new Date() - safeToDate(presence.lastSeen)) < 60000) ? presence.page : '';
                
                html += `
                    <div class="chat-item ${isActive ? 'active' : ''}" onclick="openChat('${chat.id}')">
                        <div class="chat-item-avatar">
                            ${avatarHtml}
                            <div class="online-dot ${isOnline ? '' : 'offline'}"></div>
                        </div>
                        <div class="chat-item-content">
                            <div class="chat-item-header">
                                <div class="chat-item-name">${(chat.userName && chat.userName !== 'ลูกค้าใหม่') ? chat.userName : chat.id}</div>
                                <div class="chat-item-time">${time}</div>
                            </div>
                            <div class="chat-item-snippet">
                                ${currentPage ? `<span style="color:#ee4d2d; font-weight:700;">[ดูหน้า: ${currentPage}]</span> ` : ''}
                                ${chat.lastMessage || 'ส่งรูปภาพ/การ์ด'}
                            </div>
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:5px;">
                                ${chat.unreadCount > 0 ? `<div class="unread-badge">${chat.unreadCount}</div>` : '<div></div>'}
                                ${isClosed ? '<div class="status-badge closed">ปิด</div>' : '<div class="status-badge">วันนี้</div>'}
                            </div>
                        </div>
                    </div>
                `;
            } catch (err) {
                console.error("[SellerChat] Error rendering individual chat:", chat, err);
            }
        });
        chatListArea.innerHTML = html;
    }

    window.handleChatSearch = () => {
        renderChatList();
    };

    window.handleChatFilter = () => {
        renderChatList();
    };

    function formatChatTime(date) {
        const now = new Date();
        const diff = now - date;
        if (diff < 86400000) { // Same day
            return date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        }
        return date.toLocaleDateString([], {day: 'numeric', month: 'short'});
    }

    // 2. Open Specific Chat
    window.openChat = async (chatId) => {
        if (!chatId) return;
        
        // Normalize chatId (email should be lowercase)
        chatId = chatId.trim().toLowerCase();
        
        activeChatId = chatId;
        
        // --- INSTANT UI: Use cached data from allChats if available ---
        var cachedChat = allChats.find(function(c) { return c.id === chatId; });
        var chatData = cachedChat || { userName: chatId, userAvatar: "" };
        
        // Render the UI structure immediately
        renderChatLayout(chatId, chatData);
        
        // Fetch full data in background if needed
        if (!cachedChat) {
            const supabase = window.supabaseClient;
            if (supabase) {
                supabase.from('chats').select('*').eq('id', chatId).single().then(({data}) => {
                    if (data) updateChatHeader(data);
                });
            }
        }
    };

    // Helper to render the main chat area layout
    function renderChatLayout(chatId, chatData) {
        var initial = chatData.userName ? String(chatData.userName).charAt(0).toUpperCase() : String(chatId).charAt(0).toUpperCase();
        var avatarHtml = chatData.userAvatar 
            ? `<img src="${chatData.userAvatar}" style="width:100%; height:100%; object-fit:cover;">` 
            : `<span style="color:white;">${initial}</span>`;
        
        var chatMainEl = document.getElementById('chatMain');
        if (!chatMainEl) return;

        chatMainEl.innerHTML = `
            <div class="chat-header-shopee">
                <div style="display:flex; align-items:center;">
                    <div class="btn-back-chat" style="color:#fff; cursor:pointer; margin-right:15px; font-size:1.4rem; background:none; border:none; padding:0; display:flex; align-items:center; justify-content:center;" onclick="closeMobileChat()">⬅️</div>
                    <div class="header-user-info">
                        <div class="header-user-avatar" style="overflow:hidden; border:1px solid rgba(255,255,255,0.2); background:#333;">${avatarHtml}</div>
                        <div style="display:flex; flex-direction:column;">
                            <div class="header-user-name" style="color:#fff;">${(chatData.userName && chatData.userName !== 'ลูกค้าใหม่') ? chatData.userName : chatId}</div>
                            <div id="sellerPresenceNode" style="font-size:0.75rem; color:#fff; font-weight:700; background:rgba(255,255,255,0.1); padding:2px 8px; border-radius:10px; margin-top:4px; display:inline-block;">
                                ${chatData.presence && chatData.presence.page ? `กำลังดูหน้า: ${chatData.presence.page}` : 'กำลังดูสินค้า'}
                            </div>
                        </div>
                    </div>
                </div>
                <div style="display:flex; gap:15px; align-items:center;">
                    <button onclick="openProductPicker()" style="background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.2); padding:6px 12px; border-radius:30px; font-size:0.8rem; cursor:pointer; font-weight:600; color:#fff;">🎁 ส่งสินค้า</button>
                    <span style="font-size:1.6rem; color:#666; cursor:pointer; line-height:1;" onclick="location.reload()">&times;</span>
                </div>
            </div>
            <div id="chatMessages" class="messages-container">
                <div style="text-align:center; padding:40px; color:#94a3b8;">กำลังโหลดข้อความ...</div>
            </div>
            
            <div id="sellerChatPreview" class="preview-container-seller" style="display:none;">
                <img id="sellerPreviewImg" class="preview-thumb-seller" src="">
                <div style="flex:1; min-width:0;">
                    <div id="sellerPreviewName" style="font-size:0.85rem; font-weight:600; color:#1e293b; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">filename.jpg</div>
                    <div style="font-size:0.75rem; color:#94a3b8;">เตรียมส่งรูปภาพ...</div>
                </div>
                <div class="preview-remove-seller" onclick="removeChatPreview()">✕</div>
            </div>

            <div id="chatFooter" class="chat-footer" style="padding: 12px 15px 55px; border-top: 1px solid #f1f5f9; background:#fff; position: relative;">
                <div style="display:flex; align-items:center; gap:10px; width:100%;">
                    <div class="input-tools" style="display:flex; gap:12px; font-size:1.4rem; color:#666;">
                        <label for="sellerFileUpload" style="cursor:pointer;" title="ส่งรูปภาพ">🖼️</label>
                        <input type="file" id="sellerFileUpload" accept="image/*" style="display:none;" onchange="handleFileUpload(this, 'image')">
                        <span style="cursor:pointer;" onclick="toggleEmojiPicker()" title="อีโมจิ">😊</span>
                    </div>
                    <div id="emojiPicker" class="emoji-picker-seller"></div>
                    <div style="flex:1; background:#f1f5f9; border-radius:30px; display:flex; align-items:center; padding:5px 15px; border:1px solid #eef2f6;">
                        <textarea id="mainChatInput" style="flex:1; background:transparent; border:none; outline:none; resize:none; padding:8px 0; font-size:0.95rem; line-height:1.4; color:#333; height:40px; font-family:inherit;" placeholder="พิมพ์ข้อความตอบกลับ..." onkeypress="handleKeyPress(event)"></textarea>
                        <button onclick="sendReply()" style="background:#ee4d2d; color:#fff; border:none; width:34px; height:34px; border-radius:50%; display:flex; align-items:center; justify-content:center; cursor:pointer; margin-left:10px; font-size:1rem; flex-shrink:0;">🏹</button>
                    </div>
                </div>
            </div>
        `;

        // Update sidebar visual
        renderChatList();

        // Mobile transition
        var layout = document.querySelector('.chat-layout');
        if (layout) layout.classList.add('show-chat');

        // Load messages immediately
        startMessagesListener(chatId);

        // Mark as Read
        const supabase = window.supabaseClient;
        if (supabase) {
            supabase.from('chats').update({ unreadCount: 0 }).eq('id', chatId).then();
        }
    };

    function updateChatHeader(data) {
        var nameEl = document.querySelector('.header-user-name');
        if (nameEl) {
            nameEl.textContent = (data.userName && data.userName !== 'ลูกค้าใหม่') ? data.userName : (activeChatId || "");
        }
        
        var avatarEl = document.querySelector('.header-user-avatar');
        if (avatarEl && data.userAvatar) {
            avatarEl.innerHTML = `<img src="${data.userAvatar}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
        }
    }

    function startMessagesListener(chatId) {
        if (messagesUnsubscribe) messagesUnsubscribe();
        
        var msgsArea = document.getElementById('chatMessages');

        const renderSellerMessages = (docsArray, isRecentlyClosed) => {
            if (!docsArray || docsArray.length === 0) {
                msgsArea.innerHTML = '<div style="text-align:center; padding:60px 20px; color:#94a3b8; font-size:0.9rem;">👋 เริ่มการสนทนากับลูกค้าได้เลยครับ<br><span style="font-size:0.8rem; opacity:0.7;">(หากลูกค้าส่งข้อความมา จะแสดงที่นี่ทันที)</span></div>';
                return;
            }

            let html = '';
            let lastDate = "";
            
            docsArray.forEach(msg => {
                const isSeller = msg.sender === 'seller';
                let msgDate = "";
                let timeStr = "";
                
                if (msg.timestamp_ms) {
                    const d = new Date(msg.timestamp_ms);
                    msgDate = d.toLocaleDateString();
                    timeStr = d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                } else if (msg.timestamp && msg.timestamp.toDate) {
                    const d = new Date(msg.timestamp.toDate());
                    msgDate = d.toLocaleDateString();
                    timeStr = d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                }
                
                if (msgDate !== lastDate && msgDate !== "") {
                    html += `<div class="system-banner">${msgDate}</div>`;
                    lastDate = msgDate;
                }
                
                const tickHtml = isSeller 
                    ? (msg.isRead ? '<span class="read-tick" style="color:#2ecc71; margin-left:4px; font-weight:800;">✓✓ <span style="font-size:0.65rem; font-weight:500;">อ่านแล้ว</span></span>' : '<span class="read-tick" style="color:#2ecc71; margin-left:4px; font-weight:800;">✓</span>') 
                    : '';
                const metaHtml = `<div class="msg-meta" style="font-size:0.65rem; opacity:0.8;">${timeStr}${tickHtml}</div>`;

                if (msg.type === 'card') {
                    html += `
                        <div class="msg-row seller">
                            <div class="chat-card" onclick="handleChatCardClick('${msg.cardData.productId}', '${msg.cardData.category}', '${msg.cardData.link}')">
                                <img src="${msg.cardData.image}" class="chat-card-img" onload="var c=document.getElementById('chatMessages');if(c)c.scrollTop=c.scrollHeight;">
                                <div class="chat-card-info">
                                    <div class="chat-card-title">${msg.cardData.title}</div>
                                    <div class="chat-card-price">${msg.cardData.price}</div>
                                </div>
                                <div class="chat-card-btn">ดูรายละเอียด</div>
                            </div>
                        </div>
                    `;
                } else if (msg.type === 'image') {
                    html += `
                        <div class="msg-row ${isSeller ? 'seller' : 'customer'} sticker">
                            <div class="msg-bubble" style="background:transparent !important; border:none !important; box-shadow:none !important; padding:4px 0 !important; overflow:visible !important;">
                                <img src="${msg.fileUrl}" class="sticker-img" style="mix-blend-mode:multiply !important; filter:contrast(1.1) brightness(1.1) !important;" onclick="openImageLarge('${msg.fileUrl}')" onload="var c=document.getElementById('chatMessages');if(c)c.scrollTop=c.scrollHeight;">
                            </div>
                            ${metaHtml}
                        </div>
                    `;
                } else if (msg.type === 'file') {
                    html += `
                        <div class="msg-row ${isSeller ? 'seller' : 'customer'}">
                            <div class="msg-bubble file-bubble">
                                <div style="display:flex; align-items:center; gap:10px;">
                                    <div style="font-size:1.5rem;">📁</div>
                                    <div style="min-width:0;">
                                        <div style="font-size:0.85rem; font-weight:500; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${msg.fileName || 'ไฟล์แนบ'}</div>
                                        <a href="${msg.fileUrl}" target="_blank" style="font-size:0.75rem; color:#ee4d2d; text-decoration:none;">ดาวน์โหลด</a>
                                    </div>
                                </div>
                            </div>
                            ${metaHtml}
                        </div>
                    `;
                } else if (msg.type === 'sticker') {
                    html += `
                        <div class="msg-row ${isSeller ? 'seller' : 'customer'} sticker">
                            <div class="msg-bubble" style="background:transparent !important; border:none !important; box-shadow:none !important; padding:0 !important; overflow:visible !important;">
                                <img src="${msg.fileUrl}" class="sticker-img" style="mix-blend-mode:multiply !important; filter:contrast(1.1) brightness(1.1) !important;" onclick="openImageLarge('${msg.fileUrl}')" onload="var c=document.getElementById('chatMessages');if(c)c.scrollTop=c.scrollHeight;">
                            </div>
                            ${metaHtml}
                        </div>
                    `;
                } else if (msg.type === 'text' || msg.text) {
                    const textVal = msg.text || '';
                    const emojiRegex = /^(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff]|[\s])*$/g;
                    const isBigEmoji = emojiRegex.test(textVal) && textVal.length < 10;
                    const bubbleStyle = isBigEmoji 
                        ? 'background:transparent !important; border:none !important; box-shadow:none !important; padding:0 !important; font-size:2.5rem !important;' 
                        : '';
                    
                    html += `
                        <div class="msg-row ${isSeller ? 'seller' : 'customer'} ${isBigEmoji ? 'sticker' : ''}">
                            <div class="msg-bubble" style="${bubbleStyle}">
                                ${textVal}
                            </div>
                            ${metaHtml}
                        </div>
                    `;
                }
            });

            if (isRecentlyClosed) {
                html += `
                    <div class="start-new-chat-container">
                        <div class="system-banner" style="margin-bottom:15px; background:#f5f5f5; border:1px solid #eee;">การสนทนานี้ถูกปิดอัตโนมัติ</div>
                        <button class="btn-restart" onclick="restartChat()">เริ่มต้นการสนทนาใหม่</button>
                    </div>
                `;
                toggleFooter(false);
            } else {
                toggleFooter(true);
            }

            msgsArea.innerHTML = html;
            setTimeout(() => { msgsArea.scrollTop = msgsArea.scrollHeight; }, 50);
        };

        // Attempt instant load from cache
        try {
            const cachedMsgs = localStorage.getItem('paomobile_seller_msgs_' + chatId);
            if (cachedMsgs) {
                const parsed = JSON.parse(cachedMsgs);
                let isClosed = false;
                if (parsed.length > 0) {
                    const lastMsg = parsed[parsed.length - 1];
                    const lastTime = lastMsg.timestamp_ms ? lastMsg.timestamp_ms : Date.now();
                    isClosed = (Date.now() - lastTime) > 86400000;
                }
                renderSellerMessages(parsed, isClosed);
            }
        } catch(e) {}

        const supabase = window.supabaseClient;
        if (!supabase) return;

        const fetchMessages = async () => {
            const { data, error } = await supabase.from('chat_messages')
                .select('*').eq('chatId', chatId).order('timestamp_ms', { ascending: true });
            
            if (error) {
                msgsArea.innerHTML = `<div style="text-align:center; padding:40px; color:#ef4444; font-size:0.9rem;">🚨 ข้อผิดพลาด: ${error.message}</div>`;
                return;
            }

            if (data) {
                let isClosed = false;
                if (data.length > 0) {
                    const lastMsg = data[data.length - 1];
                    const lastTime = lastMsg.timestamp_ms ? lastMsg.timestamp_ms : Date.now();
                    isClosed = (Date.now() - lastTime) > 86400000;
                }
                renderSellerMessages(data, isClosed);
                try { localStorage.setItem('paomobile_seller_msgs_' + chatId, JSON.stringify(data)); } catch(e) {}

                const unreadIds = data.filter(m => m.sender !== 'seller' && !m.isRead).map(m => m.id);
                if (unreadIds.length > 0) {
                    supabase.from('chat_messages').update({ isRead: true }).in('id', unreadIds).then();
                    supabase.from('chats').update({ unreadCount: 0 }).eq('id', chatId).then();
                }
            }
        };

        fetchMessages();

        const channel = supabase.channel('messages-sync-' + chatId)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_messages', filter: 'chatId=eq.' + chatId }, () => {
                fetchMessages();
            })
            .subscribe();
            
        messagesUnsubscribe = () => { supabase.removeChannel(channel); };
    };

    window.handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendReply();
        }
    };

    window.closeMobileChat = () => {
        const layout = document.querySelector('.chat-layout');
        if (layout) layout.classList.remove('show-chat');
        activeChatId = null; // Clear active chat to allow re-opening same chat on some browsers
    };

    function toggleFooter(enabled) {
        const footer = document.getElementById('chatFooter');
        if (!footer) return;
        footer.style.display = enabled ? 'flex' : 'none';
        
        // Ensure restart container logic is handled via the banner
    }

    window.restartChat = () => {
        toggleFooter(true);
        const restartContainer = document.querySelector('.start-new-chat-container');
        if (restartContainer) restartContainer.style.display = 'none';
    };

    // 3. Send Reply
    window.sendReply = async () => {
        const input = document.getElementById('mainChatInput');
        const text = input.value.trim();
        const fileToSend = pendingChatFile;
        const typeToSend = pendingChatType;

        if (!text && !fileToSend) return;
        if (!activeChatId) return;

        const originalText = text;
        input.value = '';
        removeChatPreview();

        try {
            const timestampIso = new Date().toISOString();
            const timestampMs = Date.now();
            const normalizedEmail = activeChatId.trim().toLowerCase();
            const supabase = window.supabaseClient;
            if (!supabase) throw new Error("Supabase not initialized");

            // 1. Handle File/Image Send
            if (fileToSend) {
                let finalUrl = "";
                let finalName = fileToSend.name;
                if (typeToSend === 'image') {
                    finalUrl = await compressImage(fileToSend);
                } else {
                    const filePath = `chat_uploads/${normalizedEmail}/${Date.now()}_${fileToSend.name}`;
                    const { error } = await supabase.storage.from('chat_uploads').upload(filePath, fileToSend);
                    if (error) throw error;
                    const { data: { publicUrl } } = supabase.storage.from('chat_uploads').getPublicUrl(filePath);
                    finalUrl = publicUrl;
                }

                await supabase.from('chat_messages').insert({
                    id: crypto.randomUUID(),
                    chatId: normalizedEmail,
                    type: typeToSend,
                    fileUrl: finalUrl,
                    fileName: finalName,
                    sender: 'seller',
                    timestamp_ms: timestampMs,
                    isRead: false
                });

                await supabase.from('chats').update({
                    lastMessage: typeToSend === 'image' ? "📷 ส่งรูปภาพ" : "📁 ส่งไฟล์: " + finalName,
                    lastTimestamp: timestampIso,
                    unreadCount: 0
                }).eq('id', normalizedEmail);
            }

            // 2. Handle Text if exists
            if (originalText) {
                await supabase.from('chat_messages').insert({
                    id: crypto.randomUUID(),
                    chatId: normalizedEmail,
                    text: originalText,
                    sender: 'seller',
                    timestamp_ms: timestampMs,
                    type: 'text',
                    isRead: false
                });

                await supabase.from('chats').update({
                    lastMessage: originalText,
                    lastTimestamp: timestampIso,
                    unreadCount: 0
                }).eq('id', normalizedEmail);
            }

            // Ensure focus is kept
            input.focus();
            const msgsArea = document.getElementById('chatMessages');
            if (msgsArea) msgsArea.scrollTop = msgsArea.scrollHeight;

        } catch (err) {
            console.error("[SellerChat] Send Error:", err);
            input.value = originalText;
            alert("❌ ส่งไม่สำเร็จ: " + (err.message || "เกิดข้อผิดพลาด"));
        }
    };

    // 4. Product Picker Logic
    const MOCK_PRODUCTS_BASELINE = [
      // New Products
      { id: "new-iph15-128", name: "iPhone 15 128GB", price: 28900, brand: "Apple", category: "new", img: "", emoji: "📱", badge: "ใหม่", tags: ["iphone", "ไอโฟน", "apple", "แอปเปิล", "มือ1", "มือ 1", "a16"] },
      { id: "new-iph15pro-256", name: "iPhone 15 Pro 256GB", price: 42900, brand: "Apple", category: "new", img: "", emoji: "📱", badge: "ขายดี", tags: ["iphone", "ไอโฟน", "apple", "แอปเปิล", "มือ1", "มือ 1", "a17", "pro"] },
      { id: "new-s24-256", name: "Samsung Galaxy S24 256GB", price: 29900, brand: "Samsung", category: "new", img: "", emoji: "📲", badge: "AI", tags: ["samsung", "ซัมซุง", "galaxy", "s24", "มือ1", "มือ 1", "ai"] },
      { id: "new-xm14-256", name: "Xiaomi 14 256GB", price: 24900, brand: "Xiaomi", category: "new", img: "", emoji: "📲", badge: "Leica", tags: ["xiaomi", "เสียวหมี่", "leica", "มือ1", "มือ 1"] },
      
      // Used Products
      { id: "used-iph13-128", name: "iPhone 13 128GB (มือ 2)", price: 14900, brand: "Apple", category: "used", img: "", emoji: "📱", badge: "สภาพนางฟ้า", tags: ["iphone", "ไอโฟน", "apple", "มือสอง", "มือ2", "มือ 2"] },
      { id: "used-iph12-64", name: "iPhone 12 64GB (มือ 2)", price: 9900, brand: "Apple", category: "used", img: "", emoji: "📱", badge: "ราคาคุ้ม", tags: ["iphone", "ไอโฟน", "apple", "มือสอง", "มือ2", "มือ 2"] },
      { id: "used-s23-256", name: "Samsung Galaxy S23 256GB (มือ 2)", price: 16500, brand: "Samsung", category: "used", emoji: "📲", badge: "มือสอง", tags: ["samsung", "ซัมซุง", "galaxy", "s23", "มือสอง", "มือ2", "มือ 2"] },
      { id: "used-a54-128", name: "Samsung Galaxy A54 128GB (มือ 2)", price: 7900, brand: "Samsung", category: "used", emoji: "📲", badge: "มือสอง", tags: ["samsung", "ซัมซุง", "a54", "มือสอง", "มือ2", "มือ 2"] },
      { id: "used-reno8pro-256", name: "OPPO Reno 8 Pro 256GB (มือ 2)", price: 8500, brand: "OPPO", category: "used", emoji: "📲", badge: "มือสอง", tags: ["oppo", "ออปโป้", "reno", "มือสอง", "มือ2", "มือ 2"] },

      // Accessory
      { id: "acc-why-60w", name: "สายชาร์จ Why 60W Type C To C", price: 399, brand: "Why", category: "accessory", img: "Why 60W-1 Type C To C - 1.jpg", emoji: "🔌", badge: "ขายดี", tags: ["สายชาร์จ", "why", "60w", "type c", "ชาร์จเร็ว", "อุปกรณ์เสริม", "accessory"] },
      { id: "acc-why-20w", name: "ชุดชาร์จ Why 20W Type C To C", price: 599, brand: "Why", category: "accessory", img: "Why 20w-1.jpg", emoji: "🔌", tags: ["ชุดชาร์จ", "why", "20w", "type c", "อุปกรณ์เสริม", "accessory"] },
      { id: "acc-headphone-gallery", name: "หูฟัง Anidary ANT004", price: 699, brand: "Anidary", category: "accessory", img: "earphone-1.jpg", emoji: "🎧", tags: ["หูฟัง", "anidary", "earphone", "ant004", "อุปกรณ์เสริม", "accessory"] },
      { id: "acc-ans006-gallery", name: "ชุดชาร์จ Anidary ANS006", price: 599, brand: "Anidary", category: "accessory", img: "ANS006-1.jpg", emoji: "🔌", tags: ["ชุดชาร์จ", "anidary", "ans006", "อุปกรณ์เสริม", "accessory"] },
      { id: "acc-why-cable-1m", name: "สายชาร์จ Why USB 1.0M", price: 159, brand: "Why", category: "accessory", img: "Why-1.jpg", emoji: "🔌", tags: ["สายชาร์จ", "why", "usb", "1m", "micro", "lightning", "อุปกรณ์เสริม", "accessory"] },
      { id: "acc-anidary-anc001", name: "สายชาร์จ Anidary ANC001 USB to Lightning", price: 299, brand: "Anidary", category: "accessory", img: "USB-I 12W-1.jpg", emoji: "🔌", tags: ["สายชาร์จ", "anidary", "anc001", "lightning", "iphone", "อุปกรณ์เสริม", "accessory"] },
      { id: "acc-anidary-ctoc", name: "สายชาร์จ Anidary ANC007 Type C to C", price: 249, brand: "Anidary", category: "accessory", img: "Anidary Type c To c - 1.jpg", emoji: "🔌", tags: ["สายชาร์จ", "anidary", "anc007", "type c", "อุปกรณ์เสริม", "accessory"] },
      { id: "acc-anidary-ctoc-1baht", name: "สายชาร์จ Anidary ANC007 Type C to C (Promo 1฿)", price: 1, brand: "Anidary", category: "accessory", img: "Anidary Type c To c - 1.jpg", emoji: "🔌", badge: "โปรแรง", tags: ["สายชาร์จ", "anidary", "anc007", "โปรโมชั่น", "ราคาพิเศษ", "อุปกรณ์เสริม", "accessory"] }
    ];

    let allProducts = [];

    window.openProductPicker = async () => {
        if (!activeChatId) return;
        const modal = document.getElementById('productPickerModal');
        modal.style.display = 'flex';
        
        // Always refresh or load first time
        const grid = document.getElementById('pickerGrid');
        
        try {
            const supabase = window.supabaseClient;
            if (!supabase) throw new Error("Supabase not initialized");
            const { data, error } = await supabase.from('products').select('*');
            if (error) throw error;
            const firestoreProducts = data || [];
            
            // Merge logic (matches seller-products.js)
            const mergedMap = new Map();
            MOCK_PRODUCTS_BASELINE.forEach(p => mergedMap.set(p.id, p));
            firestoreProducts.forEach(p => mergedMap.set(p.id, p));
            
            allProducts = Array.from(mergedMap.values());
            renderPickerUI(allProducts);
        } catch (err) {
            console.error("[Picker] Load Error:", err);
            // Fallback to mock data if Firestore fails
            allProducts = [...MOCK_PRODUCTS_BASELINE];
            renderPickerUI(allProducts);
        }
    };

    window.closeProductPicker = () => {
        document.getElementById('productPickerModal').style.display = 'none';
    };

    window.filterPicker = () => {
        const searchQuery = document.getElementById('pickerSearchInput').value.toLowerCase();
        const catFilter = document.getElementById('pickerCatSelect').value;
        
        const filtered = allProducts.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(searchQuery);
            const matchesCat = catFilter === 'all' || p.category === catFilter;
            return matchesSearch && matchesCat;
        });
        
        renderPickerUI(filtered);
    };

    function renderPickerUI(products) {
        const grid = document.getElementById('pickerGrid');
        if (products.length === 0) {
            grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:40px; color:#999;">ไม่พบสินค้า</div>';
            return;
        }

        grid.innerHTML = products.map(p => {
            const hasImg = p.img || (p.images && p.images[0]);
            return `
                <div class="picker-item" onclick="sendSelectedProduct('${p.id}')">
                    ${hasImg ? 
                        `<img src="${hasImg}" class="picker-item-img">` : 
                        `<div class="picker-item-img" style="display:flex; align-items:center; justify-content:center; font-size:3rem; background:#f8fafc;">${p.emoji || '📦'}</div>`
                    }
                    <div class="picker-item-info">
                        <div class="picker-item-name">${p.name}</div>
                        <div class="picker-item-price">฿${p.price.toLocaleString()}</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    window.sendSelectedProduct = async (productId) => {
        const p = allProducts.find(item => item.id === productId);
        if (!p || !activeChatId) return;

        closeProductPicker();

        const cardData = {
            productId: p.id,
            category: p.category,
            title: p.name,
            price: "฿" + p.price.toLocaleString(),
            image: p.img || (p.images && p.images[0]) || p.emoji || 'logo.png',
            link: (p.category === 'new' || p.category === 'used' ? p.category + '-products.html' : p.category + '.html') + '?id=' + p.id
        };

        try {
            const timestampIso = new Date().toISOString();
            const timestampMs = Date.now();
            const supabase = window.supabaseClient;
            if (!supabase) throw new Error("Supabase not initialized");

            await supabase.from('chat_messages').insert({
                id: crypto.randomUUID(),
                chatId: activeChatId,
                text: "แนะนำสินค้าชิ้นนี้ครับ!",
                sender: 'seller',
                timestamp_ms: timestampMs,
                type: 'card',
                cardData: cardData,
                isRead: false
            });

            await supabase.from('chats').update({
                lastMessage: "ส่งข้อมูลสินค้า: " + p.name,
                lastTimestamp: timestampIso,
                unreadCount: 0
            }).eq('id', activeChatId);
        } catch (err) {
            console.error("[SellerChat] Error sending card:", err);
            alert("ส่งไม่สำเร็จ: " + err.message);
        }
    };

    // 5. Direct Init — No complex auth gating, just load chats
    function initSellerChat() {
        console.log("[SellerChat] initSellerChat() called");
        
        // Just call loadChatList directly - it handles its own db check
        try {
            loadChatList();
            console.log("[SellerChat] loadChatList() dispatched successfully");
        } catch (err) {
            console.error("[SellerChat] loadChatList() threw:", err);
        }

        // Handle URL deep-link (?id=email) for opening specific chat
        handleUrlDeepLink();
    }

    // Handle direct link to a specific chat (?id=email)
    function handleUrlDeepLink() {
        try {
            var urlParams = new URLSearchParams(window.location.search);
            var targetId = urlParams.get('id');
            if (targetId) {
                console.log("[SellerChat] Deep-link detected, opening chat:", targetId);
                setTimeout(function() {
                    openChat(targetId);
                    // Clean up URL to avoid re-opening on reload
                    window.history.replaceState({}, document.title, window.location.pathname);
                }, 300);
            }
        } catch(e) {
            console.warn("[SellerChat] Deep-link error:", e);
        }
    }
    window.handleUrlDeepLink = handleUrlDeepLink;

    window.sellerLogin = async () => {
        const supabase = window.supabaseClient;
        if (!supabase) return;
        const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
        if (error) {
            console.error("Login Error:", error);
            alert("Login Error: " + error.message);
        }
    };

    window.sellerLogout = async () => {
        localStorage.removeItem('paomobile_admin_active');
        const supabase = window.supabaseClient;
        if (supabase) await supabase.auth.signOut();
        window.location.reload();
    };

    window.handleFileUpload = async (input, type) => {
        const file = input.files[0];
        if (!file || !activeChatId) return;

        pendingChatFile = file;
        pendingChatType = type;

        const previewArea = document.getElementById('sellerChatPreview');
        const previewImg = document.getElementById('sellerPreviewImg');
        const previewName = document.getElementById('sellerPreviewName');

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
        input.value = '';
    };

    window.removeChatPreview = () => {
        pendingChatFile = null;
        pendingChatType = null;
        const previewArea = document.getElementById('sellerChatPreview');
        if (previewArea) {
            previewArea.style.display = 'none';
            document.getElementById('sellerPreviewImg').src = '';
        }
    };

    window.handleChatCardClick = async (productId, category, link) => {
        if (window.ProductDetail) {
            try {
                // 1. Try to find in UI cache first
                const cacheKeys = ['pao_cache_parts', 'pao_cache_accessories', 'pao_cache_new', 'pao_cache_used'];
                for (const key of cacheKeys) {
                    const cached = localStorage.getItem(key);
                    if (cached) {
                        const items = JSON.parse(cached);
                        const match = items.find(p => p.id === productId);
                        if (match) {
                            window.ProductDetail.open(match);
                            return;
                        }
                    }
                }

                // 2. Fallback: Fetch directly from Supabase for full data
                const supabase = window.supabaseClient;
                if (supabase) {
                    const { data, error } = await supabase.from('products').select('*').eq('id', productId).single();
                    if (data && !error) {
                        window.ProductDetail.open({ id: data.id, ...data });
                        return;
                    }
                }
            } catch (err) {
                console.warn("[ChatCard] Modal open failed, navigating:", err);
            }
        }
        // Final fallback: standard navigation
        window.open(link, '_blank');
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

    // Lightbox Modal Structure & Logic
    const overlay = document.createElement('div');
    overlay.id = 'sellerChatOverlay';
    overlay.className = 'img-overlay';
    overlay.onclick = (e) => { if(e.target === overlay) closeImgOverlay(); };
    overlay.innerHTML = `<span class="img-overlay-close" onclick="closeImgOverlay()">&times;</span><img id="sellerImgOverlaySrc" class="img-overlay-content">`;
    document.body.appendChild(overlay);

    window.openImageLarge = (url) => {
        document.getElementById('sellerImgOverlaySrc').src = url;
        document.getElementById('sellerChatOverlay').classList.add('active');
        document.body.style.overflow = 'hidden';
    };
    window.closeImgOverlay = () => {
        document.getElementById('sellerChatOverlay').classList.remove('active');
        document.body.style.overflow = '';
    };

    // --- Emoji Picker Logic (Seller Side) ---
    function renderEmojiPicker() {
        const picker = document.getElementById('emojiPicker');
        if (!picker) return;
        let html = '';
        for (let i = 1; i <= 16; i++) {
            html += `<div class="emoji-item-seller" onclick="sendEmojiSticker(${i})"><img src="${i}.png" alt="emoji"></div>`;
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
        if (!activeChatId) return;
        
        toggleEmojiPicker(); // Close picker

        try {
            const timestampIso = new Date().toISOString();
            const timestampMs = Date.now();
            const supabase = window.supabaseClient;
            if (!supabase) throw new Error("Supabase not initialized");

            await supabase.from('chat_messages').insert({
                id: crypto.randomUUID(),
                chatId: activeChatId,
                type: 'sticker',
                fileUrl: `${index}.png`,
                sender: 'seller',
                timestamp_ms: timestampMs,
                isRead: false
            });

            await supabase.from('chats').update({
                lastMessage: "✨ ส่งสติ๊กเกอร์",
                lastTimestamp: timestampIso,
                unreadCount: 0
            }).eq('id', activeChatId);
        } catch (err) {
            console.error("[SellerChat] Sticker Send Error:", err);
            alert("❌ ส่งสติ๊กเกอร์ไม่สำเร็จครับ");
        }
    };

    // Initialize — try immediately, the script loads after Firebase init in HTML
    try {
        console.log("[SellerChat] IIFE end reached, calling initSellerChat()");
        initSellerChat();
    } catch(initErr) {
        console.error("[SellerChat] CRITICAL: initSellerChat failed:", initErr);
    }
})();
