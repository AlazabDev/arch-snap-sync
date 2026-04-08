import { useState } from "react";
import { useListObjects, useDeleteObject } from "@/hooks/useCloudStorage";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowRight, Folder, FileIcon, Trash2, Download, ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  providerId: string;
  onBack: () => void;
}

function formatSize(bytes: number) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export default function FileBrowser({ providerId, onBack }: Props) {
  const [prefix, setPrefix] = useState("");
  const { data, isLoading } = useListObjects(providerId, prefix);
  const deleteObject = useDeleteObject();

  const breadcrumbs = prefix ? prefix.split("/").filter(Boolean) : [];

  const navigateToFolder = (folder: string) => setPrefix(folder);
  const navigateUp = () => {
    const parts = prefix.split("/").filter(Boolean);
    parts.pop();
    setPrefix(parts.length ? parts.join("/") + "/" : "");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 ml-1" />رجوع
        </Button>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <button onClick={() => setPrefix("")} className="hover:text-foreground">الجذر</button>
          {breadcrumbs.map((part, i) => (
            <span key={i} className="flex items-center gap-1">
              <ArrowRight className="w-3 h-3" />
              <button
                onClick={() => setPrefix(breadcrumbs.slice(0, i + 1).join("/") + "/")}
                className="hover:text-foreground"
              >
                {part}
              </button>
            </span>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full" />)}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">الاسم</TableHead>
              <TableHead className="text-right">الحجم</TableHead>
              <TableHead className="text-right">آخر تعديل</TableHead>
              <TableHead className="text-right w-24">إجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {prefix && (
              <TableRow className="cursor-pointer hover:bg-muted/50" onClick={navigateUp}>
                <TableCell className="flex items-center gap-2">
                  <Folder className="w-4 h-4 text-muted-foreground" />
                  <span>..</span>
                </TableCell>
                <TableCell />
                <TableCell />
                <TableCell />
              </TableRow>
            )}
            {data?.folders?.map((folder) => (
              <TableRow key={folder} className="cursor-pointer hover:bg-muted/50" onClick={() => navigateToFolder(folder)}>
                <TableCell className="flex items-center gap-2">
                  <Folder className="w-4 h-4 text-primary" />
                  <span>{folder.replace(prefix, "").replace("/", "")}</span>
                </TableCell>
                <TableCell>—</TableCell>
                <TableCell>—</TableCell>
                <TableCell />
              </TableRow>
            ))}
            {data?.files?.map((file) => (
              <TableRow key={file.key}>
                <TableCell className="flex items-center gap-2">
                  <FileIcon className="w-4 h-4 text-muted-foreground" />
                  <span className="truncate max-w-xs">{file.key.replace(prefix, "")}</span>
                </TableCell>
                <TableCell>{formatSize(file.size)}</TableCell>
                <TableCell className="text-xs">{file.last_modified ? new Date(file.last_modified).toLocaleDateString("ar-SA") : "—"}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => deleteObject.mutate({ providerId, key: file.key })}>
                      <Trash2 className="w-3 h-3 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {!data?.folders?.length && !data?.files?.length && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  لا توجد ملفات في هذا المسار
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
