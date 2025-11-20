# 🚀 Complete Setup Instructions - MongoDB & Analytics Integration

## ✅ What Has Been Implemented

### Backend Changes:
1. ✅ MongoDB connection setup with fallback to in-memory storage
2. ✅ Modified `/api/grade` endpoint to save to MongoDB
3. ✅ Modified `/api/grade-with-gemini` endpoint to save batch grades to MongoDB
4. ✅ Updated `/api/graded_history` endpoint to fetch from MongoDB with filtering
5. ✅ Added 6 new analytics endpoints:
   - `GET /api/analytics/distribution` - Grade distribution data
   - `GET /api/analytics/student-history/{student_name}` - Complete student history
   - `GET /api/analytics/course-stats/{course_id}` - Course statistics
   - `GET /api/analytics/students` - All students overview
   - `GET /api/analytics/compare` - Compare courses/assignments
   - `GET /api/analytics/trends` - Performance trends over time

### Frontend Changes:
1. ✅ Created `AnalyticsPage.jsx` - Complete analytics dashboard
2. ✅ Created `AnalyticsPage.css` - Beautiful styling with animations
3. ✅ Added route in `App.jsx` for `/analytics`
4. ✅ Homepage already has "Analytics" navigation button

---

## 📦 Step 1: Install Backend Dependencies

Open terminal in your `backend` folder:

```bash
cd backend
pip install pymongo dnspython certifi
```

**Verify installation:**
```bash
pip list | findstr pymongo
pip list | findstr dnspython
pip list | findstr certifi
```

You should see:
```
certifi         2024.x.x
dnspython       2.x.x
pymongo         4.x.x
```

---

## 📦 Step 2: Install Frontend Dependencies

Open terminal in your `frontend` folder:

```bash
cd frontend
npm install recharts
```

**Verify installation:**
```bash
npm list recharts
```

You should see:
```
frontend@0.0.0
└── recharts@2.x.x
```

---

## 🗄️ Step 3: Setup MongoDB Atlas (FREE - No Download Required)

### 3.1 Create Account
1. Go to: https://www.mongodb.com/cloud/atlas/register
2. Sign up with Google or Email
3. Verify your email if prompted

### 3.2 Create FREE Cluster
1. Click **"Build a Database"**
2. Select **"M0 FREE"** tier (512MB storage)
3. Cloud Provider: **AWS** (recommended)
4. Region: Choose one close to your location
5. Cluster Name: `GradePilot` (or keep default)
6. Click **"Create"** (takes 3-5 minutes)

### 3.3 Create Database User
1. Click **"Database Access"** in left sidebar
2. Click **"Add New Database User"**
3. Authentication Method: **Password**
4. Username: `gradepilot_user` (or your choice)
5. Password: Click **"Autogenerate Secure Password"**
6. **IMPORTANT: COPY AND SAVE THIS PASSWORD!**
7. User Privileges: **"Atlas admin"** (for development)
8. Click **"Add User"**

### 3.4 Whitelist Your IP
1. Click **"Network Access"** in left sidebar
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"** (for development)
4. IP Address: `0.0.0.0/0` (automatically filled)
5. Click **"Confirm"**

### 3.5 Get Connection String
1. Click **"Database"** in left sidebar
2. Click **"Connect"** button on your cluster
3. Select **"Connect your application"**
4. Driver: **Python**
5. Version: **3.12 or later**
6. Copy the connection string (looks like):
   ```
   mongodb+srv://gradepilot_user:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
7. **Replace `<password>` with your actual password from step 3.3**
8. **SAVE THIS COMPLETE CONNECTION STRING!**

---

## 🔐 Step 4: Update .env File

1. Open `backend/.env` file
2. Add this line at the end:

```env
MONGO_URI=mongodb+srv://gradepilot_user:YOUR_ACTUAL_PASSWORD_HERE@cluster0.xxxxx.mongodb.net/gradepilot?retryWrites=true&w=majority
```

**Example (with fake data):**
```env
GEMINI_API_KEY=your_gemini_key_here
MONGO_URI=mongodb+srv://gradepilot_user:MyP@ssw0rd123@cluster0.abc123.mongodb.net/gradepilot?retryWrites=true&w=majority
```

**IMPORTANT:** Replace with YOUR actual connection string!

---

## ▶️ Step 5: Start the Application

### 5.1 Start Backend

Open terminal in `backend` folder:

```bash
cd backend
python app.py
```

**Look for these messages:**
```
✅ MongoDB connected successfully!
📊 Database: gradepilot
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
```

If you see **"⚠️ MongoDB connection failed"**, check your MONGO_URI in .env file.

### 5.2 Start Frontend

Open a **NEW terminal** in `frontend` folder:

```bash
cd frontend
npm run dev
```

**Look for:**
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

---

## 🧪 Step 6: Test the Integration

### 6.1 Login
1. Open http://localhost:5173/
2. Click **"Sign in with Google"**
3. Grant all permissions

### 6.2 Grade Some Assignments
1. Click on a course
2. Select an assignment
3. Grade at least **3-5 submissions** (to see meaningful analytics)
4. Use either grading path (with or without key)

### 6.3 Access Analytics
1. Go back to Home page
2. Click **"📈 Analytics"** in the quick actions section
3. OR navigate to http://localhost:5173/analytics

### 6.4 Explore Analytics Dashboard

You should see:
- ✅ 4 summary stat cards (Total Graded, Average Grade, Courses, Students)
- ✅ Grade distribution bar chart
- ✅ Grade breakdown pie chart
- ✅ Course performance table
- ✅ Recent activity feed

**Try the tabs:**
- **Overview** - General statistics and charts
- **Students** - List of all students with "View History" buttons
- **Courses** - Course comparison bar chart

**Click on a student:**
- View complete grade history
- See performance trend line chart
- Analyze grades by course

---

## 🗄️ Step 7: Verify MongoDB Data

### 7.1 Check Database in MongoDB Atlas
1. Go to MongoDB Atlas dashboard
2. Click **"Browse Collections"** on your cluster
3. You should see:
   - Database: **gradepilot**
   - Collection: **grades** (with graded submissions)
   - Collection: **students** (with student profiles)

### 7.2 Inspect Data
1. Click on **grades** collection
2. You'll see documents like:
```json
{
  "_id": ObjectId("..."),
  "course_id": "12345",
  "course_name": "Machine Learning 101",
  "assignment_id": "67890",
  "assignment_title": "Midterm Exam",
  "student_name": "John Doe",
  "assignedGrade": 85,
  "feedback": "Good work...",
  "timestamp": "2025-01-15T10:30:00"
}
```

---

## 🐛 Troubleshooting

### Issue: "Module 'pymongo' not found"
**Solution:**
```bash
cd backend
pip install pymongo dnspython certifi
```

### Issue: "Module 'recharts' not found"
**Solution:**
```bash
cd frontend
npm install recharts
```

### Issue: "MongoServerError: Authentication failed"
**Solution:**
- Check your MONGO_URI in .env file
- Ensure password is correct (no spaces, exact match)
- Ensure you replaced `<password>` with actual password

### Issue: "MongoServerError: IP not whitelisted"
**Solution:**
- Go to MongoDB Atlas → Network Access
- Click "Add IP Address"
- Click "Allow Access from Anywhere"

### Issue: Charts not showing
**Solution:**
1. Clear browser cache (Ctrl+Shift+Del)
2. Hard refresh (Ctrl+F5)
3. Check browser console for errors (F12)
4. Ensure you have graded at least 1-2 assignments

### Issue: Data not persisting after server restart
**Solution:**
- Check backend logs for "✅ MongoDB connected successfully!"
- If you see "⚠️ MongoDB connection failed", fix MONGO_URI
- Without MongoDB, data only lives in memory (resets on restart)

### Issue: Backend won't start - Port 8000 in use
**Solution:**
```bash
# Windows
netstat -ano | findstr :8000
taskkill /PID <PID_NUMBER> /F

# Then restart backend
python app.py
```

### Issue: Frontend won't start - Port 5173 in use
**Solution:**
```bash
# Kill the process and restart
npm run dev
```

---

## ✨ Features You Now Have

### Analytics Dashboard Features:
1. **📊 Grade Distribution Histogram**
   - Visual bar chart showing grade ranges
   - Color-coded (Red: 0-50, Orange: 51-70, Blue: 71-85, Green: 86-100)
   - Interactive tooltips

2. **🎯 Grade Breakdown Pie Chart**
   - Circular visualization of grade distribution
   - Percentage labels
   - Hover for details

3. **👥 Student Performance Tracking**
   - Complete list of all students
   - Average grade, highest, lowest
   - Click "View History" to see detailed timeline

4. **📈 Individual Student Analysis**
   - Performance trend line chart
   - Complete grade history table
   - Course-wise breakdown

5. **📚 Course Comparison**
   - Bar chart comparing average grades across courses
   - Easy identification of challenging courses

6. **🕐 Recent Activity Feed**
   - Last 10 graded submissions
   - Student names, assignments, grades, timestamps

7. **📱 Fully Responsive**
   - Works on desktop, tablet, mobile
   - Smooth animations throughout

8. **🌙 Dark/Light Mode Compatible**
   - Inherits your theme preference
   - All charts adapt to theme

---

## 🎯 Next Steps

### Recommended Usage Flow:
1. Grade 10-15 assignments to build up data
2. Review analytics dashboard weekly
3. Identify struggling students via the Students tab
4. Compare course difficulty via Courses tab
5. Export grades using existing Google Sheets integration
6. Use insights to adjust teaching strategies

### Advanced Features (Already Available):
- **Filter by course:** `/api/graded_history?course_id=123`
- **Student history:** `/api/analytics/student-history/John%20Doe`
- **Course stats:** `/api/analytics/course-stats/course123`
- **Performance trends:** `/api/analytics/trends?time_period=month`

---

## 📊 Data Persistence

**Before MongoDB Integration:**
- ❌ Data lost on server restart
- ❌ No historical analysis
- ❌ No student tracking

**After MongoDB Integration:**
- ✅ Permanent data storage
- ✅ Historical performance analysis
- ✅ Student progress tracking over time
- ✅ Course-wide insights
- ✅ Automatic backups (MongoDB Atlas)
- ✅ Fast queries with indexes

---

## 🎉 You're All Set!

Your GradePilot application now has:
- ✅ MongoDB cloud database (FREE tier)
- ✅ Permanent data storage
- ✅ 6 analytics API endpoints
- ✅ Beautiful analytics dashboard
- ✅ Interactive charts (bar, pie, line)
- ✅ Student history tracking
- ✅ Course performance comparison
- ✅ Responsive design
- ✅ Dark/light mode support

**Total Setup Time:** ~20 minutes
**Cost:** $0 (MongoDB Atlas Free Tier)

---

## 📞 Support

If you encounter any issues:
1. Check the troubleshooting section above
2. Verify all environment variables in .env
3. Check browser console (F12) for frontend errors
4. Check terminal for backend errors
5. Ensure MongoDB Atlas cluster is running

Happy grading! 🎓📊
