import { useState, useRef, useCallback } from "react";
import { useListObjects, useDeleteObject, useUploadObject, useGetSignedUrl, useCreateFolder } from "@/hooks/useCloudStorage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
} from "@/components/ui/alert-dialog";
import {
  ArrowRight,
  Folder,
  FileIcon,
  Trash2,
  Download,
  ArrowLeft,
  Upload,
  Search,
  LayoutGrid,
  LayoutList,
  FolderPlus,
  RefreshCw,
  FileText,
  FileImage,
  FileVideo,
  FileArchive,
  File,
  Loader2,
  ChevronLeft,
  Home,
  Eye,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import PdfViewer from "./PdfViewer";

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

function getFileIcon(key: string) {
  const ext = key.split(".").pop()?.toLowerCase() || "";
  if (["jpg", "jpeg", "png", "gif", "svg", "webp", "bmp"].includes(ext))
    return <FileImage className="w-4 h-4 text-blue-500" />;
  if (["mp4", "mov", "avi", "mkv", "webm"].includes(ext))
    return <FileVideo className="w-4 h-4 text-purple-500" />;
  if (["pdf", "doc", "docx", "txt", "xlsx", "csv"].includes(ext))
    return <FileText className="w-4 h-4 text-orange-500" />;
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext))
    return <FileArchive className="w-4 h-4 text-yellow-600" />;
  return <File className="w-4 h-4 text-muted-foreground" />;
}

function getFileExtension(key: string) {
  return key.split(".").pop()?.toUpperCase() || "—";
}

export default function FileBrowser({ providerId, onBack }: Props) {
  const [prefix, setPrefix] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [pdfPreview, setPdfPreview] = useState<{ url: string; name: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading, refetch } = useListObjects(providerId, prefix);
  const deleteObject = useDeleteObject();
  const uploadObject = useUploadObject();
  const getSignedUrl = useGetSignedUrl();
  const createFolder = useCreateFolder();

  const breadcrumbs = prefix ? prefix.split("/").filter(Boolean) : [];

  const navigateToFolder = (folder: string) => {
    setPrefix(folder);
    setSearchQuery("");
  };
  const navigateUp = () => {
    const parts = prefix.split("/").filter(Boolean);
    parts.pop();
    setPrefix(parts.length ? parts.join("/") + "/" : "");
  };

  const filteredFiles = data?.files?.filter((f) =>
    searchQuery ? f.key.toLowerCase().includes(searchQuery.toLowerCase()) : true
  );
  const filteredFolders = data?.folders?.filter((f) =>
    searchQuery ? f.toLowerCase().includes(searchQuery.toLowerCase()) : true
  );

  const handleUpload = async () => {
    for (const file of selectedFiles) {
      const key = prefix + file.name;
      await uploadObject.mutateAsync({ providerId, key, file });
    }
    setSelectedFiles([]);
    setShowUploadDialog(false);
  };

  const handleDownload = (key: string) => {
    getSignedUrl.mutate(
      { providerId, key },
      {
        onSuccess: (data) => {
          window.open(data.url, "_blank");
        },
      }
    );
  };

  const handlePreviewPdf = (key: string) => {
    const fileName = key.split("/").pop() || key;
    getSignedUrl.mutate(
      { providerId, key },
      {
        onSuccess: (data) => {
          setPdfPreview({ url: data.url, name: fileName });
        },
      }
    );
  };

  const isPdf = (key: string) => key.toLowerCase().endsWith(".pdf");

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    createFolder.mutate(
      { providerId, path: prefix + newFolderName.trim() },
      {
        onSuccess: () => {
          setNewFolderName("");
          setShowNewFolderDialog(false);
        },
      }
    );
  };

  const handleDeleteConfirm = () => {
    if (deleteTarget) {
      deleteObject.mutate({ providerId, key: deleteTarget });
      setDeleteTarget(null);
    }
  };

  const totalSize = filteredFiles?.reduce((acc, f) => acc + (f.size || 0), 0) || 0;
  const fileCount = filteredFiles?.length || 0;
  const folderCount = filteredFolders?.length || 0;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 ml-1" />
            رجوع
          </Button>
          <div className="h-6 w-px bg-border" />
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setPrefix(""); setSearchQuery(""); }}>
            <Home className="w-4 h-4" />
          </Button>
          {prefix && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={navigateUp}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Breadcrumb */}
        <div className="flex items-center gap-1 text-sm text-muted-foreground flex-1 overflow-x-auto">
          <button onClick={() => setPrefix("")} className="hover:text-foreground font-medium whitespace-nowrap">
            الجذر
          </button>
          {breadcrumbs.map((part, i) => (
            <span key={i} className="flex items-center gap-1 whitespace-nowrap">
              <ArrowRight className="w-3 h-3 shrink-0" />
              <button
                onClick={() => setPrefix(breadcrumbs.slice(0, i + 1).join("/") + "/")}
                className="hover:text-foreground"
              >
                {part}
              </button>
            </span>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => refetch()}>
                  <RefreshCw className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>تحديث</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setViewMode(viewMode === "list" ? "grid" : "list")}
                >
                  {viewMode === "list" ? <LayoutGrid className="w-3.5 h-3.5" /> : <LayoutList className="w-3.5 h-3.5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{viewMode === "list" ? "عرض شبكي" : "عرض قائمة"}</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Button variant="outline" size="sm" onClick={() => setShowNewFolderDialog(true)}>
            <FolderPlus className="w-3.5 h-3.5 ml-1" />
            مجلد جديد
          </Button>

          <Button size="sm" onClick={() => setShowUploadDialog(true)}>
            <Upload className="w-3.5 h-3.5 ml-1" />
            رفع ملف
          </Button>
        </div>
      </div>

      {/* Search + Stats */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="بحث في الملفات..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-9"
          />
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>{folderCount} مجلد</span>
          <span className="w-px h-3 bg-border" />
          <span>{fileCount} ملف</span>
          <span className="w-px h-3 bg-border" />
          <span>{formatSize(totalSize)}</span>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : viewMode === "list" ? (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="text-right">الاسم</TableHead>
                <TableHead className="text-right w-20">النوع</TableHead>
                <TableHead className="text-right w-24">الحجم</TableHead>
                <TableHead className="text-right w-32">آخر تعديل</TableHead>
                <TableHead className="text-right w-28">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {prefix && (
                <TableRow className="cursor-pointer hover:bg-muted/50" onClick={navigateUp}>
                  <TableCell className="flex items-center gap-2">
                    <Folder className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">..</span>
                  </TableCell>
                  <TableCell />
                  <TableCell />
                  <TableCell />
                  <TableCell />
                </TableRow>
              )}
              {filteredFolders?.map((folder) => (
                <TableRow
                  key={folder}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigateToFolder(folder)}
                >
                  <TableCell className="flex items-center gap-2">
                    <Folder className="w-4 h-4 text-primary" />
                    <span className="font-medium">{folder.replace(prefix, "").replace("/", "")}</span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">مجلد</TableCell>
                  <TableCell>—</TableCell>
                  <TableCell>—</TableCell>
                  <TableCell />
                </TableRow>
              ))}
              {filteredFiles?.map((file) => (
                <TableRow key={file.key} className="group">
                  <TableCell className="flex items-center gap-2">
                    {getFileIcon(file.key)}
                    <span className="truncate max-w-xs">{file.key.replace(prefix, "")}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono">
                      {getFileExtension(file.key)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{formatSize(file.size)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {file.last_modified
                      ? new Date(file.last_modified).toLocaleDateString("ar-SA")
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              onClick={() => handleDownload(file.key)}
                            >
                              <Download className="w-3 h-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>تحميل</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => setDeleteTarget(file.key)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>حذف</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!filteredFolders?.length && !filteredFiles?.length && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-12">
                    <Folder className="w-10 h-10 mx-auto mb-2 opacity-20" />
                    <p>لا توجد ملفات في هذا المسار</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {prefix && (
            <button
              onClick={navigateUp}
              className="flex flex-col items-center gap-2 p-4 rounded-lg border border-dashed hover:bg-muted/50 transition-colors"
            >
              <Folder className="w-8 h-8 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">..</span>
            </button>
          )}
          {filteredFolders?.map((folder) => (
            <button
              key={folder}
              onClick={() => navigateToFolder(folder)}
              className="flex flex-col items-center gap-2 p-4 rounded-lg border hover:bg-muted/50 hover:border-primary/30 transition-colors"
            >
              <Folder className="w-8 h-8 text-primary" />
              <span className="text-xs truncate w-full text-center font-medium">
                {folder.replace(prefix, "").replace("/", "")}
              </span>
            </button>
          ))}
          {filteredFiles?.map((file) => {
            const fileName = file.key.replace(prefix, "");
            return (
              <div
                key={file.key}
                className="group relative flex flex-col items-center gap-2 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="w-8 h-8 flex items-center justify-center">
                  {getFileIcon(file.key)}
                </div>
                <span className="text-xs truncate w-full text-center">{fileName}</span>
                <span className="text-[10px] text-muted-foreground">{formatSize(file.size)}</span>
                {/* Hover actions */}
                <div className="absolute top-1 left-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={() => handleDownload(file.key)}
                  >
                    <Download className="w-3 h-3" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 text-destructive"
                    onClick={() => setDeleteTarget(file.key)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader>
            <DialogTitle>رفع ملفات</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div
              className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">اضغط لاختيار الملفات أو اسحبها هنا</p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) setSelectedFiles(Array.from(e.target.files));
                }}
              />
            </div>
            {selectedFiles.length > 0 && (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {selectedFiles.map((f, i) => (
                  <div key={i} className="flex items-center justify-between text-sm bg-muted/30 rounded px-3 py-2">
                    <div className="flex items-center gap-2 truncate">
                      {getFileIcon(f.name)}
                      <span className="truncate">{f.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">{formatSize(f.size)}</span>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              المسار: {prefix || "/"}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadDialog(false)}>إلغاء</Button>
            <Button
              onClick={handleUpload}
              disabled={!selectedFiles.length || uploadObject.isPending}
            >
              {uploadObject.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 ml-1 animate-spin" />
                  جاري الرفع...
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5 ml-1" />
                  رفع ({selectedFiles.length})
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Folder Dialog */}
      <Dialog open={showNewFolderDialog} onOpenChange={setShowNewFolderDialog}>
        <DialogContent dir="rtl" className="max-w-sm">
          <DialogHeader>
            <DialogTitle>إنشاء مجلد جديد</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>اسم المجلد</Label>
              <Input
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="اسم المجلد"
                onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
              />
            </div>
            <p className="text-xs text-muted-foreground">المسار: {prefix || "/"}{newFolderName}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewFolderDialog(false)}>إلغاء</Button>
            <Button onClick={handleCreateFolder} disabled={!newFolderName.trim() || createFolder.isPending}>
              {createFolder.isPending ? <Loader2 className="w-3.5 h-3.5 ml-1 animate-spin" /> : <FolderPlus className="w-3.5 h-3.5 ml-1" />}
              إنشاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>حذف الملف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذا الملف؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteConfirm}
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
