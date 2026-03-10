@echo off
REM Pain Recognition Setup Script for Windows
REM This script sets up the pain recognition feature

echo ============================================================
echo    PAIN RECOGNITION FEATURE SETUP
echo ============================================================
echo.

echo Step 1: Installing Python dependencies...
cd backend
python -m pip install scipy==1.11.4
if %errorlevel% neq 0 (
    echo ERROR: Failed to install scipy
    pause
    exit /b 1
)
echo [OK] Dependencies installed successfully
echo.

echo Step 2: Running database migration...
python migrate_pain_tracking.py
if %errorlevel% neq 0 (
    echo ERROR: Database migration failed
    echo Please check your MySQL connection settings
    pause
    exit /b 1
)
echo [OK] Database migration completed
echo.

echo Step 3: Verifying installation...
python -c "from ai_models import PainRecognitionEngine, PainLevel; print('Pain recognition module loaded successfully')"
if %errorlevel% neq 0 (
    echo ERROR: Failed to import pain recognition module
    pause
    exit /b 1
)
echo [OK] Pain recognition module verified
echo.

echo ============================================================
echo    SETUP COMPLETED SUCCESSFULLY
echo ============================================================
echo.
echo Pain recognition is now ready to use!
echo.
echo Next steps:
echo   1. Start the backend: python main.py
echo   2. Start the frontend: cd ../frontend; npm run dev
echo   3. Begin exercising - pain detection will work automatically
echo.
echo For more information, see PAIN_RECOGNITION_GUIDE.md
echo.
pause
