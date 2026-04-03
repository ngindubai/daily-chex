# Logo

Generate logos with AI image tools using effective prompt structures, validation loops, and export workflows for brand marks.

Source: https://clawhub.ai/ivangdavila/logo (MIT-0, benign scan)

## Quick Start: AI Logo Generation

Best model for most logos: Nano Banana Pro (Gemini 3 Pro Image)

### Basic Prompt Formula

```
Create a [STYLE] logo featuring [ELEMENT] on [BACKGROUND].
[DESCRIPTION]. The logo should look good at 32px with recognizable shapes.
```

### Example

```
Create a minimalist logo featuring a geometric mountain peak on white background.
Clean lines, navy blue (#1E3A5A), modern and professional style.
The logo should look good at 32px with recognizable shapes.
```

## Decision Tree

| Need | File |
|------|------|
| AI generation (prompts, iOS icons) | ai-generation.md |
| Logo types (wordmark, symbol, combo, emblem) | types.md |
| Design process with a human designer | process.md |
| File formats and export requirements | formats.md |
| DIY without AI (templates, Canva) | diy.md |
| Hiring designers or agencies | hiring.md |

## Model Quick Reference

| Model | Best For |
|-------|----------|
| Nano Banana Pro | Overall best, text + icons, App Store icons |
| GPT Image 1.5 | Conversational iteration, natural language |
| Ideogram | Perfect text rendering |
| Midjourney v7 | Artistic icons only (no text) |

## Critical AI Limitation

AI image generators cannot reliably render text. Letters will be distorted, misspelled, or garbled.

Strategy:
1. Generate the icon/symbol only with AI
2. Add text/wordmark in a design tool (Figma, Canva, Illustrator)
3. Or use a combination approach: AI icon + manually set typography

## Prompting for Logos

### Keywords That Work

```
flat vector logo, simple minimal icon, single color silhouette,
geometric logo mark, clean lines, negative space design,
line art logo, flat design icon, minimalist symbol
```

### Keywords That Fail

```
photorealistic logo (contradiction — logos aren't photos)
3D rendered logo (too complex, won't scale down)
gradient logo (inconsistent results, hard to reproduce)
logo with text "Company Name" (text rendering fails)
```

### Prompt Structure

```
flat vector logo of [subject], [style], [color constraint], [background], [additional detail]
```

## Scalability Rules

A logo must work at every size:

| Context | Size | Test |
|---------|------|------|
| Favicon | 16x16 px | Silhouette recognizable |
| App icon | 1024x1024 px | Full detail visible |
| Social avatar | 400x400 px | Clear at a glance |
| Business card | ~1 inch | Clean print reproduction |
| Billboard | 10+ feet | No pixelation, simple enough |

### Scalability Checklist

- Recognizable as a 16px favicon (squint test)
- Works in single color (black on white)
- Works inverted (white on black)
- No tiny details that disappear at small sizes
- No thin lines that vanish when shrunk
- Clear silhouette without color

## Color Guidelines

- Maximum 2-3 colors for the primary logo
- Must work in single color (black, white, or brand primary)
- Consider color psychology:
  - Blue: trust, professional (finance, tech, healthcare)
  - Red: energy, urgency (food, entertainment, retail)
  - Green: growth, nature (health, sustainability, finance)
  - Orange: friendly, creative (startups, youth brands)
  - Purple: luxury, wisdom (beauty, education)
  - Black: premium, elegant (fashion, luxury, tech)
- Test on both light and dark backgrounds

## Validation Loop (MANDATORY)

NEVER deliver without visual review. Every AI output must be inspected before sharing.

1. Generate
2. Look at the actual image
3. Check for issues
4. Fix or regenerate
5. Repeat (max 5-7 attempts)

Common fixes:
- Unwanted padding → Crop
- Elements cut off → Regenerate with "centered composition"
- Text garbled → Use Nano Banana/Ideogram or add manually
- Too complex → Simplify prompt

If 5-7 attempts fail, change model or strategy entirely.

## Common Mistakes

| Mistake | Why It Fails | Fix |
|---------|-------------|-----|
| Too much detail | Loses clarity at small sizes | Simplify to essential shapes |
| Relies on color | Fails in B&W contexts | Design in black first |
| Text in AI generation | Garbled/misspelled letters | Generate icon only, add text manually |
| Trendy effects (glows, shadows) | Dates quickly, reproduction issues | Stick to flat, timeless design |
| Too many colors | Hard to reproduce, expensive printing | Max 2-3 colors |
| Asymmetric without purpose | Looks unfinished | Use intentional asymmetry or stay balanced |

## Universal Truths

- AI output is a starting point. Every AI logo needs vectorization, cleanup, and manual text refinement. Never use raw output as final.
- Test at small sizes early. If it doesn't work at 32px, simplify. Most real-world usage is small.
- Text handling varies. Only Nano Banana and Ideogram reliably render text. For Midjourney, generate icon-only.
- Simple logos last. Nike, Apple, McDonald's. Complexity dates quickly and fails at small sizes.

## Before Finalizing

- Works in black and white
- Readable at 32px (favicon test)
- Vectorized (SVG), not just PNG
- All variants created (horizontal, stacked, icon-only)
- Text manually refined, not AI-generated
- Tested on dark and light backgrounds

## File Format Delivery

| Format | Use |
|--------|-----|
| SVG | Scalable vector, web, editing |
| PNG (transparent) | Digital use, presentations |
| PNG (white bg) | Documents, email signatures |
| ICO / Favicon | Website favicon (16, 32, 48px) |
| High-res PNG (4096px+) | Print, billboards |

Note: AI generates raster images (PNG). For true vector SVG, use the AI output
as a reference and trace in a vector tool, or use AI-to-SVG conversion tools.
