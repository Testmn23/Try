/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';


import StartScreen from './StartScreen';
import Canvas from './Canvas';
import WardrobePanel from './WardrobeModal';
import OutfitStack from './OutfitStack';
import { generateVirtualTryOnImage, generatePoseVariation, generateImageVariation, suggestOutfit } from '../services/geminiService';
import { OutfitLayer, WardrobeItem, Theme, SavedModel, SavedOutfit, ToastMessage } from '../types';
// Fix: Import missing ChevronUpIcon and ChevronDownIcon.
import { SparklesIcon, DownloadIcon, BookmarkIcon, ChevronUpIcon, ChevronDownIcon } from './icons';
import { defaultWardrobe } from '../wardrobe';
import Footer from './Footer';
import { getFriendlyErrorMessage } from '../lib/utils';
import Spinner from './Spinner';
import LandingPage from './LandingPage';
import PromptEditor from './PromptEditor';
import BackgroundSelector from './BackgroundSelector';
import AspectRatioSelector from './AspectRatioSelector';
import LegalModal from './LegalModal';
import ProfessionalShotsPanel from '../ProfessionalShotsPanel';
import Auth from './Auth';
import PurchaseCreditsModal from './PurchaseCreditsModal';
import PaymentSuccessPage from './PaymentSuccessPage';
import PaymentFailurePage from './PaymentFailurePage';
import Toast from './Toast';
import ProfileMenu from './ProfileMenu';
import SavedLooksPanel from './SavedLooksPanel';


const POSE_INSTRUCTIONS = [
  "Full frontal view, hands on hips",
  "Slightly turned, 3/4 view",
  "Side profile view",
  "Jumping in the air, mid-action shot",
  "Walking towards camera",
  "Leaning against a wall",
];


const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);

  useEffect(() => {
    const mediaQueryList = window.matchMedia(query);
    const listener = (event: MediaQueryListEvent) => setMatches(event.matches);

    mediaQueryList.addEventListener('change', listener);
    
    if (mediaQueryList.matches !== matches) {
      setMatches(mediaQueryList.matches);
    }

    return () => {
      mediaQueryList.removeEventListener('change', listener);
    };
  }, [query, matches]);

  return matches;
};

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [appState, setAppState] = useState<'landing' | 'app'>('landing');
  const [modelImageUrl, setModelImageUrl] = useState<string | null>(null);
  const [credits, setCredits] = useState(10);
  const [outfitHistory, setOutfitHistory] = useState<OutfitLayer[]>([]);
  const [currentOutfitIndex, setCurrentOutfitIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [currentPoseIndex, setCurrentPoseIndex] = useState(0);
  const [isSheetCollapsed, setIsSheetCollapsed] = useState(false);
  const [wardrobe, setWardrobe] = useState<WardrobeItem[]>(defaultWardrobe);
  const isMobile = useMediaQuery('(max-width: 767px)');
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('theme') as Theme) || 'system';
  });
  const [savedModels, setSavedModels] = useState<SavedModel[]>([]);
  const [savedOutfits, setSavedOutfits] = useState<SavedOutfit[]>([]);
  const [modelsLoading, setModelsLoading] = useState(true);
  const [legalModalContent, setLegalModalContent] = useState<string | null>(null);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [paymentStatusView, setPaymentStatusView] = useState<'success' | 'failure' | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'error', duration = 4000) => {
    setToast({ message, type });
    setTimeout(() => {
        setToast(null);
    }, duration);
  };

  const fetchProfile = useCallback(async () => {
      if (!session) return;
      try {
          const { data, error } = await supabase
              .from('profiles')
              .select('credits')
              .eq('id', session.user.id)
              .single();
          if (error) throw error;
          if (data) {
              setCredits(data.credits);
          }
      } catch (error) {
          console.error('Error fetching profile', error);
          showToast('Could not load your profile.', 'error');
      }
  }, [session]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get('status');
    const paymentId = params.get('payment_id');

    if (paymentId && status) {
        window.history.replaceState({}, document.title, window.location.pathname);
        if (status === 'succeeded') {
            setPaymentStatusView('success');
        } else {
            setPaymentStatusView('failure');
        }
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
        fetchProfile();
        setModelsLoading(true);

        const fetchUserData = async () => {
            try {
                const [modelsRes, outfitsRes] = await Promise.all([
                    supabase.from('saved_models').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false }),
                    supabase.from('saved_outfits').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false })
                ]);

                if (modelsRes.error) throw modelsRes.error;
                const mappedModels: SavedModel[] = modelsRes.data.map(dbModel => ({ id: dbModel.id, name: dbModel.name, imageUrl: dbModel.image_url }));
                setSavedModels(mappedModels);
                
                if (outfitsRes.error) throw outfitsRes.error;
                const mappedOutfits: SavedOutfit[] = outfitsRes.data.map(dbOutfit => ({
                    id: dbOutfit.id,
                    name: dbOutfit.name,
                    thumbnailUrl: dbOutfit.thumbnail_url,
                    outfitData: dbOutfit.outfit_data
                }));
                setSavedOutfits(mappedOutfits);

            } catch (error) {
                console.error('Error fetching user data', error);
                showToast('Could not load your saved creations.', 'error');
            } finally {
                setModelsLoading(false);
            }
        };
        fetchUserData();
    } else {
        // Clear user-specific data on logout
        setCredits(0);
        setSavedModels([]);
        setSavedOutfits([]);
        setModelsLoading(false);
    }
  }, [session, fetchProfile]);

  useEffect(() => {
    const root = window.document.documentElement;
    const isDark =
      theme === 'dark' ||
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    root.classList.toggle('dark', isDark);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Listener for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        const root = window.document.documentElement;
        root.classList.toggle('dark', mediaQuery.matches);
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);
  
  const activeGarmentIds = useMemo(() => {
    const activeLayers = outfitHistory.slice(0, currentOutfitIndex + 1);
    return activeLayers.map(layer => layer.garment?.id).filter(Boolean) as string[];
  }, [outfitHistory, currentOutfitIndex]);
  
  const displayImageUrl = useMemo(() => {
    if (outfitHistory.length === 0) return modelImageUrl;
    const currentLayer = outfitHistory[currentOutfitIndex];
    if (!currentLayer) return modelImageUrl;

    const poseInstruction = POSE_INSTRUCTIONS[currentPoseIndex];
    return currentLayer.poseImages[poseInstruction] ?? Object.values(currentLayer.poseImages)[0];
  }, [outfitHistory, currentOutfitIndex, currentPoseIndex, modelImageUrl]);

  const availablePoseKeys = useMemo(() => {
    if (outfitHistory.length === 0) return [];
    const currentLayer = outfitHistory[currentOutfitIndex];
    return currentLayer ? Object.keys(currentLayer.poseImages) : [];
  }, [outfitHistory, currentOutfitIndex]);

  const handleUseCredit = async () => {
    if (!session) return;
    const newCredits = Math.max(0, credits - 1);
    const oldCredits = credits;
    setCredits(newCredits); // Optimistic update
    const { error } = await supabase
        .from('profiles')
        .update({ credits: newCredits })
        .eq('id', session.user.id);
    if (error) {
        showToast("Couldn't save your credit usage.", 'error');
        setCredits(oldCredits); // Revert on error
    }
  };

  const handleAddCredits = () => {
    setIsPurchaseModalOpen(true);
  };
  
  const handlePurchase = async (creditAmount: number) => {
    if (!session) {
        showToast("You must be logged in to purchase credits.", 'error');
        return;
    }
    
    setIsPurchaseModalOpen(false);
    setLoadingMessage(`Preparing your secure checkout for ${creditAmount} credits...`);
    setIsLoading(true);

    try {
        const response = await fetch('/api/create-checkout-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                creditAmount, 
                user: { 
                    id: session.user.id, 
                    email: session.user.email 
                } 
            })
        });

        if (!response.ok) {
            const { error } = await response.json();
            throw new Error(error || 'Failed to create checkout session.');
        }

        const { checkoutUrl } = await response.json();
        window.location.href = checkoutUrl;

    } catch (error) {
        console.error("Failed to redirect to checkout:", error);
        showToast(getFriendlyErrorMessage(error, "Could not redirect to the payment page"));
        setIsLoading(false);
    }
  };

  const handleModelFinalized = (url: string) => {
    setModelImageUrl(url);
    setOutfitHistory([{
      garment: null,
      poseImages: { [POSE_INSTRUCTIONS[0]]: url }
    }]);
    setCurrentOutfitIndex(0);
    setCurrentPoseIndex(0);
  };

  const handleNewModel = () => {
    setModelImageUrl(null);
    setOutfitHistory([]);
    setCurrentOutfitIndex(0);
    setIsLoading(false);
    setLoadingMessage('');
    setCurrentPoseIndex(0);
  }

  const handleSaveModel = async (name: string, imageUrl: string) => {
    if (!session) return;
    const newModelData = {
        user_id: session.user.id,
        name,
        image_url: imageUrl,
    };
    setIsLoading(true);
    const { data, error } = await supabase
        .from('saved_models')
        .insert(newModelData)
        .select()
        .single();
    setIsLoading(false);
    
    if (error) {
        showToast("Couldn't save your model.", 'error');
    } else if (data) {
        const newModel: SavedModel = { id: data.id, name: data.name, imageUrl: data.image_url };
        setSavedModels(prev => [newModel, ...prev]);
        showToast('Model saved successfully!', 'success');
        handleModelFinalized(imageUrl);
    }
  };

  const handleDeleteModel = async (id: string) => {
    if (!session) return;
    const originalModels = savedModels;
    setSavedModels(prev => prev.filter(model => model.id !== id)); // Optimistic delete
    const { error } = await supabase
        .from('saved_models')
        .delete()
        .eq('id', id);
    if (error) {
        showToast("Couldn't delete the model.", 'error');
        setSavedModels(originalModels); // Revert on error
    } else {
        showToast('Model deleted.', 'success');
    }
  };

  const handleSaveLook = async () => {
    if (!session || !displayImageUrl || outfitHistory.length <= 1) {
        showToast("Add at least one garment to save a look.", 'info');
        return;
    }

    const lookName = prompt("Give your look a name:", `My Look ${savedOutfits.length + 1}`);
    if (!lookName) return;

    if (credits <= 0) {
        showToast("You are out of credits to save a look.", 'error');
        return;
    }

    setIsLoading(true);
    setLoadingMessage("Saving your look...");
    try {
        const newLookData = {
            user_id: session.user.id,
            name: lookName,
            thumbnail_url: displayImageUrl,
            outfit_data: outfitHistory,
        };
        const { data, error } = await supabase.from('saved_outfits').insert(newLookData).select().single();
        if (error) throw error;
        
        const newLook: SavedOutfit = { id: data.id, name: data.name, thumbnailUrl: data.thumbnail_url, outfitData: data.outfit_data };
        setSavedOutfits(prev => [newLook, ...prev]);
        await handleUseCredit();
        showToast("Look saved successfully!", 'success');
    } catch (err) {
        showToast(getFriendlyErrorMessage(err, 'Failed to save look'), 'error');
    } finally {
        setIsLoading(false);
    }
  };

  const handleLoadLook = (look: SavedOutfit) => {
    setOutfitHistory(look.outfitData);
    setCurrentOutfitIndex(look.outfitData.length - 1);
    setCurrentPoseIndex(0);
    showToast(`Loaded look: ${look.name}`, 'info');
  };

  const handleDeleteLook = async (id: string) => {
    if (!session) return;
    const originalOutfits = savedOutfits;
    setSavedOutfits(prev => prev.filter(o => o.id !== id)); // Optimistic
    const { error } = await supabase.from('saved_outfits').delete().eq('id', id);
    if (error) {
        showToast("Couldn't delete the look.", 'error');
        setSavedOutfits(originalOutfits);
    } else {
        showToast('Look deleted.', 'success');
    }
  };
  
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    // state will clear via onAuthStateChange listener
    setAppState('landing');
    handleNewModel(); // Reset app state
  };


  const handleStartOver = () => {
    handleNewModel();
    setIsSheetCollapsed(false);
  };

  const handleGarmentSelect = useCallback(async (garmentFile: File, garmentInfo: WardrobeItem) => {
    const baseImageUrl = displayImageUrl;
    if (!baseImageUrl || isLoading) return;

    if (credits <= 0) {
      showToast("You are out of credits to add a new garment.", 'error');
      return;
    }

    const nextLayer = outfitHistory[currentOutfitIndex + 1];
    if (nextLayer && nextLayer.garment?.id === garmentInfo.id) {
        setCurrentOutfitIndex(prev => prev + 1);
        setCurrentPoseIndex(0);
        return;
    }

    setIsLoading(true);
    setLoadingMessage(`Styling you in: ${garmentInfo.name}...`);

    try {
      const newImageUrl = await generateVirtualTryOnImage(baseImageUrl, garmentFile, garmentInfo);
      await handleUseCredit();
      const currentPoseInstruction = POSE_INSTRUCTIONS[currentPoseIndex];
      
      const newLayer: OutfitLayer = { 
        garment: garmentInfo, 
        poseImages: { [currentPoseInstruction]: newImageUrl } 
      };

      const newHistory = [...outfitHistory.slice(0, currentOutfitIndex + 1), newLayer];
      setOutfitHistory(newHistory);
      setCurrentOutfitIndex(newHistory.length - 1);
      
      setWardrobe(prev => {
        if (prev.find(item => item.id === garmentInfo.id)) {
            return prev;
        }
        return [...prev, garmentInfo];
      });
    } catch (err) {
      showToast(getFriendlyErrorMessage(String(err), 'Failed to apply garment'));
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [displayImageUrl, isLoading, currentPoseIndex, outfitHistory, currentOutfitIndex, credits]);

  const handleRemoveLastGarment = () => {
    if (currentOutfitIndex > 0) {
      setCurrentOutfitIndex(prevIndex => prevIndex - 1);
      setCurrentPoseIndex(0);
    }
  };

  const handleRevertToOutfit = (index: number) => {
    if (index >= 0 && index < outfitHistory.length) {
        setCurrentOutfitIndex(index);
        setCurrentPoseIndex(0);
    }
  };
  
  const handlePoseSelect = useCallback(async (newIndex: number) => {
    if (isLoading || outfitHistory.length === 0 || newIndex === currentPoseIndex) return;
    
    const poseInstruction = POSE_INSTRUCTIONS[newIndex];
    const currentLayer = outfitHistory[currentOutfitIndex];

    if (currentLayer.poseImages[poseInstruction]) {
      setCurrentPoseIndex(newIndex);
      return;
    }

    if (credits <= 0) {
      showToast("You are out of credits to generate a new pose.", 'error');
      return;
    }

    const baseImageForPoseChange = Object.values(currentLayer.poseImages)[0];
    if (!baseImageForPoseChange) return;

    setIsLoading(true);
    setLoadingMessage(`Changing your pose...`);
    
    const prevPoseIndex = currentPoseIndex;
    setCurrentPoseIndex(newIndex);

    try {
      const newImageUrl = await generatePoseVariation(baseImageForPoseChange, poseInstruction);
      await handleUseCredit();
      setOutfitHistory(prevHistory => {
        const newHistory = [...prevHistory];
        const updatedLayer = newHistory[currentOutfitIndex];
        updatedLayer.poseImages[poseInstruction] = newImageUrl;
        return newHistory;
      });
    } catch (err) {
      showToast(getFriendlyErrorMessage(String(err), 'Failed to change pose'));
      setCurrentPoseIndex(prevPoseIndex);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [currentPoseIndex, outfitHistory, isLoading, currentOutfitIndex, credits]);

  const handleImageEdit = useCallback(async (prompt: string, loadingMsg: string) => {
    if (!displayImageUrl || isLoading) return;

    if (credits <= 0) {
      showToast("You are out of credits for this action.", 'error');
      return;
    }

    setIsLoading(true);
    setLoadingMessage(loadingMsg);

    try {
      const newImageUrl = await generateImageVariation(displayImageUrl, prompt);
      await handleUseCredit();
      setOutfitHistory(prevHistory => {
        const newHistory = [...prevHistory];
        const currentLayer = newHistory[currentOutfitIndex];
        const currentPoseKey = POSE_INSTRUCTIONS[currentPoseIndex];
        currentLayer.poseImages[currentPoseKey] = newImageUrl;
        return newHistory;
      });
    } catch (err) {
      showToast(getFriendlyErrorMessage(String(err), 'Failed to apply changes'));
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [displayImageUrl, isLoading, currentOutfitIndex, currentPoseIndex, outfitHistory, credits]);
  
  const handleCreativeAI = useCallback(async (prompt: string, mode: 'remix' | 'mixtape') => {
    if (isLoading) return;

    if (mode === 'remix') {
        handleImageEdit(prompt, 'Remixing your style...');
    } else { // mixtape
        setIsLoading(true);
        setLoadingMessage(`Curating a "${prompt}" look...`);
        
        try {
            const outfitIds = await suggestOutfit(wardrobe, prompt);
            if (outfitIds.length === 0) {
                throw new Error("The AI couldn't create an outfit for that theme. Try another!");
            }

            // Revert to base model before applying new outfit
            setCurrentOutfitIndex(0);
            setCurrentPoseIndex(0);
            await new Promise(r => setTimeout(r, 100)); // allow state to update

            for (const id of outfitIds) {
                const item = wardrobe.find(w => w.id === id);
                if (item) {
                    const garmentFile = await (await fetch(item.url)).blob();
                    await handleGarmentSelect(new File([garmentFile], item.name, { type: garmentFile.type }), item);
                }
            }
        } catch (err) {
          showToast(getFriendlyErrorMessage(String(err), 'Style Mixtape failed'));
        } finally {
          setIsLoading(false);
          setLoadingMessage('');
        }
    }
  }, [wardrobe, isLoading, handleGarmentSelect, handleImageEdit]);

  const handleDeleteWardrobeItem = (id: string) => {
    setWardrobe(prev => prev.filter(item => item.id !== id));
    showToast("Item removed from your wardrobe.", 'success');
  };

  const handleDownload = () => {
    if (!displayImageUrl) return;
    const link = document.createElement('a');
    link.href = displayImageUrl;
    link.download = `virtual-try-on-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleTryAgainPurchase = () => {
    setPaymentStatusView(null);
    // Timeout to allow the view to change before the modal opens
    setTimeout(() => {
        handleAddCredits();
    }, 100); 
  }

  const customEase: [number, number, number, number] = [0.22, 1, 0.36, 1];
  const viewVariants = {
    initial: { opacity: 0, scale: 0.98 },
    animate: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: customEase } },
    exit: { opacity: 0, scale: 0.98, transition: { duration: 0.3, ease: customEase } },
  };
  
  if (paymentStatusView === 'success') {
    return <PaymentSuccessPage onContinue={() => {
        setPaymentStatusView(null);
        fetchProfile();
    }} />;
  }

  if (paymentStatusView === 'failure') {
      return <PaymentFailurePage onContinue={() => setPaymentStatusView(null)} onTryAgain={handleTryAgainPurchase} />;
  }

  if (!session) {
    return (
      <div className="font-sora bg-stone-50 text-stone-900 dark:bg-stone-950 dark:text-stone-200">
        <Auth />
      </div>
    );
  }

  return (
    <div className="font-sora bg-stone-50 text-stone-900 dark:bg-stone-950 dark:text-stone-200">
      <AnimatePresence>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </AnimatePresence>
      <AnimatePresence mode="wait">
        {appState === 'landing' ? (
          <motion.div
            key="landing"
            variants={viewVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <LandingPage onEnter={() => setAppState('app')} />
          </motion.div>
        ) : !modelImageUrl ? (
          <motion.div
            key="start-screen"
            className="w-screen min-h-screen flex items-start sm:items-center justify-center p-4 pb-20"
            variants={viewVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <StartScreen 
              onModelFinalized={handleModelFinalized}
              onSaveModel={handleSaveModel}
              onDeleteModel={handleDeleteModel}
              savedModels={savedModels}
              modelsLoading={modelsLoading}
              credits={credits} 
              onUseCredit={handleUseCredit}
              onAddCredits={handleAddCredits}
            />
          </motion.div>
        ) : (
          <motion.div
            key="main-app"
            className="relative flex flex-col h-screen overflow-hidden"
            variants={viewVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <main className="flex-grow relative flex flex-col md:flex-row overflow-hidden">
              <div className="w-full h-full flex-grow flex items-center justify-center bg-stone-100 dark:bg-stone-900 pb-16 relative">
                 <div className="absolute top-4 right-4 z-30 flex flex-col items-end gap-3">
                   <div className="flex items-center gap-3">
                    <ProfileMenu 
                      session={session}
                      credits={credits}
                      theme={theme}
                      setTheme={setTheme}
                      onSignOut={handleSignOut}
                      onAddCredits={handleAddCredits}
                    />
                   </div>
                   <button
                      onClick={handleDownload}
                      disabled={!displayImageUrl || isLoading}
                      className="flex items-center justify-center text-center w-auto bg-stone-50/60 dark:bg-stone-950/60 border border-stone-300/80 dark:border-stone-700/80 text-stone-700 dark:text-stone-300 font-semibold py-2 px-3 rounded-full transition-all duration-200 ease-in-out hover:bg-stone-50 dark:hover:bg-stone-900 hover:border-stone-400 dark:hover:border-stone-600 active:scale-95 text-sm backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Download Image"
                    >
                      <DownloadIcon className="w-4 h-4" />
                    </button>
                </div>
                <Canvas 
                  displayImageUrl={displayImageUrl}
                  onStartOver={handleStartOver}
                  onNewModel={handleNewModel}
                  isLoading={isLoading}
                  loadingMessage={loadingMessage}
                  onSelectPose={handlePoseSelect}
                  poseInstructions={POSE_INSTRUCTIONS}
                  currentPoseIndex={currentPoseIndex}
                  availablePoseKeys={availablePoseKeys}
                  credits={credits}
                />
              </div>

              <aside 
                className={`absolute md:relative md:flex-shrink-0 bottom-0 right-0 h-auto md:h-full w-full md:w-1/3 md:max-w-sm bg-stone-50/80 dark:bg-stone-950/80 backdrop-blur-lg flex flex-col border-t md:border-t-0 md:border-l border-stone-200/60 dark:border-stone-800/60 transition-transform duration-500 ease-in-out ${isSheetCollapsed ? 'translate-y-[calc(100%-5rem)]' : 'translate-y-0'} md:translate-y-0`}
                style={{ transitionProperty: 'transform' }}
              >
                  <button 
                    onClick={() => setIsSheetCollapsed(!isSheetCollapsed)} 
                    className="md:hidden w-full h-20 flex-shrink-0 flex items-center justify-center bg-stone-100/80 dark:bg-stone-900/80 border-b border-stone-200/60 dark:border-stone-800/60"
                    aria-label={isSheetCollapsed ? 'Expand panel' : 'Collapse panel'}
                  >
                    <div className="flex flex-col items-center">
                        {isSheetCollapsed ? <ChevronUpIcon className="w-6 h-6 text-stone-600 dark:text-stone-400" /> : <ChevronDownIcon className="w-6 h-6 text-stone-600 dark:text-stone-400" />}
                        <p className="text-sm font-bold text-stone-800 dark:text-stone-200 mt-1">Style Panel</p>
                    </div>
                  </button>
                  
                  {/* Scrollable Content Area */}
                  <div className="flex-grow overflow-y-auto">
                    <div className="p-4 md:p-6 pb-20 flex flex-col gap-8">
                        {credits <= 1 && (
                         <div className="w-full flex items-center justify-between p-3 bg-red-500/10 rounded-lg border border-red-500/20 text-red-600 dark:text-red-500">
                            <p className="font-bold">Credits are low!</p>
                            <button 
                                onClick={handleAddCredits}
                                className="flex items-center justify-center text-center bg-stone-800 text-white font-semibold py-2 px-3 rounded-md transition-colors duration-200 ease-in-out hover:bg-stone-600 active:scale-95 text-sm"
                            >
                                <SparklesIcon className="w-4 h-4 mr-2" />
                                Get More
                            </button>
                         </div>
                        )}

                        <ProfessionalShotsPanel onSelect={handleImageEdit} isLoading={isLoading} credits={credits} />
                        <AspectRatioSelector onSelect={handleImageEdit} isLoading={isLoading} credits={credits} />
                        <PromptEditor onGenerate={handleCreativeAI} isLoading={isLoading} credits={credits} />
                        <BackgroundSelector onSelect={handleImageEdit} isLoading={isLoading} credits={credits} />
                        
                        <div className="relative">
                          <button 
                            onClick={handleSaveLook}
                            disabled={isLoading || outfitHistory.length <= 1}
                            className="absolute -top-10 right-0 flex items-center gap-2 text-sm font-semibold text-stone-600 dark:text-stone-400 hover:text-fuchsia-500 dark:hover:text-fuchsia-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <BookmarkIcon className="w-4 h-4" />
                            Save Look
                          </button>
                          <OutfitStack 
                            outfitHistory={outfitHistory}
                            currentOutfitIndex={currentOutfitIndex}
                            onRemoveLastGarment={handleRemoveLastGarment}
                            onRevertToOutfit={handleRevertToOutfit}
                          />
                        </div>

                        <SavedLooksPanel
                            savedOutfits={savedOutfits}
                            onLoadOutfit={handleLoadLook}
                            onDeleteOutfit={handleDeleteLook}
                            isLoading={isLoading}
                        />

                        <WardrobePanel
                          onGarmentSelect={handleGarmentSelect}
                          activeGarmentIds={activeGarmentIds}
                          isLoading={isLoading}
                          wardrobe={wardrobe}
                          credits={credits}
                          onDeleteItem={handleDeleteWardrobeItem}
                        />
                    </div>
                  </div>
              </aside>
            </main>
            <AnimatePresence>
              {isLoading && isMobile && (
                <motion.div
                  className="fixed inset-0 bg-stone-50/80 dark:bg-stone-950/80 backdrop-blur-md flex flex-col items-center justify-center z-50"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Spinner />
                  {loadingMessage && (
                    <p className="text-lg font-playfair text-stone-700 dark:text-stone-300 mt-4 text-center px-4">{loadingMessage}</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
      <Footer isOnDressingScreen={!!modelImageUrl} onOpenLegal={setLegalModalContent} />
      <LegalModal contentKey={legalModalContent} onClose={() => setLegalModalContent(null)} />
      <PurchaseCreditsModal 
        isOpen={isPurchaseModalOpen}
        onClose={() => setIsPurchaseModalOpen(false)}
        onPurchase={handlePurchase}
        isLoading={isLoading && loadingMessage.includes('Preparing your secure checkout')}
      />
    </div>
  );
};

export default App;