-- Training Modules table
CREATE TABLE IF NOT EXISTS training_modules (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR NOT NULL,
  description TEXT,
  category VARCHAR NOT NULL,
  content TEXT,
  external_url VARCHAR,
  estimated_minutes INTEGER DEFAULT 15,
  sort_order INTEGER DEFAULT 0,
  is_required BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Training Progress Status Enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'training_progress_status') THEN
    CREATE TYPE training_progress_status AS ENUM ('not_started', 'in_progress', 'completed');
  END IF;
END$$;

-- Guide Training Progress table
CREATE TABLE IF NOT EXISTS guide_training_progress (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id VARCHAR NOT NULL REFERENCES guides(id) ON DELETE CASCADE,
  module_id VARCHAR NOT NULL REFERENCES training_modules(id) ON DELETE CASCADE,
  status training_progress_status DEFAULT 'not_started',
  completed_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(guide_id, module_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_training_modules_category ON training_modules(category);
CREATE INDEX IF NOT EXISTS idx_training_modules_active ON training_modules(is_active);
CREATE INDEX IF NOT EXISTS idx_guide_training_progress_guide ON guide_training_progress(guide_id);
CREATE INDEX IF NOT EXISTS idx_guide_training_progress_module ON guide_training_progress(module_id);

-- Seed initial training modules based on Dzaleka resources
INSERT INTO training_modules (title, description, category, content, external_url, estimated_minutes, sort_order, is_required) VALUES

-- About Dzaleka
('Dzaleka Refugee Camp Overview', 
 'Learn about the history, location, and demographics of Dzaleka Refugee Camp.', 
 'About Dzaleka',
 'Dzaleka Refugee Camp, situated approximately 41 kilometers from Lilongwe in Malawi''s Dowa District, was established in 1994 through a collaborative effort between the Government of Malawi and the United Nations High Commissioner for Refugees (UNHCR). Its primary purpose was to offer refuge to individuals fleeing genocide, violence, and wars, predominantly from Burundi, Rwanda, and the Democratic Republic of Congo. The camp''s name, "Dzaleka," is derived from the Chichewa phrase "N''dzaleka," which translates to "I will never do it again," a name that profoundly reflects its historical transformation from a political prison to a sanctuary of hope.

Initially designed to accommodate between 10,000 and 12,000 residents, Dzaleka currently hosts over 52,000 refugees and asylum seekers. This significant population surge has resulted in considerable overcrowding and placed immense strain on existing resources. The majority of the camp''s inhabitants originate from the Democratic Republic of Congo (62%), Burundi (19%), and Rwanda (7%), with a smaller representation from other nationalities. The prolonged nature of conflicts in the Great Lakes region is a primary factor contributing to the extended stays of many refugees, as safe return to their home countries remains unfeasible.

Despite these formidable challenges, the residents of Dzaleka have cultivated a remarkably vibrant and resilient community. They have successfully established a diverse range of businesses, schools, and cultural initiatives. A notable example of this resilience is the Tumaini Festival, an annual arts and cultural event founded in 2014 by Congolese refugee Tresor Mpauni. This festival serves as a crucial platform for cultural exchange and raises global awareness about refugee issues. Administratively, the camp is divided into zones, each named after Malawian towns and cities, and each possessing its own distinct character and community dynamics.',
 'https://www.dzaleka.com/p/dzaleka-refugee-camp.html', 20, 1, true),

('Historical Background', 
 'Detailed history of Dzaleka from its time as a political prison to a refugee camp.', 
 'About Dzaleka',
 'Dzaleka Refugee Camp, located in Malawi''s Dowa District, approximately 41 kilometers from Lilongwe, possesses a complex and deeply poignant history. Prior to its designation as a refugee camp in 1994, the site functioned as a political prison during the presidency of Hastings Kamuzu Banda (1964-1994). Reports from that era describe appalling conditions within the prison, characterized by regular beatings and torture. It was used to incarcerate political dissidents and religious minorities, notably over 3,000 Jehovah''s Witnesses who faced severe persecution for their beliefs.

The transformation of Dzaleka into a refugee camp commenced in 1994, following the dissolution of Banda''s regime and a subsequent agreement between the UNHCR and the Malawian government. Initially, approximately a thousand refugees were relocated from Lilongwe market to Dzaleka. The camp''s population experienced a steady and significant increase, reaching 6,000 by 2003, 10,000 by 2008, and 16,000 by 2010, far exceeding its original design capacity of 12,000 residents. This rapid growth underscored the urgent need for humanitarian assistance in the region.

The camp predominantly serves as a sanctuary for refugees originating from the Democratic Republic of Congo, Burundi, and Rwanda, who sought asylum from widespread conflict, genocide, and persecution in their homelands. Despite the persistent challenges of overcrowding and limited resources, the Dzaleka community has demonstrated extraordinary resilience. In 2014, Trésor Nzengu Mpauni, a refugee from Lubumbashi, initiated the Tumaini Festival. This annual arts and culture event has since grown to attract tens of thousands of attendees, establishing itself as a vital platform for cultural exchange, artistic expression, and community empowerment within the camp.',
 'https://en.wikipedia.org/wiki/Dzaleka_Refugee_Camp', 15, 2, true),

-- Visit Dzaleka
('What is Visit Dzaleka', 
 'Understand the Visit Dzaleka program, its mission, and how tours are conducted.', 
 'Visit Dzaleka',
 'The Dzaleka Refugee Camp offers a thoughtfully structured visit program designed to provide visitors with an immersive and profoundly educational experience of its vibrant community. Situated approximately 50 km from Lilongwe, the camp is home to over 55,000 residents from diverse African nations, each contributing to a rich and dynamic tapestry of culture, art, and innovation. The visit program is meticulously crafted to foster an understanding of the camp''s complex history, the remarkable resilience of its inhabitants, and the myriad cultural expressions that flourish within its boundaries.

Visitors have the flexibility to choose between a standard 2-hour guided walking tour or a more comprehensive extended 3-4 hour option, with additional hours available for an extra fee. These tours are expertly led by knowledgeable local guides who offer invaluable insights into the camp''s historical sites, its bustling community areas, and the daily lives of its residents. The program is designed to include engaging opportunities for cultural insights, direct community interactions, and informative Q&A sessions. It is important for visitors to note that transportation to and from the camp, meals, and any entrance fees to specific attractions are not included in the tour price.

To ensure a respectful and mutually positive experience, visitors are strongly encouraged to adhere to a set of established guidelines. These include respecting residents'' privacy, always seeking explicit permission before taking photographs, and dressing modestly and appropriately for the cultural context. All visits must be pre-booked at least 48 hours in advance through the Dzaleka Online Services website. Critically, all proceeds generated from these tours are directly channeled to support the local guides and various community initiatives within Dzaleka, thereby fostering economic empowerment and contributing significantly to the camp''s ongoing community development efforts.',
 'https://services.dzaleka.com/visit/', 15, 10, true),

('Dzaleka Time Capsule', 
 'Explore the Dzaleka Time Capsule project and its significance in preserving camp history.', 
 'Visit Dzaleka',
 'The Dzaleka Time Capsule represents a comprehensive digital archive meticulously documenting the profound transformation of Dzaleka from its origins as a political prison to its current status as a thriving refugee settlement, covering the period from 1964 to the present day. This living archive is thoughtfully organized into three distinct historical eras: the Political Prison Era (1964-1994), the pivotal Transition from Prison to Refugee Camp (1994-2000), and the ongoing Refugee Era, which focuses on Community Development (2000-Present). It serves as an indispensable resource for understanding the camp''s intricate past and the extraordinary resilience demonstrated by its inhabitants.

During its initial phase as a political prison, Dzaleka gained notoriety for its harsh conditions, including forced labor and the severe persecution of political dissidents and religious minorities, particularly Jehovah''s Witnesses. Historical documents from this period, such as State Department cables and yearbooks, vividly detail the grim realities endured by up to 6,000 inmates. The transition period was initiated with the collapse of Hastings Kamuzu Banda''s regime in 1994, leading to the closure of the prison and its subsequent repurposing as a refugee camp, a critical development facilitated by the involvement of the UNHCR.

In the contemporary Refugee Era, the Time Capsule prominently highlights the camp''s evolution into a vibrant community, despite facing significant challenges such as substantial population growth, which now sees it housing over 52,000 refugees. The archive showcases remarkable community development through initiatives like the internationally recognized Tumaini Festival and various impactful refugee-led organizations. It also candidly addresses persistent challenges, including overcrowding and the complex issue of human trafficking. Crucially, the Time Capsule emphasizes the rich cultural achievements and the continuous efforts to preserve the community''s history through personal stories, cherished cultural memories, and the lived experiences of Dzaleka''s residents. The name "Dzaleka," meaning "I will never do it again," powerfully encapsulates this journey of profound transformation and enduring hope.',
 'https://services.dzaleka.com/dzaleka-time-capsule/', 20, 11, true),

-- Visitor Info
('Visitor Travel Guide', 
 'Essential travel information, logistics, and safety advice for guiding visitors.', 
 'Visitor Info',
 'The Dzaleka Refugee Camp Travel Guide serves as an indispensable resource for visitors intending to explore the rich cultural heritage, diverse educational opportunities, and impactful community initiatives within Malawi''s largest refugee settlement. Strategically located 41 kilometers from Lilongwe city center and 30 kilometers from Kamuzu International Airport, Dzaleka is readily accessible via various transportation options, including taxis, car rentals, or public transport. Regular minibuses operate from Lilongwe to Dowa, from where local transport can be arranged to reach the camp.

The guide provides crucial practical information for visitors, including details on accommodation options such as the Tumaini Letu Homestay program, which offers an immersive cultural exchange experience while supporting local livelihoods. Emphasizing safety and health, visitors are strongly advised to exercise caution, particularly during nighttime hours, and to always travel with a knowledgeable guide. It is also recommended to secure comprehensive travel insurance and ensure all necessary vaccinations are up-to-date, as medical facilities within the camp are limited. Additionally, the guide offers general information about Malawi, covering essential aspects like official languages (English and Chichewa), the local currency (Malawian Kwacha), climate patterns, and specific visa requirements, which typically involve a 30-day single-entry visa for most international visitors.

Furthermore, the travel guide highlights a variety of cultural and artistic experiences available, including the internationally acclaimed annual Tumaini Festival, the Dzaleka Art Project showcasing local artistic talents, and the vibrant Tuesday Market, offering a glimpse into daily life and local commerce. Educational and technological opportunities are also featured, such as TakenoLAB, which provides free digital skills and entrepreneurship courses, and various vocational training programs. The guide places significant emphasis on ethical considerations, urging visitors to consistently respect residents'' privacy and dignity, always seek permission before taking photographs, actively support local businesses, and remain mindful of the camp''s inherent challenges and limitations.',
 'https://services.dzaleka.com/visit/travel-guide/', 15, 20, true),

('Visitor Guidelines', 
 'Critical rules and behavioral guidelines every guide must enforce.', 
 'Visitor Info',
 'To ensure a respectful, meaningful, and safe experience for both visitors and the Dzaleka Refugee Camp community, a comprehensive set of visitor guidelines has been established. These guidelines are built upon core principles of cultural sensitivity, appropriate conduct, and safety awareness. Adherence to these rules is crucial for fostering positive interactions and maintaining the dignity and privacy of the camp residents.

**Key Visitor Guidelines:**

*   **Cultural Sensitivity:**
    *   Always ask for explicit permission before taking photographs of people.
    *   Respect personal space and privacy.
    *   Be mindful of different cultural backgrounds and customs.
    *   Listen more than you speak and show appreciation for shared stories.

*   **Dress Code:**
    *   Wear modest, culturally appropriate clothing.
    *   Comfortable walking shoes are essential, as tours involve walking.
    *   Bring a hat or umbrella for sun protection.
    *   Avoid revealing or inappropriate attire.
    *   Consider weather conditions when planning your outfit.

*   **Photography & Media:**
    *   Always obtain explicit permission before photographing individuals.
    *   Absolutely no photos of government or security facilities.
    *   Respect ''no photography'' zones.
    *   Be mindful of context when sharing photos and consider privacy implications.

*   **Health & Safety:**
    *   Bring sufficient water and stay hydrated.
    *   Use sunscreen and insect repellent.
    *   Follow your guide''s safety instructions at all times.
    *   Keep valuables secure and be aware of your surroundings.

*   **Practical Tips & Prohibitions:**
    *   Bring valid identification and any required permits.
    *   Arrive 15 minutes before your scheduled tour.
    *   Save important contact numbers, including your guide''s.
    *   Bring local currency (Malawian Kwacha) for any purchases or donations.
    *   **Do not** make promises you cannot keep.
    *   **Do not** give money to individuals directly.
    *   **Do not** ignore cultural customs.
    *   **Do not** share sensitive information.
    *   **Do not** wander off alone.',
 'https://services.dzaleka.com/visit/guidelines/', 15, 21, true),

-- Services
('Available Services & Organizations', 
 'Overview of the key services and organizations operating within Dzaleka.', 
 'Services',
 'The Dzaleka Online Services platform hosts a comprehensive directory of over 100 verified organizations that provide a wide array of essential services within Dzaleka Refugee Camp. This directory is meticulously categorized to facilitate easy access and covers critical areas such as healthcare, education, legal support, and various business initiatives. It serves as a vital resource, effectively connecting community members with the support they need and showcasing the robust network of aid and development that thrives within the camp.

The services listed span numerous crucial categories, including Advocacy, Community & Humanitarian, Cultural & Arts, Education, Entrepreneurship & Business, Faith-Based Development, Government Services, Health, Media & Communication, Non-profit Organizations, Religious Organizations, Sports & Fitness, Technology & Digital, Wellness & Healing, and Youth & Children. Prominent examples of featured services include Adai Circle, which empowers individuals with AI/ML skills; BloomBox Design Labs, dedicated to sustainable education design; Corneille Orphanage, providing essential care for orphaned children; and DHL, offering vital shipping services to the community.

All services featured in the directory undergo a rigorous review process to ensure they meet established quality standards and are actively serving the community, thereby highlighting a strong commitment to impact and reliability. The platform explicitly emphasizes that these services directly support the Dzaleka community by providing essential resources and fostering numerous opportunities. New services are regularly added to the directory, ensuring it remains a dynamic and up-to-date resource for both residents seeking assistance and external partners looking to understand or engage with the camp''s extensive support infrastructure.',
 'https://services.dzaleka.com/services/', 25, 30, true),

('Public Document Repository', 
 'Guide to accessing public documents and resources.', 
 'Resources',
 'The Public Document Repository is a centralized resource for accessing important documents related to Dzaleka Refugee Camp. It serves as a transparent archive for reports, studies, community guidelines, and policy documents.

Key resources often include:
- Annual reports on camp demographics and development.
- Legal frameworks regarding refugee status in Malawi.
- Community meeting minutes and development plans.
- Educational materials and health guidelines distributed by NGOs.

Guides should be aware of this repository to direct visitors or researchers who need in-depth, official information that goes beyond the scope of a standard tour. It reinforces the commitment to transparency and information sharing within the community.',
 'https://services.dzaleka.com/resources/', 20, 31, false),

-- Culture
('Public Art Catalogue', 
 'Explore the murals, visual arts, and artists of Dzaleka.', 
 'Culture',
 'The Dzaleka Public Art & Visual Culture archive is an independent digital collection dedicated to celebrating and preserving the rich creative expression within Dzaleka Refugee Camp. This initiative showcases a diverse range of artworks, visual media, and cultural expressions, highlighting the resilience and talent of the camp''s artists. It serves as a testament to the vibrant artistic community that thrives despite challenging circumstances, offering a unique window into the lives and stories of its residents.

The catalogue features various artworks, including murals like the "Child/Early Marriage Awareness Mural," which convey important social messages. Beyond static art, the archive also spotlights individual artists and visual creators who contribute to Dzaleka''s visual culture. These artists, often refugees themselves, use their craft—be it fashion, photography, painting, or design—as a powerful means of self-expression, cultural preservation, and economic empowerment.

The platform encourages community contribution, inviting individuals to submit information about public artworks, visual media, and cultural expressions within Dzaleka. This includes details about the artist, location, and cultural significance, with guidelines provided for optimal photo submissions. The archive aims to document and celebrate this creative output, ensuring that the unique artistic heritage of Dzaleka is preserved and shared with a wider audience, fostering understanding and appreciation for the camp''s cultural landscape.',
 'https://services.dzaleka.com/public-art-catalogue/', 15, 40, true),

('Site Register', 
 'Key landmarks and important locations to include in tours.', 
 'Culture',
 'The Dzaleka Site Register is an invaluable resource designed to discover and explore the cultural, historical, and community locations that collectively shape the unique identity of Dzaleka Refugee Camp. This comprehensive register aims to meticulously document and highlight significant places within the camp, thereby providing crucial insights into its intricate infrastructure, essential services, and the daily life of its diverse residents. It serves as an indispensable guide for understanding the physical and social landscape that defines Dzaleka.

A prominent and critically important example listed within the register is the Dzaleka Health Centre. This facility stands as the primary healthcare provider for a substantial and diverse population, serving approximately 86,000 individuals. This figure includes 54,000 refugees and asylum-seekers residing within Dzaleka Refugee Camp, alongside an additional 32,000 local residents from the surrounding Dowa District. The inclusion of the Health Centre in the register profoundly underscores the vital role that essential services play within the camp''s overall infrastructure and its broader community impact.

The platform actively encourages community participation in the ongoing effort to document Dzaleka''s rich heritage by inviting individuals to submit information about cultural, historical, or community sites they deem significant. This collaborative approach is instrumental in building a comprehensive and accurate record of the camp''s important locations, ensuring that its unique identity and the profound significance of various sites are both preserved and made accessible to a wider audience. The Site Register is a dynamic and evolving project that continuously reflects the changing nature of the camp and its vibrant, developing community.',
 'https://services.dzaleka.com/site-register/', 15, 41, true),

('Dancers of Dzaleka', 
 'Overview of dance groups and their cultural significance.', 
 'Culture',
 'The "Dancers From Dzaleka" section vibrantly celebrates the rhythm, energy, and compelling stories of the exceptional dance talent flourishing within Dzaleka Refugee Camp. This dedicated platform proudly showcases a diverse array of dance groups and individual performers, highlighting their profound artistic contributions and the significant, multifaceted role that dance plays in community building, cultural preservation, and economic empowerment. It offers a captivating window into the rich and diverse cultural expressions that thrive with remarkable resilience within the camp.

The platform features a variety of prominent dance groups, each with its unique style and impact. These include the Fighters Dance Crew, renowned for their mastery of Afro Dance, Hip Hop, Contemporary, Cultural, and Acrobatic styles; the Forus Crew, recognized for their dynamic appearances in Malawian music videos; the Indengabaganizi Crew, a traditional Rwandese dance group preserving their heritage; the Shakers Dance Crew, who regularly perform at major festivals; and The Dreamers, who captivate audiences with their Afro, Hip Hop, and Cultural Dance performances. Additionally, the platform spotlights talented individual performers, such as Christian Lwaboshi Rubambiza ''Piniero,'' a professional dancer whose artistry is inspired by Michael Jackson, thereby showcasing the remarkable depth and breadth of talent present in Dzaleka.

Within Dzaleka, dance transcends mere entertainment; it serves as a powerful and essential medium for cultural preservation, actively keeping traditional dances alive while simultaneously embracing and integrating contemporary styles. Beyond its cultural significance, dance also creates vital economic opportunities for artists through performances, teaching engagements, and participation in cultural events, providing crucial income for many. Furthermore, dance acts as a profound unifying force, bringing people together through its universal language and fostering a strong sense of community, shared identity, and enduring hope among the camp''s residents.',
 'https://services.dzaleka.com/dancers/', 10, 42, false),

('Poets of Dzaleka', 
 'Introduction to the poets and spoken word artists.', 
 'Culture',
 'The "Poets From Dzaleka" section is a dedicated celebration of the profound literary talent and compelling spoken word artists residing within Dzaleka Refugee Camp, providing an essential platform for their unique voices, poignant stories, and powerful poetry. This initiative vividly highlights how poetry serves as an incredibly potent medium for self-expression, advocacy, cultural preservation, and emotional healing within the community. It offers a compelling glimpse into the intellectual and creative depth that flourishes among the camp''s residents, often against challenging backdrops.

The platform proudly features numerous poets from diverse national backgrounds, predominantly originating from the Democratic Republic of Congo, Rwanda, and Burundi. These gifted artists skillfully utilize poetry to address a wide spectrum of themes, including the pervasive issue of discrimination, the critical importance of gender equality, insights into African leadership, various pressing social issues, nuanced human behavior, and deeply personal feelings and experiences. Notable examples include AJ Peace Justice, a Rwandan poet who powerfully speaks out against discrimination; Amissi, a DRC poet who passionately advocates for gender equality through her verses; and Angela Abizera, a dedicated team leader for poetry who harnesses her art to inspire and uplift others.

Within Dzaleka, poetry functions as a crucial and resonant community voice, giving eloquent expression to the complex experiences and narratives of refugees. It significantly contributes to cultural expression by actively preserving heritage through both spoken and written word, ensuring that traditions and stories are not lost. Moreover, poetry plays an indispensable role in emotional healing, offering a vital means for individuals to process their profound experiences, find solace and comfort, and forge meaningful connections with others. The platform actively encourages engagement by allowing visitors to browse profiles of poets, book readings, and for poets themselves to add their profiles, thereby continuously enriching the vibrant literary landscape of Dzaleka.',
 'https://services.dzaleka.com/poets/', 10, 43, false),

('Visual Arts Community', 
 'Discover the visual arts community and their works.', 
 'Culture',
 'The Visual Arts Community in Dzaleka is a testament to the enduring human spirit to create beauty and meaning even in displacement. This module highlights the painters, photographers, and craftspeople who use visual media to document life in the camp, express personal emotions, and comment on social issues.

Key aspects include:
- **Painting & Drawing:** Many artists use canvas and local materials to create vibrant scenes of daily life, landscapes from their homelands, or abstract expressions of their journeys.
- **Photography:** A growing community of photographers documents the reality of the camp, moving beyond stereotypes to show the dignity, joy, and complexity of refugee life.
- **Crafts:** Traditional crafts from the diverse cultures within the camp (Congolese, Burundian, Rwandan) are preserved and adapted, creating unique items that blend heritage with the current environment.

Guides should encourage visitors to support these artists by purchasing their work or commissioning pieces, as art provides both psychological relief and essential economic support for many families.',
 'https://services.dzaleka.com/public-art-catalogue/visual-arts-community/', 10, 44, false),

-- Community
('Events in Dzaleka', 
 'Stay updated on current and upcoming events happening in Dzaleka.', 
 'Community',
 'Events in Dzaleka play a crucial role in maintaining social cohesion and morale. This module covers the types of events guides should be aware of:

- **Tumaini Festival:** The flagship annual event, attracting international visitors and artists. It is the world''s first music and arts festival hosted within a refugee camp.
- **Cultural Celebrations:** Specific days dedicated to the cultures of the DRC, Burundi, and Rwanda, featuring traditional food, dance, and music.
- **Sports Tournaments:** Football (soccer) is a major passion, with regular leagues and tournaments that draw large crowds and foster friendly competition between zones.
- **Religious Festivals:** With a diverse religious makeup, Christian and Muslim holidays are celebrated with community gatherings and services.

Guides should check the "Events" page regularly to inform visitors of any happenings during their tour, as these events offer the most authentic glimpses into community life.',
 'https://services.dzaleka.com/events/', 10, 50, true),

('Community Job Board', 
 'Understand the job opportunities available in the camp.', 
 'Community',
 'Economic independence is a major challenge and goal for residents. The Community Job Board reflects the internal economy of the camp. 

Guides should understand:
- **Common Jobs:** Teaching, translation, construction, tailoring, small business management, and roles within NGOs.
- **Challenges:** Legal restrictions often limit refugees'' ability to work outside the camp, making the internal job market vital.
- **Entrepreneurship:** Many residents create their own opportunities. Guides can highlight local businesses during tours (e.g., shops, restaurants, workshops) as examples of this entrepreneurial spirit.

Understanding the economic landscape helps guides explain the daily reality of residents who are striving to provide for their families despite legal and geographic constraints.',
 'https://services.dzaleka.com/jobs/', 10, 51, false),

('Skills Exchange', 
 'Learn about the skills exchange program connecting community members.', 
 'Community',
 'The Skills Exchange program represents the resourcefulness of the Dzaleka community. Since formal resources are limited, residents rely on each other to learn and grow.

- **Concept:** A barter system for knowledge. Someone who knows English might teach it in exchange for tailoring lessons. A carpenter might trade repairs for computer literacy classes.
- **Significance:** This fosters a sense of agency and interdependence. It shows that everyone has something of value to contribute, regardless of their material wealth.
- **Examples:** Language clubs, coding bootcamps (like TakenoLAB), and vocational workshops are often community-led.

Guides should use this to illustrate the "wealth" of knowledge present in the camp, countering the narrative of refugees as solely dependent on aid.',
 'https://services.dzaleka.com/skills-exchange/', 10, 52, false)

ON CONFLICT DO NOTHING;

-- Disable RLS for these tables (backend handles auth)
ALTER TABLE training_modules DISABLE ROW LEVEL SECURITY;
ALTER TABLE guide_training_progress DISABLE ROW LEVEL SECURITY;