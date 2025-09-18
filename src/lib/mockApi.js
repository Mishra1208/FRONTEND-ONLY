const MOCK = [
  { course_id: "COMP-352", subject: "COMP", catalogue: "352", title: "Data Structures and Algorithms", credits: 3, term: "Fall", session: "Lecture" },
  { course_id: "COMP-228", subject: "COMP", catalogue: "228", title: "System Hardware", credits: 3, term: "Fall", session: "Lecture" },
  { course_id: "SOEN-228", subject: "SOEN", catalogue: "228", title: "System Hardware (SOEN)", credits: 3, term: "Winter", session: "Lecture" },
  { course_id: "COMP-248", subject: "COMP", catalogue: "248", title: "Object-Oriented Programming I", credits: 3, term: "Fall", session: "Lecture" },
  { course_id: "COMP-249", subject: "COMP", catalogue: "249", title: "Object-Oriented Programming II", credits: 3, term: "Winter", session: "Lecture" },
  { course_id: "SOEN-287", subject: "SOEN", catalogue: "287", title: "Web Programming", credits: 3, term: "Fall", session: "Lecture" },
];

export async function fetchPopularCourses() {
  return MOCK.slice(0, 6);
}

export async function fetchCourses({ search = "", subject = "ALL", term = "ALL", minCredits = 0, maxCredits = 6 }) {
  const s = search.trim().toLowerCase();
  return MOCK.filter(c => {
    const text = `${c.subject} ${c.catalogue} ${c.title}`.toLowerCase();
    const matchSearch = s ? text.includes(s) : true;
    const matchSubject = subject === "ALL" ? true : c.subject === subject;
    const matchTerm = term === "ALL" ? true : (c.term?.toLowerCase() === term.toLowerCase());
    const cr = Number(c.credits ?? 0);
    const matchCredits = cr >= minCredits && cr <= maxCredits;
    return matchSearch && matchSubject && matchTerm && matchCredits;
  });
}
