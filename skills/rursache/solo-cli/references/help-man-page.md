solo-cli - SOLO.ro accounting platform CLI

Usage:
  solo-cli [options] [command] [args]

Commands:
  summary [year]  Show account summary (year, revenues, expenses, taxes)
  revenues        List revenue invoices (aliases: revenue, rev)
  expenses        List expenses (aliases: expense, exp)
  queue           List expense queue (alias: q). Subcommands: delete <id>
  efactura        List e-Factura documents (aliases: einvoice, ei)
  company         Show company profile
  upload <file>   Upload expense document (alias: up)
  tui             Start interactive TUI (default when no command)
  demo            Start TUI with demo data (for screenshots)

Options:
  --config, -c    Path to custom config file
  help, -h        Show this help message
  version, -v     Show version

Config:
  Default: ~/.config/solo-cli/config.json

Examples:
  solo-cli                          # Start TUI
  solo-cli summary                  # Show current year summary
  solo-cli summary 2025             # Show 2025 summary
  solo-cli upload invoice.pdf       # Upload expense document
  solo-cli queue delete 123         # Delete queued item
  solo-cli -c ~/my-config.json rev  # Use custom config
  solo-cli expenses | grep -i "food"