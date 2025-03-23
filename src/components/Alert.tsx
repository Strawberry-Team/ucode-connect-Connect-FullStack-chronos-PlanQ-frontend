import React, { useEffect } from "react";
import { Info, X } from "lucide-react";

interface AlertProps {
  message: string;
  onClose: () => void;
}

const Alert: React.FC<AlertProps> = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-8 right-8 p-4 bg-white text-gray-900 rounded-md shadow-lg border-l-4 border-blue-600 flex items-center space-x-3 animate-fade-in-out"
    style={{ zIndex: 9999 }}
    >
      <Info className="h-6 w-6 text-blue-600" />
      <span className="flex-1 font-medium">{message}</span>
      <button
        onClick={onClose}
        className="text-gray-600 hover:text-gray-800 transition-all duration-300"
      >
        <X className="h-6 w-6" />
      </button>
    </div>
  );
};

export default Alert;
