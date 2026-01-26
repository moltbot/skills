---
name: resume-optimizer
description: Professional resume builder with PDF export, ATS optimization, and analysis capabilities. Use when users need to (1) Create new resumes from scratch, (2) Customize/tailor existing resumes for specific roles, (3) Analyze resumes and provide improvement recommendations, (4) Convert resumes to ATS-friendly PDF format. Supports chronological, functional, and combination resume formats.
---

# Resume Optimizer

Build professional, ATS-optimized resumes with PDF export capabilities.

## Capabilities

1. **Create Resumes** - Build new resumes from user information with professional formatting
2. **Customize Resumes** - Tailor existing resumes for specific roles or per user requests
3. **Analyze Resumes** - Review resumes and provide actionable improvement recommendations
4. **Export to PDF** - Generate downloadable, ATS-friendly PDF documents

## Workflow Decision Tree

### Creating a New Resume
1. Gather user information (experience, education, skills, target role)
2. Select appropriate format (see format selection guide below)
3. Read `references/templates.md` for the chosen template
4. Build resume content following `references/best-practices.md`
5. Generate PDF using `scripts/generate_resume_pdf.py`

### Customizing an Existing Resume
1. Review the provided resume content
2. Understand the target role/changes requested
3. Read `references/ats-optimization.md` for keyword integration
4. Apply modifications following best practices
5. Generate updated PDF

### Analyzing a Resume
1. Parse the resume content
2. Check against criteria in `references/analysis-checklist.md`
3. Identify strengths and improvement areas
4. Provide specific, actionable recommendations
5. Optionally offer to implement changes

## Format Selection Guide

**Chronological (Most Common)**
- Use for: Consistent work history in same field, clear career progression
- Best for: Most professionals staying in their field
- Read: `references/templates.md` → Chronological Template section

**Functional**
- Use for: Career changers, employment gaps, emphasizing transferable skills
- Best for: Returning to workforce, diverse experience across fields
- Read: `references/templates.md` → Functional Template section

**Combination**
- Use for: Mid-career professionals balancing skills and progression
- Best for: Diverse skill sets, career changers with relevant experience
- Read: `references/templates.md` → Combination Template section

## PDF Generation

Use the provided script to create professional PDFs:

```bash
python3 scripts/generate_resume_pdf.py \
  --input resume_content.json \
  --output resume.pdf \
  --format chronological
```

The script uses reportlab to create clean, ATS-compatible PDFs with:
- Professional typography (Helvetica)
- Proper margins and spacing (0.75" all sides)
- Clean section headers
- Bullet point formatting
- Consistent visual hierarchy

## Essential References

Before creating any resume, read:
1. `references/best-practices.md` - Core resume writing principles
2. `references/ats-optimization.md` - ATS compatibility requirements
3. `references/templates.md` - Format-specific templates

Before analyzing a resume, read:
1. `references/analysis-checklist.md` - Evaluation criteria and scoring

## Quick Start Examples

**Creating a resume:**
```
User: "Help me build a resume. I have 5 years in marketing."

Steps:
1. Gather: Current role, key achievements, education, certifications
2. Format: Chronological (clear progression in same field)
3. Build: Use template from references/templates.md
4. Keywords: Integrate from job description per ats-optimization.md
5. Export: Generate PDF to /mnt/user-data/outputs/
```

**Tailoring for a role:**
```
User: "Tailor my resume for this job [job description]"

Steps:
1. Parse job description for required skills/keywords
2. Identify gaps between resume and requirements
3. Reorder bullets to lead with relevant achievements
4. Integrate keywords naturally throughout
5. Update summary to mirror key requirements
6. Generate updated PDF
```

**Analyzing a resume:**
```
User: "Review my resume and tell me how to improve it"

Steps:
1. Read references/analysis-checklist.md
2. Evaluate each section against criteria
3. Score: Content, Format, ATS-compatibility
4. Identify top 3-5 priority improvements
5. Provide specific rewrite examples
6. Offer to implement changes
```

## Output Requirements

All generated resumes must:
- Be saved to `/mnt/user-data/outputs/` for user download
- Use descriptive filenames: `FirstName_LastName_Resume.pdf`
- Include a download link using `computer://` protocol
- Follow ATS-friendly formatting (no tables, text boxes, or graphics)

## Code Style

When generating Python scripts for PDF creation:
- Use reportlab for PDF generation
- Keep code concise and functional
- Handle errors gracefully
- Test output before delivering to user
