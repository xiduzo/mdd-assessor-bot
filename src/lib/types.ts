import { z } from "zod";

export const grades = [
  "novice",
  "competent",
  "proficient",
  "visionary",
] as const;
export type Grade = (typeof grades)[number];

export const competencies = [
  "self-directed learning",
  "framing and strategising",
  "concepting and ideation",
  "creating and crafting",
  "reflection and awareness",
] as const;
export type Competency = (typeof competencies)[number];

export const feedback = z
  .object({
    grade: z
      .string()
      .transform((val) => val.toLowerCase() as Grade)
      .refine((val) => grades.includes(val as Grade), {
        message: "Invalid enum value",
      }),
  })
  .passthrough();

export type Feedback = z.infer<typeof feedback>;

const indicatorWithGrade = z.object({
  grade: z.enum(grades).transform((val) => val.toLowerCase() as Grade),
  expectations: z.string().array(),
});

const indicator = z.object({
  name: z.string(),
  description: z.string(),
  expectations: z.string().array(),
  grades: indicatorWithGrade.array(),
  feedback: feedback.optional(),
});
export type Indicator = z.infer<typeof indicator>;

const competencyWithIndicators = z.object({
  name: z.enum(competencies),
  abbreviation: z.string(),
  description: z.string(),
  indicators: indicator.array(),
});

export type CompetencyWithIndicators = z.infer<typeof competencyWithIndicators>;

export const competenciesWithIncidactors: CompetencyWithIndicators[] = [
  {
    name: "self-directed learning",
    abbreviation: "SDL",
    description:
      "The student displays autonomy in reaching their own design goals and can identify, and act upon, ways to reach their goals in terms of acquiring the right skills and identifying expert communities.",
    indicators: [
      {
        name: "1.1 Worldview",
        description:
          "The student analyses their personal exploration of ideas, technologies, or communities of designers, demonstrating how this exploration informs their work.",
        expectations: [
          "The student can point to purposeful [design] activities they did and how they relate to their personal development.",
          "The student has a deep and systematic approach. The student shows how explorations affect their work.",
        ],
        grades: [
          {
            grade: "novice",
            expectations: [
              "The student cannot describe their exploration of ideas, technologies, or communities of designers.",
              "The student presents a minimal approach to exploring any personal development goals.",
            ],
          },
          {
            grade: "competent",
            expectations: [
              "The student mentions ideas, technologies, or communities of designers that are relevant to their work.",
              "The student presents an active, deep, or systematic approach to exploring these ideas, technologies, or communities.",
            ],
          },
          {
            grade: "proficient",
            expectations: [
              "The student mentions ideas, technologies, or communities of designers that are relevant to their work.",
              "The student presents an active, deep, or systematic approach to exploring these ideas, technologies, or communities.",
              "The student shows how these explorations have affected their work.",
            ],
          },
          {
            grade: "visionary",
            expectations: [
              "The student mentions ideas, technologies, or communities of designers that are relevant to their work.",
              "The student presents an active, deep, or systematic approach to exploring these ideas, technologies, or communities.",
              "The student shows how these explorations have affected their work.",
              "The student is proactive in connecting the MDD programme with their own interests.",
            ],
          },
        ],
      },
      {
        name: "1.2 Personal perspective",
        description:
          "The student evaluates their progress toward the learning goals they have set for themselves.",
        expectations: [
          "The students is able to analyse their  own learning methods.",
          "The student is achieving their learning goals.",
          "The student’s analysis of their own learning is comprehensive.",
          "The student has a concrete plan and direction to achieve their future goals.",
          "The student can relate their goals to a broader perspective and long-term vision.",
        ],
        grades: [
          {
            grade: "novice",
            expectations: [
              "The student cannot articulate which learning goals they pursued.",
              "The analysis of the student’s learning methods is shallow.",
              "The student expresses learning goals without argumentation or concrete plans.",
            ],
          },
          {
            grade: "competent",
            expectations: [
              "The student reflects on which learning goals they achieved and how they reached them.",
              "The student provides a comprehensive analysis of their learning methods and describe which approaches best fit their personal situation.",
              "The student expresses what they want to learn next, with a concrete plan based on past experiences.",
            ],
          },
          {
            grade: "proficient",
            expectations: [
              "The student reflects on which learning goals they achieved and how they reached them.",
              "The student provides a comprehensive analysis of their learning methods and describe which approaches best fit their personal situation.",
              "The student expresses what they want to learn next, with a concrete plan based on past experiences.",
              "The student puts their learning goals in the broader perspective of their personal or professional development and formulates long-term plans.",
            ],
          },
          {
            grade: "visionary",
            expectations: [
              "The student reflects on which learning goals they achieved and how they reached them.",
              "The student provides a comprehensive analysis of their learning methods and describe which approaches best fit their personal situation.",
              "The student expresses what they want to learn next, with a concrete plan based on past experiences.",
              "The student puts their learning goals in the broader perspective of their personal or professional development and formulates long-term plans.",
              "The student is proactive in initiating their own concrete plans.",
            ],
          },
        ],
      },
      {
        name: "1.3 Peer perspective",
        description:
          "The student assesses their individual contributions to the team and evaluates how the team’s efforts have contributed to their personal development.",
        expectations: [
          "The student is able to reflect on their own position within a team.",
          "The student can employ methods to help improve team dynamics.",
          "The student is aware of the different skills within a team and how these skills contribute to their individual learning.",
          "The student has an active approach to improve team dynamics.",
          "The student celebrates and embraces differences between individuals in a team.",
        ],
        grades: [
          {
            grade: "novice",
            expectations: [
              "The student cannot provide a description of their role and their relevance in a team.",
              "The student cannot reflect on the positive and negative aspects of their contribution to a team.",
            ],
          },
          {
            grade: "competent",
            expectations: [
              "The student describes their contribution to a team with concrete examples.",
              "The student provides a reflective critique of their contribution and identify what could be improved.",
            ],
          },
          {
            grade: "proficient",
            expectations: [
              "The student describes their contribution to a team with concrete examples.",
              "The student provides a reflective critique of their contribution and identify what could be improved.",
              "The student shows how their approach to teamwork has improved.",
            ],
          },
          {
            grade: "visionary",
            expectations: [
              "The student describes their contribution to a team with concrete examples.",
              "The student provides a reflective critique of their contribution and identify what could be improved.",
              "The student shows how their approach to teamwork has improved.",
              "The student is aware of larger team dynamics and can identify what the team should do to improve collectively in addition to what they could do individually.",
            ],
          },
        ],
      },
    ],
  },
  {
    name: "framing and strategising",
    abbreviation: "FS",
    description:
      "The student develops a set of skills in framing the design context, identifying and engaging with stakeholders, making evidencebased design decisions, and formulating comprehensive design strategies.",
    indicators: [
      {
        name: "2.1 Framing",
        description:
          "The student integrates diverse research methods to gather insights and data, allowing them to accurately frame the design context, including its constraints, opportunities, and challenges.",
        expectations: [
          "We expect to see various ways of research that help the student become informed about the subject matter and context of a project: I.e., background literature and expert information from multiple sources, stakeholders, and actors.",
          "We expect to see some research to do with the ways of working, the methodologies chosen to collect evidence to support making design-decisions.",
          "The student should be able to explain why they have chosen a particular (set of) method(s) and reflect on how useful those methods were.",
          "The student can critically apply of a variety of ways to get informed about context of project and defining a framework.",
        ],
        grades: [
          {
            grade: "novice",
            expectations: [
              "The student does not present a framework using reliable resources.",
              "The student does not select or apply adequate research methods to collect evidence.",
              "The evidence collected is unreliable, unrelated, or insufficient.",
            ],
          },
          {
            grade: "competent",
            expectations: [
              "The student presents a sensible framework using reliable resources.",
              "The student understands, selects, and applies adequate research methods to collect evidence.",
              "The student presents research activities that make sense in their context.",
            ],
          },
          {
            grade: "proficient",
            expectations: [
              "The student presents a sensible framework using reliable resources.",
              "The student understands, selects, and applies adequate and reliable research methods to collect evidence.",
              "The research activities presented relate to their context and are wellplanned, executed, and documented.",
              "The student presents results that are analysed in a comprehensive manner and are aligned with the purpose of the research.",
            ],
          },
          {
            grade: "visionary",
            expectations: [
              "The student presents a sensible framework using reliable resources.",
              "The student understands, selects, and applies adequate and reliable research methods to collect evidence.",
              "The research activities presented relate to their context and are wellplanned, executed, and documented.",
              "The student presents results that are analysed in a comprehensive manner and are aligned with the purpose of the research.",
              "The student reflects on how the research design might have led to these outcomes.",
              "The research design presented is particularly original, broad, or deep, and presents original insights.",
            ],
          },
        ],
      },
      {
        name: "2.2 Evidence",
        description:
          "The student justifies their design decisions with reliable evidence, integrating stakeholder perspectives and appropriate framing.",
        expectations: [
          "We expect students to demonstrate proficiency in applying evidencebased design, clearly distinguishing between research methods for design and research methods through design (RtD).",
          "Students should validate their design decisions, providing clear reasoning for their choices and ensuring that the outcomes of their research activities inform iterations in their design process.",
          "Additionally, students should showcase skills in collecting, analyzing, and interpreting various forms of evidence, critically evaluating and synthesizing insights from multiple sources while identifying patterns and potential biases.",
        ],
        grades: [
          {
            grade: "novice",
            expectations: [
              "The student cannot explain their design decisions through an argument based on evidence.",
              "The student presents design decisions that rely on assumptions.",
              "The evidence presented is unreliable, unrelated, or insufficient.",
            ],
          },
          {
            grade: "competent",
            expectations: [
              "The student explains design decisions through an argument based on evidence.",
              "The evidence presented is reliable, related, and from a multitude of sources.",
              "The argument presented is connected to the student’s design decisions.",
            ],
          },
          {
            grade: "proficient",
            expectations: [
              "The student explains their design decisions through various arguments based on evidence.",
              "The evidence presented is reliable, related, and includes multiple sources.",
              "The connection between the arguments presented and the student’s design decisions are convincing (i.e., decisions follow evidence).",
            ],
          },
          {
            grade: "visionary",
            expectations: [
              "The student explains their design decisions through a multitude of arguments based on evidence.",
              "The evidence presented is reliable, related, and multitude of sources.",
              "The connection between the argument presented and the student’s design decisions are convincing (i.e., decisions follow evidence), particularly insightful, and wellconnected to their context.",
              "The student presents original insights of which they are the author.",
            ],
          },
        ],
      },
    ],
  },
  {
    name: "concepting and ideation",
    abbreviation: "CI",
    description:
      "The student masters a set of tools to generate original ideas and designs.",
    indicators: [
      {
        name: "3.1 Process",
        description:
          "The student articulates the process that led to their design concept, explaining the key components, design decisions, and iterations that define it.",
        expectations: [
          "We expect to see different ways the student came up with (various) concepts.",
          "We expect to see different methods the student chose to validate their concepts and a reasoning why those methods were chosen.",
        ],
        grades: [
          {
            grade: "novice",
            expectations: [
              "The student cannot identify and explain their decisions within an iterative process to develop a design concept.",
              "The student cannot show how and why one step followed another.",
              " The student did not document their process.",
            ],
          },
          {
            grade: "competent",
            expectations: [
              "The student presents an iterative process that led to a design concept of which they are the author.",
              "The various parts of the design process are presented coherently.",
              "The student explains the most significant decisions they took.",
            ],
          },
          {
            grade: "proficient",
            expectations: [
              "The student presents an iterative process that led to a design concept of which they are the author. Other alternative concepts are also presented.",
              "The various parts of the design process are presented coherently and show exploration of the design space leading to progressive refinement of the ideas or design work.",
              "The student identifies and explains the main, as well as smaller design decisions they took.",
            ],
          },
          {
            grade: "visionary",
            expectations: [
              "The student presents an iterative process that led to a design concept of which they are the author. Other alternative concepts are also presented.",
              "The various parts of the design process are presented coherently and show exploration of the design space leading to progressive refinement of the ideas or design work.",
              "The student identifies and explains the design decisions they took.",
              "The rationale provided is particularly wellsupported and articulated, where the student can identify why one concept would be better compared to another.",
              "The student goes above and beyond what is expected and presents original insights of which they are the author.",
            ],
          },
        ],
      },
      {
        name: "3.2 Exploration",
        description:
          "The student provides a rationale for selecting a certain concept over others that they developed.",
        expectations: [
          "We expect to see different ways the student validated their concepts, and how, based on this validation, they iterated on their concept(s) / made design decisions.",
        ],
        grades: [
          {
            grade: "novice",
            expectations: [
              "The student cannot satisfyingly provide a rationale for selecting a specific concept.",
            ],
          },
          {
            grade: "competent",
            expectations: [
              "The student provides a rationale for selecting a specific concept based on validation.",
            ],
          },
          {
            grade: "proficient",
            expectations: [
              "The student provides a rationale for selecting a specific concept based on evidence they have collected through tests or hands-on explorations that are reliable.",
              "The discarded concepts are also well presented, and the student can make an argument for their choice based on a variety of evidence.",
            ],
          },
          {
            grade: "visionary",
            expectations: [
              "The student provides a rationale for selecting a specific concept based on evidence they have collected through tests or hands-on explorations that are reliable.",
              "The discarded concepts are also well presented, and the student can make an argument for their choice based on a multitude of evidence.",
              "The student can reflect critically on their choices and methods of validation and has applied improvements based on evidence.",
            ],
          },
        ],
      },
      {
        name: "3.3 Evolution",
        description:
          "The student presents how their design process has evolved over time.",
        expectations: [
          "We expect to see a reflection on what progress the student has made in working with evidence-based design.",
          "We expect to see the student try different methods and reflect on their usefulness.",
          "We expect to see the student develop their own methods or insight in ways of validating design decisions.",
        ],
        grades: [
          {
            grade: "novice",
            expectations: [
              "The student cannot show progress in their approach to a design challenge.",
            ],
          },
          {
            grade: "competent",
            expectations: [
              "The student can point at differences in how they approached design challenges in the past, and at the current point of their career.",
              "The student reflects on the differences between the various processes that they experimented with and identifies positive and negative points.",
            ],
          },
          {
            grade: "proficient",
            expectations: [
              "The student can point at differences in how they approached design challenges in the past, and at the current point of their career.",
              "The student reflects on the differences between the various processes that they experimented with and identifies positive and negative points.",
              "The student explains how they would like to develop and apply their process in the future and outlines a concrete plan to do so.",
            ],
          },
          {
            grade: "visionary",
            expectations: [
              "The student can point at differences in how they approached design challenges in the past, and at the current point of their career.",
              "The student reflects on the differences between the various processes that they experimented with and identifies positive and negative points.",
              "The student applies their own process based on experience and can critically assess the success of their process.",
            ],
          },
        ],
      },
    ],
  },
  {
    name: "creating and crafting",
    abbreviation: "CC",
    description: "The student shows skills to produce their designs.",
    indicators: [
      {
        name: "4.1 Technical choices",
        description:
          "The student demonstrates their use of digital media and justifies the technical choices made in the execution of their work.",
        expectations: [
          "We expect to see argumentation for the choice of media used, based on the context of the project.",
        ],
        grades: [
          {
            grade: "novice",
            expectations: [
              "Digital media: The student provides only superficial reasoning for the choice of digital media (e.g., they are unaware of alternatives, or rely on default choices).",
              "Technical choices: The student presents no clear evidence to support their technical choices made in the execution of their work.",
              "Prototyping: The student shows no adaptability towards a specific medium or technology.",
            ],
          },
          {
            grade: "competent",
            expectations: [
              "Digital media: The student argues their choice(s) of digital media based on research and hands-on experience.",
              "Technical choices: The student shows the technical choices that they made in the execution of their work.",
              "Other choices: The student points to other choices they could have made for the execution of their work and can explain why the choices they made are justified.",
              "Prototyping: The student gives insight into how their prototyping activities have adapted to the medium and technology used.",
            ],
          },
          {
            grade: "proficient",
            expectations: [
              "Digital media: The student argues their choice(s) of digital media based on research and hands-on experience. They reflect on how this choice(s) affects the overall design.",
              "Technical choices: They reflect on the technical choices that they made for the execution of their work, and how this influenced their design.",
              "Other choices: The student is well aware of other choices they could have made for the execution of their work, and can argue in favour of their choices through examples, experiments or research.",
              "Prototyping: The student gives insight into how their prototyping activities have adapted to the medium and technology used.",
            ],
          },
          {
            grade: "visionary",
            expectations: [
              "Digital media: The student argues their choice(s) of digital media based on research and hands-on experience. Their arguments are well-constructed and offer a nuanced perspective on how their choice(s) affects the overall design.",
              "Technical choices: The student reflects on the technical choices that they made for the execution of their work, and how this influenced their design and implementation.",
              "Other choices: The student is well aware of other choices they could have made and can argue in favour of their choices through examples, experiments or research.",
              "Prototyping: The student shows adaptability to different digital media and technologies. They reflect on how their designs have improved through these activities.",
            ],
          },
        ],
      },
      {
        name: "4.2 Making",
        description:
          "The student articulates and demonstrates the impact of handson making in shaping their design process.",
        expectations: [
          "We expect to see different levels of prototyping “getting hands dirty”.",
        ],
        grades: [
          {
            grade: "novice",
            expectations: [
              "The student presents a haphazard approach to making.",
              "The student cannot articulate any specific design insights derived from their making.",
            ],
          },
          {
            grade: "competent",
            expectations: [
              "The student can point at relevant making and prototyping activities and reflects on how these influenced their overall design process.",
            ],
          },
          {
            grade: "proficient",
            expectations: [
              "The student demonstrates their making skills by pointing at the results they obtained and shows how the process of executing their work influenced their overall design process.",
              "The student presents satisfactory evidence of progressive refinement in their design process.",
            ],
          },
          {
            grade: "visionary",
            expectations: [
              "The student demonstrates their making skills by pointing at the results they obtained and shows how the process of executing their work influenced their overall design process.",
              "They present outstanding evidence of progressive refinement in their design process.",
              "The student presents how this progressive refinement leads to significant improvements in their overall design.",
            ],
          },
        ],
      },
    ],
  },
  {
    name: "reflection and awareness",
    abbreviation: "RA",
    description:
      "The student understands the context of their work. They can take a meta view of the situation their work operates in and understand the implications of their design on people and planet in that context over time.",
    indicators: [
      {
        name: "5.1 Conventions & critique",
        description:
          "The student reflectively critiques design artifacts by comparing it to their own work, while applying relevant aesthetic, technical, or design conventions in their analysis and their design.",
        expectations: [
          "We expect students to demonstrate an awareness of existing conventions and standards, applying them thoughtfully to their work. As they progress, they should be able to select specific conventions based on the design context to maximize their design potential.",
          "Additionally, we expect students to compare their design with another similar design within a similar context, using comparable design patterns and visual language, or provide a convincing rationale for any deviations from this approach.",
        ],
        grades: [
          {
            grade: "novice",
            expectations: [
              "The student shows limited awareness of how other designers have addressed similar challenges or which conventions are used in certain cases.",
              "The student struggles to critically read a design artifact, often discussing only trivial similarities or differences when comparing two designs.",
              "The student is unable to suggest meaningful improvements to their own design.",
            ],
          },
          {
            grade: "competent",
            expectations: [
              "The student demonstrates awareness of similar designs and related conventions by pointing to specific elements in their work.",
              "They explain convincingly why these conventions are relevant.",
              "The student reflects on their design, identifying strengths, weaknesses, and key design decisions.",
              "They compare their design to another comparable design, discussing forms, functions, and some broader implications. This reflection could serve as a concrete starting point for another iteration of their design.",
            ],
          },
          {
            grade: "proficient",
            expectations: [
              "The student clearly shows awareness of similar designs and related conventions across multiple areas (technology, design, aesthetics) by pointing to specific elements in their work.",
              "They explain convincingly why these conventions are relevant.",
              "The student provides a thoughtful critique of their design, identifying strong and weak points, and suggesting a clear direction for further iteration.",
              "They compare their design to another, reflecting on broader implications and supporting their opinion as a designer through this comparison.",
            ],
          },
          {
            grade: "visionary",
            expectations: [
              "The student demonstrates a deep awareness of similar designs and related conventions across multiple areas (technology, design, aesthetics), effectively justifying when they choose to break away from these conventions.",
              "Their critique of their design is insightful, identifying strong and weak points and offering a clear direction for further development.",
              "They compare their design with another, providing nuanced insights and reflecting on broader implications.",
              "The student’s original insights go beyond expectations, offering a unique perspective that enriches the critique and the design process.",
            ],
          },
        ],
      },
      {
        name: "5.2 Context",
        description:
          "The student contextualizes their work within a broader framework, articulating a personal ethical perspective on design and linking it to their design decisions.",
        expectations: [
          "We expect the student to show their understanding of the context of their work by critically reflecting on their approach (situatedness, scientific approach, ethnography, etc.).",
        ],
        grades: [
          {
            grade: "novice",
            expectations: [
              "The student provides no clarity in their approach towards understanding the context.",
              "The student cannot relate their work in its context.",
              "The student cannot reflect on the relation between their work and its context.",
              "The student cannot relate their work to other work in similar contexts.",
            ],
          },
          {
            grade: "competent",
            expectations: [
              "The student reflects on their approach towards understanding the context of their work.",
              " The student relates their design(s) to its context.",
              "The student reflects critically on the relation between their work and its context.",
            ],
          },
          {
            grade: "proficient",
            expectations: [
              "The student shows a well-argumented approach towards understanding the context of their work.",
              "The student relates their design(s) to its context.",
              "The student reflects critically on the relation between their work and its context.",
              "The student relates their design to other designs in similar contexts to argument their design decisions.",
            ],
          },
          {
            grade: "visionary",
            expectations: [
              "The student shows a well-argumented approach towards understanding the context of their work.",
              "The student relates their design(s) to its context.",
              "The student reflects critically on the relation between their work and its context, and they express nuanced opinions.",
              "The student relates their design to other designs in similar contexts to argument their design decisions.",
              "The student goes above and beyond what is expected and presents original insights of which they are the author.",
            ],
          },
        ],
      },
      {
        name: "5.3 Ethics",
        description:
          "The student articulates a personal ethical view on design and integrates it into their work.",
        expectations: [
          "We expect to see the student reflect on the ethical context of their design project (the client, stakeholders, long-term impact).",
          "The student shows an understanding of their role, responsibility, and influence as a designer in making ethical choices.",
          "During the programme we expect the student to develop a personal ethical code and to be able to argue their views.",
        ],
        grades: [
          {
            grade: "novice",
            expectations: [
              "The student cannot connect their design work to ethical considerations.",
            ],
          },
          {
            grade: "competent",
            expectations: [
              "The student expresses a personal ethical view on the design process and final design outcomes.",
              "The student connects their ethical view to specific positive or negative examples from other designers’ works.",
              "The student reflects on their own work from an ethical perspective and suggests improvements.",
            ],
          },
          {
            grade: "proficient",
            expectations: [
              "The student expresses a personal ethical view on the design process and final design outcomes.",
              "The student connects their ethical view to specific positive or negative examples from other designers’ works.",
              "The student reflects on their own work from a variety of ethical perspectives.",
              "The student points at some of their work or decisions taken in their process to exemplify their ethical views.",
            ],
          },
          {
            grade: "visionary",
            expectations: [
              "The student expresses a personal ethical view on the design process and final design outcomes.",
              "The student connects their ethical view to specific positive or negative examples from other designers’ works.",
              "The analysis presented is deep and nuanced.",
              "The student reflects on their own work from a variety of ethical perspectives.",
              "The student’s work exemplifies their ethical views.",
              "The student goes above and beyond what is expected and presents original insights of which they are the author.",
            ],
          },
        ],
      },
    ],
  },
];
