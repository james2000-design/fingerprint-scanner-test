"use client";
import Image from "next/image";
import { useState, useEffect } from "react";

const ProspectRegistration = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  type FingerprintData = {
    template: string | null;
    image: string | null;
    timestamp: string;
  } | null;

  const [fingerprintData, setFingerprintData] = useState<FingerprintData>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scannerStatus, setScannerStatus] = useState("Not Connected");
  const [fingerprintImage, setFingerprintImage] = useState<string | null>(null);

  const checkWebAPIStatus = async () => {
    try {
      const response = await fetch("/api/scanner", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          Timeout: "10000",
          Quality: "50",
          Licstr: "",
          TemplateFormat: "ISO", // <-- Capital T & F
          ImageWSQRate: "0.75",
        }).toString(),
      });

      if (response.ok) {
        setScannerStatus("Connected");
      } else {
        setScannerStatus("WebAPI Client Not Running");
      }
    } catch (error) {
      setScannerStatus("WebAPI Client Not Running");
      console.error("WebAPI not accessible:", error);
    }
  };

  useEffect(() => {
    // Check if SecuGen WebAPI Client is running
    checkWebAPIStatus();
  }, []);

  const captureFingerprint = async () => {
    if (scannerStatus !== "Connected") {
      alert(
        "Please ensure SecuGen WebAPI Client is running and scanner is connected"
      );
      return;
    }

    setIsScanning(true);

    try {
      const response = await fetch("/api/scanner", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          Timeout: "10000",
          Quality: "50",
          Licstr: "",
          TemplateFormat: "ISO",
          ImageWSQRate: "0.75",
          AutoOn: "Enable",
        }).toString(),
      });

      if (response.ok) {
        const result = await response.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(result, "text/xml");

        // Extract fingerprint data
        const errorCode =
          xmlDoc.getElementsByTagName("ErrorCode")[0]?.textContent;

        if (errorCode === "0") {
          const templateData =
            xmlDoc.getElementsByTagName("TemplateBase64")[0]?.textContent;
          const imageData =
            xmlDoc.getElementsByTagName("BMPBase64")[0]?.textContent;

          setFingerprintData({
            template: templateData,
            image: imageData,
            timestamp: new Date().toISOString(),
          });

          // Display fingerprint image
          if (imageData) {
            setFingerprintImage(`data:image/bmp;base64,${imageData}`);
          }

          alert("Fingerprint captured successfully!");
        } else {
          alert("Failed to capture fingerprint. Please try again.");
        }
      } else {
        throw new Error("Failed to communicate with scanner");
      }
    } catch (error) {
      console.error("Capture error:", error);
      alert("Error capturing fingerprint. Please check scanner connection.");
    } finally {
      setIsScanning(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();

    if (!fingerprintData) {
      alert("Please capture fingerprint before submitting");
      return;
    }

    const registrationData = {
      ...formData,
      fingerprint: fingerprintData,
      registrationTime: new Date().toISOString(),
    };

    try {
      // Send to your API endpoint
      const response = await fetch("/api/register-prospect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(registrationData),
      });

      if (response.ok) {
        alert("Prospect registered successfully!");
        // Reset form
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
        });
        setFingerprintData(null);
        setFingerprintImage(null);
      } else {
        alert("Registration failed. Please try again.");
      }
    } catch (error) {
      console.error("Registration error:", error);
      alert("Registration failed. Please try again.");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">
        Prospect Registration
      </h2>

      {/* Scanner Status */}
      <div className="mb-4 p-3 rounded-md bg-gray-50">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Scanner Status:</span>
          <span
            className={`text-sm font-medium ${
              scannerStatus === "Connected" ? "text-green-600" : "text-red-600"
            }`}
          >
            {scannerStatus}
          </span>
        </div>
        {scannerStatus !== "Connected" && (
          <button
            onClick={checkWebAPIStatus}
            className="mt-2 text-xs text-blue-600 hover:text-blue-800"
          >
            Retry Connection
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            First Name
          </label>
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleInputChange}
            required
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Last Name
          </label>
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleInputChange}
            required
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            required
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            required
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Fingerprint Capture Section */}
        <div className="border-t pt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fingerprint Capture
          </label>

          <button
            type="button"
            onClick={captureFingerprint}
            disabled={isScanning || scannerStatus !== "Connected"}
            className={`w-full p-3 rounded-md font-medium ${
              isScanning || scannerStatus !== "Connected"
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {isScanning ? "Scanning..." : "Capture Fingerprint"}
          </button>

          {fingerprintImage && (
            <div className="mt-3 text-center">
              <p className="text-sm text-green-600 mb-2">
                ✓ Fingerprint Captured
              </p>
              <Image
                src={fingerprintImage}
                alt="Captured Fingerprint"
                className="mx-auto border border-gray-300 rounded"
                style={{ maxWidth: "150px", maxHeight: "150px" }}
              />
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={!fingerprintData}
          className={`w-full p-3 rounded-md font-medium ${
            !fingerprintData
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-green-600 text-white hover:bg-green-700"
          }`}
        >
          Register Prospect
        </button>
      </form>
    </div>
  );
};

export default ProspectRegistration;
