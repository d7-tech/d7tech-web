'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import ProjectCard from '@/components/projects/ProjectCard';
import { projects, Project } from '@/lib/data/projects';

type FilterCategory = 'all' | Project['category'];

export default function ProjectsClient() {
  const t = useTranslations('ProjectsPage');
  const [active, setActive] = useState<FilterCategory>('all');

  const filters: { label: string; value: FilterCategory }[] = [
    { label: t('filterAll'), value: 'all' },
    { label: t('filterAutonomous'), value: 'autonomous-systems' },
    { label: t('filterSensing'), value: 'sensing' },
    { label: t('filterAiMl'), value: 'ai-ml' },
  ];

  const filtered = active === 'all' ? projects : projects.filter((p) => p.category === active);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 pb-20">
      <h1 id="projects-heading">{t('title')}</h1>
      <p className="mt-3 text-lg text-ink-soft max-w-2xl">{t('description')}</p>

      <div className="mt-10 mb-10 flex gap-6 overflow-x-auto scrollbar-none border-b border-line" role="tablist" aria-label={t('title')}>
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setActive(f.value)}
            role="tab"
            aria-selected={active === f.value}
            className={`flex-shrink-0 -mb-px pb-3 text-[15px] border-b-2 transition-colors ${
              active === f.value
                ? 'border-brand text-ink font-medium'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="py-16 text-ink-muted">{t('empty').replace(/^\/\/\s*/, '')}</p>
      ) : (
        <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((project, i) => (
            <ProjectCard key={project.id} project={project} priority={i < 3} />
          ))}
        </div>
      )}
    </div>
  );
}
