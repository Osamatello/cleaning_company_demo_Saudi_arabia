import ServicesPage from '@/components/ServicesPage';
import { en } from '@/content/en';
import { servicesMetadataFor } from '@/content/metadata';

export const metadata = servicesMetadataFor(en);

export default function Services() {
  return <ServicesPage locale="en" />;
}
