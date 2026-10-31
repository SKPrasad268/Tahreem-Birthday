/* Display-only birthday punctuation. Asset filenames and sync-generated titles stay intact. */
(() => {
  'use strict';
  const key = value => value.replace(/\p{Extended_Pictographic}|\uFE0F|\u200D/gu, '').trim().toLowerCase();
  // User-approved display edits also apply to screenshot captions and the page picker.
  // Keep the original filenames available to the asset sync for its final-page ordering.
  const displayNames = new Map([
    ['Mere ke aage koi bol ska hai kya.....', 'Mere aage koi kuch bol skta hai kya..... 🎤😎'],
    ['I am a very very very Bad Friend ki Bday bhul jaata hu (Last.1)', 'I am a very very very Bad Friend ki Bday bhul jaata hu'],
    ['I apologise ab se nhi bhulunga☹️☹️ (Last 2)', 'I apologise ab se nhi bhulunga☹️☹️']
  ].map(([original, display]) => [key(original), display]));
  const selections = new Map(Object.entries({
    'sundar log': ['😎','✨'],
    'His Loss obviously': ['💅','😌'],
    'Big Goat with Small Goat': ['🐐','😎'],
    'No words (genuinely)': ['🤐','✨'],
    'Don aur Don ki right hand': ['😎','🤝'],
    'No words 2.0': ['🤐','🤌'],
    'Miss Truce-Mun': ['🕊️','🎤'],
    'Glowing like chaand in the Night': ['🌙','✨'],
    'Its soo Peakkkk': ['📈','🐐'],
    'No Words 3.0': ['🤐','🗿'],
    'Who are we to judgee': ['🗿','🤷'],
    'Second is not a looser but, khair quote bhul gaya, but tumne apna best diya and that matters more than anything': ['🏅','👏'],
    'She agreed on Gwar': ['👖','🤦'],
    'Mood swingss': ['🎢','😭'],
    'uss doing altu faltu ki bakwaas': ['🗣️','😂'],
    'jok pe hasna tha': ['😭','🤡'],
    'meri baat nhi manti aunty se complaint kr dunga': ['📞','😤'],
    'Ameer Log (Bcauz meri dost hai)': ['🤑','💅'],
    'Tumhe Prime Minister Banne ke liye mai vote dunga': ['🗳️','😎'],
    'I have no words for me': ['🗿','🐐'],
    'Ek din ambani hamara waiter hoga': ['🤑','🍽️'],
    'Our Humour (spelling bhul gaya )': ['🤡','😭'],
    'Humor glimpse 2.0': ['😂','🤝'],
    'Ab se jokes nhi marunga...': ['🤐','😭'],
    'Tahreem being Tahreem': ['🎙️','😂'],
    'Bind in one 1.0': ['🎙️','😌'],
    'bind in one 2.0': ['🎙️','😂'],
    'Bind in one 3.0': ['🎙️','😭'],
    'I guess I will Never Move on.....': ['🥲','😮‍💨'],
    'Very Gandi Baat': ['🙄','😭'],
    'Bandar kya jaane Adrak ka swaad': ['🐒','🫚'],
    'Pakka principal ka kaam hoga': ['🏫','🧐'],
    'Mere aage koi kuch bol skta hai kya.....': ['🎤','😎'],
    'big brain wala dimaag hai on both of Uss': ['🧠','🤓'],
    'I am a very very very Bad Friend ki Bday bhul jaata hu': ['🤦','🎂'],
    'Drama Queen Award': ['👑','🎭'],
    '7 things that make Tahreem, Tahreem': ['😌','✨'],
    'Badi hoke bada aadmi banungi': ['😎','📈'],
    'Kya matlab khud choti reh gyi': ['😭','🤏'],
    'Celebration bomb': ['💣','💥'],
    'Hai koi mujhse tej..?': ['🏃','💨'],
    'Ye konsa Pokemon hai...': ['👀','❓'],
    'Ye hai Tahreem-Mon': ['⚡','😎'],
    'Moonwalk, sparks & BOOOM!': ['🕺','💥'],
    'A little letter, just for you': ['✉️','🌷'],
    'Aaj tumhari chalegi': ['👑','😌'],
    'Pink, please': ['🌸','💅'],
    'One more photo': ['📸','😎'],
    'Thoda sa nakhra': ['💅','🙄'],
    'No tasks, only treats': ['🍰','😌'],
    'More little joys': ['🌼','😊'],
    'Room for your dreams': ['🌠','✨'],
    'A little more peace': ['🕊️','🌿'],
    'A year worth celebrating': ['🎉','🥳'],
    'You are feeling low': ['🌦️','🌷'],
    'You need a smile': ['😊','🌻'],
    'You have a small win': ['🏆','👏'],
    'Ordinary': ['✨','🎶'],
    'Girl on Fire': ['🔥','👑'],
    'Forever Young': ['🌻','✨'],
    'Aye Meri Zohrajabeen': ['🎤','😎'],
    'Blue Eyes': ['👀','🕶️'],
    'Bom Diggy Diggy': ['🕺','🔊'],
    'Chaar Botal Vodka': ['😵','🎶'],
    'Chalre Chalre Waal (Extended) Female Version': ['🌼','🎶'],
    'Chanakya': ['🧠','🎶'],
    'Chinta Ta Ta Chita Chita': ['🕺','🥁'],
    'Tajdar-e-Haram': ['🙏','🎶'],
    'Shape of You': ['🎧','💃'],
    'La Macarena': ['🕺','🎉'],
    'Without Me': ['🎤','😎'],
    'Ishq': ['🌙','🎶'],
    'Kajra Re': ['👀','💃'],
    'Way Down We Go': ['🌌','🎸'],
    'Somewhere Only We Know': ['🌿','🌙'],
    'Kudi Nu Nachne De': ['💃','🎉'],
    'Die With A Smile': ['🙂','🌅'],
    'Brooklyn Baby': ['🕶️','🎧'],
    'Despacito ft. Daddy Yankee': ['💃','🌴'],
    'Luka Chuppi': ['🥹','🌙'],
    'Maula Mere Maula': ['🙏','✨'],
    'Nachange Saari Raat': ['💃','🌙'],
    'Unwritten': ['📖','🌤️'],
    'One Two Three Four': ['🕺','🥁'],
    'labour': ['✊','🔥'],
    'Patakha Guddi': ['🪁','🔥'],
    'Piya Ghar Aavenge': ['🏡','🎶'],
    'GANGNAM STYLE(강남스타일)': ['🕺','🕶️'],
    'Chammak Challo': ['💃','✨'],
    'Sahiba': ['🌷','🎶'],
    'Gulabi Aankhen': ['🌸','👀'],
    'Senorita': ['💃','🎸'],
    'Shaky': ['🕺','🔥'],
    'Uyi Amma': ['💃','🥁'],
    'Ye Tune Kya Kiya': ['😵','🎶']
  }).map(([title, emojis]) => [key(title), emojis]));

  // Future additions and unlocked private titles receive a small, context-based accent.
  // Private wording is processed only in memory after unlock, never added to this map.
  const hints = [
    [/birthday|bday|cake|wish/i, ['🎂','🎉']],
    [/sorry|apologi|bhul/i, ['🥲','🙏']],
    [/sad|cry|low|move on|miss you/i, ['🥲','🌷']],
    [/jok|humou?r|laugh|hasna|bakwaas/i, ['😂','🤭']],
    [/brain|smart|study|exam|padh|question/i, ['🧠','🤓']],
    [/goat|peak|best|win|proud/i, ['🏆','✨']],
    [/dance|moonwalk|song|music/i, ['🕺','🎶']],
    [/nakh|drama|queen|attitude/i, ['👑','💅']],
    [/sundar|glow|chaand|pretty/i, ['✨','🌸']],
    [/bach|child|chot|bauni/i, ['🥹','🤏']],
    [/friend|dost|uss|both/i, ['🤝','😎']]
  ];
  function decorate(value) {
    if (typeof value !== 'string' || !value.trim()) return value;
    value = displayNames.get(key(value)) || value;
    const existing = (value.match(/\p{Extended_Pictographic}/gu) || []).length;
    if (existing >= 2) return value;
    const emojis = selections.get(key(value)) || hints.find(([pattern]) => pattern.test(value))?.[1] || ['📸','✨'];
    const additions = emojis.filter(emoji => !value.includes(emoji)).slice(0,2-existing);
    return additions.length ? `${value} ${additions.join('')}` : value;
  }
  window.GardenTitles = {decorate};

  // Decorate just the browser's display data so syncing original assets cannot erase it.
  const data = window.BIRTHDAY || {};
  for (const group of ['songs','nakhre','kinderSurprises','wishes','openWhen','nakhrePages']) {
    for (const item of data[group] || []) {
      item.title = decorate(item.title);
      for (const image of item.images || []) image.caption = decorate(image.caption);
    }
  }
  for (const item of data.album || []) item.caption = decorate(item.caption);
  if (data.letter) data.letter.title = decorate(data.letter.title);
  for (const item of data.kinderSurprises || []) {
    if (item.revealText) item.revealText = decorate(item.revealText);
    if (item.kind === 'pokemon') item.text = decorate(item.text);
  }
})();
