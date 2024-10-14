'use client'
import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

// Assume this function exists and returns quiz data
export const generateQuiz = async (topic, numQuestions, difficulty) => {
  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ topic, numQuestions, difficulty }),
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const quiz = await response.json();
    return quiz;
  } catch (error) {
    console.error("Error generating quiz:", error);
    return null;
  }
};

export default function QuizApp() {
  const [topic, setTopic] = useState('');
  const [numQuestions, setNumQuestions] = useState(5);
  const [difficulty, setDifficulty] = useState('medium');
  const [quizData, setQuizData] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null); // Added error state
  const [feedback, setFeedback] = useState(null);

  const handleStartQuiz = async () => {
    // Input validation
    if (!topic.trim()) {
      alert("Please enter a valid topic.");
      return;
    }
    if (numQuestions < 1 || numQuestions > 20) {
      alert("Number of questions must be between 1 and 20.");
      return;
    }
    if (!['easy', 'medium', 'hard'].includes(difficulty)) {
      alert("Please select a valid difficulty level.");
      return;
    }

    setLoading(true);
    setError(null); // Reset error state
    const data = await generateQuiz(topic, numQuestions, difficulty);
    if (data) {
      setQuizData(data);
      setCurrentQuestion(0);
      setSelectedAnswers({});
      setShowResults(false);
    } else {
      setError("Failed to generate quiz. Please try again.");
    }
    setLoading(false);
  };

  const handleAnswerSelect = (questionIndex, answerIndex) => {
    if (feedback !== null) return; // Prevent changing answer after selection
    const isCorrect = quizData.questions[questionIndex].options[answerIndex] === quizData.questions[questionIndex].correctAnswer;
    setSelectedAnswers({ ...selectedAnswers, [questionIndex]: answerIndex });
    setFeedback(isCorrect ? 'correct' : 'incorrect');
  };

  const handleNextQuestion = () => {
    setFeedback(null); // Reset feedback for the next question
    if (currentQuestion < quizData.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setShowResults(true);
    }
  }

  const calculateScore = () => {
    return quizData.questions.reduce((score, question, index) => {
      const selectedIndex = selectedAnswers[index];
      const correctIndex = question.options.indexOf(question.correctAnswer);
      if (correctIndex === -1) {
        console.warn(`Correct answer "${question.correctAnswer}" not found in options for question ${index + 1}.`);
        return score;
      }
      return score + (selectedIndex === correctIndex ? 1 : 0);
    }, 0);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="mt-4 text-lg font-semibold text-gray-700">Generating your quiz...</p>
      </div>
    );
  }

  if (!quizData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">Quiz Generator</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="topic">Topic</Label>
              <Input
                id="topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Enter quiz topic"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="numQuestions">Number of Questions</Label>
              <Input
                id="numQuestions"
                type="number"
                value={numQuestions}
                onChange={(e) => setNumQuestions(parseInt(e.target.value))}
                min="1"
                max="20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty</Label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger>
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button onClick={handleStartQuiz} className="w-full">
              Start Quiz
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showResults) {
    const score = calculateScore();
    const percentage = (score / quizData.questions.length) * 100;

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">Quiz Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <p className="text-4xl font-bold text-primary">{score} / {quizData.questions.length}</p>
              <p className="text-xl text-gray-600">({percentage.toFixed(2)}%)</p>
            </div>
            <Progress value={percentage} className="w-full h-2" />
            <Alert variant={percentage >= 70 ? "success" : "warning"}>
              {percentage >= 70 ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              <AlertTitle>
                {percentage >= 70 ? "Congratulations!" : "Keep practicing!"}
              </AlertTitle>
              <AlertDescription>
                {percentage >= 70
                  ? "You did great on this quiz!"
                  : "You can improve your score with more practice."}
              </AlertDescription>
            </Alert>
            <Button onClick={() => setQuizData(null)} className="w-full">
              Create New Quiz
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQ = quizData.questions[currentQuestion];

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-xl font-bold">
            Question {currentQuestion + 1} of {quizData.questions.length}
          </CardTitle>
          <Progress
            value={(currentQuestion + 1) / quizData.questions.length * 100}
            className="w-full h-2"
          />
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-lg font-medium">{currentQ.question}</p>
          <RadioGroup
            value={selectedAnswers[currentQuestion]?.toString() || ''}
            onValueChange={(value) => handleAnswerSelect(currentQuestion, parseInt(value))}
            className="space-y-2"
          >
            {currentQ.options.map((option, index) => {
              const isSelected = selectedAnswers[currentQuestion] === index;
              const isCorrect = currentQ.correctAnswer === option;
              const isIncorrect = isSelected && !isCorrect;

              return (
                <div key={index} className={`flex items-center p-3 rounded-lg transition-colors
                                    ${isCorrect && feedback === 'correct' ? 'bg-green-100 text-green-800' : ''}
                                    ${isIncorrect && feedback === 'incorrect' ? 'bg-red-100 text-red-800' : ''}
                                    ${isSelected && !feedback ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100'}
                                `}>
                  <RadioGroupItem
                    value={index.toString()}
                    id={`question-${currentQuestion}-option-${index}`}
                    disabled={feedback !== null}
                    className="mr-3"
                  />
                  <Label htmlFor={`question-${currentQuestion}-option-${index}`} className="flex-1 cursor-pointer">
                    {option}
                  </Label>
                  {feedback && isCorrect && (
                    <CheckCircle2 className="h-5 w-5 text-green-500 ml-2" />
                  )}
                  {feedback && isIncorrect && isSelected && (
                    <AlertCircle className="h-5 w-5 text-red-500 ml-2" />
                  )}
                </div>
              );
            })}
          </RadioGroup>
          {feedback && (
            <Alert variant={feedback === 'correct' ? "success" : "destructive"} className="mt-4">
              {feedback === 'correct' ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>Correct!</AlertDescription>
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>Incorrect. The correct answer is "{currentQ.correctAnswer}".</AlertDescription>
                </>
              )}
            </Alert>
          )}
          <Button
            onClick={handleNextQuestion}
            className="w-full mt-4"
            disabled={selectedAnswers[currentQuestion] === undefined || feedback === null}
          >
            {currentQuestion < quizData.questions.length - 1 ? (
              <>
                Next <ChevronRight className="w-4 h-4 ml-2" />
              </>
            ) : (
              "Finish Quiz"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};