---
name: proxmox-full
description: Complete Proxmox VE management - create/clone/start/stop VMs and LXC containers, manage snapshots, backups, storage, and templates. Use when user wants to manage Proxmox infrastructure, virtual machines, or containers.
metadata: {"clawdbot":{"emoji":"🖥️","homepage":"https://www.proxmox.com/","requires":{"bins":["curl","jq"],"env":["PVE_TOKEN"]},"primaryEnv":"PVE_TOKEN"}}
---

# Proxmox VE - Full Management

Complete control over Proxmox VE hypervisor via REST API.

## Setup

```bash
export PVE_URL="https://192.168.1.10:8006"
export PVE_TOKEN="user@pam!tokenid=secret-uuid"
```

**Create API token:** Datacenter → Permissions → API Tokens → Add (uncheck Privilege Separation)

## Auth Header

```bash
AUTH="Authorization: PVEAPIToken=$PVE_TOKEN"
```

---

## Cluster & Nodes

```bash
# Cluster status
curl -sk -H "$AUTH" "$PVE_URL/api2/json/cluster/status" | jq

# List nodes
curl -sk -H "$AUTH" "$PVE_URL/api2/json/nodes" | jq '.data[] | {node, status, cpu: (.cpu*100|round), mem_pct: (.mem/.maxmem*100|round)}'

# Node details
curl -sk -H "$AUTH" "$PVE_URL/api2/json/nodes/{node}/status" | jq
```

---

## List VMs & Containers

```bash
# All VMs on node
curl -sk -H "$AUTH" "$PVE_URL/api2/json/nodes/{node}/qemu" | jq '.data[] | {vmid, name, status}'

# All LXC on node
curl -sk -H "$AUTH" "$PVE_URL/api2/json/nodes/{node}/lxc" | jq '.data[] | {vmid, name, status}'

# Cluster-wide (all VMs + LXC)
curl -sk -H "$AUTH" "$PVE_URL/api2/json/cluster/resources?type=vm" | jq '.data[] | {node, type, vmid, name, status}'
```

---

## VM/Container Control

```bash
# Start
curl -sk -X POST -H "$AUTH" "$PVE_URL/api2/json/nodes/{node}/qemu/{vmid}/status/start"

# Stop (immediate)
curl -sk -X POST -H "$AUTH" "$PVE_URL/api2/json/nodes/{node}/qemu/{vmid}/status/stop"

# Shutdown (graceful)
curl -sk -X POST -H "$AUTH" "$PVE_URL/api2/json/nodes/{node}/qemu/{vmid}/status/shutdown"

# Reboot
curl -sk -X POST -H "$AUTH" "$PVE_URL/api2/json/nodes/{node}/qemu/{vmid}/status/reboot"

# For LXC: replace /qemu/ with /lxc/
```

---

## Create LXC Container

```bash
# Get next available VMID
NEWID=$(curl -sk -H "$AUTH" "$PVE_URL/api2/json/cluster/nextid" | jq -r '.data')

# Create container
curl -sk -X POST -H "$AUTH" "$PVE_URL/api2/json/nodes/{node}/lxc" \
  -d "vmid=$NEWID" \
  -d "hostname=my-container" \
  -d "ostemplate=local:vztmpl/debian-12-standard_12.2-1_amd64.tar.zst" \
  -d "storage=local-lvm" \
  -d "rootfs=local-lvm:8" \
  -d "memory=1024" \
  -d "swap=512" \
  -d "cores=2" \
  -d "net0=name=eth0,bridge=vmbr0,ip=dhcp" \
  -d "password=changeme123" \
  -d "start=1"
```

**LXC Parameters:**
| Param | Example | Description |
|-------|---------|-------------|
| vmid | 200 | Container ID |
| hostname | myct | Container hostname |
| ostemplate | local:vztmpl/debian-12-... | Template path |
| storage | local-lvm | Storage for rootfs |
| rootfs | local-lvm:8 | Root disk (8GB) |
| memory | 1024 | RAM in MB |
| swap | 512 | Swap in MB |
| cores | 2 | CPU cores |
| net0 | name=eth0,bridge=vmbr0,ip=dhcp | Network config |
| password | secret | Root password |
| ssh-public-keys | ssh-rsa ... | SSH keys (URL encoded) |
| unprivileged | 1 | Unprivileged container |
| start | 1 | Start after creation |

---

## Create VM

```bash
# Get next VMID
NEWID=$(curl -sk -H "$AUTH" "$PVE_URL/api2/json/cluster/nextid" | jq -r '.data')

# Create VM
curl -sk -X POST -H "$AUTH" "$PVE_URL/api2/json/nodes/{node}/qemu" \
  -d "vmid=$NEWID" \
  -d "name=my-vm" \
  -d "memory=2048" \
  -d "cores=2" \
  -d "sockets=1" \
  -d "cpu=host" \
  -d "net0=virtio,bridge=vmbr0" \
  -d "scsi0=local-lvm:32" \
  -d "scsihw=virtio-scsi-pci" \
  -d "ide2=local:iso/ubuntu-22.04.iso,media=cdrom" \
  -d "boot=order=scsi0;ide2;net0" \
  -d "ostype=l26"
```

**VM Parameters:**
| Param | Example | Description |
|-------|---------|-------------|
| vmid | 100 | VM ID |
| name | myvm | VM name |
| memory | 2048 | RAM in MB |
| cores | 2 | CPU cores per socket |
| sockets | 1 | CPU sockets |
| cpu | host | CPU type |
| net0 | virtio,bridge=vmbr0 | Network |
| scsi0 | local-lvm:32 | Disk (32GB) |
| ide2 | local:iso/file.iso,media=cdrom | ISO |
| ostype | l26 (Linux), win11 | OS type |
| boot | order=scsi0;ide2 | Boot order |

---

## Clone VM/Container

```bash
# Clone VM
curl -sk -X POST -H "$AUTH" "$PVE_URL/api2/json/nodes/{node}/qemu/{vmid}/clone" \
  -d "newid=201" \
  -d "name=cloned-vm" \
  -d "full=1" \
  -d "storage=local-lvm"

# Clone LXC
curl -sk -X POST -H "$AUTH" "$PVE_URL/api2/json/nodes/{node}/lxc/{vmid}/clone" \
  -d "newid=202" \
  -d "hostname=cloned-ct" \
  -d "full=1" \
  -d "storage=local-lvm"
```

**Clone Parameters:**
| Param | Description |
|-------|-------------|
| newid | New VMID |
| name/hostname | New name |
| full | 1=full clone, 0=linked clone |
| storage | Target storage |
| target | Target node (for migration) |

---

## Convert to Template

```bash
# Convert VM to template
curl -sk -X POST -H "$AUTH" "$PVE_URL/api2/json/nodes/{node}/qemu/{vmid}/template"

# Convert LXC to template
curl -sk -X POST -H "$AUTH" "$PVE_URL/api2/json/nodes/{node}/lxc/{vmid}/template"
```

---

## Snapshots

```bash
# List snapshots
curl -sk -H "$AUTH" "$PVE_URL/api2/json/nodes/{node}/qemu/{vmid}/snapshot" | jq '.data[] | {name, description}'

# Create snapshot
curl -sk -X POST -H "$AUTH" "$PVE_URL/api2/json/nodes/{node}/qemu/{vmid}/snapshot" \
  -d "snapname=before-update" \
  -d "description=Snapshot before system update"

# Rollback
curl -sk -X POST -H "$AUTH" "$PVE_URL/api2/json/nodes/{node}/qemu/{vmid}/snapshot/{snapname}/rollback"

# Delete snapshot
curl -sk -X DELETE -H "$AUTH" "$PVE_URL/api2/json/nodes/{node}/qemu/{vmid}/snapshot/{snapname}"
```

---

## Backups

```bash
# Start backup
curl -sk -X POST -H "$AUTH" "$PVE_URL/api2/json/nodes/{node}/vzdump" \
  -d "vmid={vmid}" \
  -d "storage=local" \
  -d "mode=snapshot" \
  -d "compress=zstd"

# List backups
curl -sk -H "$AUTH" "$PVE_URL/api2/json/nodes/{node}/storage/{storage}/content?content=backup" | jq

# Restore backup
curl -sk -X POST -H "$AUTH" "$PVE_URL/api2/json/nodes/{node}/qemu" \
  -d "vmid=300" \
  -d "archive=local:backup/vzdump-qemu-100-2024_01_01-12_00_00.vma.zst" \
  -d "storage=local-lvm"
```

---

## Storage & Templates

```bash
# List storage
curl -sk -H "$AUTH" "$PVE_URL/api2/json/nodes/{node}/storage" | jq '.data[] | {storage, type, avail, used}'

# List available templates
curl -sk -H "$AUTH" "$PVE_URL/api2/json/nodes/{node}/storage/local/content?content=vztmpl" | jq '.data[] | .volid'

# List ISOs
curl -sk -H "$AUTH" "$PVE_URL/api2/json/nodes/{node}/storage/local/content?content=iso" | jq '.data[] | .volid'

# Download template
curl -sk -X POST -H "$AUTH" "$PVE_URL/api2/json/nodes/{node}/aplinfo" \
  -d "storage=local" \
  -d "template=debian-12-standard_12.2-1_amd64.tar.zst"
```

---

## Tasks

```bash
# Recent tasks
curl -sk -H "$AUTH" "$PVE_URL/api2/json/nodes/{node}/tasks?limit=10" | jq '.data[] | {upid, type, status}'

# Task status
curl -sk -H "$AUTH" "$PVE_URL/api2/json/nodes/{node}/tasks/{upid}/status" | jq

# Task log
curl -sk -H "$AUTH" "$PVE_URL/api2/json/nodes/{node}/tasks/{upid}/log" | jq -r '.data[].t'
```

---

## Delete VM/Container

```bash
# Delete VM (must be stopped)
curl -sk -X DELETE -H "$AUTH" "$PVE_URL/api2/json/nodes/{node}/qemu/{vmid}"

# Delete LXC
curl -sk -X DELETE -H "$AUTH" "$PVE_URL/api2/json/nodes/{node}/lxc/{vmid}"

# Force delete (purge)
curl -sk -X DELETE -H "$AUTH" "$PVE_URL/api2/json/nodes/{node}/qemu/{vmid}?purge=1&destroy-unreferenced-disks=1"
```

---

## Quick Reference

| Action | Endpoint | Method |
|--------|----------|--------|
| List nodes | /nodes | GET |
| List VMs | /nodes/{node}/qemu | GET |
| List LXC | /nodes/{node}/lxc | GET |
| Create VM | /nodes/{node}/qemu | POST |
| Create LXC | /nodes/{node}/lxc | POST |
| Clone | /nodes/{node}/qemu/{vmid}/clone | POST |
| Start | /nodes/{node}/qemu/{vmid}/status/start | POST |
| Stop | /nodes/{node}/qemu/{vmid}/status/stop | POST |
| Snapshot | /nodes/{node}/qemu/{vmid}/snapshot | POST |
| Delete | /nodes/{node}/qemu/{vmid} | DELETE |
| Next ID | /cluster/nextid | GET |

## Notes

- Use `-k` for self-signed certs
- API tokens don't need CSRF
- Replace `{node}` with node name (e.g., `pve`)
- Replace `{vmid}` with VM/container ID
- Use `qemu` for VMs, `lxc` for containers
- All create/clone operations return task UPID for tracking
