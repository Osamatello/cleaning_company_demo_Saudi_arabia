import ServicesPage from '@/components/ServicesPage';
import { ar } from '@/content/ar';
import { servicesMetadataFor } from '@/content/metadata';

export const metadata = servicesMetadataFor(ar);

export default function ArabicServices() {
  return <ServicesPage locale="ar" />;
}
