'use client';
import Topbar from '@/components/Topbar';
import { useState } from 'react';
import { apiV1 } from '@/lib/api';
import { Button } from '@/components/ui/button';

export default function UploadsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<any>(null);

  const onUpload = async () => {
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    const res = await apiV1.post('uploads', { body: fd }).json<any>();
    setResult(res);
  };

  return (
    <div>
      <Topbar />
      <div className="p-4 space-y-4">
        <h1 className="text-xl font-semibold">Uploads</h1>
        <input type="file" onChange={e => setFile(e.target.files?.[0] ?? null)} />
        <Button onClick={onUpload} disabled={!file}>Upload</Button>
        {result && (
          <pre className="bg-white border rounded p-3 text-sm overflow-auto">{JSON.stringify(result, null, 2)}</pre>
        )}
      </div>
    </div>
  );
}
