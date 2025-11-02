# 🔧 Troubleshooting Guide - Gita Fashion POS

## 🚨 **Common Issues & Solutions**

### **1. JSON Parsing Error: "Unexpected token '<', "<!DOCTYPE "... is not valid JSON"**

#### **Symptoms:**
- Console error showing JSON parsing failure
- API calls returning HTML instead of JSON
- Application not loading data properly

#### **Causes:**
- API endpoints returning 404 errors (HTML error pages)
- Server routing issues after configuration changes
- Authentication redirects to login page

#### **Solutions:**

**A. Check API Endpoint Status:**
```bash
# Test API endpoint
curl -I http://localhost:3000/api/dashboard

# Should return 401 (Unauthorized) not 404 (Not Found)
```

**B. Restart Development Server:**
```bash
# Stop current server (Ctrl+C)
# Then restart
npm run dev
```

**C. Clear Next.js Cache:**
```bash
# Remove .next directory
rm -rf .next

# Restart server
npm run dev
```

**D. Check Authentication:**
- Ensure user is logged in
- Check session validity
- Verify API authentication middleware

#### **Prevention:**
- Always check API response status before parsing JSON
- Implement proper error handling in frontend
- Use try-catch blocks for API calls

---

### **2. Database Connection Issues**

#### **Symptoms:**
- "Database is locked" errors
- Connection timeout errors
- Data not saving/loading

#### **Solutions:**

**A. Check Database File:**
```bash
# Verify database exists
ls -la sqlite.db

# Check file permissions
chmod 664 sqlite.db
```

**B. Restart Application:**
```bash
# Stop all processes using database
pkill -f "node.*next"

# Restart server
npm run dev
```

**C. Database Recovery:**
```bash
# Backup current database
cp sqlite.db sqlite.db.backup

# If corrupted, restore from backup
cp backup/sqlite_YYYYMMDD.db sqlite.db
```

---

### **3. Port Already in Use**

#### **Symptoms:**
- "Port 3000 is already in use"
- Server fails to start
- Connection refused errors

#### **Solutions:**

**A. Kill Process Using Port:**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

**B. Use Different Port:**
```bash
# Start on different port
npm run dev -- -p 3001
```

---

### **4. Docker Deployment Issues**

#### **Symptoms:**
- Container fails to start
- Database not accessible
- Permission denied errors

#### **Solutions:**

**A. Check Container Logs:**
```bash
docker-compose -f docker-compose.production.yml logs gita-fashion
```

**B. Fix Permissions:**
```bash
# Fix data directory permissions
sudo chown -R 1001:1001 data/
```

**C. Rebuild Containers:**
```bash
docker-compose -f docker-compose.production.yml down
docker-compose -f docker-compose.production.yml up --build -d
```

---

### **5. SSL Certificate Issues**

#### **Symptoms:**
- "Certificate not valid" warnings
- HTTPS not working
- Mixed content errors

#### **Solutions:**

**A. Renew Certificate:**
```bash
sudo certbot renew --force-renewal
sudo systemctl reload nginx
```

**B. Check Certificate Status:**
```bash
sudo certbot certificates
openssl x509 -in /etc/letsencrypt/live/domain.com/cert.pem -text -noout
```

---

### **6. Performance Issues**

#### **Symptoms:**
- Slow page loading
- High memory usage
- Database queries taking too long

#### **Solutions:**

**A. Monitor Resources:**
```bash
# Check system resources
htop
df -h
free -m

# Check Docker stats
docker stats
```

**B. Optimize Database:**
```bash
# Vacuum SQLite database
sqlite3 sqlite.db "VACUUM;"
```

**C. Clear Caches:**
```bash
# Clear Next.js cache
rm -rf .next

# Clear Docker cache
docker system prune -a
```

---

### **7. Authentication Issues**

#### **Symptoms:**
- Cannot login with correct credentials
- Session expires immediately
- Unauthorized errors

#### **Solutions:**

**A. Check Environment Variables:**
```bash
# Verify NEXTAUTH_SECRET is set
echo $NEXTAUTH_SECRET

# Should be at least 32 characters
```

**B. Reset Admin Password:**
```bash
# Use database tool to reset password
# Or restore from backup with known credentials
```

**C. Clear Browser Data:**
- Clear cookies and local storage
- Try incognito/private browsing mode

---

### **8. Backup/Restore Issues**

#### **Symptoms:**
- Backup files corrupted
- Restore process fails
- Data loss after restore

#### **Solutions:**

**A. Verify Backup Integrity:**
```bash
# Check backup file
file backup.tar.gz
tar -tzf backup.tar.gz | head -10
```

**B. Manual Restore:**
```bash
# Stop application
docker-compose down

# Extract backup manually
tar -xzf backup.tar.gz

# Copy files manually
cp backup/sqlite.db data/

# Restart application
docker-compose up -d
```

---

## 🔍 **Diagnostic Commands**

### **Health Check:**
```bash
# Application health
curl -f http://localhost:3000/api/health

# Database check
sqlite3 sqlite.db ".tables"

# Container status
docker ps
```

### **Log Analysis:**
```bash
# Application logs
docker-compose logs -f gita-fashion

# System logs
tail -f /var/log/nginx/error.log

# Database logs
tail -f /var/log/gita-fashion-*.log
```

### **Performance Monitoring:**
```bash
# System resources
./scripts/monitor.sh resources

# Application performance
./scripts/monitor.sh performance

# Full system check
./scripts/monitor.sh all
```

---

## 📞 **Getting Help**

### **Before Reporting Issues:**
1. Check this troubleshooting guide
2. Review application logs
3. Test with fresh browser session
4. Try restarting the application

### **Information to Include:**
- Error messages (full text)
- Steps to reproduce
- Browser and version
- Operating system
- Docker version (if using containers)
- Recent changes made

### **Emergency Recovery:**
```bash
# Quick recovery steps
./scripts/backup.sh restore /path/to/last-good-backup.tar.gz
./scripts/deploy.sh --restart
./scripts/monitor.sh health
```

---

## ✅ **Prevention Best Practices**

1. **Regular Backups**: Run daily automated backups
2. **Monitor Logs**: Check logs regularly for warnings
3. **Update Dependencies**: Keep packages up to date
4. **Test Changes**: Test in development before production
5. **Document Changes**: Keep track of configuration changes
6. **Monitor Resources**: Watch system resource usage
7. **Security Updates**: Apply security patches promptly

---

**💡 Most issues can be resolved by restarting the application or restoring from a recent backup. Always backup before making changes!**