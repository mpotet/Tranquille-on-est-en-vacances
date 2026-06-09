-- =====================================================
-- Canalblog import - properly parsed
-- Generated: 2026-06-09T14:29:28.217Z
-- =====================================================

-- Folders
INSERT OR IGNORE INTO folders (name, slug, icon, sort_order) VALUES ('Maroc', 'maroc', '🇲🇦', 1);
INSERT OR IGNORE INTO folders (name, slug, icon, sort_order) VALUES ('Oman', 'oman', '🇴🇲', 2);
INSERT OR IGNORE INTO folders (name, slug, icon, sort_order) VALUES ('Jordanie', 'jordanie', '🇯🇴', 3);
INSERT OR IGNORE INTO folders (name, slug, icon, sort_order) VALUES ('Égypte', 'egypte', '🇪🇬', 4);
INSERT OR IGNORE INTO folders (name, slug, icon, sort_order) VALUES ('Tunisie', 'tunisie', '🇹🇳', 5);
INSERT OR IGNORE INTO folders (name, slug, icon, sort_order) VALUES ('Espagne', 'espagne', '🇪🇸', 6);
INSERT OR IGNORE INTO folders (name, slug, icon, sort_order) VALUES ('Mauritanie', 'mauritanie', '🇲🇷', 7);

-- Articles
DELETE FROM articles WHERE slug = 'maroc-octobre-2011'; -- Clean up any existing data
INSERT INTO articles (title, slug, destination, start_date, end_date, content, short_description, cover_url, folder_id, status) VALUES ('Maroc Octobre 2011', 'maroc-octobre-2011', 'Maroc', '2011-10-07', '2011-10-09', 'Le fameux WE du 07-08-09 Octobre 2011... C', 'Le fameux WE du 07-08-09 Octobre 2011... C', 'https://storage.canalblog.com/53/78/1250329/126529498_o.jpg', (SELECT id FROM folders WHERE slug = 'maroc'), 'published');
DELETE FROM articles WHERE slug = 'maroc-mai-2013-marrakech'; -- Clean up any existing data
INSERT INTO articles (title, slug, destination, start_date, end_date, content, short_description, cover_url, folder_id, status) VALUES ('Maroc Mai 2013 – Marrakech', 'maroc-mai-2013-marrakech', 'Maroc', '2013-05-01', '2013-05-14', '** 27 04 2013**



![](https://storage.canalblog.com/98/68/1250329/126768947_o.jpg) ![](https://storage.canalblog.com/80/26/1250329/126768948_o.jpg)



Arrivée a l', '** 27 04 2013**



![](https://storage.canalblog.com/98/68/1250329/126768947_o.jpg) ![](https://storage.canalblog.com/80/26/1250329/126768948_o.jpg)



Arrivée a l', 'https://storage.canalblog.com/85/74/1250329/109849677_o.jpg', (SELECT id FROM folders WHERE slug = 'maroc'), 'published');
DELETE FROM articles WHERE slug = 'espagne-2013-sierra-de-guara'; -- Clean up any existing data
INSERT INTO articles (title, slug, destination, start_date, end_date, content, short_description, cover_url, folder_id, status) VALUES ('Espagne 2013 – Sierra de Guara', 'espagne-2013-sierra-de-guara', 'Espagne', '2013-07-01', '2013-07-14', '** Vendredi 16 aout**



Départ de nantes -> Arrivée à Pau



L', '** Vendredi 16 aout**



Départ de nantes -> Arrivée à Pau



L', 'https://storage.canalblog.com/86/71/1250329/109886955_o.jpg', (SELECT id FROM folders WHERE slug = 'espagne'), 'published');
DELETE FROM articles WHERE slug = 'maroc-mai-2014-fes'; -- Clean up any existing data
INSERT INTO articles (title, slug, destination, start_date, end_date, content, short_description, cover_url, folder_id, status) VALUES ('Maroc Mai 2014 – Fès', 'maroc-mai-2014-fes', 'Maroc', '2014-05-01', '2014-05-14', '27/04/2014 20:05 : décolage de Nantes. Dans 3 heures, nous serons à l', '27/04/2014 20:05 : décolage de Nantes. Dans 3 heures, nous serons à l', 'https://storage.canalblog.com/97/47/1250329/109879435_o.jpg', (SELECT id FROM folders WHERE slug = 'maroc'), 'published');
DELETE FROM articles WHERE slug = 'maroc-avril-2015'; -- Clean up any existing data
INSERT INTO articles (title, slug, destination, start_date, end_date, content, short_description, cover_url, folder_id, status) VALUES ('Maroc Avril 2015', 'maroc-avril-2015', 'Maroc', '2015-04-01', '2015-04-14', 'Cette année,  décollage de Tours. Nous atterrissons à l', 'Cette année,  décollage de Tours. Nous atterrissons à l', 'https://storage.canalblog.com/46/25/1250329/103795745_o.jpg', (SELECT id FROM folders WHERE slug = 'maroc'), 'published');
DELETE FROM articles WHERE slug = 'maroc-avril-2016'; -- Clean up any existing data
INSERT INTO articles (title, slug, destination, start_date, end_date, content, short_description, cover_url, folder_id, status) VALUES ('Maroc Avril 2016', 'maroc-avril-2016', 'Maroc', '2016-04-01', '2016-04-14', '28/03/2016 : Bonjour à tous, dans 3 jours, nous décollerons de Nantes en direction de Marrakech. Cette année, nous avons élaboré un sympathique petit circuit : Marrakech, Ait Ben Haddou (3 nuits), Ouzoud (3 nuits), Bin el Ouidane (2 nuits) et Fez (2 nuits).



Voici ce que ça donne sur la carte (866 kms) :



![](https://storage.canalblog.com/13/03/1250329/109840312_o.jpg)



 



31/03/2016 - jeudi



Nous avons laissé notre voiture à Bouguenais et Emile nous emmène gentiment à l', '28/03/2016 : Bonjour à tous, dans 3 jours, nous décollerons de Nantes en direction de Marrakech. Cette année, nous avons élaboré un sympathique petit circuit : Marrakech, Ait Ben Haddou (3 nuits), Ouz', 'https://storage.canalblog.com/13/03/1250329/109840312_o.jpg', (SELECT id FROM folders WHERE slug = 'maroc'), 'published');
DELETE FROM articles WHERE slug = 'maroc-octobre-2016'; -- Clean up any existing data
INSERT INTO articles (title, slug, destination, start_date, end_date, content, short_description, cover_url, folder_id, status) VALUES ('Maroc Octobre 2016', 'maroc-octobre-2016', 'Maroc', '2016-10-07', '2016-10-16', '16/10/2016



Bonjour à tous,



exceptionnellement cette année, nous partons 2 fois au Maroc car en 2017 la pose des congés risque d', '16/10/2016



Bonjour à tous,



exceptionnellement cette année, nous partons 2 fois au Maroc car en 2017 la pose des congés risque d', 'https://storage.canalblog.com/85/61/1250329/112974243_o.jpg', (SELECT id FROM folders WHERE slug = 'maroc'), 'published');
DELETE FROM articles WHERE slug = 'oman-avril-2017'; -- Clean up any existing data
INSERT INTO articles (title, slug, destination, start_date, end_date, content, short_description, cover_url, folder_id, status) VALUES ('Oman Avril 2017', 'oman-avril-2017', 'Oman', '2017-04-01', '2017-04-14', 'Mercredi 15 mars 2017

Bonjour à tous,

Cette année, nous ne partons pas au Maroc. Et en plus, sans les enfants.

Nous avons décidé Séverine et moi de découvrir, l', 'Mercredi 15 mars 2017

Bonjour à tous,

Cette année, nous ne partons pas au Maroc. Et en plus, sans les enfants.

Nous avons décidé Séverine et moi de découvrir, l', 'https://image.canalblog.com/vQOOjFJcRAbRg4-c5jhpCS_hVyo=/filters:no_upscale()/https%3A%2F%2Fstorage.canalblog.com%2F47%2F57%2F1250329%2F115644118_o.jpg', (SELECT id FROM folders WHERE slug = 'oman'), 'published');
DELETE FROM articles WHERE slug = 'maroc-avril-2018'; -- Clean up any existing data
INSERT INTO articles (title, slug, destination, start_date, end_date, content, short_description, cover_url, folder_id, status) VALUES ('Maroc Avril 2018', 'maroc-avril-2018', 'Maroc', '2018-04-01', '2018-04-14', '![](https://storage.canalblog.com/81/04/1250329/120018741_o.jpg)



 5/04/2018, J -6



Salut,



Cette année, surprise : nous partons au Maroc !!



Séverine nous a concocté un sympathique petit circuit de 1598 kms, 2 fois plus qu', '![](https://storage.canalblog.com/81/04/1250329/120018741_o.jpg)



 5/04/2018, J -6



Salut,



Cette année, surprise : nous partons au Maroc !!



Séverine nous a concocté un sympathique petit circ', 'https://storage.canalblog.com/13/23/1250329/120018413_o.jpg', (SELECT id FROM folders WHERE slug = 'maroc'), 'published');
DELETE FROM articles WHERE slug = 'oman-mars-2019'; -- Clean up any existing data
INSERT INTO articles (title, slug, destination, start_date, end_date, content, short_description, cover_url, folder_id, status) VALUES ('Oman Mars 2019', 'oman-mars-2019', 'Oman', '2019-03-01', '2019-03-14', 'Salam Aleykoum,



Séverine et moi avons décidé de repartir en Oman, au pays de l', 'Salam Aleykoum,



Séverine et moi avons décidé de repartir en Oman, au pays de l', 'https://storage.canalblog.com/05/56/1250329/123055735_o.jpg', (SELECT id FROM folders WHERE slug = 'oman'), 'published');
DELETE FROM articles WHERE slug = 'maroc-octobre-2019'; -- Clean up any existing data
INSERT INTO articles (title, slug, destination, start_date, end_date, content, short_description, cover_url, folder_id, status) VALUES ('Maroc Octobre 2019', 'maroc-octobre-2019', 'Maroc', '2019-10-01', '2019-10-14', 'Cette année, petite nouveauté, nous partons .... au Maroc  :) :) 



Notre objectif : le festival Taragalte, qui aura lieu à M', 'Cette année, petite nouveauté, nous partons .... au Maroc  :) :) 



Notre objectif : le festival Taragalte, qui aura lieu à M', 'https://storage.canalblog.com/71/23/1250329/124952664_o.png', (SELECT id FROM folders WHERE slug = 'maroc'), 'published');
DELETE FROM articles WHERE slug = 'maroc-juillet-2020'; -- Clean up any existing data
INSERT INTO articles (title, slug, destination, start_date, end_date, content, short_description, cover_url, folder_id, status) VALUES ('Maroc Juillet 2020', 'maroc-juillet-2020', 'Maroc', '2020-07-01', '2020-07-14', 'Certains partent au ski, dans le froid, et bien nous, nous préférons partir au Maroc, dans le chaud  :)



C', 'Certains partent au ski, dans le froid, et bien nous, nous préférons partir au Maroc, dans le chaud  :)



C', 'https://storage.canalblog.com/70/72/1250329/125876070_o.jpg', (SELECT id FROM folders WHERE slug = 'maroc'), 'published');
DELETE FROM articles WHERE slug = 'maroc-septembre-2021'; -- Clean up any existing data
INSERT INTO articles (title, slug, destination, start_date, end_date, content, short_description, cover_url, folder_id, status) VALUES ('Maroc Septembre 2021', 'maroc-septembre-2021', 'Maroc', '2021-09-01', '2021-09-14', 'Bonsoir à tous,



Notre blog reprend vie.



Même si la lutte contre cette saloperie de pandemie est loin d', 'Bonsoir à tous,



Notre blog reprend vie.



Même si la lutte contre cette saloperie de pandemie est loin d', 'https://storage.canalblog.com/17/65/1250329/129806427_o.jpg', (SELECT id FROM folders WHERE slug = 'maroc'), 'published');
DELETE FROM articles WHERE slug = 'jordanie-avril-2022'; -- Clean up any existing data
INSERT INTO articles (title, slug, destination, start_date, end_date, content, short_description, cover_url, folder_id, status) VALUES ('Jordanie Avril 2022', 'jordanie-avril-2022', 'Jordanie', '2022-04-29', '2022-05-17', 'A force de voir des reportages sur Petra, nous avons décidé de visiter la Jordanie en Avril 2020.



Mais à cause du covid 19, nous avons dû attendre 2 ans avant de pouvoir concrétiser ce projet.



 



Nous restons dans la péninsule arabique, avec le soleil, le désert, les dromadaires et la culture musulmane. nous ne devrions pas être trop dépaysés je pense.



Voici le trajet que Séverine nous a concocté :



 



![](https://storage.canalblog.com/87/53/1250329/125876064_o.jpg)



 



 



 29/04/2022 - c', 'A force de voir des reportages sur Petra, nous avons décidé de visiter la Jordanie en Avril 2020.



Mais à cause du covid 19, nous avons dû attendre 2 ans avant de pouvoir concrétiser ce projet.', 'https://storage.canalblog.com/87/53/1250329/125876064_o.jpg', (SELECT id FROM folders WHERE slug = 'jordanie'), 'published');
DELETE FROM articles WHERE slug = 'maroc-2022'; -- Clean up any existing data
INSERT INTO articles (title, slug, destination, start_date, end_date, content, short_description, cover_url, folder_id, status) VALUES ('Maroc 2022', 'maroc-2022', 'Maroc', '2022-09-18', '2022-10-02', 'Cette année, nous n', 'Cette année, nous n', 'https://storage.canalblog.com/79/25/1250329/131830462_o.jpg', (SELECT id FROM folders WHERE slug = 'maroc'), 'published');
DELETE FROM articles WHERE slug = 'maroc-2023'; -- Clean up any existing data
INSERT INTO articles (title, slug, destination, start_date, end_date, content, short_description, cover_url, folder_id, status) VALUES ('Maroc 2023', 'maroc-2023', 'Maroc', '2023-04-01', '2023-04-14', '27/04/2023 - Les préparatifs



Nos valises se remplissent naturellement, machinalement. Nous savons exactement quoi emmener et comment organiser nos valises.



Le Maroc, on commence à bien le connaitre. 



Chaussures de randonnées au pieds, cirés sur le dos, nous décollerons de Nantes, samedi à 16 h, en direction de Marrakech.



Nous filerons directement aux cascades d', '27/04/2023 - Les préparatifs



Nos valises se remplissent naturellement, machinalement. Nous savons exactement quoi emmener et comment organiser nos valises.



Le Maroc, on commence à bien le connai', 'https://storage.canalblog.com/81/61/1250329/133066654_o.jpg', (SELECT id FROM folders WHERE slug = 'maroc'), 'published');
DELETE FROM articles WHERE slug = 'egypte-2023'; -- Clean up any existing data
INSERT INTO articles (title, slug, destination, start_date, end_date, content, short_description, cover_url, folder_id, status) VALUES ('Egypte 2023', 'egypte-2023', 'Egypte', '2023-11-07', '2023-11-25', 'Cette année 2023 a été assez mouvementée. Et en particulier le tremblement de terre au Maroc et l', 'Cette année 2023 a été assez mouvementée. Et en particulier le tremblement de terre au Maroc et l', 'https://storage.canalblog.com/29/59/1250329/133897557_o.jpg', (SELECT id FROM folders WHERE slug = 'egypte'), 'published');
DELETE FROM articles WHERE slug = 'maroc-2024'; -- Clean up any existing data
INSERT INTO articles (title, slug, destination, start_date, end_date, content, short_description, cover_url, folder_id, status) VALUES ('Maroc 2024', 'maroc-2024', 'Maroc', '2024-05-01', '2024-05-14', 'Y', 'Y', 'https://image.canalblog.com/akNe7qVPrUyD54E4MNbg10s2Cb4=/filters:no_upscale()/image%2F0948763%2F20240502%2Fob_4036d5_carte-maroc-2024.jpg', (SELECT id FROM folders WHERE slug = 'maroc'), 'published');
DELETE FROM articles WHERE slug = 'oman-2024'; -- Clean up any existing data
INSERT INTO articles (title, slug, destination, start_date, end_date, content, short_description, cover_url, folder_id, status) VALUES ('Oman 2024', 'oman-2024', 'Oman', '2024-10-01', '2024-10-14', 'Quand on aime, on y retourne !

Le sultanat d', 'Quand on aime, on y retourne !

Le sultanat d', 'https://image.canalblog.com/qN-0zDlt1N-7s8OHrhaei_JDJZA=/filters:no_upscale()/image%2F0948763%2F20241001%2Fob_4584d2_oman2024-carte1-ensemble.jpg', (SELECT id FROM folders WHERE slug = 'oman'), 'published');
DELETE FROM articles WHERE slug = 'oman-2024-suite'; -- Clean up any existing data
INSERT INTO articles (title, slug, destination, start_date, end_date, content, short_description, cover_url, folder_id, status) VALUES ('Oman 2024 – suite', 'oman-2024-suite', 'Oman', '2024-11-01', '2024-11-14', 'Petit crochet par le musée de l', 'Petit crochet par le musée de l', 'https://image.canalblog.com/9Umf0Lr3afwsNeC6JeKWc6JO2jU=/filters:no_upscale()/image%2F0948763%2F20241103%2Fob_ba5d68_20241024-122237.jpg', (SELECT id FROM folders WHERE slug = 'oman'), 'published');
DELETE FROM articles WHERE slug = 'tunisie-2025'; -- Clean up any existing data
INSERT INTO articles (title, slug, destination, start_date, end_date, content, short_description, cover_url, folder_id, status) VALUES ('Tunisie 2025', 'tunisie-2025', 'Tunisie', '2025-04-01', '2025-04-14', 'Petite nouveauté cette année: nous partons au Maghreb !

Mais cette fois-ci, un peu plus à l', 'Petite nouveauté cette année: nous partons au Maghreb !

Mais cette fois-ci, un peu plus à l', 'https://image.canalblog.com/vBFFaoQWN91Kfgl09v_tcoJA_J0=/filters:no_upscale()/image%2F0948763%2F20250429%2Fob_5fdc51_carte-tunisie.jpg', (SELECT id FROM folders WHERE slug = 'tunisie'), 'published');
DELETE FROM articles WHERE slug = 'maroc-2025'; -- Clean up any existing data
INSERT INTO articles (title, slug, destination, start_date, end_date, content, short_description, cover_url, folder_id, status) VALUES ('Maroc 2025', 'maroc-2025', 'Maroc', '2025-09-01', '2025-09-14', 'Après une petite escapade en Tunisie, nous reprenons la direction de notre pays de prédilection : Al Maghreb (Le Maroc). Avec au programme : du trek, du canyoning en passant par des endroits magnifiquement connus comme le lac Bin el Ouidane, le ksar Ait Ben Haddou, les cascades d', 'Après une petite escapade en Tunisie, nous reprenons la direction de notre pays de prédilection : Al Maghreb (Le Maroc). Avec au programme : du trek, du canyoning en passant par des endroits magnifiqu', 'https://image.canalblog.com/z8zYQC-2LxSyiyB-bG_XolDPZTg=/filters:no_upscale()/image%2F0948763%2F20250903%2Fob_e32b36_maroc-09-2025.jpg', (SELECT id FROM folders WHERE slug = 'maroc'), 'published');
DELETE FROM articles WHERE slug = 'mauritanie-fevrier-2026'; -- Clean up any existing data
INSERT INTO articles (title, slug, destination, start_date, end_date, content, short_description, cover_url, folder_id, status) VALUES ('Mauritanie Février 2026', 'mauritanie-fevrier-2026', 'Mauritanie', '2026-02-01', '2026-02-14', 'Cette fois-ci, c', 'Cette fois-ci, c', 'https://image.canalblog.com/Bpxh5ylp865iIEJBWeuiYC4XsXY=/filters:no_upscale()/image%2F0948763%2F20260206%2Fob_dddac4_2026-02-06-11h33-42.png', (SELECT id FROM folders WHERE slug = 'mauritanie'), 'published');
DELETE FROM articles WHERE slug = 'maroc-2026'; -- Clean up any existing data
INSERT INTO articles (title, slug, destination, start_date, end_date, content, short_description, cover_url, folder_id, status) VALUES ('Maroc 2026', 'maroc-2026', 'Maroc', '2026-03-01', '2026-03-14', 'Cette année, nous partons .... au Maroc !

Mais cette fois-ci, nous partons à 4.

Maxime, notre fils ainé qui n', 'Cette année, nous partons .... au Maroc !

Mais cette fois-ci, nous partons à 4.

Maxime, notre fils ainé qui n', 'https://profilepics.canalblog.com/profilepics/1/2/1205022.jpg', (SELECT id FROM folders WHERE slug = 'maroc'), 'published');