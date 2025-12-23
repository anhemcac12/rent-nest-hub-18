import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import {
  FolderOpen,
  FileText,
  Receipt,
  Wrench,
  File,
  Download,
  Search,
  Upload,
  Filter,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { mockDocuments } from '@/data/mockTenant';
import { Document } from '@/types/tenant';
import { toast } from 'sonner';

const typeConfig = {
  lease: { label: 'Lease Agreement', icon: FileText, className: 'bg-primary/10 text-primary' },
  receipt: { label: 'Receipt', icon: Receipt, className: 'bg-accent/10 text-accent' },
  maintenance: { label: 'Maintenance', icon: Wrench, className: 'bg-warning/10 text-warning' },
  other: { label: 'Other', icon: File, className: 'bg-muted text-muted-foreground' },
};

const fileTypeIcons = {
  pdf: 'PDF',
  doc: 'DOC',
  docx: 'DOCX',
  jpg: 'JPG',
  png: 'PNG',
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function DocumentCard({ document }: { document: Document }) {
  const config = typeConfig[document.type];
  const Icon = config.icon;

  const handleDownload = () => {
    toast.success(`Downloading ${document.name}`);
  };

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`h-12 w-12 rounded-lg flex items-center justify-center shrink-0 ${config.className}`}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm truncate">{document.name}</h4>
            <p className="text-xs text-muted-foreground mt-1">
              {document.propertyTitle}
            </p>
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                {fileTypeIcons[document.fileType]}
              </Badge>
              <span>{formatFileSize(document.size)}</span>
              <span>{format(parseISO(document.uploadedAt), 'MMM d, yyyy')}</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleDownload}
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Documents() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const filterDocuments = (type: string) => {
    let docs = mockDocuments;

    if (type !== 'all') {
      docs = docs.filter((d) => d.type === type);
    }

    if (searchQuery) {
      docs = docs.filter(
        (d) =>
          d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          d.propertyTitle?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return docs;
  };

  const tabs = [
    { value: 'all', label: 'All', count: mockDocuments.length, icon: FolderOpen },
    { value: 'lease', label: 'Leases', count: mockDocuments.filter((d) => d.type === 'lease').length, icon: FileText },
    { value: 'receipt', label: 'Receipts', count: mockDocuments.filter((d) => d.type === 'receipt').length, icon: Receipt },
    { value: 'maintenance', label: 'Maintenance', count: mockDocuments.filter((d) => d.type === 'maintenance').length, icon: Wrench },
    { value: 'other', label: 'Other', count: mockDocuments.filter((d) => d.type === 'other').length, icon: File },
  ];

  const filteredDocuments = filterDocuments(activeTab);

  const handleUpload = () => {
    toast.info('File upload would be handled here');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Documents</h1>
          <p className="text-muted-foreground mt-1">
            {mockDocuments.length} documents stored
          </p>
        </div>
        <Button onClick={handleUpload}>
          <Upload className="h-4 w-4 mr-2" />
          Upload Document
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search documents..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex flex-wrap h-auto gap-2">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="gap-2">
              <tab.icon className="h-4 w-4" />
              {tab.label}
              <Badge variant="secondary" className="h-5 px-1.5">
                {tab.count}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {filteredDocuments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDocuments.map((document) => (
                <DocumentCard key={document.id} document={document} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg mb-2">No Documents Found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery
                    ? 'Try adjusting your search query'
                    : 'No documents in this category yet'}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
