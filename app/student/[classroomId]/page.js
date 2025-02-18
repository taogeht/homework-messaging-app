// app/student/page.js
'use client'; // Mark as a Client Component

import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';

export default function StudentPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [name, setName] = useState('');
  const [classroom, setClassroom] = useState('');
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const [students, setStudents] = useState([]);
  const params = useParams();
  const classroomId = params.classroomId;

  const fetchStudents = async () => {
    try {
      const response = await fetch(`/api/classrooms/${classroomId}/students`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setStudents(data.students);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  useEffect(() => {
    if (classroomId) {
      fetchStudents();
    }
  }, [classroomId]);

  const startRecording = async () => {
    setPreviewUrl(null); // Clear any existing preview
    setIsPreviewMode(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setPreviewUrl(URL.createObjectURL(audioBlob));
        setIsPreviewMode(true);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Could not start recording. Please make sure you have given microphone permissions.');
    }
  };

  const submitRecording = async () => {
    if (!previewUrl) return;

    const audioBlob = await fetch(previewUrl).then(r => r.blob());
    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    reader.onloadend = async () => {
      const base64Audio = reader.result;
      const student = students.find(s => s.name === name);
      
      try {
        const response = await fetch('/api/save', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name,
            studentId: student?.id,
            classroom: classroomId,
            audioData: base64Audio,
          }),
        });

        if (response.ok) {
          await fetchStudents();
          alert('Recording saved successfully!');
          setName('');
          setPreviewUrl(null);
          setIsPreviewMode(false);
        } else {
          alert('Failed to save recording');
        }
      } catch (error) {
        console.error('Error saving recording:', error);
        alert('Error saving recording');
      }
    };
  };

  const recordAgain = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setIsPreviewMode(false);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  return (
    <div className="p-4 flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-8">Student Recording Page</h1>
      <div className="space-y-8 w-full max-w-md">
        <div className="text-center">
          <select
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border p-2 rounded w-full text-center text-black"
            disabled={isRecording || isPreviewMode}
          >
            <option value="">-- Select your name --</option>
            {students.map((student) => (
              <option key={student.id} value={student.name}>
                {student.name}
              </option>
            ))}
          </select>
        </div>

        {isPreviewMode ? (
          <div className="space-y-4">
            <div className="w-full p-4 bg-gray-100 rounded-lg">
              <audio 
                src={previewUrl} 
                controls 
                className="w-full"
              />
            </div>
            <div className="flex justify-center gap-4">
              <button
                onClick={recordAgain}
                className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-all duration-200"
              >
                Record Again
              </button>
              <button
                onClick={submitRecording}
                className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-all duration-200"
              >
                Submit Recording
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={!name}
            className={`w-32 h-32 rounded-full mx-auto block 
              ${isRecording 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-red-500 hover:bg-red-600'
              } text-white ${!name ? 'opacity-50 cursor-not-allowed' : ''}
              transition-all duration-200 transform hover:scale-105
              flex items-center justify-center text-lg font-semibold`}
          >
            {isRecording ? 'Stop' : 'Record'}
          </button>
        )}
      </div>
    </div>
  );
}