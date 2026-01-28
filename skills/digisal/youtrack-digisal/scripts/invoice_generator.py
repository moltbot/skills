#!/usr/bin/env python3
"""
YouTrack Invoice Generator
Generates invoices from time tracking data in YouTrack projects.
"""

import os
import sys
import json
import argparse
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from youtrack_api import YouTrackAPI


class InvoiceGenerator:
    """Generate invoices from YouTrack time tracking data."""

    def __init__(self, api: YouTrackAPI, hourly_rate: float = 100.0):
        """
        Initialize invoice generator.

        Args:
            api: YouTrackAPI instance
            hourly_rate: Rate per hour (default $100)
        """
        self.api = api
        self.hourly_rate = hourly_rate
        self.rate_per_half_hour = hourly_rate / 2

    def get_project_time_data(self, project_id: str, from_date: Optional[str] = None) -> Dict[str, Any]:
        """
        Get time tracking data for a project.

        Args:
            project_id: Project ID
            from_date: Optional start date (not currently supported in REST API)

        Returns:
            Dictionary with time data per issue
        """
        # Build query for project issues
        # Note: Date filtering with 'updated:' syntax not supported in REST API
        # Use 'updated >= YYYY-MM-DD' format instead
        query = f'project: {project_id}'
        if from_date:
            query += f' updated >= {from_date}'

        issues = self.api.get_issues(query=query)

        project_data = {
            'project': None,
            'issues': [],
            'total_minutes': 0,
            'total_hours': 0,
            'total_cost': 0
        }

        # Get project info
        try:
            project_data['project'] = self.api.get_project(project_id)
        except:
            # Fallback: use project name from first issue
            if issues:
                project_data['project'] = {'name': issues[0].get('project', {}).get('name', project_id)}

        for issue in issues:
            issue_id = issue.get('id')
            issue_with_time = self.api.get_issue_with_work_items(issue_id)

            work_items = issue_with_time.get('workItems', [])
            total_minutes = sum(
                wi.get('duration', {}).get('minutes', 0)
                for wi in work_items
            )

            if total_minutes > 0:
                hours = total_minutes / 60
                cost = self._calculate_cost(total_minutes)

                project_data['issues'].append({
                    'id': issue_id,
                    'summary': issue.get('summary', 'No summary'),
                    'description': issue.get('description', ''),
                    'work_items': work_items,
                    'total_minutes': total_minutes,
                    'total_hours': hours,
                    'cost': cost
                })

                project_data['total_minutes'] += total_minutes
                project_data['total_cost'] += cost

        project_data['total_hours'] = project_data['total_minutes'] / 60

        return project_data

    def _calculate_cost(self, minutes: int) -> float:
        """
        Calculate cost based on time, billed in 30-minute increments.

        Args:
            minutes: Total minutes

        Returns:
            Total cost
        """
        # Convert to 30-minute increments, round up
        half_hour_units = (minutes + 29) // 30
        # Minimum 30 minutes (1 half-hour unit)
        half_hour_units = max(half_hour_units, 1)
        return half_hour_units * self.rate_per_half_hour

    def generate_invoice_text(self, project_data: Dict[str, Any], month: Optional[str] = None) -> str:
        """
        Generate invoice as plain text (can be printed to PDF).

        Args:
            project_data: Project data from get_project_time_data()
            month: Optional month label (e.g., "January 2026")

        Returns:
            Invoice text
        """
        project = project_data['project'] or {}
        project_name = project.get('name', 'Unknown Project')

        lines = []
        lines.append("=" * 70)
        lines.append(f"INVOICE - {project_name}")

        if month:
            lines.append(f"Period: {month}")

        lines.append("")
        lines.append("WORK ITEMS")
        lines.append("-" * 70)

        for issue in project_data['issues']:
            lines.append("")
            lines.append(f"Task: {issue['summary']}")
            lines.append(f"ID: {issue['id']}")

            if issue['description']:
                desc = issue['description'][:200] + "..." if len(issue['description']) > 200 else issue['description']
                lines.append(f"Description: {desc}")

            for wi in issue['work_items']:
                duration = wi.get('duration', {})
                mins = duration.get('minutes', 0)
                date = wi.get('date', '')
                author = wi.get('author', {}).get('name', 'Unknown')
                lines.append(f"  - {date}: {mins} min ({author})")

            lines.append(f"  Task total: {issue['total_hours']:.2f} hours (${issue['cost']:.2f})")

        lines.append("")
        lines.append("-" * 70)
        lines.append(f"TOTAL: {project_data['total_hours']:.2f} hours")
        lines.append(f"TOTAL COST: ${project_data['total_cost']:.2f}")
        lines.append("=" * 70)

        return "\n".join(lines)

    def generate_invoice_json(self, project_data: Dict[str, Any], month: Optional[str] = None) -> str:
        """
        Generate invoice as JSON for programmatic use.

        Args:
            project_data: Project data from get_project_time_data()
            month: Optional month label

        Returns:
            JSON string
        """
        invoice = {
            'project': project_data['project'],
            'period': month,
            'items': project_data['issues'],
            'summary': {
                'total_minutes': project_data['total_minutes'],
                'total_hours': project_data['total_hours'],
                'total_cost': project_data['total_cost']
            }
        }
        return json.dumps(invoice, indent=2)


def main():
    """CLI interface for generating invoices."""
    parser = argparse.ArgumentParser(description='YouTrack Invoice Generator')
    parser.add_argument('--url', required=True, help='YouTrack instance URL')
    parser.add_argument('--token', help='API token (or set YOUTRACK_TOKEN env var)')
    parser.add_argument('--project', required=True, help='Project ID to generate invoice for')
    parser.add_argument('--from-date', help='Start date (YYYY-MM-DD)')
    parser.add_argument('--month', help='Month label (e.g., "January 2026")')
    parser.add_argument('--rate', type=float, default=100.0, help='Hourly rate (default: 100)')
    parser.add_argument('--format', choices=['text', 'json'], default='text', help='Output format')

    args = parser.parse_args()

    try:
        api = YouTrackAPI(args.url, args.token)
        generator = InvoiceGenerator(api, hourly_rate=args.rate)

        project_data = generator.get_project_time_data(args.project, args.from_date)

        if args.format == 'text':
            output = generator.generate_invoice_text(project_data, args.month)
        else:
            output = generator.generate_invoice_json(project_data, args.month)

        print(output)

    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
