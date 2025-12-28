# Slash Commands untuk Design Workflow

## /design-review
**Purpose**: Melakukan comprehensive design review dengan Playwright
**Usage**: `/design-review [url/port] [optional: comparison-image]`

**Process**:
1. Start browser dengan Playwright
2. Navigate ke URL yang diberikan
3. Ambil screenshots (desktop, tablet, mobile)
4. Analisa berdasarkan design-review-agent.md criteria
5. Generate detailed report dengan grading
6. Suggest improvements dengan priority levels

**Example**:
```
/design-review http://localhost:3000
/design-review http://localhost:3000/dashboard
```

---

## /screenshot-compare
**Purpose**: Ambil screenshot dan compare dengan mockup
**Usage**: `/screenshot-compare [url] [mockup-path]`

**Process**:
1. Navigate to URL
2. Take screenshot
3. Load mockup image
4. Visual comparison
5. List differences
6. Suggest code changes

---

## /responsive-test
**Purpose**: Test responsive design across breakpoints
**Usage**: `/responsive-test [url]`

**Viewports**:
- Mobile: 375x667 (iPhone SE)
- Tablet: 768x1024 (iPad)
- Desktop: 1920x1080 (Full HD)
- Wide: 2560x1440 (2K)

**Checks**:
- Layout integrity
- Text readability
- Touch target sizes
- Image scaling
- Navigation usability

---

## /accessibility-audit
**Purpose**: Audit accessibility dengan Playwright
**Usage**: `/accessibility-audit [url]`

**Checks**:
- Color contrast ratios
- Semantic HTML
- ARIA labels
- Keyboard navigation
- Screen reader compatibility
- Form labels

---

## /performance-check
**Purpose**: Check frontend performance
**Usage**: `/performance-check [url]`

**Metrics**:
- Page load time
- First Contentful Paint
- Largest Contentful Paint
- Layout shifts (CLS)
- Bundle size
- Image optimization

---

## /design-iterate
**Purpose**: Automated iterative design improvement
**Usage**: `/design-iterate [component] [target-look]`

**Process**:
1. Implement initial design
2. Take screenshot
3. Compare to target description/image
4. Identify gaps
5. Make improvements
6. Repeat 2-5 until target achieved (max 5 iterations)

**Example**:
```
/design-iterate "hero section" "modern, minimalist with bold typography"
```

---

## Implementation Notes