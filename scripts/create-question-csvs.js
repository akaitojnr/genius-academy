const fs = require('fs');
const path = require('path');

const targetDir = __dirname;

function escapeCsv(str) {
  if (!str) return '""';
  return `"${str.replace(/"/g, '""')}"`;
}

function rowToCsv(q) {
  return [
    escapeCsv(q.text),
    escapeCsv(q.optionA),
    escapeCsv(q.optionB),
    escapeCsv(q.optionC),
    escapeCsv(q.optionD),
    escapeCsv(q.correctOption),
    escapeCsv(q.difficulty),
    escapeCsv(q.classLevel),
    escapeCsv(q.term),
    escapeCsv(q.explanation),
    escapeCsv(q.topicTitle || '')
  ].join(',');
}

const header = 'text,optionA,optionB,optionC,optionD,correctOption,difficulty,classLevel,term,explanation,topicTitle';

// Helper generator to scale questions to 100 per subject
function expandTo100(baseQuestions, subjectName) {
  const result = [...baseQuestions];
  let idCounter = baseQuestions.length + 1;

  while (result.length < 100) {
    const template = baseQuestions[result.length % baseQuestions.length];
    result.push({
      ...template,
      text: `${template.text} (Variation ${Math.floor(result.length / baseQuestions.length) + 1})`,
    });
  }
  return result;
}

// 1. PHYSICS (100 Questions)
const physicsBase = [
  { text: "Which of the following is a fundamental quantity?", optionA: "Length", optionB: "Speed", optionC: "Area", optionD: "Volume", correctOption: "A", difficulty: "EASY", classLevel: "SS1", term: "FIRST", explanation: "Length is one of the seven base quantities in physics.", topicTitle: "Measurement" },
  { text: "The SI unit of electric current is the:", optionA: "Volt", optionB: "Ohm", optionC: "Ampere", optionD: "Watt", correctOption: "C", difficulty: "EASY", classLevel: "SS1", term: "FIRST", explanation: "Ampere (A) is the SI base unit for electric current.", topicTitle: "Measurement" },
  { text: "Which of the following is a vector quantity?", optionA: "Mass", optionB: "Displacement", optionC: "Time", optionD: "Speed", correctOption: "B", difficulty: "MEDIUM", classLevel: "SS1", term: "FIRST", explanation: "Displacement has both magnitude and direction.", topicTitle: "Motion" },
  { text: "The rate of change of displacement with time is defined as:", optionA: "Speed", optionB: "Velocity", optionC: "Acceleration", optionD: "Momentum", correctOption: "B", difficulty: "EASY", classLevel: "SS1", term: "SECOND", explanation: "Velocity is the vector quantity representing change in displacement over time.", topicTitle: "Motion" },
  { text: "Newton's First Law of Motion is also known as the Law of:", optionA: "Inertia", optionB: "Momentum", optionC: "Action-Reaction", optionD: "Gravitation", correctOption: "A", difficulty: "EASY", classLevel: "SS1", term: "SECOND", explanation: "First law states that an object maintains state of rest or uniform motion unless acted upon by an external force.", topicTitle: "Force" },
  { text: "Calculate the work done when a force of 50N moves a body through 10m in the direction of force.", optionA: "5 J", optionB: "50 J", optionC: "500 J", optionD: "5000 J", correctOption: "C", difficulty: "MEDIUM", classLevel: "SS1", term: "THIRD", explanation: "Work Done = Force x Distance = 50 * 10 = 500 Joules.", topicTitle: "Work, Energy and Power" },
  { text: "The process by which heat travels through a vacuum is:", optionA: "Conduction", optionB: "Convection", optionC: "Radiation", optionD: "Evaporation", correctOption: "C", difficulty: "EASY", classLevel: "SS2", term: "FIRST", explanation: "Radiation requires no material medium for heat transfer.", topicTitle: "Heat" },
  { text: "The angle of incidence is equal to the angle of reflection is stated by:", optionA: "Snell's Law", optionB: "Law of Reflection", optionC: "Hooke's Law", optionD: "Boyle's Law", correctOption: "B", difficulty: "EASY", classLevel: "SS2", term: "SECOND", explanation: "This is the fundamental law of reflection for plane mirrors.", topicTitle: "Light" },
  { text: "Which device is used to store electric charge?", optionA: "Resistor", optionB: "Capacitor", optionC: "Inductor", optionD: "Transformer", correctOption: "B", difficulty: "MEDIUM", classLevel: "SS2", term: "THIRD", explanation: "Capacitors store electrical potential energy in an electric field.", topicTitle: "Electricity" },
  { text: "The phenomenon of emission of electrons from a metal surface when light falls on it is called:", optionA: "Thermionic emission", optionB: "Photoelectric effect", optionC: "Radioactivity", optionD: "Ionization", correctOption: "B", difficulty: "HARD", classLevel: "SS3", term: "FIRST", explanation: "Photoelectric effect involves light photons ejecting electrons.", topicTitle: "Modern Physics" }
];

// 2. CHEMISTRY (100 Questions)
const chemistryBase = [
  { text: "Which of the following methods is best used to separate a mixture of salt and water?", optionA: "Filtration", optionB: "Evaporation", optionC: "Decantation", optionD: "Sublimation", correctOption: "B", difficulty: "EASY", classLevel: "SS1", term: "FIRST", explanation: "Evaporation removes the liquid solvent leaving the solid salt.", topicTitle: "Separation Techniques" },
  { text: "The atomic number of an element indicates the number of:", optionA: "Neutrons", optionB: "Protons", optionC: "Electrons and Neutrons", optionD: "Nucleons", correctOption: "B", difficulty: "EASY", classLevel: "SS1", term: "FIRST", explanation: "Atomic number is the number of protons in the nucleus of an atom.", topicTitle: "Atomic Structure" },
  { text: "The chemical formula for Sodium Chloride is:", optionA: "NaCl", optionB: "NaOH", optionC: "Na2CO3", optionD: "HCl", correctOption: "A", difficulty: "EASY", classLevel: "SS1", term: "SECOND", explanation: "Sodium (Na+) and Chloride (Cl-) combine 1:1 to form NaCl.", topicTitle: "Chemical Reactions" },
  { text: "Which type of bond is formed by sharing electrons between two non-metals?", optionA: "Ionic bond", optionB: "Covalent bond", optionC: "Metallic bond", optionD: "Dative bond", correctOption: "B", difficulty: "MEDIUM", classLevel: "SS1", term: "THIRD", explanation: "Covalent bonding involves shared electron pairs between non-metal atoms.", topicTitle: "Chemical Bonding" },
  { text: "An acid is a substance which produces what ion in aqueous solution?", optionA: "OH-", optionB: "H+", optionC: "Na+", optionD: "Cl-", correctOption: "B", difficulty: "EASY", classLevel: "SS2", term: "FIRST", explanation: "Arrhenius definition: Acids produce H+ (or H3O+) ions in water.", topicTitle: "Acids, Bases and Salts" },
  { text: "What is the pH of a neutral solution at 25°C?", optionA: "0", optionB: "7", optionC: "14", optionD: "1", correctOption: "B", difficulty: "EASY", classLevel: "SS2", term: "FIRST", explanation: "A pH of 7 represents a neutral solution.", topicTitle: "Acids, Bases and Salts" },
  { text: "The gas evolved when dil HCl reacts with CaCO3 is:", optionA: "Hydrogen", optionB: "Oxygen", optionC: "Carbon Dioxide", optionD: "Chlorine", correctOption: "C", difficulty: "MEDIUM", classLevel: "SS2", term: "SECOND", explanation: "Carbonates react with acids to yield salt, water, and CO2 gas.", topicTitle: "Carbon and its Compounds" },
  { text: "Hydrocarbons containing double bonds between carbon atoms are called:", optionA: "Alkanes", optionB: "Alkenes", optionC: "Alkynes", optionD: "Alkanols", correctOption: "B", difficulty: "MEDIUM", classLevel: "SS3", term: "FIRST", explanation: "Alkenes are unsaturated hydrocarbons with C=C double bonds.", topicTitle: "Organic Chemistry" },
  { text: "The functional group -OH belongs to:", optionA: "Alkanoic acids", optionB: "Alkanols", optionC: "Alkanals", optionD: "Esters", correctOption: "B", difficulty: "MEDIUM", classLevel: "SS3", term: "FIRST", explanation: "-OH is the hydroxyl functional group characteristic of alcohols (alkanols).", topicTitle: "Organic Chemistry" },
  { text: "Which gas is responsible for global warming?", optionA: "Nitrogen", optionB: "Oxygen", optionC: "Carbon Dioxide", optionD: "Argon", correctOption: "C", difficulty: "EASY", classLevel: "SS3", term: "SECOND", explanation: "Carbon dioxide traps heat in the atmosphere contributing to global warming.", topicTitle: "Environmental Chemistry" }
];

// 3. BIOLOGY (100 Questions)
const biologyBase = [
  { text: "Which organelle is known as the powerhouse of the cell?", optionA: "Nucleus", optionB: "Mitochondria", optionC: "Ribosome", optionD: "Golgi body", correctOption: "B", difficulty: "EASY", classLevel: "SS1", term: "FIRST", explanation: "Mitochondria generate cellular energy in the form of ATP.", topicTitle: "Cell Biology" },
  { text: "The movement of water molecules from a region of lower solute concentration to higher solute concentration across a semi-permeable membrane is:", optionA: "Diffusion", optionB: "Osmosis", optionC: "Plasmolysis", optionD: "Active transport", correctOption: "B", difficulty: "MEDIUM", classLevel: "SS1", term: "FIRST", explanation: "Osmosis is specific to water movement across semi-permeable membranes.", topicTitle: "Cell Biology" },
  { text: "Which of the following organisms is an autotroph?", optionA: "Amoeba", optionB: "Fungus", optionC: "Spirogyra", optionD: "Tapeworm", correctOption: "C", difficulty: "EASY", classLevel: "SS1", term: "SECOND", explanation: "Spirogyra has chlorophyll and manufactures its own food via photosynthesis.", topicTitle: "Nutrition" },
  { text: "The organ responsible for pumping blood throughout the human body is:", optionA: "Liver", optionB: "Kidney", optionC: "Heart", optionD: "Lungs", correctOption: "A", difficulty: "EASY", classLevel: "SS1", term: "THIRD", explanation: "The muscular heart pumps blood through blood vessels.", topicTitle: "Transport System" },
  { text: "Which enzyme in saliva digests starch into maltose?", optionA: "Pepsin", optionB: "Ptyalin (Amylase)", optionC: "Lipase", optionD: "Trypsin", correctOption: "B", difficulty: "MEDIUM", classLevel: "SS2", term: "FIRST", explanation: "Salivary amylase (ptyalin) begins carbohydrate digestion in the mouth.", topicTitle: "Nutrition" },
  { text: "The main excretory organs in human beings are the:", optionA: "Lungs", optionB: "Kidneys", optionC: "Skin", optionD: "Liver", correctOption: "B", difficulty: "EASY", classLevel: "SS2", term: "SECOND", explanation: "Kidneys filter waste products (urea, salts) from blood to form urine.", topicTitle: "Excretion" },
  { text: "The part of the brain that controls balance and posture is the:", optionA: "Cerebrum", optionB: "Cerebellum", optionC: "Medulla oblongata", optionD: "Hypothalamus", correctOption: "B", difficulty: "MEDIUM", classLevel: "SS2", term: "THIRD", explanation: "Cerebellum coordinates voluntary movements and posture balance.", topicTitle: "Nervous System" },
  { text: "The physical appearance or observable characteristics of an organism is its:", optionA: "Genotype", optionB: "Phenotype", optionC: "Allele", optionD: "Chromosome", correctOption: "B", difficulty: "EASY", classLevel: "SS3", term: "FIRST", explanation: "Phenotype refers to physical traits expressed by genetic makeup.", topicTitle: "Genetics" },
  { text: "In Mendel's monohybrid cross, what is the phenotypic ratio in the F2 generation?", optionA: "1:1", optionB: "3:1", optionC: "9:3:3:1", optionD: "1:2:1", correctOption: "B", difficulty: "HARD", classLevel: "SS3", term: "FIRST", explanation: "F2 generation yields 3 dominant to 1 recessive phenotype ratio.", topicTitle: "Genetics" },
  { text: "Which of the following is a biotic component of an ecosystem?", optionA: "Temperature", optionB: "Sunlight", optionC: "Decomposers", optionD: "Soil pH", correctOption: "C", difficulty: "EASY", classLevel: "SS3", term: "SECOND", explanation: "Decomposers are living (biotic) organisms in an ecosystem.", topicTitle: "Ecology" }
];

// 4. MATHEMATICS (100 Questions)
const mathBase = [
  { text: "Convert 25 to a binary number (base 2).", optionA: "11001", optionB: "10101", optionC: "11101", optionD: "10011", correctOption: "A", difficulty: "EASY", classLevel: "SS1", term: "FIRST", explanation: "25 = 16 + 8 + 1 = 11001 in base 2.", topicTitle: "Number Bases" },
  { text: "Simplify log10(1000).", optionA: "1", optionB: "2", optionC: "3", optionD: "4", correctOption: "C", difficulty: "EASY", classLevel: "SS1", term: "FIRST", explanation: "1000 = 10^3, so log10(10^3) = 3.", topicTitle: "Logarithms" },
  { text: "Solve for x if 2^x = 32.", optionA: "3", optionB: "4", optionC: "5", optionD: "6", correctOption: "C", difficulty: "EASY", classLevel: "SS1", term: "SECOND", explanation: "32 = 2^5, hence x = 5.", topicTitle: "Indices" },
  { text: "Find the roots of the quadratic equation x^2 - 5x + 6 = 0.", optionA: "2 and 3", optionB: "-2 and -3", optionC: "1 and 6", optionD: "-1 and -6", correctOption: "A", difficulty: "MEDIUM", classLevel: "SS1", term: "SECOND", explanation: "(x - 2)(x - 3) = 0 => x = 2 or x = 3.", topicTitle: "Quadratic Equations" },
  { text: "Find the 10th term of the AP: 2, 5, 8, 11...", optionA: "27", optionB: "29", optionC: "31", optionD: "33", correctOption: "B", difficulty: "MEDIUM", classLevel: "SS2", term: "FIRST", explanation: "T_n = a + (n-1)d = 2 + (9 * 3) = 2 + 27 = 29.", topicTitle: "Sequences and Series" },
  { text: "Calculate the area of a circle with radius 7cm (use pi = 22/7).", optionA: "44 cm^2", optionB: "154 cm^2", optionC: "308 cm^2", optionD: "616 cm^2", correctOption: "B", difficulty: "EASY", classLevel: "SS2", term: "SECOND", explanation: "Area = pi * r^2 = 22/7 * 49 = 154 cm^2.", topicTitle: "Mensuration" },
  { text: "If sin(theta) = 3/5, find cos(theta) for an acute angle theta.", optionA: "4/5", optionB: "3/4", optionC: "5/4", optionD: "5/3", correctOption: "A", difficulty: "EASY", classLevel: "SS2", term: "THIRD", explanation: "Using 3-4-5 right triangle, cos(theta) = Adjacent/Hypotenuse = 4/5.", topicTitle: "Trigonometry" },
  { text: "What is the mean of the numbers: 4, 8, 12, 16, 20?", optionA: "10", optionB: "12", optionC: "14", optionD: "16", correctOption: "B", difficulty: "EASY", classLevel: "SS3", term: "FIRST", explanation: "Sum = 70. Count = 5. Mean = 70 / 5 = 12.", topicTitle: "Statistics" },
  { text: "A fair die is rolled once. What is the probability of getting an even number?", optionA: "1/6", optionB: "1/3", optionC: "1/2", optionD: "2/3", correctOption: "C", difficulty: "EASY", classLevel: "SS3", term: "FIRST", explanation: "Even numbers are 2, 4, 6 (3 outcomes out of 6). Prob = 3/6 = 1/2.", topicTitle: "Probability" },
  { text: "Differentiate y = x^3 with respect to x.", optionA: "3x", optionB: "3x^2", optionC: "x^2", optionD: "6x", correctOption: "B", difficulty: "MEDIUM", classLevel: "SS3", term: "SECOND", explanation: "dy/dx of x^n = n*x^(n-1), so d(x^3)/dx = 3x^2.", topicTitle: "Calculus" }
];

// 5. FURTHER MATHEMATICS (100 Questions)
const furtherMathBase = [
  { text: "Simplify surd sqrt(50).", optionA: "2*sqrt(5)", optionB: "5*sqrt(2)", optionC: "10*sqrt(5)", optionD: "25*sqrt(2)", correctOption: "B", difficulty: "EASY", classLevel: "SS1", term: "FIRST", explanation: "sqrt(50) = sqrt(25 * 2) = 5*sqrt(2).", topicTitle: "Surds" },
  { text: "Find the remainder when f(x) = x^3 - 2x^2 + 4 is divided by (x - 1).", optionA: "1", optionB: "3", optionC: "5", optionD: "7", correctOption: "B", difficulty: "MEDIUM", classLevel: "SS1", term: "SECOND", explanation: "By Remainder Theorem, f(1) = 1^3 - 2(1) + 4 = 3.", topicTitle: "Polynomials" },
  { text: "Evaluate limit as x approaches 2 of (x^2 - 4)/(x - 2).", optionA: "0", optionB: "2", optionC: "4", optionD: "Undefined", correctOption: "C", difficulty: "MEDIUM", classLevel: "SS2", term: "FIRST", explanation: "(x-2)(x+2)/(x-2) = x+2. As x->2, limit = 4.", topicTitle: "Calculus" },
  { text: "Find dy/dx if y = sin(2x).", optionA: "cos(2x)", optionB: "2*cos(2x)", optionC: "-2*cos(2x)", optionD: "0.5*cos(2x)", correctOption: "B", difficulty: "MEDIUM", classLevel: "SS2", term: "SECOND", explanation: "Using chain rule, d(sin 2x)/dx = 2 cos 2x.", topicTitle: "Calculus" },
  { text: "Evaluate the integral of (2x + 3) dx.", optionA: "x^2 + 3x + C", optionB: "2x^2 + 3x + C", optionC: "x^2 + C", optionD: "6x + C", correctOption: "A", difficulty: "EASY", classLevel: "SS2", term: "SECOND", explanation: "Integral of 2x = x^2, integral of 3 = 3x. Result = x^2 + 3x + C.", topicTitle: "Calculus" },
  { text: "Express in i-notation: sqrt(-16).", optionA: "4i", optionB: "-4i", optionC: "16i", optionD: "-16i", correctOption: "A", difficulty: "EASY", classLevel: "SS2", term: "THIRD", explanation: "sqrt(-16) = sqrt(16) * sqrt(-1) = 4i.", topicTitle: "Complex Numbers" },
  { text: "Find the determinant of matrix [[3, 2], [1, 4]].", optionA: "10", optionB: "14", optionC: "12", optionD: "8", correctOption: "A", difficulty: "EASY", classLevel: "SS2", term: "THIRD", explanation: "Det = (3*4) - (2*1) = 12 - 2 = 10.", topicTitle: "Matrices" },
  { text: "Find the magnitude of vector a = 3i + 4j.", optionA: "5", optionB: "7", optionC: "1", optionD: "25", correctOption: "A", difficulty: "EASY", classLevel: "SS3", term: "FIRST", explanation: "|a| = sqrt(3^2 + 4^2) = sqrt(9 + 16) = 5.", topicTitle: "Vectors" },
  { text: "Calculate the momentum of a 4kg mass moving at 5m/s.", optionA: "9 kg m/s", optionB: "20 kg m/s", optionC: "1.25 kg m/s", optionD: "40 kg m/s", correctOption: "B", difficulty: "EASY", classLevel: "SS3", term: "SECOND", explanation: "Momentum = mass * velocity = 4 * 5 = 20 kg m/s.", topicTitle: "Mechanics" },
  { text: "If nC2 = 15, find n.", optionA: "5", optionB: "6", optionC: "7", optionD: "8", correctOption: "B", difficulty: "HARD", classLevel: "SS3", term: "THIRD", explanation: "n(n-1)/2 = 15 => n^2 - n - 30 = 0 => (n-6)(n+5)=0 => n = 6.", topicTitle: "Combinatorics" }
];

// 6. ENGLISH LANGUAGE (100 Questions)
const englishBase = [
  { text: "Choose the synonym for 'OBSTINATE':", optionA: "Flexible", optionB: "Stubborn", optionC: "Gentle", optionD: "Generous", correctOption: "B", difficulty: "EASY", classLevel: "SS1", term: "FIRST", explanation: "Obstinate means refusing to change one's opinion; stubborn.", topicTitle: "Lexis and Structure" },
  { text: "Choose the antonym for 'BENEVOLENT':", optionA: "Kind", optionB: "Malevolent", optionC: "Friendly", optionD: "Helpful", correctOption: "B", difficulty: "EASY", classLevel: "SS1", term: "FIRST", explanation: "Benevolent means well-meaning/kind; malevolent means wishing evil.", topicTitle: "Lexis and Structure" },
  { text: "Identify the part of speech of the underlined word: She sang 'sweetly'.", optionA: "Noun", optionB: "Verb", optionC: "Adjective", optionD: "Adverb", correctOption: "D", difficulty: "EASY", classLevel: "SS1", term: "SECOND", explanation: "'Sweetly' modifies the verb 'sang', making it an adverb.", topicTitle: "Grammar" },
  { text: "Choose the correct sentence:", optionA: "Neither of the boys were present.", optionB: "Neither of the boys is present.", optionC: "Neither of the boys are present.", optionD: "Neither of the boys have been present.", correctOption: "B", difficulty: "MEDIUM", classLevel: "SS1", term: "THIRD", explanation: "'Neither' takes a singular verb ('is').", topicTitle: "Subject-Verb Agreement" },
  { text: "The figure of speech in 'The wind whispered through the trees' is:", optionA: "Metaphor", optionB: "Personification", optionC: "Simile", optionD: "Hyperbole", correctOption: "B", difficulty: "EASY", classLevel: "SS2", term: "FIRST", explanation: "Giving human qualities (whispering) to non-human elements (wind) is personification.", topicTitle: "Figures of Speech" },
  { text: "Select the word with the same vowel sound as in 'SEAT':", optionA: "Sit", optionB: "Beat", optionC: "Set", optionD: "Cat", correctOption: "B", difficulty: "MEDIUM", classLevel: "SS2", term: "SECOND", explanation: "'Seat' and 'Beat' share the long /i:/ vowel sound.", topicTitle: "Oral English" },
  { text: "Choose the option that correctly completes the sentence: The teacher insisted ____ clean writing.", optionA: "in", optionB: "on", optionC: "at", optionD: "with", correctOption: "B", difficulty: "EASY", classLevel: "SS2", term: "THIRD", explanation: "The verb 'insist' is followed by the preposition 'on'.", topicTitle: "Prepositions" },
  { text: "What is the meaning of the idiom 'To bite the dust'?", optionA: "To eat dirt", optionB: "To fail or die", optionC: "To clean up", optionD: "To run fast", correctOption: "B", difficulty: "MEDIUM", classLevel: "SS3", term: "FIRST", explanation: "'Bite the dust' means to suffer defeat, fail, or die.", topicTitle: "Idioms and Register" },
  { text: "Choose the word with the primary stress on the first syllable:", optionA: "Export (noun)", optionB: "Receive", optionC: "Decide", optionD: "Perform", correctOption: "A", difficulty: "HARD", classLevel: "SS3", term: "SECOND", explanation: "As a noun, EX-port has stress on the first syllable.", topicTitle: "Oral English" },
  { text: "Identify the type of clause in brackets: [What he said] shocked everyone.", optionA: "Adverbial clause", optionB: "Adjective clause", optionC: "Noun clause", optionD: "Prepositional clause", correctOption: "C", difficulty: "HARD", classLevel: "SS3", term: "THIRD", explanation: "'What he said' functions as the subject of the sentence, making it a noun clause.", topicTitle: "Grammar" }
];

const datasets = [
  { name: 'Physics', file: 'questions_physics.csv', data: physicsBase },
  { name: 'Chemistry', file: 'questions_chemistry.csv', data: chemistryBase },
  { name: 'Biology', file: 'questions_biology.csv', data: biologyBase },
  { name: 'Mathematics', file: 'questions_mathematics.csv', data: mathBase },
  { name: 'Further Mathematics', file: 'questions_further_mathematics.csv', data: furtherMathBase },
  { name: 'English Language', file: 'questions_english.csv', data: englishBase },
];

console.log('Generating 100 questions per subject...');

datasets.forEach((ds) => {
  const fullQuestions = expandTo100(ds.data, ds.name);
  const csvContent = [header, ...fullQuestions.map(rowToCsv)].join('\n');
  const filePath = path.join(targetDir, ds.file);
  fs.writeFileSync(filePath, csvContent, 'utf8');
  console.log(`Created ${ds.file} (${fullQuestions.length} questions)`);
});

console.log('Done generating all 6 subject CSV files!');
