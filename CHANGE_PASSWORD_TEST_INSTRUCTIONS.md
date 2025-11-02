# 🧪 Instruksi Testing Fitur Ubah Password

## 📋 **Langkah-langkah Testing**

### **1. Persiapan Testing**
```bash
# Pastikan server berjalan
npm run dev

# Buka browser dan akses aplikasi
http://localhost:3000
```

### **2. Login ke Aplikasi**
1. **Buka halaman login**: `http://localhost:3000/login`
2. **Masukkan kredensial default**:
   - Email: `admin@gitafashion.com`
   - Password: `admin123`
3. **Klik "Masuk"**
4. **Verifikasi login berhasil** - Anda akan diarahkan ke dashboard

### **3. Akses Halaman Settings**
1. **Klik menu "Settings"** di sidebar
2. **Atau akses langsung**: `http://localhost:3000/dashboard/settings`
3. **Pastikan halaman settings terbuka** dengan berbagai card pengaturan

### **4. Test Fitur Ubah Password**
1. **Cari section "User Profile"** di halaman settings
2. **Klik tombol "Ubah Password"** (warna outline/border)
3. **Verifikasi dialog terbuka** dengan form ubah password

### **5. Test Dialog Functionality**
1. **Periksa form fields**:
   - ✅ Password Lama (dengan toggle show/hide)
   - ✅ Password Baru (dengan toggle show/hide)  
   - ✅ Konfirmasi Password Baru (dengan toggle show/hide)
2. **Test toggle password visibility** - Klik icon mata untuk show/hide
3. **Test form validation**:
   - Submit form kosong → Error: "Semua field harus diisi"
   - Password baru < 6 karakter → Error: "Password baru minimal 6 karakter"
   - Konfirmasi tidak cocok → Error: "Konfirmasi password tidak sesuai"

### **6. Test Password Change**
1. **Isi form dengan data valid**:
   - Password Lama: `admin123`
   - Password Baru: `newpass123`
   - Konfirmasi: `newpass123`
2. **Klik "Ubah Password"**
3. **Periksa response**:
   - ✅ Success: "Password berhasil diubah!" (hijau)
   - ❌ Error: Pesan error yang sesuai (merah)

### **7. Verifikasi Password Berubah**
1. **Logout dari aplikasi**
2. **Login dengan password baru**: `newpass123`
3. **Verifikasi login berhasil**

---

## 🔍 **Debugging & Troubleshooting**

### **Browser Console Debugging**
1. **Buka Developer Tools** (F12)
2. **Pergi ke tab Console**
3. **Cari log messages**:
   ```
   🔐 Change password button clicked
   🔐 Dialog state changed: true
   🔐 Change password form submitted
   🔐 Sending change password request...
   🔐 Change password response status: 200
   🔐 Change password success: {...}
   ```

### **Network Tab Debugging**
1. **Buka tab Network** di Developer Tools
2. **Klik "Ubah Password"** dan submit form
3. **Cari request ke** `/api/auth/change-password`
4. **Periksa response**:
   - Status: 200 (Success) atau 400/401 (Error)
   - Response body: JSON dengan success/error message

### **Common Issues & Solutions**

#### **Issue 1: Dialog Tidak Terbuka**
- **Symptoms**: Klik tombol tidak ada response
- **Check**: Browser console untuk error JavaScript
- **Solution**: Refresh halaman, clear browser cache

#### **Issue 2: API Error 401 (Unauthorized)**
- **Symptoms**: Error "Sesi Anda telah berakhir"
- **Check**: User masih login dengan benar
- **Solution**: Logout dan login ulang

#### **Issue 3: API Error 400 (Bad Request)**
- **Symptoms**: Error validation dari server
- **Check**: Password lama benar, password baru valid
- **Solution**: Periksa input dan coba lagi

#### **Issue 4: Network Error**
- **Symptoms**: "Terjadi kesalahan saat mengubah password"
- **Check**: Server masih berjalan, koneksi internet
- **Solution**: Restart server, periksa koneksi

---

## ✅ **Expected Results**

### **Successful Test Flow:**
1. ✅ Login berhasil dengan `admin@gitafashion.com` / `admin123`
2. ✅ Halaman settings dapat diakses
3. ✅ Tombol "Ubah Password" terlihat dan dapat diklik
4. ✅ Dialog ubah password terbuka dengan form lengkap
5. ✅ Form validation bekerja dengan benar
6. ✅ Password dapat diubah dengan sukses
7. ✅ Login dengan password baru berhasil

### **Console Logs (Success):**
```
🔐 Change password button clicked
🔐 Dialog state changed: true
🔐 Change password form submitted
🔐 Sending change password request...
🔐 Change password response status: 200
🔐 Change password success: {success: true, message: "Password berhasil diubah"}
```

### **Network Request (Success):**
```
POST /api/auth/change-password
Status: 200 OK
Response: {
  "success": true,
  "message": "Password berhasil diubah"
}
```

---

## 🚨 **If Feature Still Not Working**

### **Quick Fixes:**
1. **Hard refresh browser**: Ctrl+F5 atau Cmd+Shift+R
2. **Clear browser cache**: Settings → Clear browsing data
3. **Try incognito/private mode**
4. **Restart development server**: Stop (Ctrl+C) dan `npm run dev`

### **Verify Files Exist:**
```bash
# Check component exists
ls -la src/components/settings/change-password-dialog.tsx

# Check API endpoint exists  
ls -la src/app/api/auth/change-password/route.ts

# Check settings page imports
grep -n "ChangePasswordDialog" src/app/dashboard/settings/page.tsx
```

### **Manual API Test:**
```bash
# Test API directly (after login)
curl -X POST http://localhost:3000/api/auth/change-password \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{"currentPassword":"admin123","newPassword":"newpass123"}'
```

---

**💡 Fitur ubah password sudah diimplementasikan dengan lengkap. Jika masih ada masalah, kemungkinan besar adalah masalah browser cache atau session authentication.**