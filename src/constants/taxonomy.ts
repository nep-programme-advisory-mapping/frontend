import type { Category } from '../types/taxonomy';

export const mockTaxonomies: Category[] = [
  {
    id: 1,
    name: "Education & Training",
    subCategories: [
      {
        id: 11,
        name: "Teacher Development",
        items: [
          { id: 111, name: "Pedagogy Workshop", is_active: true },
          { id: 112, name: "Curriculum Design", is_active: true },
          { id: 113, name: "Classroom Management", is_active: true },
          { id: 114, name: "Old Teaching Methods", is_active: false },
        ]
      },
      {
        id: 12,
        name: "Digital Literacy",
        items: [
          { id: 121, name: "Basic Computer Skills", is_active: true },
          { id: 122, name: "Internet Safety", is_active: true },
          { id: 123, name: "Software Development", is_active: true },
          { id: 124, name: "Outdated Software Training", is_active: false },
        ]
      },
      {
        id: 13,
        name: "Vocational Training",
        items: [
          { id: 131, name: "Carpentry", is_active: true },
          { id: 132, name: "Plumbing", is_active: true },
          { id: 133, name: "Typewriter Repair", is_active: false },
        ]
      }
    ]
  },
  {
    id: 2,
    name: "Health & Well-being",
    subCategories: [
      {
        id: 21,
        name: "Mental Health",
        items: [
          { id: 211, name: "Counseling Services", is_active: true },
          { id: 212, name: "Support Groups", is_active: true },
          { id: 213, name: "Obsolete Therapy", is_active: false },
        ]
      },
      {
        id: 22,
        name: "Nutrition",
        items: [
          { id: 221, name: "Meal Planning", is_active: true },
          { id: 222, name: "Food Distribution", is_active: true },
          { id: 223, name: "Old Diet Trends", is_active: false },
        ]
      },
      {
        id: 23,
        name: "Preventive Care",
        items: [
          { id: 231, name: "Vaccination Drives", is_active: true },
          { id: 232, name: "Health Screenings", is_active: true },
          { id: 233, name: "Outdated Practices", is_active: false },
        ]
      }
    ]
  },
  {
    id: 3,
    name: "Community Development",
    subCategories: [
      {
        id: 31,
        name: "Infrastructure",
        items: [
          { id: 311, name: "Road Repair", is_active: true },
          { id: 312, name: "Water Sanitation", is_active: true },
          { id: 313, name: "Abandoned Projects", is_active: false },
        ]
      },
      {
        id: 32,
        name: "Economic Empowerment",
        items: [
          { id: 321, name: "Microfinance", is_active: true },
          { id: 322, name: "Business Mentorship", is_active: true },
          { id: 323, name: "Closed Loan Program", is_active: false },
        ]
      }
    ]
  },
  {
    id: 4,
    name: "Environmental Protection",
    subCategories: [
      {
        id: 41,
        name: "Conservation",
        items: [
          { id: 411, name: "Reforestation", is_active: true },
          { id: 412, name: "Wildlife Protection", is_active: true },
          { id: 413, name: "Old Conservation Model", is_active: false },
        ]
      },
      {
        id: 42,
        name: "Waste Management",
        items: [
          { id: 421, name: "Recycling Programs", is_active: true },
          { id: 422, name: "Composting", is_active: true },
          { id: 423, name: "Incinerator Project", is_active: false },
        ]
      }
    ]
  }
];

export const GROUPS_CONFIG = [
  { name: 'Disability', allowsA: true },
  { name: 'Gender', allowsA: true },
  { name: 'LGBTIQ+', allowsA: false },
  { name: 'Ethnicity/language', allowsA: true },
  { name: 'Displacement', allowsA: false },
  { name: 'Migrant families', allowsA: false },
  { name: 'Statelessness', allowsA: false },
  { name: 'Other', allowsA: true }
] as const;

