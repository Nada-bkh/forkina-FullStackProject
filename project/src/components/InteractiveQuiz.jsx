import React, { useState, useEffect } from 'react';
import {
  Box, Typography, RadioGroup, FormControlLabel, Radio, Button, Alert, Paper,
  CircularProgress, Snackbar, LinearProgress, TextField, Dialog, DialogActions,
  DialogContent, DialogContentText, DialogTitle
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import axios from 'axios';

export default function InteractiveQuiz({ quizText, repoUrl, onQuizComplete }) {
  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [parsedQuiz, setParsedQuiz] = useState([]);
  const [submittingResult, setSubmittingResult] = useState(false);
  const [resultSubmitted, setResultSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [repoUrlInput, setRepoUrlInput] = useState(repoUrl || '');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    setParsedQuiz(parseQuiz(quizText));
  }, [quizText]);

  const parseQuiz = (text) => {
    if (!text) return [];

    // Nettoyage de texte d'intro
    const introPatterns = [
      /I['']m happy to help/i,
      /Here are/i,
      /Voici/i,
      /Based on the code/i
    ];
    for (const pattern of introPatterns) {
      if (pattern.test(text.substring(0, 300))) {
        const intro = text.match(new RegExp("^.*?" + pattern.source + ".*?\n", "i"));
        if (intro?.[0]) text = text.substring(intro[0].length).trim();
      }
    }

    // Séparer en blocs de questions
    const questionBlocks = text.split(/\n(?=\d+[.)\s])/).filter(Boolean);

    const parsed = questionBlocks.map((block, index) => {
      const lines = block.trim().split('\n');
      const questionLine = lines[0].replace(/^\d+[.)\s]+/, '').trim();

      if (!questionLine || questionLine.length < 5) return null;

      const options = [];
      const seen = new Set();

      lines.slice(1).forEach(line => {
        const match = line.trim().match(/^([A-D])[.)\s-]+(.+)/);
        if (match && !seen.has(match[1])) {
          seen.add(match[1]);
          options.push({ label: match[1], text: match[2].trim() });
        }
      });

      if (options.length < 2) return null;

      let correct = null;
      const full = lines.join(' ');

      const correctRegexes = [
        /Réponse\s+correcte\s*[:\-]?\s*([A-D])/i,
        /La\s+bonne\s+réponse\s+est\s*([A-D])/i,
        /Bonne\s*réponse\s*:\s*([A-D])/i,
        /\*\*\s*(?:Réponse|Bonne réponse)\s*:\s*([A-D])/i,
        /([A-D])\s+(?:est|is)\s+(?:correct|la bonne réponse)/i
      ];

      for (const rgx of correctRegexes) {
        const match = full.match(rgx);
        if (match) {
          correct = match[1].toUpperCase();
          break;
        }
      }

      if (!correct) {
        for (const opt of options) {
          if (/(✓|\bbonne réponse\b|\bcorrecte?\b)/i.test(opt.text)) {
            correct = opt.label;
            break;
          }
        }
      }

      return {
        question: questionLine,
        options,
        correct
      };
    });

    return parsed.filter(Boolean);
  };

  const handleAnswerChange = (index, value) => {
    setAnswers({ ...answers, [index]: value });
  };

  const calculateScore = () => {
    if (parsedQuiz.length === 0) return 0;
    
    let correctCount = 0;
    parsedQuiz.forEach((q, idx) => {
      if (answers[idx] === q.correct) {
        correctCount++;
      }
    });
    
    const calculatedScore = Math.round((correctCount / parsedQuiz.length) * 100);
    setScore(calculatedScore);
    return calculatedScore;
  };

  const handleShowResults = () => {
    const finalScore = calculateScore();
    setShowResults(true);
  };

  const prepareQuizResultData = () => {
    const correctCount = parsedQuiz.reduce((count, question, idx) => 
      answers[idx] === question.correct ? count + 1 : count, 0);
    
    const formattedAnswers = parsedQuiz.map((question, idx) => ({
      questionIndex: idx + 1,
      question: question.question,
      selectedAnswer: answers[idx] || '',
      correctAnswer: question.correct,
      isCorrect: answers[idx] === question.correct
    }));

    return {
      repoUrl: repoUrlInput,
      quizContent: quizText,
      answers: formattedAnswers,
      score,
      totalQuestions: parsedQuiz.length,
      correctAnswers: correctCount
    };
  };

  const handleSubmitResults = async () => {
    if (!repoUrlInput) {
      setDialogOpen(true);
      return;
    }

    setSubmittingResult(true);
    
    try {
      const resultData = prepareQuizResultData();
      resultData.repoUrl = repoUrlInput;
      
      // Ne plus envoyer au backend, juste notifier le parent
      if (onQuizComplete) {
        onQuizComplete(resultData);
      }

      setResultSubmitted(true);
      setSnackbar({
        open: true,
        message: 'Results processed successfully!',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error processing results:', error);
      setSnackbar({
        open: true,
        message: 'Error processing results',
        severity: 'error'
      });
    } finally {
      setSubmittingResult(false);
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  const handleSubmitRepoUrl = () => {
    if (repoUrlInput) {
      setDialogOpen(false);
      handleSubmitResults();
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const allAnswered = parsedQuiz.length > 0 && Object.keys(answers).length === parsedQuiz.length;

  if (parsedQuiz.length === 0) {
    return (
      <Paper elevation={2} sx={{ whiteSpace: 'pre-line', bgcolor: '#f7f7f7', p: 3, borderRadius: 2 }}>
        <Typography variant="h6" sx={{ mb: 2, color: '#dd2825' }}>
          Unrecognized quiz format
        </Typography>
        <Typography variant="body1">
          {quizText || "No questions could be detected in the expected format."}
        </Typography>
      </Paper>
    );
  }

  return (
    <Box sx={{ mt: 4 }}>
      {/* Score display */}
      {showResults && (
        <Paper elevation={3} sx={{ p: 3, mb: 4, bgcolor: '#f8f9fa', border: '1px solid #e0e0e0', borderRadius: 2 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: score >= 60 ? '#2e7d32' : '#d32f2f' }}>
            Your score: {score}/100
          </Typography>
          
          <Box sx={{ mt: 2, mb: 2 }}>
            <LinearProgress 
              variant="determinate" 
              value={score} 
              sx={{ 
                height: 10, 
                borderRadius: 5,
                bgcolor: '#e0e0e0',
                '& .MuiLinearProgress-bar': {
                  bgcolor: score >= 60 ? '#2e7d32' : '#d32f2f',
                }
              }} 
            />
          </Box>
          
          <Typography variant="body1">
            You correctly answered {parsedQuiz.reduce((count, q, idx) => 
              answers[idx] === q.correct ? count + 1 : count, 0)} 
            {' '}question{parsedQuiz.reduce((count, q, idx) => 
              answers[idx] === q.correct ? count + 1 : count, 0) > 1 ? 's' : ''} 
            out of {parsedQuiz.length}.
          </Typography>
        </Paper>
      )}

      {parsedQuiz.map((q, idx) => (
        <Paper key={idx} elevation={1} sx={{ mb: 3, p: 3, border: '1px solid #eee', borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            {idx + 1}. {q.question}
            {showResults && (
              <Box component="span" sx={{ ml: 2 }}>
                {answers[idx] === q.correct ? (
                  <CheckCircleIcon sx={{ color: 'green', verticalAlign: 'middle' }} />
                ) : (
                  <ErrorIcon sx={{ color: 'red', verticalAlign: 'middle' }} />
                )}
              </Box>
            )}
          </Typography>
          
          <RadioGroup
            value={answers[idx] || ''}
            onChange={(e) => handleAnswerChange(idx, e.target.value)}
          >
            {q.options.map((opt, i) => (
              <FormControlLabel
                key={i}
                value={opt.label}
                control={<Radio />}
                label={
                  <Box component="span" sx={{ display: 'flex', alignItems: 'center' }}>
                    {`${opt.label}. ${opt.text}`}
                    {showResults && opt.label === q.correct && (
                      <CheckCircleIcon sx={{ ml: 1, color: 'green', fontSize: '1rem' }} />
                    )}
                  </Box>
                }
                disabled={showResults}
                sx={
                  showResults && answers[idx] === opt.label && answers[idx] !== q.correct
                    ? { color: 'red' }
                    : {}
                }
              />
            ))}
          </RadioGroup>
          
          {showResults && (
            <Alert 
              severity={answers[idx] === q.correct ? "success" : "error"} 
              sx={{ mt: 2 }}
            >
              {answers[idx] === q.correct
                ? "✓ Well done!"
                : `✗ Not quite... The correct answer was "${q.correct}".`}
            </Alert>
          )}
        </Paper>
      ))}

      <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
        {!showResults ? (
          <Button
            variant="contained"
            endIcon={<ArrowForwardIcon />}
            disabled={!allAnswered}
            onClick={handleShowResults}
            sx={{
              backgroundColor: '#dd2825',
              '&:hover': { backgroundColor: '#c42020' }
            }}
          >
            Check my answers
          </Button>
        ) : (
          <Button
            variant="contained"
            disabled={submittingResult || resultSubmitted}
            onClick={handleSubmitResults}
            sx={{
              backgroundColor: '#2e7d32',
              '&:hover': { backgroundColor: '#1b5e20' }
            }}
          >
            {submittingResult ? (
              <CircularProgress size={24} sx={{ color: 'white' }} />
            ) : resultSubmitted ? (
              "Results processed ✓"
            ) : (
              "Process my results"
            )}
          </Button>
        )}
      </Box>

      <Dialog open={dialogOpen} onClose={handleCloseDialog}>
        <DialogTitle>GitHub Repository URL</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Please provide the GitHub repository URL of your project to record your results.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="GitHub Repository URL"
            type="url"
            fullWidth
            variant="outlined"
            value={repoUrlInput}
            onChange={(e) => setRepoUrlInput(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSubmitRepoUrl} 
            variant="contained" 
            color="primary"
            disabled={!repoUrlInput}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message={snackbar.message}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity} 
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
