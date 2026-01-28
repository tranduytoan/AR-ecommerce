import React from 'react';
import { Button } from '@/Components/ui/button';
import { 
  ArrowLeft, 
  FlipHorizontal, 
  Settings2,
  Layers2,
  Camera,
  ShoppingCart
} from 'lucide-react';

interface ControlPanelProps {
  onBack: () => void;
  onSwapLayout: () => void;
  onToggleSliders: () => void;
  onToggleCompare: () => void;
  onCapture: () => void;
  slidersOpen: boolean;
  cameraIIEnabled: boolean;
  currentSlug?: string | null;
  onBuyProduct?: () => void;
}

export function ControlPanel({
  onBack,
  onSwapLayout,
  onToggleSliders,
  onToggleCompare,
  onCapture,
  slidersOpen,
  cameraIIEnabled,
  currentSlug,
  onBuyProduct,
}: ControlPanelProps) {
  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/70 backdrop-blur-xl px-6 py-4 rounded-full shadow-2xl z-10 no-dismiss">
      <Button
        onClick={onBack}
        title="Exit AR"
        className="h-10 px-4 rounded-full transition z-20 bg-white/10 hover:bg-white/20 text-white text-sm font-medium flex items-center gap-2"
      >
        <ArrowLeft className="size-4" />
        <span>Exit</span>
      </Button>

      {currentSlug && onBuyProduct && (
        <Button
          onClick={onBuyProduct}
          title="Buy Product"
          className="h-10 px-4 rounded-full transition z-20 bg-green-600 hover:bg-green-700 text-white text-sm font-medium flex items-center gap-2"
        >
          <ShoppingCart className="size-4" />
          <span>Buy</span>
        </Button>
      )}
      
      <Button
        onClick={onSwapLayout}
        title="Swap Layout"
        className="p-4 size-12 rounded-full hover:bg-white/20 transition"
      >
        <FlipHorizontal className="size-6 text-white" />
      </Button>

      <Button
        onClick={onToggleSliders}
        title="Config Try-On"
        className="p-4 size-12 rounded-full hover:bg-white/20 transition"
      >
        <Settings2 className={`size-6 text-white transition-transform ${slidersOpen ? 'rotate-90' : ''}`} />
      </Button>

      <Button
        onClick={onToggleCompare}
        title="Bật chế độ so sánh (2 camera)"
        className={`p-4 size-12 rounded-full transition ${
          cameraIIEnabled 
            ? 'bg-indigo-500/80 ring-4 ring-indigo-500/30' 
            : 'hover:bg-white/20'
        }`}
      >
        <Layers2 className="size-6 text-white" />
      </Button>

      <Button
        onClick={onCapture}
        title="Chụp ảnh AR"
        className="w-14 h-14 rounded-full bg-white hover:bg-gray-200 transition flex items-center justify-center shadow-lg"
      >
        <Camera className="size-6 text-gray-800" />
      </Button>
    </div>
  );
}
