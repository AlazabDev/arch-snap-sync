#!/bin/bash
# ==============================================
# Arch Snap Sync - Auto Deploy Script
# المسار: /var/www/apps/arch-snap-sync
# ==============================================

set -euo pipefail

APP_NAME="arch-snap-sync"
APP_DIR="/var/www/apps/${APP_NAME}"
DIST_DIR="${APP_DIR}/dist"
BACKUP_DIR="${APP_DIR}/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "🚀 بدء نشر ${APP_NAME}..."
echo "📅 التاريخ: $(date)"

# التأكد من وجود المجلدات
mkdir -p "${DIST_DIR}" "${BACKUP_DIR}"

cd "${APP_DIR}"

# تفعيل pnpm
echo "📦 التحقق من pnpm..."
if ! command -v pnpm &> /dev/null; then
    echo "⬇️ تثبيت pnpm..."
    corepack enable
    corepack prepare pnpm@latest --activate
fi

# نسخة احتياطية من الإصدار الحالي
if [ -d "${DIST_DIR}" ] && [ "$(ls -A ${DIST_DIR} 2>/dev/null)" ]; then
    echo "💾 إنشاء نسخة احتياطية..."
    tar -czf "${BACKUP_DIR}/dist_${TIMESTAMP}.tar.gz" -C "${DIST_DIR}" .
    # الاحتفاظ بآخر 5 نسخ فقط
    ls -t "${BACKUP_DIR}"/dist_*.tar.gz 2>/dev/null | tail -n +6 | xargs -r rm
fi

# تحديث الكود
echo "📥 سحب آخر التحديثات..."
git pull origin main

# تثبيت المكتبات
echo "📦 تثبيت الاعتماديات..."
pnpm install --frozen-lockfile

# بناء المشروع
echo "🔨 بناء المشروع..."
pnpm build

# التحقق من نجاح البناء
if [ ! -f "${DIST_DIR}/index.html" ]; then
    echo "❌ فشل البناء! لم يتم العثور على index.html"
    # استعادة النسخة الاحتياطية
    if [ -f "${BACKUP_DIR}/dist_${TIMESTAMP}.tar.gz" ]; then
        echo "🔄 استعادة النسخة الاحتياطية..."
        rm -rf "${DIST_DIR:?}"/*
        tar -xzf "${BACKUP_DIR}/dist_${TIMESTAMP}.tar.gz" -C "${DIST_DIR}"
    fi
    exit 1
fi

# إعادة تحميل nginx
echo "🔄 إعادة تحميل Nginx..."
sudo nginx -t && sudo systemctl reload nginx

echo "✅ تم النشر بنجاح!"
echo "🌐 الموقع: https://storage.alazab.com"
echo "📊 حجم الملفات:"
du -sh "${DIST_DIR}"
