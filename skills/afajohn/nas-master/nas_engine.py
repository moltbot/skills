import os, time, mysql.connector, psutil, paramiko
from dotenv import load_dotenv

load_dotenv()
p = psutil.Process(os.getpid())
p.nice(psutil.IDLE_PRIORITY_CLASS)

def get_asustor_system_info():
    """Connects via SSH to pull RAID and Btrfs health."""
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        ssh.connect(os.getenv("NAS_SSH_HOST"), username=os.getenv("NAS_SSH_USER"), password=os.getenv("NAS_SSH_PASS"))
        
        # Get RAID Status
        _, stdout, _ = ssh.exec_command("cat /proc/mdstat")
        raid_info = stdout.read().decode()
        
        # Get Btrfs Status
        _, stdout, _ = ssh.exec_command("btrfs scrub status /volume1")
        btrfs_info = stdout.read().decode()
        
        ssh.close()
        return raid_info, btrfs_info
    except Exception as e:
        return f"SSH Error: {e}", "N/A"

def run_pro_scraper():
    db = mysql.connector.connect(host="localhost", user="root", password="", database="asustor_pro")
    cursor = db.cursor()
    
    # 1. Grab System-Level Metadata First
    raid, btrfs = get_asustor_system_info()
    print(f"RAID Metadata Detected: {raid[:50]}...")

    # 2. Crawl Filesystem (including hidden)
    root = os.getenv("NAS_ROOT_PATH")
    for dirpath, _, filenames in os.walk(root):
        for f in filenames:
            path = os.path.join(dirpath, f)
            try:
                stat = os.stat(path)
                # ACLs and UID/GID logic goes here...
                query = "INSERT IGNORE INTO file_metadata (filename, filepath, raid_context, btrfs_context) VALUES (%s, %s, %s, %s)"
                cursor.execute(query, (f, path, raid, btrfs))
                db.commit()
            except: continue
            time.sleep(0.1) # Throttle for i3 CPU

if __name__ == "__main__":
    run_pro_scraper()