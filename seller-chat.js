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
            /* Removed drop-shadow to eliminate unwanted background tint */
        }
        .sticker-img:hover { transform: scale(1.05); }
        @keyframes chatFadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        
        /* Preview UI (Seller Side) */
        .preview-container-seller { display:none; padding:12px 16px; background:#fff; border-top:1px solid #f1f5f9; align-items:center; gap:12px; }
        .preview-thumb-seller { width:52px; height:52px; border-radius:8px; object-fit:cover; border:2px solid #ee4d2d; }
        .preview-remove-seller { cursor:pointer; color:#94a3b8; font-size:1.2rem; transition:color 0.2s; padding:4px; }
        .preview-remove-seller:hover { color:#ef4444; }
    `;
    document.head.appendChild(style);
    
    let activeChatId = null;
    let messagesUnsubscribe = null;
    let allChats = []; // Global cache for chat list filtering
    let pendingChatFile = null;
    let pendingChatType = null;

    // 6. Seller Online Heartbeat Logic
    function startHeartbeat() {
        if (typeof db === 'undefined') return;
        
        const updateStatus = () => {
            db.collection('status').doc('seller').set({
                lastSeen: firebase.firestore.FieldValue.serverTimestamp(),
                isOnline: true
            }, { merge: true }).catch(err => console.error("[Heartbeat] Error:", err));
        };

        // Initial update
        updateStatus();
        
        // Periodic update every 30 seconds
        setInterval(updateStatus, 30000);
    }

    // Call it after initialization
    startHeartbeat();

    // 1. Load Chat List (Real-time)
    function loadChatList() {
        db.collection('chats')
            .orderBy('lastTimestamp', 'desc')
            .onSnapshot(snapshot => {
                allChats = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                renderChatList();
            });
    }

    // New: Unified rendering with search and filter
    window.renderChatList = () => {
        const chatListArea = document.getElementById('chatList');
        const searchQuery = document.getElementById('chatSearchInput')?.value.toLowerCase() || "";
        const filterStatus = document.getElementById('chatFilterSelect')?.value || "all";

        if (allChats.length === 0) {
            chatListArea.innerHTML = '<div style="text-align: center; padding: 60px 40px; color: #666; font-size: 1rem; font-weight: 500;">🔔 ยังไม่มีบทสนทนาในขณะนี้</div>';
            return;
        }

        const filtered = allChats.filter(chat => {
            const matchesSearch = (chat.userName || "").toLowerCase().includes(searchQuery);
            const matchesFilter = filterStatus === 'all' || (filterStatus === 'unread' && chat.unreadCount > 0);
            return matchesSearch && matchesFilter;
        });

        if (filtered.length === 0) {
            chatListArea.innerHTML = `<div style="text-align: center; padding: 40px; color: #999;">ไม่พบแชทที่ตรงตามเงื่อนไข</div>`;
            return;
        }

        let html = '';
        filtered.forEach(chat => {
            const isActive = chat.id === activeChatId;
            const lastTime = chat.lastTimestamp ? chat.lastTimestamp.toDate() : new Date(0);
            
            // Check Online Status (within 2 mins)
            const lastSeen = chat.lastSeen ? chat.lastSeen.toDate() : lastTime;
            const now = new Date();
            const isOnline = (now - lastSeen) < 120000; // 2 minutes window

            const isClosed = (new Date() - lastTime) > 86400000;
            const time = chat.lastTimestamp ? formatChatTime(lastTime) : '';
            const initial = chat.userName ? chat.userName.charAt(0).toUpperCase() : '?';
            const avatarHtml = chat.userAvatar 
                ? `<img src="${chat.userAvatar}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">` 
                : `<span>${initial}</span>`;
            
            html += `
                <div class="chat-item ${isActive ? 'active' : ''}" onclick="openChat('${chat.id}')">
                    <div class="chat-item-avatar">
                        ${avatarHtml}
                        <div class="online-dot ${isOnline ? '' : 'offline'}"></div>
                    </div>
                    <div class="chat-item-content">
                        <div class="chat-item-header">
                            <div class="chat-item-name">${chat.userName || 'ลูกค้าใหม่'}</div>
                            <div class="chat-item-time">${time}</div>
                        </div>
                        <div class="chat-item-snippet">${chat.lastMessage || 'ส่งรูปภาพ/การ์ด'}</div>
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:5px;">
                            ${chat.unreadCount > 0 ? `<div class="unread-badge">${chat.unreadCount}</div>` : '<div></div>'}
                            ${isClosed ? '<div class="status-badge closed">ปิด</div>' : '<div class="status-badge">วันนี้</div>'}
                        </div>
                    </div>
                </div>
            `;
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
        if (activeChatId === chatId) return;
        activeChatId = chatId;
        
        const chatDoc = await db.collection('chats').doc(chatId).get();
        const chatData = chatDoc.data();
        const initial = chatData.userName ? chatData.userName.charAt(0).toUpperCase() : chatId.charAt(0).toUpperCase();
        const avatarHtml = chatData.userAvatar 
            ? `<img src="${chatData.userAvatar}" style="width:100%; height:100%; object-fit:cover;">` 
            : `<span style="color:white;">${initial}</span>`;
        
        const chatMain = document.getElementById('chatMain');
        chatMain.innerHTML = `
            <div class="chat-header-shopee">
                <div style="display:flex; align-items:center;">
                    <div class="btn-back-chat" onclick="closeMobileChat()">⬅️</div>
                    <div class="header-user-info">
                        <div class="header-user-avatar" style="overflow:hidden;">${avatarHtml}</div>
                        <div class="header-user-name">${chatData.userName || chatId} <span style="font-size:0.8rem; color:#aaa;">∨</span></div>
                    </div>
                </div>
                <div style="display:flex; gap:15px; align-items:center;">
                    <button onclick="openProductPicker()" style="background:#f1f5f9; border:none; padding:6px 12px; border-radius:4px; font-size:0.8rem; cursor:pointer; font-weight:500; color:#555;">🎁 ส่งสินค้า</button>
                    <span style="font-size:1.2rem; color:#ccc; cursor:pointer;" onclick="location.reload()">✕</span>
                </div>
            </div>
            <div id="chatMessages" class="messages-container">
                <div style="text-align:center; padding:40px; color:#94a3b8;">กำลังโหลดข้อความ...</div>
            </div>
            
            <!-- File Preview Area (Seller Side) -->
            <div id="sellerChatPreview" class="preview-container-seller">
                <img id="sellerPreviewImg" class="preview-thumb-seller" src="">
                <div style="flex:1; min-width:0;">
                    <div id="sellerPreviewName" style="font-size:0.85rem; font-weight:600; color:#1e293b; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">filename.jpg</div>
                    <div style="font-size:0.75rem; color:#94a3b8;">เตรียมส่งรูปภาพ...</div>
                </div>
                <div class="preview-remove-seller" onclick="removeChatPreview()">✕</div>
            </div>

            <div id="chatFooter" class="chat-footer">
                <div class="input-tools" style="position:relative;">
                    <span style="cursor:pointer;" onclick="toggleEmojiPicker()" title="อีโมจิ">😊</span>
                    <label for="sellerFileUpload" style="cursor:pointer;" title="ส่งรูปภาพ">🖼️</label>
                    <input type="file" id="sellerFileUpload" accept="image/*" style="display:none;" onchange="handleFileUpload(this, 'image')">
                    <!-- Emoji Picker Grid -->
                    <div id="emojiPicker" class="emoji-picker-seller"></div>
                </div>
                <div class="input-row">
                    <div class="input-box-wrapper">
                        <textarea id="mainChatInput" class="chat-input-area" placeholder="พิมพ์ข้อความตอบกลับ..." onkeypress="handleKeyPress(event)"></textarea>
                    </div>
                    <button class="btn-shopee-send" onclick="sendReply()">ส่ง</button>
                </div>
            </div>
        `;

        // v1.8.0 - Mobile Transition
        const layout = document.querySelector('.chat-layout');
        if (layout) layout.classList.add('show-chat');

        // Mark as Read
        db.collection('chats').doc(chatId).update({ unreadCount: 0 }).catch(e => console.warn("[SellerChat] Unread update failed:", e));

        // Load Messages
        if (messagesUnsubscribe) messagesUnsubscribe();
        
        const msgsArea = document.getElementById('chatMessages');
        messagesUnsubscribe = db.collection('chats').doc(chatId).collection('messages')
            .orderBy('timestamp', 'asc')
            .onSnapshot(snapshot => {
                if (snapshot.empty) {
                    msgsArea.innerHTML = '<div style="text-align:center; padding:60px 20px; color:#94a3b8; font-size:0.9rem;">👋 เริ่มการสนทนากับลูกค้าได้เลยครับ<br><span style="font-size:0.8rem; opacity:0.7;">(หากลูกค้าส่งข้อความมา จะแสดงที่นี่ทันที)</span></div>';
                    return;
                }

                let html = '';
                let lastDate = "";
                
                // Add Auto-close visual simulation (if last msg > 24h)
                const lastMsgDoc = snapshot.docs[snapshot.size - 1];
                const lastMsg = lastMsgDoc ? lastMsgDoc.data() : null;
                const lastTime = lastMsg && lastMsg.timestamp ? lastMsg.timestamp.toDate() : new Date();
                const isRecentlyClosed = (new Date() - lastTime) > 86400000;

                snapshot.forEach(doc => {
                    const msg = doc.data();
                    const isSeller = msg.sender === 'seller';
                    const msgDate = msg.timestamp ? new Date(msg.timestamp.toDate()).toLocaleDateString() : "";

                    if (msgDate !== lastDate && msgDate !== "") {
                        html += `<div class="system-banner">${msgDate}</div>`;
                        lastDate = msgDate;
                    }

                    if (msg.type === 'card') {
                        html += `
                            <div class="msg-row seller">
                                <div class="chat-card" onclick="handleChatCardClick('${msg.cardData.productId}', '${msg.cardData.category}', '${msg.cardData.link}')">
                                    <img src="${msg.cardData.image}" class="chat-card-img">
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
                            <div class="msg-row ${isSeller ? 'seller' : 'customer'}">
                                <div class="msg-bubble image-bubble">
                                    <img src="${msg.fileUrl}" class="chat-img-thumb" title="คลิกเพื่อขยาย" onclick="openImageLarge('${msg.fileUrl}')">
                                </div>
                                <div class="msg-meta">
                                    ${msg.timestamp ? new Date(msg.timestamp.toDate()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                                    ${isSeller ? '<span class="read-tick">✓✓</span>' : ''}
                                </div>
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
                                <div class="msg-meta">
                                    ${msg.timestamp ? new Date(msg.timestamp.toDate()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                                    ${isSeller ? '<span class="read-tick">✓✓</span>' : ''}
                                </div>
                            </div>
                        `;
                    } else if (msg.type === 'sticker') {
                        html += `
                            <div class="msg-row ${isSeller ? 'seller' : 'customer'} sticker">
                                <div class="msg-bubble">
                                    <img src="${msg.fileUrl}" class="sticker-img" onclick="openImageLarge('${msg.fileUrl}')">
                                </div>
                                <div class="msg-meta">
                                    ${msg.timestamp ? new Date(msg.timestamp.toDate()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                                    ${isSeller ? '<span class="read-tick">✓✓</span>' : ''}
                                </div>
                            </div>
                        `;
                    } else if (msg.type === 'text' || msg.text) {
                        html += `
                            <div class="msg-row ${isSeller ? 'seller' : 'customer'}">
                                <div class="msg-bubble">
                                    ${msg.text}
                                </div>
                                <div class="msg-meta">
                                    ${msg.timestamp ? new Date(msg.timestamp.toDate()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                                    ${isSeller ? '<span class="read-tick">✓✓</span>' : ''}
                                </div>
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
            }, err => {
                console.error("[SellerChat] Sync Error:", err);
                msgsArea.innerHTML = `<div style="text-align:center; padding:40px; color:#ef4444; font-size:0.9rem;">🚨 ข้อผิดพลาด: ${err.message}<br><span style="font-size:0.8rem;">กรุณาตรวจสอบสิทธิ์การเข้าถึงข้อมูล (Security Rules)</span></div>`;
            });
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
        input.disabled = true;
        removeChatPreview();

        try {
            const timestamp = firebase.firestore.FieldValue.serverTimestamp();
            const normalizedEmail = activeChatId.trim().toLowerCase();

            // 1. Handle File/Image Send (Base64 Reliable Mode)
            if (fileToSend) {
                let finalUrl = "";
                let finalName = fileToSend.name;
                if (typeToSend === 'image') {
                    finalUrl = await compressImage(fileToSend);
                } else {
                    // Non-image files use storage
                    if (typeof firebase.storage !== 'function') throw new Error("Storage not available");
                    const storageRef = firebase.storage().ref(`chat_uploads/${normalizedEmail}/${Date.now()}_${fileToSend.name}`);
                    const uploadTask = await storageRef.put(fileToSend);
                    finalUrl = await uploadTask.ref.getDownloadURL();
                }

                await db.collection('chats').doc(normalizedEmail).collection('messages').add({
                    type: typeToSend,
                    fileUrl: finalUrl,
                    fileName: finalName,
                    sender: 'seller',
                    timestamp: timestamp
                });

                await db.collection('chats').doc(normalizedEmail).set({
                    lastMessage: typeToSend === 'image' ? "📷 ส่งรูปภาพ" : "📁 ส่งไฟล์: " + finalName,
                    lastTimestamp: timestamp,
                    unreadCount: 0
                }, { merge: true });
            }

            // 2. Handle Text if exists
            if (originalText) {
                await db.collection('chats').doc(normalizedEmail).collection('messages').add({
                    text: originalText,
                    sender: 'seller',
                    timestamp: timestamp,
                    type: 'text'
                });

                await db.collection('chats').doc(normalizedEmail).set({
                    lastMessage: originalText,
                    lastTimestamp: timestamp,
                    unreadCount: 0
                }, { merge: true });
            }

            input.disabled = false;
            input.focus();
            const msgsArea = document.getElementById('chatMessages');
            if (msgsArea) msgsArea.scrollTop = msgsArea.scrollHeight;

        } catch (err) {
            console.error("[SellerChat] Send Error:", err);
            input.value = originalText;
            input.disabled = false;
            alert("❌ ส่งไม่สำเร็จ: " + (err.message || "เกิดข้อผิดพลาด"));
        }
    };

    // 4. Product Picker Logic
    const MOCK_PRODUCTS_BASELINE = [
        { id: "new-iph15-128", name: "iPhone 15 128GB", price: 28900, brand: "Apple", category: "new", emoji: "📱", specs: "หน้าจอ 6.1\" · ชิป A16 · รับประกัน 1 ปี", badge: "ใหม่" },
        { id: "new-iph15pro-256", name: "iPhone 15 Pro 256GB", price: 42900, brand: "Apple", category: "new", emoji: "📱", specs: "หน้าจอ 6.1\" · ชิป A17 Pro · ไทเทเนียม", badge: "ขายดี" },
        { id: "new-s24-256", name: "Samsung Galaxy S24 256GB", price: 29900, brand: "Samsung", category: "new", emoji: "📲", specs: "หน้าจอ 6.2\" · Snapdragon 8 Gen 3 · AI", badge: "ใหม่" },
        { id: "new-xm14-256", name: "Xiaomi 14 256GB", price: 24900, brand: "Xiaomi", category: "new", emoji: "📲", specs: "หน้าจอ 6.36\" · Snapdragon 8 Gen 3 · Leica", badge: "" },
        { id: "used-iph13-128", name: "iPhone 13 128GB (มือ 2)", price: 14900, brand: "Apple", category: "used", emoji: "📱", specs: "สภาพ 90% · แบต 88% · รับประกัน 3 เดือน", badge: "มือ 2" },
        { id: "used-iph12-64", name: "iPhone 12 64GB (มือ 2)", price: 9900, brand: "Apple", category: "used", emoji: "📱", specs: "สภาพ 85% · แบต 82% · รับประกัน 3 เดือน", badge: "มือ 2" },
        { id: "used-s23-256", name: "Samsung Galaxy S23 256GB (มือ 2)", price: 16500, brand: "Samsung", category: "used", emoji: "📲", specs: "สภาพ 92% · แบต 90% · รับประกัน 3 เดือน", badge: "มือ 2" },
        { id: "used-a54-128", name: "Samsung Galaxy A54 128GB (มือ 2)", price: 7900, brand: "Samsung", category: "used", emoji: "📲", specs: "สภาพ 88% · แบต 85% · รับประกัน 3 เดือน", badge: "มือ 2" },
        { id: "used-reno8pro-256", name: "OPPO Reno 8 Pro 256GB (มือ 2)", price: 8500, brand: "OPPO", category: "used", emoji: "📲", specs: "สภาพ 87% · แบต 83% · รับประกัน 3 เดือน", badge: "มือ 2" },
        { id: "acc-why-60w", name: "สายชาร์จ Why 60W Type C To C", price: 399, brand: "Why", category: "accessory", emoji: "🔌", img: "Why 60W-1 Type C To C - 1.jpg", badge: "ใหม่" },
        { id: "acc-why-20w", name: "ชุดชาร์จ Why 20W Type C To C", price: 599, brand: "Why", category: "accessory", emoji: "🔌", img: "Why 20w-1.jpg", badge: "ใหม่" },
        { id: "acc-headphone-gallery", name: "หูฟัง Anidary ANT004", price: 699, brand: "Anidary", category: "accessory", emoji: "🎧", img: "earphone-1.jpg", badge: "" },
        { id: "acc-ans006-gallery", name: "ชุดชาร์จ Anidary ANS006", price: 599, brand: "Anidary", category: "accessory", emoji: "🔌", img: "ANS006-1.jpg", badge: "" },
        { id: "acc-why-cable-1m", name: "สายชาร์จ Why USB 1.0M", price: 159, brand: "Why", category: "accessory", emoji: "🔌", img: "Why-1.jpg", badge: "" },
        { id: "acc-anidary-anc001", name: "สายชาร์จ Anidary ANC001 USB to Lightning", price: 299, brand: "Anidary", category: "accessory", emoji: "🔌", img: "USB-I 12W-1.jpg", badge: "" },
        { id: "acc-anidary-ctoc", name: "สายชาร์จ Anidary ANC007 Type C to C", price: 249, brand: "Anidary", category: "accessory", emoji: "🔌", img: "Anidary Type c To c - 1.jpg", badge: "" },
        { id: "acc-anidary-ctoc-1baht", name: "สายชาร์จ Anidary ANC007 Type C to C (Promo 1฿)", price: 1, brand: "Anidary", category: "accessory", emoji: "🔌", img: "Anidary Type c To c - 1.jpg", badge: "โปรโมชั่น 1฿" },
    ];

    let allProducts = [];

    window.openProductPicker = async () => {
        if (!activeChatId) return;
        const modal = document.getElementById('productPickerModal');
        modal.style.display = 'flex';
        
        // Always refresh or load first time
        const grid = document.getElementById('pickerGrid');
        
        try {
            const snapshot = await db.collection('products').get();
            const firestoreProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
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
            const timestamp = firebase.firestore.FieldValue.serverTimestamp();
            await db.collection('chats').doc(activeChatId).collection('messages').add({
                text: "แนะนำสินค้าชิ้นนี้ครับ!",
                sender: 'seller',
                timestamp: timestamp,
                type: 'card',
                cardData: cardData
            });

            await db.collection('chats').doc(activeChatId).update({
                lastMessage: "ส่งข้อมูลสินค้า: " + p.name,
                lastTimestamp: timestamp,
                unreadCount: 0
            });
        } catch (err) {
            console.error("[SellerChat] Error sending card:", err);
            alert("ส่งไม่สำเร็จ: " + err.message);
        }
    };

    // 5. Auth Strategy & Init
    async function initSellerChat() {
        if (!window.db) {
            console.error("Firebase DB not found.");
            return;
        }

        // 1. Ensure Auth
        firebase.auth().onAuthStateChanged(async user => {
            if (user) {
                console.log("[Auth] Seller identified:", user.uid);
                loadChatList();
                
                // v1.7.1 - Auto-open chat from URL parameter (e.g., from Orders page)
                const urlParams = new URLSearchParams(window.location.search);
                const chatIdFromUrl = urlParams.get('id');
                if (chatIdFromUrl) {
                    console.log("[SellerChat] Auto-opening chat from URL:", chatIdFromUrl);
                    // Small delay to ensure DB/UI is ready
                    setTimeout(() => {
                        window.openChat(chatIdFromUrl);
                    }, 500);
                }
            } else {
                console.log("[Auth] Attempting anonymous login...");
                firebase.auth().signInAnonymously().catch(e => {
                    console.error("Auth Failed:", e);
                    document.getElementById('chatList').innerHTML = '<div style="padding:20px; color:red;">ล็อกอินไม่สำเร็จ: ' + e.message + '</div>';
                });
            }
        });
    }

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

                // 2. Fallback: Fetch directly from Firestore for full data
                const doc = await db.collection('products').doc(productId).get();
                if (doc.exists) {
                    window.ProductDetail.open({ id: doc.id, ...doc.data() });
                    return;
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
            const timestamp = firebase.firestore.FieldValue.serverTimestamp();
            await db.collection('chats').doc(activeChatId).collection('messages').add({
                type: 'sticker',
                fileUrl: `${index}.png`,
                sender: 'seller',
                timestamp: timestamp
            });

            await db.collection('chats').doc(activeChatId).update({
                lastMessage: "✨ ส่งสติ๊กเกอร์",
                lastTimestamp: timestamp,
                unreadCount: 0
            });
        } catch (err) {
            console.error("[SellerChat] Sticker Send Error:", err);
            alert("❌ ส่งสติ๊กเกอร์ไม่สำเร็จครับ");
        }
    };

    // Initialize only after Firebase setup in HTML is done
    if (document.readyState === 'loading') {
        window.addEventListener('DOMContentLoaded', initSellerChat);
    } else {
        initSellerChat();
    }
})();
