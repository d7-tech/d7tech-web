'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import ProjectTile from '@/components/projects/ProjectTile';
import { projects, Project } from '@/lib/data/projects';

type FilterCategory = 'all' | Project['category'];

// Current work first.
const ORDER = ['advisor', 'indoor-positioning', 'micro-climate', 'multistatic', 'wearable-sensors', 'warehouse-automation', 'underwater-gliders'];
const ordered = [...projects].sort((a, b) => ORDER.indexOf(a.slug) - ORDER.indexOf(b.slug));

export default function ProjectsClient() {
  const t = useTranslations('ProjectsPage');
  const [active, setActive] = useState<FilterCategory>('all');

  const filters: { label: string; value: FilterCategory }[] = [
    { label: t('filterAll'), value: 'all' },
    { label: t('filterAutonomous'), value: 'autonomous-systems' },
    { label: t('filterSensing'), value: 'sensing' },
    { label: t('filterAiMl'), value: 'ai-ml' },
  ];

  const filtered = active === 'all' ? ordered : ordered.filter((p) => p.category === active);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-24 pb-24">
      <h1 id="projects-heading">{t('title')}</h1>
      <p className="mt-4 text-xl text-ink-muted max-w-2xl">{t('description')}</p>

      <div className="mt-10 mb-10 flex gap-6 overflow-x-auto scrollbar-none border-b border-line" role="tablist" aria-label={t('title')}>
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setActive(f.value)}
            role="tab"
            aria-selected={active === f.value}
            className={`flex-shrink-0 -mb-px pb-3 font-mono text-xs uppercase tracking-wider border-b-2 transition-colors ${
              active === f.value
                ? 'border-brand-light text-ink'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="py-16 text-ink-muted">{t('empty')}</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 auto-rows-[300px]">
          {filtered.map((project, i) => (
            <ProjectTile key={project.id} project={project} priority={i < 3} />
          ))}
        </div>
      )}
    </div>
  );
}
