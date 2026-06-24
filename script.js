document.addEventListener('DOMContentLoaded', () => {
    
    // Removed year setter since footer was removed

    let isAdmin = false;
    /* =========================================
       Theme Toggle
       ========================================= */
    const themeToggleBtn = document.getElementById('theme-toggle');
    const currentTheme = localStorage.getItem('theme') || 'light';
    if (currentTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        if (themeToggleBtn) themeToggleBtn.innerHTML = '<i class="fa fa-sun"></i>';
    }
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            if (theme === 'dark') {
                document.documentElement.setAttribute('data-theme', 'dark');
                themeToggleBtn.innerHTML = '<i class="fa fa-sun"></i>';
            } else {
                document.documentElement.removeAttribute('data-theme');
                themeToggleBtn.innerHTML = '<i class="fa fa-moon"></i>';
            }
            localStorage.setItem('theme', theme);
        });
    }

    /* =========================================
       Mobile Drawer
       ========================================= */
    const hamburger = document.getElementById('hamburger');
    const navLinksContainer = document.getElementById('nav-links');
    if (hamburger && navLinksContainer) {
        hamburger.addEventListener('click', () => {
            navLinksContainer.classList.toggle('active');
        });
    }

    /* =========================================
       DOM Elements
       ========================================= */
    const views = document.querySelectorAll('.view-section');
    const navLinks = document.querySelectorAll('.nav-link');
    const loginTrigger = document.getElementById('login-trigger');
    const logoutTrigger = document.getElementById('logout-trigger');
    
    // Modals
    const loginModal = document.getElementById('login-modal');
    const editModal = document.getElementById('edit-modal');
    const loginForm = document.getElementById('login-form');
    const editForm = document.getElementById('edit-form');
    
    // Containers
    const portContainer = document.getElementById('port-container');
    const classExpContainer = document.getElementById('class_experience-container');

    /* =========================================
       SPA Navigation & GSAP
       ========================================= */
    gsap.registerPlugin(ScrollTrigger, TextPlugin);

    function showView(viewId) {
        // Hide all views
        views.forEach(v => {
            v.style.display = 'none';
            v.classList.remove('active');
        });
        
        // Update nav links
        navLinks.forEach(link => {
            if(link.getAttribute('data-view') === viewId) link.classList.add('active');
            else link.classList.remove('active');
        });

        // Show target view
        const target = document.getElementById(`view-${viewId}`);
        if(target) {
            target.style.display = 'block';
            target.classList.add('active');
            
            // GSAP Animations for the new view
            const reveals = target.querySelectorAll('.gsap-reveal');
            if(reveals.length > 0) {
                gsap.fromTo(reveals, 
                    { y: 50, opacity: 0 }, 
                    { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: "power3.out" }
                );
            }
        }
    }

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetView = link.getAttribute('data-view');
            showView(targetView);
            
            // Close mobile drawer if open
            if (navLinksContainer && navLinksContainer.classList.contains('active')) {
                navLinksContainer.classList.remove('active');
            }
        });
    });

    /* =========================================
       Fetch & Render Data
       ========================================= */
    async function loadData() {
        try {
            const res = await fetch('/api/data?t=' + Date.now());
            siteData = await res.json();
            renderProfile();
            renderContact();
            renderCategories('port', portContainer);
            renderCategories('class_experience', classExpContainer);
            updateUIAuthStatus();

            buildFilters('port', document.getElementById('port-filters'), portContainer);
            buildFilters('class_experience', document.getElementById('class_experience-filters'), classExpContainer);
            
            const preloader = document.getElementById('preloader');
            if (preloader) {
                preloader.style.opacity = '0';
                setTimeout(() => preloader.style.display = 'none', 500);
            }
        } catch (err) {
            console.error('Failed to load data:', err);
        }
    }

    function renderProfile() {
        if(!siteData.profile) return;
        const profile = siteData.profile;
        const titleEl = document.getElementById('hero-title');
        titleEl.textContent = '';
        gsap.to(titleEl, {
            duration: 1.5,
            text: profile.heroTitle || 'PANUPONG.J',
            ease: "none",
            delay: 0.5
        });

        document.getElementById('hero-subtitle').textContent = profile.heroSubtitle || '';
        
        const showreelContainer = document.getElementById('hero-showreel-container');
        if (siteData.profile.showreelUrl && showreelContainer) {
            showreelContainer.style.display = 'block';
            document.getElementById('hero-showreel').src = getYouTubeEmbedUrl(siteData.profile.showreelUrl);
        } else if (showreelContainer) {
            showreelContainer.style.display = 'none';
        }

        document.getElementById('about-text-1').textContent = siteData.profile.aboutText1;
        document.getElementById('about-text-2').textContent = siteData.profile.aboutText2;
        if (document.getElementById('about-image') && siteData.profile.aboutImageUrl) {
            document.getElementById('about-image').src = siteData.profile.aboutImageUrl;
        }

        const resumeBtn = document.getElementById('resume-btn');
        if (resumeBtn) {
            if (siteData.profile.resumeUrl) {
                resumeBtn.style.display = 'inline-flex';
                resumeBtn.href = siteData.profile.resumeUrl;
            } else {
                resumeBtn.style.display = 'none';
            }
        }
    }

    function renderContact() {
        if(!siteData.contact) return;
        document.getElementById('link-facebook').href = siteData.contact.facebook;
        document.getElementById('link-instagram').href = siteData.contact.instagram;
        document.getElementById('link-line').href = siteData.contact.line;
        document.getElementById('link-phone').textContent = siteData.contact.phone;
    }

    function getYouTubeEmbedUrl(url) {
        if(!url) return '';
        try {
            const parsedUrl = new URL(url);
            const listId = parsedUrl.searchParams.get('list');
            let videoId = '';

            if (url.includes('youtube.com/watch')) {
                videoId = parsedUrl.searchParams.get('v');
            } else if (url.includes('youtu.be/')) {
                videoId = parsedUrl.pathname.slice(1);
            } else if (url.includes('youtube.com/shorts/')) {
                videoId = parsedUrl.pathname.split('/')[2];
            } else if (url.includes('youtube.com/embed/')) {
                return url;
            }

            if (listId) {
                if (videoId) {
                    return `https://www.youtube.com/embed/${videoId}?list=${listId}&autoplay=0&controls=1&rel=0`;
                } else {
                    return `https://www.youtube.com/embed/videoseries?list=${listId}&autoplay=0&controls=1&rel=0`;
                }
            }

            return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=0&controls=1&rel=0` : url;
        } catch (e) {
            return url;
        }
    }

    function renderCategories(section, container) {
        container.innerHTML = '';
        if(!siteData[section]) return;

        siteData[section].forEach(cat => {
            const catDiv = document.createElement('div');
            catDiv.className = 'category-section';
            catDiv.dataset.id = cat.id;
            
            let adminHtml = '';
            if (isAdmin) {
                adminHtml = `
                    <div style="display:flex; gap:10px; align-items:center;">
                        <span style="background:var(--card-bg); padding:0.2rem 0.5rem; border-radius:4px; font-size:0.8rem; color:var(--text-muted); border:1px solid var(--border-color);">${cat.tag || 'No Tag'}</span>
                        <button class="btn-edit" onclick="openEditCategoryModal('${section}', '${cat.id}')"><i class="fa fa-pencil"></i> Edit Category</button>
                        <button class="btn-edit" onclick="openAddVideoModal('${section}', '${cat.id}')"><i class="fa fa-plus"></i> Add Video</button>
                        <button class="btn-delete" onclick="deleteCategory('${section}', '${cat.id}')">Delete Category</button>
                    </div>
                `;
            }

            let descHtml = cat.description ? `<p class="category-description" style="margin-bottom: 1rem; color: #ccc; font-size: 1rem; line-height: 1.5; white-space: pre-wrap;">${cat.description}</p>` : '';

            catDiv.innerHTML = `
                <div class="category-title" style="margin-bottom: 0.5rem;">
                    <h3>${cat.title}</h3>
                    ${adminHtml}
                </div>
                ${descHtml}
                <div class="portfolio-grid" id="grid-${cat.id}"></div>
            `;
            container.appendChild(catDiv);

            const grid = catDiv.querySelector(`#grid-${cat.id}`);
            cat.videos.forEach(video => {
                const embedUrl = getYouTubeEmbedUrl(video.youtubeUrl);
                const vidDiv = document.createElement('div');
                vidDiv.className = 'portfolio-item hover-target gsap-reveal';
                
                let delHtml = isAdmin ? `<div class="item-actions"><button class="btn-delete" onclick="deleteVideo('${section}', '${cat.id}', '${video.id}')">Delete</button></div>` : '';

                vidDiv.innerHTML = `
                    ${delHtml}
                    <div class="portfolio-iframe-container">
                        <iframe src="${embedUrl}" title="${video.title}" allowfullscreen></iframe>
                    </div>
                    <div class="portfolio-overlay">
                        <h3>${video.title}</h3>
                    </div>
                `;
                grid.appendChild(vidDiv);
            });
        });
    }

    function buildFilters(section, filterContainer, catContainer) {
        if (!filterContainer) return;
        filterContainer.innerHTML = '';
        if (!siteData[section] || siteData[section].length === 0) return;
        
        const tags = new Set();
        siteData[section].forEach(cat => {
            if (cat.tag) tags.add(cat.tag.trim());
        });
        
        if (tags.size === 0) return;

        const allBtn = document.createElement('button');
        allBtn.className = 'btn-filter active';
        allBtn.textContent = 'All';
        allBtn.onclick = () => filterCategories(section, 'All', filterContainer, catContainer);
        filterContainer.appendChild(allBtn);

        tags.forEach(t => {
            if (!t) return;
            const btn = document.createElement('button');
            btn.className = 'btn-filter';
            btn.textContent = t;
            btn.onclick = () => filterCategories(section, t, filterContainer, catContainer);
            filterContainer.appendChild(btn);
        });
    }

    function filterCategories(section, tag, filterContainer, catContainer) {
        Array.from(filterContainer.children).forEach(b => b.classList.remove('active'));
        const activeBtn = Array.from(filterContainer.children).find(b => b.textContent === tag);
        if (activeBtn) activeBtn.classList.add('active');

        const catDivs = Array.from(catContainer.children);
        
        catDivs.forEach(catDiv => {
            const catId = catDiv.dataset.id;
            const catData = siteData[section].find(c => c.id === catId);
            const isMatch = (tag === 'All') || (catData && catData.tag && catData.tag.trim() === tag);

            if (isMatch) {
                if (catDiv.style.display === 'none' || !catDiv.style.display) {
                    catDiv.style.display = 'block';
                    gsap.fromTo(catDiv, {scale: 0.9, opacity: 0}, {scale: 1, opacity: 1, duration: 0.4, ease: "power2.out"});
                }
            } else {
                if (catDiv.style.display !== 'none') {
                    gsap.to(catDiv, {scale: 0.9, opacity: 0, duration: 0.3, ease: "power2.in", onComplete: () => {
                        catDiv.style.display = 'none';
                        ScrollTrigger.refresh();
                    }});
                }
            }
        });
        setTimeout(() => ScrollTrigger.refresh(), 400);
    }

    /* =========================================
       Authentication & Admin UI
       ========================================= */
    async function checkAuthStatus() {
        try {
            const res = await fetch('/api/auth/status');
            const data = await res.json();
            isAdmin = data.isAdmin;
            updateUIAuthStatus();
        } catch (err) {
            console.error('Failed auth check');
        }
    }

    function updateUIAuthStatus() {
            const adminElements = document.querySelectorAll('.admin-only');
        if (isAdmin) {
            loginTrigger.style.display = 'none';
            if (logoutTrigger) logoutTrigger.style.display = 'block';
            adminElements.forEach(el => el.style.display = 'inline-flex');
        } else {
            loginTrigger.style.display = 'block';
            if (logoutTrigger) logoutTrigger.style.display = 'none';
            adminElements.forEach(el => el.style.display = 'none');
        }
        // Re-render categories to show/hide delete buttons
        renderCategories('port', portContainer);
        renderCategories('class_experience', classExpContainer);
    }

    /* =========================================
       Dynamic Modals (CMS)
       ========================================= */
    let currentEditAction = null;
    let currentEditParams = null;

    function openEditModal(title, fields, action, params) {
        document.getElementById('edit-modal-title').textContent = title;
        const inputsContainer = document.getElementById('edit-form-inputs');
        inputsContainer.innerHTML = '';

        fields.forEach(f => {
            const group = document.createElement('div');
            group.className = 'form-group';
            group.innerHTML = `<label>${f.label}</label>`;
            if (f.type === 'textarea') {
                group.innerHTML += `<textarea id="${f.id}">${f.value}</textarea>`;
            } else if (f.type === 'file') {
                const accept = f.id === 'f-res' ? 'application/pdf' : 'image/*';
                group.innerHTML += `<input type="${f.type}" id="${f.id}" accept="${accept}">`;
            } else {
                group.innerHTML += `<input type="${f.type}" id="${f.id}" value="${f.value}">`;
            }
            inputsContainer.appendChild(group);
        });

        currentEditAction = action;
        currentEditParams = params;
        editModal.style.display = 'block';
    }

    // Attach click handlers for edit buttons
    document.querySelectorAll('[data-edit]').forEach(btn => {
        btn.addEventListener('click', () => {
            const type = btn.getAttribute('data-edit');
            if (type === 'hero') {
                openEditModal('Edit Hero & Showreel', [
                    { id: 'f-ht', label: 'Title', type: 'text', value: siteData.profile.heroTitle || '' },
                    { id: 'f-hs', label: 'Subtitle', type: 'text', value: siteData.profile.heroSubtitle || '' },
                    { id: 'f-sr', label: 'Showreel URL (YouTube)', type: 'url', value: siteData.profile.showreelUrl || '' }
                ], 'profile', null);
            } else if (type === 'aboutText') {
                openEditModal('Edit About Text', [
                    { id: 'f-a1', label: 'Paragraph 1', type: 'textarea', value: siteData.profile.aboutText1 || '' },
                    { id: 'f-a2', label: 'Paragraph 2', type: 'textarea', value: siteData.profile.aboutText2 || '' }
                ], 'profileText', null);
            } else if (type === 'aboutImage') {
                openEditModal('Upload Profile Image', [
                    { id: 'f-img', label: 'Select Image File', type: 'file' }
                ], 'profileImg', null);
            } else if (type === 'resume') {
                openEditModal('Upload Resume (PDF)', [
                    { id: 'f-res', label: 'Select PDF File', type: 'file' }
                ], 'resumeUpload', null);
            } else if (type === 'contact') {
                openEditModal('Edit Contact Links', [
                    { id: 'f-fb', label: 'Facebook URL', type: 'url', value: siteData.contact.facebook },
                    { id: 'f-ig', label: 'Instagram URL', type: 'url', value: siteData.contact.instagram },
                    { id: 'f-ln', label: 'LINE URL', type: 'url', value: siteData.contact.line },
                    { id: 'f-ph', label: 'Phone Number', type: 'text', value: siteData.contact.phone }
                ], 'contact', null);
            }
        });
    });

    document.querySelectorAll('[data-add-cat]').forEach(btn => {
        btn.addEventListener('click', () => {
            const section = btn.getAttribute('data-add-cat');
            openEditModal(`เพิ่มหมวดหมู่ (${section})`, [
                { id: 'f-cat-title', label: 'ชื่อหมวดหมู่', type: 'text', value: '' },
                { id: 'f-cat-tag', label: 'Tag (หมวดหมู่ย่อย)', type: 'text', value: '' }
            ], 'addCategory', section);
        });
    });

    window.openAddVideoModal = function(section, categoryId) {
        openEditModal('เพิ่มวีดีโอ', [
            { id: 'f-vid-title', label: 'ชื่อผลงาน', type: 'text', value: '' },
            { id: 'f-vid-url', label: 'YouTube URL', type: 'url', value: '' }
        ], 'addVideo', { section, categoryId });
    }

    window.openEditCategoryModal = function(section, categoryId) {
        const cat = siteData[section].find(c => c.id === categoryId);
        openEditModal('แก้ไขหมวดหมู่', [
            { id: 'f-cat-edit-title', label: 'ชื่อหมวดหมู่', type: 'text', value: cat.title },
            { id: 'f-cat-edit-tag', label: 'Tag (หมวดหมู่ย่อย)', type: 'text', value: cat.tag || '' },
            { id: 'f-cat-edit-desc', label: 'คำอธิบายหมวดหมู่', type: 'textarea', value: cat.description || '' }
        ], 'editCategory', { section, categoryId });
    }

    // Handle Form Submission
    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        let endpoint = '';
        let bodyData = {};

        if (currentEditAction === 'profile') {
            endpoint = '/api/profile';
            bodyData = { 
                heroTitle: document.getElementById('f-ht').value, 
                heroSubtitle: document.getElementById('f-hs').value,
                showreelUrl: document.getElementById('f-sr').value
            };
        } else if (currentEditAction === 'profileText') {
            endpoint = '/api/profile';
            bodyData = { 
                aboutText1: document.getElementById('f-a1').value, 
                aboutText2: document.getElementById('f-a2').value
            };
        } else if (currentEditAction === 'profileImg') {
            const fileInput = document.getElementById('f-img');
            if (fileInput.files.length > 0) {
                const formData = new FormData();
                formData.append('profileImage', fileInput.files[0]);
                try {
                    await fetch('/api/profile/upload', {
                        method: 'POST',
                        body: formData
                    });
                    editModal.style.display = 'none';
                    loadData();
                    return;
                } catch (err) {
                    alert('Error uploading image');
                    return;
                }
            } else {
                alert('Please select an image file');
                return;
            }
        } else if (currentEditAction === 'resumeUpload') {
            const fileInput = document.getElementById('f-res');
            if (fileInput.files.length > 0) {
                const formData = new FormData();
                formData.append('resumeFile', fileInput.files[0]);
                try {
                    await fetch('/api/profile/resume', { method: 'POST', body: formData });
                    editModal.style.display = 'none';
                    loadData();
                    return;
                } catch (err) {
                    alert('Error uploading resume');
                    return;
                }
            } else {
                alert('Please select a file');
                return;
            }
        } else if (currentEditAction === 'contact') {
            endpoint = '/api/contact';
            bodyData = { 
                facebook: document.getElementById('f-fb').value,
                instagram: document.getElementById('f-ig').value,
                line: document.getElementById('f-ln').value,
                phone: document.getElementById('f-ph').value
            };
        } else if (currentEditAction === 'addCategory') {
            endpoint = '/api/categories';
            bodyData = { 
                section: currentEditParams, 
                title: document.getElementById('f-cat-title').value,
                tag: document.getElementById('f-cat-tag').value
            };
        } else if (currentEditAction === 'editCategory') {
            try {
                await fetch(`/api/categories/${currentEditParams.section}/${currentEditParams.categoryId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        title: document.getElementById('f-cat-edit-title').value,
                        tag: document.getElementById('f-cat-edit-tag').value,
                        description: document.getElementById('f-cat-edit-desc').value
                    })
                });
                editModal.style.display = 'none';
                loadData();
                return;
            } catch (err) {
                alert('Error saving data');
                return;
            }
        } else if (currentEditAction === 'addVideo') {
            endpoint = '/api/videos';
            bodyData = { 
                section: currentEditParams.section, 
                categoryId: currentEditParams.categoryId,
                title: document.getElementById('f-vid-title').value,
                youtubeUrl: document.getElementById('f-vid-url').value
            };
        }

        try {
            await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bodyData)
            });
            editModal.style.display = 'none';
            loadData();
        } catch (err) {
            alert('Error saving data');
        }
    });

    // Delete Globals
    window.deleteCategory = async function(section, id) {
        if(confirm('ลบหมวดหมู่นี้? วีดีโอข้างในจะถูกลบทั้งหมด')){
            await fetch(`/api/categories/${section}/${id}`, { method: 'DELETE' });
            loadData();
        }
    }

    window.deleteVideo = async function(section, catId, vidId) {
        if(confirm('ลบผลงานนี้?')){
            await fetch(`/api/videos/${section}/${catId}/${vidId}`, { method: 'DELETE' });
            loadData();
        }
    }

    /* =========================================
       Login / Logout
       ========================================= */
    loginTrigger.addEventListener('click', (e) => { e.preventDefault(); loginModal.style.display = 'block'; });
    document.getElementById('close-login').addEventListener('click', () => loginModal.style.display = 'none');
    document.getElementById('close-edit').addEventListener('click', () => editModal.style.display = 'none');
    
    window.addEventListener('click', (e) => {
        if (e.target == loginModal) loginModal.style.display = 'none';
        if (e.target == editModal) editModal.style.display = 'none';
    });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: document.getElementById('login-username').value,
                    password: document.getElementById('login-password').value
                })
            });
            const data = await res.json();
            if (data.success) {
                loginModal.style.display = 'none';
                loginForm.reset();
                document.getElementById('login-error').style.display = 'none';
                checkAuthStatus();
            } else {
                document.getElementById('login-error').textContent = "Invalid credentials";
                document.getElementById('login-error').style.display = 'block';
            }
        } catch (err) { }
    });

    logoutTrigger.addEventListener('click', async (e) => {
        e.preventDefault();
        await fetch('/api/auth/logout', { method: 'POST' });
        checkAuthStatus();
    });

    /* =========================================
       Custom Cursor Logic
       ========================================= */
    const cursorDot = document.querySelector('[data-cursor-dot]');
    const cursorOutline = document.querySelector('[data-cursor-outline]');
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    if (!isTouchDevice && cursorDot && cursorOutline) {
        window.addEventListener('mousemove', (e) => {
            cursorDot.style.left = `${e.clientX}px`;
            cursorDot.style.top = `${e.clientY}px`;
            cursorOutline.animate({ left: `${e.clientX}px`, top: `${e.clientY}px` }, { duration: 500, fill: "forwards" });
        });

        // Dynamic hover attachment
        setInterval(() => {
            document.querySelectorAll('.hover-target, a, button').forEach(target => {
                if (!target.hasAttribute('data-cursor-attached')) {
                    target.setAttribute('data-cursor-attached', 'true');
                    target.addEventListener('mouseenter', () => cursorOutline.classList.add('hovered'));
                    target.addEventListener('mouseleave', () => cursorOutline.classList.remove('hovered'));
                }
            });
        }, 1000);
    } else if (isTouchDevice && cursorDot) {
        cursorDot.style.display = 'none';
        cursorOutline.style.display = 'none';
    }

    /* =========================================
       Init
       ========================================= */
    loadData().then(() => checkAuthStatus());
});
