# LearnMate AI — Personalized Tutoring & Adaptive Learning Platform

> **AI-Powered Personalized Study Companion & Adaptive Knowledge Retrieval Platform**  
> Consolidates disparate student resources (PDF textbooks, PowerPoint slides, Word documents, plain text notes, and video subtitle transcripts) into a unified, source-cited knowledge base with dynamic adaptive assessments and transparent learning roadmaps.

---

## 🌟 Executive Summary

Students frequently juggle study materials scattered across slide decks, PDF textbooks, lecture notes, and video recordings. **LearnMate AI** solves this fragmentation through an end-to-end educational platform that:
1. **Unifies & Indexes Multi-Format Resources:** Ingests PDF, PPT/PPTX, DOCX, TXT, and SRT/VTT subtitle files into semantically partitioned, traceable chunks.
2. **Delivers Grounded AI Tutoring:** Answers questions strictly cited to source passages (page numbers, slide numbers, or video timestamps), preventing hallucinations with explicit source verification.
3. **Generates Adaptive Quizzes:** Dynamically elevates question difficulty (Easy → Medium → Hard) upon consecutive correct answers, dials back difficulty when a student struggles, and identifies weak knowledge topics.
4. **Builds Personalized Learning Paths:** Automatically calculates topic mastery (*Not Started*, *In Progress*, *Mastered*) with a transparent, rule-based state machine, recommending high-priority study tasks.
5. **Visualizes Mastery & Retention:** Provides rich visual analytics and progress metrics via interactive Recharts data visualizations.
6. **Zero-Paid-API Demonstration:** Ships with pre-loaded demo study materials, pre-seeded analytics, and a 100% deterministic local RAG fallback engine that requires no external API keys.

---

## 🏗️ Architecture & Technology Stack

```
learnmate-ai/
├── backend/
│   ├── app/
│   │   ├── api/             # REST endpoints (auth, resources, chat, quizzes, dashboard, learning_path)
│   │   ├── models/          # SQLAlchemy ORM models (User, Resource, Chunk, Quiz, Mastery, etc.)
│   │   ├── schemas/         # Pydantic v2 validation schemas
│   │   ├── services/        # Doc parsers, chunker, BM25 retriever, adaptive quiz & mastery engine, LLM service
│   │   ├── config.py        # Environment settings & provider configuration
│   │   ├── database.py      # SQLite connection & session management
│   │   ├── security.py      # BCrypt password hashing & JWT token verification
│   │   └── main.py          # FastAPI application & lifecycle initialization
│   ├── sample_data/         # Seed study materials (OS, Deep Learning, Distributed Systems)
│   ├── tests/               # 16 unit & integration test suites (100% passing)
│   ├── requirements.txt     # Python backend dependencies
│   └── .env.example         # Backend environment variables template
├── frontend/
│   ├── src/
│   │   ├── components/      # Sidebar, Navbar, CitationModal, etc.
│   │   ├── context/         # AuthContext (JWT/demo session) & ThemeContext (Light/Dark)
│   │   ├── pages/           # All 10 application views (Dashboard, Resources, Upload, Chat, Quiz, etc.)
│   │   ├── services/        # api.js API client
│   │   ├── styles/          # Vanilla CSS Design System with theme custom properties (No Tailwind)
│   │   ├── App.jsx          # Root application routing and view controller
│   │   └── main.jsx         # React DOM entrypoint
│   ├── package.json         # React 19, Vite, Recharts, Lucide-react
│   ├── index.html           # HTML document entrypoint
│   └── .env.example         # Frontend environment variables template
└── README.md
```

### Core Technologies
- **Frontend:** React.js with Vite
- **Styling:** Vanilla CSS design system with custom properties for Light and Dark themes (no Tailwind CSS).
- **Icons & Visuals:** `lucide-react`, `recharts` for progress and mastery visualizations.
- **Backend:** Python 3.14 with FastAPI & Uvicorn.
- **Database:** SQLite with SQLAlchemy ORM.
- **Document Processing:** PyMuPDF (`fitz`), `pypdf`, `python-pptx`, `python-docx`, regex-based SRT/VTT subtitle parser.
- **Retrieval Engine:** Okapi BM25 and TF-IDF hybrid keyword retriever with stop-word filtering and cosine similarity normalizer.
- **Authentication:** BCrypt password hashing with HMAC-SHA256 JWT bearer tokens.
- **AI Integration:** Unified LLM adapter supporting Google Gemini 1.5, OpenAI GPT-3.5/4, Ollama, and an offline deterministic RAG tutor fallback.

---

## ⚡ Quick Start & Execution Guide (Windows / VS Code)

### Prerequisites
- Python 3.10+ (tested on Python 3.14)
- Node.js 18+ (tested on Node.js 22.15)
- npm or yarn

---

### Step 1: Start the FastAPI Backend

Open a terminal in VS Code (PowerShell):

```powershell
# Navigate to the backend directory
cd C:\Users\nivet\.gemini\antigravity\scratch\learnmate-ai\backend

# Activate the existing virtual environment
.venv\Scripts\activate

# (Optional: install dependencies if setting up on a new machine)
# pip install -r requirements.txt

# Start the backend server with auto-reload
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

> **Backend URL:** `http://localhost:8000`  
> **Interactive Swagger API Docs:** `http://localhost:8000/docs`

---

### Step 2: Start the React Frontend

Open a second terminal in VS Code:

```powershell
# Navigate to the frontend directory
cd C:\Users\nivet\.gemini\antigravity\scratch\learnmate-ai\frontend

# (Optional: install dependencies if on a new machine)
# cmd /c npm install

# Launch Vite development server
cmd /c npm run dev
```

> **Frontend Application URL:** `http://localhost:5173`

---

## 🧪 1-Click Instant Evaluator Demo Mode

1. Navigate to `http://localhost:5173`.
2. On the login screen, click **"Launch Demo Student Experience"**.
3. You are instantly logged in as **Alex Chen (Demo Student)** without requiring any manual registration or paid API tokens!
4. The demo account comes pre-loaded with:
   - **3 Processed Study Resources:**
     - *Operating Systems: Virtual Memory & Paging* (PDF)
     - *Machine Learning Fundamentals & Neural Networks* (PPTX)
     - *Distributed Systems: Concurrency & Deadlocks* (SRT Video Subtitles)
   - **Knowledge Chunks:** Inspectable partitioned text blocks with page and timestamp metadata.
   - **Pre-computed Topic Masteries:** Mastered, In Progress, and Not Started topics.
   - **Interactive Charts:** Recharts quiz trends and topic distribution charts on the dashboard.
   - **Prioritized Recommendations:** Actionable study cards targeting weak areas.

---

## 🔍 Core Features & Verification

### 1. Multi-Format Learning Resource Upload (`/upload`, `/resources`)
- Ingests **PDF**, **PPTX**, **DOCX**, **TXT**, and **SRT/VTT** subtitle files.
- Provides a **YouTube Video URL** indexer with manual caption paste.
- Extracts real text and splits documents into traceable 400-600 character chunks with page numbers, slide titles, and subtitle timecodes (e.g., `00:02:15 - 00:06:40`).
- Provides an **"Inspect Chunks"** modal to view the exact text passages extracted from each file.

### 2. AI-Powered Study Assistant (`/chat`)
- **Strict Grounding:** Searches knowledge chunks using BM25 and returns verified citations.
- **Traceable Citations:** Every assistant response features clickable citation badges displaying the source filename, page or slide number, and exact verbatim excerpt.
- **Negative Rejection:** When queried on concepts absent from uploaded materials, explicitly states: *"The available sources do not contain enough information to answer this question."*
- **Tutor Modes:**
  - **📘 Beginner Tutor:** Breaks down concepts into plain-language analogies and step-by-step Derivations.
  - **🎯 Exam Prep:** Emphasizes formal definitions, critical exam takeaways, and problem strategies.
- **💡 Hint-Only Mode:** Students can request guided conceptual hints without spoiling the direct answer.

### 3. Adaptive Quiz Generator (`/quiz`)
- Configurable by topic, starting difficulty (*Easy*, *Medium*, *Hard*), and question count (3, 5, 10).
- **Dynamic Difficulty Calibration:**
  - 2 consecutive correct answers elevate difficulty (*Easy* → *Medium* → *Hard*).
  - Incorrect answers dial back difficulty to reinforce core fundamentals.
- **Instant Explanation & Citation:** Submitting an answer instantly reveals correctness, explanation, and a button to view the original source citation.
- **Weak Topic Diagnosis:** Incorrect answers automatically flag topics as knowledge gaps for targeted revision.

### 4. Personalized Learning Path (`/learning-path`)
- Categorizes topics into:
  - 🏆 **Mastered:** $\ge 80\%$ accuracy with at least 3 attempts.
  - ⚡ **In Progress:** $50\% - 79\%$ accuracy.
  - ⏳ **Not Started:** $0\%$ attempts.
- Prioritizes high-priority remediation for weak concepts and suggests immediate action buttons (*Practice Quiz*, *Review Notes*).

### 5. Progress Analytics (`/analytics`)
- Visualizes quiz accuracy progression across attempts using Recharts Area Charts.
- Compares topic-by-topic mastery levels using Bar Charts.
- Displays syllabus distribution using Donut Charts.
- Logs historical assessment attempts in a detailed audit table.

---

## 🔐 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register new student account |
| `POST` | `/api/auth/login` | Login and receive JWT access token |
| `POST` | `/api/auth/demo` | 1-Click login as demo student with seeded data |
| `GET` | `/api/auth/me` | Fetch authenticated student profile |
| `GET` | `/api/resources` | List uploaded resources for authenticated user |
| `POST` | `/api/resources/upload` | Upload & extract PDF, PPTX, DOCX, TXT, SRT files |
| `POST` | `/api/resources/youtube` | Index YouTube lecture captions or notes |
| `GET` | `/api/resources/{id}/chunks`| Fetch extracted traceable chunks for a resource |
| `DELETE` | `/api/resources/{id}` | Delete resource and associated chunks |
| `POST` | `/api/chat` | Send question, retrieve context, receive grounded response |
| `GET` | `/api/chat/conversations` | List user chat sessions |
| `GET` | `/api/chat/conversations/{id}` | Fetch session message history |
| `POST` | `/api/quizzes/generate` | Generate adaptive quiz based on materials |
| `GET` | `/api/quizzes/{id}` | Fetch active quiz questions |
| `POST` | `/api/quizzes/{id}/submit` | Submit question answer & trigger difficulty adaptation |
| `GET` | `/api/quizzes/history` | List historical quiz attempts |
| `GET` | `/api/dashboard` | Fetch KPI stats, trends, and recent activity |
| `GET` | `/api/learning-path` | Fetch roadmap topics and prioritized recommendations |
| `POST` | `/api/learning-path/recommendations/{id}/complete` | Mark study recommendation completed |
| `GET` | `/api/health` | Service health status |

---

## 🧪 Automated Test Suite

The test suite covers unit and integration tests across authentication, document parsing, retrieval ranking, quiz flows, and adaptive difficulty.

Run tests using pytest:

```powershell
cd C:\Users\nivet\.gemini\antigravity\scratch\learnmate-ai\backend
.venv\Scripts\python.exe -m pytest tests/ -v
```

### Test Results
```
tests/test_adaptive_quiz.py::test_adaptive_difficulty_increase PASSED
tests/test_adaptive_quiz.py::test_adaptive_difficulty_decrease PASSED
tests/test_adaptive_quiz.py::test_fallback_questions_structure PASSED
tests/test_api_endpoints.py::test_health_check_endpoint PASSED
tests/test_api_endpoints.py::test_demo_login_endpoint PASSED
tests/test_api_endpoints.py::test_unauthorized_access PASSED
tests/test_auth.py::test_password_hashing PASSED
tests/test_auth.py::test_jwt_token_creation_and_decoding PASSED
tests/test_auth.py::test_invalid_token_decoding PASSED
tests/test_doc_parser.py::test_txt_extraction_and_chunking PASSED
tests/test_doc_parser.py::test_srt_subtitle_extraction PASSED
tests/test_quiz_flow.py::test_full_adaptive_quiz_and_mastery_flow PASSED
tests/test_quiz_flow.py::test_study_chat_rag_grounded_response PASSED
tests/test_quiz_flow.py::test_insufficient_sources_query PASSED
tests/test_retrieval.py::test_bm25_retrieval_ranking PASSED
tests/test_retrieval.py::test_retrieval_with_no_match PASSED

======================= 16 passed in 1.68s =======================
```

---

## ⚙️ AI Provider Configuration

The backend supports multiple AI model providers configured via `.env`:

```env
# Supported: "mock", "gemini", "openai", "ollama"
LLM_PROVIDER=mock

# If using Google Gemini:
GEMINI_API_KEY=your_gemini_api_key_here

# If using OpenAI:
OPENAI_API_KEY=your_openai_api_key_here

# If using local Ollama:
OLLAMA_BASE_URL=http://localhost:11434
```

- When `LLM_PROVIDER=mock` (default), LearnMate AI generates source-grounded answers and multiple-choice questions directly from the student's text chunks using deterministic extraction, allowing demonstration without an external API key.

---

## 🔮 Future Enhancements & Production Roadmap

1. **OCR Scanning:** Integrate Tesseract or AWS Textract for scanned handwritten student notes.
2. **Audio Lecture Transcription:** Integrate Whisper AI for direct audio/video recording transcription.
3. **Multi-User Collaboration:** Shared study rooms and team-based adaptive flashcard competitions.
4. **Export Capabilities:** Export personalized study guides and summaries to Anki or PDF.

---

*Built with ❤️ for the AI Education Hackathon 2026.*
