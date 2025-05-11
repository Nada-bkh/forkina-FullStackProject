import React, { useState, useEffect } from 'react';
import {
  Container, TextField, Button, Typography, Box, CircularProgress, Paper, Alert, Tooltip,
  FormControl, InputLabel, Select, MenuItem, FormHelperText
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import GitHubIcon from '@mui/icons-material/GitHub';
import InteractiveQuiz from '../../components/InteractiveQuiz';
import axios from 'axios';
import { useOutletContext } from 'react-router-dom';

export default function QuizGenerator() {
  const { user } = useOutletContext();
  const [repoUrl, setRepoUrl] = useState('');
  const [quiz, setQuiz] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastRepo, setLastRepo] = useState('');
  const [error, setError] = useState('');
  
  // Variables pour la liste des équipes
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  useEffect(() => {
    // Chargement des équipes au démarrage
    if (user?._id) {
      fetchTeams();
    }
  }, [user]);

  // Ajouter un effet pour logger les équipes chargées
  useEffect(() => {
    if (teams.length > 0) {
      console.log("Teams structure après chargement:");
      teams.forEach(team => {
        console.log(`Team ${team.name} (${team._id}):`);
        console.log("- Nombre de membres:", team.members?.length || 0);
        if (team.members && team.members.length > 0) {
          const firstMember = team.members[0];
          console.log("- Premier membre:", firstMember);
          console.log("- Structure user du premier membre:", firstMember.user);
        }
      });
    }
  }, [teams]);

  const fetchTeams = async () => {
    try {
      setLoadingTeams(true);
      const token = localStorage.getItem('token');
      if (!token || !user?._id) {
        console.error('User not authenticated');
        return;
      }
      
      // Utiliser la même API que dans TeamsList pour récupérer uniquement les équipes du tuteur
      const response = await fetch(`http://localhost:5001/api/teams/tutor/${user._id}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch teams');
      }

      const data = await response.json();
      if (data.success) {
        const fetchedTeams = data.data || [];
        
        // Vérifier que chaque équipe a les informations de membres correctement chargées
        let hasIncompleteTeams = false;
        
        for (const team of fetchedTeams) {
          if (!team.members || !Array.isArray(team.members) || team.members.length === 0) {
            console.warn(`Équipe ${team.name} (${team._id}) n'a pas de membres`);
            hasIncompleteTeams = true;
          } else {
            // Vérifier si chaque membre a un ID utilisateur
            const invalidMembers = team.members.filter(m => !m.user || !m.user._id);
            if (invalidMembers.length > 0) {
              console.warn(`Équipe ${team.name} a ${invalidMembers.length} membres invalides`);
              hasIncompleteTeams = true;
            }
          }
        }
        
        if (hasIncompleteTeams) {
          console.log("Certaines équipes ont des données incomplètes. Récupération détaillée...");
          
          // Pour chaque équipe, récupérer les informations détaillées
          const detailedTeams = await Promise.all(
            fetchedTeams.map(async (team) => {
              try {
                const detailResponse = await fetch(`http://localhost:5001/api/teams/${team._id}`, {
                  method: 'GET',
                  headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                  },
                });
                
                if (detailResponse.ok) {
                  const detailData = await detailResponse.json();
                  return detailData.data || team;
                }
                return team;
              } catch (err) {
                console.error(`Erreur lors de la récupération des détails de l'équipe ${team._id}:`, err);
                return team;
              }
            })
          );
          
          setTeams(detailedTeams);
        } else {
          setTeams(fetchedTeams);
        }
      } else {
        console.error(data.message || 'No teams found');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des équipes:', error);
    } finally {
      setLoadingTeams(false);
    }
  };

  const fetchQuiz = async (repo) => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch('http://localhost:5001/api/quiz/from-repo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl: repo })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la génération du quiz');
      }
      
      const data = await response.json();
      setQuiz(data.quiz || 'Erreur de génération.');
      setLastRepo(repo);
    } catch (error) {
      console.error('Erreur:', error);
      setError(error.message || 'Erreur de connexion à l\'API.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = () => {
    if (repoUrl) fetchQuiz(repoUrl);
  };

  const handleRegenerate = () => {
    if (lastRepo) fetchQuiz(lastRepo);
  };

  const handleTeamChange = (event) => {
    setSelectedTeam(event.target.value);
  };

  const handleQuizComplete = async (resultData) => {
    // Si une équipe est sélectionnée, enregistrer le score dans l'évaluation
    if (selectedTeam) {
      try {
        setError(''); // Réinitialiser les erreurs
        const token = localStorage.getItem('token');
        
        if (!token) {
          throw new Error("Token d'authentification non trouvé");
        }
        
        // Récupérer l'équipe sélectionnée
        const selectedTeamData = teams.find(t => t._id === selectedTeam);
        if (!selectedTeamData) {
          console.warn("Équipe non trouvée dans les données en cache, tentative API");
        } else {
          console.log("Équipe trouvée en cache:", selectedTeamData.name);
        }
        
        // Calculer le score du quiz - direct mapping: nombre de bonnes réponses sur 5
        const correctAnswers = resultData.correctAnswers;
        const totalQuestions = resultData.totalQuestions;
        
        // Si le nombre total de questions est supérieur à 5, on ramène à une note sur 5
        // Sinon, on prend directement le nombre de bonnes réponses
        const quizScore = totalQuestions > 5 
          ? (correctAnswers / totalQuestions) * 5 
          : correctAnswers >= 5 ? 5 : correctAnswers;
        
        console.log(`Quiz terminé: ${correctAnswers}/${totalQuestions} questions, score calculé: ${quizScore}/5`);
        
        // Vérifier si une évaluation existe déjà
        const checkResponse = await axios.get(`http://localhost:5001/api/evaluations/team/${selectedTeam}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        let method = 'POST';
        let url = `http://localhost:5001/api/evaluations/${selectedTeam}`;
        let evaluationData = {};
        
        if (checkResponse.data && checkResponse.data.success && checkResponse.data.data) {
          // Mise à jour de l'évaluation existante
          method = 'PUT';
          url = `http://localhost:5001/api/evaluations/${checkResponse.data.data._id}`;
          evaluationData = {...checkResponse.data.data};
          
          // Mettre à jour les métadonnées de l'évaluation
          evaluationData.quizInfo = {
            repoUrl: resultData.repoUrl,
            score: correctAnswers,
            totalQuestions: totalQuestions,
            completedAt: new Date().toISOString()
          };
          
          // Mise à jour du quiz pour tous les membres
          evaluationData.evaluations = evaluationData.evaluations.map(evaluation => {
            // Calculer la note totale avec le nouveau score de quiz
            const weights = {
              codePerformance: 2,
              commitFrequency: 1,
              reportQuality: 1.5,
              quiz: 1.5
            };
            
            // Utiliser les valeurs existantes pour les autres critères ou la valeur minimale de 1
            const codePerf = Math.max(evaluation.codePerformance || 1, 1);
            const commitFreq = Math.max(evaluation.commitFrequency || 1, 1);
            const reportQual = Math.max(evaluation.reportQuality || 1, 1);
            
            // Calculer la nouvelle note
            let total = 0;
            let totalWeight = 0;
            
            // Contribution du code, commits, rapport
            total += (codePerf / 5) * 20 * weights.codePerformance;
            total += (commitFreq / 5) * 20 * weights.commitFrequency;
            total += (reportQual / 5) * 20 * weights.reportQuality;
            total += (quizScore / 5) * 20 * weights.quiz;
            
            totalWeight = weights.codePerformance + weights.commitFrequency + 
                         weights.reportQuality + weights.quiz;
            
            const newNote = Math.max(0, Math.min(20, total / totalWeight));
            
            return {
              ...evaluation,
              quiz: quizScore,
              note: parseFloat(newNote.toFixed(2))
            };
          });
          
          // Mettre à jour la moyenne d'équipe
          const totalNotes = evaluationData.evaluations.reduce(
            (sum, evalData) => sum + evalData.note,
            0
          );
          evaluationData.teamAverage = parseFloat((totalNotes / evaluationData.evaluations.length).toFixed(2));
          
        } else {
          // On ne peut pas créer d'évaluation sans connaître les membres
          // Tentative d'obtenir les membres de l'équipe de l'API
          try {
            const teamResponse = await axios.get(`http://localhost:5001/api/teams/${selectedTeam}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            
            if (!teamResponse.data) {
              throw new Error("Pas de données reçues pour l'équipe");
            }
            
            const teamData = teamResponse.data.data || selectedTeamData;
            
            if (!teamData || !teamData.members || teamData.members.length === 0) {
              throw new Error("Impossible de récupérer les membres de l'équipe");
            }
            
            // Assurez-vous d'avoir seulement les membres valides
            const validMembers = teamData.members
              .filter(member => member && member.user && member.user._id);
              
            if (validMembers.length === 0) {
              throw new Error("Aucun membre valide trouvé dans l'équipe");
            }
            
            // Calcul de la note (même formule que ci-dessus)
            const weights = {
              codePerformance: 2,
              commitFrequency: 1,
              reportQuality: 1.5,
              quiz: 1.5
            };
            
            // Valeurs par défaut pour les autres critères
            const defaultValues = {
              codePerformance: 1,
              commitFrequency: 1,
              reportQuality: 1
            };
            
            // Calculer la note totale
            let total = 0;
            let totalWeight = 0;
            
            // Contribution des valeurs par défaut
            total += (defaultValues.codePerformance / 5) * 20 * weights.codePerformance;
            total += (defaultValues.commitFrequency / 5) * 20 * weights.commitFrequency;
            total += (defaultValues.reportQuality / 5) * 20 * weights.reportQuality;
            total += (quizScore / 5) * 20 * weights.quiz;
            
            totalWeight = weights.codePerformance + weights.commitFrequency + 
                         weights.reportQuality + weights.quiz;
            
            const calculatedNote = Math.max(0, Math.min(20, total / totalWeight));
            const finalNote = parseFloat(calculatedNote.toFixed(2));
            
            // Structure spécifique attendue par l'API backend
            evaluationData = {
              team: selectedTeam,  // ID de l'équipe - Champ obligatoire
              evaluator: user._id, // ID de l'évaluateur - Champ obligatoire
              quizInfo: {
                repoUrl: resultData.repoUrl || "",
                score: correctAnswers,
                totalQuestions: totalQuestions,
                completedAt: new Date().toISOString()
              },
              evaluations: validMembers.map(member => ({
                member: member.user._id,  // ID de l'utilisateur - Champ obligatoire
                codePerformance: defaultValues.codePerformance,
                commitFrequency: defaultValues.commitFrequency,
                reportQuality: defaultValues.reportQuality,
                quiz: quizScore,
                note: finalNote
              })),
              teamAverage: finalNote
            };
            
          } catch (error) {
            console.error("Erreur lors de la récupération des membres:", error);
            
            // Fallback 1: Créer une évaluation simplifiée avec les données en cache
            if (selectedTeamData && selectedTeamData.members && selectedTeamData.members.length > 0) {
              const validMembers = selectedTeamData.members
                .filter(member => member && member.user && member.user._id);
                
              if (validMembers.length > 0) {
                console.log("Utilisation des membres en cache:", validMembers.length);
                
                // Mêmes calculs que précédemment
                const weights = {
                  codePerformance: 2,
                  commitFrequency: 1,
                  reportQuality: 1.5,
                  quiz: 1.5
                };
                
                const defaultValues = {
                  codePerformance: 1,
                  commitFrequency: 1,
                  reportQuality: 1
                };
                
                let total = 0;
                let totalWeight = 0;
                
                total += (defaultValues.codePerformance / 5) * 20 * weights.codePerformance;
                total += (defaultValues.commitFrequency / 5) * 20 * weights.commitFrequency;
                total += (defaultValues.reportQuality / 5) * 20 * weights.reportQuality;
                total += (quizScore / 5) * 20 * weights.quiz;
                
                totalWeight = weights.codePerformance + weights.commitFrequency + 
                             weights.reportQuality + weights.quiz;
                
                const calculatedNote = Math.max(0, Math.min(20, total / totalWeight));
                const finalNote = parseFloat(calculatedNote.toFixed(2));
                
                evaluationData = {
                  team: selectedTeam,  // Champ obligatoire
                  evaluator: user._id, // Champ obligatoire 
                  quizInfo: {
                    repoUrl: resultData.repoUrl || "",
                    score: correctAnswers,
                    totalQuestions: totalQuestions,
                    completedAt: new Date().toISOString()
                  },
                  evaluations: validMembers.map(member => ({
                    member: member.user._id,
                    codePerformance: defaultValues.codePerformance,
                    commitFrequency: defaultValues.commitFrequency,
                    reportQuality: defaultValues.reportQuality,
                    quiz: quizScore,
                    note: finalNote
                  })),
                  teamAverage: finalNote
                };
              } else {
                // Fallback 2: Dernière tentative avec l'API users
                console.log("Aucun membre valide en cache, tentative via API users");
                const usersMembers = await getTeamMembersFromUsers(selectedTeam);
                
                if (usersMembers.length > 0) {
                  console.log("Membres récupérés via API users:", usersMembers.length);
                  
                  // Mêmes calculs que précédemment
                  const weights = {
                    codePerformance: 2,
                    commitFrequency: 1,
                    reportQuality: 1.5,
                    quiz: 1.5
                  };
                  
                  const defaultValues = {
                    codePerformance: 1,
                    commitFrequency: 1,
                    reportQuality: 1
                  };
                  
                  let total = 0;
                  let totalWeight = 0;
                  
                  total += (defaultValues.codePerformance / 5) * 20 * weights.codePerformance;
                  total += (defaultValues.commitFrequency / 5) * 20 * weights.commitFrequency;
                  total += (defaultValues.reportQuality / 5) * 20 * weights.reportQuality;
                  total += (quizScore / 5) * 20 * weights.quiz;
                  
                  totalWeight = weights.codePerformance + weights.commitFrequency + 
                               weights.reportQuality + weights.quiz;
                  
                  const calculatedNote = Math.max(0, Math.min(20, total / totalWeight));
                  const finalNote = parseFloat(calculatedNote.toFixed(2));
                  
                  evaluationData = {
                    team: selectedTeam,
                    evaluator: user._id,
                    quizInfo: {
                      repoUrl: resultData.repoUrl || "",
                      score: correctAnswers,
                      totalQuestions: totalQuestions,
                      completedAt: new Date().toISOString()
                    },
                    evaluations: usersMembers.map(member => ({
                      member: member.user._id,
                      codePerformance: defaultValues.codePerformance,
                      commitFrequency: defaultValues.commitFrequency,
                      reportQuality: defaultValues.reportQuality,
                      quiz: quizScore,
                      note: finalNote
                    })),
                    teamAverage: finalNote
                  };
                } else {
                  throw new Error("Impossible de créer une évaluation sans information sur les membres de l'équipe");
                }
              }
            } else {
              // Fallback 2: Dernière tentative avec l'API users
              console.log("Pas de données d'équipe en cache, tentative via API users");
              const usersMembers = await getTeamMembersFromUsers(selectedTeam);
              
              if (usersMembers.length > 0) {
                console.log("Membres récupérés via API users:", usersMembers.length);
                
                // Mêmes calculs que précédemment
                const weights = {
                  codePerformance: 2,
                  commitFrequency: 1,
                  reportQuality: 1.5,
                  quiz: 1.5
                };
                
                const defaultValues = {
                  codePerformance: 1,
                  commitFrequency: 1,
                  reportQuality: 1
                };
                
                let total = 0;
                let totalWeight = 0;
                
                total += (defaultValues.codePerformance / 5) * 20 * weights.codePerformance;
                total += (defaultValues.commitFrequency / 5) * 20 * weights.commitFrequency;
                total += (defaultValues.reportQuality / 5) * 20 * weights.reportQuality;
                total += (quizScore / 5) * 20 * weights.quiz;
                
                totalWeight = weights.codePerformance + weights.commitFrequency + 
                             weights.reportQuality + weights.quiz;
                
                const calculatedNote = Math.max(0, Math.min(20, total / totalWeight));
                const finalNote = parseFloat(calculatedNote.toFixed(2));
                
                evaluationData = {
                  team: selectedTeam,
                  evaluator: user._id,
                  quizInfo: {
                    repoUrl: resultData.repoUrl || "",
                    score: correctAnswers,
                    totalQuestions: totalQuestions,
                    completedAt: new Date().toISOString()
                  },
                  evaluations: usersMembers.map(member => ({
                    member: member.user._id,
                    codePerformance: defaultValues.codePerformance,
                    commitFrequency: defaultValues.commitFrequency,
                    reportQuality: defaultValues.reportQuality,
                    quiz: quizScore,
                    note: finalNote
                  })),
                  teamAverage: finalNote
                };
              } else {
                throw new Error("Impossible de créer une évaluation sans information sur les membres de l'équipe");
              }
            }
          }
        }
        
        // Nettoyer les données avant envoi
        // Supprimer les champs undefined et null
        const cleanData = JSON.parse(JSON.stringify(evaluationData));
        
        // Vérifier que les champs obligatoires sont présents
        if (method === 'POST' && !cleanData.team) {
          cleanData.team = selectedTeam;
        }
        
        if (!cleanData.evaluator) {
          cleanData.evaluator = user._id;
        }
        
        // Envoyer les données d'évaluation
        console.log("Envoi des données d'évaluation:", method, url);
        console.log("Données envoyées:", JSON.stringify(cleanData, null, 2));
        
        try {
          const response = await axios({
            method,
            url,
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            data: cleanData
          });
          
          if (response.status === 200 || response.status === 201) {
            setUpdateSuccess(true);
            setTimeout(() => setUpdateSuccess(false), 5000);
            console.log("Score sauvegardé avec succès:", quizScore);
          } else {
            throw new Error(`Erreur HTTP: ${response.status}`);
          }
        } catch (apiError) {
          console.error('Erreur API:', apiError);
          if (apiError.response) {
            console.error('Détails de l\'erreur:', apiError.response.data);
            throw new Error(`Erreur ${apiError.response.status}: ${JSON.stringify(apiError.response.data)}`);
          } else {
            throw apiError;
          }
        }
        
      } catch (error) {
        console.error('Erreur lors de la mise à jour de l\'évaluation:', error);
        setError(error.message || "Erreur lors de la sauvegarde du score");
      }
    } else {
      setError("Veuillez sélectionner une équipe pour sauvegarder le score");
    }
  };

  // Fonction pour récupérer les membres d'une équipe à partir de l'API utilisateurs
  const getTeamMembersFromUsers = async (teamId) => {
    try {
      if (!teamId) return [];
      
      const token = localStorage.getItem('token');
      if (!token) return [];
      
      // Récupérer tous les utilisateurs qui ont cette équipe comme référence
      const response = await axios.get(`http://localhost:5001/api/users/byteam/${teamId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.data || !response.data.success || !response.data.data) {
        return [];
      }
      
      // Transformer en format attendu pour les membres d'équipe
      return response.data.data.map(user => ({
        user: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email
        }
      }));
      
    } catch (error) {
      console.error("Erreur lors de la récupération des membres par API users:", error);
      return [];
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <GitHubIcon sx={{ fontSize: 32, mr: 2, color: '#333' }} />
          <Typography variant="h4" gutterBottom sx={{ color: '#dd2825', mb: 0 }}>
            AI Quiz Generator
          </Typography>
        </Box>
        
            <Typography variant="body1" sx={{ mb: 3 }}>
              Automatically generate a quiz from a GitHub repository source code. The AI will analyze the code
              and create relevant questions to assess code understanding.
            </Typography>

        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <TextField
              fullWidth
              label="GitHub Repository Link"
              placeholder="https://github.com/username/repository"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
          />
          
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel id="team-select-label">Team to Evaluate</InputLabel>
            <Select
              labelId="team-select-label"
              value={selectedTeam}
              onChange={handleTeamChange}
              label="Team to Evaluate"
              disabled={loadingTeams}
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {teams.map((team) => (
                <MenuItem key={team._id} value={team._id}>
                  {team.name}
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>
              Choose a team to save the score
            </FormHelperText>
          </FormControl>
        </Box>

            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <Tooltip title="Generate a quiz from the specified repository">
                <span>
                <Button
                  variant="contained"
                  startIcon={<GitHubIcon />}
                  onClick={handleGenerate}
                  disabled={loading || !repoUrl}
                  sx={{ 
                    backgroundColor: '#dd2825', 
                    color: '#fff',
                    '&:hover': { backgroundColor: '#c42020' } 
                  }}
                >
                  Generate Quiz
                </Button>
                </span>
              </Tooltip>
              <Tooltip title="Generate a new quiz from the same repository">
                <span>
                  <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={handleRegenerate}
                    disabled={loading || !lastRepo}
                  >
                    Regenerate
                  </Button>
                </span>
              </Tooltip>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}
        
        {updateSuccess && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Quiz score successfully recorded in the team evaluation!
          </Alert>
        )}

            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                <CircularProgress />
              </Box>
            )}

            {!loading && quiz && (
              <InteractiveQuiz 
                quizText={quiz} 
                repoUrl={lastRepo}
                onQuizComplete={handleQuizComplete}
              />
        )}
      </Paper>
    </Container>
  );
} 