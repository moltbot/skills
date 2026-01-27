# Doubleword Batch API Pricing

Complete pricing details for models and service level agreements.

## Pricing Model

Doubleword charges based on **token usage**, with separate pricing for input and output tokens. Prices are quoted per 1 million tokens (1M tokens).

**Cost Calculation:**
```
Total Cost = (Input Tokens / 1,000,000 × Input Price) + (Output Tokens / 1,000,000 × Output Price)
```

## Available Models

### Qwen3-VL-30B-A3B-Instruct-FP8 (Mid-Size Model)

A balanced model suitable for most batch inference workloads.

| SLA | Input (per 1M tokens) | Output (per 1M tokens) | Savings vs Realtime |
|-----|----------------------|------------------------|---------------------|
| Realtime | $0.16 | $0.80 | Baseline |
| 1-hour | $0.07 | $0.30 | 56% cheaper (input)<br>63% cheaper (output) |
| 24-hour | $0.05 | $0.20 | 69% cheaper (input)<br>75% cheaper (output) |

**Specifications:**
- 30B active parameters
- 3B active parameters in MoE routing
- FP8 quantization for efficient inference
- Suitable for general-purpose tasks

### Qwen3-VL-235B-A22B-Instruct-FP8 (Flagship Model)

The most capable model with extended context support.

| SLA | Input (per 1M tokens) | Output (per 1M tokens) | Savings vs Realtime |
|-----|----------------------|------------------------|---------------------|
| Realtime | $0.60 | $1.20 | Baseline |
| 1-hour | $0.15 | $0.55 | 75% cheaper (input)<br>54% cheaper (output) |
| 24-hour | $0.10 | $0.40 | 83% cheaper (input)<br>67% cheaper (output) |

**Specifications:**
- 235B active parameters
- 22B active parameters in MoE routing
- FP8 quantization for efficient inference
- **Up to 262,144 total tokens** (262K context window)
- **Up to 16,384 new tokens per request** (16K output)
- Ideal for extended processing tasks, large documents, and complex reasoning

## Service Level Agreements (SLAs)

### Realtime SLA

**When to use:**
- Immediate results required
- Interactive applications
- User-facing requests

**Characteristics:**
- Highest cost per token
- Limited capacity (batch service optimized for async)
- Results typically available in seconds to minutes
- Not recommended for batch workloads

### 1-Hour SLA

**When to use:**
- Time-sensitive batch processing
- Results needed within the hour
- Balance between cost and speed

**Characteristics:**
- 50-75% cheaper than realtime (depending on model)
- Results within 1 hour (typically faster)
- Suitable for workflows with moderate urgency

### 24-Hour SLA (Recommended for Batches)

**When to use:**
- Cost-sensitive workloads
- Large-scale batch processing
- Overnight or background jobs
- When immediate results aren't required

**Characteristics:**
- 67-83% cheaper than realtime (depending on model and token type)
- Results within 24 hours (typically much faster)
- Best value for batch processing
- Recommended default for most batch use cases

**Important Note:** SLAs represent maximum processing times. Actual completion typically occurs much faster than the stated guarantee, especially for smaller batches.

## Cost Optimization Strategies

### 1. Choose Appropriate SLA

The single biggest cost optimization is choosing the right completion window:

```
Example: 1M input tokens + 1M output tokens on Qwen3-VL-235B
- Realtime:  $0.60 + $1.20 = $1.80
- 1-hour:    $0.15 + $0.55 = $0.70 (61% savings)
- 24-hour:   $0.10 + $0.40 = $0.50 (72% savings)
```

**Recommendation:** Default to 24h SLA unless you have specific time requirements.

### 2. Use Cost Estimator

Before submitting large batches:
1. Navigate to the Doubleword Console at https://app.doubleword.ai/
2. Go to the Batches section
3. Upload your JSONL file
4. Use the cost estimation tool to preview expenses
5. Adjust completion window based on budget

### 3. Optimize Token Usage

**Input tokens:**
- Remove unnecessary context from prompts
- Use clear, concise instructions
- Avoid repetitive information across requests

**Output tokens:**
- Set appropriate `max_tokens` limits
- Use structured outputs to constrain response length
- Request specific formats (bullet points vs paragraphs)

### 4. Choose Right Model

**Use Qwen3-VL-30B when:**
- Tasks don't require extended context
- General-purpose inference
- Cost is primary concern
- 30B parameters sufficient for task complexity

**Use Qwen3-VL-235B when:**
- Extended context required (up to 262K tokens)
- Long output generation needed (up to 16K tokens)
- Complex reasoning tasks
- Highest quality results required

### 5. Batch Size Optimization

Larger batches don't cost more per token, but consider:
- Split very large batches to stay under 200MB file limit
- Test with small batches first to validate cost estimates
- Monitor `request_counts` to identify and retry only failed requests

### 6. Use autobatcher for Ongoing Workloads

For continuous API usage, the autobatcher Python client automatically batches individual requests:
- Reduces per-token costs by converting to batch pricing
- No code changes required
- Transparent batching with configurable collection windows

Install: `pip install autobatcher`

## Billing and Credits

### How Credits Work

1. **Add Credits**: Purchase credits through the Doubleword Console
2. **Credit Deduction**: Credits are deducted as batches complete based on actual token usage
3. **Failed Requests**: Not charged (only successful completions)
4. **Cancelled Requests**: Not charged (only processed requests)
5. **View Balance**: Check remaining credits in dashboard

### Cost Visibility

**Before submission:**
- Use cost estimation tool in Console
- Calculate manually: `(input_tokens / 1M × input_price) + (output_tokens / 1M × output_price)`

**During processing:**
- Monitor `request_counts` in batch status to estimate partial costs
- Track completed requests vs total requests

**After completion:**
- View actual costs in Console billing section
- Download output file to verify token counts in responses

## Example Cost Calculations

### Example 1: Research Paper Summarization

**Task:** Summarize 100 research papers

**Assumptions:**
- Model: Qwen3-VL-235B (needs extended context)
- Input: 150K tokens per paper (full paper text)
- Output: 2K tokens per summary
- Completion window: 24h

**Calculation:**
```
Input cost:  (100 × 150,000 / 1,000,000) × $0.10 = $1.50
Output cost: (100 × 2,000 / 1,000,000) × $0.40 = $0.08
Total: $1.58
```

**Savings with 24h vs Realtime:** $9.12 (85% cheaper)

### Example 2: Customer Support Ticket Classification

**Task:** Classify 10,000 support tickets

**Assumptions:**
- Model: Qwen3-VL-30B (sufficient for classification)
- Input: 500 tokens per ticket
- Output: 50 tokens per classification
- Completion window: 24h

**Calculation:**
```
Input cost:  (10,000 × 500 / 1,000,000) × $0.05 = $0.25
Output cost: (10,000 × 50 / 1,000,000) × $0.20 = $0.10
Total: $0.35
```

**Savings with 24h vs Realtime:** $4.65 (93% cheaper)

### Example 3: Data Extraction at Scale

**Task:** Extract structured data from 1,000 documents

**Assumptions:**
- Model: Qwen3-VL-30B
- Input: 5K tokens per document
- Output: 1K tokens per extraction (structured JSON)
- Completion window: 1h (time-sensitive)

**Calculation:**
```
Input cost:  (1,000 × 5,000 / 1,000,000) × $0.07 = $0.35
Output cost: (1,000 × 1,000 / 1,000,000) × $0.30 = $0.30
Total: $0.65
```

**Savings with 1h vs Realtime:** $4.35 (87% cheaper)

## Pricing Comparison: Realtime vs Batch

For the same workload (1M input + 1M output tokens):

| Model | Realtime | 1-hour | 24-hour | Max Savings |
|-------|----------|--------|---------|-------------|
| Qwen3-VL-30B | $0.96 | $0.37 | $0.25 | 74% |
| Qwen3-VL-235B | $1.80 | $0.70 | $0.50 | 72% |

**Key Insight:** Batch processing with 24h SLA offers 72-74% cost savings compared to realtime, with minimal impact on actual completion time for most workloads.

## Frequently Asked Questions

**Q: Am I charged for failed requests?**
A: No, you're only charged for successfully completed requests.

**Q: What happens if I cancel a batch mid-processing?**
A: You're only charged for requests that completed before cancellation. Unprocessed requests are not charged.

**Q: Can I get a refund if my batch completes faster than the SLA?**
A: No, pricing is based on the SLA chosen, not actual completion time. However, faster completion is a benefit, not a penalty.

**Q: Do I need to pay upfront?**
A: Yes, you need account credits before submitting batches. Credits are deducted as batches complete.

**Q: Is there a minimum batch size?**
A: No minimum. However, very small batches may be more efficiently processed through realtime API.

**Q: Are there volume discounts?**
A: Contact Doubleword support for enterprise pricing and volume discounts.

## Support

For pricing questions or enterprise inquiries:
- Documentation: https://docs.doubleword.ai/batches
- Console: https://app.doubleword.ai/
- Support: Available through documentation site
