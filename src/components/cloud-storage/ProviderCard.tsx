import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { CloudProvider, useToggleProvider, useDeleteProvider, useTestConnection } from "@/hooks/useCloudStorage";
import { Trash2, Plug, FolderOpen } from "lucide-react";

const providerIcons: Record<string, string> = {
  s3: "🟠",
  oci: "🔴",
  gcp: "🔵",
};

const providerLabels: Record<string, string> = {
  s3: "Amazon S3",
  oci: "Oracle OCI",
  gcp: "Google Cloud",
};

interface Props {
  provider: CloudProvider;
  onBrowse: (id: string) => void;
}

export default function ProviderCard({ provider, onBrowse }: Props) {
  const toggleProvider = useToggleProvider();
  const deleteProvider = useDeleteProvider();
  const testConnection = useTestConnection();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{providerIcons[provider.provider_type] || "☁️"}</span>
          <div>
            <CardTitle className="text-base">{provider.name}</CardTitle>
            <p className="text-xs text-muted-foreground">{providerLabels[provider.provider_type]}</p>
          </div>
        </div>
        <Switch
          checked={provider.is_active}
          onCheckedChange={(checked) => toggleProvider.mutate({ id: provider.id, is_active: checked })}
        />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <Badge variant="outline">{provider.bucket_name}</Badge>
          {provider.region && <Badge variant="secondary">{provider.region}</Badge>}
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => testConnection.mutate(provider.id)} disabled={testConnection.isPending}>
            <Plug className="w-3 h-3 ml-1" />
            {testConnection.isPending ? "جاري..." : "اختبار"}
          </Button>
          <Button size="sm" variant="outline" onClick={() => onBrowse(provider.id)} disabled={!provider.is_active}>
            <FolderOpen className="w-3 h-3 ml-1" />تصفح
          </Button>
          <Button size="sm" variant="destructive" onClick={() => deleteProvider.mutate(provider.id)}>
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
