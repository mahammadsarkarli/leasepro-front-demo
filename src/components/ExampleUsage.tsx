import React, { useState } from 'react';
import CloudflareFileUpload from './CloudflareFileUpload';

// Example usage of CloudflareFileUpload component
const ExampleUsage: React.FC = () => {
  const [receiptUrl, setReceiptUrl] = useState<string>('');
  const [documentUrl, setDocumentUrl] = useState<string>('');
  const [photoUrl, setPhotoUrl] = useState<string>('');

  return (
    <div className="space-y-6 p-6">
      <h2 className="text-2xl font-bold">File Upload Examples</h2>
      
      {/* Payment Receipt Upload */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Payment Receipt</h3>
        <CloudflareFileUpload
          value={receiptUrl}
          onChange={setReceiptUrl}
          label="Upload Receipt"
          description="Upload payment receipt (JPG, PNG, PDF)"
          accept="image/*,.pdf"
          maxSize={5}
          prefix="receipts"
          showPreview={true}
        />
      </div>

      {/* Document Upload */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Contract Documents</h3>
        <CloudflareFileUpload
          value={documentUrl}
          onChange={setDocumentUrl}
          label="Upload Document"
          description="Upload contract documents (PDF, DOC, DOCX)"
          accept=".pdf,.doc,.docx"
          maxSize={10}
          prefix="documents"
          showPreview={false}
        />
      </div>

      {/* Photo Upload */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Customer Photo</h3>
        <CloudflareFileUpload
          value={photoUrl}
          onChange={setPhotoUrl}
          label="Upload Photo"
          description="Upload customer photo (JPG, PNG, WebP)"
          accept="image/*"
          maxSize={3}
          prefix="photos"
          showPreview={true}
        />
      </div>

      {/* Display uploaded URLs */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Uploaded Files</h3>
        <div className="space-y-2 text-sm">
          {receiptUrl && (
            <div>
              <strong>Receipt:</strong> {receiptUrl}
            </div>
          )}
          {documentUrl && (
            <div>
              <strong>Document:</strong> {documentUrl}
            </div>
          )}
          {photoUrl && (
            <div>
              <strong>Photo:</strong> {photoUrl}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExampleUsage;
