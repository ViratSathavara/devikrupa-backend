# Devikrupa Backend SDK Contract

This backend exposes REST APIs under the base path:

- `http://localhost:4000/api` (local)
- `https://api.devikrupaelectricals.in/api` (production)

## 1. SDK-Oriented API Rules

The frontend SDK clients are built around these backend conventions:

1. Base URL always includes `/api`.
2. Auth header: `Authorization: Bearer <token>`.
3. Language header: `x-language: en | gu`.
4. JSON for all standard endpoints.
5. File upload uses `multipart/form-data` on `/upload/image`.
6. CORS allows localhost, private network hosts, and configured domains.

## 2. Route Groups (SDK Resources)

These route groups map directly to frontend SDK modules.

### Public/User

- `POST /auth/signup`
- `POST /auth/login`
- `GET /products`
- `GET /products/:slug`
- `GET /categories`
- `POST /inquiries`
- `GET /inquiries/my-inquiries`
- `POST /service-inquiries`
- `GET /service-inquiries/my-inquiries`
- `POST /favorites`
- `DELETE /favorites/:productId`
- `GET /favorites`
- `GET /testimonials`
- `POST /testimonials`
- `POST /chat/conversations`
- `GET /chat/conversations/my`
- `GET /chat/conversations/:conversationId/messages`
- `POST /chat/conversations/:conversationId/messages`
- `PATCH /chat/conversations/:conversationId/read`
- `POST /ai/chat`
- `POST /page-settings/check`

### Admin

- `POST /admin/auth/login`
- `GET /admins`
- `GET /admins/:id`
- `POST /admins`
- `PATCH /admins/:id`
- `DELETE /admins/:id`
- `GET /admins/dashboard/cards`
- `POST /products`
- `PATCH /products/:id`
- `PATCH /products/:id/stock`
- `DELETE /products/:id`
- `POST /categories`
- `PUT /categories/:id`
- `DELETE /categories/:id`
- `GET /inquiries/all`
- `PATCH /inquiries/:id/status`
- `GET /service-inquiries/all`
- `PATCH /service-inquiries/:id/status`
- `GET /page-settings`
- `PATCH /page-settings/:id`
- `DELETE /testimonials/:id`
- `GET /chat/admin/conversations`
- `GET /chat/admin/conversations/:conversationId/messages`
- `POST /chat/admin/conversations/:conversationId/messages`
- `PATCH /chat/admin/conversations/:conversationId/read`
- `PATCH /chat/admin/conversations/:conversationId/close`
- `PATCH /chat/admin/conversations/:conversationId/reopen`
- `POST /chat/admin/conversations/:conversationId/convert-to-inquiry`
- Translation module endpoints under `/translations/*`

## 3. Error Contract

Controllers typically return:

- `4xx`: `{ message: string }`
- `5xx`: `{ message: "Internal server error" }`

SDK clients should read:

1. `error.response?.data?.message` if available.
2. fallback generic message if unavailable.

## 4. SDK Compatibility Guidance

When adding backend APIs, keep SDK compatibility by following:

1. Keep base path under `/api`.
2. Keep route grouping consistent with resource name.
3. Return stable field names in JSON.
4. Prefer additive changes over breaking shape changes.
5. Document new endpoints in this file and corresponding frontend SDK module.

## 5. Recommended Next Step

If you want fully generated SDKs, add OpenAPI spec generation (Swagger) and generate typed clients from spec. Current setup is manually typed SDK modules aligned to backend routes.
