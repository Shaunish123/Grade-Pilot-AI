import os
import json
import re
import io
import google.generativeai as genai
from fastapi import FastAPI, Request # CHANGED: Imported FastAPI and Request
from fastapi.responses import RedirectResponse, JSONResponse # CHANGED: Imported FastAPI responses
from fastapi.middleware.cors import CORSMiddleware # CHANGED: Imported FastAPI CORS
from starlette.middleware.sessions import SessionMiddleware # CHANGED: Imported SessionMiddleware
from dotenv import load_dotenv
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from googleapiclient.http import MediaIoBaseDownload
# RENAMED: Renamed 'Request' to 'GoogleAuthRequest' to avoid conflict with FastAPI's 'Request'
from google.auth.transport.requests import Request as GoogleAuthRequest 
from google_auth_oauthlib.flow import Flow 

import uvicorn # ADDED: For running the FastAPI server
import datetime # ADDED: This import was used in the grading logic

from google.cloud import vision # ADDED: Google Vision API client 

# --- 1. INITIAL CONFIGURATION ---
load_dotenv()

# --- 2. ADD VISION API AUTHENTICATION ---
# This tells the script to use your JSON key file.
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "service-account-key.json"

app = FastAPI() # CHANGED: Initialized FastAPI


# ADDED: SessionMiddleware for session support, equivalent to Flask's app.secret_key
# Note: Using os.urandom() means sessions will be invalidated on every server restart.
# For production, use a static key, e.g., os.getenv("SESSION_SECRET_KEY").
app.add_middleware(SessionMiddleware, secret_key=os.urandom(24))

# CHANGED: Replaced Flask-CORS with FastAPI's CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"], # Explicitly adding methods
    allow_headers=["*"], # Explicitly adding headers
)

os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'
CLIENT_SECRETS_FILE = 'client_secret.json'

# ALL SCOPES KEPT AS PER YOUR INSTRUCTION
# *** IMPORTANT: ADDED NEW SCOPES HERE ***
SCOPES = [ 
    'https://www.googleapis.com/auth/classroom.courses.readonly', 
    'https://www.googleapis.com/auth/classroom.coursework.students', 
    'https://www.googleapis.com/auth/classroom.course-work.readonly', 
    'https://www.googleapis.com/auth/classroom.profile.emails', # NEW SCOPE
    'https://www.googleapis.com/auth/classroom.profile.photos', # NEW SCOPE (Optional, but often included with emails)
    'https://www.googleapis.com/auth/drive.readonly',
    'https://www.googleapis.com/auth/classroom.coursework.me' 
]

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# --- Global storage for graded assignments (in-memory, will reset on server restart) ---
graded_assignments_history = []


# --- 2. HELPER FUNCTIONS (No changes here, keeping for full context) ---

def credentials_to_dict(credentials):
    """Converts a Google Credentials object to a dictionary for session storage."""
    # NO CHANGE: This function is framework-independent.
    return {
        'token': credentials.token,
        'refresh_token': credentials.refresh_token,
        'token_uri': credentials.token_uri,
        'client_id': credentials.client_id,
        'client_secret': credentials.client_secret,
        'scopes': credentials.scopes
    }

# MODIFIED: Function now requires the 'request' object to access the session
def get_google_service(service_name, version, request: Request): 
    """
    Builds and returns an authorized Google API service object (e.g., Classroom, Drive).
    Handles refreshing expired access tokens using the refresh token.
    
    MODIFIED: Now takes 'request: Request' as an argument to access session data.
    """
    # CHANGED: 'session' is now 'request.session'
    if 'credentials' not in request.session:
        return None # User not authenticated

    # CHANGED: 'session' is now 'request.session'
    creds_data = request.session['credentials']
    creds = Credentials(
        token=creds_data['token'],
        refresh_token=creds_data['refresh_token'],
        token_uri=creds_data['token_uri'],
        client_id=creds_data['client_id'],
        client_secret=creds_data['client_secret'],
        scopes=creds_data['scopes']
    )

    if not creds.valid:
        if creds.expired and creds.refresh_token:
            print("Refreshing Google Access Token...")
            try:
                # CHANGED: Using 'GoogleAuthRequest' to avoid name conflict
                creds.refresh(GoogleAuthRequest()) 
                # CHANGED: 'session' is now 'request.session'
                request.session['credentials'] = credentials_to_dict(creds)
            except Exception as e:
                print(f"Failed to refresh token: {e}")
                # CHANGED: 'session' is now 'request.session'
                request.session.clear()
                return None
        else:
            print("Credentials invalid and no refresh token or not expired. Re-authentication needed.")
            # CHANGED: 'session' is now 'request.session'
            request.session.clear()
            return None
    
    try:
        service = build(service_name, version, credentials=creds)
        return service
    except HttpError as error:
        print(f'An error occurred building Google service {service_name} v{version}: {error}')
        return None

def extract_drive_file_id_from_url(url):
    """
    Extracts the Google Drive file ID from various Google Drive/Docs/Sheets/Slides URL formats.
    Returns the file ID string, or None if not found.
    """
    # NO CHANGE: This function is framework-independent.
    match = re.search(r'/d/([a-zA-Z0-9_-]+)', url)
    if match:
        return match.group(1)
    return None


def download_drive_file_content(drive_service, file_id, file_name="unknown"):
    """
    Downloads a Google Drive file's content as plain text.
    
    - If it's a Google Doc/Sheet, it exports as text/plain.
    - If it's an Image (JPG, PNG) or PDF, it downloads the bytes 
      and uses the Google Cloud Vision API to extract handwritten text.
    - Otherwise, it attempts a standard text download.
    """
    try:
        file_metadata = drive_service.files().get(fileId=file_id, fields='mimeType, name').execute()
        mime_type = file_metadata.get('mimeType')
        actual_file_name = file_metadata.get('name', file_name)
        print(f"Downloading '{actual_file_name}' (ID: {file_id}) with MIME type: {mime_type}")

        # --- BRANCH 1: Google Workspace Docs (Same as before) ---
        if mime_type.startswith('application/vnd.google-apps'):
            print("File is a Google Doc. Exporting as text/plain.")
            request = drive_service.files().export_media(fileId=file_id, mimeType='text/plain')
            fh = io.BytesIO()
            downloader = MediaIoBaseDownload(fh, request)
            done = False
            while not done:
                status, done = downloader.next_chunk()
            return fh.getvalue().decode('utf-8')

        # --- BRANCH 2: Images or PDFs (NEW LOGIC) ---
        elif mime_type in ['image/jpeg', 'image/png', 'application/pdf']:
            print("File is an Image/PDF. Downloading bytes for Cloud Vision API...")
            request = drive_service.files().get_media(fileId=file_id)
            fh = io.BytesIO()
            downloader = MediaIoBaseDownload(fh, request)
            done = False
            while not done:
                status, done = downloader.next_chunk()
            
            content_bytes = fh.getvalue()
            
            print("Bytes downloaded. Sending to Cloud Vision API for handwriting detection...")
            
            # --- This is the logic from your detect.py ---
            client = vision.ImageAnnotatorClient()
            image = vision.Image(content=content_bytes)
            image_context = vision.ImageContext(language_hints=["en-t-i0-handwrit"])
            
            response = client.document_text_detection(
                image=image,
                image_context=image_context
            )
            
            if response.error.message:
                print(f"Cloud Vision API Error: {response.error.message}")
                return None
            
            if response.full_text_annotation:
                print("Cloud Vision API successful. Returning extracted text.")
                return response.full_text_annotation.text
            else:
                print("Cloud Vision API found no text in the image.")
                return "" # Return empty string if no text is found

        # --- BRANCH 3: Other files (e.g., .txt) (Same as before) ---
        else:
            print("File is not a Google Doc or Image. Attempting direct media download.")
            request = drive_service.files().get_media(fileId=file_id)
            fh = io.BytesIO()
            downloader = MediaIoBaseDownload(fh, request)
            done = False
            while not done:
                status, done = downloader.next_chunk()

            try:
                return fh.getvalue().decode('utf-8')
            except UnicodeDecodeError:
                print(f"UTF-8 decode failed for '{actual_file_name}', trying latin-1.")
                return fh.getvalue().decode('latin-1')

    except HttpError as error:
        print(f'Google Drive API Error downloading file "{actual_file_name}" (ID: {file_id}): {error.resp.status} - {error.content.decode("utf-8")}')
        return None
    except Exception as e:
        print(f'Unexpected error in download_drive_file_content for "{actual_file_name}" (ID: {file_id}): {e}')
        return None

# --- 3. AUTHENTICATION ROUTES ---

# CHANGED: Converted Flask @app.route to FastAPI @app.get
# ADDED: 'request: Request' parameter for session and url_for
@app.get('/login')
async def login(request: Request):
    """Initiates the Google OAuth 2.0 login flow, redirecting to Google's consent screen."""
    flow = Flow.from_client_secrets_file(
        CLIENT_SECRETS_FILE,
        scopes=SCOPES, # Use the updated SCOPES list
        # CHANGED: 'url_for' is now 'request.url_for' and requires the endpoint 'name'
        redirect_uri=request.url_for('callback')
    )
    authorization_url, state = flow.authorization_url(access_type='offline', prompt='consent')
    # CHANGED: 'session' is now 'request.session'
    request.session['state'] = state
    # CHANGED: 'redirect' is now 'RedirectResponse'
    return RedirectResponse(authorization_url)

# CHANGED: Converted Flask @app.route to FastAPI @app.get
# ADDED: 'request: Request' parameter
# ADDED: 'name="callback"' to allow request.url_for('callback') to work
@app.get('/auth/callback', name="callback")
async def callback(request: Request):
    """Handles the callback from Google after a user grants or denies permissions."""
    
    # CHANGED: 'session' is now 'request.session'
    # CHANGED: 'request.args.get' is now 'request.query_params.get'
    if 'state' not in request.session or request.session['state'] != request.query_params.get('state'):
        # CHANGED: 'jsonify' is replaced with 'JSONResponse'
        return JSONResponse(content={"error": "State mismatch. Possible CSRF attack."}, status_code=400)

    flow = Flow.from_client_secrets_file(
        CLIENT_SECRETS_FILE,
        scopes=SCOPES, # Use the updated SCOPES list
        state=request.session['state'], # CHANGED: 'session' is now 'request.session'
        redirect_uri=request.url_for('callback') # CHANGED: 'url_for' is now 'request.url_for'
    )
    try:
        # CHANGED: 'request.url' is now a 'URL' object, use 'str(request.url)'
        flow.fetch_token(authorization_response=str(request.url))
        credentials = flow.credentials
        # CHANGED: 'session' is now 'request.session'
        request.session['credentials'] = credentials_to_dict(credentials)
        request.session.pop('state', None) # CHANGED: 'session' is now 'request.session'
        # CHANGED: 'redirect' is now 'RedirectResponse'
        return RedirectResponse('http://localhost:5173/dashboard')
    except Exception as e:
        print(f"Error fetching token: {e}")
        request.session.clear() # CHANGED: 'session' is now 'request.session'
        # CHANGED: 'jsonify' is replaced with 'JSONResponse'
        return JSONResponse(content={"error": "Authentication failed."}, status_code=500)

# CHANGED: Converted Flask @app.route to FastAPI @app.get
# ADDED: 'request: Request' parameter
@app.get('/logout')
async def logout(request: Request):
    """Logs the user out by clearing the session."""
    # CHANGED: 'session' is now 'request.session'
    request.session.clear()
    # CHANGED: 'jsonify' is replaced with returning a dictionary (FastAPI handles it)
    return {"message": "Successfully logged out"}


# --- (Previous code from last snippet) ---
# ... (imports, helpers, and auth routes) ...


# --- 4. API DATA-FETCHING ROUTES ---

# CHANGED: Converted Flask route to FastAPI GET endpoint
# ADDED: 'request: Request' parameter
@app.get('/api/courses')
async def get_courses(request: Request):
    """Fetches and returns a list of the teacher's active Google Classroom courses."""
    # CHANGED: Passed 'request' object to get_google_service
    classroom_service = get_google_service('classroom', 'v1', request)
    if not classroom_service:
        # CHANGED: 'jsonify' is replaced with 'JSONResponse'
        return JSONResponse(
            content={"error": "User not authenticated or session expired. Please re-login."}, 
            status_code=401
        )
    
    try:
        courses = classroom_service.courses().list(teacherId='me', courseStates=['ACTIVE']).execute()
        # CHANGED: Returned dictionary directly, FastAPI handles 'jsonify'
        return courses.get('courses', [])
    except HttpError as error:
        print(f"Google Classroom API Error in get_courses: {error.resp.status} - {error.content.decode('utf-8')}")
        # CHANGED: 'jsonify' is replaced with 'JSONResponse'
        return JSONResponse(
            content={"error": f"Failed to fetch courses: {error.content.decode('utf-8')}"}, 
            status_code=error.resp.status
        )

# CHANGED: Converted Flask route to FastAPI GET endpoint
# ADDED: 'request: Request' parameter and type hint for 'course_id'
@app.get('/api/courses/{course_id}/assignments')
async def get_assignments(course_id: str, request: Request):
    """Fetches and returns a list of assignments for a given course ID."""
    # CHANGED: Passed 'request' object to get_google_service
    classroom_service = get_google_service('classroom', 'v1', request)
    if not classroom_service:
        # CHANGED: 'jsonify' is replaced with 'JSONResponse'
        return JSONResponse(
            content={"error": "User not authenticated or session expired. Please re-login."}, 
            status_code=401
        )
    try:
        all_coursework = classroom_service.courses().courseWork().list(courseId=course_id).execute()
        assignments_only = [
            item for item in all_coursework.get('courseWork', []) 
            if item.get('workType') == 'ASSIGNMENT'
        ]
        # CHANGED: Returned list directly, FastAPI handles 'jsonify'
        return assignments_only

    except HttpError as error:
        print(f"Google Classroom API Error in get_assignments for course {course_id}: {error.resp.status} - {error.content.decode('utf-8')}")
        # CHANGED: 'jsonify' is replaced with 'JSONResponse'
        return JSONResponse(
            content={"error": f"Failed to fetch assignments: {error.content.decode('utf-8')}"}, 
            status_code=error.resp.status
        )
    except Exception as e:
        print(f"An unexpected error occurred in get_assignments: {e}")
        # CHANGED: 'jsonify' is replaced with 'JSONResponse'
        return JSONResponse(
            content={"error": f"An unexpected error occurred: {str(e)}"}, 
            status_code=500
        )

# CHANGED: Converted Flask route to FastAPI GET endpoint
# ADDED: 'request: Request' parameter and type hints for path parameters
@app.get('/api/courses/{course_id}/assignments/{assignment_id}/submissions')
async def get_submissions(course_id: str, assignment_id: str, request: Request):
    """
    Fetches and returns a list of student submissions for a specific assignment.
    Now includes logic to fetch and attach student names to each submission.
    """
    # CHANGED: Passed 'request' object to get_google_service
    classroom_service = get_google_service('classroom', 'v1', request)
    if not classroom_service:
        # CHANGED: 'jsonify' is replaced with 'JSONResponse'
        return JSONResponse(
            content={"error": "User not authenticated or session expired. Please re-login."}, 
            status_code=401
        )
    
    try:
        submissions_response = classroom_service.courses().courseWork().studentSubmissions().list(
            courseId=course_id,
            courseWorkId=assignment_id,
            states=['TURNED_IN'] 
        ).execute()
        
        submissions = submissions_response.get('studentSubmissions', [])
        
        # Fetch student profiles for names and enrich submissions
        processed_submissions = []
        for submission in submissions:
            user_id = submission['userId']
            student_name = f"Unknown Student ({user_id})" # Default name in case of error

            try:
                # Need the 'classroom.profile.emails' scope for userProfiles().get
                student_profile = classroom_service.userProfiles().get(userId=user_id).execute()
                student_name = student_profile.get('name', {}).get('fullName', student_name)
            except HttpError as e:
                print(f"Error fetching profile for user {user_id}: {e.resp.status} - {e.content.decode('utf-8')}")
                # If there's an HTTP error, keep the default name
            except Exception as e:
                print(f"An unexpected error occurred while fetching profile for user {user_id}: {e}")
                # If any other error, keep the default name
            
            submission['studentName'] = student_name # Add the name to the submission object
            processed_submissions.append(submission)

        # CHANGED: Returned list directly, FastAPI handles 'jsonify'
        return processed_submissions
    except HttpError as error:
        print(f"Google Classroom API Error in get_submissions for course {course_id}, assignment {assignment_id}: {error.resp.status} - {error.content.decode('utf-8')}")
        # CHANGED: 'jsonify' is replaced with 'JSONResponse'
        return JSONResponse(
            content={"error": f"Failed to fetch submissions: {error.content.decode('utf-8')}"}, 
            status_code=error.resp.status
        )

import uvicorn # ADDED: For running the FastAPI server
import datetime # ADDED: This import was used in the grading logic

# --- (Previous code from last snippet) ---
# ... (imports, helpers, auth routes, and data-fetching routes) ...


# --- 5. CORE GRADING ROUTE ---

# CHANGED: Converted Flask route to FastAPI POST endpoint
# ADDED: 'request: Request' parameter
@app.post('/api/grade')
async def grade_submission(request: Request):
    global graded_assignments_history 

    # CHANGED: 'request.json' is now 'await request.json()'
    data = await request.json()
    course_id = data.get('course_id')
    course_name = data.get('course_name') 
    assignment_id = data.get('assignment_id')
    assignment_title = data.get('assignment_title') 
    submission_id = data.get('submission_id')
    student_name = data.get('student_name') 
    answer_key_url = data.get('answer_key_url')

    if not all([course_id, assignment_id, submission_id, answer_key_url, course_name, assignment_title, student_name]):
        # CHANGED: 'jsonify' is replaced with 'JSONResponse'
        return JSONResponse(
            content={"error": "Missing required data: course_id, course_name, assignment_id, assignment_title, submission_id, student_name, or answer_key_url."},
            status_code=400
        )

    # CHANGED: Passed 'request' object to get_google_service
    classroom_service = get_google_service('classroom', 'v1', request)
    drive_service = get_google_service('drive', 'v3', request)

    if not classroom_service or not drive_service:
        # CHANGED: 'jsonify' is replaced with 'JSONResponse'
        return JSONResponse(
            content={"error": "User not authenticated or missing Drive/Classroom permissions. Please re-login."},
            status_code=401
        )
    
    try:
        answer_key_file_id = extract_drive_file_id_from_url(answer_key_url)
        if not answer_key_file_id:
            # CHANGED: 'jsonify' is replaced with 'JSONResponse'
            return JSONResponse(
                content={"error": "Invalid Google Drive URL provided for the Answer Key. Please check the URL."},
                status_code=400
            )

        assignment_details = classroom_service.courses().courseWork().get(courseId=course_id, id=assignment_id).execute()
        materials = assignment_details.get('materials', [])
        questionnaire_file_id = None
        
        for material in materials:
            if 'driveFile' in material and 'driveFile' in material['driveFile']:
                questionnaire_file_id = material['driveFile']['driveFile']['id']
                print(f"Identified questionnaire file ID: {questionnaire_file_id} from assignment materials.")
                break 
        
        if not questionnaire_file_id:
            # CHANGED: 'jsonify' is replaced with 'JSONResponse'
            return JSONResponse(
                content={"error": "No Google Drive document (questionnaire) found attached to this assignment."},
                status_code=404
            )

        submission_details = classroom_service.courses().courseWork().studentSubmissions().get(
            courseId=course_id, courseWorkId=assignment_id, id=submission_id).execute()
        
        attachments = submission_details.get('assignmentSubmission', {}).get('attachments', [])
        if not attachments:
            # CHANGED: 'jsonify' is replaced with 'JSONResponse'
            return JSONResponse(
                content={"error": "This student has not attached any file to their submission."},
                status_code=404
            )
        
        student_submission_file_id = attachments[0]['driveFile']['id']
        print(f"Identified student submission file ID: {student_submission_file_id}.")


        print("Initiating document downloads...")
        # NOTE: download_drive_file_content is synchronous.
        # For a fully async app, these should be run in a thread pool,
        # but leaving as-is for direct conversion.
        questionnaire_text = download_drive_file_content(drive_service, questionnaire_file_id, "Questionnaire")
        answer_key_text = download_drive_file_content(drive_service, answer_key_file_id, "Answer Key")
        student_submission_text = download_drive_file_content(drive_service, student_submission_file_id, "Student Submission")

        if not all([questionnaire_text, answer_key_text, student_submission_text]):
            # CHANGED: 'jsonify' is replaced with 'JSONResponse'
            return JSONResponse(
                content={"error": "Failed to download text content from one or more required documents. Check file permissions or existence."},
                status_code=500
            )
        
        print("Documents downloaded. Constructing Gemini prompt and calling AI...")
        model = genai.GenerativeModel(model_name="gemini-2.5-flash") # Using 1.5 Flash as a modern equivalent
        
        prompt = f"""
        You are an expert AI teaching assistant for a Google Classroom assignment titled "{assignment_details.get('title', 'Unknown Assignment')}". Your task is to rigorously grade the student's submission, providing a score out of 100, and comprehensive feedback.

        --- QUESTIONNAIRE (The questions/tasks presented to the student) ---
        {questionnaire_text}

        --- OFFICIAL ANSWER KEY (The expected correct responses/solutions) ---
        {answer_key_text}

        --- STUDENT'S SUBMISSION (The student's actual answers/work) ---
        {student_submission_text}

        --- GRADING INSTRUCTIONS ---
        1.  **Understanding the Task:** Carefully read the QUESTIONNAIRE to grasp the specific requirements and learning objectives.
        2.  **Content Accuracy & Completeness:** Compare the STUDENT'S SUBMISSION against the OFFICIAL ANSWER KEY.
            * How accurately does the student address each question/task?
            * Is the information presented correct?
            * Are all parts of the question/task attempted and completed?
            * **Award points for partially correct or reasonable attempts. Avoid giving a 0 unless the submission is entirely blank, off-topic, or completely nonsensical.** Even minimal effort to address the prompt should receive some credit.
        3.  **Structure & Clarity:** Evaluate the organization, clarity, and readability of the student's response.
        4.  **Meaning & Comprehension:** Assess the student's understanding of the concepts. Does their submission demonstrate comprehension, or is it just rote memorization/copying?
        5.  **Assign a Numerical Grade (0-100):** Based on the above criteria, assign a numerical grade.
        6.  **Provide Comprehensive Feedback:**
            * Start with positive aspects or areas where the student demonstrated understanding.
            * Clearly explain where points were lost, referencing specific parts of the questionnaire or answer key.
            * Suggest concrete steps for improvement.
        7.  **Justify the Grade (Briefly):** Include a short sentence explaining the overall reasoning for the assigned score.
        8.  **Format your response STRICTLY as follows, with no extra text before or after, ensuring clear separation for parsing:
        GRADE: [SCORE]/100
        GRADE_JUSTIFICATION: [A brief, one-sentence reason for the score]
        FEEDBACK: [Your detailed feedback paragraph here, covering all points from instruction 6]
        """
        
        # CHANGED: Switched to the async version of the call
        response = await model.generate_content_async(prompt)
        
        print("Gemini response received. Parsing...")
        grade_text_output = response.text
        
        grade_match = re.search(r'GRADE:\s*(\d+)/100', grade_text_output, re.IGNORECASE)
        justification_match = re.search(r'GRADE_JUSTIFICATION:\s*(.*)', grade_text_output, re.IGNORECASE)
        feedback_match = re.search(r'FEEDBACK:\s*(.*)', grade_text_output, re.IGNORECASE | re.DOTALL)

        if not grade_match or not feedback_match or not justification_match:
            print(f"Gemini response was not in the expected format. Raw response:\n{grade_text_output}")
            # CHANGED: 'jsonify' is replaced with 'JSONResponse'
            return JSONResponse(
                content={"error": "Failed to parse grade, justification, or feedback from AI response. Please ensure Gemini's output adheres to the specified format."},
                status_code=500
            )
            
        final_grade = int(grade_match.group(1))
        grade_justification = justification_match.group(1).strip()
        feedback_str = feedback_match.group(1).strip()
        
        # import datetime # This was here, moved to top
        graded_item = {
            "course_id": course_id,
            "course_name": course_name,
            "assignment_id": assignment_id,
            "assignment_title": assignment_title,
            "submission_id": submission_id,
            "student_name": student_name,
            "assignedGrade": final_grade,
            "feedback": feedback_str,
            "grade_justification": grade_justification,
            "timestamp": datetime.datetime.now().isoformat()
        }
        graded_assignments_history.append(graded_item)

        print(f"AI Grade: {final_grade}/100. Providing review for dashboard display only (no Classroom update).")
        # CHANGED: 'jsonify' is replaced with returning a dictionary
        return {
            "message": "AI grading complete. Review provided for dashboard display only.",
            "assignedGrade": final_grade,
            "feedback": feedback_str,
            "grade_justification": grade_justification,
            "status": "review_only", 
            "graded_history": graded_assignments_history 
        }


    except HttpError as error:
        error_details = error.content.decode('utf-8')
        print(f"Google API Error in grading: {error.resp.status} - {error_details}")
        # CHANGED: 'jsonify' is replaced with 'JSONResponse'
        return JSONResponse(
            content={"error": f"Google API Error: {error_details}"},
            status_code=error.resp.status
        )
    except Exception as e:
        print(f"An unexpected error occurred during grading: {e}")
        # CHANGED: 'jsonify' is replaced with 'JSONResponse'
        return JSONResponse(
            content={"error": f"An unexpected error occurred: {str(e)}"},
            status_code=500
        )

# --- New route to fetch the entire grading history ---

# CHANGED: Converted Flask route to FastAPI GET endpoint
@app.get('/api/graded_history')
async def get_graded_history():
    """Returns the list of all assignments graded in the current session."""
    # CHANGED: 'jsonify' is replaced with returning the list directly
    return graded_assignments_history


# --- 6. MAIN APPLICATION RUNNER ---

# CHANGED: Replaced Flask's 'app.run' with 'uvicorn.run'
if __name__ == '__main__':
    # Flask's 'debug=True' is similar to 'reload=True' in uvicorn,
    # but 'reload=True' must be run from the command line.
    # This is the direct equivalent of 'app.run(port=8000)'
    # To run with reload (like Flask debug): uvicorn main:app --port 8000 --reload
    # (Assuming your file is named 'main.py')
    uvicorn.run(app, host="127.0.0.1", port=8000)