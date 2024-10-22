import { competenciesWithIncidactors, feedback } from "@/lib/types";
import { ChatPromptTemplate } from "@langchain/core/prompts";
// import { Ollama } from 'ollama'
//
import { Ollama, OllamaEmbeddings } from "@langchain/ollama";
// https://js.langchain.com/v0.2/docs/how_to/recursive_text_splitter/
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { createRetrievalChain } from "langchain/chains/retrieval";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { createContext, PropsWithChildren, useEffect } from "react";

const ollamaBaseUrl = "http://localhost:11434"; // Default value

const llm = new Ollama({
  baseUrl: ollamaBaseUrl,
  model: "llama3.1",
  numCtx: 1000,
  format: "json",
});

const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 500,
  chunkOverlap: 20,
});
const competencies = competenciesWithIncidactors.map((competency) => {
  let text = ``;
  text += `# Competency: ${competency.name.replaceAll("-", " ")} (${competency.abbreviation})`;
  text += `\n`;
  text += competency.description;
  text += `\n\n`;

  competency.indicators.forEach((indicator) => {
    text += `## Indicator: ${indicator.name}`;
    text += `\n`;
    text += indicator.description;
    text += `\n\n`;

    text += `### Expectations`;
    text += `\n`;
    text += indicator.expectations;
    text += `\n\n`;

    text += `### Grading`;
    text += `\n\n`;

    indicator.grades.forEach((grade) => {
      text += `#### Grade: ${grade.grade}`;
      text += `\n`;

      grade.expectations.forEach((expectation) => {
        text += `- ${expectation}`;
        text += `\n`;
      });
      text += `\n`;
    });
  });

  console.log(text);
  return text;
});

const LlmContext = createContext({});

export function LlmProvider(props: PropsWithChildren) {
  useEffect(() => {
    async function invoke() {
      const start = new Date().getTime();
      const studentInput = `Overview
      In this project, our goal is to design an experimental interactive prototype for our client, ARCAM (Architecture center of Amsterdam)
      about the future of the Haven Stad.
      Haven Stad (Harbor town) is currently an industrial area in Amsterdam that will be transformed to a new urban development in the
      coming decades. The energy transition will be important to consider due to the transformation from port to the work and residential
      area. The client asked us to design a prototype to engage the future inhabitants of the Haven Stad to help them imagine a greener
      life according to energy transition in the Haven Stad. We want to make people start conversation and feel involved. They also
      asked us to have some data collection at the end of this installation that can be used by urban planners and architects in the future.

      Framing the problem
      On the first day of our project, we visited the ARCAM office. They gave presentations to explain their goals and what they had
      achieved so far. They had installations there
      (Modelstad Haven-Stad &Mdash; Arcam, 2023)
      : one was a model of the Haven Stad area with a screen showing data about it. However, most of the information was in maps,
      which weren't easy for everyone to understand, and the videos were in Dutch. Another installation allowed people to shape a
      bridge, but it wasn't interactive and didn't provide much insight.
      We noticed they also wanted to gather data from visitor's experience, but they didn't have any system for it. So, we decided to
      design something that addresses all these issues. From our visit, we realized we needed to design something that:
      • Engages more users and involves them actively.
      • Provides users with clear information, avoiding language barriers.
      • Collects data from visitors' interactions.
      • Can be installed not only at ARCAM but also in other public exhibitions.

      ARCAM's installation about Haven_Stad

      FS1

      The final design
      Our final design is an installation which makes audiences experience packing their habits and moving to live in the future of Haven
      Stad as a sustainable person. We used the analogy of checking-in for air travel and measuring your carbon footprint baggage, as
      well as making that visible to others.
      We designed three stages in the flow.
      At the first stage we provide some boxes with varied sizes and weights and each box symbolize a habit and its size and weight
      are set according to the carbon emission that the habit would have. We give users a transparent bag and a passport and ask them
      to pack their bags with the habits they need in the future according to their lifestyle.
      The second stage is where the conversation starts, people walk with their transparent bags through the exhibition and talk to each
      other about what they packed, and they might even exchange their habits with each other.
      In the third stage, audiences approach a gate like an airport security check, where we weigh and scan their bags to see if they can
      live in future Haven Stad. An interactive screen displays their packed items and the carbon footprint of their habits. They can pass
      only if their carbon budget is below the limit for a sustainable person in Europe. We place stickers in their passports
      (rejected/approved) and add icons of their packed habits. If rejected, they must repack and try again. The passports also contain
      tips to help them change their habits.
      We used familiar travel and airport conventions, such as passports, gates, and packing protocols, to create a relatable and
      predictable experience. Just like preparing for a flight, participants "pack" their habits for a sustainable future. This analogy helps
      users easily understand the concept of evaluating and measuring their carbon footprint, encouraging thoughtful decisions and
      discussions as they move through the installation.

      Our installation in Feedback feast at MDD

      RA1
      FS1

      CC3

      Visit Arcam
      Design Process

      Visit
      Haven Stad

      Study of
      stake holders

      Research and
      Study similar projects

      Ideation Presenting at Arcam
      and getting feedbacks

      More research
      (card sorting and
      user testing)

      Making Presenting at
      feedback feast

      Next Iteration

      CI1

      Framing

      Outcome*
      Designing an
      installation
      Airport Analog

      Visitors as future
      inhabitants
      passport

      List of the
      main values

      Engage users
      Immersive
      Experience

      *These are just some of the outcomes from each step; there are definitely more that contribute to the overall design.

      FS1

      How could we design in the future playground?
      Marije showed us a video (Near Future Laboratory, 2022)
      about design fiction, which involves creating tangible prototypes of possible near futures to understand the
      consequences of decisions. The video explained that imagining the future is challenging because it often feels
      like fantasy. Design fiction, similar to archaeology, uses ordinary objects to visualize future insights, making it
      more realistic. Archaeologists piece together narratives from fragments of the past, and design fiction does the
      same for the future. In our project, we applied this by considering current habits and predicting which ones
      might continue, such as air travel in the next 20 years.
      FS1

      RA1 Role of our Design in Energy Transition
      Our project is closely connected to the context of energy transition, which is a key part of the redevelopment of
      Amsterdam's Haven Stad. This project focuses on the important change from a traditional industrial area to a more
      sustainable urban environment, where using energy efficiently and reducing carbon footprints are very important. Our
      design aims to involve future residents in this transition, helping them to think about and adopt sustainable lifestyles. By
      creating an interactive prototype that shows how different habits impact carbon emissions, the project relates directly
      to the energy transition, highlighting the real choices people need to make to live more sustainably.
      We reflect on the difficulties of explaining the importance of energy transition to a wide range of people, ensuring that
      our design not only educates but also motivates change.
      For example, we looked at the "Museum of the Future" in Dubai, which uses interactive exhibits to engage visitors with
      ideas about sustainability and future technologies. This example shows how immersive experiences can make
      complex ideas like energy transition easier to understand and more engaging, which supports and improves our
      design in this project.
      Moreover, the project helps create a community culture focused on sustainability. When people become more aware
      of their environmental impact and have tools to reduce it, they are more likely to support policies and actions that
      promote energy transition. This change in culture is very important because technical solutions alone cannot reach the
      high goals needed to lower carbon emissions. Our project, therefore, acts as a spark for change, encouraging
      people to take part in the global movement towards a low-carbon economy and serving as an example for other
      urban areas to follow.

      Where is haven stad? Let's go there and check!
      As most of us were new in the Amsterdam and did not have a clear picture about that place in our minds, we
      decided to start the process with visiting the site . Our goal in this walk was:
      • Understand the layout of the area.
      • Possibly talk to current residents to get their opinions about the project.
      • Observe how new developments are emerging within the old layout and identify specific characteristics of
      the new development.
      Since the development is still in its early stages, we cannot yet observe the changes. However, we could
      somehow distinguish the expected changes, which allowed us to make predictions about what will happen (we
      tried to use design fiction here).

      Our site viewing in the haven stad

      FS1
      FS3

      Design process
      After doing some initial researches and exploring on the resources
      that Marije put in Miro file, we decided to list down our stake
      holders.
      We aim to understand the needs, expectations, and requirements of
      various stakeholders to ensure the design aligns with their goals and
      preferences. One of our main stake holders are future inhabitants.
      For finding our values, we set a time and ask each of our team
      members to write down their values for this project. At the end we
      talked about each value and find the common values between us.
      Our key values were:
      • Community
      • Inspiring sustainability
      • Communication
      • Prototype Functionality
      • Scalability and Adaptability
      We also had some BONUS VALUES like:
      Long-term Engagement, Excitement, Accountability
      To make sure our project matched important values, we compared
      our values with those of our stakeholders to find where they overlap.
      We did this after talking with Susanne van Mulken from "Informaat"
      our agency. She explained how they look at both the company and
      its customers to understand these values.

      Stake holders Direct/indirect How they were considered
      ARCAM Direct We had a session with them and asked about their values and check what they need to present in their studio

      rather than their own installation.

      Future inhabitants Direct Our main users were future inhabitants, and we made our prototype for them. We made people to feel involved

      and try to be a potential future inhabitant by having better choices.

      Researchers Direct All the data that we gathered at the end of the installation is helpful for researchers, especially in the field of
      energy transitions and urban planning. They also can use the installation where ever they need to complete their
      research.

      Government planners
      Utility providers

      Direct All the data that we gathered at the end of the installation is helpful for government planners, decision makers and

      utility providers. They can use these data in their new decision about the haven stad.

      Ecosystem Direct In this experience that we designed; we encourage people to think about their bad habits and try to change them
      in a way that helps the ecosystem as well. In general, Energy transition has pros and cons for ecosystems. Wind
      turbines can be hazardous to birds, and large solar farms can alter land use and affect local flora and fauna.
      While crucial for long-term environmental health, it requires careful planning to minimize its ecological footprint
      and ensure the benefits outweigh the drawbacks. Balancing the need for clean energy with ecosystem
      preservation is essential for sustainable development.

      GVB/NS (public transportation) Indirect In our data collection, we provide these companies how many people prefer to give up their personal cars and

      use public transportation instead. They can use this data in their plans.

      Franchises Indirect In our data collection, we get some data about desire of people for buying groceries online and using plastic bag

      for their shopping or not . These information can be useful for franchises plans in the future.

      FS2

      Stake holder mapping table

      RA2

      CI1

      FS3
      Discarded ideas*

      1. In this setup, individuals initially reflect on what
      they'd like to change and incorporate into their lifestyles in
      the future, as well as suggestions for improving
      Havenstad. Then, they submit their choices by pressing a
      button. On the next wall, a printer generates AI-rendered
      images depicting the future of Havenstad based on their
      selections. However, this idea didn't proceed because it
      focused too much on individual preferences and didn't
      encourage dialogue among people.

      2. In this setup, there's an interactive table featuring a map
      of Havenstad and two boxes containing solar panels and
      windmills. Participants can place these renewable energy

      sources on the map and observe the effects on a semi-
      transparent globe representing Havenstad's energy core.

      However, we didn't pursue this idea further due to technical
      complexities and because it didn't align with our core values,
      particularly fostering communication among people.

      3. We got inspired from the "string labyrinth" team-building activity, We designed a game where teams
      moved an "energy core" ball to zones labeled with concepts like "car-free neighborhood" and "communal
      launderette." The goal was to fill the core within a minute by strategically placing it in these zones. However,
      after development and testing, we realized it didn't effectively communicate our intended message, so we
      decided to abandon it late in the project..

      Credit system
      We discarded concepts by engaging in
      group discussions and evaluating ideas
      against our core values. Each member
      contributed to the evaluation process by
      completing an assessment card, and we
      made final decisions based on the ratings
      recorded on those cards.

      CI2

      Sketch by me

      Testing the concept with our classmates

      Screenshot from YouTube Sketch by Valla

      Example of a rating cards filled by a teammate

      *Absolutely, there were more ideas, but they weren't developed enough to qualify for the credit system.

      Design decisions

      Airport analogy:
      We turned our attention to the concept of "moving" or
      "packing to move," representing the necessity for every future
      resident to first relocate to HavenStad. Through this metaphor,
      we emphasized unsustainable habits by illustrating the burden
      of "unsustainable habits" they bring with them.

      Transparent luggage:
      The idea for transparent luggage came from our values,
      aiming to get people talking and create a sense of community.
      With transparent luggage, movers can show their choices to
      their future neighbors, sparking conversations like, "I'll leave
      my car if you carpool." This idea was born from a chat with
      Arjen from the development team, who reminded us that
      change is inevitable and we need to embrace new habits.

      Habits:
      According to the "Creative Research" workshop we attended, we decided to conduct a card sorting research to
      determine the priorities and opinions of people regarding sustainable habits that we intend to incorporate into our project.
      Priyanka and I chose to visit a public library to engage with individuals of various age. We invited people to sort cards
      from most sustainable to least sustainable and arranging them based on priority. We also provided empty cards,
      encouraging participants to suggest additional habits we might have overlooked. Working with different participants, we
      obtained diverse results that offered valuable insights.
      The findings from our card-sorting user research show that people of different age have different views on sustainability.
      This emphasizes how important it is to think about everyone's preferences when making the interactive installation. Doing
      this could make the installation more enjoyable for everyone and help bring the community together.
      We aimed to consider our stakeholders when selecting habits, hoping to gather information that could be useful for them
      as well. For example, we looked at the habit of using plastic bags, which could help franchises create plans to sell
      reusable bags that align with customers' preferences.
      Later we selected the most tangible and relatable habits. Through collaboration with the design experts at ARCAM, we
      developed a list of habits. We then refined this list by identifying and selecting the common habits to form our final list.

      FS3
      CI1

      AI generated photo

      RA2

      CC1

      FS2

      our card sorting research

      AI generated photo

      Design decisions
      Weights:
      (Carbon footprint)
      We learned that carbon emissions are measured by weight. We used this as a scale to create boxes with varying weights, allowing
      participants to physically feel the impact of each habit.
      My teammate, Valla talked to Luis, as they have projects related to carbon emission in their playground and he gave us this:
      " The maximum amount of CO2 a person should generate per year to stop climate change is 0.600 tCO2".
      We consider this amount as our carbon budget . So, if a person had more could not pass the gate and be future resident of
      Haven_stad.
      We did the research and found the carbon footprint of each habits, then we tried to figure out how to make them doable for us.
      We decided to fill the boxes with sand because it gave us the right weight, and it was sustainable, easy and affordable to use. We
      easily weighed the sand and transferred it to each box. at the end, we had boxes with different weights, which still met our goal. We
      designed and printed some stickers for the boxes to display their names and icons prominently.

      • (Consumption of Meat, Dairy, Fish and Seafood, n.d.)
      • (Ecommerce Europe, 2024)
      • (Du Plessis, Martin & Eeden, Joubert & Goedhals-Gerber, Leila. (2022))

      FS3
      CC1
      CC2

      Photos of me making boxes

      Carbon budgets help governments, cities, and companies reduce greenhouse gas emissions by setting
      clear targets and limits.
      They make it easier to measure and track progress in fighting climate change.
      Urban planning, corporate strategies, and transportation projects often use carbon budgets to meet
      climate goals. Countries, like the UK, set legally binding carbon budgets that define the maximum
      amount of greenhouse gases they can emit over a five-year period.
      Also Companies like Tesla design their cars with a focus on reducing lifetime emissions, not just during
      use but also during manufacturing and end-of-life recycling.
      CC3

      CI1

      The digital platform:
      For our design, we needed a platform that serves both the airport officer
      handling the check-in and the future passengers. This platform should
      allow passengers to view the process, track the weight of their luggage,
      see the results, and receive personalized tips based on their choices.
      We used Figma to create an interactive prototype of our website. We used
      variables to mimic real-life interactions, by defining variables to store and
      manage user inputs and selections, we made the design more dynamic
      and engaging, closely resembling a live website.
      CC1
      CC2

      High fidelity mockups of our screen

      The photos we took of the bags during the third stage of data
      gathering were anonymized to ensure that users feel secure
      and their privacy is protected.

      CI1 Designing the flow of the installation
      We designed our flow and wrote down the GOALS and ACTIONS in each steps.

      RA2

      Design decisions
      Passport:
      Talking to one of the alumni who met us during the process made us familiar with the 5Es experience model. I read about it and understand that one of the main parts
      of this model is the extension, which gives the user something to take home and remember the experience. It helps them reflect on the effect that the experience has on
      them. So, we decided to create the passport.
      Our goal to make a passport for the extension was to create an experience that evokes the feeling of airports . We included an (Approved/Denied) sticker in the
      passport to indicate their status for entering the haven Stad. Additionally, we aim to raise awareness about the carbon footprint of various habits and provide tips for
      making lifestyle changes toward sustainability. We put stickers in the passport to remind them of their choices. That way, they can remember our installation and think
      about their lifestyle later.
      I was responsible for the visual design of the passport and I used these conventions for the design:
      Hierarchy, White Space, Tone of Voice, Define the Goal
      Users were excited about the passport, and they told us that they will keep the passport with themselves.
      I redesigned the passport in the afterlife for these reasons:
      • The text at the end of the passport (tips for having less carbon footprint) was small and unreadable.
      • The process of making of it was time consuming because of the separate pages.
      • The colors and design were not aligned with the branding of our project

      FS3
      CC1
      CC2

      Visitors were excited about having a passport (Sontag, 2023) Stickers on the passport the new passport and its ideation mock up
      CC3

      User Testing
      After having the idea of packing habits, we conducted a user test to observe reactions to packing
      habits with a 5KG weight limit.
      The observations of this test were:
      • The process of physically packing was easy for them and the challenge was at deciding what
      to pick. (Prototype Functionality)
      • The users were shocked about the carbon footprint of some habits like using air travel in
      comparison to other habits .(Inspiring sustainability)
      • I asked two users to sit next to each other and pack and then I saw that conversation
      happened! they were talking about eating meat (Community )
      • The size of the boxes were not challenging at all. it fits the bag easily ( Prototype Functionality)
      This user testing helps us to have some new design decisions, for example, we decided to make the
      boxes in a way that the size of the habits become also a challenge for packing (technical changes).
      We also found out that most of our design decisions were working well with users.
      FS3

      user testing with my classmates

      CI1

      Feedback feast
      We presented our idea at the MDD exhibition during the Feedback
      Feast and received helpful feedback from the visitors. They were excited
      about their experience and were surprised by the results. I observed
      conversations happening between the users, during which they
      discussed their habits and how they could adopt a more sustainable
      lifestyle.
      After reviewing the feedback, we understood that:
      • We failed to discuss energy transition. We must show the impact
      of unsustainable habits.
      • We need to speed up the entire process.
      • We should make the passport more helpful.

      Photos of feedback feast

      CI2
      FS3

      Similar Project!
      RA3
      The Empathy Museum
      The Empathy Museum is a group of art projects that help people understand and feel empathy through hands-on experiences. One of its main projects, called "A Mile
      in My Shoes," invites visitors to wear someone else's shoes while listening to a recording of that person's life story. This unique approach creates a personal connection
      and helps visitors understand different life experiences. The project also involves local communities, where people can share their own shoes and stories, making it a
      community effort to build empathy. Additionally, the museum collects feedback from visitors to assess how the experience impacts their perceptions and levels of
      empathy.
      Similarity to Nexthaven:
      • Immersive Experience: Both projects use physical participation to create an impactful learning experience.
      • Personal Connection: The Empathy Museum connects participants with individual stories, similar to how Nexthaven might connect future residents with their
      potential new environment.
      • Facilitation of Dialogue: Encourages conversation and reflection, much like the community engagement aspect of Nexthaven.
      • Data Gathering: Collects visitor feedback to measure the emotional and educational impact.
      Website: The Empathy Museum
      These projects emphasize the power of physical and immersive experiences in fostering understanding and empathy, much like Nexthaven's approach to engaging
      future residents and stakeholders through interactive and experiential means.
      I think this project was more successful in engaging users because it evoked emotional responses. If we have another opportunity to improve our project, we could
      explore ways to make it more emotionally impactful, such as showing participants the future results and consequences of their choices. In my opinion, projects that

      involve physical and hands-on experiences tend to have a stronger effect on users than those that simply involve reading or using an app. Research shows that hands-
      on experiences are more beneficial for learning, especially for children, and the same applies here.

      But is it ethical to evoke users emotions in our designs?
      Using emotions in design can be ethical if it is done to improve the user experience or create a meaningful connection. Don Norman (2003) explains that engaging
      users' emotions can make interactions with products more enjoyable and memorable. However, it is important to do this ethically by being transparent and respecting
      users' choices. If emotions are used to manipulate or deceive users, it can be harmful and damage trust. Aarron Walter (2011) also highlights the importance of
      considering the user's well-being. Overall, ethical emotional design should focus on benefiting the user and not just achieving the designer's goals.
      RA2

      Photos from Empathy museum website

      My reflections about this project:
      We wanted people to think about their habits and how they affect the environment. This is
      important because it helps us all take better care of the planet for now and for the future.
      Additionally, our exhibition is all about bringing people together. We want everyone to feel
      included and to talk openly about their habits . This way, we can understand each other better
      and work together to solve bigger problems.
      This reflects a social ethical perspective that values community, collaboration, and mutual
      understanding by including everyone in the conversation, better and more ethical solutions to
      global problems can be developed.
      This can be related to the ideas of communitarian ethics, which emphasize the importance of
      community and collective responsibility. (Selznick, P ,2002)
      Communitarian ethics is a way of thinking that focuses on the importance of community and
      working together, rather than just focusing on individual needs. It believes that people are closely
      connected to their communities, and that decisions should be made with the well-being of the
      whole community in mind.
      Our installation also gets people thinking about their actions. By giving feedback through
      passports, we help them make changes toward a greener lifestyle.
      RA2 CI3 How my perspective has changed :

      In architecture, my design process was usually straightforward. I would start with an idea, then make sketches,
      build models, and finally create detailed plans. The focus was on making a finished product that met the client’s
      needs or followed the rules. Once I chose a design direction, there wasn’t much chance to change it. However, in
      digital design, the process is different. It’s more like a cycle where I keep going back to improve my ideas based
      on testing, feedback, and new information. This way of working allows for more creativity and focuses on the
      user’s needs. I’ve learned that being flexible and able to adapt is important because the best designs often come
      from making many changes along the way.
      Before joining the MDD program, for example, during my Bachelor's in Architecture, the focus was heavily on the
      final design rather than the process. The assessors rarely asked us about our design thinking or the steps we took
      to reach our final product. I’m not sure if this was specific to the architecture field, but now I realize how crucial
      the design process truly is.
      In the MDD program, I discovered that the design process is even more important than the final result. It allows us
      to revisit and refine our work, improving the overall design. Additionally, this emphasis on process helps us learn
      more deeply and prepares us for future challenges.
      Before, I believed that a prototype should be well-designed and flawless, but now I understand that perfection is
      not what’s important at this stage. In our first project, I learned that when creating a prototype, it’s not efficient to
      spend too much time on something that isn’t working or that you’re unsure how to proceed with. A prototype is
      simply a tool to showcase your concept and test it. If you encounter difficulties, it’s better to change your
      approach or tools to quickly create a functional prototype.
      I used to feel uncomfortable with uncertainty in the design process. I wanted clear guidelines and a fixed plan to
      follow, which made me hesitant to try new things or change direction once a project was underway. However, in
      the third project, I understood that not knowing all the answers upfront is okay and that exploring different
      possibilities can lead to more innovative and creative solutions. This mindset has helped me become more
      adaptable and resilient in my design work.
      In the future, I plan to continue embracing flexibility and adaptability, applying these lessons to create designs
      that are not only effective but also continuously evolving to meet the needs of users.

      Next Iteration
      Based on the feedback we received, we began refining the design at every stage. The new
      iteration was:
      Packing:
      An audio-visual guide should be provided to explain the concept and give instructions on how to
      pack.
      Pre Check-in:
      It's risky to rely on a conversation at this stage, as it depends too much on the exhibition setup.
      Therefore, it’s better to move this discussion to the end of the experience.
      Check-in:
      We should streamline this process by offering a self check-in option. Visitors should be able to
      weigh their own luggage and receive their “pass” directly.
      Gateway:
      A responsive gateway should be installed that indicates self check-in status with lights, turning
      green when the visitor receives their “pass.
      Haven-Stad:
      We should build a dome where a short film is projected for visitors. As the group enters, the film will
      explain how unsustainable habits can slow down the energy transition. Afterwards, visitors will be
      prompted to discuss and collectively decide which habits they are willing to let go of. This setup
      provides a more controlled environment for the conversation we want to facilitate.
      CC1

      CC3

      Scheck of our new idea by Valla

      RA2
      CC2

      References:
      • Modelstad Haven-Stad — Arcam. (2023, November 24). Arcam. https://arcam.nl/events/modelstad-haven-stad/
      • Near Future Laboratory. (2022, June 21). What is design fiction? [Video]. YouTube. https://www.youtube.com/watch?v=t_UT78JOauM
      • Consumption of meat, dairy, fish and seafood. (n.d.). European Environment Agency. https://www.eea.europa.eu/data-and-maps/indicators/13.2-development-in-consumption-of/assessment-1
      • Ecommerce Europe. (2024, February 13). Home - eCommerce Europe. Ecommerce Europe -. https://ecommerce-europe.eu/
      • Du Plessis, Martin & Eeden, Joubert & Goedhals-Gerber, Leila. (2022). The Carbon Footprint of Fruit Storage: A Case Study of the Energy and Emission Intensity of Cold Stores. Sustainability. 14. 1-22. 10.3390/su14137530.
      • Sontag, A. (2023, May 25). The 5E Experience design model - Theuxblog.com - medium. Medium. https://medium.com/
      • Norman, D. (2003). Emotional Design: Why We Love (or Hate) Everyday Things. Basic Books.
      • Walter, A. (2011). Designing for Emotion. A Book Apart.
      • Selznick, P. (2002). *The communitarian persuasion*. Woodrow Wilson Center Press.`;
      const splitDocs = await textSplitter.createDocuments([
        ...competencies,
        studentInput,
      ]);
      console.log("splitDocs", new Date().getTime() - start);

      const vectorStore = await MemoryVectorStore.fromDocuments(
        splitDocs,
        new OllamaEmbeddings({
          model: "mxbai-embed-large", // Default value
          // model: "snowflake-arctic-embed",
          // model: "snowflake-arctic-embed:110m",
          // model: "snowflake-arctic-embed:22m",
          // model: "nomic-embed-text",
          baseUrl: ollamaBaseUrl,
        }),
      );
      console.log("vectorStore", new Date().getTime() - start);

      const retriever = vectorStore.asRetriever();

      const systemTemplate = `
        # IDENTITY and PURPOSE
        You are acting as a assessor for the masters program of digital design.
        You internalize the competency you are grading as well as the indicators it consists of.
        You will give a grade (novice, competent, proficient, visionary) to each of the indicators.
        You will be giving constructive feedback on the students text for them to improve upon.

        # STEPS
        1. Internalise the indicators and the requirements to reach each level of grading
        2. Read thouroughly through the documents and find where in the grading matrix they fit
        3. Grade the student on the indicator with a novice, competent, proficient or visionary
        4. Think of constructive feedback, positive aspects and areas for improvement

        # OUTPUT
        Please make sure to at least include "grade", "feedback", "positive_aspects" and "areas_for_improvement" attributes in your response.

        # Example output
        {{
          "grade": "novice",
          "feedback": "Your evolution, coming from a branding/advertising background but introducing a more “scientific” method has been super interesting to witness. We are glad that you have kept your fast intuitive decision making, but have also embraced the value of research, especially in non-commercial settings which require a different approach.",
          "positive_aspects": [
            "You have shown a commendable effort in pursuing your learning goals and relating them to your development. We appreciate the presentation that you have given us, and we think that it was a very strong example of self-directed learning. Your ethical standpoint clearly shines though.",
            "Your exploration of ideas, technologies, and communities relevant to your work is evident and purposeful. You have demonstrated a systematic approach, actively connecting your explorations to your project. We applaud the consolation with different businessowners, and visually impaired people really helped your project forward. Highlighting the impact of these explorations on your personal development and future goals could enhance your reflection and really put you on an advantage as a designer (pun intended).",
          ],
          "areas_for_improvement": [
            "What we would like you to explore after the MDD is larger team dynamics, this will help you into a role of art director (which we can see is suiting for you if you want it to)",
            "Actively engaging with stakeholders throughout the project helped your design process. However, a more exhaustive analysis of indirect stakeholders and unintended consequences could provide deeper insights. Overall, your comprehensive approach to stakeholder engagement strengthened the project's relevance and impact especially for the SDL and the Climbing project. We believe that you could have spent a little more time on creating a more nuanced view on the stakeholders. Not all people are likely to move to a new developed city part, it is often a subset of the City's population. With a more specific analysis you could have reached better design decisions."
          ]
        }}

        # CONTEXT",
        "Use the following pieces of retrieved context to help you give grades and provide feedback
        {context}

        # INPUT
        `;

      const prompt = ChatPromptTemplate.fromMessages([
        ["system", systemTemplate],
        ["human", "{input}"],
      ]);

      const questionAnswerChain = await createStuffDocumentsChain({
        llm,
        prompt,
      });
      console.log("questionAnswerChain", new Date().getTime() - start);

      const ragChain = await createRetrievalChain({
        retriever,
        combineDocsChain: questionAnswerChain,
      });
      console.log("ragChain", new Date().getTime() - start);
      const indicators = competenciesWithIncidactors.flatMap((competency) => {
        return competency.indicators.map((indicator) => indicator.name);
      });

      console.log(indicators);
      for (const indicator of indicators) {
        const query = `could you please grade and give feedback to the student for ${indicator}`;

        const result = await ragChain.invoke({ input: query });
        console.log(
          indicator,
          result.context,
          feedback.safeParse(JSON.parse(result.answer)).data,
        );
      }
    }

    invoke();
  }, []);

  return <LlmContext.Provider value={{}}>{props.children}</LlmContext.Provider>;
}
