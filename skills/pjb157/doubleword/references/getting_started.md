# Getting Started with Doubleword Batch API

Complete guide to account setup and submitting your first batch.

## Prerequisites

Before you can submit batches, you need three things:

### 1. Doubleword Account

Sign up at https://app.doubleword.ai/ to create your account.

The Doubleword Console provides:
- Web-based batch submission interface
- Real-time batch monitoring dashboard
- Cost estimation tool (upload files to preview expenses)
- API key management
- Credit management and billing

### 2. API Key

**Creating an API Key:**

1. Log into your Doubleword Console at https://app.doubleword.ai/
2. Navigate to the API Keys section
3. Click to create a new API key
4. Copy and securely store your key - it won't be shown again
5. Use this key in the `Authorization: Bearer YOUR_API_KEY` header for all API requests

**Best practices:**
- Store API keys securely (environment variables, secrets manager)
- Never commit API keys to version control
- Rotate keys periodically for security
- Create separate keys for different environments (dev, staging, prod)

### 3. Account Credits

You need credits in your account to process batch requests. Charges are based on token usage.

**Adding Credits:**

Detailed information about adding credits is available in the Doubleword Console's billing section. Navigate to the account settings to add credits to your account.

**Credit Usage:**
- Charges are calculated based on actual token usage (input + output tokens)
- You're only charged for completed requests
- Cancelled requests are not charged
- Failed requests are not charged
- View remaining credits in your dashboard

## Submission Methods

You can submit and manage batches in two ways:

### Method 1: API (Programmatic)

Use HTTP requests to automate batch workflows:

```bash
# 1. Upload file
curl https://api.doubleword.ai/v1/files \
  -H "Authorization: Bearer $DOUBLEWORD_API_KEY" \
  -F purpose="batch" \
  -F file="@batch_requests.jsonl"

# 2. Create batch
curl https://api.doubleword.ai/v1/batches \
  -H "Authorization: Bearer $DOUBLEWORD_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "input_file_id": "file-abc123",
    "endpoint": "/v1/chat/completions",
    "completion_window": "24h"
  }'

# 3. Check status
curl https://api.doubleword.ai/v1/batches/batch-xyz789 \
  -H "Authorization: Bearer $DOUBLEWORD_API_KEY"

# 4. Download results
curl https://api.doubleword.ai/v1/files/file-output123/content \
  -H "Authorization: Bearer $DOUBLEWORD_API_KEY" \
  > results.jsonl
```

**Best for:**
- Automated workflows
- Integration with existing systems
- Programmatic batch generation
- CI/CD pipelines

### Method 2: Web Console (Interactive)

Use the web interface for manual batch management:

1. Navigate to https://app.doubleword.ai/
2. Go to the Batches section
3. Upload your JSONL file
4. Configure batch settings (model, completion window, metadata)
5. Monitor progress in real-time dashboard
6. Download results when complete

**Best for:**
- One-off batch submissions
- Cost estimation before submission
- Visual monitoring of batch progress
- Quick testing and experimentation
- Users unfamiliar with APIs

## OpenAI Compatibility

Doubleword maintains full OpenAI compatibility. If you're familiar with OpenAI's Batch API, you can use the same:

- JSONL file format
- API request structure
- Tool calling specifications
- Structured output format (JSON Schema)
- Response format

**Migration from OpenAI:**

Simply change your base URL from OpenAI to Doubleword:

```python
# OpenAI
base_url = "https://api.openai.com/v1"

# Doubleword
base_url = "https://api.doubleword.ai/v1"
```

All other code remains unchanged.

## Common Setup Issues

### Issue: "Unauthorized" or "Invalid API Key"

**Solutions:**
- Verify your API key is correct
- Check that you're using `Authorization: Bearer YOUR_API_KEY` header format
- Ensure the API key hasn't been deleted or rotated
- Create a new API key if needed

### Issue: "Insufficient Credits"

**Solutions:**
- Check your account balance in the Console
- Add more credits to your account
- Verify the estimated cost of your batch

### Issue: "Model Not Available"

**Solutions:**
- Check that you have access to the specified model
- Verify the model name is correct (e.g., `"anthropic/claude-3-5-sonnet"`)
- Contact support if you need access to specific models

### Issue: "File Upload Failed" or "File Too Large"

**Solutions:**
- Ensure file is under 200MB limit
- Split large batches into multiple files
- Verify JSONL format is correct (no line breaks within JSON objects)
- Check for invalid JSON syntax

### Issue: Batch Stuck in "Validating"

**Solutions:**
- Check JSONL file format - each line must be valid JSON
- Ensure no duplicate `custom_id` values
- Verify all required fields are present (`custom_id`, `method`, `url`, `body`)
- Check error_file_id for validation errors

## Next Steps

Once setup is complete:

1. **Test with small batch**: Start with 5-10 requests to validate your workflow
2. **Use cost estimator**: Upload files to preview expenses before large batches
3. **Set up monitoring**: Decide whether to use API polling or Console dashboard
4. **Consider autobatcher**: For ongoing workloads, explore the autobatcher Python client for automatic batching
5. **Review pricing**: Choose appropriate completion windows based on urgency and budget

## Support Resources

- **Documentation**: https://docs.doubleword.ai/batches
- **GitHub**: https://github.com/doublewordai
- **Dashboard**: https://app.doubleword.ai/
- **Get Support**: Available through the documentation site
