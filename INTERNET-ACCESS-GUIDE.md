# Internet Access Guide
**Exposing Your Local Installation to the Internet**

## ⚠️ Security Warning

**Before exposing your local installation to the internet, understand the risks:**

- 🔒 Your application will be accessible to anyone on the internet
- 🛡️ You need proper authentication and security measures
- 🔐 SSL/HTTPS is strongly recommended for production use
- 🚨 Your home/office IP address will be exposed
- 💾 Your local data could be at risk if not properly secured
- 🔥 You need a firewall and regular security updates

**Recommended for:**
- Development and testing only
- Small teams with proper security knowledge
- Temporary access needs

**NOT recommended for:**
- Production workloads (use Azure/AWS instead)
- Sensitive customer data
- High-traffic applications
- Mission-critical business operations

---

## Option 1: Cloudflare Tunnel (Recommended - Easiest & Most Secure)

**Benefits:**
- ✅ No port forwarding needed
- ✅ Free SSL certificate included
- ✅ DDoS protection
- ✅ Hides your home IP address
- ✅ Works behind corporate firewalls
- ✅ Access control built-in

### Step 1: Install Cloudflare Tunnel

1. **Sign up for Cloudflare** (free): https://dash.cloudflare.com/sign-up

2. **Install `cloudflared`**:
   ```powershell
   # Download from: https://github.com/cloudflare/cloudflared/releases
   # Or use winget:
   winget install --id Cloudflare.cloudflared
   ```

3. **Verify installation**:
   ```powershell
   cloudflared --version
   ```

### Step 2: Authenticate

```powershell
cloudflared tunnel login
```

This opens a browser to authenticate with Cloudflare.

### Step 3: Create a Tunnel

```powershell
# Create tunnel named "field-service"
cloudflared tunnel create field-service

# Note the tunnel ID shown (you'll need it)
```

### Step 4: Configure the Tunnel

Create a config file at `C:\Users\YOUR_USERNAME\.cloudflared\config.yml`:

```yaml
tunnel: YOUR-TUNNEL-ID
credentials-file: C:\Users\YOUR_USERNAME\.cloudflared\YOUR-TUNNEL-ID.json

ingress:
  # Route your domain to the local application
  - hostname: fieldservice.yourdomain.com
    service: http://localhost:5173
  
  # Catch-all rule (required)
  - service: http_status:404
```

### Step 5: Route DNS

```powershell
# Point your domain to the tunnel
cloudflared tunnel route dns field-service fieldservice.yourdomain.com
```

### Step 6: Run the Tunnel

```powershell
# Run as a service (background)
cloudflared service install

# Start the service
cloudflared service start

# Or run manually for testing
cloudflared tunnel run field-service
```

### Step 7: Access Your Application

Visit: `https://fieldservice.yourdomain.com`

**Free SSL included!** ✅

---

## Option 2: ngrok (Quick Testing - Free Tier)

**Benefits:**
- ✅ Instant setup (1 command)
- ✅ Free tier available
- ✅ HTTPS included
- ✅ Great for demos and testing

**Limitations:**
- ⚠️ Free tier: random URL changes on restart
- ⚠️ Limited to 40 connections/minute (free tier)
- ⚠️ Not for production use

### Setup

1. **Sign up**: https://ngrok.com/

2. **Install ngrok**:
   ```powershell
   # Download from https://ngrok.com/download
   # Or use Chocolatey:
   choco install ngrok
   ```

3. **Authenticate**:
   ```powershell
   ngrok config add-authtoken YOUR_AUTH_TOKEN
   ```

4. **Expose your application**:
   ```powershell
   # Expose port 5173 (frontend)
   ngrok http 5173
   ```

5. **Access**:
   ```
   Forwarding: https://abc123.ngrok.io -> http://localhost:5173
   ```

Visit the `https://abc123.ngrok.io` URL shown.

### Paid Plan Benefits ($8/month)

- Custom domains (e.g., `fieldservice.yourdomain.com`)
- Reserved URLs (don't change on restart)
- More connections
- IP whitelisting

---

## Option 3: Port Forwarding + Dynamic DNS (Traditional Method)

**Benefits:**
- ✅ Full control
- ✅ No third-party service
- ✅ Free (except domain/DDNS)

**Drawbacks:**
- ⚠️ Exposes your home IP
- ⚠️ Requires router configuration
- ⚠️ Need to set up SSL yourself
- ⚠️ More security risk

### Step 1: Configure Static IP on Server

1. Open **Network Connections** → Right-click your adapter → **Properties**
2. Select **Internet Protocol Version 4 (TCP/IPv4)** → **Properties**
3. Set static IP (e.g., `192.168.1.100`)
4. Note your **Default Gateway** (router IP)

### Step 2: Port Forwarding on Router

1. **Access router admin panel** (usually `192.168.1.1` or `192.168.0.1`)
2. Find **Port Forwarding** settings (location varies by router)
3. Add rules:

   | Service Name | External Port | Internal IP | Internal Port | Protocol |
   |--------------|---------------|-------------|---------------|----------|
   | Field Service Frontend | 5173 | 192.168.1.100 | 5173 | TCP |
   | Field Service API | 5000 | 192.168.1.100 | 5000 | TCP |
   | HTTPS (optional) | 443 | 192.168.1.100 | 443 | TCP |

4. **Save** and **reboot router**

### Step 3: Configure Windows Firewall

```powershell
# Allow inbound from internet
New-NetFirewallRule -DisplayName "Field Service API (Internet)" -Direction Inbound -LocalPort 5000 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "Field Service Frontend (Internet)" -Direction Inbound -LocalPort 5173 -Protocol TCP -Action Allow
```

### Step 4: Set Up Dynamic DNS (Optional but Recommended)

Your home IP address changes periodically. Dynamic DNS gives you a stable domain name.

**Popular DDNS Providers:**
- **No-IP** (free): https://www.noip.com/
- **DuckDNS** (free): https://www.duckdns.org/
- **DynDNS**: https://dyn.com/dns/

**Example with No-IP:**

1. Sign up at https://www.noip.com/
2. Create a hostname (e.g., `fieldservice.ddns.net`)
3. Install the **No-IP DUC** (Dynamic Update Client) on your server
4. Configure it with your account credentials
5. The client will automatically update your IP address

### Step 5: Access Your Application

```
http://YOUR_PUBLIC_IP:5173
# Or with DDNS:
http://fieldservice.ddns.net:5173
```

### Step 6: Add SSL/HTTPS (Recommended)

Without SSL, passwords and data are sent in plain text!

**Option A: Let's Encrypt with Certbot**

1. **Install Certbot**:
   ```powershell
   # Download from: https://certbot.eff.org/
   ```

2. **Get SSL certificate**:
   ```powershell
   certbot certonly --standalone -d fieldservice.ddns.net
   ```

3. **Configure Node.js to use SSL** (modify `server/api.cjs`):
   ```javascript
   const https = require('https');
   const fs = require('fs');
   
   const options = {
     key: fs.readFileSync('C:\\Certbot\\live\\fieldservice.ddns.net\\privkey.pem'),
     cert: fs.readFileSync('C:\\Certbot\\live\\fieldservice.ddns.net\\fullchain.pem')
   };
   
   https.createServer(options, app).listen(443, () => {
     console.log('HTTPS server running on port 443');
   });
   ```

**Option B: Reverse Proxy with Caddy (Easiest)**

1. **Install Caddy**: https://caddyserver.com/download

2. **Create `Caddyfile`**:
   ```
   fieldservice.ddns.net {
     reverse_proxy localhost:5173
     tls your@email.com
   }
   ```

3. **Run Caddy**:
   ```powershell
   caddy run
   ```

Caddy automatically gets and renews SSL certificates! ✅

---

## Option 4: Reverse Proxy on Cloud (Middle Ground)

**Setup:**
- Host a small VM on Azure/AWS (~$5/month)
- Install Nginx or Caddy as reverse proxy
- Forward traffic to your local server via VPN or tunnel

**Benefits:**
- ✅ Keeps your home IP private
- ✅ Professional SSL setup
- ✅ Better security
- ✅ DDoS protection

**Drawbacks:**
- ⚠️ Monthly cloud cost
- ⚠️ More complex setup

---

## Security Best Practices

### 1. Enable Authentication

Ensure your application has **strong authentication**:
```javascript
// Your app should already have this, but verify:
- JWT tokens with expiration
- Strong password requirements
- Role-based access control
- Session management
```

### 2. Use HTTPS Only

**Never** expose login pages over HTTP - credentials will be stolen!

### 3. Rate Limiting

Add rate limiting to prevent brute force attacks:

```javascript
// In server/api.cjs
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

### 4. IP Whitelisting (Optional)

If you know your users' IPs:

```javascript
const allowedIPs = ['203.0.113.0', '198.51.100.0'];

app.use((req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress;
  if (!allowedIPs.includes(clientIP)) {
    return res.status(403).send('Forbidden');
  }
  next();
});
```

### 5. Keep Software Updated

```powershell
# Regularly update Node.js packages
npm audit
npm audit fix

# Update Windows
Windows Update

# Update SQL Server
SQL Server Configuration Manager
```

### 6. Monitor Access Logs

Check logs regularly for suspicious activity:
- Failed login attempts
- Unusual access patterns
- SQL injection attempts

### 7. Backup Regularly

Set up **automated backups** before exposing to internet:

```sql
-- Daily database backups
BACKUP DATABASE FieldServiceDB 
TO DISK = 'C:\Backups\FieldServiceDB_Daily.bak'
WITH FORMAT, INIT, COMPRESSION;
```

### 8. Use Fail2Ban or Similar

Install tools that block IPs after failed login attempts.

---

## Comparison Table

| Method | Setup Difficulty | Cost | Security | SSL | DDoS Protection | Best For |
|--------|------------------|------|----------|-----|-----------------|----------|
| **Cloudflare Tunnel** | Easy | Free | ⭐⭐⭐⭐⭐ | ✅ Included | ✅ Yes | Most users |
| **ngrok** | Very Easy | Free-$8/mo | ⭐⭐⭐⭐ | ✅ Included | ✅ Yes | Testing/Demos |
| **Port Forwarding** | Medium | Free | ⭐⭐ | ❌ Manual | ❌ No | Advanced users |
| **Cloud Reverse Proxy** | Hard | ~$5/mo | ⭐⭐⭐⭐ | ✅ With setup | ✅ Yes | Production-ish |

---

## Recommended Setup for Production

**Don't use local hosting for production!** Instead:

1. **Use Azure**: See [AZURE-DEPLOYMENT-GUIDE.md](AZURE-DEPLOYMENT-GUIDE.md)
   - Cost: ~$28/month
   - Professional infrastructure
   - Automatic backups
   - 99.9% uptime SLA

2. **Use AWS**: See [AWS-DEPLOYMENT-GUIDE.md](AWS-DEPLOYMENT-GUIDE.md)
   - Similar cost and features
   - Global reach
   - Enterprise-grade

**Local hosting is great for:**
- Development
- Testing
- Small internal teams (5-10 users)
- Temporary projects

---

## Troubleshooting

### Can't access from outside network

1. **Check port forwarding**:
   - Use https://www.yougetsignal.com/tools/open-ports/
   - Enter your public IP and port 5173

2. **Check firewall**:
   ```powershell
   Get-NetFirewallRule -DisplayName "Field Service*"
   ```

3. **Verify public IP**:
   ```powershell
   (Invoke-WebRequest -Uri "http://ifconfig.me/ip").Content
   ```

### Intermittent disconnections

- Your ISP may be changing your IP address
- Solution: Use Dynamic DNS (No-IP, DuckDNS)

### Slow performance

- Home internet upload speed is limited (usually 10-35 Mbps)
- Too many users? Consider cloud hosting
- Enable compression in your API server

### SSL certificate errors

- Certificate expired? Renew with `certbot renew`
- Wrong domain? Check certificate matches your DDNS name
- Mixed content warnings? Ensure all resources load via HTTPS

---

## Next Steps

✅ **Secured your installation?** Great! Now set up monitoring:
- Configure email alerts for failed logins
- Set up uptime monitoring (UptimeRobot, Pingdom)
- Review access logs weekly

📚 **Related Guides:**
- [LOCAL-INSTALL.md](LOCAL-INSTALL.md) - Initial local installation
- [AZURE-DEPLOYMENT-GUIDE.md](AZURE-DEPLOYMENT-GUIDE.md) - Move to Azure cloud
- [AWS-DEPLOYMENT-GUIDE.md](AWS-DEPLOYMENT-GUIDE.md) - Move to AWS cloud

---

## License

This software is licensed under AGPL-3.0. See [LICENSE.txt](LICENSE.txt) for details.
