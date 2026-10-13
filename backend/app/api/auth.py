from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.auth import UserRegister, UserLogin, UserResponse, Token
from app.security import verify_password, get_password_hash, create_access_token
from app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=Token)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    # Check if username or email exists
    if db.query(User).filter(User.username == user_in.username).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered. Please choose another or login."
        )
    if db.query(User).filter(User.email == user_in.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email address already registered."
        )

    user = User(
        username=user_in.username,
        email=user_in.email,
        full_name=user_in.full_name or user_in.username.capitalize(),
        hashed_password=get_password_hash(user_in.password),
        created_at=datetime.utcnow(),
        streak_count=1,
        last_active_date=datetime.utcnow()
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": user.username, "user_id": user.id})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }

@router.post("/login", response_model=Token)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    # Look up by username or email
    user = db.query(User).filter(
        (User.username == login_data.username) | (User.email == login_data.username)
    ).first()

    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )

    # Update streak
    now = datetime.utcnow()
    if (now - user.last_active_date).days == 1:
        user.streak_count += 1
    user.last_active_date = now
    db.commit()

    token = create_access_token({"sub": user.username, "user_id": user.id})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/demo", response_model=Token)
def demo_login(db: Session = Depends(get_db)):
    """One-click instant demo mode that logs into a seeded demo student."""
    demo_user = db.query(User).filter(User.username == "demo_student").first()
    if not demo_user:
        demo_user = User(
            username="demo_student",
            email="demo@learnmate.ai",
            full_name="Alex Chen (Demo Student)",
            hashed_password=get_password_hash("learnmate2026"),
            streak_count=5,
            last_active_date=datetime.utcnow()
        )
        db.add(demo_user)
        db.commit()
        db.refresh(demo_user)

        # Seed sample resources for demo student
        from app.sample_data.samples import seed_demo_data
        seed_demo_data(db, demo_user.id)

    token = create_access_token({"sub": demo_user.username, "user_id": demo_user.id})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": demo_user
    }
