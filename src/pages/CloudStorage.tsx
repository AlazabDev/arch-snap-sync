import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { useCloudProviders, CloudProvider } from "@/hooks/useCloudStorage";
import AddProviderDialog from "@/components/cloud-storage/AddProviderDialog";
import ProviderCard from "@/components/cloud-storage/ProviderCard";
import FileBrowser from "@/components/cloud-storage/FileBrowser";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Cloud,
  HardDrive,
  Server,
  Activity,
  Shield,
  Database,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CloudStorage() {
  const { data: providers, isLoading } = useCloudProviders();
  const [browsingProvider, setBrowsingProvider] = useState<string | null>(null);

  const s3Providers = providers?.filter((p) => p.provider_type === "s3") || [];
  const ociProviders = providers?.filter((p) => p.provider_type === "oci") || [];
  const gcpProviders = providers?.filter((p) => p.provider_type === "gcp") || [];

  const totalProviders = providers?.length || 0;
  const activeProviders = providers?.filter((p) => p.is_active).length || 0;
  const inactiveProviders = totalProviders - activeProviders;

  const browsingProviderData = providers?.find((p) => p.id === browsingProvider);

  if (browsingProvider) {
    return (
      <AppLayout>
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold">متصفح الملفات</h1>
            {browsingProviderData && (
              <Badge variant="outline" className="gap-1">
                <Database className="w-3 h-3" />
                {browsingProviderData.name} — {browsingProviderData.bucket_name}
              </Badge>
            )}
          </div>
          <FileBrowser
            providerId={browsingProvider}
            onBack={() => setBrowsingProvider(null)}
          />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">إدارة التخزين السحابي</h1>
            <p className="text-muted-foreground text-sm mt-1">
              إدارة ومراقبة خدمات التخزين السحابي المتعددة — AWS S3, Oracle OCI, Google Cloud
            </p>
          </div>
          <AddProviderDialog />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-border/60">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                إجمالي المزودين
              </CardTitle>
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Cloud className="w-4 h-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalProviders}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {s3Providers.length} AWS · {ociProviders.length} OCI · {gcpProviders.length} GCP
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                المزودين النشطين
              </CardTitle>
              <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Activity className="w-4 h-4 text-green-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{activeProviders}</div>
              <p className="text-xs text-muted-foreground mt-1">متصل وجاهز للاستخدام</p>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                المزودين المعطلين
              </CardTitle>
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                <Server className="w-4 h-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-muted-foreground">{inactiveProviders}</div>
              <p className="text-xs text-muted-foreground mt-1">متوقف مؤقتاً</p>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                الباكتات
              </CardTitle>
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <HardDrive className="w-4 h-4 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalProviders}</div>
              <p className="text-xs text-muted-foreground mt-1">حاوية تخزين مسجلة</p>
            </CardContent>
          </Card>
        </div>

        {/* Provider Tabs */}
        <Tabs defaultValue="all" dir="rtl">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="all" className="gap-1.5">
              <Cloud className="w-3.5 h-3.5" />
              الكل
              <Badge variant="secondary" className="mr-1 h-5 px-1.5 text-[10px]">
                {totalProviders}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="s3" className="gap-1.5">
              🟠 AWS S3
              <Badge variant="secondary" className="mr-1 h-5 px-1.5 text-[10px]">
                {s3Providers.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="oci" className="gap-1.5">
              🔴 OCI
              <Badge variant="secondary" className="mr-1 h-5 px-1.5 text-[10px]">
                {ociProviders.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="gcp" className="gap-1.5">
              🔵 GCP
              <Badge variant="secondary" className="mr-1 h-5 px-1.5 text-[10px]">
                {gcpProviders.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-48" />
              ))}
            </div>
          ) : (
            <>
              <TabsContent value="all">
                <ProviderGrid providers={providers || []} onBrowse={setBrowsingProvider} />
              </TabsContent>
              <TabsContent value="s3">
                <ProviderGrid providers={s3Providers} onBrowse={setBrowsingProvider} />
              </TabsContent>
              <TabsContent value="oci">
                <ProviderGrid providers={ociProviders} onBrowse={setBrowsingProvider} />
              </TabsContent>
              <TabsContent value="gcp">
                <ProviderGrid providers={gcpProviders} onBrowse={setBrowsingProvider} />
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </AppLayout>
  );
}

function ProviderGrid({
  providers,
  onBrowse,
}: {
  providers: CloudProvider[];
  onBrowse: (id: string) => void;
}) {
  if (!providers.length) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
          <Cloud className="w-8 h-8 opacity-30" />
        </div>
        <p className="font-medium">لا توجد مزودات تخزين</p>
        <p className="text-sm mt-1">أضف مزود جديد للبدء في إدارة التخزين السحابي</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
      {providers.map((p) => (
        <ProviderCard key={p.id} provider={p} onBrowse={onBrowse} />
      ))}
    </div>
  );
}
