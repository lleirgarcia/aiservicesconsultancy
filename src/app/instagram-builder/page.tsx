import { InstagramPostBuilder } from '@/components/InstagramPostBuilder';

export const metadata = {
  title: 'Instagram Post Builder',
  description: 'Create branded Instagram post templates with drag-and-drop',
};

export default function InstagramBuilderPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <InstagramPostBuilder />
    </div>
  );
}
