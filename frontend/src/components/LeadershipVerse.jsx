import React, { useState, useEffect } from 'react';

const leadershipVerses = [
  {
    verse: "For even the Son of Man came not to be served but to serve, and to give his life as a ransom for many.",
    reference: "Mark 10:45",
    theme: "servant leadership"
  },
  {
    verse: "Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.",
    reference: "Joshua 1:9",
    theme: "courage"
  },
  {
    verse: "The Lord is my shepherd, I lack nothing. He makes me lie down in green pastures, he leads me beside quiet waters, he refreshes my soul.",
    reference: "Psalm 23:1-3",
    theme: "guidance"
  },
  {
    verse: "But among you it will be different. Whoever wants to be a leader among you must be your servant.",
    reference: "Matthew 20:26",
    theme: "servant leadership"
  },
  {
    verse: "And we know that in all things God works for the good of those who love him, who have been called according to his purpose.",
    reference: "Romans 8:28",
    theme: "purpose"
  },
  {
    verse: "Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.",
    reference: "Proverbs 3:5-6",
    theme: "trust"
  },
  {
    verse: "I can do all this through him who gives me strength.",
    reference: "Philippians 4:13",
    theme: "strength"
  },
  {
    verse: "Let us not become weary in doing good, for at the proper time we will reap a harvest if we do not give up.",
    reference: "Galatians 6:9",
    theme: "perseverance"
  },
  {
    verse: "But the fruit of the Spirit is love, joy, peace, forbearance, kindness, goodness, faithfulness, gentleness and self-control.",
    reference: "Galatians 5:22-23",
    theme: "character"
  },
  {
    verse: "Therefore, my dear brothers and sisters, stand firm. Let nothing move you. Always give yourselves fully to the work of the Lord, because you know that your labor in the Lord is not in vain.",
    reference: "1 Corinthians 15:58",
    theme: "dedication"
  },
  {
    verse: "And whatever you do, whether in word or deed, do it all in the name of the Lord Jesus, giving thanks to God the Father through him.",
    reference: "Colossians 3:17",
    theme: "excellence"
  },
  {
    verse: "But you are a chosen people, a royal priesthood, a holy nation, God's special possession, that you may declare the praises of him who called you out of darkness into his wonderful light.",
    reference: "1 Peter 2:9",
    theme: "identity"
  },
  {
    verse: "For we are God's handiwork, created in Christ Jesus to do good works, which God prepared in advance for us to do.",
    reference: "Ephesians 2:10",
    theme: "purpose"
  },
  {
    verse: "But the Lord said to Samuel, 'Do not consider his appearance or his height, for I have rejected him. The Lord does not look at the things people look at. People look at the outward appearance, but the Lord looks at the heart.'",
    reference: "1 Samuel 16:7",
    theme: "character"
  },
  {
    verse: "Therefore, as God's chosen people, holy and dearly loved, clothe yourselves with compassion, kindness, humility, gentleness and patience.",
    reference: "Colossians 3:12",
    theme: "virtues"
  },
  {
    verse: "Whoever wants to be first must be the very last, and the servant of all.",
    reference: "Mark 9:35",
    theme: "servant leadership"
  },
  {
    verse: "The fear of the Lord is the beginning of wisdom, and knowledge of the Holy One is understanding.",
    reference: "Proverbs 9:10",
    theme: "wisdom"
  },
  {
    verse: "But as for you, be strong and do not give up, for your work will be rewarded.",
    reference: "2 Chronicles 15:7",
    theme: "perseverance"
  },
  {
    verse: "Let your light shine before others, that they may see your good deeds and glorify your Father in heaven.",
    reference: "Matthew 5:16",
    theme: "witness"
  },
  {
    verse: "Do nothing out of selfish ambition or vain conceit. Rather, in humility value others above yourselves.",
    reference: "Philippians 2:3",
    theme: "humility"
  },
  {
    verse: "A new command I give you: Love one another. As I have loved you, so you must love one another.",
    reference: "John 13:34",
    theme: "love"
  },
  {
    verse: "Be completely humble and gentle; be patient, bearing with one another in love.",
    reference: "Ephesians 4:2",
    theme: "unity"
  },
  {
    verse: "For where two or three gather in my name, there am I with them.",
    reference: "Matthew 18:20",
    theme: "community"
  },
  {
    verse: "But seek first his kingdom and his righteousness, and all these things will be given to you as well.",
    reference: "Matthew 6:33",
    theme: "priorities"
  },
  {
    verse: "The Lord is my strength and my shield; my heart trusts in him, and he helps me.",
    reference: "Psalm 28:7",
    theme: "trust"
  },
  {
    verse: "Come to me, all you who are weary and burdened, and I will give you rest.",
    reference: "Matthew 11:28",
    theme: "rest"
  },
  {
    verse: "But those who hope in the Lord will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint.",
    reference: "Isaiah 40:31",
    theme: "hope"
  },
  {
    verse: "For God gave us a spirit not of fear but of power and love and self-control.",
    reference: "2 Timothy 1:7",
    theme: "courage"
  },
  {
    verse: "And let us consider how we may spur one another on toward love and good deeds.",
    reference: "Hebrews 10:24",
    theme: "encouragement"
  },
  {
    verse: "The Lord is good, a refuge in times of trouble. He cares for those who trust in him.",
    reference: "Nahum 1:7",
    theme: "refuge"
  },
  {
    verse: "But the wisdom that comes from heaven is first of all pure; then peace-loving, considerate, submissive, full of mercy and good fruit, impartial and sincere.",
    reference: "James 3:17",
    theme: "wisdom"
  },
  {
    verse: "Rejoice always, pray continually, give thanks in all circumstances; for this is God's will for you in Christ Jesus.",
    reference: "1 Thessalonians 5:16-18",
    theme: "attitude"
  },
  {
    verse: "But you, keep your head in all situations, endure hardship, do the work of an evangelist, discharge all the duties of your ministry.",
    reference: "2 Timothy 4:5",
    theme: "ministry"
  },
  {
    verse: "And we know that the Son of God has come and has given us understanding, so that we may know him who is true.",
    reference: "1 John 5:20",
    theme: "understanding"
  },
  {
    verse: "But grow in the grace and knowledge of our Lord and Savior Jesus Christ. To him be glory both now and forever! Amen.",
    reference: "2 Peter 3:18",
    theme: "growth"
  },
  {
    verse: "The Lord is my rock, my fortress and my deliverer; my God is my rock, in whom I take refuge, my shield and the horn of my salvation, my stronghold.",
    reference: "Psalm 18:2",
    theme: "strength"
  },
  {
    verse: "But the Lord is faithful, and he will strengthen you and protect you from the evil one.",
    reference: "2 Thessalonians 3:3",
    theme: "faithfulness"
  },
  {
    verse: "For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future.",
    reference: "Jeremiah 29:11",
    theme: "hope"
  },
  {
    verse: "But as for me and my household, we will serve the Lord.",
    reference: "Joshua 24:15",
    theme: "commitment"
  },
  {
    verse: "But you will receive power when the Holy Spirit comes on you; and you will be my witnesses in Jerusalem, and in all Judea and Samaria, and to the ends of the earth.",
    reference: "Acts 1:8",
    theme: "mission"
  },
  {
    verse: "Therefore, since we are surrounded by such a great cloud of witnesses, let us throw off everything that hinders and the sin that so easily entangles. And let us run with perseverance the race marked out for us.",
    reference: "Hebrews 12:1",
    theme: "perseverance"
  },
  {
    verse: "And now these three remain: faith, hope and love. But the greatest of these is love.",
    reference: "1 Corinthians 13:13",
    theme: "love"
  },
  {
    verse: "Finally, brothers and sisters, whatever is true, whatever is noble, whatever is right, whatever is pure, whatever is lovely, whatever is admirable—if anything is excellent or praiseworthy—think about such things.",
    reference: "Philippians 4:8",
    theme: "mindset"
  },
  {
    verse: "But the Lord is my portion and my cup; you have made my lot secure. The boundary lines have fallen for me in pleasant places; surely I have a delightful inheritance.",
    reference: "Psalm 16:5-6",
    theme: "contentment"
  },
  {
    verse: "For the Lord gives wisdom; from his mouth come knowledge and understanding.",
    reference: "Proverbs 2:6",
    theme: "wisdom"
  },
  {
    verse: "But you, Lord, are a shield around me, my glory, the One who lifts my head high.",
    reference: "Psalm 3:3",
    theme: "protection"
  },
  {
    verse: "But the Lord is righteous in all his ways and faithful in all he does.",
    reference: "Psalm 145:17",
    theme: "righteousness"
  },
  {
    verse: "For the Lord is good and his love endures forever; his faithfulness continues through all generations.",
    reference: "Psalm 100:5",
    theme: "faithfulness"
  },
  {
    verse: "But the Lord is near to all who call on him in truth.",
    reference: "Psalm 145:18",
    theme: "nearness"
  },
  {
    verse: "For the Lord watches over the way of the righteous, but the way of the wicked leads to destruction.",
    reference: "Psalm 1:6",
    theme: "guidance"
  },
  {
    verse: "But the Lord is faithful, and he will strengthen you and protect you from the evil one.",
    reference: "2 Thessalonians 3:3",
    theme: "faithfulness"
  },
  {
    verse: "For the Lord your God is with you wherever you go.",
    reference: "Joshua 1:9",
    theme: "presence"
  }
];

export default function LeadershipVerse() {
  const [currentVerse, setCurrentVerse] = useState(null);

  useEffect(() => {
    // Select a random verse on every page load
    const randomIndex = Math.floor(Math.random() * leadershipVerses.length);
    setCurrentVerse(leadershipVerses[randomIndex]);
  }, []);

  if (!currentVerse) {
    return (
      <div className="text-center py-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2 mx-auto max-w-2xl"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center py-4">
      <blockquote className="text-lg text-gray-700 dark:text-gray-300 italic mb-2 leading-relaxed max-w-3xl mx-auto">
        "{currentVerse.verse}"
      </blockquote>
      <cite className="text-sm text-gray-500 dark:text-gray-400 font-medium">
        — {currentVerse.reference}
      </cite>
    </div>
  );
} 