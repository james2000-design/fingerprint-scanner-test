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
  const [isListening, setIsListening] = useState(false);
  const [scannerStatus, setScannerStatus] = useState("Not Connected");
  const [fingerprintImage, setFingerprintImage] = useState<string | null>(null);
  const [scanningMessage, setScanningMessage] = useState("");

  const checkWebAPIStatus = async () => {
    try {
      const response = await fetch("/api/scanner", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          Timeout: "1000", // Short timeout for status check
          Quality: "50",
          Licstr: "",
          TemplateFormat: "ISO",
          ImageWSQRate: "0.75",
        }).toString(),
      });

      if (response.ok) {
        setScannerStatus("Connected");
        return true;
      } else {
        setScannerStatus("WebAPI Client Not Running");
        return false;
      }
    } catch (error) {
      setScannerStatus("WebAPI Client Not Running");
      console.error("WebAPI not accessible:", error);
      return false;
    }
  };

  const startListening = async () => {
    if (scannerStatus !== "Connected") {
      alert(
        "Please ensure SecuGen WebAPI Client is running and scanner is connected"
      );
      return;
    }

    setIsListening(true);
    setScanningMessage("Place your finger on the scanner...");

    // Start the continuous listening loop
    listenForFingerprint();
  };

  const stopListening = () => {
    setIsListening(false);
    setScanningMessage("");
  };

  const listenForFingerprint = async () => {
    while (isListening) {
      try {
        const response = await fetch("/api/scanner", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            Timeout: "30000", // 30 second timeout for listening
            Quality: "50",
            Licstr: "",
            TemplateFormat: "ISO",
            ImageWSQRate: "0.75",
            AutoOn: "1", // Enable auto-capture mode
          }).toString(),
        });

        if (response.ok) {
          const result = await response.text();
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(result, "text/xml");

          const errorCode =
            xmlDoc.getElementsByTagName("ErrorCode")[0]?.textContent;

          if (errorCode === "0") {
            // Successfully captured fingerprint
            const templateData =
              xmlDoc.getElementsByTagName("TemplateBase64")[0]?.textContent;
            const imageData =
              xmlDoc.getElementsByTagName("BMPBase64")[0]?.textContent;

            setFingerprintData({
              template: templateData,
              image: imageData,
              timestamp: new Date().toISOString(),
            });

            if (imageData) {
              setFingerprintImage(`data:image/bmp;base64,${imageData}`);
            }

            setScanningMessage("Fingerprint captured successfully!");
            setIsListening(false); // Stop listening after successful capture

            // Optional: Auto-clear the success message after a few seconds
            setTimeout(() => setScanningMessage(""), 3000);

            break; // Exit the listening loop
          } else if (errorCode === "30" || errorCode === "31") {
            // Timeout or no finger detected - continue listening
            setScanningMessage("Waiting for finger placement...");
            continue;
          } else {
            // Other error
            console.error("Scanner error code:", errorCode);
            setScanningMessage("Scanner error. Please try again.");
            setIsListening(false);
            break;
          }
        } else {
          throw new Error("Failed to communicate with scanner");
        }
      } catch (error) {
        console.error("Scanner communication error:", error);
        setScanningMessage("Connection error. Please check scanner.");
        setIsListening(false);
        break;
      }

      // Small delay before next attempt to prevent overwhelming the scanner
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  };

  useEffect(() => {
    checkWebAPIStatus();
  }, []);

  // Cleanup effect to stop listening when component unmounts
  useEffect(() => {
    return () => {
      setIsListening(false);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const clearFingerprint = () => {
    setFingerprintData(null);
    setFingerprintImage(null);
    setScanningMessage("");
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
        setScanningMessage("");
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

          <div className="space-y-2">
            {!fingerprintData ? (
              <div>
                {!isListening ? (
                  <button
                    type="button"
                    onClick={startListening}
                    disabled={scannerStatus !== "Connected"}
                    className={`w-full p-3 rounded-md font-medium ${
                      scannerStatus !== "Connected"
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  >
                    Start Fingerprint Scanner
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={stopListening}
                    className="w-full p-3 rounded-md font-medium bg-red-600 text-white hover:bg-red-700"
                  >
                    Stop Scanner
                  </button>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={clearFingerprint}
                className="w-full p-3 rounded-md font-medium bg-yellow-600 text-white hover:bg-yellow-700"
              >
                Clear & Recapture
              </button>
            )}

            {scanningMessage && (
              <div className="text-center p-2 bg-blue-50 rounded-md">
                <p className="text-sm text-blue-700">{scanningMessage}</p>
              </div>
            )}
          </div>

          {fingerprintImage && (
            <div className="mt-3 text-center">
              <p className="text-sm text-green-600 mb-2">
                ✓ Fingerprint Captured Successfully
              </p>
              <Image
                src={fingerprintImage}
                alt="Captured Fingerprint"
                className="mx-auto border border-gray-300 rounded"
                style={{ maxWidth: "150px", maxHeight: "150px" }}
                width={150}
                height={150}
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
