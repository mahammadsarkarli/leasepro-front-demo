import React, { useState } from "react";
import { useTranslation } from "../i18n";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Checkbox } from "./ui/checkbox";
import { Loader2, Printer, Download } from "lucide-react";
import { ReceiptData, AuthorizationData, generatePaymentReceipt, generateAuthorizationDocument } from "../utils/pdfUtils";

interface PrintDialogProps {
  isOpen: boolean;
  onClose: () => void;
  receiptData?: ReceiptData | null;
  authorizationData?: AuthorizationData | null;
}

interface PrintOptions {
  includePhotos: boolean;
  includeNotes: boolean;
  format: "pdf" | "docx";
  copies: number;
}

const PrintDialog: React.FC<PrintDialogProps> = ({
  isOpen,
  onClose,
  receiptData,
  authorizationData,
}) => {
  const { t } = useTranslation();
  const [options, setOptions] = useState<PrintOptions>({
    includePhotos: true,
    includeNotes: true,
    format: "pdf",
    copies: 1,
  });
  const [loading, setLoading] = useState(false);

  const handlePrint = async () => {
    setLoading(true);
    try {
      if (receiptData) {
        const htmlContent = generatePaymentReceipt(receiptData);
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(htmlContent);
          printWindow.document.close();
          printWindow.focus();
          printWindow.print();
        }
      } else if (authorizationData) {
        const htmlContent = generateAuthorizationDocument(authorizationData);
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(htmlContent);
          printWindow.document.close();
          printWindow.focus();
          printWindow.print();
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    setLoading(true);
    try {
      if (receiptData) {
        const htmlContent = generatePaymentReceipt(receiptData);
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `payment-receipt-${receiptData.payment.id}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else if (authorizationData) {
        const htmlContent = generateAuthorizationDocument(authorizationData);
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `authorization-${authorizationData.contract.id}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const documentType = receiptData ? "Payment Receipt" : authorizationData ? "Authorization Document" : "Document";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md p-6">
        <h2 className="text-xl font-semibold mb-4">{t("print.printPaymentReceipt")}</h2>
        
        <div className="space-y-4">
          <div>
            <Label>{t("print.format")}</Label>
            <div className="flex space-x-4 mt-2">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="format"
                  value="html"
                  checked={true}
                  readOnly
                />
                <span>HTML (Printable)</span>
              </label>
            </div>
          </div>

          <div>
            <Label>{t("print.copies")}</Label>
            <Input
              type="number"
              min="1"
              max="10"
              value={options.copies}
              onChange={(e) => setOptions(prev => ({ ...prev, copies: parseInt(e.target.value) || 1 }))}
              className="mt-1"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-2 mt-6">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleDownload} disabled={loading} className="flex items-center">
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            {t("print.download")}
          </Button>
          <Button onClick={handlePrint} disabled={loading} className="flex items-center">
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Printer className="w-4 h-4 mr-2" />
            )}
            {t("print.print")}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default PrintDialog;
