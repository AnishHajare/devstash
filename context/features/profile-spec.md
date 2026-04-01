# Feature: Profile Page

## 1. Route
- /profile (protected route, requires authentication)

---

## 2. Data Requirements

### User Info
- email
- name
- avatar
  - GitHub avatar if OAuth user
  - otherwise initials (derived from name/email)
- account creation date

### Usage Stats
- total items
- total collections
- breakdown by item type:
  - snippets
  - prompts
  - notes
  - commands
  - links
  - files
  - images

---

## 3. UI Components

- Profile header (avatar + name + email)
- Stats section (counts + breakdown)
- Account actions section:
  - Change Password (ONLY for email/password users)
  - Delete Account (with confirmation dialog)

---

## 4. Backend Requirements

- Fetch user profile data
- Fetch aggregated stats
- Ensure queries are optimized (single query if possible)

---

## 5. Constraints

- DO NOT modify unrelated modules
- DO NOT introduce new global state
- Follow existing component and API patterns
- Keep logic modular (service layer)

---

## 6. Edge Cases

- User without name → fallback to email
- No avatar → generate initials
- Empty stats → show 0 values
- Prevent delete without confirmation

---

## 7. Output Expectation

Implement ONLY:
- required API endpoints
- required UI components
- minimal necessary logic

DO NOT:
- add extra features
- redesign existing UI
- add unnecessary abstractions