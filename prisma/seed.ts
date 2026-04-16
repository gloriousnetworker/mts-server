import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const DEFAULT_PASSWORD = 'Password1';

async function main() {
  console.log('Seeding database...');
  const hash = await bcrypt.hash(DEFAULT_PASSWORD, 12);

  // ─── Admin ───────────────────────────────────────────────────
  const admin = await prisma.user.upsert({
    where: { email: 'admin@megatech.com' },
    update: {},
    create: {
      name: 'HRM Iniubong Udofot',
      email: 'admin@megatech.com',
      passwordHash: hash,
      role: 'admin',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop',
    },
  });
  console.log('  Admin:', admin.email);

  // ─── Staff ───────────────────────────────────────────────────
  const staffData = [
    { name: 'Dr. Chukwuemeka Okonkwo', email: 'c.okonkwo@megatech.com', position: 'Senior Full Stack Instructor & Head of Web Development', bio: 'Dr. Chukwuemeka has over 15 years of experience in web development and has taught thousands of students.', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop', skills: ['React', 'Node.js', 'MongoDB', 'JavaScript', 'TypeScript', 'Docker', 'AWS'], social: { linkedin: 'https://linkedin.com/in/chukwuemeka-okonkwo', twitter: 'https://twitter.com/chukwuemeka_dev', github: 'https://github.com/chukwuemeka-okonkwo' } },
    { name: 'Dr. Aisha Babangida', email: 'a.babangida@megatech.com', position: 'Data Science Lead & AI Research Director', bio: 'Dr. Aisha specializes in machine learning and has published over 30 research papers.', photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop', skills: ['Python', 'TensorFlow', 'PyTorch', 'Machine Learning', 'Deep Learning', 'Data Analysis', 'R'], social: { linkedin: 'https://linkedin.com/in/aisha-babangida', github: 'https://github.com/aisha-babangida' } },
    { name: 'Oluwaseun Adebayo', email: 'o.adebayo@megatech.com', position: 'Mobile Development Expert & iOS Specialist', bio: 'Oluwaseun has built over 80 mobile applications for clients worldwide.', photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop', skills: ['React Native', 'iOS', 'Swift', 'Android', 'Flutter', 'Kotlin', 'Firebase'], social: { linkedin: 'https://linkedin.com/in/oluwaseun-adebayo', twitter: 'https://twitter.com/seun_mobile', github: 'https://github.com/oluwaseun-adebayo' } },
    { name: 'Ngozi Eze', email: 'n.eze@megatech.com', position: 'UI/UX Design Director & Product Designer', bio: 'Ngozi is passionate about creating beautiful, user-friendly designs.', photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop', skills: ['Figma', 'Adobe XD', 'Sketch', 'User Research', 'Prototyping', 'Design Systems', 'UI/UX'], social: { linkedin: 'https://linkedin.com/in/ngozi-eze', twitter: 'https://twitter.com/ngozi_designs' } },
    { name: 'Ibrahim Musa', email: 'i.musa@megatech.com', position: 'Cybersecurity Specialist & Ethical Hacker', bio: 'Ibrahim has 15+ years in cybersecurity and ethical hacking.', photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop', skills: ['Penetration Testing', 'Network Security', 'Cryptography', 'Ethical Hacking', 'Security Auditing', 'Kali Linux'], social: { linkedin: 'https://linkedin.com/in/ibrahim-musa', github: 'https://github.com/ibrahim-musa' } },
    { name: 'Funmilayo Ogunleye', email: 'f.ogunleye@megatech.com', position: 'Digital Marketing Strategist & SEO Expert', bio: 'Funmilayo helps businesses grow their online presence with proven strategies.', photo: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=400&fit=crop', skills: ['SEO', 'SEM', 'Social Media Marketing', 'Google Ads', 'Content Marketing', 'Email Marketing', 'Analytics'], social: { linkedin: 'https://linkedin.com/in/funmilayo-ogunleye', twitter: 'https://twitter.com/funmi_marketing' } },
    { name: 'Chidinma Nwosu', email: 'c.nwosu@megatech.com', position: 'Cloud Computing & DevOps Engineer', bio: 'Chidinma specializes in cloud infrastructure and DevOps practices.', photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop', skills: ['AWS', 'Azure', 'Docker', 'Kubernetes', 'CI/CD', 'Terraform', 'Jenkins', 'DevOps'], social: { linkedin: 'https://linkedin.com/in/chidinma-nwosu', github: 'https://github.com/chidinma-nwosu' } },
    { name: 'Yusuf Abdullahi', email: 'y.abdullahi@megatech.com', position: 'Blockchain Developer & Smart Contract Specialist', bio: 'Yusuf is a pioneer in blockchain technology with expertise in Ethereum and DeFi.', photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop', skills: ['Solidity', 'Ethereum', 'Web3.js', 'Smart Contracts', 'Blockchain', 'DeFi', 'NFTs'], social: { linkedin: 'https://linkedin.com/in/yusuf-abdullahi', github: 'https://github.com/yusuf-abdullahi', twitter: 'https://twitter.com/yusuf_blockchain' } },
    { name: 'Blessing Okoro', email: 'b.okoro@megatech.com', position: 'Database Administrator & Backend Architect', bio: 'Blessing has extensive experience in database design and backend architecture.', photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop', skills: ['PostgreSQL', 'MySQL', 'MongoDB', 'SQL', 'Database Design', 'Redis', 'Performance Tuning'], social: { linkedin: 'https://linkedin.com/in/blessing-okoro', github: 'https://github.com/blessing-okoro' } },
    { name: 'Emeka Okafor', email: 'e.okafor@megatech.com', position: 'Game Development & Unity Instructor', bio: 'Emeka is a passionate game developer with 10+ years of experience.', photo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop', skills: ['Unity', 'C#', 'Game Design', 'Unreal Engine', '3D Modeling', 'Animation', 'VR/AR'], social: { linkedin: 'https://linkedin.com/in/emeka-okafor', twitter: 'https://twitter.com/emeka_gamedev', github: 'https://github.com/emeka-okafor' } },
  ];

  const staffUsers = [];
  for (const s of staffData) {
    const user = await prisma.user.upsert({
      where: { email: s.email },
      update: {},
      create: {
        name: s.name,
        email: s.email,
        passwordHash: hash,
        role: 'staff',
        staffProfile: {
          create: {
            position: s.position,
            bio: s.bio,
            photo: s.photo,
            skills: s.skills,
            social: s.social,
          },
        },
      },
    });
    staffUsers.push(user);
  }
  console.log(`  Staff: ${staffUsers.length} members`);

  // ─── Students ────────────────────────────────────────────────
  const student1 = await prisma.user.upsert({
    where: { email: 'alex.johnson@student.com' },
    update: {},
    create: { name: 'Alex Johnson', email: 'alex.johnson@student.com', passwordHash: hash, role: 'student', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop' },
  });
  const student2 = await prisma.user.upsert({
    where: { email: 'sarah.williams@student.com' },
    update: {},
    create: { name: 'Sarah Williams', email: 'sarah.williams@student.com', passwordHash: hash, role: 'student' },
  });
  const student3 = await prisma.user.upsert({
    where: { email: 'michael.chen@student.com' },
    update: {},
    create: { name: 'Michael Chen', email: 'michael.chen@student.com', passwordHash: hash, role: 'student' },
  });
  console.log('  Students: 3');

  // ─── Courses ─────────────────────────────────────────────────
  const coursesData = [
    { title: 'Full Stack Web Development', description: 'Master modern web development with React, Node.js, and MongoDB', price: 100000, category: 'Web Development', level: 'Intermediate' as const, duration: '12 weeks', image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=600&fit=crop', curriculum: ['HTML, CSS & JavaScript Fundamentals', 'React.js & Modern Frontend', 'Node.js & Express Backend', 'Database Design with MongoDB', 'Authentication & Security', 'Deployment & DevOps'], requirements: ['Basic programming knowledge', 'Computer with internet connection', 'Passion for learning'], learningOutcomes: ['Build complete web applications', 'Master React and Node.js', 'Deploy to production', 'Work with databases'], enrolledStudents: 234, rating: 4.8, isFeatured: true, staffIdx: 0 },
    { title: 'Data Science & Machine Learning', description: 'Learn Python, data analysis, and machine learning algorithms', price: 150000, category: 'Data Science', level: 'Advanced' as const, duration: '16 weeks', image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop', curriculum: ['Python Programming', 'Data Analysis with Pandas', 'Machine Learning Algorithms', 'Deep Learning with TensorFlow', 'Real-world Projects'], requirements: ['Strong mathematical background', 'Python basics', 'Statistical knowledge'], learningOutcomes: ['Build ML models', 'Analyze complex datasets', 'Deploy AI solutions'], enrolledStudents: 189, rating: 4.9, isFeatured: true, staffIdx: 1 },
    { title: 'Mobile App Development with React Native', description: 'Build cross-platform mobile apps for iOS and Android', price: 120000, category: 'Mobile Development', level: 'Intermediate' as const, duration: '10 weeks', image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&h=600&fit=crop', curriculum: ['React Native Basics', 'Navigation & State Management', 'Native Modules', 'App Deployment'], requirements: ['JavaScript knowledge', 'React basics'], learningOutcomes: ['Build mobile apps', 'Publish to app stores', 'Integrate native features'], enrolledStudents: 156, rating: 4.7, isFeatured: true, staffIdx: 2 },
    { title: 'UI/UX Design Masterclass', description: 'Master design principles and create stunning user experiences', price: 100000, category: 'Design', level: 'Beginner' as const, duration: '8 weeks', image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=600&fit=crop', curriculum: ['Design Principles', 'Figma & Design Tools', 'User Research', 'Prototyping', 'Portfolio Building'], requirements: ['Creative mindset', 'No prior experience needed'], learningOutcomes: ['Create beautiful designs', 'Build a portfolio', 'Land design jobs'], enrolledStudents: 312, rating: 4.9, isFeatured: false, staffIdx: 3 },
    { title: 'Cybersecurity Fundamentals', description: 'Learn to protect systems and networks from cyber threats', price: 130000, category: 'Security', level: 'Intermediate' as const, duration: '12 weeks', image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&h=600&fit=crop', curriculum: ['Network Security', 'Ethical Hacking', 'Cryptography', 'Security Tools', 'Incident Response'], requirements: ['Basic networking knowledge', 'Linux basics'], learningOutcomes: ['Secure networks', 'Perform security audits', 'Respond to threats'], enrolledStudents: 145, rating: 4.8, isFeatured: false, staffIdx: 4 },
    { title: 'Digital Marketing Mastery', description: 'Master SEO, social media, and online advertising', price: 100000, category: 'Marketing', level: 'Beginner' as const, duration: '6 weeks', image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop', curriculum: ['SEO Fundamentals', 'Social Media Marketing', 'Google Ads', 'Content Strategy', 'Analytics & Metrics'], requirements: ['No prior experience needed'], learningOutcomes: ['Run marketing campaigns', 'Grow online presence', 'Measure ROI'], enrolledStudents: 278, rating: 4.6, isFeatured: false, staffIdx: 5 },
    { title: 'Graphic Design', description: 'Learn professional graphic design with Adobe Creative Suite', price: 100000, category: 'Design', level: 'Beginner' as const, duration: '8 weeks', image: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=800&h=600&fit=crop', curriculum: ['Design Fundamentals', 'Adobe Photoshop', 'Adobe Illustrator', 'Typography', 'Branding & Identity', 'Portfolio Development'], requirements: ['Creative mindset', 'No prior experience needed'], learningOutcomes: ['Create professional designs', 'Master Adobe tools', 'Build a design portfolio', 'Work with clients'], enrolledStudents: 198, rating: 4.7, isFeatured: false, staffIdx: 6 },
  ];

  const courses = [];
  for (const c of coursesData) {
    const { staffIdx, ...courseData } = c;
    const course = await prisma.course.create({
      data: { ...courseData, instructorId: staffUsers[staffIdx].id },
    });
    courses.push(course);
  }
  console.log(`  Courses: ${courses.length}`);

  // ─── Enrollments ─────────────────────────────────────────────
  const enrollmentsData = [
    { student: student1, courseIdx: 0, progress: 85, status: 'active' as const, date: '2025-09-01' },
    { student: student1, courseIdx: 3, progress: 100, status: 'completed' as const, date: '2025-10-15' },
    { student: student1, courseIdx: 1, progress: 45, status: 'active' as const, date: '2026-01-10' },
    { student: student2, courseIdx: 0, progress: 60, status: 'active' as const, date: '2025-11-01' },
    { student: student3, courseIdx: 4, progress: 30, status: 'active' as const, date: '2026-02-01' },
  ];

  for (const e of enrollmentsData) {
    await prisma.enrollment.create({
      data: {
        studentId: e.student.id,
        courseId: courses[e.courseIdx].id,
        progress: e.progress,
        status: e.status,
        enrolledDate: new Date(e.date),
      },
    });
  }
  console.log(`  Enrollments: ${enrollmentsData.length}`);

  // ─── Assignments ─────────────────────────────────────────────
  await prisma.assignment.createMany({
    data: [
      { studentId: student1.id, courseId: courses[0].id, title: 'Build a React Todo App', description: 'Create a fully functional todo application using React hooks', dueDate: new Date('2026-03-01'), status: 'submitted', grade: 92, submittedDate: new Date('2026-02-28') },
      { studentId: student1.id, courseId: courses[0].id, title: 'Node.js REST API Project', description: 'Build a RESTful API with authentication', dueDate: new Date('2026-03-15'), status: 'pending' },
      { studentId: student1.id, courseId: courses[1].id, title: 'Data Analysis Project', description: 'Analyze a dataset and create visualizations', dueDate: new Date('2026-03-10'), status: 'pending' },
    ],
  });
  console.log('  Assignments: 3');

  // ─── Certificates ────────────────────────────────────────────
  await prisma.certificate.createMany({
    data: [
      { studentId: student1.id, studentName: student1.name, courseId: courses[0].id, courseName: courses[0].title, issueDate: new Date('2025-12-15'), certificateNumber: 'MT-2025-001234', status: 'valid' },
      { studentId: student1.id, studentName: student1.name, courseId: courses[3].id, courseName: courses[3].title, issueDate: new Date('2025-11-20'), certificateNumber: 'MT-2025-001156', status: 'valid' },
    ],
  });
  console.log('  Certificates: 2');

  // ─── Payments ────────────────────────────────────────────────
  await prisma.payment.createMany({
    data: [
      { studentId: student1.id, courseId: courses[0].id, amount: 100000, date: new Date('2025-09-01'), status: 'confirmed', method: 'Bank Transfer' },
      { studentId: student1.id, courseId: courses[3].id, amount: 100000, date: new Date('2025-10-15'), status: 'confirmed', method: 'Card' },
      { studentId: student2.id, courseId: courses[0].id, amount: 100000, date: new Date('2025-11-01'), status: 'confirmed', method: 'Bank Transfer' },
    ],
  });
  console.log('  Payments: 3');

  // ─── Blog Posts ──────────────────────────────────────────────
  await prisma.blogPost.createMany({
    data: [
      { title: 'The Future of AI in Education', excerpt: 'Discover how artificial intelligence is transforming the learning experience.', content: 'Artificial intelligence is revolutionizing education in unprecedented ways. From personalized learning paths to automated grading systems, AI is making education more accessible and effective than ever before. At MegaTech Solutions, we are at the forefront of integrating AI into our curriculum to prepare students for the future of technology.', author: 'Dr. Aisha Babangida', date: new Date('2026-02-20'), category: 'Tech Updates', image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=600&fit=crop', tags: ['AI', 'Education', 'Technology'] },
      { title: 'New Web Development Bootcamp Starting March', excerpt: 'Join our intensive 12-week program and become a professional developer.', content: 'We are excited to announce our new Full Stack Web Development Bootcamp starting in March 2026. This intensive 12-week program covers everything from HTML and CSS fundamentals to advanced React and Node.js development. Graduates will be fully equipped to build production-ready web applications.', author: 'Dr. Chukwuemeka Okonkwo', date: new Date('2026-02-18'), category: 'Announcements', image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=600&fit=crop', tags: ['Bootcamp', 'Web Development', 'Announcement'] },
      { title: '10 Tips for Aspiring Data Scientists', excerpt: 'Expert advice to kickstart your data science career.', content: 'Breaking into data science can seem daunting, but with the right approach, anyone can succeed. Here are our top 10 tips: 1) Master Python and SQL fundamentals, 2) Build a strong statistics foundation, 3) Work on real-world projects, 4) Contribute to open source, 5) Network with the community, 6) Stay current with research papers, 7) Practice with Kaggle competitions, 8) Learn data visualization, 9) Understand business context, 10) Never stop learning.', author: 'Dr. Aisha Babangida', date: new Date('2026-02-15'), category: 'Articles', image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop', tags: ['Data Science', 'Career', 'Tips'] },
    ],
  });
  console.log('  Blog Posts: 3');

  // ─── Gallery Items ───────────────────────────────────────────
  await prisma.galleryItem.createMany({
    data: [
      { title: 'Entrance into MegaTech HQ', category: 'workshops', type: 'image', url: '/assets/entrance.jpeg', date: new Date('2026-07-04') },
      { title: 'Front-Desk', category: 'trainings', type: 'image', url: '/assets/frontdesk.jpeg', date: new Date('2026-07-04') },
      { title: 'Management Office', category: 'conferences', type: 'image', url: '/assets/mng-office.jpeg', date: new Date('2026-07-04') },
      { title: 'Computer Room', category: 'trainings', type: 'image', url: '/assets/cmp-room.jpeg', date: new Date('2026-07-04') },
      { title: 'Conference Room', category: 'conferences', type: 'image', url: '/assets/con-room.jpeg', date: new Date('2026-07-04') },
    ],
  });
  console.log('  Gallery Items: 5');

  console.log('\nSeed complete! Default password for all users: Password1');
  console.log('Admin: admin@megatech.com');
  console.log('Staff: c.okonkwo@megatech.com, a.babangida@megatech.com, ...');
  console.log('Students: alex.johnson@student.com, sarah.williams@student.com, michael.chen@student.com');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
