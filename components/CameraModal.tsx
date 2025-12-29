
import React, { useRef, useState, useEffect } from 'react';

interface CameraModalProps {
  onCapture: (base64: string) => void;
  onClose: () => void;
  title: string;
}

const CameraModal: React.FC<CameraModalProps> = ({ onCapture, onClose, title }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' }, 
          audio: false 
        });
        setStream(s);
        if (videoRef.current) {
          videoRef.current.srcObject = s;
        }
      } catch (err) {
        alert("无法访问摄像头，请检查权限。");
        onClose();
      }
    };
    startCamera();
    return () => {
      stream?.getTracks().forEach(track => track.stop());
    };
  }, []);

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      onCapture(dataUrl.split(',')[1]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="p-4 flex justify-between items-center text-white bg-black/50">
        <h2 className="text-xl font-bold">{title}</h2>
        <button onClick={onClose} className="p-2 text-2xl">✕</button>
      </div>
      
      <div className="flex-1 relative overflow-hidden bg-neutral-900 flex items-center justify-center">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          className="max-h-full max-w-full object-contain"
        />
        <canvas ref={canvasRef} className="hidden" />
      </div>

      <div className="p-8 bg-black flex justify-center items-center">
        <button 
          onClick={takePhoto}
          className="w-20 h-20 bg-white rounded-full border-8 border-neutral-400 active:bg-neutral-200 transition-colors"
        >
          <div className="w-14 h-14 border-4 border-black rounded-full mx-auto"></div>
        </button>
      </div>
      
      <div className="p-4 bg-black text-white text-center text-lg pb-10">
        请对准食物并按下中间按钮
      </div>
    </div>
  );
};

export default CameraModal;
