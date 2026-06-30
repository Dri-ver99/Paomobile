// Supabase is loaded via UMD script tag in HTML, so window.supabase is available.
// ----------------------------------------------------
// 1. SUPABASE INITIALIZATION
// ----------------------------------------------------
const supabaseUrl = 'https://ivnayulkvlxjnwfwjxmj.supabase.co';
const supabaseKey = 'sb_publishable_ZZPe_GiGq-5W780KOI64yg_zzsjWvq7';

window.getSupabaseClient = () => {
    if (window.supabaseClientInstance) return window.supabaseClientInstance;
    const sbLib = (typeof supabase !== 'undefined') ? supabase : window.supabase;
    if (!sbLib || !sbLib.createClient) { throw new Error("Supabase not found"); }
    window.supabaseClientInstance = sbLib.createClient(supabaseUrl, supabaseKey);
    window.supabase = window.supabaseClientInstance;
    return window.supabaseClientInstance;
};
const getClient = window.getSupabaseClient;
getClient(); // Initialize immediately!
const getClientOld = () => {
    if (window.supabaseClientInstance) return window.supabaseClientInstance;
    
    const sbLib = (typeof supabase !== 'undefined') ? supabase : window.supabase;
    if (!sbLib || !sbLib.createClient) {
        alert("Supabase library not loaded! Please check internet connection.");
        throw new Error("Supabase not found");
    }
    
    window.supabaseClientInstance = sbLib.createClient(supabaseUrl, supabaseKey);
    window.supabase = window.supabaseClientInstance;
    return window.supabaseClientInstance;
};

// ----------------------------------------------------
// 2. FIREBASE V8 FIRESTORE COMPATIBILITY LAYER
// ----------------------------------------------------

class SupabaseCollectionRef {
    constructor(name) {
        this.col = name;
        this.filters = [];
        this.orderByFields = [];
        this.limitCount = null;
    }
    doc(id) {
        return new SupabaseDocRef(this.col, id || Math.random().toString(36).substring(2, 15));
    }
    where(field, op, val) {
        this.filters.push({ field, op, val });
        return this;
    }
    orderBy(field, dir) {
        this.orderByFields.push({ field, dir });
        return this;
    }
    limit(n) {
        this.limitCount = n;
        return this;
    }
    async add(data) {
        const docRef = this.doc();
        await docRef.set(data);
        return docRef;
    }
        async get() {
        // Simple caching for large queries to save egress
        const cacheKey = this.col + '_' + JSON.stringify(this.filters) + '_' + JSON.stringify(this.orderByFields);
        
        try {
            let q = getClient().from(this.col).select('*');
            for (const f of this.filters) {
                if (f.op === '==') q = q.eq(f.field, f.val);
                else if (f.op === '>') q = q.gt(f.field, f.val);
                else if (f.op === '<') q = q.lt(f.field, f.val);
                else if (f.op === '>=') q = q.gte(f.field, f.val);
                else if (f.op === '<=') q = q.lte(f.field, f.val);
                else if (f.op === 'in') q = q.in(f.field, f.val);
                else if (f.op === 'array-contains') q = q.contains(f.field, [f.val]);
            }
            for (const o of this.orderByFields) {
                q = q.order(o.field, { ascending: o.dir !== 'desc' });
            }
            if (this.limitCount) q = q.limit(this.limitCount);

            const { data, error } = await q;
            if (error) throw error;

            // Save to memory cache (helps during single session navigation)
            window._dbCache = window._dbCache || {};
            window._dbCache[cacheKey] = data;

            return this._formatDocs(data);
        } catch (error) {
            console.warn("[Supabase] Query failed or Quota Exceeded. Attempting fallback...", error);
            
            // 1. Try memory cache
            if (window._dbCache && window._dbCache[cacheKey]) {
                return this._formatDocs(window._dbCache[cacheKey]);
            }
            
            // 2. Try FALLBACK_LIVE_DATA (for products)
            if (this.col === 'products' && window.FALLBACK_LIVE_DATA && window.FALLBACK_LIVE_DATA.value) {
                console.log("[Supabase] Using FALLBACK_LIVE_DATA for products.");
                let data = window.FALLBACK_LIVE_DATA.value;
                
                // Apply simple memory filters if needed (basic support)
                if (this.filters.length > 0) {
                    data = data.filter(item => {
                        return this.filters.every(f => {
                            if (f.op === '==') return item[f.field] === f.val;
                            return true; // Simplified for fallback
                        });
                    });
                }
                
                return this._formatDocs(data);
            }
            
            throw error;
        }
    }
    
    _formatDocs(data) {
        return {
            docs: (data || []).map(d => ({
                id: d.id,
                data: () => d,
                exists: true,
                ref: this.doc(d.id)
            })),
            empty: (data || []).length === 0,
            size: (data || []).length
        };
    }

    onSnapshot(cb, errCb) {
        this.get().then(snap => cb(snap)).catch(errCb || console.error);
        return () => {};
    }
}

class SupabaseDocRef {
    constructor(col, id) {
        this.originalCol = col;
        this.col = col;
        this.id = id;

        // Route chats subcollections to flat chat_messages table
        if (col.startsWith('chats/') && col.endsWith('/messages')) {
            this.col = 'chat_messages';
        }
    }
    collection(subcol) {
        return new SupabaseCollectionRef(this.originalCol + '/' + this.id + '/' + subcol);
    }
    async get() {
        // Simple caching for DocRef
        const cacheKey = this.col + '_' + this.id;
        try {
            const { data, error } = await getClient().from(this.col).select('*').eq('id', this.id).maybeSingle();
            if (error) throw error;
            
            if (data) {
                window._dbCache = window._dbCache || {};
                window._dbCache[cacheKey] = data;
            }
            if (!data) return { exists: false, data: () => null, id: this.id };
            return { exists: true, data: () => data, id: this.id };
        } catch (error) {
            console.warn("[Supabase] getDoc Error fallback:", error);
            if (window._dbCache && window._dbCache[cacheKey]) {
                return { exists: true, data: () => window._dbCache[cacheKey], id: this.id };
            }
            if (this.col === 'products' && window.FALLBACK_LIVE_DATA && window.FALLBACK_LIVE_DATA.value) {
                const item = window.FALLBACK_LIVE_DATA.value.find(p => p.id === this.id);
                if (item) return { exists: true, data: () => item, id: this.id };
            }
            return { exists: false, data: () => null, id: this.id };
        }
    }
    async set(data, options = {}) {
        const cleanData = Object.fromEntries(Object.entries(data).filter(([_, v]) => v !== undefined));
        const { error } = await getClient().from(this.col).upsert({ id: this.id, ...cleanData });
        if (error) throw error;
    }
    async update(data) {
        const cleanData = Object.fromEntries(Object.entries(data).filter(([_, v]) => v !== undefined));
        const { error } = await getClient().from(this.col).update(cleanData).eq('id', this.id);
        if (error) throw error;
    }
    async delete() {
        const { error } = await getClient().from(this.col).delete().eq('id', this.id);
        if (error) throw error;
    }
    onSnapshot(cb, errCb) {
        this.get().then(snap => cb(snap)).catch(errCb || console.error);
        return () => {};
    }
}

class SupabaseBatch {
    constructor() { this.ops = []; }
    set(docRef, data) { this.ops.push({ type: 'set', ref: docRef, data }); }
    update(docRef, data) { this.ops.push({ type: 'update', ref: docRef, data }); }
    delete(docRef) { this.ops.push({ type: 'delete', ref: docRef }); }
    async commit() {
        for (const op of this.ops) {
            try {
                if (op.type === 'delete') await op.ref.delete();
                else if (op.type === 'update') await op.ref.update(op.data);
                else await op.ref.set(op.data);
            } catch (e) {
                console.error("[Supabase Batch] Error committing op:", op, e);
            }
        }
    }
}

// ----------------------------------------------------
// 3. FIREBASE AUTH COMPATIBILITY LAYER
// ----------------------------------------------------
const buildUser = (session) => {
    if (!session || !session.user) return null;
    return {
        uid: session.user.id,
        email: session.user.email,
        displayName: session.user.user_metadata?.name || session.user.email.split("@")[0],
        photoURL: session.user.user_metadata?.avatar || "",
        emailVerified: !!session.user.email_confirmed_at,
        providerData: session.user.app_metadata?.providers?.map(p => ({ providerId: p + ".com" })) || []
    };
};

const signInWithEmailAndPassword = async (authObj, email, password) => {
    const { data, error } = await getClient().auth.signInWithPassword({ email, password });
    if (error) throw error;
    const u = data.user;
    return { user: {
        uid: u.id,
        email: u.email,
        displayName: u.user_metadata?.name || u.email.split("@")[0],
        photoURL: u.user_metadata?.avatar || "",
        emailVerified: !!u.email_confirmed_at,
        providerData: u.app_metadata?.providers?.map(p => ({ providerId: p + ".com" })) || []
    }};
};

const createUserWithEmailAndPassword = async (authObj, email, password) => {
    const { data, error } = await getClient().auth.signUp({ email, password });
    if (error) throw error;
    const u = data.user;
    return { user: {
        uid: u.id,
        email: u.email,
        displayName: u.user_metadata?.name || u.email.split("@")[0],
        photoURL: u.user_metadata?.avatar || "",
        emailVerified: !!u.email_confirmed_at,
        providerData: u.app_metadata?.providers?.map(p => ({ providerId: p + ".com" })) || []
    }};
};

const onAuthStateChanged = (authObj, callback) => {
    getClient().auth.getSession().then(({ data: { session } }) => {
        if (session) {
            callback(buildUser(session));
        } else {
            try {
                const lsUser = JSON.parse(localStorage.getItem('paomobile_user'));
                if (lsUser && lsUser.uid) { callback(lsUser); return; }
            } catch (e) {}
            callback(null);
        }
    });

    const { data: authListener } = getClient().auth.onAuthStateChange((event, session) => {
        if (session) {
            callback(buildUser(session));
        } else {
            try {
                const lsUser = JSON.parse(localStorage.getItem('paomobile_user'));
                if (lsUser && lsUser.uid) { callback(lsUser); return; }
            } catch (e) {}
            callback(null);
        }
    });

    return () => authListener.subscription.unsubscribe();
};

const signOut = async (authObj) => {
    localStorage.removeItem('paomobile_user');
    const { error } = await getClient().auth.signOut();
    if (error) throw error;
};

const sendPasswordResetEmail = async (authObj, email) => {
    const { error } = await getClient().auth.resetPasswordForEmail(email);
    if (error) throw error;
};

// ----------------------------------------------------
// 4. EXPORT TO GLOBAL SCOPE
// ----------------------------------------------------

const authMock = { 
    _currentUser: null,
    get currentUser() {
        if (this._currentUser) return this._currentUser;
        const localAdminActive = localStorage.getItem('paomobile_admin_active') === 'true';
        if (localAdminActive) {
            return { uid: 'admin-bypass', email: 'sattawat2560@gmail.com' };
        }
        try {
            const lsUser = JSON.parse(localStorage.getItem('paomobile_user'));
            if (lsUser && lsUser.uid) return lsUser;
        } catch(e) {}
        return null;
    },
    set currentUser(val) {
        this._currentUser = val;
    },
    onAuthStateChanged: (callback) => {
        return onAuthStateChanged(null, callback);
    },
    signInAnonymously: async () => {
        const { data, error } = await getClient().auth.signInAnonymously();
        if (error) throw error;
        return { user: { uid: data.user.id } };
    }
};

// Keep currentUser updated lazily after page load
window.addEventListener('DOMContentLoaded', () => {
    try {
        getClient().auth.onAuthStateChange((event, session) => {
            if (session) {
                authMock.currentUser = buildUser(session);
            } else {
                authMock.currentUser = null;
            }
        });
    } catch (e) {
        console.warn("Failed to initialize auth listener:", e);
    }
});

window.db = {
    collection: (name) => new SupabaseCollectionRef(name),
    batch: () => new SupabaseBatch(),
    runTransaction: async (callback) => {
        const transaction = {
            get: async (ref) => await ref.get(),
            set: (ref, data) => ref.set(data),
            update: (ref, data) => ref.update(data),
            delete: (ref) => ref.delete()
        };
        return await callback(transaction);
    }
};

window.auth = authMock;

window.sendEmailVerification = async (user) => {
    const email = user?.email || authMock.currentUser?.email;
    if (!email) return Promise.resolve();
    try {
        const { error } = await getClient().auth.resend({
            type: 'signup',
            email: email,
            options: {
                emailRedirectTo: window.location.origin + '/login.html'
            }
        });
        if (error) console.warn("[Supabase] sendEmailVerification resend error:", error.message);
    } catch (err) {
        console.warn("[Supabase] sendEmailVerification failed:", err);
    }
    return Promise.resolve();
};

window.sendVerificationEmail = async () => {
    const email = authMock.currentUser?.email;
    if (!email) {
        alert("ไม่พบข้อมูลอีเมลสำหรับส่งลิงก์ยืนยันตัวตนครับ");
        return;
    }
    try {
        const { error } = await getClient().auth.resend({
            type: 'signup',
            email: email,
            options: {
                emailRedirectTo: window.location.origin + '/login.html'
            }
        });
        if (error) throw error;
        alert("ส่งอีเมลยืนยันตัวตนใหม่สำเร็จเรียบร้อยแล้วค่ะ! กรุณาตรวจสอบในกล่องข้อความหรือกล่องจดหมายขยะ (Spam/Junk) นะคะ");
    } catch (err) {
        console.error("Resend error:", err);
        alert("ส่งอีเมลยืนยันไม่สำเร็จ: " + err.message);
    }
};

window.firebaseAuth = {
    signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut, sendPasswordResetEmail,
    sendEmailVerification: window.sendEmailVerification
};

const firestoreMock = () => window.db;
firestoreMock.FieldValue = {
    serverTimestamp: () => new Date().toISOString(),
    increment: (n) => n
};

// Global Firebase Mock so inline scripts don't fail
window.firebase = {
    apps: [{ name: '[DEFAULT]' }],
    initializeApp: () => {},
    firestore: firestoreMock,
    auth: () => window.auth,
    storage: () => window.storage || {},
    analytics: () => ({})
};

// Mock enableIndexedDbPersistence which is used in seller-centre.html
window.db.enablePersistence = async () => {};
window.db.enableIndexedDbPersistence = async () => {};

console.log("Supabase V8 Compatibility Layer Initialized");


