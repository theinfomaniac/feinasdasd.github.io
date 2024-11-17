import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const QuestionBank = () => {
  const [questions, setQuestions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [subsections, setSubsections] = useState([]);
  const [sections, setSections] = useState([]);
  
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedSubsection, setSelectedSubsection] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [viewingQuestion, setViewingQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userAnswer, setUserAnswer] = useState('');

  useEffect(() => {
    fetchQuestions();
  }, []);

  useEffect(() => {
    if (questions.length > 0) {
      const uniqueSubjects = [...new Set(questions.map(q => q.Subject))];
      setSubjects(uniqueSubjects);
    }
  }, [questions]);

  useEffect(() => {
    if (selectedSubject) {
      const filteredSubsections = [...new Set(
        questions
          .filter(q => q.Subject === selectedSubject)
          .map(q => q.Subsection)
      )];
      setSubsections(filteredSubsections);
      setSelectedSubsection('');
      setSelectedSection('');
    }
  }, [selectedSubject, questions]);

  useEffect(() => {
    if (selectedSubsection) {
      const filteredSections = [...new Set(
        questions
          .filter(q => q.Subject === selectedSubject && q.Subsection === selectedSubsection)
          .map(q => q.Section)
      )];
      setSections(filteredSections);
      setSelectedSection('');
    }
  }, [selectedSubsection, selectedSubject, questions]);

  const fetchQuestions = async () => {
    try {
      const response = await fetch('https://sheets.livepolls.app/api/spreadsheets/0576df12-21e9-4d9f-8528-286ad2cd4cf5/Sheet1');
      const data = await response.json();
      if (data.success) {
        setQuestions(data.data);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching questions:', error);
      setLoading(false);
    }
  };

  const filteredQuestions = questions.filter(q => {
    return (!selectedSubject || q.Subject === selectedSubject) &&
           (!selectedSubsection || q.Subsection === selectedSubsection) &&
           (!selectedSection || q.Section === selectedSection);
  });

  const handleCheckQuestion = (questionId) => {
    setSelectedQuestions(prev => {
      if (prev.includes(questionId)) {
        return prev.filter(id => id !== questionId);
      }
      return [...prev, questionId];
    });
  };

  if (loading) {
    return <div className="text-center p-8">Loading questions...</div>;
  }

  return (
    <div className="p-4">
      <div className="flex flex-wrap gap-4 mb-6">
        <select
          className="flex-1 min-w-[200px] bg-black bg-opacity-30 text-white border-2 border-cyan-500 rounded p-2"
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
        >
          <option value="">All Subjects</option>
          {subjects.map(subject => (
            <option key={subject} value={subject}>{subject}</option>
          ))}
        </select>

        <select
          className="flex-1 min-w-[200px] bg-black bg-opacity-30 text-white border-2 border-cyan-500 rounded p-2"
          value={selectedSubsection}
          onChange={(e) => setSelectedSubsection(e.target.value)}
          disabled={!selectedSubject}
        >
          <option value="">All Subsections</option>
          {subsections.map(subsection => (
            <option key={subsection} value={subsection}>{subsection}</option>
          ))}
        </select>

        <select
          className="flex-1 min-w-[200px] bg-black bg-opacity-30 text-white border-2 border-cyan-500 rounded p-2"
          value={selectedSection}
          onChange={(e) => setSelectedSection(e.target.value)}
          disabled={!selectedSubsection}
        >
          <option value="">All Sections</option>
          {sections.map(section => (
            <option key={section} value={section}>{section}</option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="p-2 border border-cyan-500 text-left">Select</th>
              <th className="p-2 border border-cyan-500 text-left">ID</th>
              <th className="p-2 border border-cyan-500 text-left">Subject</th>
              <th className="p-2 border border-cyan-500 text-left">Subsection</th>
              <th className="p-2 border border-cyan-500 text-left">Section</th>
              <th className="p-2 border border-cyan-500 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredQuestions.map(question => (
              <tr key={question.ID} className="hover:bg-cyan-900 hover:bg-opacity-20">
                <td className="p-2 border border-cyan-500">
                  <input
                    type="checkbox"
                    checked={selectedQuestions.includes(question.ID)}
                    onChange={() => handleCheckQuestion(question.ID)}
                    className="w-4 h-4"
                  />
                </td>
                <td className="p-2 border border-cyan-500">{question.ID}</td>
                <td className="p-2 border border-cyan-500">{question.Subject}</td>
                <td className="p-2 border border-cyan-500">{question.Subsection}</td>
                <td className="p-2 border border-cyan-500">{question.Section}</td>
                <td className="p-2 border border-cyan-500 text-center">
                  <button
                    onClick={() => setViewingQuestion(question)}
                    className="bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-1 rounded"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {viewingQuestion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border-2 border-cyan-500 rounded-lg p-6 w-full max-w-2xl relative">
            <button 
              onClick={() => {
                setViewingQuestion(null);
                setUserAnswer('');
              }}
              className="absolute top-4 right-4 text-white hover:text-cyan-400"
            >
              <X size={24} />
            </button>
            
            <div className="mb-4">
              <span className="text-cyan-400 text-lg">{viewingQuestion.Subject}</span>
              <span className="text-gray-400 italic ml-4">{viewingQuestion.ID}</span>
            </div>
            
            <div className="text-white mb-4">
              {viewingQuestion.Subsection} - {viewingQuestion.Section}
            </div>
            
            <div className="text-2xl text-white mb-6">
              {viewingQuestion.Question}
            </div>
            
            <div className="space-y-4">
              {viewingQuestion.Options && viewingQuestion.Options.trim() !== "" ? (
                viewingQuestion.Options.split('\n').map((option, index) => (
                  <div
                    key={index}
                    className="p-4 border-2 border-cyan-500 rounded cursor-pointer hover:bg-cyan-900 hover:bg-opacity-20"
                    onClick={() => setUserAnswer(option)}
                  >
                    {option}
                  </div>
                ))
              ) : (
                <textarea
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="Type your answer here..."
                  className="w-full p-2 bg-black bg-opacity-30 text-white border-2 border-cyan-500 rounded"
                  rows={4}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionBank;
