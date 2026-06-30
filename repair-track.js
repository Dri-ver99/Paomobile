async function searchJobs() {
    const q = document.getElementById('repairSearchInput').value.trim().toLowerCase();
    const container = document.getElementById('resultsContainer');
    
    // If q is empty, we will just fetch all jobs to show them all, as requested by the user.

    container.innerHTML = `<div class="empty-state">กำลังค้นหาข้อมูล...</div>`;

    try {
        const { data, error } = await window.getSupabaseClient().from('repair_jobs').select('*');
        if (error) throw error;
        
        window.currentTrackedJobs = data || [];
        const jobs = window.currentTrackedJobs;
        
        // Update global stats
        if (jobs && jobs.length > 0) {
            const repairingCount = jobs.filter(j => j.status === 'repairing').length;
            const completedCount = jobs.filter(j => j.status === 'completed').length;
            const returnedCount = jobs.filter(j => j.status === 'returned').length;
            
            document.getElementById('cStatRepairing').textContent = repairingCount;
            document.getElementById('cStatCompleted').textContent = completedCount;
            document.getElementById('cStatReturned').textContent = returnedCount;
            document.getElementById('customerStats').style.display = 'flex';
        } else {
            document.getElementById('customerStats').style.display = 'none';
        }

        const filtered = q ? jobs.filter(j => 
            (j.id && j.id.toLowerCase().includes(q)) ||
            (j.customerName && j.customerName.toLowerCase().includes(q)) ||
            (j.deviceModel && j.deviceModel.toLowerCase().includes(q)) ||
            (j.issue && j.issue.toLowerCase().includes(q))
        ) : jobs;

        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="empty-state animate-up">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom:20px; color:#ef4444;"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                    <h3>ไม่พบข้อมูลงานซ่อม</h3>
                    <p>ลองตรวจสอบการสะกดชื่อ หรือรหัสงานซ่อมอีกครั้ง</p>
                </div>
            `;
            return;
        }

        renderResults(filtered);

    } catch (err) {
        console.error(err);
        container.innerHTML = `<div class="empty-state" style="color:#ef4444;">เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล</div>`;
    }
}

function formatDateFull(isoString) {
    if (!isoString) return '-';
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }) + ' เวลา ' + 
           d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.';
}

function renderResults(jobs) {
    const container = document.getElementById('resultsContainer');
    
    // Sort by latest first
    jobs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    let html = '';
    
    jobs.forEach((job, index) => {
        const delay = index * 0.1;
        const status = job.status || 'received';
        
        // Define timeline active/completed classes
        const s1Class = status === 'received' ? 'active' : 'completed';
        
        let s2Class = '';
        if (status === 'repairing') s2Class = 'active';
        else if (status === 'completed' || status === 'returned') s2Class = 'completed';
        
        let s3Class = '';
        if (status === 'completed' || status === 'returned') s3Class = 'completed';

        let statusText = 'รับเครื่องแล้ว';
        let statusColor = '#ee4d2d';
        let statusBg = 'rgba(238,77,45,0.1)';
        if (status === 'repairing') {
            statusText = 'กำลังซ่อม';
            statusColor = '#2f54eb';
            statusBg = 'rgba(47,84,235,0.1)';
        } else if (status === 'completed' || status === 'returned') {
            statusText = 'เสร็จงาน';
            statusColor = '#10b981';
            statusBg = 'rgba(16,185,129,0.1)';
        }

        html += `
            <div class="job-card animate-up" style="animation-delay: ${delay}s; cursor: pointer;" onclick="openRepairDetails('${job.id}')">
                <div class="job-header" style="display:flex; justify-content:space-between; align-items:center;">
                    <div style="display:flex; flex-direction:column; gap:4px;">
                        <div style="display:flex; align-items:center; gap:12px;">
                            <div class="job-customer">คุณ ${job.customerName}</div>
                            <div class="job-id">#${job.id.startsWith('R-') ? job.id.replace('R-', 'RP-') : job.id}</div>
                        </div>
                        <div style="display:flex; align-items:center; gap:8px; font-size:0.85rem; color:#64748b; flex-wrap:wrap;">
                            <div>รุ่น: <span style="color:#0f172a; font-weight:500;">${job.deviceModel}</span></div>
                            <div style="color:#cbd5e1;">|</div>
                            <div>สาขา: <span style="color:#0f172a; font-weight:500;">${job.branch || 'ไม่ระบุ'}</span></div>
                            <div style="color:#cbd5e1;">|</div>
                            <div>อาการ: <span style="color:#ee4d2d; font-weight:500;">${job.issue}</span></div>
                        </div>
                    </div>
                    <div style="text-align:right; display:flex; flex-direction:column; align-items:flex-end; gap:4px;">
                        <div style="padding:4px 12px; border-radius:12px; font-size:0.85rem; font-weight:600; color:${statusColor}; background:${statusBg};">${statusText}</div>
                        <div style="font-size:0.7rem; color:#94a3b8;">(กดดูรายละเอียด ▾)</div>
                    </div>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}



// Automatically load all jobs when the page opens
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => { searchJobs(); }, 500);
});

window.openRepairDetails = (id) => {
    const job = window.currentTrackedJobs.find(j => j.id === id);
    if (!job) return;

    document.getElementById('detailTitle').textContent = 'รหัสงาน: ' + (job.id.startsWith('R-') ? job.id.replace('R-', 'RP-') : job.id);
    
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
                    <div class="step-title" style="font-size:1.05rem; color:#10b981;">รับเครื่องซ่อมเรียบร้อย</div>
                    <div class="step-time">${formatDateFull(job.receivedAt)}</div>
                </div>
            </div>
            <div class="timeline-step ${s2Class}">
                <div class="step-dot"></div>
                <div class="step-content">
                    <div class="step-title" style="font-size:1.05rem; ${s2Class === 'active' || s2Class === 'completed' ? 'color:#10b981;' : ''}">กำลังดำเนินการซ่อม</div>
                    <div class="step-time">${job.repairingAt ? formatDateFull(job.repairingAt) : '-'}</div>
                </div>
            </div>
            <div class="timeline-step ${s3Class}" style="margin-bottom:0;">
                <div class="step-dot"></div>
                <div class="step-content">
                    <div class="step-title" style="font-size:1.05rem; ${s3Class === 'completed' ? 'color:#10b981;' : ''}">${finalStepText}</div>
                    <div class="step-time">${job.completedAt || job.returnedAt ? formatDateFull(job.completedAt || job.returnedAt) : '-'}</div>
                </div>
            </div>
        </div>
    `;

    document.getElementById('detailContent').innerHTML = content;
    document.getElementById('repairDetailsModal').style.display = 'flex';
};

window.closeRepairDetails = () => {
    document.getElementById('repairDetailsModal').style.display = 'none';
};
