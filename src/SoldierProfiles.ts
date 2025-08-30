export interface SoldierProfile {
    name: string;
    rank: string;
    age: number;
    hometown: string;
    backstory: string;
    family: string;
}

export const SOLDIER_PROFILES: SoldierProfile[] = [
    {
        name: "James Sullivan",
        rank: "Private",
        age: 19,
        hometown: "Chicago, Illinois",
        backstory: "A young recruit who joined to support his family back home. Dreams of becoming a mechanic after the war.",
        family: "Mother Margaret and younger sister Emma"
    },
    {
        name: "Roberto Martinez",
        rank: "Corporal", 
        age: 24,
        hometown: "San Antonio, Texas",
        backstory: "Former construction worker who enlisted after Pearl Harbor. Known for his quick wit and loyalty to his squad.",
        family: "Wife Maria and newborn son Diego"
    },
    {
        name: "William 'Bill' Thompson",
        rank: "Sergeant",
        age: 28,
        hometown: "Portland, Oregon",
        backstory: "Career soldier who's been in service for 8 years. Respected leader who always puts his men first.",
        family: "Father Henry, a WWI veteran"
    },
    {
        name: "Anthony DeLuca",
        rank: "Private First Class",
        age: 21,
        hometown: "Brooklyn, New York",
        backstory: "Former baker's apprentice with dreams of opening his own shop. Carries photos of his neighborhood.",
        family: "Large Italian family including 6 siblings"
    },
    {
        name: "Charles 'Chuck' Wilson",
        rank: "Lance Corporal",
        age: 23,
        hometown: "Kansas City, Missouri",
        backstory: "Farm boy who grew up fixing tractors. His mechanical skills have saved the squad multiple times.",
        family: "Parents Robert and Helen, fiancée Dorothy"
    },
    {
        name: "Samuel Jackson",
        rank: "Private",
        age: 20,
        hometown: "Birmingham, Alabama",
        backstory: "Youngest of five brothers, all serving in different branches. Writes letters home every day.",
        family: "Mother Ruth and four older brothers in service"
    },
    {
        name: "David 'Tex' Austin",
        rank: "Staff Sergeant",
        age: 26,
        hometown: "Dallas, Texas",
        backstory: "Former rodeo rider turned soldier. His calm under pressure and sharp shooting skills are legendary.",
        family: "Twin brother Daniel (also deployed) and elderly grandmother"
    },
    {
        name: "Michael O'Brien",
        rank: "Private",
        age: 18,
        hometown: "Boston, Massachusetts",
        backstory: "Fresh out of high school, volunteered on his 18th birthday. Still learning the ropes but eager to prove himself.",
        family: "Irish immigrant parents Patrick and Molly"
    },
    {
        name: "Franklin 'Frank' Rodriguez",
        rank: "Corporal",
        age: 25,
        hometown: "Los Angeles, California",
        backstory: "Former teacher who joined to fight fascism. Uses his education to help fellow soldiers write letters home.",
        family: "Wife Elena and 3-year-old daughter Sofia"
    },
    {
        name: "Joseph 'Joe' Kowalski",
        rank: "Private First Class",
        age: 22,
        hometown: "Detroit, Michigan",
        backstory: "Auto factory worker who knows machinery inside and out. Volunteered after his factory switched to making tanks.",
        family: "Polish immigrant parents and younger brother Stanley"
    }
];

// Function to get a random soldier profile
export function getRandomSoldierProfile(): SoldierProfile {
    const randomIndex = Math.floor(Math.random() * SOLDIER_PROFILES.length);
    return SOLDIER_PROFILES[randomIndex];
}
