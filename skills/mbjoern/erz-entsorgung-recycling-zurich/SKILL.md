---
name: openerz
description: Abfuhrkalender für Zürich via OpenERZ API. Nutze bei Fragen zu Kehricht, Karton, Papier, Grüngut, Sonderabfall oder Entsorgungsterminen im Raum Zürich.
---

# OpenERZ – Abfuhrkalender Zürich

API für Entsorgungstermine in Zürich.

## Benutzer-Defaults

- Region: `zurich`
- Area/PLZ: `8003`

## API-Endpunkt

```
https://openerz.metaodi.ch/api/calendar
```

## Parameter

| Parameter | Beschreibung | Beispiel |
|-----------|--------------|----------|
| `region` | Region (immer `zurich` für Stadt Zürich) | `zurich` |
| `area` | PLZ oder Gebiet | `8003` |
| `types` | Komma-separiert: waste, cardboard, paper, organic, special, mobile, incombustibles, chipping, metal, etram, cargotram, textile | `paper,cardboard` |
| `start` | Startdatum (YYYY-MM-DD) | `2026-01-14` |
| `end` | Enddatum (YYYY-MM-DD) | `2026-01-31` |
| `sort` | Sortierung (date, -date) | `date` |
| `limit` | Max. Anzahl Ergebnisse | `10` |

## Abfalltypen

| Typ | Beschreibung |
|-----|--------------|
| `waste` | Kehricht |
| `cardboard` | Karton |
| `paper` | Papier |
| `organic` | Grüngut/Bioabfall |
| `special` | Sonderabfall (Sammelstelle) |
| `mobile` | Mobile Sondersammlung |
| `incombustibles` | Unbrennbares |
| `chipping` | Häckselservice |
| `metal` | Altmetall |
| `etram` | E-Tram |
| `cargotram` | Cargo-Tram |
| `textile` | Textilien |

## Beispielanfragen

Nächste Abholungen:
```bash
curl "https://openerz.metaodi.ch/api/calendar?region=zurich&area=8003&start=$(date +%Y-%m-%d)&limit=5&sort=date"
```

Nur Papier/Karton:
```bash
curl "https://openerz.metaodi.ch/api/calendar?region=zurich&area=8003&types=paper,cardboard&start=$(date +%Y-%m-%d)&limit=5"
```

## Antwortformat

```json
{
  "_metadata": {"total_count": 5, "row_count": 5},
  "result": [
    {
      "date": "2026-01-15",
      "waste_type": "waste",
      "zip": 8003,
      "area": "8003",
      "station": "",
      "region": "zurich",
      "description": ""
    }
  ]
}
```

Bei `mobile` oder `special` enthält `station` den Sammelort.
