import sys
content = open('db.js', 'r', encoding='utf-8').read()
start_marker = 'class SupabaseCollection'
end_marker = 'class SupabaseBatch'
start = content.find(start_marker)
end = content.find(end_marker)
if start != -1 and end != -1:
    new_class = '''class SupabaseCollection {
    constructor(name) {
        this.originalName = name;
        this.name = name.replace(/\\//g, '_');
        this.queryOps = [];
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
        if (this.originalName.startsWith('chats/') && this.originalName.endsWith('/messages')) {
            const parts = this.originalName.split('/');
            cleanData.chatId = parts[1];
        }
        const { data: result, error } = await getClient().from(this.name).insert([cleanData]).select().single();
        if (error) throw error;
        return new SupabaseDocRef(this.originalName, result.id);
    }
    async get() {
        let selectStr = '*';
        let q = getClient().from(this.name).select(selectStr);
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
        triggerFetch();
        const randId = Math.random().toString(36).substring(2, 9);
        const channel = getClient().channel(`public:${this.name}:${randId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: this.name }, payload => {
                triggerFetch();
            }).subscribe();
        const pollTimer = setInterval(async () => {
            try {
                const { count } = await getClient().from(this.name).select('*', { count: 'estimated', head: true });
                const { data } = await getClient().from(this.name).select('updatedAt, created_at').order('updatedAt', { ascending: false }).limit(1);
                let latestDate = lastUpdatedAt;
                if (data && data.length > 0) {
                    latestDate = new Date(data[0].updatedAt || data[0].created_at || 0).getTime();
                }
                if (count !== lastCount || (latestDate && lastUpdatedAt && latestDate > lastUpdatedAt)) {
                    triggerFetch();
                }
            } catch (e) {}
        }, 120000);
        return () => {
            getClient().removeChannel(channel);
            clearInterval(pollTimer);
        };
    }
}
'''
    open('db.js', 'w', encoding='utf-8').write(content[:start] + new_class + content[end:])
    print('done')
else:
    print('markers not found')
