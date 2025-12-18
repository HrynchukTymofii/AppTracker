// Global tour steps configuration
export const TOUR_STEPS = {
  // Index/Explore page (Tour intro)
  TOUR_INTRO: 0,

  // Bottom navbar - Tests tab
  TESTS_TAB: 1,

  // Bottom navbar - Course tab
  COURSE_TAB: 2,

  // Course page
  CHOOSE_TOPIC: 3,
  LESSONS_SECTION: 4,
  ENTER_QUIZ: 5,
};

export const TOTAL_TOUR_STEPS = 6;

export const getTourStepInfo = (step: number) => {
  const steps = {
    [TOUR_STEPS.TOUR_INTRO]: {
      title: "Welcome to SAT Prep! 🎉",
      content: "Do you want to take a quick tour of the app? We'll show you the main features and how to get started!",
      page: "index",
    },
    [TOUR_STEPS.TESTS_TAB]: {
      title: "Tests 📝",
      content: "Here you can take practice exams and view your saved and wrong tasks to review them later!",
      page: "tests",
    },
    [TOUR_STEPS.COURSE_TAB]: {
      title: "Course 📚",
      content: "This is the main part of our app! Here you'll find all the lessons and problem practicing to master SAT Math.",
      page: "course",
    },
    [TOUR_STEPS.CHOOSE_TOPIC]: {
      title: "Choose a Topic 📋",
      content: "Select any topic from the list to start learning. Each topic contains lessons and practice problems!",
      page: "course",
    },
    [TOUR_STEPS.LESSONS_SECTION]: {
      title: "Lessons 📖",
      content: "First, explore the lesson to recap your knowledge and learn new concepts!",
      page: "course",
    },
    [TOUR_STEPS.ENTER_QUIZ]: {
      title: "Take a Quiz ✏️",
      content: "Then try a quiz! Tap on any quiz to start practicing what you've learned.",
      page: "course",
    },
  };

  return steps[step] || null;
};
