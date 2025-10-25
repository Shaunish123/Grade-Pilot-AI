import os
import json
import re
import io
import google.generativeai as genai
from flask import Flask, request, redirect, session, url_for, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from googleapiclient.http import MediaIoBaseDownload
from google.auth.transport.requests import Request
from google_auth_oauthlib.flow import Flow 

# --- 1. INITIAL CONFIGURATION ---
load_dotenv()
app = Flask(__name__)
app.secret_key = os.urandom(24) 
CORS(app, supports_credentials=True, origins=["http://localhost:5173"])
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
    """Converts a Google Credentials object to a dictionary for Flask session storage."""
    return {
        'token': credentials.token,
        'refresh_token': credentials.refresh_token,
        'token_uri': credentials.token_uri,
        'client_id': credentials.client_id,
        'client_secret': credentials.client_secret,
        'scopes': credentials.scopes
    }

def get_google_service(service_name, version):
    """
    Builds and returns an authorized Google API service object (e.g., Classroom, Drive).
    Handles refreshing expired access tokens using the refresh token.
    """
    if 'credentials' not in session:
        return None # User not authenticated

    creds_data = session['credentials']
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
                creds.refresh(Request())
                session['credentials'] = credentials_to_dict(creds)
            except Exception as e:
                print(f"Failed to refresh token: {e}")
                session.clear()
                return None
        else:
            print("Credentials invalid and no refresh token or not expired. Re-authentication needed.")
            session.clear()
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
    match = re.search(r'/d/([a-zA-Z0-9_-]+)', url)
    if match:
        return match.group(1)
    return None

def download_drive_file_content(drive_service, file_id, file_name="unknown"):
    """
    Downloads a Google Drive file's content as plain text.
    Handles native Google Workspace files (Docs, Sheets, Slides) by exporting to text/plain.
    Handles other text-based files (e.g., .txt, .docx, .pdf) by downloading raw content.
    """
    try:
        file_metadata = drive_service.files().get(fileId=file_id, fields='mimeType, name').execute()
        mime_type = file_metadata.get('mimeType')
        actual_file_name = file_metadata.get('name', file_name)
        print(f"Attempting to download '{actual_file_name}' (ID: {file_id}) with MIME type: {mime_type}")

        if mime_type.startswith('application/vnd.google-apps'):
            request = drive_service.files().export_media(fileId=file_id, mimeType='text/plain')
        else:
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


# --- 3. AUTHENTICATION ROUTES (No changes here, keeping for full context) ---

@app.route('/login')
def login():
    """Initiates the Google OAuth 2.0 login flow, redirecting to Google's consent screen."""
    flow = Flow.from_client_secrets_file(
        CLIENT_SECRETS_FILE,
        scopes=SCOPES, # Use the updated SCOPES list
        redirect_uri=url_for('callback', _external=True)
    )
    authorization_url, state = flow.authorization_url(access_type='offline', prompt='consent')
    session['state'] = state
    return redirect(authorization_url)

@app.route('/auth/callback')
def callback():
    """Handles the callback from Google after a user grants or denies permissions."""
    if 'state' not in session or session['state'] != request.args.get('state'):
        return jsonify({"error": "State mismatch. Possible CSRF attack."}), 400

    flow = Flow.from_client_secrets_file(
        CLIENT_SECRETS_FILE,
        scopes=SCOPES, # Use the updated SCOPES list
        state=session['state'],
        redirect_uri=url_for('callback', _external=True)
    )
    try:
        flow.fetch_token(authorization_response=request.url)
        credentials = flow.credentials
        session['credentials'] = credentials_to_dict(credentials)
        session.pop('state', None)
        return redirect('http://localhost:5173/dashboard')
    except Exception as e:
        print(f"Error fetching token: {e}")
        session.clear()
        return jsonify({"error": "Authentication failed."}), 500

@app.route('/logout')
def logout():
    """Logs the user out by clearing the Flask session."""
    session.clear()
    return jsonify({"message": "Successfully logged out"}), 200


# --- 4. API DATA-FETCHING ROUTES ---

@app.route('/api/courses', methods=['GET'])
def get_courses():
    """Fetches and returns a list of the teacher's active Google Classroom courses."""
    classroom_service = get_google_service('classroom', 'v1')
    if not classroom_service:
        return jsonify({"error": "User not authenticated or session expired. Please re-login."}), 401
    
    try:
        courses = classroom_service.courses().list(teacherId='me', courseStates=['ACTIVE']).execute()
        return jsonify(courses.get('courses', []))
    except HttpError as error:
        print(f"Google Classroom API Error in get_courses: {error.resp.status} - {error.content.decode('utf-8')}")
        return jsonify({"error": f"Failed to fetch courses: {error.content.decode('utf-8')}"}), error.resp.status

@app.route('/api/courses/<course_id>/assignments', methods=['GET'])
def get_assignments(course_id):
    """Fetches and returns a list of assignments for a given course ID."""
    classroom_service = get_google_service('classroom', 'v1')
    if not classroom_service:
        return jsonify({"error": "User not authenticated or session expired. Please re-login."}), 401
    try:
        all_coursework = classroom_service.courses().courseWork().list(courseId=course_id).execute()
        assignments_only = [
            item for item in all_coursework.get('courseWork', []) 
            if item.get('workType') == 'ASSIGNMENT'
        ]
        return jsonify(assignments_only)

    except HttpError as error:
        print(f"Google Classroom API Error in get_assignments for course {course_id}: {error.resp.status} - {error.content.decode('utf-8')}")
        return jsonify({"error": f"Failed to fetch assignments: {error.content.decode('utf-8')}"}), error.resp.status
    except Exception as e:
        print(f"An unexpected error occurred in get_assignments: {e}")
        return jsonify({"error": f"An unexpected error occurred: {str(e)}"}), 500

@app.route('/api/courses/<course_id>/assignments/<assignment_id>/submissions', methods=['GET'])
def get_submissions(course_id, assignment_id):
    """
    Fetches and returns a list of student submissions for a specific assignment.
    Now includes logic to fetch and attach student names to each submission.
    """
    classroom_service = get_google_service('classroom', 'v1')
    if not classroom_service:
        return jsonify({"error": "User not authenticated or session expired. Please re-login."}), 401
    
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

        return jsonify(processed_submissions)
    except HttpError as error:
        print(f"Google Classroom API Error in get_submissions for course {course_id}, assignment {assignment_id}: {error.resp.status} - {error.content.decode('utf-8')}")
        return jsonify({"error": f"Failed to fetch submissions: {error.content.decode('utf-8')}"}), error.resp.status


# --- 5. CORE GRADING ROUTE (NO CHANGES HERE) ---

@app.route('/api/grade', methods=['POST'])
def grade_submission():
    global graded_assignments_history 

    data = request.json
    course_id = data.get('course_id')
    course_name = data.get('course_name') 
    assignment_id = data.get('assignment_id')
    assignment_title = data.get('assignment_title') 
    submission_id = data.get('submission_id')
    student_name = data.get('student_name') 
    answer_key_url = data.get('answer_key_url')

    if not all([course_id, assignment_id, submission_id, answer_key_url, course_name, assignment_title, student_name]):
        return jsonify({"error": "Missing required data: course_id, course_name, assignment_id, assignment_title, submission_id, student_name, or answer_key_url."}), 400

    classroom_service = get_google_service('classroom', 'v1')
    drive_service = get_google_service('drive', 'v3')

    if not classroom_service or not drive_service:
        return jsonify({"error": "User not authenticated or missing Drive/Classroom permissions. Please re-login."}), 401
    
    try:
        answer_key_file_id = extract_drive_file_id_from_url(answer_key_url)
        if not answer_key_file_id:
            return jsonify({"error": "Invalid Google Drive URL provided for the Answer Key. Please check the URL."}), 400

        assignment_details = classroom_service.courses().courseWork().get(courseId=course_id, id=assignment_id).execute()
        materials = assignment_details.get('materials', [])
        questionnaire_file_id = None
        
        for material in materials:
            if 'driveFile' in material and 'driveFile' in material['driveFile']:
                questionnaire_file_id = material['driveFile']['driveFile']['id']
                print(f"Identified questionnaire file ID: {questionnaire_file_id} from assignment materials.")
                break 
        
        if not questionnaire_file_id:
            return jsonify({"error": "No Google Drive document (questionnaire) found attached to this assignment."}), 404

        submission_details = classroom_service.courses().courseWork().studentSubmissions().get(
            courseId=course_id, courseWorkId=assignment_id, id=submission_id).execute()
        
        attachments = submission_details.get('assignmentSubmission', {}).get('attachments', [])
        if not attachments:
            return jsonify({"error": "This student has not attached any file to their submission."}), 404
        
        student_submission_file_id = attachments[0]['driveFile']['id']
        print(f"Identified student submission file ID: {student_submission_file_id}.")


        print("Initiating document downloads...")
        questionnaire_text = download_drive_file_content(drive_service, questionnaire_file_id, "Questionnaire")
        answer_key_text = download_drive_file_content(drive_service, answer_key_file_id, "Answer Key")
        student_submission_text = download_drive_file_content(drive_service, student_submission_file_id, "Student Submission")

        if not all([questionnaire_text, answer_key_text, student_submission_text]):
            return jsonify({"error": "Failed to download text content from one or more required documents. Check file permissions or existence."}), 500
        
        print("Documents downloaded. Constructing Gemini prompt and calling AI...")
        model = genai.GenerativeModel(model_name="gemini-2.5-flash") 
        
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
        
        response = model.generate_content(prompt)
        
        print("Gemini response received. Parsing...")
        grade_text_output = response.text
        
        grade_match = re.search(r'GRADE:\s*(\d+)/100', grade_text_output, re.IGNORECASE)
        justification_match = re.search(r'GRADE_JUSTIFICATION:\s*(.*)', grade_text_output, re.IGNORECASE)
        feedback_match = re.search(r'FEEDBACK:\s*(.*)', grade_text_output, re.IGNORECASE | re.DOTALL)

        if not grade_match or not feedback_match or not justification_match:
            print(f"Gemini response was not in the expected format. Raw response:\n{grade_text_output}")
            return jsonify({"error": "Failed to parse grade, justification, or feedback from AI response. Please ensure Gemini's output adheres to the specified format."}), 500
            
        final_grade = int(grade_match.group(1))
        grade_justification = justification_match.group(1).strip()
        feedback_str = feedback_match.group(1).strip()
        
        import datetime
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
        return jsonify({
            "message": "AI grading complete. Review provided for dashboard display only.",
            "assignedGrade": final_grade,
            "feedback": feedback_str,
            "grade_justification": grade_justification,
            "status": "review_only", 
            "graded_history": graded_assignments_history 
        })


    except HttpError as error:
        error_details = error.content.decode('utf-8')
        print(f"Google API Error in grading: {error.resp.status} - {error_details}")
        return jsonify({"error": f"Google API Error: {error_details}"}), error.resp.status
    except Exception as e:
        print(f"An unexpected error occurred during grading: {e}")
        return jsonify({"error": f"An unexpected error occurred: {str(e)}"}), 500

# --- New route to fetch the entire grading history ---
@app.route('/api/graded_history', methods=['GET'])
def get_graded_history():
    """Returns the list of all assignments graded in the current session."""
    return jsonify(graded_assignments_history)


# --- 6. MAIN APPLICATION RUNNER ---

if __name__ == '__main__':
    app.run(port=8000, debug=True)