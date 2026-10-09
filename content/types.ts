// Every piece of copy on the homepage, per language. Components read it through useContent();
// images, ratings and shapes stay in the components, matched to these entries by order.
// Strings with {placeholders} are filled with fill() (no functions, so the dictionaries stay plain data).

export type Locale = 'en' | 'ar';

type Pair = { title: string; text: string };

export type SiteContent = {
  locale: Locale;
  dir: 'ltr' | 'rtl';
  meta: { title: string; description: string; shareTitle: string; shareAlt: string; ogLocale: string };
  lang: { label: string; href: string; aria: string };
  header: { tagline: string; city: string; book: string; call: string; menu: string };
  nav: { services: string; results: string; howItWorks: string; reviews: string; contact: string };
  hero: {
    eyebrow: string;
    line1: string;
    to: string;
    word: string;
    description: string;
    ratingAria: string;
    homes: string;
    sameDay: string;
    promises: [string, string, string, string];
  };
  services: {
    eyebrow: string;
    title: string;
    intro: string;
    book: string;
    prev: string;
    next: string;
    goTo: string;
    items: { title: string; category: string; description: string; badge: string; features: [string, string, string] }[];
  };
  beforeAfter: {
    eyebrow: string;
    line1: string;
    soft: string;
    bold: string;
    intro: string;
    roomsLabel: string;
    after: string;
    before: string;
    drag: string;
    sliderAria: string;
    beforeAlt: string;
    afterAlt: string;
    rooms: { label: string; place: string; time: string; team: string; work: string }[];
  };
  howItWorks: {
    eyebrow: string;
    line1: string;
    soft: string;
    bold: string;
    intro: string;
    steps: { title: string; text: string; points: [string, string] }[];
  };
  testimonials: {
    eyebrow: string;
    outOf: string;
    from: string;
    quoteMark: string;
    showReview: string;
    prev: string;
    next: string;
    starsAria: string;
    reviews: { name: string; place: string; service: string; quote: string }[];
    snippets: [string, string][];
  };
  booking: {
    eyebrow: string;
    line1: string;
    soft: string;
    bold: string;
    intro: string;
    props: [Pair, Pair];
    address: string;
    formTitle: string;
    formIntro: string;
    name: string;
    namePlaceholder: string;
    phone: string;
    district: string;
    districts: string[];
    service: string;
    notes: string;
    notesPlaceholder: string;
    submit: string;
    doneTitle: string;
    /** "Thank you, {name}. ... at {phone} ..." split around the name and the phone */
    done: [string, string, string];
    again: string;
  };
  footer: { servicesTitle: string; hqTitle: string; address: string; hotline: string; licensed: string; backToTop: string };
};

/** fill('Go to slide {n}', { n: 2 }) */
export const fill = (s: string, vars: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''));
