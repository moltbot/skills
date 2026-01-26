# Resume Templates

This document contains structured templates for three resume formats. Use the format selection guide in SKILL.md to choose the appropriate template.

## Table of Contents
1. [Chronological Template](#chronological-template)
2. [Functional Template](#functional-template)
3. [Combination Template](#combination-template)
4. [JSON Structure for PDF Generation](#json-structure-for-pdf-generation)

---

## Chronological Template

**Best for:** Most professionals, especially those staying in same field with consistent work history.

### Structure

```
[FULL NAME]
[City, State] | [Phone] | [Email] | [LinkedIn URL] | [Portfolio/Website]

---

PROFESSIONAL SUMMARY
[2-4 sentences: experience level, key skills, value proposition, relevant keywords]

---

PROFESSIONAL EXPERIENCE

[Job Title] | [Company Name], [City, State]
[Month Year] – [Month Year or "Present"]
• [Achievement bullet with action verb and quantifiable result]
• [Achievement bullet with action verb and quantifiable result]
• [Achievement bullet with action verb and quantifiable result]
• [Achievement bullet with action verb and quantifiable result]

[Job Title] | [Company Name], [City, State]
[Month Year] – [Month Year]
• [Achievement bullet]
• [Achievement bullet]
• [Achievement bullet]

---

EDUCATION

[Degree], [Major] | [University Name], [City, State]
[Month Year] | [GPA if 3.5+ and recent graduate]
• [Relevant honors, awards, or distinctions if applicable]

---

SKILLS

[Category]: [Skill 1], [Skill 2], [Skill 3], [Skill 4], [Skill 5]
[Category]: [Skill 1], [Skill 2], [Skill 3], [Skill 4], [Skill 5]

---

CERTIFICATIONS (if applicable)

[Certification Name] | [Issuing Organization] | [Month Year]
```

### Usage Notes
- Length: 1 page for 0-10 years, 2 pages for 10+ years
- Bullets: 4-6 per recent position, 2-3 for older positions
- Tense: Past for previous roles, present for current role
- Each bullet starts with action verb and includes metrics where possible

---

## Functional Template

**Best for:** Career changers, employment gaps, emphasizing transferable skills over work history.

### Structure

```
[FULL NAME]
[City, State] | [Phone] | [Email] | [LinkedIn URL] | [Portfolio/Website]

---

PROFESSIONAL SUMMARY
[3-4 sentences: career transition explanation, transferable skills, value proposition, target role keywords]

---

CORE COMPETENCIES

[Skill Category 1]
• [Specific skill or competency relevant to target role]
• [Specific skill or competency relevant to target role]
• [Specific skill or competency relevant to target role]

[Skill Category 2]
• [Specific skill or competency relevant to target role]
• [Specific skill or competency relevant to target role]
• [Specific skill or competency relevant to target role]

[Skill Category 3]
• [Specific skill or competency relevant to target role]
• [Specific skill or competency relevant to target role]

---

RELEVANT EXPERIENCE

[Functional Skill Area 1 - e.g., "Project Management"]

[Achievement demonstrating this skill]
[Context] | [Timeframe if relevant]
• [Detailed accomplishment with metrics showing impact]
• [Detailed accomplishment with metrics showing impact]

[Functional Skill Area 2 - e.g., "Data Analysis"]

[Achievement demonstrating this skill]
[Context] | [Timeframe if relevant]
• [Detailed accomplishment with metrics showing impact]

---

EMPLOYMENT HISTORY

[Job Title] | [Company Name], [City, State] | [Month Year] – [Month Year]
[Job Title] | [Company Name], [City, State] | [Month Year] – [Month Year]
[Job Title] | [Company Name], [City, State] | [Month Year] – [Month Year]

---

TECHNICAL SKILLS

[Category]: [Skill 1], [Skill 2], [Skill 3], [Skill 4], [Skill 5]

---

EDUCATION & TRAINING

[Degree], [Major] | [University Name], [City, State]
[Month Year]

[Recent Certification or Bootcamp] | [Institution]
[Month Year]

---

PROJECTS (Recommended for career changers)

[Project Name]
[Technologies/skills used] | [Link if available]
• [Description of project and its impact or learning outcomes]
• [Quantifiable results if applicable]
```

### Usage Notes
- Professional Summary is CRITICAL - must clearly explain career transition
- Employment History is intentionally brief (just titles, companies, dates)
- Draw examples from any context: work, volunteer, projects, education
- Projects section highly recommended to demonstrate current skills

---

## Combination Template

**Best for:** Mid-career professionals who want to emphasize both skills and career progression.

### Structure

```
[FULL NAME]
[City, State] | [Phone] | [Email] | [LinkedIn URL] | [Portfolio/Website]

---

PROFESSIONAL SUMMARY
[3-4 sentences: unique value proposition, key skill areas, relevant achievements, bridge between experience and target role]

---

CORE COMPETENCIES & SKILLS

[Skill Category 1]: [Skill], [Skill], [Skill], [Skill], [Skill]
[Skill Category 2]: [Skill], [Skill], [Skill], [Skill], [Skill]
[Skill Category 3]: [Skill], [Skill], [Skill], [Skill], [Skill]
[Skill Category 4]: [Skill], [Skill], [Skill], [Skill], [Skill]

---

KEY ACHIEVEMENTS

• [Achievement Title]: [Detailed accomplishment with context and quantifiable impact]
• [Achievement Title]: [Detailed accomplishment with context and quantifiable impact]
• [Achievement Title]: [Detailed accomplishment with context and quantifiable impact]

---

PROFESSIONAL EXPERIENCE

[Job Title] | [Company Name], [City, State]
[Month Year] – [Month Year or "Present"]
[Optional: 1-sentence company description if not well-known]
• [Achievement-focused bullet with quantifiable result]
• [Achievement-focused bullet with quantifiable result]
• [Achievement-focused bullet with quantifiable result]
• [Achievement-focused bullet with quantifiable result]
Key Skills: [Skill 1], [Skill 2], [Skill 3], [Skill 4]

[Job Title] | [Company Name], [City, State]
[Month Year] – [Month Year]
• [Achievement-focused bullet with quantifiable result]
• [Achievement-focused bullet with quantifiable result]
• [Achievement-focused bullet with quantifiable result]
Key Skills: [Skill 1], [Skill 2], [Skill 3], [Skill 4]

---

EDUCATION

[Degree], [Major] | [University Name], [City, State]
[Month Year] | [Honors if applicable]

---

CERTIFICATIONS & PROFESSIONAL DEVELOPMENT

[Certification Name] | [Issuing Organization]
[Credential ID if applicable] | [Month Year]

---

TECHNICAL PROFICIENCIES

[Category]: [Tool/Technology], [Tool/Technology], [Tool/Technology]
[Category]: [Tool/Technology], [Tool/Technology], [Tool/Technology]
```

### Usage Notes
- Usually 2 pages for mid-career professionals
- "Key Skills" lines connect experience to competencies for ATS
- Key Achievements section is optional but powerful for career-defining moments
- Balance: don't let skills section overshadow concrete work experience

---

## JSON Structure for PDF Generation

When using `scripts/generate_resume_pdf.py`, structure content as JSON:

```json
{
  "format": "chronological|functional|combination",
  "contact": {
    "name": "Full Name",
    "location": "City, State",
    "phone": "555-555-5555",
    "email": "email@example.com",
    "linkedin": "linkedin.com/in/profile",
    "website": "portfolio.com"
  },
  "summary": "Professional summary text...",
  "skills": [
    {
      "category": "Technical Skills",
      "items": ["Skill 1", "Skill 2", "Skill 3"]
    }
  ],
  "experience": [
    {
      "title": "Job Title",
      "company": "Company Name",
      "location": "City, State",
      "dates": "Month Year – Present",
      "bullets": [
        "Achievement with metrics",
        "Another achievement"
      ]
    }
  ],
  "education": [
    {
      "degree": "Bachelor of Science",
      "major": "Computer Science",
      "school": "University Name",
      "location": "City, State",
      "date": "May 2020",
      "details": ["GPA: 3.8", "Dean's List"]
    }
  ],
  "certifications": [
    {
      "name": "Certification Name",
      "issuer": "Issuing Organization",
      "date": "Month Year"
    }
  ],
  "projects": [
    {
      "name": "Project Name",
      "technologies": "Python, React, AWS",
      "link": "github.com/project",
      "description": "Brief description with impact"
    }
  ],
  "key_achievements": [
    {
      "title": "Achievement Category",
      "description": "Detailed accomplishment with metrics"
    }
  ],
  "core_competencies": [
    {
      "category": "Skill Category",
      "items": ["Competency 1", "Competency 2"]
    }
  ],
  "relevant_experience": [
    {
      "skill_area": "Project Management",
      "achievements": [
        {
          "title": "Led cross-functional initiative",
          "context": "Previous Company",
          "bullets": ["Achievement 1", "Achievement 2"]
        }
      ]
    }
  ],
  "employment_history": [
    {
      "title": "Job Title",
      "company": "Company",
      "location": "City, State",
      "dates": "2018 – 2021"
    }
  ]
}
```

### Field Requirements by Format

**Chronological:**
- Required: contact, summary, experience, education, skills
- Optional: certifications, projects

**Functional:**
- Required: contact, summary, core_competencies, relevant_experience, employment_history, education
- Optional: technical_skills, projects, certifications

**Combination:**
- Required: contact, summary, skills, experience, education
- Optional: key_achievements, certifications, technical_proficiencies, projects
