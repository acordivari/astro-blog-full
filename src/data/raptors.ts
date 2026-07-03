// Curated reference data for North American raptors.
//
// GBIF / iNaturalist / Wikipedia give us photos, descriptions, and common names,
// but none of them expose wingspan or beginner identification cues in a structured
// form. This module fills that gap for the ~35 raptors a visitor is realistically
// likely to surface, and falls back to family-level info for anything unlisted
// (vagrants, split taxa, non–North-American species) so the UI never comes up empty.
//
// Wingspans are in centimetres [min, max], sourced from Cornell Lab / Sibley ranges.

export type SizeClass = 'small' | 'medium' | 'large' | 'very large';
export type Difficulty = 'easy' | 'moderate' | 'tricky';

export interface RaptorInfo {
  /** Present only on family fallbacks; species entries get their common name from the APIs. */
  commonName?: string;
  sizeClass: SizeClass;
  /** Wingspan range in centimetres [min, max]. */
  wingspanCm: [number, number];
  /** Short beginner-friendly field marks. */
  idCues: string[];
  /** Flight style + where/when to look. */
  behavior: string;
  /** How hard this one is to spot and identify for a newcomer. */
  difficulty: Difficulty;
  /** True when this came from a family fallback rather than a species match. */
  isFallback?: boolean;
}

// Derive a size class from a wingspan midpoint so it stays consistent with the numbers.
function classFromWingspan(min: number, max: number): SizeClass {
  const mid = (min + max) / 2;
  if (mid < 70) return 'small';
  if (mid < 120) return 'medium';
  if (mid < 185) return 'large';
  return 'very large';
}

function entry(
  wingspanCm: [number, number],
  idCues: string[],
  behavior: string,
  difficulty: Difficulty,
): RaptorInfo {
  return {
    sizeClass: classFromWingspan(wingspanCm[0], wingspanCm[1]),
    wingspanCm,
    idCues,
    behavior,
    difficulty,
  };
}

export const RAPTOR_DATA: Record<string, RaptorInfo> = {
  // ── Accipitridae: hawks, eagles, kites, harriers ──
  'Buteo jamaicensis': entry(
    [105, 141],
    ['Broad, rounded wings and a short, fanned tail', 'Rusty-red tail on adults', 'Dark bar along the leading edge of the underwing'],
    'The default roadside hawk — soars in wide circles or perches on poles and fence posts along highways. Often heard before seen (a raspy scream).',
    'easy',
  ),
  'Buteo swainsoni': entry(
    [120, 137],
    ['Long, pointed wings held in a shallow V', 'Dark flight feathers contrast with pale wing linings', 'Brown chest band ("bib")'],
    'A summer visitor of open grassland; gathers in large migrating flocks ("kettles") in fall. Watch fields freshly turned by tractors.',
    'moderate',
  ),
  'Buteo regalis': entry(
    [134, 152],
    ['Very large, pale, broad-winged', 'Rusty "leggings" form a dark V against a white belly in flight', 'Big head, gaping mouth'],
    'A bird of wide-open western plains — perches low on the ground or on lone poles. The largest of the North American Buteo hawks.',
    'moderate',
  ),
  'Buteo lagopus': entry(
    [120, 138],
    ['Dark belly patch and dark "wrists" on pale underwings', 'Feathered legs to the toes', 'Hovers on beating wings'],
    'A winter visitor from the Arctic. Frequently hovers over open fields hunting voles — unusual for a hawk this size.',
    'moderate',
  ),
  'Buteo lineatus': entry(
    [94, 111],
    ['Reddish barred underparts', 'Translucent pale crescents ("windows") near the wingtips', 'Boldly black-and-white banded tail'],
    'A woodland-edge hawk near water; very vocal in spring. Listen for a repeated "kee-yah".',
    'moderate',
  ),
  'Buteo platypterus': entry(
    [82, 92],
    ['Compact, stocky, pointed wings', 'Broad black-and-white tail bands', 'Clean pale underwings with a dark border'],
    'Famous for spectacular fall migration kettles of hundreds to thousands. Otherwise a quiet forest hawk.',
    'tricky',
  ),
  'Accipiter cooperii': entry(
    [62, 94],
    ['Long tail with a rounded, white-tipped end', 'Short rounded wings', 'Flap-flap-glide flight'],
    'The classic backyard bird-feeder hawk — ambushes songbirds and pigeons. Bigger, larger-headed cousin of the Sharp-shinned.',
    'tricky',
  ),
  'Accipiter striatus': entry(
    [42, 68],
    ['Small, with a square-tipped tail', 'Short rounded wings, long tail', 'Rapid flap-flap-glide'],
    'The smallest of our bird-hunting hawks; darts through woods and yards after small songbirds. Easily confused with Cooper’s Hawk.',
    'tricky',
  ),
  'Accipiter gentilis': entry(
    [98, 115],
    ['Bold white eyebrow stripe', 'Pale grey barred underparts', 'Powerful, heavy-chested build'],
    'A secretive, fierce hawk of deep northern and mountain forests. Uncommon and prized by birders.',
    'tricky',
  ),
  'Circus hudsonius': entry(
    [102, 118],
    ['White rump patch at the tail base', 'Owl-like flat face', 'Wings held in a V while gliding low'],
    'Quarters low over marshes and fields, tilting side to side. Males are pale grey ("grey ghost"), females brown.',
    'easy',
  ),
  'Haliaeetus leucocephalus': entry(
    [180, 230],
    ['Adults: white head and tail, huge yellow bill', 'Immatures: mottled brown and white', 'Flat, plank-like wings when soaring'],
    'Found near open water and reservoirs; often perched in tall shoreline trees. Numerous in Colorado in winter.',
    'easy',
  ),
  'Aquila chrysaetos': entry(
    [185, 220],
    ['All dark with a golden nape', 'Wings in a slight V when soaring', 'Immatures show white wing patches and a white tail base'],
    'A bird of open mountains, canyons, and foothills — soars along ridgelines on rising air. Larger and darker than immature Bald Eagles.',
    'moderate',
  ),
  'Parabuteo unicinctus': entry(
    [103, 120],
    ['Chocolate brown with chestnut shoulders', 'White base and tip to a dark tail', 'Long yellow legs'],
    'A desert-Southwest hawk that hunts cooperatively in family groups — unusual among raptors. Perches on saguaros and poles.',
    'moderate',
  ),
  'Elanus leucurus': entry(
    [88, 102],
    ['Pale grey and white with black shoulder patches', 'Long pointed wings', 'Hovers with dangling legs'],
    'Hovers ("kites") over grassland and roadsides hunting rodents, then drops straight down. Bright white below.',
    'moderate',
  ),
  'Ictinia mississippiensis': entry(
    [84, 94],
    ['Slim grey falcon-like shape', 'Pale grey head, darker wings and tail', 'Buoyant, graceful flight'],
    'Catches dragonflies and insects on the wing over southern towns and woods. Often in loose groups.',
    'tricky',
  ),
  'Elanoides forficatus': entry(
    [112, 136],
    ['Deeply forked black tail', 'Sharp black-and-white pattern', 'Effortless, swooping flight'],
    'Unmistakable — a graceful black-and-white kite of southeastern swamps that snatches prey without landing.',
    'easy',
  ),

  // ── Pandionidae: osprey ──
  'Pandion haliaetus': entry(
    [150, 180],
    ['White below with a dark eye-stripe', 'Long wings kinked ("M-shape") in flight', 'Dark "wrist" patches'],
    'The fish hawk — always near water, hovers then plunges feet-first for fish. Nests on platforms and poles.',
    'easy',
  ),

  // ── Cathartidae: New World vultures ──
  'Cathartes aura': entry(
    [160, 183],
    ['Long wings held in a strong V ("dihedral")', 'Teeters and rocks while soaring', 'Silvery flight feathers, small red head'],
    'The rocking, wobbly soaring silhouette is the giveaway — rarely flaps. Rides thermals for hours looking for carrion.',
    'easy',
  ),
  'Coragyps atratus': entry(
    [130, 170],
    ['Short square tail, black overall', 'White patches only near the wingtips', 'Quick, choppy flaps then a glide'],
    'Flatter-winged and stubbier than the Turkey Vulture; flaps more. Gregarious around carcasses and landfills.',
    'easy',
  ),
  'Gymnogyps californianus': entry(
    [249, 300],
    ['Enormous — nearly 3 m wingspan', 'Triangular white patches under the wings', 'Numbered wing tags on most birds'],
    'One of the rarest birds on Earth; a conservation success story in a few western canyons. Flat, steady soaring on huge planks.',
    'tricky',
  ),

  // ── Falconidae: falcons and caracaras ──
  'Falco sparverius': entry(
    [51, 61],
    ['Robin-sized, colorful', 'Two black "sideburn" stripes on the face', 'Rusty back and tail'],
    'Our smallest, most common falcon. Perches on wires and hovers over roadsides; bobs its tail. Often the first raptor beginners learn.',
    'easy',
  ),
  'Falco columbarius': entry(
    [53, 68],
    ['Small, dark, and stocky', 'Faint or no facial stripe', 'Fast, powerful, direct flight'],
    'A pocket rocket that chases small birds in fast level flight. Perches conspicuously on bare treetops.',
    'tricky',
  ),
  'Falco peregrinus': entry(
    [100, 110],
    ['Slate-grey back, heavy black "helmet"', 'Long pointed wings, broad chest', 'Barred underparts'],
    'The fastest animal alive — stoops on prey at over 300 km/h. Nests on cliffs and skyscraper ledges; hunts pigeons over cities.',
    'moderate',
  ),
  'Falco mexicanus': entry(
    [90, 113],
    ['Sandy brown above, pale below', 'Dark "armpits" (axillaries) in flight', 'Narrow moustache stripe'],
    'A falcon of dry open western country; flies fast and low over the ground after birds and ground squirrels.',
    'tricky',
  ),
  'Falco rusticolus': entry(
    [110, 160],
    ['Largest falcon — bulky and broad-winged', 'Colors range from white to grey to near-black', 'Slower, more powerful wingbeats'],
    'An Arctic falcon; a rare and coveted winter visitor to the northern states. Hulking compared with a Peregrine.',
    'tricky',
  ),
  'Caracara plancus': entry(
    [120, 132],
    ['Black cap and body, bare orange face', 'White neck and tail base', 'Long yellow legs, flat-winged flight'],
    'A ground-loving falcon relative of the southern borderlands — walks and struts, often at roadkill with vultures.',
    'moderate',
  ),

  // ── Strigidae: typical owls ──
  'Bubo virginianus': entry(
    [101, 145],
    ['Large, with prominent ear tufts ("horns")', 'Rusty facial disk, white throat', 'Yellow eyes, barred body'],
    'The widespread nighttime hooter ("hoo-hoo hooo"). Roosts in trees by day; the most common large owl across the continent.',
    'moderate',
  ),
  'Bubo scandiacus': entry(
    [125, 150],
    ['White, some with dark barring', 'Round head, no ear tufts', 'Yellow eyes'],
    'An Arctic owl that appears south in winter, often on the ground in open fields, dunes, or airports. Active by day.',
    'moderate',
  ),
  'Strix varia': entry(
    [96, 125],
    ['Round head, no ear tufts', 'Dark eyes (unusual for an owl)', 'Vertical brown streaks on the belly'],
    'Its "who-cooks-for-you" call carries through wet woodlands. Increasingly found in suburbs; sometimes active at dusk.',
    'moderate',
  ),
  'Strix nebulosa': entry(
    [137, 152],
    ['Huge round facial disk with fine grey rings', 'Small yellow eyes, white "bow-tie" throat', 'No ear tufts'],
    'A ghostly giant of northern bogs and forests — mostly fluff over a smaller body. Hunts voles by sound, even under snow.',
    'tricky',
  ),
  'Strix occidentalis': entry(
    [107, 114],
    ['Dark eyes, round head', 'Brown with white spots (not streaks)', 'No ear tufts'],
    'A threatened owl of old-growth western forests. Tame but hard to find; sensitive to habitat loss.',
    'tricky',
  ),
  'Asio otus': entry(
    [90, 100],
    ['Long close-set ear tufts', 'Orange facial disk', 'Slim, tall roosting posture'],
    'Roosts communally in dense conifers by day and is easily overlooked. Hunts open fields at night.',
    'tricky',
  ),
  'Asio flammeus': entry(
    [85, 110],
    ['Pale buffy, black wrist patches on the underwing', 'Very short ear tufts', 'Moth-like, floppy flight'],
    'One of the few owls you can watch by daylight — courses low over grasslands and marshes at dusk.',
    'moderate',
  ),
  'Aegolius acadicus': entry(
    [42, 48],
    ['Tiny, big-headed', 'Rusty streaks below, white facial disk', 'Yellow eyes, no ear tufts'],
    'A sparrow-sized forest owl, strictly nocturnal and hard to find. Its monotonous "toot-toot-toot" song rings through spring nights.',
    'tricky',
  ),
  'Megascops asio': entry(
    [46, 61],
    ['Small with ear tufts', 'Grey or rusty ("red") color forms', 'Yellow eyes'],
    'A common but well-hidden small owl of eastern woods and towns. Gives a whinnying, descending trill.',
    'tricky',
  ),
  'Megascops kennicottii': entry(
    [55, 61],
    ['Small with ear tufts', 'Mostly grey-brown', 'Yellow eyes, dark bill'],
    'The western counterpart of the Eastern Screech-Owl; gives a bouncing-ball series of hoots from wooded canyons and suburbs.',
    'tricky',
  ),
  'Athene cunicularia': entry(
    [50, 61],
    ['Long bare legs, short tail', 'Sandy brown with white spotting', 'Bright yellow eyes, flat head'],
    'A small owl that lives in burrows in open ground and is active by day — often seen standing at the burrow mouth on prairies and empty lots.',
    'easy',
  ),
  'Glaucidium gnoma': entry(
    [38, 43],
    ['Tiny, long-tailed for an owl', 'Two black "false eyes" on the nape', 'Fine streaks below'],
    'A fierce little day-active owl of western mountain forests. Small birds mob it noisily — follow the commotion to find one.',
    'tricky',
  ),

  // ── Tytonidae: barn owls ──
  'Tyto alba': entry(
    [100, 125],
    ['White heart-shaped face', 'Golden-buff back, ghostly white underparts', 'Dark eyes'],
    'Glows pale in headlights along rural roads at night; gives an eerie raspy shriek, not a hoot. Nests in barns and cavities.',
    'moderate',
  ),
};

// GBIF sometimes returns older or recently-split scientific names. Map them onto the
// entries above so those observations still get species-level info.
const ALIASES: Record<string, string> = {
  'Circus cyaneus': 'Circus hudsonius',       // Northern Harrier split
  'Astur cooperii': 'Accipiter cooperii',      // Cooper's Hawk genus move (AOS 2023)
  'Astur atricapillus': 'Accipiter gentilis',  // American Goshawk split
  'Accipiter atricapillus': 'Accipiter gentilis',
  'Caracara cheriway': 'Caracara plancus',     // Crested Caracara lump
  'Nyctea scandiaca': 'Bubo scandiacus',       // Snowy Owl genus move
  'Glaucidium californicum': 'Glaucidium gnoma',
};

// Family-level fallbacks so unlisted or non–North-American species still resolve
// to sensible size and generic guidance.
const FAMILY_FALLBACKS: Record<string, RaptorInfo> = {
  Accipitridae: {
    commonName: 'Hawk / eagle / kite',
    sizeClass: 'large',
    wingspanCm: [80, 220],
    idCues: ['Broad wings and a fanned tail', 'Soars in circles on rising warm air', 'Hooked bill and strong talons'],
    behavior: 'A member of the largest raptor family — hawks, eagles, kites, and harriers. Most soar over open country or perch to scan for prey.',
    difficulty: 'moderate',
    isFallback: true,
  },
  Pandionidae: {
    commonName: 'Osprey',
    sizeClass: 'large',
    wingspanCm: [150, 180],
    idCues: ['White below with a dark eye-line', 'Long wings kinked in an M-shape', 'Always near water'],
    behavior: 'The fish-eating hawk family — hovers over water and dives feet-first for fish.',
    difficulty: 'easy',
    isFallback: true,
  },
  Cathartidae: {
    commonName: 'New World vulture',
    sizeClass: 'very large',
    wingspanCm: [130, 300],
    idCues: ['Very broad wings, often held in a V', 'Bare (featherless) head', 'Soars for long periods without flapping'],
    behavior: 'New World vultures — scavengers that ride thermals for hours searching for carrion. Grouped with raptors in most classifications.',
    difficulty: 'easy',
    isFallback: true,
  },
  Falconidae: {
    commonName: 'Falcon / caracara',
    sizeClass: 'medium',
    wingspanCm: [50, 130],
    idCues: ['Long, pointed, swept-back wings', 'Fast, powerful wingbeats', 'Often a dark "moustache" on the face'],
    behavior: 'Falcons and caracaras — built for speed, they chase prey in fast, direct flight rather than long soaring.',
    difficulty: 'moderate',
    isFallback: true,
  },
  Strigidae: {
    commonName: 'Typical owl',
    sizeClass: 'medium',
    wingspanCm: [40, 150],
    idCues: ['Big forward-facing eyes in a round facial disk', 'Silent, soft-edged flight', 'Some have ear tufts'],
    behavior: 'Typical owls — mostly nocturnal hunters with exceptional hearing and near-silent flight. Best found at dawn, dusk, or by their calls.',
    difficulty: 'tricky',
    isFallback: true,
  },
  Tytonidae: {
    commonName: 'Barn owl',
    sizeClass: 'medium',
    wingspanCm: [100, 125],
    idCues: ['Heart-shaped pale face', 'Ghostly light underparts', 'Dark eyes'],
    behavior: 'Barn owls — pale, nocturnal owls that shriek rather than hoot and nest in cavities and buildings.',
    difficulty: 'moderate',
    isFallback: true,
  },
};

/**
 * Look up curated info for a raptor. Tries the exact scientific name, then known
 * aliases, then a family-level fallback. Returns null only when the family is also
 * unknown (so callers can hide the enrichment gracefully).
 */
export function getRaptorInfo(
  scientificName: string | undefined,
  family: string | undefined,
): RaptorInfo | null {
  if (scientificName) {
    const direct = RAPTOR_DATA[scientificName];
    if (direct) return direct;

    const aliased = ALIASES[scientificName];
    if (aliased && RAPTOR_DATA[aliased]) return RAPTOR_DATA[aliased];

    // Some GBIF records carry a genus-only or trinomial name; try the first two tokens.
    const parts = scientificName.trim().split(/\s+/);
    if (parts.length > 2) {
      const binomial = `${parts[0]} ${parts[1]}`;
      if (RAPTOR_DATA[binomial]) return RAPTOR_DATA[binomial];
      if (ALIASES[binomial] && RAPTOR_DATA[ALIASES[binomial]]) return RAPTOR_DATA[ALIASES[binomial]];
    }
  }

  if (family && FAMILY_FALLBACKS[family]) return FAMILY_FALLBACKS[family];

  return null;
}

/** A few familiar reference points for the wingspan visual, in centimetres. */
export const WINGSPAN_REFERENCES = [
  { label: 'American Robin', cm: 40 },
  { label: 'American Crow', cm: 95 },
  { label: 'Adult human, arms out', cm: 180 },
];

/** Upper bound of the wingspan visual axis (California Condor tops out near 300 cm). */
export const WINGSPAN_AXIS_MAX_CM = 310;
