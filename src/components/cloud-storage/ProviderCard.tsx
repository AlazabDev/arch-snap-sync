import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { CloudProvider, useToggleProvider, useDeleteProvider, useTestConnection } from "@/hooks/useCloudStorage";
import {
  Trash2,
  Plug,
  FolderOpen,
  Settings2,
  CheckCircle2,
  XCircle,
  Loader2,
  Globe,
  HardDrive,
  Clock,
  Shield,
} from "lucide-react";

const providerConfig: Record<string, { icon: string; label: string; color: string; gradient: string }> = {
  s3: {
    icon: "🟠",
    label: "Amazon S3",
    color: "hsl(var(--chart-4))",
    gradient: "from-orange-500/10 to-amber-500/5",
  },
  oci: {
    icon: "🔴",
    label: "Oracle OCI",
    color: "hsl(var(--destructive))",
    gradient: "from-red-500/10 to-rose-500/5",
  },
  gcp: {
    icon: "🔵",
    label: "Google Cloud",
    color: "hsl(var(--chart-1))",
    gradient: "from-blue-500/10 to-cyan-500/5",
  },
};

interface Props {
  provider: CloudProvider;
  onBrowse: (id: string) => void;
  onEdit?: (provider: CloudProvider) => void;
}

export default function ProviderCard({ provider, onBrowse, onEdit }: Props) {
  const toggleProvider = useToggleProvider();
  const deleteProvider = useDeleteProvider();
  const testConnection = useTestConnection();
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "success" | "error">("idle");

  const config = providerConfig[provider.provider_type] || {
    icon: "☁️",
    label: "Cloud",
    color: "hsl(var(--muted-foreground))",
    gradient: "from-muted/10 to-muted/5",
  };

  const handleTest = () => {
    setConnectionStatus("idle");
    testConnection.mutate(provider.id, {
      onSuccess: (data) => setConnectionStatus(data.success ? "success" : "error"),
      onError: () => setConnectionStatus("error"),
    });
  };

  const timeSinceUpdate = () => {
    const diff = Date.now() - new Date(provider.updated_at).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return "أقل من ساعة";
    if (hours < 24) return `${hours} ساعة`;
    return `${Math.floor(hours / 24)} يوم`;
  };

  return (
    <Card className={`relative overflow-hidden transition-all hover:shadow-md border-border/60 ${!provider.is_active ? "opacity-60" : ""}`}>
      {/* Gradient top bar */}
      <div className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-l ${config.gradient.replace("/10", "/80").replace("/5", "/60")}`} />

      <CardHeader className="pb-3 pt-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${config.gradient} flex items-center justify-center text-xl`}>
              {config.icon}
            </div>
            <div>
              <h3 className="font-semibold text-sm leading-tight">{provider.name}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{config.label}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {connectionStatus === "success" && (
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            )}
            {connectionStatus === "error" && (
              <XCircle className="w-4 h-4 text-destructive" />
            )}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Switch
                      checked={provider.is_active}
                      onCheckedChange={(checked) =>
                        toggleProvider.mutate({ id: provider.id, is_active: checked })
                      }
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>{provider.is_active ? "تعطيل" : "تفعيل"}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pb-4">
        {/* Info badges */}
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="outline" className="text-xs gap-1 font-normal">
            <HardDrive className="w-3 h-3" />
            {provider.bucket_name}
          </Badge>
          {provider.region && (
            <Badge variant="secondary" className="text-xs gap-1 font-normal">
              <Globe className="w-3 h-3" />
              {provider.region}
            </Badge>
          )}
          <Badge
            variant={provider.is_active ? "default" : "outline"}
            className={`text-xs gap-1 font-normal ${provider.is_active ? "bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/20" : ""}`}
          >
            <Shield className="w-3 h-3" />
            {provider.is_active ? "نشط" : "معطل"}
          </Badge>
        </div>

        {/* Last updated */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span>آخر تحديث: {timeSinceUpdate()}</span>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 pt-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleTest}
                  disabled={testConnection.isPending}
                  className="flex-1"
                >
                  {testConnection.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 ml-1 animate-spin" />
                  ) : (
                    <Plug className="w-3.5 h-3.5 ml-1" />
                  )}
                  اختبار
                </Button>
              </TooltipTrigger>
              <TooltipContent>اختبار الاتصال بالمزود</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Button
            size="sm"
            onClick={() => onBrowse(provider.id)}
            disabled={!provider.is_active}
            className="flex-1"
          >
            <FolderOpen className="w-3.5 h-3.5 ml-1" />
            تصفح
          </Button>

          {onEdit && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onEdit(provider)}>
                    <Settings2 className="w-3.5 h-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>إعدادات</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          <AlertDialog>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <AlertDialogTrigger asChild>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </AlertDialogTrigger>
                </TooltipTrigger>
                <TooltipContent>حذف المزود</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <AlertDialogContent dir="rtl">
              <AlertDialogHeader>
                <AlertDialogTitle>حذف مزود التخزين</AlertDialogTitle>
                <AlertDialogDescription>
                  هل أنت متأكد من حذف "{provider.name}"؟ لن يتم حذف الملفات من الخدمة السحابية.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex-row-reverse gap-2">
                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => deleteProvider.mutate(provider.id)}
                >
                  حذف
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
