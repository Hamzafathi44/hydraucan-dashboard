import React, { useState, useEffect } from 'react';
import { motion as Motion } from 'motion/react';
import { Loader2, MapPin, ChevronLeft, ChevronRight, Save, Navigation, X } from 'lucide-react';
import { generateSrmPdf } from '../srmPdfGenerator';
import SrmCheckboxItem from './SrmCheckboxItem';
import SrmMapPicker from './SrmMapPicker';

export const SrmReportModal = ({ isOpen, onClose, onSave, initialData }) => {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [form, setForm] = useState({
    date: '', nCompteur: '', adresse: '', x: '', y: '', mapType: 'Normal', estimation: '',
    obs1: '', obs2: '', mat1: '', mat2: '',
    fuite_can: false, fuite_bra: false,
    mat_ac: false, mat_fg: false, mat_fd: false, mat_pe: false, mat_pvc: false,
    type_casse: false, type_fissure: false, type_joint: false, type_presse: false, type_autre: false,
    debit_fai: false, debit_moy: false, debit_for: false,
    vis_oui: false, vis_non: false, vis_aff: false, vis_autre: false,
    org_ter: false, org_mau: false, org_cor: false, org_autre: false
  });

  const [savedAddresses, setSavedAddresses] = useState(() => {
    const saved = localStorage.getItem('srm_saved_addresses');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setForm(initialData);
      } else {
        // Reset for new 
        setForm({
          date: '', nCompteur: '', adresse: '', x: '', y: '', mapType: 'Normal', estimation: '',
          obs1: '', obs2: '', mat1: '', mat2: '',
          fuite_can: false, fuite_bra: false,
          mat_ac: false, mat_fg: false, mat_fd: false, mat_pe: false, mat_pvc: false,
          type_casse: false, type_fissure: false, type_joint: false, type_presse: false, type_autre: false,
          debit_fai: false, debit_moy: false, debit_for: false,
          vis_oui: false, vis_non: false, vis_aff: false, vis_autre: false,
          org_ter: false, org_mau: false, org_cor: false, org_autre: false
        });
      }
      setStep(1);
    }
  }, [isOpen, initialData]);

  useEffect(() => {
    localStorage.setItem('srm_saved_addresses', JSON.stringify(savedAddresses));
  }, [savedAddresses]);

  if (!isOpen) return null;

  const handleAddAddress = () => {
    if (form.adresse && form.adresse.trim() !== '' && !savedAddresses.includes(form.adresse)) {
      setSavedAddresses([...savedAddresses, form.adresse]);
    }
  };

  const handleRemoveAddress = () => {
    if (form.adresse) {
      setSavedAddresses(savedAddresses.filter(a => a !== form.adresse));
      setForm(prev => ({ ...prev, adresse: '' }));
    }
  };

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setForm(prev => ({
            ...prev,
            x: position.coords.longitude.toFixed(6),
            y: position.coords.latitude.toFixed(6)
          }));
        },
        (error) => {
          alert("Erreur de géolocalisation: " + error.message);
        }
      );
    } else {
      alert("La géolocalisation n'est pas supportée.");
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const nextStep = () => setStep(prev => Math.min(prev + 1, 3));
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));
  
  const handleSaveAction = async () => {
    setLoading(true);
    const success = await onSave(form);
    if (success) {
      if (!initialData) {
        await generateSrmPdf(form);
      }
      setLoading(false);
      onClose();
    } else {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
      <Motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl relative my-8"
      >
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <SrmMapPicker 
          isOpen={isMapOpen} 
          onClose={() => setIsMapOpen(false)} 
          onConfirm={(coords) => setForm(prev => ({ ...prev, x: coords.x, y: coords.y, mapType: coords.mapType || 'Normal' }))} 
          initialLocation={{ x: form.x, y: form.y }}
        />

        <div className="p-8 pb-4 border-b border-line">
          <h2 className="text-2xl font-black text-slate-900">
            {initialData ? "Modifier le rapport SRM" : "Nouveau Rapport SRM"}
          </h2>
          <p className="text-slate-500 text-sm font-medium mt-1">Saisie complète des données d'intervention</p>
        </div>

        {/* Progress Stepper */}
        <div className="px-8 mt-6">
          <div className="flex items-center justify-between relative max-w-xs mx-auto">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1.5 rounded-full -z-10 overflow-hidden bg-slate-100 border border-line">
              <div className="h-full bg-accent transition-all duration-500" style={{ width: `${((step - 1) / 2) * 100}%` }}></div>
            </div>
            {[1, 2, 3].map(item => (
              <div 
                key={item} 
                onClick={() => setStep(item)}
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold cursor-pointer transition-all shadow-sm border-[3px] ${
                  step >= item 
                    ? 'bg-accent border-white text-ink shadow-md scale-110' 
                    : 'bg-white border-slate-100 text-slate-300'
                }`}
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="p-8 min-h-[400px]">
          {/* Step 1 */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Date</label>
                  <input type="date" name="date" value={form.date} onChange={handleInputChange} className="input-field w-full" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Nº Compteur (Réf)</label>
                  <input type="text" name="nCompteur" value={form.nCompteur} onChange={handleInputChange} className="input-field w-full" />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-end mb-2">
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-400">Adresse Exacte</label>
                  <div className="flex gap-2">
                    <select 
                      className="text-xs px-3 py-2 rounded-xl border border-line outline-none font-medium cursor-pointer transition-colors bg-slate-50 text-slate-600 focus:ring-2"
                      onChange={(e) => { if(e.target.value) setForm(prev => ({...prev, adresse: e.target.value})); }}
                      value=""
                    >
                      <option value="">Adresses Récentes...</option>
                      {savedAddresses.map((addr, i) => <option key={i} value={addr}>{addr.substring(0,20)}...</option>)}
                    </select>
                    <button onClick={handleAddAddress} className="w-8 h-8 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 font-bold">+</button>
                    <button onClick={handleRemoveAddress} className="w-8 h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 font-bold">-</button>
                  </div>
                </div>
                <textarea 
                  name="adresse" value={form.adresse} onChange={handleInputChange} 
                  rows="2" className="input-field w-full resize-y"
                ></textarea>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative mt-2 pt-4 border-t border-line border-dashed">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Longitude GPS (X)</label>
                  <input type="text" name="x" value={form.x} onChange={handleInputChange} className="input-field w-full" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Latitude GPS (Y)</label>
                  <input type="text" name="y" value={form.y} onChange={handleInputChange} className="input-field w-full" />
                </div>
                
                <div className="md:absolute left-1/2 md:top-[50px] md:-translate-x-1/2 flex justify-center gap-3 w-full md:w-auto mt-4 md:mt-0">
                  <button onClick={handleGetLocation} className="w-10 h-10 rounded-full flex items-center justify-center text-white bg-blue-500 shadow-md hover:scale-105 transition-transform" title="GPS Actuel">
                    <Navigation className="w-4 h-4" />
                  </button>
                  <button onClick={() => setIsMapOpen(true)} className="w-10 h-10 rounded-full flex items-center justify-center text-white bg-indigo-500 shadow-md hover:scale-105 transition-transform" title="Pointer sur la carte">
                    <MapPin className="w-4 h-4 fill-indigo-100" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xs font-black uppercase mb-3 text-slate-800">1. Élément Fuite</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <SrmCheckboxItem label="Canalisation" name="fuite_can" form={form} handleInputChange={handleInputChange} />
                      <SrmCheckboxItem label="Branchement" name="fuite_bra" form={form} handleInputChange={handleInputChange} />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase mb-3 text-slate-800">2. Matériau</h3>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                      <SrmCheckboxItem label="AC" name="mat_ac" form={form} handleInputChange={handleInputChange} />
                      <SrmCheckboxItem label="FG" name="mat_fg" form={form} handleInputChange={handleInputChange} />
                      <SrmCheckboxItem label="FD" name="mat_fd" form={form} handleInputChange={handleInputChange} />
                      <SrmCheckboxItem label="PE" name="mat_pe" form={form} handleInputChange={handleInputChange} />
                      <SrmCheckboxItem label="PVC" name="mat_pvc" form={form} handleInputChange={handleInputChange} />
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-xs font-black uppercase mb-3 text-slate-800">3. Origine & Visualisation</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <SrmCheckboxItem label="Oui, visible" name="vis_oui" form={form} handleInputChange={handleInputChange} />
                      <SrmCheckboxItem label="Affaissement" name="vis_aff" form={form} handleInputChange={handleInputChange} />
                      <SrmCheckboxItem label="Casse cire" name="type_casse" form={form} handleInputChange={handleInputChange} />
                      <SrmCheckboxItem label="Fissure" name="type_fissure" form={form} handleInputChange={handleInputChange} />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase mb-3 text-slate-800">4. Débit</h3>
                    <div className="flex gap-2">
                      <div className="flex-1 space-y-2">
                        <SrmCheckboxItem label="Faible" name="debit_fai" form={form} handleInputChange={handleInputChange} />
                        <SrmCheckboxItem label="Moyen" name="debit_moy" form={form} handleInputChange={handleInputChange} />
                      </div>
                      <div className="flex-1 space-y-2">
                        <SrmCheckboxItem label="Fort" name="debit_for" form={form} handleInputChange={handleInputChange} />
                        <input type="text" name="estimation" value={form.estimation} onChange={handleInputChange} placeholder="Est. (l/min)" className="input-field w-full h-[46px] mt-0" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="p-5 rounded-2xl bg-slate-50 border border-line">
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Observations / Type Nature</label>
                <input type="text" name="obs1" value={form.obs1} onChange={handleInputChange} className="input-field w-full mb-3" />
                <input type="text" name="obs2" value={form.obs2} onChange={handleInputChange} className="input-field w-full" />
              </div>
              
              <div className="p-5 rounded-2xl bg-slate-50 border border-line">
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Matériel Utilisé</label>
                <input type="text" name="mat1" value={form.mat1} onChange={handleInputChange} className="input-field w-full mb-3" />
                <input type="text" name="mat2" value={form.mat2} onChange={handleInputChange} className="input-field w-full" />
              </div>

              <div className="flex justify-center mt-8">
                <button 
                  onClick={handleSaveAction}
                  disabled={loading}
                  className="btn-accent px-8 py-4 w-full md:w-auto text-base group"
                >
                  {loading ? (
                    <><Loader2 className="w-5 h-5 animate-spin mr-3" /> Enregistrement en cours...</>
                  ) : (
                    <><Save className="w-5 h-5 mr-3" /> {initialData ? "Enregistrer les modifications" : "Enregistrer et Générer le PDF"}</>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer controls */}
        <div className="p-6 border-t border-line bg-slate-50 rounded-b-2xl flex justify-between">
          <button 
            onClick={prevStep}
            disabled={step === 1}
            className="btn-outline flex items-center gap-2 px-6 disabled:opacity-0"
          >
            <ChevronLeft className="w-4 h-4" /> Précédent
          </button>
          
          {step < 3 ? (
            <button onClick={nextStep} className="btn-primary flex items-center gap-2 px-8">
              Suivant <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <div className="w-[100px]"></div> // Spacing placeholder
          )}
        </div>
      </Motion.div>
    </div>
  );
};
