import type {
  ArticlesResponse,
  ArticleDetail,
  AuthorDetail,
} from "../types/article";

export const sampleArticles: ArticlesResponse = {
  data: [
    {
      id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      title:
        "Global Climate Summit Reaches Historic Agreement on Carbon Emissions",
      perex:
        "World leaders have unanimously agreed on a groundbreaking framework to reduce global carbon emissions by 60% before 2035, marking the most ambitious climate commitment in history.",
      publication_date: "2026-04-10T08:00:00Z",
      category: "World",
      keywords: ["climate", "environment", "politics"],
      primary_image: {
        url: "https://picsum.photos/seed/climate/800/500",
        caption: "World leaders at the climate summit",
      },
      author: {
        id: "u1",
        full_name: "Sarah Mitchell",
        profile_picture: "https://picsum.photos/seed/sarah/40/40",
      },
    },
    {
      id: "b2c3d4e5-f6a7-8901-bcde-f12345678901",
      title:
        "Senate Passes Landmark Infrastructure Bill After Months of Debate",
      perex:
        "The bipartisan bill allocates $2 trillion for roads, bridges, and broadband expansion across rural communities.",
      publication_date: "2026-04-09T10:00:00Z",
      category: "Politics",
      keywords: ["politics", "infrastructure", "senate"],
      primary_image: {
        url: "https://picsum.photos/seed/senate/800/500",
        caption: "Senate vote session",
      },
      author: {
        id: "u2",
        full_name: "James Rivera",
        profile_picture: "https://picsum.photos/seed/james/40/40",
      },
    },
    {
      id: "c3d4e5f6-a7b8-9012-cdef-123456789012",
      title:
        "AI Breakthrough: New Model Achieves Human-Level Reasoning in Scientific Research",
      perex:
        "Researchers unveil an artificial intelligence system capable of independently designing and conducting complex experiments.",
      publication_date: "2026-04-08T09:00:00Z",
      category: "Technology",
      keywords: ["AI", "technology", "research"],
      primary_image: {
        url: "https://picsum.photos/seed/ailab/800/500",
        caption: "AI research laboratory",
      },
      author: {
        id: "u3",
        full_name: "Elena Park",
        profile_picture: "https://picsum.photos/seed/elena/40/40",
      },
    },
    {
      id: "d4e5f6a7-b8c9-0123-defa-234567890123",
      title:
        "Champions League Final Set: Madrid to Host Historic All-English Showdown",
      perex:
        "Two English clubs will face off in Madrid for the first time since 2019 in what promises to be a thrilling finale.",
      publication_date: "2026-04-07T14:00:00Z",
      category: "Sports",
      keywords: ["football", "Champions League", "UEFA"],
      primary_image: {
        url: "https://picsum.photos/seed/football/800/500",
        caption: "Champions League trophy",
      },
      author: {
        id: "u4",
        full_name: "Marcus Webb",
        profile_picture: "https://picsum.photos/seed/marcus/40/40",
      },
    },
    {
      id: "e5f6a7b8-c9d0-1234-efab-345678901234",
      title:
        "Metropolitan Museum Unveils Largest Collection of Recovered Ancient Artifacts",
      perex:
        "The museum opens a new wing housing over 2,000 pieces of ancient art repatriated from private collections worldwide.",
      publication_date: "2026-04-06T11:00:00Z",
      category: "Culture",
      keywords: ["culture", "museum", "art"],
      primary_image: {
        url: "https://picsum.photos/seed/museum/800/500",
        caption: "Ancient artifact exhibition",
      },
      author: {
        id: "u5",
        full_name: "Priya Sharma",
        profile_picture: "https://picsum.photos/seed/priya/40/40",
      },
    },
    {
      id: "f6a7b8c9-d0e1-2345-fabc-456789012345",
      title: "Election Commission Announces Reforms to Absentee Ballot Process",
      perex:
        "New rules will expand mail-in voting access ahead of the midterm elections, addressing long-standing concerns about accessibility in rural districts.",
      publication_date: "2026-04-05T07:30:00Z",
      category: "Politics",
      keywords: ["elections", "voting", "democracy"],
      primary_image: {
        url: "https://picsum.photos/seed/elections/800/500",
        caption: "Ballot boxes at a polling station",
      },
      author: {
        id: "u6",
        full_name: "Daniel Foster",
        profile_picture: "https://picsum.photos/seed/daniel/40/40",
      },
    },
    {
      id: "a7b8c9d0-e1f2-3456-abcd-567890123456",
      title:
        "Supreme Court to Hear Landmark Case on Digital Surveillance Rights",
      perex:
        "The case could redefine the boundaries of government surveillance in the digital age, with implications for millions of citizens.",
      publication_date: "2026-04-04T09:00:00Z",
      category: "Politics",
      keywords: ["supreme court", "privacy", "surveillance"],
      primary_image: {
        url: "https://picsum.photos/seed/court/800/500",
        caption: "The Supreme Court building",
      },
      author: {
        id: "u7",
        full_name: "Rachel Kim",
        profile_picture: "https://picsum.photos/seed/rachel/40/40",
      },
    },
    {
      id: "b8c9d0e1-f2a3-4567-bcde-678901234567",
      title:
        "Governors Coalition Pushes Back Against Federal Education Mandates",
      perex:
        "A bipartisan group of state governors is challenging new federal education requirements they say overstep constitutional boundaries.",
      publication_date: "2026-04-03T11:00:00Z",
      category: "Politics",
      keywords: ["education", "governors", "federal policy"],
      primary_image: {
        url: "https://picsum.photos/seed/governors/800/500",
        caption: "Governors' conference on education policy",
      },
      author: {
        id: "u8",
        full_name: "Michael Torres",
        profile_picture: "https://picsum.photos/seed/michael/40/40",
      },
    },
    {
      id: "c9d0e1f2-a3b4-5678-cdef-789012345678",
      title:
        "New Space Telescope Captures Deepest Image of Universe Ever Recorded",
      perex:
        "Scientists unveil an image showing galaxies as they appeared just 200 million years after the Big Bang.",
      publication_date: "2026-04-02T08:00:00Z",
      category: "Technology",
      keywords: ["space", "astronomy", "science"],
      primary_image: {
        url: "https://picsum.photos/seed/space/800/500",
        caption: "Deep space image from the new telescope",
      },
      author: {
        id: "u9",
        full_name: "Lisa Chen",
        profile_picture: "https://picsum.photos/seed/lisa/40/40",
      },
    },
  ],
  pagination: { page: 1, limit: 20, total: 9, total_pages: 1 },
};

// Sample data matching GET /api/newspapers/:newspaper_id/articles/:article_id response shape
export const sampleArticleDetail: ArticleDetail = {
  id: "b2c3d4e5-f6a7-8901-bcde-f12345678901",
  title: "Senate Passes Landmark Infrastructure Bill After Months of Debate",
  perex:
    "In a landmark moment for American governance, Senate leaders from both parties unveiled a sweeping $2.3 trillion infrastructure package that promises to reshape the nation's roads, bridges, broadband networks, and clean energy systems over the next decade.",
  content: `## A Historic Investment in Transportation

The transportation portion of the bill addresses what experts have long described as a crisis in American infrastructure. According to the American Society of Civil Engineers, the country's infrastructure received a C-minus grade in its most recent report card, with an estimated $2.59 trillion in needed repairs over the next decade.

The proposal allocates $645 billion for transportation infrastructure alone — the single largest federal investment in roads and bridges since the Interstate Highway System was built in the 1950s. An additional $120 billion is earmarked for Amtrak and public transit systems, which advocates say will reduce highway congestion and cut emissions.

> "This is not a Democratic plan or a Republican plan. This is an American plan, and it's long overdue. Our infrastructure has been crumbling for decades, and today we take the first step toward fixing it."
> — Senator Maria Collins (D-WA), Co-sponsor

## Broadband for All Americans

Perhaps the most transformative element of the package is its $400 billion investment in broadband infrastructure. The plan aims to bring high-speed internet access to every American household by 2030, with particular emphasis on rural and underserved communities that have long been left behind in the digital revolution.

Studies show that roughly 21 million Americans still lack access to reliable broadband — a gap that became acutely visible during the COVID-19 pandemic when remote work and schooling exposed stark inequalities in connectivity. The bill would fund new fiber-optic lines, subsidize internet service providers operating in low-income areas, and establish a digital literacy training program for seniors.

## Clean Energy and the Path Forward

The clean energy component commits $300 billion to accelerate the transition away from fossil fuels. This includes tax incentives for electric vehicle manufacturers, grants for solar and wind installation on federal lands, and funding for next-generation nuclear research. Environmental groups have cautiously welcomed the investment while calling for more ambitious timelines.

The bill now heads to the House, where it is expected to face a more contentious debate. Speaker advocates must navigate competing demands from progressive members seeking a larger climate investment and moderates concerned about the price tag.`,
  publication_date: "2026-04-09T10:00:00Z",
  category: "Politics",
  keywords: [
    "politics",
    "infrastructure",
    "senate",
    "broadband",
    "clean energy",
  ],
  likes_count: 284,
  liked_by_me: false,
  author: {
    id: "u2",
    full_name: "James Rivera",
    profile_picture: "https://picsum.photos/seed/james/40/40",
  },
  images: [
    {
      url: "https://picsum.photos/seed/senate/1440/480",
      caption: "Senate chamber during the infrastructure vote. Photo: Reuters",
      is_primary: true,
    },
    {
      url: "https://picsum.photos/seed/broadband/800/360",
      caption:
        "Senators gathered on the floor to discuss the infrastructure proposal. Photo: Reuters",
      is_primary: false,
    },
  ],
  comments: [
    {
      id: "c1",
      content:
        "This is a huge deal for rural communities. Finally some real investment.",
      created_at: "2026-04-09T11:30:00Z",
      author: { id: "u10", username: "ruralvoice" },
    },
    {
      id: "c2",
      content:
        "Let's see if it actually passes the House. We've been here before.",
      created_at: "2026-04-09T12:45:00Z",
      author: { id: "u11", username: "skeptic99" },
    },
    {
      id: "c3",
      content:
        "The broadband provisions alone make this worth it. 21 million without internet in 2026 is embarrassing.",
      created_at: "2026-04-09T14:00:00Z",
      author: { id: "u12", username: "techpolicy" },
    },
  ],
};

// Sample data matching GET /api/newspapers/:newspaper_id/authors/:author_id response shape
export const sampleAuthors: Record<string, AuthorDetail> = {
  u1: {
    id: "u1",
    full_name: "Sarah Mitchell",
    profile_picture: "https://picsum.photos/seed/sarah/200/200",
    role: "Senior Political Correspondent",
    bio: "Sarah Mitchell is an award-winning journalist with over 15 years of experience covering politics, policy, and government affairs. She has reported from Capitol Hill, the White House, and international summits across the globe. Her investigative work has earned multiple press association honors.",
    articles_count: 142,
    years_active: 15,
    total_likes: 2400,
    social_links: {
      twitter: "https://twitter.com/sarahmitchell",
      linkedin: "https://linkedin.com/in/sarahmitchell",
      email: "sarah.mitchell@example.com",
    },
    articles: [
      {
        id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        title:
          "Global Climate Summit Reaches Historic Agreement on Carbon Emissions",
        perex:
          "World leaders have unanimously agreed on a groundbreaking framework to reduce global carbon emissions by 60% before 2035, marking the most ambitious climate commitment in history.",
        publication_date: "2026-04-10T08:00:00Z",
        category: "World",
        keywords: ["climate", "environment", "politics"],
        primary_image: {
          url: "https://picsum.photos/seed/climate/800/500",
          caption: "World leaders at the climate summit",
        },
        author: {
          id: "u1",
          full_name: "Sarah Mitchell",
          profile_picture: "https://picsum.photos/seed/sarah/40/40",
        },
      },
      {
        id: "s1-a2",
        title:
          "Senate Passes Landmark Digital Privacy Bill After Months of Debate",
        perex:
          "The new legislation introduces strict requirements for data handling and gives citizens unprecedented control over their personal information.",
        publication_date: "2026-03-28T09:00:00Z",
        category: "Politics",
        keywords: ["privacy", "senate", "legislation"],
        primary_image: {
          url: "https://picsum.photos/seed/privacy/800/500",
          caption: "Senate session on digital privacy",
        },
        author: {
          id: "u1",
          full_name: "Sarah Mitchell",
          profile_picture: "https://picsum.photos/seed/sarah/40/40",
        },
      },
      {
        id: "s1-a3",
        title:
          "White House Unveils Ambitious Climate Action Plan for Federal Agencies",
        perex:
          "The executive order mandates all federal buildings achieve net-zero emissions by 2035, setting a new standard for government sustainability.",
        publication_date: "2026-03-25T10:00:00Z",
        category: "Politics",
        keywords: ["climate", "white house", "policy"],
        primary_image: {
          url: "https://picsum.photos/seed/whitehouse/800/500",
          caption: "White House press briefing",
        },
        author: {
          id: "u1",
          full_name: "Sarah Mitchell",
          profile_picture: "https://picsum.photos/seed/sarah/40/40",
        },
      },
      {
        id: "s1-a4",
        title: "Bipartisan Coalition Forms to Address National Housing Crisis",
        perex:
          "Lawmakers from both parties propose a $500 billion housing initiative aimed at increasing affordable housing stock across all 50 states.",
        publication_date: "2026-03-22T11:00:00Z",
        category: "Politics",
        keywords: ["housing", "bipartisan", "policy"],
        primary_image: {
          url: "https://picsum.photos/seed/housing/800/500",
          caption: "Affordable housing development",
        },
        author: {
          id: "u1",
          full_name: "Sarah Mitchell",
          profile_picture: "https://picsum.photos/seed/sarah/40/40",
        },
      },
    ],
  },
  u2: {
    id: "u2",
    full_name: "James Rivera",
    profile_picture: "https://picsum.photos/seed/james/200/200",
    role: "Washington Bureau Chief",
    bio: "James Rivera has spent over a decade embedded in Washington's political corridors, breaking stories on infrastructure, fiscal policy, and congressional dynamics. Before joining the bureau, he covered state legislatures across the Midwest and led an investigative team focused on government spending.",
    articles_count: 98,
    years_active: 11,
    total_likes: 1870,
    social_links: {
      twitter: "https://twitter.com/jamesrivera",
      email: "james.rivera@example.com",
    },
    articles: [
      {
        id: "b2c3d4e5-f6a7-8901-bcde-f12345678901",
        title:
          "Senate Passes Landmark Infrastructure Bill After Months of Debate",
        perex:
          "The bipartisan bill allocates $2 trillion for roads, bridges, and broadband expansion across rural communities.",
        publication_date: "2026-04-09T10:00:00Z",
        category: "Politics",
        keywords: ["politics", "infrastructure", "senate"],
        primary_image: {
          url: "https://picsum.photos/seed/senate/800/500",
          caption: "Senate vote session",
        },
        author: {
          id: "u2",
          full_name: "James Rivera",
          profile_picture: "https://picsum.photos/seed/james/40/40",
        },
      },
      {
        id: "u2-a2",
        title:
          "Federal Reserve Signals Pause on Interest Rate Hikes Amid Economic Uncertainty",
        perex:
          "Fed chair cites slowing inflation data and mixed employment figures as reasons for a wait-and-see approach through the summer.",
        publication_date: "2026-04-01T08:30:00Z",
        category: "Politics",
        keywords: ["federal reserve", "economy", "interest rates"],
        primary_image: {
          url: "https://picsum.photos/seed/fedreserve/800/500",
          caption: "Federal Reserve building",
        },
        author: {
          id: "u2",
          full_name: "James Rivera",
          profile_picture: "https://picsum.photos/seed/james/40/40",
        },
      },
      {
        id: "u2-a3",
        title:
          "Congressional Budget Office Revises Deficit Forecast Upward by $300 Billion",
        perex:
          "New projections cite higher-than-expected military spending and slower tax revenue growth as the primary drivers of the widened gap.",
        publication_date: "2026-03-18T09:00:00Z",
        category: "Politics",
        keywords: ["budget", "congress", "deficit"],
        primary_image: {
          url: "https://picsum.photos/seed/congress/800/500",
          caption: "Congress building",
        },
        author: {
          id: "u2",
          full_name: "James Rivera",
          profile_picture: "https://picsum.photos/seed/james/40/40",
        },
      },
    ],
  },
  u3: {
    id: "u3",
    full_name: "Elena Park",
    profile_picture: "https://picsum.photos/seed/elena/200/200",
    role: "Technology & Science Editor",
    bio: "Elena Park reports at the intersection of artificial intelligence, scientific research, and society. With a background in computer science and science journalism, she has profiled leading researchers, covered major conference announcements, and produced long-form investigations into the ethics of emerging technologies.",
    articles_count: 76,
    years_active: 7,
    total_likes: 3100,
    social_links: {
      twitter: "https://twitter.com/elenapark",
      linkedin: "https://linkedin.com/in/elenapark",
      email: "elena.park@example.com",
    },
    articles: [
      {
        id: "c3d4e5f6-a7b8-9012-cdef-123456789012",
        title:
          "AI Breakthrough: New Model Achieves Human-Level Reasoning in Scientific Research",
        perex:
          "Researchers unveil an artificial intelligence system capable of independently designing and conducting complex experiments.",
        publication_date: "2026-04-08T09:00:00Z",
        category: "Technology",
        keywords: ["AI", "technology", "research"],
        primary_image: {
          url: "https://picsum.photos/seed/ailab/800/500",
          caption: "AI research laboratory",
        },
        author: {
          id: "u3",
          full_name: "Elena Park",
          profile_picture: "https://picsum.photos/seed/elena/40/40",
        },
      },
      {
        id: "c9d0e1f2-a3b4-5678-cdef-789012345678",
        title:
          "New Space Telescope Captures Deepest Image of Universe Ever Recorded",
        perex:
          "Scientists unveil an image showing galaxies as they appeared just 200 million years after the Big Bang.",
        publication_date: "2026-04-02T08:00:00Z",
        category: "Technology",
        keywords: ["space", "astronomy", "science"],
        primary_image: {
          url: "https://picsum.photos/seed/space/800/500",
          caption: "Deep space image from the new telescope",
        },
        author: {
          id: "u3",
          full_name: "Elena Park",
          profile_picture: "https://picsum.photos/seed/elena/40/40",
        },
      },
      {
        id: "u3-a3",
        title: "Quantum Computing Startup Demonstrates 1,000-Qubit Processor",
        perex:
          "The milestone brings error-corrected quantum computing closer to practical deployment, with pharmaceutical and logistics industries watching closely.",
        publication_date: "2026-03-29T10:00:00Z",
        category: "Technology",
        keywords: ["quantum computing", "technology", "startup"],
        primary_image: {
          url: "https://picsum.photos/seed/quantum/800/500",
          caption: "Quantum computer hardware",
        },
        author: {
          id: "u3",
          full_name: "Elena Park",
          profile_picture: "https://picsum.photos/seed/elena/40/40",
        },
      },
    ],
  },
};

// Fallback author for unknown IDs
export const sampleAuthorFallback: AuthorDetail = sampleAuthors["u1"];
