@echo off
echo ========================================
echo Checking and installing dependencies...
echo ========================================
py -m pip install -r requirements.txt
if errorlevel 1 (
    echo [Warning] 'py' command failed, trying 'python' instead...
    python -m pip install -r requirements.txt
    if errorlevel 1 (
        echo [Error] Failed to install dependencies. Please ensure Python is installed and added to PATH.
        pause
        exit /b
    )
    echo ========================================
    echo Starting Portrait Matting Tool...
    echo ========================================
    python app.py
) else (
    echo ========================================
    echo Starting Portrait Matting Tool...
    echo ========================================
    py app.py
)
pause
