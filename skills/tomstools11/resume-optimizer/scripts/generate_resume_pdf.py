#!/usr/bin/env python3
"""
Resume PDF Generator
Generates professional, ATS-friendly PDF resumes from JSON input.
"""

import json
import argparse
from pathlib import Path

try:
    from reportlab.lib.pagesizes import letter
    from reportlab.lib.units import inch
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.enums import TA_LEFT, TA_CENTER
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable
    from reportlab.lib.colors import HexColor
except ImportError:
    print("Installing reportlab...")
    import subprocess
    subprocess.check_call(['pip', 'install', 'reportlab', '--break-system-packages', '-q'])
    from reportlab.lib.pagesizes import letter
    from reportlab.lib.units import inch
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.enums import TA_LEFT, TA_CENTER
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable
    from reportlab.lib.colors import HexColor


class ResumeGenerator:
    """Generate professional PDF resumes from structured data."""
    
    # Colors
    DARK_GRAY = HexColor('#333333')
    MEDIUM_GRAY = HexColor('#666666')
    LIGHT_GRAY = HexColor('#999999')
    DIVIDER_COLOR = HexColor('#CCCCCC')
    
    def __init__(self, output_path: str, margin: float = 0.75):
        self.output_path = output_path
        self.margin = margin * inch
        self.styles = self._create_styles()
        self.story = []
        
    def _create_styles(self):
        """Create custom paragraph styles for resume sections."""
        styles = getSampleStyleSheet()
        
        # Name style (large, bold, centered)
        styles.add(ParagraphStyle(
            'Name',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=18,
            leading=22,
            alignment=TA_CENTER,
            textColor=self.DARK_GRAY,
            spaceAfter=4
        ))
        
        # Contact info style (centered, smaller)
        styles.add(ParagraphStyle(
            'Contact',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=10,
            leading=12,
            alignment=TA_CENTER,
            textColor=self.MEDIUM_GRAY,
            spaceAfter=12
        ))
        
        # Section header style
        styles.add(ParagraphStyle(
            'SectionHeader',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=11,
            leading=14,
            textColor=self.DARK_GRAY,
            spaceBefore=12,
            spaceAfter=6
        ))
        
        # Subsection header (job title, company)
        styles.add(ParagraphStyle(
            'SubsectionHeader',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=10,
            leading=13,
            textColor=self.DARK_GRAY,
            spaceBefore=8,
            spaceAfter=2
        ))
        
        # Job details (company, location, dates)
        styles.add(ParagraphStyle(
            'JobDetails',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=10,
            leading=12,
            textColor=self.MEDIUM_GRAY,
            spaceAfter=4
        ))
        
        # Body text style (custom)
        styles.add(ParagraphStyle(
            'ResumeBody',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=10,
            leading=13,
            textColor=self.DARK_GRAY,
            spaceAfter=6
        ))
        
        # Bullet point style
        styles.add(ParagraphStyle(
            'ResumeBullet',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=10,
            leading=13,
            textColor=self.DARK_GRAY,
            leftIndent=12,
            spaceAfter=3,
            bulletIndent=0
        ))
        
        # Skills category style
        styles.add(ParagraphStyle(
            'SkillCategory',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=10,
            leading=13,
            textColor=self.DARK_GRAY,
            spaceAfter=2
        ))
        
        # Skills list style
        styles.add(ParagraphStyle(
            'SkillsList',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=10,
            leading=13,
            textColor=self.DARK_GRAY,
            spaceAfter=4
        ))
        
        return styles
    
    def add_divider(self):
        """Add a horizontal divider line."""
        self.story.append(Spacer(1, 4))
        self.story.append(HRFlowable(
            width="100%",
            thickness=0.5,
            color=self.DIVIDER_COLOR,
            spaceBefore=2,
            spaceAfter=6
        ))
    
    def add_contact(self, contact: dict):
        """Add contact information section."""
        name = contact.get('name', '')
        self.story.append(Paragraph(name, self.styles['Name']))
        
        # Build contact line
        contact_parts = []
        if contact.get('location'):
            contact_parts.append(contact['location'])
        if contact.get('phone'):
            contact_parts.append(contact['phone'])
        if contact.get('email'):
            contact_parts.append(contact['email'])
        if contact.get('linkedin'):
            contact_parts.append(contact['linkedin'])
        if contact.get('website'):
            contact_parts.append(contact['website'])
        
        contact_line = ' | '.join(contact_parts)
        self.story.append(Paragraph(contact_line, self.styles['Contact']))
    
    def add_summary(self, summary: str):
        """Add professional summary section."""
        self.story.append(Paragraph('PROFESSIONAL SUMMARY', self.styles['SectionHeader']))
        self.add_divider()
        self.story.append(Paragraph(summary, self.styles['ResumeBody']))
    
    def add_skills(self, skills: list, header: str = 'SKILLS'):
        """Add skills section with categories."""
        self.story.append(Paragraph(header, self.styles['SectionHeader']))
        self.add_divider()
        
        for skill_group in skills:
            category = skill_group.get('category', '')
            items = skill_group.get('items', [])
            skills_text = f"<b>{category}:</b> {', '.join(items)}"
            self.story.append(Paragraph(skills_text, self.styles['SkillsList']))
    
    def add_experience(self, experience: list):
        """Add work experience section."""
        self.story.append(Paragraph('PROFESSIONAL EXPERIENCE', self.styles['SectionHeader']))
        self.add_divider()
        
        for job in experience:
            # Job title
            title = job.get('title', '')
            self.story.append(Paragraph(f"<b>{title}</b>", self.styles['SubsectionHeader']))
            
            # Company, location, dates
            company = job.get('company', '')
            location = job.get('location', '')
            dates = job.get('dates', '')
            details_line = f"{company}, {location} | {dates}"
            self.story.append(Paragraph(details_line, self.styles['JobDetails']))
            
            # Bullets
            for bullet in job.get('bullets', []):
                bullet_text = f"• {bullet}"
                self.story.append(Paragraph(bullet_text, self.styles['ResumeBullet']))
            
            # Key skills if present (for combination format)
            if job.get('key_skills'):
                skills_text = f"<i>Key Skills: {', '.join(job['key_skills'])}</i>"
                self.story.append(Paragraph(skills_text, self.styles['JobDetails']))
    
    def add_education(self, education: list):
        """Add education section."""
        self.story.append(Paragraph('EDUCATION', self.styles['SectionHeader']))
        self.add_divider()
        
        for edu in education:
            degree = edu.get('degree', '')
            major = edu.get('major', '')
            title = f"{degree}, {major}" if major else degree
            self.story.append(Paragraph(f"<b>{title}</b>", self.styles['SubsectionHeader']))
            
            school = edu.get('school', '')
            location = edu.get('location', '')
            date = edu.get('date', '')
            details = f"{school}, {location} | {date}"
            self.story.append(Paragraph(details, self.styles['JobDetails']))
            
            # Additional details (GPA, honors, etc.)
            for detail in edu.get('details', []):
                self.story.append(Paragraph(f"• {detail}", self.styles['ResumeBullet']))
    
    def add_certifications(self, certifications: list):
        """Add certifications section."""
        if not certifications:
            return
            
        self.story.append(Paragraph('CERTIFICATIONS', self.styles['SectionHeader']))
        self.add_divider()
        
        for cert in certifications:
            name = cert.get('name', '')
            issuer = cert.get('issuer', '')
            date = cert.get('date', '')
            cert_line = f"<b>{name}</b> | {issuer} | {date}"
            self.story.append(Paragraph(cert_line, self.styles['ResumeBody']))
    
    def add_projects(self, projects: list):
        """Add projects section."""
        if not projects:
            return
            
        self.story.append(Paragraph('PROJECTS', self.styles['SectionHeader']))
        self.add_divider()
        
        for project in projects:
            name = project.get('name', '')
            tech = project.get('technologies', '')
            self.story.append(Paragraph(f"<b>{name}</b>", self.styles['SubsectionHeader']))
            
            if tech:
                self.story.append(Paragraph(f"<i>{tech}</i>", self.styles['JobDetails']))
            
            desc = project.get('description', '')
            if desc:
                self.story.append(Paragraph(f"• {desc}", self.styles['ResumeBullet']))
            
            link = project.get('link', '')
            if link:
                self.story.append(Paragraph(f"Link: {link}", self.styles['JobDetails']))
    
    def add_key_achievements(self, achievements: list):
        """Add key achievements section (for combination format)."""
        if not achievements:
            return
            
        self.story.append(Paragraph('KEY ACHIEVEMENTS', self.styles['SectionHeader']))
        self.add_divider()
        
        for achievement in achievements:
            title = achievement.get('title', '')
            desc = achievement.get('description', '')
            text = f"<b>{title}:</b> {desc}"
            self.story.append(Paragraph(f"• {text}", self.styles['ResumeBullet']))
    
    def add_core_competencies(self, competencies: list):
        """Add core competencies section (for functional format)."""
        if not competencies:
            return
            
        self.story.append(Paragraph('CORE COMPETENCIES', self.styles['SectionHeader']))
        self.add_divider()
        
        for comp in competencies:
            category = comp.get('category', '')
            items = comp.get('items', [])
            
            self.story.append(Paragraph(f"<b>{category}</b>", self.styles['SkillCategory']))
            for item in items:
                self.story.append(Paragraph(f"• {item}", self.styles['ResumeBullet']))
    
    def add_relevant_experience(self, relevant_exp: list):
        """Add relevant experience section (for functional format)."""
        if not relevant_exp:
            return
            
        self.story.append(Paragraph('RELEVANT EXPERIENCE', self.styles['SectionHeader']))
        self.add_divider()
        
        for exp in relevant_exp:
            skill_area = exp.get('skill_area', '')
            self.story.append(Paragraph(f"<b>{skill_area}</b>", self.styles['SubsectionHeader']))
            
            for achievement in exp.get('achievements', []):
                title = achievement.get('title', '')
                context = achievement.get('context', '')
                
                self.story.append(Paragraph(f"<b>{title}</b>", self.styles['ResumeBody']))
                if context:
                    self.story.append(Paragraph(f"<i>{context}</i>", self.styles['JobDetails']))
                
                for bullet in achievement.get('bullets', []):
                    self.story.append(Paragraph(f"• {bullet}", self.styles['ResumeBullet']))
    
    def add_employment_history(self, history: list):
        """Add brief employment history (for functional format)."""
        if not history:
            return
            
        self.story.append(Paragraph('EMPLOYMENT HISTORY', self.styles['SectionHeader']))
        self.add_divider()
        
        for job in history:
            title = job.get('title', '')
            company = job.get('company', '')
            location = job.get('location', '')
            dates = job.get('dates', '')
            line = f"<b>{title}</b> | {company}, {location} | {dates}"
            self.story.append(Paragraph(line, self.styles['ResumeBody']))
    
    def generate_chronological(self, data: dict):
        """Generate chronological format resume."""
        self.add_contact(data.get('contact', {}))
        
        if data.get('summary'):
            self.add_summary(data['summary'])
        
        if data.get('experience'):
            self.add_experience(data['experience'])
        
        if data.get('education'):
            self.add_education(data['education'])
        
        if data.get('skills'):
            self.add_skills(data['skills'])
        
        if data.get('certifications'):
            self.add_certifications(data['certifications'])
        
        if data.get('projects'):
            self.add_projects(data['projects'])
    
    def generate_functional(self, data: dict):
        """Generate functional format resume."""
        self.add_contact(data.get('contact', {}))
        
        if data.get('summary'):
            self.add_summary(data['summary'])
        
        if data.get('core_competencies'):
            self.add_core_competencies(data['core_competencies'])
        
        if data.get('relevant_experience'):
            self.add_relevant_experience(data['relevant_experience'])
        
        if data.get('employment_history'):
            self.add_employment_history(data['employment_history'])
        
        if data.get('skills'):
            self.add_skills(data['skills'], 'TECHNICAL SKILLS')
        
        if data.get('education'):
            self.add_education(data['education'])
        
        if data.get('certifications'):
            self.add_certifications(data['certifications'])
        
        if data.get('projects'):
            self.add_projects(data['projects'])
    
    def generate_combination(self, data: dict):
        """Generate combination format resume."""
        self.add_contact(data.get('contact', {}))
        
        if data.get('summary'):
            self.add_summary(data['summary'])
        
        if data.get('skills'):
            self.add_skills(data['skills'], 'CORE COMPETENCIES & SKILLS')
        
        if data.get('key_achievements'):
            self.add_key_achievements(data['key_achievements'])
        
        if data.get('experience'):
            self.add_experience(data['experience'])
        
        if data.get('education'):
            self.add_education(data['education'])
        
        if data.get('certifications'):
            self.add_certifications(data['certifications'])
        
        if data.get('projects'):
            self.add_projects(data['projects'])
    
    def generate(self, data: dict):
        """Generate resume PDF based on format specified in data."""
        format_type = data.get('format', 'chronological').lower()
        
        # Create document
        doc = SimpleDocTemplate(
            self.output_path,
            pagesize=letter,
            leftMargin=self.margin,
            rightMargin=self.margin,
            topMargin=self.margin,
            bottomMargin=self.margin
        )
        
        # Generate based on format
        if format_type == 'functional':
            self.generate_functional(data)
        elif format_type == 'combination':
            self.generate_combination(data)
        else:  # default to chronological
            self.generate_chronological(data)
        
        # Build PDF
        doc.build(self.story)
        print(f"✅ Resume generated: {self.output_path}")
        return self.output_path


def main():
    parser = argparse.ArgumentParser(description='Generate professional PDF resumes')
    parser.add_argument('--input', '-i', required=True, help='Input JSON file with resume data')
    parser.add_argument('--output', '-o', required=True, help='Output PDF file path')
    parser.add_argument('--format', '-f', choices=['chronological', 'functional', 'combination'],
                       default='chronological', help='Resume format (can also be specified in JSON)')
    
    args = parser.parse_args()
    
    # Load resume data
    with open(args.input, 'r') as f:
        data = json.load(f)
    
    # Override format if specified in args
    if args.format:
        data['format'] = args.format
    
    # Generate resume
    generator = ResumeGenerator(args.output)
    generator.generate(data)


if __name__ == '__main__':
    main()
