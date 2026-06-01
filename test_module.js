
        import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
        import { getAuth, signInWithRedirect, signInWithPopup, getRedirectResult, GoogleAuthProvider, fetchSignInMethodsForEmail, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, sendPasswordResetEmail, sendEmailVerification } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
        import { getFirestore, doc, setDoc, getDoc, query, collection, where, getDocs } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

        // Inlined Config for reliability on local files
        const firebaseConfig = {
            apiKey: "AIzaSyBAGDBKRUPTmp4RCMao2mnXfgfQmIp54to",
            authDomain: "paomobile-85e39.firebaseapp.com",
            projectId: "paomobile-85e39",
            storageBucket: "paomobile-85e39.firebasestorage.app",
            messagingSenderId: "844151679424",
            appId: "1:844151679424:web:0cfd6f491b79cd175ec025",
            measurementId: "G-BZYNZ9B9LQ"
        };

        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);
        const db = getFirestore(app);

        // IMPROVED: Returns {exists: boolean, email?: string}
        window.checkIdentifierExists = async (rawIdentifier) => {

            console.log("[Auth] Checking existence for:", rawIdentifier);
            const identifier = normalizeIdentifier(rawIdentifier);
            const isEmail = identifier.includes("@");

            try {
                const column = isEmail ? "email" : "phone";
                const { data, error } = await window.supabase.from("users").select("*").eq(column, identifier).limit(1);
                if (error) {
                    console.warn("[Auth] Supabase query failed:", error.message);
                    return { exists: false };
                }
                if (data && data.length > 0) {
                    console.log("[Auth] Found in Supabase:", data[0]);
                    let resolvedEmail = data[0].email || (isEmail ? identifier : `${identifier}@paomobile.auth`);
                    return { exists: true, email: resolvedEmail };
                }
                return { exists: false };
            } catch (error) {
                console.error("[Auth] Error checking identifier:", error);
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

        window.transitionToVerification = async (name) => {
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
                const { data, error } = await window.supabase.auth.getUser();
                const user = data ? data.user : null;
                if (user && user.email_confirmed_at) {
                    updateUIForVerified(name);
                } else {
                    updateUIForUnverified();
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

        function updateUIForUnverified() {
            document.getElementById("successIcon").style.display = "none";
            document.getElementById("verifyIcon").style.display = "flex";
            document.getElementById("statusTitle").textContent = "กรุณายืนยันอีเมล";
            const user = auth.currentUser;
            const emailStr = user ? user.email : "อีเมลของคุณ";
            document.getElementById("statusText").innerHTML = `เราได้ส่งลิงก์ยืนยันไปที่ <b>${emailStr}</b> เรียบร้อยแล้วค่ะ<br>กรุณาคลิกลิงก์ในอีเมลเพื่อเปิดใช้งานบัญชีค่ะ`;
            document.getElementById("btnCheckVerify").style.display = "none";
            document.getElementById("btnSuccessFinish").style.display = "block";
            document.getElementById("btnSuccessFinish").textContent = "ไปหน้าเข้าสู่ระบบ";
            document.getElementById("btnSuccessFinish").onclick = () => window.location.reload();
            
            document.getElementById("verifyArea").style.display = "block";
        }

        let lastEmailSentTime = 0;
        const RESEND_COOLDOWN = 60000; // Increased to 60 seconds to match Firebase

        window.checkVerificationState = async (auto = false) => {
            const { data, error } = await window.supabase.auth.getUser();
                const user = data ? data.user : null;
            if (!user) return;

            if (!auto) {
                showLoading("Checking status...");
            }

            if (user.email_confirmed_at) {
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

                const { error: resetError } = await window.supabase.auth.resetPasswordForEmail(targetEmail, {
                    redirectTo: window.location.origin + '/login.html?mode=reset'
                });
                if (resetError) throw resetError;
                console.log("[Auth] Supabase Success: Reset email sent.");

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
            const emailEl = document.getElementById("emailInput");
            const regEmailEl = document.getElementById("regEmail");
            const userEmail = (emailEl && emailEl.value.trim()) || (regEmailEl && regEmailEl.value.trim()) || "";
            if (!userEmail) {
                alert("กรุณาระบุอีเมลที่ต้องการส่งลิงก์ยืนยันครับ");
                return;
            }

            if (userEmail.endsWith("@paomobile.auth")) {
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
                const { error } = await window.supabase.auth.resend({ type: "signup", email: userEmail });
                if (error) throw error;
                lastEmailSentTime = Date.now();
                startResendCountdown();
                alert("สำเร็จ! เราได้ส่งลิงก์ยืนยันบัญชีไปให้คุณอีกครั้งแล้วครับ กรุณาตรวจสอบในกล่องจดหมาย (หรือในหน้า 'จดหมายขยะ', 'ถังขยะ' หรือ 'โปรโมชัน') นะครับ");
            } catch (error) {
                console.error("[Auth] Resend verification error:", error);
                if (error.status === 429 || (error.message && error.message.includes("rate limit"))) {
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
                console.warn("[Auth] Restricted browser detected.");
            }
            return isRestricted;
        }

        function normalizeIdentifier(val) {
            const trimmed = val.trim();
            if (trimmed.includes("@")) return trimmed.toLowerCase();
            // Remove all non-digits for phone numbers
            return trimmed.replace(/\D/g, "");
        }

        // --- Auth Initializer (Sequenced Flow) ---
        async function initAuth() {
            if (!auth) return;

            // 1. Handle actual logout request (Wait for it to finish)
            if (localStorage.getItem('pao_logout_pending')) {
                console.log("[Auth] Logout signal detected. Forcing signOut...");
                showLoading(); // Ensure spinner is up
                await auth.signOut();
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
        onAuthStateChanged(auth, async (user) => {
            console.log("[Auth] Observer: State changed. Registering:", isRegistering, "Navigating:", isNavigating);
            if (isCheckingRedirect || isRegistering) {
                console.log("[Auth] Observer: BLOCKED (Redirect check or Registering)");
                return;
            }

            if (user && !isNavigating) {
                console.log("[Auth] State: IN -> Initializing session for:", user.email, "Verified:", user.emailVerified);

                if ((!user.emailVerified && !(user.email || '').endsWith('@paomobile.auth') && !(user.providerData || []).some(p => p.providerId === 'google.com'))) {
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
                const result = await getRedirectResult(auth);
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

            const localUserStr = localStorage.getItem('paomobile_user');
            if (localUserStr) {
                const localUser = JSON.parse(localUserStr);
                const isPhone = localUser.email && localUser.email.endsWith('@paomobile.auth');
                if (!localUser.isVerified && !isPhone) {
                    console.warn("[Auth] finishLogin BLOCKED: Email not verified");
                    isNavigating = false;
                    hideLoading();
                    window.transitionToVerification(name || localUser.name || localUser.email.split('@')[0]);
                    return;
                }
            } else {
                const user = auth.currentUser;
                if (user && (!user.emailVerified && !(user.email || '').endsWith('@paomobile.auth') && !(user.providerData || []).some(p => p.providerId === 'google.com'))) {
                    console.warn("[Auth] finishLogin BLOCKED: Email not verified");
                    isNavigating = false;
                    hideLoading();
                    window.transitionToVerification(name || user.displayName || user.email.split('@')[0]);
                    return;
                }
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

        // --- Save user data to Firestore (Version 1.6.1 - Non-blocking UI) ---
        async function saveUserToFirestore(user, provider) {
            console.log("[Auth] Syncing profile with Cloud...");

            let finalName = user.displayName || 'Member';
            let finalAvatar = user.photoURL || "";

            // 1. Prepare local userData immediately (Don't wait for Firestore)
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

            // Save to local session IMMEDIATELY so app feels fast
            localStorage.setItem('paomobile_user', JSON.stringify(userData));

            // 2. Background Firestore update (Don't await it to block logic, unless you really need existing data)
            if (db) {
                const userRef = doc(db, "users", user.uid);
                // We use Doc Fetch in background
                getDoc(userRef).then(snap => {
                    if (snap.exists()) {
                        const existing = snap.data();
                        // Merge and update local storage if Firestore has newer info
                        const updatedData = { ...userData, name: existing.name || finalName, avatar: existing.avatar || finalAvatar };
                        localStorage.setItem('paomobile_user', JSON.stringify(updatedData));
                    }
                    // Final background write
                    return setDoc(userRef, { ...userData, lastLogin: new Date() }, { merge: true });
                }).catch(e => console.warn("[Auth] Cloud Background Sync Error:", e.message));
            }
        }

        // Handle Google Login
        const btnGoogle = document.getElementById('btnGoogleLogin');
        if (btnGoogle) {
            btnGoogle.addEventListener('click', async () => {
                if (detectRestrictedBrowser()) return;

                showLoading("Google Auth Start");

                try {
                    console.log("[Auth] Attempting Supabase Google OAuth...");
                    // Using window.supabase from db.js
                    const { data, error } = await window.supabase.auth.signInWithOAuth({
                        provider: 'google',
                        options: {
                            // Supabase will redirect back to this page.
                            // Note: Google Auth requires running on http://localhost or a real domain.
                            // It will not work on file:/// URLs.
                            redirectTo: window.location.href
                        }
                    });
                    
                    if (error) throw error;
                    // The page will redirect to Google, so we just wait.
                } catch (error) {
                    console.error("[Auth] Google Auth Error:", error);
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
                const identifier = normalizeIdentifier(emailInput.value);
                if (!identifier) return;

                if (identifier.endsWith('@paomobile.auth')) {
                    hideLoading();
                    alert("กรุณาใช้เบอร์โทรศัพท์ 10 หลัก ให้ถูกต้อง");
                    return;
                }

                showLoading();
                
                let res;
                try {
                    res = await window.checkIdentifierExists(identifier);

                    if (!res.exists) {
                        hideLoading();
                        if (!document.getElementById("customNotFoundModal")) {
                            const style = document.createElement("style");
                            style.textContent = ` .custom-modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 9999; opacity: 0; visibility: hidden; transition: all 0.3s ease; } .custom-modal-overlay.active { opacity: 1; visibility: visible; } .custom-modal { background: #fff; border-radius: 24px; padding: 32px; width: 90%; max-width: 400px; text-align: center; box-shadow: 0 20px 40px rgba(0,0,0,0.1); transform: scale(0.9); transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); } .custom-modal-overlay.active .custom-modal { transform: scale(1); } .modal-icon { width: 64px; height: 64px; border-radius: 50%; background: #fee2e2; color: #ef4444; display: flex; align-items: center; justify-content: center; font-size: 32px; margin: 0 auto 20px; } .modal-title { font-size: 20px; font-weight: 700; color: #111; margin-bottom: 12px; font-family: "Noto Sans Thai", sans-serif; } .modal-desc { font-size: 15px; color: #666; margin-bottom: 24px; line-height: 1.5; font-family: "Noto Sans Thai", sans-serif; } .modal-buttons { display: flex; flex-direction: column; gap: 12px; } .btn-modal-primary { width: 100%; padding: 14px; border-radius: 12px; border: none; background: linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%); color: white; font-weight: 600; font-size: 16px; cursor: pointer; font-family: "Noto Sans Thai", sans-serif; transition: all 0.2s; box-shadow: 0 4px 15px rgba(37, 99, 235, 0.3); } .btn-modal-secondary { width: 100%; padding: 14px; border-radius: 12px; border: 1px solid #e5e7eb; background: #fff; color: #4b5563; font-weight: 600; font-size: 16px; cursor: pointer; font-family: "Noto Sans Thai", sans-serif; transition: all 0.2s; } `;
                            document.head.appendChild(style);
                            const overlay = document.createElement("div");
                            overlay.id = "customNotFoundModal";
                            overlay.className = "custom-modal-overlay";
                            overlay.innerHTML = ` <div class="custom-modal"> <div class="modal-icon">🔍</div> <h3 class="modal-title">ไม่พบบัญชีผู้ใช้</h3> <p class="modal-desc">อีเมลนี้ยังไม่ได้ลงทะเบียนในระบบค่ะ คุณต้องการสมัครสมาชิกใหม่ หรือลองเข้าสู่ระบบอีกครั้ง?</p> <div class="modal-buttons"> <button class="btn-modal-primary" id="btnModalRegisterDynamic">สร้างบัญชีใหม่</button> <button class="btn-modal-secondary" id="btnModalLoginAnywayDynamic">ลองเข้าสู่ระบบใหม่</button> </div> </div> `;
                            document.body.appendChild(overlay);
                            document.getElementById("btnModalRegisterDynamic").addEventListener("click", () => { document.getElementById("customNotFoundModal").classList.remove("active"); const registerView = document.getElementById("registerView"); const loginView = document.getElementById("loginView"); if (registerView && loginView) { loginView.style.display = "none"; registerView.style.display = "block"; const regEmail = document.getElementById("regEmail"); if (regEmail) { regEmail.value = document.getElementById("emailInput").value; regEmail.dispatchEvent(new Event("input", { bubbles: true })); } window.scrollTo({ top: 0, behavior: "smooth" }); } });
                            document.getElementById("btnModalLoginAnywayDynamic").addEventListener("click", () => { document.getElementById("customNotFoundModal").classList.remove("active"); document.getElementById("passwordGroup").style.display = "block"; document.getElementById("btnEmailLogin").textContent = "เข้าสู่ระบบ"; });
                        }
                        setTimeout(() => document.getElementById("customNotFoundModal").classList.add("active"), 50);
                        return;
                    }
                } catch (e) {
                    console.error("Caught checkIdentifier error:", e); alert("Error: " + e.message);
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
                    let finalUser;
                    
                    // 1. Try Supabase Auth First (New Users)
                    const { data: sbData, error: sbError } = await window.supabase.auth.signInWithPassword({
                        email: res.email,
                        password: password
                    });
                    
                    if (sbError) {
                        console.warn("[Auth] Supabase login failed, trying Firebase fallback...", sbError.message);
                        
                        // 2. Try Firebase Auth Fallback (Old Users)
                        const fbCred = await signInWithEmailAndPassword(auth, res.email, password);
                        const oldUser = fbCred.user;
                        console.log("[Auth] Firebase Fallback Login Success:", oldUser.email);
                        
                        // 3. LAZY MIGRATION: Auto-create Supabase account
                        const { data: migrateData, error: migrateError } = await window.supabase.auth.signUp({
                            email: res.email,
                            password: password,
                            options: {
                                data: { is_migrated: true }
                            }
                        });

                        if (migrateError || !migrateData.user) {
                            console.warn("[Auth] Lazy Migration to Supabase Auth failed (maybe already migrated?):", migrateError ? migrateError.message : "User already exists (Email Enumeration Protection)");
                            finalUser = oldUser;
                        } else {
                            const newUid = migrateData.user.id;
                            const oldUid = oldUser.uid;
                            console.log("[Auth] Migrated to Supabase Auth! Mapping DB from", oldUid, "to", newUid);
                            
                            // 4. Update Database references to point to the new Supabase UID
                            try {
                                await Promise.all([
                                    window.supabase.from('users').update({ id: newUid, uid: newUid }).eq('id', oldUid),
                                    window.supabase.from('orders').update({ customer: newUid }).eq('customer', oldUid),
                                    window.supabase.from('chats').update({ id: newUid }).eq('id', oldUid),
                                    window.supabase.from('chat_messages').update({ sender: newUid }).eq('sender', oldUid),
                                    window.supabase.from('status').update({ id: newUid }).eq('id', oldUid)
                                ]);
                                console.log("[Auth] Database successfully mapped to new Supabase UID!");
                            } catch (mapErr) {
                                console.error("[Auth] Database mapping failed:", mapErr);
                            }
                            
                            finalUser = {
                                uid: newUid,
                                email: migrateData.user.email,
                                displayName: migrateData.user.user_metadata?.name || oldUser.displayName || migrateData.user.email.split('@')[0],
                                photoURL: migrateData.user.user_metadata?.avatar || oldUser.photoURL || "",
                                emailVerified: migrateData.user.email_confirmed_at ? true : oldUser.emailVerified,
                                providerData: migrateData.user.app_metadata?.providers?.map(p => ({ providerId: p + '.com' })) || []
                            };
                        }
                    } else {
                        // Supabase Success
                        const sbUser = sbData.user;
                        finalUser = {
                            uid: sbUser.id,
                            email: sbUser.email,
                            displayName: sbUser.user_metadata?.name || sbUser.email.split('@')[0],
                            photoURL: sbUser.user_metadata?.avatar || "",
                            emailVerified: !!sbUser.email_confirmed_at,
                            providerData: sbUser.app_metadata?.providers?.map(p => ({ providerId: p + '.com' })) || []
                        };
                        console.log("[Auth] Supabase Login Success:", finalUser.email);
                    }

                    await saveUserToFirestore(finalUser, 'email_login');
                    finishLogin(finalUser.displayName || finalUser.email.split('@')[0]);
                } catch (error) {
                    isNavigating = false;
                    hideLoading();
                    console.error("[Auth] Login error:", error.code || error.message);
                    if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential' || (error.message && error.message.includes('Invalid login'))) {
                        alert("รหัสผ่านไม่ถูกต้องครับ");
                    } else {
                        alert("เกิดข้อผิดพลาด: " + (error.message || error.code));
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
                    const { data: cred, error: signUpError } = await window.supabase.auth.signUp({ email: email, password: password });
                    if (signUpError) throw signUpError;
                    if (!cred || !cred.user) {
                        throw { message: "อีเมลนี้ถูกลงทะเบียนไปแล้ว หรือระบบได้ส่งลิงก์ยืนยันไปที่อีเมลนี้แล้วครับ" };
                    }
                    console.log("[Auth] Supabase User Created:", cred.user.id);
                    const name = email.split('@')[0];

                    // Background persistence (Non-blocking)

                    window.supabase.from("users").insert([{
                        uid: cred.user.id,
                        name: name,
                        email: email,
                        phone: "",
                        marketing: document.getElementById("checkMarketing").checked,
                        provider: "email_registration"
                    }]).then(() => console.log("[Auth] Supabase persistence complete."));
                    
                    console.log("[Auth] Forcing verification email send via Supabase resend...");
                    window.supabase.auth.resend({ type: "signup", email: email }).catch(e => console.warn(e));
                    // Switch to Verification View
                    window.transitionToVerification(name);                } catch (error) {
                    console.error("[Auth] Registration caught error:", error);
                    isRegistering = false;
                    isNavigating = false;
                    hideLoading(true, "Registration error alert");
                    if (error.code === 'auth/email-already-in-use') {
                        alert("อีเมลหรือเบอร์โทรนี้ถูกใช้งานไปแล้วครับ");
                    } else {
                        // Only alert if it's NOT a reference error we just fixed, 
                        // but better yet, just show the error if it's actually an auth error.
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
    
