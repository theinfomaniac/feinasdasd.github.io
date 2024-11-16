import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

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
  }, [selectedSubject]);

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
  }, [selectedSubsection]);

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

  const generatePDF = (includeAnswers) => {
    const selectedQuestionsData = questions.filter(q => selectedQuestions.includes(q.ID));
    const content = selectedQuestionsData.map(q => ({
      id: q.ID,
      subject: q.Subject,
      subsection: q.Subsection,
      section: q.Section,
      question: q.Question,
      options: q.Options,
      ...(includeAnswers && { answer: q.Correct1 })
    }));

    // In a real implementation, you would generate a PDF here
    console.log('Generating PDF with:', content);
    alert('PDF generation would happen here with the selected questions');
  };

  if (loading) {
    return (
      <div className="text-center p-8">
        <p>Loading question bank...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="mb-6 flex justify-end gap-4">
        <button
          onClick={() => generatePDF(false)}
          className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          <Download size={16} /> Export Questions
        </button>
        <button
          onClick={() => generatePDF(true)}
          className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          <Download size={16} /> Export with Answers
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          className="p-2 border rounded bg-white/10 text-white"
        >
          <option value="">Select Subject</option>
          {subjects.map(subject => (
            <option key={subject} value={subject}>{subject}</option>
          ))}
        </select>

        <select
          value={selectedSubsection}
          onChange={(e) => setSelectedSubsection(e.target.value)}
          className="p-2 border rounded bg-white/10 text-white"
          disabled={!selectedSubject}
        >
          <option value="">Select Subsection</option>
          {subsections.map(subsection => (
            <option key={subsection} value={subsection}>{subsection}</option>
          ))}
        </select>

        <select
          value={selectedSection}
          onChange={(e) => setSelectedSection(e.target.value)}
          className="p-2 border rounded bg-white/10 text-white"
          disabled={!selectedSubsection}
        >
          <option value="">Select Section</option>
          {sections.map(section => (
            <option key={section} value={section}>{section}</option>
          ))}
        </select>
      </div>

      <div className="bg-black/30 backdrop-blur-sm border border-cyan-500/30 rounded-lg p-4">
        <table className="w-full">
          <thead>
            <tr className="border-b border-cyan-500/30">
              <th className="p-2 text-left w-16">Select</th>
              <th className="p-2 text-left">ID</th>
              <th className="p-2 text-left">Subject</th>
              <th className="p-2 text-left">Subsection</th>
              <th className="p-2 text-left">Section</th>
              <th className="p-2 text-left w-24">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredQuestions.map(question => (
              <tr key={question.ID} className="border-b border-cyan-500/20">
                <td className="p-2">
                  <input
                    type="checkbox"
                    checked={selectedQuestions.includes(question.ID)}
                    onChange={() => handleCheckQuestion(question.ID)}
                    className="w-4 h-4"
                  />
                </td>
                <td className="p-2">{question.ID}</td>
                <td className="p-2">{question.Subject}</td>
                <td className="p-2">{question.Subsection}</td>
                <td className="p-2">{question.Section}</td>
                <td className="p-2">
                  <button
                    onClick={() => setViewingQuestion(question)}
                    className="bg-cyan-500 text-white px-3 py-1 rounded hover:bg-cyan-600"
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-black/80 border border-cyan-500/30 rounded-lg p-6 max-w-2xl w-full relative">
            <button
              onClick={() => setViewingQuestion(null)}
              className="absolute top-4 right-4 text-white/60 hover:text-white"
            >
              <X size={24} />
            </button>
            <div className="mb-4">
              <span className="text-cyan-400 text-sm">{viewingQuestion.Subject}</span>
              <div className="text-white/60 text-sm mt-1">
                {viewingQuestion.Subsection} • {viewingQuestion.Section}
              </div>
            </div>
            <div className="text-xl text-white mb-6">{viewingQuestion.Question}</div>
            {viewingQuestion.Options ? (
              <div className="space-y-3">
                {viewingQuestion.Options.split('\n').map((option, index) => (
                  <div
                    key={index}
                    className="p-3 border border-cyan-500/30 rounded hover:bg-cyan-500/20 transition-colors cursor-pointer"
                  >
                    {option}
                  </div>
                ))}
              </div>
            ) : (
              <input
                type="text"
                placeholder="Type your answer..."
                className="w-full p-3 bg-white/10 border border-cyan-500/30 rounded"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionBank;
