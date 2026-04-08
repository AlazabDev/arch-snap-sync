## مديول إدارة التخزين السحابي

### 1. جدول إعدادات التخزين السحابي (Migration)
- جدول `cloud_storage_providers` لتخزين إعدادات كل مزود خدمة (AWS S3, OCI Object Storage, GCP Cloud Storage)
- حقول: الاسم، النوع، البيكت، المنطقة، الحالة

### 2. Edge Function للتواصل مع الخدمات السحابية
- `cloud-storage` Edge Function تدعم:
  - عرض الباكتات والملفات
  - رفع وتحميل وحذف الملفات
  - إحصائيات المساحة

### 3. صفحة إدارة التخزين السحابي (UI)
- تبويبات لكل مزود (AWS, OCI, GCP)
- عرض الباكتات مع إحصائيات (عدد الملفات، المساحة)
- متصفح ملفات مع رفع/تحميل/حذف
- لوحة مراقبة بإحصائيات شاملة

### 4. الأسرار المطلوبة
- AWS: ✅ موجودة (S3_ACCESS_KEY_ID, S3_SECRET_KEY, S3_BUCKET_NAME, AWS_REGION)
- OCI: تحتاج إضافة (OCI_TENANCY_OCID, OCI_USER_OCID, OCI_FINGERPRINT, OCI_PRIVATE_KEY, OCI_REGION, OCI_NAMESPACE, OCI_BUCKET_NAME)
- GCP: تحتاج إضافة (GCP_SERVICE_ACCOUNT_KEY, GCP_PROJECT_ID, GCP_BUCKET_NAME)
