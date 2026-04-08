import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { useAddProvider, ProviderType } from "@/hooks/useCloudStorage";

const providerFields: Record<ProviderType, { label: string; key: string; type?: string }[]> = {
  s3: [
    { label: "Access Key ID", key: "access_key_id" },
    { label: "Secret Access Key", key: "secret_access_key", type: "password" },
  ],
  oci: [
    { label: "Namespace", key: "namespace" },
    { label: "Region (مثل me-jeddah-1)", key: "region" },
    { label: "PAR URL (اختياري)", key: "par_url" },
  ],
  gcp: [
    { label: "Access Token", key: "access_token", type: "password" },
    { label: "API Key (اختياري)", key: "api_key" },
  ],
};

const providerLabels: Record<ProviderType, string> = {
  s3: "Amazon S3",
  oci: "Oracle OCI",
  gcp: "Google Cloud Storage",
};

export default function AddProviderDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<ProviderType>("s3");
  const [bucketName, setBucketName] = useState("");
  const [region, setRegion] = useState("");
  const [config, setConfig] = useState<Record<string, string>>({});
  const addProvider = useAddProvider();

  const handleSubmit = () => {
    if (!name || !bucketName) return;
    addProvider.mutate(
      { name, provider_type: type, bucket_name: bucketName, region: region || undefined, config },
      {
        onSuccess: () => {
          setOpen(false);
          setName("");
          setBucketName("");
          setRegion("");
          setConfig({});
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="w-4 h-4 ml-2" />إضافة مزود تخزين</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>إضافة مزود تخزين سحابي</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>اسم المزود</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="مثال: AWS الرئيسي" />
          </div>
          <div>
            <Label>نوع الخدمة</Label>
            <Select value={type} onValueChange={(v) => { setType(v as ProviderType); setConfig({}); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(providerLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>اسم الباكت</Label>
            <Input value={bucketName} onChange={e => setBucketName(e.target.value)} placeholder="my-bucket" />
          </div>
          <div>
            <Label>المنطقة (اختياري)</Label>
            <Input value={region} onChange={e => setRegion(e.target.value)} placeholder="us-east-1" />
          </div>
          
          <div className="border-t pt-4">
            <p className="text-sm font-medium text-muted-foreground mb-3">بيانات الاتصال</p>
            {providerFields[type].map(field => (
              <div key={field.key} className="mb-3">
                <Label>{field.label}</Label>
                <Input
                  type={field.type || "text"}
                  value={config[field.key] || ""}
                  onChange={e => setConfig(prev => ({ ...prev, [field.key]: e.target.value }))}
                />
              </div>
            ))}
          </div>

          <Button onClick={handleSubmit} disabled={addProvider.isPending} className="w-full">
            {addProvider.isPending ? "جاري الإضافة..." : "إضافة"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
