# CLAUDE.md - Servex Project Coding Standards

## Overview
These rules are **mandatory** for all development in this project. Follow them automatically without asking or negotiating.

---

## 1. Architecture & Module Structure
- **Every new feature or entity MUST get its own folder under `modules/`**
- Never put code from different domains in the same file
- Every function = its own module/file (except tiny private helpers inside the same file)
- One public export per file (class or function)

## 2. Dependency Management
- If a function in Module X needs something from Module Y:
  - Create a **separate dedicated function** in Module Y
  - Export it from Module Y's `index.ts`
  - Import **only that function** in Module X
- Never copy-paste logic between modules

## 3. SOLID OOP in TypeScript (Mandatory)
- Use **classes + interfaces** for all services, repositories, controllers
- Follow SOLID strictly:
  - **S**ingle Responsibility → one class does ONE thing
  - **O**pen/Closed → extend via interfaces, never modify existing code
  - **L**iskov Substitution → subclasses must be fully replaceable
  - **I**nterface Segregation → many small interfaces, not fat ones
  - **D**ependency Inversion → depend on interfaces (use constructor injection)
- Prefer composition over inheritance
- All public methods must be typed with interfaces

## 4. NO COMMENTS AT ALL
- Zero comments allowed: `//`, `/* */`, JSDoc — **none**
- Code must be 100% self-documenting through:
  - Clear class/function names
  - Proper folder structure
  - Type names

## 5. Security (Never Forget)
- Validate & sanitize **every** input (use Zod or manual strict checks)
- Never trust user input
- All secrets → environment variables only (`process.env`)
- Use parameterized queries / ORM (never raw SQL with string concat)
- Hash passwords, use secure tokens
- Implement rate limiting, auth guards, role checks in every protected route
- Escape outputs, prevent XSS
- Never log sensitive data
- Use HTTPS, secure cookies, CSP headers where applicable

## 6. TypeScript Rules
- No `any` type ever
- Explicit return types on every function
- Use interfaces for all data shapes
- Enable strict mode (noImplicitAny, strictNullChecks, etc.)
- Use generics where it improves reusability
- All variables `const` unless you must reassign

## 7. Naming & Code Style
- Classes & Interfaces → `PascalCase`
- Functions, variables, methods → `camelCase`
- File names → `kebab-case` (e.g. `user-auth.service.ts`)
- Constants → `UPPER_SNAKE_CASE`
- Barrel files (`index.ts`) only export public API

## 8. Code Quality Standards
- Use `async/await` (never `.then` chains)
- Prefer immutable code (no direct mutation of arrays/objects)
- Use dependency injection everywhere
- Keep files small (< 200 lines when possible)
- Every module must export from `index.ts`
- Avoid over-engineering - implement only what's asked

---

## How I Will Work
1. I will **automatically follow all these rules** without asking or mentioning them
2. I will **never repeat these rules** to you in responses
3. I will **enforce these standards** in every file I create or modify
4. If you ask for something that violates these rules, I will **do it the right way** instead
5. These rules are **non-negotiable** for this project
