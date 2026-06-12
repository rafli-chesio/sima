"use client";

import { Button } from "@/components/ui/button";

interface ExportButtonsProps {
  data: Record<string, unknown>[];
  filename: string;
}

export function ExportButtons({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  data,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  filename,
}: ExportButtonsProps) {
  const exportToExcel = () => {
    alert("Fitur Ekspor Excel sedang dinonaktifkan.");
  };

  const printPdf = () => {
    window.print();
  };

  return (
    <div className="flex gap-2 print:hidden">
      <Button 
        onClick={exportToExcel} 
        className="bg-green-600/20 text-green-500 hover:bg-green-600 hover:text-white border border-green-600/30 transition-all shadow-[0_0_15px_rgba(34,197,94,0.1)]"
        size="sm"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="8" y1="13" x2="16" y2="13"></line><line x1="8" y1="17" x2="16" y2="17"></line><line x1="10" y1="9" x2="8" y2="9"></line></svg>
        Ekspor Excel
      </Button>
      <Button 
        onClick={printPdf} 
        className="bg-red-600/20 text-red-500 hover:bg-red-600 hover:text-white border border-red-600/30 transition-all shadow-[0_0_15px_rgba(239,68,68,0.1)]"
        size="sm"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
        Cetak PDF
      </Button>
    </div>
  );
}
