CREATE DATABASE IF NOT EXISTS asustor_pro;
USE asustor_pro;

CREATE TABLE file_metadata (
    id INT AUTO_INCREMENT PRIMARY KEY,
    filename VARCHAR(255),
    filepath TEXT,
    filesize BIGINT,
    uid INT, -- Linux User ID
    gid INT, -- Linux Group ID
    acl_data TEXT, -- Windows Permissions
    raid_context TEXT, -- RAID status at time of scan
    btrfs_context TEXT, -- Btrfs health/checksum status
    is_hidden BOOLEAN DEFAULT FALSE,
    indexed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY (filepath(255))
);