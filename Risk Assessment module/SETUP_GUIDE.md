# 🚀 Project Setup Guide

Follow the steps below to set up and run the project smoothly.

---

## 🐍 1. Create & Activate Python Virtual Environment

### **For Windows (PowerShell / CMD)**
```sh
python -m venv venv
venv\Scripts\activate
```
For macOS / Linux

```
python3 -m venv venv
source venv/bin/activate
```
▶️ 2. Run the Backend (app.py)

Make sure your virtual environment is active, then run:
```
python app.py
```
🌐 3. Navigate to the Frontend

Go to the following directory:
```
cd dashboard-ra
```
📦 4. Install Dependencies

Inside the /dashboard-ra folder, install required npm packages:
```
npm install
```
💻 5. Start the Development Server
```
npm run dev
```
This starts the frontend application.
🔐 6. Environment Variables

Create a .env file at the root of the folder (same location as app.py) and add:
```
GROQ_API_KEY=xx
```
Replace xx with your actual API key.
✅ You're All Set!

Both backend and frontend should now be running successfully.
Feel free to reach out if you need help with deployment or improvements!