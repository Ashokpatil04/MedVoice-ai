# AI Healthcare Major Project

Role-based multilingual healthcare platform with:

- React + Vite frontend
- Spring Boot backend
- FastAPI AI service
- MongoDB persistence
- Whisper-ready speech processing hooks
- BioBERT-ready medical term extraction hooks

## Modules

- Patient login, registration, dashboard, translation, reports, about
- Doctor login, registration, certificate verification, dashboard
- Real-time speech section for patient and doctor workflows
- Doctor certificate verification stored so it is not re-requested on later logins

## Run

### AI service

```powershell
cd "C:\Users\abhib\OneDrive\Documents\New project 2\ai-service"
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```

### Backend

```powershell
cd "C:\Users\abhib\OneDrive\Documents\New project 2\backend"
mvn spring-boot:run
```

### Frontend

```powershell
cd "C:\Users\abhib\OneDrive\Documents\New project 2\frontend"
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```
