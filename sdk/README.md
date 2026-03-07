# Devikrupa Frontend SDK

Use this SDK in your frontend instead of calling REST endpoints directly.

## 1) Setup

Copy the `sdk/` folder into your frontend project (or import it from this repo if your setup supports workspace imports).

## 2) Create client

```ts
import { createDevikrupaSdk } from "./sdk";

export const sdk = createDevikrupaSdk({
  baseUrl: "http://localhost:4000",
  getUserToken: () => localStorage.getItem("token"),
  getAdminToken: () => localStorage.getItem("adminToken"),
});
```

`baseUrl` should be only host + port/domain. API prefix defaults to `/api`.

## 3) Usage examples

```ts
// Products
const products = await sdk.products.list({ search: "motor" });
const oneProduct = await sdk.products.getBySlug("kirloskar-pump");

// User auth
const login = await sdk.auth.login({
  email: "user@example.com",
  password: "secret",
});

// Favorites (user token required)
await sdk.favorites.add("product-id");
const favorites = await sdk.favorites.list();

// Admin login + admin protected route
await sdk.adminAuth.login({ email: "admin@example.com", password: "secret" });
const dashboard = await sdk.admins.dashboardCards();
```

## 4) Modules included

- `auth`
- `adminAuth`
- `products`
- `categories`
- `admins`
- `inquiries`
- `serviceInquiries`
- `favorites`
- `testimonials`
- `upload`
- `pageSettings`
- `chat`
- `ai`
- `translations`

All methods throw `ApiError` for non-2xx responses.

