import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CircularProgress, Box, Typography, Container, Alert } from '@mui/material';

/**
 * AuthTransfer - Page intermédiaire pour la gestion de l'authentification OAuth
 * Récupère le token de l'URL ou du cookie et redirige vers la page appropriée
 */
const AuthTransfer = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('Initialisation...');

  useEffect(() => {
    const handleAuth = async () => {
      console.log('AuthTransfer - Démarrage du processus de transfert');
      setStatus('Vérification des paramètres d\'authentification...');
      
      try {
        // Récupérer les paramètres de l'URL
        const params = new URLSearchParams(location.search);
        const token = params.get('token');
        const role = params.get('role');

        console.log('AuthTransfer - Paramètres:', { 
          tokenExists: !!token, 
          tokenLength: token?.length,
          role 
        });

        // Si un token est dans l'URL, l'utiliser
        if (token) {
          console.log('AuthTransfer - Token trouvé dans l\'URL');
          setStatus('Token trouvé, enregistrement...');
          
          // Stocker le token dans localStorage
          localStorage.setItem('token', token);
          
          // Vérifier que le token a bien été enregistré
          const storedToken = localStorage.getItem('token');
          if (!storedToken) {
            console.error('AuthTransfer - Échec de l\'enregistrement du token dans localStorage');
            setError('Échec de l\'enregistrement du token. Veuillez réessayer.');
            return;
          }
          
          console.log('AuthTransfer - Token enregistré avec succès');
          setStatus('Redirection vers le tableau de bord...');
          
          // Rediriger en fonction du rôle
          if (role === 'ADMIN') {
            console.log('AuthTransfer - Redirection vers /admin');
            setTimeout(() => navigate('/admin'), 500);
          } else if (role === 'STUDENT') {
            console.log('AuthTransfer - Redirection vers /student');
            setTimeout(() => navigate('/student'), 500);
          } else if (role === 'TUTOR') {
            console.log('AuthTransfer - Redirection vers /tutor');
            setTimeout(() => navigate('/tutor'), 500);
          } else {
            // Rôle par défaut
            console.log('AuthTransfer - Rôle non spécifié, redirection vers /student');
            setTimeout(() => navigate('/student'), 500);
          }
          return;
        }

        // Vérifier si un token est dans les cookies
        const getCookie = name => {
          const value = `; ${document.cookie}`;
          const parts = value.split(`; ${name}=`);
          if (parts.length === 2) return parts.pop().split(';').shift();
        };
        
        const authToken = getCookie('auth_token');
        
        if (authToken) {
          console.log('AuthTransfer - Token trouvé dans les cookies');
          setStatus('Token trouvé dans les cookies, vérification...');
          localStorage.setItem('token', authToken);
          
          // Vérifier l'utilisateur avec le token depuis le cookie
          try {
            const response = await fetch('http://localhost:5001/api/auth/me', {
              headers: {
                'Authorization': `Bearer ${authToken}`
              }
            });
            
            if (response.ok) {
              const userData = await response.json();
              console.log('AuthTransfer - Données utilisateur:', userData);
              setStatus('Utilisateur authentifié, redirection...');
              
              // Rediriger en fonction du rôle
              if (userData.role === 'ADMIN') {
                setTimeout(() => navigate('/admin'), 500);
              } else if (userData.role === 'STUDENT') {
                setTimeout(() => navigate('/student'), 500);
              } else if (userData.role === 'TUTOR') {
                setTimeout(() => navigate('/tutor'), 500);
              } else {
                setTimeout(() => navigate('/student'), 500); // Default fallback
              }
              return;
            } else {
              console.error('AuthTransfer - Échec de la vérification de l\'utilisateur:', await response.text());
              setError('Échec de la vérification de l\'utilisateur');
            }
          } catch (error) {
            console.error('AuthTransfer - Erreur API:', error);
            setError(`Erreur lors de la communication avec le serveur: ${error.message}`);
          }
        }

        // Si aucun token n'est trouvé, rediriger vers la page de connexion
        console.log('AuthTransfer - Aucun token trouvé, redirection vers /signin');
        setStatus('Aucun token trouvé, redirection vers la page de connexion...');
        setTimeout(() => navigate('/signin'), 1000);
      } catch (error) {
        console.error('AuthTransfer - Erreur:', error);
        setError(`Erreur d'authentification: ${error.message}`);
        setTimeout(() => navigate('/signin'), 2000);
      }
    };

    handleAuth();
  }, [navigate, location]);

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <CircularProgress color="primary" />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Authentification en cours...
        </Typography>
        <Typography variant="body1" sx={{ mt: 1, textAlign: 'center' }}>
          {status}
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
            {error}
          </Alert>
        )}
      </Box>
    </Container>
  );
};

export default AuthTransfer; 