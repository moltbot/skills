#!/usr/bin/env python3
"""
LinkedIn CLI using linkedin-api package
Provides message listing and profile info for linkedin-monitor
"""

import os
import sys
import json
import argparse
from datetime import datetime

try:
    from linkedin_api import Linkedin
except ImportError:
    print(json.dumps({"error": "linkedin-api not installed", "action": "pip3 install linkedin-api"}))
    sys.exit(1)

def get_credentials():
    """Get LinkedIn credentials from environment or config file"""
    li_at = os.environ.get('LINKEDIN_LI_AT')
    jsessionid = os.environ.get('LINKEDIN_JSESSIONID')
    
    if not li_at or not jsessionid:
        # Try loading from config
        config_path = os.path.expanduser('~/.clawdbot/linkedin-monitor/credentials.json')
        if os.path.exists(config_path):
            with open(config_path) as f:
                creds = json.load(f)
                li_at = creds.get('li_at')
                jsessionid = creds.get('jsessionid')
    
    if not li_at or not jsessionid:
        return None, None
    
    # Clean jsessionid if needed
    jsessionid = jsessionid.strip('"').strip("'")
    if not jsessionid.startswith('ajax:'):
        jsessionid = f'ajax:{jsessionid}'
    
    return li_at, jsessionid

def get_client():
    """Get authenticated LinkedIn client"""
    li_at, jsessionid = get_credentials()
    
    if not li_at or not jsessionid:
        print(json.dumps({
            "error": "No LinkedIn credentials found",
            "action": "Set LINKEDIN_LI_AT and LINKEDIN_JSESSIONID environment variables, or run: lk auth setup"
        }))
        sys.exit(1)
    
    try:
        # Create client with cookies
        api = Linkedin('', '', cookies={
            'li_at': li_at,
            'JSESSIONID': f'"{jsessionid}"'
        })
        return api
    except Exception as e:
        print(json.dumps({"error": f"Failed to create LinkedIn client: {str(e)}"}))
        sys.exit(1)

def cmd_profile_me(args):
    """Get current user's profile"""
    api = get_client()
    try:
        profile = api.get_user_profile()
        if args.json:
            print(json.dumps(profile, indent=2, default=str))
        else:
            name = f"{profile.get('firstName', '')} {profile.get('lastName', '')}"
            headline = profile.get('headline', '')
            print(f"{name}")
            print(f"{headline}")
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

def cmd_message_list(args):
    """List conversations/messages"""
    api = get_client()
    try:
        conversations = api.get_conversations()
        
        results = []
        for conv in conversations.get('elements', []):
            # Extract participant info
            participants = []
            for p in conv.get('participants', []):
                member = p.get('com.linkedin.voyager.messaging.MessagingMember', {})
                mini_profile = member.get('miniProfile', {})
                participants.append({
                    'firstName': mini_profile.get('firstName', ''),
                    'lastName': mini_profile.get('lastName', ''),
                    'profileId': mini_profile.get('publicIdentifier', '')
                })
            
            # Get last message
            events = conv.get('events', [])
            last_message = None
            if events:
                last_event = events[0]
                event_content = last_event.get('eventContent', {})
                msg_event = event_content.get('com.linkedin.voyager.messaging.event.MessageEvent', {})
                last_message = {
                    'text': msg_event.get('attributedBody', {}).get('text', ''),
                    'createdAt': last_event.get('createdAt'),
                    'fromMe': last_event.get('from', {}).get('com.linkedin.voyager.messaging.MessagingMember', {}).get('miniProfile', {}).get('publicIdentifier', '') == api.get_user_profile().get('publicIdentifier', '')
                }
            
            results.append({
                'conversationId': conv.get('entityUrn', '').split(':')[-1],
                'participants': participants,
                'lastMessage': last_message,
                'unread': conv.get('unreadCount', 0) > 0
            })
        
        if args.json:
            print(json.dumps(results, indent=2, default=str))
        else:
            for conv in results:
                name = f"{conv['participants'][0]['firstName']} {conv['participants'][0]['lastName']}" if conv['participants'] else 'Unknown'
                msg = conv['lastMessage']['text'][:50] + '...' if conv['lastMessage'] and len(conv['lastMessage']['text']) > 50 else (conv['lastMessage']['text'] if conv['lastMessage'] else '')
                unread = '●' if conv['unread'] else ' '
                print(f"{unread} {name}: {msg}")
                
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

def cmd_auth_setup(args):
    """Interactive credential setup"""
    print("LinkedIn Authentication Setup")
    print("=" * 40)
    print()
    print("To get your credentials:")
    print("1. Open LinkedIn in Chrome")
    print("2. Press F12 to open DevTools")
    print("3. Go to Application > Cookies > linkedin.com")
    print("4. Copy the values for 'li_at' and 'JSESSIONID'")
    print()
    
    li_at = input("Enter li_at cookie value: ").strip()
    jsessionid = input("Enter JSESSIONID cookie value: ").strip()
    
    # Save to config
    config_dir = os.path.expanduser('~/.clawdbot/linkedin-monitor')
    os.makedirs(config_dir, exist_ok=True)
    
    config_path = os.path.join(config_dir, 'credentials.json')
    with open(config_path, 'w') as f:
        json.dump({
            'li_at': li_at,
            'jsessionid': jsessionid.strip('"'),
            'updated_at': datetime.now().isoformat()
        }, f, indent=2)
    
    print()
    print(f"Credentials saved to: {config_path}")
    print("Run 'lk profile me' to test authentication")

def cmd_auth_status(args):
    """Check authentication status"""
    li_at, jsessionid = get_credentials()
    
    if not li_at or not jsessionid:
        print(json.dumps({"authenticated": False, "error": "No credentials found"}))
        sys.exit(1)
    
    # Try to verify by getting profile
    try:
        api = get_client()
        profile = api.get_user_profile()
        name = f"{profile.get('firstName', '')} {profile.get('lastName', '')}"
        print(json.dumps({
            "authenticated": True,
            "user": name,
            "id": profile.get('publicIdentifier', '')
        }))
    except Exception as e:
        print(json.dumps({"authenticated": False, "error": str(e)}))
        sys.exit(1)

def main():
    parser = argparse.ArgumentParser(description='LinkedIn CLI')
    subparsers = parser.add_subparsers(dest='command')
    
    # profile command
    profile_parser = subparsers.add_parser('profile', help='Profile commands')
    profile_sub = profile_parser.add_subparsers(dest='profile_cmd')
    me_parser = profile_sub.add_parser('me', help='Get your profile')
    me_parser.add_argument('--json', action='store_true', help='Output as JSON')
    
    # message command
    msg_parser = subparsers.add_parser('message', help='Message commands')
    msg_sub = msg_parser.add_subparsers(dest='message_cmd')
    list_parser = msg_sub.add_parser('list', help='List conversations')
    list_parser.add_argument('--json', action='store_true', help='Output as JSON')
    list_parser.add_argument('--unread', action='store_true', help='Only unread')
    
    # auth command
    auth_parser = subparsers.add_parser('auth', help='Authentication commands')
    auth_sub = auth_parser.add_subparsers(dest='auth_cmd')
    auth_sub.add_parser('setup', help='Setup credentials')
    auth_sub.add_parser('status', help='Check auth status')
    auth_sub.add_parser('login', help='Alias for setup')
    
    args = parser.parse_args()
    
    if args.command == 'profile' and args.profile_cmd == 'me':
        cmd_profile_me(args)
    elif args.command == 'message' and args.message_cmd == 'list':
        cmd_message_list(args)
    elif args.command == 'auth':
        if args.auth_cmd in ('setup', 'login'):
            cmd_auth_setup(args)
        elif args.auth_cmd == 'status':
            cmd_auth_status(args)
        else:
            auth_parser.print_help()
    else:
        parser.print_help()

if __name__ == '__main__':
    main()
