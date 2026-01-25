#!/usr/bin/env python3
"""
Company Research Report PDF Generator

Generates professionally styled PDF reports from research data.
Uses reportlab for high-quality PDF output with proper typography and layout.

Usage:
    python generate_report.py input.json output.pdf

Input JSON structure: See references/data-schema.md
"""

import json
import sys
from datetime import datetime
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    KeepTogether, HRFlowable, CondPageBreak
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# Color palette (professional slate-based)
COLORS = {
    'primary': colors.HexColor('#1e293b'),      # Dark slate
    'secondary': colors.HexColor('#334155'),    # Medium slate
    'muted': colors.HexColor('#64748b'),        # Light slate
    'accent_blue': colors.HexColor('#3b82f6'),
    'accent_emerald': colors.HexColor('#10b981'),
    'accent_violet': colors.HexColor('#8b5cf6'),
    'accent_amber': colors.HexColor('#f59e0b'),
    'accent_teal': colors.HexColor('#14b8a6'),
    'accent_indigo': colors.HexColor('#6366f1'),
    'accent_rose': colors.HexColor('#f43f5e'),
    'bg_light': colors.HexColor('#f8fafc'),
    'border': colors.HexColor('#e2e8f0'),
    'white': colors.white,
}


def create_styles():
    """Create custom paragraph styles for the report."""
    styles = getSampleStyleSheet()

    # Title style (for header)
    styles.add(ParagraphStyle(
        'ReportTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=COLORS['white'],
        spaceAfter=6,
        fontName='Helvetica-Bold'
    ))

    # Section heading
    styles.add(ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=COLORS['primary'],
        spaceBefore=16,
        spaceAfter=8,
        borderPadding=(0, 0, 4, 0),
        fontName='Helvetica-Bold'
    ))

    # Subsection heading
    styles.add(ParagraphStyle(
        'SubHeading',
        parent=styles['Heading3'],
        fontSize=11,
        textColor=COLORS['secondary'],
        spaceBefore=12,
        spaceAfter=6,
        fontName='Helvetica-Bold'
    ))

    # Body text (custom)
    styles.add(ParagraphStyle(
        'ReportBody',
        parent=styles['Normal'],
        fontSize=10,
        textColor=COLORS['secondary'],
        spaceAfter=8,
        leading=14,
        alignment=TA_JUSTIFY
    ))

    # Muted text (for metadata, footer)
    styles.add(ParagraphStyle(
        'MutedText',
        parent=styles['Normal'],
        fontSize=9,
        textColor=COLORS['muted'],
        spaceAfter=4
    ))

    # Tag/pill style text
    styles.add(ParagraphStyle(
        'TagText',
        parent=styles['Normal'],
        fontSize=9,
        textColor=COLORS['secondary'],
    ))

    # Item title (for bordered items)
    styles.add(ParagraphStyle(
        'ItemTitle',
        parent=styles['Normal'],
        fontSize=10,
        textColor=COLORS['primary'],
        fontName='Helvetica-Bold',
        spaceAfter=2
    ))

    # Item description
    styles.add(ParagraphStyle(
        'ItemDesc',
        parent=styles['Normal'],
        fontSize=9,
        textColor=COLORS['secondary'],
        leading=12
    ))

    return styles


def create_header_table(data, styles):
    """Create the dark header section."""
    company = data.get('company_name', 'Unknown Company')
    date = data.get('report_date', datetime.now().strftime('%B %d, %Y'))
    url = data.get('source_url', '')

    header_content = [
        [Paragraph('<font color="white" size="9">ACCOUNT RESEARCH REPORT</font>', styles['Normal'])],
        [Paragraph(f'<font color="white" size="20"><b>{company}</b></font>', styles['Normal'])],
        [Spacer(1, 8)],
        [Paragraph(f'<font color="#94a3b8" size="9"><b>Date:</b> {date}  |  <b>Source:</b> {url}  |  <b>Analyst:</b> Claude AI</font>', styles['Normal'])]
    ]

    header_table = Table(header_content, colWidths=[7*inch])
    header_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), COLORS['primary']),
        ('LEFTPADDING', (0, 0), (-1, -1), 24),
        ('RIGHTPADDING', (0, 0), (-1, -1), 24),
        ('TOPPADDING', (0, 0), (0, 0), 20),
        ('BOTTOMPADDING', (0, -1), (-1, -1), 20),
    ]))

    return header_table


def create_section_heading(title, styles):
    """Create a section heading with bottom border."""
    elements = []
    elements.append(Paragraph(title, styles['SectionHeading']))
    elements.append(HRFlowable(width="100%", thickness=2, color=COLORS['border'], spaceAfter=8))
    return elements


def create_profile_table(profile_data):
    """Create the company profile table."""
    rows = []
    fields = [
        ('Company Name', 'name'),
        ('Industry', 'industry'),
        ('Headquarters', 'headquarters'),
        ('Founded', 'founded'),
        ('CEO/Founder', 'ceo'),
        ('Company Size', 'size'),
        ('Website', 'website'),
        ('Recent Funding', 'funding'),
    ]

    for label, key in fields:
        value = profile_data.get(key, '')
        if value:
            rows.append([label, value])

    if not rows:
        return None

    table = Table(rows, colWidths=[1.8*inch, 5.2*inch])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), COLORS['bg_light']),
        ('TEXTCOLOR', (0, 0), (0, -1), COLORS['secondary']),
        ('TEXTCOLOR', (1, 0), (1, -1), COLORS['secondary']),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('PADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, COLORS['border']),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('ROWBACKGROUNDS', (0, 0), (-1, -1), [COLORS['bg_light'], COLORS['white']]),
    ]))

    return table


def create_bordered_item(title, description, accent_color, styles):
    """Create a left-bordered item block."""
    content = []
    if title:
        content.append([Paragraph(f'<b>{title}</b>', styles['ItemTitle'])])
    if description:
        content.append([Paragraph(description, styles['ItemDesc'])])

    if not content:
        return None

    inner_table = Table(content, colWidths=[6.6*inch])
    inner_table.setStyle(TableStyle([
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 4),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))

    outer_table = Table([[inner_table]], colWidths=[7*inch])
    outer_table.setStyle(TableStyle([
        ('LINEAFTER', (0, 0), (0, -1), 0, COLORS['white']),
        ('LINEBEFORE', (0, 0), (0, -1), 4, accent_color),
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#fafafa')),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
    ]))

    return outer_table


def create_competitor_table(competitors, styles):
    """Create the competitor comparison table with proper text wrapping."""
    if not competitors:
        return None

    # Create cell style for wrapping text
    cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontSize=9,
        textColor=COLORS['secondary'],
        leading=12
    )
    cell_style_bold = ParagraphStyle(
        'TableCellBold',
        parent=cell_style,
        fontName='Helvetica-Bold'
    )
    header_style = ParagraphStyle(
        'TableHeader',
        parent=cell_style,
        fontName='Helvetica-Bold',
        textColor=COLORS['secondary']
    )

    # Create header row with Paragraphs
    header = [
        Paragraph('Competitor', header_style),
        Paragraph('Key Strengths', header_style),
        Paragraph('Differentiation', header_style)
    ]
    rows = [header]

    # Create data rows with Paragraphs for text wrapping
    for comp in competitors:
        rows.append([
            Paragraph(comp.get('name', ''), cell_style_bold),
            Paragraph(comp.get('strengths', ''), cell_style),
            Paragraph(comp.get('differentiation', ''), cell_style)
        ])

    table = Table(rows, colWidths=[1.6*inch, 2.7*inch, 2.7*inch])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), COLORS['bg_light']),
        ('PADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, COLORS['border']),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))

    return table


def create_tags(keywords, color_map, styles):
    """Create keyword tags as a wrapped paragraph."""
    if not keywords:
        return None

    tags_text = '  '.join([f'<font color="{color_map.get(kw, "#334155")}" size="9">[{kw}]</font>' for kw in keywords])
    return Paragraph(tags_text, styles['TagText'])


def create_bullet_list(items, bullet_color, styles):
    """Create a simple bullet list."""
    if not items:
        return None

    elements = []
    for item in items:
        bullet_html = f'<font color="{bullet_color}">•</font>  {item}'
        elements.append(Paragraph(bullet_html, styles['ReportBody']))

    return elements


def generate_pdf(data, output_path):
    """Generate the complete PDF report."""
    styles = create_styles()

    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        rightMargin=0.5*inch,
        leftMargin=0.5*inch,
        topMargin=0.5*inch,
        bottomMargin=0.5*inch
    )

    story = []

    # Header
    story.append(create_header_table(data, styles))
    story.append(Spacer(1, 16))

    # Executive Summary
    if data.get('executive_summary'):
        story.extend(create_section_heading('Executive Summary', styles))
        story.append(Paragraph(data['executive_summary'], styles['ReportBody']))
        story.append(Spacer(1, 8))

    # Company Profile
    if data.get('profile'):
        story.extend(create_section_heading('Company Profile', styles))
        profile_table = create_profile_table(data['profile'])
        if profile_table:
            story.append(KeepTogether([profile_table]))
        story.append(Spacer(1, 8))

    # Products & Services
    if data.get('products'):
        story.extend(create_section_heading('Products & Services', styles))

        if data['products'].get('offerings'):
            story.append(Paragraph('<b>Core Offerings</b>', styles['SubHeading']))
            for item in data['products']['offerings']:
                block = create_bordered_item(item.get('name'), item.get('description'), COLORS['accent_blue'], styles)
                if block:
                    story.append(KeepTogether([block, Spacer(1, 6)]))

        if data['products'].get('differentiators'):
            story.append(Paragraph('<b>Key Differentiators</b>', styles['SubHeading']))
            for diff in data['products']['differentiators']:
                block = create_bordered_item(diff, None, COLORS['accent_emerald'], styles)
                if block:
                    story.append(block)
                    story.append(Spacer(1, 4))

        if data['products'].get('tech_stack'):
            story.append(Paragraph('<b>Technology Stack</b>', styles['SubHeading']))
            tech_text = '  |  '.join([f'<b>{k}:</b> {v}' for k, v in data['products']['tech_stack'].items()])
            story.append(Paragraph(tech_text, styles['MutedText']))

        story.append(Spacer(1, 8))

    # Target Market
    if data.get('target_market'):
        story.extend(create_section_heading('Target Market', styles))

        if data['target_market'].get('segments'):
            story.append(Paragraph(data['target_market']['segments'], styles['ReportBody']))

        if data['target_market'].get('verticals'):
            story.append(Paragraph('<b>Industry Verticals</b>', styles['SubHeading']))
            verticals_text = '  '.join([f'[{v}]' for v in data['target_market']['verticals']])
            story.append(Paragraph(verticals_text, styles['MutedText']))

        if data['target_market'].get('personas'):
            story.append(Paragraph('<b>Buyer Personas</b>', styles['SubHeading']))
            for persona in data['target_market']['personas']:
                block = create_bordered_item(persona.get('title'), persona.get('description'), COLORS['accent_violet'], styles)
                if block:
                    story.append(block)
                    story.append(Spacer(1, 4))

        if data['target_market'].get('business_model'):
            story.append(Paragraph('<b>Business Model</b>', styles['SubHeading']))
            story.append(Paragraph(data['target_market']['business_model'], styles['ReportBody']))

        story.append(Spacer(1, 8))

    # Use Cases & Pain Points (conditional page break only if needed)
    if data.get('use_cases'):
        # Use CondPageBreak to only break if less than 2 inches remain
        story.append(CondPageBreak(2*inch))
        story.extend(create_section_heading('Use Cases & Pain Points', styles))
        for uc in data['use_cases']:
            block = create_bordered_item(uc.get('title'), uc.get('description'), COLORS['accent_amber'], styles)
            if block:
                story.append(KeepTogether([block, Spacer(1, 6)]))
        story.append(Spacer(1, 8))

    # Competitive Landscape
    if data.get('competitors'):
        story.extend(create_section_heading('Competitive Landscape', styles))
        comp_table = create_competitor_table(data['competitors'], styles)
        if comp_table:
            story.append(KeepTogether([comp_table]))

        if data.get('competitive_positioning'):
            story.append(Spacer(1, 8))
            story.append(Paragraph('<b>Competitive Positioning</b>', styles['SubHeading']))
            story.append(Paragraph(data['competitive_positioning'], styles['ReportBody']))

        story.append(Spacer(1, 8))

    # Industry Dynamics
    if data.get('industry'):
        story.extend(create_section_heading('Industry Dynamics', styles))

        if data['industry'].get('trends'):
            story.append(Paragraph('<b>Market Trends</b>', styles['SubHeading']))
            for trend in data['industry']['trends']:
                story.append(Paragraph(f'<font color="#3b82f6">•</font>  {trend}', styles['ReportBody']))

        if data['industry'].get('opportunities'):
            story.append(Paragraph('<b>Growth Opportunities</b>', styles['SubHeading']))
            for opp in data['industry']['opportunities']:
                story.append(Paragraph(f'<font color="#10b981">•</font>  {opp}', styles['ReportBody']))

        if data['industry'].get('challenges'):
            story.append(Paragraph('<b>Challenges</b>', styles['SubHeading']))
            for ch in data['industry']['challenges']:
                story.append(Paragraph(f'<font color="#f59e0b">•</font>  {ch}', styles['ReportBody']))

        story.append(Spacer(1, 8))

    # Recent Developments
    if data.get('developments'):
        story.extend(create_section_heading('Recent Developments', styles))
        for dev in data['developments']:
            date_str = dev.get('date', '')
            title = dev.get('title', '')
            desc = dev.get('description', '')
            block = create_bordered_item(f'<font color="#14b8a6">{date_str}</font> — {title}', desc, COLORS['accent_teal'], styles)
            if block:
                story.append(KeepTogether([block, Spacer(1, 6)]))
        story.append(Spacer(1, 8))

    # Lead Generation Intelligence (conditional page break only if needed)
    if data.get('lead_gen'):
        # Use CondPageBreak to only break if less than 2 inches remain
        story.append(CondPageBreak(2*inch))
        story.extend(create_section_heading('Lead Generation Intelligence', styles))

        kw = data['lead_gen'].get('keywords', {})
        if kw.get('primary'):
            story.append(Paragraph('<b>Primary Service Keywords</b>', styles['SubHeading']))
            story.append(Paragraph('  '.join([f'<font color="#3b82f6">[{k}]</font>' for k in kw['primary']]), styles['TagText']))

        if kw.get('vertical'):
            story.append(Paragraph('<b>Vertical Keywords</b>', styles['SubHeading']))
            story.append(Paragraph('  '.join([f'<font color="#10b981">[{k}]</font>' for k in kw['vertical']]), styles['TagText']))

        if kw.get('technology'):
            story.append(Paragraph('<b>Technology Keywords</b>', styles['SubHeading']))
            story.append(Paragraph('  '.join([f'<font color="#8b5cf6">[{k}]</font>' for k in kw['technology']]), styles['TagText']))

        if kw.get('pain_point'):
            story.append(Paragraph('<b>Pain Point Keywords</b>', styles['SubHeading']))
            story.append(Paragraph('  '.join([f'<font color="#f59e0b">[{k}]</font>' for k in kw['pain_point']]), styles['TagText']))

        if data['lead_gen'].get('outreach_angles'):
            story.append(Spacer(1, 8))
            story.append(Paragraph('<b>Outreach Angles</b>', styles['SubHeading']))
            for angle in data['lead_gen']['outreach_angles']:
                block = create_bordered_item(angle.get('title'), angle.get('description'), COLORS['accent_indigo'], styles)
                if block:
                    story.append(block)
                    story.append(Spacer(1, 4))

        if data['lead_gen'].get('partnership_targets'):
            story.append(Spacer(1, 8))
            story.append(Paragraph('<b>Partnership Targets</b>', styles['SubHeading']))
            for partner in data['lead_gen']['partnership_targets']:
                block = create_bordered_item(partner.get('name'), partner.get('rationale'), COLORS['accent_rose'], styles)
                if block:
                    story.append(block)
                    story.append(Spacer(1, 4))

        story.append(Spacer(1, 8))

    # Information Gaps
    if data.get('info_gaps'):
        story.extend(create_section_heading('Information Gaps', styles))
        story.append(Paragraph('The following information was not publicly available:', styles['MutedText']))
        for gap in data['info_gaps']:
            story.append(Paragraph(f'<font color="#94a3b8">•</font>  {gap}', styles['MutedText']))
        story.append(Spacer(1, 8))

    # Footer
    story.append(Spacer(1, 16))
    story.append(HRFlowable(width="100%", thickness=1, color=COLORS['border']))
    report_date = data.get('report_date', datetime.now().strftime('%B %d, %Y'))
    footer_text = f'This report was prepared for business development and sales intelligence purposes. All information is based on publicly available sources and is current as of {report_date}. Verify critical details before making business decisions.'
    story.append(Paragraph(footer_text, styles['MutedText']))

    # Build PDF
    doc.build(story)
    return output_path


if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("Usage: python generate_report.py input.json output.pdf")
        sys.exit(1)

    input_file = sys.argv[1]
    output_file = sys.argv[2]

    with open(input_file, 'r') as f:
        data = json.load(f)

    generate_pdf(data, output_file)
    print(f"Report generated: {output_file}")
