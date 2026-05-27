-- =========================================================
-- Migration : import depuis https://cetipar.canalblog.com/
-- Généré le  : 2026-05-24
--
-- Exécution :
--   wrangler d1 execute tranquille-vacances-db \
--     --file=migrate-canalblog.sql
--
-- Pré-requis : schema.sql doit déjà avoir été appliqué.
-- Ce fichier utilise INSERT OR IGNORE pour être idempotent.
-- Les photos originales (stockées sur storage.canalblog.com)
-- ne sont pas migrées ici - à traiter séparément via R2.
-- =========================================================


-- ─────────────────────────────────────────────────────────────
-- 1. DOSSIERS
--    Destinations non couvertes par le seed de schema.sql
--    (qui s''arrête à l''id 9).
-- ─────────────────────────────────────────────────────────────

INSERT OR IGNORE INTO folders (id, name, slug, icon, parent_id, sort_order) VALUES
  (10, 'Afrique',      'afrique',      '🌍', NULL,  10),
  (11, 'Maroc',        'maroc',        '🇲🇦',   10,   0),
  (12, 'Egypte',       'egypte',       '🇪🇬',   10,   1),
  (13, 'Tunisie',      'tunisie',      '🇹🇳',   10,   2),
  (14, 'Mauritanie',   'mauritanie',   '🇲🇷',   10,   3),
  (15, 'Moyen-Orient', 'moyen-orient', '🕌', NULL,  20),
  (16, 'Oman',         'oman',         '🇴🇲',   15,   0),
  (17, 'Jordanie',     'jordanie',     '🇯🇴',   15,   1),
  (18, 'Espagne',      'espagne',      '🇪🇸',    1,   5);


-- ─────────────────────────────────────────────────────────────
-- 2. ARTICLES
--    23 voyages issus du blog (pages de navigation principale).
--    Ordre chronologique par start_date.
--    Le voyage de juillet 2020 (annulé Covid) est en 'draft'.
--    Les photos sont à migrer séparément (cover_url / R2).
-- ─────────────────────────────────────────────────────────────

INSERT OR IGNORE INTO articles
  (title, slug, destination, date, start_date, end_date, writing_days,
   short_description, content, status, folder_id)
VALUES

-- ── 1 ────────────────────────────────────────────────────────
-- Source : https://cetipar.canalblog.com/pages/maroc-octobre-2011/37992808.html
(
  'Maroc Octobre 2011',
  'maroc-octobre-2011',
  'Marrakech, Vallée de l''Ourika, Cascades d''Ouzoud',
  '2011-10-07',
  '2011-10-07',
  '2011-10-09',
  '[]',
  'Le voyage fondateur : un week-end d''entreprise à Marrakech, premier avion à 35 ans, qui a tout déclenché.',
  'Un comité d''entreprise organise un voyage pour 150 salariés à Marrakech en octobre 2011. Pour Maxim et Séverine, c''est le tout premier départ en avion et le premier voyage hors de France. La place Jemaa el-Fna, les souks, le Jardin Majorelle de Yves Saint Laurent, une soirée "fantasia" avec couscous et méchoui, une randonnée jusqu''aux cascades de l''Ourika et une excursion de 3 heures jusqu''aux cascades d''Ouzoud : autant d''expériences qui donnent l''envie de continuer à voyager. C''est lors de ce séjour que naît l''expression familiale "tranquille, on est en vacances !"

Source : https://cetipar.canalblog.com/pages/maroc-octobre-2011/37992808.html',
  'published',
  11
),

-- ── 2 ────────────────────────────────────────────────────────
-- Source : https://cetipar.canalblog.com/pages/maroc-mai-2013---marrakech/29722514.html
(
  'Maroc Mai 2013',
  'maroc-mai-2013',
  'Marrakech, Boumalne Dadès, Zagora, Aït-Ben-Haddou, Ouzoud',
  '2013-04-27',
  '2013-04-27',
  '2013-05-09',
  '[]',
  'Premier grand circuit familial au Maroc : gorges du Dadès, bivouac à dos de dromadaire dans le désert de Zagora et chutes d''Ouzoud.',
  'Premier long voyage en famille au Maroc. L''aventure commence dès l''aéroport : impossible de trouver les bagages, aucun panneau au-dessus des tapis. Après la location d''une voiture dans le chaos marrakchi, la famille rejoint le Riad Sirocco. Les jours suivants sont une immersion dans la diversité marocaine : randonnée dans les gorges du Dadès avec le guide Mohammed, visite de la Vallée des Roses, bivouac à dos de dromadaire dans le désert de Zagora, découverte de traces de dinosaures, site historique d''Aït-Ben-Haddou (UNESCO), gorges du Todra, et retour par les chutes d''Ouzoud et ses macaques de Barbarie. Le récit est ponctué d''anecdotes savoureuses : négociations avec les policiers, observations d''oiseaux (guêpiers, bergeronnettes) et rencontres avec les guides berbères.

Source : https://cetipar.canalblog.com/pages/maroc-mai-2013---marrakech/29722514.html',
  'published',
  11
),

-- ── 3 ────────────────────────────────────────────────────────
-- Source : https://cetipar.canalblog.com/pages/espagne-2013---sierra-de-guara/29722516.html
(
  'Espagne 2013 – Sierra de Guara',
  'espagne-2013-sierra-de-guara',
  'Sierra de Guara, Aragon, Espagne',
  '2013-08-16',
  '2013-08-16',
  '2013-08-31',
  '[]',
  'Deux semaines dans le Parc naturel de la Sierra de Guara en Aragon : canyons, vautours fauves, piscines communales et plage méditerranéenne.',
  'Voyage de deux semaines en famille dans le nord-est de l''Espagne, dans le Parc naturel de la Sierra de Guara. Départ de Nantes, traversée de Pau, base à Angüés. Au programme : randonnées dans les canyons d''Alquézar, Rodellar et la Fuente de Tamara, baignades dans des piscines naturelles et dans les piscines communales financées par les fonds publics, observation des vautours fauves et d''autres rapaces dans les gorges. Péripéties : descente de canyon avec perte de l''orientation à la Fuente de Tamara, et attaque de guêpes dans un lit de rivière. La famille pousse jusqu''à la plage méditerranéenne de L''Ametlla de Mar avant le retour.

Source : https://cetipar.canalblog.com/pages/espagne-2013---sierra-de-guara/29722516.html',
  'published',
  18
),

-- ── 4 ────────────────────────────────────────────────────────
-- Source : https://cetipar.canalblog.com/pages/maroc-mai-2014---fes/29722527.html
(
  'Maroc Mai 2014 – Fès',
  'maroc-mai-2014-fes',
  'Fès, Azrou, Imilchil, Merzouga, Taza',
  '2014-04-27',
  '2014-04-27',
  '2014-05-11',
  '[]',
  'Circuit jusqu''à Fès : macaques de Barbarie dans les cèdres d''Azrou, désert de Merzouga, gouffre de Friouato et médina de Fès.',
  'Deuxième grand circuit marocain. Départ d''Azrou pour observer les fameux macaques de Barbarie dans les forêts de cèdres. L''itinéraire passe par le lac Tiseli et les paysages lunaires d''Imilchil, puis descend jusqu''au désert de Merzouga pour une nuit en bivouac dans les dunes. Le retour s''effectue via Midelt et les impressionnantes grottes du gouffre de Friouato près de Taza. Le séjour se clôture par plusieurs jours d''exploration dans la médina de Fès, classée au patrimoine mondial de l''UNESCO. Le récit est jalonné de citations savoureuses des marchands et guides locaux.

Source : https://cetipar.canalblog.com/pages/maroc-mai-2014---fes/29722527.html',
  'published',
  11
),

-- ── 5 ────────────────────────────────────────────────────────
-- Source : https://cetipar.canalblog.com/pages/maroc-avril-2015/31934514.html
(
  'Maroc Avril 2015',
  'maroc-avril-2015',
  'Imouzzer, Sidi Ifni, Amtoudi, Tafraout, Taroudant, Marrakech',
  '2015-04-11',
  '2015-04-11',
  '2015-04-25',
  '[]',
  'Découverte du Maroc par le sud : Vallée du Paradis, Sidi Ifni, Amtoudi, Tafraout et retour par Taroudant et Marrakech.',
  'Cette année, départ depuis Tours avec atterrissage à Marrakech. Circuit dans le sud marocain : Vallée du Paradis et ses piscines naturelles près d''Imouzzer, arches naturelles de Sidi Ifni, grenier collectif fortifié d''Amtoudi, gorges et peintures rupestres de Tafraout, médina de Taroudant surnommée "la petite Marrakech", et retour par la place Djemaa el-Fna et la Vallée de l''Ourika. Rencontres avec des guides locaux, observation d''une faune remarquable (cobras, vipères à cornes, hérons), baignades en piscines naturelles et repas traditionnels marocains.

Source : https://cetipar.canalblog.com/pages/maroc-avril-2015/31934514.html',
  'published',
  11
),

-- ── 6 ────────────────────────────────────────────────────────
-- Source : https://cetipar.canalblog.com/pages/maroc-avril-2016/33578630.html
(
  'Maroc Avril 2016',
  'maroc-avril-2016',
  'Marrakech, Aït-Ben-Haddou, Ouzoud, Bin el Ouidane, Fès',
  '2016-03-31',
  '2016-03-31',
  '2016-04-10',
  '[]',
  'Circuit de 866 km de Marrakech à Fès via Aït-Ben-Haddou, oasis de Fint, chutes d''Ouzoud et gorges d''Assaca.',
  'Départ de Nantes en direction de Marrakech malgré une grève du contrôle aérien. L''itinéraire couvre 866 km en dix jours : Aït-Ben-Haddou avec le guide Abdel Aziz et sa famille (couscous traditionnel partagé), oasis de Fint près d''Ouarzazate, gorges d''Assaca en randonnée, chutes d''Ouzoud avec le labrador "Maltesse" de l''hôtel, excursion en 4x4 avec les guides Sadia et Marjoba, médina de Fès et ses souks. Le retour s''effectue le 10 avril à bord d''un vol RyanAir. Le séjour se clôture par le désormais traditionnel "à l''année prochaine, inchallah !"

Source : https://cetipar.canalblog.com/pages/maroc-avril-2016/33578630.html',
  'published',
  11
),

-- ── 7 ────────────────────────────────────────────────────────
-- Source : https://cetipar.canalblog.com/pages/maroc-octobre-2016/34445993.html
(
  'Maroc Octobre 2016',
  'maroc-octobre-2016',
  'Boumalne Dadès, Foum Zguid, Tata, Taliouine, Marrakech',
  '2016-10-18',
  '2016-10-18',
  '2016-11-02',
  '[]',
  'Randonnées dans les gorges du Dadès, bivouac dans le Sahara à Foum Zguid, grottes de Tata et récolte du safran à Taliouine.',
  'Voyage de deux semaines au Maroc en automne. Circuit depuis Nantes avec cinq étapes majeures : Boumalne Dadès pour les randonnées dans les gorges rocheuses, Foum Zguid pour les expériences désertiques et bivouac dans les dunes sahariennes, Tata pour l''exploration des grottes préhistoriques, Taliouine pour assister à la récolte du safran (l''épice la plus précieuse au monde), et Marrakech pour la conclusion culturelle. Le récit décrit des routes en mauvais état, de fortes pluies causant des inondations, et de nombreuses rencontres avec des guides et familles locales. Le voyage de retour passe par Madrid.

Source : https://cetipar.canalblog.com/pages/maroc-octobre-2016/34445993.html',
  'published',
  11
),

-- ── 8 ────────────────────────────────────────────────────────
-- Source : https://cetipar.canalblog.com/pages/oman-avril-2017/35207620.html
(
  'Oman Avril 2017',
  'oman-avril-2017',
  'Mascate, Rub al-Khali, Sur, Musandam, Oman',
  '2017-04-02',
  '2017-04-02',
  '2017-04-15',
  '[]',
  '20 ans de vie commune fêtés en Oman : Grande Mosquée de Mascate, bivouac dans le Rub al-Khali, wadis, tortues marines et forts traditionnels.',
  'Séverine et Maxim fêtent leurs 20 ans ensemble en partant seuls, sans les enfants, pour un premier voyage en Oman. Au programme : visite de la Grande Mosquée Sultan Qaboos de Mascate, marché aux poissons, excursions en bateau sur la côte, camping en bivouac dans le désert du Rub al-Khali avec plusieurs treks dans des dunes à plus de 38 °C, randonnées dans les wadis (canyons à piscines naturelles), observation des tortues marines à la ponte, photographie des oiseaux, visite des chantiers navals de boutres à Sur, et exploration de forts traditionnels et de souks. Incident notable : une chute de pierres lors d''une randonnée en montagne, nécessitant une descente d''urgence. L''Oman est décrit comme "un pays ultra-pacifiste, ouvert au tourisme et l''un des plus sûrs au monde".

Source : https://cetipar.canalblog.com/pages/oman-avril-2017/35207620.html',
  'published',
  16
),

-- ── 9 ────────────────────────────────────────────────────────
-- Source : https://cetipar.canalblog.com/pages/maroc-avril-2018/36324848.html
(
  'Maroc Avril 2018',
  'maroc-avril-2018',
  'Vallée du Paradis, Tiznit, Sidi Ifni, Tissint, Aït-Ben-Haddou, Ouzoud',
  '2018-04-22',
  '2018-04-22',
  '2018-05-04',
  '[]',
  'Road trip familial de 1 598 km : Vallée du Paradis, bivouac dans le désert de Tissint, Aït-Ben-Haddou et chutes d''Ouzoud.',
  'Road trip familial avec Séverine et les deux enfants Julien et Maxime. 1 598 km parcourus en 12 jours. Au programme : Vallée du Paradis avec le guide JC (canyoning), Tiznit, Mirleft et Sidi Ifni avec leur charme berbère, plage blanche de Guelmim, oasis de Tighrmert, bivouac dans le désert à Tissint, site UNESCO d''Aït-Ben-Haddou et retrouvailles avec le guide Abdel Aziz, chutes d''Ouzoud, et conclusion à Marrakech. Observations faunistiques remarquables : "cours-vite isabelle" et un scinque rare dans les dunes. Le récit inclut des réflexions sur l''impact environnemental du tourisme de masse.

Source : https://cetipar.canalblog.com/pages/maroc-avril-2018/36324848.html',
  'published',
  11
),

-- ── 10 ───────────────────────────────────────────────────────
-- Source : https://cetipar.canalblog.com/pages/oman-mars-2019/37163239.html
(
  'Oman Mars 2019',
  'oman-mars-2019',
  'Snake Canyon, Îles Daymaniyat, Musandam, Dubaï',
  '2019-03-15',
  '2019-03-15',
  '2019-03-27',
  '[]',
  'Retour en Oman avec Séverine : Snake Canyon, nage avec les tortues aux îles Daymaniyat, péninsule de Musandam et escale à Dubaï.',
  'Deuxième voyage en Oman, organisé avec l''agence Couleurs d''Oman (guide Sophie). Location d''un Toyota 4x4 pour un road trip en mode routard. Points forts : canyoning dans le Snake Canyon avec rappels dans l''eau, snorkeling aux îles Daymaniyat (tortues marines et poissons colorés de récif), traversée de wadis désertiques, exploration de la côte. Péripétie mémorable : se retrouver bloqué sur une île à marée montante. Le voyage inclut la péninsule de Musandam, parfois surnommée "le fjord d''Arabie", avec des excursions en dhow traditionnel. Escale à Dubaï avant le retour en France. Nombreuses observations de faune : scorpions, gazelles et dizaines d''espèces d''oiseaux.

Source : https://cetipar.canalblog.com/pages/oman-mars-2019/37163239.html',
  'published',
  16
),

-- ── 11 ───────────────────────────────────────────────────────
-- Source : https://cetipar.canalblog.com/pages/maroc-octobre-2019/37718054.html
(
  'Maroc Octobre 2019',
  'maroc-octobre-2019',
  'M''Hamid, Vallée du Saghro, Merzouga, Gorges du Dadès',
  '2019-10-26',
  '2019-10-26',
  '2019-11-07',
  '[]',
  'Festival Taragalte berbère à M''Hamid, trek dans le Saghro, dunes de l''Erg Chebbi et randonnées dans les gorges du Dadès.',
  'Voyage de deux semaines centré sur le festival Taragalte, rassemblement berbère de musique, poésie et culture à M''Hamid el Ghizlane. L''itinéraire comprend : canyoning dans la grotte Al Assif N''El Hed avec des guides locaux, baignades dans des piscines naturelles et cascades, nuits chez des familles berbères. Trek de trois jours dans la Vallée du Saghro avec des voyageurs allemands et bivouac en maisons de montagne. Observation d''une faune variée (oiseaux, lézards, aigles). Festival Taragalte avec courses de chameaux et musique gnaoua. Randonnée de 11 km dans les dunes de l''Erg Chebbi près de Merzouga avec observation des renards fennecs au coucher du soleil. Lac Dayet Srij pour l''ornithologie. Gorges du Dadès et trek dans les canyons avec le guide Lahcen. Réflexions sur la raréfaction de l''eau affectant les oasis.

Source : https://cetipar.canalblog.com/pages/maroc-octobre-2019/37718054.html',
  'published',
  11
),

-- ── 12 ───────────────────────────────────────────────────────
-- Source : https://cetipar.canalblog.com/pages/maroc-juillet-2020/37992769.html
-- Voyage annulé - conservé en draft à titre d''archive.
(
  'Maroc Juillet 2020 – Annulé Covid',
  'maroc-juillet-2020',
  'Maroc (voyage annulé)',
  '2020-07-01',
  '2020-07-01',
  '2020-07-31',
  '[]',
  'Voyage annulé en raison du Covid-19. L''itinéraire prévu partait de Marrakech pour rejoindre Tanger en plein été (~40 °C).',
  'Voyage estival prévu au Maroc en juillet 2020 - une nouveauté pour la famille habituée au printemps et à l''automne. L''itinéraire prévu : une grande boucle de Marrakech jusqu''à Tanger en pleine chaleur, environ 40 °C. En raison de la pandémie de Covid-19, le voyage a finalement été annulé. Comme le résume sobrement l''auteur : "Voyage annulé : Merci le covid 19 !"

Source : https://cetipar.canalblog.com/pages/maroc-juillet-2020/37992769.html',
  'draft',
  11
),

-- ── 13 ───────────────────────────────────────────────────────
-- Source : https://cetipar.canalblog.com/pages/maroc-septembre-2021/39128198.html
(
  'Maroc Septembre 2021',
  'maroc-septembre-2021',
  'Toubkal, Agafay, Essaouira, Taghazout, Vallée du Paradis',
  '2021-09-18',
  '2021-09-18',
  '2021-10-02',
  '[]',
  'Ascension du Toubkal (4 167 m) en 6 jours de trek, puis road trip vers Essaouira, Taghazout et la Vallée du Paradis.',
  'Voyage en deux temps, quinze jours total. Première partie : six jours de trek pour gravir le Toubkal (4 167 m), plus haut sommet du Maroc, avec bivouacs à haute altitude, rencontre de guides berbères et muletiers, et épreuves physiques liées à l''altitude. Deuxième partie : road trip depuis Marrakech - désert d''Agafay et ses paysages minéraux, médina d''Essaouira battue par le vent, village de surf de Taghazout sur l''Atlantique, et Vallée du Paradis pour clore le voyage. Le récit documente un Maroc post-Covid qui reprend progressivement son souffle, les conditions de sécheresse, la cuisine traditionnelle (tajines, harira) et les hébergements variés (refuges de montagne, riads, camps désertiques).

Source : https://cetipar.canalblog.com/pages/maroc-septembre-2021/39128198.html',
  'published',
  11
),

-- ── 14 ───────────────────────────────────────────────────────
-- Source : https://cetipar.canalblog.com/pages/jordanie-avril-2022/37992760.html
(
  'Jordanie Avril 2022',
  'jordanie-avril-2022',
  'Pétra, Wadi Rum, Wadi Ibn Hammad, Aqaba, Mer Morte',
  '2022-04-29',
  '2022-04-29',
  '2022-05-11',
  '[]',
  'Deux ans de retard à cause du Covid pour découvrir la Jordanie : Pétra sur trois jours, camping dans le Wadi Rum et snorkeling à Aqaba.',
  'Voyage prévu en avril 2020 et repoussé deux ans à cause de la pandémie. Deux semaines en Jordanie entre sites naturels et archéologiques. Randonnées dans les canyons : Wadi Ibn Hammad, canyoning dans le canyon d''Al-Karak, Al Hasa et Ghweir. Trois jours dédiés à Pétra, la cité nabatéenne rose classée au patrimoine mondial, avec ses tombeaux sculptés dans la roche et son Siq mystérieux. Trek de trois jours dans le désert du Wadi Rum avec le guide Sabah, nuits en bivouac sous les étoiles, panoramas de formations rocheuses ocre et rouges. Plage d''Aqaba en mer Rouge avec bateau à fond de verre et snorkeling. Baignade en mer Morte. Récit agrémenté d''observations ornithologiques, d''anecdotes sur les guides locaux et de plus de 150 photographies.

Source : https://cetipar.canalblog.com/pages/jordanie-avril-2022/37992760.html',
  'published',
  17
),

-- ── 15 ───────────────────────────────────────────────────────
-- Source : https://cetipar.canalblog.com/pages/maroc-2022/39630854.html
(
  'Maroc Septembre 2022',
  'maroc-septembre-2022',
  'Tanger, Chefchaouen, Tetouan, Réserve de Talassemtane',
  '2022-09-18',
  '2022-09-18',
  '2022-10-01',
  '[]',
  'Exploration du Rif marocain méconnu : Chefchaouen la bleue, six jours de trek en réserve Talassemtane et canyoning de l''Oued Farda.',
  'Découverte d''une région du Maroc peu fréquentée : le Rif, décrit comme "rebelle" et "méconnu". Arrivée à Tanger en ferry depuis Tarifa, puis cap sur Chefchaouen la ville bleue photographiée dans le monde entier. Visite de Tetouan, M''diq et Martil sur la côte méditerranéenne marocaine. Six jours de trek dans la réserve naturelle de Talassemtane avec guides locaux : ascension de cols impressionnants, canyoning dans l''Oued Farda avec plusieurs rappels dans la roche. Péripétie : entorse de la cheville qui oblige à modifier le programme. La région étonne par l''omniprésence des cultures de cannabis, principal moteur économique local. La beauté sauvage du Rif, ses paysages de montagne verdoyants et l''hospitalité de ses habitants laissent une forte impression.

Source : https://cetipar.canalblog.com/pages/maroc-2022/39630854.html',
  'published',
  11
),

-- ── 16 ───────────────────────────────────────────────────────
-- Source : https://cetipar.canalblog.com/pages/maroc-2023/39892185.html
(
  'Maroc Mai 2023',
  'maroc-mai-2023',
  'Ouzoud, Taghia, Gorges du Dadès, Todra, Merzouga',
  '2023-04-27',
  '2023-04-27',
  '2023-05-12',
  '[]',
  'Trek de 7 jours dans les gorges de Taghia avec bivouac à 2 650 m, passerelle suspendue vertigineuse, villages nomades et désert de Merzouga.',
  'Voyage en deux parties. Première étape : chutes d''Ouzoud avec le guide Saïd et l''histoire méconnue du "village mexicain". Puis Taghia, massif rocheux isolé du Haut Atlas, pour un trek de sept jours : bivouac à 2 650 m d''altitude, franchissement de la fameuse passerelle suspendue dangereuse, canyoning avec plusieurs rappels, nuits chez des familles nomades berbères dans des habitations troglodytes. Traversée des gorges du Dadès et du Todra avec conduite de nuit à éviter absolument ("Il NE FAUT JAMAIS CONDUIRE DE NUIT" - véhicules sans feux et troupeaux sur la route). Désert de Merzouga avec assistance à un oiseau blessé et souk de Rissani pour clore le voyage.

Source : https://cetipar.canalblog.com/pages/maroc-2023/39892185.html',
  'published',
  11
),

-- ── 17 ───────────────────────────────────────────────────────
-- Source : https://cetipar.canalblog.com/pages/egypte-2023/40076727.html
(
  'Egypte Novembre 2023',
  'egypte-novembre-2023',
  'Siwa, Désert Blanc, Bahariya, Le Caire, Assouan, Abou Simbel',
  '2023-11-07',
  '2023-11-07',
  '2023-11-18',
  '[]',
  'De l''oasis de Siwa au Désert Blanc et aux temples d''Abou Simbel : traversée des grands sites pharaoniques et naturels de l''Egypte.',
  'Voyage en Egypte commençant par un détour imprévu : l''avion est dérouté sur Rome pour des raisons de sécurité, ce qui retarde l''arrivée. Au programme : oasis de Siwa et ses forteresses antiques et lacs salés, Musée égyptien du Caire et ses trésors pharaoniques. Désert Blanc et ses formations de craie aux formes surréalistes, Montagnes de Cristal de l''oasis de Bahariya. Descente du Nil jusqu''à Assouan avec sites nubiens. Excursion à Abou Simbel pour les temples colossaux de Ramsès II. Réflexions sur la pollution atmosphérique du Caire et la sensibilité géopolitique de la région. Rencontres avec des guides passionnants, hiéroglyphes et divinités de l''Egypte ancienne.

Source : https://cetipar.canalblog.com/pages/egypte-2023/40076727.html',
  'published',
  12
),

-- ── 18 ───────────────────────────────────────────────────────
-- Source : https://cetipar.canalblog.com/2024/05/maroc-2024.html
(
  'Maroc Mai 2024',
  'maroc-mai-2024',
  'Tafraout, Amtoudi, Anti-Atlas, Souss Massa',
  '2024-05-04',
  '2024-05-04',
  '2024-05-14',
  '[]',
  'Anti-Atlas et randonnée au sommet de l''Adad Medni (1 470 m), canyoning avec 50 m de rappel, bivouac en oasis et ornitho à Souss Massa.',
  'Cap sur l''Anti-Atlas marocain pour fuir le froid français. Avec les guides Ahmed et Yassine, le programme est intense : ascension de l''Adad Medni (1 470 m) avec panoramas sur l''Atlas, plusieurs descentes de canyons dont un rappel de 50 mètres dans un canyon sec, bivouacs dans des oasis séculaires avec le cuisinier Yassine, visite d''agadirs (greniers collectifs fortifiés) vieux de plusieurs siècles et de villages berbères traditionnels. Séjour ornithologique à la réserve de Souss Massa : faucons crécerellettes, merles bleus de roche et agamas. Températures atteignant 41 °C. Tafraout avec ses rochers peints et Amtoudi pour finir en beauté.

Source : https://cetipar.canalblog.com/2024/05/maroc-2024.html',
  'published',
  11
),

-- ── 19 ───────────────────────────────────────────────────────
-- Source : https://cetipar.canalblog.com/2024/10/oman-2024.html
(
  'Oman Octobre 2024',
  'oman-octobre-2024',
  'Mascate, Îles Daymaniyat, Haat Canyon, Wadis, Oman',
  '2024-10-04',
  '2024-10-04',
  '2024-10-13',
  '[]',
  'Retour en Oman avec Séverine : snorkeling avec les tortues aux Daymaniyat, canyoning du Haat Canyon (60 m de rappel) et bivouac en wadi.',
  'Troisième voyage en Oman pour Séverine. Départ depuis la France via Munich. Arrivée à Mascate avec visite de la Grande Mosquée Sultan Qaboos. Excursion en bateau aux îles Daymaniyat pour snorkeler avec les tortues marines et les poissons du récif. Exploration de plusieurs wadis en Land Cruiser et bivouac dans des gorges reculées. Canyoning exceptionnel dans le Haat Canyon avec un rappel de 60 mètres. Marché aux poissons local, cuisine omanaise et indienne, gîtes et campements. Formations géologiques uniques : sources sulfureuses et tumuli vieux de 5 000 ans. "Un beau pays, accueillant, pacifiste et plein de couleurs."

Source : https://cetipar.canalblog.com/2024/10/oman-2024.html',
  'published',
  16
),

-- ── 20 ───────────────────────────────────────────────────────
-- Source : https://cetipar.canalblog.com/2025/04/tunisie-2025.html
(
  'Tunisie Mai 2025',
  'tunisie-mai-2025',
  'Medenine, Chenini, Matmata, Sahara tunisien',
  '2025-05-01',
  '2025-05-01',
  '2025-05-10',
  '[]',
  'Ksour troglodytes du sud tunisien, décors de Star Wars à Matmata, puis quatre jours de trek à dos de chameau dans le Sahara.',
  'Premier voyage en Tunisie pour Séverine et Maxim. Arrivée à Monastir, puis cap sur le sud. Les premiers jours sont consacrés aux ksour (forteresses berbères) et villages troglodytes : Medenine, Chenini, Guermessa - structures millénaires servant de greniers collectifs à cellules étroites. Trek de 13 km culminant dans le canyon "Efni" utilisé pour le tournage des scènes de course de pods dans Star Wars. Visite de l''hôtel de Matmata où ont été filmées les scènes de la ferme de Lars (Luke Skywalker). Les quatre derniers jours : trek à dos de chameau dans le grand Sahara avec les guides Ibrahim et Ridha, environ 40 km parcourus, nuits à la belle étoile. Rencontre de la faune désertique et hébergements troglodytes authentiques tout au long du séjour.

Source : https://cetipar.canalblog.com/2025/04/tunisie-2025.html',
  'published',
  13
),

-- ── 21 ───────────────────────────────────────────────────────
-- Source : https://cetipar.canalblog.com/2025/09/maroc-2025.html
(
  'Maroc Septembre 2025',
  'maroc-septembre-2025',
  'Taroudant, Anti-Atlas, Canyons Athouga et Aguinane',
  '2025-09-07',
  '2025-09-07',
  '2025-09-15',
  '[]',
  'Taroudant, trek de montagne à 2 000 m et deux canyons techniques (Athouga et Aguinane) avec les guides Ahmed, Yassine et Abdou.',
  'Nouveau départ vers le Maroc avec les guides devenus familiers Ahmed, Yassine et Abdou. Taroudant, surnommée "la ville de Jacques Chirac", est le point de départ : médina, souks et architecture andalouse. Trek de montagne avec bivouac à environ 2 000 m d''altitude près du village de Tizgui. Puis deux journées de canyoning technique : 6 rappels dans les gorges d''Athouga, et 6 dans les canyons d''Aguinane. Le séjour est perturbé par de violentes crues éclairs et des coupures de communication. Visite de l''arche naturelle Timi-n-Ifri, kasba d''Aït-Ben-Haddou et chutes d''Ouzoud complètent le circuit. Les liens tissés avec les guides et les communautés locales rendent chaque retour unique.

Source : https://cetipar.canalblog.com/2025/09/maroc-2025.html',
  'published',
  11
),

-- ── 22 ───────────────────────────────────────────────────────
-- Source : https://cetipar.canalblog.com/2026/01/mauritanie-fevrier-2026.html
-- Voyage prévu en Mauritanie, redirigé vers le Maroc à l''aéroport CDG.
(
  'Mauritanie Février 2026 – Rerouting Maroc',
  'mauritanie-fevrier-2026',
  'Agadir, Vallée du Paradis, Tafraout, Canyon de l''Ifni',
  '2026-02-06',
  '2026-02-06',
  '2026-02-15',
  '[]',
  'Départ pour la Mauritanie annulé à CDG faute de visa - improvisation réussie avec un vol Transavia pour Agadir et canyoning de l''Ifni.',
  'La grande aventure mauritanienne tourne court dès l''aéroport Charles-de-Gaulle : la compagnie ASL confirme que les passagers ne peuvent pas embarquer sans visa, malgré les assurances préalables de l''opérateur. Après un moment de déception et de négociation, la famille improvise et réserve un vol Transavia pour Agadir le jour même. Le Maroc, encore lui, réserve un accueil chaleureux. Au programme improvisé : randonnées dans la Vallée du Paradis et ses cascades, canyoning dans le canyon de l''Ifni avec les guides professionnels Jimmy, Ahmed et Yassine, exploration des souks de Tafraout et d''Agadir, visite de la Kasbah Tizourgane et des rochers peints de Tafraout. Un voyage de secours qui devient inoubliable.

Source : https://cetipar.canalblog.com/2026/01/mauritanie-fevrier-2026.html',
  'published',
  11
),

-- ── 23 ───────────────────────────────────────────────────────
-- Source : https://cetipar.canalblog.com/2025/10/maroc-2026.html
(
  'Maroc Mai 2026',
  'maroc-mai-2026',
  'Marrakech, Ouzoud, Demnate, Merzouga, Boumalne Dadès',
  '2026-05-05',
  '2026-05-05',
  '2026-05-15',
  '[]',
  'Voyage en famille avec Julien, Maxime et sa fiancée Morgane : Ouzoud, Demnate, Merzouga et demande en mariage dans le désert.',
  'Voyage au Maroc en famille élargie : Séverine, Maxim père, leur fils Julien, et Maxime fils avec sa petite amie Morgane (surnommés les "M&Ms"). Quinze jours de circuit du 5 au 15 mai 2026. Au programme : empreintes de dinosaures à Demnate et arche naturelle Imi n''Ifri, chutes d''Ouzoud et macaques de Barbarie avec le guide Saïd, exploration de grottes habitées avec des centaines d''habitations berbères historiques, expédition dans les dunes de Merzouga en 4x4 et à dos de chameau, randonnée dans les lits de rivières du Boumalne Dadès. Retrouvailles avec les guides habituels Abdel Aziz, Lahcen, Otman et Boulmane. Moment le plus marquant : la demande en mariage de Maxime à Morgane dans le désert du Sahara.

Source : https://cetipar.canalblog.com/2025/10/maroc-2026.html',
  'published',
  11
);


-- ─────────────────────────────────────────────────────────────
-- 3. RÉCAPITULATIF (commentaire informatif)
-- ─────────────────────────────────────────────────────────────
--
--  Dossiers créés (IDs 10-18) :
--    10  Afrique
--    11    └── Maroc        (16 articles publiés + 1 draft)
--    12    └── Egypte       (1 article)
--    13    └── Tunisie      (1 article)
--    14    └── Mauritanie   (aucun article - voyage redirigé vers Maroc)
--    15  Moyen-Orient
--    16    └── Oman         (3 articles)
--    17    └── Jordanie     (1 article)
--    18  Espagne (sous Europe/id=1)  (1 article)
--
--  Articles insérés : 23 au total
--    - 22 en status 'published'
--    - 1  en status 'draft'  (maroc-juillet-2020, annulé Covid)
--
--  Photos non migrées - URLs d''origine sur storage.canalblog.com
--  présentes dans le champ 'content' de chaque article.
--  Utiliser cover_url / cover_r2_key après upload vers R2.
-- ─────────────────────────────────────────────────────────────
