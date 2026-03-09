# Lumina OH Admin Language Policy

Project language system uses dual-language rules.

Frontend language: Japanese (ja-JP)  
Admin dashboard language: Chinese (zh-TW)

These rules must always be respected.

---

# 1. Frontend Language Rule

All user-facing interfaces must be written in Japanese.

This includes:

- website navigation
- card draw interface
- pairing interface
- association questions
- AI analysis reports
- membership pages
- notifications

The tone should match Japanese female wellness products.

Style:

calm  
gentle  
minimal  
reflective  

Examples:

開始する  
カードを選ぶ  
今日のテーマ  
心の洞察  
エネルギー分析  

Chinese must NOT appear in the frontend UI.

---

# 2. Admin Dashboard Language Rule

All admin system interfaces must use Traditional Chinese.

Locale:

zh-TW

Admin interface includes:

- dashboard
- analytics
- card management
- AI prompt management
- user management
- session monitoring
- subscription management
- notification management
- journal management
- manifestation board management

Examples:

儀表板  
會員管理  
卡片管理  
AI Prompt 管理  
抽卡 Session 數據  
訂閱管理  
營運分析  

Do NOT generate Japanese text in the admin panel.

---

# 3. Language Separation Rule

Frontend and Admin must use different languages.

Frontend → Japanese  
Admin → Traditional Chinese

Never mix languages.

Incorrect examples:

Admin page using Japanese  
Frontend page using Chinese

These are not allowed.

---

# 4. Developer Prompt Exception

Developers may write prompts in:

Chinese  
English  

But UI output must follow the language rules defined here.

The language of developer prompts must NOT change UI language.

---

# 5. Enforcement Rule

If generated UI text violates the language rule:

Replace it automatically.

Frontend must always remain Japanese.

Admin dashboard must always remain Traditional Chinese.

---

# 6. Locale Settings

Frontend locale

ja-JP

Admin locale

zh-TW