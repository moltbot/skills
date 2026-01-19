# MILKEE API v2 Endpoints Reference

**Official Documentation**: https://apidocs.milkee.ch/api

## Base URL
```
https://app.milkee.ch/api/v2/companies/{company_id}/{resource}
```

## Authentication
Header: `Authorization: Bearer USER_ID|API_KEY`

Example:
```
Authorization: Bearer 28014|MqF8I04nb2ZAc799c9d2
```

---

## Projects

### List Projects
```
GET /projects
```

### Create Project
```
POST /projects
{
  "name": "Website Redesign",
  "customer_id": 42,
  "project_type": "byHour",
  "budget": 8500,
  "hourly_rate": 150
}
```

### Update Project
```
PUT /projects/{id}
{
  "name": "string",
  "budget": decimal,
  "hourly_rate": decimal
}
```

---

## Customers

### List Customers
```
GET /customers
GET /customers?filter[name]=searchterm
```

### Create Customer
```
POST /customers
{
  "name": "Example Corp AG",
  "city": "Zurich",
  "address": "Main Street 123",
  "zip": "8000",
  "country": "Switzerland",
  "email": "contact@example.com"
}
```

### Update Customer
```
PUT /customers/{id}
{
  "name": "string",
  "city": "string",
  "address": "string"
}
```

---

## Time Entries

### List Times
```
GET /times
GET /times?filter[date]=2024-01-26
GET /times?filter[project_id]=123
```

### Create Time Entry
```
POST /times
{
  "project_id": 456,
  "date": "2024-01-26",
  "hours": 4,
  "minutes": 30,
  "description": "Implementation of database schema",
  "billable": true,
  "start": "09:00",
  "end": "13:30"
}
```

---

## Tasks

### List Tasks
```
GET /tasks
GET /tasks?filter[project_id]=123
```

### Create Task
```
POST /tasks
{
  "name": "Set up CI/CD pipeline",
  "project_id": 456,
  "description": "GitHub Actions workflow for automated testing",
  "status": "open"
}
```

### Update Task
```
PUT /tasks/{id}
{
  "name": "string",
  "status": "open|done"
}
```

---

## Products

### List Products
```
GET /products
```

### Create Product
```
POST /products
{
  "name": "Technical Consulting - Hourly",
  "price": 150,
  "description": "Professional software development consulting"
}
```

### Update Product
```
PUT /products/{id}
{
  "name": "string",
  "price": decimal
}
```

---

## Error Handling

### HTTP Status Codes
- `200`: Success
- `400`: Bad request
- `401`: Unauthorized (check token)
- `403`: Forbidden (check company_id)
- `404`: Not found (check resource id)
- `500`: Server error

### Error Response Format
```json
{
  "message": "Error description"
}
```

---

## Rate Limiting

- No documented rate limit in MILKEE API
- Recommended: Max 100 requests/minute
- Retry with exponential backoff on 500 errors

---

## Response Format

All successful responses follow:
```json
{
  "data": {
    "id": integer,
    "name": "string",
    ...
  }
}
```

For list endpoints:
```json
{
  "data": [
    {...},
    {...}
  ]
}
```
