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
        const { data, error } = await getClient().from(this.col).select('*').eq('id', this.id).maybeSingle();
        if (error) {
            console.error(`[Supabase] getDoc Error (${this.col}/${this.id}):`, JSON.stringify(error));
            throw error;
        }
        if (!data) return { exists: false, data: () => null, id: this.id };
        return { exists: true, data: () => data, id: this.id };
    }
    async set(data, options = {}) {
        const cleanData = Object.fromEntries(Object.entries(data).filter(([_, v]) => v !== undefined));
        if (options.merge) return this.update(cleanData);
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
        const randId = Math.random().toString(36).substring(2, 9);
        const channel = getClient().channel(`public:${this.col}:${this.id}:${randId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: this.col, filter: `id=eq.${this.id}` }, payload => {
                this.get().then(snap => cb(snap)).catch(errCb || console.error);
            }).subscribe();
        return () => supabase.removeChannel(channel);
    }
}

class SupabaseCollectionRef {
    constructor(name) {
        this.originalName = name;
        this.name = name.replace(/\//g, '_'); // Fallback flattening
        this.queryOps = [];

        // Route chats subcollections to flat chat_messages table
        if (name.startsWith('chats/') && name.endsWith('/messages')) {
            const parts = name.split('/');
            this.name = 'chat_messages';
            this.queryOps.push({ type: 'where', field: 'chatId', op: '==', value: parts[1] });
        } else {
            this.name = name;
        }
    }
    where(field, op, value) {
        this.queryOps.push({ type: 'where', field, op, value });
        return this;
    }
    limit(n) {
        this.queryOps.push({ type: 'limit', value: n });
        return this;
    }
    orderBy(field, dir = 'asc') {
        this.queryOps.push({ type: 'orderBy', field, direction: dir });
        return this;
    }
    doc(id) {
        if (!id) {
            return new SupabaseDocRef(this.originalName, 'doc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9));
        }
        return new SupabaseDocRef(this.originalName, id);
    }
    async add(data) {
        const cleanData = Object.fromEntries(Object.entries(data).filter(([_, v]) => v !== undefined));
        
        if (!cleanData.id) {
            cleanData.id = 'doc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }

        // Auto-inject chatId if mapping to chat_messages
        if (this.originalName.startsWith('chats/') && this.originalName.endsWith('/messages')) {
            const parts = this.originalName.split('/');
            cleanData.chatId = parts[1];
        }

        const { data: result, error } = await getClient().from(this.name).insert([cleanData]).select().single();
        if (error) throw error;
        return new SupabaseDocRef(this.originalName, result.id);
    }
    async get() {
        let q = getClient().from(this.name).select('*');

        for (const op of this.queryOps) {
            if (op.type === 'where') {
                if (op.op === '==') q = q.eq(op.field, op.value);
                else if (op.op === '!=') q = q.neq(op.field, op.value);
                else if (op.op === '<') q = q.lt(op.field, op.value);
                else if (op.op === '<=') q = q.lte(op.field, op.value);
                else if (op.op === '>') q = q.gt(op.field, op.value);
                else if (op.op === '>=') q = q.gte(op.field, op.value);
                else if (op.op === 'array-contains') q = q.contains(op.field, [op.value]);
                else if (op.op === 'in') q = q.in(op.field, op.value);
            } else if (op.type === 'orderBy') {
                q = q.order(op.field, { ascending: op.direction === 'asc' });
            } else if (op.type === 'limit') {
                q = q.limit(op.value);
            }
        }

        const { data, error } = await q;
        if (error) {
            console.error(`[Supabase] getDocs Error (${this.name}):`, JSON.stringify(error));
            throw error;
        }

        const docs = data.map(d => ({
            id: d.id,
            data: () => {
                const out = { ...d };
                const dateFields = ['timestamp', 'created_at', 'lastTimestamp', 'lastMessageTime', 'lastSeen', 'createdAt', 'updatedAt'];
                dateFields.forEach(field => {
                    if (out[field] && typeof out[field] === 'string') {
                        const t = new Date(out[field]);
                        out[field] = { toDate: () => t, toMillis: () => t.getTime() };
                    }
                });
                return out;
            },
            ref: new SupabaseDocRef(this.originalName, d.id)
        }));

        return {
            empty: docs.length === 0,
            size: docs.length,
            docs: docs,
            forEach: function(cb) { this.docs.forEach(cb) }
        };
    }
    onSnapshot(cb, errCb) {
        let lastUpdatedAt = null;
        let lastCount = 0;

        const triggerFetch = () => {
            this.get().then(snap => {
                if (snap.docs.length > 0) {
                    const dates = snap.docs.map(d => new Date(d.data().updatedAt || d.data().created_at || 0).getTime());
                    lastUpdatedAt = Math.max(...dates.filter(t => !isNaN(t)));
                }
                lastCount = snap.docs.length;
                snap.docChanges = () => snap.docs.map(doc => ({ type: 'added', doc }));
                cb(snap);
            }).catch(errCb || console.error);
        };

        // Initial fetch
        triggerFetch();

        // Supabase Native Realtime (if enabled in Dashboard)
        const randId = Math.random().toString(36).substring(2, 9);
        const channel = getClient().channel(`public:${this.name}:${randId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: this.name }, payload => {
                triggerFetch();
            }).subscribe();

        // Auto-refresh ONLY every 2 minutes (120000ms) as a slow-fallback
        // DISABLED: This causes massive statement timeouts on Supabase Free Tier because updatedAt is not indexed!
        // We rely 100% on Supabase Realtime now.
            
        return () => {
            getClient().removeChannel(channel);
        };
    }
}

class SupabaseBatch {
    constructor() {
        this.ops = [];
    }
    set(docRef, data, options = {}) {
        this.ops.push({ type: options.merge ? 'update' : 'upsert', ref: docRef, data });
    }
    update(docRef, data) {
        this.ops.push({ type: 'update', ref: docRef, data });
    }
    delete(docRef) {
        this.ops.push({ type: 'delete', ref: docRef });
    }
    async commit() {
        // Execute sequentially to avoid RPC requirement
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

const signInWithEmailAndPassword = async (authObj, email, password) => {
    const { data, error } = await getClient().auth.signInWithPassword({ email, password });
    if (error) throw error;
    return { user: { uid: data.user.id, email: data.user.email } };
};

const createUserWithEmailAndPassword = async (authObj, email, password) => {
    const { data, error } = await getClient().auth.signUp({ email, password });
    if (error) throw error;
    return { user: { uid: data.user.id, email: data.user.email } };
};

const onAuthStateChanged = (authObj, callback) => {
    const buildUser = (session) => ({
        uid: session.user.id,
        email: session.user.email,
        displayName: session.user.user_metadata?.name || session.user.email.split("@")[0],
        photoURL: session.user.user_metadata?.avatar || "",
        emailVerified: !!session.user.email_confirmed_at,
        providerData: session.user.app_metadata?.providers?.map(p => ({ providerId: p + ".com" })) || []
    });

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
    currentUser: null,
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
                authMock.currentUser = { uid: session.user.id, email: session.user.email };
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

window.sendEmailVerification = async () => { console.log('[Supabase] Verification email is handled automatically by signUp.'); };
window.firebaseAuth = {
    signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut, sendPasswordResetEmail
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

