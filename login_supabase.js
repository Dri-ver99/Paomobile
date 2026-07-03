// login_supabase.js
// Supabase Authentication Implementation for Paomobile

let isNavigating = false;
let isCheckingRedirect = true;
let isRegistering = false;

const overlay = document.getElementById('loadingOverlay');
const showLoading = (reason = "") => {
    console.log("[Auth] showLoading called. Reason:", reason);
    if (overlay) overlay.style.display = 'flex';
};
const hideLoading = (force = false, reason = "") => {
    console.log("[Auth] hideLoading called. Force:", force, "Reason:", reason);
    if (isNavigating && !force) {
        console.warn("[Auth] hideLoading BLOCKED by isNavigating (Reason: " + reason + ")");
        return;
    }
    if (overlay) overlay.style.display = 'none';
};

// Returns {exists: boolean, email?: string}
window.checkIdentifierExists = async (rawIdentifier) => {
    console.log("[Auth] Checking existence for:", rawIdentifier);
    const identifier = normalizeIdentifier(rawIdentifier);
    const isEmail = identifier.includes("@");

    try {
        const supabase = window.getSupabaseClient();
        
        // Supabase doesn't easily let us fetch user by email without an admin key.
        // We will check our `users` table instead.
        const { data, error } = await supabase
            .from('users')
            .select('email')
            .eq(isEmail ? 'email' : 'phone', identifier)
            .limit(1);

        if (error) {
            console.warn("[Auth] Supabase query failed:", error.message);
            return { exists: false };
        }

        if (data && data.length > 0) {
            console.log("[Auth] Found in users table:", data[0]);
            let resolvedEmail = data[0].email || (isEmail ? identifier : `${identifier}@paomobile.auth`);
            return { exists: true, email: resolvedEmail };
        }
        
        return { exists: false };
    } catch (e) {
        console.warn("[Auth] Identifier check error:", e);
        return { exists: false };
    }
};

window.transitionToVerification = (name) => {
    console.log("[Auth] ---> transitionToVerification triggered for:", name);
    isRegistering = true;

    const loginView = document.getElementById("loginView");
    const registerView = document.getElementById("registerView");
    const successView = document.getElementById("successView");

    if (loginView) loginView.style.display = "none";
    if (registerView) registerView.style.display = "none";
    if (successView) {
        successView.style.display = "block";
        updateUIForUnverified();
    }
};

window.finishLoginWithUser = async () => {
    const identifier = document.getElementById('emailInput').value.trim();
    if (!identifier) {
        await window.sellerAlert("กรุณาระบุอีเมลหรือเบอร์โทรศัพท์");
        return;
    }
    const password = document.getElementById('passwordInput').value;
    if (!password) {
        await window.sellerAlert("กรุณาระบุรหัสผ่าน");
        return;
    }

    showLoading("finishLoginWithUser");
    finishLogin(identifier, password);
};

function updateUIForUnverified() {
    console.log("[Auth] updateUIForUnverified called.");
    const icon = document.getElementById('emailVerificationIcon');
    if(icon) icon.style.display = 'block';
    
    const title = document.getElementById('successTitle');
    if(title) title.innerText = 'ยืนยันอีเมลของคุณ';
    
    const sub = document.getElementById('successSubtitle');
    if(sub) sub.innerText = 'เราได้ส่งอีเมลยืนยันไปที่อีเมลของคุณแล้ว กรุณากดลิงก์ในอีเมลเพื่อเปิดใช้งานบัญชี';
    
    const notice = document.getElementById('verificationNotice');
    if(notice) notice.style.display = 'block';
    
    const btn = document.getElementById('btnStartShopping');
    if(btn) btn.style.display = 'none';
}

window.sendResetEmailAction = async (rawIdentifier) => {
    const identifier = normalizeIdentifier(rawIdentifier);
    if (!identifier) {
        await window.sellerAlert("กรุณาระบุอีเมลหรือเบอร์โทรศัพท์ที่ถูกต้อง");
        return;
    }

    showLoading("sendResetEmailAction");
    const btnSendReset = document.getElementById("btnSendReset");
    if (btnSendReset) {
        btnSendReset.disabled = true;
        btnSendReset.innerText = "กำลังส่งลิงก์...";
    }

    try {
        const supabase = window.getSupabaseClient();
        
        let targetEmail = identifier;
        if (!identifier.includes("@")) {
            // lookup phone
            const { data } = await supabase.from('users').select('email').eq('phone', identifier).limit(1);
            if (data && data.length > 0) targetEmail = data[0].email;
            else {
                await window.sellerAlert("ไม่พบบัญชีที่เชื่อมโยงกับเบอร์โทรศัพท์นี้");
                hideLoading();
                if (btnSendReset) { btnSendReset.disabled = false; btnSendReset.innerText = "ส่งลิงก์รีเซ็ตรหัสผ่าน"; }
                return;
            }
        }

        const { error } = await supabase.auth.resetPasswordForEmail(targetEmail, {
            redirectTo: window.location.origin + '/reset-password.html',
        });
        
        if (error) throw error;
        
        document.getElementById("forgotView").style.display = "none";
        document.getElementById("resetSentView").style.display = "block";
        document.getElementById("resetEmailDisplay").innerText = targetEmail;
        
    } catch (e) {
        console.error("Reset Email Error:", e);
        let msg = "เกิดข้อผิดพลาดในการส่งอีเมลรีเซ็ตรหัสผ่าน โปรดลองอีกครั้ง";
        await window.sellerAlert(msg);
    } finally {
        hideLoading();
        if (btnSendReset) {
            btnSendReset.disabled = false;
            btnSendReset.innerText = "ส่งลิงก์รีเซ็ตรหัสผ่าน";
        }
    }
};

window.sendVerificationEmail = async () => {
    showLoading("sendVerificationEmail");
    try {
        const supabase = window.getSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("No user found.");
        
        const { error } = await supabase.auth.resend({
            type: 'signup',
            email: user.email,
            options: {
                emailRedirectTo: window.location.origin + '/login.html'
            }
        });

        if (error) throw error;
        await window.sellerAlert("ส่งอีเมลยืนยันใหม่เรียบร้อยแล้ว กรุณาตรวจสอบในกล่องจดหมาย หรือ Junk/Spam");
    } catch (e) {
        console.error(e);
        await window.sellerAlert("ไม่สามารถส่งอีเมลยืนยันได้: " + e.message);
    } finally {
        hideLoading();
    }
};

function normalizeIdentifier(val) {
    if (!val) return "";
    let clean = val.trim();
    if (/^0\d{9}$/.test(clean)) {
        return clean.replace(/^0/, "+66");
    }
    return clean.toLowerCase();
}

// Supabase Auth Initialization
async function initAuth() {
    showLoading("initAuth checking session");
    const supabase = window.getSupabaseClient();

    // Check if we are returning from an OAuth redirect
    const { data: { session }, error } = await supabase.auth.getSession();

    isCheckingRedirect = false;

    if (error) {
        console.error("[Auth] getSession error:", error);
    }

    if (session) {
        const user = session.user;
        if (!user) return;

        // Ensure user is saved and await it
        await saveUserToSupabase(session.user, session.user.app_metadata?.provider || 'email');
        
        if (isRegistering) {
            hideLoading(true, "initAuth registering");
            return;
        }
        const returnUrl = localStorage.getItem('returnUrl') || 'index.html';
        localStorage.removeItem('returnUrl');
        isNavigating = true;
        window.location.href = returnUrl;
    } else {
        hideLoading(true, "initAuth no session");
    }

    // Set up auth listener
    supabase.auth.onAuthStateChange(async (event, session) => {
        console.log("[Auth] Auth state changed:", event);
        if (event === 'SIGNED_IN' && session) {
            saveUserToSupabase(session.user, session.user.app_metadata?.provider || 'email');
        } else if (event === 'SIGNED_OUT') {
            localStorage.removeItem('paomobile_user');
        }
    });

    setupGoogleLogin();
}

function setupGoogleLogin() {
    const btnGoogle = document.getElementById("btnGoogle");
    if (btnGoogle) {
        btnGoogle.addEventListener("click", async () => {
            showLoading("Google SignIn");
            const supabase = window.getSupabaseClient();
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin + '/login.html'
                }
            });
            if (error) {
                console.error("Google login error:", error);
                await window.sellerAlert("เข้าสู่ระบบด้วย Google ไม่สำเร็จ");
                hideLoading(true);
            }
        });
    }
}

async function saveUserToSupabase(user, provider) {
    if (!user) return;
    const supabase = window.getSupabaseClient();
    
    // Default values
    let displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || "ผู้ใช้ใหม่";
    let avatarUrl = user.user_metadata?.avatar_url || "https://ui-avatars.com/api/?name=" + encodeURIComponent(displayName);
    
    const payload = {
        id: user.id,
        email: user.email,
        name: displayName,
        avatar: avatarUrl,
        provider: provider,
        isVerified: true, 
        updatedAt: new Date().toISOString()
    };

    // Try to get existing user to preserve name
    const { data: existingUser } = await supabase.from('users').select('*').eq('id', user.id).single();
    
    if (existingUser) {
        payload.name = existingUser.name || payload.name;
        payload.avatar = existingUser.avatar || payload.avatar;
        payload.phone = existingUser.phone || "";
    } else {
        payload.createdAt = new Date().toISOString();
        payload.role = 'user';
    }

    await supabase.from('users').upsert([payload]);
    
    // Save to localStorage for quick UI updates
    localStorage.setItem('paomobile_user', JSON.stringify({
        uid: user.id,
        email: user.email,
        name: payload.name,
        avatar: payload.avatar,
        isVerified: true
    }));
}

async function finishLogin(identifier, password) {
    const supabase = window.getSupabaseClient();
    let targetEmail = identifier;
    
    if (!identifier.includes("@")) {
        const { data } = await supabase.from('users').select('email').eq('phone', identifier).limit(1);
        if (data && data.length > 0) {
            targetEmail = data[0].email;
        } else {
            await window.sellerAlert("ไม่พบบัญชีที่ใช้เบอร์โทรศัพท์นี้");
            hideLoading(true);
            return;
        }
    }

    const { data, error } = await supabase.auth.signInWithPassword({
        email: targetEmail,
        password: password,
    });

    if (error) {
        console.error("Login error:", error);
        if (error.message.includes('Invalid login credentials')) {
            await window.sellerAlert("อีเมล หรือ รหัสผ่านไม่ถูกต้อง");
        } else if (error.message.includes('Email not confirmed')) {
            await window.sellerAlert("กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ (เช็คกล่องจดหมายของคุณ)");
        } else {
            await window.sellerAlert("ไม่สามารถเข้าสู่ระบบได้: " + error.message);
        }
        hideLoading(true);
        return;
    }

    if (data.session) {
        isNavigating = true;
        
        // 🔹 FIX: Wait for user data to be saved to localStorage before redirecting!
        // This ensures auth.js on index.html will immediately see the user.
        await saveUserToSupabase(data.session.user, data.session.user.app_metadata?.provider || 'email');

        const returnUrl = localStorage.getItem('returnUrl') || 'index.html';
        localStorage.removeItem('returnUrl');
        window.location.href = returnUrl;
    }
}

// Add sign up handler replacement
document.addEventListener('DOMContentLoaded', () => {
    const btnEmailLogin = document.getElementById('btnEmailLogin');
    const identifierInput = document.getElementById('emailInput');
    const passwordInput = document.getElementById('passwordInput');
    const passwordGroup = document.getElementById('passwordGroup');

    if (btnEmailLogin) {
        btnEmailLogin.addEventListener('click', async (e) => {
            e.preventDefault();
            const identifier = identifierInput ? identifierInput.value.trim() : '';
            if (!identifier) {
                await window.sellerAlert("กรุณาระบุอีเมลหรือเบอร์โทรศัพท์ครับ");
                return;
            }

            if (passwordGroup && passwordGroup.style.display === 'none') {
                showLoading("กำลังตรวจสอบบัญชี...");
                const exists = await window.checkIdentifierExists(identifier);
                hideLoading();
                
                if (exists.exists) {
                    passwordGroup.style.display = 'block';
                    btnEmailLogin.textContent = "เข้าสู่ระบบ";
                } else {
                    const choice = await window.sellerConfirm("ไม่พบบัญชีในระบบ\n\nต้องการสมัครสมาชิกใหม่หรือไม่?");
                    if (choice) {
                        const registerView = document.getElementById("registerView");
                        const loginView = document.getElementById("loginView");
                        if (loginView && registerView) {
                            loginView.style.display = "none";
                            registerView.style.display = "block";
                            const regEmail = document.getElementById("regEmail");
                            if (regEmail && identifier.includes("@")) regEmail.value = identifier;
                        }
                    }
                }
            } else {
                const password = passwordInput ? passwordInput.value : '';
                if (!password) {
                    await window.sellerAlert("กรุณาระบุรหัสผ่านครับ");
                    return;
                }
                showLoading("กำลังเข้าสู่ระบบ...");
                await window.finishLoginWithUser();
                hideLoading();
            }
        });
        
        [identifierInput, passwordInput].forEach(input => {
            if (input) {
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        btnEmailLogin.click();
                    }
                });
            }
        });
    }

    const btnRegister = document.getElementById("btnRegister");
    if (btnRegister) {
        // Remove existing onclick
        btnRegister.onclick = null;
        btnRegister.addEventListener('click', async (e) => {
            e.preventDefault();
            const name = document.getElementById('regName').value.trim();
            const email = document.getElementById('regEmail').value.trim();
            const phone = document.getElementById('regPhone').value.trim();
            const password = document.getElementById('regPassword').value;

            if (!name || !email || !password || !phone) {
                await window.sellerAlert("กรุณากรอกข้อมูลให้ครบทุกช่อง");
                return;
            }

            if (password.length < 6) {
                await window.sellerAlert("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
                return;
            }

            showLoading("Registering");
            
            const supabase = window.getSupabaseClient();
            const { data, error } = await supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        full_name: name,
                        phone: phone
                    },
                    emailRedirectTo: window.location.origin + '/login.html'
                }
            });

            if (error) {
                console.error("Signup error:", error);
                if (error.message.includes('User already registered')) {
                    await window.sellerAlert("อีเมลนี้มีการสมัครสมาชิกไว้แล้ว กรุณาเข้าสู่ระบบแทนครับ");
                } else {
                    await window.sellerAlert("ไม่สามารถสมัครสมาชิกได้: " + error.message);
                }
                hideLoading(true);
                return;
            }

            if (data.user) {
                // Insert into users table as unverified
                await supabase.from('users').upsert([{
                    id: data.user.id,
                    email: email,
                    name: name,
                    phone: phone,
                    isVerified: false,
                    provider: 'email',
                    createdAt: new Date().toISOString()
                }]);
                
                hideLoading(true);
                window.transitionToVerification(name);
            }
        });
    }

    // Call initAuth to check session on load
    initAuth();
});
