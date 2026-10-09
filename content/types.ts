// Every piece of copy on the homepage, per language. Components read it through useContent();
// images, ratings and shapes stay in the components, matched to these entries by order.
// Strings with {placeholders} are filled with fill() (no functions, so the dictionaries stay plain data).

export type Locale = 'en' | 'ar';

type Service = { title: string; description: string };
/** one service type on the homepage: three cards and a link to the full list */
export type ServiceGroup = { eyebrow: string; title: string; intro: string; cta: string; items: Service[] };
/** a section heading in the site's voice: a plain line, then a soft word and a bold one */
export type Heading = { eyebrow: string; line1: string; soft: string; bold: string; intro: string };

export type SiteContent = {
  locale: Locale;
  dir: 'ltr' | 'rtl';
  meta: { title: string; description: string; shareTitle: string; shareAlt: string; ogLocale: string };
  lang: { label: string; href: string; aria: string };
  header: { tagline: string; book: string; call: string; menu: string };
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
  services: { cleaning: ServiceGroup; maintenance: ServiceGroup };
  /** the full list at /services: each group's homepage three, then these */
  servicesPage: Heading & {
    meta: { title: string; description: string };
    cleaningMore: Service[];
    maintenanceMore: Service[];
    cta: Heading & { book: string; call: string };
  };
  about: Heading & { points: { label: string; title: string; text: string }[]; alts: [string, string, string] };
  faq: Heading & { items: { q: string; a: string }[] };
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
    /** the figures beside the form */
    stats: { value: string; label: string }[];
    contactTitle: string;
    /** under the submit button */
    reassure: string;
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
