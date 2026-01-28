"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-converter';
import '@tensorflow/tfjs-backend-webgl';

import { preloadARModel } from '@/hooks/useAREngine';
import { getSlugByModelName, getProductUrl } from '@/lib/ar/arProductMapping';

export interface ARTryOnPageProps {
  initialSlug?: string | null;
  initialModelName?: string | null;
  initialProductType?: 'hat' | 'glasses' | null;
}
import { useCameraManager } from './hooks/useCameraManager';
import { useProductManager } from './hooks/useProductManager';
import { useARControls } from './hooks/useARControls';
import { DualCameraView } from './components/DualCameraView';
import { SingleCameraView, type ViewMode, type ProductType } from './components/SingleCameraView';
import { ControlPanel } from './components/ControlPanel';
import { ARSettingsSliders } from './components/ARSettingsSliders';
import { LoadingScreen, ErrorScreen } from './components/LoadingAndError';
import { CapturePreviewModal } from './components/CapturePreviewModal';
import { captureVideoWithCanvasAsync, captureDualCamerasAsync, downloadImage } from './utils/captureUtils';
import type { ARSettings, ARModelSettings } from './types';

const DEFAULT_MODEL_SETTINGS: ARModelSettings = {
  scale: 100,
  offsetX: 50,
  offsetY: 50,
  opacity: 100,
  color: "#aabbcc",
};

export default function ARTryOnPage({
  initialSlug = null,
  initialModelName = null,
  initialProductType = null,
}: ARTryOnPageProps = {}) {
  const router = useRouter();
  const arContainerRef = useRef<HTMLDivElement | null>(null);
  const [currentModelName, setCurrentModelName] = useState<string | null>(initialModelName);
  const initialSelectionApplied = useRef(false);

  const [cameraIIEnabled, setCameraIIEnabled] = useState(false);
  const [swapLayout, setSwapLayout] = useState(false);
  const [slidersOpen, setSlidersOpen] = useState(false);
  
  const [viewMode, setViewMode] = useState<ViewMode>('camera');
  const [lastSelectedTypeI, setLastSelectedTypeI] = useState<ProductType>(null);

  const [showGlassListI, setShowGlassListI] = useState(false);
  const [showGlassListII, setShowGlassListII] = useState(false);
  const [showHatListI, setShowHatListI] = useState(false);
  const [showHatListII, setShowHatListII] = useState(false);

  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [showCaptureModal, setShowCaptureModal] = useState(false);

  const [arSettings, setArSettings] = useState<ARSettings>({
    modelI: { ...DEFAULT_MODEL_SETTINGS },
    modelII: { ...DEFAULT_MODEL_SETTINGS },
  });

  const { videoIRef, videoIIRef, camerasReady, error, startCameras, stopStreams } = 
    useCameraManager(cameraIIEnabled);
  
  const { productGlassesList, productHatList } = useProductManager();
  
  const {
    arEnabledI,
    arEnabledII,
    selectedGlassProductI,
    selectedGlassProductII,
    selectedHatProductI,
    selectedHatProductII,
    canvasRefI,
    canvasRefII,
    handleSelectedGlassProductI,
    handleSelectedGlassProductII,
    handleSelectedHatProductI,
    handleSelectedHatProductII,
    toggleARI,
    toggleARII,
    resetAR,
    setSettingsI,
    setSettingsII,
  } = useARControls(productGlassesList, productHatList);

  const handleBackButton = () => {
    router.replace('/');
    stopStreams();
  };

  const resetSettingsToDefault = () => {
    const defaultEngineSettings = {
      scale: DEFAULT_MODEL_SETTINGS.scale,
      offsetX: DEFAULT_MODEL_SETTINGS.offsetX,
      offsetY: DEFAULT_MODEL_SETTINGS.offsetY,
      opacity: DEFAULT_MODEL_SETTINGS.opacity,
    };
    setSettingsI(defaultEngineSettings);
    setSettingsII(defaultEngineSettings);
    setArSettings({
      modelI: { ...DEFAULT_MODEL_SETTINGS },
      modelII: { ...DEFAULT_MODEL_SETTINGS },
    });
  };

  const resetSettingsI = () => {
    const defaultEngineSettings = {
      scale: DEFAULT_MODEL_SETTINGS.scale,
      offsetX: DEFAULT_MODEL_SETTINGS.offsetX,
      offsetY: DEFAULT_MODEL_SETTINGS.offsetY,
      opacity: DEFAULT_MODEL_SETTINGS.opacity,
    };
    setSettingsI(defaultEngineSettings);
    setArSettings(prev => ({ ...prev, modelI: { ...DEFAULT_MODEL_SETTINGS } }));
  };

  const resetSettingsII = () => {
    const defaultEngineSettings = {
      scale: DEFAULT_MODEL_SETTINGS.scale,
      offsetX: DEFAULT_MODEL_SETTINGS.offsetX,
      offsetY: DEFAULT_MODEL_SETTINGS.offsetY,
      opacity: DEFAULT_MODEL_SETTINGS.opacity,
    };
    setSettingsII(defaultEngineSettings);
    setArSettings(prev => ({ ...prev, modelII: { ...DEFAULT_MODEL_SETTINGS } }));
  };

  const handleCompareButton = () => {
    setCameraIIEnabled(!cameraIIEnabled);
    resetAR();
    resetSettingsToDefault();
    setViewMode('camera');
    setLastSelectedTypeI(null);
  };
  
  const handleToggleViewMode = () => {
    const newMode = viewMode === 'camera' ? '3d-viewer' : 'camera';
    setViewMode(newMode);
    
    // When switching back to camera mode, need to trigger AR restart if AR was enabled
    if (newMode === 'camera' && arEnabledI) {
      // Force re-trigger AR by toggling it off and on
      toggleARI();
      setTimeout(() => {
        toggleARI();
      }, 100);
    }
  };

  const updateSettingsI = (updates: Partial<ARModelSettings>) => {
    setArSettings(prev => {
      const newModelI = { ...prev.modelI, ...updates };
      setSettingsI({
        scale: newModelI.scale,
        offsetX: newModelI.offsetX,
        offsetY: newModelI.offsetY,
        opacity: newModelI.opacity,
      });
      return { ...prev, modelI: newModelI };
    });
  };

  const updateSettingsII = (updates: Partial<ARModelSettings>) => {
    setArSettings(prev => {
      const newModelII = { ...prev.modelII, ...updates };
      setSettingsII({
        scale: newModelII.scale,
        offsetX: newModelII.offsetX,
        offsetY: newModelII.offsetY,
        opacity: newModelII.opacity,
      });
      return { ...prev, modelII: newModelII };
    });
  };

  const onSelectGlassProductI = (index: number) => {
    resetSettingsI();
    handleSelectedGlassProductI(index);
    setLastSelectedTypeI('glasses');
    if (productGlassesList[index]) {
      setCurrentModelName(productGlassesList[index].name);
    }
  };

  const onSelectGlassProductII = (index: number) => {
    resetSettingsII();
    handleSelectedGlassProductII(index);
  };

  const onSelectHatProductI = (index: number) => {
    resetSettingsI();
    handleSelectedHatProductI(index);
    setLastSelectedTypeI('hat');
    if (productHatList[index]) {
      setCurrentModelName(productHatList[index].name);
    }
  };

  const onSelectHatProductII = (index: number) => {
    resetSettingsII();
    handleSelectedHatProductII(index);
  };

  const handleCapture = useCallback(async () => {
    let imageUrl: string | null = null;
    
    if (cameraIIEnabled) {
      imageUrl = await captureDualCamerasAsync(
        videoIRef.current,
        canvasRefI.current,
        videoIIRef.current,
        canvasRefII.current,
        true
      );
    } else {
      imageUrl = await captureVideoWithCanvasAsync(
        videoIRef.current,
        canvasRefI.current,
        true
      );
    }
    
    if (imageUrl) {
      setCapturedImage(imageUrl);
      setShowCaptureModal(true);
    }
  }, [cameraIIEnabled, videoIRef, videoIIRef, canvasRefI, canvasRefII]);

  const handleSaveCapture = useCallback(() => {
    if (capturedImage) {
      downloadImage(capturedImage);
      setShowCaptureModal(false);
      setCapturedImage(null);
    }
  }, [capturedImage]);

  const handleCloseCaptureModal = useCallback(() => {
    setShowCaptureModal(false);
    setCapturedImage(null);
  }, []);

  const currentSlug = currentModelName ? getSlugByModelName(currentModelName) : null;

  const handleBuyProduct = useCallback(() => {
    if (currentSlug) {
      router.push(getProductUrl(currentSlug));
      stopStreams();
    }
  }, [currentSlug, router, stopStreams]);

  useEffect(() => {
    preloadARModel().catch(console.error);
  }, []);

  useEffect(() => {
    if (initialSelectionApplied.current) return;
    if (!initialModelName || !initialProductType) return;
    if (!camerasReady) return;
    
    const productList = initialProductType === 'glasses' ? productGlassesList : productHatList;
    if (productList.length === 0) return;
    
    const productIndex = productList.findIndex(p => p.name === initialModelName);
    if (productIndex !== -1) {
      initialSelectionApplied.current = true;
      if (initialProductType === 'glasses') {
        onSelectGlassProductI(productIndex);
      } else {
        onSelectHatProductI(productIndex);
      }
    }
  }, [camerasReady, productGlassesList, productHatList, initialModelName, initialProductType]);

  useEffect(() => {
    return () => {
      tf.disposeVariables();
    };
  }, []);

  useEffect(() => {
    const handler = (e: PointerEvent) => {
      const target = e.target as Node;
      if (!arContainerRef.current) return;
      if (!arContainerRef.current.contains(target) && 
          !(target instanceof Element && target.closest('.no-dismiss'))) {
        setSlidersOpen(false);
      }
    };

    document.addEventListener("pointerdown", handler);
    return () => document.removeEventListener("pointerdown", handler);
  }, [slidersOpen]);

  return (
    <>
      <div className="relative w-full h-screen bg-black overflow-hidden">
        <div className="relative w-full h-full flex items-center justify-center p-4">
          <div
            className={`
              w-full bg-black h-full rounded-3xl overflow-hidden shadow-2xl
              transition-all duration-500 ease-out
              ${cameraIIEnabled
                ? "h-full max-w-5xl"
                : "h-[80vh] max-h-screen aspect-video"
              }
            `}
          >
            {cameraIIEnabled ? (
              <DualCameraView
                videoIRef={videoIRef}
                videoIIRef={videoIIRef}
                canvasRefI={canvasRefI}
                canvasRefII={canvasRefII}
                arEnabledI={arEnabledI}
                arEnabledII={arEnabledII}
                swapLayout={swapLayout}
                productGlassesList={productGlassesList}
                productHatList={productHatList}
                selectedGlassProductI={selectedGlassProductI}
                selectedGlassProductII={selectedGlassProductII}
                selectedHatProductI={selectedHatProductI}
                selectedHatProductII={selectedHatProductII}
                showGlassListI={showGlassListI}
                showGlassListII={showGlassListII}
                showHatListI={showHatListI}
                showHatListII={showHatListII}
                onToggleGlassListI={() => setShowGlassListI(v => !v)}
                onToggleGlassListII={() => setShowGlassListII(v => !v)}
                onToggleHatListI={() => setShowHatListI(v => !v)}
                onToggleHatListII={() => setShowHatListII(v => !v)}
                onSelectGlassProductI={onSelectGlassProductI}
                onSelectGlassProductII={onSelectGlassProductII}
                onSelectHatProductI={onSelectHatProductI}
                onSelectHatProductII={onSelectHatProductII}
                onToggleARI={toggleARI}
                onToggleARII={toggleARII}
              />
            ) : (
              <SingleCameraView
                videoRef={videoIRef}
                canvasRef={canvasRefI}
                arEnabled={arEnabledI}
                productGlassesList={productGlassesList}
                productHatList={productHatList}
                selectedGlassProduct={selectedGlassProductI}
                selectedHatProduct={selectedHatProductI}
                lastSelectedType={lastSelectedTypeI}
                showGlassList={showGlassListI}
                showHatList={showHatListI}
                onToggleGlassList={() => setShowGlassListI(v => !v)}
                onToggleHatList={() => setShowHatListI(v => !v)}
                onSelectGlassProduct={onSelectGlassProductI}
                onSelectHatProduct={onSelectHatProductI}
                onToggleAR={toggleARI}
                viewMode={viewMode}
                onToggleViewMode={handleToggleViewMode}
              />
            )}
          </div>
        </div>

        <ControlPanel
          onBack={handleBackButton}
          onSwapLayout={() => setSwapLayout(v => !v)}
          onToggleSliders={() => setSlidersOpen(v => !v)}
          onToggleCompare={handleCompareButton}
          onCapture={handleCapture}
          slidersOpen={slidersOpen}
          cameraIIEnabled={cameraIIEnabled}
          currentSlug={currentSlug}
          onBuyProduct={handleBuyProduct}
        />

        <ARSettingsSliders
          settings={arSettings}
          onSettingsChangeI={updateSettingsI}
          onSettingsChangeII={updateSettingsII}
          show={slidersOpen}
          isDualMode={cameraIIEnabled}
        />

        <LoadingScreen show={!camerasReady && !error} />
        <ErrorScreen error={error} onRetry={startCameras} />

        <CapturePreviewModal
          imageUrl={capturedImage}
          onClose={handleCloseCaptureModal}
          onSave={handleSaveCapture}
        />
      </div>
    </>
  );
}
