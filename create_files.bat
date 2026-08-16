@echo off
setlocal

set "files=frontend\app\layout.tsx frontend\app\page.tsx frontend\app\login\page.tsx frontend\app\dashboard\page.tsx frontend\app\resume\page.tsx frontend\app\interview\setup\page.tsx frontend\app\interview\[sessionId]\page.tsx frontend\app\scorecard\[sessionId]\page.tsx frontend\app\roadmap\[scorecardId]\page.tsx frontend\app\history\page.tsx frontend\app\b2b\page.tsx frontend\components\AuthProvider.tsx frontend\components\interview\TranscriptPanel.tsx frontend\components\interview\TopicProgressMap.tsx frontend\components\interview\AdaptiveReasonBadge.tsx frontend\components\interview\CodeEditorPanel.tsx frontend\components\interview\MediaControls.tsx frontend\components\ui\.keep frontend\hooks\useAuth.ts frontend\hooks\useInterviewSocket.ts frontend\lib\api-client.ts frontend\lib\firebase.ts frontend\lib\utils.ts frontend\types\index.ts frontend\.env.example frontend\.env.local frontend\tailwind.config.ts frontend\package.json backend\app\main.py backend\app\api\v1\__init__.py backend\app\api\v1\auth.py backend\app\api\v1\resume.py backend\app\api\v1\interview.py backend\app\api\v1\scorecard.py backend\app\api\v1\history.py backend\app\api\v1\roadmap.py backend\app\ws\__init__.py backend\app\ws\interview.py backend\app\models\__init__.py backend\app\schemas\__init__.py backend\app\services\__init__.py backend\app\services\resume_parser.py backend\app\services\ats_scorer.py backend\app\services\adaptive_engine.py backend\app\services\rubric_scorer.py backend\app\services\roadmap_gen.py backend\app\services\tts_stt.py backend\app\services\translator.py backend\app\services\anti_cheat.py backend\app\services\llm_router.py backend\app\db\__init__.py backend\app\db\session.py backend\tests\__init__.py backend\.env.example backend\requirements.txt"

for %%f in (%files%) do (
    for %%D in ("%%~dpf.") do if not exist "%%~fD" mkdir "%%~fD"
    type nul > "%%f"
)

echo Done.
