import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Download, AlertCircle, CheckCircle, X, Image, Package } from 'lucide-react';
import { apiPost } from './utils/api.js';
import { useTheme } from './contexts/ThemeContext.jsx';

const BulkUploadPage = () => {
  const { theme } = useTheme();
  const [uploadStep, setUploadStep] = useState('initial'); // initial, preview, processing, complete
  const [csvFile, setCsvFile] = useState(null);
  const [imageFiles, setImageFiles] = useState([]);
  const [parsedData, setParsedData] = useState([]);
  const [validationErrors, setValidationErrors] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResults, setUploadResults] = useState(null);

  // CSV file dropzone
  const onDropCsv = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file && file.type === 'text/csv') {
      setCsvFile(file);
      parseCSV(file);
    }
  }, []);

  // Images dropzone
  const onDropImages = useCallback((acceptedFiles) => {
    setImageFiles(prev => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps: getCsvRootProps, getInputProps: getCsvInputProps, isDragActive: isCsvDragActive } = useDropzone({
    onDrop: onDropCsv,
    accept: {
      'text/csv': ['.csv']
    },
    multiple: false
  });

  const { getRootProps: getImagesRootProps, getInputProps: getImagesInputProps, isDragActive: isImagesDragActive } = useDropzone({
    onDrop: onDropImages,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    multiple: true
  });

  const parseCSV = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim());

      const data = [];
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
          const values = lines[i].split(',').map(v => v.trim());
          const row = {};
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });
          data.push(row);
        }
      }

      setParsedData(data);
      validateData(data);
      setUploadStep('preview');
    };
    reader.readAsText(file);
  };

  const validateData = (data) => {
    const errors = [];
    const skus = new Set();

    data.forEach((row, index) => {
      const rowErrors = [];

      // Required fields
      if (!row.SKU) rowErrors.push('SKU is required');
      if (!row.Brand) rowErrors.push('Brand is required');
      if (!row.Model) rowErrors.push('Model is required');
      if (!row.Reference_Number) rowErrors.push('Reference Number is required');

      // Duplicate SKU check
      if (row.SKU) {
        if (skus.has(row.SKU)) {
          rowErrors.push(`Duplicate SKU: ${row.SKU}`);
        }
        skus.add(row.SKU);
      }

      // Price validation
      if (row.Price && isNaN(parseFloat(row.Price))) {
        rowErrors.push('Price must be a number');
      }

      if (row.Starting_Bid && isNaN(parseFloat(row.Starting_Bid))) {
        rowErrors.push('Starting Bid must be a number');
      }

      // Year validation
      if (row.Year) {
        const year = parseInt(row.Year);
        if (isNaN(year) || year < 1900 || year > new Date().getFullYear() + 1) {
          rowErrors.push('Invalid year');
        }
      }

      if (rowErrors.length > 0) {
        errors.push({
          row: index + 2, // +2 because of 0-index and header row
          sku: row.SKU,
          errors: rowErrors
        });
      }
    });

    setValidationErrors(errors);
  };

  const removeImageFile = (index) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (validationErrors.length > 0) {
      alert('Please fix validation errors before uploading');
      return;
    }

    setUploadStep('processing');
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('csv', csvFile);

    // Append all image files
    imageFiles.forEach(file => {
      formData.append('images', file);
    });

    // Add parsed data as JSON for easier processing
    formData.append('parsedData', JSON.stringify(parsedData));

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 500);

      const response = await apiPost('/api/bulk-upload/process', formData);

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.ok) {
        const result = await response.json();
        setUploadResults(result);
        setUploadStep('complete');
      } else {
        const error = await response.json();
        alert(`Upload failed: ${error.message}`);
        setUploadStep('preview');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed. Please try again.');
      setUploadStep('preview');
    }
  };

  const reset = () => {
    setCsvFile(null);
    setImageFiles([]);
    setParsedData([]);
    setValidationErrors([]);
    setUploadProgress(0);
    setUploadResults(null);
    setUploadStep('initial');
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-luxury-dark' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-3xl font-display mb-2 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            Bulk Upload Inventory
          </h1>
          <p className={`text-lg ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Upload multiple watches at once using our CSV template
          </p>
        </div>

        {/* Download Template */}
        <div className={`mb-8 p-6 rounded-lg ${
          theme === 'dark' ? 'bg-luxury-charcoal border border-luxury-gray' : 'bg-white border border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className={`text-xl font-semibold mb-2 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Step 1: Download Template
              </h3>
              <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Download our CSV template and fill in your watch inventory details
              </p>
            </div>
            <a
              href="/templates/watch-inventory-template.csv"
              download
              className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all ${
                theme === 'dark'
                  ? 'bg-gold text-luxury-dark hover:bg-gold-dark'
                  : 'bg-luxe-bronze text-white hover:bg-luxe-bronze/90'
              }`}
            >
              <Download className="w-5 h-5" />
              Download Template
            </a>
          </div>
        </div>

        {uploadStep === 'initial' && (
          <>
            {/* Upload CSV */}
            <div className={`mb-8 p-6 rounded-lg ${
              theme === 'dark' ? 'bg-luxury-charcoal border border-luxury-gray' : 'bg-white border border-gray-200'
            }`}>
              <h3 className={`text-xl font-semibold mb-4 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Step 2: Upload CSV File
              </h3>

              <div
                {...getCsvRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
                  isCsvDragActive
                    ? theme === 'dark' ? 'border-gold bg-gold/10' : 'border-luxe-bronze bg-luxe-bronze/10'
                    : theme === 'dark' ? 'border-luxury-gray hover:border-gold' : 'border-gray-300 hover:border-luxe-bronze'
                }`}
              >
                <input {...getCsvInputProps()} />
                <FileText className={`w-12 h-12 mx-auto mb-4 ${
                  theme === 'dark' ? 'text-gold' : 'text-luxe-bronze'
                }`} />
                {csvFile ? (
                  <div>
                    <p className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {csvFile.name}
                    </p>
                    <p className={`text-sm mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      Click or drag to replace
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className={`text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      Drag & drop your CSV file here
                    </p>
                    <p className={`text-sm mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      or click to browse
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Upload Images */}
            <div className={`mb-8 p-6 rounded-lg ${
              theme === 'dark' ? 'bg-luxury-charcoal border border-luxury-gray' : 'bg-white border border-gray-200'
            }`}>
              <h3 className={`text-xl font-semibold mb-4 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Step 3: Upload Images
              </h3>

              <div
                {...getImagesRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
                  isImagesDragActive
                    ? theme === 'dark' ? 'border-gold bg-gold/10' : 'border-luxe-bronze bg-luxe-bronze/10'
                    : theme === 'dark' ? 'border-luxury-gray hover:border-gold' : 'border-gray-300 hover:border-luxe-bronze'
                }`}
              >
                <input {...getImagesInputProps()} />
                <Image className={`w-12 h-12 mx-auto mb-4 ${
                  theme === 'dark' ? 'text-gold' : 'text-luxe-bronze'
                }`} />
                <p className={`text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Drag & drop watch images here
                </p>
                <p className={`text-sm mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  or click to browse (multiple files allowed)
                </p>
                <p className={`text-xs mt-2 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                  Name images as: SKU_1.jpg, SKU_2.jpg, etc.
                </p>
              </div>

              {imageFiles.length > 0 && (
                <div className="mt-4">
                  <p className={`text-sm font-semibold mb-2 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    Uploaded Images ({imageFiles.length})
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {imageFiles.map((file, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={file.name}
                          className="w-full h-24 object-cover rounded"
                        />
                        <button
                          onClick={() => removeImageFile(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        <p className={`text-xs mt-1 truncate ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {file.name}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {uploadStep === 'preview' && (
          <div className={`p-6 rounded-lg ${
            theme === 'dark' ? 'bg-luxury-charcoal border border-luxury-gray' : 'bg-white border border-gray-200'
          }`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-xl font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Preview & Validation
              </h3>
              <button
                onClick={reset}
                className={`px-4 py-2 rounded ${
                  theme === 'dark'
                    ? 'bg-luxury-dark text-gray-300 hover:bg-luxury-gray'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Start Over
              </button>
            </div>

            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-red-900 mb-2">
                      Validation Errors ({validationErrors.length})
                    </h4>
                    <ul className="space-y-1 text-sm text-red-700">
                      {validationErrors.slice(0, 5).map((error, index) => (
                        <li key={index}>
                          Row {error.row} (SKU: {error.sku || 'N/A'}): {error.errors.join(', ')}
                        </li>
                      ))}
                      {validationErrors.length > 5 && (
                        <li className="font-semibold">
                          ... and {validationErrors.length - 5} more errors
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Data Preview */}
            <div className="mb-6">
              <h4 className={`font-semibold mb-3 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Data Preview ({parsedData.length} watches)
              </h4>
              <div className="overflow-x-auto">
                <table className={`w-full text-sm ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  <thead className={theme === 'dark' ? 'bg-luxury-dark' : 'bg-gray-50'}>
                    <tr>
                      <th className="text-left p-2">SKU</th>
                      <th className="text-left p-2">Brand</th>
                      <th className="text-left p-2">Model</th>
                      <th className="text-left p-2">Reference</th>
                      <th className="text-left p-2">Price</th>
                      <th className="text-left p-2">Images</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.slice(0, 5).map((row, index) => (
                      <tr key={index} className={`border-t ${
                        theme === 'dark' ? 'border-luxury-gray' : 'border-gray-200'
                      }`}>
                        <td className="p-2">{row.SKU}</td>
                        <td className="p-2">{row.Brand}</td>
                        <td className="p-2">{row.Model}</td>
                        <td className="p-2">{row.Reference_Number}</td>
                        <td className="p-2">{row.Currency} {row.Price}</td>
                        <td className="p-2">
                          {[row.Image_1, row.Image_2, row.Image_3, row.Image_4, row.Image_5]
                            .filter(img => img).length} images
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsedData.length > 5 && (
                  <p className={`text-sm mt-2 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    ... and {parsedData.length - 5} more watches
                  </p>
                )}
              </div>
            </div>

            {/* Upload Summary */}
            <div className={`grid grid-cols-3 gap-4 mb-6 p-4 rounded ${
              theme === 'dark' ? 'bg-luxury-dark' : 'bg-gray-50'
            }`}>
              <div className="text-center">
                <Package className={`w-8 h-8 mx-auto mb-2 ${
                  theme === 'dark' ? 'text-gold' : 'text-luxe-bronze'
                }`} />
                <p className={`text-2xl font-semibold ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  {parsedData.length}
                </p>
                <p className={`text-sm ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Total Watches
                </p>
              </div>
              <div className="text-center">
                <Image className={`w-8 h-8 mx-auto mb-2 ${
                  theme === 'dark' ? 'text-gold' : 'text-luxe-bronze'
                }`} />
                <p className={`text-2xl font-semibold ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  {imageFiles.length}
                </p>
                <p className={`text-sm ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Total Images
                </p>
              </div>
              <div className="text-center">
                {validationErrors.length === 0 ? (
                  <>
                    <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                    <p className="text-2xl font-semibold text-green-600">Ready</p>
                    <p className={`text-sm ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      No Errors
                    </p>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-500" />
                    <p className="text-2xl font-semibold text-red-600">
                      {validationErrors.length}
                    </p>
                    <p className={`text-sm ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Errors Found
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-4">
              <button
                onClick={reset}
                className={`px-6 py-3 rounded-lg ${
                  theme === 'dark'
                    ? 'bg-luxury-dark text-gray-300 hover:bg-luxury-gray'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={validationErrors.length > 0}
                className={`px-6 py-3 rounded-lg flex items-center gap-2 ${
                  validationErrors.length > 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : theme === 'dark'
                    ? 'bg-gold text-luxury-dark hover:bg-gold-dark'
                    : 'bg-luxe-bronze text-white hover:bg-luxe-bronze/90'
                }`}
              >
                <Upload className="w-5 h-5" />
                Upload Inventory
              </button>
            </div>
          </div>
        )}

        {uploadStep === 'processing' && (
          <div className={`p-12 rounded-lg text-center ${
            theme === 'dark' ? 'bg-luxury-charcoal border border-luxury-gray' : 'bg-white border border-gray-200'
          }`}>
            <div className="max-w-md mx-auto">
              <Upload className={`w-16 h-16 mx-auto mb-6 ${
                theme === 'dark' ? 'text-gold' : 'text-luxe-bronze'
              } animate-pulse`} />
              <h3 className={`text-2xl font-semibold mb-4 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Processing Upload
              </h3>
              <p className={`mb-6 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Please wait while we process your inventory...
              </p>

              <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                <div
                  className={`h-3 rounded-full transition-all duration-500 ${
                    theme === 'dark' ? 'bg-gold' : 'bg-luxe-bronze'
                  }`}
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>

              <p className={`text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {uploadProgress}% complete
              </p>
            </div>
          </div>
        )}

        {uploadStep === 'complete' && uploadResults && (
          <div className={`p-6 rounded-lg ${
            theme === 'dark' ? 'bg-luxury-charcoal border border-luxury-gray' : 'bg-white border border-gray-200'
          }`}>
            <div className="text-center mb-8">
              <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
              <h3 className={`text-2xl font-semibold mb-2 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Upload Complete!
              </h3>
              <p className={`${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Your inventory has been successfully uploaded
              </p>
            </div>

            <div className={`grid grid-cols-3 gap-4 mb-8 p-6 rounded ${
              theme === 'dark' ? 'bg-luxury-dark' : 'bg-gray-50'
            }`}>
              <div className="text-center">
                <p className={`text-3xl font-semibold mb-2 text-green-600`}>
                  {uploadResults.successful || 0}
                </p>
                <p className={`text-sm ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Successfully Added
                </p>
              </div>
              <div className="text-center">
                <p className={`text-3xl font-semibold mb-2 text-yellow-600`}>
                  {uploadResults.skipped || 0}
                </p>
                <p className={`text-sm ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Skipped (Duplicates)
                </p>
              </div>
              <div className="text-center">
                <p className={`text-3xl font-semibold mb-2 text-red-600`}>
                  {uploadResults.failed || 0}
                </p>
                <p className={`text-sm ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Failed
                </p>
              </div>
            </div>

            <div className="flex justify-center gap-4">
              <button
                onClick={reset}
                className={`px-6 py-3 rounded-lg ${
                  theme === 'dark'
                    ? 'bg-luxury-dark text-gray-300 hover:bg-luxury-gray'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Upload More
              </button>
              <a
                href="/profile"
                className={`px-6 py-3 rounded-lg ${
                  theme === 'dark'
                    ? 'bg-gold text-luxury-dark hover:bg-gold-dark'
                    : 'bg-luxe-bronze text-white hover:bg-luxe-bronze/90'
                }`}
              >
                View Inventory
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BulkUploadPage;