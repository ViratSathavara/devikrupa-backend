# 🚀 Devikrupa Electricals – Backend API

Production-ready backend APIs for **Devikrupa Electricals**, built with **Node.js, Express, TypeScript, Prisma v7, and Neon PostgreSQL**.
This backend powers the **Admin Panel**, **Product Catalog**, and **Customer Inquiry System**.

---

## 🧱 Tech Stack

* **Runtime:** Node.js
* **Framework:** Express.js
* **Language:** TypeScript
* **ORM:** Prisma v7
* **Database:** PostgreSQL (Neon – Free Tier)
* **Authentication:** JWT (Admin-based)
* **Password Hashing:** bcrypt
* **Dev Tooling:** ts-node-dev
* **API Testing:** Postman

---

## 📂 Project Structure

```
devikrupa-backend/
│
├── prisma/
│   └── schema.prisma
│
├── src/
│   ├── config/
│   │   └── env.ts
│   │
│   ├── controllers/
│   │   ├── admin.controller.ts
│   │   ├── adminAuth.controller.ts
│   │   ├── category.controller.ts
│   │   ├── product.controller.ts
│   │   └── inquiry.controller.ts
│   │
│   ├── middlewares/
│   │   └── admin.middleware.ts
│   │
│   ├── routes/
│   │   ├── admin.routes.ts
│   │   ├── adminAuth.routes.ts
│   │   ├── category.routes.ts
│   │   ├── product.routes.ts
│   │   └── inquiry.routes.ts
│   │
│   ├── types/
│   │   └── admin-request.ts
│   │
│   ├── utils/
│   │   └── seedAdmin.ts
│   │
│   ├── lib/
│   │   └── prisma.ts
│   │
│   └── index.ts
│
├── prisma.config.ts
├── tsconfig.json
├── package.json
└── .env
```

---

## 🔐 Authentication & Roles

### Default Super Admin (Auto-Seeded)

```
Email: admin@devikrupa.com
Password: AdminDE@1234
Role: SUPER_ADMIN
```

---

# 🔐 1. ADMIN AUTH

## ▶️ Admin Login

**POST**

```
{{base_url}}/api/admin/auth/login
```

### Body (JSON)

```json
{
  "email": "admin@devikrupa.com",
  "password": "AdminDE@1234"
}
```

### Tests (SAVE TOKEN AUTOMATICALLY)

```js
pm.environment.set("admin_token", pm.response.json().token);
```

---

# 👑 2. ADMIN MANAGEMENT

## ▶️ Create Admin (SUPER_ADMIN only)

**POST**

```
{{base_url}}/api/admins
```

### Headers

```
Authorization: Bearer {{admin_token}}
```

### Body

```json
{
  "name": "Product Manager",
  "email": "pm@devikrupa.com",
  "password": "Pm@1234",
  "role": "ADMIN"
}
```

---

## ▶️ Get All Admins

**GET**

```
{{base_url}}/api/admins
```

### Headers

```
Authorization: Bearer {{admin_token}}
```

---

## ▶️ Delete Admin

**DELETE**

```
{{base_url}}/api/admins/{{admin_id}}
```

### Headers

```
Authorization: Bearer {{admin_token}}
```

---

# 📂 3. CATEGORIES

## ▶️ Create Category

**POST**

```
{{base_url}}/api/categories
```

### Headers

```
Authorization: Bearer {{admin_token}}
```

### Body

```json
{
  "name": "LED Lights"
}
```

---

## ▶️ Get Categories

**GET**

```
{{base_url}}/api/categories
```

---

## ▶️ Delete Category

**DELETE**

```
{{base_url}}/api/categories/{{category_id}}
```

### Headers

```
Authorization: Bearer {{admin_token}}
```

---

# 📦 4. PRODUCTS

## ▶️ Create Product

**POST**

```
{{base_url}}/api/products
```

### Headers

```
Authorization: Bearer {{admin_token}}
```

### Body

```json
{
  "name": "Philips LED Bulb 9W",
  "description": "Energy efficient LED bulb",
  "price": 120,
  "categoryId": "{{category_id}}"
}
```

---

## ▶️ Get All Products

**GET**

```
{{base_url}}/api/products
```

---

## ▶️ Get Product By Slug

**GET**

```
{{base_url}}/api/products/philips-led-bulb-9w
```

---

## ▶️ Delete Product

**DELETE**

```
{{base_url}}/api/products/{{product_id}}
```

### Headers

```
Authorization: Bearer {{admin_token}}
```

---

# 📝 5. INQUIRIES

## ▶️ Create Inquiry (User)

**POST**

```
{{base_url}}/api/inquiries
```

### Body

```json
{
  "userId": "{{user_id}}",
  "productId": "{{product_id}}",
  "message": "I want bulk pricing for this product"
}
```

---

## ▶️ Get All Inquiries (Admin)

**GET**

```
{{base_url}}/api/inquiries
```

### Headers

```
Authorization: Bearer {{admin_token}}
```

---

## 🧪 Postman Setup (Recommended)

Create Postman environment variables:

| Key         | Value                                          |
| ----------- | ---------------------------------------------- |
| base_url    | [http://localhost:4000](http://localhost:4000) |
| admin_token | *(auto-saved after login)*                     |

Use:

```
{{base_url}}
```

---

## ✅ Key Features

* Role-based Admin authentication
* Secure JWT authorization
* Prisma v7 + Neon PostgreSQL
* Slug-based product URLs (SEO-friendly)
* Clean Express + TypeScript architecture
* Ready for Next.js frontend integration

---

## 🚀 Upcoming Enhancements

* Product Image Upload (Cloudinary)
* User Authentication (Customer login/signup)
* Admin Dashboard UI (Next.js)
* Pagination & Search
* Audit Logs

---

## 👨‍💻 Author

**Virat Sathavara**
Frontend & Full-Stack Developer
Project for **Devikrupa Electricals**

---