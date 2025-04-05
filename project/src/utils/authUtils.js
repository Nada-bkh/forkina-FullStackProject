// Check if user is authenticated
export const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    return false;
  }
  
  // Vérification basique de la structure du token (sans décoder)
  // Un JWT valide a 3 parties séparées par des points
  const tokenParts = token.split('.');
  return tokenParts.length === 3;
}; 