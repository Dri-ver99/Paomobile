const fs = require('fs');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const dom = new JSDOM(`<body>
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
</body>`, { runScripts: "dangerously", resources: "usable" });

dom.window.document.addEventListener("DOMContentLoaded", () => {
    try {
        const dbCode = fs.readFileSync('db.js', 'utf8');
        dom.window.eval(dbCode);
        console.log("DB evaluated successfully!");
        
        // Mock get
        dom.window.supabaseClientInstance.from = (table) => ({
            select: () => ({
                eq: () => ({ single: () => Promise.resolve({ data: {}, error: null }) }),
                order: () => ({ limit: () => Promise.resolve({ data: [], error: null }) }),
                limit: () => Promise.resolve({ data: [], error: null })
            })
        });

        const c = dom.window.db.collection('products');
        c.get().then(() => console.log("get() success")).catch(e => console.error("get() error", e));

    } catch (e) {
        console.error("Eval error: ", e);
    }
});
