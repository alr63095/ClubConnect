import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { Club } from '../types';
import { apiService } from '../services/apiService';
import Spinner from '../components/ui/Spinner';
import Card from '../components/ui/Card';
import { useNavigate } from 'react-router-dom';

const ClubSelectionPage: React.FC = () => {
  const { user, selectClub } = useAuth();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role === 'ADMIN' && user.clubIds) {
      apiService.getClubsByIds(user.clubIds)
        .then(setClubs)
        .finally(() => setLoading(false));
    }
  }, [user]);

  const handleClubSelect = (clubId: string) => {
    selectClub(clubId);
    navigate('/admin/dashboard');
  };

  if (loading) {
    return <Spinner />;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto text-center py-12"
    >
      <h1 className="text-3xl font-bold mb-2">¡Hola, {user?.name}!</h1>
      <p className="text-muted mb-8">Selecciona el club que quieres gestionar.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {clubs.map((club) => (
          <motion.div
            key={club.id}
            whileHover={{ scale: 1.03 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <Card 
              className="!p-0 overflow-hidden cursor-pointer text-left"
              onClick={() => handleClubSelect(club.id)}
            >
              <div className="p-6">
                <h2 className="text-xl font-bold text-primary">{club.name}</h2>
                <p className="text-sm text-muted mt-2">Deportes: {club.sports.join(', ')}</p>
              </div>
              <div className="bg-teal-50 px-6 py-3 text-primary font-semibold">
                Gestionar este club &rarr;
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default ClubSelectionPage;
