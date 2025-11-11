import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { EnrichedBooking } from '../types';
import { apiService } from '../services/apiService';
import { useAuth } from '../hooks/useAuth';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ICONS } from '../constants';

const SkillLevelDisplay: React.FC<{ level?: number }> = ({ level }) => {
    if (!level) return null;
    return (
        <div className="flex items-center gap-1" title={`Nivel ${level} de 5`}>
            {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className={i < level ? 'text-yellow-400' : 'text-slate-300'}>
                    {React.cloneElement(ICONS.STAR, { width: 16, height: 16, fill: 'currentColor' })}
                </div>
            ))}
        </div>
    );
};


// --- Sub-component for each forum post ---
const ForumPostCard: React.FC<{ 
    post: EnrichedBooking,
    currentUserId: string,
    isJoining: boolean,
    onJoin: (bookingId: string) => void
}> = ({ post, currentUserId, isJoining, onJoin }) => {
    
    const spotsFilled = (post.joinedPlayerIds || []).length;
    const spotsTotal = post.playersNeeded || 0;
    const playersNeededToFill = spotsTotal - spotsFilled;

    const hasJoined = (post.joinedPlayerIds || []).includes(currentUserId);
    const hasRequested = (post.pendingPlayerIds || []).includes(currentUserId);
    const isOwner = post.user.id === currentUserId;

    const handleJoin = () => {
        if (!isJoining) {
            onJoin(post.id);
        }
    };

    const getButtonState = () => {
        if (isOwner) return { disabled: true, text: 'Tu Partida' };
        if (hasJoined) return { disabled: true, text: 'Inscrito' };
        if (hasRequested) return { disabled: true, text: 'Solicitud Enviada' };
        return { disabled: false, text: 'Unirse a la Partida' };
    }

    const buttonState = getButtonState();

    return (
        <Card>
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-shrink-0 text-center">
                    <img src={`https://i.pravatar.cc/150?u=${post.user.id}`} alt={post.user.name} className="w-20 h-20 rounded-full mx-auto" />
                    <p className="font-semibold mt-2 text-sm text-text truncate w-24">{post.user.name}</p>
                </div>
                <div className="flex-grow">
                    <p className="font-bold text-lg text-primary">{post.court.name} - {post.court.sport}</p>
                    <p className="text-sm text-muted">{post.club.name}</p>
                    <p className="font-semibold my-2 text-text">{format(new Date(post.startTime), "eeee, d 'de' MMMM 'a las' HH:mm", { locale: es })}</p>
                    <div className="flex items-center gap-4 mt-2">
                        <span className="text-sm font-bold bg-blue-200 text-blue-800 px-2 py-1 rounded-full">
                            {playersNeededToFill > 0 ? `Faltan ${playersNeededToFill}` : 'Completo'}
                        </span>
                        <SkillLevelDisplay level={post.skillLevel} />
                    </div>
                </div>
                <div className="flex flex-col items-center justify-center sm:items-end flex-shrink-0 mt-4 sm:mt-0">
                    <Button 
                        onClick={handleJoin} 
                        disabled={buttonState.disabled || isJoining}
                        isLoading={isJoining}
                        size="sm"
                        className="w-40"
                    >
                        {isJoining ? 'Uniéndose...' : buttonState.text}
                    </Button>
                </div>
            </div>
        </Card>
    );
};

// --- Main Forum Page Component ---
const ForumPage: React.FC = () => {
    const { user } = useAuth();
    const [allPosts, setAllPosts] = useState<EnrichedBooking[]>([]);
    const [loading, setLoading] = useState(true);
    const [allSports, setAllSports] = useState<string[]>([]);
    
    // State for filtering
    const [filters, setFilters] = useState({ sport: '', date: '', skillLevel: '' });
    
    // State and Ref for handling join requests to prevent race conditions
    const [joiningPostId, setJoiningPostId] = useState<string | null>(null);
    const isJoiningRef = useRef(false);

    // Fetch initial data for posts and available sports
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [forumPosts, clubsData] = await Promise.all([
                    apiService.getForumPosts(),
                    apiService.getClubs()
                ]);
                const sports = Array.from(new Set(clubsData.flatMap(c => c.sports))).sort();
                setAllSports(sports);
                setAllPosts(forumPosts);
            } catch (error) {
                toast.error("No se pudieron cargar los datos del foro.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Memoized calculation for filtered and sorted posts
    const filteredPosts = useMemo(() => {
        let tempPosts = [...allPosts];

        if (filters.sport) {
            tempPosts = tempPosts.filter(p => p.court.sport === filters.sport);
        }

        if (filters.date) {
            tempPosts = tempPosts.filter(p => format(new Date(p.startTime), 'yyyy-MM-dd') === filters.date);
        }

        if (filters.skillLevel) {
            tempPosts = tempPosts.filter(p => p.skillLevel === parseInt(filters.skillLevel, 10));
        }
        
        const isViewingAll = !filters.sport && !filters.date && !filters.skillLevel;

        if (isViewingAll) {
            // "Ver Todos": Sort by sport, then by time
            tempPosts.sort((a, b) => {
                const sportCompare = a.court.sport.localeCompare(b.court.sport);
                if (sportCompare !== 0) return sportCompare;
                return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
            });
        } else {
             // Filtered view: Sort chronologically
            tempPosts.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
        }

        return tempPosts;
    }, [allPosts, filters]);

    // Stable handler for join requests
    const handleJoinRequest = useCallback(async (bookingId: string) => {
        if (!user || isJoiningRef.current) {
            return;
        }

        isJoiningRef.current = true;
        setJoiningPostId(bookingId);

        // Perform optimistic update
        const originalPosts = [...allPosts];
        const optimisticPosts = allPosts.map(post => {
            if (post.id === bookingId) {
                return {
                    ...post,
                    // Fix: Safely spread optional arrays to prevent runtime errors.
                    pendingPlayers: [...(post.pendingPlayers || []), user],
                    pendingPlayerIds: [...(post.pendingPlayerIds || []), user.id]
                };
            }
            return post;
        });
        setAllPosts(optimisticPosts);

        try {
            await apiService.requestToJoinBooking(bookingId, user.id);
            toast.success("¡Solicitud enviada! El creador de la partida la revisará.");
        } catch (error: any) {
            toast.error(error.message || "No se pudo enviar la solicitud. Inténtalo de nuevo.");
            // Revert on error
            setAllPosts(originalPosts);
        } finally {
            isJoiningRef.current = false;
            setJoiningPostId(null);
        }
    }, [user, allPosts]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({...prev, [name]: value}));
    };

    const handleViewAll = () => {
        setFilters({ sport: '', date: '', skillLevel: '' });
    };

    if (loading) return <Spinner />;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h1 className="text-3xl font-bold mb-2">Foro de Partidas</h1>
            <p className="text-muted mb-6">Encuentra partidas abiertas por otros jugadores y únete.</p>
            
            <Card className="mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                        <label htmlFor="sport-filter" className="block text-sm font-medium text-muted mb-1">Deporte</label>
                        <select
                            id="sport-filter"
                            name="sport"
                            value={filters.sport}
                            onChange={handleFilterChange}
                            className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm bg-white text-text"
                        >
                            <option value="">Todos los deportes</option>
                            {allSports.map(sport => <option key={sport} value={sport}>{sport}</option>)}
                        </select>
                    </div>
                    <div>
                         <label htmlFor="date-filter" className="block text-sm font-medium text-muted mb-1">Día</label>
                        <input
                            id="date-filter"
                            type="date"
                            name="date"
                            value={filters.date}
                            onChange={handleFilterChange}
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm bg-white text-text"
                        />
                    </div>
                    <div>
                        <label htmlFor="skill-filter" className="block text-sm font-medium text-muted mb-1">Nivel</label>
                        <select
                            id="skill-filter"
                            name="skillLevel"
                            value={filters.skillLevel}
                            onChange={handleFilterChange}
                            className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm bg-white text-text"
                        >
                            <option value="">Cualquier nivel</option>
                            <option value="1">1 (Principiante)</option>
                            <option value="2">2 (Ocasional)</option>
                            <option value="3">3 (Intermedio)</option>
                            <option value="4">4 (Avanzado)</option>
                            <option value="5">5 (Competición)</option>
                        </select>
                    </div>
                    <Button variant="ghost" onClick={handleViewAll}>Mostrar Todos</Button>
                </div>
            </Card>

            {filteredPosts.length > 0 ? (
                <div className="space-y-4">
                    {filteredPosts.map(post => (
                        <ForumPostCard 
                            key={post.id} 
                            post={post}
                            currentUserId={user!.id}
                            onJoin={handleJoinRequest}
                            isJoining={joiningPostId === post.id}
                        />
                    ))}
                </div>
            ) : (
                <Card className="text-center py-12">
                    <p className="text-muted">No hay partidas que coincidan con tu búsqueda.</p>
                </Card>
            )}

        </motion.div>
    );
};

export default ForumPage;