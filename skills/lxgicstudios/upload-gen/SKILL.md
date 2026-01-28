---
name: upload-gen
description: Generate file upload handling code. Use when building upload features with S3, local storage, or cloud providers.
---

# Upload Handler Generator

File uploads are tricky. Validation, storage, progress tracking. This tool generates complete upload handling code for your stack. S3, local disk, Cloudflare R2. whatever you need.

**One command. Zero config. Just works.**

## Quick Start

```bash
npx ai-upload "image upload to S3 with validation"
```

## What It Does

- Generates file upload handlers for Express, Fastify, or serverless
- Includes file type validation and size limits
- Supports S3, local storage, Cloudflare R2, and GCS
- Creates presigned URL flows for direct uploads
- Handles multipart uploads for large files

## Usage Examples

```bash
# S3 upload with validation
npx ai-upload "images to S3 with 5MB limit and JPEG/PNG only"

# Local storage
npx ai-upload "documents to local disk with unique filenames"

# Presigned URLs for direct upload
npx ai-upload "presigned S3 URLs for client-side upload"

# Multiple file upload
npx ai-upload "bulk image upload up to 10 files"

# With progress tracking
npx ai-upload "large file upload with progress callback" --with-progress
```

## Best Practices

- **Validate on both client and server** - Never trust client-side validation alone
- **Use presigned URLs for large files** - Don't proxy everything through your server
- **Set reasonable limits** - Both file size and count per request
- **Scan for malware** - Especially for user-uploaded executables

## When to Use This

- Adding profile picture uploads
- Building document management features
- Creating media libraries with file uploads
- Implementing bulk import functionality

## Part of the LXGIC Dev Toolkit

This is one of 110+ free developer tools built by LXGIC Studios. No paywalls, no sign-ups, no API keys on free tiers. Just tools that work.

**Find more:**
- GitHub: https://github.com/LXGIC-Studios
- Twitter: https://x.com/lxgicstudios
- Substack: https://lxgicstudios.substack.com
- Website: https://lxgic.dev

## Requirements

No install needed. Just run with npx. Node.js 18+ recommended.

```bash
npx ai-upload --help
```

## How It Works

The tool generates upload handling code based on your storage target and requirements. It creates the middleware, validation logic, and storage integration code you need to handle file uploads properly.

## License

MIT. Free forever. Use it however you want.
