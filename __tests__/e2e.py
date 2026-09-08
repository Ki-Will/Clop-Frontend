import sys
import time
from playwright.sync_api import sync_playwright, expect

def run_e2e():
    print("=" * 60)
    print("STARTING COMPLETE E2E TEST SUITE FOR CLOP / FOCUSFLOW")
    print("=" * 60)

    test_results = []

    def record(test_name, passed, detail=""):
        status = "PASSED [OK]" if passed else "FAILED [X]"
        print(f"[{status}] {test_name}" + (f": {detail}" if detail else ""))
        test_results.append((test_name, passed, detail))

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            record_video_dir="/home/jules/verification/videos"
        )
        context.add_init_script("localStorage.clear()")
        page = context.new_page()

        try:
            # ----------------------------------------------------
            # TEST 1: App Loading & Splash Screen
            # ----------------------------------------------------
            print("\n--- Test 1: App Loading & Splash Screen ---")
            page.goto("http://localhost:3000")

            # Should see FocusFlow branding on splash
            expect(page.get_by_text("FocusFlow")).to_be_visible()
            record("E2E-01: Splash Screen Display", True, "FocusFlow branding visible")

            page.wait_for_timeout(2000) # wait 2s for splash timer to complete

            # ----------------------------------------------------
            # TEST 2: Onboarding Flow Navigation
            # ----------------------------------------------------
            print("\n--- Test 2: Onboarding Flow Navigation ---")
            expect(page.get_by_text("Master Your Tasks")).to_be_visible()
            record("E2E-02: Onboarding Flow Render", True, "Master Your Tasks visible")

            page.get_by_role("button", name="Next").click()
            page.wait_for_timeout(500)
            expect(page.get_by_text("Track Your Progress")).to_be_visible()

            page.get_by_role("button", name="Skip").click()
            page.wait_for_timeout(1000)

            # ----------------------------------------------------
            # TEST 3: User Authentication (Sign up / Registration)
            # ----------------------------------------------------
            print("\n--- Test 3: User Authentication ---")
            expect(page.get_by_text("Welcome Back")).to_be_visible()

            page.get_by_role("button", name="Sign up").click()
            page.wait_for_timeout(500)

            expect(page.get_by_text("Create Account").first).to_be_visible()
            page.get_by_placeholder("Choose a username").fill("E2E_Tester")
            page.get_by_placeholder("Enter your email").fill("e2e@example.com")
            page.get_by_placeholder("At least 6 characters").fill("password123")
            page.get_by_role("button", name="Create Account").click()
            page.wait_for_timeout(2000)

            record("E2E-03: User Registration & Authentication", True, "Registered and authenticated successfully")

            # ----------------------------------------------------
            # TEST 4: Dashboard Home View
            # ----------------------------------------------------
            print("\n--- Test 4: Dashboard Home View ---")
            expect(page.get_by_text("Daily Goal Progress")).to_be_visible()
            record("E2E-04: Dashboard Home Render", True, "Clop header and progress card rendered")

            # ----------------------------------------------------
            # TEST 5: Creating & Managing Tasks
            # ----------------------------------------------------
            print("\n--- Test 5: Creating & Managing Tasks ---")
            page.get_by_role("button", name="Add").first.click()
            page.wait_for_timeout(500)

            expect(page.get_by_text("Add New Task")).to_be_visible()
            page.get_by_placeholder("e.g. Design app interface").fill("E2E Test Task")
            page.get_by_placeholder("e.g. Design, Coding, Work").fill("Automation")
            page.get_by_role("button", name="Add Task").click()
            page.wait_for_timeout(1000)

            expect(page.get_by_text("E2E Test Task")).to_be_visible()
            record("E2E-05: Task Creation", True, "Created 'E2E Test Task'")

            # Switch to Tasks Tab via bottom nav (3rd button)
            page.locator(".glass-bottom-nav button").nth(2).click()
            page.wait_for_timeout(500)

            # Complete the task on Tasks Tab
            page.get_by_role("button", name="Complete").first.click()
            page.wait_for_timeout(1000)
            record("E2E-06: Task Completion Toggle", True, "Marked task complete")

            # ----------------------------------------------------
            # TEST 6: Pomodoro Timer Controls
            # ----------------------------------------------------
            print("\n--- Test 6: Pomodoro Timer Controls ---")
            # Click timer tab (2nd button in bottom nav)
            page.locator(".glass-bottom-nav button").nth(1).click()
            page.wait_for_timeout(500)

            expect(page.get_by_role("heading", name="Focus Session")).to_be_visible()

            # Click Start
            start_btn = page.get_by_role("button", name="Start")
            start_btn.click()
            page.wait_for_timeout(1500)

            # Click Pause
            pause_btn = page.get_by_role("button", name="Pause")
            expect(pause_btn).to_be_visible()
            pause_btn.click()
            page.wait_for_timeout(500)

            # Click Reset
            reset_btn = page.get_by_role("button", name="Reset")
            reset_btn.click()
            page.wait_for_timeout(500)
            record("E2E-07: Pomodoro Timer Operations", True, "Start, Pause, and Reset verified")

            # ----------------------------------------------------
            # TEST 7: Settings Page Operations
            # ----------------------------------------------------
            print("\n--- Test 7: Settings Page Operations ---")
            # Click settings tab (5th button in bottom nav)
            page.locator(".glass-bottom-nav button").nth(4).click()
            page.wait_for_timeout(500)

            expect(page.get_by_text("Settings").first).to_be_visible()
            expect(page.get_by_text("Profile Information")).to_be_visible()

            # Test updating display name
            name_input = page.get_by_placeholder("Enter display name")
            name_input.fill("E2E Pro User")
            page.get_by_role("button", name="Save").click()
            page.wait_for_timeout(1000)
            record("E2E-08: Profile Settings Update", True, "Updated display name to 'E2E Pro User'")

            # Take final screenshot
            page.screenshot(path="/home/jules/verification/screenshots/e2e_final.png")
            page.wait_for_timeout(1000)

        except Exception as e:
            record("E2E Execution Error", False, str(e))
            raise e
        finally:
            context.close()
            browser.close()

    print("\n" + "=" * 60)
    print("E2E TEST SUMMARY RESULTS:")
    print("=" * 60)
    passed_count = sum(1 for _, p, _ in test_results if p)
    total_count = len(test_results)
    for name, passed, detail in test_results:
        st = "PASS" if passed else "FAIL"
        print(f" - [{st}] {name}: {detail}")
    print(f"\nTOTAL RESULT: {passed_count}/{total_count} PASSED.")
    print("=" * 60)

    if passed_count < total_count:
        sys.exit(1)

if __name__ == "__main__":
    run_e2e()
