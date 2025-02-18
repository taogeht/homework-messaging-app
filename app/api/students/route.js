import { NextResponse } from 'next/server';
import { classroomStudents } from '../../data/students';

export async function GET() {
  try {
    // Flatten all classes into a single array of students
    const allStudents = Object.values(classroomStudents).flat();
    
    return NextResponse.json(allStudents);
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
  }
} 