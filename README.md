🎓 GRADE PILOT AI
A multi-modal automated grading system designed to drastically reduce teacher workload by intelligently evaluating assignments. By automating the assessment pipeline, Grade Pilot AI enables educators to focus more on student development, mentorship, and overall academic growth.

✨ Key Features
Multi-Modal Evaluation: Processes both text-based and handwritten assignments seamlessly.

Intelligent Document Parsing: Utilizes Google Cloud Vision OCR for highly accurate extraction of student submissions.

Advanced LLM Orchestration: Powered by Gemini for complex reasoning and Mistral (SFR-embeddings) for precise semantic search and context retrieval.

Automated Feedback Loop: Generates constructive, standardized feedback for students based on grading rubrics.

## 🚀 Tech Stack

Based on the run commands, this project uses:

* **Backend:** [**Python (FastAPI / Starlette)**](https://fastapi.tiangolo.com/) - Served with `uvicorn`.
* **Frontend:** [**JavaScript/TypeScript**](https://www.javascript.com/) - (e.g., React, Vue, Svelte) - Managed with `npm`.

---

## 🏁 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing.

### Prerequisites

You will need the following software installed on your system:

* [**Python 3.8+**](https://www.python.org/downloads/)
* [**Node.js & npm**](https://nodejs.org/)

---

### ⚙️ Installation

1.  **Clone the repository:**
    ```bash
    git clone [YOUR_REPOSITORY_URL]
    cd [YOUR_PROJECT_NAME]
    ```

2.  **Set up the Backend:**
    ```bash
    cd backend
    
    # (Recommended) Create and activate a virtual environment
    python -m venv venv
    source venv/bin/activate  # On Windows, use: venv\Scripts\activate
    
    # Install Python dependencies
    pip install -r requirements.txt 
    cd ..
    ```

3.  **Set up the Frontend:**
    ```bash
    cd frontend
    
    # Install JavaScript dependencies
    npm install
    cd ..
    ```

---

### 🖥️ Running the Project (Local Development)

You will need to open **two separate terminals** to run both the backend and frontend servers simultaneously.

#### **Terminal 1: Start the Backend Server**

```bash
cd backend

# Activate the virtual environment (if you created one)
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Run the Uvicorn server
python -m uvicorn app:app --reload --port 8000

```

> ℹ️ Your backend API will now be running at `http://localhost:8000`

#### **Terminal 2: Start the Frontend Server**

```bash
cd frontend
# Run the development server
npm run dev

```

> ℹ️ Your frontend will now be running at http://localhost:3000 (or 5173, etc. — check your terminal for the exact URL).
