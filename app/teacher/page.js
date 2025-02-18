// app/teacher/page.js
'use client'; // Mark as a Client Component

import React, { useEffect, useState } from 'react';
import styles from './TeacherPage.module.css';  // We'll create this next
import { useParams } from 'next/navigation';
import { classroomStudents } from '../data/students';

export default function TeacherPage() {
  const [recordings, setRecordings] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [allStudents, setAllStudents] = useState([]);
  const [students, setStudents] = useState([]);
  const params = useParams();
  const classroomId = params.classroomId;

  // Get unique class names from recordings
  const classes = [...new Set(recordings.map(recording => recording.class))];

  useEffect(() => {
    // Fetch recordings with error handling for invalid JSON
    fetch('/api/nextcloud-recordings')
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new TypeError("Expected JSON response");
        }
        return response.json();
      })
      .then((data) => {
        console.log('Raw recordings data:', data);
        setRecordings(data);
      })
      .catch((error) => console.error('Error fetching recordings:', error));

    // Fetch all students with improved error handling and debugging
    fetch('/api/students')
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new TypeError("Expected JSON response");
        }
        const data = await response.json();
        console.log('All students data:', data);
        setAllStudents(data);
      })
      .catch((error) => console.error('Error fetching all students:', error));

    // Modified fetchStudents with more debugging
    const fetchStudents = async () => {
      try {
        console.log('Fetching students for classroom:', classroomId);
        const response = await fetch(`/api/classrooms/${classroomId}/students`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Classroom students data:', data); // Debug log
        
        // If no classroom-specific students, use all students
        if (!data || !data.length) {
          console.log('No classroom-specific students, using all students');
          setStudents(allStudents);
        } else {
          setStudents(data.students || data);
        }
      } catch (error) {
        console.error('Error fetching classroom students:', error);
        // Fallback to all students if classroom-specific fetch fails
        console.log('Falling back to all students');
        setStudents(allStudents);
      }
    };

    if (classroomId) {
      fetchStudents();
    } else {
      setStudents(allStudents);
    }
  }, [classroomId]);

  // Group recordings by week
  const getWeeks = () => {
    const weeks = {};
    recordings.forEach(recording => {
      const recordingDate = new Date(recording.createdAt);
      const weekStart = new Date(recordingDate);
      weekStart.setDate(recordingDate.getDate() - recordingDate.getDay()); // Start of week (Sunday)
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!weeks[weekKey]) {
        weeks[weekKey] = [];
      }
      weeks[weekKey].push(recording);
    });
    return weeks;
  };

  // Get available weeks sorted by date (most recent first)
  const availableWeeks = Object.keys(getWeeks()).sort((a, b) => new Date(b) - new Date(a));

  // Filter recordings by both class and week
  const filteredRecordings = selectedClass 
    ? recordings.filter(recording => {
        if (recording.class !== selectedClass) return false;
        
        if (selectedWeek) {
          const recordingDate = new Date(recording.createdAt);
          const weekStart = new Date(recordingDate);
          weekStart.setDate(recordingDate.getDate() - recordingDate.getDay());
          return weekStart.toISOString().split('T')[0] === selectedWeek;
        }
        return true;
      })
    : [];

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Teacher Dashboard</h1>
      
      {!selectedClass ? (
        // Show class cards
        <div className={styles.grid}>
          {classes.map((className) => (
            <div 
              key={className} 
              className={styles.card}
              onClick={() => setSelectedClass(className)}
            >
              <div className={styles.cardHeader}>
                <h2>{className}</h2>
              </div>
              <div className={styles.cardBody}>
                <p>{recordings.filter(r => r.class === className).length} recordings</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <button 
            className={styles.backButton}
            onClick={() => {
              setSelectedClass(null);
              setSelectedWeek(null);
            }}
          >
            Back to Classes
          </button>
          <div className={styles.bannerContainer}>
            <h2 className={styles.bannerHeading}>{selectedClass}</h2>
            
            <select 
              className={styles.weekSelector}
              value={selectedWeek || ''}
              onChange={(e) => setSelectedWeek(e.target.value || null)}
            >
              <option value="">All Weeks</option>
              {availableWeeks.map(week => {
                const weekDate = new Date(week);
                const weekEnd = new Date(weekDate);
                weekEnd.setDate(weekDate.getDate() + 6);
                const displayDate = `${weekDate.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}`;
                return (
                  <option key={week} value={week}>
                    {displayDate}
                  </option>
                );
              })}
            </select>
          </div>
          
          <div className={styles.columnsContainer}>
            {/* Finished Students Column */}
            <div className={styles.column}>
              <h3>Finished</h3>
              <ul className={styles.studentList}>
                {filteredRecordings.map((recording) => {
                  // Extract student name from name property
                  const studentName = recording.name 
                    ? recording.name.split('-')[1] 
                    : 'Unknown Student';
                  
                  return (
                    <li key={recording.name} className={`${styles.studentItem} ${styles.darkText}`}>
                      <div className={styles.recordingInfo}>
                        <span className={styles.studentName}>{studentName}</span>
                        <div className={styles.recordingDetails}>
                          <audio 
                            controls 
                            src={recording.url} 
                            className={styles.audioPlayer}
                            preload="metadata"
                          >
                            Your browser does not support the audio element.
                          </audio>
                        </div>
                      </div>
                      <span className={styles.date}>
                        {new Date(recording.createdAt).toLocaleDateString()}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Unfinished Students Column */}
            <div className={styles.column}>
              <h3>Unfinished</h3>
              <ul className={styles.studentList}>
                {selectedClass && classroomStudents[selectedClass] ? (
                  classroomStudents[selectedClass]
                    .filter(student => {
                      // Check if this student has any recordings
                      const hasRecording = filteredRecordings.some(recording => {
                        const recordingStudentName = recording.name.split('-')[1].trim();
                        return recordingStudentName === student.name;
                      });
                      
                      // Return true if student has no recordings (should be in unfinished list)
                      return !hasRecording;
                    })
                    .map((student) => (
                      <li key={student.id} className={`${styles.studentItem} ${styles.darkText}`}>
                        {student.name}
                      </li>
                    ))
                ) : (
                  <li key="no-students" className={styles.studentItem}>No students found</li>
                )}
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  );
}