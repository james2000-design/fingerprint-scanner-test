'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import ScanImage from '@/public/assets/images/images.png'

type FingerprintResult = {
  ErrorCode: number;
  SerialNumber: string;
  ImageHeight: number;
  ImageWidth: number;
  ImageDPI: number;
  ImageQuality: number;
  NFIQ: number;
  BMPBase64: string;
  TemplateBase64: string;
  WSQImageSize: number;
  WSQImage: string;
};

const secugen_lic = ''; // Add your license if required

export default function FingerprintScanner() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [result, setResult] = useState<FingerprintResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const captureFP = async () => {
    setError(null);
    try {
      const response = await fetch('https://localhost:8443/SGIFPCapture', {
        method: 'POST',
        body: new URLSearchParams({
          Timeout: '10000',
          Quality: '50',
          licstr: secugen_lic,
          templateFormat: 'ISO',
          imageWSQRate: '0.75',
        }),
      });

      if (!response.ok) {
        setError(`Error connecting to scanner: ${response.status}`);
        return;
      }

      const data: FingerprintResult = await response.json();

      if (data.ErrorCode === 0) {
        setImageSrc(`data:image/bmp;base64,${data.BMPBase64}`);
        setResult(data);
      } else {
        setError(`Capture Error ${data.ErrorCode}: ${getErrorMessage(data.ErrorCode)}`);
      }
    } catch (err) {
      setError('Could not connect to SGIBioSrv. Is it running on your machine?');
    }
  };

  const getErrorMessage = (code: number): string => {
    const errors: Record<number, string> = {
      51: 'System file load failure',
      52: 'Sensor chip initialization failed',
      53: 'Device not found',
      54: 'Fingerprint image capture timeout',
      55: 'No device available',
      56: 'Driver load failed',
      57: 'Wrong image',
      58: 'Lack of bandwidth',
      59: 'Device busy',
      60: 'Cannot get serial number of the device',
      61: 'Unsupported device',
      63: "SgIBioSrv didn't start",
    };
    return errors[code] || 'Unknown error';
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white shadow rounded">
      <h2 className="text-xl font-semibold mb-4">SecuGen Fingerprint Scanner</h2>

      

      {error && (
        <div className="mt-4 text-red-600">
          <strong>Error:</strong> {error}
        </div>
      )}

      {imageSrc ? (
  <div className="mt-6">
    <Image
      src={imageSrc}
      alt="Fingerprint"
      width={210}
      height={300}
      className="border"
    />
  </div>
) : (
  <Image
    src={ScanImage}
    alt="Placeholder"
    width={210}
    height={300}
    className="border"
  />
)}

<button
        onClick={captureFP}
        className="px-4 py-2 bg-blue-600 text-white flex justify-center rounded hover:bg-blue-700"
      >
        Click to Scan
      </button>
      {result && (
        <div className="mt-6 overflow-auto">
          <table className="table-auto border-collapse border border-gray-400 text-sm">
            <tbody>
              <tr><td className="border px-2 py-1">Serial Number</td><td className="border px-2 py-1">{result.SerialNumber}</td></tr>
              <tr><td className="border px-2 py-1">Image Height</td><td className="border px-2 py-1">{result.ImageHeight}</td></tr>
              <tr><td className="border px-2 py-1">Image Width</td><td className="border px-2 py-1">{result.ImageWidth}</td></tr>
              <tr><td className="border px-2 py-1">Image DPI</td><td className="border px-2 py-1">{result.ImageDPI}</td></tr>
              <tr><td className="border px-2 py-1">Image Quality</td><td className="border px-2 py-1">{result.ImageQuality}</td></tr>
              <tr><td className="border px-2 py-1">NFIQ</td><td className="border px-2 py-1">{result.NFIQ}</td></tr>
              <tr><td className="border px-2 py-1">Template</td><td className="border px-2 py-1"><textarea rows={4} cols={40} defaultValue={result.TemplateBase64}></textarea></td></tr>
              <tr><td className="border px-2 py-1">WSQ Image Size</td><td className="border px-2 py-1">{result.WSQImageSize}</td></tr>
              <tr><td className="border px-2 py-1">WSQ Image</td><td className="border px-2 py-1"><textarea rows={4} cols={40} defaultValue={result.WSQImage}></textarea></td></tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
