# Lead Inbox Automator - Clawd Skill

Central Lead Management mit automatischer Erstreaktion. Speichert Leads in Supabase, triggert Make.com Automation für Auto-Reply Emails.

## Features

- **Lead Capture**: Erfasse Leads aus Clawd-Konversationen
- **Auto-Reply Automation**: Integriert mit Make.com für automatische Antworten
- **Status Tracking**: new → replied → qualified → won/lost
- **Multi-Org Support**: Datenisolation via RLS
- **Konversationsverlauf**: Vollständige Kommunikationshistorie
- **Deduplication**: Automatische Erkennung von Duplikaten (24h)

## Installation

```bash
npx clawdhub@latest install lead-inbox-automator
```

## Konfiguration

Benötigte Umgebungsvariablen:

```bash
SUPABASE_URL=https://dein-projekt.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # Service Role, nicht Anon Key!
ORG_ID=550e8400-e29b-41d4-a716-446655440000  # Deine Org UUID
```

## Schnellstart

```typescript
import LeadSkill from 'lead-inbox-automator'

const leadSystem = new LeadSkill({
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  orgId: process.env.ORG_ID,
  defaultPriority: 'high'
})

// 1. Lead aus Konversation erstellen
const result = await leadSystem.createLead({
  email: user.email,
  name: user.name,
  source: 'clawd_chat',
  custom_fields: {
    initial_request: user.message,
    product_interest: 'saas_basic'
  }
})

// 2. Status prüfen (nach 2 Minuten)
const status = await leadSystem.getAutomationStatus(result.lead_id)
if (!status.automation_ok) {
  console.error('Automation hat nicht getriggert!')
}

// 3. Lead qualifizieren
await leadSystem.updateStatus(result.lead_id, 'qualified', 'Kunde hat Budget bestätigt')
```

## Methoden

### createLead(input)
Erstellt neuen Lead und triggered Automation.

```typescript
const lead = await leadSystem.createLead({
  email: "max@firma.de",
  name: "Max Mustermann",
  phone: "+49 123 456",
  source: "landing_page",
  priority: "high",
  custom_fields: { campaign: "summer_2024" }
})
// Return: { success, lead_id, status, automation_triggered, message }
```

### getLead(id)
Holt Lead inkl. Konversationen.

```typescript
const lead = await leadSystem.getLead('uuid-hier')
// lead.conversations[], lead.reply_pending
```

### listLeads(filters)
Liste mit Filterung.

```typescript
const { leads, count } = await leadSystem.listLeads({
  status: 'new',
  priority: 'high',
  limit: 10
})
```

### updateStatus(id, status, notes)
Status-Update während Konversation.

```typescript
await leadSystem.updateStatus('uuid', 'qualified', 'Hat Interesse bestätigt')
```

### addConversation(leadId, content, subject)
Manuelle Nachricht hinzufügen.

```typescript
await leadSystem.addConversation(
  'uuid',
  'Hier ist die Information die Sie angefordert haben...',
  'Details zu unserem Produkt'
)
```

### getAutomationStatus(leadId)
Prüft ob Auto-Reply gesendet wurde.

```typescript
const status = await leadSystem.getAutomationStatus('uuid')
// { auto_reply_sent, minutes_since_creation, automation_ok }
```

## Datenbank Schema

Voraussetzung: Supabase Tabellen (siehe Hauptsystem-Doku)

- `leads` - Haupttabelle
- `conversations` - Nachrichtenverlauf
- `orgs` - Mandantenisolation

## Automation Flow

```
Clawd Agent → createLead() → Supabase (status: new)
                                   ↓
                            Make.com Webhook (realtime)
                                   ↓
                        Resend Email API
                                   ↓
                        Supabase Update (status: replied)
                                   ↓
                        Next.js Dashboard (sichtbar)
```

## Error Handling

```typescript
try {
  await leadSystem.createLead({ email: 'ungültig' })
} catch (err) {
  // "Invalid email format" oder "Lead creation failed: ..."
}
```

## Best Practices

1. **Immer checken**: Nutze `leadExists()` vor `createLead()` wenn du keine Duplikate willst
2. **Polling**: Warte 60-120 Sekunden dann `getAutomationStatus()` prüfen
3. **Qualifizierung**: Setze Status auf 'qualified' sobald der Kunde ernsthaftes Interesse zeigt
4. **Konversationen**: Logge alle Agent-Antworten mit `addConversation()`

## Support

Bei Problemen mit Auto-Reply:
1. Supabase → logs prüfen
2. Make.com → Scenario execution history
3. Resend → Delivery logs

## Lizenz

MIT
