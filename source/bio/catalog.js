/* ================= every animal: a searchable catalogue ================= */
// Name[/Plural] | emoji | template | body mass (rabbit 0.35, deer 1.4, bison 2.5) | climate | colour | speed multiplier
const CATA_SRC=`Squirrel|🐿️|rod|.25|T|8a5a3a
Chipmunk|🐿️|rod|.12|T|a0703c
Hamster|🐹|rod|.1|T|d9a066
Guinea pig|🐹|rod|.15|W|c8884a
Rat|🐀|rod|.15|A|6b6258
Hedgehog|🦔|rod|.15|T|8a7a66
Porcupine|🦔|rod|.5|T|5c5248
Hare|🐇|rod|.4|T|a08866|1.3
Arctic hare|🐇|rod|.4|P|ecebe6|1.2
Marmot|🐿️|rod|.4|C|7a5c3e
Prairie dog|🐿️|rod|.2|T|b08a5a
Lemming|🐁|rod|.08|P|8a6a4a
Gerbil|🐁|rod|.08|D|c9a06a
Chinchilla|🐭|rod|.12|C|a8a8a8
Mole|🐁|rod|.1|T|3a3430
Shrew|🐁|rod|.03|T|5a4a40
Vole|🐁|rod|.05|T|6a5440
Pika|🐭|rod|.1|C|9a8068
Kangaroo rat|🐀|rod|.06|D|c8a070
Horse|🐎|graz|2|T|8a5a36|1.2
Pony|🐎|graz|1.2|T|a07048
Zebu|🐂|graz|2.4|W|cfc6b8
Donkey|🫏|graz|1.4|W|8a8078
Cow|🐄|graz|2.5|T|e6e1d8
Bull|🐂|graz|2.8|T|3a2a20
Sheep/Sheep|🐑|graz|1|T|eeeadf
Goat|🐐|graz|.9|T|d8d0c0
Mountain goat|🐐|graz|1|C|f0f0ea
Antelope|🦌|graz|1.2|W|c08a50|1.2
Gazelle|🦌|graz|1|W|c9a06a|1.4
Impala/Impala|🦌|graz|1.1|W|b8743c|1.3
Springbok|🦌|graz|.9|D|c8945a|1.3
Wildebeest/Wildebeest|🐃|graz|2|W|5a5048
Moose/Moose|🫎|graz|3|C|4a3a2c
Elk/Elk|🦌|graz|2.4|C|8a6440
Reindeer/Reindeer|🦌|graz|1.6|P|8a7a6a
Caribou/Caribou|🦌|graz|1.6|P|8a7a6a
Llama|🦙|graz|1.6|C|e0d8c8
Alpaca|🦙|graz|1.1|C|d8c8b0
Yak|🐂|graz|2.6|P|3a302a
Ox/Oxen|🐂|graz|2.8|T|6a4a30
Water buffalo/Water buffalo|🐃|graz|3|H|3a3632
Buffalo/Buffalo|🐃|graz|3|W|3a3230
Kangaroo|🦘|graz|1.2|W|b08060|1.3
Wallaby|🦘|graz|.7|W|8a7058
Koala|🐨|graz|.4|W|9a9a98|.4
Sloth|🦥|graz|.3|H|8a7a60|.15
Okapi|🦒|graz|1.8|H|5a3a2a
Tapir|🐖|graz|1.8|H|3a3a3a
Musk ox/Musk oxen|🐂|graz|2.8|P|3a2e26
Bighorn sheep/Bighorn sheep|🐏|graz|1.2|C|8a7058
Ram|🐏|graz|1.1|T|e0dbcf
Ibex/Ibex|🐐|graz|1|C|8a7058
Giant panda|🐼|graz|1.4|T|f2f2f2|.5
Red panda|🐼|graz|.3|T|b0482a|.7
Ostrich/Ostriches|🦤|graz|1.3|D|3a3632|1.5
Emu|🦤|graz|1|W|5a4a3a|1.3
Rhea|🦤|graz|.8|T|8a8070|1.3
Camel|🐪|graz|2.4|D|c9a46a
Dromedary|🐪|graz|2.4|D|c9a46a
Vicuna|🦙|graz|.8|C|c8945a
Elephant|🐘|giant|7|H|8a8580
African elephant|🐘|giant|7.5|H|8a8580
Asian elephant|🐘|giant|6|H|7a7570
Rhinoceros/Rhinoceroses|🦏|giant|5|H|8a8480
Rhino|🦏|giant|5|H|8a8480
Giraffe|🦒|giant|4|H|d8a050
Mammoth|🦣|giant|7|P|6a4a30
Mastodon|🦣|giant|6|C|5a3e28
Hippopotamus/Hippopotamuses|🦛|ahrb|5|H|7a6a6a
Hippo|🦛|ahrb|5|H|7a6a6a
Capybara|🦫|ahrb|.9|H|8c6a46
Beaver|🦫|ahrb|.6|C|6b4a2e
Muskrat|🦫|ahrb|.2|T|5a4030
Nutria|🦫|ahrb|.4|T|6a5040
Cat|🐈|scarn|.5|A|c88a4a
Black cat|🐈‍⬛|scarn|.5|A|222222
Wildcat|🐈|scarn|.5|T|8a7a60
Lynx/Lynxes|🐈|scarn|.9|C|b8a080
Bobcat|🐈|scarn|.8|T|a08868
Weasel|🦡|scarn|.2|T|8a5a30
Stoat|🦡|scarn|.2|C|8a5a30
Ermine|🦡|scarn|.2|P|f2f2ee
Ferret|🦡|scarn|.25|T|c8b090
Mink|🦦|scarn|.3|C|3a2a20
Mongoose/Mongooses|🦡|scarn|.3|W|8a7a60
Meerkat|🦡|scarn|.2|D|c9a878
Jackal|🐕|scarn|.7|W|b08a5a
Coyote|🐺|scarn|.9|T|a08060
Arctic fox/Arctic foxes|🦊|scarn|.5|P|f2f2f2
Fennec fox/Fennec foxes|🦊|scarn|.3|D|e8c890
Red fox/Red foxes|🦊|scarn|.6|T|c8642a
Dingo/Dingoes|🐕|scarn|.9|W|c89050
Dog|🐕|scarn|.9|A|b08050
Wolf dog|🐕‍🦺|scarn|1|C|7a7068
Wolverine|🦡|scarn|.8|C|4a3426
Ocelot|🐆|scarn|.6|H|c8964a
Serval|🐆|scarn|.7|W|d8a858
Caracal|🐈|scarn|.7|D|c88a50
Fossa|🐈|scarn|.6|H|8a5a30
Tasmanian devil|🦡|scarn|.5|T|2a2a2a
Honey badger|🦡|scarn|.6|W|3a3a3a
Tiger|🐅|bcarn|2|H|e08a30
Bengal tiger|🐅|bcarn|2|H|e08a30
Siberian tiger|🐅|bcarn|2.4|C|d8903a
Leopard|🐆|bcarn|1.4|H|d8a050
Jaguar|🐆|bcarn|1.6|H|c8903a
Cheetah|🐆|bcarn|1.2|W|e0b060|1.45
Cougar|🐈|bcarn|1.4|T|b08a60
Puma|🐈|bcarn|1.4|T|b08a60
Mountain lion|🦁|bcarn|1.4|T|b08a60
Snow leopard|🐆|bcarn|1|P|d8d8d0
Black panther|🐈‍⬛|bcarn|1.5|H|1e1e1e
Hyena|🐕|bcarn|1.4|W|a08a60
African wild dog|🐕|bcarn|.9|W|8a6a40
Gray wolf/Gray wolves|🐺|bcarn|1.2|C|8a8680
Arctic wolf/Arctic wolves|🐺|bcarn|1.2|P|f0f0ea
Dire wolf/Dire wolves|🐺|bcarn|1.5|C|6a625a
Sabre-toothed cat|🐅|bcarn|2.2|C|b08850
Komodo dragon|🦎|bcarn|1.2|H|5a5a40|.7
Polar bear|🐻‍❄️|bcarn|3|P|f0f0ea|.9
Pig|🐖|omni|1.2|T|e8b0a8
Wild boar|🐗|omni|1.2|T|4a3a30
Warthog|🐗|omni|1|W|6a5a50
Grizzly bear|🐻|omni|2.6|C|6a4a30
Brown bear|🐻|omni|2.4|C|5b3e29
Black bear|🐻|omni|2|T|1e1e1e
Panda bear|🐼|omni|1.4|T|f2f2f2
Raccoon|🦝|omni|.5|T|7a7470
Skunk|🦨|omni|.4|T|222222
Badger|🦡|omni|.7|T|6a6460
Opossum|🐀|omni|.2|T|c8c8c0
Armadillo|🦔|omni|.2|W|8a7a6a
Anteater|🐜|omni|.6|H|6a5a48
Aardvark|🐖|omni|.7|W|a08870
Monkey|🐒|omni|.4|H|8a6040
Gorilla|🦍|omni|2|H|2a2a2a
Chimpanzee|🐒|omni|.8|H|3a3030
Orangutan|🦧|omni|1|H|b05a20
Baboon|🐒|omni|.5|W|8a7a60
Lemur|🐒|omni|.2|H|9a9a9a
Gibbon|🐒|omni|.3|H|3a3028
Platypus/Platypuses|🦫|omni|.2|T|6a4a30
Pigeon|🕊️|bird|.05|A|8a8a98
Dove|🕊️|bird|.04|A|e8e4e0
Sparrow|🐦|bird|.02|T|8a6a4a
Robin|🐦|bird|.03|T|b06040
Bluebird|🐦|bird|.03|T|3a6ab0
Parrot|🦜|bird|.06|H|3ab040
Macaw|🦜|bird|.1|H|d03030
Cockatoo|🦜|bird|.08|W|f0f0e8
Toucan|🐦|bird|.08|H|1e1e1e
Crow|🐦‍⬛|bird|.08|A|222222
Raven|🐦‍⬛|bird|.1|C|111111
Magpie|🐦‍⬛|bird|.06|T|202020
Hummingbird|🐦|bird|.005|H|3ab07a
Woodpecker|🐦|bird|.05|T|b02a2a
Bat|🦇|bird|.03|A|3a3030
Duck|🦆|bird|.1|T|6a7a3a
Goose/Geese|🪿|bird|.2|C|8a8a80
Swan|🦢|bird|.4|T|f4f4f0
Flamingo|🦩|bird|.3|W|f090a0
Canary/Canaries|🐦|bird|.02|W|f0d040
Chicken|🐔|gbird|.2|A|e8e0d0
Rooster|🐓|gbird|.25|A|b04020
Turkey|🦃|gbird|.4|T|5a3a2a
Peacock|🦚|gbird|.3|H|2a6ab0
Dodo|🦤|gbird|.4|W|8a8070
Quail|🐦|gbird|.03|T|8a6a48
Pheasant|🐦|gbird|.1|T|a05a30
Eagle|🦅|rapt|.5|A|4a3420
Bald eagle|🦅|rapt|.5|C|3a2818
Golden eagle|🦅|rapt|.5|C|7a5428
Falcon|🦅|rapt|.15|A|6a5a4a|1.3
Peregrine falcon|🦅|rapt|.15|A|5a5a5a|1.4
Owl|🦉|rapt|.15|T|8a7050
Snowy owl|🦉|rapt|.2|P|f0f0ea
Vulture|🦅|rapt|.5|W|3a3028
Condor|🦅|rapt|.6|C|1e1e1e
Kite|🦅|rapt|.2|T|8a5a30
Buzzard|🦅|rapt|.3|T|6a4a30
Osprey|🦅|sbird|.3|A|6a5a4a
Pelican|🐦|sbird|.5|W|f0f0ea
Seagull|🐦|sbird|.1|A|e8e8e8
Gull|🐦|sbird|.1|A|e8e8e8
Puffin|🐦|sbird|.05|P|1e1e1e
Kingfisher|🐦|sbird|.03|T|2a7ab0
Heron|🐦|sbird|.2|T|9a9aa0
Stork|🐦|sbird|.3|T|f0f0ea
Albatross/Albatrosses|🐦|sbird|.5|C|f0f0ea
Cormorant|🐦‍⬛|sbird|.2|T|1e1e1e
Seal|🦭|marine|1.2|P|6a6a70
Sea lion|🦭|marine|1.5|C|7a5a40
Walrus/Walruses|🦭|marine|3|P|8a6a5a
Penguin|🐧|marine|.3|P|222222
Emperor penguin|🐧|marine|.5|P|222222
Sea otter|🦦|marine|.4|C|5a4030
River otter|🦦|marine|.35|T|4f3a2a
Crocodile|🐊|croc|2|H|4a5a30
Alligator|🐊|croc|2|W|3a4a2a
Caiman|🐊|croc|1|H|5a6040
Goldfish/Goldfish|🐠|fish|.05|W|f08a20
Clownfish/Clownfish|🐠|fish|.03|H|f07020
Salmon/Salmon|🐟|fish|.2|C|c87a70
Trout/Trout|🐟|fish|.15|C|9a8a70
Carp/Carp|🐟|fish|.2|T|b09050
Cod/Cod|🐟|fish|.3|C|8a8a70
Sardine|🐟|fish|.02|A|a8b8c8
Herring/Herring|🐟|fish|.03|C|a8b8c8
Catfish/Catfish|🐟|fish|.2|W|6a6050
Pufferfish/Pufferfish|🐡|fish|.05|H|d8c070
Seahorse|🐠|fish|.01|H|e0a040
Angelfish/Angelfish|🐠|fish|.04|H|f0d040
Tuna/Tuna|🐟|fish|.8|T|3a4a6a|1.3
Jellyfish/Jellyfish|🪼|fish|.05|A|c8a0e0|.4
Shrimp/Shrimp|🦐|fish|.01|A|f0a080
Lobster|🦞|fish|.1|C|c03020|.5
Crab|🦀|herp|.05|A|d04020
Starfish/Starfish|⭐|fish|.03|W|f08040|.1
Manta ray|🐟|fish|.8|H|2a2a30
Stingray|🐟|fish|.4|H|6a6050
Sea turtle|🐢|fish|.8|H|5a6a3a|.7
Manatee|🐋|whale|3|H|7a7a78|.5
Dugong|🐋|whale|3|H|8a8070|.5
Blue whale|🐋|whale|30|C|5a6a80
Humpback whale|🐋|whale|15|C|3a4048
Whale|🐳|whale|15|C|4a5a70
Sperm whale|🐋|dolph|14|T|4a4a50
Orca|🐋|dolph|6|P|1e1e1e
Killer whale|🐋|dolph|6|P|1e1e1e
Dolphin|🐬|dolph|1.5|T|7a8a9a
Porpoise|🐬|dolph|1|C|6a7480
Narwhal|🐋|dolph|1.6|P|9a9a98
Beluga|🐋|dolph|1.5|P|f0f0ea
Shark|🦈|pfish|3|W|6a7a8a
Great white shark|🦈|pfish|4|T|7a8a98
Hammerhead shark|🦈|pfish|2.5|H|6a7a8a
Tiger shark|🦈|pfish|3|H|7a7a70
Pike|🐟|pfish|.4|C|6a7a40
Barracuda|🐟|pfish|.5|H|9aa0a8
Piranha|🐟|pfish|.05|H|c04030
Swordfish/Swordfish|🐟|pfish|1.2|T|4a5a7a|1.3
Eel|🐍|pfish|.2|T|3a3a28
Octopus/Octopuses|🐙|pfish|.3|T|c05a40
Squid/Squid|🦑|pfish|.3|C|e0a090
Snake|🐍|snake|.2|W|5a7a3a
Python|🐍|snake|.8|H|8a7040
Cobra|🐍|snake|.3|H|5a4a30
Rattlesnake|🐍|snake|.2|D|b09060
Anaconda|🐍|snake|1.2|H|4a5a30
Viper|🐍|snake|.15|W|6a5a30
Lizard|🦎|rept|.05|W|6a8a3a
Gecko|🦎|rept|.02|H|8ab040
Chameleon|🦎|rept|.03|H|5ab040|.5
Iguana|🦎|tort|.3|H|5a8a3a
Tortoise/Tortoises|🐢|tort|.5|D|7a6a4a
Turtle|🐢|herp|.3|T|5a6a3a
Frog|🐸|herp|.03|T|4a9a3a
Toad|🐸|herp|.04|T|7a6a40
Salamander|🦎|herp|.02|T|c06020
Newt|🦎|herp|.01|T|b06030
Axolotl|🦎|herp|.02|T|f0b0b0
Butterfly/Butterflies|🦋|insect|.002|W|f08a20
Moth|🦋|insect|.002|T|c8b8a0
Bee|🐝|insect|.001|T|e0b020
Wasp|🐝|insect|.001|T|e0c020
Dragonfly/Dragonflies|🪰|insect|.002|T|3a8ab0
Fly/Flies|🪰|insect|.001|A|3a3a3a
Mosquito/Mosquitoes|🦟|insect|.001|W|5a5a5a
Ladybug|🐞|bug|.001|T|d02020
Ant|🐜|bug|.001|A|3a2a20
Beetle|🪲|bug|.002|T|2a3a4a
Grasshopper|🦗|bug|.003|W|6aa03a
Cricket|🦗|bug|.002|T|5a4a30
Caterpillar|🐛|bug|.002|T|6ab040
Snail|🐌|bug|.003|T|a08a60|.2
Worm|🪱|bug|.002|T|c08070|.2
Spider|🕷️|rept|.005|A|2a2a2a
Tarantula|🕷️|rept|.02|H|4a3a30
Scorpion|🦂|rept|.01|D|8a6a30
T-rex/T-rexes|🦖|bcarn|8|W|6a6a40
Tyrannosaurus/Tyrannosauruses|🦖|bcarn|8|W|6a6a40
Velociraptor|🦖|scarn|.5|W|8a7050|1.3
Spinosaurus/Spinosauruses|🦖|croc|7|H|6a5a40
Brachiosaurus/Brachiosauruses|🦕|giant|20|W|7a8070
Diplodocus/Diplodocuses|🦕|giant|15|W|6a7a68
Triceratops/Triceratopses|🦕|giant|8|W|8a7050
Stegosaurus/Stegosauruses|🦕|giant|5|W|7a7a50
Dinosaur|🦕|giant|10|W|6a7a68
Dragon|🐉|bcarn|6|A|3a7a3a|1.2
Unicorn|🦄|graz|2|T|f4f0f8|1.3`;
const ATPL={rod:{diet:'herb',hab:'land',spd:1},graz:{diet:'herb',hab:'land',herd:1,spd:1.8},giant:{diet:'herb',hab:'land',herd:1,spd:1.1,browse:1},
 scarn:{diet:'carn',hab:'land',spd:1.85},bcarn:{diet:'carn',hab:'land',spd:2.1,big:1},omni:{diet:'omni',hab:'land',spd:1.3},
 bird:{diet:'herb',hab:'air',spd:2.6},gbird:{diet:'herb',hab:'land',spd:1.5},rapt:{diet:'carn',hab:'air',spd:3},sbird:{diet:'carn',hab:'air',spd:2.6,fishy:1},
 marine:{diet:'carn',hab:'amph',spd:1.6,fishy:1},croc:{diet:'carn',hab:'amph',spd:1.4,big:1},fish:{diet:'herb',hab:'water',herd:1,spd:1.4,shape:'fish'},
 pfish:{diet:'carn',hab:'water',spd:1.9,shape:'fish'},whale:{diet:'herb',hab:'water',spd:1.2,shape:'fish'},dolph:{diet:'carn',hab:'water',spd:2.2,shape:'fish',herd:1,big:1},
 rept:{diet:'carn',hab:'land',spd:1.1},snake:{diet:'carn',hab:'land',spd:1.1,shape:'snake'},herp:{diet:'herb',hab:'amph',spd:.7},tort:{diet:'herb',hab:'land',spd:.35},
 insect:{diet:'herb',hab:'air',spd:1.6},bug:{diet:'herb',hab:'land',spd:.4},ahrb:{diet:'herb',hab:'amph',herd:1,spd:1}};
const CLIMS={P:[-45,15],C:[-30,26],T:[-12,34],W:[0,42],H:[10,44],D:[3,52],A:[-22,40]};
function pluralOf(n){if(/(s|x|z|ch|sh)$/i.test(n))return n+'es';if(/[^aeiou]y$/i.test(n))return n.slice(0,-1)+'ies';if(/(wolf)$/i.test(n))return n.slice(0,-1)+'ves';if(/mouse$/i.test(n))return n.replace(/mouse$/i,'mice');return n+'s'}
const CATA=CATA_SRC.split('\n').map(l=>{const [nm,ic,tp,m,cl,col,sm]=l.split('|');const [n,pl]=nm.split('/');return{n,pl:pl||pluralOf(n),ic,tp,mass:+m,cl,col:'#'+col,sm:sm?+sm:1,key:'x_'+n.toLowerCase().replace(/[^a-z0-9]+/g,'_')}}).filter(c=>!SPK.some(k=>SP[k].n.toLowerCase()===c.n.toLowerCase()));
// base species keep their hand-tuned values; give them a template too so new animals can fit into their food chains
const BASE_TPL={rabbit:'rod',mouse:'rod',deer:'graz',bison:'graz',zebra:'graz',camel:'graz',fox:'scarn',wolf:'bcarn',lion:'bcarn',bear:'omni',hawk:'rapt',fish:'fish',otter:'marine'};
for(const k of SPK){SP[k].tp=BASE_TPL[k];if(SP[k].hab==='water')SP[k].shape='fish'}
// can predator p eat species q? (by size and where they live)
function fitsPrey(p,q){const P=SP[p],Q=SP[q];if(p===q||P.diet==='herb'||!Q)return false;const T=ATPL[P.tp]||{},m=P.mass,qm=Q.mass;
  if(T.hunter)return Q.tp!=='human'&&(Q.hab==='land'||Q.hab==='amph'||Q.hab==='water'&&qm>=0.1)&&qm>=0.1&&qm<=10;
  if(Q.tp==='human'&&m<3)return false;// only the very largest predators take people
  const hi=m*(T.big?1.4:P.diet==='omni'?0.5:0.9)*(PACKS.has(p)?1.8:1),lo=m*0.02;if(qm>hi||qm<lo)return false;
  if(P.hab==='land')return Q.hab==='land'||Q.hab==='amph';
  if(P.hab==='water')return Q.hab==='water'||Q.hab==='amph';
  if(P.hab==='amph')return T.fishy?(Q.hab==='water'):(Q.hab!=='air');
  if(P.hab==='air')return T.fishy?Q.hab==='water':(qm<=0.6&&Q.hab!=='air');return false}
function addSpecies(c,quiet){if(SP[c.key])return c.key;const T=ATPL[c.tp],m=c.mass,[tmin,tmax]=CLIMS[c.cl]||CLIMS.T,herb=T.diet==='herb';
  const life=clamp(1800*Math.pow(m,0.28),250,40000),s={n:c.n,pl:c.pl,ic:c.ic,col:c.col,diet:T.diet,hab:T.hab,tp:c.tp,shape:T.shape,herd:T.herd,browse:T.browse,cat:1,
    len:clamp(8.5*Math.pow(m,0.36),2.2,28)*(T.shape==='snake'?1.5:1),wid:T.shape==='snake'?.13:T.shape==='fish'?.36:T.hab==='air'?.35:.45,
    spd:T.spd*c.sm*clamp(Math.pow(m,0.08),0.7,1.3),sense:(6+4*Math.pow(m,0.3))*(c.tp==='rapt'?1.6:1),
    meta:clamp((herb?0.045:0.024)*Math.pow(m,-0.12),0.012,0.08)*(c.tp==='whale'?0.5:1),thirst:T.hab==='water'||T.hab==='amph'?0:c.cl==='D'?0.015:T.hab==='air'?0.03:0.06,
    life,mature:clamp(life*0.13,25,5000),gest:clamp(45*Math.pow(m,0.35),12,650),litter:m<0.1?[3,7]:m<0.5?[2,4]:m<2?[1,2]:[1,1],repE:.7,
    eat:herb||T.diet==='omni'?clamp(0.08*Math.pow(m,0.35),0.02,1.2):undefined,conv:herb||T.diet==='omni'?clamp(6*Math.pow(m,-0.25),1.5,9):undefined,sparse:c.cl==='D'?1:undefined,
    tmin,tmax,mass:m,prey:T.diet==='herb'?undefined:[]};
  SP[c.key]=s;SPK.push(c.key);SPCAP[c.key]=m>=4?60:m>=1.5?150:m<0.01?90:m<0.1?130:260;// tiny animals are capped lower so the world stays fast
  if(s.prey)s.prey=SPK.filter(q=>fitsPrey(c.key,q));
  for(const k of SPK)if(k!==c.key&&SP[k].prey&&fitsPrey(k,c.key))SP[k].prey.push(c.key);
  for(const k of SPK)PREDS[k]=SPK.filter(p=>(SP[p].prey||[]).includes(k));
  try{SPCOL[c.key]=c.col}catch(e){}if(!quiet){chEv('newsp',{sp:c.key});NEWSP++;addRailTool(c.key)}return c.key}
let NEWSP=0;
// human hunters: smart, patient and armed, so they can bring down animals far bigger than themselves
ATPL.human={diet:'omni',hab:'land',spd:1.4,hunter:1};
const HUMAN={n:'Human hunter',pl:'Human hunters',ic:'🏹',tp:'human',mass:1,cl:'A',col:'#c89a70',sm:1,key:'x_human_hunter'};
function setupHuman(){const k=addSpecies(HUMAN,true),s=SP[k];Object.assign(s,{diet:'omni',eat:.1,conv:2.2,sense:18,meta:.012,life:65*365,mature:16*365,gest:270,litter:[1,1],repE:.6,thirst:.05,shape:'human',herd:1,tmin:-25,tmax:42});SPCAP[k]=100}
