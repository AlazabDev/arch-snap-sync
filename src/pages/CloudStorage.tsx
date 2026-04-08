import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { useCloudProviders } from "@/hooks/useCloudStorage";
import AddProviderDialog from "@/components/cloud-storage/AddProviderDialog";
import ProviderCard from "@/components/cloud-storage/ProviderCard";
import FileBrowser from "@/components/cloud-storage/FileBrowser";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Cloud, HardDrive, Server } from "lucide-react";

export default function CloudStorage() {
  const { data: providers, isLoading } = useCloudProviders();
  const [browsingProvider, setBrowsingProvider] = useState<string | null>(null);

  const s3Providers = providers?.filter(p => p.provider_type === "s3") || [];
  const ociProviders = providers?.filter(p => p.provider_type === "oci") || [];
  const gcpProviders = providers?.filter(p => p.provider_type === "gcp") || [];

  const totalProviders = providers?.length || 0;
  const activeProviders = providers?.filter(p => p.is_active).length || 0;

  if (browsingProvider) {
    return (
      <AppLayout>
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-4">متصفح الملفات</h1>
          <FileBrowser providerId={browsingProvider} onBack={() => setBrowsingProvider(null)} />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">إدارة التخزين السحابي</h1>
            <p className="text-muted-foreground text-sm">إدارة ومراقبة خدمات التخزين السحابي المتعددة</p>
          </div>
          <AddProviderDialog />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">إجمالي المزودين</CardTitle>
              <Cloud className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalProviders}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">المزودين النشطين</CardTitle>
              <Server className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{activeProviders}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">الباكتات</CardTitle>
              <HardDrive className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalProviders}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all" dir="rtl">
          <TabsList>
            <TabsTrigger value="all">الكل ({totalProviders})</TabsTrigger>
            <TabsTrigger value="s3">🟠 AWS S3 ({s3Providers.length})</TabsTrigger>
            <TabsTrigger value="oci">🔴 OCI ({ociProviders.length})</TabsTrigger>
            <TabsTrigger value="gcp">🔵 GCP ({gcpProviders.length})</TabsTrigger>
          </TabsList>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-40" />)}
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

function ProviderGrid({ providers, onBrowse }: { providers: any[]; onBrowse: (id: string) => void }) {
  if (!providers.length) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Cloud className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p>لا توجد مزودات تخزين. أضف مزود جديد للبدء.</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
      {providers.map(p => <ProviderCard key={p.id} provider={p} onBrowse={onBrowse} />)}
    </div>
  );
}
