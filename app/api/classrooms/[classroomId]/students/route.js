import { NextResponse } from 'next/server';
import { classroomStudents } from '@/app/data/students';

export async function GET(request, { params }) {
  try {
    const { classroomId } = params;

    // Check if the classroom exists
    if (!classroomStudents[classroomId]) {
      return NextResponse.json(
        { error: `Classroom ${classroomId} not found` },
        { status: 404 }
      );
    }

    // Get students for the specific classroom
    const students = classroomStudents[classroomId];

    // Fetch recordings from Nextcloud (you might want to add this later)
    // For now, we'll just return the students without recording status
    const studentsWithRecordingStatus = students.map(student => ({
      ...student,
      hasRecording: false // This can be updated later to check against actual recordings
    }));

    return NextResponse.json({ students: studentsWithRecordingStatus });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch students' },
      { status: 500 }
    );
  }
} 