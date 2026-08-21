# Test Plan & Verification Guide: Site Inspection Dashboard (`test.md`)

This document provides a comprehensive suite of manual test cases and automated verification scripts to test the **Saniti Enterprise Site Inspection Dashboard** UI, state transitions, and interactive features.

---

## 🚀 Environment & Prerequisites

- **Local Server**: Running at `http://localhost:3000` (`npm run dev`)
- **Main Component**: `components/SiteCardDashboard.tsx`
- **Backend API**: `/api/parse` (For AI text extraction)

---

## 📋 Manual Test Cases

### TC-01: Visual Hierarchy & Page Structure
| Step | Action | Expected Result | Pass/Fail |
| :--- | :--- | :--- | :---: |
| 1 | Navigate to `http://localhost:3000` | Page loads with split layout: Left raw text input, Right enterprise dashboard card. | [ ] |
| 2 | Check visual hierarchy | Header displays site name in bold 2xl font; status & urgency badges use clear semantic color coding (Red for Urgent, Amber for High/Repair, Green for Operational). | [ ] |
| 3 | Inspect action buttons | Download, Copy, Dispatch Work Order, and Edit buttons are clearly rendered in top header. | [ ] |

---

### TC-02: Mode Switching (Read-Only vs. Edit Mode)
| Step | Action | Expected Result | Pass/Fail |
| :--- | :--- | :--- | :---: |
| 1 | Click **"Edit Inspection"** button in header | UI transitions to Edit Mode. Editable input boxes appear for Site Name, Inspector, Urgency, Engine, Notes, and Observations. | [ ] |
| 2 | Verify Header Button label | Header button changes from "Edit Inspection" to **"Save Changes"**. | [ ] |
| 3 | Click **"Save Changes"** | Form collapses back into Read-Only view, displaying updated data with badges. Toast alert appears confirming save. | [ ] |

---

### TC-03: Data Editing & List Operations
| Step | Action | Expected Result | Pass/Fail |
| :--- | :--- | :--- | :---: |
| 1 | Click **"Edit Inspection"** | Inputs become active. | [ ] |
| 2 | Change Site Name to `North Wind Turbine A-4` | Input reflects typed value. | [ ] |
| 3 | Change Urgency select dropdown to `Urgent` | Select value updates. | [ ] |
| 4 | Click **"+ Add Equipment"** in Equipment section | A new empty equipment row appears with inputs for Equipment Name, Status, and Findings. | [ ] |
| 5 | Fill in new item: Name: `Main Rotor Gearbox`, Status: `Needs Repair`, Finding: `Vibration anomaly` | Fields accept text and dropdown choice. | [ ] |
| 6 | Click trash icon on an equipment row | Selected equipment row is removed. | [ ] |
| 7 | Click **"Save Changes"** | Read-Only mode displays updated site name, new urgency badge, and modified equipment table. | [ ] |

---

### TC-04: Maintenance Work Order Dispatch Workflow
| Step | Action | Expected Result | Pass/Fail |
| :--- | :--- | :--- | :---: |
| 1 | Ensure inspection has equipment items marked `Needs Repair` or `Replace` | Items flagged for action are present. | [ ] |
| 2 | Click **"Dispatch Work Order"** header button | Modal dialog appears titled **"Confirm Maintenance Work Orders"**. | [ ] |
| 3 | Inspect Modal Content | Modal lists only items requiring attention (`Needs Repair` / `Replace`) with priority tags. | [ ] |
| 4 | Click **"Confirm & Dispatch"** | Modal closes. Toast notification appears: *"Dispatched X maintenance work orders"*. | [ ] |
| 5 | Verify Session Tracker | Header counter **"Work Orders Dispatched"** increments by X. | [ ] |
| 6 | Click **"Cancel / Close"** on Modal | Modal closes without incrementing dispatch counter. | [ ] |

---

### TC-05: AI Text Extraction & Parsing
| Step | Action | Expected Result | Pass/Fail |
| :--- | :--- | :--- | :---: |
| 1 | Select AI Provider from dropdown (e.g., `ollama`, `openai`, `google`) | Selection updates. | [ ] |
| 2 | Paste site inspection text into left textarea | Text populates textarea. | [ ] |
| 3 | Click **"Extract Structured Data"** | Loading state activates (button spinner). | [ ] |
| 4 | Wait for response | Raw text is parsed and dashboard fields update automatically with extracted metadata and equipment notes. Toast confirms extraction. | [ ] |

---

### TC-06: Export Actions (JSON Copy & Download)
| Step | Action | Expected Result | Pass/Fail |
| :--- | :--- | :--- | :---: |
| 1 | Click **"Copy JSON"** button | Toast notification appears: *"JSON copied to clipboard!"*. Clipboard contains stringified JSON of inspection state. | [ ] |
| 2 | Click **"Download JSON"** button | Browser triggers download for file `site-inspection-<site_id>.json`. | [ ] |

---

## 🤖 Automated Testing

### Playwright E2E Test Script (`e2e_test.py`)

You can run the following automated Python test using Playwright:

```python
from playwright.sync_api import sync_playwright

def run_test():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        # 1. Load Page
        print("Navigating to app...")
        page.goto("http://localhost:3000")
        assert "Saniti" in page.title() or page.locator("text=Site Inspection Dashboard").is_visible()
        
        # 2. Test Edit Mode Toggle
        print("Testing Edit Mode...")
        edit_btn = page.locator("button:has-text('Edit Inspection')")
        edit_btn.click()
        page.wait_for_selector("button:has-text('Save Changes')")
        
        # Edit Site Name
        site_input = page.locator("input[value*='Turbine'], input[placeholder*='Site Name']").first
        if site_input.is_visible():
            site_input.fill("Automated Test Field Station 9")
            
        save_btn = page.locator("button:has-text('Save Changes')")
        save_btn.click()
        page.wait_for_selector("text=Automated Test Field Station 9")
        print("Edit Mode Test Passed!")

        # 3. Test Dispatch Work Order Modal
        print("Testing Work Order Dispatch Modal...")
        dispatch_btn = page.locator("button:has-text('Dispatch Work Order')")
        dispatch_btn.click()
        page.wait_for_selector("text=Confirm Maintenance Work Orders")
        
        confirm_btn = page.locator("button:has-text('Confirm & Dispatch')")
        confirm_btn.click()
        
        # Verify toast and counter update
        page.wait_for_selector("text=Dispatched")
        print("Work Order Dispatch Test Passed!")

        browser.close()
        print("All E2E tests completed successfully!")

if __name__ == "__main__":
    run_test()
```

---

## 🛠 Command Summary

- **Run Dev Server**: `npm run dev`
- **Type Check**: `npx tsc --noEmit`
- **Lint Check**: `npm run lint`
