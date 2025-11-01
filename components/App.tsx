/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import { getFriendlyErrorMessage } from '../lib/utils';
import { OutfitLayer, SavedModel, WardrobeItem, Theme, SavedOutfit } from '../types';
import * as geminiService from '../services/geminiService';
import { defaultWardrobe } from '../wardrobe';

import Auth from './Auth';
import LandingPage from './LandingPage';
import StartScreen from './StartScreen';
import PaymentSuccessPage from './PaymentSuccessPage';
import PaymentFailurePage from './PaymentFailurePage';
import Header from './Header';
import Footer from './Footer';
import Canvas from './Canvas';
import OutfitStack from './OutfitStack';
import WardrobeModal from './WardrobeModal';
import BackgroundSelector from './BackgroundSelector';
import AspectRatioSelector from './AspectRatioSelector';
import ProfessionalShotsPanel from '../ProfessionalShotsPanel';
import SavedLooksPanel from './SavedLooksPanel';
import StyleMixtapePanel from './StyleMixtapePanel';
import ProfileMenu from './ProfileMenu';
import LegalModal from './LegalModal';
import PurchaseCreditsModal from './PurchaseCreditsModal';
import ImageCropModal from './ImageCropModal';
import Toast from './Toast';
import { PlusIcon } from './icons';
import Spinner from './Spinner';

type AppScreen = 'initializing' | 'landing' | 'auth' | 'start' | 'dressing' | 'payment_success' | 'payment_failure';

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [credits, setCredits] = useState(0);
  const [appScreen, setAppScreen] = useState<AppScreen>('initializing');
  const [modelImageUrl, setModelImageUrl] = useState<string | null>(null);
  const [outfitHistory, setOutfitHistory] = useState<OutfitLayer[]>([]);
  const [currentOutfitIndex, setCurrentOutfitIndex] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
  const [savedModels, setSavedModels] = useState<SavedModel[]>([]);
  const [savedOutfits, setSavedOutfits] = useState<SavedOutfit[]>([]);
  const [modelsLoading, setModelsLoading] = useState(true);
  const [outfitsLoading, setOutfitsLoading] = useState(true);
  const [isWardrobeOpen, setIsWardrobeOpen] = useState(false);
  const [isLegalModalOpen, setLegalModalOpen] = useState<string | null>(null);
  const [isPurchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [isCropModalOpen, setCropModalOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<{ src: string, file: File, info: WardrobeItem } | null>(null);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);

  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
  };
  
  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase.from('profiles').select('credits').eq('id', userId).single();
    if (error) console.error('Error fetching profile:', error);
    else setCredits(data?.credits || 0);
  }, []);

  const fetchSavedModels = useCallback(async (userId: string) => {
    setModelsLoading(true);
    const { data, error } = await supabase.from('saved_models').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (error) console.error('Error fetching models:', error);
    else setSavedModels(data || []);
    setModelsLoading(false);
  }, []);

  const fetchSavedOutfits = useCallback(async (userId: string) => {
    setOutfitsLoading(true);
    const { data, error } = await supabase.from('saved_outfits').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (error) console.error('Error fetching outfits:', error);
    else setSavedOutfits(data || []);
    setOutfitsLoading(false);
  }, []);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      // Determine the correct screen *after* the session is known.
      if (currentUser) {
        setAppScreen('start');
        fetchProfile(currentUser.id);
        fetchSavedModels(currentUser.id);
        fetchSavedOutfits(currentUser.id);
      } else {
        // If there's a payment status, show that screen instead of landing.
        const urlParams = new URLSearchParams(window.location.search);
        const paymentStatus = urlParams.get('payment');
        if (paymentStatus === 'success') {
          setAppScreen('payment_success');
          window.history.replaceState({}, document.title, window.location.pathname);
        } else if (paymentStatus === 'canceled') {
          setAppScreen('payment_failure');
          window.history.replaceState({}, document.title, window.location.pathname);
        } else {
          setAppScreen('landing');
        }
      }

      // Handle SIGNED_OUT explicitly to clear data
      if (event === 'SIGNED_OUT') {
        setSavedModels([]);
        setSavedOutfits([]);
        setCredits(0);
        setModelImageUrl(null);
        setOutfitHistory([]);
      }
    });

    return () => authListener.subscription.unsubscribe();
  }, [fetchProfile, fetchSavedModels, fetchSavedOutfits]);


  const handleSignOut = async () => {
    await supabase.auth.signOut();
    // The onAuthStateChange listener will handle setting the screen to 'landing'
  };

  const handleModelFinalized = (imageUrl: string) => {
    setModelImageUrl(imageUrl);
    setOutfitHistory([{ imageUrl }]);
    setCurrentOutfitIndex(0);
    setAppScreen('dressing');
  };

  const handleSaveModel = async (name: string, imageUrl: string) => {
    if (!user) return;
    const { data, error } = await supabase.from('saved_models').insert({ user_id: user.id, name, image_url: imageUrl }).select();
    if (error) {
      showToast(getFriendlyErrorMessage(error, 'Failed to save model'), 'error');
    } else if(data) {
      setSavedModels([data[0], ...savedModels]);
      handleModelFinalized(imageUrl);
    }
  };

  const handleDeleteModel = async (id: string) => {
    const { error } = await supabase.from('saved_models').delete().eq('id', id);
    if (error) showToast(getFriendlyErrorMessage(error, 'Failed to delete model'), 'error');
    else setSavedModels(savedModels.filter(m => m.id !== id));
  };
  
  const handleUseCredit = useCallback(async () => {
    if (!user) return;
    const { error } = await supabase.rpc('decrement_credits', { p_user_id: user.id, p_amount: 1 });
    if (error) {
        showToast('Credit update failed.', 'error');
        throw new Error("Credit update failed");
    } else {
        setCredits(c => c - 1);
    }
  }, [user]);

  const handleAddCredits = () => {
      setPurchaseModalOpen(true);
  };
  
  const handlePurchase = async (creditAmount: number) => {
      if (!user) {
          showToast('You must be logged in to purchase credits.', 'error');
          return;
      }
      setLoadingMessage('Redirecting to checkout...');
      try {
          const response = await fetch('/api/create-checkout-session', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ creditAmount, user: { id: user.id, email: user.email } }),
          });
          const { checkoutUrl, error } = await response.json();
          if (error) throw new Error(error);
          window.location.href = checkoutUrl;
      } catch (err) {
          showToast(getFriendlyErrorMessage(err, 'Failed to create checkout session'), 'error');
          setLoadingMessage(null);
      }
  };

  const handleGarmentSelect = (garmentFile: File, garmentInfo: WardrobeItem) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      setImageToCrop({ src, file: garmentFile, info: garmentInfo });
      setCropModalOpen(true);
    };
    reader.readAsDataURL(garmentFile);
    setIsWardrobeOpen(false);
  };
  
  const performTryOn = async (garmentFile: File, garmentInfo: WardrobeItem) => {
    if (!modelImageUrl || outfitHistory.length === 0) return;
    setLoadingMessage(`Adding ${garmentInfo.name}...`);
    try {
      await handleUseCredit();
      const baseImageUrl = outfitHistory[currentOutfitIndex].imageUrl;
      const resultUrl = await geminiService.generateVirtualTryOnImage(baseImageUrl, garmentFile, garmentInfo);
      
      const newLayer: OutfitLayer = { garment: garmentInfo, imageUrl: resultUrl };
      const newHistory = outfitHistory.slice(0, currentOutfitIndex + 1);
      newHistory.push(newLayer);

      setOutfitHistory(newHistory);
      setCurrentOutfitIndex(newHistory.length - 1);
    } catch (err) {
      showToast(getFriendlyErrorMessage(err, 'Virtual try-on failed'), 'error');
    } finally {
      setLoadingMessage(null);
    }
  };

  const handleRemoveLastGarment = () => {
    if (currentOutfitIndex > 0) {
      const newIndex = currentOutfitIndex - 1;
      // Don't slice history, just move the pointer to enable "redo"
      setCurrentOutfitIndex(newIndex);
    }
  };
  
  const handleRevertToOutfit = (index: number) => {
    if (index >= 0 && index < outfitHistory.length) {
        setCurrentOutfitIndex(index);
    }
  };

  const handleImageVariation = async (prompt: string, loadingText: string) => {
    if (outfitHistory.length === 0 || credits <= 0) return;
    setLoadingMessage(loadingText);
    try {
      await handleUseCredit();
      const baseImageUrl = outfitHistory[currentOutfitIndex].imageUrl;
      const resultUrl = await geminiService.generateImageVariation(baseImageUrl, prompt);
      const newLayer: OutfitLayer = { ...outfitHistory[currentOutfitIndex], imageUrl: resultUrl };

      // Replace the current layer in history
      const newHistory = [...outfitHistory];
      newHistory[currentOutfitIndex] = newLayer;

      setOutfitHistory(newHistory);
    } catch (err) {
      showToast(getFriendlyErrorMessage(err, 'Failed to generate variation'), 'error');
    } finally {
      setLoadingMessage(null);
    }
  };
  
  const handleStyleMixtape = async (theme: string) => {
      if (!modelImageUrl || credits <= 0) return;
      setLoadingMessage(`Creating a '${theme}' outfit...`);
      try {
          await handleUseCredit();
          const outfitIds = await geminiService.suggestOutfit(defaultWardrobe, theme);
          if (outfitIds.length === 0) {
              showToast("Couldn't create an outfit for that theme. Try another one!", 'info');
              setLoadingMessage(null);
              return;
          }
          
          let currentImageUrl = modelImageUrl;
          const newLayers: OutfitLayer[] = [{ imageUrl: modelImageUrl }];
          
          for (const id of outfitIds) {
              const item = defaultWardrobe.find(i => i.id === id);
              if(item) {
                  setLoadingMessage(`Adding ${item.name}...`);
                  const response = await fetch(item.url);
                  const blob = await response.blob();
                  const file = new File([blob], `${item.id}.png`, { type: blob.type });

                  currentImageUrl = await geminiService.generateVirtualTryOnImage(currentImageUrl, file, item);
                  newLayers.push({ garment: item, imageUrl: currentImageUrl });
              }
          }
          
          const newHistory = [ ...newLayers];
          setOutfitHistory(newHistory);
          setCurrentOutfitIndex(newHistory.length - 1);

      } catch (err) {
          showToast(getFriendlyErrorMessage(err, 'Style Mixtape failed'), 'error');
      } finally {
          setLoadingMessage(null);
      }
  };

  const handleSaveOutfit = async () => {
    // This function would be triggered by a "Save" button, which is not currently in the UI
    if (!user || outfitHistory.length <= 1) {
        showToast('Cannot save an empty outfit.', 'info');
        return;
    }
    const name = prompt("Enter a name for this look:", "My New Style");
    if (!name) return;

    setLoadingMessage("Saving look...");
    try {
        const { data, error } = await supabase.from('saved_outfits').insert({
            user_id: user.id,
            name: name,
            thumbnail_url: outfitHistory[currentOutfitIndex].imageUrl,
            layers: outfitHistory
        }).select();

        if (error) throw error;

        if (data) {
          setSavedOutfits([data[0], ...savedOutfits]);
          showToast('Look saved!', 'success');
        }
    } catch (err) {
        showToast(getFriendlyErrorMessage(err, 'Failed to save look'), 'error');
    } finally {
        setLoadingMessage(null);
    }
};

  const handleLoadOutfit = (outfit: SavedOutfit) => {
      if (outfit.layers && outfit.layers.length > 0) {
          setModelImageUrl(outfit.layers[0].imageUrl);
          setOutfitHistory(outfit.layers);
          setCurrentOutfitIndex(outfit.layers.length - 1);
          setAppScreen('dressing');
      } else {
          showToast('This saved look is empty or corrupted.', 'error');
      }
  };
  
  const handleDeleteOutfit = async (id: string) => {
      const { error } = await supabase.from('saved_outfits').delete().eq('id', id);
      if (error) showToast(getFriendlyErrorMessage(error, 'Failed to delete look'), 'error');
      else setSavedOutfits(savedOutfits.filter(o => o.id !== id));
  };


  const renderScreen = () => {
    switch (appScreen) {
      case 'initializing': return <div className="w-full h-full flex items-center justify-center"><Spinner /></div>;
      case 'landing': return <LandingPage onEnter={() => setAppScreen(user ? 'start' : 'auth')} />;
      case 'auth': return <Auth />;
      case 'start': return (
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
      );
      case 'payment_success': return <PaymentSuccessPage onContinue={() => setAppScreen('start')} />;
      case 'payment_failure': return <PaymentFailurePage onContinue={() => setAppScreen('start')} onTryAgain={() => setPurchaseModalOpen(true)} />;
      case 'dressing':
        const currentLayer = outfitHistory[currentOutfitIndex];
        if (!currentLayer) return null; // Add a guard clause in case history is empty
        return (
          <div className="w-full h-full flex flex-col md:flex-row gap-6 p-4 md:p-6">
            {/* Left Panel */}
            <div className="w-full md:w-80 lg:w-96 flex-shrink-0 flex flex-col gap-6">
              <OutfitStack 
                outfitHistory={outfitHistory}
                currentOutfitIndex={currentOutfitIndex}
                onRemoveLastGarment={handleRemoveLastGarment}
                onRevertToOutfit={handleRevertToOutfit}
              />
              <StyleMixtapePanel onGenerate={handleStyleMixtape} isLoading={!!loadingMessage} credits={credits}/>
            </div>

            {/* Center Canvas */}
            <div className="flex-grow flex flex-col items-center justify-center min-h-[400px]">
              <Canvas imageUrl={currentLayer.imageUrl} loadingMessage={loadingMessage} />
            </div>

            {/* Right Panel */}
            <div className="w-full md:w-80 lg:w-96 flex-shrink-0 flex flex-col gap-6">
              <button
                onClick={() => setIsWardrobeOpen(true)}
                className="w-full flex items-center justify-center text-center bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-semibold py-3 px-4 rounded-lg transition-colors duration-200 ease-in-out hover:bg-stone-700 dark:hover:bg-stone-300 active:scale-95 text-base"
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                Add Garment
              </button>
              <div className="p-4 rounded-2xl bg-stone-100/80 dark:bg-stone-900/80 backdrop-blur-md border border-stone-200/60 dark:border-stone-800/60 space-y-6 overflow-y-auto">
                <BackgroundSelector onSelect={handleImageVariation} isLoading={!!loadingMessage} credits={credits} />
                <AspectRatioSelector onSelect={handleImageVariation} isLoading={!!loadingMessage} credits={credits} />
                <ProfessionalShotsPanel onSelect={handleImageVariation} isLoading={!!loadingMessage} credits={credits} />
                <SavedLooksPanel 
                    savedOutfits={savedOutfits} 
                    onLoadOutfit={handleLoadOutfit} 
                    onDeleteOutfit={handleDeleteOutfit}
                    isLoading={!!loadingMessage || outfitsLoading}
                />
              </div>
            </div>
          </div>
        );
      default: return null;
    }
  };

  const isDressingScreen = appScreen === 'dressing';

  return (
    <div className={`min-h-screen w-full font-sora bg-stone-50 dark:bg-stone-950 flex flex-col items-center ${isDressingScreen ? '' : 'justify-center'}`}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      {isDressingScreen && <Header />}

      {session && (
        <div className="fixed top-5 right-5 z-50">
          <ProfileMenu 
            session={session} 
            credits={credits} 
            theme={theme} 
            setTheme={setTheme} 
            onSignOut={handleSignOut} 
            onAddCredits={handleAddCredits}
          />
        </div>
      )}

      <main className={`w-full flex-grow flex items-center justify-center ${isDressingScreen ? 'pt-20 pb-20' : 'p-4'}`}>
        {renderScreen()}
      </main>

      <Footer isOnDressingScreen={isDressingScreen} onOpenLegal={setLegalModalOpen} />
      
      <WardrobeModal
        isOpen={isWardrobeOpen}
        onClose={() => setIsWardrobeOpen(false)}
        onGarmentSelect={handleGarmentSelect}
        activeGarmentIds={outfitHistory.map(l => l.garment?.id).filter(Boolean) as string[]}
        isLoading={!!loadingMessage}
      />

      <ImageCropModal 
        isOpen={isCropModalOpen}
        onClose={() => setCropModalOpen(false)}
        onSkip={() => {
          if (imageToCrop) performTryOn(imageToCrop.file, imageToCrop.info);
          setCropModalOpen(false);
        }}
        onConfirm={(croppedFile) => {
          if (imageToCrop) performTryOn(croppedFile, imageToCrop.info);
          setCropModalOpen(false);
        }}
        imageSrc={imageToCrop?.src || ''}
        originalFileName={imageToCrop?.file.name || 'cropped.png'}
      />

      <LegalModal contentKey={isLegalModalOpen} onClose={() => setLegalModalOpen(null)} />
      
      <PurchaseCreditsModal
        isOpen={isPurchaseModalOpen}
        onClose={() => setPurchaseModalOpen(false)}
        onPurchase={handlePurchase}
        isLoading={!!loadingMessage}
      />
    </div>
  );
};

export default App;