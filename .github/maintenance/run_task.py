#!/usr/bin/env python3
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo
import json

ROOT = Path(__file__).resolve().parents[2]
SCHEDULE_FILE = ROOT / ".github/maintenance/schedule.json"
README_FILE = ROOT / "README.md"
IST = ZoneInfo("Asia/Kolkata")


def append_section(title, text):
    if not README_FILE.exists():
        return False
    current = README_FILE.read_text(encoding="utf-8")
    marker = f"## {title}"
    if marker in current:
        return False
    README_FILE.write_text(current.rstrip() + f"\n\n{marker}\n\n{text}\n", encoding="utf-8")
    return True


def main():
    schedule = json.loads(SCHEDULE_FILE.read_text(encoding="utf-8"))
    task = schedule.get(datetime.now(IST).date().isoformat())
    if not task:
        return 0

    sections = {
        "data_privacy_notes": (
            "Data Privacy Notes",
            "MedVault currently stores health records in the browser. This section documents that the current release is not a cloud health-record service and that browser/device loss can affect locally stored records.",
        ),
        "development_workflow": (
            "Development Workflow",
            "For local development, install dependencies with npm install, run the app with npm run dev, and verify production output with npm run build. Keep feature work small and verify the existing core health-record flows after changes.",
        ),
        "feature_review": (
            "Product Expansion Plan",
            "The next product stage will introduce a backend boundary so MedVault can later support a secure database, doctor-directory data, and an AI assistant without exposing service credentials in the browser. External API keys must remain in deployment environment variables and must never be committed to the repository.",
        ),
        "final_project_review": (
            "Product Roadmap",
            "MedVault is being developed toward a production-oriented women's health platform: a polished web app first, followed by a backend/database layer, searchable doctor directory, AI assistant, stronger privacy and access controls, and a mobile-ready architecture for eventual Android distribution.",
        ),
    }

    title, text = sections[task["task_id"]]
    append_section(title, text)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
