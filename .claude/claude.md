# Claude Code Design Workflow

## Design Philosophy
- Prioritaskan desain yang modern, clean, dan professional
- Hindari generic ShadCN purple UI patterns
- Selalu gunakan visual validation melalui screenshots
- Iterasi hingga hasil sesuai spesifikasi

## Workflow Rules

### 1. Visual Validation (PENTING!)
- **SELALU** ambil screenshot setelah membuat perubahan UI
- Gunakan Playwright MCP untuk mengontrol browser
- Bandingkan screenshot dengan spesifikasi/mockup yang diberikan
- Lakukan iterasi mandiri jika ada ketidaksesuaian

### 2. Development Server
- Pastikan dev server berjalan di port yang benar
- Default port: 3000 (Next.js), 5173 (Vite), 8080 (standard)
- Sebelum screenshot, konfirmasi server sudah running

### 3. Screenshot Guidelines
- Ambil screenshot di berbagai ukuran: desktop (1920x1080), tablet (768x1024), mobile (375x667)
- Capture full page untuk landing pages
- Focus pada component specific untuk component testing

### 4. Iterative Design Loop
STEP 1: Buat/modifikasi code
STEP 2: Refresh browser dan ambil screenshot
STEP 3: Analisa screenshot vs spesifikasi
STEP 4: Identifikasi gap/issues
STEP 5: Ulangi dari STEP 1 hingga sempurna

## Available Tools
- Playwright MCP: Browser automation, screenshots, navigation
- File system: Untuk baca/tulis code
- Bash: Untuk run commands (npm, git, dll)

## Design Checklist
Sebelum menyelesaikan task, pastikan:
- [ ] Layout responsive di semua screen sizes
- [ ] Colors sesuai brand/style guide
- [ ] Typography consistent dan readable
- [ ] Spacing/padding proporsional
- [ ] Interactive elements memiliki proper states (hover, active, disabled)
- [ ] No console errors
- [ ] Performance optimal (no layout shifts, fast load)

## Common Commands
- Start dev: `npm run dev` atau `npm start`
- Build: `npm run build`
- Test: `npm test`

## Sub-agents & Slash Commands
(Akan ditambahkan sesuai kebutuhan project)