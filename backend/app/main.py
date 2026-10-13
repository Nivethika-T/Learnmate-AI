import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.database import engine, Base, SessionLocal
import app.models  # Ensure all SQLAlchemy models are registered
from app.api import auth, resources, chat, quizzes, dashboard, learning_path
from app.sample_data.samples import seed_demo_data
from app.models.user import User
from app.security import get_password_hash

Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables
    Base.metadata.create_all(bind=engine)
    
    # Auto-seed default demo student on initial launch if not present
    db = SessionLocal()
    try:
        demo_user = db.query(User).filter(User.username == "demo_student").first()
        if not demo_user:
            demo_user = User(
                username="demo_student",
                email="demo@learnmate.ai",
                full_name="Alex Chen (Demo Student)",
                hashed_password=get_password_hash("learnmate2026"),
                streak_count=5
            )
            db.add(demo_user)
            db.commit()
            db.refresh(demo_user)
            seed_demo_data(db, demo_user.id)
            print("Successfully initialized database with demo study materials!")
    except Exception as e:
        print(f"Notice during demo initialization: {e}")
    finally:
        db.close()

    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="LearnMate AI: Personalized Tutoring & Adaptive Learning Platform API",
    lifespan=lifespan
)

# CORS Middleware
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "*"  # Allow all during local hackathon demo
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
app.include_router(auth.router, prefix=settings.API_PREFIX)
app.include_router(resources.router, prefix=settings.API_PREFIX)
app.include_router(chat.router, prefix=settings.API_PREFIX)
app.include_router(quizzes.router, prefix=settings.API_PREFIX)
app.include_router(dashboard.router, prefix=settings.API_PREFIX)
app.include_router(learning_path.router, prefix=settings.API_PREFIX)

@app.get("/api/health", tags=["Health"])
def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "llm_provider": settings.LLM_PROVIDER
    }

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": f"An unexpected error occurred: {str(exc)}"}
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
