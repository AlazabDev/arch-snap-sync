// src/lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import CryptoJS from "crypto-js";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// التحقق من صيغة رقم الهاتف
export function validatePhoneNumber(phone: string): boolean {
  const phoneRegex = /^\+\d{1,15}$/;
  return phoneRegex.test(phone);
}

// تنسيق رقم الهاتف
export function formatPhoneNumber(phone: string): string {
  // إزالة جميع الأحرف غير الرقمية
  const cleaned = phone.replace(/\D/g, "");
  // إضافة + في البداية
  return "+" + cleaned;
}

// تشفير البيانات الحساسة
export function encryptSensitiveData(data: string, key: string): string {
  return CryptoJS.AES.encrypt(data, key).toString();
}

// فك تشفير البيانات
export function decryptSensitiveData(encryptedData: string, key: string): string {
  const bytes = CryptoJS.AES.decrypt(encryptedData, key);
  return bytes.toString(CryptoJS.enc.Utf8);
}

// توليد رمز فريد
export function generateUniqueId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// تنسيق التاريخ
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

// حسا�� حجم الملف بشكل قابل للقراءة
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

// التحقق من نوع الملف
export function isValidFileType(
  file: File,
  allowedTypes: string[]
): boolean {
  return allowedTypes.includes(file.type);
}

// استخراج أرقام الهواتف من النص
export function extractPhoneNumbers(text: string): string[] {
  const phoneRegex = /\+?\d{1,3}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g;
  return text.match(phoneRegex) || [];
}

// تحويل JSON إلى CSV
export function jsonToCSV(data: any[]): string {
  if (!data.length) return "";

  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(","),
    ...data.map((row) =>
      headers.map((header) => {
        const value = row[header];
        if (typeof value === "string" && value.includes(",")) {
          return `"${value}"`;
        }
        return value;
      }).join(",")
    ),
  ].join("\n");

  return csv;
}

// تحميل ملف CSV
export function downloadCSV(filename: string, csv: string) {
  const element = document.createElement("a");
  element.setAttribute("href", "data:text/csv;charset=utf-8," + encodeURIComponent(csv));
  element.setAttribute("download", filename);
  element.style.display = "none";
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}
