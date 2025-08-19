server {
    listen 80;
    server_name grafana.stage.seniorpomidornaya.ru;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name grafana.stage.seniorpomidornaya.ru;

    # SSL Configuration (временно отключено для получения сертификатов)
    # ssl_certificate /etc/ssl/certs/grafana.stage.seniorpomidornaya.ru.crt;
    # ssl_certificate_key /etc/ssl/certs/grafana.stage.seniorpomidornaya.ru.key;
    
    # SSL Security Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security Headers
    add_header X-Frame-Options SAMEORIGIN;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Grafana proxy
    location / {
        proxy_pass http://grafana:3000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
        
        # Grafana specific headers
        proxy_set_header X-Grafana-Org-Id $http_x_grafana_org_id;
    }

    # Logs
    access_log /var/log/nginx/grafana.stage.seniorpomidornaya.ru.access.log;
    error_log /var/log/nginx/grafana.stage.seniorpomidornaya.ru.error.log;
}
