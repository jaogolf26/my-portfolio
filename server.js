const express = require('express');
const session = require('express-session');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuration
const ADMIN_USER = 'jaogolf26';
const ADMIN_PASS = 'Golf0632572115*';
const DATA_FILE = path.join(__dirname, 'data.json');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// Multer config for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, 'profile-' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

app.use(session({
    secret: 'jaogolf_portfolio_secret_key_cms',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));

// Helper: Read Data
function readData() {
    try {
        if (!fs.existsSync(DATA_FILE)) {
            const defaultData = {
                profile: { 
                    heroTitle: "JAOGOLF", 
                    heroSubtitle: "Video Editor", 
                    aboutText1: "Hello", 
                    aboutText2: "", 
                    aboutImageUrl: "",
                    resumeUrl: "",
                    showreelUrl: "",
                    skills: []
                },
                contact: { facebook: "", instagram: "", line: "", phone: "063-2572115" },
                port: [],
                class_experience: []
            };
            fs.writeFileSync(DATA_FILE, JSON.stringify(defaultData, null, 2));
            return defaultData;
        }
        return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    } catch (err) {
        console.error('Error reading data:', err);
        return {};
    }
}

// Helper: Write Data
function writeData(data) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('Error writing data:', err);
    }
}

// Middleware: Require Admin
function requireAdmin(req, res, next) {
    if (req.session && req.session.isAdmin) {
        next();
    } else {
        res.status(403).json({ success: false, message: 'Unauthorized' });
    }
}

// --- API ROUTES ---

// 1. Get all data
app.get('/api/data', (req, res) => {
    res.json(readData());
});

// 2. Auth Status & Login/Logout
app.get('/api/auth/status', (req, res) => {
    res.json({ isAdmin: !!(req.session && req.session.isAdmin) });
});

app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    if (username === ADMIN_USER && password === ADMIN_PASS) {
        req.session.isAdmin = true;
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
});

app.post('/api/auth/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

// 3. Update Profile
app.post('/api/profile', requireAdmin, (req, res) => {
    const data = readData();
    data.profile = { ...data.profile, ...req.body };
    writeData(data);
    res.json({ success: true, profile: data.profile });
});

// 3.5. Upload Profile Image
app.post('/api/profile/upload', requireAdmin, upload.single('profileImage'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    const imageUrl = `/uploads/${req.file.filename}`;
    const data = readData();
    data.profile.aboutImageUrl = imageUrl;
    writeData(data);
    res.json({ success: true, imageUrl });
});

// 3.6. Upload Resume
app.post('/api/profile/resume', requireAdmin, upload.single('resumeFile'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    const resumeUrl = `/uploads/${req.file.filename}`;
    const data = readData();
    data.profile.resumeUrl = resumeUrl;
    writeData(data);
    res.json({ success: true, resumeUrl });
});

// 4. Update Contact
app.post('/api/contact', requireAdmin, (req, res) => {
    const data = readData();
    data.contact = { ...data.contact, ...req.body };
    writeData(data);
    res.json({ success: true, contact: data.contact });
});

// 5. Add Category
app.post('/api/categories', requireAdmin, (req, res) => {
    const { section, title, tag } = req.body; 
    if (!['port', 'class_experience'].includes(section)) return res.status(400).json({ success: false });
    
    const data = readData();
    const newCategory = {
        id: 'cat-' + Date.now(),
        title: title || 'New Category',
        tag: tag || '',
        videos: []
    };
    data[section].push(newCategory);
    writeData(data);
    res.json({ success: true, category: newCategory });
});

// 6. Delete Category
app.delete('/api/categories/:section/:id', requireAdmin, (req, res) => {
    const { section, id } = req.params;
    if (!['port', 'class_experience'].includes(section)) return res.status(400).json({ success: false });

    const data = readData();
    data[section] = data[section].filter(cat => cat.id !== id);
    writeData(data);
    res.json({ success: true });
});

// 6.5 Update Category
app.put('/api/categories/:section/:id', requireAdmin, (req, res) => {
    const { section, id } = req.params;
    const { title, description, tag } = req.body;
    if (!['port', 'class_experience'].includes(section)) return res.status(400).json({ success: false });

    const data = readData();
    const category = data[section].find(cat => cat.id === id);
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });

    if (title !== undefined) category.title = title;
    if (description !== undefined) category.description = description;
    if (tag !== undefined) category.tag = tag;

    writeData(data);
    res.json({ success: true, category });
});

// 6.7 Reorder Categories
app.put('/api/categories/:section/reorder', requireAdmin, (req, res) => {
    const { section } = req.params;
    const { order } = req.body;
    if (!['port', 'class_experience'].includes(section)) return res.status(400).json({ success: false });

    const data = readData();
    const categories = data[section];
    
    if (Array.isArray(order) && order.length === categories.length) {
        const reordered = order.map(id => categories.find(cat => cat.id === id)).filter(Boolean);
        if (reordered.length === categories.length) {
            data[section] = reordered;
            writeData(data);
            return res.json({ success: true });
        }
    }
    res.status(400).json({ success: false, message: 'Invalid order' });
});

// 7. Add Video
app.post('/api/videos', requireAdmin, (req, res) => {
    const { section, categoryId, title, youtubeUrl } = req.body;
    if (!['port', 'class_experience'].includes(section)) return res.status(400).json({ success: false });

    const data = readData();
    const category = data[section].find(cat => cat.id === categoryId);
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });

    const newVideo = {
        id: 'vid-' + Date.now(),
        title: title || 'Untitled',
        youtubeUrl
    };
    category.videos.push(newVideo);
    writeData(data);
    res.json({ success: true, video: newVideo });
});

// 8. Delete Video
app.delete('/api/videos/:section/:categoryId/:videoId', requireAdmin, (req, res) => {
    const { section, categoryId, videoId } = req.params;
    if (!['port', 'class_experience'].includes(section)) return res.status(400).json({ success: false });

    const data = readData();
    const category = data[section].find(cat => cat.id === categoryId);
    if (!category) return res.status(404).json({ success: false });

    category.videos = category.videos.filter(v => v.id !== videoId);
    writeData(data);
    res.json({ success: true });
});

// Start Server
app.listen(PORT, () => {
    console.log(`CMS Server is running at http://localhost:${PORT}`);
});
