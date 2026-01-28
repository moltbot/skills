import { createClient, SupabaseClient } from '@supabase/supabase-js'

/**
 * Configuration interface for LeadInboxSkill
 */
export interface SkillConfig {
  supabaseUrl: string
  supabaseKey: string
  orgId: string
  defaultPriority?: 'low' | 'medium' | 'high' | 'urgent'
}

/**
 * Lead data structure
 */
export interface Lead {
  id: string
  email: string
  name?: string | null
  phone?: string | null
  source: string
  status: 'new' | 'replied' | 'qualified' | 'lost' | 'won'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  org_id: string
  custom_fields?: Record<string, any>
  metadata?: Record<string, any>
  first_reply_sent_at?: string | null
  last_contact_at?: string | null
  created_at: string
  updated_at: string
}

/**
 * Conversation/Message structure
 */
export interface Conversation {
  id: string
  lead_id: string
  org_id: string
  direction: 'inbound' | 'outbound' | 'automated'
  channel: 'email' | 'web' | 'api' | 'phone' | 'chat'
  subject?: string | null
  content: string
  sent_at: string
  opened_at?: string | null
  metadata?: Record<string, any>
}

/**
 * Lead creation input
 */
export interface CreateLeadInput {
  email: string
  name?: string
  phone?: string
  source?: string
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  custom_fields?: Record<string, any>
  metadata?: Record<string, any>
}

/**
 * LeadInboxSkill - Main class for Clawd integration
 * Handles lead capture, automation triggering, and conversation tracking
 */
export class LeadInboxSkill {
  private supabase: SupabaseClient
  private orgId: string
  private defaultPriority: string

  /**
   * Initialize the skill with Supabase credentials
   */
  constructor(config: SkillConfig) {
    if (!config.supabaseUrl || !config.supabaseKey || !config.orgId) {
      throw new Error('Missing required config: supabaseUrl, supabaseKey, orgId')
    }

    this.supabase = createClient(config.supabaseUrl, config.supabaseKey, {
      auth: { persistSession: false }
    })
    this.orgId = config.orgId
    this.defaultPriority = config.defaultPriority || 'medium'
  }

  /**
   * Create new lead and trigger automation workflow
   * Automation (Make.com) will pick this up via webhook and send auto-reply
   */
  async createLead(input: CreateLeadInput): Promise<{
    success: boolean
    lead_id: string
    status: string
    automation_triggered: boolean
    message: string
  }> {
    try {
      // Validate email
      if (!this.isValidEmail(input.email)) {
        throw new Error('Invalid email format')
      }

      // Check for duplicate in last 24h (optional deduplication)
      const { data: existing } = await this.supabase
        .from('leads')
        .select('id, created_at')
        .eq('email', input.email.toLowerCase())
        .eq('org_id', this.orgId)
        .gt('created_at', new Date(Date.now() - 86400000).toISOString())
        .maybeSingle()

      if (existing) {
        return {
          success: true,
          lead_id: existing.id,
          status: 'duplicate',
          automation_triggered: false,
          message: 'Lead already exists (created within last 24h). Skipping automation.'
        }
      }

      // Create lead
      const { data: lead, error } = await this.supabase
        .from('leads')
        .insert({
          email: input.email.toLowerCase(),
          name: input.name || null,
          phone: input.phone || null,
          org_id: this.orgId,
          source: input.source || 'clawd_agent',
          status: 'new',
          priority: input.priority || this.defaultPriority,
          custom_fields: input.custom_fields || {},
          metadata: {
            ...input.metadata,
            user_agent: 'clawd-agent/1.0',
            created_via: 'api'
          }
        })
        .select()
        .single()

      if (error) throw error
      if (!lead) throw new Error('Lead created but no data returned')

      return {
        success: true,
        lead_id: lead.id,
        status: lead.status,
        automation_triggered: true,
        message: `Lead captured successfully. Automation triggered (Lead ID: ${lead.id}). Auto-reply will be sent within 60 seconds.`
      }

    } catch (error) {
      throw new Error(`Lead creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Retrieve lead with full conversation history
   */
  async getLead(id: string): Promise<Lead & { 
    conversations: Conversation[] 
    reply_pending: boolean 
  }> {
    try {
      // Get lead
      const { data: lead, error: leadError } = await this.supabase
        .from('leads')
        .select('*')
        .eq('id', id)
        .eq('org_id', this.orgId)
        .single()

      if (leadError) throw new Error(`Lead not found: ${leadError.message}`)
      if (!lead) throw new Error('Lead not found')

      // Get conversations
      const { data: conversations, error: convError } = await this.supabase
        .from('conversations')
        .select('*')
        .eq('lead_id', id)
        .eq('org_id', this.orgId)
        .order('sent_at', { ascending: true })

      if (convError) throw convError

      return {
        ...lead,
        conversations: conversations || [],
        reply_pending: !lead.first_reply_sent_at,
      }

    } catch (error) {
      throw error
    }
  }

  /**
   * Quick check if lead exists
   */
  async leadExists(email: string): Promise<{ exists: boolean; lead_id?: string; status?: string }> {
    const { data, error } = await this.supabase
      .from('leads')
      .select('id, status')
      .eq('email', email.toLowerCase())
      .eq('org_id', this.orgId)
      .maybeSingle()

    if (error) throw error

    return {
      exists: !!data,
      lead_id: data?.id,
      status: data?.status
    }
  }

  /**
   * Update lead status (qualified, won, lost, etc.)
   * Use this when your agent qualifies the lead during conversation
   */
  async updateStatus(
    id: string, 
    status: 'new' | 'replied' | 'qualified' | 'lost' | 'won',
    notes?: string
  ): Promise<{ success: boolean; lead: Lead }> {
    const validStatuses = ['new', 'replied', 'qualified', 'lost', 'won']

    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`)
    }

    const updates: any = { 
      status, 
      updated_at: new Date().toISOString() 
    }

    // If providing notes, add to custom_fields
    if (notes) {
      const { data: current } = await this.supabase
        .from('leads')
        .select('custom_fields')
        .eq('id', id)
        .single()

      updates.custom_fields = {
        ...current?.custom_fields,
        agent_notes: notes,
        last_status_update: new Date().toISOString()
      }
    }

    const { data, error } = await this.supabase
      .from('leads')
      .update(updates)
      .eq('id', id)
      .eq('org_id', this.orgId)
      .select()
      .single()

    if (error) throw error

    return { success: true, lead: data }
  }

  /**
   * List leads with optional filtering
   * Good for "show me all unqualified leads from today"
   */
  async listLeads(filters?: {
    status?: 'new' | 'replied' | 'qualified' | 'lost' | 'won'
    priority?: 'low' | 'medium' | 'high' | 'urgent'
    source?: string
    limit?: number
    offset?: number
    dateFrom?: string  // ISO date
    dateTo?: string    // ISO date
  }): Promise<{
    leads: Lead[]
    count: number
    filters_applied: typeof filters
  }> {
    let query = this.supabase
      .from('leads')
      .select('*', { count: 'exact' })
      .eq('org_id', this.orgId)
      .order('created_at', { ascending: false })

    // Apply filters
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.priority) {
      query = query.eq('priority', filters.priority)
    }
    if (filters?.source) {
      query = query.eq('source', filters.source)
    }
    if (filters?.dateFrom) {
      query = query.gte('created_at', filters.dateFrom)
    }
    if (filters?.dateTo) {
      query = query.lte('created_at', filters.dateTo)
    }

    // Pagination
    const limit = filters?.limit || 50
    const offset = filters?.offset || 0
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) throw error

    return {
      leads: data || [],
      count: count || 0,
      filters_applied: filters || {}
    }
  }

  /**
   * Delete lead (use with caution)
   */
  async deleteLead(id: string): Promise<{ success: boolean; deleted_id: string }> {
    const { error } = await this.supabase
      .from('leads')
      .delete()
      .eq('id', id)
      .eq('org_id', this.orgId)

    if (error) throw error

    return { success: true, deleted_id: id }
  }

  /**
   * Add conversation message (manual reply from agent)
   */
  async addConversation(
    leadId: string, 
    content: string, 
    subject?: string,
    metadata?: Record<string, any>
  ): Promise<{ 
    success: boolean
    conversation_id: string
    lead_updated: boolean 
  }> {
    try {
      // Verify lead exists
      const { data: leadCheck, error: checkError } = await this.supabase
        .from('leads')
        .select('id')
        .eq('id', leadId)
        .eq('org_id', this.orgId)
        .single()

      if (checkError || !leadCheck) {
        throw new Error('Lead not found or access denied')
      }

      // Insert conversation
      const { data: conv, error: convError } = await this.supabase
        .from('conversations')
        .insert({
          lead_id: leadId,
          org_id: this.orgId,
          content,
          subject: subject || null,
          direction: 'outbound',
          channel: 'api',
          metadata: {
            ...metadata,
            added_by: 'clawd_agent',
            timestamp: new Date().toISOString()
          }
        })
        .select()
        .single()

      if (convError) throw convError

      // Update lead timestamp
      const { error: updateError } = await this.supabase
        .from('leads')
        .update({ 
          last_contact_at: new Date().toISOString(),
          status: 'replied',
          updated_at: new Date().toISOString()
        })
        .eq('id', leadId)

      if (updateError) throw updateError

      return {
        success: true,
        conversation_id: conv.id,
        lead_updated: true
      }

    } catch (error) {
      throw new Error(`Failed to add conversation: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Check automation status - useful for polling
   * Returns whether auto-reply was sent and how long ago
   */
  async getAutomationStatus(leadId: string): Promise<{
    lead_id: string
    status: string
    auto_reply_sent: boolean
    auto_reply_sent_at?: string
    minutes_since_creation: number
    minutes_since_reply?: number
    automation_ok: boolean  // false if >5min and no reply (potential error)
  }> {
    const { data, error } = await this.supabase
      .from('leads')
      .select('status, first_reply_sent_at, created_at')
      .eq('id', leadId)
      .eq('org_id', this.orgId)
      .single()

    if (error) throw error

    const now = Date.now()
    const created = new Date(data.created_at).getTime()
    const minutesSinceCreation = Math.round((now - created) / 60000)

    let minutesSinceReply: number | undefined
    if (data.first_reply_sent_at) {
      minutesSinceReply = Math.round((now - new Date(data.first_reply_sent_at).getTime()) / 60000)
    }

    // Alert if > 5 minutes and no auto-reply (Make.com might be down)
    const automationOk = data.first_reply_sent_at ? true : minutesSinceCreation < 5

    return {
      lead_id: leadId,
      status: data.status,
      auto_reply_sent: !!data.first_reply_sent_at,
      auto_reply_sent_at: data.first_reply_sent_at,
      minutes_since_creation: minutesSinceCreation,
      minutes_since_reply: minutesSinceReply,
      automation_ok: automationOk
    }
  }

  /**
   * Get analytics/stats for dashboard
   */
  async getStats(timeframe: 'today' | 'week' | 'month' = 'today'): Promise<{
    total_leads: number
    by_status: Record<string, number>
    by_source: Record<string, number>
    auto_reply_rate: number  // percentage
  }> {
    const timeframes = {
      today: new Date(Date.now() - 86400000).toISOString(),
      week: new Date(Date.now() - 604800000).toISOString(),
      month: new Date(Date.now() - 2592000000).toISOString()
    }

    const { data, error } = await this.supabase
      .from('leads')
      .select('status, source, first_reply_sent_at')
      .eq('org_id', this.orgId)
      .gte('created_at', timeframes[timeframe])

    if (error) throw error

    const stats = {
      total_leads: data.length,
      by_status: {} as Record<string, number>,
      by_source: {} as Record<string, number>,
      auto_reply_rate: 0
    }

    let autoReplies = 0

    data.forEach(lead => {
      stats.by_status[lead.status] = (stats.by_status[lead.status] || 0) + 1
      stats.by_source[lead.source] = (stats.by_source[lead.source] || 0) + 1
      if (lead.first_reply_sent_at) autoReplies++
    })

    stats.auto_reply_rate = data.length > 0 ? Math.round((autoReplies / data.length) * 100) : 0

    return stats
  }

  /**
   * Private helper: Email validation
   */
  private isValidEmail(email: string): boolean {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(email)
  }
}

export default LeadInboxSkill
