#!/usr/bin/env python3
"""
YouTrack REST API Client
Handles authentication and basic API calls for YouTrack Cloud instances.
"""

import os
import sys
import json
import argparse
from urllib.parse import urljoin
from typing import Optional, Dict, List, Any
import urllib.request
import urllib.error
from datetime import datetime


class YouTrackAPI:
    """Simple YouTrack REST API client."""

    def __init__(self, base_url: str, token: Optional[str] = None):
        """
        Initialize YouTrack API client.

        Args:
            base_url: Your YouTrack instance URL (e.g., https://sl.youtrack.cloud)
            token: Permanent API token (or set YOUTRACK_TOKEN env var)
        """
        # Normalize base URL
        self.base_url = base_url.rstrip('/')
        self.token = token or os.environ.get('YOUTRACK_TOKEN')

        if not self.token:
            raise ValueError(
                "YouTrack token required. Set YOUTRACK_TOKEN env var or pass as argument."
            )

        # Set up headers with bearer token auth
        self.headers = {
            'Authorization': f'Bearer {self.token}',
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }

    def _make_request(self, method: str, endpoint: str, data: Optional[Dict] = None) -> Dict[str, Any]:
        """
        Make an authenticated API request.

        Args:
            method: HTTP method (GET, POST, PUT, DELETE)
            endpoint: API endpoint (e.g., '/api/issues')
            data: Request body for POST/PUT

        Returns:
            Parsed JSON response
        """
        url = urljoin(self.base_url, endpoint)

        req_data = None
        if data is not None:
            req_data = json.dumps(data).encode('utf-8')

        req = urllib.request.Request(
            url,
            data=req_data,
            headers=self.headers,
            method=method
        )

        try:
            with urllib.request.urlopen(req) as response:
                if response.status >= 400:
                    error_body = response.read().decode('utf-8')
                    raise RuntimeError(f"API Error {response.status}: {error_body}")

                result = response.read().decode('utf-8')
                if result:
                    return json.loads(result)
                return {}
        except urllib.error.HTTPError as e:
            error_body = e.read().decode('utf-8') if e.fp else ''
            raise RuntimeError(f"HTTP Error {e.code}: {error_body}")
        except Exception as e:
            raise RuntimeError(f"Request failed: {e}")

    # Projects

    def get_projects(self) -> List[Dict]:
        """Get all projects."""
        result = self._make_request('GET', '/api/admin/projects?fields=id,name,shortName')
        return result if isinstance(result, list) else []

    def get_project(self, project_id: str) -> Dict:
        """Get a specific project by ID."""
        return self._make_request('GET', f'/api/admin/projects/{project_id}?fields=id,name,shortName,description')

    # Issues

    def get_issues(self, query: Optional[str] = None, fields: str = 'id,summary,description,created,updated,project(id,name),customFields(name,value)') -> List[Dict]:
        """
        Get issues, optionally filtered by a query.

        Args:
            query: YouTrack query language (e.g., 'project: MyProject')
            fields: Comma-separated list of fields to return

        Returns:
            List of issues
        """
        params = {'fields': fields}
        if query:
            params['query'] = query

        # Build query string
        query_string = '&'.join(f'{k}={urllib.parse.quote(str(v))}' for k, v in params.items())
        endpoint = f'/api/issues?{query_string}'

        result = self._make_request('GET', endpoint)
        return result if isinstance(result, list) else []

    def get_issue(self, issue_id: str) -> Dict:
        """Get a specific issue by ID."""
        return self._make_request('GET', f'/api/issues/{issue_id}')

    def create_issue(self, project_id: str, summary: str, description: str = '') -> Dict:
        """
        Create a new issue.

        Args:
            project_id: Project ID or short name
            summary: Issue summary
            description: Issue description

        Returns:
            Created issue
        """
        data = {
            'project': {'id': project_id},
            'summary': summary,
            'description': description
        }
        return self._make_request('POST', '/api/issues', data)

    def update_issue(self, issue_id: str, summary: Optional[str] = None, description: Optional[str] = None) -> Dict:
        """Update an issue's summary and/or description."""
        data = {}
        if summary is not None:
            data['summary'] = summary
        if description is not None:
            data['description'] = description
        return self._make_request('POST', f'/api/issues/{issue_id}', data)

    # Time Tracking

    def get_work_items(self, issue_id: str) -> List[Dict]:
        """Get all work items (time entries) for an issue."""
        result = self._make_request('GET', f'/api/issues/{issue_id}/timeTracking/workItems?fields=id,date,duration(minutes),author(name),text')
        # Convert date from milliseconds to ISO format
        for wi in result:
            if 'date' in wi and wi['date']:
                wi['date'] = datetime.fromtimestamp(wi['date'] / 1000).isoformat()
        return result if isinstance(result, list) else []

    def get_issue_with_work_items(self, issue_id: str) -> Dict:
        """Get an issue with all its work items included."""
        issue = self.get_issue(issue_id)
        work_items = self.get_work_items(issue_id)
        issue['workItems'] = work_items
        return issue

    # Knowledge Base (Articles)

    def get_articles(self, project_id: Optional[str] = None) -> List[Dict]:
        """
        Get knowledge base articles.

        Args:
            project_id: Optional project ID to filter by

        Returns:
            List of articles
        """
        endpoint = '/api/articles'
        if project_id:
            endpoint += f'?project={project_id}'

        result = self._make_request('GET', endpoint)
        return result if isinstance(result, list) else []

    def get_article(self, article_id: str) -> Dict:
        """Get a specific article by ID."""
        return self._make_request('GET', f'/api/articles/{article_id}')

    def create_article(self, project_id: str, title: str, content: str) -> Dict:
        """
        Create a new knowledge base article.

        Args:
            project_id: Project ID
            title: Article title
            content: Article content

        Returns:
            Created article
        """
        data = {
            'project': {'id': project_id},
            'title': title,
            'content': content
        }
        return self._make_request('POST', '/api/articles', data)


def main():
    """CLI interface for testing the YouTrack API."""
    parser = argparse.ArgumentParser(description='YouTrack API Client')
    parser.add_argument('--url', required=True, help='YouTrack instance URL')
    parser.add_argument('--token', help='API token (or set YOUTRACK_TOKEN env var)')
    parser.add_argument('--list-projects', action='store_true', help='List all projects')
    parser.add_argument('--list-issues', help='List issues (optional query)')
    parser.add_argument('--get-issue', help='Get specific issue ID')
    parser.add_argument('--get-articles', action='store_true', help='List articles')

    args = parser.parse_args()

    try:
        api = YouTrackAPI(args.url, args.token)

        if args.list_projects:
            projects = api.get_projects()
            print(json.dumps(projects, indent=2))
        elif args.list_issues is not None:
            issues = api.get_issues(query=args.list_issues)
            print(json.dumps(issues, indent=2))
        elif args.get_issue:
            issue = api.get_issue_with_work_items(args.get_issue)
            print(json.dumps(issue, indent=2))
        elif args.get_articles:
            articles = api.get_articles()
            print(json.dumps(articles, indent=2))
        else:
            print("No action specified. Use --help for options.")
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
