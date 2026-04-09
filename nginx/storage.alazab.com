# /etc/nginx/sites-available/storage.alazab.com

# HTTP to HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name storage.alazab.com www.storage.alazab.com;
    
    # Let's Encrypt validation
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    # Redirect all HTTP to HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name storage.alazab.com www.storage.alazab.com;

    # SSL certificates (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/storage.alazab.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/storage.alazab.com/privkey.pem;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_stapling on;
    ssl_stapling_verify on;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.gpteng.co https://connect.facebook.net; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://fjojyzvulhvqeitnaenv.supabase.co https://connect.facebook.net; frame-src 'self' https://www.facebook.com;" always;

    # Root directory - حيث يتم نشر ملفات البناء (dist)
    root /var/www/apps/arch-snap-sync/dist;
    index index.html index.htm;

    # Logging
    access_log /var/log/nginx/storage.alazab.com_access.log combined buffer=32k flush=5s;
    error_log /var/log/nginx/storage.alazab.com_error.log warn;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1000;
    gzip_proxied any;
    gzip_types 
        text/plain 
        text/css 
        text/xml 
        text/javascript 
        application/x-javascript 
        application/xml+rss 
        application/javascript 
        application/json;
    gzip_disable "msie6";

    # Cache busting for static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # React SPA routing - جميع الطلبات غير المطابقة لملفات ثابتة توجه إلى index.html
    location / {
        # محاولة الوصول للملف أولاً، ثم المجلد، ثم index.html
        try_files $uri $uri/ /index.html;
        
        # لا تخزن index.html في الكاش
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
    }

    # منع الوصول لملفات حساسة
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }

    location ~ ~$ {
        deny all;
        access_log off;
        log_not_found off;
    }

    # Supabase API proxy (اختياري إذا كنت تريد إخفاء API)
    # location /api/ {
    #     proxy_pass https://fjojyzvulhvqeitnaenv.supabase.co/;
    #     proxy_set_header Host fjojyzvulhvqeitnaenv.supabase.co;
    #     proxy_set_header X-Real-IP $remote_addr;
    #     proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    #     proxy_set_header X-Forwarded-Proto $scheme;
    # }
}
