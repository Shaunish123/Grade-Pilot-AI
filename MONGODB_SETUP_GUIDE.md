# MongoDB Integration & Data Analytics - Implementation Guide

## 🚀 Step-by-Step Setup Instructions

### Step 1: MongoDB Atlas Setup (5 minutes)

1. **Sign up for MongoDB Atlas**
   - Go to: https://www.mongodb.com/cloud/atlas/register
   - Sign up with Google/Email
   - Choose the **FREE tier** (M0 Sandbox - 512MB)

2. **Create a Cluster**
   - Click "Build a Database"
   - Select **FREE Shared tier**
   - Choose a cloud provider (AWS recommended)
   - Select a region close to you
   - Cluster name: `GradePilot` (or keep default)
   - Click "Create Cluster" (takes 3-5 minutes)

3. **Create Database User**
   - Click "Database Access" in left sidebar
   - Click "Add New Database User"
   - Authentication Method: Password
   - Username: `gradepilot_user` (or your choice)
   - Password: Click "Autogenerate Secure Password" and **SAVE IT**
   - User Privileges: "Atlas admin" (for development)
   - Click "Add User"

4. **Whitelist Your IP Address**
   - Click "Network Access" in left sidebar
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (for development)
   - IP Address: `0.0.0.0/0` will be filled automatically
   - Click "Confirm"

5. **Get Connection String**
   - Click "Database" in left sidebar
   - Click "Connect" on your cluster
   - Select "Connect your application"
   - Driver: Python, Version: 3.12 or later
   - Copy the connection string (looks like):
     ```
     mongodb+srv://gradepilot_user:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
     ```
   - Replace `<password>` with your actual password
   - **SAVE THIS CONNECTION STRING** - you'll add it to .env file

---

### Step 2: Install Python Dependencies

Open terminal in your `backend` folder and run:

```bash
pip install pymongo dnspython certifi
```

**What each package does:**
- `pymongo`: Official MongoDB driver for Python
- `dnspython`: Required for MongoDB+SRV connection strings
- `certifi`: SSL certificate verification for secure connections

---

### Step 3: Update .env File

Add this line to your `backend/.env` file:

```env
MONGO_URI=mongodb+srv://gradepilot_user:YOUR_PASSWORD_HERE@cluster0.xxxxx.mongodb.net/gradepilot?retryWrites=true&w=majority
```

**Important:** Replace with your actual connection string from Step 1.5

---

### Step 4: Install Frontend Dependencies

Open terminal in your `frontend` folder and run:

```bash
npm install recharts
```

**What it does:**
- `recharts`: Modern React charting library for data visualization

---

### Step 5: Backend Code Changes

The following changes will be made to `backend/app.py`:

1. **Add MongoDB imports and connection** (after line 65)
2. **Modify `/api/grade` endpoint** to save to MongoDB
3. **Modify `/api/grade-with-gemini` endpoint** to save to MongoDB
4. **Update `/api/graded_history` endpoint** to fetch from MongoDB
5. **Add 6 new analytics endpoints**:
   - `GET /api/analytics/distribution` - Grade distribution data
   - `GET /api/analytics/student-history/{student_name}` - Student grade history
   - `GET /api/analytics/course-stats/{course_id}` - Course statistics
   - `GET /api/analytics/students` - All students overview
   - `GET /api/analytics/compare` - Compare courses/assignments
   - `GET /api/analytics/trends` - Performance trends

---

### Step 6: Frontend Code Changes

New files to be created:

1. **`frontend/src/pages/AnalyticsPage.jsx`** - Main analytics dashboard
2. **`frontend/src/pages/AnalyticsPage.css`** - Analytics styling
3. **`frontend/src/components/StudentDetailModal.jsx`** - Student history modal
4. **`frontend/src/components/StudentDetailModal.css`** - Modal styling

Updates to existing files:

1. **`frontend/src/App.jsx`** - Add route for `/analytics`
2. **`frontend/src/pages/HomePage.jsx`** - Add navigation to analytics (already has the button)

---

### Step 7: Test the Integration

1. **Start Backend**:
   ```bash
   cd backend
   python app.py
   ```

2. **Start Frontend**:
   ```bash
   cd frontend
   npm run dev
   ```

3. **Test Flow**:
   - Login to the app
   - Grade at least 3-5 assignments
   - Click "Analytics" or navigate to `/analytics`
   - You should see:
     - Grade distribution chart
     - Student performance table
     - Course statistics
     - All data persisted in MongoDB

---

### Step 8: Verify MongoDB Data

1. Go to MongoDB Atlas dashboard
2. Click "Browse Collections" on your cluster
3. You should see:
   - Database: `gradepilot`
   - Collection: `grades` (with your graded submissions)
   - Collection: `students` (with student profiles)

---

## 📊 What You'll Get After Implementation

### Backend Changes:
- ✅ Permanent data storage in MongoDB (no more data loss on restart)
- ✅ 6 new API endpoints for analytics
- ✅ Automatic student profile updates
- ✅ Fast queries with MongoDB indexes

### Frontend Changes:
- ✅ Complete analytics dashboard with 5+ chart types
- ✅ Student history viewer
- ✅ Course performance comparison
- ✅ Grade distribution histogram
- ✅ Performance trends over time
- ✅ Interactive charts (hover, click, filter)

---

## 🐛 Troubleshooting

### Issue: "Connection refused" or "Authentication failed"
**Solution:** Check your MONGO_URI in .env file. Ensure password is correct.

### Issue: "Module 'pymongo' not found"
**Solution:** Run `pip install pymongo dnspython certifi` in backend folder.

### Issue: "Module 'recharts' not found"
**Solution:** Run `npm install recharts` in frontend folder.

### Issue: Charts not showing
**Solution:** Clear browser cache, refresh page. Check console for errors.

### Issue: Data not persisting
**Solution:** Verify MongoDB connection is successful. Check backend logs for errors.

---

## 🎯 Next Steps After Setup

1. Grade a few assignments to populate data
2. Explore the analytics dashboard
3. Click on students to view their history
4. Export data using the existing Google Sheets integration
5. Customize charts/colors as needed

---

## ⏱️ Estimated Time

- MongoDB Atlas Setup: **5 minutes**
- Install Dependencies: **2 minutes**
- Code Implementation: **Automatic (I'll do this for you)**
- Testing: **10 minutes**

**Total Time: ~20 minutes**

---

Ready to proceed? I'll now implement all the code changes for you!
