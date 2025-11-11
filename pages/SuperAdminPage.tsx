import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { User, Club } from '../types';
import { apiService } from '../services/apiService';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import Modal from '../components/ui/Modal';
import ClubForm from '../components/forms/ClubForm';
import UserForm from '../components/forms/UserForm';
import toast from 'react-hot-toast';

const SuperAdminPage: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<User[]>([]);
    const [clubs, setClubs] = useState<Club[]>([]);
    const [admins, setAdmins] = useState<User[]>([]);
    const [activeTab, setActiveTab] = useState<'users' | 'clubs'>('users');
    
    const [isClubModalOpen, setIsClubModalOpen] = useState(false);
    const [selectedClub, setSelectedClub] = useState<Club | null>(null);
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    const [clubToDelete, setClubToDelete] = useState<Club | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [usersData, clubsData, adminsData] = await Promise.all([
                apiService.getAllUsers(),
                apiService.getClubs(),
                apiService.getAdmins(),
            ]);
            setUsers(usersData);
            setClubs(clubsData);
            setAdmins(adminsData);
        } catch (error) {
            toast.error("No se pudieron cargar los datos.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleUserStatusChange = async (user: User) => {
        const newStatus = !user.isBanned;
        try {
            await apiService.updateUserStatus(user.id, newStatus);
            toast.success(`Usuario ${newStatus ? 'baneado' : 'reactivado'}.`);
            fetchData();
        } catch (error) {
            toast.error("No se pudo actualizar el estado del usuario.");
        }
    };
    
    const handleAddClub = () => {
        setSelectedClub(null);
        setIsClubModalOpen(true);
    };

    const handleEditClub = (club: Club) => {
        setSelectedClub(club);
        setIsClubModalOpen(true);
    };
    
    const handleAddUser = () => {
        setSelectedUser(null);
        setIsUserModalOpen(true);
    }
    
    const handleEditUser = (user: User) => {
        setSelectedUser(user);
        setIsUserModalOpen(true);
    }

    const handleSave = () => {
        setIsClubModalOpen(false);
        setIsUserModalOpen(false);
        fetchData();
    };

    const handleDeleteClub = async () => {
        if (!clubToDelete) return;
        setIsDeleting(true);
        try {
            await apiService.deleteClub(clubToDelete.id);
            toast.success("Club eliminado correctamente.");
            setClubToDelete(null);
            fetchData();
        } catch (error) {
            toast.error("No se pudo eliminar el club.");
        } finally {
            setIsDeleting(false);
        }
    }
    
    const getAdminForClub = (clubId: string) => {
        return users.find(u => u.role === 'ADMIN' && u.clubIds?.includes(clubId));
    }

    if (loading) return <Spinner />;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Panel de Super Administrador</h1>
                {activeTab === 'clubs' && <Button onClick={handleAddClub}>Añadir Club</Button>}
                {activeTab === 'users' && <Button onClick={handleAddUser}>Añadir Usuario</Button>}
            </div>

            <Card>
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                        <button
                            onClick={() => setActiveTab('users')}
                            className={`${activeTab === 'users' ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-text hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                        >
                            Gestión de Usuarios ({users.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('clubs')}
                            className={`${activeTab === 'clubs' ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-text hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                        >
                            Gestión de Clubs ({clubs.length})
                        </button>
                    </nav>
                </div>

                <div className="py-6">
                    {activeTab === 'users' && (
                        <div className="space-y-4">
                           {users.map(user => (
                               <div key={user.id} className="p-4 bg-slate-50 rounded-lg flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                                   <div>
                                       <p className="font-bold">{user.name} <span className="text-xs font-normal bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">{user.role}</span></p>
                                       <p className="text-sm text-muted">{user.email}</p>
                                   </div>
                                   <div className="flex items-center gap-2 flex-shrink-0">
                                       <span className={`text-sm font-semibold ${user.isBanned ? 'text-red-600' : 'text-green-600'}`}>
                                           {user.isBanned ? 'Baneado' : 'Activo'}
                                       </span>
                                       {user.role !== 'SUPER_ADMIN' && (
                                           <>
                                            <Button size="sm" variant="ghost" onClick={() => handleEditUser(user)}>Editar</Button>
                                            <Button size="sm" variant={user.isBanned ? 'primary' : 'danger'} onClick={() => handleUserStatusChange(user)}>
                                                    {user.isBanned ? 'Reactivar' : 'Banear'}
                                            </Button>
                                           </>
                                       )}
                                   </div>
                               </div>
                           ))}
                        </div>
                    )}
                    {activeTab === 'clubs' && (
                         <div className="space-y-4">
                             {clubs.map(club => {
                                const admin = getAdminForClub(club.id);
                                return (
                                <div key={club.id} className="p-4 bg-slate-50 rounded-lg flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                                    <div>
                                        <p className="font-bold">{club.name}</p>
                                        <p className="text-sm text-muted">Deportes: {club.sports.join(', ')}</p>
                                        <p className="text-sm text-muted">Admin: <span className="font-medium text-text">{admin?.name || 'Sin asignar'}</span></p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button size="sm" variant="ghost" onClick={() => handleEditClub(club)}>Editar</Button>
                                        <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50" onClick={() => setClubToDelete(club)}>Eliminar</Button>
                                    </div>
                                </div>
                             )})}
                         </div>
                    )}
                </div>
            </Card>

            <Modal
                isOpen={isClubModalOpen}
                onClose={() => setIsClubModalOpen(false)}
                title={selectedClub ? 'Editar Club' : 'Añadir Nuevo Club'}
            >
                <ClubForm
                    club={selectedClub}
                    admins={admins}
                    currentAdminId={selectedClub ? getAdminForClub(selectedClub.id)?.id : undefined}
                    onSave={handleSave}
                    onClose={() => setIsClubModalOpen(false)}
                />
            </Modal>
            
             <Modal
                isOpen={isUserModalOpen}
                onClose={() => setIsUserModalOpen(false)}
                title={selectedUser ? 'Editar Usuario' : 'Añadir Nuevo Usuario'}
            >
                <UserForm
                    user={selectedUser}
                    onSave={handleSave}
                    onClose={() => setIsUserModalOpen(false)}
                />
            </Modal>
            
            <Modal
                isOpen={!!clubToDelete}
                onClose={() => setClubToDelete(null)}
                title="Confirmar Eliminación"
            >
                {clubToDelete && (
                    <div>
                        <p>¿Estás seguro de que quieres eliminar el club <strong>{clubToDelete.name}</strong>?</p>
                        <p className="text-sm text-yellow-700 bg-yellow-100 p-3 rounded-md mt-4">
                            <strong>Atención:</strong> Se eliminarán todas sus pistas y se cancelarán sus reservas futuras. El club también será desvinculado de su administrador. Esta acción no se puede deshacer.
                        </p>
                        <div className="flex justify-end gap-2 mt-6">
                            <Button variant="ghost" onClick={() => setClubToDelete(null)}>Cancelar</Button>
                            <Button variant="danger" onClick={handleDeleteClub} isLoading={isDeleting}>
                                Sí, Eliminar
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </motion.div>
    );
};

export default SuperAdminPage;