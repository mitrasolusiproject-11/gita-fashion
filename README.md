# 🏪 Gita Fashion - Modern POS System

[![Next.js](https://img.shields.io/badge/Next.js-16.0-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue?logo=docker)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

Sistem Point of Sale (POS) modern yang dibangun dengan Next.js 16, TypeScript, dan SQLite. Dirancang khusus untuk toko fashion dengan fitur lengkap dan user-friendly.

## ✨ **Fitur Utama**

### 💰 **Point of Sale**
- Interface kasir yang intuitif dan cepat
- Support barcode scanner
- Multiple payment methods (Cash, Transfer, Mixed)
- Real-time stock updates
- Thermal receipt printing (58mm/80mm)

### 📦 **Manajemen Produk**
- CRUD produk lengkap dengan kategori
- Barcode generator dan batch printing
- Stock management dengan alert stok rendah
- Bulk import produk via CSV
- Product search dan filtering

### 📊 **Laporan & Analytics**
- Dashboard analytics real-time
- Laporan penjualan per periode
- Laporan stok dan inventory
- Shift management untuk kasir
- Export data ke CSV/JSON

### 👥 **User Management**
- Multi-role system (Admin, Manager, Cashier)
- Secure authentication dengan session
- User CRUD (Admin only)
- Change password functionality
- Activity logging

### 🖨️ **Sistem Cetak**
- Thermal printer support (58mm/80mm)
- Batch barcode printing
- Customizable receipt templates
- Print preview functionality

### ⚙️ **Pengaturan**
- Store settings (nama, alamat, kontak)
- Logo upload custom
- Printer configuration
- Database backup/restore
- System settings

### 📱 **Progressive Web App**
- Mobile responsive design
- Offline support (limited)
- App-like experience
- Fast loading dengan caching

## 🛠️ **Tech Stack**

### **Frontend**
- **Next.js 16** - React framework dengan Turbopack
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Modern UI components
- **Lucide React** - Beautiful icons

### **Backend**
- **Next.js API Routes** - Serverless API endpoints
- **Drizzle ORM** - Type-safe database operations
- **SQLite** - Lightweight database
- **bcryptjs** - Password hashing
- **Session-based Auth** - Secure authentication

### **DevOps**
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **Nginx** - Reverse proxy dan load balancer
- **Let's Encrypt** - SSL certificates

## 🚀 **Quick Start**

### **Development**

1. **Clone repository:**
```bash
git clone <repository-url>
cd gita-fashion
```

2. **Install dependencies:**
```bash
npm install
```

3. **Setup environment:**
```bash
cp .env.example .env
# Edit .env dengan konfigurasi yang sesuai
```

4. **Run development server:**
```bash
npm run dev
```

5. **Access application:**
```
http://localhost:3000
```

### **Default Login**
- **Email**: `admin@gitafashion.com`
- **Password**: `admin123`

## 🐳 **Production Deployment**

### **Docker Deployment**

1. **Setup production environment:**
```bash
cp .env.production.example .env.production
# Edit .env.production dengan konfigurasi production
```

2. **Build dan deploy:**
```bash
# Build images
docker compose -f docker-compose.production.yml build

# Start services
docker compose -f docker-compose.production.yml up -d
```

3. **Verify deployment:**
```bash
# Check container status
docker compose -f docker-compose.production.yml ps

# Check logs
docker compose -f docker-compose.production.yml logs -f
```

### **VPS Deployment**

Untuk panduan lengkap deployment ke VPS, lihat: **[VPS_DEPLOYMENT_GUIDE.md](VPS_DEPLOYMENT_GUIDE.md)**

## 📁 **Project Structure**

```
gita-fashion/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API endpoints
│   │   ├── dashboard/         # Dashboard pages
│   │   └── login/            # Authentication
│   ├── components/           # React components
│   │   ├── ui/              # Base UI components
│   │   └── [feature]/       # Feature components
│   └── lib/                 # Utilities & config
├── public/                  # Static assets
├── scripts/                # Deployment scripts
├── drizzle/               # Database migrations
├── Dockerfile            # Docker configuration
├── docker-compose.yml   # Docker Compose
└── nginx.conf          # Nginx configuration
```

## 🔧 **Available Scripts**

### **Development**
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### **Database**
```bash
npm run db:generate  # Generate migrations
npm run db:migrate   # Run migrations
npm run db:studio    # Open Drizzle Studio
```

### **Production Scripts**
```bash
./scripts/deploy.sh     # Deploy application
./scripts/monitor.sh    # Monitor system
./scripts/backup.sh     # Backup data
```

## 📊 **System Requirements**

### **Development**
- Node.js 18+
- npm atau yarn
- 4GB RAM minimum
- 10GB storage

### **Production**
- VPS dengan 2GB RAM (recommended 4GB)
- 20GB SSD storage
- Ubuntu 20.04+ atau CentOS 8+
- Docker dan Docker Compose

## 🔐 **Security Features**

- **Password Hashing**: bcrypt dengan salt rounds 10
- **Session Management**: Secure session-based auth
- **Role-based Access**: Admin, Manager, Cashier roles
- **Input Validation**: Client dan server-side validation
- **CSRF Protection**: Built-in Next.js protection
- **SQL Injection Prevention**: Drizzle ORM protection
- **XSS Protection**: React built-in protection

## 📚 **Documentation**

- **[FINAL_DOCUMENTATION.md](FINAL_DOCUMENTATION.md)** - Dokumentasi lengkap aplikasi
- **[VPS_DEPLOYMENT_GUIDE.md](VPS_DEPLOYMENT_GUIDE.md)** - Panduan deployment ke VPS
- **[CHANGE_PASSWORD_FEATURE.md](CHANGE_PASSWORD_FEATURE.md)** - Dokumentasi fitur ubah password
- **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Panduan troubleshooting dan problem solving

## 🧪 **Testing**

### **Manual Testing Checklist**
- ✅ Login/Logout functionality
- ✅ POS transactions (cash, transfer, mixed)
- ✅ Product management (CRUD)
- ✅ Barcode generation dan printing
- ✅ Stock management
- ✅ User management (Admin)
- ✅ Reports dan analytics
- ✅ Backup/Restore
- ✅ Mobile responsiveness

## 🔄 **Backup & Recovery**

### **Automated Backup**
```bash
# Daily backup (setup via cron)
./scripts/backup.sh full

# Database only
./scripts/backup.sh database

# List backups
./scripts/backup.sh list
```

### **Restore**
```bash
# Restore from backup
./scripts/backup.sh restore /path/to/backup.tar.gz
```

## 📈 **Performance**

- **First Load**: < 2 seconds
- **Page Transitions**: < 500ms
- **Database Queries**: < 100ms average
- **Bundle Size**: < 1MB gzipped

## 🤝 **Contributing**

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📞 **Support**

Untuk bantuan dan support:
- **Issues**: [GitHub Issues](https://github.com/yourusername/gita-fashion/issues)
- **Documentation**: Lihat folder dokumentasi
- **Email**: support@gitafashion.com

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 **Acknowledgments**

- [Next.js](https://nextjs.org/) - React framework
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [Drizzle ORM](https://orm.drizzle.team/) - Database ORM
- [Lucide](https://lucide.dev/) - Icons

---

**🚀 Gita Fashion POS - Ready for Production!**

*Sistem POS modern yang powerful, secure, dan user-friendly untuk bisnis fashion Anda.*