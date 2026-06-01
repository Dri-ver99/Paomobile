const fs = require('fs');

// 1. Refactor login.html
let loginHtml = fs.readFileSync('login.html', 'utf8');

// Replace module imports with empty string
loginHtml = loginHtml.replace(/<script type="module" crossorigin="anonymous">[\s\S]*?const db = getFirestore\(app\);/g, '<script>\n');

// Replace checkRedirectResult references
loginHtml = loginHtml.replace(/await checkRedirectResult\(\);/g, '');
loginHtml = loginHtml.replace(/async function checkRedirectResult\(\) \{[\s\S]*?\}/g, '');

// Replace onAuthStateChanged
loginHtml = loginHtml.replace(/onAuthStateChanged\(auth, async \(user\) => \{/g, 'window.supabase.auth.onAuthStateChange(async (event, session) => {\\n            const user = session?.user;');

// Replace handleForceLogout
loginHtml = loginHtml.replace(/await auth\.signOut\(\);/g, '');

// Replace auth.currentUser
loginHtml = loginHtml.replace(/const user = auth\.currentUser;/g, 'const { data: { user } } = await window.supabase.auth.getUser();');

// Simplify saveUserToFirestore
loginHtml = loginHtml.replace(/if \(db\) \{[\s\S]*?\}\.catch\(e => console\.warn\("\[Auth\] Cloud Background Sync Error:", e\.message\)\);\n            \}/g, 
            window.supabase.from("users").upsert({
                uid: user.id || user.uid,
                name: updatedData.name,
                email: updatedData.email,
                avatar: updatedData.avatar,
                photo: updatedData.photo,
                isVerified: updatedData.isVerified,
                lastLogin: new Date().toISOString()
            }).then(() => console.log("Supabase profile sync complete")).catch(e => console.error("Sync error", e));
);

fs.writeFileSync('login_updated.html', loginHtml);
console.log('login.html updated');

