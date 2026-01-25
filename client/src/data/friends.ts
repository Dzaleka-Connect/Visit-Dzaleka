export interface Friend {
    id: string;
    slug: string;
    name: string;
    role: string;
    location: string;
    image: string; // URL or placeholder logic
    shortBio: string; // For the card
    fullBio: string; // For the profile page
    connection: string;
    contribution: string;
    social: {
        instagram?: string;
        twitter?: string;
        facebook?: string;
        youtube?: string;
        linkedin?: string;
        website?: string;
    };
}

export const friends: Friend[] = [
    {
        id: "mayele-malango",
        slug: "mayele-malango",
        name: "Mayele Malango",
        role: "Former Resident & Community Advocate",
        location: "United States",
        image: "https://img.a.transfermarkt.technology/portrait/big/735326-1722695497.jpg?lm=1",
        shortBio: "Professional footballer and former Dzaleka resident raising awareness through sport and personal narrative.",
        fullBio: "Mayele Malango was born in Kinshasa, Democratic Republic of the Congo and spent the first 10 years of his life in Dzaleka Refugee Camp in Malawi after his family fled conflict there. He and his family were resettled in the United States through the United Nations Refugee Program in 2015, settling in Lowell, Massachusetts where he continued his education and soccer development. Mayele has gone on to become a professional footballer, playing in the United States and earning selection for the Malawi national team in the 2026 World Cup qualifiers, reflecting his strong connection to Malawi and gratitude for the opportunity the camp provided.",
        connection: "Mayele grew up in Dzaleka Refugee Camp and considers Malawi home, often speaking about his gratitude for the opportunities he received there.",
        contribution: "Mayele shares stories and experiences about Dzaleka with his audience, helping raise awareness of the community’s resilience, culture, and everyday life through sport, personal narrative, and advocacy.",
        social: {
            instagram: "https://www.instagram.com/mayelemalango/",
            twitter: "https://twitter.com/Mayele_10",
            facebook: "https://www.facebook.com/mayele.malango/",
            youtube: "https://www.youtube.com/channel/UC05_9TOWx1-ETSGs721dvjw"
        }
    },
    {
        id: "patrick-chafukira",
        slug: "patrick-chafukira",
        name: "Patrick Chafukira",
        role: "Supporter of Dzaleka",
        location: "Dowa, Malawi",
        image: "/friends-of-dzaleka/patrick-chafukira.jpg",
        shortBio: "Grew up near Dzaleka and studied at the camp's secondary school. Passionate about sharing stories of Dzaleka's culture.",
        fullBio: "Patrick Chafukira was born in Lilongwe and grew up at Mengwe village near Dzaleka Refugee camp. He studied at Dzaleka Community Day Secondary School. Currently, he is staying at Mponela for work duties. Patrick is passionate about Dzaleka and plans to continue sharing stories of the community, focusing on culture and other narratives.",
        connection: "Patrick grew up at Mengwe village near Dzaleka Refugee camp and studied at Dzaleka Community Day Secondary School, giving him a deep personal connection to the community.",
        contribution: "Patrick contributes by sharing stories of Dzaleka on his platform, focusing on culture, and plans to promote tours to support the community.",
        social: {
            facebook: "https://www.facebook.com/profile.php?id=61581206906022"
        }
    }
];
