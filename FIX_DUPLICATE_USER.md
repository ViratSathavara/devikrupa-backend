# Fix Duplicate User Error (409 Conflict)

## 🔧 Quick Fix Commands

### Option 1: Delete All Test Users (Recommended)
```bash
cd devikrupa-backend
npm run cleanup-test-users
```

This will delete all users with emails containing "test" or "example".

### Option 2: Delete Specific User
```bash
cd devikrupa-backend
npm run delete-user test@example.com
```

Replace `test@example.com` with the actual email.

### Option 3: List All Users
```bash
cd devikrupa-backend
npm run list-users
```

This shows all registered users so you can see what's in the database.

---

## 🚀 After Cleanup

Try signup again with any email:

```bash
curl -X POST https://devikrupa-backend.onrender.com/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "Strong@Pass123",
    "phone": "9876543210"
  }'
```

Should now return **201 Created** with tokens! ✅

---

## 📝 What Changed

1. **Better Error Message**: Now shows which email already exists
2. **Cleanup Scripts**: Easy commands to manage test users
3. **List Users**: See what's in the database

---

## 🎯 Usage Examples

### Clean up before testing
```bash
npm run cleanup-test-users
```

### Check what users exist
```bash
npm run list-users
```

### Delete specific user
```bash
npm run delete-user john@example.com
```

---

## ✅ Verification

After running cleanup:
1. Run `npm run list-users` - should show fewer/no users
2. Try signup again - should work!
3. Check logs in `logs/combined.log` for confirmation

---

## 🔒 Production Note

In production, you DON'T want to delete users. The 409 error is correct behavior when someone tries to register with an existing email. These scripts are for development/testing only.
