# Visit Dzaleka API Documentation

## Base URL

```
https://visit.dzaleka.com/api
```

---

## Authentication

Developer API endpoints require an API key in the `Authorization` header and the scope listed for that endpoint. Dashboard/admin UI routes use browser session authentication only unless this document explicitly lists API key support.

```bash
curl -X GET "https://visit.dzaleka.com/api/bookings" \
  -H "Authorization: Bearer dvz_your_api_key_here"
```

### Getting an API Key

1. Log in as an admin at [visit.dzaleka.com](https://visit.dzaleka.com)
2. Navigate to **Developer Settings** in the sidebar
3. Click **Create API Key**
4. Select permissions (scopes) your application needs
5. Copy the key immediately - it won't be shown again!

### Supported API Key Routes

| Endpoint | Scope |
|----------|-------|
| `GET /api/bookings` | `bookings:read` |
| `GET /api/bookings/:id` | `bookings:read` |
| `GET /api/bookings/today` | `bookings:read` |
| `POST /api/bookings` | `bookings:write` |
| `PATCH /api/bookings/:id/status` | `bookings:write` |
| `GET /api/guides` | `guides:read` |
| `GET /api/guides/:id` | `guides:read` |
| `GET /api/guides/:id/availability` | `guides:read` |
| `GET /api/meeting-points` | `guides:read` |
| `GET /api/zones` | `guides:read` |

---

## Bookings

### List All Bookings

```http
GET /api/bookings
```

**Scope:** `bookings:read`

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | Filter by status: `pending`, `confirmed`, `cancelled`, `completed` |
| `startDate` | string | Filter bookings from this date (YYYY-MM-DD) |
| `endDate` | string | Filter bookings until this date (YYYY-MM-DD) |

**Response:**
```json
[
  {
    "id": "uuid-string",
    "bookingReference": "DVS-2024-ABC123",
    "visitorName": "John Doe",
    "visitorEmail": "john@example.com",
    "visitorPhone": "+265999123456",
    "visitDate": "2024-12-20",
    "visitTime": "10:00",
    "groupSize": "small_group",
    "numberOfPeople": 5,
    "tourType": "standard",
    "status": "confirmed",
    "totalAmount": 50000,
    "meetingPointId": "uuid",
    "paymentMethod": "cash",
    "paymentStatus": "pending",
    "referralSource": "social-media",
    "specialRequests": "Vegetarian meals please",
    "guideId": "uuid",
    "createdAt": "2024-12-15T12:00:00Z",
    "updatedAt": "2024-12-15T14:00:00Z"
  }
]
```

---

### Get Single Booking

```http
GET /api/bookings/:id
```

**Scope:** `bookings:read`

**Response:** Single booking object (same format as above)

---

### Create Booking

```http
POST /api/bookings
```

**Scope:** `bookings:write`

**Request Body:**
```json
{
  "visitorName": "John Doe",
  "visitorEmail": "john@example.com",
  "visitorPhone": "+265999123456",
  "visitDate": "2024-12-20",
  "visitTime": "10:00",
  "groupSize": "small_group",
  "numberOfPeople": 5,
  "tourType": "standard",
  "meetingPointId": "uuid",
  "paymentMethod": "cash",
  "referralSource": "website",
  "specialRequests": "Any special requirements"
}
```

**Required Fields:** `visitorName`, `visitorEmail`, `visitDate`, `groupSize`

**Response:**
```json
{
  "id": "uuid",
  "bookingReference": "DVS-2024-XYZ789",
  "status": "pending",
  "totalAmount": 25000,
  ...
}
```

---

### Update Booking

```http
PATCH /api/bookings/:id
```

**Scope:** `bookings:write`

**Request Body:** (partial update)
```json
{
  "status": "confirmed",
  "guideId": "uuid"
}
```

---

### Update Booking Status

```http
PATCH /api/bookings/:id/status
```

**Scope:** `bookings:write`

**Request Body:**
```json
{
  "status": "confirmed"
}
```

**Valid Statuses:** `pending`, `confirmed`, `cancelled`, `completed`, `no_show`

---

### Cancel Booking

```http
DELETE /api/bookings/:id
```

**Scope:** `bookings:write`

---

## Guides

### List All Guides

```http
GET /api/guides
```

**Scope:** `guides:read`

**Response:**
```json
[
  {
    "id": "uuid",
    "userId": "uuid",
    "firstName": "Grace",
    "lastName": "Mutale",
    "bio": "Expert guide with 5 years experience...",
    "profileImage": "https://...",
    "languages": ["English", "French", "Swahili"],
    "specialties": ["Cultural Tours", "Food Tours"],
    "rating": 4.9,
    "totalTours": 150,
    "status": "active",
    "isAvailable": true
  }
]
```

---

### Get Single Guide

```http
GET /api/guides/:id
```

**Scope:** `guides:read`

---

### Get Guide Availability

```http
GET /api/guides/:id/availability
```

**Scope:** `guides:read`

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `startDate` | string | Start of date range (YYYY-MM-DD) |
| `endDate` | string | End of date range (YYYY-MM-DD) |

---

## Meeting Points

### List Meeting Points

```http
GET /api/meeting-points
```

**Scope:** `guides:read`

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Main Gate",
    "description": "Primary entrance to Dzaleka camp",
    "location": "GPS coordinates",
    "isActive": true
  }
]
```

---

## Zones

### List Zones

```http
GET /api/zones
```

**Scope:** `guides:read`

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Market Area",
    "description": "Vibrant marketplace with local vendors",
    "riskLevel": "low",
    "isActive": true
  }
]
```

---

## Analytics

Analytics endpoints are currently dashboard/session-only and are not part of the public developer API.

---

## Webhooks

Webhooks allow your application to receive real-time HTTP POST notifications when key events occur on the Visit Dzaleka platform.

### Configuring Webhooks

1. Log in as an admin at [visit.dzaleka.com](https://visit.dzaleka.com)
2. Go to **Developer Settings** > **Webhooks**
3. Click **Add Endpoint** and enter your payload URL (must use HTTPS)
4. Choose the events you want to subscribe to and save
5. Copy the generated **Signing Secret** to verify payloads in your app

### Active Webhook Events

| Event | Description |
|-------|-------------|
| `booking.created` | Dispatched when a booking request is first submitted |
| `booking.updated` | Dispatched when a booking is confirmed, cancelled, checked-in, or completed |
| `incident.reported` | Dispatched when a new security checkpoint incident is reported |

### Webhook Delivery Format

The system sends webhooks as POST requests with a JSON body:

```json
{
  "event": "booking.created",
  "timestamp": "2026-05-25T12:00:00.000Z",
  "data": {
    "id": "uuid-string",
    "bookingReference": "DVS-2026-ABC123",
    "visitorName": "John Doe",
    "visitDate": "2026-05-30",
    "status": "pending"
  }
}
```

### Signature Verification

To prevent replay attacks and ensure payloads originate from Visit Dzaleka, each webhook carries signature headers:

- `X-Dzaleka-Timestamp`: The Unix epoch timestamp (in seconds) of when the dispatch was initiated.
- `X-Dzaleka-Signature`: The HMAC-SHA256 signature of the payload.

#### How to Validate:

1. Extract the `X-Dzaleka-Timestamp` and `X-Dzaleka-Signature` headers.
2. Verify that the timestamp is recent (e.g., within 5 minutes) to avoid replay attacks.
3. Construct the signature payload by concatenating the timestamp, a dot `.`, and the raw request body payload string:
   ```
   signature_payload = timestamp + "." + raw_request_body_string
   ```
4. Compute the HMAC-SHA256 hash of the signature payload using your endpoint's signing secret as the key.
5. Use a timing-safe string comparison to verify that your computed signature matches the value in the `X-Dzaleka-Signature` header.

Example (Node.js/Express):
```javascript
const crypto = require('crypto');

app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const timestamp = req.headers['x-dzaleka-timestamp'];
  const signature = req.headers['x-dzaleka-signature'];
  const secret = process.env.WEBHOOK_SECRET; // whsec_...

  const computedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${req.body}`)
    .digest('hex');

  if (crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(computedSignature))) {
    // Verified! Process the event
    res.status(200).send('OK');
  } else {
    res.status(400).send('Invalid signature');
  }
});
```

### Retries & Failures

If your endpoint returns a non-2xx status code or times out (after 10 seconds), the delivery log is marked as `failed`. Admins can inspect logs and trigger manual retries via the Developer Settings dashboard.

---

## Embed Widgets

### Booking Widget

Embed a booking form on your website:

```html
<iframe 
  src="https://visit.dzaleka.com/embed/booking?theme=light&primaryColor=%23f97316"
  width="100%" 
  height="600"
  frameborder="0"
  style="border-radius: 8px;"
></iframe>
```

**URL Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `theme` | string | `light` | `light` or `dark` |
| `primaryColor` | string | `#f97316` | Hex color (URL encoded) |
| `defaultTourType` | string | `individual` | `individual`, `small_group`, `large_group` |
| `showBranding` | boolean | `true` | Show "Powered by Visit Dzaleka" |

---

## Rate Limits

- **100 requests per minute** per API key
- Rate limit headers included in response:
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Requests remaining in window
  - `X-RateLimit-Reset`: Unix timestamp when limit resets

---

## Error Responses

All errors return JSON with `error` and `message` fields:

```json
{
  "error": "Unauthorized",
  "message": "Invalid or expired API key"
}
```

### HTTP Status Codes

| Status | Meaning |
|--------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Invalid parameters |
| 401 | Unauthorized - Missing/invalid API key |
| 403 | Forbidden - Insufficient scope |
| 404 | Not Found |
| 422 | Unprocessable Entity - Validation error |
| 429 | Too Many Requests - Rate limited |
| 500 | Internal Server Error |

---

## Scopes Reference

| Scope | Access Level |
|-------|-------------|
| `bookings:read` | View all bookings |
| `bookings:write` | Create, update, and cancel bookings |
| `guides:read` | View guide profiles and availability |
| `guides:write` | Reserved for future guide-management endpoints |
| `analytics:read` | Reserved for future analytics API endpoints |
| `webhooks:manage` | Reserved for future webhook subscriptions |

---

## SDKs & Libraries

Coming soon:
- JavaScript/TypeScript SDK
- Python SDK
- PHP SDK

---

## Support

For API support, contact: [api@mail.dzaleka.com](mailto:api@mail.dzaleka.com)

Report issues: [GitHub Issues](https://github.com/Dzaleka-Connect/Visit-Dzaleka/issues)
