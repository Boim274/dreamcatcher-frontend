import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

export default function CopyId({ id }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(String(id)); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="text-gray hover:text-primary transition-colors inline-flex items-center gap-1"
      title="Salin ID Produk"
    >
      {copied ? <Check size={10} className="text-success" /> : <Copy size={10} />}
      <span className="text-[10px]">{copied ? 'Tersalin' : 'Salin'}</span>
    </button>
  );
}