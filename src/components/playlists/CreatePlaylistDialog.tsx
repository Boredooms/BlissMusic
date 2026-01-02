'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Sparkles, Music2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '../ui/textarea';
import { usePlaylistsStore } from '@/stores/playlistsStore';
import { useUIStore } from '@/stores/uiStore';
import { useRouter } from 'next/navigation';

export function CreatePlaylistDialog() {
    const { isCreatePlaylistModalOpen, setCreatePlaylistModalOpen } = useUIStore();
    const createPlaylist = usePlaylistsStore((state) => state.createPlaylist);
    const router = useRouter();

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    // Reset form when opened
    useEffect(() => {
        if (isCreatePlaylistModalOpen) {
            setName('');
            setDescription('');
            setIsCreating(false);
        }
    }, [isCreatePlaylistModalOpen]);

    const onClose = () => setCreatePlaylistModalOpen(false);

    const handleCreate = async () => {
        if (!name.trim()) return;

        setIsCreating(true);
        try {
            const playlistId = await createPlaylist(name.trim(), description.trim() || undefined);
            if (playlistId) {
                onClose();
                // Optional: navigate to the new playlist
                router.push(`/playlist/${playlistId}`);
            }
        } catch (error) {
            console.error('Failed to create playlist:', error);
        } finally {
            setIsCreating(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey && name.trim()) {
            e.preventDefault();
            handleCreate();
        }
    };

    return (
        <AnimatePresence>
            {isCreatePlaylistModalOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm"
                    />

                    {/* Dialog Container */}
                    <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 sm:p-6 pointer-events-none">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 30, rotateX: 10 }}
                            animate={{ scale: 1, opacity: 1, y: 0, rotateX: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 30, rotateX: 10 }}
                            transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
                            className="pointer-events-auto w-full max-w-md relative overflow-hidden rounded-2xl bg-neutral-900 border border-white/10 shadow-2xl"
                        >
                            {/* Decorative Background Elements */}
                            <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-emerald-900/40 to-transparent pointer-events-none" />
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

                            {/* Close button */}
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 p-2 rounded-full bg-black/20 hover:bg-white/10 text-white/70 hover:text-white transition-all z-10"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="relative p-6 sm:p-8">
                                {/* Header */}
                                <div className="text-center mb-8">
                                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 mb-4 ring-1 ring-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
                                        <Music2 className="w-8 h-8 text-emerald-400" />
                                    </div>
                                    <h2 className="text-2xl font-bold bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent">
                                        Create Playlist
                                    </h2>
                                    <p className="text-sm text-muted-foreground mt-2">
                                        Give your collection a name
                                    </p>
                                </div>

                                {/* Form */}
                                <div className="space-y-5">
                                    <div>
                                        <div className="relative group">
                                            <Input
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                onKeyPress={handleKeyPress}
                                                placeholder="My Awesome Playlist"
                                                className="bg-black/40 border-white/10 focus:border-emerald-500/50 h-12 text-lg px-4 transition-all group-hover:border-white/20"
                                                maxLength={100}
                                                autoFocus
                                            />
                                            <div className="absolute inset-0 rounded-md ring-2 ring-emerald-500/20 opacity-0 group-focus-within:opacity-100 pointer-events-none transition-opacity duration-500" />
                                        </div>
                                    </div>

                                    <div>
                                        <Textarea
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            placeholder="Description (optional)"
                                            className="bg-black/40 border-white/10 focus:border-emerald-500/50 resize-none min-h-[100px] text-sm px-4 py-3"
                                            maxLength={500}
                                        />
                                    </div>

                                    {/* Actions */}
                                    <div className="grid grid-cols-2 gap-3 pt-2">
                                        <Button
                                            onClick={onClose}
                                            variant="ghost"
                                            className="hover:bg-white/5 h-12"
                                            disabled={isCreating}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={handleCreate}
                                            disabled={!name.trim() || isCreating}
                                            className="bg-emerald-600 hover:bg-emerald-500 text-white h-12 shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] transition-all"
                                        >
                                            {isCreating ? (
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                            ) : (
                                                <>
                                                    <Sparkles className="w-4 h-4 mr-2" />
                                                    Create
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
