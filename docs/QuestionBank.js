import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

const { useState, useEffect } = React;

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

    console.log('Generating PDF with:', content);
    alert('PDF generation would happen here with the selected questions');
  };

  if (loading) {
    return React.createElement('div', { className: 'text-center p-8' },
      React.createElement('p', null, 'Loading question bank...')
    );
  }

  return React.createElement('div', { className: 'max-w-6xl mx-auto p-4' }, [
    React.createElement('div', { className: 'mb-6 flex justify-end gap-4', key: 'buttons' }, [
      React.createElement('button', {
        key: 'export',
        onClick: () => generatePDF(false),
        className: 'bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600'
      }, 'Export Questions'),
      React.createElement('button', {
        key: 'export-answers',
        onClick: () => generatePDF(true),
        className: 'bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600'
      }, 'Export with Answers')
    ]),

    React.createElement('div', { className: 'grid grid-cols-3 gap-4 mb-6', key: 'filters' }, [
      React.createElement('select', {
        key: 'subject',
        value: selectedSubject,
        onChange: (e) => setSelectedSubject(e.target.value),
        className: 'p-2 border rounded bg-white/10 text-white'
      }, [
        React.createElement('option', { value: '', key: 'default' }, 'Select Subject'),
        ...subjects.map(subject => 
          React.createElement('option', { key: subject, value: subject }, subject)
        )
      ]),

      React.createElement('select', {
        key: 'subsection',
        value: selectedSubsection,
        onChange: (e) => setSelectedSubsection(e.target.value),
        className: 'p-2 border rounded bg-white/10 text-white',
        disabled: !selectedSubject
      }, [
        React.createElement('option', { value: '', key: 'default' }, 'Select Subsection'),
        ...subsections.map(subsection => 
          React.createElement('option', { key: subsection, value: subsection }, subsection)
        )
      ]),

      React.createElement('select', {
        key: 'section',
        value: selectedSection,
        onChange: (e) => setSelectedSection(e.target.value),
        className: 'p-2 border rounded bg-white/10 text-white',
        disabled: !selectedSubsection
      }, [
        React.createElement('option', { value: '', key: 'default' }, 'Select Section'),
        ...sections.map(section => 
          React.createElement('option', { key: section, value: section }, section)
        )
      ])
    ]),

    React.createElement('div', { className: 'bg-black/30 backdrop-blur-sm border border-cyan-500/30 rounded-lg p-4', key: 'table' },
      React.createElement('table', { className: 'w-full' }, [
        React.createElement('thead', { key: 'head' },
          React.createElement('tr', { className: 'border-b border-cyan-500/30' }, [
            React.createElement('th', { className: 'p-2 text-left w-16', key: 'select' }, 'Select'),
            React.createElement('th', { className: 'p-2 text-left', key: 'id' }, 'ID'),
            React.createElement('th', { className: 'p-2 text-left', key: 'subject' }, 'Subject'),
            React.createElement('th', { className: 'p-2 text-left', key: 'subsection' }, 'Subsection'),
            React.createElement('th', { className: 'p-2 text-left', key: 'section' }, 'Section'),
            React.createElement('th', { className: 'p-2 text-left w-24', key: 'actions' }, 'Actions')
          ])
        ),
        React.createElement('tbody', { key: 'body' },
          filteredQuestions.map(question => 
            React.createElement('tr', { key: question.ID, className: 'border-b border-cyan-500/20' }, [
              React.createElement('td', { className: 'p-2', key: 'checkbox' },
                React.createElement('input', {
                  type: 'checkbox',
                  checked: selectedQuestions.includes(question.ID),
                  onChange: () => handleCheckQuestion(question.ID),
                  className: 'w-4 h-4'
                })
              ),
              React.createElement('td', { className: 'p-2', key: 'id' }, question.ID),
              React.createElement('td', { className: 'p-2', key: 'subject' }, question.Subject),
              React.createElement('td', { className: 'p-2', key: 'subsection' }, question.Subsection),
              React.createElement('td', { className: 'p-2', key: 'section' }, question.Section),
              React.createElement('td', { className: 'p-2', key: 'view' },
                React.createElement('button', {
                  onClick: () => setViewingQuestion(question),
                  className: 'bg-cyan-500 text-white px-3 py-1 rounded hover:bg-cyan-600'
                }, 'View')
              )
            ])
          )
        )
      ])
    ),

    viewingQuestion && React.createElement('div', { 
      className: 'fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4',
      key: 'modal'
    },
      React.createElement('div', { className: 'bg-black/80 border border-cyan-500/30 rounded-lg p-6 max-w-2xl w-full relative' }, [
        React.createElement('button', {
          key: 'close',
          onClick: () => setViewingQuestion(null),
          className: 'absolute top-4 right-4 text-white/60 hover:text-white'
        }, '×'),
        React.createElement('div', { className: 'mb-4', key: 'header' }, [
          React.createElement('span', { className: 'text-cyan-400 text-sm' }, viewingQuestion.Subject),
          React.createElement('div', { className: 'text-white/60 text-sm mt-1' },
            `${viewingQuestion.Subsection} • ${viewingQuestion.Section}`
          )
        ]),
        React.createElement('div', { className: 'text-xl text-white mb-6', key: 'question' }, viewingQuestion.Question),
        viewingQuestion.Options ?
          React.createElement('div', { className: 'space-y-3', key: 'options' },
            viewingQuestion.Options.split('\n').map((option, index) =>
              React.createElement('div', {
                key: index,
                className: 'p-3 border border-cyan-500/30 rounded hover:bg-cyan-500/20 transition-colors cursor-pointer'
              }, option)
            )
          ) :
          React.createElement('input', {
            key: 'input',
            type: 'text',
            placeholder: 'Type your answer...',
            className: 'w-full p-3 bg-white/10 border border-cyan-500/30 rounded'
          })
      ])
    )
  ]);
};

export default QuestionBank;
