import React, { useState } from 'react';
import { 
  Layers, 
  Sparkles, 
  Code2, 
  Feather, 
  Lightbulb, 
  GraduationCap, 
  Check, 
  X,
  Plus
} from 'lucide-react';
import { Gem } from '../types';

interface GemsModalProps {
  isOpen: boolean;
  onClose: () => void;
  gems: Gem[];
  activeGemId: string;
  onSelectGem: (gemId: string) => void;
  onCreateCustomGem: (gem: Gem) => void;
}

const getIcon = (iconName: string) => {
  switch (iconName) {
    case 'Code2': return <Code2 className="w-5 h-5 text-blue-400" />;
    case 'Feather': return <Feather className="w-5 h-5 text-emerald-400" />;
    case 'Lightbulb': return <Lightbulb className="w-5 h-5 text-amber-400" />;
    case 'GraduationCap': return <GraduationCap className="w-5 h-5 text-pink-400" />;
    default: return <Sparkles className="w-5 h-5 text-purple-400" />;
  }
};

export const GemsModal: React.FC<GemsModalProps> = ({
  isOpen,
  onClose,
  gems,
  activeGemId,
  onSelectGem,
  onCreateCustomGem
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newTagline, setNewTagline] = useState('');
  const [newPrompt, setNewPrompt] = useState('');

  if (!isOpen) return null;

  const handleSaveGem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPrompt.trim()) return;

    const newGem: Gem = {
      id: 'gem-' + Date.now(),
      name: newName,
      tagline: newTagline || 'Custom Gemini Persona',
      icon: 'Sparkles',
      systemPrompt: newPrompt,
      category: 'Productivity',
    };

    onCreateCustomGem(newGem);
    setIsCreating(false);
    setNewName('');
    setNewTagline('');
    setNewPrompt('');
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-[#1e1f20] border border-[#3c4043] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#282a2c]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Gemini Gems Library</h2>
              <p className="text-xs text-neutral-400">Specialized AI personas for deep work, coding, & writing</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-[#282a2c] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {!isCreating ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Available Gems</span>
                <button
                  onClick={() => setIsCreating(true)}
                  className="flex items-center space-x-1.5 text-xs text-blue-400 hover:text-blue-300 font-medium"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Custom Gem</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {gems.map((gem) => {
                  const isActive = activeGemId === gem.id;
                  return (
                    <div
                      key={gem.id}
                      onClick={() => {
                        onSelectGem(gem.id);
                        onClose();
                      }}
                      className={`p-4 rounded-2xl border cursor-pointer transition flex flex-col justify-between ${
                        isActive
                          ? 'bg-purple-950/30 border-purple-500 text-white shadow-lg'
                          : 'bg-[#282a2c]/60 hover:bg-[#282a2c] border-[#3c4043]/70 text-neutral-300'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="p-2 rounded-xl bg-[#131314] border border-[#3c4043]/40">
                            {getIcon(gem.icon)}
                          </div>
                          {isActive && (
                            <span className="flex items-center space-x-1 text-[11px] font-bold text-purple-400 bg-purple-900/40 px-2 py-0.5 rounded-full border border-purple-500/40">
                              <Check className="w-3 h-3" />
                              <span>Active</span>
                            </span>
                          )}
                        </div>
                        <h3 className="font-semibold text-sm text-neutral-100">{gem.name}</h3>
                        <p className="text-xs text-neutral-400 mt-1 line-clamp-2">{gem.tagline}</p>
                      </div>

                      <div className="mt-3 pt-2 border-t border-[#3c4043]/40 flex items-center justify-between text-[11px] text-neutral-500">
                        <span>{gem.category}</span>
                        <span className="text-purple-400 group-hover:underline">Select &rarr;</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSaveGem} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">Gem Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Legal Contract Auditor"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-[#131314] border border-[#3c4043] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">Tagline</label>
                <input
                  type="text"
                  placeholder="e.g. Scrutinize legal terms and suggest edits"
                  value={newTagline}
                  onChange={(e) => setNewTagline(e.target.value)}
                  className="w-full bg-[#131314] border border-[#3c4043] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">System Instructions</label>
                <textarea
                  required
                  rows={5}
                  placeholder="Specify rules, persona, formatting constraints, and domain expertise..."
                  value={newPrompt}
                  onChange={(e) => setNewPrompt(e.target.value)}
                  className="w-full bg-[#131314] border border-[#3c4043] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-400 hover:bg-[#282a2c] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white transition shadow-lg"
                >
                  Save Gem
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
