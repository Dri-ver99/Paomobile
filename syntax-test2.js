
        // Supabase Migration: We rely on db.js which initializes window.firebaseAuth and window.db
        
        const supabase = window.supabaseClient;
        
        const doc = (db, col, id) => db.collection(col).doc(id);
        const setDoc = (ref, data, options) => ref.set(data, options);
        const getDoc = (ref) => ref.get();
        const collection = (db, col) => db.collection(col);
        const where = (field, op, val) => ({field, op, val});
        const query = (colRef, qry) => colRef;
        const getDocs = async (q) => {
            const snap = await q.get();
            return snap;
        };

        // IMPROVED: Returns {exists: boolean, email?: string}
        window.checkIdentifierExists = async (rawIdentifier) => {
            console.log("[Auth] Checking existence for:", rawIdentifier);
            const identifier = normalizeIdentifier(rawIdentifier);
            const isEmail = identifier.includes("@");

            try {
                const snap = await db.collection("users")
                    .where(isEmail ? "email" : "phone", "==", identifier)
                    .limit(1)
                    .get();

                if (!snap.empty) {
                    const userData = snap.docs[0].data();
                    console.log("[Auth] Found in Firestore:", userData);
                    let resolvedEmail = userData.email || (isEmail ? identifier : `${identifier}@paomobile.auth`);
                    return { exists: true, email: resolvedEmail };
                }

                return { exists: false };
            } catch (e) {
                console.warn("[Auth] Identifier check error:", e);
                return { exists: false };
            }
        };

        // --- Resilience State ---
        let isNavigating = false;
        let isCheckingRedirect = true;
        let isRegistering = false;
        let verificationInterval;

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

        window.transitionToVerification = (name, fallbackEmail = "") => {
            console.log("[Auth] ---> transitionToVerification triggered for:", name);
            isRegistering = true;

            const loginView = document.getElementById("loginView");
            const registerView = document.getElementById("registerView");
            const successView = document.getElementById("successView");

            if (loginView) loginView.style.display = "none";
            if (registerView) registerView.style.display = "none";
            if (successView) {
                successView.style.display = "block";

                // Check if user is already verified (e.g. Google users)
                const user = (await supabase.auth.getSession()).data.session?.user;
                if (user && user.emailVerified) {
                    updateUIForVerified(name);
                } else {
                    updateUIForUnverified(fallbackEmail);
                    startVerificationCheck(); // Start auto-reloading
                }
            }

            hideLoading(true, "Success view transition");

            window.finishLoginWithUser = () => {
                console.log("[Auth] finishLoginWithUser called manually");
                isRegistering = false;
                isNavigating = false;
                finishLogin(name);
            };
        };

        function updateUIForVerified(name) {
            document.getElementById("successIcon").style.display = "flex";
            document.getElementById("verifyIcon").style.display = "none";
            document.getElementById("statusTitle").textContent = "สมัครเสร็จสิ้น";
            document.getElementById("statusText").innerHTML = `ยินดีด้วยค่ะ! บัญชี ${name} ของคุณ<br>พร้อมใช้งานเรียบร้อยแล้วค่ะ`;
            document.getElementById("btnCheckVerify").style.display = "none";
            document.getElementById("btnSuccessFinish").style.display = "block";
            document.getElementById("verifyArea").style.display = "none";

            // Clear temp credentials
            window.tempVerificationEmail = null;
            window.tempVerificationPassword = null;

            // Sync verified status to local session
            const userDataStr = localStorage.getItem('paomobile_user');
            if (userDataStr) {
                const userData = JSON.parse(userDataStr);
                userData.isVerified = true;
                localStorage.setItem('paomobile_user', JSON.stringify(userData));
                console.log("[Auth] Local session sync: Marked as verified");
            }

            // Removed auto-redirect to allow user to see success state
            console.log("[Auth] Verification successful. Success view is active.");
        }

        function updateUIForUnverified(fallbackEmail = "") {
            document.getElementById("successIcon").style.display = "none";
            document.getElementById("verifyIcon").style.display = "flex";
            document.getElementById("statusTitle").textContent = "กรุณายืนยันอีเมล";
            const user = (await supabase.auth.getSession()).data.session?.user;
            const emailStr = user ? user.email : (fallbackEmail || "อีเมลของคุณ");
            document.getElementById("statusText").innerHTML = `เราได้ส่งลิงก์ยืนยันไปที่ <b>${emailStr}</b> เรียบร้อยแล้วค่ะ<br>กรุณาคลิกลิงก์ในอีเมลเพื่อเปิดใช้งานบัญชีค่ะ`;
            document.getElementById("btnCheckVerify").style.display = "block";
            document.getElementById("btnSuccessFinish").style.display = "none";
            document.getElementById("verifyArea").style.display = "block";
        }

        let lastEmailSentTime = 0;
        const RESEND_COOLDOWN = 60000; // Increased to 60 seconds to match Firebase

        window.checkVerificationState = async (auto = false) => {
            const user = (await supabase.auth.getSession()).data.session?.user;
            if (!user) return;

            if (!auto) {
                showLoading("Checking status...");
            }

            // TRY TO LOG IN IF TEMP CREDENTIALS EXIST
            if (window.tempVerificationEmail && window.tempVerificationPassword) {
                try {
                    const cred = await supabase.auth.signInWithPassword({ email: window.tempVerificationEmail, password: window.tempVerificationPassword });
                    console.log("[Auth] Verification check: Logged in successfully, user is verified!");
                    await saveUserToFirestore(cred.user, 'email_login');
                    
                    if (verificationInterval) clearInterval(verificationInterval);
                    updateUIForVerified(cred.user.displayName || cred.user.email.split('@')[0]);
                    if (!auto) hideLoading(true, "Verified");
                    return;
                } catch (err) {
                    console.log("[Auth] Verification check: User is still unverified.", err.message);
                }
            }

            await user.reload();
            if (user.emailVerified) {
                console.log("[Auth] User is now verified!");
                if (verificationInterval) clearInterval(verificationInterval);
                updateUIForVerified(user.displayName || user.email.split('@')[0]);
                if (!auto) hideLoading(true, "Verified");
            } else {
                if (!auto) {
                    console.log("[Auth] Still unverified.");
                    alert("ขออภัยครับ บัญชีของคุณยังไม่ได้รับการยืนยันครับ รบกวนตรวจสอบลิงก์ในอีเมลอีกครั้งนะครับ\n\n(หากไม่พบในกล่องขาเข้า กรุณาลองเช็คใน 'จดหมายขยะ', 'ถังขยะ' หรือ 'โปรโมชัน' ดูนะครับ)");
                    hideLoading(true, "Still unverified");
                }
            }
        };

        function startResendCountdown() {
            const btn = document.getElementById("btnResendVerify");
            if (!btn) return;

            btn.disabled = true;
            btn.style.opacity = "0.5";
            btn.style.cursor = "not-allowed";

            const updateBtn = () => {
                const now = Date.now();
                const remaining = Math.ceil((RESEND_COOLDOWN - (now - lastEmailSentTime)) / 1000);

                if (remaining > 0) {
                    btn.textContent = `(${remaining})`;
                    setTimeout(updateBtn, 1000);
                } else {
                    btn.disabled = false;
                    btn.style.opacity = "1";
                    btn.style.cursor = "pointer";
                    btn.textContent = "ส่งอีเมลยืนยันอีกครั้ง";
                }
            };

            updateBtn();
        }


        function startVerificationCheck() {
            if (verificationInterval) clearInterval(verificationInterval);
            verificationInterval = setInterval(() => {
                const successView = document.getElementById("successView");
                if (successView && successView.style.display === "block") {
                    window.checkVerificationState(true);
                } else {
                    clearInterval(verificationInterval);
                }
            }, 3000);
        }

        window.handleForceLogout = async () => {
            showLoading("Signing out...");
            try {
                if (verificationInterval) clearInterval(verificationInterval);
                await auth.signOut();
                localStorage.clear();
                window.location.replace("index.html");
            } catch (err) {
                console.error("Logout error:", err);
                window.location.replace("index.html");
            }
        };

        // --- Action Bindings ---
        window.sendResetEmailAction = async (rawIdentifier) => {
            showLoading("Sending reset email");
            const errEl = document.getElementById("forgotError");
            if (errEl) errEl.style.display = "none";

            try {
                const res = await window.checkIdentifierExists(rawIdentifier);
                if (!res.exists) {
                    if (errEl) errEl.style.display = "block";
                    hideLoading(true, "Identifier not found");
                    return;
                }

                const targetEmail = res.email;
                const isPhone = /^[0-9]{10}$/.test(rawIdentifier);
                console.log("[Auth] Triggering Firebase Reset for:", targetEmail, "(isPhone:", isPhone, ")");

                await supabase.auth.resetPasswordForEmail(targetEmail);
                console.log("[Auth] Firebase Success: Reset email sent.");

                if (isPhone) {
                    alert("เราได้ส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ไปให้คุณทาง SMS เรียบร้อยแล้วครับ กรุณาตรวจสอบและดำเนินการตามขั้นตอน");
                } else {
                    alert("เราได้ส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ไปให้คุณทางอีเมลเรียบร้อยแล้วครับ\n\n(หากไม่พบในกล่องขาเข้า กรุณาลองเช็คในหน้า 'จดหมายขยะ (Spam)', 'ถังขยะ' หรือ 'โปรโมชัน' ดูนะครับ)");
                }

                // Return to login
                document.getElementById("forgotPasswordView").style.display = "none";
                document.getElementById("loginView").style.display = "block";

            } catch (error) {
                console.error("[Auth] Reset error:", error);
                alert("เกิดข้อผิดพลาด: " + error.message);
            } finally {
                hideLoading(true, "Reset complete");
            }
        };

        // --- Verification Email Action ---
        window.sendVerificationEmail = async () => {
            const user = (await supabase.auth.getSession()).data.session?.user;
            if (!user) {
                alert("กรุณาเข้าสู่ระบบก่อนขอยืนยันบัญชีครับ");
                return;
            }

            if (user.email.endsWith('@paomobile.auth')) {
                alert("ไม่สามารถส่งอีเมลยืนยันสำหรับบัญชีที่สมัครด้วยเบอร์โทรศัพท์ได้ครับ");
                return;
            }

            const now = Date.now();
            if (now - lastEmailSentTime < RESEND_COOLDOWN) {
                const timeToWait = Math.ceil((RESEND_COOLDOWN - (now - lastEmailSentTime)) / 1000);
                alert(`กรุณาลองใหม่ในอีก ${timeToWait} วินาทีค่ะ`);
                return;
            }

            showLoading("Sending verification email");
            try {
                await sendEmailVerification(user);
                lastEmailSentTime = Date.now();
                startResendCountdown();
                alert("เราได้ส่งลิงก์ยืนยันบัญชีไปให้คุณอีกครั้งแล้วครับ กรุณาตรวจสอบในกล่องจดหมาย (หรือในหน้า 'จดหมายขยะ', 'ถังขยะ' หรือ 'โปรโมชัน') นะครับ");
            } catch (error) {
                console.error("[Auth] Verification error:", error);
                if (error.code === 'auth/too-many-requests') {
                    lastEmailSentTime = Date.now(); // Reset timer to force wait
                    startResendCountdown();
                    alert("ระบบส่งอีเมลยืนยันชั่วคราวเกินขีดจำกัดแล้วครับ กรุณารอประมาณ 60 วินาทีตามตัวเลขบนปุ่ม แล้วค่อยกดยืนยันใหม่อีกครั้งนะครับ");
                } else {
                    alert("เกิดข้อผิดพลาด: " + error.message);
                }
            } finally {
                hideLoading(true, "Verification complete");
            }
        };

        // --- WebView Detection ---
        function detectRestrictedBrowser() {
            const ua = navigator.userAgent || navigator.vendor || window.opera;
            const isRestricted = /Line|FBAN|FBAV|Instagram|Messenger|WhatsApp|FB_IAB|FBSS/i.test(ua);

            if (isRestricted) {
                console.warn("[Auth] Restricted WebView detected:", ua);
                const notice = document.getElementById('webviewNotice');
                if (notice) notice.style.display = 'block';

                const formArea = document.getElementById('loginFormArea');
                if (formArea) formArea.style.opacity = '0.7';
                return true;
            }
            return false;
        }

        // --- Normalization Helper ---
        function normalizeIdentifier(val) {
            const trimmed = val.trim();
            if (trimmed.includes("@")) return trimmed.toLowerCase();
            // Remove all non-digits for phone numbers
            return trimmed.replace(/\D/g, "");
        }

        // --- Auth Initializer (Sequenced Flow) ---
        async function initAuth() {
            const auth = window.auth;
            if (!auth) return;

            // 1. Handle actual logout request (Wait for it to finish)
            if (localStorage.getItem('pao_logout_pending')) {
                console.log("[Auth] Logout signal detected. Forcing signOut...");
                showLoading(); // Ensure spinner is up
                await supabase.auth.signOut();
                localStorage.removeItem('pao_logout_pending');
                console.log("[Auth] Cloud sign-out complete.");
                hideLoading();
            }

            // 2. Check for Google Redirect Result
            await checkRedirectResult();

            // 3. Release redirect lock (Observer can now handle UI)
            isCheckingRedirect = false;
            console.log("[Auth] Redirect check finished. Observer active.");
        }

        // --- Start the flow ---
        detectRestrictedBrowser();
        initAuth();

        // --- Observer (The persistent sentry) ---
        window.auth.onAuthStateChanged(async (user) => {
            console.log("[Auth] Observer: State changed. Registering:", isRegistering, "Navigating:", isNavigating);
            if (isCheckingRedirect || isRegistering) {
                console.log("[Auth] Observer: BLOCKED (Redirect check or Registering)");
                return;
            }

            if (user && !isNavigating) {
                console.log("[Auth] State: IN -> Initializing session for:", user.email, "Verified:", user.emailVerified);

                if (!user.emailVerified && !(user.email || '').endsWith('@paomobile.auth') && !user.providerData.some(p => p.providerId === 'google.com')) {
                    console.log("[Auth] User not verified. Forcing Verification View.");
                    window.transitionToVerification(user.displayName || user.email.split('@')[0]);
                    return;
                }

                await saveUserToFirestore(user, 'state_change');

                // Only redirect if we are STILL on the login page
                if (window.location.pathname.endsWith('login.html')) {
                    finishLogin(user.displayName || user.email.split('@')[0]);
                }
            } else {
                console.log("[Auth] State: OUT");
                hideLoading();
            }
        });

        // Check result of redirect sign-in
        async function checkRedirectResult() {
            try {
                const result = null; // Supabase handles redirect auth via getSession automatically
                if (result && result.user) {
                    console.log("[Auth] Redirect Success:", result.user.email);
                    await saveUserToFirestore(result.user, 'google_redirect');
                    finishLogin(result.user.displayName || result.user.email.split('@')[0]);
                }
            } catch (error) {
                console.error("[Auth] Redirect Failure:", error);
                hideLoading();
            }
        }

        // Final Redirection Sequence (With Lock)
        async function finishLogin(name) {
            console.log("[Auth] finishLogin check triggered for:", name);
            if (isNavigating && (!overlay || overlay.style.display !== 'flex')) {
                console.warn("[Auth] finishLogin BLOCKED: Already navigating");
                return;
            }

            const user = (await supabase.auth.getSession()).data.session?.user;
            // CRITICAL: Block finish if not verified (unless phone/google)
            if (user && !user.emailVerified && !(user.email || '').endsWith('@paomobile.auth') && !user.providerData.some(p => p.providerId === 'google.com')) {
                console.warn("[Auth] finishLogin BLOCKED: Email not verified");
                isNavigating = false;
                hideLoading();
                window.transitionToVerification(name || user.displayName || user.email.split('@')[0]);
                return;
            }

            isNavigating = true;
            showLoading("finishLogin init");

            if (!localStorage.getItem('paomobile_user')) {
                if (user) {
                    console.log("[Auth] Initializing session data...");
                    await saveUserToFirestore(user, 'recovery');
                }
            }

            await wait(800);
            
            // v1.3.2 - Support redirect after login (e.g., from QR redeem)
            const redirectUrl = localStorage.getItem('redirect_after_login');
            if (redirectUrl) {
                localStorage.removeItem('redirect_after_login');
                window.location.replace(redirectUrl);
            } else {
                window.location.replace("index.html");
            }
        }

        // --- Save user data to Firestore (Version 1.7 - Preserves custom name/avatar) ---
        async function saveUserToFirestore(user, provider) {
            console.log("[Auth] Syncing profile with Cloud...");

            let finalName = user.displayName || 'Member';
            let finalAvatar = user.photoURL || "";

            let email = user.email || '';
            if (email.endsWith('@paomobile.auth')) {
                email = email.split('@')[0]; 
                if (finalName === 'Member' || finalName === user.email) finalName = email; 
            } else if (finalName === 'Member' && email) {
                finalName = email.split('@')[0];
            }

            const userData = {
                uid: user.uid,
                name: finalName,
                email: email,
                avatar: finalAvatar,
                photo: finalAvatar,
                isVerified: !!(user.emailVerified || provider.includes('google'))
            };

            // Fetch existing profile from database FIRST to preserve custom name/avatar
            if (db) {
                try {
                    const userRef = doc(db, "users", user.uid);
                    const snap = await getDoc(userRef);
                    if (snap.exists) {
                        const existing = snap.data();
                        // Use the customer's custom name/avatar if they set one
                        if (existing.name) userData.name = existing.name;
                        if (existing.avatar) {
                            userData.avatar = existing.avatar;
                            userData.photo = existing.avatar;
                        }
                        console.log("[Auth] Loaded saved profile:", userData.name);
                    }
                    // Save to localStorage with merged data
                    localStorage.setItem('paomobile_user', JSON.stringify(userData));
                    // Background write (don't await)
                    setDoc(userRef, { ...userData, lastLogin: new Date() }, { merge: true }).catch(e => console.warn("[Auth] Write error:", e.message));
                } catch (e) {
                    console.warn("[Auth] Cloud Sync Error, using defaults:", e.message);
                    localStorage.setItem('paomobile_user', JSON.stringify(userData));
                }
            } else {
                localStorage.setItem('paomobile_user', JSON.stringify(userData));
            }
        }

        const btnGoogle = document.getElementById('btnGoogleLogin');
        if (btnGoogle) {
            btnGoogle.addEventListener('click', async () => {
                if (detectRestrictedBrowser()) return;

                showLoading("Google Auth Start");
                try {
                    const { data, error } = await supabase.auth.signInWithOAuth({
                        provider: 'google',
                        options: { redirectTo: window.location.origin + '/login.html' }
                    });
                    if (error) throw error;
                    // Redirection will happen automatically.
                } catch (error) {
                    console.error("[Auth] Google Login failed:", error);
                    alert("ไม่สามารถเชื่อมต่อกับ Google ได้ในขณะนี้ครับ: " + error.message);
                    hideLoading(true, "Google finalizer");
                }
            });
        }

        // Handle Email Login/Continue
        const btnLogin = document.getElementById('btnEmailLogin');
        const emailInput = document.getElementById('emailInput');
        const passwordInput = document.getElementById('passwordInput');
        const passwordGroup = document.getElementById('passwordGroup');

        if (btnLogin) {
            btnLogin.addEventListener('click', async () => {
                let rawIdentifier = emailInput.value.trim();
                if (!rawIdentifier) {
                    alert("กรุณาระบุอีเมลหรือเบอร์โทรศัพท์ครับ");
                    return;
                }
                const identifier = normalizeIdentifier(rawIdentifier);
                if (!identifier) {
                    alert("รูปแบบอีเมลหรือเบอร์โทรศัพท์ไม่ถูกต้องครับ (ต้องมี @ สำหรับอีเมล หรือมีตัวเลขสำหรับเบอร์โทร)");
                    return;
                }

                if (identifier.endsWith('@paomobile.auth')) {
                    hideLoading();
                    alert("กรุณาใช้เบอร์โทรศัพท์ 10 หลัก ให้ถูกต้อง");
                    return;
                }

                showLoading();
                const res = await window.checkIdentifierExists(identifier);

                if (!res.exists) {
                    hideLoading();
                    const choice = await window.sellerConfirm("ไม่พบบัญชีผู้ใช้ในระบบค่ะ\n\nต้องการสมัครใหม่ (OK) หรือจะลองเข้าสู่ระบบด้วยรหัสผ่าน anyway (Cancel) คะ?\n(กรณีกด Cancel ระบบจะแสดงช่องใส่รหัสผ่านให้ลองดูค่ะ)", "info");
                    
                    if (choice) {
                        console.log("[Auth] Seamless transition to Register View");
                        const registerView = document.getElementById("registerView");
                        const loginView = document.getElementById("loginView");
                        if (registerView && loginView) {
                            loginView.style.display = "none";
                            registerView.style.display = "block";
                            const regEmail = document.getElementById("regEmail");
                            if (regEmail) {
                                regEmail.value = emailInput.value;
                                const event = new Event('input', { bubbles: true });
                                regEmail.dispatchEvent(event);
                            }
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                    } else {
                        // User chose "Cancel" -> "ฉันมีบัญชีอยู่แล้ว (ลองล็อกอิน)"
                        console.log("[Auth] Force showing password field for existing user...");
                        passwordGroup.style.display = 'block';
                        btnLogin.textContent = "เข้าสู่ระบบ anyway ??";
                        return;
                    }
                    return;
                }

                if (passwordGroup.style.display === 'none') {
                    hideLoading();
                    passwordGroup.style.display = 'block';
                    btnLogin.textContent = "เข้าสู่ระบบ";
                    return;
                }

                const password = passwordInput.value;
                if (!password) {
                    hideLoading();
                    alert("กรุณากรอกรหัสผ่านครับ");
                    return;
                }

                try {
                    const cred = await supabase.auth.signInWithPassword({ email: res.email, password: password });
                    console.log("[Auth] Email Login Success:", cred.user.email);
                    await saveUserToFirestore(cred.user, 'email_login');
                    finishLogin(cred.user.displayName || cred.user.email.split('@')[0]);
                } catch (error) {
                    hideLoading();
                    console.error("[Auth] Login error:", error.code, error.message);
                    if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential' || (error.message && error.message.includes("Invalid login credentials"))) {
                        alert("อีเมลหรือรหัสผ่านไม่ถูกต้องครับ");
                    } else if (error.message && error.message.includes("Email not confirmed")) {
                        window.tempVerificationEmail = res.email;
                        window.tempVerificationPassword = password;
                        if (window.auth) {
                            window.auth._currentUser = { email: res.email, uid: "", emailVerified: false };
                        }
                        const displayName = res.email.split('@')[0];
                        window.transitionToVerification(displayName, res.email);
                    } else {
                        alert("เกิดข้อผิดพลาด: " + error.message);
                    }
                }

            });

            // Support Enter key for Login
            [emailInput, passwordInput].forEach(input => {
                if (input) {
                    input.addEventListener('keypress', (e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            btnLogin.click();
                        }
                    });
                }
            });
        }

        // Handle Registration
        const btnRegContinue = document.getElementById('btnContinueRegister');
        if (btnRegContinue) {
            btnRegContinue.addEventListener('click', async () => {
                const email = document.getElementById('regEmail').value.trim().toLowerCase();
                const password = document.getElementById('regPassword').value;

                if (!email.includes("@")) {
                    alert("กรุณาระบุอีเมลให้ถูกต้อง");
                    return;
                }

                showLoading("Registration begin");
                isRegistering = true;
                isNavigating = true;

                try {
                    const cred = await supabase.auth.signUp({ email: email, password: password });
                    console.log("[Auth] Firebase User Created:", cred.user.uid);

                    const name = email.split('@')[0];

                    // Background persistence (Non-blocking)
                    const userRef = doc(db, "users", cred.user.uid);
                    setDoc(userRef, {
                        uid: cred.user.uid,
                        name: name,
                        email: email,
                        phone: "", // No phone during email registration
                        marketing: document.getElementById("checkMarketing").checked,
                        provider: 'email_registration',
                        createdAt: new Date()
                    }).then(() => console.log("[Auth] Firestore persistence complete."));

                    // Send Verification Email immediately
                    await sendEmailVerification(cred.user);
                    console.log("[Auth] Verification email sent automatically.");

                    if (window.auth) {
                        window.auth._currentUser = { email: email, uid: cred.user.uid, emailVerified: false };
                    }

                    // Switch to Verification View
                    window.transitionToVerification(name, email);

                } catch (error) {
                    console.error("[Auth] Registration caught error:", error);
                    isRegistering = false;
                    isNavigating = false;
                    hideLoading(true, "Registration error alert");
                    if (error.code === 'auth/email-already-in-use') {
                        alert("อีเมลหรือเบอร์โทรนี้ถูกใช้งานไปแล้วครับ");
                    } else {
                        alert("การลงทะเบียนผิดพลาด: " + error.message);
                    }
                }
            });

            // Support Enter key for Registration
            ['regEmail', 'regPassword', 'regConfirmPassword', 'regPhone'].forEach(id => {
                const input = document.getElementById(id);
                if (input) {
                    input.addEventListener('keypress', (e) => {
                        if (e.key === 'Enter' && !btnRegContinue.disabled) {
                            e.preventDefault();
                            btnRegContinue.click();
                        }
                    });
                }
            });
        }

        function wait(ms) { return new Promise(res => setTimeout(res, ms)); }
    
