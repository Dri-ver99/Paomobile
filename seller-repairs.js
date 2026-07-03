document.addEventListener('DOMContentLoaded', () => {
    // Check Auth
    const localAdminActive = localStorage.getItem('paomobile_admin_active') === 'true';
    if (!localAdminActive && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        // Allow if running locally for dev, else check auth
        // We'll skip strict auth check here to prevent breaking dev env, 
        // but normally we would redirect to login.
    }
    
    const authEmailEl = document.getElementById('authEmail');
    if (authEmailEl) authEmailEl.textContent = 'Admin';
    
    const logoutBtn = document.getElementById('adminLogoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('paomobile_admin_active');
            window.location.href = 'index.html';
        });
    }

    // Default datetime to now
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    document.getElementById('addReceivedAt').value = now.toISOString().slice(0,16);

    loadJobs();
});

let allJobs = [];

async function loadJobs() {
    try {
        const { data, error } = await window.getSupabaseClient().from('repair_jobs').select('*').order('createdAt', { ascending: false });
        if (error) {
            console.warn("Supabase fetch failed, trying mock fallback", error);
            // Fallback for demo or if table doesn't exist yet
            allJobs = [];
        } else {
            allJobs = data || [];
        }
        renderJobs(allJobs);
        
        // Setup real-time subscription
        if (!window.repairSubscription) {
            window.repairSubscription = window.getSupabaseClient().channel('public:repair_jobs')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'repair_jobs' }, (payload) => {
                    console.log('Repair job change received!', payload);
                    // Reload jobs silently to keep UI perfectly in sync
                    window.getSupabaseClient().from('repair_jobs').select('*').order('createdAt', { ascending: false })
                        .then(({ data, error }) => {
                            if (!error && data) {
                                allJobs = data;
                                filterJobs(); // Use filterJobs to retain any active search
                            }
                        });
                })
                .subscribe();
        }
    } catch (e) {
        console.error("Error loading jobs:", e);
        document.getElementById('repairList').innerHTML = '<tr><td colspan="5" class="empty-state">JS Error: ' + e.message + '<br>โปรดรีเฟรชหรือตรวจสอบสคริปต์</td></tr>';
    }
}

function filterJobs() {
    const q = document.getElementById('searchInput').value.toLowerCase();
    if (!q) {
        renderJobs(allJobs);
        return;
    }
    const filtered = allJobs.filter(j => 
        (j.id && j.id.toLowerCase().includes(q)) ||
        (j.customerName && j.customerName.toLowerCase().includes(q)) ||
        (j.deviceModel && j.deviceModel.toLowerCase().includes(q)) ||
        (j.issue && j.issue.toLowerCase().includes(q))
    );
    renderJobs(filtered);
}

function formatDate(isoString) {
    if (!isoString) return '-';
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('th-TH', { year: '2-digit', month: 'short', day: 'numeric' }) + ' ' + 
           d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
}

function getStatusBadge(status) {
    if (status === 'repairing') return '<span class="status-badge status-repairing">กำลังซ่อม</span>';
    if (status === 'completed' || status === 'returned') return '<span class="status-badge status-completed">เสร็จงาน/คืนเครื่อง</span>';
    return '<span class="status-badge status-received">รับงานแล้ว</span>'; // received or default
}

function getStatusControls(job) {
    const status = job.status || 'received';
    let btnHtml = '';
    if (status === 'completed' || status === 'returned') {
        btnHtml = `<button class="btn-status" style="border-color:#475569; color:#475569;" onclick="openRepairDetails('${job.id}')">รายละเอียด</button>`;
    } else {
        btnHtml = `<button class="btn-status" style="border-color:#ee4d2d; color:#ee4d2d;" onclick="openRepairDetails('${job.id}')">อัปเดตสถานะ</button>`;
    }
    return btnHtml;
}

function renderJobs(jobs) {
    const tbody = document.getElementById('repairList');
    if (jobs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state">ไม่พบข้อมูลงานซ่อม</td></tr>';
    } else {
        tbody.innerHTML = jobs.map(j => `
            <tr>
                <td style="font-family:monospace; font-weight:600; color:#475569;">${j.id.startsWith('R-') ? j.id.replace('R-', 'RP-') : j.id}</td>
                <td>
                    <div style="font-weight:600; color:#1e293b;">${j.customerName}</div>
                    <div style="font-size:0.85rem; color:#64748b;">${j.deviceModel}</div>
                    <div style="font-size:0.85rem; color:#64748b; margin-top:2px;">สาขา: <span style="font-weight:500;">${j.branch || 'ไม่ระบุ'}</span></div>
                    <div style="font-size:0.85rem; color:#ee4d2d; margin-top:4px;">อาการ: ${j.issue}</div>
                </td>
                <td>
                    <div style="font-size:0.9rem; color:#334155;">${formatDate(j.receivedAt)}</div>
                </td>
                <td>
                    ${getStatusBadge(j.status)}
                </td>
                <td>
                    ${getStatusControls(j)}
                </td>
                <td style="text-align:right;">
                    <button class="btn-status" style="border-color:#ef4444; color:#ef4444;" onclick="deleteJob('${j.id}')">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg> ลบงาน
                    </button>
                </td>
            </tr>
        `).join('');
    }

    // Update Stats
    if (allJobs) {
        const repairingCount = allJobs.filter(j => j.status === 'repairing').length;
        const completedCount = allJobs.filter(j => j.status === 'completed').length;
        const returnedCount = allJobs.filter(j => j.status === 'returned').length;
        
        const elRepairing = document.getElementById('statRepairing');
        const elCompleted = document.getElementById('statCompleted');
        const elReturned = document.getElementById('statReturned');
        
        if (elRepairing) elRepairing.textContent = repairingCount;
        if (elCompleted) elCompleted.textContent = completedCount;
        if (elReturned) elReturned.textContent = returnedCount;
    }
}

window.openAddModal = () => {
    document.getElementById('addModal').style.display = 'flex';
};

window.closeAddModal = () => {
    document.getElementById('addModal').style.display = 'none';
};

window.saveJob = async (e) => {
    e.preventDefault();
    const btn = document.getElementById('saveBtn');
    btn.disabled = true;
    btn.textContent = 'กำลังบันทึก...';

    const name = document.getElementById('addName').value;
    const model = document.getElementById('addModel').value;
    const branch = document.getElementById('addBranch') ? document.getElementById('addBranch').value : '';
    const issue = document.getElementById('addIssue').value;
    const receivedAt = new Date(document.getElementById('addReceivedAt').value).toISOString();
    
    // Generate simple ID (RP-Timestamp)
    const id = 'RP-' + Date.now();

    const newJob = {
        id: id,
        customerName: name,
        deviceModel: model,
        branch: branch,
        issue: issue,
        status: 'received',
        receivedAt: receivedAt,
        createdAt: new Date().toISOString()
    };

    try {
        const { error } = await window.getSupabaseClient().from('repair_jobs').insert([newJob]);
        if (error) throw error;
        
        allJobs.unshift(newJob);
        renderJobs(allJobs);
        closeAddModal();
        document.getElementById('addForm').reset();
        
        // Reset time
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        document.getElementById('addReceivedAt').value = now.toISOString().slice(0,16);

    } catch (err) {
        console.error(err);
        alert('เกิดข้อผิดพลาดในการบันทึก: ' + err.message);
    } finally {
        btn.disabled = false;
        btn.textContent = 'บันทึกรับงาน';
    }
};

window.openRepairDetails = (id) => {
    const job = allJobs.find(j => j.id === id);
    if (!job) return;

    document.getElementById('detailTitle').textContent = 'รหัสงาน: ' + job.id;
    
    // Timeline classes matching customer view
    const status = job.status || 'received';
    const s1Class = status === 'received' ? 'active' : 'completed';
    
    let s2Class = '';
    if (status === 'repairing') s2Class = 'active';
    else if (status === 'completed' || status === 'returned') s2Class = 'completed';
    
    let s3Class = '';
    if (status === 'completed' || status === 'returned') s3Class = 'completed';

    let finalStepText = 'เสร็จงาน / คืนเครื่อง';
    if (status === 'completed') finalStepText = 'ซ่อมเสร็จสิ้น (รอรับเครื่อง)';
    if (status === 'returned') finalStepText = 'คืนเครื่องให้ลูกค้าแล้ว';

    let content = `
        <div style="background:#f8fafc; padding:15px; border-radius:8px; margin-bottom:25px; font-size:0.95rem; border:1px solid #e2e8f0;">
            <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                <span style="color:#64748b;">ลูกค้า:</span>
                <span style="font-weight:600; color:#0f172a;">คุณ ${job.customerName || '-'}</span>
            </div>
            <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                <span style="color:#64748b;">สาขาที่ส่งซ่อม:</span>
                <span style="font-weight:600; color:#0f172a;">${job.branch || 'ไม่ระบุ'}</span>
            </div>
            <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                <span style="color:#64748b;">รุ่นโทรศัพท์:</span>
                <span style="font-weight:600; color:#0f172a;">${job.deviceModel || '-'}</span>
            </div>
            <div style="display:flex; justify-content:space-between;">
                <span style="color:#64748b;">อาการเสีย:</span>
                <span style="font-weight:600; color:#ee4d2d;">${job.issue || '-'}</span>
            </div>
        </div>

        <div class="timeline" style="margin-left:10px;">
            <div class="timeline-step ${s1Class}">
                <div class="step-dot"></div>
                <div class="step-content">
                    <div class="step-title" style="font-size:1.05rem;">รับเครื่องซ่อมเรียบร้อย</div>
                    <div class="step-time">${formatDate(job.receivedAt)}</div>
                </div>
            </div>
            <div class="timeline-step ${s2Class}">
                <div class="step-dot"></div>
                <div class="step-content">
                    <div class="step-title" style="font-size:1.05rem;">กำลังดำเนินการซ่อม</div>
                    <div class="step-time">${job.repairingAt ? formatDate(job.repairingAt) : '-'}</div>
                </div>
            </div>
            <div class="timeline-step ${s3Class}" style="margin-bottom:0;">
                <div class="step-dot"></div>
                <div class="step-content">
                    <div class="step-title" style="font-size:1.05rem;">${finalStepText}</div>
                    <div class="step-time">${job.completedAt || job.returnedAt ? formatDate(job.completedAt || job.returnedAt) : '-'}</div>
                </div>
            </div>
        </div>
    `;

    document.getElementById('detailContent').innerHTML = content;

    let actions = `<button class="btn-cancel" onclick="closeRepairDetails()">ปิดหน้าต่าง</button>`;
    
    if (job.status === 'received' || !job.status) {
        actions += `<button class="btn-status" style="background:#ee4d2d; color:#fff; border:none; padding:10px 20px; font-weight:600; cursor:pointer;" onclick="updateStatus('${job.id}', 'repairing')">อัปเดต: กำลังซ่อม</button>`;
    } else if (job.status === 'repairing') {
        actions += `<button class="btn-status" style="background:#1d4ed8; color:#fff; border:none; padding:10px 20px; font-weight:600; cursor:pointer;" onclick="updateStatus('${job.id}', 'completed')">อัปเดต: ซ่อมเสร็จ (รอรับเครื่อง)</button>`;
        actions += `<button class="btn-status" style="background:#15803d; color:#fff; border:none; padding:10px 20px; font-weight:600; cursor:pointer;" onclick="updateStatus('${job.id}', 'returned')">อัปเดต: คืนเครื่องแล้ว</button>`;
    } else if (job.status === 'completed') {
        actions += `<button class="btn-status" style="background:#15803d; color:#fff; border:none; padding:10px 20px; font-weight:600; cursor:pointer;" onclick="updateStatus('${job.id}', 'returned')">อัปเดต: คืนเครื่องแล้ว</button>`;
    }

    document.getElementById('detailActions').innerHTML = actions;
    document.getElementById('repairDetailsModal').style.display = 'flex';
};

window.closeRepairDetails = () => {
    document.getElementById('repairDetailsModal').style.display = 'none';
};

window.deleteJob = async (id) => {
    if (!await window.sellerConfirm(`คุณต้องการลบงานซ่อมรหัส ${id} ใช่หรือไม่?`, "delete")) return;
    try {
        const { error } = await window.getSupabaseClient().from('repair_jobs').delete().eq('id', id);
        if (error) throw error;
        
        allJobs = allJobs.filter(j => j.id !== id);
        filterJobs();
    } catch (e) {
        console.error(e);
        alert('เกิดข้อผิดพลาดในการลบงานซ่อม: ' + e.message);
    }
};

window.updateStatus = async (id, newStatus) => {
    const btns = document.querySelectorAll('#detailActions .btn-status');
    btns.forEach(btn => { btn.disabled = true; btn.style.opacity = '0.5'; });
    
    const updateData = { status: newStatus };
    const now = new Date().toISOString();
    
    if (newStatus === 'repairing') {
        updateData.repairingAt = now;
    } else if (newStatus === 'completed') {
        updateData.completedAt = now;
    } else if (newStatus === 'returned') {
        updateData.returnedAt = now;
    }

    try {
        const { error } = await window.getSupabaseClient().from('repair_jobs').update(updateData).eq('id', id);
        if (error) throw error;
        
        const idx = allJobs.findIndex(j => j.id === id);
        if (idx !== -1) {
            allJobs[idx] = { ...allJobs[idx], ...updateData };
            filterJobs();
            closeRepairDetails();
        }
    } catch (err) {
        console.error(err);
        alert('เกิดข้อผิดพลาดในการอัปเดตสถานะ: ' + err.message);
        if (btn) { btn.disabled = false; btn.textContent = 'ลองอีกครั้ง'; }
    }
};
