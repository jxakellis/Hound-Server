import { Queryable, RowDataPacket, databaseQuery } from '../../main/database/databaseQuery';
import { hash } from '../../main/format/hash';
import { ERROR_CODES, HoundError } from '../../main/server/globalErrors';

import { isUserIdInFamily } from '../getFor/getForFamily';

const familyCodeLength = 8;

const swearWords = [
  '2G1C',
  '2 GIRLS 1 CUP',
  'ACROTOMOPHILIA',
  'ALABAMA HOT POCKET',
  'ALASKAN PIPELINE',
  'ANAL',
  'ANILINGUS',
  'ANUS',
  'APESHIT',
  'ARSEHOLE',
  'ASS',
  'ASSHOLE',
  'ASSMUNCH',
  'AUTO EROTIC',
  'AUTOEROTIC',
  'BABELAND',
  'BABY BATTER',
  'BABY JUICE',
  'BALL GAG',
  'BALL GRAVY',
  'BALL KICKING',
  'BALL LICKING',
  'BALL SACK',
  'BALL SUCKING',
  'BANGBROS',
  'BANGBUS',
  'BAREBACK',
  'BARELY LEGAL',
  'BARENAKED',
  'BASTARD',
  'BASTARDO',
  'BASTINADO',
  'BBW',
  'BDSM',
  'BEANER',
  'BEANERS',
  'BEAVER CLEAVER',
  'BEAVER LIPS',
  'BEASTIALITY',
  'BESTIALITY',
  'BIG BLACK',
  'BIG BREASTS',
  'BIG KNOCKERS',
  'BIG TITS',
  'BIMBOS',
  'BIRDLOCK',
  'BITCH',
  'BITCHES',
  'BLACK COCK',
  'BLONDE ACTION',
  'BLONDE ON BLONDE ACTION',
  'BLOWJOB',
  'BLOW JOB',
  'BLOW YOUR LOAD',
  'BLUE WAFFLE',
  'BLUMPKIN',
  'BOLLOCKS',
  'BONDAGE',
  'BONER',
  'BOOB',
  'BOOBS',
  'BOOTY CALL',
  'BROWN SHOWERS',
  'BRUNETTE ACTION',
  'BUKKAKE',
  'BULLDYKE',
  'BULLET VIBE',
  'BULLSHIT',
  'BUNG HOLE',
  'BUNGHOLE',
  'BUSTY',
  'BUTT',
  'BUTTCHEEKS',
  'BUTTHOLE',
  'CAMEL TOE',
  'CAMGIRL',
  'CAMSLUT',
  'CAMWHORE',
  'CARPET MUNCHER',
  'CARPETMUNCHER',
  'CHOCOLATE ROSEBUDS',
  'CIALIS',
  'CIRCLEJERK',
  'CLEVELAND STEAMER',
  'CLIT',
  'CLITORIS',
  'CLOVER CLAMPS',
  'CLUSTERFUCK',
  'COCK',
  'COCKS',
  'COPROLAGNIA',
  'COPROPHILIA',
  'CORNHOLE',
  'COON',
  'COONS',
  'CREAMPIE',
  'CUM',
  'CUMMING',
  'CUMSHOT',
  'CUMSHOTS',
  'CUNNILINGUS',
  'CUNT',
  'DARKIE',
  'DATE RAPE',
  'DATERAPE',
  'DEEP THROAT',
  'DEEPTHROAT',
  'DENDROPHILIA',
  'DICK',
  'DILDO',
  'DINGLEBERRY',
  'DINGLEBERRIES',
  'DIRTY PILLOWS',
  'DIRTY SANCHEZ',
  'DOGGIE STYLE',
  'DOGGIESTYLE',
  'DOGGY STYLE',
  'DOGGYSTYLE',
  'DOG STYLE',
  'DOLCETT',
  'DOMINATION',
  'DOMINATRIX',
  'DOMMES',
  'DONKEY PUNCH',
  'DOUBLE DONG',
  'DOUBLE PENETRATION',
  'DP ACTION',
  'DRY HUMP',
  'DVDA',
  'EAT MY ASS',
  'ECCHI',
  'EJACULATION',
  'EROTIC',
  'EROTISM',
  'ESCORT',
  'EUNUCH',
  'FAG',
  'FAGGOT',
  'FECAL',
  'FELCH',
  'FELLATIO',
  'FELTCH',
  'FEMALE SQUIRTING',
  'FEMDOM',
  'FIGGING',
  'FINGERBANG',
  'FINGERING',
  'FISTING',
  'FOOT FETISH',
  'FOOTJOB',
  'FROTTING',
  'FUCK',
  'FUCK BUTTONS',
  'FUCKIN',
  'FUCKING',
  'FUCKTARDS',
  'FUDGE PACKER',
  'FUDGEPACKER',
  'FUTANARI',
  'GANGBANG',
  'GANG BANG',
  'GAY SEX',
  'GENITALS',
  'GIANT COCK',
  'GIRL ON',
  'GIRL ON TOP',
  'GIRLS GONE WILD',
  'GOATCX',
  'GOATSE',
  'GOD DAMN',
  'GOKKUN',
  'GOLDEN SHOWER',
  'GOODPOOP',
  'GOO GIRL',
  'GOREGASM',
  'GROPE',
  'GROUP SEX',
  'G-SPOT',
  'GURO',
  'HAND JOB',
  'HANDJOB',
  'HARD CORE',
  'HARDCORE',
  'HENTAI',
  'HOMOEROTIC',
  'HONKEY',
  'HOOKER',
  'HORNY',
  'HOT CARL',
  'HOT CHICK',
  'HOW TO KILL',
  'HOW TO MURDER',
  'HUGE FAT',
  'HUMPING',
  'INCEST',
  'INTERCOURSE',
  'JACK OFF',
  'JAIL BAIT',
  'JAILBAIT',
  'JELLY DONUT',
  'JERK OFF',
  'JIGABOO',
  'JIGGABOO',
  'JIGGERBOO',
  'JIZZ',
  'JUGGS',
  'KIKE',
  'KINBAKU',
  'KINKSTER',
  'KINKY',
  'KNOBBING',
  'LEATHER RESTRAINT',
  'LEATHER STRAIGHT JACKET',
  'LEMON PARTY',
  'LIVESEX',
  'LOLITA',
  'LOVEMAKING',
  'MAKE ME COME',
  'MALE SQUIRTING',
  'MASTURBATE',
  'MASTURBATING',
  'MASTURBATION',
  'MENAGE A TROIS',
  'MILF',
  'MISSIONARY POSITION',
  'MONG',
  'MOTHERFUCKER',
  'MOUND OF VENUS',
  'MR HANDS',
  'MUFF DIVER',
  'MUFFDIVING',
  'NAMBLA',
  'NAWASHI',
  'NEGRO',
  'NEONAZI',
  'NIGGA',
  'NIGGER',
  'NIG NOG',
  'NIMPHOMANIA',
  'NIPPLE',
  'NIPPLES',
  'NSFW',
  'NSFW IMAGES',
  'NUDE',
  'NUDITY',
  'NUTTEN',
  'NYMPHO',
  'NYMPHOMANIA',
  'OCTOPUSSY',
  'OMORASHI',
  'ONE CUP TWO GIRLS',
  'ONE GUY ONE JAR',
  'ORGASM',
  'ORGY',
  'PAEDOPHILE',
  'PAKI',
  'PANTIES',
  'PANTY',
  'PEDOBEAR',
  'PEDOPHILE',
  'PEGGING',
  'PENIS',
  'PHONE SEX',
  'PIECE OF SHIT',
  'PIKEY',
  'PISSING',
  'PISS PIG',
  'PISSPIG',
  'PLAYBOY',
  'PLEASURE CHEST',
  'POLE SMOKER',
  'PONYPLAY',
  'POOF',
  'POON',
  'POONTANG',
  'PUNANY',
  'POOP CHUTE',
  'POOPCHUTE',
  'PORN',
  'PORNO',
  'PORNOGRAPHY',
  'PRINCE ALBERT PIERCING',
  'PTHC',
  'PUBES',
  'PUSSY',
  'QUEAF',
  'QUEEF',
  'QUIM',
  'RAGHEAD',
  'RAGING BONER',
  'RAPE',
  'RAPING',
  'RAPIST',
  'RECTUM',
  'REVERSE COWGIRL',
  'RIMJOB',
  'RIMMING',
  'ROSY PALM',
  'ROSY PALM AND HER 5 SISTERS',
  'RUSTY TROMBONE',
  'SADISM',
  'SANTORUM',
  'SCAT',
  'SCHLONG',
  'SCISSORING',
  'SEMEN',
  'SEX',
  'SEXCAM',
  'SEXO',
  'SEXY',
  'SEXUAL',
  'SEXUALLY',
  'SEXUALITY',
  'SHAVED BEAVER',
  'SHAVED PUSSY',
  'SHEMALE',
  'SHIBARI',
  'SHIT',
  'SHITBLIMP',
  'SHITTY',
  'SHOTA',
  'SHRIMPING',
  'SKEET',
  'SLANTEYE',
  'SLUT',
  'S&M',
  'SMUT',
  'SNATCH',
  'SNOWBALLING',
  'SODOMIZE',
  'SODOMY',
  'SPASTIC',
  'SPIC',
  'SPLOOGE',
  'SPLOOGE MOOSE',
  'SPOOGE',
  'SPREAD LEGS',
  'SPUNK',
  'STRAP ON',
  'STRAPON',
  'STRAPPADO',
  'STRIP CLUB',
  'STYLE DOGGY',
  'SUCK',
  'SUCKS',
  'SUICIDE GIRLS',
  'SULTRY WOMEN',
  'SWASTIKA',
  'SWINGER',
  'TAINTED LOVE',
  'TASTE MY',
  'TEA BAGGING',
  'THREESOME',
  'THROATING',
  'THUMBZILLA',
  'TIED UP',
  'TIGHT WHITE',
  'TIT',
  'TITS',
  'TITTIES',
  'TITTY',
  'TONGUE IN A',
  'TOPLESS',
  'TOSSER',
  'TOWELHEAD',
  'TRANNY',
  'TRIBADISM',
  'TUB GIRL',
  'TUBGIRL',
  'TUSHY',
  'TWAT',
  'TWINK',
  'TWINKIE',
  'TWO GIRLS ONE CUP',
  'UNDRESSING',
  'UPSKIRT',
  'URETHRA PLAY',
  'UROPHILIA',
  'VAGINA',
  'VENUS MOUND',
  'VIAGRA',
  'VIBRATOR',
  'VIOLET WAND',
  'VORAREPHILIA',
  'VOYEUR',
  'VOYEURWEB',
  'VOYUER',
  'VULVA',
  'WANK',
  'WETBACK',
  'WET DREAM',
  'WHITE POWER',
  'WHORE',
  'WORLDSEX',
  'WRAPPING MEN',
  'WRINKLED STARFISH',
  'XX',
  'XXX',
  'YAOI',
  'YELLOW SHOWERS',
  'YIFFY',
  'ZOOPHILIA',
];

const filteredSwearWords = swearWords.filter((word) => word.length <= familyCodeLength);

function includesSwearWord(string: string): boolean {
  for (let i = 0; i < filteredSwearWords.length; i += 1) {
    const swearWord = filteredSwearWords[i];
    if (string.includes(swearWord)) {
      return true;
    }
  }

  return false;
}

// O and 0 + L and I are all removed because they look similar
const characters = 'ABCDEFGHJKMNPQRSTUVWXYZ123456789';
const charactersLength = characters.length;

// Makes a code for a family to use that consists of A-Z and 0-9
function generateCode(): string {
  let familyCode = '';

  function getRandomInt(max: number): number {
    return Math.floor(Math.random() * max);
  }

  while (familyCode.length < familyCodeLength) {
    for (let i = 0; i < familyCodeLength; i += 1) {
      familyCode += characters.charAt(getRandomInt(charactersLength));
    }

    // If we have a completed familyCode, check if for swear words
    if (familyCode.length === familyCodeLength && includesSwearWord(familyCode) === true) {
      familyCode = '';
    }
  }

  return familyCode;
}

// Generate a verified unique code for a family to use that consists of A-Z and 0-9 (excludes I, L, O, and 0 due to how similar they look)
async function generateUniqueFamilyCode(databaseConnection: Queryable): Promise<string> {
  let uniqueFamilyCode;
  while (uniqueFamilyCode === undefined) {
    const potentialFamilyCode = generateCode();
    // Necessary to disable no-await-in-loop as we can't use Promise.all() for a while loop. We have a unknown amount of promises
    // eslint-disable-next-line no-await-in-loop
    const result = await databaseQuery<RowDataPacket[]>(
      databaseConnection,
      `SELECT 1
      FROM families f
      WHERE familyCode = ?
      LIMIT 1`,
      [
        potentialFamilyCode,
      ],
    );
      // if the result's length is zero, that means there wasn't a match for the family code and the code is unique
    if (result.length === 0) {
      uniqueFamilyCode = potentialFamilyCode;
    }
  }

  return uniqueFamilyCode;
}

/**
  *  Queries the database to create a family. If the query is successful, then returns the familyId.
  *  If a problem is encountered, creates and throws custom error
  */
async function createFamilyForUserId(databaseConnection: Queryable, userId: string): Promise<string> {
  const familyId = hash(userId);

  // check if the user is already in a family
  const isUserInFamily = await isUserIdInFamily(databaseConnection, userId);

  // validate that the user is not in a family
  if (isUserInFamily === true) {
    throw new HoundError('User is already in a family', createFamilyForUserId, ERROR_CODES.FAMILY.JOIN.IN_FAMILY_ALREADY);
  }

  // create a family code for the new family
  const familyCode = await generateUniqueFamilyCode(databaseConnection);

  const promises = [
    databaseQuery(
      databaseConnection,
      `INSERT INTO families
        (
          userId,
          familyId,
          familyCode,
          familyIsLocked,
          familyAccountCreationDate
          )
          VALUES (
            ?,
            ?,
            ?,
            0,
            CURRENT_TIMESTAMP()
            )`,
      [
        userId,
        familyId,
        familyCode,
        // none, default value
        // none, default value
      ],
    ),
    databaseQuery(
      databaseConnection,
      `INSERT INTO familyMembers
              (
                userId,
                familyId,
                familyMemberJoinDate
                )
                VALUES (
                  ?,
                  ?,
                  CURRENT_TIMESTAMP()
                  )`,
      [
        userId,
        familyId,
        // none, default value
      ],
    ),
  ];

  await Promise.all(promises);

  return familyId;
}

export { createFamilyForUserId };
