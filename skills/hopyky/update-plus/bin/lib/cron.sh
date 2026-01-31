#!/usr/bin/env bash
# Update Plus - Cron management functions
# Version: 4.0.3
# For OpenClaw

# Install cron job for automatic updates
install_cron() {
  local cron_schedule="${1:-0 2 * * *}"  # Default: 2 AM daily
  local script_path="${SCRIPT_DIR}/update-plus"
  local log_path="${BACKUP_DIR}/cron-update.log"
  local cron_comment="# Update Plus - OpenClaw Auto-update"

  # Build PATH for cron environment (cron has minimal PATH by default)
  local cron_path="/usr/local/bin:/usr/bin:/bin"
  [[ -d "/opt/homebrew/bin" ]] && cron_path="/opt/homebrew/bin:${cron_path}"
  [[ -d "${HOME}/.openclaw/bin" ]] && cron_path="${HOME}/.openclaw/bin:${cron_path}"
  [[ -d "${HOME}/bin" ]] && cron_path="${HOME}/bin:${cron_path}"
  [[ -d "${HOME}/Library/pnpm" ]] && cron_path="${HOME}/Library/pnpm:${cron_path}"
  [[ -d "${HOME}/.npm-global/bin" ]] && cron_path="${HOME}/.npm-global/bin:${cron_path}"
  [[ -d "${HOME}/.yarn/bin" ]] && cron_path="${HOME}/.yarn/bin:${cron_path}"
  [[ -d "${HOME}/.bun/bin" ]] && cron_path="${HOME}/.bun/bin:${cron_path}"

  local cron_cmd="${cron_schedule} PATH=${cron_path} ${script_path} update >> ${log_path} 2>&1"

  # Check if already installed
  if crontab -l 2>/dev/null | grep -q "update-plus"; then
    log_warning "Cron job already installed. Use 'uninstall-cron' first to reinstall."
    echo ""
    echo "Current cron entry:"
    crontab -l 2>/dev/null | grep -A1 "Update Plus"
    return 1
  fi

  log_info "Installing cron job..."
  echo ""
  echo "  Schedule: ${cron_schedule}"
  echo "  Command:  ${script_path} update"
  echo "  Log file: ${log_path}"
  echo ""

  # Append to crontab
  {
    crontab -l 2>/dev/null || true
    echo ""
    echo "$cron_comment"
    echo "$cron_cmd"
  } | crontab -

  log_success "Cron job installed!"
  echo ""
  log_info "To change schedule, edit with: crontab -e"
  log_info "To remove, run: update-plus uninstall-cron"

  return 0
}

# Uninstall cron job
uninstall_cron() {
  if ! crontab -l 2>/dev/null | grep -q "update-plus"; then
    log_warning "No cron job found for update-plus"
    return 1
  fi

  log_info "Removing cron job..."

  # Remove lines containing update-plus
  crontab -l 2>/dev/null | grep -v "update-plus" | grep -v "Update Plus" | crontab -

  log_success "Cron job removed!"
  return 0
}

# Clean old log files
clean_logs() {
  log_info "Cleaning old log files..."
  find "${BACKUP_DIR}" -name "*.log" -mtime +30 -delete 2>/dev/null
  log_success "Old logs cleaned."
}
